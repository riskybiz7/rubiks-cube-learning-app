# Rubik's Cube Learning App: Design Spec

**Date:** 2026-09-27
**Status:** Approved by owner 2026-09-27. §2, §3, §6, §10 and §11 amended 2026-10-09 for the
guided camera scan (phase ④ plan, decisions #50–#68).
**Inputs:** `docs/decisions-log.md` (decisions 1 to 14), `reference/beginner-method/README.md`
(the owner's 10-stage method, read from photos)

---

## 1. Purpose

A web app that teaches people to solve a 3x3 Rubik's Cube and walks them through
solving **their own scrambled cube**, shown in 3D with animated, step-by-step moves.

| Audience | What they get |
|---|---|
| Friends & family (first-time solvers) | The owner's beginner **daisy method**, in plain English, very visual |
| The owner + keen solvers | **CFOP** content (cross, F2L, OLL, PLL) for fast lookup and learning |

**Success looks like:** a first-time solver enters their scrambled cube, follows the
app stage by stage while copying the moves on their real cube, and ends with a
solved cube, without outside help.

### Non-goals (v1)

- Puzzles other than 3x3
- Accounts, a backend, or a server (everything runs in the browser)
- Shortest-possible ("computer") solutions: every solve is taught method-style
- Roux or other advanced methods
- A solve timer, or turning the 3D cube by hand as practice

---

## 2. Tech stack

| Piece | Choice | Why |
|---|---|---|
| Language | **TypeScript** | JavaScript plus type labels: mistakes show up while writing code, not while running it |
| UI | **React** | Standard way to build multi-screen web apps |
| Build tool | **Vite** | Fast dev server; `npm run dev` / `npm test` / `npm run build` |
| 3D | **Three.js**, used directly inside one React component | The standard web 3D library. The renderer itself has no React dependency, so it stays simple and testable |
| Vision (phase 4) | **Plain TypeScript**, reading colors from the camera picture | The guided grid means nothing has to be found or straightened, so no vision library is needed (decision #56; OpenCV.js was the original plan) |
| Tests | **Vitest** | Runs automatically on every change |
| Storage | Browser `localStorage` | Progress only. Nothing leaves the device |

The layout is **responsive**: on a phone in portrait, the 3D cube sits on top and
instructions sit below it; on a laptop they're side by side.

---

## 3. Architecture

Each module has one job and only depends on modules listed **above** it,
like a model where each tab only reads from earlier tabs.

```
src/
  cube/      Cube model: state, moves, notation, validation. Pure logic. (source of truth)
  content/   Algorithm library + beginner lesson text. Data only.
  solver/    Teaching solvers (beginner, CFOP). Produces a SolvePlan.
  render/    Three.js cube: draws a state, animates moves.
  input/     Manual sticker editor + review screen.            (phase 2)
  vision/    Guided camera scanner.                             (phase 4)
  app/       Screens, navigation, progress storage.
```

### 3.1 `cube/`: the cube model

**Two views of one cube:**

| View | What it is | Used for |
|---|---|---|
| **Stickers** | 54 colors: 6 faces × 9, faces in order U R F D L B, each read row by row | Input/output: the editor, the scanner, drawing |
| **Pieces** | 8 corners + 12 edges: where each piece is and how it's twisted/flipped | All logic: moves, validation, the solvers |

Conversion goes both ways, and a test proves that converting there and back gives
the original.

**Notation** (standard Singmaster/WCA): face turns `U D R L F B`, with `'` (counter-clockwise)
and `2` (half turn); wide turns `u d r l f b`; slices `M E S`; whole-cube rotations `x y z`.
The parser rejects anything else with a clear message.

**Public functions (shape, not final names):**
- `solved()` → cube
- `applyMoves(cube, "R U R' U'")` → new cube (never changes the original)
- `invert("R U R'")` → `"R U' R'"`
- `fromStickers(colors)` / `toStickers(cube)`
- `validate(colors)` → `{ ok: true }` or a list of problems (see §5)

### 3.2 `content/`: algorithm library

Each algorithm is a data record with its **provenance**:

```ts
{
  id: "PLL-T",
  set: "PLL",                 // BEGINNER | F2L | OLL | PLL | OLL-2LOOK | PLL-2LOOK
  name: "T-perm",
  moves: "<algorithm in standard notation>",
  provenance: "claude-proposed",       // or "owner-confirmed"
  notes: "..."
}
```

- The **case** an algorithm solves is derived from the algorithm itself: apply its
  inverse to a solved last layer (or solved slot) and that's the case. The library
  can't disagree with itself.
- **Provenance is shown in the app** on the Algorithms screen. Nothing is silently
  presented as "the owner's".

**Planned contents:**

| Set | Cases | Source of the count |
|---|---|---|
| Beginner stages | 10 stages, owner's method | Owner's photos |
| F2L | 41 | Standard count, **verified by an enumeration test** (§7) |
| OLL, full | 57 | Standard count, verified by an enumeration test |
| PLL, full | 21 | Standard count, verified by an enumeration test |
| 2-look OLL | 3 edge cases (dot, L, line) + 7 corner cases | Standard, verified by an enumeration test |
| 2-look PLL | 2 corner cases + 4 edge cases | Standard, verified by an enumeration test |

The case counts are the widely cited figures. The enumeration tests generate every
possible last-layer (or slot) state and confirm that each one maps to exactly one case
in the library. That ties the counts out in code instead of taking them on trust.

### 3.3 `solver/`: teaching solvers

Both solvers take a validated cube and return a **SolvePlan**:

```ts
SolvePlan = { method, startCube, stages: Stage[] }
Stage     = { id, title, goal, explanation, steps: Step[] }
Step      = { kind: "moves",  moves, caseId?, explanation }
          | { kind: "rotate", rotation, instruction }   // e.g. "turn the cube over"
          | { kind: "check",  instruction }             // e.g. stage 7: look, don't turn
```

**Self-check (always on):** before a plan is returned, the solver replays every step on
`startCube` and asserts the result is solved, and that each stage's goal holds at
the end of that stage. If either fails, it returns an error instead of a plan.

"Intuitive" stages (daisy, CFOP cross) use a **small search**: try short move
sequences until the stage goal is met, preferring the shortest. Explanations for those
stages are templated ("bring this white edge up next to the yellow center").

### 3.4 `render/`: 3D view

- Draws any cube state; animates a move list with **play / pause / step forward /
  step back / speed**; drag to rotate the view.
- Shows the "hold" orientation (which color is on top and which faces you), so the screen
  matches the user's hands.
- **Turning the cube over** (beginner stages 2 and 5) is instructed by naming the **end
  position** ("white on top, green center facing you"), as cubing tutorials do, not by
  describing a roll or tip. It works however the user flips it. To be revisited with the owner
  once the app is running.
- Also draws a flat **top-down case diagram** (for OLL/PLL/F2L cards).

### 3.5 `input/` and `vision/`

Both output the same thing, 54 sticker colors, and both end at the same **review
screen**: a flat "unfolded cube" map where any sticker can be tapped to fix it.
Details in §4.1 and §6.

### 3.6 `app/`: screens

| Screen | What it does |
|---|---|
| **Home** | Choose Learn, Algorithms, or Solve My Cube |
| **Learn** | Two tracks. **Beginner:** 10 lessons, one per stage. **CFOP:** Cross → F2L → 2-look OLL → 2-look PLL → full OLL → full PLL. Each lesson has the goal, a 3D demo, the moves, and why they work. |
| **Algorithms** | Browse F2L / OLL / PLL cards (case diagram, algorithm, 3D animation, provenance badge). Mark each case *learning* or *learned*. |
| **Solve My Cube** | Enter cube → validate → pick method → guided playback (§4) |

**Progress** (lessons done, per-case learning status) is saved in `localStorage`.

---

## 4. Data flow: a "Solve My Cube" session

```
Enter cube ──► Validate ──► Pick method ──► Build SolvePlan ──► Guided playback
(54 colors)   (is it real?)  (Beginner/CFOP)  (self-checked)      (3D + real cube)
```

1. **Enter:** manual editor (phase 2) or scanner (phase 4). Output: 54 colors.
2. **Validate:** §5. Problems are shown in plain English; the user fixes them on the review map.
3. **Pick method:** Beginner or CFOP. The app shows how to hold the cube, with the 3D view matching.
4. **Build plan:** solver + self-check (§3.3).
5. **Playback:** step through one move or one stage at a time, forward or back, copying the
   moves on the real cube. **"Re-enter my cube from here"** starts a fresh plan from wherever
   the user's cube actually is (for when they get lost).
6. **Progress:** saved locally.

### 4.1 Manual editor (phase 2)

- Unfolded-cube map; pick a color, tap stickers. Centers are pre-filled for the reference
  hold but **editable**, so a cube whose center caps were swapped during reassembly can be
  entered as it really is and caught by validation (owner request, 2026-09-27).
- A live 3D preview mirrors the map.
- A "Check my cube" button runs validation and highlights the problem stickers.

---

## 5. Validation rules

Checked in this order; the first failures are reported in plain English:

| Check | Example message |
|---|---|
| Every square has a color | "3 squares still need a color." |
| 9 squares of each color | "10 reds and 8 oranges: one orange square was probably entered as red." |
| 6 different center colors | "Two centers are both white; each face has its own center color." |
| Centers match the standard color scheme (white/yellow, red/orange, green/blue opposite; not a mirror image). Added 2026-09-27 at the owner's request: center caps on some cubes (e.g., GAN) can be swapped during reassembly | "The red and orange centers should be on opposite sides." / "The centers are a mirror image of a standard cube; two center caps may have been swapped." |
| Every corner/edge is a real piece, no duplicates | "There's a red-orange edge, but red and orange are opposite sides and never touch." |
| Corner twist adds up | "One corner is twisted in place. This usually means a sticker was entered wrong, or the cube was taken apart and reassembled." |
| Edge flip adds up | Same style |
| Piece swaps balance (parity) | Same style |

---

**Wording (owner, 2026-09-27):** everything the user reads says **"squares"** for the colored
faces of the small cubes, never "stickers". ("Sticker" remains the internal term in the code.)

## 6. Camera scanner (phase 4)

*Rewritten 2026-10-09 for the **guided** scan (decision #50, which replaces the free-form
design of #6; that version is in git history).*

Runs entirely **on the device**. No video is uploaded or recorded.

**Guided steps** (#57). The screen shows a 3×3 grid over the camera picture and says which
face to show:
1. Green facing the camera, white on top.
2. SPIN LEFT three times: red, then blue, then orange.
3. SPIN LEFT once more (green again), then TIP FORWARD: white, with green at the bottom.
4. TIP TWICE: yellow, with green at the top.

After each hold, the camera sees that face exactly as the app stores it (proven by a test
against the cube model).

**For each face:**
1. **Read 9 colors** from the middle of each grid cell. Each color is the median of the
   cell's middle half, in Lab, a color format that separates lightness from color. No vision
   library is needed (#56).
2. **Take it** automatically once the picture holds steady for a short moment, is bright enough,
   and isn't a face already scanned. A "Take it now" button overrides this (#58).

**Live feedback:** a color dot on each square, a flat 6-face map that fills in (#61), and hints
("hold still", "more light", "already scanned").

**After all 6 faces:**
- **Red/orange fix** (#59): the cube's own centers are the color references under the current
  lighting. Each square takes its nearest center's color. While a color has more than 9, the
  cheapest square moves to a color with fewer, ending at exactly 9 of each. Close calls are
  marked unsure.
- **Holding slips** (#60): only if the cube fails §5.
  1. Place each face by its center color, which fixes a SPIN or TIP made the other way.
  2. Then try all 4⁶ = 4,096 face-turn combinations, using the one with the fewest turned faces
     if exactly one passes. If several pass, don't guess: a note asks the user to check.
- **Review screen:** the manual editor, pre-filled, with unsure squares marked by a dashed outline
  and "?" (#61).

**Cameras** (#62): phones use the back camera. Computers use the webcam, shown mirror-image
but always read from the un-mirrored picture.

**Accuracy is measured, never guessed:** it is reported only from test scans in
`reference/camera-test/`, taken with the app's test mode (#63–#66). The truth comes from a
known scramble. Tuning uses batch A; the reported figure comes from batch B.

**Phone access:** browsers allow camera use only on `localhost` or `https://`. Decided: the app
is published on GitHub Pages (#51, #67).

---

## 7. Testing

| Area | What proves it |
|---|---|
| Cube model | Any face turn ×4 = unchanged; moves then their inverse = unchanged; `(R U R' U')` ×6 = unchanged; stickers → pieces → stickers round-trips |
| Validation | Deliberately broken cubes (wrong counts, impossible piece, twisted corner, flipped edge, single swap) are each rejected with the right message |
| Every algorithm | Set up its case, apply it, assert the goal (slot solved / last layer oriented / solved) |
| Case enumeration | Generate every possible state and group states that count as "the same case"; each group must map to exactly one library case. **OLL:** last-layer orientation patterns, the same case if they differ only by viewing angle (`y`). **PLL:** last-layer permutations, the same case if they differ by viewing angle and/or a final top turn. **F2L:** one slot's corner + edge (each in the top layer or in that slot), the same case if they differ only by a top turn. Confirms the 57 / 21 / 41 counts (solved excluded) and the 2-look sets in code |
| Beginner solver | Stress test on a large batch of random scrambles: every stage meets its goal and every solve ends solved |
| CFOP solver | Same stress test. The longest cross solution found is **measured and reported**, not assumed |
| 3D / screens | Light automated checks + owner review by eye |
| Scanner | Accuracy on the camera test set |

---

## 8. Beginner method content (owner's version)

Source of truth: `reference/beginner-method/README.md`. Algorithms stay
**unconfirmed** until the owner checks them; every algorithm, confirmed or not,
must also pass its automated test before it ships.

| # | Stage | Hold | Proposed approach |
|---|---|---|---|
| 1 | Daisy | yellow up | Intuitive (small search): bring 4 white edges up around the yellow center |
| 2 | White cross | yellow up → **turn over, white up** | **Owner's procedure (confirmed):** per petal, turn the top until the petal's side color matches that side's center, then turn that face twice (`F2`) to send it down. After all 4, turn the cube over |
| 3 | White corners | white up | Turn the whole cube so the target slot is front-right; turn the bottom to put the corner directly below it; repeat `R' D' R D` until solved. Corners stuck in the top layer are popped down first |
| 4 | Middle layer | white up | Edge at bottom-front whose front color matches the front center → **front-left:** `D L D' L' D' F' D F`; **front-right:** `D' R' D R D F D' F'`. Edges stuck in the middle layer are pulled out first |
| 5 | Turn over + read the top | → yellow up | No moves. Turn over, then identify the yellow pattern on top: **dot**, **reverse L** (owner's term; photo 5.0), or **line**. The pattern sets how many times stage 6's algorithm is done |
| 6 | Yellow cross | yellow up | **Owner's procedure (confirmed):** **line** → algorithm once. **Reverse L**, held as in photo 5.0 → algorithm twice in a row, with no re-positioning in between. **Dot** → algorithm once, turn the cube so the reverse L is held as in photo 5.0, then twice. Algorithm: `F R U R' U' F'` (**owner-confirmed**). Tests must prove this exact procedure reaches the cross from every starting case |
| 7 | Check edges | yellow up | No moves. Turn the top to line up as many edges as possible; classify: all 4 / two adjacent / two opposite / none |
| 8 | Yellow edges | yellow up | `R U R' U R U2 R'`; hold position proven by tests. Opposite/none case: do it once from any angle, then re-check |
| 9 | Position corners | yellow up | `U R U' L' U R' U' L`; hold position proven by tests. No-correct-corner case: do it once, then re-check |
| 10 | Twist corners | yellow up | `R' D' R D` repeated until the front-right corner shows yellow on top; then turn **only the top** to bring the next corner in. The lower layers look scrambled midway, and the lesson must say so up front so beginners don't panic |

**Cases the photos don't show** (stage 7/8 opposite or no matches, stage 9 no correct
corner) are drafted by Claude and flagged for owner review.

## 9. CFOP content

- **Hold:** white cross on the bottom, yellow on top: the same as beginner stages 5 to 10.
- **Cross:** small search for a short solution; explained edge by edge.
- **F2L:** solve one slot at a time: pick the slot whose pieces are easiest to reach, pull out
  stuck pieces if needed, turn the top into the case position, look up the case (of 41), and apply it.
- **OLL / PLL:** recognize the case (checking all 4 top-layer turns), turn the top, apply.
  The learner picks **2-look** or **full** per set. The solver uses whichever is chosen.
- All CFOP algorithms are proposed by Claude from widely used sets, marked *unconfirmed*,
  and must pass §7 before they ship.

---

## 10. Build phases

| Phase | Delivers | Done when |
|---|---|---|
| **① Cube model + 3D** | Project setup; `cube/`; `render/`; a page where you type an algorithm and watch it animate | Model tests pass; owner sees `R U R' U'` animate correctly |
| **② Manual input** | Editor, validation, review map, 3D preview | Every broken-cube test rejects correctly; owner can enter their real cube |
| **③a Beginner** | Beginner content + solver; Learn (beginner track); Solve My Cube (beginner) | Stress test passes; **owner walks through a real solve and checks the algorithms (first full draft)** |
| **③b CFOP** | CFOP content + solver; Learn (CFOP track); Algorithms screen | Enumeration + stress tests pass; owner reviews algorithms |
| **④ Camera** | Guided scanner + review, in three parts (#55): ④a online (GitHub Pages), ④b camera and test mode, ④c tune and measure | Accuracy on the owner's test batch B is measured and accepted by the owner |

Each phase gets its own implementation plan, written just before it starts.

---

## 11. Open items (decide during review or later)

| Item | When |
|---|---|
| Owner review of all *unconfirmed* algorithms | During phase ③a/③b |
| Wording of the extra stage 7 to 9 cases | Phase ③a |
| Phone camera access: local HTTPS vs. free hosting (putting the app online is the owner's call) | **Decided 2026-10-09:** public repo + GitHub Pages (#51) |

## 12. Future ideas (not planned)

- A practice drill for OLL/PLL recognition, and a solve timer.
- If the owner ever uses a Bluetooth "smart" cube, some browsers (e.g., Chrome) can read
  its state directly. That would be a different way to mirror the real cube.
