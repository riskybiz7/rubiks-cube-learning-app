import type { Color } from '../cube/types';
import { labDistance, type Lab } from './color';

const COLORS: readonly Color[] = ['W', 'Y', 'G', 'B', 'R', 'O'];

/** A gap smaller than this between the best and next-best color makes a square unsure. Tuned in ④c. */
export const UNSURE_GAP = 10;

export interface SortedColors {
  colors: Color[]; // 54, in scan order: step 0's 9 squares, then step 1's, …
  unsure: number[]; // scan positions (0–53) that were close calls
}

/** Every ordering of a list (6 colors give 720 orderings). */
function orderings<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]];
  return items.flatMap((first, i) =>
    orderings([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [first, ...rest]),
  );
}

/**
 * Names the 6 centers: tries all 720 ways of giving the 6 colors to the 6 centers and keeps the
 * one closest to the guesses overall. Comparing the centers together copes with colored light:
 * under a warm lamp red and orange both look more orange, but red still looks the redder of the two.
 */
export function nameCenters(centers: readonly Lab[], guesses: Record<Color, Lab>): Color[] {
  let best: Color[] = [...COLORS];
  let bestCost = Infinity;
  for (const order of orderings(COLORS)) {
    const cost = order.reduce((sum, color, i) => sum + labDistance(centers[i], guesses[color]), 0);
    if (cost < bestCost) {
      bestCost = cost;
      best = order;
    }
  }
  return best;
}

/**
 * Sorts all 54 readings into the 6 colors, exactly 9 of each (decision #59, spec §6):
 * 1. Name the centers. Each center is the reference for its color under this light.
 * 2. Every other square takes the color of the center it looks closest to.
 * 3. While a color has more than 9, move the square that costs least to move, from a color with
 *    too many to a color with too few. Like the check's "10 reds and 8 oranges": the red square
 *    that looks most orange becomes orange.
 * Squares moved in step 3, and close calls, are unsure.
 */
export function sortColors(
  faces: readonly (readonly Lab[])[],
  guesses: Record<Color, Lab>,
): SortedColors {
  const readings = faces.flat();
  const centerColors = nameCenters(
    faces.map((face) => face[4]),
    guesses,
  );
  const reference = {} as Record<Color, Lab>;
  centerColors.forEach((color, step) => (reference[color] = faces[step][4]));

  const isCenter = (pos: number) => pos % 9 === 4;
  const distance = (pos: number, color: Color) => labDistance(readings[pos], reference[color]);
  const closestFirst = (pos: number) =>
    [...COLORS].sort((p, q) => distance(pos, p) - distance(pos, q));

  // Steps 1 and 2.
  const colors: Color[] = readings.map((_, pos) =>
    isCenter(pos) ? centerColors[Math.floor(pos / 9)] : closestFirst(pos)[0],
  );

  // Step 3.
  const moved = new Set<number>();
  const count = (color: Color) => colors.filter((c) => c === color).length;
  while (COLORS.some((color) => count(color) > 9)) {
    const tooMany = COLORS.filter((color) => count(color) > 9);
    const tooFew = COLORS.filter((color) => count(color) < 9);
    let best = { pos: -1, to: tooFew[0], cost: Infinity };
    for (let pos = 0; pos < colors.length; pos++) {
      if (isCenter(pos) || !tooMany.includes(colors[pos])) continue;
      for (const to of tooFew) {
        const cost = distance(pos, to) - distance(pos, colors[pos]);
        if (cost < best.cost) best = { pos, to, cost };
      }
    }
    colors[best.pos] = best.to;
    moved.add(best.pos);
  }

  const unsure = colors.flatMap((_, pos) => {
    if (isCenter(pos)) return [];
    if (moved.has(pos)) return [pos];
    const [first, second] = closestFirst(pos);
    return distance(pos, second) - distance(pos, first) < UNSURE_GAP ? [pos] : [];
  });
  return { colors, unsure };
}
