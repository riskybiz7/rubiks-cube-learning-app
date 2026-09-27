# Phase ①: Cube Model + 3D View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the project, build a fully tested cube model, and ship a page where you type an algorithm (e.g. `R U R' U'`) and watch it animate on a 3D cube with play / pause / step / speed controls.

**Architecture:** The cube state is 54 sticker colors. Every move, including slices (`M E S`), wide turns and whole-cube rotations, is a rearrangement ("permutation") of those 54 positions. The rearrangements are *computed from 3D geometry* instead of typed by hand, so they can't contain typos. The 3D view only *displays* states. After each animated turn it snaps back and recolors from the model, so the model is always the single source of truth. Playback logic (step, play, pause, reset) lives in a plain TypeScript class that is tested with a fake display, so no browser is needed for tests.

**Tech Stack:** TypeScript (strict), React, Vite, Three.js, Vitest, Prettier.

**Spec:** `docs/superpowers/specs/2026-09-27-cube-learning-app-design.md` (§2, §3.1, §3.4, §7, §10 phase ①)

## Scope notes (deliberate differences from spec §10 phase ①)

- `validate()` and `fromStickers()` (spec §3.1) move to the **phase ② plan**. Only the manual editor needs them, and they belong with its tests. In this design the `Cube` type *is* the 54 stickers, so `toStickers()` is simply `cube.stickers`.
- The "hold orientation" display (spec §3.4) is a fixed caption in phase ①, since the player always uses the reference hold. The live version comes with the solvers (phase ③a). Top-down case diagrams come in phase ③b.

## Global Constraints

- Everything runs in the browser: no backend, no network calls, no accounts.
- TypeScript `strict` mode; `npm run typecheck`, `npm test` and `npm run build` must all pass at the end of every task.
- Move notation: standard Singmaster/WCA: `U D R L F B` with `'` and `2`; wide `u d r l f b` (also written `Rw`); slices `M E S`; rotations `x y z`. **Anything else is rejected with a clear message.**
- Face order everywhere: **U R F D L B**, 9 stickers each, read row by row (layout defined in `src/cube/geometry.ts`).
- Reference hold: **white on top, green in front, red on the right** (standard color scheme, spec §8/decision 13).
- The cube model is the source of truth; the renderer never changes cube state.
- Code is written for a beginner reader: readable over clever, with short comments explaining *concepts* (not restating code).
- Windows 11 / PowerShell 5.1: no `&&` chaining. The project path contains an apostrophe, so always quote it: `"C:\Users\micha\Claude\Projects\Rubik's Cube"`.
- Run every command from the project root. Every commit message ends with the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- If `npm install` reports a peer-dependency conflict (`ERESOLVE`), **stop and report it**. Do not use `--force` or `--legacy-peer-deps`.

## Review Focus

1. **Algorithms pasted from websites or notes** (parentheses, curly apostrophes `’` / `′`, line breaks, no spaces, `Rw`-style wide moves, `R2'`) should read exactly like the clean form. Test: Task 2, "accepts algorithms pasted from websites and notes".
2. **A typo in the algorithm** (`R U Q`, `R3`, `Mw`) should give a plain-English message naming the character and its position, with Play disabled so nothing half-plays. Tests: Task 2 error tests; UI check in Task 6.
3. **Slice, wide and whole-cube moves** should animate in the same direction the model turns them, so the cube never "jumps" at the end of a move. Test: Task 4, "animates every move the same way the model turns it" (all 54 move variants).
4. **Clicking Step/Play repeatedly, or editing the algorithm, while a move is animating** should never run two animations at once, and the screen should always end on the correct state. Tests: Task 5, "ignores extra clicks…", "…algorithm changes mid-move", "…Reset is pressed mid-play".
5. **Pressing Play at the end of an algorithm** should start over from the beginning rather than do nothing. Test: Task 5, "starts over when Play is pressed at the end".

## File map

| File | Responsibility |
|---|---|
| `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html` | Project setup and scripts |
| `.prettierrc`, `.prettierignore`, `.gitattributes` | Formatting and line endings |
| `src/main.tsx` | Mounts the React app |
| `src/cube/types.ts` | `Color`, `Face`, `FACES`, `Cube` |
| `src/cube/geometry.ts` | Where each of the 54 sticker slots sits in 3D; `solved()` |
| `src/cube/notation.ts` | `Move` type; parse / format / invert algorithms |
| `src/cube/moves.ts` | Move geometry; applying moves; `isSolved()` |
| `src/render/layout.ts` | The 26 visible cubies and their stickers; how each move rotates them |
| `src/render/playback.ts` | Play / pause / step / reset logic (no Three.js) |
| `src/render/CubeView.ts` | Three.js scene: draws and animates the cube |
| `src/app/App.tsx`, `src/app/app.css` | The algorithm player page |
| `*.test.ts` next to each file | Tests |

---

### Task 1: Project setup + sticker geometry + solved cube

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.prettierrc`, `.prettierignore`, `.gitattributes`
- Create: `src/main.tsx`, `src/app/App.tsx`, `src/app/app.css`
- Create: `src/cube/types.ts`, `src/cube/geometry.ts`
- Test: `src/cube/geometry.test.ts`
- Modify: `CLAUDE.md` (the "Planned stack" section)

**Interfaces:**
- Consumes: nothing
- Produces:
  - `types.ts`: `type Color = 'W'|'Y'|'G'|'B'|'R'|'O'`; `type Face = 'U'|'R'|'F'|'D'|'L'|'B'`; `const FACES: readonly Face[]`; `interface Cube { readonly stickers: readonly Color[] }`
  - `geometry.ts`: `type Vec3 = readonly [number, number, number]`; `const FACE_FRAMES: Record<Face, {normal, right, down}>`; `interface StickerSlot { index; face; row; col; position: Vec3; normal: Vec3 }`; `const STICKER_SLOTS: readonly StickerSlot[]`; `function cleanVec(x, y, z): Vec3`; `function slotKey(position, normal): string`; `function findSlot(position: Vec3, normal: Vec3): number` (throws if none); `const HOME_COLORS: Record<Face, Color>`; `function solved(): Cube`

- [ ] **Step 1: Create a branch for phase ①**

```powershell
git checkout -b phase-1-cube-model
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "rubiks-cube-learning-app",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

- [ ] **Step 3: Install dependencies**

```powershell
npm install react react-dom three
npm install -D vite @vitejs/plugin-react typescript vitest @types/react @types/react-dom @types/three prettier
npm ls --depth=0
```

Expected: both installs finish without `ERESOLVE`; `npm ls` lists all 12 packages. (If `ERESOLVE` appears: stop and report, per Global Constraints.)

- [ ] **Step 4: Create config files**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src", "vite.config.ts"]
}
```

`vite.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rubik's Cube Learning App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`.prettierrc`:
```json
{ "singleQuote": true, "semi": true, "printWidth": 100 }
```

`.prettierignore`:
```
dist
node_modules
package-lock.json
docs
reference
*.md
```

`.gitattributes` (stores every text file with LF line endings, which stops the CRLF warnings):
```
* text=auto eol=lf
*.jpeg binary
*.jpg binary
*.png binary
```

- [ ] **Step 5: Create the placeholder page**

`src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './app/app.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Missing #root element in index.html');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/app/App.tsx`:
```tsx
export function App() {
  return (
    <main className="app">
      <h1>Rubik's Cube Learning App</h1>
      <p>Setup works. The 3D cube arrives in Task 6.</p>
    </main>
  );
}
```

`src/app/app.css`:
```css
:root {
  font-family: system-ui, sans-serif;
  color: #1d1d1f;
  background: #f6f4ef;
}
body {
  margin: 0;
}
.app {
  max-width: 720px;
  margin: 0 auto;
  padding: 16px;
}
```

- [ ] **Step 6: Create `src/cube/types.ts`**

```ts
/** The six sticker colors, by first letter: White, Yellow, Green, Blue, Red, Orange. */
export type Color = 'W' | 'Y' | 'G' | 'B' | 'R' | 'O';

/** The six face positions: Up, Right, Front, Down, Left, Back. */
export type Face = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

/** The standard face order used everywhere in this app. */
export const FACES: readonly Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];

/**
 * A cube state: 54 sticker colors. Faces come in FACES order, 9 stickers each,
 * and each face is read row by row (see FACE_FRAMES in geometry.ts for which
 * way the rows and columns run on each face).
 */
export interface Cube {
  readonly stickers: readonly Color[];
}
```

- [ ] **Step 7: Write the failing geometry test**

`src/cube/geometry.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { FACE_FRAMES, HOME_COLORS, STICKER_SLOTS, findSlot, slotKey, solved } from './geometry';
import { FACES } from './types';

describe('sticker slots', () => {
  it('has 54 slots numbered 0 to 53 in order', () => {
    expect(STICKER_SLOTS).toHaveLength(54);
    STICKER_SLOTS.forEach((slot, i) => expect(slot.index).toBe(i));
  });

  it('gives every slot a unique place on the cube', () => {
    const keys = new Set(STICKER_SLOTS.map((s) => slotKey(s.position, s.normal)));
    expect(keys.size).toBe(54);
  });

  it('puts every sticker on the outside surface, facing outward', () => {
    for (const s of STICKER_SLOTS) {
      const [px, py, pz] = s.position;
      const [nx, ny, nz] = s.normal;
      expect(px * nx + py * ny + pz * nz).toBe(1);
      expect(s.position.every((c) => c >= -1 && c <= 1)).toBe(true);
    }
  });

  it('puts each face center (sticker 4) in the middle of its face', () => {
    FACES.forEach((face, f) => {
      expect(STICKER_SLOTS[f * 9 + 4].position).toEqual(FACE_FRAMES[face].normal);
    });
  });

  it('starts numbering each face from the corner described in geometry.ts', () => {
    expect(STICKER_SLOTS[0].position).toEqual([-1, 1, -1]); // U: back-left corner
    expect(STICKER_SLOTS[9].position).toEqual([1, 1, 1]); // R: top corner next to the front
    expect(STICKER_SLOTS[18].position).toEqual([-1, 1, 1]); // F: top-left
    expect(STICKER_SLOTS[27].position).toEqual([-1, -1, 1]); // D: front-left
    expect(STICKER_SLOTS[36].position).toEqual([-1, 1, -1]); // L: top corner next to the back
    expect(STICKER_SLOTS[45].position).toEqual([1, 1, -1]); // B: top corner next to the right
  });

  it('finds a slot by position and facing direction', () => {
    expect(findSlot([1, 1, 1], [1, 0, 0])).toBe(9);
    expect(() => findSlot([0, 0, 0], [1, 0, 0])).toThrow();
  });
});

describe('solved cube', () => {
  it('uses the reference hold: white up, green front, red right', () => {
    expect(HOME_COLORS).toEqual({ U: 'W', R: 'R', F: 'G', D: 'Y', L: 'O', B: 'B' });
  });

  it('has every face a single color', () => {
    const cube = solved();
    FACES.forEach((face, f) => {
      expect(cube.stickers.slice(f * 9, f * 9 + 9)).toEqual(Array(9).fill(HOME_COLORS[face]));
    });
  });
});
```

- [ ] **Step 8: Run the test to verify it fails**

Run: `npx vitest run src/cube/geometry.test.ts`
Expected: FAIL, because `./geometry` can't be resolved (the file doesn't exist yet).

- [ ] **Step 9: Implement `src/cube/geometry.ts`**

```ts
import type { Color, Cube, Face } from './types';
import { FACES } from './types';

/** A 3D point or direction. x points right, y points up, z points toward you (the front). */
export type Vec3 = readonly [number, number, number];

/**
 * Builds a Vec3, turning -0 into 0. JavaScript has both, and test comparisons
 * treat them as different, so every computed vector goes through here.
 */
export function cleanVec(x: number, y: number, z: number): Vec3 {
  return [x + 0, y + 0, z + 0];
}

/**
 * How each face is laid out when you look straight at it:
 * - normal: the direction the face points
 * - right:  the direction columns increase (column 0 is on the left)
 * - down:   the direction rows increase (row 0 is on top)
 *
 * The "looking at it" convention is the standard unfolded-cube (net) layout:
 * U is viewed from above with B at the top; D from below with F at the top;
 * the four side faces are viewed with U at the top.
 */
export const FACE_FRAMES: Record<Face, { normal: Vec3; right: Vec3; down: Vec3 }> = {
  U: { normal: [0, 1, 0], right: [1, 0, 0], down: [0, 0, 1] },
  R: { normal: [1, 0, 0], right: [0, 0, -1], down: [0, -1, 0] },
  F: { normal: [0, 0, 1], right: [1, 0, 0], down: [0, -1, 0] },
  D: { normal: [0, -1, 0], right: [1, 0, 0], down: [0, 0, -1] },
  L: { normal: [-1, 0, 0], right: [0, 0, 1], down: [0, -1, 0] },
  B: { normal: [0, 0, -1], right: [-1, 0, 0], down: [0, -1, 0] },
};

/** One of the 54 places a sticker can be. */
export interface StickerSlot {
  index: number; // 0..53: position in Cube.stickers
  face: Face;
  row: number; // 0..2
  col: number; // 0..2
  position: Vec3; // center of the small cube ("cubie") the sticker is on
  normal: Vec3; // direction the sticker faces
}

function buildSlots(): StickerSlot[] {
  const slots: StickerSlot[] = [];
  FACES.forEach((face, f) => {
    const { normal, right, down } = FACE_FRAMES[face];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        // Start at the face center, then step sideways (col) and downward (row).
        const offsetRight = col - 1;
        const offsetDown = row - 1;
        const position = cleanVec(
          normal[0] + offsetRight * right[0] + offsetDown * down[0],
          normal[1] + offsetRight * right[1] + offsetDown * down[1],
          normal[2] + offsetRight * right[2] + offsetDown * down[2],
        );
        slots.push({ index: f * 9 + row * 3 + col, face, row, col, position, normal });
      }
    }
  });
  return slots;
}

export const STICKER_SLOTS: readonly StickerSlot[] = buildSlots();

/** A text key for a (position, normal) pair, used for fast lookups. */
export function slotKey(position: Vec3, normal: Vec3): string {
  return `${position.join(',')}|${normal.join(',')}`;
}

const SLOT_INDEX_BY_KEY = new Map(STICKER_SLOTS.map((s) => [slotKey(s.position, s.normal), s.index]));

/** Which slot is at this position facing this direction? Throws if there is none. */
export function findSlot(position: Vec3, normal: Vec3): number {
  const index = SLOT_INDEX_BY_KEY.get(slotKey(position, normal));
  if (index === undefined) {
    throw new Error(`No sticker slot at position ${position.join(',')} facing ${normal.join(',')}`);
  }
  return index;
}

/** Face colors of a solved cube in the reference hold: white up, green front, red right. */
export const HOME_COLORS: Record<Face, Color> = { U: 'W', R: 'R', F: 'G', D: 'Y', L: 'O', B: 'B' };

/** A solved cube in the reference hold. */
export function solved(): Cube {
  return { stickers: STICKER_SLOTS.map((s) => HOME_COLORS[s.face]) };
}
```

- [ ] **Step 10: Run the test to verify it passes**

Run: `npx vitest run src/cube/geometry.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 11: Check the whole toolchain**

```powershell
npm run typecheck
npm test
npm run build
npm run format
```

Expected: all succeed. Then run `npm run dev`, open http://localhost:5173 and confirm the page shows "Setup works." Stop the server with Ctrl+C.

- [ ] **Step 12: Update `CLAUDE.md`**

Replace this block:
```
## Planned stack (approved, not yet installed)

- **TypeScript + React**, built with **Vite**
- **Three.js** for the 3D cube
- **OpenCV.js** for camera scanning (phase 4)
- **Vitest** for tests
```
with:
```
## Stack

TypeScript + React (built with Vite), Three.js for 3D, Vitest for tests, Prettier
for formatting. OpenCV.js (camera, phase 4) is not installed yet.

## Commands (run from the project root)

| Command | What it does |
|---|---|
| `npm run dev` | Start the app at http://localhost:5173 |
| `npm test` | Run all tests once |
| `npm run test:watch` | Re-run tests on every save |
| `npm run typecheck` | Check types without building |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run format` | Auto-format code with Prettier |
```

- [ ] **Step 13: Commit**

```powershell
git add --renormalize .
git add -A
git commit -m "feat: project setup and cube sticker geometry" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Move notation: parse, format, invert

**Files:**
- Create: `src/cube/notation.ts`
- Test: `src/cube/notation.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `type MoveBase = 'U'|'R'|'F'|'D'|'L'|'B'|'u'|'r'|'f'|'d'|'l'|'b'|'M'|'E'|'S'|'x'|'y'|'z'`
  - `const MOVE_BASES: readonly MoveBase[]` (in exactly that order)
  - `type Turns = 1 | 2 | 3` (1 = clockwise quarter, 2 = half, 3 = counter-clockwise quarter)
  - `interface Move { readonly base: MoveBase; readonly turns: Turns }`
  - `type ParseResult = { ok: true; moves: Move[] } | { ok: false; message: string; index: number }`
  - `parseAlgorithm(text: string): ParseResult`; `mustParse(text: string): Move[]` (throws `Error(message)`)
  - `formatMove(move: Move): string`; `formatAlgorithm(moves: readonly Move[]): string`
  - `invertMove(move: Move): Move`; `invertMoves(moves: readonly Move[]): Move[]`

- [ ] **Step 1: Write the failing test**

`src/cube/notation.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  MOVE_BASES,
  formatAlgorithm,
  formatMove,
  invertMove,
  invertMoves,
  mustParse,
  parseAlgorithm,
} from './notation';

describe('parseAlgorithm', () => {
  it('reads a simple algorithm', () => {
    expect(mustParse("R U R' U'")).toEqual([
      { base: 'R', turns: 1 },
      { base: 'U', turns: 1 },
      { base: 'R', turns: 3 },
      { base: 'U', turns: 3 },
    ]);
  });

  it("reads half turns, including the 2' spelling", () => {
    expect(mustParse("R2 U2'")).toEqual([
      { base: 'R', turns: 2 },
      { base: 'U', turns: 2 },
    ]);
  });

  it('knows every move letter', () => {
    expect(mustParse(MOVE_BASES.join(' ')).map((m) => m.base)).toEqual([...MOVE_BASES]);
  });

  it('treats Rw-style wide moves as the lowercase letter', () => {
    expect(mustParse("Rw Uw' Fw2")).toEqual([
      { base: 'r', turns: 1 },
      { base: 'u', turns: 3 },
      { base: 'f', turns: 2 },
    ]);
  });

  it('accepts algorithms pasted from websites and notes', () => {
    expect(formatAlgorithm(mustParse('(R U R’ U′)\n(F2  x)'))).toBe("R U R' U' F2 x");
    expect(formatAlgorithm(mustParse("RUR'U'"))).toBe("R U R' U'");
  });

  it('treats empty text as zero moves', () => {
    expect(mustParse('')).toEqual([]);
    expect(mustParse('   \n ')).toEqual([]);
  });

  it('explains an unknown character and where it is', () => {
    const result = parseAlgorithm('R U Q');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.index).toBe(4);
      expect(result.message).toContain('"Q"');
      expect(result.message).toContain('position 5');
    }
  });

  it('rejects a number other than 2', () => {
    expect(parseAlgorithm('R3')).toMatchObject({ ok: false, index: 1 });
  });

  it('rejects a wide marker on a letter that cannot be wide', () => {
    const result = parseAlgorithm('Mw');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('Only U R F D L B can be wide');
  });

  it('mustParse throws with the same message', () => {
    expect(() => mustParse('R U Q')).toThrow('position 5');
  });
});

describe('formatting', () => {
  it('writes moves back in standard notation', () => {
    expect(formatAlgorithm(mustParse("R U2 R' r' M2 x'"))).toBe("R U2 R' r' M2 x'");
    expect(formatMove({ base: 'S', turns: 3 })).toBe("S'");
  });

  it('writes Rw-style moves in lowercase form', () => {
    expect(formatAlgorithm(mustParse("Rw Uw'"))).toBe("r u'");
  });
});

describe('inverting', () => {
  it('reverses a single move', () => {
    expect(invertMove({ base: 'R', turns: 1 })).toEqual({ base: 'R', turns: 3 });
    expect(invertMove({ base: 'R', turns: 3 })).toEqual({ base: 'R', turns: 1 });
    expect(invertMove({ base: 'R', turns: 2 })).toEqual({ base: 'R', turns: 2 });
  });

  it('reverses an algorithm: last move first, each one undone', () => {
    expect(formatAlgorithm(invertMoves(mustParse("R U2 F'")))).toBe("F U2 R'");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/cube/notation.test.ts`
Expected: FAIL, because `./notation` can't be resolved.

- [ ] **Step 3: Implement `src/cube/notation.ts`**

```ts
/**
 * Every move letter the app understands (standard Singmaster/WCA notation):
 * - U R F D L B: turn one outer face
 * - u r f d l b: "wide" turns (the face plus the middle layer next to it; also written Rw)
 * - M E S:       turn a middle slice (M follows L, E follows D, S follows F)
 * - x y z:       turn the whole cube in your hands (x follows R, y follows U, z follows F)
 */
export type MoveBase =
  | 'U' | 'R' | 'F' | 'D' | 'L' | 'B'
  | 'u' | 'r' | 'f' | 'd' | 'l' | 'b'
  | 'M' | 'E' | 'S'
  | 'x' | 'y' | 'z';

export const MOVE_BASES: readonly MoveBase[] = [
  'U', 'R', 'F', 'D', 'L', 'B',
  'u', 'r', 'f', 'd', 'l', 'b',
  'M', 'E', 'S',
  'x', 'y', 'z',
];

/** How far to turn: 1 = quarter clockwise, 2 = half turn, 3 = quarter counter-clockwise (written '). */
export type Turns = 1 | 2 | 3;

export interface Move {
  readonly base: MoveBase;
  readonly turns: Turns;
}

export type ParseResult =
  | { ok: true; moves: Move[] }
  | { ok: false; message: string; index: number };

const WIDE_CAPABLE = 'URFDLB';

/**
 * One move: a letter, an optional "w" (wide), then an optional suffix.
 * Suffixes: ' (also the curly ’ and prime ′ that websites use), 2, or 2'.
 * The "y" flag makes the pattern match exactly at lastIndex.
 */
const MOVE_PATTERN = /([URFDLBurfdlbMESxyz])(w?)(2'|2|'|’|′)?/y;

/** Turn algorithm text into moves, or explain what's wrong and where. */
export function parseAlgorithm(text: string): ParseResult {
  const moves: Move[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    // Spaces, line breaks and grouping parentheses carry no meaning, so skip them.
    if (/\s/.test(ch) || ch === '(' || ch === ')') {
      i++;
      continue;
    }
    MOVE_PATTERN.lastIndex = i;
    const match = MOVE_PATTERN.exec(text);
    if (!match) {
      return {
        ok: false,
        index: i,
        message:
          `Unexpected "${ch}" at position ${i + 1}. Moves use the letters U R F D L B, ` +
          `u r f d l b, M E S and x y z, optionally followed by ' or 2.`,
      };
    }
    const [token, letter, wide, suffix = ''] = match;
    if (wide && !WIDE_CAPABLE.includes(letter)) {
      return {
        ok: false,
        index: i,
        message: `"${letter}w" at position ${i + 1} isn't a move. Only U R F D L B can be wide (for example Rw).`,
      };
    }
    const base = (wide ? letter.toLowerCase() : letter) as MoveBase;
    const turns: Turns = suffix.startsWith('2') ? 2 : suffix === '' ? 1 : 3;
    moves.push({ base, turns });
    i += token.length;
  }
  return { ok: true, moves };
}

/** Like parseAlgorithm, but throws on bad input. For trusted text such as tests and built-in content. */
export function mustParse(text: string): Move[] {
  const result = parseAlgorithm(text);
  if (!result.ok) throw new Error(result.message);
  return result.moves;
}

const SUFFIX: Record<Turns, string> = { 1: '', 2: '2', 3: "'" };

export function formatMove(move: Move): string {
  return move.base + SUFFIX[move.turns];
}

export function formatAlgorithm(moves: readonly Move[]): string {
  return moves.map(formatMove).join(' ');
}

/** The move that undoes this one: a quarter turn the other way; a half turn undoes itself. */
export function invertMove(move: Move): Move {
  return { base: move.base, turns: (4 - move.turns) as Turns };
}

/** Undo a whole algorithm: undo the last move first. */
export function invertMoves(moves: readonly Move[]): Move[] {
  return [...moves].reverse().map(invertMove);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/cube/notation.test.ts`
Expected: PASS (14 tests).

- [ ] **Step 5: Check and commit**

```powershell
npm run typecheck
npm run format
git add -A
git commit -m "feat: parse, format and invert move notation" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Applying moves to the cube

**Files:**
- Create: `src/cube/moves.ts`
- Test: `src/cube/moves.test.ts`

**Interfaces:**
- Consumes: `STICKER_SLOTS`, `findSlot`, `cleanVec`, `Vec3`, `solved` (Task 1); `Move`, `MoveBase`, `Turns`, `MOVE_BASES`, `mustParse`, `invertMoves` (Task 2)
- Produces:
  - `type Axis = 'x' | 'y' | 'z'`; `const AXIS_INDEX: Record<Axis, 0 | 1 | 2>`
  - `interface MoveSpec { axis: Axis; layers: readonly number[]; direction: 1 | -1 }`
  - `const MOVE_SPECS: Record<MoveBase, MoveSpec>` (the geometry of one clockwise quarter turn)
  - `rotateQuarter(v: Vec3, axis: Axis, direction: 1 | -1): Vec3`
  - `movePermutation(move: Move): readonly number[]` (gather form: `after[j] = before[p[j]]`)
  - `applyMove(cube: Cube, move: Move): Cube`; `applyMoves(cube: Cube, moves: readonly Move[]): Cube`
  - `isSolved(cube: Cube): boolean` (every face one color; any orientation counts)

- [ ] **Step 1: Write the failing test**

`src/cube/moves.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { solved } from './geometry';
import { applyMove, applyMoves, isSolved, movePermutation } from './moves';
import { MOVE_BASES, invertMoves, mustParse, type Turns } from './notation';
import { FACES, type Cube, type Face } from './types';

const apply = (cube: Cube, algorithm: string): Cube => applyMoves(cube, mustParse(algorithm));

/** One face's 9 stickers as a string, row by row, e.g. 'WWGWWGWWG'. */
function faceString(cube: Cube, face: Face): string {
  const f = FACES.indexOf(face);
  return cube.stickers.slice(f * 9, f * 9 + 9).join('');
}

const ALL_TURNS: Turns[] = [1, 2, 3];
const SCRAMBLED = apply(solved(), "R U2 F' L D B2 M E' S r' u f2 x y' z2 l d' b");

describe('every move', () => {
  it('rearranges the 54 stickers without losing or copying any', () => {
    for (const base of MOVE_BASES) {
      for (const turns of ALL_TURNS) {
        const sorted = [...movePermutation({ base, turns })].sort((a, b) => a - b);
        expect(sorted, `${base} turns=${turns}`).toEqual([...Array(54).keys()]);
      }
    }
  });

  it('returns to the start after four quarter turns', () => {
    for (const base of MOVE_BASES) {
      let cube = SCRAMBLED;
      for (let i = 0; i < 4; i++) cube = applyMove(cube, { base, turns: 1 });
      expect(cube, base).toEqual(SCRAMBLED);
    }
  });

  it('is undone by its inverse', () => {
    const algorithm = mustParse("R U2 F' L D B2 M E' S r' u f2 x y' z2 l d' b");
    expect(applyMoves(SCRAMBLED, [...algorithm, ...invertMoves(algorithm)])).toEqual(SCRAMBLED);
  });
});

describe('known effects on a solved cube (white up, green front, red right)', () => {
  it('R lifts the front column onto the top, top to back, back to bottom, bottom to front', () => {
    const cube = apply(solved(), 'R');
    expect(faceString(cube, 'U')).toBe('WWGWWGWWG');
    expect(faceString(cube, 'F')).toBe('GGYGGYGGY');
    expect(faceString(cube, 'D')).toBe('YYBYYBYYB');
    expect(faceString(cube, 'B')).toBe('WBBWBBWBB');
  });

  it("U brings the right face's top row to the front, and front to left", () => {
    const cube = apply(solved(), 'U');
    expect(faceString(cube, 'F')).toBe('RRRGGGGGG');
    expect(faceString(cube, 'L')).toBe('GGGOOOOOO');
  });

  it('F moves the top onto the right, and the left onto the top', () => {
    const cube = apply(solved(), 'F');
    expect(faceString(cube, 'R')).toBe('WRRWRRWRR');
    expect(faceString(cube, 'U')).toBe('WWWWWWOOO');
  });

  it('slices: M follows L, E follows D, S follows F', () => {
    expect(faceString(apply(solved(), 'M'), 'F')).toBe('GWGGWGGWG');
    expect(faceString(apply(solved(), 'E'), 'F')).toBe('GGGOOOGGG');
    expect(faceString(apply(solved(), 'S'), 'R')).toBe('RWRRWRRWR');
  });

  it('rotations: x follows R, y follows U, z follows F', () => {
    expect(faceString(apply(solved(), 'x'), 'U')).toBe('GGGGGGGGG');
    expect(faceString(apply(solved(), 'y'), 'F')).toBe('RRRRRRRRR');
    expect(faceString(apply(solved(), 'z'), 'R')).toBe('WWWWWWWWW');
  });
});

describe('wide moves and rotations equal their parts', () => {
  const equivalents: [string, string][] = [
    ['r', "R M'"],
    ['l', 'L M'],
    ['u', "U E'"],
    ['d', 'D E'],
    ['f', 'F S'],
    ['b', "B S'"],
    ['x', "R M' L'"],
    ['y', "U E' D'"],
    ['z', "F S B'"],
  ];
  for (const [single, parts] of equivalents) {
    it(`${single} = ${parts}`, () => {
      expect(apply(SCRAMBLED, single)).toEqual(apply(SCRAMBLED, parts));
    });
  }
});

describe('well-known cube facts', () => {
  it("(R U R' U') six times returns to solved", () => {
    expect(apply(solved(), "R U R' U' ".repeat(6))).toEqual(solved());
  });

  it('repeating R U takes exactly 105 times to return to solved', () => {
    const start = solved();
    let cube = apply(start, 'R U');
    let count = 1;
    while (cube.stickers.join('') !== start.stickers.join('') && count < 1000) {
      cube = apply(cube, 'R U');
      count++;
    }
    expect(count).toBe(105);
  });

  it('isSolved accepts any orientation but not a turned face', () => {
    expect(isSolved(solved())).toBe(true);
    expect(isSolved(apply(solved(), 'x y'))).toBe(true);
    expect(isSolved(apply(solved(), 'R'))).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/cube/moves.test.ts`
Expected: FAIL, because `./moves` can't be resolved.

- [ ] **Step 3: Implement `src/cube/moves.ts`**

```ts
import { STICKER_SLOTS, cleanVec, findSlot, type Vec3 } from './geometry';
import { MOVE_BASES, type Move, type MoveBase, type Turns } from './notation';
import type { Cube } from './types';

export type Axis = 'x' | 'y' | 'z';
export const AXIS_INDEX: Record<Axis, 0 | 1 | 2> = { x: 0, y: 1, z: 2 };

/**
 * The geometry of ONE clockwise quarter turn of a move:
 * - axis:      the line it spins around
 * - layers:    which slices move, by coordinate along that axis (-1, 0 or 1)
 * - direction: +1 = counter-clockwise seen from the + end of the axis, -1 = clockwise
 *
 * "Clockwise" in cube notation means clockwise while looking AT that face, so
 * R (the +x face) is clockwise from +x, which is direction -1. L (the -x face)
 * is clockwise from -x, which is the same as counter-clockwise from +x: +1.
 */
export interface MoveSpec {
  axis: Axis;
  layers: readonly number[];
  direction: 1 | -1;
}

export const MOVE_SPECS: Record<MoveBase, MoveSpec> = {
  R: { axis: 'x', layers: [1], direction: -1 },
  L: { axis: 'x', layers: [-1], direction: 1 },
  U: { axis: 'y', layers: [1], direction: -1 },
  D: { axis: 'y', layers: [-1], direction: 1 },
  F: { axis: 'z', layers: [1], direction: -1 },
  B: { axis: 'z', layers: [-1], direction: 1 },
  r: { axis: 'x', layers: [0, 1], direction: -1 },
  l: { axis: 'x', layers: [-1, 0], direction: 1 },
  u: { axis: 'y', layers: [0, 1], direction: -1 },
  d: { axis: 'y', layers: [-1, 0], direction: 1 },
  f: { axis: 'z', layers: [0, 1], direction: -1 },
  b: { axis: 'z', layers: [-1, 0], direction: 1 },
  M: { axis: 'x', layers: [0], direction: 1 }, // follows L
  E: { axis: 'y', layers: [0], direction: 1 }, // follows D
  S: { axis: 'z', layers: [0], direction: -1 }, // follows F
  x: { axis: 'x', layers: [-1, 0, 1], direction: -1 }, // follows R
  y: { axis: 'y', layers: [-1, 0, 1], direction: -1 }, // follows U
  z: { axis: 'z', layers: [-1, 0, 1], direction: -1 }, // follows F
};

/**
 * Rotate a point or direction a quarter turn around an axis.
 * A +90° turn maps (x, y, z) to: around x → (x, -z, y); around y → (z, y, -x);
 * around z → (-y, x, z). Multiplying by the direction (±1) gives -90° for free.
 */
export function rotateQuarter(v: Vec3, axis: Axis, direction: 1 | -1): Vec3 {
  const [x, y, z] = v;
  const s = direction;
  switch (axis) {
    case 'x':
      return cleanVec(x, -s * z, s * y);
    case 'y':
      return cleanVec(s * z, y, -s * x);
    case 'z':
      return cleanVec(-s * y, s * x, z);
  }
}

/**
 * A permutation in "gather" form: after the move, slot j holds the sticker that
 * was in slot p[j]. (Like an INDEX lookup: new_value(j) = INDEX(old_values, p[j]).)
 */
type Permutation = readonly number[];

/** Work out one clockwise quarter turn by physically rotating every sticker in the moving layers. */
function quarterTurn(base: MoveBase): Permutation {
  const { axis, layers, direction } = MOVE_SPECS[base];
  const a = AXIS_INDEX[axis];
  const gather = STICKER_SLOTS.map((s) => s.index); // stickers outside the layers stay put
  for (const slot of STICKER_SLOTS) {
    if (!layers.includes(slot.position[a])) continue;
    const destination = findSlot(
      rotateQuarter(slot.position, axis, direction),
      rotateQuarter(slot.normal, axis, direction),
    );
    gather[destination] = slot.index;
  }
  return gather;
}

/** Doing `first` and then `second` as a single permutation. */
function compose(first: Permutation, second: Permutation): Permutation {
  return second.map((source) => first[source]);
}

/** Every move's permutation for 1, 2 and 3 quarter turns, computed once at startup. */
const PERMUTATIONS = Object.fromEntries(
  MOVE_BASES.map((base) => {
    const quarter = quarterTurn(base);
    const half = compose(quarter, quarter);
    const threeQuarters = compose(half, quarter);
    return [base, { 1: quarter, 2: half, 3: threeQuarters }];
  }),
) as Record<MoveBase, Record<Turns, Permutation>>;

export function movePermutation(move: Move): Permutation {
  return PERMUTATIONS[move.base][move.turns];
}

/** The cube after one move. Never changes the cube passed in. */
export function applyMove(cube: Cube, move: Move): Cube {
  return { stickers: movePermutation(move).map((source) => cube.stickers[source]) };
}

/** The cube after a list of moves, applied in order. */
export function applyMoves(cube: Cube, moves: readonly Move[]): Cube {
  return moves.reduce((current, move) => applyMove(current, move), cube);
}

/** True when every face is a single color (the cube may be held in any orientation). */
export function isSolved(cube: Cube): boolean {
  for (let f = 0; f < 6; f++) {
    const center = cube.stickers[f * 9 + 4];
    for (let i = 0; i < 9; i++) {
      if (cube.stickers[f * 9 + i] !== center) return false;
    }
  }
  return true;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/cube/moves.test.ts`
Expected: PASS (20 tests).

- [ ] **Step 5: Check and commit**

```powershell
npm run typecheck
npm test
npm run format
git add -A
git commit -m "feat: apply moves to the cube, computed from 3D geometry" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 3D layout, and proof that animations turn the right way

**Files:**
- Create: `src/render/layout.ts`
- Test: `src/render/layout.test.ts`

**Interfaces:**
- Consumes: `STICKER_SLOTS`, `findSlot`, `cleanVec`, `Vec3` (Task 1); `Move`, `Turns`, `MOVE_BASES`, `formatMove` (Task 2); `MOVE_SPECS`, `AXIS_INDEX`, `Axis`, `movePermutation` (Task 3)
- Produces:
  - `interface CubieLayout { position: Vec3; stickers: { slot: number; normal: Vec3 }[] }`
  - `const CUBIES: readonly CubieLayout[]` (the 26 visible cubies; the hidden core is skipped)
  - `interface MoveRotation { axis: Vec3; angle: number; cubieIndices: number[] }` (angle in radians, right-hand rule)
  - `moveRotation(move: Move): MoveRotation` (a counter-clockwise quarter turn animates as -90° the short way, not +270°)

- [ ] **Step 1: Write the failing test**

`src/render/layout.test.ts`:
```ts
import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { cleanVec, findSlot, type Vec3 } from '../cube/geometry';
import { movePermutation } from '../cube/moves';
import { MOVE_BASES, formatMove, type Turns } from '../cube/notation';
import { CUBIES, moveRotation } from './layout';

describe('cubie layout', () => {
  it('has 26 visible cubies: 6 centers, 12 edges, 8 corners', () => {
    expect(CUBIES).toHaveLength(26);
    const bySize = [1, 2, 3].map((n) => CUBIES.filter((c) => c.stickers.length === n).length);
    expect(bySize).toEqual([6, 12, 8]);
  });

  it('places each of the 54 stickers on exactly one cubie', () => {
    const slots = CUBIES.flatMap((c) => c.stickers.map((s) => s.slot)).sort((a, b) => a - b);
    expect(slots).toEqual([...Array(54).keys()]);
  });
});

describe('moveRotation', () => {
  it('turns the right layer for R, a quarter turn clockwise seen from the right', () => {
    const r = moveRotation({ base: 'R', turns: 1 });
    expect(r.axis).toEqual([1, 0, 0]);
    expect(r.angle).toBeCloseTo(-Math.PI / 2);
    expect(r.cubieIndices).toHaveLength(9);
    expect(r.cubieIndices.every((i) => CUBIES[i].position[0] === 1)).toBe(true);
  });

  it("animates R' the short way (+90°) and R2 as a half turn", () => {
    expect(moveRotation({ base: 'R', turns: 3 }).angle).toBeCloseTo(Math.PI / 2);
    expect(moveRotation({ base: 'R', turns: 2 }).angle).toBeCloseTo(-Math.PI);
  });

  it('moves the right number of cubies for slices, wide turns and rotations', () => {
    expect(moveRotation({ base: 'M', turns: 1 }).cubieIndices).toHaveLength(8); // middle slice minus hidden core
    expect(moveRotation({ base: 'r', turns: 1 }).cubieIndices).toHaveLength(17);
    expect(moveRotation({ base: 'x', turns: 1 }).cubieIndices).toHaveLength(26);
  });

  it('animates every move the same way the model turns it', () => {
    const round = (v: Vector3): Vec3 => cleanVec(Math.round(v.x), Math.round(v.y), Math.round(v.z));
    for (const base of MOVE_BASES) {
      for (const turns of [1, 2, 3] as Turns[]) {
        const move = { base, turns };
        const gather = movePermutation(move);
        const { axis, angle, cubieIndices } = moveRotation(move);
        const axisVector = new Vector3(...axis);
        const moving = new Set(cubieIndices);
        CUBIES.forEach((cubie, i) => {
          for (const { slot, normal } of cubie.stickers) {
            let destination = slot;
            if (moving.has(i)) {
              const p = new Vector3(...cubie.position).applyAxisAngle(axisVector, angle);
              const n = new Vector3(...normal).applyAxisAngle(axisVector, angle);
              destination = findSlot(round(p), round(n));
            }
            // The model must put this sticker exactly where the animation carries it.
            expect(gather[destination], `${formatMove(move)}, sticker ${slot}`).toBe(slot);
          }
        });
      }
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/render/layout.test.ts`
Expected: FAIL, because `./layout` can't be resolved.

- [ ] **Step 3: Implement `src/render/layout.ts`**

```ts
import { STICKER_SLOTS, type Vec3 } from '../cube/geometry';
import { AXIS_INDEX, MOVE_SPECS, type Axis } from '../cube/moves';
import type { Move, Turns } from '../cube/notation';

/** One of the 26 small cubes you can see, and the stickers on it. */
export interface CubieLayout {
  position: Vec3; // each coordinate is -1, 0 or 1
  stickers: { slot: number; normal: Vec3 }[];
}

function buildCubies(): CubieLayout[] {
  const cubies: CubieLayout[] = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue; // the hidden core has no stickers
        const stickers = STICKER_SLOTS.filter(
          (s) => s.position[0] === x && s.position[1] === y && s.position[2] === z,
        ).map((s) => ({ slot: s.index, normal: s.normal }));
        cubies.push({ position: [x, y, z], stickers });
      }
    }
  }
  return cubies;
}

export const CUBIES: readonly CubieLayout[] = buildCubies();

const AXIS_VECTORS: Record<Axis, Vec3> = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };

/** Quarter turns to animate: a counter-clockwise move (3) is shown as one quarter back, not three forward. */
const ANIMATED_QUARTERS: Record<Turns, number> = { 1: 1, 2: 2, 3: -1 };

/** How to animate a move: spin these cubies by `angle` radians around `axis` (right-hand rule). */
export interface MoveRotation {
  axis: Vec3;
  angle: number;
  cubieIndices: number[];
}

export function moveRotation(move: Move): MoveRotation {
  const spec = MOVE_SPECS[move.base];
  const a = AXIS_INDEX[spec.axis];
  return {
    axis: AXIS_VECTORS[spec.axis],
    angle: spec.direction * ANIMATED_QUARTERS[move.turns] * (Math.PI / 2),
    cubieIndices: CUBIES.flatMap((cubie, i) => (spec.layers.includes(cubie.position[a]) ? [i] : [])),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/render/layout.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Check and commit**

```powershell
npm run typecheck
npm test
npm run format
git add -A
git commit -m "feat: 3D cubie layout with animation direction proven against the model" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Playback controller (play / pause / step / reset)

**Files:**
- Create: `src/render/playback.ts`
- Test: `src/render/playback.test.ts`

**Interfaces:**
- Consumes: `solved` (Task 1); `Move`, `invertMove`, `mustParse` (Task 2); `applyMove`, `applyMoves` (Task 3)
- Produces:
  - `interface CubeDisplay { show(cube: Cube): void; animate(move: Move, next: Cube, durationMs: number): Promise<void> }`. Contract: `animate` must end showing `next`, and calling `show` during an animation may cancel it (its promise still resolves).
  - `class Playback`: `constructor(display: CubeDisplay, start?: Cube)`; `load(moves: readonly Move[], start?: Cube): void`; `reset(): void`; `stepForward(): Promise<void>`; `stepBack(): Promise<void>`; `play(): Promise<void>`; `pause(): void`; getters `position`, `length`, `isPlaying`, `isBusy`, `currentCube`; fields `msPerMove: number` (default 400), `onChange: () => void`

- [ ] **Step 1: Write the failing test**

`src/render/playback.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { mustParse, type Move } from '../cube/notation';
import type { Cube } from '../cube/types';
import { Playback, type CubeDisplay } from './playback';

/** Stands in for the 3D view. Records what was shown; animations finish on command. */
class FakeDisplay implements CubeDisplay {
  shown: Cube[] = [];
  animations: { move: Move; next: Cube; durationMs: number; finish: () => void }[] = [];
  autoFinish = true;

  show(cube: Cube): void {
    this.shown.push(cube);
  }

  animate(move: Move, next: Cube, durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      const finish = () => {
        this.shown.push(next); // like the real view: an animation ends by drawing `next`
        resolve();
      };
      this.animations.push({ move, next, durationMs, finish });
      if (this.autoFinish) finish();
    });
  }

  get current(): Cube {
    return this.shown[this.shown.length - 1];
  }
}

const ALG = mustParse("R U R' U'");

function setup(autoFinish = true) {
  const display = new FakeDisplay();
  display.autoFinish = autoFinish;
  const playback = new Playback(display);
  playback.load(ALG);
  return { display, playback };
}

describe('Playback', () => {
  it('shows the starting cube after loading', () => {
    const { display, playback } = setup();
    expect(playback.position).toBe(0);
    expect(playback.length).toBe(4);
    expect(display.current).toEqual(solved());
  });

  it('steps forward one move at a time', async () => {
    const { display, playback } = setup();
    await playback.stepForward();
    expect(playback.position).toBe(1);
    expect(display.animations[0].move).toEqual({ base: 'R', turns: 1 });
    expect(display.current).toEqual(applyMoves(solved(), ALG.slice(0, 1)));
  });

  it('steps back by animating the reverse move', async () => {
    const { display, playback } = setup();
    await playback.stepForward();
    await playback.stepBack();
    expect(playback.position).toBe(0);
    expect(display.animations[1].move).toEqual({ base: 'R', turns: 3 });
    expect(display.current).toEqual(solved());
  });

  it('does nothing when stepping past either end', async () => {
    const { display, playback } = setup();
    await playback.stepBack();
    expect(display.animations).toHaveLength(0);
    for (let i = 0; i < 5; i++) await playback.stepForward();
    expect(display.animations).toHaveLength(4);
    expect(playback.position).toBe(4);
  });

  it('plays the whole algorithm', async () => {
    const { display, playback } = setup();
    await playback.play();
    expect(playback.position).toBe(4);
    expect(playback.isPlaying).toBe(false);
    expect(display.animations).toHaveLength(4);
    expect(display.current).toEqual(applyMoves(solved(), ALG));
  });

  it('starts over when Play is pressed at the end', async () => {
    const { display, playback } = setup();
    await playback.play();
    await playback.play();
    expect(display.animations).toHaveLength(8);
    expect(playback.position).toBe(4);
  });

  it('pauses after the move that is currently animating', async () => {
    const { display, playback } = setup(false);
    const playing = playback.play();
    expect(playback.isPlaying).toBe(true);
    playback.pause();
    display.animations[0].finish();
    await playing;
    expect(playback.position).toBe(1);
    expect(playback.isPlaying).toBe(false);
    expect(display.animations).toHaveLength(1);
  });

  it('ignores extra clicks while a move is animating', async () => {
    const { display, playback } = setup(false);
    const first = playback.stepForward();
    void playback.stepForward();
    void playback.stepBack();
    void playback.play();
    expect(display.animations).toHaveLength(1);
    display.animations[0].finish();
    await first;
    expect(playback.position).toBe(1);
  });

  it("ends on the new algorithm's start if the algorithm changes mid-move", async () => {
    const { display, playback } = setup(false);
    const step = playback.stepForward();
    playback.load(mustParse('F2'));
    display.animations[0].finish(); // the old move finishes and draws a stale cube
    await step;
    expect(playback.position).toBe(0);
    expect(playback.length).toBe(1);
    expect(display.current).toEqual(solved());
  });

  it('ends on the start if Reset is pressed mid-play', async () => {
    const { display, playback } = setup(false);
    const playing = playback.play();
    playback.reset();
    display.animations[0].finish();
    await playing;
    expect(playback.position).toBe(0);
    expect(playback.isPlaying).toBe(false);
    expect(display.animations).toHaveLength(1);
    expect(display.current).toEqual(solved());
  });

  it('uses the current speed for each move', async () => {
    const { display, playback } = setup();
    playback.msPerMove = 150;
    await playback.stepForward();
    expect(display.animations[0].durationMs).toBe(150);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/render/playback.test.ts`
Expected: FAIL, because `./playback` can't be resolved.

- [ ] **Step 3: Implement `src/render/playback.ts`**

```ts
import { solved } from '../cube/geometry';
import { applyMove } from '../cube/moves';
import { invertMove, type Move } from '../cube/notation';
import type { Cube } from '../cube/types';

/** Anything that can draw the cube: the real 3D view, or a fake one in tests. */
export interface CubeDisplay {
  /** Jump straight to a state, with no animation (cancels any animation in progress). */
  show(cube: Cube): void;
  /** Animate one move from what's on screen now; must finish by showing `next`. */
  animate(move: Move, next: Cube, durationMs: number): Promise<void>;
}

/**
 * Steps through an algorithm on a CubeDisplay.
 *
 * Every state is worked out in advance (states[i] = the cube after i moves), like
 * a column of running totals, so stepping forward or back never has to recompute.
 * Only one animation runs at a time; clicks that arrive mid-animation are ignored.
 */
export class Playback {
  msPerMove = 400;
  onChange: () => void = () => {};

  private moves: readonly Move[] = [];
  private states: Cube[];
  private pos = 0;
  private busy = false;
  private playing = false;
  /** Goes up whenever load() or reset() happens, so an animation that finishes late knows it's stale. */
  private generation = 0;

  constructor(
    private readonly display: CubeDisplay,
    start: Cube = solved(),
  ) {
    this.states = [start];
    display.show(start);
  }

  get position(): number {
    return this.pos;
  }
  get length(): number {
    return this.moves.length;
  }
  get isPlaying(): boolean {
    return this.playing;
  }
  get isBusy(): boolean {
    return this.busy;
  }
  get currentCube(): Cube {
    return this.states[this.pos];
  }

  /** Switch to a new algorithm and show its starting cube. */
  load(moves: readonly Move[], start: Cube = this.states[0]): void {
    this.generation++;
    this.playing = false;
    this.moves = moves;
    this.states = [start];
    for (const move of moves) {
      this.states.push(applyMove(this.states[this.states.length - 1], move));
    }
    this.pos = 0;
    this.display.show(start);
    this.onChange();
  }

  /** Back to the starting cube. */
  reset(): void {
    this.generation++;
    this.playing = false;
    this.pos = 0;
    this.display.show(this.states[0]);
    this.onChange();
  }

  async stepForward(): Promise<void> {
    if (this.busy || this.pos >= this.moves.length) return;
    await this.animateTo(this.pos + 1, this.moves[this.pos]);
  }

  async stepBack(): Promise<void> {
    if (this.busy || this.pos === 0) return;
    await this.animateTo(this.pos - 1, invertMove(this.moves[this.pos - 1]));
  }

  /** Play from the current position to the end. At the end already? Start over. */
  async play(): Promise<void> {
    if (this.playing || this.busy) return;
    if (this.pos >= this.moves.length) this.reset();
    this.playing = true;
    this.onChange();
    const generation = this.generation;
    while (this.playing && generation === this.generation && this.pos < this.moves.length) {
      await this.stepForward();
    }
    if (generation === this.generation) {
      this.playing = false;
      this.onChange();
    }
  }

  /** Stop after the move that's currently animating. */
  pause(): void {
    this.playing = false;
    this.onChange();
  }

  private async animateTo(target: number, move: Move): Promise<void> {
    const generation = this.generation;
    this.busy = true;
    this.onChange();
    await this.display.animate(move, this.states[target], this.msPerMove);
    this.busy = false;
    if (generation === this.generation) {
      this.pos = target;
    } else {
      // load() or reset() happened mid-animation, so the animation just drew a
      // stale cube. Redraw the correct one.
      this.display.show(this.states[this.pos]);
    }
    this.onChange();
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/render/playback.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 5: Check and commit**

```powershell
npm run typecheck
npm test
npm run format
git add -A
git commit -m "feat: playback controller for stepping through algorithms" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 3D view + algorithm player page

**Files:**
- Create: `src/render/CubeView.ts`
- Modify: `src/app/App.tsx` (replace the placeholder entirely), `src/app/app.css` (replace entirely), `CLAUDE.md` (status)

**Interfaces:**
- Consumes: `Cube`, `Color` (Task 1); `Move`, `parseAlgorithm`, `formatMove` (Task 2); `CUBIES`, `moveRotation` (Task 4); `CubeDisplay`, `Playback` (Task 5)
- Produces: `class CubeView implements CubeDisplay` with `constructor(container: HTMLElement)`, `show`, `animate`, `dispose(): void`; `const STICKER_HEX: Record<Color, number>`

This task draws pixels, which unit tests can't see. It's verified by the checklist in Step 5; the logic underneath is already covered by Tasks 3 to 5.

- [ ] **Step 1: Implement `src/render/CubeView.ts`**

```ts
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Move } from '../cube/notation';
import type { Color, Cube } from '../cube/types';
import { CUBIES, moveRotation } from './layout';
import type { CubeDisplay } from './playback';

/** Screen colors for each sticker color. */
export const STICKER_HEX: Record<Color, number> = {
  W: 0xffffff,
  Y: 0xffd500,
  G: 0x009b48,
  B: 0x0046ad,
  R: 0xb71234,
  O: 0xff5800,
};

interface ActiveAnimation {
  pivot: THREE.Group;
  axis: THREE.Vector3;
  angle: number;
  startMs: number;
  durationMs: number;
  cubies: THREE.Group[];
  next: Cube;
  resolve: () => void;
}

/**
 * The 3D cube. It only DISPLAYS states. To animate a move, it spins the moving
 * cubies around a temporary pivot, then puts them back where they started and
 * recolors every sticker from the model's next state. The model stays the
 * single source of truth, and rounding errors can never build up.
 */
export class CubeView implements CubeDisplay {
  private readonly renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  private readonly controls: OrbitControls;
  private readonly root = new THREE.Group();
  private readonly cubieObjects: THREE.Group[] = [];
  private readonly stickerMaterials: THREE.MeshBasicMaterial[] = []; // indexed by sticker slot
  private readonly disposables: { dispose(): void }[] = [];
  private readonly resizeObserver: ResizeObserver;
  private frameId = 0;
  private animation: ActiveAnimation | null = null;

  constructor(private readonly container: HTMLElement) {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Looking from front-right-above, so U, F and R are visible (the standard view).
    this.camera.position.set(5, 4.5, 7);
    this.camera.lookAt(0, 0, 0);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 16;

    this.scene.add(this.root);
    this.buildCubies();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.frameId = requestAnimationFrame(this.tick);
  }

  show(cube: Cube): void {
    this.finishAnimation(false); // a jump cancels any animation in progress
    this.paint(cube);
  }

  animate(move: Move, next: Cube, durationMs: number): Promise<void> {
    this.finishAnimation(false);
    const { axis, angle, cubieIndices } = moveRotation(move);
    const pivot = new THREE.Group();
    this.root.add(pivot);
    const cubies = cubieIndices.map((i) => this.cubieObjects[i]);
    for (const cubie of cubies) pivot.add(cubie); // the pivot starts unrotated, so nothing moves yet
    return new Promise((resolve) => {
      this.animation = {
        pivot,
        axis: new THREE.Vector3(...axis),
        angle,
        startMs: performance.now(),
        durationMs: Math.max(durationMs, 1),
        cubies,
        next,
        resolve,
      };
    });
  }

  dispose(): void {
    cancelAnimationFrame(this.frameId);
    this.finishAnimation(false);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    for (const item of this.disposables) item.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private buildCubies(): void {
    const bodyGeometry = new THREE.BoxGeometry(0.96, 0.96, 0.96);
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const stickerGeometry = new THREE.PlaneGeometry(0.84, 0.84);
    this.disposables.push(bodyGeometry, bodyMaterial, stickerGeometry);
    const planeFacing = new THREE.Vector3(0, 0, 1); // a new plane faces +z

    for (const layout of CUBIES) {
      const cubie = new THREE.Group();
      cubie.position.set(...layout.position);
      cubie.add(new THREE.Mesh(bodyGeometry, bodyMaterial));
      for (const { slot, normal } of layout.stickers) {
        const material = new THREE.MeshBasicMaterial({ color: 0x888888 });
        this.disposables.push(material);
        this.stickerMaterials[slot] = material;
        const sticker = new THREE.Mesh(stickerGeometry, material);
        const n = new THREE.Vector3(...normal);
        sticker.position.copy(n).multiplyScalar(0.481); // just outside the body's surface
        sticker.quaternion.setFromUnitVectors(planeFacing, n);
        cubie.add(sticker);
      }
      this.root.add(cubie);
      this.cubieObjects.push(cubie);
    }
  }

  private paint(cube: Cube): void {
    cube.stickers.forEach((color, slot) => this.stickerMaterials[slot].color.setHex(STICKER_HEX[color]));
  }

  /** Put the moving cubies back in place. If the animation completed, recolor from the next state. */
  private finishAnimation(completed: boolean): void {
    const animation = this.animation;
    if (!animation) return;
    this.animation = null;
    // Cubies never change their own position, only the pivot rotates, so
    // moving them back to the root puts them exactly home.
    for (const cubie of animation.cubies) this.root.add(cubie);
    this.root.remove(animation.pivot);
    if (completed) this.paint(animation.next);
    animation.resolve();
  }

  private readonly tick = (nowMs: number): void => {
    this.frameId = requestAnimationFrame(this.tick);
    const animation = this.animation;
    if (animation) {
      const t = Math.min(1, Math.max(0, (nowMs - animation.startMs) / animation.durationMs));
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // slow-fast-slow
      animation.pivot.setRotationFromAxisAngle(animation.axis, animation.angle * eased);
      if (t >= 1) this.finishAnimation(true);
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private resize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
```

- [ ] **Step 2: Replace `src/app/App.tsx`**

```tsx
import { useEffect, useReducer, useRef, useState } from 'react';
import { formatMove, parseAlgorithm } from '../cube/notation';
import { CubeView } from '../render/CubeView';
import { Playback } from '../render/playback';

const DEFAULT_ALGORITHM = "R U R' U'";

export function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playbackRef = useRef<Playback | null>(null);
  const [, refresh] = useReducer((n: number) => n + 1, 0); // re-draw the page when playback changes
  const [text, setText] = useState(DEFAULT_ALGORITHM);
  const [msPerMove, setMsPerMove] = useState(400);
  const parsed = parseAlgorithm(text);

  // Create the 3D view once, and clean it up when the page goes away.
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

  // Load the algorithm whenever the text changes to a different valid one.
  const normalized = parsed.ok ? parsed.moves.map(formatMove).join(' ') : null;
  useEffect(() => {
    if (normalized === null) return;
    const result = parseAlgorithm(normalized);
    if (result.ok) playbackRef.current?.load(result.moves);
  }, [normalized]);

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
    <main className="app">
      <h1>Algorithm player</h1>
      <div className="cube-view" ref={containerRef} />
      <p className="hint">White on top, green facing you. Drag the cube to look around.</p>

      <label className="field">
        Algorithm
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
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
    </main>
  );
}
```

- [ ] **Step 3: Replace `src/app/app.css`**

```css
:root {
  font-family: system-ui, sans-serif;
  color: #1d1d1f;
  background: #f6f4ef;
}
body {
  margin: 0;
}
.app {
  max-width: 720px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
h1 {
  margin: 0;
  font-size: 1.5rem;
}
.cube-view {
  width: 100%;
  aspect-ratio: 1 / 1;
  max-height: 60vh;
  background: #ebe7de;
  border-radius: 12px;
  overflow: hidden;
  touch-action: none; /* lets a finger drag rotate the cube instead of scrolling the page */
}
.cube-view canvas {
  display: block;
}
.hint {
  margin: 0;
  color: #555;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-weight: 600;
}
.field input:not([type='range']) {
  font: 1.1rem ui-monospace, monospace;
  padding: 8px;
}
.error {
  margin: 0;
  color: #b00020;
}
.move-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  list-style: none;
  margin: 0;
  padding: 0;
  font-family: ui-monospace, monospace;
}
.move-list li {
  padding: 2px 8px;
  border-radius: 6px;
  background: #fff;
}
.move-list li.done {
  opacity: 0.45;
}
.move-list li.next {
  background: #1d1d1f;
  color: #fff;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.controls button {
  font-size: 1rem;
  padding: 8px 14px;
}
```

- [ ] **Step 4: Automated checks**

```powershell
npm run typecheck
npm test
npm run build
npm run format
```

Expected: typecheck clean; all tests pass (Tasks 1 to 5: 8 + 14 + 20 + 6 + 11 = 59 tests); build succeeds.

- [ ] **Step 5: Hands-on check in the browser**

Run `npm run dev` and open http://localhost:5173. Confirm each item; if any fails, stop and fix before committing.

1. A solved cube appears: **white on top, green facing you, red on the right**. Dragging rotates the view.
2. Press **▶ Play** on `R U R' U'`. On **R**, the right layer turns so its front stickers go **up and away** over the top. On **U**, the top layer turns so its front stickers go **to the left**. The move list highlights each move as it plays.
3. **Step back** four times returns to solved; **Step ▶** replays one move at a time.
4. Type `R U Q`: a red message names `"Q"` at position 5, and Play/Step are disabled.
5. Paste `(R U R’ U′)` (curly apostrophes): it plays like `R U R' U'`.
6. Try `M E S x y z r u f` one at a time: every move turns smoothly and **never jumps** at the end of a move.
7. Click **Step ▶** rapidly, and edit the text mid-animation: the cube never shows two moves at once and always settles on the right state.
8. Speed slider: right = faster.
9. Narrow the window to phone width (~375px): the cube stays visible and there's no sideways scrolling.

- [ ] **Step 6: Update the status in `CLAUDE.md`**

Replace:
```
Next: owner reviews the phase ① plan (project setup + cube model + 3D view).
```
with:
```
Phase ① (cube model + 3D algorithm player) is built. Next: phase ② plan
(manual sticker entry + validation).
```

- [ ] **Step 7: Commit**

```powershell
git add -A
git commit -m "feat: 3D cube view and algorithm player page" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
