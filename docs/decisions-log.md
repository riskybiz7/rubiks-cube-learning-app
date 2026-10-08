# Decisions log

Design decisions made during brainstorming. Each one is the owner's choice
unless marked otherwise. This log feeds the design spec.

## 2026-09-26 / 27: initial brainstorming

| # | Decision | Choice | Notes |
|---|---|---|---|
| 1 | Platform | **Web app** | Runs in a phone or laptop browser. Camera via the browser. |
| 2 | Project goal | **Personal + learning** | No accounts/backend. Progress saved in the browser. |
| 3 | Puzzles | **3x3 only, for now** | Engine written so other sizes could be added later. |
| 4 | Methods in v1 | **Beginner + CFOP** | 2-look OLL/PLL as the bridge to full CFOP. |
| 5 | Solve style | **Method-based, teachable** | Solves stage by stage like a human would. No "shortest solution" mode. |
| 6 | Camera scanning | **Free-form continuous** | User turns the cube freely; the app identifies faces by center color and works out face rotations by testing validity. |
| 7 | Build approach | **A: own cube engine + Three.js**, React, TypeScript | Chosen over cubing.js or no-framework. |
| 8 | Input order | **Manual sticker entry first**, camera as a later phase | Manual editor doubles as the camera's review/fix screen. |
| 9 | Beginner method variant | **Daisy method** | Yellow center up, white-edge daisy, flip petals down to a white cross on the bottom. Yellow on top for the rest of the solve. |
| 10 | Audience split | Beginner content → friends & family; CFOP → owner and keen solvers | Beginner side: plain-English and visual. CFOP side: fast lookup and practice. |
| 11 | Algorithm sourcing | Stage order from the owner's photos; algorithms proposed by Claude, labeled **unconfirmed** until the owner checks them | Video of a solve was considered and rejected: moves can't be read reliably from blurry frames. |
| 12 | Beginner stage map | **10 stages** read from the owner's photos (see `reference/beginner-method/README.md`) | Last layer order: yellow cross → edges → position corners → twist corners. Stages 2 to 4 are done **white up** (owner confirmed). |
| 13 | Color scheme | **Standard**, confirmed from photos 5.1, 10.1, 10.2 | Closes the earlier open item. |
| 14 | Reference photos in git | **Resized copies only** (`small/`, 7.6 MB); originals (54.0 MB) stay on disk, gitignored | Owner's choice. |
| 15 | Stage 2 and 6 procedures | **Owner-confirmed.** Stage 2: match petal, turn face twice, flip after all 4. Stage 6: line ×1; reverse L (photo 5.0 hold) ×2; dot ×1 → re-hold as reverse L → ×2 | Stage 6 moves `F R U R' U' F'` also owner-confirmed (checked on the real cube, 2026-09-27). |
| 16 | Flip instructions | Name the **end position** ("white on top, green facing you"), per cubing-tutorial convention | Claude's default, owner deferred; revisit with the running app. |
| 17 | Design spec | **Approved** (2026-09-27): `docs/superpowers/specs/2026-09-27-cube-learning-app-design.md` | Next: phase ① implementation plan. |
| 18 | Phase ① outcome | **Merged** into `main` via PR #1 on GitHub (private repo `riskybiz7/rubiks-cube-learning-app`) | Owner: look is as envisioned; 0.4 s default speed OK for now (get beginner feedback later); Play-turns-into-Pause is good as is; pause-in-hidden-tab is good. |
| 19 | Pieces view (8 corners + 12 edges) | **Build in phase ②** | Owner agreed after explanation. Needed for twist/flip/parity checks and the solvers. |
| 20 | Center-scheme validation | **Added to spec §5** | Owner: reassembly mistakes (incl. swapped GAN center caps) are realistic even if rare; the app must confirm the cube is solvable and matches the standard design. |
| 21 | Editable centers in the manual editor | **Pre-filled but editable** (spec §4.1 updated) | Claude's call so decision 20 can actually catch swapped centers; owner authorized autonomous phase ② build. |
| 22 | Phone layout check | **After the first full draft**, on the owner's phone | Owner has not built a phone app before; keep the current responsive design until then. |
| 23 | Editor instructions | **Confirmed clear** by the owner in the browser | "How to read each face" kept as written. |
| 24 | User-facing wording | Always **"squares"**, never "stickers" | Owner's choice. Guarded by a test over every validation message type. "Sticker" stays the internal code term. |
| 25 | No back-face turns for beginners | **Turn the whole cube so that side faces you, then turn the front** ("U F", not "U B") | Owner, 2026-09-28: not a fan of B turns for first-time learners; prefers turning the cube's orientation. First said "on the right", then corrected to **facing you**: it's easier to line the daisy up with a center that faces you directly. Applies to the whole beginner method (only stage 1 daisy and stage 2 white cross ever used B; the fixed algorithms never do). Same layer turns; the app shows a "turn the whole cube" step first. Left-face turns unchanged unless the owner asks. CFOP (phase ③b): apply the same where it doesn't make an algorithm awkward, and flag each case. Guarded by tests over 300 scrambles. |
| 44 | Switching 2-look/full mid-solve | **Keep your step in the cross or F2L; otherwise go to the first yellow-top step** | ③b-2 D10. Claude proposed; owner approved 2026-10-08. Tested (`lastLayer.test.ts`). |
| 43 | Saved progress | **One versioned browser entry (`rubiks-cube-app.progress.v1`); unreadable parts are skipped, never a crash** | ③b-2 D9. Claude proposed; owner approved 2026-10-08. If the browser blocks storage, the app works and says progress isn't kept. |
| 42 | Algorithms screen | **A new tab with one 3D player for the whole screen; the Algorithm player tab stays** | ③b-2 D8. Claude proposed; owner approved 2026-10-08. Browsers allow only a few live 3D views per page. |
| 41 | Case diagrams | **OLL: top view, yellow squares only (2-look first step: edges only). PLL: full color. F2L: none (watch it in 3D)** | ③b-2 D7. Claude proposed; owner approved 2026-10-08. PLL arrows left for later. |
| 40 | How each full OLL/PLL algorithm was chosen | **SpeedCubeDB's standard if face turns only (y turns at the ends dropped); else its shortest listed face-turn alternative; else the shortest conversion to face turns. Keep the ③b-1 algorithm where one exists** | ③b-2 D6. Claude proposed; owner approved 2026-10-08. Result: 37 standard, 18 listed alternatives, 10 converted, 13 kept. |
| 39 | Shared cards | **OLL 21–27 are the 2-look corner cards; the full-PLL T, Y, Ua, Ub, H and Z are the 2-look PLL cards** | ③b-2 D5. Claude proposed; owner approved 2026-10-08. A "learned" mark shows in both lists. |
| 38 | Progress | **Learning/learned per F2L/OLL/PLL card, a "done" tick per lesson (both tracks), and a reset button** | Owner, 2026-10-08 (③b-2 D4). |
| 37 | 2-look or full | **Two switches on the Solve screen (CFOP only): OLL and PLL, each 2-look or full; starts on 2-look; remembered** | Owner, 2026-10-08 (③b-2 D3). |
| 36 | OLL numbering | **Standard 1–57, tied by a test to the cases SpeedCubeDB shows** (speedcubedb.com/a/3x3/OLL, fetched 2026-10-08) | Owner, 2026-10-08 (③b-2 D2). PLL keeps its letter names (also tied to SpeedCubeDB); F2L keeps the app's own numbering (#33). |
| 35 | Full OLL/PLL moves | **Face turns only**, like the rest of CFOP (#30). Cards that differ from the usual online version show it as "Usual version" | Owner, 2026-10-08 (③b-2 D1). |
| 34 | Move key options | **Beginner / CFOP / All moves.** CFOP shows U D R L F B plus SPIN/TIP/ROLL | Owner, 2026-09-28 (revised: CFOP uses B). Each list is tested against what that method's lessons actually use. |
| 33 | F2L numbering | **1–41 in the app's own order, in 4 groups by where the corner and edge sit** (not the numbering on online charts) | Owner, 2026-09-28. The common chart numbering couldn't be checked against a source here. |
| 32 | Cross search | **All six faces, back included; edges placed one at a time**, fewest turns first | Owner, 2026-09-28 (no-B rule is beginner-only). Measured: median 9, longest 13 turns edge by edge; the shortest whole cross on the same scrambles is median 6, longest 7. See the ③b review notes. |
| 31 | Cube turns on CFOP screens | **SPIN / TIP / ROLL words, as for beginners** | Owner, 2026-09-28 ("even I'm not used to seeing x,y,z"). |
| 30 | CFOP algorithms | **Face turns only (no wide, middle-slice or whole-cube turns); back turns allowed.** T and Bowtie OLL rewritten without wide r; H and Z perms without M | Owner, 2026-09-28: "disregard the no back turns rule" for CFOP and the advanced methods. None of the 57 happens to use B. |
| 29 | Phase ③b split | **③b-1: CFOP solve path. ③b-2: full OLL/PLL, Algorithms screen, progress** | Owner, 2026-09-28. |
| 28 | Whole-cube turns for beginners | **Written as words with a direction (SPIN LEFT/RIGHT/TWICE, TIP BACK/FORWARD/TWICE, ROLL RIGHT/LEFT/TWICE), not x, y, z** | Owner, 2026-09-28 ("unnecessary memorization"). Solve and Learn screens and the beginner move key; the algorithm player and "All moves" key keep standard letters. Each direction checked against the cube model by a test. |
| 27 | White cross: every petal from the front | **Turn the whole cube so each petal's matching center faces you, then top turns and F2** | Owner, 2026-09-28 ("every petal's center faces you"). Stage 2 now uses only top and front turns. Guarded by a test over 300 scrambles. |
| 26 | Feedback timing | **Small feedback any time; big rethinks at the full-draft review** | Owner asked; nothing is locked. |

## Design sections approved

- §1 Architecture (modules): approved
- §2 Data flow for "Solve My Cube": approved
- §3 Free-form camera scanner: approved
- §4 Testing, error handling, project setup: approved

## Open items

- Owner to check the proposed beginner algorithms against their own solving
- Camera test photos/video → `reference/camera-test/` (needed by phase 4)
