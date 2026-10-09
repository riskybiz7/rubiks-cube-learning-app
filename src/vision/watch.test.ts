import { describe, expect, it } from 'vitest';
import type { Lab } from './color';
import { earlierFaceLike, isSteady, isTooDark, type LiveReading } from './watch';

const face = (L: number): Lab[] => Array.from({ length: 9 }, () => ({ L, a: 10, b: 20 }));

/**
 * Identical readings every 66 ms (about 15 a second), from 0 up to the first reading at or past
 * `ms`, so the newest reading is at least `ms` after the oldest.
 */
const still = (ms: number): LiveReading[] =>
  Array.from({ length: Math.ceil(ms / 66) + 1 }, (_, i) => ({ time: i * 66, readings: face(60) }));

describe('isSteady', () => {
  it('waits until the picture has held still for 700 ms', () => {
    expect(isSteady(still(600))).toBe(false); // newest reading at 660 ms
    expect(isSteady(still(700))).toBe(true); // newest reading at 726 ms
    expect(isSteady(still(1500))).toBe(true);
  });

  it('a square drifting during the wait means not steady', () => {
    const history = still(800);
    history[3].readings = face(60).map((lab, k) => (k === 5 ? { ...lab, L: 70 } : lab));
    expect(isSteady(history)).toBe(false);
  });

  it('nothing seen yet is not steady', () => {
    expect(isSteady([])).toBe(false);
  });
});

describe('isTooDark', () => {
  it('asks for more light only when the face is dark', () => {
    expect(isTooDark(face(20))).toBe(true);
    expect(isTooDark(face(60))).toBe(false);
  });
});

describe('earlierFaceLike', () => {
  it('finds an earlier face with the same-looking center, and ignores different ones', () => {
    const earlier: Lab[] = [
      { L: 50, a: 60, b: 40 },
      { L: 80, a: 0, b: 0 },
    ];
    expect(earlierFaceLike({ L: 83, a: 4, b: 0 }, earlier)).toBe(1); // 5 away
    expect(earlierFaceLike({ L: 50, a: 30, b: 40 }, earlier)).toBe(-1); // 30 away
  });
});
