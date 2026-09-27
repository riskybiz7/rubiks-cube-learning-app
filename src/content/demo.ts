import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { mustParse, type Move } from '../cube/notation';
import type { Cube } from '../cube/types';
import { listSteps, solveBeginner, type SolvePlan } from '../solver/beginner';
import { DEMO_SCRAMBLE } from './beginner';

let cached: SolvePlan | null = null;

/** The beginner solve of the fixed demo scramble, used for the Learn screen's examples. */
export function demoPlan(): SolvePlan {
  if (!cached) {
    const result = solveBeginner(applyMoves(solved(), mustParse(DEMO_SCRAMBLE)));
    if (!result.ok) throw new Error(result.error);
    cached = result.plan;
  }
  return cached;
}

/** One stage of the demo: the cube it starts from and all its moves. */
export function demoStage(index: number): { start: Cube; moves: Move[] } {
  const steps = listSteps(demoPlan()).filter((s) => s.stageIndex === index);
  return { start: steps[0].start, moves: steps.flatMap((s) => [...s.step.moves]) };
}
