import { STICKER_SLOTS } from '../cube/geometry';
import type { Face } from '../cube/types';

/**
 * The unfolded cube ("net") used for entering stickers, in the standard layout:
 *
 *          [U]
 *     [L]  [F]  [R]  [B]
 *          [D]
 *
 * Each face is placed by its top-left corner, in units of whole faces.
 */
const FACE_ORIGIN: Record<Face, { row: number; col: number }> = {
  U: { row: 0, col: 1 },
  L: { row: 1, col: 0 },
  F: { row: 1, col: 1 },
  R: { row: 1, col: 2 },
  B: { row: 1, col: 3 },
  D: { row: 2, col: 1 },
};

export const NET_ROWS = 9;
export const NET_COLS = 12;

/** One square of the map: which sticker it is and where it sits in the grid. */
export interface NetCell {
  slot: number;
  row: number; // 0..8
  col: number; // 0..11
}

export const NET_CELLS: readonly NetCell[] = STICKER_SLOTS.map((s) => ({
  slot: s.index,
  row: FACE_ORIGIN[s.face].row * 3 + s.row,
  col: FACE_ORIGIN[s.face].col * 3 + s.col,
}));
