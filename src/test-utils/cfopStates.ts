import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { mustParse } from '../cube/notation';
import { fromPieces, readPieces, type Pieces } from '../cube/pieces';
import type { Cube } from '../cube/types';
import { TOP_TURNS } from '../solver/plan';

/**
 * Builders for the CFOP enumeration tests: every position a case can be in, so the
 * tests can prove the library covers each one exactly once (like footing a table).
 */

/** The solved cube held for CFOP: yellow on top, green facing you. */
export const CFOP_HOME: Cube = applyMoves(solved(), mustParse('z2'));

function piecesOf(cube: Cube): Pieces {
  const reading = readPieces(cube);
  if (!reading.ok) throw new Error('Not a real cube.');
  return reading.pieces;
}

const DFR = 4; // index of the front-right bottom corner (CORNER_SLOTS)
const FR = 8; // index of the front-right middle edge (EDGE_SLOTS)

/**
 * Every position of the front-right pair with each piece in the top layer or in its own
 * slot: the corner in 5 places × 3 twists, the edge in 5 places × 2 flips = 150 states.
 * Everything else is solved.
 */
export function f2lSlotStates(): Cube[] {
  const home = piecesOf(CFOP_HOME);
  const states: Cube[] = [];
  for (const cornerAt of [0, 1, 2, 3, DFR])
    for (const twist of [0, 1, 2] as const)
      for (const edgeAt of [0, 1, 2, 3, FR])
        for (const flip of [0, 1] as const) {
          const corners = home.corners.map((c) => ({ ...c }));
          const edges = home.edges.map((e) => ({ ...e }));
          // Swap the pair's pieces with whatever sits where they go.
          corners[DFR] = { piece: corners[cornerAt].piece, twist: 0 };
          corners[cornerAt] = { piece: DFR, twist };
          edges[FR] = { piece: edges[edgeAt].piece, flip: 0 };
          edges[edgeAt] = { piece: FR, flip };
          states.push(fromPieces({ centers: home.centers, corners, edges }));
        }
  return states;
}

/** Which F2L case a state is: where the pair's corner and edge are, the same for any top turn. */
export function f2lCaseKey(cube: Cube): string {
  const keys = TOP_TURNS.map((turn) => {
    const pieces = piecesOf(applyMoves(cube, turn));
    const c = pieces.corners.findIndex((x) => x.piece === DFR);
    const e = pieces.edges.findIndex((x) => x.piece === FR);
    return `${c}.${pieces.corners[c].twist}/${e}.${pieces.edges[e].flip}`;
  });
  return keys.sort()[0];
}

const permutationsOf4 = (): number[][] => {
  const out: number[][] = [];
  const build = (prefix: number[]) => {
    if (prefix.length === 4) out.push(prefix);
    else for (let i = 0; i < 4; i++) if (!prefix.includes(i)) build([...prefix, i]);
  };
  build([]);
  return out;
};

const parity = (order: number[]) => {
  let swaps = 0;
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (order[i] > order[j]) swaps++;
  return swaps % 2;
};

/**
 * Last-layer states with the first two layers solved.
 * orient: every legal twist/flip of the top pieces (27 × 8 = 216);
 * permute: every legal arrangement of them (24 × 24 ÷ 2 = 288).
 */
export function lastLayerStates(options: { orient: boolean; permute: boolean }): Cube[] {
  const home = piecesOf(CFOP_HOME);
  const orders = options.permute ? permutationsOf4() : [[0, 1, 2, 3]];
  const twists: number[][] = [];
  const flips: number[][] = [];
  if (options.orient) {
    for (let a = 0; a < 3; a++)
      for (let b = 0; b < 3; b++)
        for (let c = 0; c < 3; c++) twists.push([a, b, c, (6 - a - b - c) % 3]);
    for (let mask = 0; mask < 16; mask++) {
      const f = [0, 1, 2, 3].map((i) => (mask >> i) & 1);
      if (f.reduce((x, y) => x + y) % 2 === 0) flips.push(f);
    }
  } else {
    twists.push([0, 0, 0, 0]);
    flips.push([0, 0, 0, 0]);
  }
  const states: Cube[] = [];
  for (const cornerOrder of orders)
    for (const edgeOrder of orders) {
      if (parity(cornerOrder) !== parity(edgeOrder)) continue; // a real cube can't do one swap alone
      for (const twist of twists)
        for (const flip of flips) {
          const corners = home.corners.map((c, i) =>
            i < 4 ? { piece: home.corners[cornerOrder[i]].piece, twist: twist[i] as 0 | 1 | 2 } : c,
          );
          const edges = home.edges.map((e, i) =>
            i < 4 ? { piece: home.edges[edgeOrder[i]].piece, flip: flip[i] as 0 | 1 } : e,
          );
          states.push(fromPieces({ centers: home.centers, corners, edges }));
        }
    }
  return states;
}
