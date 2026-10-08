import type { PlannedStep } from '../solver/plan';

const LAST_LAYER = 2; // stage index of the yellow top; the cross and F2L come before it

/** Same steps, in the same order (e.g. the choice that was already on was tapped again). */
const sameSteps = (a: readonly PlannedStep[], b: readonly PlannedStep[]) =>
  JSON.stringify(a.map((s) => s.step)) === JSON.stringify(b.map((s) => s.step));

/**
 * Where to be after switching 2-look/full on the Solve screen. The cross and F2L steps
 * don't depend on the choice, so stay put there; from the last layer on, the steps
 * change, so start the yellow top again. If nothing changed, stay put.
 */
export function indexAfterChoiceChange(
  before: readonly PlannedStep[],
  after: readonly PlannedStep[],
  index: number,
): number {
  if (before[index] && before[index].stageIndex < LAST_LAYER) return index;
  if (sameSteps(before, after)) return index;
  return Math.max(
    0,
    after.findIndex((s) => s.stageIndex === LAST_LAYER),
  );
}
