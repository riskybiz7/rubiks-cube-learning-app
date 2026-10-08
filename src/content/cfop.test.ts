import { describe, expect, it } from 'vitest';
import { applyMoves, isSolved } from '../cube/moves';
import { formatAlgorithm, invertMoves, mustParse } from '../cube/notation';
import { readPieces } from '../cube/pieces';
import type { Cube } from '../cube/types';
import {
  BOTTOM_EDGES,
  F2L_PAIRS,
  allSlotsSolved,
  isFlippedTwoLayers,
  isYellowCross,
  isYellowFace,
  topCornersMatchAfterTopTurn,
} from '../solver/checks';
import { TOP_TURNS } from '../solver/plan';
import { CFOP_HOME, f2lCaseKey, f2lSlotStates, lastLayerStates } from '../test-utils/cfopStates';
import { SPEEDCUBEDB_STANDARD, tidy, withoutYTurns } from '../test-utils/speedcubedb';
import {
  CFOP_ALGORITHMS,
  CFOP_STAGES,
  GROUPS,
  cardTitle,
  groupIn,
  inGroup,
  inSet,
  type CfopAlgorithm,
} from './cfop';

const F2L = CFOP_ALGORITHMS.filter((a) => a.set === 'F2L');
const byId = (id: string) => CFOP_ALGORITHMS.find((a) => a.id === id)!;
/** The case an algorithm solves: undo it from solved. */
const caseOf = (a: CfopAlgorithm) => applyMoves(CFOP_HOME, invertMoves(mustParse(a.moves)));

/** The algorithms that take `state` to `goal`, after a turn of the top (and one at the end, if allowed). */
function solvers(
  state: Cube,
  algorithms: CfopAlgorithm[],
  goal: (c: Cube) => boolean,
  endTurn: boolean,
) {
  const ends = endTurn ? TOP_TURNS : [[]];
  return algorithms.filter((a) =>
    TOP_TURNS.some((before) =>
      ends.some((after) => goal(applyMoves(state, [...before, ...mustParse(a.moves), ...after]))),
    ),
  );
}

/** Every state not already done is solved by exactly one algorithm, and every algorithm is needed. */
function expectExactCover(
  states: Cube[],
  algorithms: CfopAlgorithm[],
  goal: (c: Cube) => boolean,
  endTurn = false,
) {
  const done = (s: Cube) => (endTurn ? TOP_TURNS.some((t) => goal(applyMoves(s, t))) : goal(s));
  const used = new Set<string>();
  for (const state of states) {
    if (done(state)) continue;
    const found = solvers(state, algorithms, goal, endTurn);
    expect(
      found.map((a) => a.id),
      'algorithms that solve this state',
    ).toHaveLength(1);
    used.add(found[0].id);
  }
  expect([...used].sort()).toEqual(algorithms.map((a) => a.id).sort());
}

describe('CFOP library: F2L', () => {
  it('has 41 cases: the pair has 150 positions in 42 groups, one of them already solved', () => {
    const states = f2lSlotStates();
    expect(states).toHaveLength(150);
    expect(new Set(states.map(f2lCaseKey)).size).toBe(42);
    expect(F2L).toHaveLength(41);
  });

  it('every position of the front-right pair is solved by exactly one F2L algorithm', () => {
    expectExactCover(f2lSlotStates(), F2L, isFlippedTwoLayers);
  });

  it('each F2L algorithm is filed under the group its case belongs to', () => {
    for (const a of F2L) {
      const [corner, edge] = f2lCaseKey(caseOf(a)).split('/');
      const cornerInSlot = corner.startsWith('4.');
      const edgeInSlot = edge.startsWith('8.');
      const group = cornerInSlot
        ? edgeInSlot
          ? GROUPS.bothInSlot
          : GROUPS.cornerInSlot
        : edgeInSlot
          ? GROUPS.edgeInSlot
          : GROUPS.pairInTop;
      expect(a.group, a.id).toBe(group);
    }
  });
});

describe('CFOP library: 2-look OLL', () => {
  const oriented = lastLayerStates({ orient: true, permute: false });

  it('first look: every edge pattern is fixed by exactly one of line, L shape and dot', () => {
    expect(inGroup(GROUPS.ollEdges)).toHaveLength(3);
    expectExactCover(oriented, inGroup(GROUPS.ollEdges), isYellowCross);
  });

  it('second look: with the cross done, every corner pattern is fixed by exactly one of 7', () => {
    expect(inGroup(GROUPS.ollCorners)).toHaveLength(7);
    expectExactCover(oriented.filter(isYellowCross), inGroup(GROUPS.ollCorners), isYellowFace);
  });

  it('the names match the cases', () => {
    const badEdges = (id: string) =>
      [1, 3, 5, 7].filter((i) => caseOf(byId(id)).stickers[i] !== 'Y');
    expect(badEdges('oll-line')).toEqual([1, 7]); // back and front: a line across
    expect(badEdges('oll-l')).toEqual([5, 7]); // right and front: side by side
    expect(badEdges('oll-dot')).toHaveLength(4);
    const yellowCorners = (id: string) =>
      [0, 2, 6, 8].filter((i) => caseOf(byId(id)).stickers[i] === 'Y').length;
    expect(['oll-sune', 'oll-antisune'].map(yellowCorners)).toEqual([1, 1]);
    expect(['oll-h', 'oll-pi'].map(yellowCorners)).toEqual([0, 0]);
    expect(['oll-headlights', 'oll-t', 'oll-bowtie'].map(yellowCorners)).toEqual([2, 2, 2]);
  });
});

describe('CFOP library: 2-look PLL', () => {
  const arranged = lastLayerStates({ orient: false, permute: true });

  it('first look: every corner arrangement is fixed by exactly one of T-perm and Y-perm', () => {
    expect(inGroup(GROUPS.pllCorners)).toHaveLength(2);
    expectExactCover(arranged, inGroup(GROUPS.pllCorners), topCornersMatchAfterTopTurn);
  });

  it('second look: with the corners done, every edge arrangement is fixed by exactly one of 4', () => {
    expect(inGroup(GROUPS.pllEdges)).toHaveLength(4);
    expectExactCover(
      arranged.filter(topCornersMatchAfterTopTurn),
      inGroup(GROUPS.pllEdges),
      isSolved,
      true,
    );
  });

  it('the names match the cases', () => {
    /** Which top pieces sit in each top slot, after the top turn that puts the corners home (if any). */
    const layout = (id: string) => {
      const state = caseOf(byId(id));
      for (const turn of TOP_TURNS) {
        const reading = readPieces(applyMoves(state, turn));
        if (!reading.ok) throw new Error('bad');
        const corners = reading.pieces.corners.slice(0, 4).map((c) => c.piece);
        const edges = reading.pieces.edges.slice(0, 4).map((e) => e.piece);
        if (corners.every((p, i) => p === i) || id === 'pll-t' || id === 'pll-y')
          return { corners, edges };
      }
      throw new Error(`corners never line up for ${id}`);
    };
    expect(layout('pll-t').corners).toEqual([3, 1, 2, 0]); // front-right and back-right swapped: side by side
    expect(layout('pll-y').corners).toEqual([2, 1, 0, 3]); // front-right and back-left swapped: diagonal
    const moved = (id: string) => layout(id).edges.filter((p, i) => p !== i).length;
    expect(['pll-ua', 'pll-ub'].map(moved)).toEqual([3, 3]);
    expect(layout('pll-h').edges).toEqual([2, 3, 0, 1]); // opposite edges swap
    expect(layout('pll-z').edges).toEqual([1, 0, 3, 2]); // side-by-side edges swap
  });
});

/** The SpeedCubeDB case for this card: "OLL 27", "T", "Aa"… */
const sourceName = (a: CfopAlgorithm) =>
  a.number !== undefined ? `OLL ${a.number}` : a.name.replace('-perm', '');
/** The case SpeedCubeDB gives that number or name: undo its standard algorithm. */
const sourceCase = (a: CfopAlgorithm) =>
  applyMoves(
    CFOP_HOME,
    invertMoves(withoutYTurns(mustParse(SPEEDCUBEDB_STANDARD.get(sourceName(a))!))),
  );

describe('CFOP library: full OLL', () => {
  const oriented = lastLayerStates({ orient: true, permute: false });

  it('has 57 cases, numbered 1 to 57', () => {
    expect(inSet('OLL').map((a) => a.number)).toEqual(Array.from({ length: 57 }, (_, i) => i + 1));
  });

  it('every pattern on top is made all yellow by exactly one of the 57', () => {
    expectExactCover(oriented, inSet('OLL'), isYellowFace);
  }, 30_000);

  it('each number is the case SpeedCubeDB gives that number', () => {
    for (const a of inSet('OLL')) {
      expect(solvers(sourceCase(a), [a], isYellowFace, false), cardTitle(a)).toHaveLength(1);
    }
  });

  it('the seven second-look cards are OLL 21 to 27', () => {
    expect(
      inGroup(GROUPS.ollCorners)
        .map((a) => a.number)
        .sort(),
    ).toEqual([21, 22, 23, 24, 25, 26, 27]);
  });
});

describe('CFOP library: full PLL', () => {
  const arranged = lastLayerStates({ orient: false, permute: true });

  it('has the 21 named cases', () => {
    expect(inSet('PLL').map(sourceName).sort()).toEqual(
      [...SPEEDCUBEDB_STANDARD.keys()].filter((k) => !k.startsWith('OLL')).sort(),
    );
  });

  it('every arrangement of the top is solved by exactly one of the 21, plus a turn of the top', () => {
    expectExactCover(arranged, inSet('PLL'), isSolved, true);
  }, 30_000);

  it('each name is the case SpeedCubeDB gives that name', () => {
    for (const a of inSet('PLL')) {
      expect(solvers(sourceCase(a), [a], isSolved, true), a.name).toHaveLength(1);
    }
  });

  it('the six 2-look cards are the same cards in full PLL', () => {
    const ids = new Set(inSet('PLL').map((a) => a.id));
    for (const a of inSet('PLL-2LOOK')) expect(ids.has(a.id), a.id).toBe(true);
  });
});

describe('CFOP library: cards', () => {
  it('shows the usual version exactly when the card differs from it', () => {
    for (const a of [...inSet('OLL'), ...inSet('PLL')]) {
      const standard = SPEEDCUBEDB_STANDARD.get(sourceName(a))!;
      const same =
        formatAlgorithm(tidy(withoutYTurns(mustParse(standard)))) ===
        formatAlgorithm(mustParse(a.moves));
      expect(a.usual, cardTitle(a)).toBe(same ? undefined : standard);
    }
  });

  it('every full-set card has a group to sit in', () => {
    const groups: string[] = Object.values(GROUPS);
    for (const a of inSet('OLL')) expect(groups, a.id).toContain(groupIn(a, 'OLL'));
    for (const a of inSet('PLL')) expect(groups, a.id).toContain(groupIn(a, 'PLL'));
  });

  it('titles name the number as well as the nickname', () => {
    expect(cardTitle(byId('oll-sune'))).toBe('OLL 27 (Sune)');
    expect(cardTitle(byId('oll-1'))).toBe('OLL 1');
    expect(cardTitle(byId('pll-aa'))).toBe('Aa-perm');
  });
});

describe('CFOP library: every algorithm', () => {
  it('uses only face turns: no wide, middle-slice or whole-cube turns', () => {
    for (const a of CFOP_ALGORITHMS) {
      for (const move of mustParse(a.moves)) {
        expect('RUFLDB', `${a.id}: ${a.moves}`).toContain(move.base);
      }
    }
  });

  it('leaves the cross and every other finished slot alone', () => {
    for (const a of CFOP_ALGORITHMS) {
      const pairs = a.set === 'F2L' ? F2L_PAIRS.slice(1) : F2L_PAIRS;
      expect(allSlotsSolved(caseOf(a), [...BOTTOM_EDGES, ...pairs.flat()]), a.id).toBe(true);
    }
  });

  it('has unique ids and is marked proposed until the owner checks it', () => {
    expect(new Set(CFOP_ALGORITHMS.map((a) => a.id)).size).toBe(CFOP_ALGORITHMS.length);
    for (const a of CFOP_ALGORITHMS) expect(a.provenance, a.id).toBe('claude-proposed');
  });

  // Narrowed until the full OLL/PLL lessons arrive (phase 3b-2 plan, Task 3).
  it('every CFOP lesson names algorithms that exist, and every F2L/2-look algorithm is in one', () => {
    expect(CFOP_STAGES.map((s) => s.number)).toEqual([1, 2, 3, 4]);
    const inLessons = CFOP_STAGES.flatMap((s) => s.algorithmIds);
    const taught = CFOP_ALGORITHMS.filter((a) => a.set !== 'OLL' && a.set !== 'PLL');
    expect([...inLessons].sort()).toEqual(taught.map((a) => a.id).sort());
  });
});
