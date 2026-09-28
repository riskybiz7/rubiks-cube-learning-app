import { describe, expect, it } from 'vitest';
import { solved, STICKER_SLOTS } from '../cube/geometry';
import { applyMoves, AXIS_INDEX, MOVE_SPECS, movePermutation } from '../cube/moves';
import { MOVE_BASES, mustParse, type MoveBase } from '../cube/notation';
import type { Cube } from '../cube/types';
import { solveBeginner } from '../solver/beginner';
import { solveCfop } from '../solver/cfop';
import type { SolveResult } from '../solver/plan';
import { randomMoves, seededRandom } from '../test-utils/random';
import { BEGINNER_ALGORITHMS } from './beginner';
import { CFOP_ALGORITHMS } from './cfop';
import { CUBE_TURN_WORDS } from './cubeTurnWords';
import { keyEntries, MOVE_KEY, READING_TIPS, readingTips, type KeyMethod } from './moveKey';

/** Every move letter a method's lessons show: its algorithms plus 300 solver plans. */
function lettersTheLessonsUse(
  algorithms: readonly { moves: string }[],
  solve: (cube: Cube) => SolveResult,
): MoveBase[] {
  const used = new Set<MoveBase>();
  for (const algorithm of algorithms) {
    for (const move of mustParse(algorithm.moves)) used.add(move.base);
  }
  const random = seededRandom(7);
  for (let i = 0; i < 300; i++) {
    const result = solve(applyMoves(solved(), randomMoves(25, random)));
    if (!result.ok) throw new Error(result.error);
    for (const stage of result.plan.stages) {
      for (const step of stage.steps) for (const move of step.moves) used.add(move.base);
    }
  }
  return [...used].sort();
}
const lettersTheBeginnerLessonsUse = () =>
  lettersTheLessonsUse(Object.values(BEGINNER_ALGORITHMS), solveBeginner);
const lettersTheCfopLessonsUse = () => lettersTheLessonsUse(CFOP_ALGORITHMS, solveCfop);

/** The letters a key shows, plus the letters its SPIN/TIP/ROLL words stand for. */
const covered = (method: KeyMethod) =>
  [
    ...new Set([
      ...keyEntries(method).map((entry) => entry.base),
      ...CUBE_TURN_WORDS.map((word) => word.base),
    ]),
  ].sort();

describe('move key: choosing a method', () => {
  it('the beginner key covers exactly the moves the beginner lessons use', () => {
    expect(covered('beginner')).toEqual(lettersTheBeginnerLessonsUse());
  });

  it('the CFOP key covers exactly the moves the CFOP lessons use', () => {
    expect(covered('cfop')).toEqual(lettersTheCfopLessonsUse());
  });

  it('the lesson keys explain cube turns in words (SPIN, TIP, ROLL), not x, y, z', () => {
    for (const method of ['beginner', 'cfop'] as const) {
      const letters = keyEntries(method).map((entry) => entry.base);
      expect(letters).not.toContain('x');
      expect(letters).not.toContain('y');
      expect(letters).not.toContain('z');
    }
  });

  it('only the CFOP key has the back face', () => {
    expect(keyEntries('beginner').map((entry) => entry.base)).not.toContain('B');
    expect(keyEntries('cfop').map((entry) => entry.base)).toContain('B');
  });

  it('"All moves" shows the whole key', () => {
    expect(keyEntries('all')).toEqual(MOVE_KEY);
    expect(readingTips('all')).toEqual(READING_TIPS);
  });

  it('the lesson tips leave out wide turns', () => {
    for (const method of ['beginner', 'cfop'] as const) {
      expect(readingTips(method).join(' ')).not.toMatch(/wide/i);
      expect(readingTips(method).length).toBeGreaterThan(0);
    }
  });
});

describe('move key', () => {
  it('explains every move letter the app understands, once', () => {
    expect(MOVE_KEY.map((entry) => entry.base).sort()).toEqual([...MOVE_BASES].sort());
  });

  it('says where squares move, and the cube model agrees for every move', () => {
    for (const entry of MOVE_KEY) {
      const { axis, layers } = MOVE_SPECS[entry.base];
      // A square on the "from" face that sits in a layer this move turns.
      const square = STICKER_SLOTS.find(
        (s) => s.face === entry.from && layers.includes(s.position[AXIS_INDEX[axis]]),
      );
      expect(square, entry.base).toBeDefined();
      if (!square) continue;
      const after = movePermutation({ base: entry.base, turns: 1 });
      const landsOn = STICKER_SLOTS[after.indexOf(square.index)].face;
      expect(landsOn, `${entry.base}: ${entry.says}`).toBe(entry.to);
    }
  });

  it('uses plain words: "squares", never "stickers"', () => {
    const allText = [...READING_TIPS, ...MOVE_KEY.flatMap((e) => [e.name, e.says])].join(' ');
    expect(allText).not.toMatch(/sticker/i);
  });
});
