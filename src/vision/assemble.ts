import { HOME_COLORS } from '../cube/geometry';
import { FACES, type Color, type Face } from '../cube/types';
import { validateStickers } from '../cube/validate';
import { SCAN_STEPS } from './guide';
import type { SortedColors } from './sort';

export interface AssembledCube {
  stickers: Color[]; // 54, in the app's sticker order (U R F D L B, each read row by row)
  unsure: number[]; // sticker indices to mark on the review map
  note: string | null; // set when the app had to fix how a face was held
}

export const NOTE_REORDERED =
  'The cube seems to have been turned the other way at one step, so the app put each face where its center belongs.';
export const NOTE_TURNED =
  'One or more faces seemed to be held turned, so the app turned them back. Check the squares against your cube.';
export const NOTE_UNSURE_TURN =
  "Some faces may have been held turned, and the app couldn't tell which way. Check the squares against your cube.";

/** A face's 9 squares turned a quarter turn clockwise, as the camera sees it. Works on any list of 9. */
export function turnFace<T>(nine: readonly T[]): T[] {
  return nine.map((_, i) => nine[(2 - (i % 3)) * 3 + Math.floor(i / 3)]);
}

/**
 * For each of the 54 sticker places, which scanned square (scan position 0–53) goes there.
 * Moving positions instead of colors lets the unsure marks travel with their squares.
 */
type Placement = number[];

function placeSteps(faceOfStep: readonly Face[]): Placement {
  const placement: Placement = new Array(54);
  faceOfStep.forEach((face, step) => {
    const f = FACES.indexOf(face);
    for (let k = 0; k < 9; k++) placement[f * 9 + k] = step * 9 + k;
  });
  return placement;
}

/** Step i is face SCAN_STEPS[i].face, as the user was told. */
const asInstructed = (): Placement => placeSteps(SCAN_STEPS.map((step) => step.face));

/** Each scanned face goes where its center color belongs on a standard cube. */
function byCenter(colors: readonly Color[]): Placement {
  const faceOfColor = new Map(FACES.map((face) => [HOME_COLORS[face], face]));
  return placeSteps(SCAN_STEPS.map((_, step) => faceOfColor.get(colors[step * 9 + 4])!));
}

/** The placement with each face f turned quarterTurns[f] quarter turns. */
function turned(placement: Placement, quarterTurns: readonly number[]): Placement {
  const out = [...placement];
  quarterTurns.forEach((q, f) => {
    let nine = placement.slice(f * 9, f * 9 + 9);
    for (let i = 0; i < q; i++) nine = turnFace(nine);
    nine.forEach((pos, k) => (out[f * 9 + k] = pos));
  });
  return out;
}

const passes = (placement: Placement, colors: readonly Color[]) =>
  validateStickers(placement.map((pos) => colors[pos])).ok;

/** Every passing version of the placement with the fewest turned faces (none if nothing passes). */
function fewestTurnsThatPass(start: Placement, colors: readonly Color[]): Placement[] {
  let fewest = Infinity;
  let found: Placement[] = [];
  for (let combo = 1; combo < 4 ** 6; combo++) {
    const quarterTurns = FACES.map((_, f) => Math.floor(combo / 4 ** f) % 4);
    const facesTurned = quarterTurns.filter((q) => q > 0).length;
    if (facesTurned > fewest) continue;
    const placement = turned(start, quarterTurns);
    if (!passes(placement, colors)) continue;
    if (facesTurned < fewest) {
      fewest = facesTurned;
      found = [];
    }
    found.push(placement);
  }
  return found;
}

/**
 * Puts the 6 scanned faces together (decision #60):
 * 1. As instructed.
 * 2. If that fails the checks: by center color. This fixes a SPIN or TIP made the other way;
 *    each face is still the right way up, it was just scanned at a different step.
 * 3. If that fails too: every way of turning the faces (4^6 = 4,096), keeping the one with the
 *    fewest turned faces, but only if exactly one passes.
 * If nothing passes, the as-instructed cube goes to the review map; "Check my cube" explains.
 */
export function assemble(sorted: SortedColors): AssembledCube {
  const { colors } = sorted;
  const unsure = new Set(sorted.unsure);
  const result = (placement: Placement, note: string | null): AssembledCube => ({
    stickers: placement.map((pos) => colors[pos]),
    unsure: placement.flatMap((pos, index) => (unsure.has(pos) ? [index] : [])),
    note,
  });

  const instructed = asInstructed();
  if (passes(instructed, colors)) return result(instructed, null);
  const centered = byCenter(colors);
  const reordered = centered.some((pos, i) => pos !== instructed[i]);
  if (reordered && passes(centered, colors)) return result(centered, NOTE_REORDERED);

  for (const start of reordered ? [instructed, centered] : [instructed]) {
    const fixes = fewestTurnsThatPass(start, colors);
    if (fixes.length === 1) return result(fixes[0], NOTE_TURNED);
    if (fixes.length > 1) return result(instructed, NOTE_UNSURE_TURN);
  }
  return result(instructed, null);
}
