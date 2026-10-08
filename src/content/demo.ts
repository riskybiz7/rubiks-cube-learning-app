import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { mustParse } from '../cube/notation';
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

/** The solve of the fixed demo scramble, used for the Learn screen's examples. */
export function demoPlan(method: Method, choice: LastLayerChoice = TWO_LOOK): SolvePlan {
  const key = `${method}/${choice.oll}/${choice.pll}`;
  let plan = cached.get(key);
  if (!plan) {
    const result = solveWith(method, applyMoves(solved(), mustParse(DEMO_SCRAMBLE)), choice);
    if (!result.ok) throw new Error(result.error);
    plan = result.plan;
    cached.set(key, plan);
  }
  return plan;
}

/** One lesson's example: the cube it starts from, its steps, and all its moves. */
export function demoLesson(lesson: number, method: Method) {
  const [choice, stage] = method === 'cfop' ? CFOP_DEMO[lesson] : [TWO_LOOK, lesson];
  const steps = listSteps(demoPlan(method, choice)).filter((s) => s.stageIndex === stage);
  return { start: steps[0].start, steps, moves: steps.flatMap((s) => [...s.step.moves]) };
}
