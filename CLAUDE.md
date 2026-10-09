# CLAUDE.md

Guidance for Claude Code sessions working in this project.

## What this project is

A web app that teaches people to solve a 3x3 Rubik's Cube, from first-time
solvers to people learning advanced (CFOP) algorithms. It shows the cube in 3D,
animates algorithms step by step, and walks the user through solving **their own
scrambled cube**. The user's real cube gets into the app by manual sticker entry
first, and later by a guided camera scan (one face at a time).

- **Audience:** friends and family learning the beginner method; the owner
  (who already solves with the beginner method) and other keen solvers using
  the CFOP content.
- **Purpose:** personal + learning project. No accounts, no backend, no server.
  Progress is saved in the browser only.

## Status

**Design approved; phases ① to ③b-2 built and merged into `main`.** The approved design
spec is `docs/superpowers/specs/2026-09-27-cube-learning-app-design.md`, and decisions are
logged in `docs/decisions-log.md`. Each build phase gets its own implementation plan
in `docs/superpowers/plans/`, reviewed by the owner before any code is written.

Merged into `main` (PRs #1 to #5, 2026-10-08):

- Phase ①: cube model + 3D algorithm player.
- Phase ②: manual sticker entry + validation, including the pieces view and
  center-scheme checks.
- Phase ③a: beginner method (solver, Learn and Solve screens).
- Phase ③b-1: CFOP solve path (cross, 41 F2L cases, 2-look OLL/PLL, method choice on
  the Solve and Learn screens).
- Phase ③b-2: full OLL 57 / PLL 21 tied to SpeedCubeDB's numbering, 2-look/full choice,
  Algorithms screen with case diagrams (follows the chosen method), progress saved in the
  browser, plus the owner's feedback (decisions #45–#49; see
  `docs/phase-3b2-review-notes.md`).

**Phase ④ (guided camera scan): plan approved 2026-10-09**
(`docs/superpowers/plans/2026-10-09-phase-4-guided-camera.md`, decisions #50–#68). Three parts:

- ④a Online: pre-public cleanup, MIT license, GitHub Pages publishing. **Merged (PR #6,
  2026-10-09); the repo is public and the app is live.**
- ④b Camera and test mode: the scanner behind `?scan`; test mode behind `?scan=test`. In
  progress on `phase-4b-camera`.
- ④c Tune on test batch A, measure on batch B. Its own plan comes once batch A exists.

Branch new phases off `main`; GitHub deletes a branch automatically once its PR is merged. The
owner's no-back-turn rule applies to the beginner method only; CFOP may turn the back face.

GitHub: **public** repo `riskybiz7/rubiks-cube-learning-app` (remote `origin`). Live app:
https://riskybiz7.github.io/rubiks-cube-learning-app/. Every push to `main` republishes it
(`.github/workflows/publish.yml`); pull requests only run the tests and the build.

## Stack

TypeScript + React (built with Vite), Three.js for 3D, Vitest for tests, Prettier
for formatting. No OpenCV.js: the guided scan reads colors directly (decision #56).

## Commands (run from the project root)

| Command | What it does |
|---|---|
| `npm run dev` | Start the app at http://localhost:5190 (if that port is busy, Vite picks the next one and prints it) |
| `npm test` | Run all tests once |
| `npm run test:watch` | Re-run tests on every save |
| `npm run typecheck` | Check types without building |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run format` | Auto-format code with Prettier |

## Planned code layout

Each module has one job and only depends on modules above it in this list:

| Module | Job |
|---|---|
| `src/cube/` | Cube model: state, moves, notation parsing, validity checks. Pure logic, no UI. The single source of truth. |
| `src/content/` | Algorithm library as data: beginner stages, F2L (41), OLL (57), PLL (21). |
| `src/solver/` | Teaching solver: solves the user's cube stage by stage using the chosen method. |
| `src/render/` | Three.js 3D cube: draws a state, animates moves, play/pause/step/speed. |
| `src/input/` | Manual "paint the stickers" editor + review screen (phase 2). |
| `src/vision/` | Guided camera scanner (phase 4). Outputs the same 54 colors as `input/`. |
| `src/app/` | Screens: Learn · Algorithms · Solve My Cube. |

**Build phases:** ① cube model + 3D view → ② manual input + validation →
③ beginner then CFOP content + teaching solver → ④ guided camera scanning.

## Non-negotiable rules

- **No unverified algorithm ships.** Every algorithm in `src/content/` must
  have an automated test that applies it to the matching case and confirms it
  solves that case. This is the project's equivalent of re-footing a table.
- **Label provenance.** Algorithms Claude proposes (rather than ones the owner
  confirmed) are marked *proposed / unconfirmed* until the owner checks them
  against their own solving.
- **Solver self-check.** Before showing a solve plan, replay every move on the
  starting state and assert it ends solved. On failure, show an error and never
  a bad solve.
- **Scanner accuracy is measured, not guessed.** Report accuracy only from the
  test scans in `reference/camera-test/` (taken with the app's test mode; tune on batch A,
  report batch B).

## Domain conventions

- **Move notation:** standard Singmaster/WCA notation: `R U R' U'`, `F2`,
  wide moves `r`, slice moves `M E S`, rotations `x y z`.
- **Beginner method = the daisy method, in 10 stages** (owner's version). The
  full stage map and proposed algorithms are in `reference/beginner-method/README.md`,
  which is the source of truth for beginner content. In short: daisy (yellow up) →
  white cross → white corners → middle layer (stages 2 to 4 are done
  **white up**, confirmed by owner) → flip to yellow up → yellow cross →
  check edges → yellow edges → position corners → twist corners.
- **User-facing wording:** say **"squares"** for the colored faces of the small cubes, never
  "stickers" (owner's choice). "Sticker" is fine inside code.
- **Color scheme:** standard, confirmed from the owner's photos: white opposite
  yellow, red opposite orange, blue opposite green.

## Working with the owner

- Strong in Excel financial modeling; newer to Python and SQL. Explain syntax choices briefly
  and lead with the concept. Spreadsheet analogies work well.
- Explain before doing; wait for approval on non-trivial steps.
- Propose better approaches openly and never substitute silently. Ask when
  anything is ambiguous.
- Readable over clever.
- Commits carry **no** Claude co-author line (owner, 2026-10-09). PR descriptions keep the
  "Generated with Claude Code" footer.

## Environment

- Windows 11, PowerShell 5.1: no `&&`, no ternary, no `??`.
- The project path contains an apostrophe (`Rubik's Cube`). Always quote it.
