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

These come from a throwaway test, deleted afterwards:
- 1,000 scrambles, each made of 25 random face turns (`randomScramble`, `seededRandom(99)`);
- run with `npx vitest run` on 2026-09-28;
- layer turns don't count whole-cube turns (SPIN/TIP/ROLL).

| Figure | Min | Median | Max |
|---|---|---|---|
| Cross, as the app teaches it (one edge at a time) | 3 | 9 | 13 |
| Shortest possible cross, all four edges at once (same scrambles) | 3 | 6 | 7 |
| Layer turns for the whole solve | 41 | 84 | 111 |
| Steps on the Solve screen | 14 | 18 | 29 |

- Crosses that used a back-face turn: 847 of 1,000.
- Solves that needed a piece taken out of the wrong F2L slot first: 375 of 1,000.
- Time to work out a solve: 2.2 ms on average (including building the cross tables on first use).

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
- **Merged top turns.**
  - *The problem:* the top turn that lines up a case can merge with the algorithm's own first turn. The screen showed "U' U R U2 …".
  - *The fix:* back-to-back turns of the same layer are now added together. The result on the cube is the same, but the step may not start literally with the algorithm as printed on its card.
- **Small ones:**
  - a test made stricter (the CFOP demo test);
  - one shared button row for choosing the method;
  - OLL/PLL data written as two short tables.
