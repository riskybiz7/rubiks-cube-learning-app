import type { Provenance, StageInfo } from './beginner';

/**
 * CFOP algorithms as data. Every one was proposed by Claude and stays "proposed" until
 * the owner checks it on their cube. The tests in cfop.test.ts prove the library covers
 * every case exactly once. Only face turns: no wide, middle-slice or whole-cube turns.
 */

export type CfopSet = 'F2L' | 'OLL-2LOOK' | 'PLL-2LOOK';

export interface CfopAlgorithm {
  id: string;
  set: CfopSet;
  group: string;
  name: string;
  moves: string;
  provenance: Provenance;
}

export const GROUPS = {
  pairInTop: 'Corner and edge both in the top layer',
  edgeInSlot: 'Corner in the top layer, edge in the slot',
  cornerInSlot: 'Corner in the slot, edge in the top layer',
  bothInSlot: 'Corner and edge both in the slot',
  ollEdges: 'First look: make the yellow cross',
  ollCorners: 'Second look: make the whole top yellow',
  pllCorners: 'First look: put the corners in place',
  pllEdges: 'Second look: put the edges in place',
} as const;

// F2L cases, numbered in this app's own order (not the numbering on online charts).
const F2L_LIST: readonly [string, string][] = [
  [GROUPS.pairInTop, "U R U' R'"],
  [GROUPS.pairInTop, "U' F' U F"],
  [GROUPS.pairInTop, "F' U' F"],
  [GROUPS.pairInTop, "R U R'"],
  [GROUPS.pairInTop, "U' R U R' U2 R U' R'"],
  [GROUPS.pairInTop, "U F' U' F U2 F' U F"],
  [GROUPS.pairInTop, "U' R U2 R' U2 R U' R'"],
  [GROUPS.pairInTop, "U F' U2 F U2 F' U F"],
  [GROUPS.pairInTop, "U' R U' R' U F' U' F"],
  [GROUPS.pairInTop, "U' R U R' U R U R'"],
  [GROUPS.pairInTop, "U' R U2 R' U F' U' F"],
  [GROUPS.pairInTop, "R U' R' U R U' R' U2 R U' R'"],
  [GROUPS.pairInTop, "U F' U F U' F' U' F"],
  [GROUPS.pairInTop, "U' R U' R' U R U R'"],
  [GROUPS.pairInTop, "R U' R' U2 F' U' F"],
  [GROUPS.pairInTop, "R U2 R' U' R U R'"],
  [GROUPS.pairInTop, "F' U2 F U F' U' F"],
  [GROUPS.pairInTop, "U R U2 R' U R U' R'"],
  [GROUPS.pairInTop, "U' F' U2 F U' F' U F"],
  [GROUPS.pairInTop, "U2 R U R' U R U' R'"],
  [GROUPS.pairInTop, "U2 F' U' F U' F' U F"],
  [GROUPS.pairInTop, "U R U' R' U' R U' R' U R U' R'"],
  [GROUPS.pairInTop, "U' F' U F U F' U F U' F' U F"],
  [GROUPS.pairInTop, "F' U F U2 R U R'"],
  [GROUPS.edgeInSlot, "U' R' F R F' R U' R'"],
  [GROUPS.edgeInSlot, "R U R' U' R U R' U' R U R'"],
  [GROUPS.edgeInSlot, "U' R U' R' U2 R U' R'"],
  [GROUPS.edgeInSlot, "U R U R' U2 R U R'"],
  [GROUPS.edgeInSlot, "U F' U' F U' R U R'"],
  [GROUPS.edgeInSlot, "U2 R U R' U2 F' U2 F"],
  [GROUPS.cornerInSlot, "U R U' R' U' F' U F"],
  [GROUPS.cornerInSlot, "R U' R' U R U' R'"],
  [GROUPS.cornerInSlot, "F' U F U' F' U F"],
  [GROUPS.cornerInSlot, "R U R' U' R U R'"],
  [GROUPS.cornerInSlot, "F' U' F U F' U' F"],
  [GROUPS.cornerInSlot, "U' F' U F U R U' R'"],
  [GROUPS.bothInSlot, "R U' R' U R U2 R' U R U' R'"],
  [GROUPS.bothInSlot, "R U' R' U' R U R' U2 R U' R'"],
  [GROUPS.bothInSlot, "R U R' U' R U' R' U2 F' U' F"],
  [GROUPS.bothInSlot, "R U' R' F R U R' U' F' R U' R'"],
  [GROUPS.bothInSlot, "R U' R' U F' U2 F U2 F' U F"],
];

const proposed = 'claude-proposed' as const;

type Row = readonly [id: string, group: string, name: string, moves: string];

const OLL_2LOOK: readonly Row[] = [
  ['oll-line', GROUPS.ollEdges, 'Line', "F R U R' U' F'"],
  ['oll-l', GROUPS.ollEdges, 'L shape', "F U R U' R' F'"],
  ['oll-dot', GROUPS.ollEdges, 'Dot', "F R U R' U' F' U2 F U R U' R' F'"],
  ['oll-sune', GROUPS.ollCorners, 'Sune', "R U R' U R U2 R'"],
  ['oll-antisune', GROUPS.ollCorners, 'Antisune', "R U2 R' U' R U' R'"],
  ['oll-h', GROUPS.ollCorners, 'H', "R U R' U R U' R' U R U2 R'"],
  ['oll-pi', GROUPS.ollCorners, 'Pi', "R U2 R2 U' R2 U' R2 U2 R"],
  ['oll-headlights', GROUPS.ollCorners, 'Headlights', "R2 D R' U2 R D' R' U2 R'"],
  ['oll-t', GROUPS.ollCorners, 'T', "L F R' F' L' F R F'"],
  ['oll-bowtie', GROUPS.ollCorners, 'Bowtie', "F' L F R' F' L' F R"],
];

const PLL_2LOOK: readonly Row[] = [
  ['pll-t', GROUPS.pllCorners, 'T-perm', "R U R' U' R' F R2 U' R' U' R U R' F'"],
  ['pll-y', GROUPS.pllCorners, 'Y-perm', "F R U' R' U' R U R' F' R U R' U' R' F R F'"],
  ['pll-ua', GROUPS.pllEdges, 'Ua-perm', "R U' R U R U R U' R' U' R2"],
  ['pll-ub', GROUPS.pllEdges, 'Ub-perm', "R2 U R U R' U' R' U' R' U R'"],
  ['pll-h', GROUPS.pllEdges, 'H-perm', 'R2 U2 R U2 R2 U2 R2 U2 R U2 R2'],
  ['pll-z', GROUPS.pllEdges, 'Z-perm', "R' U' R U' R U R U' R' U R U R2 U' R' U"],
];

const fromRows = (set: CfopSet, rows: readonly Row[]): CfopAlgorithm[] =>
  rows.map(([id, group, name, moves]) => ({ id, set, group, name, moves, provenance: proposed }));

export const CFOP_ALGORITHMS: readonly CfopAlgorithm[] = [
  ...F2L_LIST.map(([group, moves], i) => ({
    id: `f2l-${i + 1}`,
    set: 'F2L' as const,
    group,
    name: `F2L ${i + 1}`,
    moves,
    provenance: proposed,
  })),
  ...fromRows('OLL-2LOOK', OLL_2LOOK),
  ...fromRows('PLL-2LOOK', PLL_2LOOK),
];

export const inGroup = (group: string): CfopAlgorithm[] =>
  CFOP_ALGORITHMS.filter((a) => a.group === group);

const idsOf = (set: CfopSet) => CFOP_ALGORITHMS.filter((a) => a.set === set).map((a) => a.id);

/** The CFOP lessons, one per stage. */
export const CFOP_STAGES: readonly StageInfo[] = [
  {
    number: 1,
    title: 'The cross',
    hold: 'Yellow on top, white on the bottom.',
    goal: 'A white cross on the bottom, each edge matching the center beside it.',
    howTo:
      "Put the four white edges in place one at a time on the bottom layer, without turning the cube over. It's the beginner white cross done upside down and without the daisy. Pick the edge that takes the fewest turns next.",
    tip: 'Planning the whole cross before you turn is the skill fast solvers practise. Take your time while you learn.',
    algorithmIds: [],
  },
  {
    number: 2,
    title: 'First two layers (F2L)',
    hold: 'Yellow on top.',
    goal: 'The first two layers done: the cross plus the four corner-and-edge pairs.',
    howTo:
      "Pick a slot: a bottom corner and the middle edge above it. Turn the whole cube so that slot is at the front right, turn the top to line up the case, then do its algorithm. It pairs the corner and edge in the top layer and drops them in together. If a piece you need is stuck in another slot, take it out first with R U R' from that slot.",
    tip: "There are 41 cases. You don't need them memorized to start: the Solve screen shows which one you have.",
    algorithmIds: idsOf('F2L'),
  },
  {
    number: 3,
    title: 'Yellow top (2-look OLL)',
    hold: 'Yellow on top.',
    goal: 'The whole top face yellow.',
    howTo:
      'Two looks. First make a yellow cross: a line, an L shape or a dot, one algorithm each. Then make the whole top yellow: 7 corner cases. Turn the top to line up the case before each algorithm; the Solve screen shows how.',
    algorithmIds: idsOf('OLL-2LOOK'),
  },
  {
    number: 4,
    title: 'Finish the top (2-look PLL)',
    hold: 'Yellow on top.',
    goal: 'Solved!',
    howTo:
      'Two looks. First put the corners in place: two side by side swapped (T-perm) or two diagonal swapped (Y-perm). Then the edges: Ua, Ub, H or Z. Finish by turning the top to line it up.',
    algorithmIds: idsOf('PLL-2LOOK'),
  },
];
