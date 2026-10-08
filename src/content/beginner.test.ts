import { describe, expect, it } from 'vitest';
import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { invertMoves, mustParse } from '../cube/notation';
import { EDGE_SLOTS } from '../cube/pieces';
import { allSlotsSolved, isSlotSolved, TOP_CORNERS, TOP_EDGES } from '../solver/checks';
import { BEGINNER_ALGORITHMS, BEGINNER_STAGES, DEMO_SCRAMBLE, algorithmById } from './beginner';

const FL = EDGE_SLOTS[9];
const FR = EDGE_SLOTS[8];

describe('beginner content', () => {
  it('has ten stages, numbered in order, naming only algorithms that exist', () => {
    expect(BEGINNER_STAGES.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const stage of BEGINNER_STAGES) {
      for (const id of stage.algorithmIds) expect(algorithmById(id).stage).toBe(stage.number);
    }
  });

  it('writes every algorithm in valid notation, with unique ids', () => {
    const all = Object.values(BEGINNER_ALGORITHMS);
    expect(new Set(all.map((a) => a.id)).size).toBe(all.length);
    for (const a of all) expect(() => mustParse(a.moves)).not.toThrow();
    expect(() => mustParse(DEMO_SCRAMBLE)).not.toThrow();
  });

  it('marks only the yellow cross as confirmed by the owner (so far)', () => {
    const confirmed = Object.values(BEGINNER_ALGORITHMS).filter(
      (a) => a.provenance === 'owner-confirmed',
    );
    expect(confirmed.map((a) => a.id)).toEqual(['yellow-cross']);
  });

  it("R' D' R D six times changes nothing (why the corner moves always come back)", () => {
    expect(applyMoves(solved(), mustParse("R' D' R D ".repeat(6)))).toEqual(solved());
  });

  it('middle-left sends the edge below the front center into the front-left slot', () => {
    // Work backwards from solved (white up, green front): undo the algorithm.
    const before = applyMoves(
      solved(),
      invertMoves(mustParse(BEGINNER_ALGORITHMS.middleLeft.moves)),
    );
    expect(isSlotSolved(before, FL)).toBe(false);
    expect(allSlotsSolved(before, [...TOP_EDGES, ...TOP_CORNERS])).toBe(true); // white layer untouched
    // The front-left edge now sits bottom-front: green on the front, orange (left center) below.
    expect([before.stickers[25], before.stickers[28]]).toEqual(['G', 'O']);
  });

  it('middle-right sends the edge below the front center into the front-right slot', () => {
    const before = applyMoves(
      solved(),
      invertMoves(mustParse(BEGINNER_ALGORITHMS.middleRight.moves)),
    );
    expect(isSlotSolved(before, FR)).toBe(false);
    expect(allSlotsSolved(before, [...TOP_EDGES, ...TOP_CORNERS])).toBe(true);
    expect([before.stickers[25], before.stickers[28]]).toEqual(['G', 'R']);
  });
});
