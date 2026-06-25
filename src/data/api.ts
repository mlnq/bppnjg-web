import type {
  BootstrapResponse, NewsResponse, QuartermasterResponse,
  RouteStateRequest, CurrentRouteStateDto,
} from './types';
import type { Dzien } from '../lib/position';
import type { ApiPilgrimageDay } from './types';

import bootstrapSeed from './seeds/bootstrap.json';
import newsSeed from './seeds/news.json';
import quartermasterSeed from './seeds/quartermaster.json';

const BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;
const YEAR = '2025';

function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE) return Promise.reject(new Error('No VITE_API_BASE_URL'));
  return fetch(`${BASE}${path}`, init).then((r) => {
    if (!r.ok) throw new Error(`API ${r.status}: ${path}`);
    return r.json() as Promise<T>;
  });
}

export const api = {
  bootstrap(): Promise<BootstrapResponse> {
    if (!BASE) return Promise.resolve(bootstrapSeed as BootstrapResponse);
    return fetchJson<BootstrapResponse>(`/api/pilgrimages/${YEAR}/bootstrap`);
  },

  getNews(): Promise<NewsResponse> {
    if (!BASE) return Promise.resolve(newsSeed as NewsResponse);
    return fetchJson<NewsResponse>('/api/news?limit=50&page=1');
  },

  getQuartermaster(): Promise<QuartermasterResponse> {
    if (!BASE) return Promise.resolve(quartermasterSeed as QuartermasterResponse);
    return fetchJson<QuartermasterResponse>('/api/quartermaster-comments');
  },

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
    dystans: day.route.totalDistanceKm,
    przystanki: day.stops.map((s, i) => ({
      czas: s.time,
      km: kmCum[i],
      miejsce: s.townName ?? s.name ?? '',
      lat: s.latitude ?? undefined,
      lng: s.longitude ?? undefined,
    })),
  };
}
