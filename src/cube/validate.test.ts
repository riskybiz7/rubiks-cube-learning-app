import { describe, expect, it } from 'vitest';
import { randomMoves, seededRandom } from '../test-utils/random';
import { solved } from './geometry';
import { applyMoves } from './moves';
import { mustParse } from './notation';
import type { Color, Cube } from './types';
import { REAL_CENTER_LAYOUTS, validateStickers, type ValidationResult } from './validate';

const COLORS: Color[] = ['W', 'Y', 'G', 'B', 'R', 'O'];

/** A cube's stickers with some replaced: { index: newColor }. */
function edited(changes: Record<number, Color | null>, base: Cube = solved()): (Color | null)[] {
  const stickers: (Color | null)[] = [...base.stickers];
  for (const [index, color] of Object.entries(changes)) stickers[Number(index)] = color;
  return stickers;
}

/** A cube's stickers with pairs of stickers exchanged. */
function swapped(pairs: [number, number][], base: Cube = solved()): Color[] {
  const stickers = [...base.stickers];
  for (const [a, b] of pairs) [stickers[a], stickers[b]] = [stickers[b], stickers[a]];
  return stickers;
}

const codes = (result: ValidationResult) => (result.ok ? [] : result.problems.map((p) => p.code));
const messages = (result: ValidationResult) =>
  result.ok ? '' : result.problems.map((p) => p.message).join(' | ');

describe('validateStickers: real cubes pass', () => {
  it('accepts a solved cube', () => {
    const result = validateStickers(solved().stickers);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.cube).toEqual(solved());
  });

  it('accepts 500 real scrambles of every move type', () => {
    const random = seededRandom(7);
    for (let i = 0; i < 500; i++) {
      const result = validateStickers(applyMoves(solved(), randomMoves(30, random)).stickers);
      expect(result.ok, messages(result)).toBe(true);
    }
  });

  it('accepts a solved cube held in any of its 24 orientations', () => {
    expect(REAL_CENTER_LAYOUTS.size).toBe(24);
    for (const first of ['', 'x', 'x2', "x'", 'z', "z'"]) {
      for (const second of ['', 'y', 'y2', "y'"]) {
        const cube = applyMoves(solved(), mustParse(`${first} ${second}`));
        expect(validateStickers(cube.stickers).ok, `${first} ${second}`).toBe(true);
      }
    }
  });
});

describe('validateStickers: each kind of problem', () => {
  it('asks for the blank stickers first', () => {
    const result = validateStickers(edited({ 0: null, 1: null, 13: null }));
    expect(result).toEqual({
      ok: false,
      problems: [
        { code: 'blank', message: '3 stickers still need a color.', stickers: [0, 1, 13] },
      ],
    });
    expect(messages(validateStickers(edited({ 5: null })))).toBe('1 sticker still needs a color.');
  });

  it('reports only the first kind of problem', () => {
    expect(codes(validateStickers(edited({ 0: null, 10: 'O' })))).toEqual(['blank']);
  });

  it('counts colors and suggests the likely mix-up', () => {
    const result = validateStickers(edited({ 10: 'O' }));
    expect(codes(result)).toEqual(['color-count']);
    expect(messages(result)).toContain('there are 8 red and 10 orange');
    expect(messages(result)).toContain('One red sticker was probably entered as orange.');
    if (!result.ok) {
      expect(result.problems[0].stickers).toContain(10);
      expect(result.problems[0].stickers).not.toContain(40); // the orange center isn't suspect
    }
  });

  it('catches two centers of the same color', () => {
    const result = validateStickers(swapped([[22, 0]]));
    expect(codes(result)).toEqual(['duplicate-center']);
    expect(messages(result)).toContain('Two centers are both white');
    if (!result.ok) expect(result.problems[0].stickers).toEqual([4, 22]);
  });

  it('catches centers that should be opposite but are next to each other (swapped caps)', () => {
    const result = validateStickers(swapped([[13, 22]]));
    expect(new Set(codes(result))).toEqual(new Set(['center-opposites']));
    expect(messages(result)).toContain('red and orange centers should be on opposite sides');
  });

  it('catches a mirror-image center layout (red and orange caps swapped)', () => {
    const result = validateStickers(swapped([[13, 40]]));
    expect(codes(result)).toEqual(['center-mirror']);
    expect(messages(result)).toContain('mirror image');
  });

  it('catches edges with color combinations no real edge has', () => {
    const result = validateStickers(swapped([[5, 43]]));
    expect(codes(result)).toEqual(['impossible-edge', 'impossible-edge']);
    expect(messages(result)).toContain('The top-right edge shows orange and red');
    if (!result.ok) expect(result.problems[0].stickers).toEqual([5, 10]);
  });

  it('catches a corner with its colors in the wrong order', () => {
    const result = validateStickers(swapped([[9, 20]]));
    expect(codes(result)).toEqual(['mirrored-corner']);
    expect(messages(result)).toContain('top-front-right corner');
    if (!result.ok) expect(result.problems[0].stickers).toEqual([8, 9, 20]);
  });

  it('catches a piece that appears twice', () => {
    const result = validateStickers(edited({ 19: 'R', 16: 'G' }));
    expect(codes(result)).toEqual(['duplicate-piece']);
    expect(messages(result)).toContain('white-red edge');
    expect(messages(result)).toContain('missing');
  });

  it('catches a corner twisted in place', () => {
    const stickers = [...solved().stickers];
    [stickers[8], stickers[9], stickers[20]] = [stickers[20], stickers[8], stickers[9]];
    expect(codes(validateStickers(stickers))).toEqual(['corner-twist']);
  });

  it('catches an edge flipped in place', () => {
    expect(codes(validateStickers(swapped([[7, 19]])))).toEqual(['edge-flip']);
  });

  it('catches two pieces swapped', () => {
    expect(
      codes(
        validateStickers(
          swapped([
            [7, 5],
            [19, 10],
          ]),
        ),
      ),
    ).toEqual(['parity']);
  });

  it('catches a twisted corner on a scrambled cube too', () => {
    const scrambled = applyMoves(solved(), randomMoves(20, seededRandom(3)));
    const stickers = [...scrambled.stickers];
    [stickers[8], stickers[9], stickers[20]] = [stickers[20], stickers[8], stickers[9]];
    expect(codes(validateStickers(stickers))).toEqual(['corner-twist']);
  });
});

describe('validateStickers: robustness', () => {
  it('never crashes on random input, and always explains a rejection', () => {
    const random = seededRandom(11);
    const pick = () => COLORS[Math.floor(random() * 6)];
    for (let i = 0; i < 1000; i++) {
      // Fully random colors, with some blanks.
      const noisy = Array.from({ length: 54 }, () => (random() < 0.1 ? null : pick()));
      // A shuffle of a solved cube's stickers: color counts are right, everything else random.
      const shuffled = [...solved().stickers].sort(() => random() - 0.5);
      for (const stickers of [noisy, shuffled]) {
        const result = validateStickers(stickers);
        if (!result.ok) {
          expect(result.problems.length).toBeGreaterThan(0);
          expect(result.problems.every((p) => p.message.length > 0)).toBe(true);
        }
      }
    }
  });
});
