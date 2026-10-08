import { holdDescription } from '../cube/describe';
import { applyMoves, isSolved } from '../cube/moves';
import { mustParse, type Move, type MoveBase, type Turns } from '../cube/notation';
import type { Color, Cube } from '../cube/types';
import { centerColor } from './checks';

/**
 * What every teaching solver shares: the plan it returns (stages made of steps), a
 * writer that builds one while keeping track of the cube, and the self-check that
 * replays a plan before anyone sees it.
 */

export interface SolveStep {
  kind: 'moves' | 'rotate' | 'check'; // turn layers / turn the whole cube / just look
  moves: readonly Move[];
  text: string;
  algorithmId?: string;
}

export interface SolveStage {
  number: number;
  title: string;
  steps: SolveStep[];
}

export interface SolvePlan {
  start: Cube;
  stages: SolveStage[];
}

export type SolveResult = { ok: true; plan: SolvePlan } | { ok: false; error: string };

/** Turning a layer (or the whole cube) 0, 1, 2 or 3 quarter turns. */
export const quarterTurns = (base: MoveBase): Move[][] => [
  [],
  [{ base, turns: 1 }],
  [{ base, turns: 2 }],
  [{ base, turns: 3 as Turns }],
];
export const TOP_TURNS = quarterTurns('U');
export const CUBE_TURNS = quarterTurns('y'); // turn the whole cube, keeping the same face on top

/** Every way to reorient the whole cube, shortest first. */
const REORIENTATIONS: Move[][] = [
  '',
  'x',
  "x'",
  'x2',
  'y',
  "y'",
  'y2',
  'z',
  "z'",
  'z2',
  ...['x', "x'", 'x2', 'z', "z'"].flatMap((a) => ['y', "y'", 'y2'].map((b) => `${a} ${b}`)),
].map(mustParse);

/** The whole-cube turn that puts `top` on top and `front` facing you. */
export function reorientTo(cube: Cube, top: Color, front: Color): Move[] {
  const moves = REORIENTATIONS.find((r) => {
    const turned = applyMoves(cube, r);
    return centerColor(turned, 'U') === top && centerColor(turned, 'F') === front;
  });
  if (!moves) throw new Error(`Couldn't find a way to hold the cube with ${top} on top.`);
  return moves;
}

const lowerFirst = (text: string) => text[0].toLowerCase() + text.slice(1);

export const ALREADY_DONE = 'This stage is already done, so move on.';
export const ALREADY_SOLVED = "Your cube is already solved! There's nothing to do.";

/** The plan for a cube that's already solved: nothing to turn, in any stage (owner, 2026-10-08). */
export function alreadySolvedPlan(start: Cube, titles: readonly string[]): SolvePlan {
  const w = new PlanWriter(start, titles);
  titles.forEach((_, i) => w.startStage(i + 1));
  const stages = w.finish();
  stages[0].steps = [{ kind: 'check', moves: [], text: ALREADY_SOLVED }];
  return { start, stages };
}

/** Collects stages and steps, keeping track of the cube after each step. */
export class PlanWriter {
  cube: Cube;
  readonly stages: SolveStage[] = [];
  private readonly titles: readonly string[];

  constructor(start: Cube, titles: readonly string[]) {
    this.cube = start;
    this.titles = titles;
  }

  startStage(number: number): void {
    this.stages.push({ number, title: this.titles[number - 1], steps: [] });
  }

  /** Add a step (steps that would turn nothing are skipped, except "look" steps). */
  step(kind: SolveStep['kind'], moves: readonly Move[], text: string, algorithmId?: string): void {
    if (kind !== 'check' && moves.length === 0) return;
    this.stages[this.stages.length - 1].steps.push({ kind, moves, text, algorithmId });
    this.cube = applyMoves(this.cube, moves);
  }

  /**
   * Turn the whole cube, describing where it ends up (not how to turn it). When no
   * turn is needed, still add a "look" step (`already`) so the explanation isn't lost.
   */
  rotate(moves: readonly Move[], why: string, already: string): void {
    if (moves.length === 0) {
      this.step('check', [], already);
      return;
    }
    const hold = holdDescription(applyMoves(this.cube, moves));
    this.step('rotate', moves, `${why} Hold it with ${lowerFirst(hold)}`);
  }

  /** The finished stages. A stage that needed nothing still gets a step saying so. */
  finish(): SolveStage[] {
    for (const stage of this.stages) {
      if (stage.steps.length === 0) {
        stage.steps.push({ kind: 'check', moves: [], text: ALREADY_DONE });
      }
    }
    return this.stages;
  }
}

/** Replay a plan from its start: each stage must meet its goal, and the cube must end solved. */
export function checkPlan(
  plan: SolvePlan,
  goals: readonly ((cube: Cube) => boolean)[],
): string | null {
  let cube = plan.start;
  for (const stage of plan.stages) {
    for (const step of stage.steps) cube = applyMoves(cube, step.moves);
    // A stage that leaves the cube solved has done more than its job (e.g. a solved cube).
    if (!goals[stage.number - 1](cube) && !isSolved(cube)) {
      return `Stage ${stage.number} (${stage.title}) didn't reach its goal. This is a bug in the app, not a problem with your cube.`;
    }
  }
  return isSolved(cube)
    ? null
    : "The plan didn't end solved. This is a bug in the app, not a problem with your cube.";
}

export interface PlannedStep {
  stage: SolveStage;
  step: SolveStep;
  stageIndex: number;
  stepIndex: number;
  start: Cube; // the cube just before this step
}

/** Every step of a plan in order, each with the cube it starts from. */
export function listSteps(plan: SolvePlan): PlannedStep[] {
  const steps: PlannedStep[] = [];
  let cube = plan.start;
  plan.stages.forEach((stage, stageIndex) => {
    stage.steps.forEach((step, stepIndex) => {
      steps.push({ stage, step, stageIndex, stepIndex, start: cube });
      cube = applyMoves(cube, step.moves);
    });
  });
  return steps;
}
