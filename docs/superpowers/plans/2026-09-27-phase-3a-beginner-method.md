# Phase ③a: Beginner (Daisy) Method: Solver, Learn and Solve Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Teach the owner's 10-stage daisy method (Learn screen) and walk a user through solving *their own* cube stage by stage (Solve my cube screen), with every stage self-checked.

**Architecture:** `src/solver/checks.ts` defines each stage's goal as a test on the cube, read relative to the centers. `src/content/beginner.ts` holds the 10 stage lessons and the algorithms, each with its provenance. `src/solver/beginner.ts` builds a `SolvePlan` stage by stage, following the owner's procedure (see `reference/beginner-method/README.md`). It uses a small search only for the intuitive daisy stage. For the few "how to hold it" choices the owner did not specify, it tries all four holds and keeps the one that works. Tests then prove which hold that is, and the lesson text must say the same. Before any plan is shown, `selfCheck` replays it and confirms every stage goal and the final solved state. The UI extracts a reusable `CubePlayer` from the algorithm player and adds Learn and Solve screens.

**Tech Stack:** unchanged (TypeScript, React, Vite, Three.js, Vitest).

**Spec:** `docs/superpowers/specs/2026-09-27-cube-learning-app-design.md` (§3.2 content, §3.3 solver + self-check, §3.6 screens, §4 data flow, §7 testing, §8 beginner method, §10 phase ③a)

## Scope notes

- **Progress saving** (spec §3.6, "lessons done" in browser storage) moves to phase ③b, alongside the CFOP track. Phase ③a has no progress to save yet beyond lessons, and the owner wants the draft to review first.
- **All algorithms except the yellow cross stay `claude-proposed`** until the owner checks them on the real cube (spec §8). The app shows a "Proposed" badge on each one.
- **Holds the owner didn't specify** (stage 8 edge swap, stage 9 corner cycle) are found by the solver and pinned by tests. The lesson text states the hold the tests prove.

## Global Constraints

- Everything runs in the browser; no backend.
- TypeScript strict; `npm run typecheck`, `npm test`, `npm run build` pass at the end of every task.
- User-facing text says **"squares"**, never "stickers"; places are top/bottom/front/back/left/right; colors by name.
- Face order U R F D L B; standard color scheme (white/yellow, red/orange, green/blue opposite).
- Beginner holds (owner's method, spec §8): stage 1 **yellow on top**; stages 2 (after the flip) to 4 **white on top**; stages 5 to 10 **yellow on top**. The solver always keeps **green facing you** when turning the cube over.
- Turning the cube over is described by naming the end position, never a roll/tip motion.
- The model is the source of truth; every plan is replayed by `selfCheck` before it's shown. On failure, show an error that says it's an app bug, never a wrong solve.
- Readable over clever; concept-level comments for a beginner reader.
- Windows / PowerShell 5.1: no `&&`; quote the project path (it has an apostrophe). Commit trailer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Every real scramble must be solved, and every stage must reach its goal.** A broken stage would leave a beginner stuck mid-solve. Test: Task 3, "solves 300 random scrambles…".
2. **The lesson text must match what the solver actually does** (holds, repeat counts). Otherwise the owner's friends follow the words and fail. Tests: Task 3 "stage 6 holds match the owner's procedure", "stage 8 and 9 always use one hold, and the lesson says which".
3. **A cube entered in any orientation** (the owner's editable centers) must still get a correct plan that starts by naming how to hold it. Test: Task 3 "starts by turning the cube so yellow is on top and green faces you, whatever the hold".
4. **An impossible cube** must never get a plan; it gets the validation message. Test: Task 3 "refuses a cube that cannot be solved…".
5. **Stepping backward and forward through a plan** must always show the cube as it should be at that step. Test: Task 3 "listSteps gives each step the cube it starts from".

## File map

| File | Responsibility |
|---|---|
| `src/cube/describe.ts` | + `faceWord(face)` |
| `src/cube/scramble.ts` | Random face-turn scrambles |
| `src/solver/checks.ts` | "Is this slot solved?", the ten stage goals |
| `src/solver/search.ts` | Shortest face-turn sequence that reaches a goal (for the daisy) |
| `src/content/beginner.ts` | Beginner algorithms (with provenance), 10 stage lessons, demo scramble |
| `src/solver/beginner.ts` | The beginner solver, `selfCheck`, `listSteps` |
| `src/app/CubePlayer.tsx` | Reusable 3D player (extracted from PlayerScreen) |
| `src/app/PlayerScreen.tsx` | Algorithm box + CubePlayer |
| `src/app/LearnScreen.tsx` | Beginner lessons with a demo for each stage |
| `src/app/SolveScreen.tsx` | Step-by-step solve of the entered cube or a random scramble |
| `src/app/EnterCubeScreen.tsx` | + "Solve this cube" button |
| `src/app/App.tsx` | Four tabs |
| `src/app/app.css` | Styles for lessons, stage list, badges |

---

### Task 1: Building blocks (stage checks, search, scramble, faceWord)

**Files:**
- Modify: `src/cube/describe.ts`, `src/cube/describe.test.ts`
- Create: `src/cube/scramble.ts`, `src/solver/checks.ts`, `src/solver/search.ts`
- Test: `src/cube/scramble.test.ts`, `src/solver/checks.test.ts`, `src/solver/search.test.ts`

**Interfaces:**
- Produces:
  - `describe.ts`: `faceWord(face: Face): string` ('top', 'bottom', 'front', 'back', 'left', 'right')
  - `scramble.ts`: `randomScramble(length?: number, random?: () => number): Move[]` (face turns only, never the same face twice in a row)
  - `checks.ts`: `centerColor(cube, face): Color`; `faceOfSquare(square): Face`; `isSlotSolved(cube, slot: { stickers: readonly number[] }): boolean`; `TOP_EDGES`, `BOTTOM_EDGES`, `MIDDLE_EDGES`, `TOP_CORNERS`, `BOTTOM_CORNERS` (slices of `EDGE_SLOTS`/`CORNER_SLOTS`); `TOP_EDGE_SQUARES = [1, 3, 5, 7]`; `allSlotsSolved(cube, slots)`; stage goals `isDaisy`, `isWhiteCross`, `isFirstLayer`, `isFirstTwoLayers`, `isFlippedTwoLayers`, `isYellowCross`, `areYellowEdgesSolved`, `isCornerInPlace(cube, slot)`, `areYellowCornersPlaced`
  - `search.ts`: `searchMoves(start: Cube, goal: (c: Cube) => boolean, maxDepth: number): Move[] | null`

- [ ] **Step 1: Write the failing tests**

Append to `src/cube/describe.test.ts` (inside the existing `describe('describe', …)` block, before its closing `});`):
```ts
  it('names a single face', () => {
    expect(faceWord('U')).toBe('top');
    expect(faceWord('B')).toBe('back');
  });
```
and add `faceWord` to that file's import from `./describe`.

`src/cube/scramble.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { seededRandom } from '../test-utils/random';
import { randomScramble } from './scramble';

describe('randomScramble', () => {
  it('makes 25 face turns, never the same face twice in a row', () => {
    const moves = randomScramble(25, seededRandom(5));
    expect(moves).toHaveLength(25);
    expect(moves.every((m) => 'URFDLB'.includes(m.base))).toBe(true);
    moves.slice(1).forEach((m, i) => expect(m.base).not.toBe(moves[i].base));
  });
});
```

`src/solver/checks.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { mustParse } from '../cube/notation';
import type { Cube } from '../cube/types';
import {
  areYellowCornersPlaced,
  areYellowEdgesSolved,
  isDaisy,
  isFirstLayer,
  isFirstTwoLayers,
  isFlippedTwoLayers,
  isWhiteCross,
  isYellowCross,
} from './checks';

const apply = (cube: Cube, text: string) => applyMoves(cube, mustParse(text));

describe('stage goals', () => {
  it('sees a solved cube held white-up as done through stage 4', () => {
    const cube = solved();
    expect([isWhiteCross(cube), isFirstLayer(cube), isFirstTwoLayers(cube)]).toEqual([true, true, true]);
    expect(isDaisy(cube)).toBe(false);
  });

  it('sees a solved cube held yellow-up as done for stages 5 to 9', () => {
    const cube = apply(solved(), 'z2');
    expect([
      isFlippedTwoLayers(cube),
      isYellowCross(cube),
      areYellowEdgesSolved(cube),
      areYellowCornersPlaced(cube),
    ]).toEqual([true, true, true, true]);
  });

  it('knows a turned top layer still has the yellow cross but not matching edges', () => {
    const cube = apply(solved(), 'z2 U');
    expect(isYellowCross(cube)).toBe(true);
    expect(areYellowEdgesSolved(cube)).toBe(false);
    expect(areYellowCornersPlaced(cube)).toBe(false);
  });

  it('recognizes a daisy: white edges around the yellow center', () => {
    // Yellow up, then lift the four white-cross edges from the bottom to the top.
    expect(isDaisy(apply(solved(), 'z2 F2 R2 B2 L2'))).toBe(true);
    expect(isDaisy(apply(solved(), 'z2 F2 R2 B2'))).toBe(false);
  });

  it('notices when a turn breaks the first layer', () => {
    expect(isFirstLayer(apply(solved(), 'R'))).toBe(false);
    expect(isFlippedTwoLayers(apply(solved(), 'z2 R'))).toBe(false);
  });
});
```

`src/solver/search.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { formatAlgorithm, mustParse } from '../cube/notation';
import type { Cube } from '../cube/types';
import { searchMoves } from './search';

const isHome = (c: Cube) => c.stickers.join('') === solved().stickers.join('');

describe('searchMoves', () => {
  it('returns no moves when the goal is already met', () => {
    expect(searchMoves(solved(), isHome, 3)).toEqual([]);
  });

  it('finds the shortest undo', () => {
    const moves = searchMoves(applyMoves(solved(), mustParse('R U')), isHome, 3);
    expect(moves && formatAlgorithm(moves)).toBe("U' R'");
  });

  it('gives up beyond the depth limit', () => {
    expect(searchMoves(applyMoves(solved(), mustParse('R U F')), isHome, 2)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/cube/describe.test.ts src/cube/scramble.test.ts src/solver`
Expected: FAIL: `faceWord` is not exported; `./scramble`, `./checks`, `./search` can't be resolved.

- [ ] **Step 3: Implement**

Add to `src/cube/describe.ts` (after `placeName`):
```ts
/** One face in everyday words, e.g. 'U' → "top". */
export function faceWord(face: Face): string {
  return FACE_WORDS[face];
}
```

`src/cube/scramble.ts`:
```ts
import type { Move, Turns } from './notation';

const FACE_BASES = ['U', 'R', 'F', 'D', 'L', 'B'] as const;

/** A random scramble of face turns, never turning the same face twice in a row. */
export function randomScramble(length = 25, random: () => number = Math.random): Move[] {
  const moves: Move[] = [];
  while (moves.length < length) {
    const base = FACE_BASES[Math.floor(random() * FACE_BASES.length)];
    if (moves.length > 0 && moves[moves.length - 1].base === base) continue;
    moves.push({ base, turns: (1 + Math.floor(random() * 3)) as Turns });
  }
  return moves;
}
```

`src/solver/checks.ts`:
```ts
import { CORNER_SLOTS, EDGE_SLOTS, type CornerSlot } from '../cube/pieces';
import { isSolved } from '../cube/moves';
import { FACES, type Color, type Cube, type Face } from '../cube/types';

/**
 * Tests for "is this part of the cube done?". Everything is judged against the
 * center colors, so it works however the cube is held.
 */

export function centerColor(cube: Cube, face: Face): Color {
  return cube.stickers[FACES.indexOf(face) * 9 + 4];
}

/** Squares are numbered face by face, 9 per face, so the face is the index ÷ 9. */
export function faceOfSquare(square: number): Face {
  return FACES[Math.floor(square / 9)];
}

type SlotLike = { readonly stickers: readonly number[] };

/** A slot is solved when every square on it matches the center of the face it's on. */
export function isSlotSolved(cube: Cube, slot: SlotLike): boolean {
  return slot.stickers.every((s) => cube.stickers[s] === centerColor(cube, faceOfSquare(s)));
}

export function allSlotsSolved(cube: Cube, slots: readonly SlotLike[]): boolean {
  return slots.every((slot) => isSlotSolved(cube, slot));
}

export const TOP_EDGES = EDGE_SLOTS.slice(0, 4); // UR UF UL UB
export const BOTTOM_EDGES = EDGE_SLOTS.slice(4, 8); // DR DF DL DB
export const MIDDLE_EDGES = EDGE_SLOTS.slice(8, 12); // FR FL BL BR
export const TOP_CORNERS = CORNER_SLOTS.slice(0, 4); // URF UFL ULB UBR
export const BOTTOM_CORNERS = CORNER_SLOTS.slice(4, 8); // DFR DLF DBL DRB

/** The four middle-edge squares of the top face (back, left, right, front). */
export const TOP_EDGE_SQUARES = [1, 3, 5, 7] as const;

const topEdgesAre = (cube: Cube, color: Color) =>
  TOP_EDGE_SQUARES.every((square) => cube.stickers[square] === color);

// ── The goal of each stage ──────────────────────────────────────────────

/** Stage 1: yellow on top with a white "petal" on each side of the yellow center. */
export const isDaisy = (cube: Cube) => centerColor(cube, 'U') === 'Y' && topEdgesAre(cube, 'W');

/** Stage 2: white on top with a white cross whose edges match the side centers. */
export const isWhiteCross = (cube: Cube) =>
  centerColor(cube, 'U') === 'W' && allSlotsSolved(cube, TOP_EDGES);

/** Stage 3: the whole white layer. */
export const isFirstLayer = (cube: Cube) => isWhiteCross(cube) && allSlotsSolved(cube, TOP_CORNERS);

/** Stage 4: white layer plus the middle layer. */
export const isFirstTwoLayers = (cube: Cube) =>
  isFirstLayer(cube) && allSlotsSolved(cube, MIDDLE_EDGES);

/** Stage 5: turned over, so yellow is on top and the two finished layers are underneath. */
export const isFlippedTwoLayers = (cube: Cube) =>
  centerColor(cube, 'U') === 'Y' &&
  allSlotsSolved(cube, [...BOTTOM_EDGES, ...BOTTOM_CORNERS, ...MIDDLE_EDGES]);

/** Stage 6: a yellow cross on top. */
export const isYellowCross = (cube: Cube) => isFlippedTwoLayers(cube) && topEdgesAre(cube, 'Y');

/** Stage 8: the yellow edges also match their side centers. */
export const areYellowEdgesSolved = (cube: Cube) =>
  isFlippedTwoLayers(cube) && allSlotsSolved(cube, TOP_EDGES);

/** A corner is "in place" when it has the right three colors, even if it's twisted. */
export function isCornerInPlace(cube: Cube, slot: CornerSlot): boolean {
  const wanted = slot.faces.map((face) => centerColor(cube, face));
  const present = slot.stickers.map((square) => cube.stickers[square]);
  return wanted.every((color) => present.includes(color));
}

/** Stage 9: every top corner is in its place (maybe twisted). */
export const areYellowCornersPlaced = (cube: Cube) =>
  areYellowEdgesSolved(cube) && TOP_CORNERS.every((slot) => isCornerInPlace(cube, slot));

/** Stage 10: solved. */
export { isSolved };
```

`src/solver/search.ts`:
```ts
import { applyMove } from '../cube/moves';
import type { Move, MoveBase, Turns } from '../cube/notation';
import type { Cube } from '../cube/types';

const FACE_TURNS: readonly Move[] = (['U', 'D', 'R', 'L', 'F', 'B'] as const).flatMap((base) =>
  ([1, 2, 3] as Turns[]).map((turns) => ({ base, turns })),
);
const OPPOSITE: Partial<Record<MoveBase, MoveBase>> = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' };

/**
 * The shortest list of face turns (up to maxDepth) that makes `goal` true, or null.
 * Tries every 1-move sequence, then every 2-move sequence, and so on ("iterative
 * deepening"), skipping orders that can't be shortest: turning the same face twice
 * in a row, or turning opposite faces in both orders (they don't affect each other).
 */
export function searchMoves(
  start: Cube,
  goal: (cube: Cube) => boolean,
  maxDepth: number,
): Move[] | null {
  const path: Move[] = [];
  const explore = (cube: Cube, remaining: number): boolean => {
    if (remaining === 0) return goal(cube);
    const last = path[path.length - 1];
    for (const move of FACE_TURNS) {
      if (last && move.base === last.base) continue;
      if (last && OPPOSITE[move.base] === last.base && move.base < last.base) continue;
      path.push(move);
      if (explore(applyMove(cube, move), remaining - 1)) return true;
      path.pop();
    }
    return false;
  };
  for (let depth = 0; depth <= maxDepth; depth++) {
    if (explore(start, depth)) return path;
  }
  return null;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/cube/describe.test.ts src/cube/scramble.test.ts src/solver`
Expected: PASS (5 describe + 1 scramble + 5 checks + 3 search = 14 tests).

- [ ] **Step 5: Check and commit**

```powershell
npm run typecheck
npm test
npm run format
git add -A
git commit -m "feat: stage checks, move search and scrambles for the beginner solver" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Beginner content (algorithms, lessons, demo scramble)

**Files:**
- Create: `src/content/beginner.ts`
- Test: `src/content/beginner.test.ts`

**Interfaces:**
- Consumes: `mustParse`, `invertMoves`, `applyMoves`, `solved`, `isSlotSolved`, `EDGE_SLOTS`
- Produces: `type Provenance = 'owner-confirmed' | 'claude-proposed'`; `interface BeginnerAlgorithm { id: string; name: string; moves: string; provenance: Provenance; stage: number }`; `BEGINNER_ALGORITHMS` (keys `cornerInsert`, `middleLeft`, `middleRight`, `yellowCross`, `yellowEdges`, `cornerCycle`, `cornerTwist`); `algorithmById(id: string): BeginnerAlgorithm`; `interface StageInfo { number; title; hold; goal; howTo; tip?; algorithmIds: string[] }`; `BEGINNER_STAGES: readonly StageInfo[]` (10); `DEMO_SCRAMBLE: string`

- [ ] **Step 1: Write the failing test `src/content/beginner.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { invertMoves, mustParse } from '../cube/notation';
import { EDGE_SLOTS } from '../cube/pieces';
import { allSlotsSolved, isSlotSolved, TOP_CORNERS, TOP_EDGES } from '../solver/checks';
import { BEGINNER_ALGORITHMS, BEGINNER_STAGES, DEMO_SCRAMBLE, algorithmById } from './beginner';

const FL = EDGE_SLOTS[9];
const FR = EDGE_SLOTS[8];

describe('beginner content', () => {
  it('has ten stages, numbered in order, naming only algorithms that exist', () => {
    expect(BEGINNER_STAGES.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const stage of BEGINNER_STAGES) {
      for (const id of stage.algorithmIds) expect(algorithmById(id).stage).toBe(stage.number);
    }
  });

  it('writes every algorithm in valid notation, with unique ids', () => {
    const all = Object.values(BEGINNER_ALGORITHMS);
    expect(new Set(all.map((a) => a.id)).size).toBe(all.length);
    for (const a of all) expect(() => mustParse(a.moves)).not.toThrow();
    expect(() => mustParse(DEMO_SCRAMBLE)).not.toThrow();
  });

  it('marks only the yellow cross as confirmed by the owner (so far)', () => {
    const confirmed = Object.values(BEGINNER_ALGORITHMS).filter((a) => a.provenance === 'owner-confirmed');
    expect(confirmed.map((a) => a.id)).toEqual(['yellow-cross']);
  });

  it("R' D' R D six times changes nothing (why the corner moves always come back)", () => {
    expect(applyMoves(solved(), mustParse("R' D' R D ".repeat(6)))).toEqual(solved());
  });

  it('middle-left sends the edge below the front center into the front-left slot', () => {
    // Work backwards from solved (white up, green front): undo the algorithm.
    const before = applyMoves(solved(), invertMoves(mustParse(BEGINNER_ALGORITHMS.middleLeft.moves)));
    expect(isSlotSolved(before, FL)).toBe(false);
    expect(allSlotsSolved(before, [...TOP_EDGES, ...TOP_CORNERS])).toBe(true); // white layer untouched
    // The front-left edge now sits bottom-front: green on the front, orange (left center) below.
    expect([before.stickers[25], before.stickers[28]]).toEqual(['G', 'O']);
  });

  it('middle-right sends the edge below the front center into the front-right slot', () => {
    const before = applyMoves(solved(), invertMoves(mustParse(BEGINNER_ALGORITHMS.middleRight.moves)));
    expect(isSlotSolved(before, FR)).toBe(false);
    expect(allSlotsSolved(before, [...TOP_EDGES, ...TOP_CORNERS])).toBe(true);
    expect([before.stickers[25], before.stickers[28]]).toEqual(['G', 'R']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/content`
Expected: FAIL: `./beginner` can't be resolved.

- [ ] **Step 3: Implement `src/content/beginner.ts`**

```ts
/**
 * The owner's beginner (daisy) method, as data. Source of truth for the stage order
 * and procedures: reference/beginner-method/README.md (read from the owner's photos).
 *
 * Every algorithm records its provenance: "owner-confirmed" once the owner has
 * checked it on a real cube, "claude-proposed" until then. The app shows which.
 */

export type Provenance = 'owner-confirmed' | 'claude-proposed';

export interface BeginnerAlgorithm {
  id: string;
  name: string;
  moves: string;
  provenance: Provenance;
  stage: number;
}

export const BEGINNER_ALGORITHMS = {
  cornerInsert: {
    id: 'corner-insert',
    name: 'Put a white corner in',
    moves: "R' D' R D",
    provenance: 'claude-proposed',
    stage: 3,
  },
  middleLeft: {
    id: 'middle-left',
    name: 'Middle edge to the left',
    moves: "D L D' L' D' F' D F",
    provenance: 'claude-proposed',
    stage: 4,
  },
  middleRight: {
    id: 'middle-right',
    name: 'Middle edge to the right',
    moves: "D' R' D R D F D' F'",
    provenance: 'claude-proposed',
    stage: 4,
  },
  yellowCross: {
    id: 'yellow-cross',
    name: 'Yellow cross',
    moves: "F R U R' U' F'",
    provenance: 'owner-confirmed',
    stage: 6,
  },
  yellowEdges: {
    id: 'yellow-edges',
    name: 'Swap yellow edges',
    moves: "R U R' U R U2 R'",
    provenance: 'claude-proposed',
    stage: 8,
  },
  cornerCycle: {
    id: 'corner-cycle',
    name: 'Move yellow corners into place',
    moves: "U R U' L' U R' U' L",
    provenance: 'claude-proposed',
    stage: 9,
  },
  cornerTwist: {
    id: 'corner-twist',
    name: 'Twist a yellow corner',
    moves: "R' D' R D",
    provenance: 'claude-proposed',
    stage: 10,
  },
} satisfies Record<string, BeginnerAlgorithm>;

export function algorithmById(id: string): BeginnerAlgorithm {
  const found = Object.values(BEGINNER_ALGORITHMS).find((a) => a.id === id);
  if (!found) throw new Error(`Unknown beginner algorithm: ${id}`);
  return found;
}

export interface StageInfo {
  number: number;
  title: string;
  hold: string;
  goal: string;
  howTo: string;
  tip?: string;
  algorithmIds: string[];
}

export const BEGINNER_STAGES: readonly StageInfo[] = [
  {
    number: 1,
    title: 'The daisy',
    hold: 'Yellow on top.',
    goal: 'Four white edges around the yellow center, white squares facing up, like petals.',
    howTo:
      "Find a white edge and bring it up beside the yellow center with its white square facing up. Turn the top first so you don't knock off a petal you already have.",
    algorithmIds: [],
  },
  {
    number: 2,
    title: 'The white cross',
    hold: 'Yellow on top, then white on top.',
    goal: 'A white cross on the white face, each edge matching the center beside it.',
    howTo:
      "For each petal: turn the top until the petal's other color sits above the center of the same color, then turn that face twice. The white square drops to the bottom. When all four are down, turn the cube over so white is on top.",
    algorithmIds: [],
  },
  {
    number: 3,
    title: 'White corners',
    hold: 'White on top.',
    goal: 'The whole white face done, with the top row of every side matching its center.',
    howTo:
      "Find a white corner in the bottom layer. Turn the whole cube so its home (between its two other colors) is at the front right, turn the bottom so the corner sits right below it, then repeat R' D' R D until it pops into place with white on top.",
    tip: "A white corner stuck in the top layer in the wrong spot or twisted? Hold it at the front right and do R' D' R D once to drop it to the bottom layer, then put it in as usual.",
    algorithmIds: ['corner-insert'],
  },
  {
    number: 4,
    title: 'Middle layer',
    hold: 'White on top.',
    goal: 'The top two layers are solved.',
    howTo:
      'Find an edge in the bottom layer with no yellow on it. Turn the whole cube so the center matching its side color faces you, and turn the bottom until the edge is right below that center. If its bottom color matches the left center, send it left; if it matches the right center, send it right.',
    tip: 'An edge stuck in the middle layer in the wrong spot or flipped? Turn the cube so it is at the front right and send any bottom edge to the right. That knocks it down to the bottom layer.',
    algorithmIds: ['middle-left', 'middle-right'],
  },
  {
    number: 5,
    title: 'Turn over and read the top',
    hold: 'Yellow on top.',
    goal: 'Know which yellow pattern you have on top: a dot, a reverse L, or a line.',
    howTo:
      'Turn the cube over so yellow is on top. Look only at the yellow squares in the middle of each top edge and ignore the corners.',
    algorithmIds: [],
  },
  {
    number: 6,
    title: 'Yellow cross',
    hold: 'Yellow on top.',
    goal: 'A yellow cross on top.',
    howTo:
      'Line: turn the cube so the line runs left to right, and do the algorithm once. Reverse L: turn the cube so the L points to the back and left, and do the algorithm twice in a row. Dot: do the algorithm once, turn the cube so the reverse L points to the back and left, then do it twice.',
    algorithmIds: ['yellow-cross'],
  },
  {
    number: 7,
    title: 'Check the yellow edges',
    hold: 'Yellow on top.',
    goal: 'See how many yellow edges match the center below them.',
    howTo:
      'Turn the top until at least two edges match the center below them. Either two side-by-side edges match, two opposite edges match, or all four do.',
    algorithmIds: [],
  },
  {
    number: 8,
    title: 'Yellow edges',
    hold: 'Yellow on top.',
    goal: 'All four yellow edges match the centers below them.',
    howTo:
      'Two matching edges side by side: turn the cube so they are at the back and right, do the algorithm, then turn the top to line everything up. Two opposite: do the algorithm once from any side, then check again.',
    algorithmIds: ['yellow-edges'],
  },
  {
    number: 9,
    title: 'Place the yellow corners',
    hold: 'Yellow on top.',
    goal: 'Every top corner sits in its right spot (it may still be twisted).',
    howTo:
      'Find a corner already in its right spot and turn the cube so it is at the front right, then do the algorithm once or twice. None in place? Do it once from anywhere and look again.',
    algorithmIds: ['corner-cycle'],
  },
  {
    number: 10,
    title: 'Twist the yellow corners',
    hold: 'Yellow on top.',
    goal: 'Solved!',
    howTo:
      "Bring an unfinished corner to the front right. Repeat R' D' R D until its yellow faces up, then turn only the top to bring the next unfinished corner to the front right, and repeat. The lower layers look scrambled halfway through; that's normal, and they come back. Finish by turning the top to line it up.",
    algorithmIds: ['corner-twist'],
  },
];

/** A fixed scramble used for the Learn screen's examples. */
export const DEMO_SCRAMBLE = "D2 R2 B' U2 F' L2 B D2 F' R2 U' L B' U' F D' R' B2 U";
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/content`
Expected: PASS (6 tests).

- [ ] **Step 5: Check and commit**

```powershell
npm run typecheck
npm test
npm run format
git add -A
git commit -m "feat: beginner method content with algorithm provenance" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Beginner solver

**Files:**
- Create: `src/solver/beginner.ts`
- Test: `src/solver/beginner.test.ts`

**Interfaces:**
- Consumes: Task 1 (`checks.ts`, `searchMoves`, `faceWord`), Task 2 (`BEGINNER_ALGORITHMS`, `BEGINNER_STAGES`), `validateStickers`, `holdDescription`, `COLOR_NAMES`, `colorList`, `listJoin`, `placeName`, `applyMoves`, `mustParse`, `formatAlgorithm`, `EDGE_SLOTS`, `CORNER_SLOTS`
- Produces: `interface SolveStep { kind: 'moves' | 'rotate' | 'check'; moves: readonly Move[]; text: string; algorithmId?: string }`; `interface SolveStage { number: number; title: string; steps: SolveStep[] }`; `interface SolvePlan { start: Cube; stages: SolveStage[] }`; `type SolveResult = { ok: true; plan: SolvePlan } | { ok: false; error: string }`; `solveBeginner(start: Cube): SolveResult`; `selfCheck(plan: SolvePlan): string | null`; `interface PlannedStep { stage: SolveStage; step: SolveStep; stageIndex: number; stepIndex: number; start: Cube }`; `listSteps(plan: SolvePlan): PlannedStep[]`

- [ ] **Step 1: Write the failing test `src/solver/beginner.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { BEGINNER_STAGES } from '../content/beginner';
import { placeName } from '../cube/describe';
import { solved } from '../cube/geometry';
import { applyMoves, isSolved } from '../cube/moves';
import { formatAlgorithm, mustParse } from '../cube/notation';
import type { Cube } from '../cube/types';
import { randomMoves, seededRandom } from '../test-utils/random';
import { centerColor, isCornerInPlace, isSlotSolved, TOP_CORNERS, TOP_EDGES } from './checks';
import { listSteps, selfCheck, solveBeginner, type SolvePlan } from './beginner';

function mustSolve(cube: Cube): SolvePlan {
  const result = solveBeginner(cube);
  if (!result.ok) throw new Error(result.error);
  return result.plan;
}

const scrambles = (() => {
  const random = seededRandom(21);
  return Array.from({ length: 300 }, () => applyMoves(solved(), randomMoves(25, random)));
})();
const plans = scrambles.map(mustSolve);

/** The cube just before each step, for every plan, with the step's stage number. */
const everyStep = plans.flatMap((plan) => listSteps(plan));

describe('solveBeginner', () => {
  it('solves 300 random scrambles, every stage reaching its goal', () => {
    for (const plan of plans) {
      expect(plan.stages.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(selfCheck(plan)).toBeNull();
    }
  });

  it('starts by turning the cube so yellow is on top and green faces you, whatever the hold', () => {
    const fromReference = mustSolve(applyMoves(solved(), mustParse('R U F')));
    expect(formatAlgorithm(fromReference.stages[0].steps[0].moves)).toBe('z2');
    for (const hold of ['y', 'x', "z'", 'x2 y']) {
      const plan = mustSolve(applyMoves(solved(), mustParse(`R U F ${hold}`)));
      const afterFirst = applyMoves(plan.start, plan.stages[0].steps[0].moves);
      expect([centerColor(afterFirst, 'U'), centerColor(afterFirst, 'F')]).toEqual(['Y', 'G']);
    }
  });

  it('handles an already-solved cube', () => {
    const plan = mustSolve(solved());
    expect(selfCheck(plan)).toBeNull();
  });

  it('refuses a cube that cannot be solved, with the validation message', () => {
    const stickers = [...solved().stickers];
    [stickers[7], stickers[19]] = [stickers[19], stickers[7]]; // one edge flipped in place
    const result = solveBeginner({ stickers });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('edge is flipped');
  });

  it("stage 6 holds match the owner's procedure (line left-right; reverse L back-left)", () => {
    for (const { stage, step, start } of everyStep) {
      if (stage.number !== 6 || step.algorithmId !== 'yellow-cross') continue;
      const yellow = [1, 3, 5, 7].filter((square) => start.stickers[square] === 'Y');
      const times = step.moves.length / 6;
      if (times === 2) expect(yellow).toEqual([1, 3]); // back and left: the reverse L of photo 5.0
      if (times === 1 && yellow.length === 2) expect(yellow).toEqual([3, 5]); // a left-right line
    }
  });

  it('stage 8 and 9 always use one hold, and the lesson says which', () => {
    const edgeHolds = new Set<string>();
    const cornerHolds = new Set<string>();
    for (const { stage, step, start } of everyStep) {
      if (stage.number === 8 && step.algorithmId === 'yellow-edges') {
        const matched = TOP_EDGES.filter((slot) => isSlotSolved(start, slot));
        const opposite =
          matched.length === 2 &&
          Math.abs(TOP_EDGES.indexOf(matched[0]) - TOP_EDGES.indexOf(matched[1])) === 2;
        if (matched.length === 2 && !opposite) {
          edgeHolds.add(matched.map((s) => placeName([s.faces[1]])).join(' and '));
        }
      }
      if (stage.number === 9 && step.algorithmId === 'corner-cycle') {
        const placed = TOP_CORNERS.filter((slot) => isCornerInPlace(start, slot));
        if (placed.length === 1) cornerHolds.add(placeName(placed[0].faces));
      }
    }
    expect([...edgeHolds]).toHaveLength(1);
    expect([...cornerHolds]).toEqual(['top-front-right']);
    const [edgeHold] = [...edgeHolds]; // e.g. "right and back"
    const words = edgeHold.split(' and ');
    for (const word of words) expect(BEGINNER_STAGES[7].howTo).toContain(word);
    expect(BEGINNER_STAGES[8].howTo).toContain('front right');
  });

  it('listSteps gives each step the cube it starts from', () => {
    for (const plan of plans.slice(0, 30)) {
      const steps = listSteps(plan);
      let cube = plan.start;
      for (const s of steps) {
        expect(s.start).toEqual(cube);
        cube = applyMoves(cube, s.step.moves);
      }
      expect(isSolved(cube)).toBe(true);
    }
  });

  it('never shows the word "sticker" in a step', () => {
    for (const { step } of everyStep) expect(step.text).not.toMatch(/sticker/i);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/solver/beginner.test.ts`
Expected: FAIL: `./beginner` can't be resolved.

- [ ] **Step 3: Implement `src/solver/beginner.ts`**

```ts
import { BEGINNER_ALGORITHMS, BEGINNER_STAGES } from '../content/beginner';
import { COLOR_NAMES, colorList, faceWord, holdDescription, listJoin, placeName } from '../cube/describe';
import { applyMoves, isSolved } from '../cube/moves';
import { mustParse, type Move, type MoveBase, type Turns } from '../cube/notation';
import { CORNER_SLOTS, EDGE_SLOTS } from '../cube/pieces';
import type { Color, Cube, Face } from '../cube/types';
import { validateStickers } from '../cube/validate';
import {
  BOTTOM_CORNERS,
  BOTTOM_EDGES,
  MIDDLE_EDGES,
  TOP_CORNERS,
  TOP_EDGES,
  TOP_EDGE_SQUARES,
  allSlotsSolved,
  areYellowCornersPlaced,
  areYellowEdgesSolved,
  centerColor,
  isCornerInPlace,
  isDaisy,
  isFirstLayer,
  isFirstTwoLayers,
  isFlippedTwoLayers,
  isSlotSolved,
  isWhiteCross,
  isYellowCross,
} from './checks';
import { searchMoves } from './search';

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

// ── Small helpers ───────────────────────────────────────────────────────

const algorithm = (key: keyof typeof BEGINNER_ALGORITHMS): Move[] =>
  mustParse(BEGINNER_ALGORITHMS[key].moves);

const repeat = (moves: readonly Move[], times: number): Move[] =>
  Array.from({ length: times }, () => moves).flat();

/** Turning a layer (or the whole cube) 0, 1, 2 or 3 quarter turns. */
const quarterTurns = (base: MoveBase): Move[][] => [
  [],
  [{ base, turns: 1 }],
  [{ base, turns: 2 }],
  [{ base, turns: 3 as Turns }],
];
const TOP_TURNS = quarterTurns('U');
const BOTTOM_TURNS = quarterTurns('D');
const CUBE_TURNS = quarterTurns('y'); // turn the whole cube, keeping the same face on top

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

const lowerFirst = (text: string) => text[0].toLowerCase() + text.slice(1);
const name = (color: Color) => COLOR_NAMES[color];

/** Collects stages and steps, keeping track of the cube after each step. */
class PlanWriter {
  cube: Cube;
  readonly stages: SolveStage[] = [];

  constructor(start: Cube) {
    this.cube = start;
  }

  startStage(number: number): void {
    this.stages.push({ number, title: BEGINNER_STAGES[number - 1].title, steps: [] });
  }

  /** Add a step (steps that would turn nothing are skipped, except "look" steps). */
  step(kind: SolveStep['kind'], moves: readonly Move[], text: string, algorithmId?: string): void {
    if (kind !== 'check' && moves.length === 0) return;
    this.stages[this.stages.length - 1].steps.push({ kind, moves, text, algorithmId });
    this.cube = applyMoves(this.cube, moves);
  }

  /** Turn the whole cube, describing where it ends up (not how to turn it). */
  rotate(moves: readonly Move[], why: string): void {
    if (moves.length === 0) return;
    const hold = holdDescription(applyMoves(this.cube, moves));
    this.step('rotate', moves, `${why} Hold it with ${lowerFirst(hold)}`);
  }
}

function reorientTo(cube: Cube, top: Color, front: Color): Move[] {
  const moves = REORIENTATIONS.find((r) => {
    const turned = applyMoves(cube, r);
    return centerColor(turned, 'U') === top && centerColor(turned, 'F') === front;
  });
  if (!moves) throw new Error(`Couldn't find a way to hold the cube with ${top} on top.`);
  return moves;
}

// ── Stage 1: the daisy ──────────────────────────────────────────────────

/** The other colors of the white edges that are currently petals. */
function petalColors(cube: Cube): Color[] {
  return TOP_EDGES.filter((slot) => cube.stickers[slot.stickers[0]] === 'W').map(
    (slot) => cube.stickers[slot.stickers[1]],
  );
}

function daisy(w: PlanWriter): void {
  w.startStage(1);
  w.rotate(reorientTo(w.cube, 'Y', 'G'), 'Turn the cube so yellow is on top.');
  while (petalColors(w.cube).length < 4) {
    const before = petalColors(w.cube);
    const moves = searchMoves(w.cube, (c) => petalColors(c).length > before.length, 5);
    if (!moves) throw new Error("Couldn't find a way to add a daisy petal.");
    const added = petalColors(applyMoves(w.cube, moves)).filter((c) => !before.includes(c));
    const edges = listJoin(added.map((c) => `white-${name(c)}`));
    w.step(
      'moves',
      moves,
      `Bring the ${edges} edge${added.length > 1 ? 's' : ''} up beside the yellow center, white facing up.`,
    );
  }
}

// ── Stage 2: the white cross ────────────────────────────────────────────

function whiteCross(w: PlanWriter): void {
  w.startStage(2);
  for (let petal = 0; petal < 4; petal++) {
    let choice: { k: number; face: Face } | null = null;
    for (let k = 0; k < 4 && !choice; k++) {
      const turned = applyMoves(w.cube, TOP_TURNS[k]);
      const slot = TOP_EDGES.find(
        (s) =>
          turned.stickers[s.stickers[0]] === 'W' &&
          turned.stickers[s.stickers[1]] === centerColor(turned, s.faces[1]),
      );
      if (slot) choice = { k, face: slot.faces[1] };
    }
    if (!choice) throw new Error("Couldn't line up a daisy petal.");
    const color = name(centerColor(w.cube, choice.face));
    w.step(
      'moves',
      [...TOP_TURNS[choice.k], { base: choice.face, turns: 2 }],
      `Turn the top until the white-${color} petal sits above the ${color} center, then turn the ${faceWord(choice.face)} face twice to send it down.`,
    );
  }
  w.rotate(reorientTo(w.cube, 'W', 'G'), 'Turn the cube over so the white cross is on top.');
}

// ── Stage 3: white corners ──────────────────────────────────────────────

const URF = CORNER_SLOTS[0];
const DFR = CORNER_SLOTS[4];

function whiteCorners(w: PlanWriter): void {
  w.startStage(3);
  const insert = algorithm('cornerInsert');
  for (let guard = 0; !allSlotsSolved(w.cube, TOP_CORNERS); guard++) {
    if (guard > 12) throw new Error("The white corners didn't finish.");
    const bottom = BOTTOM_CORNERS.find((slot) => slot.stickers.some((s) => w.cube.stickers[s] === 'W'));
    if (!bottom) {
      // Every white corner is on top, but one is in the wrong spot or twisted: drop it down.
      const k = CUBE_TURNS.findIndex((y) => !isSlotSolved(applyMoves(w.cube, y), URF));
      w.rotate(CUBE_TURNS[k], 'Turn the whole cube so a wrong top corner is at the front right.');
      w.step('moves', insert, "Do R' D' R D once to drop that corner to the bottom layer.", 'corner-insert');
      continue;
    }
    const others = bottom.stickers.map((s) => w.cube.stickers[s]).filter((c) => c !== 'W');
    const k = CUBE_TURNS.findIndex((y) => {
      const turned = applyMoves(w.cube, y);
      return [centerColor(turned, 'R'), centerColor(turned, 'F')].every((c) => others.includes(c));
    });
    w.rotate(
      CUBE_TURNS[k],
      `Turn the whole cube so the home of the white-${colorList(others)} corner, between the ${name(others[0])} and ${name(others[1])} centers, is at the front right.`,
    );
    const j = BOTTOM_TURNS.findIndex((d) => {
      const turned = applyMoves(w.cube, d);
      const colors = DFR.stickers.map((s) => turned.stickers[s]);
      return colors.includes('W') && others.every((c) => colors.includes(c));
    });
    w.step('moves', BOTTOM_TURNS[j], 'Turn the bottom until the corner is right below its home.');
    let moves: Move[] = [];
    let times = 0;
    while (!isSlotSolved(applyMoves(w.cube, moves), URF)) {
      moves = [...moves, ...insert];
      times++;
      if (times > 5) throw new Error("A white corner wouldn't go in.");
    }
    w.step(
      'moves',
      moves,
      `Repeat R' D' R D until the corner is in place with white on top (${times} time${times > 1 ? 's' : ''}).`,
      'corner-insert',
    );
  }
}

// ── Stage 4: middle layer ───────────────────────────────────────────────

const FRONT_RIGHT_EDGE = EDGE_SLOTS[8];

function middleLayer(w: PlanWriter): void {
  w.startStage(4);
  for (let guard = 0; !allSlotsSolved(w.cube, MIDDLE_EDGES); guard++) {
    if (guard > 12) throw new Error("The middle layer didn't finish.");
    const bottom = BOTTOM_EDGES.find((slot) => slot.stickers.every((s) => w.cube.stickers[s] !== 'Y'));
    if (!bottom) {
      // No middle edge is waiting in the bottom layer, so one must be stuck in the middle.
      const k = CUBE_TURNS.findIndex((y) => !isSlotSolved(applyMoves(w.cube, y), FRONT_RIGHT_EDGE));
      w.rotate(CUBE_TURNS[k], 'Turn the whole cube so a wrong middle edge is at the front right.');
      w.step(
        'moves',
        algorithm('middleRight'),
        'Send any bottom edge to the right. That knocks the stuck edge down to the bottom layer.',
        'middle-right',
      );
      continue;
    }
    const down = w.cube.stickers[bottom.stickers[0]]; // the square on the bottom face
    const side = w.cube.stickers[bottom.stickers[1]];
    const k = CUBE_TURNS.findIndex((y) => centerColor(applyMoves(w.cube, y), 'F') === side);
    w.rotate(CUBE_TURNS[k], `Turn the whole cube so the ${name(side)} center faces you.`);
    const j = BOTTOM_TURNS.findIndex((d) => {
      const turned = applyMoves(w.cube, d);
      return turned.stickers[25] === side && turned.stickers[28] === down; // bottom-front edge
    });
    w.step(
      'moves',
      BOTTOM_TURNS[j],
      `Turn the bottom until the ${name(side)}-${name(down)} edge is right below the ${name(side)} center.`,
    );
    const left = centerColor(w.cube, 'L') === down;
    w.step(
      'moves',
      algorithm(left ? 'middleLeft' : 'middleRight'),
      `Its bottom color is ${name(down)}, like the ${left ? 'left' : 'right'} center, so send it ${left ? 'left' : 'right'}.`,
      left ? 'middle-left' : 'middle-right',
    );
  }
}

// ── Stage 5: turn over and read the top ─────────────────────────────────

type TopPattern = 'dot' | 'reverse L' | 'line' | 'cross';

function topPattern(cube: Cube): TopPattern {
  const yellow = TOP_EDGE_SQUARES.filter((square) => cube.stickers[square] === 'Y');
  if (yellow.length === 4) return 'cross';
  if (yellow.length === 0) return 'dot';
  const opposite = yellow.includes(1) === yellow.includes(7); // back+front or left+right
  return opposite ? 'line' : 'reverse L';
}

function turnOver(w: PlanWriter): void {
  w.startStage(5);
  w.rotate(reorientTo(w.cube, 'Y', 'G'), 'Turn the cube over so yellow is on top.');
  const pattern = topPattern(w.cube);
  const seen = pattern === 'cross' ? 'a yellow cross already' : `a ${pattern}`;
  w.step('check', [], `Look at the yellow squares in the middle of each top edge: you have ${seen}.`);
}

// ── Stage 6: yellow cross (the owner's procedure) ───────────────────────

function yellowCross(w: PlanWriter): void {
  w.startStage(6);
  const cross = algorithm('yellowCross');
  let pattern = topPattern(w.cube);
  if (pattern === 'cross') {
    w.step('check', [], 'You already have a yellow cross, so move on.');
    return;
  }
  if (pattern === 'dot') {
    w.step('moves', cross, "Dot: do F R U R' U' F' once. You'll get a reverse L.", 'yellow-cross');
    pattern = topPattern(w.cube);
  }
  const times = pattern === 'line' ? 1 : 2;
  const k = CUBE_TURNS.findIndex((y) => isYellowCross(applyMoves(w.cube, [...y, ...repeat(cross, times)])));
  if (k < 0) throw new Error("The yellow cross algorithm didn't work from any side.");
  w.rotate(
    CUBE_TURNS[k],
    pattern === 'line'
      ? 'Line: turn the whole cube so the line runs left to right.'
      : 'Reverse L: turn the whole cube so the L points to the back and left.',
  );
  w.step(
    'moves',
    repeat(cross, times),
    times === 1 ? "Do F R U R' U' F' once." : "Do F R U R' U' F' twice in a row.",
    'yellow-cross',
  );
}

// ── Stage 7: check the yellow edges ─────────────────────────────────────

const matchingTopEdges = (cube: Cube) => TOP_EDGES.filter((slot) => isSlotSolved(cube, slot));

/** How far to turn the top so the most yellow edges match their centers. */
function bestTopTurn(cube: Cube): number {
  const counts = TOP_TURNS.map((u) => matchingTopEdges(applyMoves(cube, u)).length);
  return counts.indexOf(Math.max(...counts));
}

const areOpposite = (slots: readonly (typeof TOP_EDGES)[number][]) =>
  slots.length === 2 && Math.abs(TOP_EDGES.indexOf(slots[0]) - TOP_EDGES.indexOf(slots[1])) === 2;

function checkEdges(w: PlanWriter): void {
  w.startStage(7);
  const k = bestTopTurn(w.cube);
  const matched = matchingTopEdges(applyMoves(w.cube, TOP_TURNS[k]));
  const how =
    matched.length === 4 ? 'all four match' : areOpposite(matched) ? 'two opposite edges match' : 'two side-by-side edges match';
  w.step(
    k === 0 ? 'check' : 'moves',
    TOP_TURNS[k],
    `Turn the top until the most yellow edges match the centers below them: ${how}.`,
  );
}

// ── Stage 8: yellow edges ───────────────────────────────────────────────

function yellowEdges(w: PlanWriter): void {
  w.startStage(8);
  const swap = algorithm('yellowEdges');
  for (let guard = 0; !allSlotsSolved(w.cube, TOP_EDGES); guard++) {
    if (guard > 3) throw new Error("The yellow edges didn't finish.");
    if (areOpposite(matchingTopEdges(w.cube))) {
      w.step('moves', swap, "The matching edges are opposite: do R U R' U R U2 R' once from any side.", 'yellow-edges');
      w.step('moves', TOP_TURNS[bestTopTurn(w.cube)], 'Turn the top again until the most edges match.');
      continue;
    }
    let found: { k: number; j: number } | null = null;
    for (let k = 0; k < 4 && !found; k++) {
      for (let j = 0; j < 4 && !found; j++) {
        const after = applyMoves(w.cube, [...CUBE_TURNS[k], ...swap, ...TOP_TURNS[j]]);
        if (allSlotsSolved(after, TOP_EDGES)) found = { k, j };
      }
    }
    if (!found) throw new Error("The yellow edge swap didn't work from any side.");
    const held = applyMoves(w.cube, CUBE_TURNS[found.k]);
    const where = listJoin(matchingTopEdges(held).map((slot) => faceWord(slot.faces[1])));
    w.rotate(CUBE_TURNS[found.k], `Two matching edges side by side: turn the whole cube so they're at the ${where}.`);
    w.step('moves', swap, "Do R U R' U R U2 R'.", 'yellow-edges');
    w.step('moves', TOP_TURNS[found.j], 'Turn the top to line the edges up with their centers.');
  }
}

// ── Stage 9: place the yellow corners ───────────────────────────────────

const cornersPlaced = (cube: Cube) => TOP_CORNERS.filter((slot) => isCornerInPlace(cube, slot));

function placeCorners(w: PlanWriter): void {
  w.startStage(9);
  const cycle = algorithm('cornerCycle');
  for (let guard = 0; cornersPlaced(w.cube).length < 4; guard++) {
    if (guard > 3) throw new Error("The yellow corners wouldn't go into place.");
    if (cornersPlaced(w.cube).length === 0) {
      w.step('moves', cycle, "No corner is in its spot yet: do U R U' L' U R' U' L once, then look again.", 'corner-cycle');
      continue;
    }
    let found: { k: number; times: number } | null = null;
    for (let k = 0; k < 4 && !found; k++) {
      for (const times of [1, 2]) {
        if (found) break;
        const after = applyMoves(w.cube, [...CUBE_TURNS[k], ...repeat(cycle, times)]);
        if (cornersPlaced(after).length === 4) found = { k, times };
      }
    }
    if (!found) throw new Error("The corner algorithm didn't work from any side.");
    const held = applyMoves(w.cube, CUBE_TURNS[found.k]);
    const spot = placeName(cornersPlaced(held)[0].faces);
    w.rotate(CUBE_TURNS[found.k], `One corner is already in its spot: turn the whole cube so it's at the ${spot}.`);
    w.step(
      'moves',
      repeat(cycle, found.times),
      found.times === 1 ? "Do U R U' L' U R' U' L." : "Do U R U' L' U R' U' L twice.",
      'corner-cycle',
    );
  }
}

// ── Stage 10: twist the yellow corners ──────────────────────────────────

const yellowOnTop = (cube: Cube) => cube.stickers[URF.stickers[0]] === 'Y';

function twistCorners(w: PlanWriter): void {
  w.startStage(10);
  const twist = algorithm('cornerTwist');
  for (let corner = 0; corner < 4; corner++) {
    if (TOP_CORNERS.every((slot) => w.cube.stickers[slot.stickers[0]] === 'Y')) break;
    const k = TOP_TURNS.findIndex((u) => !yellowOnTop(applyMoves(w.cube, u)));
    w.step('moves', TOP_TURNS[k], 'Turn only the top to bring an unfinished corner to the front right.');
    let moves: Move[] = [];
    let times = 0;
    while (!yellowOnTop(applyMoves(w.cube, moves))) {
      moves = [...moves, ...twist];
      times++;
      if (times > 5) throw new Error("A yellow corner wouldn't twist into place.");
    }
    w.step(
      'moves',
      moves,
      `Repeat R' D' R D until this corner's yellow faces up (${times} times). The lower layers look scrambled for now; that's normal.`,
      'corner-twist',
    );
  }
  const k = TOP_TURNS.findIndex((u) => isSolved(applyMoves(w.cube, u)));
  if (k < 0) throw new Error("The cube didn't finish solved.");
  if (k === 0) w.step('check', [], 'Solved!');
  else w.step('moves', TOP_TURNS[k], 'Turn the top to line it up. Solved!');
}

// ── Putting it together ─────────────────────────────────────────────────

const STAGE_GOALS: ((cube: Cube) => boolean)[] = [
  isDaisy,
  isWhiteCross,
  isFirstLayer,
  isFirstTwoLayers,
  isFlippedTwoLayers,
  isYellowCross,
  (cube) => isYellowCross(cube) && matchingTopEdges(cube).length >= 2,
  areYellowEdgesSolved,
  areYellowCornersPlaced,
  isSolved,
];

/** Replay a plan from its start and confirm each stage reaches its goal and the cube ends solved. */
export function selfCheck(plan: SolvePlan): string | null {
  let cube = plan.start;
  for (const stage of plan.stages) {
    for (const step of stage.steps) cube = applyMoves(cube, step.moves);
    if (!STAGE_GOALS[stage.number - 1](cube)) {
      return `Stage ${stage.number} (${stage.title}) didn't reach its goal. This is a bug in the app, not a problem with your cube.`;
    }
  }
  return isSolved(cube) ? null : "The plan didn't end solved. This is a bug in the app, not a problem with your cube.";
}

/** Work out the owner's beginner method, stage by stage, for this cube. */
export function solveBeginner(start: Cube): SolveResult {
  const check = validateStickers(start.stickers);
  if (!check.ok) return { ok: false, error: check.problems.map((p) => p.message).join(' ') };
  try {
    const w = new PlanWriter(start);
    daisy(w);
    whiteCross(w);
    whiteCorners(w);
    middleLayer(w);
    turnOver(w);
    yellowCross(w);
    checkEdges(w);
    yellowEdges(w);
    placeCorners(w);
    twistCorners(w);
    const plan: SolvePlan = { start, stages: w.stages };
    const problem = selfCheck(plan);
    return problem ? { ok: false, error: problem } : { ok: true, plan };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `${detail} This is a bug in the app, not a problem with your cube.` };
  }
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

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/solver/beginner.test.ts`
Expected: PASS (8 tests). If "stage 8 and 9 always use one hold" fails because the proven hold differs from the lesson text, the solver is right and the text is wrong: update `BEGINNER_STAGES[7].howTo` / `[8].howTo` to the hold the test reports and record a ruling.

- [ ] **Step 5: Check and commit**

```powershell
npm run typecheck
npm test
npm run format
git add -A
git commit -m "feat: beginner method solver with per-stage self-check" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Reusable CubePlayer + Learn screen

**Files:**
- Create: `src/app/CubePlayer.tsx`, `src/app/LearnScreen.tsx`
- Modify: `src/app/PlayerScreen.tsx` (use CubePlayer), `src/app/app.css` (append)
- Test: `src/content/demo.test.ts`

**Interfaces:**
- Produces: `CubePlayer` props `{ moves: readonly Move[]; start: Cube; caption?: ReactNode }`; `LearnScreen` (no props); `DEMO_PLAN` (exported from `LearnScreen.tsx`'s helper `src/content/demo.ts`): `demoPlan(): SolvePlan`, `demoStage(index): { start: Cube; moves: Move[] }`

- [ ] **Step 1: Write the failing test `src/content/demo.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { demoPlan, demoStage } from './demo';

describe('Learn screen examples', () => {
  it('solves the demo scramble, with real moves to watch in every stage except the "look" stages', () => {
    const plan = demoPlan();
    plan.stages.forEach((stage, i) => {
      const { moves } = demoStage(i);
      if (stage.number === 5 || stage.number === 7) return;
      expect(moves.length, `stage ${stage.number}`).toBeGreaterThan(0);
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/content/demo.test.ts`
Expected: FAIL: `./demo` can't be resolved.

- [ ] **Step 3: Implement `src/content/demo.ts`**

```ts
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
```

Run `npx vitest run src/content/demo.test.ts`. Expected: PASS. If a stage has no moves, the demo scramble happens to skip it: replace `DEMO_SCRAMBLE` in `src/content/beginner.ts` with another scramble (e.g. `formatAlgorithm(randomScramble(20, seededRandom(n)))` for increasing `n`) until it passes, and record a ruling.

- [ ] **Step 4: Create `src/app/CubePlayer.tsx`** (the player from PlayerScreen, made reusable)

```tsx
import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { formatAlgorithm, formatMove, type Move } from '../cube/notation';
import type { Cube } from '../cube/types';
import { CubeView } from '../render/CubeView';
import { Playback } from '../render/playback';

interface CubePlayerProps {
  moves: readonly Move[];
  start: Cube;
  caption?: ReactNode;
}

/** A 3D cube that plays a list of moves from a starting cube, with play/pause/step/speed. */
export function CubePlayer({ moves, start, caption }: CubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playbackRef = useRef<Playback | null>(null);
  const [, refresh] = useReducer((n: number) => n + 1, 0); // re-draw when playback changes
  const [msPerMove, setMsPerMove] = useState(400);

  // Create the 3D view once, starting from the right cube, and clean it up afterwards.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const view = new CubeView(container);
    const playback = new Playback(view, start);
    playback.msPerMove = msPerMove;
    playback.onChange = refresh;
    playbackRef.current = playback;
    return () => {
      playback.pause();
      playbackRef.current = null;
      view.dispose();
    };
    // Created once; later changes arrive through the effects below.
  }, []);

  // Reload whenever the moves or the starting cube change.
  const movesKey = formatAlgorithm(moves);
  useEffect(() => {
    playbackRef.current?.load(moves, start);
  }, [movesKey, start]);

  useEffect(() => {
    if (playbackRef.current) playbackRef.current.msPerMove = msPerMove;
  }, [msPerMove]);

  const playback = playbackRef.current;
  const position = playback?.position ?? 0;
  const busy = playback?.isBusy ?? false;
  const playing = playback?.isPlaying ?? false;
  const ready = playback !== null;

  return (
    <div className="cube-player">
      <div className="cube-view" ref={containerRef} />
      {caption && <p className="hint">{caption}</p>}
      {moves.length > 0 && (
        <ol className="move-list">
          {moves.map((move, i) => (
            <li key={i} className={i < position ? 'done' : i === position ? 'next' : ''}>
              {formatMove(move)}
            </li>
          ))}
        </ol>
      )}
      <div className="controls">
        <button onClick={() => playback?.reset()} disabled={!ready}>
          ⏮ Reset
        </button>
        <button
          onClick={() => void playback?.stepBack()}
          disabled={!ready || busy || playing || position === 0}
        >
          ◀ Step back
        </button>
        {playing ? (
          <button onClick={() => playback?.pause()}>⏸ Pause</button>
        ) : (
          <button onClick={() => void playback?.play()} disabled={!ready || busy || moves.length === 0}>
            ▶ Play
          </button>
        )}
        <button
          onClick={() => void playback?.stepForward()}
          disabled={!ready || busy || playing || position >= moves.length}
        >
          Step ▶
        </button>
      </div>
      <label className="field">
        Speed
        {/* Slider right = faster: the value is stored as 1100 - milliseconds per move. */}
        <input
          type="range"
          min={100}
          max={1000}
          step={50}
          value={1100 - msPerMove}
          onChange={(e) => setMsPerMove(1100 - Number(e.target.value))}
        />
      </label>
    </div>
  );
}
```

- [ ] **Step 5: Replace `src/app/PlayerScreen.tsx`** so it uses CubePlayer

```tsx
import { holdDescription } from '../cube/describe';
import { parseAlgorithm } from '../cube/notation';
import type { Cube } from '../cube/types';
import { CubePlayer } from './CubePlayer';

interface PlayerScreenProps {
  algorithm: string;
  onAlgorithmChange: (text: string) => void;
  start: Cube; // the cube the algorithm starts from
  isCustomStart: boolean; // true when `start` is a cube the user entered
  onUseSolvedStart: () => void;
}

export function PlayerScreen(props: PlayerScreenProps) {
  const { algorithm, onAlgorithmChange, start, isCustomStart, onUseSolvedStart } = props;
  const parsed = parseAlgorithm(algorithm);
  // An invalid algorithm plays nothing (and stops anything already playing).
  const moves = parsed.ok ? parsed.moves : [];

  return (
    <>
      <h1>Algorithm player</h1>
      <label className="field">
        Algorithm
        <input
          value={algorithm}
          onChange={(e) => onAlgorithmChange(e.target.value)}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
      </label>
      {!parsed.ok && (
        <p className="error" role="alert">
          {parsed.message}
        </p>
      )}
      <CubePlayer
        moves={moves}
        start={start}
        caption={
          <>
            {holdDescription(start)} Drag the cube to look around.
            {isCustomStart && (
              <>
                {' '}
                Starting from the cube you entered.{' '}
                <button className="link" onClick={onUseSolvedStart}>
                  Start from solved instead
                </button>
              </>
            )}
          </>
        }
      />
    </>
  );
}
```

- [ ] **Step 6: Create `src/app/LearnScreen.tsx`**

```tsx
import { useState } from 'react';
import { BEGINNER_STAGES, algorithmById } from '../content/beginner';
import { demoStage } from '../content/demo';
import { holdDescription } from '../cube/describe';
import { CubePlayer } from './CubePlayer';

/** An algorithm with a badge saying whether the owner has confirmed it yet. */
export function AlgorithmCard({ id }: { id: string }) {
  const algorithm = algorithmById(id);
  const confirmed = algorithm.provenance === 'owner-confirmed';
  return (
    <div className="algorithm">
      <strong>{algorithm.name}:</strong> <code>{algorithm.moves}</code>{' '}
      <span className={`badge ${confirmed ? 'confirmed' : 'proposed'}`}>
        {confirmed ? '✓ Confirmed' : 'Proposed: check against your cube'}
      </span>
    </div>
  );
}

export function LearnScreen() {
  const [selected, setSelected] = useState(0);
  const info = BEGINNER_STAGES[selected];
  const demo = demoStage(selected);

  return (
    <>
      <h1>Learn: the beginner method</h1>
      <p className="hint">The daisy method in 10 stages. Pick a stage to read how it works and watch an example.</p>
      <ol className="stage-list">
        {BEGINNER_STAGES.map((stage, i) => (
          <li key={stage.number}>
            <button className={i === selected ? 'active' : ''} onClick={() => setSelected(i)}>
              {stage.number}. {stage.title}
            </button>
          </li>
        ))}
      </ol>

      <section className="lesson">
        <h2>
          {info.number}. {info.title}
        </h2>
        <p>
          <strong>Hold:</strong> {info.hold}
        </p>
        <p>
          <strong>Goal:</strong> {info.goal}
        </p>
        <p>{info.howTo}</p>
        {info.tip && <p className="hint">Tip: {info.tip}</p>}
        {info.algorithmIds.map((id) => (
          <AlgorithmCard key={id} id={id} />
        ))}
      </section>

      <h2>Example</h2>
      <CubePlayer
        moves={demo.moves}
        start={demo.start}
        caption={
          demo.moves.length > 0
            ? `${holdDescription(demo.start)} This stage took ${demo.moves.length} moves on the example cube.`
            : `${holdDescription(demo.start)} This stage is just looking; there's nothing to turn.`
        }
      />
    </>
  );
}
```

- [ ] **Step 7: Append to `src/app/app.css`**

```css
h2 {
  margin: 8px 0 0;
  font-size: 1.2rem;
}
.cube-player {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.stage-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.stage-list button {
  padding: 6px 10px;
  border: 1px solid #bbb;
  border-radius: 8px;
  background: #fff;
  font-size: 0.9rem;
  cursor: pointer;
}
.stage-list button.active,
.stage-list li.current button {
  background: #1d1d1f;
  border-color: #1d1d1f;
  color: #fff;
}
.lesson {
  padding: 8px 14px;
  border-radius: 8px;
  background: #fff;
}
.lesson p {
  margin: 6px 0;
}
.algorithm {
  margin: 6px 0;
}
.algorithm code {
  font: 1rem ui-monospace, monospace;
}
.badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 0.8rem;
}
.badge.confirmed {
  background: #e3f4e8;
}
.badge.proposed {
  background: #fff3cd;
}
.controls button.active {
  background: #1d1d1f;
  border-color: #1d1d1f;
  color: #fff;
}
```

- [ ] **Step 8: Check and commit**

Temporarily render nothing new yet (App wiring is Task 5). Run:
```powershell
npm run typecheck
npm test
npm run build
npm run format
git add -A
git commit -m "feat: reusable cube player and the Learn screen" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Solve screen, four tabs, browser check

**Files:**
- Create: `src/app/SolveScreen.tsx`
- Modify: `src/app/App.tsx` (replace), `src/app/EnterCubeScreen.tsx` (add "Solve this cube"), `CLAUDE.md` (status)

**Interfaces:**
- Consumes: `solveBeginner`, `listSteps`, `randomScramble`, `CubePlayer`, `LearnScreen`, `AlgorithmCard`
- Produces: `SolveScreen` props `{ enteredCube: Cube | null; onEnterCube(): void }`; `EnterCubeScreen` gains prop `onSolveCube(cube: Cube): void`

- [ ] **Step 1: Create `src/app/SolveScreen.tsx`**

```tsx
import { useEffect, useMemo, useState } from 'react';
import { BEGINNER_STAGES } from '../content/beginner';
import { holdDescription } from '../cube/describe';
import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { formatAlgorithm, type Move } from '../cube/notation';
import { randomScramble } from '../cube/scramble';
import type { Cube } from '../cube/types';
import { listSteps, solveBeginner } from '../solver/beginner';
import { CubePlayer } from './CubePlayer';
import { AlgorithmCard } from './LearnScreen';

interface SolveScreenProps {
  enteredCube: Cube | null; // a checked cube from "Enter my cube", if there is one
  onEnterCube: () => void;
}

export function SolveScreen({ enteredCube, onEnterCube }: SolveScreenProps) {
  const [useEntered, setUseEntered] = useState(enteredCube !== null);
  const [scramble, setScramble] = useState<Move[]>(() => randomScramble());
  const start = useMemo(
    () => (useEntered && enteredCube ? enteredCube : applyMoves(solved(), scramble)),
    [useEntered, enteredCube, scramble],
  );
  const result = useMemo(() => solveBeginner(start), [start]);
  const steps = useMemo(() => (result.ok ? listSteps(result.plan) : []), [result]);
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [steps]); // a new cube starts again at the first step

  const current = steps[Math.min(index, steps.length - 1)];

  return (
    <>
      <h1>Solve my cube</h1>
      <div className="controls">
        <button className={useEntered ? 'active' : ''} disabled={!enteredCube} onClick={() => setUseEntered(true)}>
          My entered cube
        </button>
        <button className={!useEntered ? 'active' : ''} onClick={() => setUseEntered(false)}>
          A random scramble
        </button>
        {!useEntered && <button onClick={() => setScramble(randomScramble())}>New scramble</button>}
      </div>
      {!enteredCube && (
        <p className="hint">
          To solve your own cube, first <button className="link" onClick={onEnterCube}>enter it</button>.
        </p>
      )}
      {!useEntered && (
        <p className="hint">
          Scramble: <code>{formatAlgorithm(scramble)}</code>. Do these moves on a solved cube (white
          on top, green facing you) to follow along.
        </p>
      )}

      {!result.ok && (
        <p className="error" role="alert">
          {result.error}
        </p>
      )}

      {current && (
        <>
          <ol className="stage-list">
            {BEGINNER_STAGES.map((stage, i) => (
              <li key={stage.number} className={i === current.stageIndex ? 'current' : ''}>
                <button onClick={() => setIndex(steps.findIndex((s) => s.stageIndex === i))}>
                  {stage.number}. {stage.title}
                </button>
              </li>
            ))}
          </ol>

          <section className="lesson">
            <h2>
              Stage {current.stage.number}: {current.stage.title}
            </h2>
            <p>
              <strong>
                Step {current.stepIndex + 1} of {current.stage.steps.length}:
              </strong>{' '}
              {current.step.text}
            </p>
            {current.step.algorithmId && <AlgorithmCard id={current.step.algorithmId} />}
          </section>

          <CubePlayer
            moves={current.step.moves}
            start={current.start}
            caption={`${holdDescription(current.start)} Copy each turn on your cube.`}
          />

          <div className="controls">
            <button disabled={index === 0} onClick={() => setIndex(index - 1)}>
              ◀ Previous step
            </button>
            <button disabled={index >= steps.length - 1} onClick={() => setIndex(index + 1)}>
              Next step ▶
            </button>
          </div>
          <p className="hint">
            Lost your place? <button className="link" onClick={onEnterCube}>Re-enter your cube</button>{' '}
            and solve from where it is now.
          </p>
        </>
      )}
    </>
  );
}
```

- [ ] **Step 2: Add "Solve this cube" to `src/app/EnterCubeScreen.tsx`**

Add `onSolveCube: (cube: Cube) => void;` to `EnterCubeScreenProps`, add `onSolveCube` to the destructured props, and replace the success block's single button with:
```tsx
          <div className="controls">
            <button onClick={() => onSolveCube(result.cube)}>Solve this cube</button>
            <button onClick={() => onUseCube(result.cube)}>Use in the algorithm player</button>
          </div>
```

- [ ] **Step 3: Replace `src/app/App.tsx`**

```tsx
import { useState } from 'react';
import { solved } from '../cube/geometry';
import type { Cube } from '../cube/types';
import { blankStickers, type EditorStickers } from '../input/editorState';
import { EnterCubeScreen } from './EnterCubeScreen';
import { LearnScreen } from './LearnScreen';
import { PlayerScreen } from './PlayerScreen';
import { SolveScreen } from './SolveScreen';

type Screen = 'learn' | 'solve' | 'enter' | 'player';

const TABS: { screen: Screen; label: string }[] = [
  { screen: 'learn', label: 'Learn' },
  { screen: 'solve', label: 'Solve my cube' },
  { screen: 'enter', label: 'Enter my cube' },
  { screen: 'player', label: 'Algorithm player' },
];

export function App() {
  const [screen, setScreen] = useState<Screen>('learn');
  // Kept here (not inside each screen) so switching tabs doesn't lose anything.
  const [algorithm, setAlgorithm] = useState("R U R' U'");
  const [playerStart, setPlayerStart] = useState<Cube>(solved);
  const [isCustomStart, setIsCustomStart] = useState(false);
  const [editorStickers, setEditorStickers] = useState<EditorStickers>(blankStickers);
  const [enteredCube, setEnteredCube] = useState<Cube | null>(null);

  return (
    <main className="app">
      <nav className="tabs" aria-label="Screens">
        {TABS.map((tab) => (
          <button
            key={tab.screen}
            className={screen === tab.screen ? 'active' : ''}
            aria-current={screen === tab.screen ? 'page' : undefined}
            onClick={() => setScreen(tab.screen)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {screen === 'learn' && <LearnScreen />}
      {screen === 'solve' && (
        <SolveScreen
          key={enteredCube ? enteredCube.stickers.join('') : 'none'}
          enteredCube={enteredCube}
          onEnterCube={() => setScreen('enter')}
        />
      )}
      {screen === 'enter' && (
        <EnterCubeScreen
          stickers={editorStickers}
          onStickersChange={setEditorStickers}
          onSolveCube={(cube) => {
            setEnteredCube(cube);
            setScreen('solve');
          }}
          onUseCube={(cube) => {
            setPlayerStart(cube);
            setIsCustomStart(true);
            setScreen('player');
          }}
        />
      )}
      {screen === 'player' && (
        <PlayerScreen
          algorithm={algorithm}
          onAlgorithmChange={setAlgorithm}
          start={playerStart}
          isCustomStart={isCustomStart}
          onUseSolvedStart={() => {
            setPlayerStart(solved());
            setIsCustomStart(false);
          }}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 4: Automated checks**

```powershell
npm run typecheck
npm test
npm run build
npm run format
```
Expected: all pass (phase ② 101 + 14 + 6 + 8 + 1 = 130 tests).

- [ ] **Step 5: Browser checklist** (`npm run dev`, http://localhost:5190)

1. Four tabs; **Learn** opens first and lists 10 stages. Each stage shows hold, goal, how-to, algorithm badges (only the yellow cross says "✓ Confirmed"), and an example that plays.
2. **Solve my cube** with a random scramble: a stage list with the current stage highlighted, step text, and a 3D player of that step's moves. **Next step ▶** walks through every stage to "Solved!"; **◀ Previous step** goes back and shows the matching cube.
3. **Enter my cube** → Fill as solved → apply a few edits that make a real scramble (or use "Fill as solved" and just solve it) → Check → **Solve this cube** → the Solve screen uses the entered cube.
4. Clicking a stage in the stage list jumps to its first step.
5. The Algorithm player still works; an invalid algorithm now shows the start cube and plays nothing.
6. Phone width (~375px): no sideways scrolling on Learn and Solve.

- [ ] **Step 6: Update `CLAUDE.md` status, then commit**

In the Status section, after the phase ② sentence, add:
```
Phase ③a (beginner method: solver, Learn and Solve screens) is built on branch
`phase-3a-beginner` (stacked on phase ②).
```

```powershell
git add -A
git commit -m "feat: Solve my cube screen and four-tab app" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
