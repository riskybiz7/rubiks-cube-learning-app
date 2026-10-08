import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { mustParse } from '../cube/notation';
import type { Cube } from '../cube/types';
import { listSteps, type SolvePlan } from '../solver/plan';
import { DEMO_SCRAMBLE } from './beginner';
import { TWO_LOOK, type LastLayerChoice } from './cfop';
import { solveWith, type Method } from './methods';

const FULL: LastLayerChoice = { oll: 'full', pll: 'full' };

/** Which demo solve, and which of its stages, each CFOP lesson shows. */
const CFOP_DEMO: readonly (readonly [LastLayerChoice, number])[] = [
  [TWO_LOOK, 0],
  [TWO_LOOK, 1],
  [TWO_LOOK, 2],
  [TWO_LOOK, 3],
  [FULL, 2],
  [FULL, 3],
];

const cached = new Map<string, SolvePlan>();

const DEMO_CUBE: Cube = applyMoves(solved(), mustParse(DEMO_SCRAMBLE));

/**
 * The solve used for the Learn screen's examples: of your entered cube if one is given,
 * otherwise of the fixed demo scramble.
 */
export function demoPlan(
  method: Method,
  choice: LastLayerChoice = TWO_LOOK,
  start: Cube = DEMO_CUBE,
): SolvePlan {
  const key = `${method}/${choice.oll}/${choice.pll}/${start.stickers.join('')}`;
  let plan = cached.get(key);
  if (!plan) {
    const result = solveWith(method, start, choice);
    if (!result.ok) throw new Error(result.error);
    plan = result.plan;
    cached.set(key, plan);
  }
  return plan;
}

/**
 * One lesson's example: the cube it starts from, its steps, and all its moves. With `mine`
 * (your entered cube), it's that stage of solving your cube.
 */
export function demoLesson(lesson: number, method: Method, mine?: Cube | null) {
  const [choice, stage] = method === 'cfop' ? CFOP_DEMO[lesson] : [TWO_LOOK, lesson];
  const plan = demoPlan(method, choice, mine ?? DEMO_CUBE);
  const steps = listSteps(plan).filter((s) => s.stageIndex === stage);
  return { start: steps[0].start, steps, moves: steps.flatMap((s) => [...s.step.moves]) };
}
