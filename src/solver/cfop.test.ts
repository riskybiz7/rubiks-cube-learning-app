import { describe, expect, it } from 'vitest';
import { DEMO_SCRAMBLE } from '../content/beginner';
import {
  CFOP_ALGORITHMS,
  TWO_LOOK,
  caseCube,
  cfopStageTitles,
  inSet,
  type LastLayerChoice,
} from '../content/cfop';
import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { formatAlgorithm, mustParse } from '../cube/notation';
import { fromPieces, readPieces } from '../cube/pieces';
import type { Cube } from '../cube/types';
import { CFOP_HOME } from '../test-utils/cfopStates';
import { randomMoves, seededRandom } from '../test-utils/random';
import { centerColor } from './checks';
import { cfopSelfCheck, solveCfop } from './cfop';
import { crossMoves } from './cross';
import { ALREADY_DONE, listSteps, reorientTo, type SolvePlan } from './plan';

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

  it('never shows two turns of the same layer in a row within a step (e.g. "U\' U")', () => {
    for (const { step } of plans.flatMap(listSteps)) {
      step.moves.forEach((move, i) => {
        if (i > 0) expect(move.base, step.text).not.toBe(step.moves[i - 1].base);
      });
    }
  });

  it('shows every algorithm exactly as on its card; lining up the case is its own top-turn step', () => {
    for (const { step } of plans.flatMap(listSteps)) {
      if (!step.algorithmId) continue;
      const card = CFOP_ALGORITHMS.find((a) => a.id === step.algorithmId)!;
      expect(formatAlgorithm(step.moves), step.text).toBe(formatAlgorithm(mustParse(card.moves)));
    }
    const lineUps = plans
      .flatMap(listSteps)
      .filter(({ step }) => step.text.startsWith('Turn the top to line up'));
    expect(lineUps.length).toBeGreaterThan(0);
    for (const { step } of lineUps) expect(step.moves.every((m) => m.base === 'U')).toBe(true);
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

  it('never takes pieces out of slots more than twice in a row (1,000 cubes with the cross done)', () => {
    const random = seededRandom(47);
    let most = 0;
    for (let i = 0; i < 1000; i++) {
      // A random cube with the cross already done: the hardest mix for F2L.
      const scrambled = applyMoves(CFOP_HOME, randomMoves(25, random));
      const held = applyMoves(scrambled, reorientTo(scrambled, 'Y', 'G'));
      const sides = (['F', 'R', 'B', 'L'] as const).map((f) => centerColor(held, f));
      const plan = mustSolve(applyMoves(held, crossMoves(held, sides)!));
      let inARow = 0;
      for (const { step } of listSteps(plan)) {
        if (step.text.startsWith('Take its pieces out')) inARow++;
        if (step.algorithmId) inARow = 0;
        most = Math.max(most, inARow);
      }
    }
    expect(most).toBeLessThanOrEqual(2);
  }, 30_000);

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

const CHOICES: LastLayerChoice[] = [
  { oll: 'two-look', pll: 'two-look' },
  { oll: 'full', pll: 'two-look' },
  { oll: 'two-look', pll: 'full' },
  { oll: 'full', pll: 'full' },
];

describe('solveCfop: 2-look or full', () => {
  it('solves 200 scrambles with every choice, and passes its own check', () => {
    const random = seededRandom(41);
    for (let n = 0; n < 200; n++) {
      const start = applyMoves(solved(), randomMoves(25, random));
      for (const choice of CHOICES) {
        const result = solveCfop(start, choice);
        expect(result.ok, `${n} ${choice.oll}/${choice.pll}`).toBe(true);
        if (result.ok) expect(cfopSelfCheck(result.plan)).toBeNull();
      }
    }
  }, 60_000);

  it('full OLL is one look: at most a turn of the top and one algorithm, from the 57', () => {
    const random = seededRandom(42);
    const full = new Set(inSet('OLL').map((a) => a.id));
    for (let n = 0; n < 100; n++) {
      const result = solveCfop(applyMoves(solved(), randomMoves(25, random)), {
        oll: 'full',
        pll: 'two-look',
      });
      if (!result.ok) throw new Error(result.error);
      const stage = result.plan.stages[2];
      expect(stage.steps.length).toBeLessThanOrEqual(2);
      for (const step of stage.steps)
        if (step.algorithmId) expect(full.has(step.algorithmId)).toBe(true);
    }
  });

  it('full PLL is one look: a turn, one algorithm from the 21, and a final turn at most', () => {
    const random = seededRandom(43);
    const full = new Set(inSet('PLL').map((a) => a.id));
    for (let n = 0; n < 100; n++) {
      const result = solveCfop(applyMoves(solved(), randomMoves(25, random)), {
        oll: 'two-look',
        pll: 'full',
      });
      if (!result.ok) throw new Error(result.error);
      const stage = result.plan.stages[3];
      expect(stage.steps.length).toBeLessThanOrEqual(3);
      for (const step of stage.steps)
        if (step.algorithmId) expect(full.has(step.algorithmId)).toBe(true);
    }
  });

  it('a top already yellow with full OLL: the stage says so and turns nothing', () => {
    // The T-perm case (top all yellow, pieces out of place), held upside down.
    const start = applyMoves(caseCube("R U R' U' R' F R2 U' R' U' R U R' F'"), mustParse('x2 y'));
    const result = solveCfop(start, { oll: 'full', pll: 'full' });
    if (!result.ok) throw new Error(result.error);
    expect(result.plan.stages[2].steps).toEqual([{ kind: 'check', moves: [], text: ALREADY_DONE }]);
  });

  it('names the stages for the choice', () => {
    const choice: LastLayerChoice = { oll: 'full', pll: 'two-look' };
    const result = solveCfop(applyMoves(solved(), mustParse(DEMO_SCRAMBLE)), choice);
    if (!result.ok) throw new Error(result.error);
    expect(result.plan.stages.map((s) => s.title)).toEqual(cfopStageTitles(choice));
  });

  it('2-look stays the default', () => {
    const start = applyMoves(solved(), mustParse(DEMO_SCRAMBLE));
    expect(solveCfop(start)).toEqual(solveCfop(start, TWO_LOOK));
  });
});
