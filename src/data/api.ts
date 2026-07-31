import type {
  BootstrapResponse, NewsResponse, QuartermasterResponse,
  RouteStateRequest, CurrentRouteStateDto, Konferencja, KonferencjaListItem,
} from './types';
import type { Dzien } from '../lib/position';
import type { ApiPilgrimageDay } from './types';
import { srtNaAkapity, srtNaCues } from '../lib/srt-txt';

import bootstrapSeed from './seeds/bootstrap.json';
import newsSeed from './seeds/news.json';
import quartermasterSeed from './seeds/quartermaster.json';
import konferencjeSeed from './seeds/konferencje.json';

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
const USE_SEEDS = import.meta.env.VITE_USE_SEEDS === 'true';
const YEAR = '2025';

/** Returns the waypoint's planned local arrival time in `HH:mm` format. */
export function scheduledStopTime(stop: { scheduledAt?: string | null; time: string }): string {
  if (stop.scheduledAt) {
    const timeOnly = /^(\d{1,2}):(\d{2})$/.exec(stop.scheduledAt);
    if (timeOnly && Number(timeOnly[1]) < 24 && Number(timeOnly[2]) < 60) {
      return `${timeOnly[1].padStart(2, '0')}:${timeOnly[2]}`;
    }

    const scheduledAt = new Date(stop.scheduledAt);
    if (!Number.isNaN(scheduledAt.getTime())) {
      return `${String(scheduledAt.getHours()).padStart(2, '0')}:${String(scheduledAt.getMinutes()).padStart(2, '0')}`;
    }
  }

  return stop.time;
}

export function konferencjaId(nr: number): string {
  return `dzien-${String(nr).padStart(2, '0')}`;
}

export function konferencjaNr(id: string): number {
  return Number(id.replace(/^dzien-/, ''));
}

function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = BASE ? `${BASE}${path}` : path;
  return fetch(url, init).then((r) => {
    if (!r.ok) throw new Error(`API ${r.status}: ${path}`);
    return r.json() as Promise<T>;
  });
}

async function getKonferencjaById(id: string): Promise<Konferencja> {
  if (USE_SEEDS) {
    const found = (konferencjeSeed as Konferencja[]).find((k) => k.id === id);
    if (!found) throw new Error(`Konferencja ${id} not found`);
    return found;
  }
  const k = await fetchJson<Konferencja>(`/api/konferencje/${id}`);
  const srt = await fetch(k.srtUrl).then((r) => r.text());
  return { ...k, akapity: srtNaAkapity(srt), cues: srtNaCues(srt) };
}

export const api = {
  bootstrap(): Promise<BootstrapResponse> {
    if (USE_SEEDS) return Promise.resolve(bootstrapSeed as BootstrapResponse);
    return fetchJson<BootstrapResponse>(`/api/pilgrimages/${YEAR}/bootstrap`);
  },

  getNews(): Promise<NewsResponse> {
    if (USE_SEEDS) return Promise.resolve(newsSeed as NewsResponse);
    return fetchJson<NewsResponse>('/api/news?limit=50&page=1');
  },

  getQuartermaster(): Promise<QuartermasterResponse> {
    if (USE_SEEDS) return Promise.resolve(quartermasterSeed as QuartermasterResponse);
    return fetchJson<QuartermasterResponse>('/api/quartermaster-comments');
  },

  getKonferencje(): Promise<KonferencjaListItem[]> {
    if (USE_SEEDS) {
      return Promise.resolve(
        (konferencjeSeed as Konferencja[]).map(({ id, tytul, autor }) => ({ id, tytul, autor })),
      );
    }
    return fetchJson<KonferencjaListItem[]>('/api/konferencje');
  },

  async getKonferencja(nr: number): Promise<Konferencja> {
    return getKonferencjaById(konferencjaId(nr));
  },

  getKonferencjaById,

  postRouteState(body: RouteStateRequest): Promise<CurrentRouteStateDto> {
    return fetchJson<CurrentRouteStateDto>(
      `/api/pilgrimages/${YEAR}/days/${body.dayId}/route-state`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    );
  },
};

export function buildKmCumulative(stops: ApiPilgrimageDay['stops']): number[] {
  const km: number[] = [0];
  for (let i = 0; i < stops.length - 1; i++) {
    km.push(km[i] + (stops[i].distanceToNextKm ?? 0));
  }
  return km;
}

export function toDzien(day: ApiPilgrimageDay): Dzien {
  const kmCum = buildKmCumulative(day.stops);
  return {
    nr: day.dayNumber,
    od: day.stops[0]?.townName ?? '',
    do: day.stops[day.stops.length - 1]?.townName ?? '',
    dystans: kmCum[kmCum.length - 1] || day.route.totalDistanceKm,
    przystanki: day.stops.map((s, i) => ({
      czas: scheduledStopTime(s),
      km: kmCum[i],
      miejsce: s.townName ?? s.name ?? '',
      durationMin: s.durationMin,
      lat: s.latitude ?? undefined,
      lng: s.longitude ?? undefined,
    })),
  };
}
