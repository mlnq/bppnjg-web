import { describe, it, expect } from 'vitest';
import { pozycjaZHarmonogramu, dystansNaTrasie } from './position';
import type { Dzien, Fix } from './position';

const dzien: Dzien = {
  nr: 1,
  od: 'A',
  do: 'B',
  dystans: 30,
  przystanki: [
    { czas: '06:00', km: 0, miejsce: 'A' },
    { czas: '12:00', km: 15, miejsce: 'M' },
    { czas: '18:00', km: 30, miejsce: 'B' },
  ],
};

describe('pozycjaZHarmonogramu', () => {
  it('returns 0 before start', () => {
    const now = new Date(); now.setHours(5, 0, 0, 0);
    expect(pozycjaZHarmonogramu(dzien, now)).toBe(0);
  });

  it('returns full distance after end', () => {
    const now = new Date(); now.setHours(19, 0, 0, 0);
    expect(pozycjaZHarmonogramu(dzien, now)).toBe(30);
  });

  it('interpolates at midpoint', () => {
    const now = new Date(); now.setHours(9, 0, 0, 0);
    expect(pozycjaZHarmonogramu(dzien, now)).toBeCloseTo(7.5);
  });

  it('returns exact km at waypoint time', () => {
    const now = new Date(); now.setHours(12, 0, 0, 0);
    expect(pozycjaZHarmonogramu(dzien, now)).toBe(15);
  });
});

const dzienGps: Dzien = {
  nr: 1, od: 'A', do: 'B', dystans: 10,
  przystanki: [
    { czas: '06:00', km: 0, miejsce: 'A', lat: 0, lng: 0 },
    { czas: '12:00', km: 10, miejsce: 'B', lat: 0, lng: 0.1 },
  ],
};

describe('dystansNaTrasie', () => {
  it('returns null when no lat/lng', () => {
    const fix: Fix = { lat: 0, lng: 0.05, acc: 10, t: Date.now() };
    expect(dystansNaTrasie(dzien, fix)).toBeNull();
  });

  it('projects midpoint GPS fix to midpoint km', () => {
    const fix: Fix = { lat: 0, lng: 0.05, acc: 10, t: Date.now() };
    const result = dystansNaTrasie(dzienGps, fix);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(5, 0);
  });
});
