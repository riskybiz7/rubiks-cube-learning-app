import { STICKER_SLOTS, cleanVec, findSlot, type Vec3 } from './geometry';
import { MOVE_BASES, type Move, type MoveBase, type Turns } from './notation';
import type { Cube } from './types';

export type Axis = 'x' | 'y' | 'z';
export const AXIS_INDEX: Record<Axis, 0 | 1 | 2> = { x: 0, y: 1, z: 2 };

/**
 * The geometry of ONE clockwise quarter turn of a move:
 * - axis:      the line it spins around
 * - layers:    which slices move, by coordinate along that axis (-1, 0 or 1)
 * - direction: +1 = counter-clockwise seen from the + end of the axis, -1 = clockwise
 *
 * "Clockwise" in cube notation means clockwise while looking AT that face, so
 * R (the +x face) is clockwise from +x, which is direction -1. L (the -x face)
 * is clockwise from -x, which is the same as counter-clockwise from +x: +1.
 */
export interface MoveSpec {
  axis: Axis;
  layers: readonly number[];
  direction: 1 | -1;
}

export const MOVE_SPECS: Record<MoveBase, MoveSpec> = {
  R: { axis: 'x', layers: [1], direction: -1 },
  L: { axis: 'x', layers: [-1], direction: 1 },
  U: { axis: 'y', layers: [1], direction: -1 },
  D: { axis: 'y', layers: [-1], direction: 1 },
  F: { axis: 'z', layers: [1], direction: -1 },
  B: { axis: 'z', layers: [-1], direction: 1 },
  r: { axis: 'x', layers: [0, 1], direction: -1 },
  l: { axis: 'x', layers: [-1, 0], direction: 1 },
  u: { axis: 'y', layers: [0, 1], direction: -1 },
  d: { axis: 'y', layers: [-1, 0], direction: 1 },
  f: { axis: 'z', layers: [0, 1], direction: -1 },
  b: { axis: 'z', layers: [-1, 0], direction: 1 },
  M: { axis: 'x', layers: [0], direction: 1 }, // follows L
  E: { axis: 'y', layers: [0], direction: 1 }, // follows D
  S: { axis: 'z', layers: [0], direction: -1 }, // follows F
  x: { axis: 'x', layers: [-1, 0, 1], direction: -1 }, // follows R
  y: { axis: 'y', layers: [-1, 0, 1], direction: -1 }, // follows U
  z: { axis: 'z', layers: [-1, 0, 1], direction: -1 }, // follows F
};

/**
 * Rotate a point or direction a quarter turn around an axis.
 * A +90° turn maps (x, y, z) to: around x → (x, -z, y); around y → (z, y, -x);
 * around z → (-y, x, z). Multiplying by the direction (±1) gives -90° for free.
 */
export function rotateQuarter(v: Vec3, axis: Axis, direction: 1 | -1): Vec3 {
  const [x, y, z] = v;
  const s = direction;
  switch (axis) {
    case 'x':
      return cleanVec(x, -s * z, s * y);
    case 'y':
      return cleanVec(s * z, y, -s * x);
    case 'z':
      return cleanVec(-s * y, s * x, z);
  }
}

/**
 * A permutation in "gather" form: after the move, slot j holds the sticker that
 * was in slot p[j]. (Like an INDEX lookup: new_value(j) = INDEX(old_values, p[j]).)
 */
type Permutation = readonly number[];

/** Work out one clockwise quarter turn by physically rotating every sticker in the moving layers. */
function quarterTurn(base: MoveBase): Permutation {
  const { axis, layers, direction } = MOVE_SPECS[base];
  const a = AXIS_INDEX[axis];
  const gather = STICKER_SLOTS.map((s) => s.index); // stickers outside the layers stay put
  for (const slot of STICKER_SLOTS) {
    if (!layers.includes(slot.position[a])) continue;
    const destination = findSlot(
      rotateQuarter(slot.position, axis, direction),
      rotateQuarter(slot.normal, axis, direction),
    );
    gather[destination] = slot.index;
  }
  return gather;
}

/** Doing `first` and then `second` as a single permutation. */
function compose(first: Permutation, second: Permutation): Permutation {
  return second.map((source) => first[source]);
}

/** Every move's permutation for 1, 2 and 3 quarter turns, computed once at startup. */
const PERMUTATIONS = Object.fromEntries(
  MOVE_BASES.map((base) => {
    const quarter = quarterTurn(base);
    const half = compose(quarter, quarter);
    const threeQuarters = compose(half, quarter);
    return [base, { 1: quarter, 2: half, 3: threeQuarters }];
  }),
) as Record<MoveBase, Record<Turns, Permutation>>;

export function movePermutation(move: Move): Permutation {
  return PERMUTATIONS[move.base][move.turns];
}

/** The cube after one move. Never changes the cube passed in. */
export function applyMove(cube: Cube, move: Move): Cube {
  return { stickers: movePermutation(move).map((source) => cube.stickers[source]) };
}

/** The cube after a list of moves, applied in order. */
export function applyMoves(cube: Cube, moves: readonly Move[]): Cube {
  return moves.reduce((current, move) => applyMove(current, move), cube);
}

/** True when every face is a single color (the cube may be held in any orientation). */
export function isSolved(cube: Cube): boolean {
  for (let f = 0; f < 6; f++) {
    const center = cube.stickers[f * 9 + 4];
    for (let i = 0; i < 9; i++) {
      if (cube.stickers[f * 9 + i] !== center) return false;
    }
  }
  return true;
}
