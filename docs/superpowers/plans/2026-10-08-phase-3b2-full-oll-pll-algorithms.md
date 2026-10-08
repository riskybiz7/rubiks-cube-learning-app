# Phase ③b-2: Full OLL/PLL, Algorithms Screen and Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish phase ③b:
- full OLL (57 cases) and full PLL (21 cases);
- a choice between 2-look and full for each, which the solver follows;
- an **Algorithms** screen with case diagrams and *learning / learned* marks;
- progress saved in this browser.

**Architecture:**
- The 65 new algorithms are data in `src/content/cfop.ts`, next to the ③b-1 ones.
- The 13 cases that 2-look already covers (OLL 21–27 and the T, Y, Ua, Ub, H and Z perms) **reuse the existing cards**, so a "learned" mark is the same card in both places.
- Enumeration tests prove each full set covers every case exactly once. A second test ties each OLL number and PLL name to the case SpeedCubeDB shows for it.
- The CFOP solver takes a `LastLayerChoice`, either 2-look or full for each of OLL and PLL. The stage goals and the self-check don't change.
- Progress is a small pure module (`src/app/progress.ts`) that reads and writes one `localStorage` entry. Anything it can't read is ignored, never a crash.
- Case diagrams are a pure "top view" reader (`src/render/caseDiagram.ts`) plus a small SVG component.

**Tech Stack:** TypeScript 7 (strict), React 19, Vite 8, Vitest 5, Three.js (unchanged), Prettier.

**Spec:** `docs/superpowers/specs/2026-09-27-cube-learning-app-design.md` (§2 storage, §3.2, §3.4 case diagrams, §3.6, §7, §9, §10)

## Decisions

### Made by the owner (2026-10-08, before this plan was written)

| # | Decision | Notes |
|---|---|---|
| D1 | **Full OLL and PLL use face turns only**, like the rest of CFOP (decision 30) | Where a card differs from the usual online version, it shows that version underneath as "Usual version". 10 of the 65 new algorithms needed converting (list below) |
| D2 | **OLL uses the standard numbers 1–57**, checked in code against a cited chart | Source: SpeedCubeDB (below). PLL keeps its standard letter names. F2L keeps the app's own numbering (decision 33) |
| D3 | **Two switches on the Solve screen** (CFOP only): OLL 2-look/full and PLL 2-look/full | Start on 2-look; remembered in this browser |
| D4 | **Progress = case marks + lesson ticks**, with a reset button | *Learning / learned* per F2L/OLL/PLL card; a "done" tick per lesson on both Learn tracks |

### Proposed in this plan (for the owner to confirm)

| # | Decision | Why | Cost if wrong |
|---|---|---|---|
| D5 | **Shared cards.** OLL 21–27 *are* the seven second-look OLL cards (H, Pi, Headlights, T, Bowtie, Antisune, Sune). The full-PLL T, Y, Ua, Ub, H and Z *are* the 2-look PLL cards | One case, one card. Marking Sune learned shows in both lists. Checked: each of the 13 solves exactly the SpeedCubeDB case of the same number or name | Separate cards would double-count progress |
| D6 | **How each algorithm was chosen**, in this order: SpeedCubeDB's standard algorithm if it is already face turns only (y turns at the start or end are dropped: they only change the viewing angle); else the shortest of its listed face-turn alternatives; else the shortest conversion to face turns. Where ③b-1 already has a tested algorithm for the case, keep it | Matches what people find online as often as D1 allows | Some picks may not be the ones the owner likes. Each one is "Proposed" until checked |
| D7 | **Case diagrams.** OLL: a flat top view with only the yellow squares colored. PLL: a flat top view in full color. F2L: no flat diagram; the card's "Watch" button shows it in 3D | A top view can't show the F2L slot well. PLL arrows are left for later | F2L cards are less scannable at a glance |
| D8 | **Algorithms is a new tab.** The Algorithm player tab stays. The screen has **one** 3D player that shows whichever card you pick | Browsers allow only about 16 live 3D views per page, and 57 cards would exceed that | None |
| D9 | **Saved data is one versioned entry** (`rubiks-cube-app.progress.v1`). Unknown or broken entries are skipped. If the browser blocks storage, the app still works and says progress won't be kept | Old data or private browsing must never break the app | None |
| D10 | **Switching 2-look/full mid-solve** keeps your step if you're still in the cross or F2L (those don't change). Otherwise it goes to the first step of the yellow top | Changing the last layer shouldn't throw away your place | None |

## Source and checks (run while writing this plan)

**Source.** SpeedCubeDB, fetched 2026-10-08:
- <https://www.speedcubedb.com/a/3x3/OLL>: 57 cases, each with a "Standard Alg" and 4 listed alternatives;
- <https://www.speedcubedb.com/a/3x3/PLL>: 21 cases, the same.

One listed Ub alternative couldn't be read (`R3` is not a move) and was skipped.

**A throwaway test (deleted afterwards) checked against the cube model:**
- **Number and name check:** each of the 78 picked algorithms solves the case made by undoing SpeedCubeDB's standard algorithm for that number or name, with a turn of the top first (and one after, for PLL).
- **Full OLL:** all 216 orientation states of the top (215 unsolved) are each fixed by exactly one of the 57, and all 57 are needed.
- **Full PLL:** all 288 arrangement states (284 not solved by a top turn alone) are each fixed by exactly one of the 21, and all 21 are needed.
- **Face turns only:** U D R L F B.
- **The ③b-1 names are right:** every 2-look algorithm solves the SpeedCubeDB case of the same name. Sune = OLL 27, Antisune = 26, H = 21, Pi = 22, Headlights = 23, T = 24, Bowtie = 25, and the T, Y, Ua, Ub, H and Z perms. The 2-look line, L-shape and dot algorithms solve OLL 45, 44 and 2 when the corners are already yellow.

**Where the 78 came from:**

| | OLL (57) | PLL (21) | Total |
|---|---|---|---|
| SpeedCubeDB standard algorithm, as is | 25 | 12 | 37 |
| A SpeedCubeDB listed alternative, as is | 16 | 2 | 18 |
| Converted to face turns | 9 | 1 | 10 |
| Kept from ③b-1 (shared cards, D5) | 7 | 6 | 13 |

**Converted to face turns (please look at these first):** OLL 2, 11, 18, 20, 28, 53, 54, 56, 57 and the Aa-perm. Each wide or middle turn became face turns, with the cube model as the judge. The full list with origins is in the appendix.

## Global Constraints

- User-facing text says **"squares"**, never "stickers".
- **No unverified algorithm ships.** Every algorithm has a test that applies it to its case and confirms it (spec §7). The enumeration tests are the re-footing.
- **Provenance:** every CFOP algorithm is `claude-proposed` until the owner checks it.
- **Solver self-check:** replay every step; each stage meets its goal and the cube ends solved. On failure, show an error and never a bad plan.
- **Face turns only** in CFOP algorithms (decision 30; D1).
- **Windows PowerShell 5.1:** no `&&`; quote the path (`Rubik's Cube`). Commit messages go through a file (`git commit -F`).
- **Commit gate:** `npm run typecheck` passes before every commit. Run `npx prettier --write` on changed files. Every commit ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Stage explicit paths (never `git add -A`).
- **Branch:** `phase-3b2-algorithms`, from `main` (PRs #1–#4 are merged).

## Review Focus

1. **Saved progress that is broken, old or blocked** (bad JSON, unknown ids, private browsing). Expected: the app starts with whatever could be read, and never crashes. Tests in Task 4.
2. **A top already yellow with full OLL chosen** (an "OLL skip"). Expected: stage 3 says it's already done and turns nothing. Test in Task 2.
3. **Switching 2-look ↔ full partway through a solve.** Expected: D10. Test in Task 6 (pure helper), and checked in the browser.
4. **A shared card marked on one list** (e.g. Sune on full OLL). Expected: it shows the same mark on 2-look OLL. Checked in the browser.
5. **The Algorithms screen with 57 cards.** Expected: one 3D player only, and diagrams that draw without lag on a phone. Checked in the browser.

---

## File map

| File | Status | Job |
|---|---|---|
| `src/test-utils/speedcubedb.ts` | Create | SpeedCubeDB's standard algorithm for every OLL/PLL case (test fixture, cited), plus `withoutYTurns` and `tidy` |
| `src/content/cfop.ts` | Modify | 50 new OLL + 15 new PLL algorithms; `number`, `fullGroup`, `usual` fields; `inSet`, `groupIn`, `cardTitle`, `caseCube`; `LastLayerChoice`, `TWO_LOOK`, `cfopStageTitles`; lessons 5 and 6 |
| `src/content/cfop.test.ts` | Modify | Full-set enumeration, source tie, `usual` check, lessons |
| `src/solver/cfop.ts` | Modify | `solveCfop(start, choice)`; one-look OLL and PLL |
| `src/solver/cfop.test.ts` | Modify | Stress test over all four choices, OLL skip, step counts |
| `src/solver/cfop.measure.test.ts` | Modify | Measure full OLL/PLL too |
| `src/content/methods.ts` | Modify | `solveWith(method, cube, choice)` |
| `src/content/beginner.ts` | Modify | `StageInfo.fullSet?` |
| `src/content/algorithms.ts` (+ test) | Modify | `AlgorithmInfo` gains `number`, `fullGroup`, `usual` |
| `src/content/demo.ts` (+ test) | Modify | `demoLesson(lessonIndex, method)` for 6 CFOP lessons |
| `src/app/progress.ts` (+ test) | Create | Load/save/update progress; never throws |
| `src/render/caseDiagram.ts` (+ test) | Create | `topView(cube)`: the top face and the top row of each side, seen from above |
| `src/app/CaseDiagram.tsx` | Create | SVG drawing of a top view (OLL: yellow only; PLL: full color) |
| `src/app/AlgorithmsScreen.tsx` | Create | Set buttons, filter, grouped cards, one player, reset |
| `src/app/lastLayer.ts` (+ test) | Create | `indexAfterChoiceChange` (D10) |
| `src/app/App.tsx`, `SolveScreen.tsx`, `LearnScreen.tsx`, `app.css` | Modify | New tab, progress state, switches, lesson ticks, stage list from the plan |
| `docs/…`, `CLAUDE.md` | Modify/Create | Status, decisions #35–#44, ③b-2 review notes |

---

### Task 0: Branch

- [ ] **Step 1:** already done when this plan was committed:

```powershell
Set-Location "C:\Users\micha\Claude\Projects\Rubik's Cube"; git checkout main; git pull; git checkout -b phase-3b2-algorithms
```

---

### Task 1: Full OLL and PLL library

**Files:**
- Create: `src/test-utils/speedcubedb.ts`
- Modify: `src/content/cfop.ts`, `src/content/cfop.test.ts`

**Interfaces:**
- `CfopSet` gains `'OLL' | 'PLL'`.
- `CfopAlgorithm` gains `number?: number`, `fullGroup?: string`, `usual?: string`.
- New: `inSet(set): CfopAlgorithm[]`, `groupIn(a, set): string`, `cardTitle(a): string`, `CASE_HOME`, `caseCube(moves): Cube`.
- `GROUPS` gains the 14 OLL shape groups and 3 PLL groups.

- [ ] **Step 1: Create the fixture** `src/test-utils/speedcubedb.ts` (generated from the saved page; don't retype it)

```ts
import type { Move, Turns } from '../cube/notation';

/**
 * SpeedCubeDB's "Standard Alg" for every OLL and PLL case, as published at
 * https://www.speedcubedb.com/a/3x3/OLL and https://www.speedcubedb.com/a/3x3/PLL
 * (fetched 2026-10-08). The tests use these only to tie the app's OLL numbers and PLL
 * names to the same cases the site shows. The app's own algorithms are in
 * src/content/cfop.ts.
 */
export const SPEEDCUBEDB_STANDARD = new Map<string, string>([
  ["OLL 1", "R U2 R' R' F R F' U2 R' F R F'"],
  ["OLL 2", "F R U R' U' F' f R U R' U' f'"],
  ["OLL 3", "y' f R U R' U' f' U' F R U R' U' F'"],
  ["OLL 4", "y' f R U R' U' f' U F R U R' U' F'"],
  ["OLL 5", "r' U2 R U R' U r"],
  ["OLL 6", "r U2 R' U' R U' r'"],
  ["OLL 7", "r U R' U R U2 r'"],
  ["OLL 8", "y2 r' U' R U' R' U2 r"],
  ["OLL 9", "y R U R' U' R' F R R U R' U' F'"],
  ["OLL 10", "R U R' U R' F R F' R U2 R'"],
  ["OLL 11", "M R U R' U R U2 R' U M'"],
  ["OLL 12", "y' M' R' U' R U' R' U2 R U' M"],
  ["OLL 13", "r U' r' U' r U r' F' U F"],
  ["OLL 14", "R' F R U R' F' R F U' F'"],
  ["OLL 15", "r' U' r R' U' R U r' U r"],
  ["OLL 16", "r U r' R U R' U' r U' r'"],
  ["OLL 17", "R U R' U R' F R F' U2 R' F R F'"],
  ["OLL 18", "y R U2 R' R' F R F' U2 M' U R U' r'"],
  ["OLL 19", "M U R U R' U' M' R' F R F'"],
  ["OLL 20", "r U R' U' M2 U R U' R' U' M'"],
  ["OLL 21", "R U R' U R U' R' U R U2 R'"],
  ["OLL 22", "R U2 R2' U' R2 U' R2' U' U' R"],
  ["OLL 23", "R2 D R' U2 R D' R' U2 R'"],
  ["OLL 24", "r U R' U' r' F R F'"],
  ["OLL 25", "y F' r U R' U' r' F R"],
  ["OLL 26", "y R U2 R' U' R U' R'"],
  ["OLL 27", "R U R' U R U2 R'"],
  ["OLL 28", "r U R' U' M U R U' R'"],
  ["OLL 29", "y R U R' U' R U' R' F' U' F R U R'"],
  ["OLL 30", "y2 F U R U2 R' U' R U2 R' U' F'"],
  ["OLL 31", "R' U' F U R U' R' F' R"],
  ["OLL 32", "S R U R' U' R' F R f'"],
  ["OLL 33", "R U R' U' R' F R F'"],
  ["OLL 34", "y2 R U R2 U' R' F R U R U' F'"],
  ["OLL 35", "R U2 R' R' F R F' R U2 R'"],
  ["OLL 36", "y2 L' U' L U' L' U L U L F' L' F"],
  ["OLL 37", "F R U' R' U' R U R' F'"],
  ["OLL 38", "R U R' U R U' R' U' R' F R F'"],
  ["OLL 39", "y L F' L' U' L U F U' L'"],
  ["OLL 40", "y R' F R U R' U' F' U R"],
  ["OLL 41", "y2 R U R' U R U2 R' F R U R' U' F'"],
  ["OLL 42", "R' U' R U' R' U2 R F R U R' U' F'"],
  ["OLL 43", "y R' U' F' U F R"],
  ["OLL 44", "f R U R' U' f'"],
  ["OLL 45", "F R U R' U' F'"],
  ["OLL 46", "R' U' R' F R F' U R"],
  ["OLL 47", "F' L' U' L U L' U' L U F"],
  ["OLL 48", "F R U R' U' R U R' U' F'"],
  ["OLL 49", "y2 r U' r2 U r2 U r2 U' r"],
  ["OLL 50", "r' U r2 U' r2 U' r2 U r'"],
  ["OLL 51", "f R U R' U' R U R' U' f'"],
  ["OLL 52", "y2 R' F' U' F U' R U R' U R"],
  ["OLL 53", "r' U' R U' R' U R U' R' U2 r"],
  ["OLL 54", "r U R' U R U' R' U R U2 r'"],
  ["OLL 55", "R U2 R2 U' R U' R' U2 F R F'"],
  ["OLL 56", "r U r' U R U' R' U R U' R' r U' r'"],
  ["OLL 57", "R U R' U' M' U R U' r'"],
  ["Aa", "x R' U R' D2 R U' R' D2 R2 x'"],
  ["Ab", "x R2 D2 R U R' D2 R U' R x'"],
  ["E", "y x' R U' R' D R U R' D' R U R' D R U' R' D' x"],
  ["F", "y R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R"],
  ["Ga", "R2 U R' U R' U' R U' R2 D U' R' U R D'"],
  ["Gb", "R' U' R U D' R2 U R' U R U' R U' R2 D"],
  ["Gc", "R2 U' R U' R U R' U R2 D' U R U' R' D"],
  ["Gd", "R U R' U' D R2 U' R U' R' U R' U R2 D'"],
  ["H", "M2 U' M2 U2 M2 U' M2"],
  ["Ja", "y R' U L' U2 R U' R' U2 R L"],
  ["Jb", "R U R' F' R U R' U' R' F R2 U' R'"],
  ["Na", "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'"],
  ["Nb", "R' U R U' R' F' U' F R U R' F R' F' R U' R"],
  ["Ra", "y R U' R' U' R U R D R' U' R D' R' U2 R'"],
  ["Rb", "R' U2 R U2 R' F R U R' U' R' F' R2"],
  ["T", "R U R' U' R' F R2 U' R' U' R U R' F'"],
  ["Ua", "y2 M2 U M U2 M' U M2"],
  ["Ub", "y2 M2 U' M U2 M' U' M2"],
  ["V", "R' U R' U' R D' R' D R' U D' R2 U' R2 D R2"],
  ["Y", "F R U' R' U' R U R' F' R U R' U' R' F R F'"],
  ["Z", "M2 U M2 U M' U2 M2 U2 M'"],
]);

/** Drop whole-cube y turns at the start and end: they only change the viewing angle. */
export function withoutYTurns(moves: readonly Move[]): Move[] {
  let first = 0;
  let last = moves.length;
  while (first < last && moves[first].base === 'y') first++;
  while (last > first && moves[last - 1].base === 'y') last--;
  return moves.slice(first, last);
}

/** Join back-to-back turns of the same layer: R' R' becomes R2, and R R' disappears. */
export function tidy(moves: readonly Move[]): Move[] {
  const out: Move[] = [];
  for (const move of moves) {
    const last = out[out.length - 1];
    if (last && last.base === move.base) {
      const turns = (last.turns + move.turns) % 4;
      out.pop();
      if (turns) out.push({ base: move.base, turns: turns as Turns });
    } else out.push(move);
  }
  return out.length === moves.length ? out : tidy(out);
}
```

- [ ] **Step 2: Write the failing tests.** Add to `src/content/cfop.test.ts`:

```ts
import { formatAlgorithm } from '../cube/notation';
import { SPEEDCUBEDB_STANDARD, tidy, withoutYTurns } from '../test-utils/speedcubedb';
import { cardTitle, groupIn, inSet } from './cfop';

/** The SpeedCubeDB case for this card: "OLL 27", "T", "Aa"… */
const sourceName = (a: CfopAlgorithm) =>
  a.number !== undefined ? `OLL ${a.number}` : a.name.replace('-perm', '');
/** The case SpeedCubeDB gives that number or name: undo its standard algorithm. */
const sourceCase = (a: CfopAlgorithm) =>
  applyMoves(CFOP_HOME, invertMoves(withoutYTurns(mustParse(SPEEDCUBEDB_STANDARD.get(sourceName(a))!))));

describe('CFOP library: full OLL', () => {
  const oriented = lastLayerStates({ orient: true, permute: false });

  it('has 57 cases, numbered 1 to 57', () => {
    expect(inSet('OLL').map((a) => a.number)).toEqual(Array.from({ length: 57 }, (_, i) => i + 1));
  });

  it('every pattern on top is made all yellow by exactly one of the 57', () => {
    expectExactCover(oriented, inSet('OLL'), isYellowFace);
  });

  it('each number is the case SpeedCubeDB gives that number', () => {
    for (const a of inSet('OLL')) {
      expect(solvers(sourceCase(a), [a], isYellowFace, false), cardTitle(a)).toHaveLength(1);
    }
  });

  it('the seven second-look cards are OLL 21 to 27', () => {
    expect(inGroup(GROUPS.ollCorners).map((a) => a.number).sort()).toEqual([21, 22, 23, 24, 25, 26, 27]);
  });
});

describe('CFOP library: full PLL', () => {
  const arranged = lastLayerStates({ orient: false, permute: true });

  it('has the 21 named cases', () => {
    expect(inSet('PLL').map(sourceName).sort()).toEqual(
      [...SPEEDCUBEDB_STANDARD.keys()].filter((k) => !k.startsWith('OLL')).sort(),
    );
  });

  it('every arrangement of the top is solved by exactly one of the 21, plus a turn of the top', () => {
    expectExactCover(arranged, inSet('PLL'), isSolved, true);
  });

  it('each name is the case SpeedCubeDB gives that name', () => {
    for (const a of inSet('PLL')) {
      expect(solvers(sourceCase(a), [a], isSolved, true), a.name).toHaveLength(1);
    }
  });

  it('the six 2-look cards are the same cards in full PLL', () => {
    const ids = new Set(inSet('PLL').map((a) => a.id));
    for (const a of inSet('PLL-2LOOK')) expect(ids.has(a.id), a.id).toBe(true);
  });
});

describe('CFOP library: cards', () => {
  it('shows the usual version exactly when the card differs from it', () => {
    for (const a of [...inSet('OLL'), ...inSet('PLL')]) {
      const standard = SPEEDCUBEDB_STANDARD.get(sourceName(a))!;
      const same =
        formatAlgorithm(tidy(withoutYTurns(mustParse(standard)))) === formatAlgorithm(mustParse(a.moves));
      expect(a.usual, cardTitle(a)).toBe(same ? undefined : standard);
    }
  });

  it('every full-set card has a group to sit in', () => {
    for (const a of inSet('OLL')) expect(Object.values(GROUPS), a.id).toContain(groupIn(a, 'OLL'));
    for (const a of inSet('PLL')) expect(Object.values(GROUPS), a.id).toContain(groupIn(a, 'PLL'));
  });

  it('titles name the number as well as the nickname', () => {
    expect(cardTitle(byId('oll-sune'))).toBe('OLL 27 (Sune)');
    expect(cardTitle(byId('oll-1'))).toBe('OLL 1');
    expect(cardTitle(byId('pll-aa'))).toBe('Aa-perm');
  });
});
```

The existing tests `uses only face turns…` and `leaves the cross and every other finished slot alone` already loop over `CFOP_ALGORITHMS`, so they cover the 65 new ones with no change.

- [ ] **Step 3: Run and watch them fail**

Run: `npx vitest run src/content/cfop.test.ts`
Expected: FAIL. `inSet`, `cardTitle` and `groupIn` don't exist.

- [ ] **Step 4: Implement** in `src/content/cfop.ts`

Types and groups:

```ts
export type CfopSet = 'F2L' | 'OLL-2LOOK' | 'PLL-2LOOK' | 'OLL' | 'PLL';

export interface CfopAlgorithm {
  id: string;
  set: CfopSet; // the set the card was written for (full OLL/PLL also include shared 2-look cards)
  group: string;
  name: string;
  moves: string;
  provenance: Provenance;
  number?: number; // OLL 1–57, standard numbering (as on SpeedCubeDB)
  fullGroup?: string; // its group in full OLL or PLL, for a shared 2-look card
  usual?: string; // SpeedCubeDB's standard version, when this card's differs (face turns only)
}

export const GROUPS = {
  // …the ③b-1 groups, unchanged…
  ollDot: 'Dot shapes',
  ollSquare: 'Square shapes',
  ollLightning: 'Lightning shapes',
  ollFish: 'Fish shapes',
  ollKnight: 'Knight move shapes',
  ollOcll: 'Cross already made',
  ollAllCorners: 'All corners already yellow',
  ollAwkward: 'Awkward shapes',
  ollP: 'P shapes',
  ollT: 'T shapes',
  ollC: 'C shapes',
  ollW: 'W shapes',
  ollL: 'L shapes',
  ollLine: 'Line shapes',
  pllAdjacent: 'Corners: two side by side swapped',
  pllDiagonal: 'Corners: two diagonal swapped',
  pllEdgesOnly: 'Edges only',
} as const;
```

The group names follow SpeedCubeDB's groups ("Dot Case", "OCLL", "Adj Swap", "Opp Swap", "EPLL", …), in plain English.

The new data, generated from the verified picks (don't retype it):

```ts
// Full OLL: [number, group, moves, usual version if different]. Face turns only (decision 30).
type OllRow = readonly [number: number, group: string, moves: string, usual?: string];
const OLL_FULL: readonly OllRow[] = [
  [1, GROUPS.ollDot, "R U2 R2 F R F' U2 R' F R F'"],
  [2, GROUPS.ollDot, "R U' R2 D' L F L' D R2 U R'", "F R U R' U' F' f R U R' U' f'"],
  [3, GROUPS.ollDot, "R' F2 R2 U2 R' F R U2 R2 F2 R", "y' f R U R' U' f' U' F R U R' U' F'"],
  [4, GROUPS.ollDot, "R' F2 R2 U2 R' F' R U2 R2 F2 R", "y' f R U R' U' f' U F R U R' U' F'"],
  [5, GROUPS.ollSquare, "R' F2 L F L' F R", "r' U2 R U R' U r"],
  [6, GROUPS.ollSquare, "F U' R2 D R' U' R D' R2 U F'", "r U2 R' U' R U' r'"],
  [7, GROUPS.ollLightning, "L' U2 L U2 L F' L' F", "r U R' U R U2 r'"],
  [8, GROUPS.ollLightning, "R U2 R' U2 R' F R F'", "y2 r' U' R U' R' U2 r"],
  [9, GROUPS.ollFish, "R U R' U' R' F R2 U R' U' F'"],
  [10, GROUPS.ollFish, "R U R' U R' F R F' R U2 R'"],
  [11, GROUPS.ollLightning, "L' R2 B R' B R B2 R' B R' L", "M R U R' U R U2 R' U M'"],
  [12, GROUPS.ollLightning, "F R U R' U' F' U F R U R' U' F'", "y' M' R' U' R U' R' U2 R U' M"],
  [13, GROUPS.ollKnight, "F U R U2 R' U' R U R' F'", "r U' r' U' r U r' F' U F"],
  [14, GROUPS.ollKnight, "R' F R U R' F' R F U' F'"],
  [15, GROUPS.ollKnight, "R' F' R L' U' L U R' F R", "r' U' r R' U' R U r' U r"],
  [16, GROUPS.ollKnight, "R' F R U R' U' F' R U' R' U2 R", "r U r' R U R' U' r U' r'"],
  [17, GROUPS.ollDot, "R U R' U R' F R F' U2 R' F R F'"],
  [18, GROUPS.ollDot, "F2 B' D R' D' F' B R U2 R' U' F'", "y R U2 R' R' F R F' U2 M' U R U' r'"],
  [19, GROUPS.ollDot, "R' U2 F R U R' U' F2 U2 F R", "M U R U R' U' M' R' F R F'"],
  [20, GROUPS.ollDot, "L F R' F' R2 L2 B R B' R' B' R' L", "r U R' U' M2 U R U' R' U' M'"],
  [28, GROUPS.ollAllCorners, "L F R' F' R L' U R U' R'", "r U R' U' M U R U' R'"],
  [29, GROUPS.ollAwkward, "R U R' U' R U' R' F' U' F R U R'"],
  [30, GROUPS.ollAwkward, "F U R U2 R' U' R U2 R' U' F'"],
  [31, GROUPS.ollP, "R' U' F U R U' R' F' R"],
  [32, GROUPS.ollP, "L U F' U' L' U L F L'", "S R U R' U' R' F R f'"],
  [33, GROUPS.ollT, "R U R' U' R' F R F'"],
  [34, GROUPS.ollC, "R U R2 U' R' F R U R U' F'"],
  [35, GROUPS.ollFish, "R U2 R2 F R F' R U2 R'"],
  [36, GROUPS.ollW, "L' U' L U' L' U L U L F' L' F"],
  [37, GROUPS.ollFish, "F R U' R' U' R U R' F'"],
  [38, GROUPS.ollW, "R U R' U R U' R' U' R' F R F'"],
  [39, GROUPS.ollLightning, "L F' L' U' L U F U' L'"],
  [40, GROUPS.ollLightning, "R' F R U R' U' F' U R"],
  [41, GROUPS.ollAwkward, "R U R' U R U2 R' F R U R' U' F'"],
  [42, GROUPS.ollAwkward, "R' U' R U' R' U2 R F R U R' U' F'"],
  [43, GROUPS.ollP, "R' U' F' U F R"],
  [44, GROUPS.ollP, "F U R U' R' F'", "f R U R' U' f'"],
  [45, GROUPS.ollT, "F R U R' U' F'"],
  [46, GROUPS.ollC, "R' U' R' F R F' U R"],
  [47, GROUPS.ollL, "F' L' U' L U L' U' L U F"],
  [48, GROUPS.ollL, "F R U R' U' R U R' U' F'"],
  [49, GROUPS.ollL, "R B' R2 F R2 B R2 F' R", "y2 r U' r2 U r2 U r2 U' r"],
  [50, GROUPS.ollL, "R' F R2 B' R2 F' R2 B R'", "r' U r2 U' r2 U' r2 U r'"],
  [51, GROUPS.ollLine, "F U R U' R' U R U' R' F'", "f R U R' U' R U R' U' f'"],
  [52, GROUPS.ollLine, "R' F' U' F U' R U R' U R"],
  [53, GROUPS.ollL, "L' B' R B' R' B R B' R' B2 L", "r' U' R U' R' U R U' R' U2 r"],
  [54, GROUPS.ollL, "L F R' F R F' R' F R F2 L'", "r U R' U R U' R' U R U2 r'"],
  [55, GROUPS.ollLine, "R U2 R2 U' R U' R' U2 F R F'"],
  [56, GROUPS.ollLine, "L F L' U R U' R2 L F R F2 L'", "r U r' U R U' R' U R U' R' r U' r'"],
  [57, GROUPS.ollAllCorners, "R U R' U' R' L F R F' L'", "R U R' U' M' U R U' r'"],
];

// Full PLL: [id, group, name, moves, usual version if different].
type PllRow = readonly [id: string, group: string, name: string, moves: string, usual?: string];
const PLL_FULL: readonly PllRow[] = [
  ['pll-aa', GROUPS.pllAdjacent, 'Aa-perm', "R' F R' B2 R F' R' B2 R2", "x R' U R' D2 R U' R' D2 R2 x'"],
  ['pll-ab', GROUPS.pllAdjacent, 'Ab-perm', "R' B' R U' R D R' U R D' R2 B R", "x R2 D2 R U R' D2 R U' R x'"],
  ['pll-e', GROUPS.pllDiagonal, 'E-perm', "R' U' R' D' R U' R' D R U R' D' R U R' D R2", "y x' R U' R' D R U R' D' R U R' D R U' R' D' x"],
  ['pll-f', GROUPS.pllAdjacent, 'F-perm', "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R"],
  ['pll-ga', GROUPS.pllAdjacent, 'Ga-perm', "R2 U R' U R' U' R U' R2 D U' R' U R D'"],
  ['pll-gb', GROUPS.pllAdjacent, 'Gb-perm', "R' U' R U D' R2 U R' U R U' R U' R2 D"],
  ['pll-gc', GROUPS.pllAdjacent, 'Gc-perm', "R2 U' R U' R U R' U R2 D' U R U' R' D"],
  ['pll-gd', GROUPS.pllAdjacent, 'Gd-perm', "R U R' U' D R2 U' R U' R' U R' U R2 D'"],
  ['pll-ja', GROUPS.pllAdjacent, 'Ja-perm', "R' U L' U2 R U' R' U2 R L"],
  ['pll-jb', GROUPS.pllAdjacent, 'Jb-perm', "R U R' F' R U R' U' R' F R2 U' R'"],
  ['pll-na', GROUPS.pllDiagonal, 'Na-perm', "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'"],
  ['pll-nb', GROUPS.pllDiagonal, 'Nb-perm', "R' U R U' R' F' U' F R U R' F R' F' R U' R"],
  ['pll-ra', GROUPS.pllAdjacent, 'Ra-perm', "R U' R' U' R U R D R' U' R D' R' U2 R'"],
  ['pll-rb', GROUPS.pllAdjacent, 'Rb-perm', "R' U2 R U2 R' F R U R' U' R' F' R2"],
  ['pll-v', GROUPS.pllDiagonal, 'V-perm', "R' U R' U' R D' R' D R' U D' R2 U' R2 D R2"],
];

/** 2-look cards that are also full OLL/PLL cases: the same card, so a "learned" mark carries over. */
const SHARED: Readonly<Record<string, Pick<CfopAlgorithm, 'number' | 'fullGroup' | 'usual'>>> = {
  'oll-h': { number: 21, fullGroup: GROUPS.ollOcll },
  'oll-pi': { number: 22, fullGroup: GROUPS.ollOcll },
  'oll-headlights': { number: 23, fullGroup: GROUPS.ollOcll },
  'oll-t': { number: 24, fullGroup: GROUPS.ollOcll, usual: "r U R' U' r' F R F'" },
  'oll-bowtie': { number: 25, fullGroup: GROUPS.ollOcll, usual: "y F' r U R' U' r' F R" },
  'oll-antisune': { number: 26, fullGroup: GROUPS.ollOcll },
  'oll-sune': { number: 27, fullGroup: GROUPS.ollOcll },
  'pll-h': { fullGroup: GROUPS.pllEdgesOnly, usual: "M2 U' M2 U2 M2 U' M2" },
  'pll-t': { fullGroup: GROUPS.pllAdjacent },
  'pll-ua': { fullGroup: GROUPS.pllEdgesOnly, usual: "y2 M2 U M U2 M' U M2" },
  'pll-ub': { fullGroup: GROUPS.pllEdgesOnly, usual: "y2 M2 U' M U2 M' U' M2" },
  'pll-y': { fullGroup: GROUPS.pllDiagonal },
  'pll-z': { fullGroup: GROUPS.pllEdgesOnly, usual: "M2 U M2 U M' U2 M2 U2 M'" },
};
```

Build the list and the helpers:

```ts
export const CFOP_ALGORITHMS: readonly CfopAlgorithm[] = [
  ...F2L_LIST.map(/* unchanged */),
  ...fromRows('OLL-2LOOK', OLL_2LOOK),
  ...fromRows('PLL-2LOOK', PLL_2LOOK),
  ...OLL_FULL.map(([number, group, moves, usual]) => ({
    id: `oll-${number}`,
    set: 'OLL' as const,
    group,
    name: `OLL ${number}`,
    moves,
    provenance: proposed,
    number,
    usual,
  })),
  ...PLL_FULL.map(([id, group, name, moves, usual]) => ({
    id,
    set: 'PLL' as const,
    group,
    name,
    moves,
    provenance: proposed,
    usual,
  })),
].map((a) => ({ ...a, ...SHARED[a.id] }));

/** Every card in a set. Full OLL and PLL include the shared 2-look cards. */
export function inSet(set: CfopSet): CfopAlgorithm[] {
  if (set === 'OLL') {
    return CFOP_ALGORITHMS.filter((a) => a.number !== undefined).sort((a, b) => a.number! - b.number!);
  }
  if (set === 'PLL') {
    return CFOP_ALGORITHMS.filter((a) => a.set === 'PLL' || a.set === 'PLL-2LOOK').sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }
  return CFOP_ALGORITHMS.filter((a) => a.set === set);
}

/** The group a card sits in when a set is shown. */
export const groupIn = (a: CfopAlgorithm, set: CfopSet): string =>
  set === 'OLL' || set === 'PLL' ? (a.fullGroup ?? a.group) : a.group;

/** "OLL 27 (Sune)", "OLL 1", "T-perm", "F2L 12". */
export function cardTitle(a: { name: string; number?: number }): string {
  if (a.number === undefined || a.name === `OLL ${a.number}`) return a.name;
  return `OLL ${a.number} (${a.name})`;
}

/** The solved cube held for CFOP: yellow on top, green facing you. */
export const CASE_HOME: Cube = applyMoves(solved(), mustParse('z2'));

/** The case an algorithm solves, as it expects it: undo the algorithm from solved. */
export const caseCube = (moves: string): Cube => applyMoves(CASE_HOME, invertMoves(mustParse(moves)));
```

`usual` is `undefined` when a row has none. The "usual version" test compares with `toBe(undefined)`, so leave the key out or set it to `undefined`; both pass. The rows' `usual` text is SpeedCubeDB's standard algorithm exactly as published.

- [ ] **Step 5: Run the tests.**

Run: `npx vitest run src/content`
Expected: PASS. The full-OLL cover test runs 215 states × 57 algorithms × 4 top turns, about 49,000 replays; expect a few seconds. If it's over 10 s, give that `it` a `20_000` timeout rather than shrinking the test.

- [ ] **Step 6: Format, typecheck, commit**

Commit message: `feat: full OLL (57) and PLL (21), each tied to SpeedCubeDB's numbering and proven to cover every case once`.

---

### Task 2: Solver follows the 2-look/full choice

**Files:**
- Modify: `src/content/cfop.ts` (choice types and stage titles), `src/solver/cfop.ts`, `src/solver/cfop.test.ts`, `src/content/methods.ts`, `src/solver/cfop.measure.test.ts`

**Interfaces:**
- `type LookChoice = 'two-look' | 'full'`
- `interface LastLayerChoice { oll: LookChoice; pll: LookChoice }`
- `const TWO_LOOK: LastLayerChoice`
- `cfopStageTitles(choice): string[]`, which gives the 4 plan stage titles
- `solveCfop(start, choice = TWO_LOOK)`
- `solveWith(method, cube, choice = TWO_LOOK)`

- [ ] **Step 1: Write the failing tests** in `src/solver/cfop.test.ts`

```ts
import { inSet, TWO_LOOK, type LastLayerChoice } from '../content/cfop';
import { ALREADY_DONE, listSteps } from './plan';

const CHOICES: LastLayerChoice[] = [
  { oll: 'two-look', pll: 'two-look' },
  { oll: 'full', pll: 'two-look' },
  { oll: 'two-look', pll: 'full' },
  { oll: 'full', pll: 'full' },
];

describe('CFOP solver: 2-look or full', () => {
  it('solves 200 scrambles with every choice, and passes its own check', () => {
    const random = seededRandom(31);
    for (let n = 0; n < 200; n++) {
      const start = applyMoves(solved(), randomScramble(25, random));
      for (const choice of CHOICES) {
        const result = solveCfop(start, choice);
        expect(result.ok, `${n} ${choice.oll}/${choice.pll}`).toBe(true);
        if (result.ok) expect(cfopSelfCheck(result.plan)).toBeNull();
      }
    }
  });

  it('full OLL is one look: at most a turn of the top and one algorithm, from the 57', () => {
    const random = seededRandom(32);
    const full = new Set(inSet('OLL').map((a) => a.id));
    for (let n = 0; n < 100; n++) {
      const result = solveCfop(applyMoves(solved(), randomScramble(25, random)), { oll: 'full', pll: 'two-look' });
      if (!result.ok) throw new Error(result.error);
      const stage = result.plan.stages[2];
      expect(stage.steps.length).toBeLessThanOrEqual(2);
      for (const step of stage.steps) if (step.algorithmId) expect(full.has(step.algorithmId)).toBe(true);
    }
  });

  it('full PLL is one look: a turn, one algorithm from the 21, and a final turn at most', () => {
    const random = seededRandom(33);
    const full = new Set(inSet('PLL').map((a) => a.id));
    for (let n = 0; n < 100; n++) {
      const result = solveCfop(applyMoves(solved(), randomScramble(25, random)), { oll: 'two-look', pll: 'full' });
      if (!result.ok) throw new Error(result.error);
      const stage = result.plan.stages[3];
      expect(stage.steps.length).toBeLessThanOrEqual(3);
      for (const step of stage.steps) if (step.algorithmId) expect(full.has(step.algorithmId)).toBe(true);
    }
  });

  it('a top already yellow with full OLL: the stage says so and turns nothing', () => {
    const start = applyMoves(caseCube("R U R' U' R' F R2 U' R' U' R U R' F'"), mustParse('x2 y')); // T-perm case, held wrong
    const result = solveCfop(start, { oll: 'full', pll: 'full' });
    if (!result.ok) throw new Error(result.error);
    expect(result.plan.stages[2].steps).toEqual([{ kind: 'check', moves: [], text: ALREADY_DONE }]);
  });

  it('names the stages for the choice', () => {
    const result = solveCfop(solved(), { oll: 'full', pll: 'two-look' });
    if (!result.ok) throw new Error(result.error);
    expect(result.plan.stages.map((s) => s.title)).toEqual(cfopStageTitles({ oll: 'full', pll: 'two-look' }));
  });

  it('2-look stays the default', () => {
    const start = applyMoves(solved(), mustParse(DEMO_SCRAMBLE));
    expect(solveCfop(start)).toEqual(solveCfop(start, TWO_LOOK));
  });
});
```

- [ ] **Step 2: Run and watch them fail**

Run: `npx vitest run src/solver/cfop.test.ts`
Expected: FAIL. `solveCfop` ignores the choice, and `inSet`/`TWO_LOOK` aren't imported anywhere yet.

- [ ] **Step 3: Implement**

In `src/content/cfop.ts`:

```ts
/** For each half of the last layer: two looks (fewer algorithms) or one (faster). */
export type LookChoice = 'two-look' | 'full';
export interface LastLayerChoice {
  oll: LookChoice;
  pll: LookChoice;
}
export const TWO_LOOK: LastLayerChoice = { oll: 'two-look', pll: 'two-look' };

/** The four stage titles of a CFOP solve: the matching lesson titles. */
export const cfopStageTitles = (choice: LastLayerChoice): string[] => [
  CFOP_STAGES[0].title,
  CFOP_STAGES[1].title,
  CFOP_STAGES[choice.oll === 'full' ? 4 : 2].title,
  CFOP_STAGES[choice.pll === 'full' ? 5 : 3].title,
];
```

(`CFOP_STAGES` gets lessons 5 and 6 in Task 3. Until then, temporarily use the 2-look titles for both choices so this task's tests run. Task 3 switches them.)

In `src/solver/cfop.ts`, `lookAndDo` takes the algorithms instead of a group, and the last-layer stages follow the choice:

```ts
function lookAndDo(
  w: PlanWriter,
  algorithms: readonly CfopAlgorithm[],
  goal: (cube: Cube) => boolean,
  what: string,
): void {
  if (goal(w.cube)) return;
  const found = findCase(w.cube, algorithms, goal);
  if (!found) throw new Error(`Couldn't ${what}.`);
  const title = cardTitle(found.algorithm);
  lineUpAndDo(
    w,
    found,
    `Turn the top to line up the ${title} case.`,
    `${capitalize(what)}: it's the ${title} case, so do its algorithm.`,
  );
}

function yellowTop(w: PlanWriter, choice: LastLayerChoice): void {
  w.startStage(3);
  if (choice.oll === 'full') {
    lookAndDo(w, inSet('OLL'), isYellowFace, 'make the whole top yellow');
    return;
  }
  lookAndDo(w, inGroup(GROUPS.ollEdges), isYellowCross, 'make the yellow cross');
  lookAndDo(w, inGroup(GROUPS.ollCorners), isYellowFace, 'make the whole top yellow');
}

function finishTop(w: PlanWriter, choice: LastLayerChoice): void {
  w.startStage(4);
  if (choice.pll === 'full') {
    lookAndDo(w, inSet('PLL'), lastLayerLinesUp, 'finish the top');
  } else {
    lookAndDo(w, inGroup(GROUPS.pllCorners), topCornersMatchAfterTopTurn, 'put the corners in place');
    lookAndDo(w, inGroup(GROUPS.pllEdges), lastLayerLinesUp, 'put the edges in place');
  }
  const k = TOP_TURNS.findIndex((turn) => isSolved(applyMoves(w.cube, turn)));
  if (k < 0) throw new Error("The cube didn't finish solved.");
  w.step('moves', TOP_TURNS[k], 'Turn the top to line it up. Solved!');
}

/** Work out a CFOP solve: cross, F2L, then OLL and PLL in two looks or one, as chosen. */
export function solveCfop(start: Cube, choice: LastLayerChoice = TWO_LOOK): SolveResult {
  // …as before, with `new PlanWriter(start, cfopStageTitles(choice))`,
  // `yellowTop(w, choice)` and `finishTop(w, choice)`.
}
```

`capitalize` already exists in `src/cube/describe.ts`. Use it in place of the inline `what[0].toUpperCase()…`.

In `src/content/methods.ts`:

```ts
export function solveWith(method: Method, cube: Cube, choice: LastLayerChoice = TWO_LOOK): SolveResult {
  return method === 'cfop' ? solveCfop(cube, choice) : solveBeginner(cube);
}
```

In `src/solver/cfop.measure.test.ts`, run the same 1,000 scrambles with `{ oll: 'full', pll: 'full' }` as well. Report layer turns and Solve-screen steps (min/median/max) for both, plus how many solves needed no OLL and how many no PLL algorithm.

- [ ] **Step 4: Run, typecheck**

Run: `npx vitest run`, then `npm run typecheck`.
Expected: all green. The ③b-1 tests still pass unchanged, because 2-look is the default.

- [ ] **Step 5: Format, commit.** Message: `feat: CFOP solver follows the 2-look or full choice for OLL and PLL`.

---

### Task 3: Lessons 5 and 6, and their examples

**Files:**
- Modify: `src/content/cfop.ts` (lessons), `src/content/beginner.ts` (`StageInfo.fullSet?`), `src/content/demo.ts`, `src/content/demo.test.ts`, `src/content/cfop.test.ts`, `src/content/algorithms.ts`

- [ ] **Step 1: Write the failing tests**

In `src/content/cfop.test.ts`, replace `'every CFOP lesson names algorithms that exist, and every algorithm is in a lesson'`:

```ts
it('six CFOP lessons; together they show every algorithm', () => {
  expect(CFOP_STAGES.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6]);
  const inLessons = new Set(CFOP_STAGES.flatMap((s) => s.algorithmIds));
  expect([...inLessons].sort()).toEqual(CFOP_ALGORITHMS.map((a) => a.id).sort());
  expect(CFOP_STAGES[4].algorithmIds).toEqual(inSet('OLL').map((a) => a.id));
  expect(CFOP_STAGES[5].algorithmIds).toEqual(inSet('PLL').map((a) => a.id));
});
```

Replace `src/content/demo.test.ts`'s CFOP tests:

```ts
it('CFOP: every lesson has real moves to watch', () => {
  CFOP_STAGES.forEach((lesson, i) => {
    expect(demoLesson(i, 'cfop').moves.length, lesson.title).toBeGreaterThan(0);
  });
});

it('CFOP: the full OLL and PLL examples use one algorithm each', () => {
  const ids = (i: number) =>
    demoLesson(i, 'cfop').steps.flatMap((s) => (s.step.algorithmId ? [s.step.algorithmId] : []));
  expect(ids(4)).toHaveLength(1);
  expect(ids(5)).toHaveLength(1);
});
```

(`demoLesson` returns `{ start, moves, steps }`; `steps` is the `PlannedStep[]` of that stage.)

- [ ] **Step 2: Run and watch them fail.** Run: `npx vitest run src/content`. Expected: FAIL (4 lessons; `demoLesson` doesn't exist).

- [ ] **Step 3: Implement**

`StageInfo` (in `beginner.ts`) gains `fullSet?: boolean`: when set, the lesson's cards are grouped by their full-set group.

Add to `CFOP_STAGES`, after lesson 4:

```ts
{
  number: 5,
  title: 'Yellow top in one look (full OLL)',
  hold: 'Yellow on top.',
  goal: 'The whole top face yellow, with one algorithm.',
  howTo:
    "Instead of two looks, read the whole top at once and do one algorithm: 57 cases. Most people learn a few at a time and use 2-look for the rest. To practise, choose Full for OLL on the Solve screen.",
  tip: 'Mark cases as learning or learned on the Algorithms screen as you go.',
  algorithmIds: inSet('OLL').map((a) => a.id),
  fullSet: true,
},
{
  number: 6,
  title: 'Finish the top in one look (full PLL)',
  hold: 'Yellow on top.',
  goal: 'Solved, with one algorithm and a last turn of the top.',
  howTo:
    'Read the sides of the top layer and do one algorithm: 21 cases. Start with the ones 2-look already taught you (T, Y, Ua, Ub, H and Z). To practise, choose Full for PLL on the Solve screen.',
  algorithmIds: inSet('PLL').map((a) => a.id),
  fullSet: true,
},
```

`inSet` must be defined before `CFOP_STAGES` in the file; it is, because the data comes first. Then switch `cfopStageTitles` to its final form (Task 2).

`src/content/demo.ts`: cache one plan per method *and* choice, and map each lesson to a plan and a stage:

```ts
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
```

If the demo scramble happens to need no OLL or no PLL algorithm in the full solve (a "skip"), the test fails and says which. Then rule on it (e.g. pick a different fixed demo scramble for CFOP) rather than weakening the test.

`src/content/algorithms.ts`: `AlgorithmInfo` gains `number?: number`, `fullGroup?: string` and `usual?: string`.

- [ ] **Step 4: Run, typecheck, format, commit.** Message: `feat: CFOP lessons for full OLL and full PLL`.

---

### Task 4: Progress saved in this browser

**Files:** Create `src/app/progress.ts`, `src/app/progress.test.ts`

**Interfaces:**
- `type CaseStatus = 'learning' | 'learned'`
- `interface Progress { cases; lessonsDone; lastLayer }`
- `NO_PROGRESS`, `STORAGE_KEY`, `type ProgressStorage`
- `lessonKey(method, number)`
- `parseProgress(text)` and `loadProgress(storage)`, which never throw
- `saveProgress(storage, progress): boolean`
- `browserStorage()`
- `withCaseStatus`, `withLessonDone`, `withLastLayer`, `countStatus`

- [ ] **Step 1: Write the failing test** `src/app/progress.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import {
  NO_PROGRESS,
  STORAGE_KEY,
  countStatus,
  lessonKey,
  loadProgress,
  parseProgress,
  saveProgress,
  withCaseStatus,
  withLastLayer,
  withLessonDone,
  type ProgressStorage,
} from './progress';

/** A pretend browser storage, like a one-sheet workbook. */
function memoryStorage(): ProgressStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
}
const blocked: ProgressStorage = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
};

describe('progress', () => {
  it('saves and loads back exactly', () => {
    const storage = memoryStorage();
    let p = withCaseStatus(NO_PROGRESS, 'oll-sune', 'learned');
    p = withCaseStatus(p, 'f2l-3', 'learning');
    p = withLessonDone(p, lessonKey('beginner', 3), true);
    p = withLastLayer(p, { oll: 'full', pll: 'two-look' });
    expect(saveProgress(storage, p)).toBe(true);
    expect(loadProgress(storage)).toEqual(p);
  });

  it('starts empty when nothing is saved, the text is broken, or storage is blocked', () => {
    expect(loadProgress(memoryStorage())).toEqual(NO_PROGRESS);
    expect(parseProgress('{not json')).toEqual(NO_PROGRESS);
    expect(parseProgress('42')).toEqual(NO_PROGRESS);
    expect(loadProgress(blocked)).toEqual(NO_PROGRESS);
    expect(loadProgress(null)).toEqual(NO_PROGRESS);
    expect(saveProgress(blocked, NO_PROGRESS)).toBe(false);
  });

  it('keeps what it can read and skips the rest', () => {
    const p = parseProgress(
      JSON.stringify({
        cases: { 'oll-sune': 'learned', 'no-such-case': 'learned', 'pll-t': 'mastered' },
        lessonsDone: ['cfop-2', 'cfop-99', 7, 'cfop-2'],
        lastLayer: { oll: 'full', pll: 'sideways' },
      }),
    );
    expect(p).toEqual({
      cases: { 'oll-sune': 'learned' },
      lessonsDone: ['cfop-2'],
      lastLayer: { oll: 'full', pll: 'two-look' },
    });
  });

  it('clearing a mark removes it, and counts add up', () => {
    let p = withCaseStatus(NO_PROGRESS, 'oll-sune', 'learned');
    p = withCaseStatus(p, 'oll-h', 'learning');
    p = withCaseStatus(p, 'oll-h', null);
    expect(p.cases).toEqual({ 'oll-sune': 'learned' });
    expect(countStatus(p, ['oll-sune', 'oll-h', 'oll-pi'])).toEqual({ learning: 0, learned: 1 });
  });

  it('uses one versioned storage entry', () => {
    const storage = memoryStorage();
    saveProgress(storage, NO_PROGRESS);
    expect([...storage.data.keys()]).toEqual([STORAGE_KEY]);
    expect(STORAGE_KEY).toMatch(/\.v1$/);
  });
});
```

- [ ] **Step 2: Run and watch it fail.** `npx vitest run src/app/progress.test.ts`. Expected: FAIL, `./progress` is missing.

- [ ] **Step 3: Implement** `src/app/progress.ts`

```ts
import { CFOP_ALGORITHMS, TWO_LOOK, type LastLayerChoice, type LookChoice } from '../content/cfop';
import { METHODS, STAGES_FOR, type Method } from '../content/methods';

/**
 * What the app remembers in this browser: how far you've got with each algorithm, which
 * lessons you've finished, and your 2-look/full choice. Nothing leaves the device.
 * Reading never fails: anything it can't read (an old format, a hand edit, blocked
 * storage) is skipped and the rest is kept, like a lookup that falls back to blank.
 */

export type CaseStatus = 'learning' | 'learned';

export interface Progress {
  cases: Readonly<Record<string, CaseStatus>>; // by algorithm id; no entry = not started
  lessonsDone: readonly string[]; // lessonKey(...) of each finished lesson
  lastLayer: LastLayerChoice;
}

export const NO_PROGRESS: Progress = { cases: {}, lessonsDone: [], lastLayer: TWO_LOOK };
export const STORAGE_KEY = 'rubiks-cube-app.progress.v1';
export type ProgressStorage = Pick<Storage, 'getItem' | 'setItem'>;

export const lessonKey = (method: Method, number: number) => `${method}-${number}`;

const CASE_IDS = new Set(CFOP_ALGORITHMS.map((a) => a.id));
const LESSON_KEYS = new Set(
  METHODS.flatMap(({ method }) => STAGES_FOR[method].map((s) => lessonKey(method, s.number))),
);
const isStatus = (value: unknown): value is CaseStatus => value === 'learning' || value === 'learned';
const isLook = (value: unknown): value is LookChoice => value === 'two-look' || value === 'full';
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Read saved text. Never throws: unreadable parts fall back to "nothing saved". */
export function parseProgress(text: string | null): Progress {
  if (!text) return NO_PROGRESS;
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return NO_PROGRESS;
  }
  if (!isRecord(data)) return NO_PROGRESS;

  const cases: Record<string, CaseStatus> = {};
  if (isRecord(data.cases)) {
    for (const [id, status] of Object.entries(data.cases)) {
      if (CASE_IDS.has(id) && isStatus(status)) cases[id] = status;
    }
  }
  const lessons = Array.isArray(data.lessonsDone) ? data.lessonsDone : [];
  const lessonsDone = [...new Set(lessons.filter((k): k is string => typeof k === 'string' && LESSON_KEYS.has(k)))];
  const saved = isRecord(data.lastLayer) ? data.lastLayer : {};
  const lastLayer: LastLayerChoice = {
    oll: isLook(saved.oll) ? saved.oll : 'two-look',
    pll: isLook(saved.pll) ? saved.pll : 'two-look',
  };
  return { cases, lessonsDone, lastLayer };
}

export function loadProgress(storage: ProgressStorage | null): Progress {
  try {
    return parseProgress(storage ? storage.getItem(STORAGE_KEY) : null);
  } catch {
    return NO_PROGRESS; // e.g. storage blocked in a private window
  }
}

/** Save; returns false if this browser won't keep it. */
export function saveProgress(storage: ProgressStorage | null, progress: Progress): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

/** This browser's storage, or null if it's switched off. */
export function browserStorage(): ProgressStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function withCaseStatus(p: Progress, id: string, status: CaseStatus | null): Progress {
  const cases = { ...p.cases };
  if (status) cases[id] = status;
  else delete cases[id];
  return { ...p, cases };
}

export function withLessonDone(p: Progress, key: string, done: boolean): Progress {
  const others = p.lessonsDone.filter((k) => k !== key);
  return { ...p, lessonsDone: done ? [...others, key] : others };
}

export const withLastLayer = (p: Progress, lastLayer: LastLayerChoice): Progress => ({ ...p, lastLayer });

export function countStatus(p: Progress, ids: readonly string[]) {
  return {
    learning: ids.filter((id) => p.cases[id] === 'learning').length,
    learned: ids.filter((id) => p.cases[id] === 'learned').length,
  };
}
```

- [ ] **Step 4: Run, typecheck, format, commit.** Message: `feat: save progress in this browser; anything unreadable is skipped`.

---

### Task 5: Case diagrams

**Files:** Create `src/render/caseDiagram.ts`, `src/render/caseDiagram.test.ts`, `src/app/CaseDiagram.tsx`

- [ ] **Step 1: Write the failing test** `src/render/caseDiagram.test.ts`

The expected colors come from how the cube physically turns, so a wrong index fails the test:
- **Solved, held for CFOP** (yellow top, green front, so orange is on the right and red on the left): every strip matches its side.
- **After R:** the front's right column comes up onto the top. The top's front-right square goes to the back. The bottom's front-right square comes to the front.

```ts
import { describe, expect, it } from 'vitest';
import { applyMoves } from '../cube/moves';
import { mustParse } from '../cube/notation';
import { CASE_HOME } from '../content/cfop';
import { topView } from './caseDiagram';

describe('topView (seen from above, back at the top of the picture)', () => {
  it('a solved cube held for CFOP', () => {
    expect(topView(CASE_HOME)).toEqual({
      top: Array(9).fill('Y'),
      back: ['B', 'B', 'B'],
      right: ['O', 'O', 'O'],
      front: ['G', 'G', 'G'],
      left: ['R', 'R', 'R'],
    });
  });

  it('after R: lists run left to right (back, front) and back to front (left, right)', () => {
    const view = topView(applyMoves(CASE_HOME, mustParse('R')));
    expect([2, 5, 8].map((i) => view.top[i])).toEqual(['G', 'G', 'G']);
    expect(view.back).toEqual(['B', 'B', 'Y']);
    expect(view.front).toEqual(['G', 'G', 'W']);
    expect(view.right).toEqual(['O', 'O', 'O']);
    expect(view.left).toEqual(['R', 'R', 'R']);
  });

  it('after U: the front strip shows what was on the right', () => {
    expect(topView(applyMoves(CASE_HOME, mustParse('U'))).front).toEqual(['O', 'O', 'O']);
  });
});
```

- [ ] **Step 2: Run, watch it fail.** `npx vitest run src/render/caseDiagram.test.ts`

- [ ] **Step 3: Implement** `src/render/caseDiagram.ts`

```ts
import { STICKER_SLOTS } from '../cube/geometry';
import type { Color, Cube, Face } from '../cube/types';

/** The top layer seen from above: the top face, and the top row of each side. */
export interface TopView {
  top: Color[]; // 9, row by row, back row first
  back: Color[]; // 3, left to right as seen from above
  right: Color[]; // 3, back to front
  front: Color[]; // 3, left to right
  left: Color[]; // 3, back to front
}

const at = (face: Face, row: number, col: number) =>
  STICKER_SLOTS.find((s) => s.face === face && s.row === row && s.col === col)!.index;

export function topView(cube: Cube): TopView {
  const color = (face: Face, row: number, col: number) => cube.stickers[at(face, row, col)];
  return {
    top: [0, 1, 2].flatMap((row) => [0, 1, 2].map((col) => color('U', row, col))),
    back: [2, 1, 0].map((col) => color('B', 0, col)),
    right: [2, 1, 0].map((col) => color('R', 0, col)),
    front: [0, 1, 2].map((col) => color('F', 0, col)),
    left: [0, 1, 2].map((col) => color('L', 0, col)),
  };
}
```

The column orders above follow the net layout in `src/input/net.ts` (U above F; B to the right of R). The tests decide: if one fails, fix the order there, not the expectation.

- [ ] **Step 4: Implement** `src/app/CaseDiagram.tsx`: a 5×5 SVG grid. The top face is the middle 3×3; each side's strip is a thin bar on its edge.
  - OLL style: a square is yellow if it's yellow, otherwise grey (`#9a9a9a`, the editor's blank color).
  - PLL style: real colors.
  - Colors come from `STICKER_HEX` (`src/render/CubeView.ts`). Move the editor's hex-to-CSS helper (`EnterCubeScreen.tsx` line 29) to `src/render/colors.ts` as `cssColor(color | null)` and use it in both places.
  - `role="img"` and an `aria-label` such as "Top view of OLL 27 (Sune)".

```tsx
export function CaseDiagram({ cube, style, label }: { cube: Cube; style: 'oll' | 'pll'; label: string }) {
  const view = topView(cube);
  const fill = (c: Color) => (style === 'oll' && c !== 'Y' ? cssColor(null) : cssColor(c));
  const cell = 20; // one top square
  const bar = 6; // a side strip's depth
  const size = bar * 2 + cell * 3;
  return (
    <svg className="case-diagram" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      {view.top.map((c, i) => (
        <rect key={`t${i}`} x={bar + (i % 3) * cell} y={bar + Math.floor(i / 3) * cell}
          width={cell} height={cell} fill={fill(c)} stroke="#111" />
      ))}
      {view.back.map((c, i) => (
        <rect key={`b${i}`} x={bar + i * cell} y={0} width={cell} height={bar} fill={fill(c)} stroke="#111" />
      ))}
      {view.front.map((c, i) => (
        <rect key={`f${i}`} x={bar + i * cell} y={bar + 3 * cell} width={cell} height={bar} fill={fill(c)} stroke="#111" />
      ))}
      {view.left.map((c, i) => (
        <rect key={`l${i}`} x={0} y={bar + i * cell} width={bar} height={cell} fill={fill(c)} stroke="#111" />
      ))}
      {view.right.map((c, i) => (
        <rect key={`r${i}`} x={bar + 3 * cell} y={bar + i * cell} width={bar} height={cell} fill={fill(c)} stroke="#111" />
      ))}
    </svg>
  );
}
```

- [ ] **Step 5: Run, typecheck, format, commit.** Message: `feat: flat top-view case diagrams for OLL and PLL`.

---

### Task 6: Algorithms screen, switches, lesson ticks

**Files:**
- Create: `src/app/AlgorithmsScreen.tsx`, `src/app/lastLayer.ts`, `src/app/lastLayer.test.ts`
- Modify: `src/app/App.tsx`, `src/app/SolveScreen.tsx`, `src/app/LearnScreen.tsx`, `src/app/app.css`

- [ ] **Step 1: Write the failing test** for D10, `src/app/lastLayer.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { applyMoves } from '../cube/moves';
import { mustParse } from '../cube/notation';
import { solved } from '../cube/geometry';
import { DEMO_SCRAMBLE } from '../content/beginner';
import { solveCfop } from '../solver/cfop';
import { listSteps } from '../solver/plan';
import { indexAfterChoiceChange } from './lastLayer';

const start = applyMoves(solved(), mustParse(DEMO_SCRAMBLE));
const steps = (oll: 'two-look' | 'full') => {
  const r = solveCfop(start, { oll, pll: 'two-look' });
  if (!r.ok) throw new Error(r.error);
  return listSteps(r.plan);
};

describe('switching 2-look/full mid-solve (D10)', () => {
  const before = steps('two-look');
  const after = steps('full');
  const firstOfStage = (list: typeof before, stage: number) => list.findIndex((s) => s.stageIndex === stage);

  it('keeps your step in the cross or F2L', () => {
    const inF2L = firstOfStage(before, 1) + 1;
    expect(indexAfterChoiceChange(before, after, inF2L)).toBe(inF2L);
  });

  it('goes to the start of the yellow top from anywhere later', () => {
    const late = before.length - 1;
    expect(indexAfterChoiceChange(before, after, late)).toBe(firstOfStage(after, 2));
  });
});
```

- [ ] **Step 2: Implement** `src/app/lastLayer.ts`

```ts
import type { PlannedStep } from '../solver/plan';

const LAST_LAYER = 2; // stage index of the yellow top; the cross and F2L come before it

/** Where to be after switching 2-look/full: the cross and F2L don't change, so stay there. */
export function indexAfterChoiceChange(
  before: readonly PlannedStep[],
  after: readonly PlannedStep[],
  index: number,
): number {
  if (before[index] && before[index].stageIndex < LAST_LAYER) return index;
  return Math.max(0, after.findIndex((s) => s.stageIndex === LAST_LAYER));
}
```

- [ ] **Step 3: Wire up the screens**

- `src/app/App.tsx`
  - `type Screen` gains `'algorithms'`. Tabs: Learn · Algorithms · Solve my cube · Enter my cube · Algorithm player.
  - Progress lives here: `const storage = useMemo(browserStorage, [])`, `const [progress, setProgress] = useState(() => loadProgress(storage))`, and a `canSave` flag from the last `saveProgress`. Save in a `useEffect` on `progress`.
  - Pass `progress` and `onProgressChange={setProgress}` to Learn, Algorithms and Solve. If `canSave` is false, show one hint line: "This browser isn't keeping your progress (for example, in a private window)."
- `src/app/SolveScreen.tsx`
  - When `state.method === 'cfop'`, show two button rows under the method buttons: **OLL: 2-look | Full** and **PLL: 2-look | Full**, styled like `MethodButtons` with `aria-pressed`. The choice comes from `progress.lastLayer`.
  - Switching saves via `withLastLayer` and moves the step with `indexAfterChoiceChange(oldSteps, newSteps, index)` (D10). `newSteps` comes from `listSteps` of `solveWith(method, start, newChoice)`.
  - `solveWith(state.method, start, progress.lastLayer)`.
  - **The stage list now reads the plan's own stage titles** (`result.plan.stages`) instead of `STAGES_FOR`, so it says "full OLL" when chosen.
  - `AlgorithmCard` uses `cardTitle` and shows the `usual` line.
- `src/app/LearnScreen.tsx`
  - `demoLesson(selected, method)` replaces `demoStage`.
  - A **"Mark this lesson done"** checkbox at the end of each lesson (`withLessonDone(progress, lessonKey(method, info.number), checked)`). Stage-list buttons show "✓" after the title when done.
  - `AlgorithmList` groups by `fullGroup ?? group` when `info.fullSet` is true.
  - `AlgorithmCard` shows `cardTitle`, plus, when the card has `usual`, a second line: *Usual version: `…` (written here with face turns only)*.
- `src/app/AlgorithmsScreen.tsx`
  - **Set buttons:** F2L (41) · OLL (57) · PLL (21) · 2-look OLL (10) · 2-look PLL (6).
  - **Count line**, e.g. "Learned 3 of 57 · learning 5" (`countStatus`).
  - **Filter buttons:** All · Not started · Learning · Learned.
  - **Groups:** one `<details>` per `groupIn(a, set)` (open by default for OLL/PLL), holding the cards.
  - **Each card:**
    - the `CaseDiagram` of `caseCube(a.moves)` (OLL style for OLL sets, PLL style for PLL sets, none for F2L);
    - `cardTitle`, the moves and the provenance badge;
    - the `usual` line;
    - three small buttons, **Not started / Learning / Learned**, with `aria-pressed`;
    - a **Watch** button.
  - **One `CubePlayer`** at the top of the screen plays the chosen card: `start = caseCube(a.moves)`, `moves = mustParse(a.moves)`, standard letters. It starts on the first card of the set. Never render a player per card (D8).
  - **Reset:** "Reset my progress" turns into "Really reset? Yes / No" (no browser pop-up), and Yes sets `NO_PROGRESS`.
- `src/app/app.css`: `.case-diagram { width: 72px; height: 72px; }`, a responsive card grid (`grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))`), and status button styles that match `.badge`.

- [ ] **Step 4: Run everything.** `npx vitest run`, then `npm run typecheck`, then `npm run build`. Expected: all green.

- [ ] **Step 5: Check in the browser** (dev server on 5190; hidden-tab rule: yield with MessageChannel ticks, not timers)

1. **Algorithms → OLL:**
   - 57 cards in 14 groups, each with a yellow-only diagram.
   - Mark OLL 27 (Sune) learned, then open **2-look OLL**: Sune shows learned there too.
   - Watch a card: the player shows that case and plays it out.
2. **Algorithms → PLL:** 21 cards with full-color diagrams. The T-perm diagram shows two corners side by side swapped.
3. **Reload the page:** the marks, lesson ticks and the 2-look/full choice are still there.
4. **Solve → CFOP → OLL Full** while on an F2L step: you stay on the same step. Switch while on PLL: you jump to the first yellow-top step. The stage list says "full OLL".
5. **Learn → CFOP:** 6 lessons. Lessons 5 and 6 list their cards by shape group, and the examples animate one algorithm each. Tick a lesson done; ✓ appears in the list.
6. **A private window:** the app works, and shows the "isn't keeping your progress" hint only if storage is actually blocked.

- [ ] **Step 6: Format, commit.** Message: `feat: Algorithms screen, 2-look/full switches, lesson ticks`.

---

### Task 7: Docs, final review, PR

- [ ] **Step 1: Docs**
  - **`CLAUDE.md` Status:** "Phase ③b-2 (full OLL/PLL, Algorithms screen, progress) is built on branch `phase-3b2-algorithms`"; phase ④ (camera) is next.
  - **`docs/decisions-log.md`:** D1–D10 as #35–#44 (D1–D4 "Owner, 2026-10-08"; D5–D10 as the owner rules on them).
  - **`docs/phase-3b2-review-notes.md`:**
    - what to try;
    - the measurements from `cfop.measure.test.ts` (seed, command, figures for 2-look and full);
    - the 10 converted algorithms to check first;
    - the rulings ledger.
- [ ] **Step 2: Final whole-branch review.** Use a fresh reviewer on the most capable model, with this plan's Review Focus verbatim. Fix Critical/Important findings with RED→GREEN tests, and ledger the minors.
- [ ] **Step 3: Push and open the PR against `main`.** The PR body ends with the standard Claude Code line. Merge with **"Create a merge commit"**; the branch deletes itself after merging (repo setting).

---

## Appendix: the 78 OLL/PLL algorithms (for the owner's review)

All are **Proposed** until the owner checks them. "Turns" counts face turns (a half turn counts as one).

| Set | Case | SpeedCubeDB group | Moves (face turns) | Turns | Where it came from |
|---|---|---|---|---|---|
| OLL | OLL 1 | Dot Case | `R U2 R2 F R F' U2 R' F R F'` | 11 | SpeedCubeDB standard |
| OLL | OLL 2 | Dot Case | `R U' R2 D' L F L' D R2 U R'` | 11 | converted from SpeedCubeDB listed alternative `y' R U' R2 D' r U r' D R2 U R'` |
| OLL | OLL 3 | Dot Case | `R' F2 R2 U2 R' F R U2 R2 F2 R` | 11 | SpeedCubeDB listed alternative |
| OLL | OLL 4 | Dot Case | `R' F2 R2 U2 R' F' R U2 R2 F2 R` | 11 | SpeedCubeDB listed alternative |
| OLL | OLL 5 | Square Shapes | `R' F2 L F L' F R` | 7 | SpeedCubeDB listed alternative |
| OLL | OLL 6 | Square Shapes | `F U' R2 D R' U' R D' R2 U F'` | 11 | SpeedCubeDB listed alternative |
| OLL | OLL 7 | Lightning Shapes | `L' U2 L U2 L F' L' F` | 8 | SpeedCubeDB listed alternative |
| OLL | OLL 8 | Lightning Shapes | `R U2 R' U2 R' F R F'` | 8 | SpeedCubeDB listed alternative |
| OLL | OLL 9 | Fish Shapes | `R U R' U' R' F R2 U R' U' F'` | 11 | SpeedCubeDB standard |
| OLL | OLL 10 | Fish Shapes | `R U R' U R' F R F' R U2 R'` | 11 | SpeedCubeDB standard |
| OLL | OLL 11 | Lightning Shapes | `L' R2 B R' B R B2 R' B R' L` | 11 | converted from SpeedCubeDB listed alternative `r' R2 U R' U R U2 R' U M'` |
| OLL | OLL 12 | Lightning Shapes | `F R U R' U' F' U F R U R' U' F'` | 13 | SpeedCubeDB listed alternative |
| OLL | OLL 13 | Knight Move Shapes | `F U R U2 R' U' R U R' F'` | 10 | SpeedCubeDB listed alternative |
| OLL | OLL 14 | Knight Move Shapes | `R' F R U R' F' R F U' F'` | 10 | SpeedCubeDB standard |
| OLL | OLL 15 | Knight Move Shapes | `R' F' R L' U' L U R' F R` | 10 | SpeedCubeDB listed alternative |
| OLL | OLL 16 | Knight Move Shapes | `R' F R U R' U' F' R U' R' U2 R` | 12 | SpeedCubeDB listed alternative |
| OLL | OLL 17 | Dot Case | `R U R' U R' F R F' U2 R' F R F'` | 13 | SpeedCubeDB standard |
| OLL | OLL 18 | Dot Case | `F2 B' D R' D' F' B R U2 R' U' F'` | 12 | converted from SpeedCubeDB listed alternative `y F S' R U' R' S R U2 R' U' F'` |
| OLL | OLL 19 | Dot Case | `R' U2 F R U R' U' F2 U2 F R` | 11 | SpeedCubeDB listed alternative |
| OLL | OLL 20 | Dot Case | `L F R' F' R2 L2 B R B' R' B' R' L` | 13 | converted from SpeedCubeDB standard `r U R' U' M2 U R U' R' U' M'` |
| OLL | OLL 21 | OCLL | `R U R' U R U' R' U R U2 R'` | 11 | kept from 3b-1 |
| OLL | OLL 22 | OCLL | `R U2 R2 U' R2 U' R2 U2 R` | 9 | kept from 3b-1 |
| OLL | OLL 23 | OCLL | `R2 D R' U2 R D' R' U2 R'` | 9 | kept from 3b-1 |
| OLL | OLL 24 | OCLL | `L F R' F' L' F R F'` | 8 | kept from 3b-1 |
| OLL | OLL 25 | OCLL | `F' L F R' F' L' F R` | 8 | kept from 3b-1 |
| OLL | OLL 26 | OCLL | `R U2 R' U' R U' R'` | 7 | kept from 3b-1 |
| OLL | OLL 27 | OCLL | `R U R' U R U2 R'` | 7 | kept from 3b-1 |
| OLL | OLL 28 | All Corners Oriented | `L F R' F' R L' U R U' R'` | 10 | converted from SpeedCubeDB standard `r U R' U' M U R U' R'` |
| OLL | OLL 29 | Awkward Shapes | `R U R' U' R U' R' F' U' F R U R'` | 13 | SpeedCubeDB standard |
| OLL | OLL 30 | Awkward Shapes | `F U R U2 R' U' R U2 R' U' F'` | 11 | SpeedCubeDB standard |
| OLL | OLL 31 | P Shapes | `R' U' F U R U' R' F' R` | 9 | SpeedCubeDB standard |
| OLL | OLL 32 | P Shapes | `L U F' U' L' U L F L'` | 9 | SpeedCubeDB listed alternative |
| OLL | OLL 33 | T Shapes | `R U R' U' R' F R F'` | 8 | SpeedCubeDB standard |
| OLL | OLL 34 | C Shapes | `R U R2 U' R' F R U R U' F'` | 11 | SpeedCubeDB standard |
| OLL | OLL 35 | Fish Shapes | `R U2 R2 F R F' R U2 R'` | 9 | SpeedCubeDB standard |
| OLL | OLL 36 | W Shapes | `L' U' L U' L' U L U L F' L' F` | 12 | SpeedCubeDB standard |
| OLL | OLL 37 | Fish Shapes | `F R U' R' U' R U R' F'` | 9 | SpeedCubeDB standard |
| OLL | OLL 38 | W Shapes | `R U R' U R U' R' U' R' F R F'` | 12 | SpeedCubeDB standard |
| OLL | OLL 39 | Lightning Shapes | `L F' L' U' L U F U' L'` | 9 | SpeedCubeDB standard |
| OLL | OLL 40 | Lightning Shapes | `R' F R U R' U' F' U R` | 9 | SpeedCubeDB standard |
| OLL | OLL 41 | Awkward Shapes | `R U R' U R U2 R' F R U R' U' F'` | 13 | SpeedCubeDB standard |
| OLL | OLL 42 | Awkward Shapes | `R' U' R U' R' U2 R F R U R' U' F'` | 13 | SpeedCubeDB standard |
| OLL | OLL 43 | P Shapes | `R' U' F' U F R` | 6 | SpeedCubeDB standard |
| OLL | OLL 44 | P Shapes | `F U R U' R' F'` | 6 | SpeedCubeDB listed alternative |
| OLL | OLL 45 | T Shapes | `F R U R' U' F'` | 6 | SpeedCubeDB standard |
| OLL | OLL 46 | C Shapes | `R' U' R' F R F' U R` | 8 | SpeedCubeDB standard |
| OLL | OLL 47 | L Shapes | `F' L' U' L U L' U' L U F` | 10 | SpeedCubeDB standard |
| OLL | OLL 48 | L Shapes | `F R U R' U' R U R' U' F'` | 10 | SpeedCubeDB standard |
| OLL | OLL 49 | L Shapes | `R B' R2 F R2 B R2 F' R` | 9 | SpeedCubeDB listed alternative |
| OLL | OLL 50 | L Shapes | `R' F R2 B' R2 F' R2 B R'` | 9 | SpeedCubeDB listed alternative |
| OLL | OLL 51 | Line Shapes | `F U R U' R' U R U' R' F'` | 10 | SpeedCubeDB listed alternative |
| OLL | OLL 52 | Line Shapes | `R' F' U' F U' R U R' U R` | 10 | SpeedCubeDB standard |
| OLL | OLL 53 | L Shapes | `L' B' R B' R' B R B' R' B2 L` | 11 | converted from SpeedCubeDB standard `r' U' R U' R' U R U' R' U2 r` |
| OLL | OLL 54 | L Shapes | `L F R' F R F' R' F R F2 L'` | 11 | converted from SpeedCubeDB standard `r U R' U R U' R' U R U2 r'` |
| OLL | OLL 55 | Line Shapes | `R U2 R2 U' R U' R' U2 F R F'` | 11 | SpeedCubeDB standard |
| OLL | OLL 56 | Line Shapes | `L F L' U R U' R2 L F R F2 L'` | 12 | converted from SpeedCubeDB listed alternative `r U r' U R U' R' M' U R U2 r'` |
| OLL | OLL 57 | All Corners Oriented | `R U R' U' R' L F R F' L'` | 10 | converted from SpeedCubeDB standard `R U R' U' M' U R U' r'` |
| PLL | Aa | Adj Swap | `R' F R' B2 R F' R' B2 R2` | 9 | converted from SpeedCubeDB standard `x R' U R' D2 R U' R' D2 R2 x'` |
| PLL | Ab | Adj Swap | `R' B' R U' R D R' U R D' R2 B R` | 13 | SpeedCubeDB listed alternative |
| PLL | E | Opp Swap | `R' U' R' D' R U' R' D R U R' D' R U R' D R2` | 17 | SpeedCubeDB listed alternative |
| PLL | F | Adj Swap | `R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R` | 18 | SpeedCubeDB standard |
| PLL | Ga | Adj Swap | `R2 U R' U R' U' R U' R2 D U' R' U R D'` | 15 | SpeedCubeDB standard |
| PLL | Gb | Adj Swap | `R' U' R U D' R2 U R' U R U' R U' R2 D` | 15 | SpeedCubeDB standard |
| PLL | Gc | Adj Swap | `R2 U' R U' R U R' U R2 D' U R U' R' D` | 15 | SpeedCubeDB standard |
| PLL | Gd | Adj Swap | `R U R' U' D R2 U' R U' R' U R' U R2 D'` | 15 | SpeedCubeDB standard |
| PLL | H | EPLL | `R2 U2 R U2 R2 U2 R2 U2 R U2 R2` | 11 | kept from 3b-1 |
| PLL | Ja | Adj Swap | `R' U L' U2 R U' R' U2 R L` | 10 | SpeedCubeDB standard |
| PLL | Jb | Adj Swap | `R U R' F' R U R' U' R' F R2 U' R'` | 13 | SpeedCubeDB standard |
| PLL | Na | Opp Swap | `R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'` | 21 | SpeedCubeDB standard |
| PLL | Nb | Opp Swap | `R' U R U' R' F' U' F R U R' F R' F' R U' R` | 17 | SpeedCubeDB standard |
| PLL | Ra | Adj Swap | `R U' R' U' R U R D R' U' R D' R' U2 R'` | 15 | SpeedCubeDB standard |
| PLL | Rb | Adj Swap | `R' U2 R U2 R' F R U R' U' R' F' R2` | 13 | SpeedCubeDB standard |
| PLL | T | Adj Swap | `R U R' U' R' F R2 U' R' U' R U R' F'` | 14 | kept from 3b-1 |
| PLL | Ua | EPLL | `R U' R U R U R U' R' U' R2` | 11 | kept from 3b-1 |
| PLL | Ub | EPLL | `R2 U R U R' U' R' U' R' U R'` | 11 | kept from 3b-1 |
| PLL | V | Opp Swap | `R' U R' U' R D' R' D R' U D' R2 U' R2 D R2` | 16 | SpeedCubeDB standard |
| PLL | Y | Opp Swap | `F R U' R' U' R U R' F' R U R' U' R' F R F'` | 17 | kept from 3b-1 |
| PLL | Z | EPLL | `R' U' R U' R U R U' R' U R U R2 U' R' U` | 16 | kept from 3b-1 |

## Self-review notes (plan author)

- **Spec coverage:**
  - §3.2 full OLL 57 / PLL 21 with enumeration → Task 1
  - §9 "learner picks 2-look or full per set; the solver uses whichever is chosen" → Tasks 2 and 6
  - §3.6 Algorithms screen (diagram, algorithm, 3D animation, provenance, learning/learned) → Tasks 5 and 6
  - §3.6 Learn CFOP track "→ full OLL → full PLL" → Task 3
  - §2 / §3.6 progress in `localStorage` → Task 4
  - §3.4 top-down case diagrams → Task 5
- **Not in this plan:** PLL arrows on diagrams; a recognition drill and timer (spec §12, future ideas); the open ③a/③b-1 owner questions (cross edge-by-edge vs whole; the three search-found F2L algorithms), which don't change this plan's code.
- **Types:** these names are the same in every task:
  - `CfopAlgorithm` (with `number`, `fullGroup`, `usual`), `inSet`, `groupIn`, `cardTitle`, `caseCube`, `CASE_HOME`
  - `LastLayerChoice`, `LookChoice`, `TWO_LOOK`, `cfopStageTitles`
  - `solveCfop(start, choice)`, `solveWith(method, cube, choice)`
  - `demoLesson`, `Progress`, `lessonKey`, `topView`, `indexAfterChoiceChange`
