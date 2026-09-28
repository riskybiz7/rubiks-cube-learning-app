# Phase ③b-1 review notes (CFOP solve path)

Branch `phase-3b-cfop`, stacked on `phase-3a-beginner`. Plan:
`docs/superpowers/plans/2026-09-28-phase-3b1-cfop-solve.md`.

## What to try

1. `git checkout phase-3b-cfop`, then `npm run dev`, then open http://localhost:5190.
2. **Learn → CFOP**:
   - 4 lessons.
   - F2L lists its 41 cases in 4 fold-out groups.
3. **Solve my cube → CFOP**:
   - Steps through the cross (one edge at a time), F2L slot by slot, then 2-look OLL and 2-look PLL.
   - Algorithm steps show the case card.
4. **Move key** (bottom of every page): choose **CFOP** to see the letters CFOP uses (B included).

## Measurements

**Source:** `src/solver/cfop.measure.test.ts`, kept so the figures can be re-run. It is skipped in normal test runs. To run it in PowerShell:
`$env:VITE_MEASURE = '1'; npx vitest run src/solver/cfop.measure.test.ts --silent=false`

- **Inputs:** 1,000 scrambles, each 25 random face turns (`randomScramble`, `seededRandom(99)`).
- **Run:** 2026-09-28, after the final-review fixes.
- **Layer turns** don't count whole-cube turns (SPIN/TIP/ROLL).

| Figure | Min | Median | Max |
|---|---|---|---|
| Cross, as the app teaches it (one edge at a time) | 3 | 9 | 13 |
| Shortest possible cross, all four edges at once (same scrambles) | 3 | 6 | 7 |
| Layer turns for the whole solve | 41 | 84 | 111 |
| Steps on the Solve screen | 16 | 23 | 31 |

- Crosses that used a back-face turn: 847 of 1,000.
- Solves that needed a piece taken out of the wrong F2L slot first: 375 of 1,000.
- Most pull-outs in a row, with no F2L case in between: 1. A separate test on 1,000 cubes with the cross already done (a harder mix) holds it to 2 or fewer.
- Average time to work out a solve: 2.9 ms. This includes building the cross tables on first use and depends on the computer. An earlier run measured 2.2 ms, before the review fixes.

## Questions for the owner

1. **Cross: one edge at a time, or the whole cross at once?**
   - The spec says "explained edge by edge", so that's what's built. The median is 9 turns and the longest 13.
   - Planning the whole cross at once takes 6 at the median and 7 at the longest, but it's harder to follow as four separate steps.
   - Which do you want, or both (e.g. show the short version as a challenge)?
2. **Three F2L algorithms came from a fewest-moves search** rather than from memory of the usual sets. Worth comparing with how you'd do these cases:
   - F2L 24: `F' U F U2 R U R'`
   - F2L 29: `U F' U' F U' R U R'`
   - F2L 30: `U2 R U R' U2 F' U2 F`

   The plan said four, listing F2L 36 as well, but that was a slip: F2L 36 (`U' F' U F U R U' R'`) is one I proposed from the usual sets. The correct count is 38 proposed + 3 found by search.
3. **All 57 CFOP algorithms are marked "Proposed"** until you check them on your cube. Each one is already proven correct against the app's cube model.

## Decisions (approved 2026-09-28)

- D1 split ③b into ③b-1 and ③b-2;
- D2 face turns only in CFOP algorithms, back turns allowed;
- D3 SPIN/TIP/ROLL on CFOP screens;
- D4 cross search uses the back face;
- D5 the app's own F2L numbering;
- D6 move key: Beginner / CFOP / All moves.

They are logged as #29–#34 in `docs/decisions-log.md`.

## Rulings made while building (the plan said one thing, the build needed another)

- **Cross search.**
  - *Plan:* a depth-limited search with a simple distance estimate.
  - *Built:* an exact distance table (built once, then read).
  - *Why:* the planned version was too slow for a whole cross (about 33 ms each). The table version is instant, and a test confirms it still finds the shortest moves.
- **F2L "take a piece out" choice.**
  - *Plan:* pull out any slot holding a "wrong" piece.
  - *Built:* pull out only a slot holding a piece *another slot needs*.
  - *Why:* yellow top-layer pieces sitting in a slot counted as "wrong", and the solver kept pulling the same slot out forever.
- **Lining up a case is its own step.**
  - *The problem:* the top turn that lines up a case showed up merged with the algorithm, e.g. "U' U R U2 …".
  - *First fix (dropped):* back-to-back turns were added together. The final reviewer pointed out that the moves then no longer matched the algorithm card.
  - *Final:* a separate "Turn the top to line up …" step, then the algorithm exactly as on its card. A test enforces the match.

## Fixed after the final review

A fresh reviewer read the whole branch and ran about 9,000 extra probe solves; none failed. It raised:
- **Garbled arrows** on the Solve screen's Previous/Next buttons ("â—€"). A PowerShell edit had double-encoded them. Fixed, with a new test that scans every source file for this.
- **Algorithm steps that didn't match their cards.** Fixed as described above.
- **Pull-out chains.** Taking pieces out of a slot could chain up to 4–6 times in a row. The solver now looks one step ahead (which slot, and a top turn first), and a test keeps it to 2 or fewer in a row.
- **Figures that couldn't be re-run.** The measurement script had been deleted. It is now kept, as described above.

Smaller points were deferred:
- **Stage 1 message:** doesn't say "the cross is already done" when it is.
- **Pull-out wording:** doesn't name the slot or the piece.
- **Missing "Solved!":** the last step skips the word when no final top turn is needed.
- **Hold test:** covers 5 of the 24 holds (all 24 pass in the reviewer's probe).
- **First-solve delay:** the first CFOP solve spends about 150 ms building the cross table.
- **Small ones:**
  - a test made stricter (the CFOP demo test);
  - one shared button row for choosing the method;
  - OLL/PLL data written as two short tables.
