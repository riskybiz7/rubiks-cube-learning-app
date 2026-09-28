import type { MoveBase } from '../cube/notation';
import type { Face } from '../cube/types';

/**
 * The move key shown at the bottom of every screen: what each letter means, in plain
 * English. Each entry also records where squares go (`from` face → `to` face) so a test
 * can check the words against the cube model and the key never teaches a wrong direction.
 */

export interface MoveKeyEntry {
  base: MoveBase;
  group: string;
  name: string; // short name, e.g. "Right side"
  says: string; // what the turn does, in plain English
  from: Face; // a square on this face (in the turning layer)…
  to: Face; // …ends up on this face after one turn
}

/** How to read any move, shown above the table. */
export const READING_TIPS: readonly string[] = [
  'A letter on its own means turn that layer a quarter turn clockwise, as if you were looking straight at it.',
  'A \' after the letter (say it "prime"), as in R\', means the same turn the other way: counter-clockwise.',
  'A 2 after the letter, as in R2, means turn it twice (a half turn). Either direction works.',
  'Lowercase letters, or a w after the letter (r or Rw), mean a wide turn: that side plus the middle slice next to it.',
];

export const MOVE_GROUPS: readonly string[] = [
  'Turning one side',
  'Turning the whole cube',
  'Middle slices',
  'Wide turns (two layers at once)',
];

export const MOVE_KEY: readonly MoveKeyEntry[] = [
  // Turning one side
  {
    base: 'U',
    group: 'Turning one side',
    name: 'Top (Up)',
    says: 'Turn the top layer clockwise as you look down on it. The front row moves to the left.',
    from: 'F',
    to: 'L',
  },
  {
    base: 'D',
    group: 'Turning one side',
    name: 'Bottom (Down)',
    says: 'Turn the bottom layer clockwise as seen from underneath. The front row moves to the right.',
    from: 'F',
    to: 'R',
  },
  {
    base: 'R',
    group: 'Turning one side',
    name: 'Right side',
    says: 'Turn the right side clockwise as seen from the right. The front column moves up.',
    from: 'F',
    to: 'U',
  },
  {
    base: 'L',
    group: 'Turning one side',
    name: 'Left side',
    says: 'Turn the left side clockwise as seen from the left. The front column moves down.',
    from: 'F',
    to: 'D',
  },
  {
    base: 'F',
    group: 'Turning one side',
    name: 'Front',
    says: 'Turn the face toward you clockwise, as you look at it. The top row moves to the right.',
    from: 'U',
    to: 'R',
  },
  {
    base: 'B',
    group: 'Turning one side',
    name: 'Back',
    says: 'Turn the back face clockwise as seen from behind. The top row moves to the left (as seen from the front). The beginner lessons never use it.',
    from: 'U',
    to: 'L',
  },
  // Turning the whole cube
  {
    base: 'x',
    group: 'Turning the whole cube',
    name: 'Tip the cube (like R)',
    says: 'Turn the whole cube the way R turns: the front comes up to the top.',
    from: 'F',
    to: 'U',
  },
  {
    base: 'y',
    group: 'Turning the whole cube',
    name: 'Spin the cube (like U)',
    says: 'Turn the whole cube the way U turns: the front goes to the left and the right side comes to face you.',
    from: 'F',
    to: 'L',
  },
  {
    base: 'z',
    group: 'Turning the whole cube',
    name: 'Roll the cube (like F)',
    says: 'Turn the whole cube the way F turns: the top goes to the right.',
    from: 'U',
    to: 'R',
  },
  // Middle slices
  {
    base: 'M',
    group: 'Middle slices',
    name: 'Middle (between left and right)',
    says: 'Turn the middle slice between left and right, the same way as L. The front middle column moves down.',
    from: 'F',
    to: 'D',
  },
  {
    base: 'E',
    group: 'Middle slices',
    name: 'Equator (between top and bottom)',
    says: 'Turn the middle slice between top and bottom, the same way as D. The front middle row moves to the right.',
    from: 'F',
    to: 'R',
  },
  {
    base: 'S',
    group: 'Middle slices',
    name: 'Standing (between front and back)',
    says: 'Turn the middle slice between front and back, the same way as F. The top middle row moves to the right.',
    from: 'U',
    to: 'R',
  },
  // Wide turns
  {
    base: 'u',
    group: 'Wide turns (two layers at once)',
    name: 'Wide top (also Uw)',
    says: 'Turn the top two layers together, like U.',
    from: 'F',
    to: 'L',
  },
  {
    base: 'd',
    group: 'Wide turns (two layers at once)',
    name: 'Wide bottom (also Dw)',
    says: 'Turn the bottom two layers together, like D.',
    from: 'F',
    to: 'R',
  },
  {
    base: 'r',
    group: 'Wide turns (two layers at once)',
    name: 'Wide right (also Rw)',
    says: 'Turn the right two layers together, like R.',
    from: 'F',
    to: 'U',
  },
  {
    base: 'l',
    group: 'Wide turns (two layers at once)',
    name: 'Wide left (also Lw)',
    says: 'Turn the left two layers together, like L.',
    from: 'F',
    to: 'D',
  },
  {
    base: 'f',
    group: 'Wide turns (two layers at once)',
    name: 'Wide front (also Fw)',
    says: 'Turn the front two layers together, like F.',
    from: 'U',
    to: 'R',
  },
  {
    base: 'b',
    group: 'Wide turns (two layers at once)',
    name: 'Wide back (also Bw)',
    says: 'Turn the back two layers together, like B.',
    from: 'U',
    to: 'L',
  },
];
