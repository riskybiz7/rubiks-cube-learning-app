import { describe, expect, it } from 'vitest';
import { randomMoves, seededRandom } from '../test-utils/random';
import { STICKER_SLOTS, solved } from './geometry';
import { applyMoves } from './moves';
import { mustParse } from './notation';
import {
  CORNER_SLOTS,
  EDGE_SLOTS,
  cornerTwistTotal,
  edgeFlipTotal,
  fromPieces,
  permutationParity,
  readPieces,
} from './pieces';
import type { Color } from './types';

const slot = (i: number) => STICKER_SLOTS[i];

/** A solved cube with some stickers swapped: each pair [a, b] exchanges two stickers. */
function swapped(pairs: [number, number][]): { stickers: Color[] } {
  const stickers = [...solved().stickers];
  for (const [a, b] of pairs) [stickers[a], stickers[b]] = [stickers[b], stickers[a]];
  return { stickers };
}

describe('slot tables', () => {
  it('lists 8 corners and 12 edges using 48 different non-center stickers', () => {
    const all = [
      ...CORNER_SLOTS.flatMap((c) => c.stickers),
      ...EDGE_SLOTS.flatMap((e) => e.stickers),
    ];
    expect(CORNER_SLOTS).toHaveLength(8);
    expect(EDGE_SLOTS).toHaveLength(12);
    expect(new Set(all).size).toBe(48);
    expect(all.every((i) => i % 9 !== 4)).toBe(true);
  });

  it("puts each slot's stickers on one cubie, on the faces the slot names", () => {
    for (const s of [...CORNER_SLOTS, ...EDGE_SLOTS]) {
      expect(s.name).toBe(s.faces.join(''));
      const first = slot(s.stickers[0]).position;
      s.stickers.forEach((i, k) => {
        expect(slot(i).position, s.name).toEqual(first);
        expect(slot(i).face, s.name).toBe(s.faces[k]);
      });
    }
  });

  it('orders each corner clockwise, starting from its top or bottom sticker', () => {
    for (const c of CORNER_SLOTS) {
      expect(['U', 'D']).toContain(c.faces[0]);
      const a = slot(c.stickers[0]).normal;
      const b = slot(c.stickers[1]).normal;
      const p = slot(c.stickers[0]).position;
      const cross = [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
      ];
      // Seen from outside the corner, going clockwise makes this dot product negative.
      expect(cross[0] * p[0] + cross[1] * p[1] + cross[2] * p[2], c.name).toBeLessThan(0);
    }
  });
});

describe('readPieces', () => {
  it('finds every piece at home, untwisted, on a solved cube', () => {
    const reading = readPieces(solved());
    expect(reading.ok).toBe(true);
    if (reading.ok) {
      expect(reading.pieces.corners).toEqual(CORNER_SLOTS.map((_, i) => ({ piece: i, twist: 0 })));
      expect(reading.pieces.edges).toEqual(EDGE_SLOTS.map((_, i) => ({ piece: i, flip: 0 })));
    }
  });

  it('matches the published result of an R turn (Kociemba tables)', () => {
    const reading = readPieces(applyMoves(solved(), mustParse('R')));
    expect(reading.ok).toBe(true);
    if (reading.ok) {
      // After R: the DFR corner sits in URF twisted twice; URF sits in UBR twisted once.
      expect(reading.pieces.corners[0]).toEqual({ piece: 4, twist: 2 });
      expect(reading.pieces.corners[3]).toEqual({ piece: 0, twist: 1 });
      // The FR edge moves up into UR, unflipped.
      expect(reading.pieces.edges[0]).toEqual({ piece: 8, flip: 0 });
    }
  });

  it('rebuilds exactly the same stickers from the pieces view (300 random scrambles)', () => {
    const random = seededRandom(1);
    for (let i = 0; i < 300; i++) {
      const cube = applyMoves(solved(), randomMoves(25, random));
      const reading = readPieces(cube);
      expect(reading.ok).toBe(true);
      if (reading.ok) expect(fromPieces(reading.pieces)).toEqual(cube);
    }
  });

  it('keeps the three hidden rules on every real scramble', () => {
    const random = seededRandom(2);
    for (let i = 0; i < 300; i++) {
      const reading = readPieces(applyMoves(solved(), randomMoves(25, random)));
      expect(reading.ok).toBe(true);
      if (!reading.ok) continue;
      expect(cornerTwistTotal(reading.pieces)).toBe(0);
      expect(edgeFlipTotal(reading.pieces)).toBe(0);
      expect(permutationParity(reading.pieces.corners.map((c) => c.piece))).toBe(
        permutationParity(reading.pieces.edges.map((e) => e.piece)),
      );
    }
  });

  it('shows a corner twisted in place through the twist total', () => {
    const stickers = [...solved().stickers];
    [stickers[8], stickers[9], stickers[20]] = [stickers[20], stickers[8], stickers[9]];
    const reading = readPieces({ stickers });
    expect(reading.ok).toBe(true);
    if (reading.ok) expect(cornerTwistTotal(reading.pieces)).not.toBe(0);
  });

  it('flags a corner whose colors are in mirror-image order', () => {
    expect(readPieces(swapped([[9, 20]]))).toEqual({
      ok: false,
      impossibleCorners: [],
      mirroredCorners: [0],
      impossibleEdges: [],
    });
  });

  it('flags edges with color combinations no real edge has', () => {
    expect(readPieces(swapped([[5, 43]]))).toEqual({
      ok: false,
      impossibleCorners: [],
      mirroredCorners: [],
      impossibleEdges: [0, 6],
    });
  });
});

describe('permutationParity', () => {
  it('counts an even or odd number of swaps', () => {
    expect(permutationParity([0, 1, 2])).toBe(0);
    expect(permutationParity([1, 0, 2])).toBe(1);
    expect(permutationParity([1, 2, 0])).toBe(0);
  });
});
