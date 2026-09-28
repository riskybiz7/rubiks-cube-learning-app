import { movePermutation } from '../cube/moves';
import type { Move, MoveBase, Turns } from '../cube/notation';
import { EDGE_SLOTS } from '../cube/pieces';
import type { Color, Cube } from '../cube/types';
import { centerColor, faceOfSquare } from './checks';

/**
 * The CFOP white cross, solved on the bottom with yellow on top. Only the white edges
 * matter here, and each is tracked by where its white square is: that one square says
 * both which slot the edge is in and which way round it sits (24 possible places).
 *
 * Uses all six faces: the owner's no-back-turn rule is for the beginner method only.
 */
const FACE_BASES: readonly MoveBase[] = ['U', 'D', 'R', 'L', 'F', 'B'];
const CROSS_TURNS: readonly Move[] = FACE_BASES.flatMap((base) =>
  ([1, 2, 3] as Turns[]).map((turns) => ({ base, turns })),
);

/** The 24 squares an edge's white square can be on, numbered 0-23. */
const EDGE_SQUARES: readonly number[] = EDGE_SLOTS.flatMap((slot) => [...slot.stickers]);
const PLACE_OF = new Map(EDGE_SQUARES.map((square, place) => [square, place]));

/** NEXT[t][place]: where a white square on `place` ends up after turn t. */
const NEXT: readonly number[][] = CROSS_TURNS.map((move) => {
  const after = movePermutation(move); // after[to] = the square that moves to `to`
  const next = new Array<number>(24);
  after.forEach((from, to) => {
    const place = PLACE_OF.get(from);
    if (place !== undefined) next[place] = PLACE_OF.get(to)!;
  });
  return next;
});

/** A group of edges' places as one number (base 24), so it can index a table. */
const encode = (places: readonly number[]) => places.reduce((code, p) => code * 24 + p, 0);
const moved = (places: readonly number[], t: number) => places.map((p) => NEXT[t][p]);

const UNKNOWN = 255;

/**
 * For one set of home places: the fewest turns from every arrangement of those edges to
 * all of them being home. Worked out once, outward from "all home" (a breadth-first
 * search); every turn's reverse is also a turn, so distances read the same both ways.
 * Like a lookup table in a spreadsheet: after this, "how far?" is one read.
 */
const tables = new Map<string, Uint8Array>();
function tableFor(homes: readonly number[]): Uint8Array {
  const key = homes.join(',');
  const cached = tables.get(key);
  if (cached) return cached;
  const dist = new Uint8Array(24 ** homes.length).fill(UNKNOWN);
  dist[encode(homes)] = 0;
  let frontier: number[][] = [[...homes]];
  for (let d = 1; frontier.length > 0; d++) {
    const next: number[][] = [];
    for (const places of frontier) {
      for (let t = 0; t < CROSS_TURNS.length; t++) {
        const after = moved(places, t);
        const code = encode(after);
        if (dist[code] === UNKNOWN) {
          dist[code] = d;
          next.push(after);
        }
      }
    }
    frontier = next;
  }
  tables.set(key, dist);
  return dist;
}

/** Where the white-`color` edge's white square is now, and where it belongs (as places). */
function whitePlace(cube: Cube, color: Color): { now: number; home: number } {
  const slot = EDGE_SLOTS.find(
    (s) =>
      s.stickers.some((i) => cube.stickers[i] === 'W') &&
      s.stickers.some((i) => cube.stickers[i] === color),
  );
  const homeSlot = EDGE_SLOTS.find(
    (s) =>
      faceOfSquare(s.stickers[0]) === 'D' &&
      centerColor(cube, faceOfSquare(s.stickers[1])) === color,
  );
  if (!slot || !homeSlot) throw new Error(`Couldn't find the white-${color} edge.`);
  const now = slot.stickers.find((i) => cube.stickers[i] === 'W')!;
  return { now: PLACE_OF.get(now)!, home: PLACE_OF.get(homeSlot.stickers[0])! };
}

/**
 * The shortest list of turns (at most `maxDepth`) that puts every listed white edge in
 * place on the bottom, or null if it takes more. Reads the distance table and, at each
 * turn, picks one that brings the edges a step closer.
 */
export function crossMoves(cube: Cube, colors: readonly Color[], maxDepth = 10): Move[] | null {
  // Sort by home so the same set of homes always shares one table.
  const edges = colors.map((color) => whitePlace(cube, color)).sort((a, b) => a.home - b.home);
  const dist = tableFor(edges.map((e) => e.home));
  let places = edges.map((e) => e.now);
  let remaining = dist[encode(places)];
  if (remaining === UNKNOWN || remaining > maxDepth) return null;
  const path: Move[] = [];
  while (remaining > 0) {
    const t = CROSS_TURNS.findIndex((_, i) => dist[encode(moved(places, i))] === remaining - 1);
    path.push(CROSS_TURNS[t]);
    places = moved(places, t);
    remaining--;
  }
  return path;
}
