import { createContext, useContext, useEffect, useState } from 'react';
import type { ApiPilgrimage, ApiPilgrimageDay } from '../data/types';
import { api } from '../data/api';
import { useLocalStorage } from '../lib/useLocalStorage';

export type Ustawienia = {
  type: 'spokoj' | 'pielgrzym' | 'ostry';
  read: 'sans' | 'serif';
  accent: 'subtelny' | 'wyrazisty';
  readScale: number;
  tryb: 'auto' | 'gps' | 'plan';
  devDay: number | null;
};

export const DOMYSLNE: Ustawienia = {
  type: 'spokoj', read: 'sans', accent: 'subtelny', readScale: 1, tryb: 'auto',
  devDay: null,
};

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; pilgrimage: ApiPilgrimage };

export type CtxState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; pilgrimage: ApiPilgrimage; day: ApiPilgrimageDay };

type CtxValue = {
  state: CtxState;
  settings: Ustawienia;
  setSettings: (s: Ustawienia) => void;
};

const Ctx = createContext<CtxValue | null>(null);

export function PilgrimageProvider({ children }: { children: React.ReactNode }) {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [settings, setSettings] = useLocalStorage<Ustawienia>('pg.ustawienia', DOMYSLNE);

  useEffect(() => {
    api.bootstrap()
      .then((res) => {
        if (!res.pilgrimage) { setLoadState({ status: 'error', message: 'Brak danych pielgrzymki.' }); return; }
        setLoadState({ status: 'ok', pilgrimage: res.pilgrimage });
      })
      .catch((e: unknown) => setLoadState({ status: 'error', message: String(e) }));
  }, []);

  let state: CtxValue['state'];
  if (loadState.status !== 'ok') {
    state = loadState;
  } else {
    const day = selectCurrentDay(loadState.pilgrimage, settings.devDay);
    if (!day) {
      state = { status: 'error', message: 'Brak aktywnego dnia.' };
    } else {
      state = { status: 'ok', pilgrimage: loadState.pilgrimage, day };
    }
  }

  return <Ctx.Provider value={{ state, settings, setSettings }}>{children}</Ctx.Provider>;
}

export function usePilgrimage() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePilgrimage must be inside PilgrimageProvider');
  return ctx;
}

export function selectWindowState(p: ApiPilgrimage, devDay?: number | null): 'before' | 'active' | 'after' {
  if (devDay !== null && devDay !== undefined) {
    if (devDay < 1) return 'before';
    if (devDay > p.totalDays) return 'after';
    return 'active';
  }
  const YEAR = new Date().getFullYear();
  const start = new Date(YEAR, 6, 30, 12);
  const end = new Date(YEAR, 7, 12, 12);
  const now = new Date(); now.setHours(12, 0, 0, 0);
  if (now < start) return 'before';
  if (now > end) return 'after';
  return 'active';
}

export function getDaysUntilStart(): number {
  const YEAR = new Date().getFullYear();
  const start = new Date(YEAR, 6, 30, 12);
  const now = new Date(); now.setHours(12, 0, 0, 0);
  return Math.max(0, Math.ceil((start.getTime() - now.getTime()) / 86_400_000));
}

export function selectCurrentDay(p: ApiPilgrimage, devDay?: number | null): ApiPilgrimageDay | null {
  if (devDay !== null && devDay !== undefined) {
    const clamped = Math.max(1, Math.min(p.totalDays, devDay));
    return p.days.find((d) => d.dayNumber === clamped) ?? p.days[0] ?? null;
  }

  const YEAR = new Date().getFullYear();
  const start = new Date(YEAR, 6, 30, 12);
  const end = new Date(YEAR, 7, 12, 12);
  const now = new Date(); now.setHours(12, 0, 0, 0);

  let nr: number;
  if (now < start) nr = 1;
  else if (now > end) nr = p.totalDays;
  else nr = Math.floor((now.getTime() - start.getTime()) / 86_400_000) + 1;

  return p.days.find((d) => d.dayNumber === nr) ?? p.days[0] ?? null;
}
