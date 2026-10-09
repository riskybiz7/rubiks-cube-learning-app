import { describe, expect, it } from 'vitest';
import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { randomScramble } from '../cube/scramble';
import type { Color } from '../cube/types';
import { seededRandom } from '../test-utils/random';
import { cameraViews, readingsOf } from '../test-utils/scans';
import { START_GUESSES, type Lab } from './color';
import { nameCenters, sortColors } from './sort';

const COLORS: readonly Color[] = ['W', 'Y', 'G', 'B', 'R', 'O'];
const scrambled = (seed: number) => applyMoves(solved(), randomScramble(25, seededRandom(seed)));
const countOf = (colors: readonly Color[], color: Color) =>
  colors.filter((c) => c === color).length;

describe('nameCenters', () => {
  it('gives each center the color whose guess it matches, in any order', () => {
    const order: Color[] = ['O', 'W', 'B', 'Y', 'R', 'G'];
    expect(
      nameCenters(
        order.map((c) => START_GUESSES[c]),
        START_GUESSES,
      ),
    ).toEqual(order);
  });
});

describe('sortColors', () => {
  it('a clean scan sorts exactly, with nothing unsure', () => {
    const views = cameraViews(scrambled(11));
    const sorted = sortColors(
      readingsOf(views, { noise: 2, random: seededRandom(1) }),
      START_GUESSES,
    );
    expect(sorted.colors).toEqual(views.flat());
    expect(sorted.unsure).toEqual([]);
  });

  it('warm light (every color pushed toward red and yellow) still sorts exactly', () => {
    const views = cameraViews(scrambled(12));
    const readings = readingsOf(views, {
      noise: 2,
      random: seededRandom(2),
      shift: { a: 8, b: 15 },
    });
    expect(sortColors(readings, START_GUESSES).colors).toEqual(views.flat());
  });

  it('two orange squares that read slightly red become orange again, marked unsure', () => {
    const views = cameraViews(scrambled(13));
    const readings = readingsOf(views, { noise: 2, random: seededRandom(3) });
    const truth = views.flat();
    // Two non-center orange squares, read 45% of the way from red to orange (nearer red).
    const targets = truth
      .map((color, pos) => ({ color, pos }))
      .filter(({ color, pos }) => color === 'O' && pos % 9 !== 4)
      .slice(0, 2)
      .map(({ pos }) => pos);
    expect(targets).toHaveLength(2);
    const red = START_GUESSES.R;
    const orange = START_GUESSES.O;
    const between: Lab = {
      L: red.L + 0.45 * (orange.L - red.L),
      a: red.a + 0.45 * (orange.a - red.a),
      b: red.b + 0.45 * (orange.b - red.b),
    };
    for (const pos of targets) readings[Math.floor(pos / 9)][pos % 9] = { ...between };

    const sorted = sortColors(readings, START_GUESSES);
    expect(sorted.colors).toEqual(truth);
    for (const pos of targets) expect(sorted.unsure).toContain(pos);
  });

  it('always ends with exactly 9 of each color and never changes a named center (100 noisy scans)', () => {
    const random = seededRandom(7);
    for (let n = 0; n < 100; n++) {
      const views = cameraViews(applyMoves(solved(), randomScramble(25, random)));
      const readings = readingsOf(views, { noise: 15, random });
      const sorted = sortColors(readings, START_GUESSES);
      for (const color of COLORS) expect(countOf(sorted.colors, color)).toBe(9);
      const named = nameCenters(
        readings.map((face) => face[4]),
        START_GUESSES,
      );
      expect([0, 1, 2, 3, 4, 5].map((step) => sorted.colors[step * 9 + 4])).toEqual(named);
    }
  });
});
