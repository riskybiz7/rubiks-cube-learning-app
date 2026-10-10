# Phase ④c: next steps (camera tests)

Your checklist for the camera tests. It's also what a fresh Claude Code session reads to pick up
where we left off. Written 2026-10-09, right after PR #7 was merged.

## Where things stand

- The app is **live** at https://riskybiz7.github.io/rubiks-cube-learning-app/. Every merge into
  `main` republishes it within a few minutes.
- **The camera scanner is hidden until its accuracy is measured:**
  - add `?scan` to the address to see it;
  - add `?scan=test` for test mode.
  - Everyone else sees the app without it.
- Merged so far: PRs #1–#7. No scanner accuracy figures exist yet: they come from your test
  scans below.
- The ④c work happens on branch `phase-4c-tune`, which holds this file. **285 tests pass** on it.
- **Update, 2026-10-09 evening:** the first two PC-webcam scans showed auto-capture taking the
  wrong faces (`reference/camera-test/batch-a/notes.md`). So, on this branch only for now:
  - test mode takes a face only when you press **📷 Take this face** (decision #69);
  - the scramble stays until you press **New scramble** (decision #70).
  The live site gets these once this branch is merged. Until then, test on the PC with
  `npm run dev` (http://localhost:5190/?scan=test).

## Your next steps

### 1. PC webcam check (about 5 minutes)

1. Open PowerShell in the project folder and run `npm run dev`.
2. Open http://localhost:5190/?scan=test, then go to **Enter my cube** → **Scan with camera**.
3. Pick any light and press **Start the camera**. Allow the camera when the browser asks.
4. Check and note down:
   - [ ] The colored dots sit on the squares you see. The picture is mirror-image, like a mirror.
   - [ ] Each face is taken by itself once you hold still. "Got it ✓" shows, and the
     instruction moves on.
   - [ ] After 6 faces, the finish screen shows a score. (It only means something if you
     scrambled with the moves shown.)
   - [ ] **Download test scan** saves a `.json` file.
   - [ ] **Review on the map** shows the cube you scanned.

### 2. iPhone check (about 5 minutes)

1. In Safari, open https://riskybiz7.github.io/rubiks-cube-learning-app/?scan=test.
2. **Enter my cube** → **Scan with camera** → pick a light → **Start the camera**, and allow the
   camera.
3. Check:
   - [ ] The video is live, not frozen or black.
   - [ ] It uses the **back** camera, and the picture is **not** mirrored.
   - [ ] **Download test scan** works (it usually lands in Files › Downloads), and/or
     **Share test scan…** does.

### 3. Batch A: 8 test scans (about 25 minutes, an estimate)

The full instructions are in `reference/camera-test/README.md`. In short:

1. Start from a **solved** cube held white on top, green facing you.
2. Do the 15 moves the screen shows, exactly as written. Some scrambles turn the same layer
   twice with the opposite face in between (like `U D' U2`). That's valid; just do it as written.
   The scramble stays until you press **New scramble**, so a repeat scan in the same conditions
   needs no re-scrambling.
3. Pick the light you're really in, press **Start the camera**, then press **📷 Take this face**
   for each of the 6 faces.
4. **Save every scan, good or bad.** Leaving out bad ones would flatter the result.

| Camera | Daylight | Lamp | Dim |
|---|---|---|---|
| iPhone back camera | 2 | 2 | 2 |
| PC webcam | 1 | 1 | – |

**Getting the iPhone files to the PC:** for example, iCloud Drive, or **Share test scan…** → Mail
to yourself. Put all 8 files in `reference/camera-test/batch-a/` (create the folder). They are
gitignored: they stay on your PC and are never uploaded.

### 4. Tell Claude

In a fresh terminal, open the project folder, start Claude Code, and say something like:

> Batch A is in reference/camera-test/batch-a. Measure it and write the ④c plan.

Claude reads `CLAUDE.md` and its memory, runs the measurement, reports the first accuracy figures
(by camera and light), and writes the ④c tuning plan for your review.

## What's worth noting while you test

These help the tuning in ④c. Plain notes are fine.

- **Auto-capture:**
  - Does it take faces too quickly, or keep saying "Hold still…"? (It waits 0.7 s.)
  - Does it ever say "You've already scanned this face" when you haven't? Press **Take it now**
    when that happens, and note the colors involved. Red and orange are the usual suspects
    under a lamp.
  - Does "It's a bit dark" appear in light you'd call normal?
- **The finish screen:** how many squares it got right, and whether the wrong ones were marked
  "?". The files keep all of this anyway.

## If something goes wrong

- **"The camera wasn't allowed":** allow it for the site, then try again.
  - iPhone: usually Safari's page menu next to the address → Website Settings → Camera, or the
    Settings app → Safari → Camera.
  - PC: the camera icon in the address bar.
- **The camera is stuck on "Hold still…":** press **Take it now**.
- **A face was taken by mistake:** press **Redo last face**.
- **GitHub's "Unicorn!" error page:** reload. GitHub Pages hiccups sometimes, especially right
  after a merge.
- **Saved progress** (lesson ticks, card marks) is separate for each device, and for localhost
  versus the live site. That's expected (sharing between devices was left for later).

## Handy commands (PowerShell, from the project folder)

| Command | What it does |
|---|---|
| `npm run dev` | The app at http://localhost:5190 |
| `npm test` | All tests (285 expected to pass) |
| `$env:VITE_MEASURE = '1'; npx vitest run src/vision/measure.test.ts --silent=false` | Scanner accuracy on the saved test scans |

## Still open from earlier phases (no rush)

- Check the 10 algorithms converted to face turns: OLL 2, 11, 18, 20, 28, 53, 54, 56, 57 and the
  Aa-perm (`docs/phase-3b2-review-notes.md`).
- Saving progress in a private window.
- The open ③a questions (Q2–Q4) and ③b-1 questions.
- Logged small items:
  - "Solved!" is missing when the last layer needs no final turn;
  - PLL arrows on the diagrams.
- The phone-layout check from decision #22, now easy on the live link.
