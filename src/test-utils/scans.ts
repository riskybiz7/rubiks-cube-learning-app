import { applyMoves } from '../cube/moves';
import { mustParse } from '../cube/notation';
import { FACES, type Color, type Cube } from '../cube/types';
import { START_GUESSES, type Lab } from '../vision/color';
import { SCAN_STEPS } from '../vision/guide';

/** The holds the guided scan asks for, in order. */
export const INSTRUCTED_HOLDS: readonly string[] = SCAN_STEPS.map((step) => step.hold);

/**
 * What a camera sees at each step: the cube model plays the camera. For each hold, turn the
 * whole cube that way and read its front face row by row (see guide.test.ts for why that's
 * the camera's view).
 */
export function cameraViews(cube: Cube, holds: readonly string[] = INSTRUCTED_HOLDS): Color[][] {
  const front = FACES.indexOf('F') * 9;
  return holds.map((hold) => [
    ...applyMoves(cube, mustParse(hold)).stickers.slice(front, front + 9),
  ]);
}

/**
 * Lab readings for what the camera saw: each color looks like its starting guess, plus up to
 * ± `noise` on each of L, a and b, plus an overall `shift` (colored light).
 */
export function readingsOf(
  views: readonly (readonly Color[])[],
  options: { noise?: number; random?: () => number; shift?: Partial<Lab> } = {},
): Lab[][] {
  const noise = options.noise ?? 0;
  const random = options.random ?? (() => 0.5);
  const jitter = () => (random() - 0.5) * 2 * noise;
  const shift = { L: 0, a: 0, b: 0, ...options.shift };
  return views.map((view) =>
    view.map((color) => {
      const guess = START_GUESSES[color];
      return {
        L: guess.L + shift.L + jitter(),
        a: guess.a + shift.a + jitter(),
        b: guess.b + shift.b + jitter(),
      };
    }),
  );
}
