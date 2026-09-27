# Phase ① review notes (for the owner)

Built 2026-09-27 on branch `phase-1-cube-model` while you were away. Not merged
into `main` yet; that's your call after you've looked at the draft.

## How to see the draft

In PowerShell:

```powershell
cd "C:\Users\micha\Claude\Projects\Rubik's Cube"
npm run dev
```

Then open http://localhost:5173. Stop the server with Ctrl+C.

**Please watch a few moves animate live.** My browser checks ran in a hidden
automation window, where Chrome pauses animations, so I proved the end
positions are right but couldn't watch the motion itself. Try `R U R' U'`, then
`M E S x y z` to see slices and whole-cube turns.

## Questions for you

| # | Question | My default for now |
|---|---|---|
| Q1 | Are you happy with the cube's look (sticker colors, black body, beige background)? | Standard speedcubing colors |
| Q2 | Is the default speed right for beginners? | 0.4 s per move; slider 0.1–1.0 s |
| Q3 | Animations pause if you switch browser tabs and resume when you come back (normal browser behavior). OK? | Leave as is |
| Q4 | Should phase ② also build the "pieces" view of the cube (8 corners + 12 edges)? Spec §3.1/§7 call for it, and the validation checks (twisted corner, flipped edge) need it. | Yes, in the phase ② plan |

## Decisions I made on your behalf

1. **Branch instead of a separate working folder.** I built on the `phase-1-cube-model` branch named in the plan. `main` is untouched.
2. **Package count.** The plan said "12 packages"; it's 11, and those are exactly the ones listed. The plan miscounted; nothing changed.
3. **Kept the move lists grouped.** The auto-formatter spread the move-letter lists out to one letter per line. I kept them grouped (face / wide / slice / rotation) so they're easier to read.
4. **How the browser checks were done.** The automation browser counts as a "hidden" tab, so I advanced the animations with screenshots. I then checked the final picture against the cube model sticker for sticker on all three visible faces. The phone layout was checked in a 375 px-wide frame.
5. **Upgraded one review finding and fixed it.** Invisible characters that some websites hide in copied text used to cause a confusing error with empty quotes (`""`). They're now ignored.

## Fixed after the independent review

- Half turns written with curly apostrophes (`R2’`, `U2′`), which Word and Notes create automatically, were rejected. They're now accepted, with a test.
- Invisible pasted characters (item 5 above), with a test.

## Small items deferred (not fixed; your call)

- If you make the text invalid **while Play is running**, the old algorithm finishes animating. The end state is still correct; it's just confusing.
- The look-alike apostrophes `‘` and `´` are still rejected. The error message explains why.
- No automated test yet for the page's button wiring (e.g. "Play is disabled when the text is invalid"). I checked it by hand.
- The build warns the app bundle is large (the 3D library). Fine for now.

## Numbers

- 61 automated tests, all passing (8 geometry, 16 notation, 20 moves, 6 layout, 11 playback).
- 8 commits on the branch.
