import { describe, expect, it } from 'vitest';
import { DEMO_SCRAMBLE } from '../content/beginner';
import type { LookChoice } from '../content/cfop';
import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { mustParse } from '../cube/notation';
import { solveCfop } from '../solver/cfop';
import { listSteps, type PlannedStep } from '../solver/plan';
import { indexAfterChoiceChange } from './lastLayer';

const start = applyMoves(solved(), mustParse(DEMO_SCRAMBLE));
const steps = (oll: LookChoice) => {
  const result = solveCfop(start, { oll, pll: 'two-look' });
  if (!result.ok) throw new Error(result.error);
  return listSteps(result.plan);
};
const firstOfStage = (list: readonly PlannedStep[], stage: number) =>
  list.findIndex((s) => s.stageIndex === stage);

describe('switching 2-look/full mid-solve (D10)', () => {
  const before = steps('two-look');
  const after = steps('full');

  it('the cross and F2L are the same steps either way', () => {
    const early = firstOfStage(before, 2);
    expect(firstOfStage(after, 2)).toBe(early);
    expect(after.slice(0, early).map((s) => s.step)).toEqual(
      before.slice(0, early).map((s) => s.step),
    );
  });

  it('keeps your step in the cross or F2L', () => {
    const inF2L = firstOfStage(before, 1) + 1;
    expect(indexAfterChoiceChange(before, after, inF2L)).toBe(inF2L);
    expect(indexAfterChoiceChange(before, after, 0)).toBe(0);
  });

  it('goes to the start of the yellow top from anywhere later', () => {
    expect(indexAfterChoiceChange(before, after, before.length - 1)).toBe(firstOfStage(after, 2));
    expect(indexAfterChoiceChange(before, after, firstOfStage(before, 2))).toBe(
      firstOfStage(after, 2),
    );
  });

  it('tapping the choice that is already on keeps your step, even in the last layer', () => {
    // Found in the final review: re-tapping "2-look" on step 20 jumped back to the yellow top.
    const late = before.length - 1;
    expect(indexAfterChoiceChange(before, steps('two-look'), late)).toBe(late);
  });
});
