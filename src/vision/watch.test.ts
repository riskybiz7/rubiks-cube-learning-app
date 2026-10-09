import { describe, expect, it } from 'vitest';
import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { randomScramble } from '../cube/scramble';
import { seededRandom } from '../test-utils/random';
import { cameraViews, readingsOf } from '../test-utils/scans';
import { labDistance, type Lab } from './color';
import { earlierFaceLike, isSteady, isTooDark, SAME_CENTER, type LiveReading } from './watch';

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
  const faces = (seed: number, noise = 2) =>
    readingsOf(cameraViews(applyMoves(solved(), randomScramble(25, seededRandom(seed)))), {
      noise,
      random: seededRandom(seed + 1000),
    });

  it('finds the same face shown again', () => {
    const scanned = faces(51);
    const again = faces(51, 3)[2]; // step 2's face, read again with fresh noise
    expect(earlierFaceLike(again, scanned.slice(0, 3))).toBe(2);
  });

  it('finds the face just taken even when a shadow darkens its center past the limit', () => {
    const scanned = faces(52);
    const shadowed = scanned[1].map((lab) => ({ ...lab, L: lab.L - 20 }));
    expect(labDistance(shadowed[4], scanned[1][4])).toBeGreaterThan(SAME_CENTER);
    expect(earlierFaceLike(shadowed, scanned.slice(0, 2))).toBe(1);
  });

  it('never mistakes a different face for an earlier one (50 scrambles, every pair)', () => {
    for (let seed = 100; seed < 150; seed++) {
      const scanned = faces(seed);
      scanned.forEach((face, i) => {
        const others = scanned.filter((_, j) => j !== i);
        expect(earlierFaceLike(face, others)).toBe(-1);
      });
    }
  });
});
