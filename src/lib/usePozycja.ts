import { useEffect, useRef, useState } from 'react';
import {
  type Dzien,
  type Fix,
  startWatch,
  pozycjaZHarmonogramu,
  dystansNaTrasie,
} from './position';

export type TrybPozycji = 'auto' | 'gps' | 'plan';
export type ZrodloPozycji = 'gps' | 'plan';

export type StanPozycji = {
  km: number;            // dystans przebyty na etapie
  doCelu: number;        // dystans pozostały
  doNastepnego: number;  // dystans do kolejnego przystanku
  pct: number;           // 0..100
  zrodlo: ZrodloPozycji; // co faktycznie liczy pozycję teraz
};

const SWIEZOSC_MS = 30_000; // fix starszy niż 30 s = nieaktualny
const DOKLADNOSC_M = 50;    // gorszy niż 50 m = nie ufamy GPS

export function usePozycja(dzien: Dzien, tryb: TrybPozycji = 'auto'): StanPozycji {
  const [fix, setFix] = useState<Fix | null>(null);
  const [, setTick] = useState(0); // wymusza przeliczenie harmonogramu co minutę
  const stopRef = useRef<() => void>(() => {});

  // GPS tylko gdy tryb pozwala i karta jest widoczna (oszczędza baterię,
  // a w tle przeglądarka i tak go dławi — wtedy świadomie spadamy na plan).
  useEffect(() => {
    if (tryb === 'plan') {
      setFix(null);
      return;
    }
    const sync = () => {
      stopRef.current();
      if (document.visibilityState === 'visible') {
        stopRef.current = startWatch(setFix);
      } else {
        setFix(null);
        stopRef.current = () => {};
      }
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => {
      stopRef.current();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [dzien.nr, tryb]);

  // odświeżanie harmonogramu co minutę
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(i);
  }, []);

  const swiezy = !!fix && Date.now() - fix.t < SWIEZOSC_MS && fix.acc < DOKLADNOSC_M;
  const kmGps = tryb !== 'plan' && swiezy ? dystansNaTrasie(dzien, fix!) : null;

  const km = kmGps ?? pozycjaZHarmonogramu(dzien);
  const zrodlo: ZrodloPozycji = kmGps != null ? 'gps' : 'plan';

  const clamped = Math.max(0, Math.min(dzien.dystans, km));
  // Po osiągnięciu przystanku wybieramy już kolejny odcinek. Dzięki temu
  // podczas postoju wyświetlamy pełną długość trasy do następnego punktu.
  const nextStop = dzien.przystanki.find((stop) => stop.km > clamped + 1e-6);
  return {
    km: clamped,
    doCelu: dzien.dystans - clamped,
    doNastepnego: nextStop ? nextStop.km - clamped : 0,
    pct: dzien.dystans > 0 ? Math.round((clamped / dzien.dystans) * 100) : 0,
    zrodlo,
  };
}
