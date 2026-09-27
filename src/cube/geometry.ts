import type { Color, Cube, Face } from './types';
import { FACES } from './types';

/** A 3D point or direction. x points right, y points up, z points toward you (the front). */
export type Vec3 = readonly [number, number, number];

/**
 * Builds a Vec3, turning -0 into 0. JavaScript has both, and test comparisons
 * treat them as different, so every computed vector goes through here.
 */
export function cleanVec(x: number, y: number, z: number): Vec3 {
  return [x + 0, y + 0, z + 0];
}

/**
 * How each face is laid out when you look straight at it:
 * - normal: the direction the face points
 * - right:  the direction columns increase (column 0 is on the left)
 * - down:   the direction rows increase (row 0 is on top)
 *
 * The "looking at it" convention is the standard unfolded-cube (net) layout:
 * U is viewed from above with B at the top; D from below with F at the top;
 * the four side faces are viewed with U at the top.
 */
export const FACE_FRAMES: Record<Face, { normal: Vec3; right: Vec3; down: Vec3 }> = {
  U: { normal: [0, 1, 0], right: [1, 0, 0], down: [0, 0, 1] },
  R: { normal: [1, 0, 0], right: [0, 0, -1], down: [0, -1, 0] },
  F: { normal: [0, 0, 1], right: [1, 0, 0], down: [0, -1, 0] },
  D: { normal: [0, -1, 0], right: [1, 0, 0], down: [0, 0, -1] },
  L: { normal: [-1, 0, 0], right: [0, 0, 1], down: [0, -1, 0] },
  B: { normal: [0, 0, -1], right: [-1, 0, 0], down: [0, -1, 0] },
};

/** One of the 54 places a sticker can be. */
export interface StickerSlot {
  index: number; // 0..53: position in Cube.stickers
  face: Face;
  row: number; // 0..2
  col: number; // 0..2
  position: Vec3; // center of the small cube ("cubie") the sticker is on
  normal: Vec3; // direction the sticker faces
}

function buildSlots(): StickerSlot[] {
  const slots: StickerSlot[] = [];
  FACES.forEach((face, f) => {
    const { normal, right, down } = FACE_FRAMES[face];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        // Start at the face center, then step sideways (col) and downward (row).
        const offsetRight = col - 1;
        const offsetDown = row - 1;
        const position = cleanVec(
          normal[0] + offsetRight * right[0] + offsetDown * down[0],
          normal[1] + offsetRight * right[1] + offsetDown * down[1],
          normal[2] + offsetRight * right[2] + offsetDown * down[2],
        );
        slots.push({ index: f * 9 + row * 3 + col, face, row, col, position, normal });
      }
    }
  });
  return slots;
}

export const STICKER_SLOTS: readonly StickerSlot[] = buildSlots();

/** A text key for a (position, normal) pair, used for fast lookups. */
export function slotKey(position: Vec3, normal: Vec3): string {
  return `${position.join(',')}|${normal.join(',')}`;
}

const SLOT_INDEX_BY_KEY = new Map(
  STICKER_SLOTS.map((s) => [slotKey(s.position, s.normal), s.index]),
);

/** Which slot is at this position facing this direction? Throws if there is none. */
export function findSlot(position: Vec3, normal: Vec3): number {
  const index = SLOT_INDEX_BY_KEY.get(slotKey(position, normal));
  if (index === undefined) {
    throw new Error(`No sticker slot at position ${position.join(',')} facing ${normal.join(',')}`);
  }
  return index;
}

/** Face colors of a solved cube in the reference hold: white up, green front, red right. */
export const HOME_COLORS: Record<Face, Color> = { U: 'W', R: 'R', F: 'G', D: 'Y', L: 'O', B: 'B' };

/** A solved cube in the reference hold. */
export function solved(): Cube {
  return { stickers: STICKER_SLOTS.map((s) => HOME_COLORS[s.face]) };
}
