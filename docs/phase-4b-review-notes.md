# Phase ④b review notes (camera and test mode)

Branch `phase-4b-camera`, from `main`. Plan: `docs/superpowers/plans/2026-10-09-phase-4-guided-camera.md`
(Tasks 4–12; decisions #50–#68). **No accuracy figures exist yet.** They come from your test scans in ④c.

## What to try

**On the PC, with the webcam,** before merging:
1. `npm run dev`, then open http://localhost:5190/?scan=test.
2. **Enter my cube**, then **Scan with camera**.
3. Mix a solved cube with the moves shown, pick the light, then **Start the camera**.
4. Check:
   - the colored dots sit on the squares you see (the view is mirror-image, like a mirror);
   - each face is taken by itself once you hold still (about 0.7 s);
   - after 6 faces, the score shows, and **Download test scan** saves a file;
   - **Review on the map** shows your cube.

**On the iPhone,** after merging (the live site updates by itself):
1. Open https://riskybiz7.github.io/rubiks-cube-learning-app/?scan=test.
2. Allow the camera; the back camera should be used.
3. Do one test scan and save it with **Download** (Files › Downloads) or **Share…**.
4. Then batch A (see `reference/camera-test/README.md`) can start.

Without `?scan` on the link, the app looks exactly as before: no scan button.

## What's built

- `src/vision/`:
  - `color.ts`: reads 9 colors from the grid picture (Lab, medians);
  - `guide.ts`: the 6 guided steps;
  - `sort.ts`: 9 of each color, using the cube's own centers;
  - `assemble.ts`: faces → cube, fixing a SPIN/TIP made the other way or a face held turned;
  - `pipeline.ts`: pictures in, cube out;
  - `watch.ts`: steady, too dark, already scanned;
  - `testScan.ts`: the test-file format and scoring;
  - `camera.ts`: start/stop, grab the grid square.
- `src/vision/measure.test.ts`: the accuracy table over `reference/camera-test/` (skipped in normal
  runs; how to run it is in the camera-test README).
- `src/app/ScanScreen.tsx`: intro (with camera problems), live grid with dots, auto-capture,
  **Take it now**, **Redo last face**, a flat map filling in, and test mode's finish screen.
- **Enter my cube:** the **Scan with camera** button (only on `?scan`). Unsure squares get a dashed
  outline and "?". Painting a square clears its mark; **Start over** clears them all.

## Checks done (2026-10-09)

**Tests:** 276 passing (39 new for the scanner), 3 measurement tests skipped by design. Typecheck and
production build green.
- **The holds:** for 200 scrambles, each step's camera view equals that face as the app stores it,
  and the on-screen words lead from each hold to the next.
- **Holding slips** each end at the right cube:
  - SPIN RIGHT instead of LEFT;
  - TIP BACK instead of FORWARD;
  - tipping without spinning back to green (white and yellow both turned).
- **Not "fixed" away:** a real misread and swapped center caps are left for the check to report.
- **Sorting:** always exactly 9 of each color (100 noisy scans); two orange squares that read
  slightly red come back orange and marked unsure.
- **End to end:** 10 scrambled cubes read correctly from noisy synthetic pictures.
- **The measurement script** was run on synthetic files (deleted afterwards). It printed per-scan
  lines and totals that re-foot, and set a slip aside. Those files say nothing about real
  accuracy.

**In the browser, with a fake camera** (a drawn cube fed in as video; your real webcam was never
turned on):
- **A full scan:** each face was taken automatically, and the map matched the scrambled cube on
  all 54 squares. Check my cube says it's real and solvable.
- **Repeats:** the face just taken isn't taken again while still in view, even when darkened to
  70% as by a shadow.
- **Redo** goes back a face, with no "Got it" flash.
- **Unsure squares:** an in-between red/orange square came back orange, marked "?", with the
  message. Painting it cleared the mark; Start over cleared everything.
- **Camera problems:**
  - refused, or no camera: the right message, and **Enter by hand instead** works;
  - a dark picture: "move to more light";
  - a camera that dies: the scan stops and says so.
- **The camera turns off** when leaving by a tab (its track went from "live" to "ended") and at
  the end of a scan.
- **Test mode:**
  - the scramble shows; Start stays disabled until a light is picked;
  - the finish screen gave the score and flagged a deliberate slip;
  - the saved file had the right format, 6 faces of 150×150 pixels, and the answer.
  - Size of a synthetic scan's file: **735 KB**. Real photos make larger preview pictures, so
    real files will be somewhat bigger.
- **No console errors.**

**Not checkable here** (your device checks):
- that a real webcam's dots line up (mirroring);
- that the iPhone shows live video and uses the back camera;
- what saving looks like on the iPhone.

## Rulings made while building (the plan said one thing, the build needed another)

- **Saving:**
  - The plan said "share sheet on iPhone, download on computer". Chrome on Windows also has a
    share sheet, where you'd want a plain file. So the screen offers **Download test scan**
    everywhere, plus **Share test scan…** wherever sharing works.
  - The file name uses UTC time.
- **"Already scanned"** (found in review): the plan compared centers only. Right after a face is
  taken, a hand's shadow can shift its center past the limit, and the same face would be taken
  again as the next one. Now a face also counts as already scanned when 8 of its 9 squares read
  the same colors. Tested both ways: a shadowed face is caught, and 50 scrambles never mistake
  different faces.
- **The repeat hint** adds "If it isn't, press Take it now." Under a warm lamp, red and orange
  centers can look alike.
- **Test mode has no default light.** You pick it for every scan, so no file is mislabeled
  "daylight" by accident.
- **A camera that stops mid-scan** ends the scan with a message ("The camera stopped…"). Otherwise
  its frozen picture could be taken as a face.
- **New test helpers:**
  - `src/test-utils/scans.ts` plays the camera with the cube model;
  - `src/test-utils/frames.ts` paints grid pictures.
- **`earlierFaceLike` takes whole faces,** not just centers (follows from the repeat fix).
- **My own test bug, fixed:** the first "700 ms of still readings" helper stopped at 660 ms.
- **PC webcams:** the browser usually doesn't say which way a webcam faces, so test files list
  the PC webcam as camera "unknown". The measurement groups it that way.

## Review (adversarial self-review, 2026-10-09)

The whole diff was checked for races, camera lifecycle, data integrity, error paths, and
behavior without `?scan`. Fixed, each with a test first where one was possible:
- the shadow repeat;
- the repeat hint's wording;
- the "Got it" flash after Redo;
- the camera dying mid-scan;
- the light default;
- a test file with missing or broken pixels: it's now reported instead of crashing the
  measurement (test first: it failed with InvalidCharacterError).

Checked and left as is:
- "Take it now" can force a duplicate face. That's the point of an override, and the check catches
  the result.
- **Thresholds** (0.7 s hold, drift 6, dark below L 25, same center within 12, unsure gap 10) are
  starting values, to be tuned on batch A in ④c.
- Working out the cube takes one pass of up to 8,190 checks (measured 50 ms per 4,096 on this PC).
- Scanning replaces whatever was painted by hand. That's expected; **Cancel** keeps it.

## Next

Merge (Create a merge commit). Then do your iPhone check and **batch A** (8 scans,
`reference/camera-test/README.md`), and I'll write the ④c plan from its results.
