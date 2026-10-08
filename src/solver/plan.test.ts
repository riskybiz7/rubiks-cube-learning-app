import { describe, expect, it } from 'vitest';
import { solved } from '../cube/geometry';
import { applyMoves, isSolved } from '../cube/moves';
import { mustParse } from '../cube/notation';
import { centerColor } from './checks';
import { ALREADY_DONE, checkPlan, listSteps, PlanWriter, reorientTo, type SolvePlan } from './plan';

describe('PlanWriter', () => {
  it('skips steps that turn nothing, but keeps "look" steps, and tracks the cube', () => {
    const w = new PlanWriter(solved(), ['First']);
    w.startStage(1);
    w.step('moves', [], 'nothing');
    w.step('check', [], 'look');
    w.step('moves', mustParse('R'), 'turn');
    expect(w.stages[0].steps.map((s) => s.text)).toEqual(['look', 'turn']);
    expect(w.cube).toEqual(applyMoves(solved(), mustParse('R')));
  });

  it('tells the user a stage that needed nothing is already done', () => {
    const w = new PlanWriter(solved(), ['First', 'Second']);
    w.startStage(1);
    w.step('moves', mustParse('R'), 'turn');
    w.startStage(2);
    const stages = w.finish();
    expect(stages.map((s) => s.title)).toEqual(['First', 'Second']);
    expect(stages[1].steps).toEqual([{ kind: 'check', moves: [], text: ALREADY_DONE }]);
  });

  it('describes where a whole-cube turn ends up, or keeps the explanation if none is needed', () => {
    const w = new PlanWriter(solved(), ['First']);
    w.startStage(1);
    w.rotate(mustParse('z2'), 'Turn it over.', 'Already over.');
    w.rotate([], 'Turn it over.', 'Already over.');
    expect(w.stages[0].steps.map((s) => s.text)).toEqual([
      'Turn it over. Hold it with yellow on top, green facing you.',
      'Already over.',
    ]);
  });
});

describe('checkPlan', () => {
  const start = applyMoves(solved(), mustParse('R'));
  const plan = (text: string): SolvePlan => ({
    start,
    stages: [
      { number: 1, title: 'First', steps: [{ kind: 'moves', moves: mustParse(text), text: '' }] },
    ],
  });

  it('passes a plan that meets every stage goal and ends solved', () => {
    expect(checkPlan(plan("R'"), [isSolved])).toBeNull();
  });

  it('names the stage that missed its goal', () => {
    expect(checkPlan(plan('U'), [isSolved])).toContain('Stage 1 (First)');
  });

  it('lists each step with the cube it starts from', () => {
    const [only] = listSteps(plan("R'"));
    expect(only.start).toEqual(start);
  });
});

describe('reorientTo', () => {
  it('finds yellow on top, green facing you, from all 24 ways of holding the cube', () => {
    const holds = ['', 'x', "x'", 'x2', 'z', "z'"].flatMap((a) =>
      ['', 'y', 'y2', "y'"].map((b) => `${a} ${b}`),
    );
    for (const hold of holds) {
      const held = applyMoves(solved(), mustParse(hold));
      const turned = applyMoves(held, reorientTo(held, 'Y', 'G'));
      expect([centerColor(turned, 'U'), centerColor(turned, 'F')], hold).toEqual(['Y', 'G']);
    }
  });
});
