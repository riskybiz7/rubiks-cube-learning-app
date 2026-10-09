# Phase ④: Guided Camera Scan Implementation Plan

> Steps use checkbox (`- [ ]`) syntax for tracking. Each part ends in its own pull request.

**Goal:** scan your own cube with a phone or computer camera, one face at a time, and land on
the existing review map with every square filled in. The app goes online first, so the
camera works on an iPhone.

**What the owner reviews first:**
- the proposed decisions **D6–D19**;
- the three **open questions** at the end of the Decisions section;
- the exact **CLAUDE.md wording** and **README draft** in Task 1.

The code sections are for the build; they don't need a line-by-line read.

**How phase ④ is split (D6):**

| Part | Delivers | Ends with |
|---|---|---|
| **④a Online** | Pre-public cleanup, automatic publishing to GitHub Pages | PR #6; the repo goes public; a live link that opens on your iPhone |
| **④b Camera and test mode** | The guided scanner (behind a special link for now), test mode that saves each scan as a file, the measuring script | PR #7; you can start taking test scans |
| **④c Tune and measure** | Tuning on test batch A, accuracy measured on batch B, the scanner switched on for everyone | Its own plan, written once batch A exists |

**Architecture:**
- `src/vision/` holds the scanner's logic as small pure modules (no screen code), each tested
  in Node with synthetic pictures:
  - `color.ts` reads 9 colors from the grid picture;
  - `guide.ts` holds the 6 guided steps;
  - `sort.ts` sorts the 54 readings into 9 of each color;
  - `assemble.ts` puts the faces together and fixes mistakes in how the cube was held;
  - `watch.ts` decides when a face is steady enough to take;
  - `testScan.ts` handles the test-scan file format and scoring.
- `src/vision/camera.ts` is the only part that touches the camera.
- `src/app/ScanScreen.tsx` is the screen. It ends by filling in the existing editor, which
  becomes the review map.
- No OpenCV.js (D7). The grid is fixed on screen, so the app only reads the colors inside
  known squares.

**Tech Stack:** TypeScript 7 (strict), React 19, Vite 8, Vitest 5, Three.js (unchanged),
Prettier. The browser's camera API (`getUserMedia`) and canvas. GitHub Actions and GitHub
Pages for publishing.

**Spec:** `docs/superpowers/specs/2026-09-27-cube-learning-app-design.md` (§2, §3.5, §6, §7, §10, §11)

## Decisions

### Made by the owner (2026-10-08 and 2026-10-09, before this plan was written)

| # | Decision | Notes |
|---|---|---|
| D1 | **Guided scan:** one face at a time, lined up with a grid on screen, not free-form | Replaces decision #6. In spec §6, per-frame steps 1, 2 and 5 (find a face anywhere, straighten it, any order) go away |
| D2 | **Online: public repo + GitHub Pages.** No paid subscriptions | Camera-test files stay off GitHub; only results are published. The repo goes public only after this plan is approved and Task 1's checklist is done, and only on your go (Task 3) |
| D3 | **Before going public:** reword `CLAUDE.md` line 110. **New commits carry no Claude co-author line** | The 71 existing commits keep theirs (no history rewrite, as with the photos) |
| D4 | **Sharing progress between phone and PC: later**, not in phase ④ | Each device keeps its own progress |
| D5 | **Test set taken through the app** (test mode), after the camera screen exists | Truth comes from a scramble (D15), so you don't type anything in |

### Proposed in this plan (for the owner to confirm)

| # | Decision | Why | Cost if wrong |
|---|---|---|---|
| D6 | **Three parts:** ④a Online, ④b Camera and test mode, ④c Tune and measure (table above) | Test scans need the camera live on your iPhone. That needs the code on `main` and published, because GitHub Pages publishes one branch only. ④a also lets you do the phone-layout check from decision #22 straight away | One more PR to review |
| D7 | **No OpenCV.js** (changes spec §2 and §6). Colors are read straight from the camera picture in plain TypeScript | With a fixed grid there's nothing to find or straighten. It avoids a large download, and every step can be tested in Node | If ④c shows faces need finding or straightening, OpenCV.js can still be added then |
| D8 | **Scan order and holds:** green facing the camera (white on top) → **SPIN LEFT** three times (red, blue, orange) → **SPIN LEFT** once more, then **TIP FORWARD** (white, green at the bottom) → **TIP TWICE** (yellow, green at the top) | It uses the app's existing words (decisions #28, #31) and matches "How to read each face" on Enter my cube. **Proven:** after each hold, the camera's view equals that face exactly as the app stores it (200 scrambles, see below) | None |
| D9 | **Taking a face:** automatic once the picture holds steady for a short moment (0.7 s to start, tuned in ④c), is bright enough, and isn't a face already scanned. A **Take it now** button overrides all three; **Redo last face** steps back | Hands-free on a phone. The repeat check stops the one mistake nothing can fix later: scanning the same face twice | If auto-capture feels jumpy, ④c changes the timing or makes it button-only |
| D10 | **Sorting colors:** the cube's own 6 centers are the reference for each color under your light. Each square takes its closest center's color. Then, while any color has more than 9, the square that costs least to move goes to a color with fewer than 9 (like the check's "10 reds and 8 oranges"). Close calls and moved squares are marked **unsure** | It does spec §6's "red/orange fix" with a rule you can follow by hand. A full best-overall optimizer (like Excel Solver's assignment model) is harder to read | If the test scans show the simple rule picks wrong where an optimizer would pick right, ④c switches |
| D11 | **Fixing how the cube was held**, only if the scanned cube fails the checks: (a) put each face where its center says, which fixes a SPIN or TIP made the other way; (b) try all 4,096 ways of turning the faces (spec §6) and use the version with the fewest turned faces, but only if exactly one passes. Several → no guess; a note asks you to check | Common slips get fixed without a rescan. **Measured:** all 4,096 take 50 ms. **Honest limit:** 1 in 3,600 deliberately turned faces still passed the checks (see below). A face held turned can, very rarely, give a different real cube that no check can catch | Rare. ④c measures how often it happens on real scans |
| D12 | **Where it lives:** a **Scan with camera** button on Enter my cube. The scan ends back there, filled in, with unsure squares shown by a dashed outline and "?"; then **Check my cube** as today. While scanning, a flat 6-face map fills in (spec §6 said a 3D preview; screen space on a phone is tight, and the 3D view is on the review screen). **In ④b the button only shows when the link ends in `?scan`**; ④c shows it to everyone once you accept the accuracy | No accuracy is claimed before it's measured | None |
| D13 | **Cameras:** phones use the back camera. Computers use the webcam, shown mirror-image so it feels natural, but colors are always read from the un-mirrored picture. The camera turns off as soon as you leave the scan screen. No switch-camera button in ④b | Simple, and it covers your iPhone and the family's laptops | If someone needs the front camera on a phone, add a switch later |
| D14 | **Test-mode file:** for each face, the exact 150×150 pixels the scanner read, plus a JPEG to look at. It also records the scramble, the light, the camera, the device and the app's answer. One JSON file per scan (estimated 0.8 MB). Saved through the share sheet on an iPhone (Save to Files, Mail…) or as a download on a computer. On the PC it goes in `reference/camera-test/batch-a/` or `batch-b/`, gitignored | The measurement on the PC re-reads exactly what the phone saw, with the same code | None |
| D15 | **Truth comes from the scramble:** start from a solved cube, held white on top with green facing you, do the app's 15-move scramble, then scan. A scan whose answer is a real cube but not the scrambled one is **set aside** as a likely scrambling slip and listed separately, never dropped silently | No typing, and nothing is judged by eye. 15 moves instead of 25 makes slips less likely and still mixes the colors | A slip combined with misreads counts against the scanner (the cautious direction) |
| D16 | **Test set:** two batches of 8 scans each. Each batch: iPhone back camera × daylight / lamp / dim × 2 scrambles (6 scans), plus PC webcam × daylight / lamp (2 scans). ④c tunes on **batch A only**; the reported accuracy comes from **batch B**. If tuning changes after batch B is measured, a new batch is needed for any reported figure. **Save every scan, good or bad** | Tuning and measuring on the same scans would flatter the result | About 25 minutes of your time per batch (estimate) |
| D17 | **What gets reported:** squares read right before any fixing (by camera and light); scans needing no fixes; wrong squares that were marked unsure; scans set aside. **No target is promised in advance**; you decide acceptance (spec §10). Suggested bar: in every batch B scan, every wrong square is either marked unsure or caught by Check my cube | Measured, not guessed | None |
| D18 | **Publishing:** GitHub Actions runs every test and builds the app on every pull request. On `main` it also publishes to **https://riskybiz7.github.io/rubiks-cube-learning-app/**. Progress saved on the live site is separate from progress on localhost | Free for public repos. A broken build or failing test never gets published | None |
| D19 | **README refresh before going public.** It still says "Status: design phase". New: what the app does, the live link, how it's checked, how to run it. No accuracy claims until ④c | A recruiter may read it first | Draft in Task 1 |

### Open questions for the owner (answered 2026-10-09; plan approved the same day)

1. **PR descriptions** keep the "🤖 Generated with Claude Code" footer (owner: "leave it like
   that").
2. **License: MIT**, copyright "Michael Riskind" (the name already on the commits). Added in
   Task 1, Step 3b.
3. **The CLAUDE.md wording** in Task 1, Step 2: approved as written.

## Source and checks (run while writing this plan)

**A throwaway test (deleted afterwards, never committed), run 2026-10-09 against the cube model:**
- **Holds (D8):** 200 scrambles of 25 face turns (`seededRandom(4)`). For every step, the
  front face after the step's whole-cube turns (`''`, `y`, `y2`, `y'`, `x'`, `x`) equals the
  target face (F, R, B, L, U, D) read row by row. All 1,200 matched.
- **Turned faces (D11):** 200 scrambles × 6 faces × 3 turns = 3,600 cubes with one face's
  squares turned. **1 of 3,600 still passed the checks.**
- **Speed (D11):** all 4,096 face-turn combinations on one scrambled cube took **50 ms**, and
  exactly 1 passed (the real one).
- **Color math:** sRGB white → Lab L 100.000, a 0.005, b −0.010. Red → L 53.233, a 80.109,
  b 67.220 (the commonly published values are about 53.24, 80.09, 67.20).

**GitHub Actions versions** (latest releases, GitHub API, 2026-10-09): `actions/checkout`
v7.0.1, `actions/setup-node` v7.1.0, `actions/upload-pages-artifact` v5.0.0,
`actions/deploy-pages` v5.0.1. Node on this PC: v24.19.0.

**Repo facts** (2026-10-09):
- 71 commits; all 71 carry a Claude co-author line.
- Every author and committer email is GitHub's no-reply address.
- The only "new to coding" wording is `CLAUDE.md:110`.
- No issues; one remote branch (`main`); repo private.
- 237 tests passing, 2 measurement tests skipped by design.

## Global Constraints

- User-facing text says **"squares"**, never "stickers".
- **No accuracy figure anywhere** (README, screens, notes) until ④c measures one on batch B.
  Accuracy is reported only from `reference/camera-test/`.
- **Privacy:** camera pictures stay in memory and are dropped when the scan ends. Nothing
  leaves the device, except a test file the user chooses to save.
- `src/vision/` modules are pure (no DOM, no React), except `camera.ts`.
- **Commits:** no Claude co-author line (D3). `npm run typecheck` passes before every commit.
  Run `npx prettier --write` on changed files. Run `git status`, then stage explicit paths
  (never `git add -A`). Write the message to a file and commit with `git commit -F`.
- **Windows PowerShell 5.1:** no `&&`; quote the path (`Rubik's Cube`). Change files with the
  Write/Edit tools (encoding gotcha).
- **Branches:** ④a `phase-4a-online` from `main`. ④b `phase-4b-camera` from `main` after PR #6
  is merged.

## Review Focus

1. **The holds (D8):** the test proves each step's view equals the stored face, and that the
   on-screen words lead from one hold to the next.
2. **Slips while scanning (D11):** SPIN RIGHT instead of LEFT, TIP BACK instead of FORWARD,
   tipping without spinning back to green. Each has a test that ends at the right cube.
3. **Camera trouble:** permission refused, an `http://` address, no camera. Each shows a plain
   message and offers entering the cube by hand. The camera stops when you leave the screen.
4. **Mirroring (D13):** on the PC webcam, the dots sit on the squares you see, and the map
   matches the real cube. You check this by eye; test scans confirm it.
5. **Test-file round trip:** save, then re-read on the PC; the score matches what the phone
   showed.
6. **Going public:** nothing private (secret scan, camera-test files ignored, photos already
   checked 2026-10-08).

---

## File map

| File | Part | Status | Job |
|---|---|---|---|
| `CLAUDE.md`, `README.md` | ④a | Modify | Reword line 110, no-co-author rule, status, live link; README refresh |
| `LICENSE` | ④a | Create | MIT, copyright Michael Riskind |
| `.gitignore` | ④a | Modify | Keep camera-test files off GitHub |
| `vite.config.ts` | ④a | Modify | `base: './'` so the built app works under `/rubiks-cube-learning-app/` |
| `.github/workflows/publish.yml` | ④a | Create | Test on every PR; test, build and publish on `main` |
| `docs/decisions-log.md`, spec | ④a | Modify | Decisions #50–#68; spec §2, §3, §6, §10, §11 |
| `docs/phase-4a-review-notes.md` | ④a | Create | What to try on the live link |
| `src/test-utils/frames.ts` | ④b | Create | Synthetic grid pictures for tests |
| `src/vision/color.ts` (+ test) | ④b | Create | Lab colors, `readFace`, starting guesses |
| `src/vision/guide.ts` (+ test) | ④b | Create | The 6 guided steps |
| `src/vision/sort.ts` (+ test) | ④b | Create | Name the centers; 9 of each color; unsure squares |
| `src/vision/assemble.ts` (+ test) | ④b | Create | Faces → cube; fix holding slips |
| `src/vision/pipeline.ts` | ④b | Create | `readCube(frames)`: pictures in, cube out |
| `src/vision/watch.ts` (+ test) | ④b | Create | Steady, too dark, already scanned |
| `src/vision/testScan.ts` (+ test) | ④b | Create | Test-scan file format, truth from scramble, scoring |
| `src/vision/measure.test.ts` | ④b | Create | Accuracy table from `reference/camera-test/` (skipped by default) |
| `src/vision/camera.ts` | ④b | Create | Start/stop the camera; grab the grid area |
| `src/app/ScanScreen.tsx` | ④b | Create | The guided scan screen, incl. test mode |
| `src/app/EnterCubeScreen.tsx`, `App.tsx`, `app.css` | ④b | Modify | Scan button, unsure marks, the scan screen |
| `reference/camera-test/README.md` | ④b | Modify | How to take test scans |
| `docs/phase-4b-review-notes.md` | ④b | Create | What to try; checks done |

---

# Part ④a: Online

### Task 1: Pre-public cleanup

**Files:** `CLAUDE.md`, `README.md`, `.gitignore`

- [ ] **Step 1: Branch** (already done when this plan was committed)

```powershell
Set-Location "C:\Users\micha\Claude\Projects\Rubik's Cube"; git checkout main; git pull; git checkout -b phase-4a-online
```

- [ ] **Step 2: Reword `CLAUDE.md` line 110** (D3). From:

> - Beginner in code (some Python/SQL). Explain syntax choices briefly and lead with the concept. Spreadsheet analogies work well.

to:

> - Strong in Excel financial modeling; newer to Python and SQL. Explain syntax choices briefly and lead with the concept. Spreadsheet analogies work well.

In the same section add: "- Commits carry **no** Claude co-author line (owner, 2026-10-09)." In
the Stack line, replace "OpenCV.js (camera, phase 4) is not installed yet" with "No OpenCV.js:
the guided scan reads colors directly (decision #56)".

- [ ] **Step 3: README** (D19). Replace the whole file with:

````markdown
# Rubik's Cube learning app

Learn to solve a 3x3 Rubik's Cube, from your first solve to full CFOP.

**Try it:** https://riskybiz7.github.io/rubiks-cube-learning-app/

- **Beginner method:** the daisy method in 10 stages, in plain English, with a 3D cube that
  shows every move.
- **CFOP:** the cross, all 41 F2L cases, 2-look and full OLL (57 cases) and PLL (21 cases),
  with case diagrams and learning marks.
- **Solve my cube:** enter your own scrambled cube square by square. The app checks that it's
  a real cube, then walks you through solving it step by step.
- **Camera scanning:** in progress.

Everything runs in your browser. There are no accounts, and progress is saved on your device only.

## How it's checked

- Every algorithm has an automated test that sets up its case, applies it and confirms the result.
- Tests prove that each F2L, OLL and PLL set covers every possible case exactly once.
- Before a solve is shown, every move is replayed on your cube. If it doesn't end solved, the
  app shows an error instead.

## Run it yourself

Needs [Node.js](https://nodejs.org/). In the project folder:

| Command | What it does |
|---|---|
| `npm install` | Install what the app needs (once) |
| `npm run dev` | Start the app at http://localhost:5190 |
| `npm test` | Run all tests |
| `npm run build` | Build the app for publishing into `dist/` |

## Folders

| Folder | Contents |
|---|---|
| `src/cube/` | The cube model: moves, notation, checks |
| `src/content/` | Lessons and algorithms, as data |
| `src/solver/` | Step-by-step solvers for both methods |
| `src/render/` | The 3D cube and case diagrams |
| `src/input/`, `src/vision/` | Entering a cube by hand, and the camera scanner |
| `src/app/` | The screens |
| `docs/` | Design spec, decisions log, build plans and review notes |
| `reference/` | Photos of the beginner method; notes for the camera tests |
````

- [ ] **Step 3b: License.** Create `LICENSE` with the standard MIT text, "Copyright (c) 2026
  Michael Riskind", and end the README with a "License" section: "MIT. See `LICENSE`."

- [ ] **Step 4: Keep camera-test files off GitHub.** Add to `.gitignore`:

```gitignore
# Camera test scans stay on this PC; only the results are published (phase 4, D2)
reference/camera-test/*
!reference/camera-test/README.md
```

- [ ] **Step 5: Secret scan before going public**

```bash
git log -p --all | grep -inE "api[_-]?key|secret|passw|token|BEGIN (RSA|OPENSSH|PRIVATE)|sk-[a-z0-9]{20}" | head -40
git log --all --name-only --format= | sort -u | grep -iE "(^|/)\.env|\.pem$|\.key$"
```

Review every hit by hand. Expected: only words in docs, such as "token" in prose. If anything
real turns up, **stop** and tell the owner before going further.

- [ ] **Step 6: Commit**

```powershell
git status
git add CLAUDE.md README.md LICENSE .gitignore
git commit -F <message file>   # "docs: pre-public cleanup (README, CLAUDE.md wording, camera-test ignore)"
```

---

### Task 2: Publish with GitHub Pages

**Files:** `vite.config.ts`, `.github/workflows/publish.yml`

- [ ] **Step 1: Relative paths in the build.** In `vite.config.ts`, add `base: './'`. The site
  lives at `/rubiks-cube-learning-app/`, not at the root. Relative paths work there and on
  localhost alike (the app has no page addresses of its own; tabs are React state).

```ts
export default defineConfig({
  plugins: [react()],
  // Relative paths, so the built app works under GitHub Pages' /rubiks-cube-learning-app/.
  base: './',
  // Its own port, so it doesn't collide with other projects' dev servers on the default 5173.
  server: { port: 5190 },
  ...
```

- [ ] **Step 2: Check the build uses relative paths**

```powershell
npm run build; Select-String -Path dist/index.html -Pattern 'src="\./assets/'
```

Expected: one match (the script tag).

- [ ] **Step 3: Create `.github/workflows/publish.yml`**

```yaml
# Runs every test on each pull request. On main it also builds the app and publishes it
# to GitHub Pages (https://riskybiz7.github.io/rubiks-cube-learning-app/).
name: Test and publish

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - if: github.ref == 'refs/heads/main'
        uses: actions/upload-pages-artifact@v5
        with:
          path: dist

  publish:
    if: github.ref == 'refs/heads/main'
    needs: test-and-build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    concurrency:
      group: pages
      cancel-in-progress: false
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 4: Commit** (`vite.config.ts`, `.github/workflows/publish.yml`):
  "feat: publish to GitHub Pages from main; run tests on every PR".

---

### Task 3: Docs, PR #6, going public

- [ ] **Step 1: Docs**
  - Decisions log: add #50–#68 (= D1–D19 of this plan), newest first like #35–#49. Mark #6
    as replaced by #50.
  - Spec: §2 Vision row (no OpenCV.js, #56); §3 module list (`vision/` = guided scanner); §6
    rewritten for the guided scan (D1, D8–D13); §10 phase ④ row (④a/④b/④c); §11 hosting row
    marked decided (#51).
  - `CLAUDE.md` status: phase ④ plan approved; ④a in review.
  - `docs/phase-4a-review-notes.md`: what to try (below).
- [ ] **Step 2: Push and open PR #6**. Test plan: the PR's own Actions run passes (tests and
  build).
- [ ] **Step 3: Owner's go.** Then, in this order:
  1. Make the repo public:
     `gh repo edit riskybiz7/rubiks-cube-learning-app --visibility public --accept-visibility-change-consequences`
     (or Settings → General → Danger Zone → Change visibility).
  2. Turn on Pages, published by Actions:
     `gh api -X POST repos/riskybiz7/rubiks-cube-learning-app/pages -f build_type=workflow`.
  3. Merge PR #6 with **Create a merge commit**. The push to `main` runs the workflow, which
     publishes.
- [ ] **Step 4: Check the live link.** The Actions run is green; the address answers 200 and
  has the app's title. Add the live link to `CLAUDE.md` (small commit on `main` via a
  follow-up, or at the start of ④b).
- [ ] **Step 5: Owner, on the iPhone:** open the link. Every tab works. Do the phone-layout
  check (decision #22). Saved progress there starts empty (different address).

---

# Part ④b: Camera and test mode

### Task 4: Branch, test pictures, reading colors

**Files:** create `src/test-utils/frames.ts`, `src/vision/color.ts`, `src/vision/color.test.ts`

- [ ] **Step 1: Branch**

```powershell
Set-Location "C:\Users\micha\Claude\Projects\Rubik's Cube"; git checkout main; git pull; git checkout -b phase-4b-camera
```

- [ ] **Step 2: Write `src/vision/color.ts`**

```ts
import type { Color } from '../cube/types';
import { STICKER_HEX } from '../render/colors';

/**
 * A color in CIELAB ("Lab"): L = lightness (0 black to 100 white), a = green (−) to red (+),
 * b = blue (−) to yellow (+). Lab keeps "how light" (L) apart from "which color" (a, b), so a
 * shadow moves L much more than a and b.
 */
export interface Lab {
  L: number;
  a: number;
  b: number;
}

/** A camera color (red, green, blue, each 0–255) as Lab, by the standard sRGB formulas (D65 white). */
export function rgbToLab(red: number, green: number, blue: number): Lab {
  // 1. Undo the screen's brightness curve, so the values add up like real light.
  const linear = (value: number) => {
    const v = value / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const r = linear(red);
  const g = linear(green);
  const b = linear(blue);
  // 2. Mix into X, Y, Z (how the eye's three color sensors respond), relative to daylight white.
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  // 3. A cube-root curve, close to how strongly we see differences.
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);
  return { L: 116 * f(y) - 16, a: 500 * (f(x) - f(y)), b: 200 * (f(y) - f(z)) };
}

/** How different two colors look: the straight-line distance between them in Lab. */
export function labDistance(p: Lab, q: Lab): number {
  return Math.hypot(p.L - q.L, p.a - q.a, p.b - q.b);
}

/** A square picture of the grid area, as the browser hands it over: red, green, blue, alpha, row by row. */
export interface Frame {
  size: number; // width and height, in pixels
  data: ArrayLike<number>; // size × size × 4 numbers, each 0–255
}

/** The grid area is shrunk to this many pixels a side before it's read. */
export const FRAME_SIZE = 150;

/** Only the middle half of each grid cell is read, clear of the black edges between squares. Tuned in ④c. */
export const SAMPLE_FRACTION = 0.5;

function median(values: number[]): number {
  const sorted = [...values].sort((x, y) => x - y);
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * A face's 9 colors, row by row as the camera sees it (not mirrored). Each is the median (middle
 * value) of its cell's middle half, so a glint of light or a small logo doesn't change the answer.
 */
export function readFace(frame: Frame): Lab[] {
  const cell = frame.size / 3;
  const margin = (cell * (1 - SAMPLE_FRACTION)) / 2;
  const readings: Lab[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const reds: number[] = [];
      const greens: number[] = [];
      const blues: number[] = [];
      const top = Math.round(row * cell + margin);
      const bottom = Math.round((row + 1) * cell - margin);
      const left = Math.round(col * cell + margin);
      const right = Math.round((col + 1) * cell - margin);
      for (let y = top; y < bottom; y++) {
        for (let x = left; x < right; x++) {
          const i = (y * frame.size + x) * 4;
          reds.push(frame.data[i]);
          greens.push(frame.data[i + 1]);
          blues.push(frame.data[i + 2]);
        }
      }
      readings.push(rgbToLab(median(reds), median(greens), median(blues)));
    }
  }
  return readings;
}

function hexToLab(hex: number): Lab {
  return rgbToLab(hex >> 16, (hex >> 8) & 0xff, hex & 0xff);
}

/**
 * Starting guesses for how each color looks: the app's own screen colors. Used for the live dots
 * and to name the centers. ④c may replace them with values measured from test batch A.
 */
export const START_GUESSES: Record<Color, Lab> = {
  W: hexToLab(STICKER_HEX.W),
  Y: hexToLab(STICKER_HEX.Y),
  G: hexToLab(STICKER_HEX.G),
  B: hexToLab(STICKER_HEX.B),
  R: hexToLab(STICKER_HEX.R),
  O: hexToLab(STICKER_HEX.O),
};

/** The color whose guess is nearest, and how much further the next nearest is (small gap = close call). */
export function nearestColor(reading: Lab, guesses: Record<Color, Lab>): { color: Color; gap: number } {
  const ranked = (Object.keys(guesses) as Color[])
    .map((color) => ({ color, distance: labDistance(reading, guesses[color]) }))
    .sort((p, q) => p.distance - q.distance);
  return { color: ranked[0].color, gap: ranked[1].distance - ranked[0].distance };
}
```

- [ ] **Step 3: Write `src/test-utils/frames.ts`**

```ts
import { FRAME_SIZE, type Frame } from '../vision/color';

export type Rgb = readonly [number, number, number];

/**
 * A synthetic grid picture for tests: 9 flat-colored cells with dark lines between them, like a
 * cube face lined up with the on-screen grid. `noise` adds up to ± that much to every value.
 */
export function paintFrame(
  cells: readonly Rgb[],
  options: { noise?: number; random?: () => number; size?: number } = {},
): Frame {
  const size = options.size ?? FRAME_SIZE;
  const cell = size / 3;
  const noise = options.noise ?? 0;
  const random = options.random ?? (() => 0.5);
  const data = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inX = x % cell;
      const inY = y % cell;
      const onLine = inX < 3 || inX >= cell - 3 || inY < 3 || inY >= cell - 3;
      const [r, g, b] = onLine ? [12, 12, 12] : cells[Math.floor(y / cell) * 3 + Math.floor(x / cell)];
      const jitter = () => (random() - 0.5) * 2 * noise;
      const i = (y * size + x) * 4;
      data[i] = r + jitter();
      data[i + 1] = g + jitter();
      data[i + 2] = b + jitter();
      data[i + 3] = 255;
    }
  }
  return { size, data };
}

/** Puts a small bright spot (a glint of light) into a frame, top-left corner at (x, y). */
export function addGlint(frame: Frame, x: number, y: number, width = 6): Frame {
  const data = Uint8ClampedArray.from(frame.data);
  for (let dy = 0; dy < width; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const i = ((y + dy) * frame.size + (x + dx)) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
    }
  }
  return { size: frame.size, data };
}
```

- [ ] **Step 4: Write `src/vision/color.test.ts`**, covering:
  - white → L within 0.01 of 100, a and b within 0.02 of 0; black → 0, 0, 0;
  - red → within 0.1 of L 53.24, a 80.09, b 67.20;
  - `labDistance({L:0,a:3,b:4}, {L:0,a:0,b:0}) === 5`, and the same both ways;
  - `readFace` on `paintFrame` of 9 different colors (noise 8, `seededRandom(1)`) gives each
    cell within 2 of its color's Lab, in row-by-row order;
  - a glint inside a cell's sampled area doesn't change that cell's reading by more than 2;
  - `nearestColor(START_GUESSES[c], START_GUESSES)` is `c` for all 6, with a gap above 0.
- [ ] **Step 5:** `npx vitest run src/vision` passes; typecheck; prettier; commit
  ("feat: read a face's 9 colors from the grid picture (Lab, medians)").

---

### Task 5: The guided steps

**Files:** create `src/vision/guide.ts`, `src/vision/guide.test.ts`

- [ ] **Step 1: Write `src/vision/guide.ts`**

```ts
import type { Color, Face } from '../cube/types';

/** One step of the guided scan: which face the camera should see, and how to get there. */
export interface ScanStep {
  face: Face; // the face (named as in the reference hold) that now faces the camera
  center: Color; // its center on a standard cube held white up, green front
  turns: string[]; // whole-cube turns to make first, in the app's words ([] for the first step)
  says: string; // the instruction on screen
  hold: string; // whole-cube turns from the reference hold, in notation (checked by a test)
}

/** Decision D8. The test proves each step's camera view is that face as the app stores it. */
export const SCAN_STEPS: readonly ScanStep[] = [
  {
    face: 'F',
    center: 'G',
    turns: [],
    hold: '',
    says: 'Hold your cube with the white center on top and the green center facing the camera.',
  },
  {
    face: 'R',
    center: 'R',
    turns: ['SPIN LEFT'],
    hold: 'y',
    says: 'SPIN LEFT: keep white on top and turn the cube so red faces the camera.',
  },
  {
    face: 'B',
    center: 'B',
    turns: ['SPIN LEFT'],
    hold: 'y2',
    says: 'SPIN LEFT again: blue faces the camera.',
  },
  {
    face: 'L',
    center: 'O',
    turns: ['SPIN LEFT'],
    hold: "y'",
    says: 'SPIN LEFT again: orange faces the camera.',
  },
  {
    face: 'U',
    center: 'W',
    turns: ['SPIN LEFT', 'TIP FORWARD'],
    hold: "x'",
    says: 'SPIN LEFT once more so green faces the camera, then TIP FORWARD: white faces the camera, with green at the bottom.',
  },
  {
    face: 'D',
    center: 'Y',
    turns: ['TIP TWICE'],
    hold: 'x',
    says: 'TIP TWICE: yellow faces the camera, with green at the top.',
  },
];
```

- [ ] **Step 2: Write `src/vision/guide.test.ts`**, covering:
  - every face appears exactly once;
  - `center === HOME_COLORS[face]` for every step;
  - **the camera view (the key test):** for 200 scrambles (`seededRandom(4)`, 25 face turns),
    the F face of `applyMoves(cube, mustParse(step.hold))` equals `step.face`'s 9 stickers.
    Comment: the F face read row by row is what a camera in front of the cube sees;
  - **the words lead from hold to hold:** for each step, the previous step's `hold` followed
    by each `turns` word's move (looked up in `CUBE_TURN_WORDS` by label, `formatMove`d) gives
    the same 6 centers as `applyMoves(solved(), mustParse(step.hold))`. Each word also appears
    in `says`.
- [ ] **Step 3:** run, typecheck, prettier, commit ("feat: the six guided scan steps, proven
  against the cube model").

---

### Task 6: Sorting into 9 of each color

**Files:** create `src/vision/sort.ts`, `src/vision/sort.test.ts`

- [ ] **Step 1: Write `src/vision/sort.ts`**

```ts
import type { Color } from '../cube/types';
import { labDistance, type Lab } from './color';

const COLORS: readonly Color[] = ['W', 'Y', 'G', 'B', 'R', 'O'];

/** A gap smaller than this between the best and next-best color makes a square unsure. Tuned in ④c. */
export const UNSURE_GAP = 10;

export interface SortedColors {
  colors: Color[]; // 54, in scan order: step 0's 9 squares, then step 1's, …
  unsure: number[]; // scan positions (0–53) that were close calls
}

/** Every ordering of a list (6 colors give 720 orderings). */
function orderings<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]];
  return items.flatMap((first, i) =>
    orderings([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [first, ...rest]),
  );
}

/**
 * Names the 6 centers: tries all 720 ways of giving the 6 colors to the 6 centers and keeps the
 * one closest to the guesses overall. Comparing the centers together copes with colored light:
 * under a warm lamp red and orange both look more orange, but red still looks the redder of the two.
 */
export function nameCenters(centers: readonly Lab[], guesses: Record<Color, Lab>): Color[] {
  let best: Color[] = [...COLORS];
  let bestCost = Infinity;
  for (const order of orderings(COLORS)) {
    const cost = order.reduce((sum, color, i) => sum + labDistance(centers[i], guesses[color]), 0);
    if (cost < bestCost) {
      bestCost = cost;
      best = order;
    }
  }
  return best;
}

/**
 * Sorts all 54 readings into the 6 colors, exactly 9 of each (decision D10, spec §6):
 * 1. Name the centers. Each center is the reference for its color under this light.
 * 2. Every other square takes the color of the center it looks closest to.
 * 3. While a color has more than 9, move the square that costs least to move, from a color with
 *    too many to a color with too few. Like the check's "10 reds and 8 oranges": the red square
 *    that looks most orange becomes orange.
 * Squares moved in step 3, and close calls, are unsure.
 */
export function sortColors(
  faces: readonly (readonly Lab[])[],
  guesses: Record<Color, Lab>,
): SortedColors {
  const readings = faces.flat();
  const centerColors = nameCenters(
    faces.map((face) => face[4]),
    guesses,
  );
  const reference = {} as Record<Color, Lab>;
  centerColors.forEach((color, step) => (reference[color] = faces[step][4]));

  const isCenter = (pos: number) => pos % 9 === 4;
  const distance = (pos: number, color: Color) => labDistance(readings[pos], reference[color]);
  const closestFirst = (pos: number) =>
    [...COLORS].sort((p, q) => distance(pos, p) - distance(pos, q));

  // Steps 1 and 2.
  const colors: Color[] = readings.map((_, pos) =>
    isCenter(pos) ? centerColors[Math.floor(pos / 9)] : closestFirst(pos)[0],
  );

  // Step 3.
  const moved = new Set<number>();
  const count = (color: Color) => colors.filter((c) => c === color).length;
  while (COLORS.some((color) => count(color) > 9)) {
    const tooMany = COLORS.filter((color) => count(color) > 9);
    const tooFew = COLORS.filter((color) => count(color) < 9);
    let best = { pos: -1, to: tooFew[0], cost: Infinity };
    for (let pos = 0; pos < colors.length; pos++) {
      if (isCenter(pos) || !tooMany.includes(colors[pos])) continue;
      for (const to of tooFew) {
        const cost = distance(pos, to) - distance(pos, colors[pos]);
        if (cost < best.cost) best = { pos, to, cost };
      }
    }
    colors[best.pos] = best.to;
    moved.add(best.pos);
  }

  const unsure = colors.flatMap((_, pos) => {
    if (isCenter(pos)) return [];
    if (moved.has(pos)) return [pos];
    const [first, second] = closestFirst(pos);
    return distance(pos, second) - distance(pos, first) < UNSURE_GAP ? [pos] : [];
  });
  return { colors, unsure };
}
```

- [ ] **Step 2: Write `src/vision/sort.test.ts`.** Helper: from a scrambled cube, build the
  6 faces of Lab readings in scan order (`SCAN_STEPS[i].face`), with each color looking like
  `START_GUESSES[color]` plus seeded noise and an optional overall shift (colored light).
  Cover:
  - a clean scan (noise 2) sorts exactly to the cube's colors, with nothing unsure;
  - warm light (every reading shifted by a +8, b +15) still sorts exactly;
  - two orange squares read halfway to red, slightly on the red side, become orange again.
    Both are marked unsure;
  - 100 noisy scans (noise 15, `seededRandom(7)`) always end with exactly 9 of each color,
    and centers are never changed;
  - `nameCenters` on the 6 guesses in a shuffled order returns that order.
- [ ] **Step 3:** run, typecheck, prettier, commit ("feat: sort the 54 readings into 9 of each
  color, using the cube's own centers").

---

### Task 7: Putting the cube together

**Files:** create `src/vision/assemble.ts`, `src/vision/assemble.test.ts`, `src/vision/pipeline.ts`

- [ ] **Step 1: Write `src/vision/assemble.ts`**

```ts
import { HOME_COLORS } from '../cube/geometry';
import { FACES, type Color, type Face } from '../cube/types';
import { validateStickers } from '../cube/validate';
import { SCAN_STEPS } from './guide';
import type { SortedColors } from './sort';

export interface AssembledCube {
  stickers: Color[]; // 54, in the app's sticker order (U R F D L B, each read row by row)
  unsure: number[]; // sticker indices to mark on the review map
  note: string | null; // set when the app had to fix how a face was held
}

export const NOTE_REORDERED =
  'The cube seems to have been turned the other way at one step, so the app put each face where its center belongs.';
export const NOTE_TURNED =
  'One or more faces seemed to be held turned, so the app turned them back. Check the squares against your cube.';
export const NOTE_UNSURE_TURN =
  "Some faces may have been held turned, and the app couldn't tell which way. Check the squares against your cube.";

/** A face's 9 squares turned a quarter turn clockwise, as the camera sees it. Works on any list of 9. */
export function turnFace<T>(nine: readonly T[]): T[] {
  return nine.map((_, i) => nine[(2 - (i % 3)) * 3 + Math.floor(i / 3)]);
}

/**
 * For each of the 54 sticker places, which scanned square (scan position 0–53) goes there.
 * Moving positions instead of colors lets the unsure marks travel with their squares.
 */
type Placement = number[];

function placeSteps(faceOfStep: readonly Face[]): Placement {
  const placement: Placement = new Array(54);
  faceOfStep.forEach((face, step) => {
    const f = FACES.indexOf(face);
    for (let k = 0; k < 9; k++) placement[f * 9 + k] = step * 9 + k;
  });
  return placement;
}

/** Step i is face SCAN_STEPS[i].face, as the user was told. */
const asInstructed = (): Placement => placeSteps(SCAN_STEPS.map((step) => step.face));

/** Each scanned face goes where its center color belongs on a standard cube. */
function byCenter(colors: readonly Color[]): Placement {
  const faceOfColor = new Map(FACES.map((face) => [HOME_COLORS[face], face]));
  return placeSteps(SCAN_STEPS.map((_, step) => faceOfColor.get(colors[step * 9 + 4])!));
}

/** The placement with each face f turned quarterTurns[f] quarter turns. */
function turned(placement: Placement, quarterTurns: readonly number[]): Placement {
  const out = [...placement];
  quarterTurns.forEach((q, f) => {
    let nine = placement.slice(f * 9, f * 9 + 9);
    for (let i = 0; i < q; i++) nine = turnFace(nine);
    nine.forEach((pos, k) => (out[f * 9 + k] = pos));
  });
  return out;
}

const passes = (placement: Placement, colors: readonly Color[]) =>
  validateStickers(placement.map((pos) => colors[pos])).ok;

/** Every passing version of the placement with the fewest turned faces (none if nothing passes). */
function fewestTurnsThatPass(start: Placement, colors: readonly Color[]): Placement[] {
  let fewest = Infinity;
  let found: Placement[] = [];
  for (let combo = 1; combo < 4 ** 6; combo++) {
    const quarterTurns = FACES.map((_, f) => Math.floor(combo / 4 ** f) % 4);
    const facesTurned = quarterTurns.filter((q) => q > 0).length;
    if (facesTurned > fewest) continue;
    const placement = turned(start, quarterTurns);
    if (!passes(placement, colors)) continue;
    if (facesTurned < fewest) {
      fewest = facesTurned;
      found = [];
    }
    found.push(placement);
  }
  return found;
}

/**
 * Puts the 6 scanned faces together (decision D11):
 * 1. As instructed.
 * 2. If that fails the checks: by center color. This fixes a SPIN or TIP made the other way;
 *    each face is still the right way up, it was just scanned at a different step.
 * 3. If that fails too: every way of turning the faces (4^6 = 4,096), keeping the one with the
 *    fewest turned faces, but only if exactly one passes.
 * If nothing passes, the as-instructed cube goes to the review map; "Check my cube" explains.
 */
export function assemble(sorted: SortedColors): AssembledCube {
  const { colors } = sorted;
  const unsure = new Set(sorted.unsure);
  const result = (placement: Placement, note: string | null): AssembledCube => ({
    stickers: placement.map((pos) => colors[pos]),
    unsure: placement.flatMap((pos, index) => (unsure.has(pos) ? [index] : [])),
    note,
  });

  const instructed = asInstructed();
  if (passes(instructed, colors)) return result(instructed, null);
  const centered = byCenter(colors);
  const reordered = centered.some((pos, i) => pos !== instructed[i]);
  if (reordered && passes(centered, colors)) return result(centered, NOTE_REORDERED);

  for (const start of reordered ? [instructed, centered] : [instructed]) {
    const fixes = fewestTurnsThatPass(start, colors);
    if (fixes.length === 1) return result(fixes[0], NOTE_TURNED);
    if (fixes.length > 1) return result(instructed, NOTE_UNSURE_TURN);
  }
  return result(instructed, null);
}
```

- [ ] **Step 2: Write `src/vision/pipeline.ts`**

```ts
import { assemble, type AssembledCube } from './assemble';
import { readFace, START_GUESSES, type Frame } from './color';
import { sortColors } from './sort';

/** The whole scanner after the 6 faces are taken: pictures in (in scan order), cube out. */
export function readCube(frames: readonly Frame[]): AssembledCube {
  return assemble(sortColors(frames.map(readFace), START_GUESSES));
}
```

- [ ] **Step 3: Write `src/vision/assemble.test.ts`.** Helper: the colors a camera sees at
  each step for a given list of holds. Use `applyMoves(cube, mustParse(hold))` and read the F
  face, so the cube model plays the camera. Cover:
  - `turnFace` of `[0..8]` is `[6,3,0,7,4,1,8,5,2]`; four turns give back the start;
  - holds as instructed → `stickers` equal the cube, `note` null;
  - unsure scan position 9 (step 1 = face R, square 0) → sticker index 9 is unsure;
  - **SPIN RIGHT instead of SPIN LEFT** (holds `''`, `y'`, `y2`, `y`, `x'`, `x`) → the cube,
    `NOTE_REORDERED`;
  - **TIP BACK instead of TIP FORWARD** (`''`, `y`, `y2`, `y'`, `x`, `x'`) → the cube,
    `NOTE_REORDERED`;
  - **tipped without spinning back to green** (5th and 6th holds `y' x'` and `y' x`: both white
    and yellow are seen turned) → the cube, `NOTE_TURNED`;
  - a real misread (two squares of different colors swapped) → returned as scanned, note null,
    and `validateStickers` fails;
  - **swapped center caps are not "fixed" away:** red and orange centers swapped (stickers 13
    and 40) → returned as scanned, and the check reports a center problem.
- [ ] **Step 4:** run, typecheck, prettier, commit ("feat: put the scanned faces together;
  fix a cube turned the wrong way or a face held turned").

---

### Task 8: Live feedback (steady, too dark, already scanned)

**Files:** create `src/vision/watch.ts`, `src/vision/watch.test.ts`

- [ ] **Step 1: Write `src/vision/watch.ts`**

```ts
import { labDistance, type Lab } from './color';

/** One live reading of the face in the grid, and when it was taken (milliseconds). */
export interface LiveReading {
  time: number;
  readings: Lab[];
}

/** How long the picture must hold steady before a face is taken. Tuned in ④c. */
export const HOLD_MS = 700;
/** How far a square's color may drift and still count as steady. Tuned in ④c. */
export const STEADY_DRIFT = 6;
/** Below this average lightness, the screen asks for more light. Tuned in ④c. */
export const DARK_L = 25;
/** Two centers closer than this are taken to be the same face. Tuned in ④c. */
export const SAME_CENTER = 12;

/** True when every square has stayed within STEADY_DRIFT of its newest color for at least holdMs. */
export function isSteady(history: readonly LiveReading[], holdMs = HOLD_MS): boolean {
  if (history.length === 0) return false;
  const newest = history[history.length - 1];
  // Go back to the latest reading that is at least holdMs old.
  let start = -1;
  for (let i = history.length - 1; i >= 0; i--) {
    if (newest.time - history[i].time >= holdMs) {
      start = i;
      break;
    }
  }
  if (start < 0) return false; // not watched for long enough yet
  return history
    .slice(start)
    .every((h) =>
      h.readings.every((lab, k) => labDistance(lab, newest.readings[k]) <= STEADY_DRIFT),
    );
}

/** True when the face looks too dark to read well. */
export function isTooDark(readings: readonly Lab[]): boolean {
  return readings.reduce((sum, r) => sum + r.L, 0) / readings.length < DARK_L;
}

/** Which earlier face has a center that looks the same as this one (-1 if none). */
export function earlierFaceLike(center: Lab, earlierCenters: readonly Lab[]): number {
  return earlierCenters.findIndex((c) => labDistance(c, center) < SAME_CENTER);
}
```

- [ ] **Step 2: Write `src/vision/watch.test.ts`**, covering:
  - identical readings every 66 ms: not steady at 600 ms, steady from 700 ms on;
  - one square drifting by 10 inside the window: not steady;
  - an empty history: not steady;
  - `isTooDark`: L 20 everywhere is dark, L 60 isn't;
  - `earlierFaceLike` finds a near copy (distance 5) and ignores distance 30.
- [ ] **Step 3:** run, typecheck, prettier, commit ("feat: steady, too-dark and
  already-scanned checks for the live camera").

---

### Task 9: Test-scan files and scoring

**Files:** create `src/vision/testScan.ts`, `src/vision/testScan.test.ts`,
`src/vision/measure.test.ts`; modify `reference/camera-test/README.md`

- [ ] **Step 1: Write `src/vision/testScan.ts`**

```ts
import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { formatAlgorithm, parseAlgorithm } from '../cube/notation';
import { randomScramble } from '../cube/scramble';
import type { Color } from '../cube/types';
import { validateStickers } from '../cube/validate';
import type { AssembledCube } from './assemble';
import type { Frame } from './color';
import { readCube } from './pipeline';

export const TEST_SCAN_FORMAT = 'rubiks-cube-app.test-scan.v1';
export const LIGHTS = ['daylight', 'lamp', 'dim', 'other'] as const;
export type Light = (typeof LIGHTS)[number];
export type CameraKind = 'back' | 'front' | 'unknown';

/** Test scrambles are 15 face turns: fewer chances to slip, still well mixed (decision D15). */
export const TEST_SCRAMBLE_LENGTH = 15;

/** One saved test scan (decision D14). */
export interface TestScanFile {
  format: typeof TEST_SCAN_FORMAT;
  savedAt: string; // ISO date and time
  scramble: string; // done from solved, white on top, green facing you
  expected: Color[]; // the 54 colors the scramble makes (recomputed and compared when measured)
  light: Light;
  camera: CameraKind;
  device: string; // the browser's description of itself
  frameSize: number;
  faces: { pixels: string; picture: string }[]; // scan order; pixels = base64 RGBA, picture = JPEG to look at
  answer: Color[]; // what the app put on the review map
  unsure: number[]; // squares the app marked unsure
}

export function newTestScramble(random: () => number = Math.random): string {
  return formatAlgorithm(randomScramble(TEST_SCRAMBLE_LENGTH, random));
}

/** The 54 colors a scramble makes from a solved cube in the reference hold. */
export function expectedColors(scramble: string): Color[] {
  const parsed = parseAlgorithm(scramble);
  if (!parsed.ok) throw new Error(`Bad scramble: ${parsed.message}`);
  return [...applyMoves(solved(), parsed.moves).stickers];
}

/** Pixels as text (base64), so they fit in a JSON file. */
export function encodePixels(data: ArrayLike<number>): string {
  const chunks: string[] = [];
  for (let start = 0; start < data.length; start += 0x8000) {
    const piece: number[] = [];
    for (let i = start; i < Math.min(start + 0x8000, data.length); i++) piece.push(data[i]);
    chunks.push(String.fromCharCode(...piece));
  }
  return btoa(chunks.join(''));
}

export function decodePixels(text: string): Uint8ClampedArray {
  const binary = atob(text);
  const data = new Uint8ClampedArray(binary.length);
  for (let i = 0; i < binary.length; i++) data[i] = binary.charCodeAt(i);
  return data;
}

export function buildTestScan(input: {
  scramble: string;
  light: Light;
  camera: CameraKind;
  device: string;
  frames: readonly Frame[];
  pictures: readonly string[];
  result: AssembledCube;
  savedAt?: Date;
}): TestScanFile {
  return {
    format: TEST_SCAN_FORMAT,
    savedAt: (input.savedAt ?? new Date()).toISOString(),
    scramble: input.scramble,
    expected: expectedColors(input.scramble),
    light: input.light,
    camera: input.camera,
    device: input.device,
    frameSize: input.frames[0].size,
    faces: input.frames.map((frame, i) => ({
      pixels: encodePixels(frame.data),
      picture: input.pictures[i],
    })),
    answer: input.result.stickers,
    unsure: input.result.unsure,
  };
}

/** Reads a saved file, re-checking it ("re-footing"): the expected colors must match the scramble. */
export function parseTestScan(
  text: string,
): { ok: true; file: TestScanFile } | { ok: false; error: string } {
  let file: TestScanFile;
  try {
    file = JSON.parse(text) as TestScanFile;
  } catch {
    return { ok: false, error: 'not JSON' };
  }
  if (file.format !== TEST_SCAN_FORMAT) return { ok: false, error: 'not a test scan file' };
  if (!parseAlgorithm(file.scramble).ok) return { ok: false, error: 'bad scramble' };
  if (expectedColors(file.scramble).join('') !== file.expected.join('')) {
    return { ok: false, error: 'expected colors do not match the scramble' };
  }
  if (file.faces.length !== 6) return { ok: false, error: 'needs 6 faces' };
  const bytes = file.frameSize * file.frameSize * 4;
  if (file.faces.some((face) => decodePixels(face.pixels).length !== bytes)) {
    return { ok: false, error: 'a face has the wrong number of pixels' };
  }
  return { ok: true, file };
}

export function framesOf(file: TestScanFile): Frame[] {
  return file.faces.map((face) => ({ size: file.frameSize, data: decodePixels(face.pixels) }));
}

/** How the current scanner does on a saved scan (decision D17). */
export interface ScanScore {
  right: number; // squares read right, of 54, before any fixing
  wrongMarked: number; // wrong squares that were marked unsure
  wrongUnmarked: number; // wrong squares that were not
  marked: number; // all squares marked unsure
  passesCheck: boolean; // the answer passes "Check my cube"
  slip: boolean; // a real cube, but not the scrambled one: likely a scrambling slip (D15)
}

/** Scores a saved scan by running today's scanner on its pixels, so re-tuning re-scores old scans. */
export function scoreScan(file: TestScanFile): ScanScore {
  const answer = readCube(framesOf(file));
  const wrong = answer.stickers.flatMap((color, i) => (color === file.expected[i] ? [] : [i]));
  const marked = new Set(answer.unsure);
  const passesCheck = validateStickers(answer.stickers).ok;
  return {
    right: 54 - wrong.length,
    wrongMarked: wrong.filter((i) => marked.has(i)).length,
    wrongUnmarked: wrong.filter((i) => !marked.has(i)).length,
    marked: marked.size,
    passesCheck,
    slip: passesCheck && wrong.length > 0,
  };
}
```

- [ ] **Step 2: Write `src/vision/testScan.test.ts`.** Helper: synthetic frames of a
  scrambled cube (camera colors = the app's screen colors + noise 10, via `paintFrame` and the
  camera-view helper from Task 7). Cover:
  - `encodePixels` / `decodePixels` round trip on 90,000 bytes;
  - `expectedColors('R')` equals `applyMoves(solved(), R)`;
  - build → `JSON.stringify` → `parseTestScan` round trip;
  - parse rejects a wrong format, a bad scramble, and edited `expected` colors;
  - `scoreScan` on clean synthetic frames: 54 right, passes, no slip;
  - the same frames with a scramble one move different: `slip` is true.
- [ ] **Step 3: Write `src/vision/measure.test.ts`** (skipped in normal runs, like the CFOP
  measurements)

```ts
import { describe, expect, it } from 'vitest';
import { parseTestScan, scoreScan, type ScanScore, type TestScanFile } from './testScan';

/**
 * Scanner accuracy on the owner's test scans (decisions D16, D17). Skipped in normal runs. The
 * scans are gitignored, so they exist only on the owner's PC. To run it (PowerShell):
 *   $env:VITE_MEASURE = '1'; npx vitest run src/vision/measure.test.ts --silent=false
 * Files go in reference/camera-test/batch-a/ (tuning) and batch-b/ (the reported figure).
 */
const FILES = import.meta.glob<string>('/reference/camera-test/**/*.json', {
  query: '?raw',
  import: 'default',
}); // loaded only when this test runs

describe.skipIf(!import.meta.env.VITE_MEASURE)('camera accuracy', () => {
  it('scores every saved test scan', async () => {
    const rows: { path: string; batch: string; file: TestScanFile; score: ScanScore }[] = [];
    for (const [path, load] of Object.entries(FILES)) {
      const parsed = parseTestScan(await load());
      if (!parsed.ok) {
        console.log(`${path}: skipped (${parsed.error})`);
        continue;
      }
      const batch = path.split('/').slice(-2)[0];
      rows.push({ path, batch, file: parsed.file, score: scoreScan(parsed.file) });
    }
    // Print one line per scan, then per batch and per camera + light:
    //   scans; squares right / squares (slips left out and listed separately); scans needing no
    //   fixes; wrong squares marked unsure / wrong squares.
    // Re-foot: assert that the group lines add up to each batch's totals.
    expect(rows.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 4: Rewrite `reference/camera-test/README.md`** for the guided scan:
  - **how:** open the link with `?scan=test`, follow the scramble, pick the light, scan, then
    **Save test scan**;
  - **where:** copy each file to `batch-a/` or `batch-b/` on the PC;
  - **what's in a batch:** D16's 8 scans;
  - **rules:** save every scan, good or bad; files stay off GitHub; only results are published.
- [ ] **Step 5:** run, typecheck, prettier, commit ("feat: test-scan files, scoring, and the
  accuracy measurement").

---

### Task 10: Camera helpers and the scan screen

**Files:** create `src/vision/camera.ts`, `src/app/ScanScreen.tsx`; modify `src/app/app.css`

- [ ] **Step 1: Write `src/vision/camera.ts`**

```ts
import { FRAME_SIZE, type Frame } from './color';
import type { CameraKind } from './testScan';

/** The grid's share of the camera view's shorter side. Tuned in ④c. */
export const GRID_FRACTION = 0.7;

export type CameraProblem = 'not-secure' | 'not-allowed' | 'no-camera' | 'other';

/** Starts the camera, preferring the back camera on phones (decision D13). */
export async function startCamera(): Promise<
  { stream: MediaStream; kind: CameraKind } | { problem: CameraProblem; detail: string }
> {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    return { problem: 'not-secure', detail: '' };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    const facing = stream.getVideoTracks()[0]?.getSettings().facingMode;
    const kind: CameraKind = facing === 'environment' ? 'back' : facing === 'user' ? 'front' : 'unknown';
    return { stream, kind };
  } catch (error) {
    const name = error instanceof DOMException ? error.name : '';
    if (name === 'NotAllowedError' || name === 'SecurityError') return { problem: 'not-allowed', detail: name };
    if (name === 'NotFoundError' || name === 'OverconstrainedError') return { problem: 'no-camera', detail: name };
    return { problem: 'other', detail: name || String(error) };
  }
}

export function stopCamera(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}

/**
 * The grid area of the current video picture, shrunk to FRAME_SIZE a side, or null if the video
 * has no picture yet. The grid is the centered square GRID_FRACTION of the shorter side, the same
 * square the screen outlines (the video is shown as a centered square, "object-fit: cover").
 */
export function grabGrid(video: HTMLVideoElement, canvas: HTMLCanvasElement): Frame | null {
  const { videoWidth: w, videoHeight: h } = video;
  if (video.readyState < 2 || w === 0 || h === 0) return null;
  if (canvas.width !== FRAME_SIZE) canvas.width = canvas.height = FRAME_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  const side = Math.min(w, h) * GRID_FRACTION;
  context.drawImage(video, (w - side) / 2, (h - side) / 2, side, side, 0, 0, FRAME_SIZE, FRAME_SIZE);
  return { size: FRAME_SIZE, data: context.getImageData(0, 0, FRAME_SIZE, FRAME_SIZE).data };
}

/** A JPEG of a frame, for test files: something to look at (the pixels are what gets measured). */
export function pictureOf(frame: Frame): string {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = frame.size;
  const context = canvas.getContext('2d');
  if (!context) return '';
  context.putImageData(new ImageData(Uint8ClampedArray.from(frame.data), frame.size, frame.size), 0, 0);
  return canvas.toDataURL('image/jpeg', 0.9);
}
```

- [ ] **Step 2: Write `src/app/ScanScreen.tsx`.** Props:
  `{ testMode: boolean; onDone: (cube: AssembledCube) => void; onCancel: () => void }`. Stages:

  **Intro.**
  - Normal mode, text: "The camera reads your cube one face at a time. Hold each face so its
    squares sit in the grid. Good, even light works best; avoid a lamp shining straight at the
    cube. Nothing is recorded or sent anywhere."
  - Test mode adds:
    1. "Start from a solved cube, white on top, green facing you."
    2. "Do these moves: {scramble}."
    3. A light picker (daylight / lamp / dim / other).
  - Buttons: **Start the camera**, **Enter by hand instead**.

  **Scanning.**
  - The heading "Face {n} of 6", then `SCAN_STEPS[step].says` with a color chip for the center.
  - **The camera view:** a square box (`.scan-view`) holding:
    - `<video playsInline muted autoPlay>`, which is visible, `object-fit: cover`, and mirrored
      by CSS unless the camera is the back camera;
    - an SVG overlay (viewBox 0–100) drawing the grid as the centered `GRID_FRACTION` square,
      with a live color dot in each cell. When the view is mirrored, dot columns are mirrored
      too, so each dot sits on its square.
  - A status line: "Hold still…", "It's a bit dark. Move to more light." or "You've already
    scanned this face. {says}". "Got it ✓" flashes after each capture.
  - Buttons: **Take it now**, **Redo last face** (from face 2 on), **Cancel**.
  - A small flat 6-face map (reuse `NET_CELLS`): scanned faces show their live colors, the
    current face is outlined, the rest are grey.

  **Effects.**
  - (a) While scanning, start the camera. Stop it on cleanup: leaving the screen, finishing,
    or React's development double-run.
  - (b) About 15 times a second (`requestAnimationFrame`, at least 66 ms apart):
    1. `grabGrid`, then `readFace`;
    2. keep 2 × `HOLD_MS` of history;
    3. live dots from `nearestColor(…, START_GUESSES)`;
    4. take the face when `takeNow`, or when steady and not too dark and not a repeat.
  - (c) After 6 faces, `readCube(frames)` → `onDone(result)`, or in test mode the finished
    stage.

  **Finished (test mode only).**
  - "The camera read {right} of 54 squares right. {wrongMarked} of {wrong} wrong squares were
    marked unsure." (`scoreScan` of the built file, the same code the PC runs.) If it's a slip:
    "This looks like a different real cube from the scramble, probably a slip while scrambling.
    Save it anyway; it will be listed separately."
  - "Please save every test scan, good or bad."
  - Buttons:
    - **Save test scan**: `navigator.share({ files })` when `navigator.canShare({ files })`,
      otherwise a download link. A cancelled share is ignored. The file name is
      `scan-YYYY-MM-DD-HHMM-{light}-{camera}.json`.
    - **Review on the map**.
    - **Scan another**: new scramble, back to the intro.

  **Camera problems** (shown on the intro, with **Enter by hand instead**):
  - not-secure: "The camera only works when the app is opened from a secure (https://) address."
  - not-allowed: "The camera wasn't allowed. To scan, allow the camera for this site in your
    browser's settings, then try again."
  - no-camera: "No camera was found on this device."
  - other: "The camera couldn't start ({detail}). If another app is using it, close that app
    and try again."

- [ ] **Step 3: CSS** in `app.css`:
  - `.scan-view`: square, `max-width: 480px`, black background, rounded, `position: relative`;
  - `video`: 100%, `object-fit: cover`;
  - `.mirrored`: `transform: scaleX(-1)`;
  - the SVG fills the box;
  - `.scan-map`: a smaller version of `.net`.
- [ ] **Step 4:** typecheck, prettier, commit ("feat: the guided scan screen and test mode").

---

### Task 11: Review on the map, and wiring it in

**Files:** modify `src/app/EnterCubeScreen.tsx`, `src/app/App.tsx`, `src/app/app.css`

- [ ] **Step 1: `App.tsx`**
  - A new screen `'scan'`, which isn't a tab. Leaving it by any tab unmounts it, which stops
    the camera.
  - `const scanLink = new URLSearchParams(window.location.search).get('scan');`
    - `null` means no button (④b);
    - any other value shows the button;
    - `'test'` turns on test mode.
  - New state: `scanUnsure: ReadonlySet<number>` and `scanNote: string | null`.
  - `onDone(cube)`: set the editor squares to `cube.stickers`, `scanUnsure` to `cube.unsure`
    and `scanNote` to `cube.note`, then go to `'enter'`.
- [ ] **Step 2: `EnterCubeScreen.tsx`.** New props: `unsure`, `onUnsureChange`, `note`, and
  `onScan?` (the button shows only when it's given).
  - **Scan with camera** button under the opening hint.
  - Unsure squares get class `unsure` and show "?". The aria-label adds ", camera not sure".
    Painting a square removes its mark. **Start over** and **Fill as solved** clear all marks
    and the note.
  - When marks exist: "The camera wasn't sure about {n} squares, shown with a dashed outline and
    a ?. Check them against your cube, then press Check my cube." The note shows under it.
- [ ] **Step 3: CSS:**
  - `.net-cell.unsure`: `outline: 3px dashed #1d1d1f`, `outline-offset: 1px`;
  - "?" in white with a dark text shadow, so it reads on every color;
  - a problem outline (red, solid) still shows on top when both apply.
- [ ] **Step 4: Check in the browser** (own server on port 5199, never the owner's 5190):
  - without `?scan`: no button;
  - with `?scan`: the button, then the intro screen;
  - the automated browser has no camera, so the error path shows its message and **Enter by
    hand instead** works;
  - the test-mode intro shows a scramble;
  - no console errors.
- [ ] **Step 5: Owner, on the PC webcam** (`npm run dev`, then
  http://localhost:5190/?scan=test):
  - the dots sit on the squares;
  - auto-capture works;
  - the finished cube on the map matches the real cube;
  - **Save test scan** downloads a file.
- [ ] **Step 6:** typecheck, prettier, commit ("feat: scan from Enter my cube; unsure squares
  marked on the map").

---

### Task 12: Docs, final review, PR #7

- [ ] **Step 1:** `npm test`, `npm run typecheck` and `npm run build` all green. Record the
  test count.
- [ ] **Step 2:** `docs/phase-4b-review-notes.md`:
  - what to try;
  - the checks done;
  - rulings made while building;
  - **no accuracy figures** (none exist yet).
- [ ] **Step 3:** `CLAUDE.md` status: ④b in review, then the next step (batch A).
- [ ] **Step 4:** fresh-reviewer pass over the diff. Fix Critical and Important findings with a
  failing test first.
- [ ] **Step 5:** push, open PR #7. After merge, the live site has the scanner behind `?scan`,
  and test mode behind `?scan=test`.

---

# Part ④c: Tune and measure (outline; its own plan comes later)

1. **You take batch A** (D16) on the live site with `?scan=test`, and copy the 8 files to
   `reference/camera-test/batch-a/`.
2. **Baseline:** run the measurement and report it as "before tuning".
3. **Look at every wrong square** (the saved pictures, readings and distances). Then tune,
   re-measuring on batch A after each change:
   - the starting guesses (measured from batch A);
   - `UNSURE_GAP`, `SAMPLE_FRACTION` and `GRID_FRACTION`;
   - steady and dark limits;
   - maybe per-face light correction;
   - maybe the best-overall optimizer (D10).
4. **Freeze the settings.** You take batch B (8 new scans). Measure it once and report it (D17).
5. **You decide** whether to accept. Any change after that needs a new batch for the reported
   figure.
6. **Switch the scanner on for everyone.** Update spec §6 with the measured accuracy (and its
   source), the README and the review notes. Open a PR.

The ④c plan is written after step 2, once we know what needs tuning.

---

## Self-review notes (plan author)

- **iPhone video:** the `<video>` is shown, not hidden. Some iPhone browsers don't update a
  hidden video's frames. That's to be confirmed on the owner's iPhone in ④b. `playsInline` and
  `muted` stop it going full screen.
- **Mirroring:** colors are read from the raw camera picture, which a camera sees like a person
  standing where it is (not mirrored). Only the display is flipped. The PC-webcam check in
  Task 11 and the first test scans confirm it on real devices. A mirrored reading would fail
  almost every scan, so it can't hide.
- **One code path:** the phone shows the same score the PC measures (`scoreScan` on the built
  file).
- **Honesty about the safety net:** the 1-in-3,600 figure is for deliberately turned faces on
  random cubes. It isn't a scanner accuracy figure, and the notes don't present it as one.
- **Open risk:** red/orange under warm lamps is the classic weak spot. ④c tunes against data
  rather than guessing; D10's rule and the unsure marks are the safety net until then.
- **Scope:** progress sharing (D4), a switch-camera button (D13) and PLL arrows stay out of
  phase ④.
