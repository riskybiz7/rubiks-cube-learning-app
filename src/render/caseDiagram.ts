import { STICKER_SLOTS } from '../cube/geometry';
import type { Color, Cube, Face } from '../cube/types';

/**
 * The top layer seen from above, for the flat case diagrams on OLL and PLL cards: the
 * top face, plus the top row of each side, with the back at the top of the picture.
 */
export interface TopView {
  top: Color[]; // 9, row by row, back row first
  back: Color[]; // 3, left to right as seen from above
  right: Color[]; // 3, back to front
  front: Color[]; // 3, left to right
  left: Color[]; // 3, back to front
}

const at = (face: Face, row: number, col: number) =>
  STICKER_SLOTS.find((s) => s.face === face && s.row === row && s.col === col)!.index;

export function topView(cube: Cube): TopView {
  const color = (face: Face, row: number, col: number) => cube.stickers[at(face, row, col)];
  return {
    top: [0, 1, 2].flatMap((row) => [0, 1, 2].map((col) => color('U', row, col))),
    back: [2, 1, 0].map((col) => color('B', 0, col)),
    right: [2, 1, 0].map((col) => color('R', 0, col)),
    front: [0, 1, 2].map((col) => color('F', 0, col)),
    left: [0, 1, 2].map((col) => color('L', 0, col)),
  };
}
