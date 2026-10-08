# Phase ③b-2 review notes (full OLL/PLL, Algorithms screen, progress)

Branch `phase-3b2-algorithms`, from `main`. Plan:
`docs/superpowers/plans/2026-10-08-phase-3b2-full-oll-pll-algorithms.md` (D1–D10, all approved
2026-10-08; logged as decisions #35–#44).

## What to try

1. `git checkout phase-3b2-algorithms`, then `npm run dev`, then open http://localhost:5190.
2. **Algorithms** (new tab):
   - Sets: F2L (41), OLL (57), PLL (21), 2-look OLL (10), 2-look PLL (6).
   - OLL and PLL cards show a top-view diagram. F2L cards don't; press **Watch** to see one in 3D.
   - Mark cards *Learning* or *Learned*. Marking Sune on OLL also marks it on 2-look OLL (same card).
   - **Watch** loads a card into the one 3D player at the top.
   - **Reset my progress** asks on the page before clearing.
3. **Solve my cube → CFOP:** two new switches, *OLL: 2-look | Full* and *PLL: 2-look | Full*.
   Switching while you're on the cross or F2L keeps your step.
4. **Learn → CFOP:** lessons 5 (full OLL) and 6 (full PLL). Each lesson has a
   *Mark this lesson done* tick (beginner lessons too).
5. Reload the page: marks, ticks and the 2-look/full choice are still there.
6. **Please also try a private window.** Most browsers allow storage there but wipe it when the
   window closes, so marks will simply be gone next time and no warning appears. Only if the
   browser blocks storage outright should a line say progress isn't being kept. This couldn't be
   checked from the automated browser. Tests cover the saving code's handling of blocked storage
   (`progress.test.ts`), but not the screen showing that line.

## Please check first

**The 10 algorithms converted to face turns** (D1) are the ones most likely to feel awkward:
OLL 2, 11, 18, 20, 28, 53, 54, 56, 57 and the Aa-perm. Each card shows the usual online version
underneath as "Usual online version". For the 10 converted cards it's the same algorithm
rewritten; for the 18 cards taken from SpeedCubeDB's listed alternatives it's a different
algorithm for the same case. All 65 new algorithms are marked **Proposed** until you check them; the plan's
appendix lists all 78 with where each came from.

## Measurements

**Source:** `src/solver/cfop.measure.test.ts` (skipped in normal runs). To re-run in PowerShell:
`$env:VITE_MEASURE = '1'; npx vitest run src/solver/cfop.measure.test.ts --silent=false`

- **Inputs:** the same 1,000 scrambles as ③b-1 (25 random face turns, `seededRandom(99)`).
- **Run:** 2026-10-08. **Layer turns** don't count whole-cube turns.

| Figure (min / median / max) | 2-look OLL + PLL | Full OLL + PLL |
|---|---|---|
| Layer turns, whole solve | 41 / 84 / 111 | 41 / 69 / 90 |
| Layer turns, last layer only (stages 3–4) | 6 / 42 / 58 | 6 / 26 / 36 |
| Steps on the Solve screen | 16 / 23 / 31 | 15 / 21 / 28 |
| Solves needing no OLL algorithm | 4 of 1,000 | 4 of 1,000 |
| Solves needing no PLL algorithm | 18 of 1,000 | 20 of 1,000 |
| Average time to work out a solve | 7.3 ms | 7.3 ms |

- The 2-look figures match the ③b-1 review notes exactly (84 / 23 medians): the default path is unchanged.
- *Derived:* full OLL + PLL saves a median of 84 − 69 = **15 layer turns** per solve on these scrambles.
- Time depends on the computer and on what else is running. In the same run, the original ③b-1 measurement (2-look only) gave 3.8 ms; ③b-1 recorded 2.9 ms. The cause of the spread wasn't investigated.

**Tests:** 237 passing (2 measurement tests skipped by design). Typecheck and production build green.

## Checked in the browser (2026-10-08)

- OLL: 57 cards in 14 groups (8+2+6+4+4+7+2+4+4+2+2+2+6+4 = 57), one diagram each, one 3D view.
- Diagrams read right: H = cross with 4 side yellows; Sune = cross + 1 corner, 3 side yellows;
  OLL 1 = center only, 8 side yellows; T-perm = all-yellow top with headlights on one side.
- PLL: 21 cards in 3 groups (12 + 5 + 4 = 21).
- Shared marks, saving, reload, lesson ticks and the two-step reset all work.
- Solve → CFOP: the D10 switch keeps an F2L step (Step 2 of 14 stayed) and moves a later step
  to the first yellow-top step. Three random full solves used OLL 45/40/9 and Ua/Y/Gc, no errors.
- No console errors on any tab.

## Rulings made while building (the plan said one thing, the build needed another)

- **Lesson-coverage test.** Narrowed in Task 1 to F2L and 2-look, because the 65 new cards had no lesson yet; restored to the plan's full version in Task 3.
- **Stage titles for "full".** Task 2 used the 2-look titles until Task 3 added lessons 5 and 6, then switched to the final titles.
- **Stress test timeout.** The 800-solve test (200 scrambles × 4 choices) passes but nears Vitest's 5 s default under parallel load, so it has a 60 s limit. The test itself is not reduced.
- **Step text names cards by title.** 2-look steps now say e.g. "the OLL 27 (Sune) case" instead of "the Sune case", the same as full OLL.
- **`AlgorithmCard` has its own file** (`src/app/AlgorithmCard.tsx`). It's now used by three screens.
- **Colors moved to `src/render/colors.ts`** (the table, not just the helper), so the flat diagrams don't load the 3D code.
- **A third diagram style, `oll-edges`,** for the three 2-look first-look cards (line, L, dot). That step ignores the corners, so drawing them would mislead.
- **Extra tests beyond the plan:** diagram directions after L and F; lesson tick/untick; progress updates never change their input; cross and F2L steps identical for either choice.

## Final review (fresh reviewer, 2026-10-08)

No Critical findings; all five Review Focus items confirmed. Fixed:
- **Important: re-tapping the 2-look/full button already on lost your place** (e.g. step 20 of 23
  jumped back to the yellow top, asking for an OLL algorithm on a cube already yellow on top).
  Now nothing moves when the steps didn't change. Test first (red), then the fix.
- **"Usual version" wording** implied every card is the same algorithm rewritten. Now
  "Usual online version: … (this app uses a face-turns-only algorithm)".
- **These notes** overstated what's tested about the private-window line (item 6 above).

Logged, not fixed (minor):
- **The first page load saves straight back**, dropping anything it couldn't read. Only matters if a
  future version adds or renames ids and an older branch is then opened on the same address. With
  two tabs open, the last one to save wins.
- **Reset puts 2-look/full back to 2-look but doesn't move the Solve step,** so the step number
  may then point at a different step of the 2-look plan.
- **Switching OLL while on a PLL step** sends you to the first yellow-top step, which your cube has
  already passed. That's D10 as approved, but it may confuse friends and family. Easy to change.

## Changes from your first look at the app (2026-10-08, decisions #45–#46)

- **One method for the whole app.** Picking Beginner or CFOP on Learn or Solve sets it everywhere and is remembered. The move key follows it (CFOP on Algorithms, every move on the Algorithm player), with a "Show all moves" checkbox. The Learn tab now keeps your lesson when you switch tabs.
- **Learn uses your cube.** Once a cube passes "Check my cube" (no need to press "Solve this cube"), each lesson's example shows that stage of solving your cube, with a switch back to the standard example.
- **Checked in the browser:** a scrambled cube was painted square by square in the editor. Every Learn example (CFOP lessons 1, 2 and 4; beginner lesson 1) matched an independent solve of that cube. On a solved cube, CFOP stages 2–6 say "already done on your cube". The beginner daisy still shows 6 moves, because the method always builds the daisy (open question ③a Q1). The key and the shared method were checked on every tab. No console errors. Tests: 226 passing.

## Second round of feedback (2026-10-08, decisions #47–#49)

- **A solved cube shows nothing to do.** Both methods give one step, "Your cube is already solved!", and no moves. Before, the beginner method took a solved cube apart and back (165 moves). In the beginner method, a white cross that's already made skips the daisy, and the cross stage only turns the cube white side up. This replaces ③a Q1's "faithful to the method".
- **The Algorithms tab follows the method.** Beginner shows your 7 algorithms by stage, each held the way the stage is done (white on top for stages 3–4). CFOP shows the sets in the order you'd learn them, starting with F2L.
- **What the names mean.** Explanations of CFOP, F2L, OLL, PLL, 2-look and Full appear on the Algorithms tab, under the Solve switches, and in the CFOP lessons.
- **Checked in the browser:** a solved cube gives 0 moves in all 10 beginner lessons and all 6 CFOP lessons, and Solve says "already solved". The beginner Algorithms tab shows 7 cards in 6 stage groups, Watch on "Middle edge to the left" starts white side up, and marks are saved. The CFOP explanations and set descriptions show. Tests: 237 passing (a new test proves all 129 cards' algorithms solve the case they're shown with).

## Deferred (your call)

- **"Solved!" missing** when the last layer needs no final top turn (from ③b-1; seen again here).
- **PLL arrows** on the diagrams (D7).
- **Still open from earlier:** the ③b-1 questions (whole cross vs edge by edge; three search-found F2L algorithms) and ③a Q1–Q4.
