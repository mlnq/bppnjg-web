import { describe, it, expect } from 'vitest';
import { konferencjaId, konferencjaNr } from './api';

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
