import { isSolved } from '../cube/moves';
import { CORNER_SLOTS, EDGE_SLOTS, type CornerSlot } from '../cube/pieces';
import { FACES, type Color, type Cube, type Face } from '../cube/types';

/**
 * Tests for "is this part of the cube done?". Everything is judged against the
 * center colors, so it works however the cube is held.
 */

export function centerColor(cube: Cube, face: Face): Color {
  return cube.stickers[FACES.indexOf(face) * 9 + 4];
}

/** Squares are numbered face by face, 9 per face, so the face is the index ÷ 9. */
export function faceOfSquare(square: number): Face {
  return FACES[Math.floor(square / 9)];
}

type SlotLike = { readonly stickers: readonly number[] };

/** A slot is solved when every square on it matches the center of the face it's on. */
export function isSlotSolved(cube: Cube, slot: SlotLike): boolean {
  return slot.stickers.every((s) => cube.stickers[s] === centerColor(cube, faceOfSquare(s)));
}

export function allSlotsSolved(cube: Cube, slots: readonly SlotLike[]): boolean {
  return slots.every((slot) => isSlotSolved(cube, slot));
}

export const TOP_EDGES = EDGE_SLOTS.slice(0, 4); // UR UF UL UB
export const BOTTOM_EDGES = EDGE_SLOTS.slice(4, 8); // DR DF DL DB
export const MIDDLE_EDGES = EDGE_SLOTS.slice(8, 12); // FR FL BL BR
export const TOP_CORNERS = CORNER_SLOTS.slice(0, 4); // URF UFL ULB UBR
export const BOTTOM_CORNERS = CORNER_SLOTS.slice(4, 8); // DFR DLF DBL DRB

/** The four middle-edge squares of the top face (back, left, right, front). */
export const TOP_EDGE_SQUARES = [1, 3, 5, 7] as const;

const topEdgesAre = (cube: Cube, color: Color) =>
  TOP_EDGE_SQUARES.every((square) => cube.stickers[square] === color);

// ── The goal of each stage ──────────────────────────────────────────────

/** Stage 1: yellow on top with a white "petal" on each side of the yellow center. */
export const isDaisy = (cube: Cube) => centerColor(cube, 'U') === 'Y' && topEdgesAre(cube, 'W');

/** Stage 2: white on top with a white cross whose edges match the side centers. */
export const isWhiteCross = (cube: Cube) =>
  centerColor(cube, 'U') === 'W' && allSlotsSolved(cube, TOP_EDGES);

/** Stage 3: the whole white layer. */
export const isFirstLayer = (cube: Cube) => isWhiteCross(cube) && allSlotsSolved(cube, TOP_CORNERS);

/** Stage 4: white layer plus the middle layer. */
export const isFirstTwoLayers = (cube: Cube) =>
  isFirstLayer(cube) && allSlotsSolved(cube, MIDDLE_EDGES);

/** Stage 5: turned over, so yellow is on top and the two finished layers are underneath. */
export const isFlippedTwoLayers = (cube: Cube) =>
  centerColor(cube, 'U') === 'Y' &&
  allSlotsSolved(cube, [...BOTTOM_EDGES, ...BOTTOM_CORNERS, ...MIDDLE_EDGES]);

/** Stage 6: a yellow cross on top. */
export const isYellowCross = (cube: Cube) => isFlippedTwoLayers(cube) && topEdgesAre(cube, 'Y');

/** Stage 8: the yellow edges also match their side centers. */
export const areYellowEdgesSolved = (cube: Cube) =>
  isFlippedTwoLayers(cube) && allSlotsSolved(cube, TOP_EDGES);

/** A corner is "in place" when it has the right three colors, even if it's twisted. */
export function isCornerInPlace(cube: Cube, slot: CornerSlot): boolean {
  const wanted = slot.faces.map((face) => centerColor(cube, face));
  const present = slot.stickers.map((square) => cube.stickers[square]);
  return wanted.every((color) => present.includes(color));
}

/** Stage 9: every top corner is in its place (maybe twisted). */
export const areYellowCornersPlaced = (cube: Cube) =>
  areYellowEdgesSolved(cube) && TOP_CORNERS.every((slot) => isCornerInPlace(cube, slot));

/** Stage 10: solved. */
export { isSolved };
