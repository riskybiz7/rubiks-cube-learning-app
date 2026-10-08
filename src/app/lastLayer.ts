import type { PlannedStep } from '../solver/plan';

const LAST_LAYER = 2; // stage index of the yellow top; the cross and F2L come before it

/**
 * Where to be after switching 2-look/full on the Solve screen. The cross and F2L steps
 * don't depend on the choice, so stay put there; from the last layer on, the steps
 * change, so start the yellow top again.
 */
export function indexAfterChoiceChange(
  before: readonly PlannedStep[],
  after: readonly PlannedStep[],
  index: number,
): number {
  if (before[index] && before[index].stageIndex < LAST_LAYER) return index;
  return Math.max(
    0,
    after.findIndex((s) => s.stageIndex === LAST_LAYER),
  );
}
