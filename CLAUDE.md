# CLAUDE.md

Guidance for Claude Code sessions working in this project.

## What this project is

A web app that teaches people to solve a 3x3 Rubik's Cube, from first-time
solvers to people learning advanced (CFOP) algorithms. It shows the cube in 3D,
animates algorithms step by step, and walks the user through solving **their own
scrambled cube**. The user's real cube gets into the app by manual sticker entry
first, and later by free-form camera scanning.

- **Audience:** friends and family learning the beginner method; the owner
  (who already solves with the beginner method) and other keen solvers using
  the CFOP content.
- **Purpose:** personal + learning project. No accounts, no backend, no server.
  Progress is saved in the browser only.

## Status

**Design phase, with no code yet.** Brainstorming decisions are recorded in
`docs/decisions-log.md`. Next steps, in order:

1. Collect the owner's beginner-method stage photos → `reference/beginner-method/`
2. Finish design §4 (testing, error handling, setup)
3. Write the design spec → `docs/superpowers/specs/`, then get owner review
4. Write the implementation plan, then build

Do not scaffold code or install packages until the spec and plan are approved.

## Planned stack (approved, not yet installed)

- **TypeScript + React**, built with **Vite**
- **Three.js** for the 3D cube
- **OpenCV.js** for camera scanning (phase 4)
- **Vitest** for tests

## Planned code layout

Each module has one job and only depends on modules above it in this list:

| Module | Job |
|---|---|
| `src/cube/` | Cube model: state, moves, notation parsing, validity checks. Pure logic, no UI. The single source of truth. |
| `src/content/` | Algorithm library as data: beginner stages, F2L (41), OLL (57), PLL (21). |
| `src/solver/` | Teaching solver: solves the user's cube stage by stage using the chosen method. |
| `src/render/` | Three.js 3D cube: draws a state, animates moves, play/pause/step/speed. |
| `src/input/` | Manual "paint the stickers" editor + review screen (phase 2). |
| `src/vision/` | Free-form camera scanner (phase 4). Outputs the same 54 colors as `input/`. |
| `src/app/` | Screens: Learn · Algorithms · Solve My Cube. |

**Build phases:** ① cube model + 3D view → ② manual input + validation →
③ beginner then CFOP content + teaching solver → ④ free-form camera scanning.

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
  photo/video test set in `reference/camera-test/`.

## Domain conventions

- **Move notation:** standard Singmaster/WCA notation: `R U R' U'`, `F2`,
  wide moves `r`, slice moves `M E S`, rotations `x y z`.
- **Beginner method = the daisy method** (owner's preference): yellow center on
  top, white edges form a "daisy" around it; each petal is matched to its side
  center and turned twice, giving a white cross **on the bottom**. Every later
  stage is taught with **yellow on top**. Exact stage order and algorithms
  follow the owner's photos in `reference/beginner-method/`.
- **Color scheme:** assumed standard (white opposite yellow, green opposite
  blue, red opposite orange). Not yet confirmed against the owner's cube.

## Working with the owner

- Beginner in code (some Python/SQL). Explain syntax choices briefly and lead
  with the concept. Spreadsheet analogies work well.
- Explain before doing; wait for approval on non-trivial steps.
- Propose better approaches openly and never substitute silently. Ask when
  anything is ambiguous.
- Readable over clever.

## Environment

- Windows 11, PowerShell 5.1: no `&&`, no ternary, no `??`.
- The project path contains an apostrophe (`Rubik's Cube`). Always quote it.
