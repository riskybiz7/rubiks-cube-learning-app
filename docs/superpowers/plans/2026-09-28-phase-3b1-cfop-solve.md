# Phase ③b-1: CFOP Solve Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the owner solve their own cube (or a scramble) with CFOP: white cross on the bottom, F2L with 41 cases, 2-look OLL and 2-look PLL. Add a CFOP track on the Learn screen alongside the beginner track.

**Architecture:**
- The two solvers (beginner and CFOP) share one plan format and one self-check, moved into `src/solver/plan.ts`.
- The CFOP library is data in `src/content/cfop.ts`. Enumeration tests prove it covers every case exactly once.
- The CFOP solver (`src/solver/cfop.ts`) solves the cross edge by edge with a small search (`src/solver/cross.ts`). For every other stage it looks up the case in the library, trying all four turns of the top.
- The screens choose the solver by method.

**Tech Stack:** TypeScript 7 (strict), React 19, Vite 8, Vitest 5, Three.js (unchanged), Prettier.

**Spec:** `docs/superpowers/specs/2026-09-27-cube-learning-app-design.md` (§3.2, §3.3, §3.6, §7, §9, §10)

## Scope: why ③b is split in two

The spec's ③b is "CFOP content + solver; Learn (CFOP track); Algorithms screen". This plan (**③b-1**) delivers the part that lets you *solve with CFOP*:
- the cross
- F2L (41 cases)
- 2-look OLL (10 cases)
- 2-look PLL (6 cases)
- the Solve screen's method choice
- the Learn screen's CFOP track

**③b-2** (next plan) adds:
- full OLL (57) and full PLL (21)
- the Algorithms screen with case diagrams
- the choice between 2-look and full for each set
- saving *learning/learned* progress

**Why split:** ③b-1 is already 6 tasks, and each half is useful on its own.

## Decisions for the owner to confirm (made in this plan)

| # | Decision | Why | Cost if wrong |
|---|---|---|---|
| D1 | Split ③b into ③b-1 (this plan) and ③b-2 | Keeps each review small; ③b-1 is usable on its own | One more plan review |
| D2 | **CFOP algorithms use only face turns**: no wide, middle-slice or whole-cube turns inside an algorithm. **Back-face turns are allowed** (owner, 2026-09-28: the no-B rule is for the beginner method only). None of the 57 happens to use B | Owner is not used to wide turns or x/y/z. See the conversions below | Some algorithms differ from the most-quoted versions online |
| D3 | CFOP screens also write whole-cube turns as SPIN / TIP / ROLL | Owner: "even I'm not used to seeing x,y,z" | Easy to switch back per method |
| D4 | The cross search uses all six faces, **B included** | Owner, 2026-09-28: no-B is for beginners only | None. The longest cross is still **measured** in Task 4 |
| D5 | F2L cases are numbered 1–41 in this app's own order, in 4 groups by where the corner and edge sit | The widely used 1–41 numbering can't be checked against a source here, so the app doesn't claim to follow it | Numbers won't match online charts; renumbering later is a data edit |
| D6 | The Move key gets three options: **Beginner / CFOP / All moves**. CFOP shows U D R L F B plus SPIN/TIP/ROLL. (Revised 2026-09-28: the original "one shared option" relied on CFOP never using B) | A test proves each list matches exactly what that method's lessons use | None |

**The conversions in D2:**
- The two OLL cases usually written with a wide `r` are rewritten with plain face turns that do the same thing:
  - T: `r U R' U' r' F R F'` becomes `L F R' F' L' F R F'`
  - Bowtie: `F' r U R' U' r' F R` becomes `F' L F R' F' L' F R`
- H-perm and Z-perm use R/U versions instead of middle-slice (M) turns.

**Checks run while writing this plan:** a throwaway test (deleted afterwards) checked every algorithm below against the cube model.
- 150 F2L slot states, 42 cases counting "solved": each state is solved by exactly one of the 41 F2L algorithms.
- 216 orientation states: each needs exactly one of the 3 edge algorithms or the 7 corner algorithms.
- 288 corner-arrangement states and 48 edge-arrangement states: each needs exactly one of the 2 corner or 4 edge algorithms.
- Each case name matches its algorithm (e.g. Sune leaves one yellow corner on top).
- 37 of the 41 F2L algorithms are ones I proposed. The other 4 were found by a shortest-moves search: F2L 24, F2L 29, F2L 30 and F2L 36 in Task 2's list.

## Global Constraints

- User-facing text says **"squares"**, never "stickers" (spec, Wording).
- **No unverified algorithm ships:** every algorithm has a test that applies it to its case and confirms it (spec §7).
- **Provenance:** every CFOP algorithm is `claude-proposed` until the owner checks it (spec §9).
- **Solver self-check:** replay every step on the start cube; each stage must meet its goal and the cube must end solved. On failure, show an error and never a bad plan (spec §3.3).
- **Hold for CFOP:** yellow on top, white cross on the bottom (spec §9).
- **Case counts are verified by enumeration** (41 F2L; 2-look: 3 + 7 OLL, 2 + 4 PLL) (spec §3.2, §7).
- **The longest cross solution is measured and reported, not assumed** (spec §7).
- **Windows PowerShell 5.1:** no `&&`, quote the path (`Rubik's Cube`). Commit messages go through a file (`git commit -F`), because PowerShell 5.1 breaks double quotes inside `-m`.
- **Commit gate:** `npm run typecheck` must pass before any commit. Every commit ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Run `npx prettier --write` on changed files before committing.
- **Branch:** `phase-3b-cfop`, created from `phase-3a-beginner` (PRs #2 and #3 are not merged yet).

## Review Focus

1. **A cube that is already partly solved** (entered mid-solve: cross done, or F2L done). Expected: stages with nothing to do say so and turn nothing. Test in Task 4.
2. **An F2L piece stuck in another slot.** Expected: take it out first, then solve, never loop. Test in Task 4 (pairs swapped between slots).
3. **A last layer that is solved except for a top turn.** Expected: one "turn the top" step, no algorithm. Test in Task 4.
4. **A cube held in any of the 24 ways.** Expected: the first step turns it to yellow on top, green facing you. Test in Task 4.
5. **Switching method (Beginner ↔ CFOP) on the Solve screen partway through.** Expected: the new plan starts at step 1, never at an out-of-range step. Handled in Task 5 (index reset plus the existing clamp); checked in the browser.

---

## File map

| File | Status | Job |
|---|---|---|
| `src/solver/plan.ts` | Create | Shared plan types, `PlanWriter`, `checkPlan`, `listSteps`, cube-turn helpers |
| `src/solver/plan.test.ts` | Create | Tests for the shared pieces |
| `src/solver/beginner.ts` | Modify | Use `plan.ts` (no behavior change) |
| `src/solver/checks.ts` | Modify | CFOP goals: `isCfopCross`, `F2L_PAIRS`, `isPairSolved`, `isYellowFace`, `topCornersMatchAfterTopTurn` |
| `src/solver/checks.test.ts` | Modify | Tests for those goals |
| `src/test-utils/cfopStates.ts` | Create | State builders for the enumeration tests |
| `src/content/cfop.ts` | Create | CFOP library (41 + 10 + 6 algorithms), groups, CFOP lessons |
| `src/content/cfop.test.ts` | Create | Enumeration, name, move-set and provenance tests |
| `src/solver/cross.ts` | Create | Cross search (IDA* on the white squares) |
| `src/solver/cross.test.ts` | Create | Cross tests |
| `src/solver/cfop.ts` | Create | CFOP solver |
| `src/solver/cfop.test.ts` | Create | Stress and edge-case tests |
| `src/content/methods.ts` | Create | `Method`, `METHODS`, `STAGES_FOR`, `solveWith` |
| `src/content/algorithms.ts` | Create | `findAlgorithm(id)` across both libraries |
| `src/content/algorithms.test.ts` | Create | Lookup tests |
| `src/content/demo.ts`, `demo.test.ts` | Modify | Demo per method |
| `src/content/cubeTurnWords.ts` (+ test) | Modify | Rename `beginnerMoveLabel` → `plainMoveLabel` |
| `src/content/moveKey.ts` (+ test) | Modify | Add `'cfop'` to `KeyMethod`; the test covers both solvers |
| `src/app/App.tsx`, `SolveScreen.tsx`, `LearnScreen.tsx`, `MoveKey.tsx` | Modify | Method choice, CFOP track, grouped cards |
| `docs/…` | Modify/Create | Status, decisions, ③b review notes |

---

### Task 0: Branch

- [ ] **Step 1: Create the branch from phase ③a**

```powershell
Set-Location "C:\Users\micha\Claude\Projects\Rubik's Cube"; git checkout phase-3a-beginner; git pull; git checkout -b phase-3b-cfop
```
Expected: `Switched to a new branch 'phase-3b-cfop'`.

---

### Task 1: Shared plan pieces (refactor, no behavior change)

**Files:**
- Create: `src/solver/plan.ts`, `src/solver/plan.test.ts`
- Modify: `src/solver/beginner.ts` (lines 37–135 move out; `solveBeginner`, `selfCheck`, `listSteps` use the shared pieces)

**Interfaces:**
- Produces:
  - Types: `SolveStep`, `SolveStage`, `SolvePlan`, `SolveResult`, `PlannedStep`
  - Constants: `quarterTurns(base)`, `TOP_TURNS`, `CUBE_TURNS`, `ALREADY_DONE`
  - Functions: `reorientTo(cube, top, front): Move[]`, `checkPlan(plan, goals): string | null`, `listSteps(plan): PlannedStep[]`
  - `class PlanWriter(start: Cube, titles: readonly string[])` with `.cube`, `.stages`, `startStage(n)`, `step(kind, moves, text, algorithmId?)`, `rotate(moves, why, already)` and `finish(): SolveStage[]`
- `beginner.ts` keeps exporting `SolvePlan`, `SolveStage`, `SolveStep`, `SolveResult`, `PlannedStep`, `listSteps`, `selfCheck` and `solveBeginner`, so existing importers don't change.

- [ ] **Step 1: Write the failing test** `src/solver/plan.test.ts`

```ts
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
    stages: [{ number: 1, title: 'First', steps: [{ kind: 'moves', moves: mustParse(text), text: '' }] }],
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
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/solver/plan.test.ts`
Expected: FAIL, `Failed to resolve import "./plan"`.

- [ ] **Step 3: Create `src/solver/plan.ts`** by moving code out of `beginner.ts`

```ts
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
      if (stage.steps.length === 0) stage.steps.push({ kind: 'check', moves: [], text: ALREADY_DONE });
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
    if (!goals[stage.number - 1](cube)) {
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
```

- [ ] **Step 4: Point `beginner.ts` at `plan.ts`**
  - Delete from `beginner.ts`: the `SolveStep`/`SolveStage`/`SolvePlan`/`SolveResult` interfaces, `quarterTurns`, `TOP_TURNS`, `CUBE_TURNS`, `REORIENTATIONS`, `reorientTo`, `lowerFirst` (if nothing else in the file uses it), the `PlanWriter` class, and the `PlannedStep`/`listSteps` definitions at the bottom.
  - Keep `BOTTOM_TURNS` as `const BOTTOM_TURNS = quarterTurns('D');`.
  - Add near the top:

```ts
import {
  CUBE_TURNS,
  PlanWriter,
  TOP_TURNS,
  checkPlan,
  quarterTurns,
  reorientTo,
  type SolvePlan,
  type SolveResult,
} from './plan';

export type { PlannedStep, SolvePlan, SolveResult, SolveStage, SolveStep } from './plan';
export { listSteps } from './plan';
```

  - Replace the body of `selfCheck` with `return checkPlan(plan, STAGE_GOALS);`.
  - In `solveBeginner`:
    - change `new PlanWriter(start)` to `new PlanWriter(start, BEGINNER_STAGES.map((s) => s.title))`;
    - replace the "A stage that needed nothing" loop and the `const plan` line with `const plan: SolvePlan = { start, stages: w.finish() };`.
  - Remove imports that `tsc` now reports as unused (e.g. `holdDescription`).

- [ ] **Step 5: Run the new test and the whole suite**

Run: `npx vitest run`
Expected: all pass. That's 142 existing + 7 new = 149. The beginner tests are unchanged and still green, which proves the refactor kept behavior.

- [ ] **Step 6: Typecheck, format, commit**

```powershell
npm run typecheck; if ($?) { npx prettier --write src/solver; git add src/solver; git commit -F <msgfile> }
```
Message: `refactor: share the solve-plan pieces between solvers`, with the trailer.

---

### Task 2: CFOP goals, state builders and the verified library

**Files:**
- Modify: `src/solver/checks.ts`, `src/solver/checks.test.ts`
- Create: `src/test-utils/cfopStates.ts`, `src/content/cfop.ts`, `src/content/cfop.test.ts`

**Interfaces:**
- Consumes: `TOP_TURNS` (Task 1); `readPieces`, `fromPieces` (`src/cube/pieces.ts`); `StageInfo`, `Provenance` (`src/content/beginner.ts`).
- Produces:
  - In `checks.ts`:
    - `isCfopCross(cube)`
    - `F2L_PAIRS: readonly (readonly [CornerSlot, EdgeSlot])[]`, in the order front-right, front-left, back-left, back-right
    - `isPairSolved(cube, pair)`
    - `isYellowFace(cube)`
    - `topCornersMatchAfterTopTurn(cube)`
  - In `cfop.ts`:
    - `CfopSet`, `CfopAlgorithm { id, set, group, name, moves, provenance }`
    - `GROUPS` (8 group names)
    - `CFOP_ALGORITHMS` (57)
    - `inGroup(group): CfopAlgorithm[]`
    - `CFOP_STAGES: readonly StageInfo[]` (4)
  - In `cfopStates.ts`: `CFOP_HOME`, `f2lSlotStates()`, `f2lCaseKey(cube)`, `lastLayerStates({ orient, permute })`.

- [ ] **Step 1: Write the failing goal tests.** Append to `src/solver/checks.test.ts` (keep its existing imports and add the new names):

```ts
import { mustParse } from '../cube/notation';
import {
  F2L_PAIRS,
  isCfopCross,
  isPairSolved,
  isYellowFace,
  topCornersMatchAfterTopTurn,
} from './checks';

const CFOP_HOME = applyMoves(solved(), mustParse('z2')); // yellow on top, green facing you

describe('CFOP goals', () => {
  it('the cross is the four white edges on the bottom, with yellow on top', () => {
    expect(isCfopCross(CFOP_HOME)).toBe(true);
    expect(isCfopCross(applyMoves(CFOP_HOME, mustParse('R')))).toBe(false);
    expect(isCfopCross(solved())).toBe(false); // white on top: not the CFOP hold
  });

  it('pairs are the bottom corner and the middle edge of each slot', () => {
    expect(F2L_PAIRS.map(([corner, edge]) => `${corner.name}+${edge.name}`)).toEqual([
      'DFR+FR',
      'DLF+FL',
      'DBL+BL',
      'DRB+BR',
    ]);
    const afterR = applyMoves(CFOP_HOME, mustParse('R'));
    expect(isPairSolved(afterR, F2L_PAIRS[0])).toBe(false);
    expect(isPairSolved(afterR, F2L_PAIRS[1])).toBe(true);
  });

  it('the yellow face is the whole top yellow, with the first two layers done', () => {
    expect(isYellowFace(CFOP_HOME)).toBe(true);
    expect(isYellowFace(applyMoves(CFOP_HOME, mustParse("R U R' U R U2 R'")))).toBe(false);
  });

  it('top corners "match after a top turn" when one turn of the top would line them all up', () => {
    expect(topCornersMatchAfterTopTurn(applyMoves(CFOP_HOME, mustParse('U')))).toBe(true);
    const tPerm = mustParse("R U R' U' R' F R2 U' R' U' R U R' F'");
    expect(topCornersMatchAfterTopTurn(applyMoves(CFOP_HOME, tPerm))).toBe(false);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/solver/checks.test.ts`
Expected: FAIL (`isCfopCross` is not exported).

- [ ] **Step 3: Add the goals to `src/solver/checks.ts`**

```ts
// (add to the imports at the top)
import { applyMoves, isSolved } from '../cube/moves';
import { mustParse } from '../cube/notation';
import { CORNER_SLOTS, EDGE_SLOTS, type CornerSlot, type EdgeSlot } from '../cube/pieces';

// ── CFOP goals (yellow on top, white cross on the bottom) ─────────────────

/** CFOP stage 1: the white cross on the bottom, with yellow on top. */
export const isCfopCross = (cube: Cube) =>
  centerColor(cube, 'U') === 'Y' && allSlotsSolved(cube, BOTTOM_EDGES);

/** The four F2L slots as [bottom corner, middle edge]: front-right, front-left, back-left, back-right. */
export const F2L_PAIRS: readonly (readonly [CornerSlot, EdgeSlot])[] = [0, 1, 2, 3].map(
  (i) => [BOTTOM_CORNERS[i], MIDDLE_EDGES[i]] as const,
);

export const isPairSolved = (cube: Cube, pair: readonly [CornerSlot, EdgeSlot]) =>
  isSlotSolved(cube, pair[0]) && isSlotSolved(cube, pair[1]);

/** CFOP stage 3: the whole top face yellow, with the first two layers done. */
export const isYellowFace = (cube: Cube) =>
  isFlippedTwoLayers(cube) && cube.stickers.slice(0, 9).every((color) => color === 'Y');

const TOP_TURN_LIST = ['', 'U', 'U2', "U'"].map(mustParse);

/** The top corners are right relative to each other: one turn of the top lines them all up. */
export function topCornersMatchAfterTopTurn(cube: Cube): boolean {
  return (
    isFlippedTwoLayers(cube) &&
    TOP_TURN_LIST.some((turn) => {
      const turned = applyMoves(cube, turn);
      return TOP_CORNERS.every((slot) =>
        slot.stickers
          .slice(1)
          .every((square) => turned.stickers[square] === centerColor(turned, faceOfSquare(square))),
      );
    })
  );
}
```

The existing `import { isSolved } from '../cube/moves'` line merges into the new moves import. Keep `export { isSolved };` at the bottom.

- [ ] **Step 4: Run the goal tests and watch them pass**

Run: `npx vitest run src/solver/checks.test.ts`
Expected: PASS.

- [ ] **Step 5: Create the state builders** `src/test-utils/cfopStates.ts`

```ts
import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { mustParse } from '../cube/notation';
import { fromPieces, readPieces, type Pieces } from '../cube/pieces';
import type { Cube } from '../cube/types';
import { TOP_TURNS } from '../solver/plan';

/**
 * Builders for the CFOP enumeration tests: every position a case can be in, so the
 * tests can prove the library covers each one exactly once (like footing a table).
 */

/** The solved cube held for CFOP: yellow on top, green facing you. */
export const CFOP_HOME: Cube = applyMoves(solved(), mustParse('z2'));

function piecesOf(cube: Cube): Pieces {
  const reading = readPieces(cube);
  if (!reading.ok) throw new Error('Not a real cube.');
  return reading.pieces;
}

const DFR = 4; // index of the front-right bottom corner (CORNER_SLOTS)
const FR = 8; // index of the front-right middle edge (EDGE_SLOTS)

/**
 * Every position of the front-right pair with each piece in the top layer or in its own
 * slot: the corner in 5 places × 3 twists, the edge in 5 places × 2 flips = 150 states.
 * Everything else is solved.
 */
export function f2lSlotStates(): Cube[] {
  const home = piecesOf(CFOP_HOME);
  const states: Cube[] = [];
  for (const cornerAt of [0, 1, 2, 3, DFR])
    for (const twist of [0, 1, 2] as const)
      for (const edgeAt of [0, 1, 2, 3, FR])
        for (const flip of [0, 1] as const) {
          const corners = home.corners.map((c) => ({ ...c }));
          const edges = home.edges.map((e) => ({ ...e }));
          // Swap the pair's pieces with whatever sits where they go.
          corners[DFR] = { piece: corners[cornerAt].piece, twist: 0 };
          corners[cornerAt] = { piece: DFR, twist };
          edges[FR] = { piece: edges[edgeAt].piece, flip: 0 };
          edges[edgeAt] = { piece: FR, flip };
          states.push(fromPieces({ centers: home.centers, corners, edges }));
        }
  return states;
}

/** Which F2L case a state is: where the pair's corner and edge are, the same for any top turn. */
export function f2lCaseKey(cube: Cube): string {
  const keys = TOP_TURNS.map((turn) => {
    const pieces = piecesOf(applyMoves(cube, turn));
    const c = pieces.corners.findIndex((x) => x.piece === DFR);
    const e = pieces.edges.findIndex((x) => x.piece === FR);
    return `${c}.${pieces.corners[c].twist}/${e}.${pieces.edges[e].flip}`;
  });
  return keys.sort()[0];
}

const permutationsOf4 = (): number[][] => {
  const out: number[][] = [];
  const build = (prefix: number[]) => {
    if (prefix.length === 4) out.push(prefix);
    else for (let i = 0; i < 4; i++) if (!prefix.includes(i)) build([...prefix, i]);
  };
  build([]);
  return out;
};
const parity = (order: number[]) => {
  let swaps = 0;
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (order[i] > order[j]) swaps++;
  return swaps % 2;
};

/**
 * Last-layer states with the first two layers solved.
 * orient: every legal twist/flip of the top pieces (27 × 8 = 216);
 * permute: every legal arrangement of them (24 × 24 ÷ 2 = 288).
 */
export function lastLayerStates(options: { orient: boolean; permute: boolean }): Cube[] {
  const home = piecesOf(CFOP_HOME);
  const orders = options.permute ? permutationsOf4() : [[0, 1, 2, 3]];
  const twists: number[][] = [];
  const flips: number[][] = [];
  if (options.orient) {
    for (let a = 0; a < 3; a++)
      for (let b = 0; b < 3; b++)
        for (let c = 0; c < 3; c++) twists.push([a, b, c, (6 - a - b - c) % 3]);
    for (let mask = 0; mask < 16; mask++) {
      const f = [0, 1, 2, 3].map((i) => (mask >> i) & 1);
      if (f.reduce((x, y) => x + y) % 2 === 0) flips.push(f);
    }
  } else {
    twists.push([0, 0, 0, 0]);
    flips.push([0, 0, 0, 0]);
  }
  const states: Cube[] = [];
  for (const cornerOrder of orders)
    for (const edgeOrder of orders) {
      if (parity(cornerOrder) !== parity(edgeOrder)) continue; // a real cube can't do one swap alone
      for (const twist of twists)
        for (const flip of flips) {
          const corners = home.corners.map((c, i) =>
            i < 4 ? { piece: home.corners[cornerOrder[i]].piece, twist: twist[i] as 0 | 1 | 2 } : c,
          );
          const edges = home.edges.map((e, i) =>
            i < 4 ? { piece: home.edges[edgeOrder[i]].piece, flip: flip[i] as 0 | 1 } : e,
          );
          states.push(fromPieces({ centers: home.centers, corners, edges }));
        }
    }
  return states;
}
```

- [ ] **Step 6: Write the failing library test** `src/content/cfop.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { applyMoves, isSolved } from '../cube/moves';
import { invertMoves, mustParse } from '../cube/notation';
import { readPieces } from '../cube/pieces';
import type { Cube } from '../cube/types';
import {
  BOTTOM_EDGES,
  F2L_PAIRS,
  allSlotsSolved,
  isFlippedTwoLayers,
  isYellowCross,
  isYellowFace,
  topCornersMatchAfterTopTurn,
} from '../solver/checks';
import { TOP_TURNS } from '../solver/plan';
import { CFOP_HOME, f2lCaseKey, f2lSlotStates, lastLayerStates } from '../test-utils/cfopStates';
import { CFOP_ALGORITHMS, CFOP_STAGES, GROUPS, inGroup, type CfopAlgorithm } from './cfop';

const F2L = CFOP_ALGORITHMS.filter((a) => a.set === 'F2L');
const byId = (id: string) => CFOP_ALGORITHMS.find((a) => a.id === id)!;
/** The case an algorithm solves: undo it from solved. */
const caseOf = (a: CfopAlgorithm) => applyMoves(CFOP_HOME, invertMoves(mustParse(a.moves)));

/** The algorithms that take `state` to `goal`, after a turn of the top (and one at the end, if allowed). */
function solvers(state: Cube, algorithms: CfopAlgorithm[], goal: (c: Cube) => boolean, endTurn: boolean) {
  const ends = endTurn ? TOP_TURNS : [[]];
  return algorithms.filter((a) =>
    TOP_TURNS.some((before) =>
      ends.some((after) => goal(applyMoves(state, [...before, ...mustParse(a.moves), ...after]))),
    ),
  );
}

/** Every state not already done is solved by exactly one algorithm, and every algorithm is needed. */
function expectExactCover(
  states: Cube[],
  algorithms: CfopAlgorithm[],
  goal: (c: Cube) => boolean,
  endTurn = false,
) {
  const done = (s: Cube) => (endTurn ? TOP_TURNS.some((t) => goal(applyMoves(s, t))) : goal(s));
  const used = new Set<string>();
  for (const state of states) {
    if (done(state)) continue;
    const found = solvers(state, algorithms, goal, endTurn);
    expect(found.map((a) => a.id), 'algorithms that solve this state').toHaveLength(1);
    used.add(found[0].id);
  }
  expect([...used].sort()).toEqual(algorithms.map((a) => a.id).sort());
}

describe('CFOP library: F2L', () => {
  it('has 41 cases: the pair has 150 positions in 42 groups, one of them already solved', () => {
    const states = f2lSlotStates();
    expect(states).toHaveLength(150);
    expect(new Set(states.map(f2lCaseKey)).size).toBe(42);
    expect(F2L).toHaveLength(41);
  });

  it('every position of the front-right pair is solved by exactly one F2L algorithm', () => {
    expectExactCover(f2lSlotStates(), F2L, isFlippedTwoLayers);
  });

  it('each F2L algorithm is filed under the group its case belongs to', () => {
    for (const a of F2L) {
      const [corner, edge] = f2lCaseKey(caseOf(a)).split('/');
      const cornerInSlot = corner.startsWith('4.');
      const edgeInSlot = edge.startsWith('8.');
      const group = cornerInSlot
        ? edgeInSlot
          ? GROUPS.bothInSlot
          : GROUPS.cornerInSlot
        : edgeInSlot
          ? GROUPS.edgeInSlot
          : GROUPS.pairInTop;
      expect(a.group, a.id).toBe(group);
    }
  });
});

describe('CFOP library: 2-look OLL', () => {
  const oriented = lastLayerStates({ orient: true, permute: false });

  it('first look: every edge pattern is fixed by exactly one of line, L shape and dot', () => {
    expect(inGroup(GROUPS.ollEdges)).toHaveLength(3);
    expectExactCover(oriented, inGroup(GROUPS.ollEdges), isYellowCross);
  });

  it('second look: with the cross done, every corner pattern is fixed by exactly one of 7', () => {
    expect(inGroup(GROUPS.ollCorners)).toHaveLength(7);
    expectExactCover(oriented.filter(isYellowCross), inGroup(GROUPS.ollCorners), isYellowFace);
  });

  it('the names match the cases', () => {
    const badEdges = (id: string) => [1, 3, 5, 7].filter((i) => caseOf(byId(id)).stickers[i] !== 'Y');
    expect(badEdges('oll-line')).toEqual([1, 7]); // back and front: a line across
    expect(badEdges('oll-l')).toEqual([5, 7]); // right and front: side by side
    expect(badEdges('oll-dot')).toHaveLength(4);
    const yellowCorners = (id: string) =>
      [0, 2, 6, 8].filter((i) => caseOf(byId(id)).stickers[i] === 'Y').length;
    expect(['oll-sune', 'oll-antisune'].map(yellowCorners)).toEqual([1, 1]);
    expect(['oll-h', 'oll-pi'].map(yellowCorners)).toEqual([0, 0]);
    expect(['oll-headlights', 'oll-t', 'oll-bowtie'].map(yellowCorners)).toEqual([2, 2, 2]);
  });
});

describe('CFOP library: 2-look PLL', () => {
  const arranged = lastLayerStates({ orient: false, permute: true });

  it('first look: every corner arrangement is fixed by exactly one of T-perm and Y-perm', () => {
    expect(inGroup(GROUPS.pllCorners)).toHaveLength(2);
    expectExactCover(arranged, inGroup(GROUPS.pllCorners), topCornersMatchAfterTopTurn);
  });

  it('second look: with the corners done, every edge arrangement is fixed by exactly one of 4', () => {
    expect(inGroup(GROUPS.pllEdges)).toHaveLength(4);
    expectExactCover(arranged.filter(topCornersMatchAfterTopTurn), inGroup(GROUPS.pllEdges), isSolved, true);
  });

  it('the names match the cases', () => {
    /** Which top pieces sit in each top slot, after the top turn that puts the corners home (if any). */
    const layout = (id: string) => {
      const state = caseOf(byId(id));
      for (const turn of TOP_TURNS) {
        const reading = readPieces(applyMoves(state, turn));
        if (!reading.ok) throw new Error('bad');
        const corners = reading.pieces.corners.slice(0, 4).map((c) => c.piece);
        const edges = reading.pieces.edges.slice(0, 4).map((e) => e.piece);
        if (corners.every((p, i) => p === i) || id.startsWith('pll-t') || id === 'pll-y')
          return { corners, edges };
      }
      throw new Error(`corners never line up for ${id}`);
    };
    expect(layout('pll-t').corners).toEqual([3, 1, 2, 0]); // front-right and back-right swapped: side by side
    expect(layout('pll-y').corners).toEqual([2, 1, 0, 3]); // front-right and back-left swapped: diagonal
    const moved = (id: string) => layout(id).edges.filter((p, i) => p !== i).length;
    expect(['pll-ua', 'pll-ub'].map(moved)).toEqual([3, 3]);
    expect(layout('pll-h').edges).toEqual([2, 3, 0, 1]); // opposite edges swap
    expect(layout('pll-z').edges).toEqual([1, 0, 3, 2]); // side-by-side edges swap
  });
});

describe('CFOP library: every algorithm', () => {
  it('uses only face turns: no wide, middle-slice or whole-cube turns', () => {
    for (const a of CFOP_ALGORITHMS) {
      for (const move of mustParse(a.moves)) expect('RUFLDB', `${a.id}: ${a.moves}`).toContain(move.base);
    }
  });

  it('leaves the cross and every other finished slot alone', () => {
    for (const a of CFOP_ALGORITHMS) {
      const pairs = a.set === 'F2L' ? F2L_PAIRS.slice(1) : F2L_PAIRS;
      expect(allSlotsSolved(caseOf(a), [...BOTTOM_EDGES, ...pairs.flat()]), a.id).toBe(true);
    }
  });

  it('has unique ids and is marked proposed until the owner checks it', () => {
    expect(new Set(CFOP_ALGORITHMS.map((a) => a.id)).size).toBe(CFOP_ALGORITHMS.length);
    for (const a of CFOP_ALGORITHMS) expect(a.provenance, a.id).toBe('claude-proposed');
  });

  it('every CFOP lesson names algorithms that exist, and every algorithm is in a lesson', () => {
    expect(CFOP_STAGES.map((s) => s.number)).toEqual([1, 2, 3, 4]);
    const inLessons = CFOP_STAGES.flatMap((s) => s.algorithmIds);
    expect([...inLessons].sort()).toEqual(CFOP_ALGORITHMS.map((a) => a.id).sort());
  });
});
```

- [ ] **Step 7: Run it and watch it fail**

Run: `npx vitest run src/content/cfop.test.ts`
Expected: FAIL, `Failed to resolve import "./cfop"`.

- [ ] **Step 8: Create the library** `src/content/cfop.ts`

```ts
import type { Provenance, StageInfo } from './beginner';

/**
 * CFOP algorithms as data. Every one was proposed by Claude and stays "proposed" until
 * the owner checks it on their cube. The tests in cfop.test.ts prove the library covers
 * every case exactly once. Owner's rule for this app: only R, U, F, L and D turns.
 */

export type CfopSet = 'F2L' | 'OLL-2LOOK' | 'PLL-2LOOK';

export interface CfopAlgorithm {
  id: string;
  set: CfopSet;
  group: string;
  name: string;
  moves: string;
  provenance: Provenance;
}

export const GROUPS = {
  pairInTop: 'Corner and edge both in the top layer',
  edgeInSlot: 'Corner in the top layer, edge in the slot',
  cornerInSlot: 'Corner in the slot, edge in the top layer',
  bothInSlot: 'Corner and edge both in the slot',
  ollEdges: 'First look: make the yellow cross',
  ollCorners: 'Second look: make the whole top yellow',
  pllCorners: 'First look: put the corners in place',
  pllEdges: 'Second look: put the edges in place',
} as const;

// F2L cases, numbered in this app's own order (not the numbering on online charts).
const F2L_LIST: readonly [string, string][] = [
  [GROUPS.pairInTop, "U R U' R'"],
  [GROUPS.pairInTop, "U' F' U F"],
  [GROUPS.pairInTop, "F' U' F"],
  [GROUPS.pairInTop, "R U R'"],
  [GROUPS.pairInTop, "U' R U R' U2 R U' R'"],
  [GROUPS.pairInTop, "U F' U' F U2 F' U F"],
  [GROUPS.pairInTop, "U' R U2 R' U2 R U' R'"],
  [GROUPS.pairInTop, "U F' U2 F U2 F' U F"],
  [GROUPS.pairInTop, "U' R U' R' U F' U' F"],
  [GROUPS.pairInTop, "U' R U R' U R U R'"],
  [GROUPS.pairInTop, "U' R U2 R' U F' U' F"],
  [GROUPS.pairInTop, "R U' R' U R U' R' U2 R U' R'"],
  [GROUPS.pairInTop, "U F' U F U' F' U' F"],
  [GROUPS.pairInTop, "U' R U' R' U R U R'"],
  [GROUPS.pairInTop, "R U' R' U2 F' U' F"],
  [GROUPS.pairInTop, "R U2 R' U' R U R'"],
  [GROUPS.pairInTop, "F' U2 F U F' U' F"],
  [GROUPS.pairInTop, "U R U2 R' U R U' R'"],
  [GROUPS.pairInTop, "U' F' U2 F U' F' U F"],
  [GROUPS.pairInTop, "U2 R U R' U R U' R'"],
  [GROUPS.pairInTop, "U2 F' U' F U' F' U F"],
  [GROUPS.pairInTop, "U R U' R' U' R U' R' U R U' R'"],
  [GROUPS.pairInTop, "U' F' U F U F' U F U' F' U F"],
  [GROUPS.pairInTop, "F' U F U2 R U R'"],
  [GROUPS.edgeInSlot, "U' R' F R F' R U' R'"],
  [GROUPS.edgeInSlot, "R U R' U' R U R' U' R U R'"],
  [GROUPS.edgeInSlot, "U' R U' R' U2 R U' R'"],
  [GROUPS.edgeInSlot, "U R U R' U2 R U R'"],
  [GROUPS.edgeInSlot, "U F' U' F U' R U R'"],
  [GROUPS.edgeInSlot, "U2 R U R' U2 F' U2 F"],
  [GROUPS.cornerInSlot, "U R U' R' U' F' U F"],
  [GROUPS.cornerInSlot, "R U' R' U R U' R'"],
  [GROUPS.cornerInSlot, "F' U F U' F' U F"],
  [GROUPS.cornerInSlot, "R U R' U' R U R'"],
  [GROUPS.cornerInSlot, "F' U' F U F' U' F"],
  [GROUPS.cornerInSlot, "U' F' U F U R U' R'"],
  [GROUPS.bothInSlot, "R U' R' U R U2 R' U R U' R'"],
  [GROUPS.bothInSlot, "R U' R' U' R U R' U2 R U' R'"],
  [GROUPS.bothInSlot, "R U R' U' R U' R' U2 F' U' F"],
  [GROUPS.bothInSlot, "R U' R' F R U R' U' F' R U' R'"],
  [GROUPS.bothInSlot, "R U' R' U F' U2 F U2 F' U F"],
];

const proposed = 'claude-proposed' as const;

export const CFOP_ALGORITHMS: readonly CfopAlgorithm[] = [
  ...F2L_LIST.map(([group, moves], i) => ({
    id: `f2l-${i + 1}`,
    set: 'F2L' as const,
    group,
    name: `F2L ${i + 1}`,
    moves,
    provenance: proposed,
  })),
  ...(
    [
      ['oll-line', GROUPS.ollEdges, 'Line', "F R U R' U' F'"],
      ['oll-l', GROUPS.ollEdges, 'L shape', "F U R U' R' F'"],
      ['oll-dot', GROUPS.ollEdges, 'Dot', "F R U R' U' F' U2 F U R U' R' F'"],
      ['oll-sune', GROUPS.ollCorners, 'Sune', "R U R' U R U2 R'"],
      ['oll-antisune', GROUPS.ollCorners, 'Antisune', "R U2 R' U' R U' R'"],
      ['oll-h', GROUPS.ollCorners, 'H', "R U R' U R U' R' U R U2 R'"],
      ['oll-pi', GROUPS.ollCorners, 'Pi', "R U2 R2 U' R2 U' R2 U2 R"],
      ['oll-headlights', GROUPS.ollCorners, 'Headlights', "R2 D R' U2 R D' R' U2 R'"],
      ['oll-t', GROUPS.ollCorners, 'T', "L F R' F' L' F R F'"],
      ['oll-bowtie', GROUPS.ollCorners, 'Bowtie', "F' L F R' F' L' F R"],
    ] as const
  ).map(([id, group, name, moves]) => ({ id, set: 'OLL-2LOOK' as const, group, name, moves, provenance: proposed })),
  ...(
    [
      ['pll-t', GROUPS.pllCorners, 'T-perm', "R U R' U' R' F R2 U' R' U' R U R' F'"],
      ['pll-y', GROUPS.pllCorners, 'Y-perm', "F R U' R' U' R U R' F' R U R' U' R' F R F'"],
      ['pll-ua', GROUPS.pllEdges, 'Ua-perm', "R U' R U R U R U' R' U' R2"],
      ['pll-ub', GROUPS.pllEdges, 'Ub-perm', "R2 U R U R' U' R' U' R' U R'"],
      ['pll-h', GROUPS.pllEdges, 'H-perm', "R2 U2 R U2 R2 U2 R2 U2 R U2 R2"],
      ['pll-z', GROUPS.pllEdges, 'Z-perm', "R' U' R U' R U R U' R' U R U R2 U' R' U"],
    ] as const
  ).map(([id, group, name, moves]) => ({ id, set: 'PLL-2LOOK' as const, group, name, moves, provenance: proposed })),
];

export const inGroup = (group: string): CfopAlgorithm[] =>
  CFOP_ALGORITHMS.filter((a) => a.group === group);

const idsOf = (set: CfopSet) => CFOP_ALGORITHMS.filter((a) => a.set === set).map((a) => a.id);

/** The CFOP lessons, one per stage. */
export const CFOP_STAGES: readonly StageInfo[] = [
  {
    number: 1,
    title: 'The cross',
    hold: 'Yellow on top, white on the bottom.',
    goal: 'A white cross on the bottom, each edge matching the center beside it.',
    howTo:
      "Put the four white edges in place one at a time on the bottom layer, without turning the cube over. It's the beginner white cross done upside down and without the daisy. Pick the edge that takes the fewest turns next.",
    tip: 'Planning the whole cross before you turn is the skill fast solvers practise. Take your time while you learn.',
    algorithmIds: [],
  },
  {
    number: 2,
    title: 'First two layers (F2L)',
    hold: 'Yellow on top.',
    goal: 'The first two layers done: the cross plus the four corner-and-edge pairs.',
    howTo:
      "Pick a slot: a bottom corner and the middle edge above it. Turn the whole cube so that slot is at the front right, turn the top to line up the case, then do its algorithm. It pairs the corner and edge in the top layer and drops them in together. If a piece you need is stuck in another slot, take it out first with R U R' from that slot.",
    tip: "There are 41 cases. You don't need them memorized to start: the Solve screen shows which one you have.",
    algorithmIds: idsOf('F2L'),
  },
  {
    number: 3,
    title: 'Yellow top (2-look OLL)',
    hold: 'Yellow on top.',
    goal: 'The whole top face yellow.',
    howTo:
      'Two looks. First make a yellow cross: a line, an L shape or a dot, one algorithm each. Then make the whole top yellow: 7 corner cases. Turn the top to line up the case before each algorithm; the Solve screen shows how.',
    algorithmIds: idsOf('OLL-2LOOK'),
  },
  {
    number: 4,
    title: 'Finish the top (2-look PLL)',
    hold: 'Yellow on top.',
    goal: 'Solved!',
    howTo:
      'Two looks. First put the corners in place: two side by side swapped (T-perm) or two diagonal swapped (Y-perm). Then the edges: Ua, Ub, H or Z. Finish by turning the top to line it up.',
    algorithmIds: idsOf('PLL-2LOOK'),
  },
];
```

- [ ] **Step 9: Run the library test and watch it pass**

Run: `npx vitest run src/content/cfop.test.ts src/solver/checks.test.ts`
Expected: PASS.
- If an exact-cover assertion fails, the message names the state's solver list. Do **not** change the test.
- Fix the algorithm instead, and ledger a ruling: every list here was verified before the plan was written, so a failure means a transcription slip.

- [ ] **Step 10: Full suite, typecheck, format, commit**

Run: `npx vitest run`, then `npm run typecheck`. Expected: all green.
Commit message: `feat: CFOP library (41 F2L, 2-look OLL and PLL), each case proven covered exactly once`.

---

### Task 3: Cross search

**Files:**
- Create: `src/solver/cross.ts`, `src/solver/cross.test.ts`

**Interfaces:**
- Consumes: `movePermutation(move)` (`src/cube/moves.ts`; `after[to]` = the square that moves to `to`); `EDGE_SLOTS`; `centerColor` and `faceOfSquare` from `checks.ts`.
- Produces: `crossMoves(cube: Cube, colors: readonly Color[], maxDepth = 10): Move[] | null`. This is the shortest sequence of U D R L F turns that puts every listed white edge in place on the bottom, or `null` if it needs more than `maxDepth` turns.

- [ ] **Step 1: Write the failing test** `src/solver/cross.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { applyMoves } from '../cube/moves';
import type { Move, MoveBase, Turns } from '../cube/notation';
import type { Color, Cube } from '../cube/types';
import { CFOP_HOME } from '../test-utils/cfopStates';
import { randomMoves, seededRandom } from '../test-utils/random';
import { BOTTOM_EDGES, centerColor, isCfopCross, isSlotSolved } from './checks';
import { crossMoves } from './cross';
import { reorientTo } from './plan';

/** Scrambled cubes held for CFOP (yellow on top, green facing you). */
function scrambles(count: number, seed: number): Cube[] {
  const random = seededRandom(seed);
  return Array.from({ length: count }, () => {
    const cube = applyMoves(CFOP_HOME, randomMoves(25, random));
    return applyMoves(cube, reorientTo(cube, 'Y', 'G'));
  });
}

const SIDES = (cube: Cube): Color[] => (['F', 'R', 'B', 'L'] as const).map((f) => centerColor(cube, f));

/** Is the white-`color` edge in place on the bottom? */
const edgeHome = (cube: Cube, color: Color) =>
  BOTTOM_EDGES.some((slot) => cube.stickers[slot.stickers[1]] === color && isSlotSolved(cube, slot));

/** Try every sequence of face turns, shortest first (slow, but obviously right). */
function bruteForce(cube: Cube, goal: (c: Cube) => boolean, maxDepth: number): number {
  const turns: Move[] = (['U', 'D', 'R', 'L', 'F', 'B'] as MoveBase[]).flatMap((base) =>
    ([1, 2, 3] as Turns[]).map((t) => ({ base, turns: t })),
  );
  let frontier = [cube];
  for (let depth = 0; depth <= maxDepth; depth++) {
    if (frontier.some(goal)) return depth;
    frontier = frontier.flatMap((c) => turns.map((t) => applyMoves(c, [t])));
  }
  return Infinity;
}

describe('crossMoves', () => {
  it('needs no turns when the edges are already in place', () => {
    expect(crossMoves(CFOP_HOME, SIDES(CFOP_HOME))).toEqual([]);
  });

  it('solves the whole cross on 200 scrambles', () => {
    for (const cube of scrambles(200, 5)) {
      const moves = crossMoves(cube, SIDES(cube));
      expect(moves).not.toBeNull();
      expect(isCfopCross(applyMoves(cube, moves!))).toBe(true);
    }
  });

  it('finds the shortest way to place one edge (checked against trying every sequence)', () => {
    for (const cube of scrambles(20, 11)) {
      const color = centerColor(cube, 'F');
      const moves = crossMoves(cube, [color])!;
      expect(moves.length).toBe(bruteForce(cube, (c) => edgeHome(c, color), 4));
    }
  });

  it('keeps edges already placed while adding the next one', () => {
    for (const cube of scrambles(30, 12)) {
      const [a, b] = SIDES(cube);
      const first = applyMoves(cube, crossMoves(cube, [a])!);
      const both = applyMoves(first, crossMoves(first, [a, b])!);
      expect(edgeHome(both, a) && edgeHome(both, b)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/solver/cross.test.ts`
Expected: FAIL, `Failed to resolve import "./cross"`.

- [ ] **Step 3: Implement** `src/solver/cross.ts`

```ts
import { movePermutation } from '../cube/moves';
import type { Move, MoveBase, Turns } from '../cube/notation';
import { EDGE_SLOTS } from '../cube/pieces';
import type { Color, Cube } from '../cube/types';
import { centerColor, faceOfSquare } from './checks';

/**
 * The CFOP white cross, solved on the bottom with yellow on top. Only the white edges
 * matter here, and each is tracked by where its white square is: that one square says
 * both which slot the edge is in and which way round it sits.
 *
 * Uses all six faces: the owner's no-back-turn rule is for the beginner method only.
 */
const FACE_BASES: readonly MoveBase[] = ['U', 'D', 'R', 'L', 'F', 'B'];
const CROSS_TURNS: readonly Move[] = FACE_BASES.flatMap((base) =>
  ([1, 2, 3] as Turns[]).map((turns) => ({ base, turns })),
);
const OPPOSITE: Partial<Record<MoveBase, MoveBase>> = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' };

/** WHERE[t][square]: where a square ends up after turn t. */
const WHERE: readonly number[][] = CROSS_TURNS.map((move) => {
  const after = movePermutation(move); // after[to] = the square that moves to `to`
  const where = new Array<number>(54);
  after.forEach((from, to) => {
    where[from] = to;
  });
  return where;
});

/**
 * Fewest turns from each square to `target`, counted outward from the target (a
 * breadth-first search). Every turn's reverse is also a turn, so "from" and "to" match.
 */
const tables = new Map<number, number[]>();
function distancesTo(target: number): number[] {
  const cached = tables.get(target);
  if (cached) return cached;
  const dist = new Array<number>(54).fill(Infinity);
  dist[target] = 0;
  let frontier = [target];
  for (let d = 1; frontier.length > 0; d++) {
    const next: number[] = [];
    for (const square of frontier) {
      for (const where of WHERE) {
        if (dist[where[square]] === Infinity) {
          dist[where[square]] = d;
          next.push(where[square]);
        }
      }
    }
    frontier = next;
  }
  tables.set(target, dist);
  return dist;
}

/** Where the white-`color` edge's white square is now, and where it belongs. */
function whiteSquare(cube: Cube, color: Color): { now: number; home: number } {
  const slot = EDGE_SLOTS.find(
    (s) => s.stickers.some((i) => cube.stickers[i] === 'W') && s.stickers.some((i) => cube.stickers[i] === color),
  );
  const homeSlot = EDGE_SLOTS.find(
    (s) => faceOfSquare(s.stickers[0]) === 'D' && centerColor(cube, faceOfSquare(s.stickers[1])) === color,
  );
  if (!slot || !homeSlot) throw new Error(`Couldn't find the white-${color} edge.`);
  return { now: slot.stickers.find((i) => cube.stickers[i] === 'W')!, home: homeSlot.stickers[0] };
}

/**
 * The shortest list of turns (at most `maxDepth`) that puts every listed white edge in
 * place on the bottom. It searches one turn deeper at a time and skips any branch the
 * distance tables prove can't finish in time ("IDA*"), which keeps it fast.
 */
export function crossMoves(cube: Cube, colors: readonly Color[], maxDepth = 10): Move[] | null {
  const edges = colors.map((color) => whiteSquare(cube, color));
  const dist = edges.map((edge) => distancesTo(edge.home));
  const estimate = (squares: readonly number[]) =>
    Math.max(0, ...squares.map((square, i) => dist[i][square]));
  const path: Move[] = [];

  const explore = (squares: number[], budget: number): boolean => {
    const needed = estimate(squares);
    if (needed === 0) return true;
    if (needed > budget) return false;
    const last = path[path.length - 1];
    for (let t = 0; t < CROSS_TURNS.length; t++) {
      const turn = CROSS_TURNS[t];
      if (last && turn.base === last.base) continue;
      if (last && OPPOSITE[turn.base] === last.base && turn.base < last.base) continue;
      path.push(turn);
      if (explore(squares.map((square) => WHERE[t][square]), budget - 1)) return true;
      path.pop();
    }
    return false;
  };

  const start = edges.map((edge) => edge.now);
  for (let budget = estimate(start); budget <= maxDepth; budget++) {
    if (explore(start, budget)) return [...path];
  }
  return null;
}
```

- [ ] **Step 4: Run and watch it pass**

Run: `npx vitest run src/solver/cross.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Full suite, typecheck, format, commit**

Commit message: `feat: CFOP cross search, one edge at a time`.

---

### Task 4: CFOP solver

**Files:**
- Create: `src/solver/cfop.ts`, `src/solver/cfop.test.ts`

**Interfaces:**
- Consumes: Task 1 (`PlanWriter`, `checkPlan`, `reorientTo`, `TOP_TURNS`, `CUBE_TURNS`); Task 2 (checks, `CFOP_ALGORITHMS`, `GROUPS`, `inGroup`, `CFOP_STAGES`); Task 3 (`crossMoves`).
- Produces: `solveCfop(start: Cube): SolveResult` and `cfopSelfCheck(plan: SolvePlan): string | null`.

- [ ] **Step 1: Write the failing test** `src/solver/cfop.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { CFOP_ALGORITHMS } from '../content/cfop';
import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { mustParse } from '../cube/notation';
import { fromPieces, readPieces } from '../cube/pieces';
import type { Cube } from '../cube/types';
import { CFOP_HOME } from '../test-utils/cfopStates';
import { randomMoves, seededRandom } from '../test-utils/random';
import { centerColor } from './checks';
import { cfopSelfCheck, solveCfop } from './cfop';
import { listSteps, type SolvePlan } from './plan';

function mustSolve(cube: Cube): SolvePlan {
  const result = solveCfop(cube);
  if (!result.ok) throw new Error(result.error);
  return result.plan;
}

const random = seededRandom(31);
const plans = Array.from({ length: 300 }, () => mustSolve(applyMoves(solved(), randomMoves(25, random))));
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
      expect([centerColor(afterFirst, 'U'), centerColor(afterFirst, 'F')], hold).toEqual(['Y', 'G']);
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
    expect(listSteps(plan).some(({ step }) => step.text.startsWith('Take its pieces out'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/solver/cfop.test.ts`
Expected: FAIL, `Failed to resolve import "./cfop"`.

- [ ] **Step 3: Implement** `src/solver/cfop.ts`

```ts
import { CFOP_ALGORITHMS, CFOP_STAGES, GROUPS, inGroup, type CfopAlgorithm } from '../content/cfop';
import { COLOR_NAMES, colorList } from '../cube/describe';
import { applyMoves, isSolved } from '../cube/moves';
import { mustParse, type Move } from '../cube/notation';
import type { Color, Cube } from '../cube/types';
import { validateStickers } from '../cube/validate';
import {
  F2L_PAIRS,
  centerColor,
  isCfopCross,
  isFlippedTwoLayers,
  isPairSolved,
  isYellowCross,
  isYellowFace,
  topCornersMatchAfterTopTurn,
} from './checks';
import { crossMoves } from './cross';
import {
  CUBE_TURNS,
  PlanWriter,
  TOP_TURNS,
  checkPlan,
  reorientTo,
  type SolvePlan,
  type SolveResult,
} from './plan';

const name = (color: Color) => COLOR_NAMES[color];
const MOVES = new Map(CFOP_ALGORITHMS.map((a) => [a.id, mustParse(a.moves)]));
const F2L = CFOP_ALGORITHMS.filter((a) => a.set === 'F2L');
const PULL_OUT = mustParse("R U R'");
const STAGE_GOALS = [isCfopCross, isFlippedTwoLayers, isYellowFace, isSolved];

/** A turn of the top plus one of `algorithms` that reaches `goal`, or null if none does. */
function findCase(
  cube: Cube,
  algorithms: readonly CfopAlgorithm[],
  goal: (cube: Cube) => boolean,
): { moves: Move[]; algorithm: CfopAlgorithm } | null {
  for (const algorithm of algorithms) {
    for (const top of TOP_TURNS) {
      const moves = [...top, ...MOVES.get(algorithm.id)!];
      if (goal(applyMoves(cube, moves))) return { moves, algorithm };
    }
  }
  return null;
}

// ── Stage 1: the cross ──────────────────────────────────────────────────

function cross(w: PlanWriter): void {
  w.startStage(1);
  w.rotate(
    reorientTo(w.cube, 'Y', 'G'),
    'Turn the cube so yellow is on top: CFOP builds the white cross on the bottom.',
    'Yellow is already on top, with green facing you.',
  );
  const sides = (['F', 'R', 'B', 'L'] as const).map((face) => centerColor(w.cube, face));
  const placed: Color[] = [];
  while (placed.length < sides.length) {
    // Next, the edge that takes the fewest turns (keeping the ones already placed).
    let best: { color: Color; moves: Move[] } | null = null;
    for (const color of sides) {
      if (placed.includes(color)) continue;
      const moves = crossMoves(w.cube, [...placed, color]);
      if (!moves) throw new Error(`Couldn't place the white-${name(color)} edge.`);
      if (!best || moves.length < best.moves.length) best = { color, moves };
    }
    if (!best) break;
    w.step(
      'moves',
      best.moves,
      `Put the white-${name(best.color)} edge on the bottom, under the ${name(best.color)} center, with its white square facing down.`,
    );
    placed.push(best.color);
  }
}

// ── Stage 2: F2L ────────────────────────────────────────────────────────

const FRONT_RIGHT = F2L_PAIRS[0];
const frontRightDone = (cube: Cube) => isCfopCross(cube) && isPairSolved(cube, FRONT_RIGHT);
/** The front-right slot's two colors, e.g. "green-orange". */
const slotName = (cube: Cube) => colorList([centerColor(cube, 'F'), centerColor(cube, 'R')]);

/** Does the front-right slot hold a piece that belongs somewhere else? */
function holdsWrongPiece(cube: Cube): boolean {
  const wanted = new Set<Color>(['W', centerColor(cube, 'F'), centerColor(cube, 'R')]);
  const [corner, edge] = FRONT_RIGHT;
  return [...corner.stickers, ...edge.stickers].some((square) => !wanted.has(cube.stickers[square]));
}

function firstTwoLayers(w: PlanWriter): void {
  w.startStage(2);
  for (let guard = 0; guard < 16; guard++) {
    if (isFlippedTwoLayers(w.cube)) return;
    // Try every unfinished slot from the front right, and take the shortest.
    let best: { quarters: number; moves: Move[]; algorithm: CfopAlgorithm } | null = null;
    for (let quarters = 0; quarters < 4; quarters++) {
      const turned = applyMoves(w.cube, CUBE_TURNS[quarters]);
      if (isPairSolved(turned, FRONT_RIGHT)) continue;
      const found = findCase(turned, F2L, frontRightDone);
      if (found && (!best || found.moves.length < best.moves.length)) best = { quarters, ...found };
    }
    if (best) {
      const slot = slotName(applyMoves(w.cube, CUBE_TURNS[best.quarters]));
      w.rotate(
        CUBE_TURNS[best.quarters],
        `Turn the whole cube so the ${slot} slot is at the front right.`,
        `The ${slot} slot is already at the front right.`,
      );
      w.step(
        'moves',
        best.moves,
        `Turn the top to line up the ${slot} corner and edge, then do ${best.algorithm.name} to drop them into the slot together.`,
        best.algorithm.id,
      );
      continue;
    }
    // No slot can be finished yet: a piece is stuck in another slot. Take one out.
    const quarters = [0, 1, 2, 3].find((q) => holdsWrongPiece(applyMoves(w.cube, CUBE_TURNS[q])));
    if (quarters === undefined) break;
    w.rotate(
      CUBE_TURNS[quarters],
      'Turn the whole cube so the slot holding the wrong pieces is at the front right.',
      'The slot at the front right holds the wrong pieces.',
    );
    w.step('moves', PULL_OUT, "Take its pieces out to the top layer with R U R', so they can go where they belong.");
  }
  if (!isFlippedTwoLayers(w.cube)) throw new Error("Couldn't finish the first two layers.");
}

// ── Stages 3 and 4: the last layer ──────────────────────────────────────

function lookAndDo(w: PlanWriter, group: string, goal: (cube: Cube) => boolean, what: string): void {
  if (goal(w.cube)) return;
  const found = findCase(w.cube, inGroup(group), goal);
  if (!found) throw new Error(`Couldn't ${what}.`);
  w.step(
    'moves',
    found.moves,
    `${what[0].toUpperCase()}${what.slice(1)}: it's the ${found.algorithm.name} case, so turn the top to line it up and do its algorithm.`,
    found.algorithm.id,
  );
}

const lastLayerLinesUp = (cube: Cube) => TOP_TURNS.some((turn) => isSolved(applyMoves(cube, turn)));

function yellowTop(w: PlanWriter): void {
  w.startStage(3);
  lookAndDo(w, GROUPS.ollEdges, isYellowCross, 'make the yellow cross');
  lookAndDo(w, GROUPS.ollCorners, isYellowFace, 'make the whole top yellow');
}

function finishTop(w: PlanWriter): void {
  w.startStage(4);
  lookAndDo(w, GROUPS.pllCorners, topCornersMatchAfterTopTurn, 'put the corners in place');
  lookAndDo(w, GROUPS.pllEdges, lastLayerLinesUp, 'put the edges in place');
  const k = TOP_TURNS.findIndex((turn) => isSolved(applyMoves(w.cube, turn)));
  w.step('moves', TOP_TURNS[k], 'Turn the top to line it up. Solved!');
}

/** Replay a CFOP plan and confirm each stage reaches its goal and the cube ends solved. */
export function cfopSelfCheck(plan: SolvePlan): string | null {
  return checkPlan(plan, STAGE_GOALS);
}

/** Work out a CFOP solve (cross, F2L, 2-look OLL, 2-look PLL) for this cube. */
export function solveCfop(start: Cube): SolveResult {
  const check = validateStickers(start.stickers);
  if (!check.ok) return { ok: false, error: check.problems.map((p) => p.message).join(' ') };
  try {
    const w = new PlanWriter(start, CFOP_STAGES.map((s) => s.title));
    cross(w);
    firstTwoLayers(w);
    yellowTop(w);
    finishTop(w);
    const plan: SolvePlan = { start, stages: w.finish() };
    const problem = cfopSelfCheck(plan);
    return problem ? { ok: false, error: problem } : { ok: true, plan };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `${detail} This is a bug in the app, not a problem with your cube.` };
  }
}
```

- [ ] **Step 4: Run and watch it pass**

Run: `npx vitest run src/solver/cfop.test.ts`
Expected: PASS, 7 tests.
- If "takes pieces out" loops (guard reached), stop and debug with superpowers:systematic-debugging.
- The likely fix is choosing a pull-out slot that holds a piece *another unfinished slot* needs. Ledger the ruling.

- [ ] **Step 5: Measure, then record the figures** (spec §7: "measured and reported, not assumed")

1. Create a temporary `src/zz-measure.test.ts`. It solves 1,000 scrambles (`seededRandom(99)`, 25 moves, like the beginner measurement) and prints:
   - the **longest cross** in layer turns;
   - min, median and max **layer turns** per solve, not counting whole-cube turns;
   - min, median and max **steps**;
   - how many solves needed a pull-out;
   - the average milliseconds per solve.
2. Run it with `npx vitest run src/zz-measure.test.ts --silent=false`.
3. Copy the printed figures into `docs/phase-3b-review-notes.md` (Task 6), with the seed and the command.
4. Delete the file.

- [ ] **Step 6: Full suite, typecheck, format, commit**

Commit message: `feat: CFOP solver (cross, F2L, 2-look OLL and PLL) with self-check`.

---

### Task 5: Screens: method choice, CFOP track, key, words for cube turns

**Files:**
- Create: `src/content/methods.ts`, `src/content/algorithms.ts`, `src/content/algorithms.test.ts`
- Modify: `src/content/demo.ts`, `src/content/demo.test.ts`, `src/content/cubeTurnWords.ts` (+ test), `src/content/moveKey.ts` (+ test), `src/app/App.tsx`, `src/app/SolveScreen.tsx`, `src/app/LearnScreen.tsx`, `src/app/MoveKey.tsx`, `src/app/CubePlayer.tsx` (no change; takes `label`)

**Interfaces:**
- Produces:
  - `Method = 'beginner' | 'cfop'`
  - `METHODS: readonly { method: Method; label: string }[]`
  - `STAGES_FOR: Record<Method, readonly StageInfo[]>`
  - `solveWith(method, cube): SolveResult`
  - `findAlgorithm(id): AlgorithmInfo`
  - `demoPlan(method)`, `demoStage(index, method)`
  - `plainMoveLabel(move)` (renamed from `beginnerMoveLabel`)
  - `KeyMethod = 'beginner' | 'cfop' | 'all'`
  - `SolveState.method`

- [ ] **Step 1: Write the failing tests**

`src/content/algorithms.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { BEGINNER_ALGORITHMS } from './beginner';
import { CFOP_ALGORITHMS } from './cfop';
import { findAlgorithm } from './algorithms';

describe('findAlgorithm', () => {
  it('finds every beginner and CFOP algorithm by id, and ids never clash', () => {
    const ids = [...Object.values(BEGINNER_ALGORITHMS), ...CFOP_ALGORITHMS].map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(findAlgorithm(id).id).toBe(id);
  });

  it('says clearly when an id is unknown', () => {
    expect(() => findAlgorithm('nope')).toThrow('Unknown algorithm: nope');
  });
});
```

Replace `src/content/demo.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { demoPlan, demoStage } from './demo';

describe('Learn screen examples', () => {
  it('beginner: real moves to watch in every stage except the "look" stages', () => {
    demoPlan('beginner').stages.forEach((stage, i) => {
      if (stage.number === 5 || stage.number === 7) return;
      expect(demoStage(i, 'beginner').moves.length, `stage ${stage.number}`).toBeGreaterThan(0);
    });
  });

  it('CFOP: real moves to watch in every stage', () => {
    demoPlan('cfop').stages.forEach((stage, i) => {
      expect(demoStage(i, 'cfop').moves.length, `stage ${stage.number}`).toBeGreaterThan(0);
    });
  });
});
```

In `src/content/moveKey.test.ts`:
- give `lettersTheBeginnerLessonsUse` a twin, `lettersTheCfopLessonsUse`: every move of `CFOP_ALGORITHMS`, plus `solveCfop` on the same 300 scrambles;
- add a test: `'the CFOP key covers exactly the moves the CFOP lessons use'` (letters from `keyEntries('cfop')` plus `CUBE_TURN_WORDS` bases equal `lettersTheCfopLessonsUse()`);
- add a test: `keyEntries('cfop')` has no x/y/z (they are words), and `readingTips('cfop')` has no wide-turn tip.

The CFOP letters are expected to be `B D F L R U x y z`, because the cross search may turn the back face. If the 300 solves never happen to use B, the test fails and says so. Then rule on it rather than forcing B in. In `src/content/cubeTurnWords.test.ts`, replace `beginnerMoveLabel` with `plainMoveLabel`.

- [ ] **Step 2: Run and watch them fail**

Run: `npx vitest run src/content`
Expected: FAIL: `./algorithms` is missing, `demoPlan` doesn't take a method, `plainMoveLabel` and `'cfop'` key entries don't exist.

- [ ] **Step 3: Implement the content pieces**

`src/content/methods.ts`:

```ts
import { solveBeginner } from '../solver/beginner';
import { solveCfop } from '../solver/cfop';
import type { SolveResult } from '../solver/plan';
import type { Cube } from '../cube/types';
import { BEGINNER_STAGES, type StageInfo } from './beginner';
import { CFOP_STAGES } from './cfop';

/** The solving methods the app teaches. */
export type Method = 'beginner' | 'cfop';

export const METHODS: readonly { method: Method; label: string }[] = [
  { method: 'beginner', label: 'Beginner (daisy)' },
  { method: 'cfop', label: 'CFOP' },
];

export const STAGES_FOR: Record<Method, readonly StageInfo[]> = {
  beginner: BEGINNER_STAGES,
  cfop: CFOP_STAGES,
};

export function solveWith(method: Method, cube: Cube): SolveResult {
  return method === 'cfop' ? solveCfop(cube) : solveBeginner(cube);
}
```

`src/content/algorithms.ts`:

```ts
import { BEGINNER_ALGORITHMS, type Provenance } from './beginner';
import { CFOP_ALGORITHMS } from './cfop';

/** What a card needs to show any algorithm, beginner or CFOP. */
export interface AlgorithmInfo {
  id: string;
  name: string;
  moves: string;
  provenance: Provenance;
  group?: string;
}

const ALL: readonly AlgorithmInfo[] = [...Object.values(BEGINNER_ALGORITHMS), ...CFOP_ALGORITHMS];

export function findAlgorithm(id: string): AlgorithmInfo {
  const found = ALL.find((a) => a.id === id);
  if (!found) throw new Error(`Unknown algorithm: ${id}`);
  return found;
}
```

`src/content/demo.ts`: cache one plan per method.

```ts
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
```

`src/content/cubeTurnWords.ts`: rename `beginnerMoveLabel` → `plainMoveLabel`, with the doc comment "How the lesson screens write a move: …".

`src/content/moveKey.ts`:
- `export type KeyMethod = 'beginner' | 'cfop' | 'all';`
- `KEY_METHODS`: `[{ 'beginner', 'Beginner (daisy) method' }, { 'cfop', 'CFOP' }, { 'all', 'All moves' }]`
- `const CFOP_MOVES: readonly MoveBase[] = ['U', 'D', 'R', 'L', 'F', 'B'];` (comment: the side-turn letters the CFOP lessons use; B is allowed outside the beginner method)
- `keyEntries`: `'all'` → `MOVE_KEY`; otherwise filter by `BEGINNER_MOVES` or `CFOP_MOVES`
- `readingTips`: `'all'` → all tips; otherwise without the wide-turn tip.

- [ ] **Step 4: Update the screens**

- `src/app/App.tsx`:
  - `SolveState` gains `method: Method`. The initial state and `onNewScramble` keep the current method: `setSolve({ ...solve, useEntered: false, scramble: randomScramble(), index: 0 })`, and the initial state has `method: 'beginner'`.
  - `onSolveCube` already spreads `solve`.
- `src/app/SolveScreen.tsx`:
  - `import { METHODS, STAGES_FOR, solveWith } from '../content/methods'`.
  - `const result = useMemo(() => solveWith(state.method, start), [state.method, start]);`.
  - The stage list maps `STAGES_FOR[state.method]` instead of `BEGINNER_STAGES`.
  - Add a method row above the cube buttons:

```tsx
<div className="controls" role="group" aria-label="Method">
  {METHODS.map(({ method, label }) => (
    <button
      key={method}
      className={state.method === method ? 'active' : ''}
      onClick={() => onStateChange({ ...state, method, index: 0 })}
    >
      {label}
    </button>
  ))}
</div>
```

  - `label={plainMoveLabel}` on `CubePlayer`.
- `src/app/LearnScreen.tsx`:
  - Add `const [method, setMethod] = useState<Method>('beginner')`, with the same `METHODS` button row. Switching sets `setSelected(0)`.
  - `const stages = STAGES_FOR[method]`, and `demoStage(selected, method)`.
  - The heading is `Learn: {method === 'cfop' ? 'CFOP' : 'the beginner method'}`, and the hint text depends on the method.
  - `AlgorithmCard` uses `findAlgorithm(id)` instead of `algorithmById`.
  - Cards are grouped: when the stage's algorithms have a `group`, render one `<details>` per group, with `<summary>{group} ({count})</summary>` and the cards inside. Otherwise render the cards as today.

```tsx
function AlgorithmList({ ids }: { ids: readonly string[] }) {
  const algorithms = ids.map(findAlgorithm);
  const groups = [...new Set(algorithms.map((a) => a.group))];
  if (groups.length === 1 && groups[0] === undefined) {
    return <>{ids.map((id) => <AlgorithmCard key={id} id={id} />)}</>;
  }
  return (
    <>
      {groups.map((group) => {
        const inGroup = algorithms.filter((a) => a.group === group);
        return (
          <details key={group} className="algorithm-group">
            <summary>
              {group} ({inGroup.length})
            </summary>
            {inGroup.map((a) => (
              <AlgorithmCard key={a.id} id={a.id} />
            ))}
          </details>
        );
      })}
    </>
  );
}
```

- `src/app/MoveKey.tsx`:
  - `useState<KeyMethod>('beginner')` (unchanged);
  - the words section shows when `method !== 'all'`;
  - the note on x/y/z rows reads "Lesson screens say …".
- `src/app/app.css`: add `.algorithm-group { margin: 6px 0; } .algorithm-group summary { cursor: pointer; font-weight: 600; }`.

- [ ] **Step 5: Run everything**

Run: `npx vitest run`, then `npm run typecheck`, then `npm run build`.
Expected: all green.

- [ ] **Step 6: Check in the browser** (dev server on 5190; hidden-tab rule: yield with MessageChannel ticks, not timers)

1. **Solve screen:** switch to CFOP partway through a beginner solve. The step shows "Step 1", and the stage list shows the 4 CFOP stages. Step through to the end: cube turns read SPIN/TIP/ROLL, and the algorithm cards show the case names.
2. **Learn screen:** the CFOP track shows 4 lessons. F2L shows 4 collapsible groups (24, 6, 6, 5), and the examples animate.
3. **Move key:** three options. Beginner shows no B; CFOP shows B. Both show the words section.

- [ ] **Step 7: Format, commit**

Commit message: `feat: choose Beginner or CFOP on the Solve and Learn screens`.

---

### Task 6: Docs, final review, PR

- [ ] **Step 1: Docs**
  - **`CLAUDE.md` Status:** add "Phase ③b-1 (CFOP solve path) is built on branch `phase-3b-cfop` (stacked on ③a)". Also fix the stale "Design approved; no code yet" line.
  - **`docs/decisions-log.md`:** add D1–D6 of this plan as #29–#34. Mark them "Owner, 2026-09-28". D2/D4/D6 carry the revision.
  - **`docs/phase-3b-review-notes.md`**, containing:
    - the Task 4 measurements (seed, command, figures);
    - D1–D6 as approved (owner, 2026-09-28, with D2/D4/D6 revised for "no-B is beginner-only");
    - the 4 F2L algorithms that came from the shortest-moves search (24, 29, 30, 36), for the owner to compare with how they'd do those cases;
    - every ruling from the ledger.

- [ ] **Step 2: Final whole-branch review.**
  - Use a fresh reviewer on the most capable model (superpowers:executing-plans, Final Review), with this plan's Review Focus verbatim.
  - Re-grade findings by their effect on the owner.
  - Fix Critical/Important findings with RED→GREEN tests, and ledger the minors.

- [ ] **Step 3: Push and open the PR against `phase-3a-beginner`** (stacked, like #3 on #2). The PR body ends with the standard Claude Code line.

---

## Self-review notes (plan author)

- **Spec coverage:**
  - §9 hold → Task 4 `cross`
  - cross search → Task 3
  - F2L one slot at a time, pull-out, 41-case lookup → Task 4
  - OLL/PLL recognition over 4 top turns → `findCase`
  - §7 enumeration → Task 2
  - CFOP stress test and measured longest cross → Task 4
  - provenance → Task 2
  - Learn CFOP track → Task 5
- **Deferred to ③b-2 (stated above):** full OLL/PLL, the Algorithms screen, case diagrams, the 2-look/full choice, progress storage.
- **Types:** these names are the same in every task:
  - `CfopAlgorithm`, `GROUPS`, `inGroup`, `CFOP_STAGES`, `F2L_PAIRS`
  - `isPairSolved`, `isYellowFace`, `topCornersMatchAfterTopTurn`
  - `crossMoves`, `solveCfop`, `cfopSelfCheck`
  - `PlanWriter(start, titles)`, `checkPlan`, `listSteps`
  - `solveWith`, `STAGES_FOR`, `findAlgorithm`, `plainMoveLabel`, `KeyMethod 'beginner' | 'cfop' | 'all'`
