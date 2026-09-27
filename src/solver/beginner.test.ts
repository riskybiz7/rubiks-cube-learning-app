import { describe, expect, it } from 'vitest';
import { BEGINNER_STAGES } from '../content/beginner';
import { placeName } from '../cube/describe';
import { solved } from '../cube/geometry';
import { applyMoves, isSolved } from '../cube/moves';
import { formatAlgorithm, mustParse } from '../cube/notation';
import type { Cube } from '../cube/types';
import { randomMoves, seededRandom } from '../test-utils/random';
import { centerColor, isCornerInPlace, isSlotSolved, TOP_CORNERS, TOP_EDGES } from './checks';
import { listSteps, selfCheck, solveBeginner, type SolvePlan } from './beginner';

function mustSolve(cube: Cube): SolvePlan {
  const result = solveBeginner(cube);
  if (!result.ok) throw new Error(result.error);
  return result.plan;
}

const scrambles = (() => {
  const random = seededRandom(21);
  return Array.from({ length: 300 }, () => applyMoves(solved(), randomMoves(25, random)));
})();
const plans = scrambles.map(mustSolve);

/** The cube just before each step, for every plan, with the step's stage number. */
const everyStep = plans.flatMap((plan) => listSteps(plan));

describe('solveBeginner', () => {
  it('solves 300 random scrambles, every stage reaching its goal', () => {
    for (const plan of plans) {
      expect(plan.stages.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(selfCheck(plan)).toBeNull();
    }
  });

  it('starts by turning the cube so yellow is on top and green faces you, whatever the hold', () => {
    const fromReference = mustSolve(applyMoves(solved(), mustParse('R U F')));
    expect(formatAlgorithm(fromReference.stages[0].steps[0].moves)).toBe('z2');
    for (const hold of ['y', 'x', "z'", 'x2 y']) {
      const plan = mustSolve(applyMoves(solved(), mustParse(`R U F ${hold}`)));
      const afterFirst = applyMoves(plan.start, plan.stages[0].steps[0].moves);
      expect([centerColor(afterFirst, 'U'), centerColor(afterFirst, 'F')]).toEqual(['Y', 'G']);
    }
  });

  it('handles an already-solved cube', () => {
    const plan = mustSolve(solved());
    expect(selfCheck(plan)).toBeNull();
  });

  it('refuses a cube that cannot be solved, with the validation message', () => {
    const stickers = [...solved().stickers];
    [stickers[7], stickers[19]] = [stickers[19], stickers[7]]; // one edge flipped in place
    const result = solveBeginner({ stickers });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('edge is flipped');
  });

  it("stage 6 holds match the owner's procedure (line left-right; reverse L back-left)", () => {
    for (const { stage, step, start } of everyStep) {
      if (stage.number !== 6 || step.algorithmId !== 'yellow-cross') continue;
      const yellow = [1, 3, 5, 7].filter((square) => start.stickers[square] === 'Y');
      const times = step.moves.length / 6;
      if (times === 2) expect(yellow).toEqual([1, 3]); // back and left: the reverse L of photo 5.0
      if (times === 1 && yellow.length === 2) expect(yellow).toEqual([3, 5]); // a left-right line
    }
  });

  it('stage 8 and 9 always use one hold, and the lesson says which', () => {
    const edgeHolds = new Set<string>();
    const cornerHolds = new Set<string>();
    for (const { stage, step, start } of everyStep) {
      if (stage.number === 8 && step.algorithmId === 'yellow-edges') {
        const matched = TOP_EDGES.filter((slot) => isSlotSolved(start, slot));
        const opposite =
          matched.length === 2 &&
          Math.abs(TOP_EDGES.indexOf(matched[0]) - TOP_EDGES.indexOf(matched[1])) === 2;
        if (matched.length === 2 && !opposite) {
          edgeHolds.add(matched.map((s) => placeName([s.faces[1]])).join(' and '));
        }
      }
      if (stage.number === 9 && step.algorithmId === 'corner-cycle') {
        const placed = TOP_CORNERS.filter((slot) => isCornerInPlace(start, slot));
        if (placed.length === 1) cornerHolds.add(placeName(placed[0].faces));
      }
    }
    expect([...edgeHolds]).toHaveLength(1);
    expect([...cornerHolds]).toEqual(['top-front-right']);
    const [edgeHold] = [...edgeHolds]; // e.g. "right and back"
    const words = edgeHold.split(' and ');
    for (const word of words) expect(BEGINNER_STAGES[7].howTo).toContain(word);
    expect(BEGINNER_STAGES[8].howTo).toContain('front right');
  });

  it('listSteps gives each step the cube it starts from', () => {
    for (const plan of plans.slice(0, 30)) {
      const steps = listSteps(plan);
      let cube = plan.start;
      for (const s of steps) {
        expect(s.start).toEqual(cube);
        cube = applyMoves(cube, s.step.moves);
      }
      expect(isSolved(cube)).toBe(true);
    }
  });

  it('never shows the word "sticker" in a step', () => {
    for (const { step } of everyStep) expect(step.text).not.toMatch(/sticker/i);
  });
});
