import { applyMove } from '../cube/moves';
import type { Move, MoveBase, Turns } from '../cube/notation';
import type { Cube } from '../cube/types';

const FACE_TURNS: readonly Move[] = (['U', 'D', 'R', 'L', 'F', 'B'] as const).flatMap((base) =>
  ([1, 2, 3] as Turns[]).map((turns) => ({ base, turns })),
);
const OPPOSITE: Partial<Record<MoveBase, MoveBase>> = {
  U: 'D',
  D: 'U',
  R: 'L',
  L: 'R',
  F: 'B',
  B: 'F',
};

/**
 * The shortest list of face turns (up to maxDepth) that makes `goal` true, or null.
 * Tries every 1-move sequence, then every 2-move sequence, and so on ("iterative
 * deepening"), skipping orders that can't be shortest: turning the same face twice
 * in a row, or turning opposite faces in both orders (they don't affect each other).
 */
export function searchMoves(
  start: Cube,
  goal: (cube: Cube) => boolean,
  maxDepth: number,
): Move[] | null {
  const path: Move[] = [];
  const explore = (cube: Cube, remaining: number): boolean => {
    if (remaining === 0) return goal(cube);
    const last = path[path.length - 1];
    for (const move of FACE_TURNS) {
      if (last && move.base === last.base) continue;
      if (last && OPPOSITE[move.base] === last.base && move.base < last.base) continue;
      path.push(move);
      if (explore(applyMove(cube, move), remaining - 1)) return true;
      path.pop();
    }
    return false;
  };
  for (let depth = 0; depth <= maxDepth; depth++) {
    if (explore(start, depth)) return path;
  }
  return null;
}
