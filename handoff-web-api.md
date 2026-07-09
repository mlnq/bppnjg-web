# Pielgrzym Web — uzupełnienie handoffu: kontrakt API backendu

Dokument uzupełnia sekcję §5 handoffu webowego.  
Źródłem prawdy są pliki serwisów aplikacji mobilnej (`features/@app-core/services/`).

---

## Baza URL

```
VITE_API_BASE_URL=https://...   # env var dla web app
```

Rok pielgrzymki: `2025` (stała — na razie hardkodowana po stronie mobilnej jako `PILGRIMAGE_YEAR`).

---

## Endpointy

### 1. Bootstrap (najważniejszy)

```
GET /api/pilgrimages/2025/bootstrap
```

Zwraca aktualną pielgrzymkę + aktywny dzień. Backend sam wykrywa bieżący dzień po dacie.  
Idealne do inicjalizacji start screenu.

**Odpowiedź:**

```ts
type BootstrapResponse = {
  pilgrimage: ApiPilgrimage | null;
};
```

---

### 2. Pełna pielgrzymka

```
GET /api/pilgrimages/2025
```

Wszystkie dni naraz. Ciężkie — używaj tylko przy pełnym prefetch.

---

### 3. Pojedynczy dzień

```
GET /api/pilgrimages/2025/days/:dayNumber
```

`dayNumber` — liczba całkowita 1–14.

**Odpowiedź:** `ApiPilgrimageDay` (patrz typy niżej).

---

### 4. Stan trasy — serwer liczy pozycję

```
POST /api/pilgrimages/2025/days/:dayId/route-state
```

**Body:**
```ts
type RouteStateRequest = {
  pilgrimageId: string;
  dayId: string;
  latitude: number;
  longitude: number;
  timestamp: string; // ISO 8601
};
```

**Odpowiedź:**
```ts
type CurrentRouteStateDto = {
  source: 'gps' | 'time-estimated';
  currentTownId: string;
  matchedScheduleItemId: string | null;
  traveledDistanceKm: number;
  remainingDistanceKm: number;
  statusLabel: string;
  description: string;
  computedAt: string;
};
```

---

### 5. Stan trasy — fallback bez GPS

```
GET /api/pilgrimages/2025/days/:dayNumber/route-state
```

Ten sam `CurrentRouteStateDto` — backend liczy pozycję z harmonogramu po czasie zegarowym.  
Używaj gdy GPS niedostępny i nie chcesz liczyć lokalnie przez `pozycjaZHarmonogramu`.

---

### 6. Wieści

```
GET /api/news?limit=50&page=1
```

**Odpowiedź:**
```ts
type NewsResponse = {
  items?: BackendNewsItem[];
};

type BackendNewsItem = {
  id: string;
  title: string;
  summary: string;
  content?: string;
  category: string; // mapowane na PilgrimageNewsCategory
  publishedAt: string;
  isPinned?: boolean;
};
```

Mapowanie kategorii:

| backend `category` | frontend `PilgrimageNewsCategory` |
|--------------------|-----------------------------------|
| `announcement`     | `announcement`                    |
| `logistics`        | `logistics`                       |
| `spiritual`        | `spiritual`                       |
| `weather`          | `weather`                         |
| (inne)             | `announcement`                    |

---

### 7. Komentarze kwatermistrza

```
GET /api/quartermaster-comments
```

**Odpowiedź:**
```ts
type QuartermasterResponse = {
  items?: QuartermasterComment[];
};

type QuartermasterComment = {
  id: string;
  code?: string;
  dayId?: string;
  dayCode?: string;
  dayNumber?: number;
  title: string;
  content: string;
  publishedAt: string;
};
```

---

### 8. Rejestracja push token

```
POST /api/push/register
```

**Body:**
```ts
{
  token: string;     // Expo push token lub web push subscription
  platform: string;  // 'ios' | 'android' | 'web'
  projectId?: string;
}
```

Dla weba platform = `'web'`, token = stringified `PushSubscription`.

---

## Typy raw z backendu (przed transformacją)

```ts
type ApiStop = {
  id: string;
  orderIndex: number;
  name: string | null;
  townName: string | null;
  time: string;                          // "09:30"
  type: 'info' | 'night' | 'start';
  distanceToNextKm: number;
  durationMin?: number | null;
  latitude: number | null;
  longitude: number | null;
  description?: string | null;
  badge?: string | null;
};

type ApiPilgrimageDay = {
  id: string;
  dayNumber: number;                     // 1–14
  title: string;
  date: string;                          // "2025-07-30"
  route: {
    startStopId: string;
    endStopId: string;
    totalDistanceKm: number;
    scheduledStartTime: string;          // "06:00"
    plannedArrivalTime: string;          // "15:30"
  };
  stops: ApiStop[];
  reflection?: { title: string };
  conference?: {
    id: number;
    date: string;
    author: string;
    title: string;
    content: string;
  };
  weather?: {
    temperatureC: number;
    icon: 'sunny' | 'cloudy' | 'rain' | 'storm' | 'partlyCloudy';
  };
  news: NewsItem[];
};

type ApiPilgrimage = {
  id: string;
  name: string;
  startDate: string;
  totalDays: number;
  totalDistanceKm: number;
  overall: {
    traveledDistanceKm: number;
    remainingDistanceKm: number;
    totalDistanceKm: number;
    progressPercent: number;
    completedDayCount: number;
    activeDayNumber: number;
  };
  days: ApiPilgrimageDay[];
};
```

---

## Mapowanie ApiStop → Przystanek (dla usePozycja)

Prototyp używa `Przystanek.km` jako **skumulowanego dystansu od startu**.  
Backend zwraca `stop.distanceToNextKm` — odległość do **następnego** przystanku.

Przeliczenie (wykonać raz przy transformacji dnia):

```ts
function buildKmCumulative(stops: ApiStop[]): number[] {
  const km: number[] = [0];
  for (let i = 0; i < stops.length - 1; i++) {
    km.push(km[i] + (stops[i].distanceToNextKm ?? 0));
  }
  return km;
}

// Wynik: km[i] to skumulowany dystans do stops[i] od startu
```

Użycie w `Przystanek`:
```ts
const kmCumulative = buildKmCumulative(day.stops);

const przystanki = day.stops.map((stop, i) => ({
  czas: stop.time,
  km: kmCumulative[i],
  miejsce: stop.townName ?? stop.name ?? '',
  lat: stop.latitude ?? undefined,
  lng: stop.longitude ?? undefined,
}));
```

---

## Daty pielgrzymki

| Zmienna | Wartość |
|---------|---------|
| Start   | 30 lipca 2025 |
| Koniec  | 12 sierpnia 2025 |
| Dni     | 14 (dayNumber 1–14) |

Logika wyboru bieżącego dnia (z mobilki):
- Przed startem → dzień 1
- Po zakończeniu → dzień 14
- W trakcie → `floor((dzisiaj - startDate) / 86400000) + 1`

---

## Strategia cache dla PWA

| Zasób | Strategia |
|-------|-----------|
| `/api/pilgrimages/2025/bootstrap` | stale-while-revalidate, TTL 5 min |
| `/api/pilgrimages/2025/days/:n` | cache-first po pierwszym pobraniu |
| `/api/news` | stale-while-revalidate, TTL 2 min |
| `/api/quartermaster-comments` | stale-while-revalidate, TTL 2 min |
| `/api/.../route-state` GET | network-first (bez cache offline) |

---

## Skrót dla api.ts

```ts
const BASE = import.meta.env.VITE_API_BASE_URL;
const YEAR = '2025';

const fetchJson = <T>(path: string, init?: RequestInit) =>
  fetch(`${BASE}${path}`, init).then<T>((r) => {
    if (!r.ok) throw new Error(`API ${r.status}: ${path}`);
    return r.json();
  });

export const api = {
  bootstrap: () =>
    fetchJson<BootstrapResponse>(`/api/pilgrimages/${YEAR}/bootstrap`),

  getDay: (dayNumber: number) =>
    fetchJson<ApiPilgrimageDay>(`/api/pilgrimages/${YEAR}/days/${dayNumber}`),

  getNews: () =>
    fetchJson<NewsResponse>('/api/news?limit=50&page=1'),

  getQuartermaster: () =>
    fetchJson<QuartermasterResponse>('/api/quartermaster-comments'),

  postRouteState: (body: RouteStateRequest) =>
    fetchJson<CurrentRouteStateDto>(
      `/api/pilgrimages/${YEAR}/days/${body.dayId}/route-state`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    ),

  getRouteStateFallback: (dayNumber: number) =>
    fetchJson<CurrentRouteStateDto>(
      `/api/pilgrimages/${YEAR}/days/${dayNumber}/route-state`
    ),
};
```