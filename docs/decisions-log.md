# Decisions log

Design decisions made during brainstorming. Each one is the owner's choice
unless marked otherwise. This log feeds the design spec.

## 2026-09-26 / 27: initial brainstorming

| # | Decision | Choice | Notes |
|---|---|---|---|
| 1 | Platform | **Web app** | Runs in a phone or laptop browser. Camera via the browser. |
| 2 | Project goal | **Personal + learning** | No accounts/backend. Progress saved in the browser. |
| 3 | Puzzles | **3x3 only, for now** | Engine written so other sizes could be added later. |
| 4 | Methods in v1 | **Beginner + CFOP** | 2-look OLL/PLL as the bridge to full CFOP. |
| 5 | Solve style | **Method-based, teachable** | Solves stage by stage like a human would. No "shortest solution" mode. |
| 6 | Camera scanning | **Free-form continuous** | User turns the cube freely; the app identifies faces by center color and works out face rotations by testing validity. |
| 7 | Build approach | **A: own cube engine + Three.js**, React, TypeScript | Chosen over cubing.js or no-framework. |
| 8 | Input order | **Manual sticker entry first**, camera as a later phase | Manual editor doubles as the camera's review/fix screen. |
| 9 | Beginner method variant | **Daisy method** | Yellow center up, white-edge daisy, flip petals down to a white cross on the bottom. Yellow on top for the rest of the solve. |
| 10 | Audience split | Beginner content → friends & family; CFOP → owner and keen solvers | Beginner side: plain-English and visual. CFOP side: fast lookup and practice. |
| 11 | Algorithm sourcing | Stage order from the owner's photos; algorithms proposed by Claude, labeled **unconfirmed** until the owner checks them | Video of a solve was considered and rejected: moves can't be read reliably from blurry frames. |

| 12 | Beginner stage map | **10 stages** read from the owner's photos (see `reference/beginner-method/README.md`) | Last layer order: yellow cross → edges → position corners → twist corners. Stages 2 to 4 are done **white up** (owner confirmed). |
| 13 | Color scheme | **Standard**, confirmed from photos 5.1, 10.1, 10.2 | Closes the earlier open item. |
| 14 | Reference photos in git | **Resized copies only** (`small/`, 7.6 MB); originals (54.0 MB) stay on disk, gitignored | Owner's choice. |

## Design sections approved

- §1 Architecture (modules): approved
- §2 Data flow for "Solve My Cube": approved
- §3 Free-form camera scanner: approved
- §4 Testing, error handling, project setup: **pending**

## Open items

- Owner to check the proposed beginner algorithms against their own solving
- Camera test photos/video → `reference/camera-test/` (needed by phase 4)
