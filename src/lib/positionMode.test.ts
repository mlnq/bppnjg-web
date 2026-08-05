import { describe, expect, it } from 'vitest';
import { trybZFlagiPozycji } from './positionMode';

describe('trybZFlagiPozycji', () => {
  it('uses the schedule mode when the admin flag is absent', () => {
    expect(trybZFlagiPozycji(undefined)).toBe('plan');
  });

  it.each([
    ['schedule', 'plan'],
    ['hybrid', 'auto'],
  ] as const)('maps %s to %s', (flag, expected) => {
    expect(trybZFlagiPozycji(flag)).toBe(expected);
  });
});
