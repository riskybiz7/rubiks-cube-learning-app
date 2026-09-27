import { STICKER_SLOTS, type Vec3 } from '../cube/geometry';
import { AXIS_INDEX, MOVE_SPECS, type Axis } from '../cube/moves';
import type { Move, Turns } from '../cube/notation';

/** One of the 26 small cubes you can see, and the stickers on it. */
export interface CubieLayout {
  position: Vec3; // each coordinate is -1, 0 or 1
  stickers: { slot: number; normal: Vec3 }[];
}

function buildCubies(): CubieLayout[] {
  const cubies: CubieLayout[] = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue; // the hidden core has no stickers
        const stickers = STICKER_SLOTS.filter(
          (s) => s.position[0] === x && s.position[1] === y && s.position[2] === z,
        ).map((s) => ({ slot: s.index, normal: s.normal }));
        cubies.push({ position: [x, y, z], stickers });
      }
    }
  }
  return cubies;
}

export const CUBIES: readonly CubieLayout[] = buildCubies();

const AXIS_VECTORS: Record<Axis, Vec3> = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };

/** Quarter turns to animate: a counter-clockwise move (3) is shown as one quarter back, not three forward. */
const ANIMATED_QUARTERS: Record<Turns, number> = { 1: 1, 2: 2, 3: -1 };

/** How to animate a move: spin these cubies by `angle` radians around `axis` (right-hand rule). */
export interface MoveRotation {
  axis: Vec3;
  angle: number;
  cubieIndices: number[];
}

export function moveRotation(move: Move): MoveRotation {
  const spec = MOVE_SPECS[move.base];
  const a = AXIS_INDEX[spec.axis];
  return {
    axis: AXIS_VECTORS[spec.axis],
    angle: spec.direction * ANIMATED_QUARTERS[move.turns] * (Math.PI / 2),
    cubieIndices: CUBIES.flatMap((cubie, i) =>
      spec.layers.includes(cubie.position[a]) ? [i] : [],
    ),
  };
}
