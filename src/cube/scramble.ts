import type { Move, Turns } from './notation';

const FACE_BASES = ['U', 'R', 'F', 'D', 'L', 'B'] as const;

/** A random scramble of face turns, never turning the same face twice in a row. */
export function randomScramble(length = 25, random: () => number = Math.random): Move[] {
  const moves: Move[] = [];
  while (moves.length < length) {
    const base = FACE_BASES[Math.floor(random() * FACE_BASES.length)];
    if (moves.length > 0 && moves[moves.length - 1].base === base) continue;
    moves.push({ base, turns: (1 + Math.floor(random() * 3)) as Turns });
  }
  return moves;
}
