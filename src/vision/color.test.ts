import { describe, expect, it } from 'vitest';
import type { Color } from '../cube/types';
import { STICKER_HEX } from '../render/colors';
import { addGlint, hexToRgb, paintFrame, type Rgb } from '../test-utils/frames';
import { seededRandom } from '../test-utils/random';
import { labDistance, nearestColor, readFace, rgbToLab, START_GUESSES } from './color';

const COLORS: readonly Color[] = ['W', 'Y', 'G', 'B', 'R', 'O'];

describe('rgbToLab', () => {
  it('white is L 100 with no color; black is all zeros', () => {
    const white = rgbToLab(255, 255, 255);
    expect(Math.abs(white.L - 100)).toBeLessThan(0.01);
    expect(Math.abs(white.a)).toBeLessThan(0.02);
    expect(Math.abs(white.b)).toBeLessThan(0.02);
    expect(rgbToLab(0, 0, 0)).toEqual({ L: 0, a: 0, b: 0 });
  });

  it('pure red matches the commonly published values (about 53.24, 80.09, 67.20)', () => {
    const red = rgbToLab(255, 0, 0);
    expect(Math.abs(red.L - 53.24)).toBeLessThan(0.1);
    expect(Math.abs(red.a - 80.09)).toBeLessThan(0.1);
    expect(Math.abs(red.b - 67.2)).toBeLessThan(0.1);
  });
});

describe('labDistance', () => {
  it('is the straight-line distance, the same both ways', () => {
    const p = { L: 0, a: 3, b: 4 };
    const q = { L: 0, a: 0, b: 0 };
    expect(labDistance(p, q)).toBe(5);
    expect(labDistance(q, p)).toBe(5);
    expect(labDistance(p, p)).toBe(0);
  });
});

describe('readFace', () => {
  // Nine different colors, so a mix-up between cells would show.
  const cells: Rgb[] = [
    ...COLORS.map((c) => hexToRgb(STICKER_HEX[c])),
    [128, 128, 128],
    [230, 120, 170],
    [40, 60, 30],
  ];

  it('reads each cell, row by row, despite noise and the dark lines between squares', () => {
    const readings = readFace(paintFrame(cells, { noise: 8, random: seededRandom(1) }));
    expect(readings).toHaveLength(9);
    readings.forEach((reading, i) => {
      expect(labDistance(reading, rgbToLab(...cells[i]))).toBeLessThan(2);
    });
  });

  it('a glint of light inside a cell does not change its reading', () => {
    const frame = paintFrame(cells, { noise: 8, random: seededRandom(2) });
    // Cell 4 (the center) spans pixels 50–99; its middle half starts at 62.5.
    const glinted = addGlint(frame, 70, 70);
    const before = readFace(frame)[4];
    const after = readFace(glinted)[4];
    expect(labDistance(before, after)).toBeLessThan(2);
  });
});

describe('nearestColor', () => {
  it('each starting guess is nearest to itself, with a real gap to the next', () => {
    for (const color of COLORS) {
      const nearest = nearestColor(START_GUESSES[color], START_GUESSES);
      expect(nearest.color).toBe(color);
      expect(nearest.gap).toBeGreaterThan(0);
    }
  });
});
