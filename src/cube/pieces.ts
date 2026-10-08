import { FACES, type Color, type Cube, type Face } from './types';

/**
 * The "pieces view" of a cube. A real cube has 20 moving pieces: 8 corners (3
 * stickers each) and 12 edges (2 stickers each). This file reads which piece sits
 * in each place ("slot") and which way it is turned. Think of it as summarizing the
 * 54 sticker line items by account: the same data, grouped the way a solver thinks.
 */

/** A corner slot: its faces and sticker indices, top/bottom sticker first, then clockwise. */
export interface CornerSlot {
  name: string;
  faces: readonly [Face, Face, Face];
  stickers: readonly [number, number, number];
}

/** An edge slot: its faces and sticker indices, top/bottom (or front/back) sticker first. */
export interface EdgeSlot {
  name: string;
  faces: readonly [Face, Face];
  stickers: readonly [number, number];
}

/** The standard slot order used by most cube software (Herbert Kociemba's convention). */
export const CORNER_SLOTS: readonly CornerSlot[] = [
  { name: 'URF', faces: ['U', 'R', 'F'], stickers: [8, 9, 20] },
  { name: 'UFL', faces: ['U', 'F', 'L'], stickers: [6, 18, 38] },
  { name: 'ULB', faces: ['U', 'L', 'B'], stickers: [0, 36, 47] },
  { name: 'UBR', faces: ['U', 'B', 'R'], stickers: [2, 45, 11] },
  { name: 'DFR', faces: ['D', 'F', 'R'], stickers: [29, 26, 15] },
  { name: 'DLF', faces: ['D', 'L', 'F'], stickers: [27, 44, 24] },
  { name: 'DBL', faces: ['D', 'B', 'L'], stickers: [33, 53, 42] },
  { name: 'DRB', faces: ['D', 'R', 'B'], stickers: [35, 17, 51] },
];

export const EDGE_SLOTS: readonly EdgeSlot[] = [
  { name: 'UR', faces: ['U', 'R'], stickers: [5, 10] },
  { name: 'UF', faces: ['U', 'F'], stickers: [7, 19] },
  { name: 'UL', faces: ['U', 'L'], stickers: [3, 37] },
  { name: 'UB', faces: ['U', 'B'], stickers: [1, 46] },
  { name: 'DR', faces: ['D', 'R'], stickers: [32, 16] },
  { name: 'DF', faces: ['D', 'F'], stickers: [28, 25] },
  { name: 'DL', faces: ['D', 'L'], stickers: [30, 43] },
  { name: 'DB', faces: ['D', 'B'], stickers: [34, 52] },
  { name: 'FR', faces: ['F', 'R'], stickers: [23, 12] },
  { name: 'FL', faces: ['F', 'L'], stickers: [21, 41] },
  { name: 'BL', faces: ['B', 'L'], stickers: [50, 39] },
  { name: 'BR', faces: ['B', 'R'], stickers: [48, 14] },
];

/** Which corner piece is in a slot, and how many clockwise twists away from its home turn. */
export interface CornerState {
  piece: number; // index into CORNER_SLOTS: the piece's home slot
  twist: 0 | 1 | 2;
}

/** Which edge piece is in a slot, and whether it's flipped relative to its home turn. */
export interface EdgeState {
  piece: number; // index into EDGE_SLOTS: the piece's home slot
  flip: 0 | 1;
}

export interface Pieces {
  centers: readonly Color[]; // the six center colors, in FACES order
  corners: readonly CornerState[]; // one per slot, in CORNER_SLOTS order
  edges: readonly EdgeState[]; // one per slot, in EDGE_SLOTS order
}

export type PieceReading =
  | { ok: true; pieces: Pieces }
  | {
      ok: false;
      impossibleCorners: number[];
      mirroredCorners: number[];
      impossibleEdges: number[];
    };

const isTopOrBottom = (face: Face | undefined): boolean => face === 'U' || face === 'D';

/**
 * Read which piece sits in each slot and how it's turned. Colors are matched to
 * faces through the center colors, so the cube may be held in any orientation.
 * Assumes the six centers are different colors (validate.ts checks that first).
 */
export function readPieces(cube: Cube): PieceReading {
  const centers = FACES.map((_, f) => cube.stickers[f * 9 + 4]);
  const faceOfColor = new Map<Color, Face>(
    centers.map((color, f): [Color, Face] => [color, FACES[f]]),
  );
  const faceAt = (sticker: number): Face | undefined => faceOfColor.get(cube.stickers[sticker]);

  const corners: CornerState[] = [];
  const impossibleCorners: number[] = [];
  const mirroredCorners: number[] = [];
  CORNER_SLOTS.forEach((slot, s) => {
    const faces = slot.stickers.map(faceAt);
    // The twist is which of the slot's three stickers shows the piece's top/bottom color.
    const twist = faces.findIndex(isTopOrBottom);
    const turned = twist < 0 ? [] : [0, 1, 2].map((k) => faces[(twist + k) % 3]);
    const piece = CORNER_SLOTS.findIndex((home) => home.faces.every((f, k) => f === turned[k]));
    if (piece >= 0) {
      corners.push({ piece, twist: twist as 0 | 1 | 2 });
    } else if (CORNER_SLOTS.some((home) => home.faces.every((f) => faces.includes(f)))) {
      mirroredCorners.push(s); // right colors, but in an order no real corner has
    } else {
      impossibleCorners.push(s);
    }
  });

  const edges: EdgeState[] = [];
  const impossibleEdges: number[] = [];
  EDGE_SLOTS.forEach((slot, s) => {
    const [a, b] = slot.stickers.map(faceAt);
    const straight = EDGE_SLOTS.findIndex((home) => home.faces[0] === a && home.faces[1] === b);
    const flipped = EDGE_SLOTS.findIndex((home) => home.faces[0] === b && home.faces[1] === a);
    if (straight >= 0) edges.push({ piece: straight, flip: 0 });
    else if (flipped >= 0) edges.push({ piece: flipped, flip: 1 });
    else impossibleEdges.push(s);
  });

  if (impossibleCorners.length > 0 || mirroredCorners.length > 0 || impossibleEdges.length > 0) {
    return { ok: false, impossibleCorners, mirroredCorners, impossibleEdges };
  }
  return { ok: true, pieces: { centers, corners, edges } };
}

/** Build the 54 stickers back from the pieces view: the reverse of readPieces. */
export function fromPieces(pieces: Pieces): Cube {
  const stickers: Color[] = new Array(54);
  const colorOf = (face: Face): Color => pieces.centers[FACES.indexOf(face)];
  pieces.centers.forEach((color, f) => {
    stickers[f * 9 + 4] = color;
  });
  pieces.corners.forEach(({ piece, twist }, s) => {
    const home = CORNER_SLOTS[piece].faces;
    for (let k = 0; k < 3; k++) {
      stickers[CORNER_SLOTS[s].stickers[(twist + k) % 3]] = colorOf(home[k]);
    }
  });
  pieces.edges.forEach(({ piece, flip }, s) => {
    const home = EDGE_SLOTS[piece].faces;
    for (let k = 0; k < 2; k++) {
      stickers[EDGE_SLOTS[s].stickers[(flip + k) % 2]] = colorOf(home[k]);
    }
  });
  return { stickers };
}

/** Total corner twist, counted in thirds of a turn. Always 0 on a cube that can be solved. */
export function cornerTwistTotal(pieces: Pieces): number {
  return pieces.corners.reduce((sum, c) => sum + c.twist, 0) % 3;
}

/** Total edge flips. Always 0 (an even number) on a cube that can be solved. */
export function edgeFlipTotal(pieces: Pieces): number {
  return pieces.edges.reduce((sum, e) => sum + e.flip, 0) % 2;
}

/**
 * 0 if an arrangement takes an even number of swaps to reach, 1 if odd, found by
 * counting pairs that are out of order. On a solvable cube, corners and edges match.
 */
export function permutationParity(order: readonly number[]): 0 | 1 {
  let outOfOrder = 0;
  for (let i = 0; i < order.length; i++) {
    for (let j = i + 1; j < order.length; j++) {
      if (order[i] > order[j]) outOfOrder++;
    }
  }
  return (outOfOrder % 2) as 0 | 1;
}
