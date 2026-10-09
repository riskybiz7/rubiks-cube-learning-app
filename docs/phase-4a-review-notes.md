# Phase ④a review notes (online)

Branch `phase-4a-online`, from `main`. Plan: `docs/superpowers/plans/2026-10-09-phase-4-guided-camera.md`
(approved 2026-10-09; decisions #50–#68). No app behavior changes in this part: it gets the app
ready to go public and publish itself.

## What changed

- **README** rewritten. It said "Status: design phase". It now covers what the app does, the live
  link, how it's checked, how to run it, and the license. Camera scanning shows as "in progress";
  there are no accuracy claims.
- **LICENSE**: MIT, copyright Michael Riskind (#52).
- **CLAUDE.md**:
  - line 110 reworded as approved;
  - the no-co-author rule;
  - the phase ④ status;
  - "guided" in place of "free-form".
- **`.gitignore`**: everything in `reference/camera-test/` except its README stays on this PC (#51).
- **`vite.config.ts`**: `base: './'`, so the built app works at GitHub's address
  `/rubiks-cube-learning-app/`.
- **`.github/workflows/publish.yml`** (#67): on every pull request, install, run all tests, then
  build. On `main` it also publishes to GitHub Pages.
- **Docs:**
  - decisions #50–#68, with #6 marked as replaced by #50;
  - spec §2, §3, §6 (rewritten for the guided scan), §10 and §11.

## Checks done (2026-10-09)

- **Secret scan of all history** (every added or removed line, every file name ever committed). It
  found no keys, passwords, tokens or `.env` / key files. The only hits were the plan's own
  description of the scan, the workflow's `id-token` permission, and a variable named `token` in
  the move parser.
- **Every author and committer email** is GitHub's no-reply address. Author names: "Michael
  Riskind" on 68 commits; "riskybiz7" on 4 merge commits made on GitHub.
- **Tracked files outside `src/` and `docs/`:** config files, the READMEs, `index.html`, and the 21
  beginner-method photos. The photos were already checked on 2026-10-08.
- **The ignore rule:** a file in `reference/camera-test/batch-a/` is ignored; the README isn't.
- **The build at a sub-address:** `npm run build`, then the `dist/` folder was served from a
  folder named `rubiks-cube-learning-app`. The page, the script (850,141 bytes) and the stylesheet
  (4,103 bytes) all answered 200, and the page title was right. The built page refers to its
  files as `./assets/…`.
- **The workflow file** parses as valid YAML (Prettier read it and left it unchanged). It hasn't
  run yet: its first real run is this PR's own check.
- **Tests:** 237 passing, 2 measurement tests skipped by design. Typecheck and production build
  green. The build's "chunk larger than 500 kB" warning was already there before this PR (it's
  the 3D library).

## Going public (owner's go needed)

In this order, once you say go:

1. Make the repo public (`gh repo edit … --visibility public`, or Settings → General →
   Change visibility).
2. Turn on GitHub Pages, published by Actions.
3. Merge this PR with **Create a merge commit**. The push to `main` runs the workflow, which
   publishes the app.

Then check the Actions run is green and the link opens.

### Done (2026-10-09, on the owner's go)

- The repo was made public, then GitHub Pages was turned on (published by Actions).
- PR #6 was merged as merge commit `11d7094`.
- **Publish run 37982494948:** test-and-build and publish both green.
- **The live link** answered 200 with the app's title. The script and stylesheet had the same
  names and sizes as the local build.
- **In Chrome:**
  - all 5 tabs open, each with its heading and 3D view;
  - no console errors, including during a fresh reload.

## What to try once it's live

1. Open **https://riskybiz7.github.io/rubiks-cube-learning-app/** on your iPhone and on the PC.
2. Every tab should work as on localhost.
3. **The phone-layout check** from decision #22: Learn, Solve and Enter my cube on the phone.
4. Saved progress there starts empty: it's a different address from localhost, so marks made on
   localhost don't carry over.
