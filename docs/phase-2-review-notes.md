# Phase ② review notes (for the owner)

Built 2026-09-27 on branch `phase-2-manual-input` while you were away. It's pushed to
GitHub as a pull request, **not merged**: merging is your call after you've tried it.

## What's new

- **Enter my cube** tab: an unfolded map of the cube, a color palette, a live 3D preview,
  and a **Check my cube** button. A valid cube can be sent to the algorithm player as
  its starting point.
- **Validation**, in this order, each in plain English with the squares to re-check outlined:
  blank squares → 9 of each color → centers (duplicates, opposite pairs, mirror image, which
  covers your swapped-GAN-caps case) → impossible pieces → duplicate pieces → twisted corner /
  flipped edge / swapped pieces.
- **Pieces view** behind the scenes (8 corners + 12 edges), as we discussed. It matches the
  published reference tables and rebuilds 300 random scrambles exactly.

## How to try it

```powershell
cd "C:\Users\micha\Claude\Projects\Rubik's Cube"
git checkout phase-2-manual-input
npm run dev
```

Open **http://localhost:5190**. The app now has its own port (see "Decisions" below). When you're
done: Ctrl+C, then `git checkout main` to go back.

Suggested tries with your real cube:
1. Enter your scrambled cube and check it.
2. Deliberately swap two center colors in the map (e.g., make the right center orange and the
   left center red) and check: you should get the mirror-image message.
3. Use "Fill as solved", then swap the two colors of one edge: "edge flipped in place".

## Questions for you

| # | Question | My default for now |
|---|---|---|
| Q1 | On a phone, map squares are about 25 px wide. Comfortable to tap? | Keep; could add a zoomed single-face view later |
| Q2 | Are the "How to read each face" instructions clear with your cube in hand? (Top: green side nearest you. Bottom: green side at the top.) | Keep as written |
| Q3 | Wording: validation says "stickers", the editor says "squares" (e.g. "47 stickers still need a color" vs "47 squares left to fill in"). Pick one? | Mixed for now; I'd pick "stickers" |

## Decisions I made on your behalf

1. **Centers are editable** (pre-filled for white-up / green-front). Otherwise your swapped-caps
   case could never be entered, so the check could never catch it. Spec §4.1 is updated.
2. **The dev server moved to port 5190.** Your "Swarm Studio" project also runs on the default
   port 5173, and during testing the browser opened Swarm Studio instead of this app. I didn't
   touch Swarm Studio.
3. **Stopped a leftover dev server** from phase ① that was still running in the background
   (only this project's server).
4. **Upgraded one review finding and fixed it:** if the algorithm box held a typo when you sent an
   entered cube to the player, the player showed a solved cube while saying "Starting from the
   cube you entered." It now always shows your cube. Checked in the browser before and after.

## Fixed after the independent review

- **A single wrongly entered center wasn't outlined.** Example: right center set to blue by
  mistake. The count check caught it, but outlined the eight correct blue squares on the back and
  never the center itself. The center is now outlined too, with a test.
- The player/typo issue above (decision 4).
- Added a stress test: 2,000 random cubes with correct centers, to push the deeper checks.

## Small items deferred (your call)

- The speed slider goes back to normal speed when you switch tabs.
- If a whole face is entered turned the wrong way, you get several "this corner/edge looks wrong"
  messages. A friendlier hint would be "these are all on the top face: check you read it the
  right way round."
- When two centers are swapped, the two messages repeat the same advice sentence.
- Carried over from phase ①: the old algorithm finishes animating if you break the text mid-play;
  the rare apostrophes `‘` and `´` aren't accepted; no automated tests of the button wiring.

## What the independent reviewer verified (beyond our tests)

- 20,000 extra random scrambles: no false alarms. All 24 ways of holding the cube pass.
- All 15 possible swaps of two center caps are caught; out of all 720 center arrangements,
  exactly the 24 real ones pass.
- 60,000 unusual inputs: no crashes, no empty or garbled messages.
- The "How to read each face" instructions match the map's geometry.

One case no checker can catch: swapping two *pairs* of center caps so the result is just the cube
turned around. That cube really is solvable, so it's not an error.

## Numbers

- 100 automated tests, all passing (61 from phase ①, 39 new).
- Commits on the branch: run `git log --oneline main..phase-2-manual-input` to list them.
