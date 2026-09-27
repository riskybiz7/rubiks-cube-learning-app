# Phase ③a review notes (for the owner)

Built 2026-09-27 on branch `phase-3a-beginner`, which sits on top of phase ② (pull request #2
isn't merged yet). Pushed to GitHub as a pull request, **not merged**.

## What's new

- **Learn** tab (opens first): your 10-stage daisy method, one lesson per stage (hold, goal, how to,
  tips), the algorithms with a badge (**✓ Confirmed** or **Proposed: check against your cube**), and an
  example to watch for every stage.
- **Solve my cube** tab: step-by-step guidance through **your entered cube** or **a random scramble**
  (do the scramble on a solved cube to follow along). The stage list, step text and a 3D player show
  each step; you can go back and forth or jump to a stage. "Solve this cube" on the Enter tab sends
  your checked cube here.
- The algorithm player now plays nothing when the text is invalid. That also fixes the phase ① item
  where the old algorithm kept animating.

## How to try it

```powershell
cd "C:\Users\micha\Claude\Projects\Rubik's Cube"
git checkout phase-3a-beginner
npm run dev
```
Open **http://localhost:5190**. Ctrl+C to stop; `git checkout main` to go back.

## How sure are we that it works?

Every figure below comes from the automated tests or the measuring script described.

- **Every solve is checked before you see it.** The app replays the whole plan and confirms each of
  the 10 stages reaches its goal and the cube ends solved. If that ever failed, you'd see an
  "app bug" message, never a wrong solve.
- **Tests:** 300 random scrambles solved with every stage correct. The independent reviewer ran
  another **3,982** cubes (including all 24 ways of holding it): **0 failures**; slowest solve 7.4 ms
  on a desktop.
- **Your stage 6 procedure is proven in code:** the reverse L works held at the **back and left** and
  done **twice**; the line works held **left to right** and done **once**.
- **Solve length** (1,000 random 25-turn scrambles): **84 to 227 layer turns, median 162**, in **36 to 59
  steps, median 48**. Whole-cube turns aren't counted.

## Questions for you

| # | Question | My default for now |
|---|---|---|
| Q1 | The solver always follows your full method from the daisy, even on a nearly solved cube. A cube one top turn from solved took 48 steps, because the daisy takes the finished cross apart. Keep it faithful, or skip stages that are already done (e.g. start at stage 3 if the white cross is solved)? | Faithful to your method |
| Q2 | Please check the **6 proposed algorithms** on your cube: corner insert `R' D' R D`, middle left `D L D' L' D' F' D F`, middle right `D' R' D R D F D' F'`, yellow edges `R U R' U R U2 R'`, corner cycle `U R U' L' U R' U' L`, corner twist `R' D' R D`. Tests prove they work; the question is whether they're the moves *you* use. | Marked "Proposed" |
| Q3 | Stage 8: the tests prove the edge swap works with the two matching edges at the **back and right**. Is that how you hold it? | Back and right |
| Q4 | Stage 9: the tests prove the corner cycle works with the corner that's already in place held at the **front right**. Is that how you do it? | Front right |

## Decisions I made on your behalf

1. **Progress saving** ("lessons done") moves to phase ③b with the CFOP lessons.
2. **Branch stacked on phase ②:** phase ③a needs phase ②'s code, so its pull request builds on
   phase ②'s. Merge #2 first, then #3.
3. **A typecheck slip, caught and fixed:** one commit went in with a type error. The tests had passed,
   but my check command didn't stop on the error. It was fixed in the next commit, and I now stop on
   any type error before committing.
4. **Upgraded one review finding and fixed it:** when you were already holding the cube right, the
   explanation disappeared. For example, "Turn the bottom until the corner is right below its home"
   didn't say *which* corner. Every case is now explained, with a test.

## Fixed after the independent review

- **Tapping an already-finished stage blanked the Solve screen** (about 1 solve in 4). Every stage now
  always has a step ("This stage is already done, so move on."). Tested.
- **Switching tabs mid-solve lost your place**, and for a random scramble the scramble itself. Now kept.
  Checked in the browser before and after.
- The missing explanations (decision 4).

## Small items deferred (your call)

- Rarely (13 of 3,982 solves), a daisy step knocks off one petal while adding others, and the text
  only names the ones added.
- Stage 7 says "Turn the top until…" even when no turn is needed.
- Whole-cube steps list notation like `z2`, which beginners won't know. The text and animation do
  show the hold.
- Still open from earlier: the speed slider resets per screen; rare apostrophes; a few wording and
  test-coverage items.

## Numbers

- 128 automated tests, all passing.
- Commits on this branch: `git log --oneline phase-2-manual-input..phase-3a-beginner`.
