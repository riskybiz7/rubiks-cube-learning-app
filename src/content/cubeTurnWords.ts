import { formatMove, type Move, type Turns } from '../cube/notation';
import type { Face } from '../cube/types';

/**
 * Whole-cube turns (x, y, z) written as plain words for beginners: SPIN, TIP and ROLL,
 * each with a direction. Each entry also records where one center goes (`from` face →
 * `to` face) so a test can check the words against the cube model.
 */
export interface CubeTurnWord {
  base: 'x' | 'y' | 'z';
  turns: Turns; // 1 = the letter alone, 2 = twice, 3 = the ' (other way) version
  label: string; // shown instead of the letter, e.g. "SPIN LEFT"
  says: string; // what you do with your hands
  from: Face; // the center on this face…
  to: Face; // …ends up on this face
}

export const CUBE_TURN_WORDS: readonly CubeTurnWord[] = [
  {
    base: 'y',
    turns: 1,
    label: 'SPIN LEFT',
    says: 'Keep the top on top and turn the cube so the front goes to the left. The right side comes to face you.',
    from: 'F',
    to: 'L',
  },
  {
    base: 'y',
    turns: 3,
    label: 'SPIN RIGHT',
    says: 'Keep the top on top and turn the cube so the front goes to the right. The left side comes to face you.',
    from: 'F',
    to: 'R',
  },
  {
    base: 'y',
    turns: 2,
    label: 'SPIN TWICE',
    says: 'Keep the top on top and turn the cube halfway round, either way. The back comes to face you.',
    from: 'F',
    to: 'B',
  },
  {
    base: 'x',
    turns: 1,
    label: 'TIP BACK',
    says: 'Tip the top away from you, so the front comes up to the top.',
    from: 'F',
    to: 'U',
  },
  {
    base: 'x',
    turns: 3,
    label: 'TIP FORWARD',
    says: 'Tip the top toward you, so it comes down to the front.',
    from: 'U',
    to: 'F',
  },
  {
    base: 'x',
    turns: 2,
    label: 'TIP TWICE',
    says: 'Tip the cube over twice, either way, so it is upside down and the back faces you.',
    from: 'F',
    to: 'B',
  },
  {
    base: 'z',
    turns: 1,
    label: 'ROLL RIGHT',
    says: 'Keep the front facing you and roll the cube so the top goes to the right.',
    from: 'U',
    to: 'R',
  },
  {
    base: 'z',
    turns: 3,
    label: 'ROLL LEFT',
    says: 'Keep the front facing you and roll the cube so the top goes to the left.',
    from: 'U',
    to: 'L',
  },
  {
    base: 'z',
    turns: 2,
    label: 'ROLL TWICE',
    says: 'Keep the front facing you and roll the cube over twice, either way, so it is upside down.',
    from: 'R',
    to: 'L',
  },
];

/** How the lesson screens write a move: words for whole-cube turns, letters for the rest. */
export function plainMoveLabel(move: Move): string {
  const word = CUBE_TURN_WORDS.find((w) => w.base === move.base && w.turns === move.turns);
  return word ? word.label : formatMove(move);
}
