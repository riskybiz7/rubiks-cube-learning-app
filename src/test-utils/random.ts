import { MOVE_BASES, type Move, type Turns } from '../cube/notation';

/**
 * A small, repeatable random-number generator ("mulberry32"). The same seed always
 * gives the same numbers, so a failing test can be re-run and investigated.
 */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A random list of moves of every kind: faces, wide turns, slices and rotations. */
export function randomMoves(count: number, random: () => number): Move[] {
  return Array.from({ length: count }, () => ({
    base: MOVE_BASES[Math.floor(random() * MOVE_BASES.length)],
    turns: (1 + Math.floor(random() * 3)) as Turns,
  }));
}
