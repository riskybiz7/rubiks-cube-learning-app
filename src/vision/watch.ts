import { labDistance, nearestColor, START_GUESSES, type Lab } from './color';

/** One live reading of the face in the grid, and when it was taken (milliseconds). */
export interface LiveReading {
  time: number;
  readings: Lab[];
}

/** How long the picture must hold steady before a face is taken. Tuned in ④c. */
export const HOLD_MS = 700;
/** How far a square's color may drift and still count as steady. Tuned in ④c. */
export const STEADY_DRIFT = 6;
/** Below this average lightness, the screen asks for more light. Tuned in ④c. */
export const DARK_L = 25;
/** Two centers closer than this are taken to be the same face. Tuned in ④c. */
export const SAME_CENTER = 12;
/** A face with at least this many of its 9 squares reading the same colors is the same face. */
export const SAME_PATTERN = 8;
/** Test mode: after "Take this face", take it anyway if the picture hasn't held still by now. */
export const MANUAL_MAX_WAIT_MS = 3000;

/** True when every square has stayed within STEADY_DRIFT of its newest color for at least holdMs. */
export function isSteady(history: readonly LiveReading[], holdMs = HOLD_MS): boolean {
  if (history.length === 0) return false;
  const newest = history[history.length - 1];
  // Go back to the latest reading that is at least holdMs old.
  let start = -1;
  for (let i = history.length - 1; i >= 0; i--) {
    if (newest.time - history[i].time >= holdMs) {
      start = i;
      break;
    }
  }
  if (start < 0) return false; // not watched for long enough yet
  return history
    .slice(start)
    .every((h) =>
      h.readings.every((lab, k) => labDistance(lab, newest.readings[k]) <= STEADY_DRIFT),
    );
}

/**
 * Whether to take the face now (decisions #58 and #69).
 * - Normal scan: automatically once steady, bright enough and not a face already scanned.
 *   Pressing "Take it now" takes it straight away.
 * - Test mode (manual): only after "Take this face" is pressed. It then waits for the picture
 *   to hold still, counting only readings made after the press, so the jolt of tapping the
 *   screen doesn't blur the face. If it still isn't steady after MANUAL_MAX_WAIT_MS, it takes
 *   it anyway; "Redo last face" is there if that picture is no good.
 */
export function readyToTake(now: {
  manual: boolean; // test mode
  pressedAt: number | null; // when the button was pressed (null: not pressed)
  time: number; // the newest reading's time
  history: readonly LiveReading[];
  dark: boolean;
  repeat: boolean;
}): boolean {
  const { manual, pressedAt, time, history, dark, repeat } = now;
  if (!manual) return pressedAt !== null || (isSteady(history) && !dark && !repeat);
  if (pressedAt === null) return false;
  const sincePress = history.filter((h) => h.time >= pressedAt);
  return isSteady(sincePress) || time - pressedAt >= MANUAL_MAX_WAIT_MS;
}

/** True when the face looks too dark to read well. */
export function isTooDark(readings: readonly Lab[]): boolean {
  return readings.reduce((sum, r) => sum + r.L, 0) / readings.length < DARK_L;
}

/**
 * Which earlier face this one is (-1 if none): its center looks the same, or at least
 * SAME_PATTERN of its 9 squares read as the same colors in the same places. The second test
 * catches the face just taken when a hand's shadow changes how light its center looks.
 */
export function earlierFaceLike(
  face: readonly Lab[],
  earlierFaces: readonly (readonly Lab[])[],
): number {
  const colorsOf = (f: readonly Lab[]) => f.map((lab) => nearestColor(lab, START_GUESSES).color);
  const these = colorsOf(face);
  return earlierFaces.findIndex((earlier) => {
    if (labDistance(earlier[4], face[4]) < SAME_CENTER) return true;
    const those = colorsOf(earlier);
    return these.filter((color, k) => color === those[k]).length >= SAME_PATTERN;
  });
}
