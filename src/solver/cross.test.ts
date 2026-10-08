import { describe, expect, it } from 'vitest';
import { applyMoves } from '../cube/moves';
import type { Move, MoveBase, Turns } from '../cube/notation';
import type { Color, Cube } from '../cube/types';
import { CFOP_HOME } from '../test-utils/cfopStates';
import { randomMoves, seededRandom } from '../test-utils/random';
import { BOTTOM_EDGES, centerColor, isCfopCross, isSlotSolved } from './checks';
import { crossMoves } from './cross';
import { reorientTo } from './plan';

/** Scrambled cubes held for CFOP (yellow on top, green facing you). */
function scrambles(count: number, seed: number): Cube[] {
  const random = seededRandom(seed);
  return Array.from({ length: count }, () => {
    const cube = applyMoves(CFOP_HOME, randomMoves(25, random));
    return applyMoves(cube, reorientTo(cube, 'Y', 'G'));
  });
}

const SIDES = (cube: Cube): Color[] =>
  (['F', 'R', 'B', 'L'] as const).map((f) => centerColor(cube, f));

/** Is the white-`color` edge in place on the bottom? */
const edgeHome = (cube: Cube, color: Color) =>
  BOTTOM_EDGES.some(
    (slot) => cube.stickers[slot.stickers[1]] === color && isSlotSolved(cube, slot),
  );

/** Try every sequence of face turns, shortest first (slow, but obviously right). */
function bruteForce(cube: Cube, goal: (c: Cube) => boolean, maxDepth: number): number {
  const turns: Move[] = (['U', 'D', 'R', 'L', 'F', 'B'] as MoveBase[]).flatMap((base) =>
    ([1, 2, 3] as Turns[]).map((t) => ({ base, turns: t })),
  );
  let frontier = [cube];
  for (let depth = 0; depth <= maxDepth; depth++) {
    if (frontier.some(goal)) return depth;
    frontier = frontier.flatMap((c) => turns.map((t) => applyMoves(c, [t])));
  }
  return Infinity;
}

describe('crossMoves', () => {
  it('needs no turns when the edges are already in place', () => {
    expect(crossMoves(CFOP_HOME, SIDES(CFOP_HOME))).toEqual([]);
  });

  it('solves the whole cross on 200 scrambles', () => {
    for (const cube of scrambles(200, 5)) {
      const moves = crossMoves(cube, SIDES(cube));
      expect(moves).not.toBeNull();
      expect(isCfopCross(applyMoves(cube, moves!))).toBe(true);
    }
  });

  it('finds the shortest way to place one edge (checked against trying every sequence)', () => {
    for (const cube of scrambles(20, 11)) {
      const color = centerColor(cube, 'F');
      const moves = crossMoves(cube, [color])!;
      expect(moves.length).toBe(bruteForce(cube, (c) => edgeHome(c, color), 4));
    }
  });

  it('keeps edges already placed while adding the next one', () => {
    for (const cube of scrambles(30, 12)) {
      const [a, b] = SIDES(cube);
      const first = applyMoves(cube, crossMoves(cube, [a])!);
      const both = applyMoves(first, crossMoves(first, [a, b])!);
      expect(edgeHome(both, a) && edgeHome(both, b)).toBe(true);
    }
  });
});
