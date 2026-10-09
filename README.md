# Rubik's Cube learning app

Learn to solve a 3x3 Rubik's Cube, from your first solve to full CFOP.

**Try it:** https://riskybiz7.github.io/rubiks-cube-learning-app/

- **Beginner method:** the daisy method in 10 stages, in plain English, with a 3D cube that
  shows every move.
- **CFOP:** the cross, all 41 F2L cases, 2-look and full OLL (57 cases) and PLL (21 cases),
  with case diagrams and learning marks.
- **Solve my cube:** enter your own scrambled cube square by square. The app checks that it's
  a real cube, then walks you through solving it step by step.
- **Camera scanning:** in progress.

Everything runs in your browser. There are no accounts, and progress is saved on your device only.

## How it's checked

- Every algorithm has an automated test that sets up its case, applies it and confirms the result.
- Tests prove that each F2L, OLL and PLL set covers every possible case exactly once.
- Before a solve is shown, every move is replayed on your cube. If it doesn't end solved, the
  app shows an error instead.

## Run it yourself

Needs [Node.js](https://nodejs.org/). In the project folder:

| Command | What it does |
|---|---|
| `npm install` | Install what the app needs (once) |
| `npm run dev` | Start the app at http://localhost:5190 |
| `npm test` | Run all tests |
| `npm run build` | Build the app for publishing into `dist/` |

## Folders

| Folder | Contents |
|---|---|
| `src/cube/` | The cube model: moves, notation, checks |
| `src/content/` | Lessons and algorithms, as data |
| `src/solver/` | Step-by-step solvers for both methods |
| `src/render/` | The 3D cube and case diagrams |
| `src/input/`, `src/vision/` | Entering a cube by hand, and the camera scanner |
| `src/app/` | The screens |
| `docs/` | Design spec, decisions log, build plans and review notes |
| `reference/` | Photos of the beginner method; notes for the camera tests |

## License

MIT. See [`LICENSE`](LICENSE).
