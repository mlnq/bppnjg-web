export type Przystanek = {
  czas: string;          // "09:30"
  km: number;            // skumulowany dystans od startu etapu
  miejsce: string;
  lat?: number;
  lng?: number;
};

export type Dzien = {
  nr: number;
  od: string;
  do: string;
  dystans: number;       // km całego etapu
  przystanki: Przystanek[];
};

export type Fix = { lat: number; lng: number; acc: number; t: number };

const toMin = (s: string) => +s.slice(0, 2) * 60 + +s.slice(3, 5);

// ——— Źródło "harmonogram": interpolacja dystansu po czasie zegarowym ———
export function pozycjaZHarmonogramu(dzien: Dzien, now = new Date()): number {
  const mins = now.getHours() * 60 + now.getMinutes();
  const pts = dzien.przystanki.map((p) => ({ m: toMin(p.czas), km: p.km }));
  if (pts.length === 0) return 0;
  if (mins <= pts[0].m) return 0;
  if (mins >= pts[pts.length - 1].m) return dzien.dystans;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (mins >= a.m && mins <= b.m) {
      const t = b.m === a.m ? 0 : (mins - a.m) / (b.m - a.m);
      return a.km + t * (b.km - a.km);
    }
  }
  return dzien.dystans;
}

// ——— Źródło "GPS": watchPosition; błąd/odmowa -> null (fallback) ———
export function startWatch(onFix: (f: Fix | null) => void): () => void {
  if (!('geolocation' in navigator)) {
    onFix(null);
    return () => {};
  }
  const id = navigator.geolocation.watchPosition(
    (pos) =>
      onFix({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        acc: pos.coords.accuracy,
        t: pos.timestamp,
      }),
    () => onFix(null),
    { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 }
  );
  return () => navigator.geolocation.clearWatch(id);
}

// ——— Rzut fixu GPS na polilinię trasy -> skumulowany dystans (km) ———
// Wymaga przystanków z lat/lng. Gdy ich brak, zwraca null (zostaje harmonogram).
export function dystansNaTrasie(dzien: Dzien, fix: Fix): number | null {
  const pts = dzien.przystanki.filter((p) => p.lat != null && p.lng != null);
  if (pts.length < 2) return null;

  let best = { d: Infinity, km: 0 };
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const proj = rzutNaOdcinek(fix, a as Required<Przystanek>, b as Required<Przystanek>);
    if (proj.dist < best.d) {
      best = { d: proj.dist, km: a.km + proj.t * (b.km - a.km) };
    }
  }
  return best.km;
}

// Rzut punktu na odcinek w przybliżeniu płaskim (równoważnik metryczny lat/lng).
function rzutNaOdcinek(p: Fix, a: Required<Przystanek>, b: Required<Przystanek>) {
  const k = Math.cos((a.lat * Math.PI) / 180); // korekta długości geo.
  const ax = a.lng * k, ay = a.lat;
  const bx = b.lng * k, by = b.lat;
  const px = p.lng * k, py = p.lat;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy || 1e-9;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  const dist = Math.hypot(px - cx, py - cy) * 111_320; // stopnie -> metry
  return { t, dist };
}
