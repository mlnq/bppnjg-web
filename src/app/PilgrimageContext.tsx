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
};

export const DOMYSLNE: Ustawienia = {
  type: 'spokoj', read: 'sans', accent: 'subtelny', readScale: 1, tryb: 'auto',
};

type PilgrimageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; pilgrimage: ApiPilgrimage; day: ApiPilgrimageDay };

type CtxValue = {
  state: PilgrimageState;
  settings: Ustawienia;
  setSettings: (s: Ustawienia) => void;
};

const Ctx = createContext<CtxValue | null>(null);

export function PilgrimageProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PilgrimageState>({ status: 'loading' });
  const [settings, setSettings] = useLocalStorage<Ustawienia>('pg.ustawienia', DOMYSLNE);

  useEffect(() => {
    api.bootstrap()
      .then((res) => {
        if (!res.pilgrimage) { setState({ status: 'error', message: 'Brak danych pielgrzymki.' }); return; }
        const p = res.pilgrimage;
        const day = selectCurrentDay(p);
        if (!day) { setState({ status: 'error', message: 'Brak aktywnego dnia.' }); return; }
        setState({ status: 'ok', pilgrimage: p, day });
      })
      .catch((e: unknown) => setState({ status: 'error', message: String(e) }));
  }, []);

  return <Ctx.Provider value={{ state, settings, setSettings }}>{children}</Ctx.Provider>;
}

export function usePilgrimage() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePilgrimage must be inside PilgrimageProvider');
  return ctx;
}

function selectCurrentDay(p: ApiPilgrimage): ApiPilgrimageDay | null {
  const YEAR = new Date().getFullYear();
  const start = new Date(YEAR, 6, 30, 12);
  const end = new Date(YEAR, 7, 12, 12);
  const now = new Date(); now.setHours(12, 0, 0, 0);

  let nr: number;
  if (now < start) nr = 1;
  else if (now > end) nr = 14;
  else nr = Math.floor((now.getTime() - start.getTime()) / 86_400_000) + 1;

  return p.days.find((d) => d.dayNumber === nr) ?? p.days[0] ?? null;
}
