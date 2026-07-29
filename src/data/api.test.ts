import { describe, expect, it } from 'vitest';
import { konferencjaId, konferencjaNr, scheduledStopTime, toDzien } from './api';
import type { ApiPilgrimageDay, ApiStop } from './types';

const stop = (overrides: Partial<ApiStop> = {}): ApiStop => ({
  id: 'stop-1',
  orderIndex: 0,
  name: null,
  townName: 'Białystok',
  time: '06:00',
  type: 'info',
  distanceToNextKm: 0,
  latitude: null,
  longitude: null,
  ...overrides,
});

describe('konferencjaId', () => {
  it('pads single-digit day numbers', () => {
    expect(konferencjaId(3)).toBe('dzien-03');
  });

  it('does not pad two-digit day numbers', () => {
    expect(konferencjaId(12)).toBe('dzien-12');
  });
});

describe('konferencjaNr', () => {
  it('extracts the day number from a slug', () => {
    expect(konferencjaNr('dzien-03')).toBe(3);
  });

  it('round-trips with konferencjaId', () => {
    expect(konferencjaNr(konferencjaId(7))).toBe(7);
  });
});

describe('scheduledStopTime', () => {
  it('accepts a time-only value configured for a waypoint', () => {
    expect(scheduledStopTime(stop({ scheduledAt: '9:00' }))).toBe('09:00');
  });

  it('uses the custom arrival time configured for a waypoint', () => {
    expect(scheduledStopTime(stop({ scheduledAt: '2025-08-01T08:45:00+02:00' }))).toBe('08:45');
  });

  it('falls back to the legacy time when scheduledAt is absent or invalid', () => {
    expect(scheduledStopTime(stop())).toBe('06:00');
    expect(scheduledStopTime(stop({ scheduledAt: 'not-a-date' }))).toBe('06:00');
  });
});

it('uses scheduledAt when transforming stops for schedule-based position', () => {
  const day: ApiPilgrimageDay = {
    id: 'day-1',
    dayNumber: 1,
    title: 'Dzień 1',
    date: '2025-08-01',
    route: { startStopId: 'start', endStopId: 'end', totalDistanceKm: 10, scheduledStartTime: '06:00', plannedArrivalTime: '10:00' },
    stops: [
      stop({ id: 'start', scheduledAt: '2025-08-01T06:00:00+02:00', distanceToNextKm: 10 }),
      stop({ id: 'end', orderIndex: 1, scheduledAt: '2025-08-01T10:30:00+02:00' }),
    ],
    news: [],
  };

  expect(toDzien(day).przystanki.map(({ czas }) => czas)).toEqual(['06:00', '10:30']);
});
