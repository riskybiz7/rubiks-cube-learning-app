/** The six sticker colors, by first letter: White, Yellow, Green, Blue, Red, Orange. */
export type Color = 'W' | 'Y' | 'G' | 'B' | 'R' | 'O';

/** The six face positions: Up, Right, Front, Down, Left, Back. */
export type Face = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

/** The standard face order used everywhere in this app. */
export const FACES: readonly Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];

/**
 * A cube state: 54 sticker colors. Faces come in FACES order, 9 stickers each,
 * and each face is read row by row (see FACE_FRAMES in geometry.ts for which
 * way the rows and columns run on each face).
 */
export interface Cube {
  readonly stickers: readonly Color[];
}
