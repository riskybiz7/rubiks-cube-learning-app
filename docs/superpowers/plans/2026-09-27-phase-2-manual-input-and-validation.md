# Phase ②: Manual Cube Entry + Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user enter their real cube's 54 stickers on an unfolded-cube map, check that it is a real, solvable cube (with plain-English explanations when it isn't), and send it to the algorithm player.

**Architecture:** A new "pieces view" (`src/cube/pieces.ts`) reads the 54 stickers as 8 corners + 12 edges, each with a position and a twist/flip, using the standard (Kociemba) slot tables. It is proven against the 3D geometry and round-trip-tested on random scrambles. `src/cube/validate.ts` runs the spec §5 checks in stages (blanks → color counts → centers → real pieces → duplicates → twist/flip/parity) and stops at the first stage that fails. The editor's pure logic (`src/input/`) is tested separately from its React screen. The app gets two tabs: Algorithm player and Enter my cube.

**Tech Stack:** TypeScript (strict), React, Vite, Three.js, Vitest, Prettier (unchanged from phase ①).

**Spec:** `docs/superpowers/specs/2026-09-27-cube-learning-app-design.md` (§3.1 pieces view, §4.1 manual editor, §5 validation rules, §7 testing, §10 phase ②)

## Scope notes

- **Centers are pre-filled but editable** (spec §4.1 as updated 2026-09-27), so swapped center caps can be entered and caught.
- The "Solve" button arrives in phase ③a. In phase ② a valid cube can be sent to the algorithm player as its starting state.
- Deferred minor from phase ① (the old algorithm keeps animating if the text becomes invalid mid-play) stays deferred; the owner has not asked for it.

## Global Constraints

- Everything runs in the browser: no backend, no network calls, no accounts.
- TypeScript `strict` mode; `npm run typecheck`, `npm test` and `npm run build` must all pass at the end of every task.
- Face order everywhere: **U R F D L B**, 9 stickers each, read row by row (layout in `src/cube/geometry.ts`).
- Reference hold: **white on top, green in front, red on the right** (standard color scheme).
- Standard color scheme opposites: **white/yellow, red/orange, green/blue**.
- The cube model is the source of truth; the renderer never changes cube state.
- Validation messages are plain English for a beginner, name places as top/bottom/front/back/left/right and colors by name, and never blame the user.
- Code is written for a beginner reader: readable over clever, concept-level comments.
- Windows 11 / PowerShell 5.1: no `&&`. The project path contains an apostrophe: always quote it.
- Run commands from the project root. Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- If `npm install` is needed and reports `ERESOLVE`, stop and report (no `--force`). This phase adds no packages.

## Review Focus

1. **Real cubes must never be rejected (no false alarms)**, including cubes held in any orientation and scrambles using slices, wide turns and rotations. Tests: Task 1 "rebuilds exactly the same stickers… (300 random scrambles)"; Task 2 "accepts 500 real scrambles…" and "accepts a solved cube held in any of its 24 orientations".
2. **A half-filled cube** should say how many stickers are still blank and outline them, not show confusing piece errors. Tests: Task 2 "asks for the blank stickers first" and "reports only the first kind of problem".
3. **Swapped center caps** (the owner's GAN concern) should get a specific center message, including the mirror-image case. Tests: Task 2 "catches centers that should be opposite…" and "catches a mirror-image center layout".
4. **Any input at all** (random colors, blanks, shuffled stickers) should give problems or success, and never crash the page. Test: Task 2 "never crashes on random input".
5. **The unfolded map must match the real cube**, so neighboring squares across a fold are the same physical piece. If this were wrong, users would enter stickers on the wrong faces. Test: Task 3 "joins faces the way a real cube folds up".

## File map

| File | Responsibility |
|---|---|
| `src/test-utils/random.ts` | Repeatable random numbers and random move lists for tests |
| `src/cube/pieces.ts` | Corner/edge slot tables; stickers ⇄ pieces; twist, flip, parity |
| `src/cube/describe.ts` | Plain-English names: colors, places, lists, hold description |
| `src/cube/validate.ts` | The staged §5 checks with messages and stickers to highlight |
| `src/input/net.ts` | Where each sticker sits on the unfolded-cube map |
| `src/input/editorState.ts` | Blank / solved / paint operations on the editor's stickers |
| `src/render/CubeView.ts` | + `showStickers()` that draws blank stickers grey |
| `src/app/App.tsx` | Tabs; holds algorithm text, start cube and editor stickers |
| `src/app/PlayerScreen.tsx` | The phase ① player, now starting from any cube |
| `src/app/EnterCubeScreen.tsx` | The editor screen |
| `src/app/app.css` | Styles for tabs, net, palette, results |

---

### Task 1: Pieces view (corners + edges)

**Files:**
- Create: `src/test-utils/random.ts`, `src/cube/pieces.ts`
- Test: `src/cube/pieces.test.ts`

**Interfaces:**
- Consumes: `STICKER_SLOTS`, `solved` (geometry.ts); `applyMoves` (moves.ts); `MOVE_BASES`, `Move`, `Turns` (notation.ts); `FACES`, `Color`, `Cube`, `Face` (types.ts)
- Produces:
  - `random.ts`: `seededRandom(seed: number): () => number`; `randomMoves(count: number, random: () => number): Move[]`
  - `pieces.ts`: `interface CornerSlot { name: string; faces: readonly [Face, Face, Face]; stickers: readonly [number, number, number] }`; `interface EdgeSlot { name: string; faces: readonly [Face, Face]; stickers: readonly [number, number] }`; `CORNER_SLOTS: readonly CornerSlot[]` (URF, UFL, ULB, UBR, DFR, DLF, DBL, DRB); `EDGE_SLOTS: readonly EdgeSlot[]` (UR, UF, UL, UB, DR, DF, DL, DB, FR, FL, BL, BR); `interface CornerState { piece: number; twist: 0|1|2 }`; `interface EdgeState { piece: number; flip: 0|1 }`; `interface Pieces { centers: readonly Color[]; corners: readonly CornerState[]; edges: readonly EdgeState[] }`; `type PieceReading = { ok: true; pieces: Pieces } | { ok: false; impossibleCorners: number[]; mirroredCorners: number[]; impossibleEdges: number[] }`; `readPieces(cube: Cube): PieceReading`; `fromPieces(pieces: Pieces): Cube`; `cornerTwistTotal(p: Pieces): number`; `edgeFlipTotal(p: Pieces): number`; `permutationParity(order: readonly number[]): 0 | 1`

- [ ] **Step 1: Create the test helper `src/test-utils/random.ts`**

```ts
import { MOVE_BASES, type Move, type Turns } from '../cube/notation';

/**
 * A small, repeatable random-number generator ("mulberry32"). The same seed always
 * gives the same numbers, so a failing test can be re-run and investigated.
 */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A random list of moves of every kind: faces, wide turns, slices and rotations. */
export function randomMoves(count: number, random: () => number): Move[] {
  return Array.from({ length: count }, () => ({
    base: MOVE_BASES[Math.floor(random() * MOVE_BASES.length)],
    turns: (1 + Math.floor(random() * 3)) as Turns,
  }));
}
```

- [ ] **Step 2: Write the failing test `src/cube/pieces.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { randomMoves, seededRandom } from '../test-utils/random';
import { STICKER_SLOTS, solved } from './geometry';
import { applyMoves } from './moves';
import { mustParse } from './notation';
import {
  CORNER_SLOTS,
  EDGE_SLOTS,
  cornerTwistTotal,
  edgeFlipTotal,
  fromPieces,
  permutationParity,
  readPieces,
} from './pieces';
import type { Color } from './types';

const slot = (i: number) => STICKER_SLOTS[i];

/** A solved cube with some stickers swapped: each pair [a, b] exchanges two stickers. */
function swapped(pairs: [number, number][]): { stickers: Color[] } {
  const stickers = [...solved().stickers];
  for (const [a, b] of pairs) [stickers[a], stickers[b]] = [stickers[b], stickers[a]];
  return { stickers };
}

describe('slot tables', () => {
  it('lists 8 corners and 12 edges using 48 different non-center stickers', () => {
    const all = [...CORNER_SLOTS.flatMap((c) => c.stickers), ...EDGE_SLOTS.flatMap((e) => e.stickers)];
    expect(CORNER_SLOTS).toHaveLength(8);
    expect(EDGE_SLOTS).toHaveLength(12);
    expect(new Set(all).size).toBe(48);
    expect(all.every((i) => i % 9 !== 4)).toBe(true);
  });

  it("puts each slot's stickers on one cubie, on the faces the slot names", () => {
    for (const s of [...CORNER_SLOTS, ...EDGE_SLOTS]) {
      expect(s.name).toBe(s.faces.join(''));
      const first = slot(s.stickers[0]).position;
      s.stickers.forEach((i, k) => {
        expect(slot(i).position, s.name).toEqual(first);
        expect(slot(i).face, s.name).toBe(s.faces[k]);
      });
    }
  });

  it('orders each corner clockwise, starting from its top or bottom sticker', () => {
    for (const c of CORNER_SLOTS) {
      expect(['U', 'D']).toContain(c.faces[0]);
      const a = slot(c.stickers[0]).normal;
      const b = slot(c.stickers[1]).normal;
      const p = slot(c.stickers[0]).position;
      const cross = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      // Seen from outside the corner, going clockwise makes this dot product negative.
      expect(cross[0] * p[0] + cross[1] * p[1] + cross[2] * p[2], c.name).toBeLessThan(0);
    }
  });
});

describe('readPieces', () => {
  it('finds every piece at home, untwisted, on a solved cube', () => {
    const reading = readPieces(solved());
    expect(reading.ok).toBe(true);
    if (reading.ok) {
      expect(reading.pieces.corners).toEqual(CORNER_SLOTS.map((_, i) => ({ piece: i, twist: 0 })));
      expect(reading.pieces.edges).toEqual(EDGE_SLOTS.map((_, i) => ({ piece: i, flip: 0 })));
    }
  });

  it('matches the published result of an R turn (Kociemba tables)', () => {
    const reading = readPieces(applyMoves(solved(), mustParse('R')));
    expect(reading.ok).toBe(true);
    if (reading.ok) {
      // After R: the DFR corner sits in URF twisted twice; URF sits in UBR twisted once.
      expect(reading.pieces.corners[0]).toEqual({ piece: 4, twist: 2 });
      expect(reading.pieces.corners[3]).toEqual({ piece: 0, twist: 1 });
      // The FR edge moves up into UR, unflipped.
      expect(reading.pieces.edges[0]).toEqual({ piece: 8, flip: 0 });
    }
  });

  it('rebuilds exactly the same stickers from the pieces view (300 random scrambles)', () => {
    const random = seededRandom(1);
    for (let i = 0; i < 300; i++) {
      const cube = applyMoves(solved(), randomMoves(25, random));
      const reading = readPieces(cube);
      expect(reading.ok).toBe(true);
      if (reading.ok) expect(fromPieces(reading.pieces)).toEqual(cube);
    }
  });

  it('keeps the three hidden rules on every real scramble', () => {
    const random = seededRandom(2);
    for (let i = 0; i < 300; i++) {
      const reading = readPieces(applyMoves(solved(), randomMoves(25, random)));
      expect(reading.ok).toBe(true);
      if (!reading.ok) continue;
      expect(cornerTwistTotal(reading.pieces)).toBe(0);
      expect(edgeFlipTotal(reading.pieces)).toBe(0);
      expect(permutationParity(reading.pieces.corners.map((c) => c.piece))).toBe(
        permutationParity(reading.pieces.edges.map((e) => e.piece)),
      );
    }
  });

  it('shows a corner twisted in place through the twist total', () => {
    const stickers = [...solved().stickers];
    [stickers[8], stickers[9], stickers[20]] = [stickers[20], stickers[8], stickers[9]];
    const reading = readPieces({ stickers });
    expect(reading.ok).toBe(true);
    if (reading.ok) expect(cornerTwistTotal(reading.pieces)).not.toBe(0);
  });

  it('flags a corner whose colors are in mirror-image order', () => {
    expect(readPieces(swapped([[9, 20]]))).toEqual({
      ok: false,
      impossibleCorners: [],
      mirroredCorners: [0],
      impossibleEdges: [],
    });
  });

  it('flags edges with color combinations no real edge has', () => {
    expect(readPieces(swapped([[5, 43]]))).toEqual({
      ok: false,
      impossibleCorners: [],
      mirroredCorners: [],
      impossibleEdges: [0, 6],
    });
  });
});

describe('permutationParity', () => {
  it('counts an even or odd number of swaps', () => {
    expect(permutationParity([0, 1, 2])).toBe(0);
    expect(permutationParity([1, 0, 2])).toBe(1);
    expect(permutationParity([1, 2, 0])).toBe(0);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/cube/pieces.test.ts`
Expected: FAIL, because `./pieces` can't be resolved.

- [ ] **Step 4: Implement `src/cube/pieces.ts`**

```ts
import { FACES, type Color, type Cube, type Face } from './types';

/**
 * The "pieces view" of a cube. A real cube has 20 moving pieces: 8 corners (3
 * stickers each) and 12 edges (2 stickers each). This file reads which piece sits
 * in each place ("slot") and which way it is turned. Think of it as summarizing the
 * 54 sticker line items by account: the same data, grouped the way a solver thinks.
 */

/** A corner slot: its faces and sticker indices, top/bottom sticker first, then clockwise. */
export interface CornerSlot {
  name: string;
  faces: readonly [Face, Face, Face];
  stickers: readonly [number, number, number];
}

/** An edge slot: its faces and sticker indices, top/bottom (or front/back) sticker first. */
export interface EdgeSlot {
  name: string;
  faces: readonly [Face, Face];
  stickers: readonly [number, number];
}

/** The standard slot order used by most cube software (Herbert Kociemba's convention). */
export const CORNER_SLOTS: readonly CornerSlot[] = [
  { name: 'URF', faces: ['U', 'R', 'F'], stickers: [8, 9, 20] },
  { name: 'UFL', faces: ['U', 'F', 'L'], stickers: [6, 18, 38] },
  { name: 'ULB', faces: ['U', 'L', 'B'], stickers: [0, 36, 47] },
  { name: 'UBR', faces: ['U', 'B', 'R'], stickers: [2, 45, 11] },
  { name: 'DFR', faces: ['D', 'F', 'R'], stickers: [29, 26, 15] },
  { name: 'DLF', faces: ['D', 'L', 'F'], stickers: [27, 44, 24] },
  { name: 'DBL', faces: ['D', 'B', 'L'], stickers: [33, 53, 42] },
  { name: 'DRB', faces: ['D', 'R', 'B'], stickers: [35, 17, 51] },
];

export const EDGE_SLOTS: readonly EdgeSlot[] = [
  { name: 'UR', faces: ['U', 'R'], stickers: [5, 10] },
  { name: 'UF', faces: ['U', 'F'], stickers: [7, 19] },
  { name: 'UL', faces: ['U', 'L'], stickers: [3, 37] },
  { name: 'UB', faces: ['U', 'B'], stickers: [1, 46] },
  { name: 'DR', faces: ['D', 'R'], stickers: [32, 16] },
  { name: 'DF', faces: ['D', 'F'], stickers: [28, 25] },
  { name: 'DL', faces: ['D', 'L'], stickers: [30, 43] },
  { name: 'DB', faces: ['D', 'B'], stickers: [34, 52] },
  { name: 'FR', faces: ['F', 'R'], stickers: [23, 12] },
  { name: 'FL', faces: ['F', 'L'], stickers: [21, 41] },
  { name: 'BL', faces: ['B', 'L'], stickers: [50, 39] },
  { name: 'BR', faces: ['B', 'R'], stickers: [48, 14] },
];

/** Which corner piece is in a slot, and how many clockwise twists away from its home turn. */
export interface CornerState {
  piece: number; // index into CORNER_SLOTS: the piece's home slot
  twist: 0 | 1 | 2;
}

/** Which edge piece is in a slot, and whether it's flipped relative to its home turn. */
export interface EdgeState {
  piece: number; // index into EDGE_SLOTS: the piece's home slot
  flip: 0 | 1;
}

export interface Pieces {
  centers: readonly Color[]; // the six center colors, in FACES order
  corners: readonly CornerState[]; // one per slot, in CORNER_SLOTS order
  edges: readonly EdgeState[]; // one per slot, in EDGE_SLOTS order
}

export type PieceReading =
  | { ok: true; pieces: Pieces }
  | { ok: false; impossibleCorners: number[]; mirroredCorners: number[]; impossibleEdges: number[] };

const isTopOrBottom = (face: Face | undefined): boolean => face === 'U' || face === 'D';

/**
 * Read which piece sits in each slot and how it's turned. Colors are matched to
 * faces through the center colors, so the cube may be held in any orientation.
 * Assumes the six centers are different colors (validate.ts checks that first).
 */
export function readPieces(cube: Cube): PieceReading {
  const centers = FACES.map((_, f) => cube.stickers[f * 9 + 4]);
  const faceOfColor = new Map<Color, Face>(centers.map((color, f): [Color, Face] => [color, FACES[f]]));
  const faceAt = (sticker: number): Face | undefined => faceOfColor.get(cube.stickers[sticker]);

  const corners: CornerState[] = [];
  const impossibleCorners: number[] = [];
  const mirroredCorners: number[] = [];
  CORNER_SLOTS.forEach((slot, s) => {
    const faces = slot.stickers.map(faceAt);
    // The twist is which of the slot's three stickers shows the piece's top/bottom color.
    const twist = faces.findIndex(isTopOrBottom);
    const turned = twist < 0 ? [] : [0, 1, 2].map((k) => faces[(twist + k) % 3]);
    const piece = CORNER_SLOTS.findIndex((home) => home.faces.every((f, k) => f === turned[k]));
    if (piece >= 0) {
      corners.push({ piece, twist: twist as 0 | 1 | 2 });
    } else if (CORNER_SLOTS.some((home) => home.faces.every((f) => faces.includes(f)))) {
      mirroredCorners.push(s); // right colors, but in an order no real corner has
    } else {
      impossibleCorners.push(s);
    }
  });

  const edges: EdgeState[] = [];
  const impossibleEdges: number[] = [];
  EDGE_SLOTS.forEach((slot, s) => {
    const [a, b] = slot.stickers.map(faceAt);
    const straight = EDGE_SLOTS.findIndex((home) => home.faces[0] === a && home.faces[1] === b);
    const flipped = EDGE_SLOTS.findIndex((home) => home.faces[0] === b && home.faces[1] === a);
    if (straight >= 0) edges.push({ piece: straight, flip: 0 });
    else if (flipped >= 0) edges.push({ piece: flipped, flip: 1 });
    else impossibleEdges.push(s);
  });

  if (impossibleCorners.length > 0 || mirroredCorners.length > 0 || impossibleEdges.length > 0) {
    return { ok: false, impossibleCorners, mirroredCorners, impossibleEdges };
  }
  return { ok: true, pieces: { centers, corners, edges } };
}

/** Build the 54 stickers back from the pieces view: the reverse of readPieces. */
export function fromPieces(pieces: Pieces): Cube {
  const stickers: Color[] = new Array(54);
  const colorOf = (face: Face): Color => pieces.centers[FACES.indexOf(face)];
  pieces.centers.forEach((color, f) => {
    stickers[f * 9 + 4] = color;
  });
  pieces.corners.forEach(({ piece, twist }, s) => {
    const home = CORNER_SLOTS[piece].faces;
    for (let k = 0; k < 3; k++) stickers[CORNER_SLOTS[s].stickers[(twist + k) % 3]] = colorOf(home[k]);
  });
  pieces.edges.forEach(({ piece, flip }, s) => {
    const home = EDGE_SLOTS[piece].faces;
    for (let k = 0; k < 2; k++) stickers[EDGE_SLOTS[s].stickers[(flip + k) % 2]] = colorOf(home[k]);
  });
  return { stickers };
}

/** Total corner twist, counted in thirds of a turn. Always 0 on a cube that can be solved. */
export function cornerTwistTotal(pieces: Pieces): number {
  return pieces.corners.reduce((sum, c) => sum + c.twist, 0) % 3;
}

/** Total edge flips. Always 0 (an even number) on a cube that can be solved. */
export function edgeFlipTotal(pieces: Pieces): number {
  return pieces.edges.reduce((sum, e) => sum + e.flip, 0) % 2;
}

/**
 * 0 if an arrangement takes an even number of swaps to reach, 1 if odd, found by
 * counting pairs that are out of order. On a solvable cube, corners and edges match.
 */
export function permutationParity(order: readonly number[]): 0 | 1 {
  let outOfOrder = 0;
  for (let i = 0; i < order.length; i++) {
    for (let j = i + 1; j < order.length; j++) {
      if (order[i] > order[j]) outOfOrder++;
    }
  }
  return (outOfOrder % 2) as 0 | 1;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/cube/pieces.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 6: Check and commit**

```powershell
npm run typecheck
npm test
npm run format
git add -A
git commit -m "feat: pieces view of the cube (corners and edges) with round-trip proof" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Plain-English descriptions + validation

**Files:**
- Create: `src/cube/describe.ts`, `src/cube/validate.ts`
- Test: `src/cube/describe.test.ts`, `src/cube/validate.test.ts`

**Interfaces:**
- Consumes: everything Task 1 produces; `solved` (geometry.ts); `applyMoves` (moves.ts); `mustParse` (notation.ts)
- Produces:
  - `describe.ts`: `COLOR_NAMES: Record<Color, string>`; `placeName(faces: readonly Face[]): string`; `colorList(colors: readonly Color[]): string`; `listJoin(items: readonly string[]): string`; `capitalize(text: string): string`; `holdDescription(cube: Cube): string`
  - `validate.ts`: `type ProblemCode = 'blank' | 'color-count' | 'duplicate-center' | 'center-opposites' | 'center-mirror' | 'impossible-edge' | 'impossible-corner' | 'mirrored-corner' | 'duplicate-piece' | 'corner-twist' | 'edge-flip' | 'parity'`; `interface Problem { code: ProblemCode; message: string; stickers: number[] }`; `type ValidationResult = { ok: true; cube: Cube; pieces: Pieces } | { ok: false; problems: Problem[] }`; `validateStickers(stickers: readonly (Color | null)[]): ValidationResult`; `REAL_CENTER_LAYOUTS: ReadonlySet<string>`

- [ ] **Step 1: Write the failing tests**

`src/cube/describe.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { colorList, holdDescription, listJoin, placeName } from './describe';
import { solved } from './geometry';
import { applyMoves } from './moves';
import { mustParse } from './notation';

describe('describe', () => {
  it('names places in everyday words, top/bottom first', () => {
    expect(placeName(['U', 'R', 'F'])).toBe('top-front-right');
    expect(placeName(['D', 'L', 'F'])).toBe('bottom-front-left');
    expect(placeName(['F', 'R'])).toBe('front-right');
    expect(placeName(['B', 'L'])).toBe('back-left');
  });

  it('names colors', () => {
    expect(colorList(['W', 'R', 'G'])).toBe('white-red-green');
  });

  it('joins lists the way people write them', () => {
    expect(listJoin([])).toBe('');
    expect(listJoin(['a'])).toBe('a');
    expect(listJoin(['a', 'b'])).toBe('a and b');
    expect(listJoin(['a', 'b', 'c'])).toBe('a, b and c');
  });

  it('describes how to hold the cube from its centers', () => {
    expect(holdDescription(solved())).toBe('White on top, green facing you.');
    expect(holdDescription(applyMoves(solved(), mustParse('x2')))).toBe(
      'Yellow on top, blue facing you.',
    );
  });
});
```

`src/cube/validate.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { randomMoves, seededRandom } from '../test-utils/random';
import { solved } from './geometry';
import { applyMoves } from './moves';
import { mustParse } from './notation';
import type { Color, Cube } from './types';
import { REAL_CENTER_LAYOUTS, validateStickers, type ValidationResult } from './validate';

const COLORS: Color[] = ['W', 'Y', 'G', 'B', 'R', 'O'];

/** A cube's stickers with some replaced: { index: newColor }. */
function edited(changes: Record<number, Color | null>, base: Cube = solved()): (Color | null)[] {
  const stickers: (Color | null)[] = [...base.stickers];
  for (const [index, color] of Object.entries(changes)) stickers[Number(index)] = color;
  return stickers;
}

/** A cube's stickers with pairs of stickers exchanged. */
function swapped(pairs: [number, number][], base: Cube = solved()): Color[] {
  const stickers = [...base.stickers];
  for (const [a, b] of pairs) [stickers[a], stickers[b]] = [stickers[b], stickers[a]];
  return stickers;
}

const codes = (result: ValidationResult) => (result.ok ? [] : result.problems.map((p) => p.code));
const messages = (result: ValidationResult) =>
  result.ok ? '' : result.problems.map((p) => p.message).join(' | ');

describe('validateStickers: real cubes pass', () => {
  it('accepts a solved cube', () => {
    const result = validateStickers(solved().stickers);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.cube).toEqual(solved());
  });

  it('accepts 500 real scrambles of every move type', () => {
    const random = seededRandom(7);
    for (let i = 0; i < 500; i++) {
      const result = validateStickers(applyMoves(solved(), randomMoves(30, random)).stickers);
      expect(result.ok, messages(result)).toBe(true);
    }
  });

  it('accepts a solved cube held in any of its 24 orientations', () => {
    expect(REAL_CENTER_LAYOUTS.size).toBe(24);
    for (const first of ['', 'x', 'x2', "x'", 'z', "z'"]) {
      for (const second of ['', 'y', 'y2', "y'"]) {
        const cube = applyMoves(solved(), mustParse(`${first} ${second}`));
        expect(validateStickers(cube.stickers).ok, `${first} ${second}`).toBe(true);
      }
    }
  });
});

describe('validateStickers: each kind of problem', () => {
  it('asks for the blank stickers first', () => {
    const result = validateStickers(edited({ 0: null, 1: null, 13: null }));
    expect(result).toEqual({
      ok: false,
      problems: [{ code: 'blank', message: '3 stickers still need a color.', stickers: [0, 1, 13] }],
    });
    expect(messages(validateStickers(edited({ 5: null })))).toBe('1 sticker still needs a color.');
  });

  it('reports only the first kind of problem', () => {
    expect(codes(validateStickers(edited({ 0: null, 10: 'O' })))).toEqual(['blank']);
  });

  it('counts colors and suggests the likely mix-up', () => {
    const result = validateStickers(edited({ 10: 'O' }));
    expect(codes(result)).toEqual(['color-count']);
    expect(messages(result)).toContain('there are 8 red and 10 orange');
    expect(messages(result)).toContain('One red sticker was probably entered as orange.');
    if (!result.ok) {
      expect(result.problems[0].stickers).toContain(10);
      expect(result.problems[0].stickers).not.toContain(40); // the orange center isn't suspect
    }
  });

  it('catches two centers of the same color', () => {
    const result = validateStickers(swapped([[22, 0]]));
    expect(codes(result)).toEqual(['duplicate-center']);
    expect(messages(result)).toContain('Two centers are both white');
    if (!result.ok) expect(result.problems[0].stickers).toEqual([4, 22]);
  });

  it('catches centers that should be opposite but are next to each other (swapped caps)', () => {
    const result = validateStickers(swapped([[13, 22]]));
    expect(new Set(codes(result))).toEqual(new Set(['center-opposites']));
    expect(messages(result)).toContain('red and orange centers should be on opposite sides');
  });

  it('catches a mirror-image center layout (red and orange caps swapped)', () => {
    const result = validateStickers(swapped([[13, 40]]));
    expect(codes(result)).toEqual(['center-mirror']);
    expect(messages(result)).toContain('mirror image');
  });

  it('catches edges with color combinations no real edge has', () => {
    const result = validateStickers(swapped([[5, 43]]));
    expect(codes(result)).toEqual(['impossible-edge', 'impossible-edge']);
    expect(messages(result)).toContain('The top-right edge shows orange and red');
    if (!result.ok) expect(result.problems[0].stickers).toEqual([5, 10]);
  });

  it('catches a corner with its colors in the wrong order', () => {
    const result = validateStickers(swapped([[9, 20]]));
    expect(codes(result)).toEqual(['mirrored-corner']);
    expect(messages(result)).toContain('top-front-right corner');
    if (!result.ok) expect(result.problems[0].stickers).toEqual([8, 9, 20]);
  });

  it('catches a piece that appears twice', () => {
    const result = validateStickers(edited({ 19: 'R', 16: 'G' }));
    expect(codes(result)).toEqual(['duplicate-piece']);
    expect(messages(result)).toContain('white-red edge');
    expect(messages(result)).toContain('missing');
  });

  it('catches a corner twisted in place', () => {
    const stickers = [...solved().stickers];
    [stickers[8], stickers[9], stickers[20]] = [stickers[20], stickers[8], stickers[9]];
    expect(codes(validateStickers(stickers))).toEqual(['corner-twist']);
  });

  it('catches an edge flipped in place', () => {
    expect(codes(validateStickers(swapped([[7, 19]])))).toEqual(['edge-flip']);
  });

  it('catches two pieces swapped', () => {
    expect(codes(validateStickers(swapped([[7, 5], [19, 10]])))).toEqual(['parity']);
  });

  it('catches a twisted corner on a scrambled cube too', () => {
    const scrambled = applyMoves(solved(), randomMoves(20, seededRandom(3)));
    const stickers = [...scrambled.stickers];
    [stickers[8], stickers[9], stickers[20]] = [stickers[20], stickers[8], stickers[9]];
    expect(codes(validateStickers(stickers))).toEqual(['corner-twist']);
  });
});

describe('validateStickers: robustness', () => {
  it('never crashes on random input, and always explains a rejection', () => {
    const random = seededRandom(11);
    const pick = () => COLORS[Math.floor(random() * 6)];
    for (let i = 0; i < 1000; i++) {
      // Fully random colors, with some blanks.
      const noisy = Array.from({ length: 54 }, () => (random() < 0.1 ? null : pick()));
      // A shuffle of a solved cube's stickers: color counts are right, everything else random.
      const shuffled = [...solved().stickers].sort(() => random() - 0.5);
      for (const stickers of [noisy, shuffled]) {
        const result = validateStickers(stickers);
        if (!result.ok) {
          expect(result.problems.length).toBeGreaterThan(0);
          expect(result.problems.every((p) => p.message.length > 0)).toBe(true);
        }
      }
    }
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/cube/describe.test.ts src/cube/validate.test.ts`
Expected: FAIL, because `./describe` and `./validate` can't be resolved.

- [ ] **Step 3: Implement `src/cube/describe.ts`**

```ts
import type { Color, Cube, Face } from './types';

export const COLOR_NAMES: Record<Color, string> = {
  W: 'white',
  Y: 'yellow',
  G: 'green',
  B: 'blue',
  R: 'red',
  O: 'orange',
};

const FACE_WORDS: Record<Face, string> = {
  U: 'top',
  D: 'bottom',
  F: 'front',
  B: 'back',
  L: 'left',
  R: 'right',
};

/** The order people say place words in: "top-front-right", not "right-top-front". */
const WORD_ORDER: readonly Face[] = ['U', 'D', 'F', 'B', 'L', 'R'];

/** A place on the cube in everyday words, e.g. ['U', 'R', 'F'] → "top-front-right". */
export function placeName(faces: readonly Face[]): string {
  return [...faces]
    .sort((a, b) => WORD_ORDER.indexOf(a) - WORD_ORDER.indexOf(b))
    .map((face) => FACE_WORDS[face])
    .join('-');
}

/** Color names joined with dashes, e.g. ['W', 'R', 'G'] → "white-red-green". */
export function colorList(colors: readonly Color[]): string {
  return colors.map((c) => COLOR_NAMES[c]).join('-');
}

/** Join a list the way people write it: "a", "a and b", "a, b and c". */
export function listJoin(items: readonly string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export function capitalize(text: string): string {
  return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}

/** How to hold the cube so it matches the screen, e.g. "White on top, green facing you." */
export function holdDescription(cube: Cube): string {
  const top = COLOR_NAMES[cube.stickers[4]]; // U center
  const front = COLOR_NAMES[cube.stickers[22]]; // F center
  return `${capitalize(top)} on top, ${front} facing you.`;
}
```

- [ ] **Step 4: Implement `src/cube/validate.ts`**

```ts
import { COLOR_NAMES, capitalize, colorList, listJoin, placeName } from './describe';
import { solved } from './geometry';
import { applyMoves } from './moves';
import { mustParse } from './notation';
import {
  CORNER_SLOTS,
  EDGE_SLOTS,
  cornerTwistTotal,
  edgeFlipTotal,
  permutationParity,
  readPieces,
  type PieceReading,
  type Pieces,
} from './pieces';
import { FACES, type Color, type Cube, type Face } from './types';

export type ProblemCode =
  | 'blank'
  | 'color-count'
  | 'duplicate-center'
  | 'center-opposites'
  | 'center-mirror'
  | 'impossible-edge'
  | 'impossible-corner'
  | 'mirrored-corner'
  | 'duplicate-piece'
  | 'corner-twist'
  | 'edge-flip'
  | 'parity';

/** One thing wrong with an entered cube: a plain-English message and the stickers to double-check. */
export interface Problem {
  code: ProblemCode;
  message: string;
  stickers: number[];
}

export type ValidationResult =
  | { ok: true; cube: Cube; pieces: Pieces }
  | { ok: false; problems: Problem[] };

const ALL_COLORS: readonly Color[] = ['W', 'Y', 'G', 'B', 'R', 'O'];
const CENTER_STICKERS: readonly number[] = FACES.map((_, f) => f * 9 + 4);
const OPPOSITE_FACE: Record<Face, Face> = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' };
const OPPOSITE_COLORS: readonly [Color, Color][] = [
  ['W', 'Y'],
  ['R', 'O'],
  ['G', 'B'],
];

/**
 * Every way the six centers of a standard cube can look: the solved cube turned
 * into each of its 24 orientations (6 choices of top face × 4 of front face).
 */
export const REAL_CENTER_LAYOUTS: ReadonlySet<string> = (() => {
  const layouts = new Set<string>();
  for (const top of ['', 'x', 'x2', "x'", 'z', "z'"]) {
    for (const front of ['', 'y', 'y2', "y'"]) {
      const cube = applyMoves(solved(), mustParse(`${top} ${front}`));
      layouts.add(CENTER_STICKERS.map((i) => cube.stickers[i]).join(''));
    }
  }
  return layouts;
})();

/**
 * Check that 54 entered stickers make a real, solvable cube. Checks run in stages,
 * like tying out a model from the top down, and stop at the first stage with a
 * problem, because later checks only make sense once earlier ones pass.
 */
export function validateStickers(stickers: readonly (Color | null)[]): ValidationResult {
  if (stickers.length !== 54) throw new Error(`Expected 54 stickers, got ${stickers.length}`);

  // Stage 1: every sticker filled in.
  const blanks = stickers.flatMap((color, i) => (color === null ? [i] : []));
  if (blanks.length > 0) {
    const needs = blanks.length === 1 ? 'sticker still needs' : 'stickers still need';
    return fail([{ code: 'blank', message: `${blanks.length} ${needs} a color.`, stickers: blanks }]);
  }
  const cube: Cube = { stickers: stickers as Color[] };

  // Stage 2: nine stickers of each color.
  const countProblem = checkColorCounts(cube);
  if (countProblem) return fail([countProblem]);

  // Stage 3: centers are six different colors, laid out like a standard cube.
  const centerProblems = checkCenters(cube);
  if (centerProblems.length > 0) return fail(centerProblems);

  // Stage 4: every corner and edge is a piece that really exists.
  const reading = readPieces(cube);
  if (!reading.ok) return fail(describeImpossiblePieces(cube, reading));

  // Stage 5: each piece appears exactly once.
  const duplicateProblems = checkDuplicates(reading.pieces);
  if (duplicateProblems.length > 0) return fail(duplicateProblems);

  // Stage 6: the three hidden rules every solvable cube obeys.
  const ruleProblems = checkHiddenRules(reading.pieces);
  if (ruleProblems.length > 0) return fail(ruleProblems);

  return { ok: true, cube, pieces: reading.pieces };
}

function fail(problems: Problem[]): ValidationResult {
  return { ok: false, problems };
}

function checkColorCounts(cube: Cube): Problem | null {
  const counts = new Map<Color, number>(ALL_COLORS.map((c): [Color, number] => [c, 0]));
  for (const color of cube.stickers) counts.set(color, (counts.get(color) ?? 0) + 1);
  const countOf = (c: Color) => counts.get(c) ?? 0;
  const wrong = ALL_COLORS.filter((c) => countOf(c) !== 9);
  if (wrong.length === 0) return null;

  const over = wrong.filter((c) => countOf(c) > 9);
  const under = wrong.filter((c) => countOf(c) < 9);
  let message =
    'Each color should appear exactly 9 times, but there are ' +
    `${listJoin(wrong.map((c) => `${countOf(c)} ${COLOR_NAMES[c]}`))}.`;
  if (over.length === 1 && under.length === 1 && countOf(over[0]) === 10 && countOf(under[0]) === 8) {
    message += ` One ${COLOR_NAMES[under[0]]} sticker was probably entered as ${COLOR_NAMES[over[0]]}.`;
  }
  // Suspects: every non-center sticker of a color that appears too often.
  const suspects = cube.stickers.flatMap((c, i) => (over.includes(c) && i % 9 !== 4 ? [i] : []));
  return { code: 'color-count', message, stickers: suspects };
}

function checkCenters(cube: Cube): Problem[] {
  const centers = CENTER_STICKERS.map((i) => cube.stickers[i]);

  const repeated = ALL_COLORS.filter((c) => centers.filter((x) => x === c).length > 1);
  if (repeated.length > 0) {
    return repeated.map((c) => {
      const count = centers.filter((x) => x === c).length;
      const start = count === 2 ? `Two centers are both ${COLOR_NAMES[c]}` : `${count} centers are ${COLOR_NAMES[c]}`;
      return {
        code: 'duplicate-center',
        message: `${start}. Each face has its own center color, so one of them was entered wrong.`,
        stickers: CENTER_STICKERS.filter((i) => cube.stickers[i] === c),
      };
    });
  }

  // From here on all six center colors are different, so each color names one face.
  const faceOf = (c: Color): Face => FACES[centers.indexOf(c)];
  const notOpposite = OPPOSITE_COLORS.filter(([a, b]) => OPPOSITE_FACE[faceOf(a)] !== faceOf(b));
  if (notOpposite.length > 0) {
    return notOpposite.map(([a, b]) => ({
      code: 'center-opposites',
      message:
        `The ${COLOR_NAMES[a]} and ${COLOR_NAMES[b]} centers should be on opposite sides of the cube, ` +
        "but they're next to each other. Two center caps may have been swapped, or two centers were entered in the wrong places.",
      stickers: [a, b].map((c) => CENTER_STICKERS[centers.indexOf(c)]),
    }));
  }

  if (!REAL_CENTER_LAYOUTS.has(centers.join(''))) {
    return [
      {
        code: 'center-mirror',
        message:
          'The centers are a mirror image of a standard cube (with white on top and green facing you, ' +
          'red should be on the right). Two center caps may have been swapped, or two centers were entered in the wrong places.',
        stickers: [...CENTER_STICKERS],
      },
    ];
  }
  return [];
}

function describeImpossiblePieces(cube: Cube, reading: Extract<PieceReading, { ok: false }>): Problem[] {
  const colorName = (sticker: number) => COLOR_NAMES[cube.stickers[sticker]];
  const edgeProblems = reading.impossibleEdges.map((s): Problem => {
    const slot = EDGE_SLOTS[s];
    const [a, b] = slot.stickers.map(colorName);
    const shows = a === b ? `two ${a} stickers` : `${a} and ${b}`;
    return {
      code: 'impossible-edge',
      message: `The ${placeName(slot.faces)} edge shows ${shows}, a combination no real edge has. One of its stickers is probably wrong.`,
      stickers: [...slot.stickers],
    };
  });
  const cornerProblems = reading.impossibleCorners.map((s): Problem => {
    const slot = CORNER_SLOTS[s];
    return {
      code: 'impossible-corner',
      message: `The ${placeName(slot.faces)} corner shows ${listJoin(slot.stickers.map(colorName))}, a combination no real corner has. One of its stickers is probably wrong.`,
      stickers: [...slot.stickers],
    };
  });
  const mirrorProblems = reading.mirroredCorners.map((s): Problem => {
    const slot = CORNER_SLOTS[s];
    return {
      code: 'mirrored-corner',
      message: `The ${placeName(slot.faces)} corner has the right colors in the wrong order, so two of its stickers are probably swapped.`,
      stickers: [...slot.stickers],
    };
  });
  return [...edgeProblems, ...cornerProblems, ...mirrorProblems];
}

function checkDuplicates(pieces: Pieces): Problem[] {
  const colorsOf = (faces: readonly Face[]) => colorList(faces.map((f) => pieces.centers[FACES.indexOf(f)]));
  const groups: {
    kind: string;
    slots: readonly { faces: readonly Face[]; stickers: readonly number[] }[];
    found: number[];
  }[] = [
    { kind: 'corner', slots: CORNER_SLOTS, found: pieces.corners.map((c) => c.piece) },
    { kind: 'edge', slots: EDGE_SLOTS, found: pieces.edges.map((e) => e.piece) },
  ];

  const problems: Problem[] = [];
  for (const { kind, slots, found } of groups) {
    const allPieces = slots.map((_, p) => p);
    const repeated = allPieces.filter((p) => found.filter((x) => x === p).length > 1);
    if (repeated.length === 0) continue;
    const missing = allPieces.filter((p) => !found.includes(p));
    const names = (list: number[]) => listJoin(list.map((p) => `the ${colorsOf(slots[p].faces)} ${kind}`));
    problems.push({
      code: 'duplicate-piece',
      message:
        `${capitalize(names(repeated))} ${repeated.length === 1 ? 'appears' : 'appear'} more than once, ` +
        `and ${names(missing)} ${missing.length === 1 ? 'is' : 'are'} missing. ` +
        'A sticker on one of the repeated pieces is probably wrong.',
      stickers: found.flatMap((p, s) => (repeated.includes(p) ? [...slots[s].stickers] : [])),
    });
  }
  return problems;
}

function checkHiddenRules(pieces: Pieces): Problem[] {
  const problems: Problem[] = [];
  if (cornerTwistTotal(pieces) !== 0) {
    problems.push({
      code: 'corner-twist',
      message:
        'A corner is twisted in place. A real cube can never get this way just by turning, so either a corner ' +
        'sticker was entered wrong, or a corner was twisted or popped out and put back. Compare the corner stickers with your cube.',
      stickers: [],
    });
  }
  if (edgeFlipTotal(pieces) !== 0) {
    problems.push({
      code: 'edge-flip',
      message:
        "An edge is flipped in place. A real cube can never get this way just by turning, so either an edge's two " +
        'stickers were entered the wrong way round, or an edge was popped out and put back flipped. Compare the edge stickers with your cube.',
      stickers: [],
    });
  }
  const cornerOrder = pieces.corners.map((c) => c.piece);
  const edgeOrder = pieces.edges.map((e) => e.piece);
  if (permutationParity(cornerOrder) !== permutationParity(edgeOrder)) {
    problems.push({
      code: 'parity',
      message:
        'Two pieces appear to be swapped. A real cube can never get this way just by turning, so either stickers were ' +
        'entered in the wrong places, or the cube was taken apart and put back together differently.',
      stickers: [],
    });
  }
  return problems;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/cube/describe.test.ts src/cube/validate.test.ts`
Expected: PASS (4 + 17 = 21 tests).

- [ ] **Step 6: Check and commit**

```powershell
npm run typecheck
npm test
npm run format
git add -A
git commit -m "feat: validate entered cubes with plain-English problems" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Editor logic: unfolded-cube map + sticker editing

**Files:**
- Create: `src/input/net.ts`, `src/input/editorState.ts`
- Test: `src/input/net.test.ts`, `src/input/editorState.test.ts`

**Interfaces:**
- Consumes: `STICKER_SLOTS`, `HOME_COLORS`, `solved` (geometry.ts); `Color`, `Face` (types.ts)
- Produces:
  - `net.ts`: `interface NetCell { slot: number; row: number; col: number }`; `NET_CELLS: readonly NetCell[]` (grid rows 0–8, columns 0–11); `NET_ROWS = 9`; `NET_COLS = 12`
  - `editorState.ts`: `type EditorStickers = readonly (Color | null)[]`; `isCenter(slot: number): boolean`; `blankStickers(): EditorStickers`; `solvedStickers(): EditorStickers`; `paintSticker(stickers, slot, color): EditorStickers`; `countBlanks(stickers): number`

- [ ] **Step 1: Write the failing tests**

`src/input/net.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { STICKER_SLOTS } from '../cube/geometry';
import { NET_CELLS, NET_COLS, NET_ROWS } from './net';

describe('unfolded-cube map', () => {
  it('gives every sticker its own square inside the grid', () => {
    expect(NET_CELLS).toHaveLength(54);
    expect(new Set(NET_CELLS.map((c) => `${c.row},${c.col}`)).size).toBe(54);
    for (const c of NET_CELLS) {
      expect(c.row).toBeGreaterThanOrEqual(0);
      expect(c.row).toBeLessThan(NET_ROWS);
      expect(c.col).toBeGreaterThanOrEqual(0);
      expect(c.col).toBeLessThan(NET_COLS);
    }
  });

  it('joins faces the way a real cube folds up', () => {
    // Two squares side by side on different faces must be the same physical piece.
    const at = new Map(NET_CELLS.map((c) => [`${c.row},${c.col}`, c]));
    let joins = 0;
    for (const cell of NET_CELLS) {
      for (const [dRow, dCol] of [
        [0, 1],
        [1, 0],
      ]) {
        const next = at.get(`${cell.row + dRow},${cell.col + dCol}`);
        if (!next) continue;
        const a = STICKER_SLOTS[cell.slot];
        const b = STICKER_SLOTS[next.slot];
        if (a.face === b.face) continue;
        joins++;
        expect(b.position, `${a.face}${cell.slot} beside ${b.face}${next.slot}`).toEqual(a.position);
      }
    }
    expect(joins).toBe(15); // 5 folds (U-F, L-F, F-R, R-B, F-D) × 3 squares each
  });
});
```

`src/input/editorState.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { HOME_COLORS, STICKER_SLOTS, solved } from '../cube/geometry';
import { blankStickers, countBlanks, isCenter, paintSticker, solvedStickers } from './editorState';

describe('editor stickers', () => {
  it('starts blank except the six centers, which match the reference hold', () => {
    const stickers = blankStickers();
    expect(countBlanks(stickers)).toBe(48);
    for (const s of STICKER_SLOTS) {
      expect(stickers[s.index]).toBe(isCenter(s.index) ? HOME_COLORS[s.face] : null);
    }
  });

  it('paints one sticker without changing the original list', () => {
    const before = blankStickers();
    const after = paintSticker(before, 0, 'R');
    expect(after[0]).toBe('R');
    expect(before[0]).toBeNull();
    expect(countBlanks(after)).toBe(47);
  });

  it('can fill in a solved cube', () => {
    expect(solvedStickers()).toEqual(solved().stickers);
    expect(countBlanks(solvedStickers())).toBe(0);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/input`
Expected: FAIL, because `./net` and `./editorState` can't be resolved.

- [ ] **Step 3: Implement `src/input/net.ts`**

```ts
import { STICKER_SLOTS } from '../cube/geometry';
import type { Face } from '../cube/types';

/**
 * The unfolded cube ("net") used for entering stickers, in the standard layout:
 *
 *          [U]
 *     [L]  [F]  [R]  [B]
 *          [D]
 *
 * Each face is placed by its top-left corner, in units of whole faces.
 */
const FACE_ORIGIN: Record<Face, { row: number; col: number }> = {
  U: { row: 0, col: 1 },
  L: { row: 1, col: 0 },
  F: { row: 1, col: 1 },
  R: { row: 1, col: 2 },
  B: { row: 1, col: 3 },
  D: { row: 2, col: 1 },
};

export const NET_ROWS = 9;
export const NET_COLS = 12;

/** One square of the map: which sticker it is and where it sits in the grid. */
export interface NetCell {
  slot: number;
  row: number; // 0..8
  col: number; // 0..11
}

export const NET_CELLS: readonly NetCell[] = STICKER_SLOTS.map((s) => ({
  slot: s.index,
  row: FACE_ORIGIN[s.face].row * 3 + s.row,
  col: FACE_ORIGIN[s.face].col * 3 + s.col,
}));
```

- [ ] **Step 4: Implement `src/input/editorState.ts`**

```ts
import { HOME_COLORS, STICKER_SLOTS, solved } from '../cube/geometry';
import type { Color } from '../cube/types';

/** The editor's 54 stickers: a color, or null for "not filled in yet". */
export type EditorStickers = readonly (Color | null)[];

/** The middle sticker of each face (index 4 of its 9). */
export function isCenter(slot: number): boolean {
  return slot % 9 === 4;
}

/** Centers filled in for the reference hold (white up, green front); everything else blank. */
export function blankStickers(): EditorStickers {
  return STICKER_SLOTS.map((s) => (isCenter(s.index) ? HOME_COLORS[s.face] : null));
}

/** Every sticker filled in as a solved cube. */
export function solvedStickers(): EditorStickers {
  return solved().stickers;
}

/** A copy of the stickers with one sticker painted. The original list is left unchanged. */
export function paintSticker(stickers: EditorStickers, slot: number, color: Color): EditorStickers {
  return stickers.map((current, i) => (i === slot ? color : current));
}

export function countBlanks(stickers: EditorStickers): number {
  return stickers.filter((c) => c === null).length;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/input`
Expected: PASS (2 + 3 = 5 tests).

- [ ] **Step 6: Check and commit**

```powershell
npm run typecheck
npm test
npm run format
git add -A
git commit -m "feat: editor logic for the unfolded-cube map" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Screens: tabs, cube editor, and player starting from any cube

**Files:**
- Modify: `src/render/CubeView.ts` (add `showStickers`, grey blanks)
- Create: `src/app/PlayerScreen.tsx`, `src/app/EnterCubeScreen.tsx`
- Modify: `src/app/App.tsx` (replace entirely), `src/app/app.css` (append), `CLAUDE.md` (status)

**Interfaces:**
- Consumes: `validateStickers`, `ValidationResult` (Task 2); `holdDescription`, `COLOR_NAMES` (Task 2); `NET_CELLS` (Task 3); `blankStickers`, `solvedStickers`, `paintSticker`, `countBlanks`, `EditorStickers` (Task 3); `CubeView`, `STICKER_HEX`, `Playback` (phase ①)
- Produces: `CubeView.showStickers(stickers: readonly (Color | null)[]): void`; `PlayerScreen` props `{ algorithm: string; onAlgorithmChange(text: string): void; start: Cube; isCustomStart: boolean; onUseSolvedStart(): void }`; `EnterCubeScreen` props `{ stickers: EditorStickers; onStickersChange(s: EditorStickers): void; onUseCube(cube: Cube): void }`

This task draws UI, so it's verified by typecheck, build, the full test suite, and the browser checklist in Step 7.

- [ ] **Step 1: Let `CubeView` draw blank stickers**

In `src/render/CubeView.ts`, add below `STICKER_HEX`:
```ts
/** Screen color for a sticker that hasn't been filled in yet. */
const BLANK_HEX = 0x9a9a9a;
```

Replace the `show` method with:
```ts
  show(cube: Cube): void {
    this.showStickers(cube.stickers);
  }

  /** Like show(), but blank (null) stickers are allowed and drawn grey. Used by the cube editor. */
  showStickers(stickers: readonly (Color | null)[]): void {
    this.finishAnimation(false); // a jump cancels any animation in progress
    this.paint(stickers);
  }
```

Replace the `paint` method with:
```ts
  private paint(stickers: readonly (Color | null)[]): void {
    stickers.forEach((color, slot) =>
      this.stickerMaterials[slot].color.setHex(color === null ? BLANK_HEX : STICKER_HEX[color]),
    );
  }
```

In `finishAnimation`, change `if (completed) this.paint(animation.next);` to:
```ts
    if (completed) this.paint(animation.next.stickers);
```

- [ ] **Step 2: Create `src/app/PlayerScreen.tsx`**

```tsx
import { useEffect, useReducer, useRef, useState } from 'react';
import { holdDescription } from '../cube/describe';
import { formatMove, parseAlgorithm } from '../cube/notation';
import type { Cube } from '../cube/types';
import { CubeView } from '../render/CubeView';
import { Playback } from '../render/playback';

interface PlayerScreenProps {
  algorithm: string;
  onAlgorithmChange: (text: string) => void;
  start: Cube; // the cube the algorithm starts from
  isCustomStart: boolean; // true when `start` is a cube the user entered
  onUseSolvedStart: () => void;
}

export function PlayerScreen(props: PlayerScreenProps) {
  const { algorithm, onAlgorithmChange, start, isCustomStart, onUseSolvedStart } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const playbackRef = useRef<Playback | null>(null);
  const [, refresh] = useReducer((n: number) => n + 1, 0); // re-draw the page when playback changes
  const [msPerMove, setMsPerMove] = useState(400);
  const parsed = parseAlgorithm(algorithm);

  // Create the 3D view once, and clean it up when the screen goes away.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const view = new CubeView(container);
    const playback = new Playback(view);
    playback.onChange = refresh;
    playbackRef.current = playback;
    return () => {
      playback.pause();
      playbackRef.current = null;
      view.dispose();
    };
  }, []);

  // Load the algorithm whenever the text changes to a different valid one, or the start cube changes.
  const normalized = parsed.ok ? parsed.moves.map(formatMove).join(' ') : null;
  useEffect(() => {
    if (normalized === null) return;
    const result = parseAlgorithm(normalized);
    if (result.ok) playbackRef.current?.load(result.moves, start);
  }, [normalized, start]);

  useEffect(() => {
    if (playbackRef.current) playbackRef.current.msPerMove = msPerMove;
  }, [msPerMove]);

  const playback = playbackRef.current;
  const position = playback?.position ?? 0;
  const busy = playback?.isBusy ?? false;
  const playing = playback?.isPlaying ?? false;
  const moves = parsed.ok ? parsed.moves : [];
  const canUse = parsed.ok && playback !== null;

  return (
    <>
      <h1>Algorithm player</h1>
      <div className="cube-view" ref={containerRef} />
      <p className="hint">
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
      </p>

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

      <ol className="move-list">
        {moves.map((move, i) => (
          <li key={i} className={i < position ? 'done' : i === position ? 'next' : ''}>
            {formatMove(move)}
          </li>
        ))}
      </ol>

      <div className="controls">
        <button onClick={() => playback?.reset()} disabled={!canUse}>
          ⏮ Reset
        </button>
        <button
          onClick={() => void playback?.stepBack()}
          disabled={!canUse || busy || playing || position === 0}
        >
          ◀ Step back
        </button>
        {playing ? (
          <button onClick={() => playback?.pause()}>⏸ Pause</button>
        ) : (
          <button
            onClick={() => void playback?.play()}
            disabled={!canUse || busy || moves.length === 0}
          >
            ▶ Play
          </button>
        )}
        <button
          onClick={() => void playback?.stepForward()}
          disabled={!canUse || busy || playing || position >= moves.length}
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
    </>
  );
}
```

- [ ] **Step 3: Create `src/app/EnterCubeScreen.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { COLOR_NAMES } from '../cube/describe';
import { STICKER_SLOTS } from '../cube/geometry';
import type { Color, Cube, Face } from '../cube/types';
import { validateStickers, type ValidationResult } from '../cube/validate';
import {
  blankStickers,
  countBlanks,
  isCenter,
  paintSticker,
  solvedStickers,
  type EditorStickers,
} from '../input/editorState';
import { NET_CELLS } from '../input/net';
import { CubeView, STICKER_HEX } from '../render/CubeView';

const PALETTE: readonly Color[] = ['W', 'Y', 'G', 'B', 'R', 'O'];
const FACE_NAMES: Record<Face, string> = {
  U: 'Top',
  D: 'Bottom',
  F: 'Front',
  B: 'Back',
  L: 'Left',
  R: 'Right',
};

/** CSS color for a sticker (blank stickers are grey). */
function cssColor(color: Color | null): string {
  return color === null ? '#9a9a9a' : `#${STICKER_HEX[color].toString(16).padStart(6, '0')}`;
}

interface EnterCubeScreenProps {
  stickers: EditorStickers;
  onStickersChange: (stickers: EditorStickers) => void;
  onUseCube: (cube: Cube) => void;
}

export function EnterCubeScreen({ stickers, onStickersChange, onUseCube }: EnterCubeScreenProps) {
  const [color, setColor] = useState<Color>('W');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<CubeView | null>(null);

  // Create the 3D preview once, and clean it up when the screen goes away.
  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;
    const view = new CubeView(container);
    viewRef.current = view;
    return () => {
      viewRef.current = null;
      view.dispose();
    };
  }, []);

  // Keep the 3D preview in step with the stickers.
  useEffect(() => {
    viewRef.current?.showStickers(stickers);
  }, [stickers]);

  /** Any edit makes an earlier check out of date, so clear it. */
  function change(next: EditorStickers) {
    onStickersChange(next);
    setResult(null);
  }

  const highlighted = new Set(result && !result.ok ? result.problems.flatMap((p) => p.stickers) : []);
  const blanks = countBlanks(stickers);

  return (
    <>
      <h1>Enter my cube</h1>
      <p className="hint">
        Hold your cube with the <strong>white center on top</strong> and the{' '}
        <strong>green center facing you</strong>. Pick a color, then tap squares to match your cube.
      </p>
      <details className="help">
        <summary>How to read each face</summary>
        <ul>
          <li>
            <strong>Front, right, back and left:</strong> keep white on top and turn the whole cube
            until that face points at you.
          </li>
          <li>
            <strong>Top:</strong> tip the cube toward you and look down at the white face, with the
            green side nearest you.
          </li>
          <li>
            <strong>Bottom:</strong> tip the cube away from you and look at the yellow face, with the
            green side at the top.
          </li>
          <li>
            Centers are filled in for you. If yours are different (for example, the center on your
            right isn't red), change them to what you really see. The check will spot swapped centers.
          </li>
        </ul>
      </details>

      <div className="net" aria-label="Unfolded cube: top above front; left, front, right and back in a row; bottom below front">
        {NET_CELLS.map(({ slot, row, col }) => {
          const place = STICKER_SLOTS[slot];
          const current = stickers[slot];
          const classes = ['net-cell'];
          if (isCenter(slot)) classes.push('center');
          if (highlighted.has(slot)) classes.push('problem');
          return (
            <button
              key={slot}
              className={classes.join(' ')}
              style={{ gridRow: row + 1, gridColumn: col + 1, background: cssColor(current) }}
              aria-label={`${FACE_NAMES[place.face]} face, row ${place.row + 1}, column ${place.col + 1}: ${
                current ? COLOR_NAMES[current] : 'blank'
              }`}
              onClick={() => change(paintSticker(stickers, slot, color))}
            />
          );
        })}
      </div>

      <div className="palette" role="radiogroup" aria-label="Paint color">
        {PALETTE.map((c) => (
          <button
            key={c}
            role="radio"
            aria-checked={c === color}
            aria-label={COLOR_NAMES[c]}
            className={`swatch${c === color ? ' selected' : ''}`}
            style={{ background: cssColor(c) }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>

      <div className="controls">
        <button onClick={() => setResult(validateStickers(stickers))}>✔ Check my cube</button>
        <button onClick={() => change(blankStickers())}>Start over</button>
        <button onClick={() => change(solvedStickers())}>Fill as solved</button>
      </div>
      <p className="hint">
        {blanks === 0
          ? 'All 54 squares are filled in.'
          : `${blanks} ${blanks === 1 ? 'square' : 'squares'} left to fill in.`}
      </p>

      {result?.ok && (
        <div className="result ok" role="status">
          <p>✓ This is a real, solvable cube.</p>
          <button onClick={() => onUseCube(result.cube)}>Use this cube in the algorithm player</button>
        </div>
      )}
      {result && !result.ok && (
        <div className="result bad" role="alert">
          <p>This cube can't be solved as entered:</p>
          <ul>
            {result.problems.map((p, i) => (
              <li key={i}>{p.message}</li>
            ))}
          </ul>
          {highlighted.size > 0 && <p className="hint">Squares to double-check are outlined in red.</p>}
        </div>
      )}

      <div className="cube-view preview" ref={previewRef} />
    </>
  );
}
```

- [ ] **Step 4: Replace `src/app/App.tsx`**

```tsx
import { useState } from 'react';
import { solved } from '../cube/geometry';
import type { Cube } from '../cube/types';
import { blankStickers, type EditorStickers } from '../input/editorState';
import { EnterCubeScreen } from './EnterCubeScreen';
import { PlayerScreen } from './PlayerScreen';

type Screen = 'player' | 'enter';

export function App() {
  const [screen, setScreen] = useState<Screen>('player');
  // Kept here (not inside each screen) so switching tabs doesn't lose anything.
  const [algorithm, setAlgorithm] = useState("R U R' U'");
  const [start, setStart] = useState<Cube>(solved);
  const [isCustomStart, setIsCustomStart] = useState(false);
  const [editorStickers, setEditorStickers] = useState<EditorStickers>(blankStickers);

  return (
    <main className="app">
      <nav className="tabs" aria-label="Screens">
        <button
          className={screen === 'player' ? 'active' : ''}
          aria-current={screen === 'player' ? 'page' : undefined}
          onClick={() => setScreen('player')}
        >
          Algorithm player
        </button>
        <button
          className={screen === 'enter' ? 'active' : ''}
          aria-current={screen === 'enter' ? 'page' : undefined}
          onClick={() => setScreen('enter')}
        >
          Enter my cube
        </button>
      </nav>

      {screen === 'player' ? (
        <PlayerScreen
          algorithm={algorithm}
          onAlgorithmChange={setAlgorithm}
          start={start}
          isCustomStart={isCustomStart}
          onUseSolvedStart={() => {
            setStart(solved());
            setIsCustomStart(false);
          }}
        />
      ) : (
        <EnterCubeScreen
          stickers={editorStickers}
          onStickersChange={setEditorStickers}
          onUseCube={(cube) => {
            setStart(cube);
            setIsCustomStart(true);
            setScreen('player');
          }}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 5: Append to `src/app/app.css`**

```css
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tabs button {
  font-size: 1rem;
  padding: 8px 14px;
  border: 1px solid #bbb;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}
.tabs button.active {
  background: #1d1d1f;
  border-color: #1d1d1f;
  color: #fff;
}
.link {
  padding: 0;
  border: none;
  background: none;
  color: #0046ad;
  text-decoration: underline;
  font: inherit;
  cursor: pointer;
}
.help {
  padding: 8px 12px;
  border-radius: 8px;
  background: #fff;
}
.help summary {
  font-weight: 600;
  cursor: pointer;
}
.net {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 3px;
  width: 100%;
  max-width: 520px;
}
.net-cell {
  aspect-ratio: 1 / 1;
  min-width: 0;
  padding: 0;
  border: 1px solid #111;
  border-radius: 4px;
  cursor: pointer;
}
.net-cell.center {
  border-width: 3px;
}
.net-cell.problem {
  outline: 3px solid #b00020;
  outline-offset: 1px;
}
.palette {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.swatch {
  width: 40px;
  height: 40px;
  border: 2px solid #111;
  border-radius: 8px;
  cursor: pointer;
}
.swatch.selected {
  outline: 3px solid #1d1d1f;
  outline-offset: 3px;
}
.result {
  padding: 8px 12px;
  border-radius: 8px;
}
.result p {
  margin: 4px 0;
}
.result.ok {
  background: #e3f4e8;
}
.result.bad {
  background: #fbe4e6;
}
.cube-view.preview {
  max-height: 40vh;
}
```

- [ ] **Step 6: Automated checks**

```powershell
npm run typecheck
npm test
npm run build
npm run format
```

Expected: typecheck clean; all tests pass (phase ① 61 + phase ② 37 = 98); build succeeds.

- [ ] **Step 7: Browser checklist**

Run `npm run dev`, open http://localhost:5173 and confirm:

1. Two tabs. **Algorithm player** still plays `R U R' U'` from solved.
2. **Enter my cube** shows the unfolded map: centers colored, the other 48 squares grey. The 3D preview matches (grey stickers, colored centers).
3. Pick red, tap a square: it turns red in both the map and the 3D preview.
4. **Check my cube** with blanks: "N squares still need a color" and the blank squares outlined in red.
5. **Fill as solved** → **Check my cube**: "✓ This is a real, solvable cube" → **Use this cube in the algorithm player**: the player caption says "Starting from the cube you entered", and **Start from solved instead** works.
6. Fill as solved, then paint the top-front edge the wrong way round (top-row-middle of Front white, bottom-row-middle of Top green) → Check: the "edge is flipped in place" message.
7. Fill as solved, then swap the right and left centers (right center orange, left center red) → Check: the "mirror image" message, centers outlined.
8. Switch tabs back and forth: the entered squares and the algorithm text are kept.
9. At phone width (~375px) the map fits with no sideways scrolling.

- [ ] **Step 8: Update the status in `CLAUDE.md`, then commit**

Replace the phase ② sentence in the Status section:
```
Phase ② (manual
sticker entry + validation, including the pieces view and center-scheme checks) is in
progress on branch `phase-2-manual-input`.
```
with:
```
Phase ② (manual
sticker entry + validation, including the pieces view and center-scheme checks) is built
on branch `phase-2-manual-input`.
```

```powershell
git add -A
git commit -m "feat: cube editor screen with validation, and player starting from an entered cube" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
