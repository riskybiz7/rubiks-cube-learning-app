# Beginner method: stage photos

Photos of the owner's beginner (daisy) method, one set per stage, showing the
cube at the **end** of each stage.

## File naming

Full-resolution originals sit in this folder and are **not** in git (54.0 MB).
Resized copies (longest side 1500px, 7.6 MB total) are in `small/` and **are** in git.

- `N.0.jpeg`: top-down view at the end of stage N
- `N.1.jpeg`: angled view (top + two sides)
- Exceptions:
  - Stage 5 (flip) and stage 7 (check) involve no moves.
  - Stage 10 has three photos: `10.0` top, `10.1` and `10.2` all sides (two at a time).

## Stage map (read from the photos by Claude, 2026-09-27)

| # | Stage | Cube held | Moves? | What the photos show |
|---|---|---|---|---|
| 1 | Daisy | yellow up | yes | Yellow center with 4 white edges around it |
| 2 | White cross | **white up** | yes | White cross; each cross edge matches its side center |
| 3 | White corners | **white up** | yes | Whole white face done; top row of every side matches its center |
| 4 | Middle layer | **white up** | yes | Top two layers of every side solved |
| 5 | Flip | yellow up | **no** | Cube turned over; first two layers now on the bottom |
| 6 | Yellow cross | yellow up | yes | Yellow cross on top; corners not yet yellow |
| 7 | Check edges | yellow up | **no** | Two adjacent top edges match their side centers (7.0); the other two don't (7.1) |
| 8 | Yellow edges | yellow up | yes | All four top edges match their side centers |
| 9 | Position corners | yellow up | yes | Every top corner in its correct spot but still twisted |
| 10 | Twist corners | yellow up | yes | Solved |

**Confirmed by owner (2026-09-27):** stages 2 to 4 are done white-side up, so there
are two turnovers: white up after the daisy, then back to yellow up at stage 5.

## Color scheme (confirmed from photos 5.1, 10.1, 10.2)

Standard: white opposite yellow, red opposite orange, blue opposite green.
With yellow on top: orange front → blue on the right; red front → green on the right.

## Proposed algorithms (UNCONFIRMED: Claude's proposals, not yet checked by the owner)

Each one must also pass an automated test before it ships in the app.

| Stage | Proposed moves | Status |
|---|---|---|
| 1 Daisy | Intuitive (no fixed algorithm) | unconfirmed |
| 2 White cross | Match each petal to its side center, then turn that face twice (`F2`) | unconfirmed |
| 3 White corners | White up, corner directly below its slot: repeat `R' D' R D` until solved | unconfirmed |
| 4 Middle layer | White up, edge at bottom-front. To the **front-left** slot: `D L D' L' D' F' D F`. To the **front-right** slot: `D' R' D R D F D' F'` (the standard yellow-up pair, turned upside down) | unconfirmed |
| 6 Yellow cross | `F R U R' U' F'`, repeated as needed (dot → L → line → cross) | unconfirmed |
| 8 Yellow edges | `R U R' U R U2 R'` (hold position to be proven by test) | unconfirmed |
| 9 Position corners | `U R U' L' U R' U' L` (hold position to be proven by test) | unconfirmed |
| 10 Twist corners | `R' D' R D` repeated per corner; turn only the top layer between corners | unconfirmed |

## Cases the photos don't show (to be drafted and reviewed)

- Stage 7/8: the two matching edges are **opposite** each other, or **none** match.
- Stage 9: **no** corner is in its correct spot yet.
