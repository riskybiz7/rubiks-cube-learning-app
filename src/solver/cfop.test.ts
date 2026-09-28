import { describe, expect, it } from 'vitest';
import { CFOP_ALGORITHMS } from '../content/cfop';
import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { mustParse } from '../cube/notation';
import { fromPieces, readPieces } from '../cube/pieces';
import type { Cube } from '../cube/types';
import { CFOP_HOME } from '../test-utils/cfopStates';
import { randomMoves, seededRandom } from '../test-utils/random';
import { centerColor } from './checks';
import { cfopSelfCheck, solveCfop } from './cfop';
import { listSteps, type SolvePlan } from './plan';

function mustSolve(cube: Cube): SolvePlan {
  const result = solveCfop(cube);
  if (!result.ok) throw new Error(result.error);
  return result.plan;
}

const random = seededRandom(31);
const plans = Array.from({ length: 300 }, () =>
  mustSolve(applyMoves(solved(), randomMoves(25, random))),
);
const setOf = (id: string) => CFOP_ALGORITHMS.find((a) => a.id === id)?.set;

describe('solveCfop', () => {
  it('solves 300 random scrambles, every stage reaching its goal', () => {
    for (const plan of plans) {
      expect(plan.stages.map((s) => s.number)).toEqual([1, 2, 3, 4]);
      expect(cfopSelfCheck(plan)).toBeNull();
    }
  });

  it('uses no wide or middle-slice turns', () => {
    for (const { step } of plans.flatMap(listSteps)) {
      for (const move of step.moves) expect('UDRLFBxyz').toContain(move.base);
    }
  });

  it('names the case for every algorithm step, from the right part of the library', () => {
    const expected: Record<number, string> = { 2: 'F2L', 3: 'OLL-2LOOK', 4: 'PLL-2LOOK' };
    for (const { stage, step } of plans.flatMap(listSteps)) {
      if (step.algorithmId) expect(setOf(step.algorithmId)).toBe(expected[stage.number]);
    }
  });

  it('starts by holding yellow on top and green facing you, whatever the hold', () => {
    for (const hold of ['', 'y', 'x', "z'", 'x2 y']) {
      const plan = mustSolve(applyMoves(solved(), mustParse(`R U F ${hold}`)));
      const afterFirst = applyMoves(plan.start, plan.stages[0].steps[0].moves);
      expect([centerColor(afterFirst, 'U'), centerColor(afterFirst, 'F')], hold).toEqual([
        'Y',
        'G',
      ]);
    }
  });

  it('turns nothing for a solved cube, and says each stage is done', () => {
    const plan = mustSolve(CFOP_HOME);
    for (const { step } of listSteps(plan)) expect(step.moves).toEqual([]);
    expect(plan.stages).toHaveLength(4);
  });

  it('only turns the top when the last layer just needs lining up', () => {
    const plan = mustSolve(applyMoves(CFOP_HOME, mustParse('U')));
    const moving = listSteps(plan).filter(({ step }) => step.moves.length > 0);
    expect(moving).toHaveLength(1);
    expect(moving[0].stage.number).toBe(4);
    expect(moving[0].step.text).toContain('line it up');
  });

  it('takes pieces out of the wrong slot first when it has to', () => {
    // Swap the front-right pair with the back-left pair: each is stuck in the other's slot.
    const reading = readPieces(CFOP_HOME);
    if (!reading.ok) throw new Error('bad');
    const { centers, corners, edges } = reading.pieces;
    const c = corners.map((x) => ({ ...x }));
    const e = edges.map((x) => ({ ...x }));
    [c[4], c[6]] = [c[6], c[4]];
    [e[8], e[10]] = [e[10], e[8]];
    const plan = mustSolve(fromPieces({ centers, corners: c, edges: e }));
    expect(cfopSelfCheck(plan)).toBeNull();
    expect(listSteps(plan).some(({ step }) => step.text.startsWith('Take its pieces out'))).toBe(
      true,
    );
  });
});
