import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { mustParse, type Move } from '../cube/notation';
import type { Cube } from '../cube/types';
import { listSteps, type SolvePlan } from '../solver/plan';
import { DEMO_SCRAMBLE } from './beginner';
import { solveWith, type Method } from './methods';

const cached = new Map<Method, SolvePlan>();

/** The solve of the fixed demo scramble with `method`, used for the Learn screen's examples. */
export function demoPlan(method: Method): SolvePlan {
  let plan = cached.get(method);
  if (!plan) {
    const result = solveWith(method, applyMoves(solved(), mustParse(DEMO_SCRAMBLE)));
    if (!result.ok) throw new Error(result.error);
    plan = result.plan;
    cached.set(method, plan);
  }
  return plan;
}

/** One stage of the demo: the cube it starts from and all its moves. */
export function demoStage(index: number, method: Method): { start: Cube; moves: Move[] } {
  const steps = listSteps(demoPlan(method)).filter((s) => s.stageIndex === index);
  return { start: steps[0].start, moves: steps.flatMap((s) => [...s.step.moves]) };
}
