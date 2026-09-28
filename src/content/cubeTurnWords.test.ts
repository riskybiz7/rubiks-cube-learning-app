import { describe, expect, it } from 'vitest';
import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { mustParse } from '../cube/notation';
import { centerColor } from '../solver/checks';
import { plainMoveLabel, CUBE_TURN_WORDS } from './cubeTurnWords';

describe('cube turns in words (SPIN, TIP, ROLL)', () => {
  it('has one word for every whole-cube turn: x, y, z each one way, the other way, and twice', () => {
    const covered = CUBE_TURN_WORDS.map((w) => `${w.base}${w.turns}`).sort();
    expect(covered).toEqual(['x1', 'x2', 'x3', 'y1', 'y2', 'y3', 'z1', 'z2', 'z3']);
  });

  it('every direction is right: the center it names really moves where it says', () => {
    for (const word of CUBE_TURN_WORDS) {
      const after = applyMoves(solved(), [{ base: word.base, turns: word.turns }]);
      expect(centerColor(after, word.to), word.label).toBe(centerColor(solved(), word.from));
    }
  });

  it('shows words for cube turns and keeps letters for side turns', () => {
    const labels = mustParse("y y' y2 x x' z' R U' F2").map(plainMoveLabel);
    expect(labels).toEqual([
      'SPIN LEFT',
      'SPIN RIGHT',
      'SPIN TWICE',
      'TIP BACK',
      'TIP FORWARD',
      'ROLL LEFT',
      'R',
      "U'",
      'F2',
    ]);
  });

  it('uses plain words: "squares", never "stickers"', () => {
    const allText = CUBE_TURN_WORDS.map((w) => `${w.label} ${w.says}`).join(' ');
    expect(allText).not.toMatch(/sticker/i);
  });
});
