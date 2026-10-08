import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { invertMoves, mustParse } from '../cube/notation';
import type { Cube } from '../cube/types';
import type { Provenance, StageInfo } from './beginner';

/**
 * CFOP algorithms as data. Every one was proposed by Claude and stays "proposed" until
 * the owner checks it on their cube. The tests in cfop.test.ts prove the library covers
 * every case exactly once. Only face turns: no wide, middle-slice or whole-cube turns.
 */

export type CfopSet = 'F2L' | 'OLL-2LOOK' | 'PLL-2LOOK' | 'OLL' | 'PLL';

export interface CfopAlgorithm {
  id: string;
  set: CfopSet; // the set the card was written for (full OLL/PLL also include shared 2-look cards)
  group: string;
  name: string;
  moves: string;
  provenance: Provenance;
  number?: number; // OLL 1–57, standard numbering (as on SpeedCubeDB)
  fullGroup?: string; // its group in full OLL or PLL, for a shared 2-look card
  usual?: string; // SpeedCubeDB's standard version, when this card's differs (face turns only)
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
  // Full OLL and PLL: SpeedCubeDB's groups ("Dot Case", "OCLL", "Adj Swap"…) in plain English.
  ollDot: 'Dot shapes',
  ollSquare: 'Square shapes',
  ollLightning: 'Lightning shapes',
  ollFish: 'Fish shapes',
  ollKnight: 'Knight move shapes',
  ollOcll: 'Cross already made',
  ollAllCorners: 'All corners already yellow',
  ollAwkward: 'Awkward shapes',
  ollP: 'P shapes',
  ollT: 'T shapes',
  ollC: 'C shapes',
  ollW: 'W shapes',
  ollL: 'L shapes',
  ollLine: 'Line shapes',
  pllAdjacent: 'Corners: two side by side swapped',
  pllDiagonal: 'Corners: two diagonal swapped',
  pllEdgesOnly: 'Edges only',
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

// Full OLL: [number, group, moves, usual version if different]. Chosen and checked as in the
// phase 3b-2 plan: SpeedCubeDB's standard if face turns only, else a listed face-turn
// alternative, else converted to face turns.
type OllRow = readonly [number: number, group: string, moves: string, usual?: string];
const OLL_FULL: readonly OllRow[] = [
  [1, GROUPS.ollDot, "R U2 R2 F R F' U2 R' F R F'"],
  [2, GROUPS.ollDot, "R U' R2 D' L F L' D R2 U R'", "F R U R' U' F' f R U R' U' f'"],
  [3, GROUPS.ollDot, "R' F2 R2 U2 R' F R U2 R2 F2 R", "y' f R U R' U' f' U' F R U R' U' F'"],
  [4, GROUPS.ollDot, "R' F2 R2 U2 R' F' R U2 R2 F2 R", "y' f R U R' U' f' U F R U R' U' F'"],
  [5, GROUPS.ollSquare, "R' F2 L F L' F R", "r' U2 R U R' U r"],
  [6, GROUPS.ollSquare, "F U' R2 D R' U' R D' R2 U F'", "r U2 R' U' R U' r'"],
  [7, GROUPS.ollLightning, "L' U2 L U2 L F' L' F", "r U R' U R U2 r'"],
  [8, GROUPS.ollLightning, "R U2 R' U2 R' F R F'", "y2 r' U' R U' R' U2 r"],
  [9, GROUPS.ollFish, "R U R' U' R' F R2 U R' U' F'"],
  [10, GROUPS.ollFish, "R U R' U R' F R F' R U2 R'"],
  [11, GROUPS.ollLightning, "L' R2 B R' B R B2 R' B R' L", "M R U R' U R U2 R' U M'"],
  [12, GROUPS.ollLightning, "F R U R' U' F' U F R U R' U' F'", "y' M' R' U' R U' R' U2 R U' M"],
  [13, GROUPS.ollKnight, "F U R U2 R' U' R U R' F'", "r U' r' U' r U r' F' U F"],
  [14, GROUPS.ollKnight, "R' F R U R' F' R F U' F'"],
  [15, GROUPS.ollKnight, "R' F' R L' U' L U R' F R", "r' U' r R' U' R U r' U r"],
  [16, GROUPS.ollKnight, "R' F R U R' U' F' R U' R' U2 R", "r U r' R U R' U' r U' r'"],
  [17, GROUPS.ollDot, "R U R' U R' F R F' U2 R' F R F'"],
  [18, GROUPS.ollDot, "F2 B' D R' D' F' B R U2 R' U' F'", "y R U2 R' R' F R F' U2 M' U R U' r'"],
  [19, GROUPS.ollDot, "R' U2 F R U R' U' F2 U2 F R", "M U R U R' U' M' R' F R F'"],
  [20, GROUPS.ollDot, "L F R' F' R2 L2 B R B' R' B' R' L", "r U R' U' M2 U R U' R' U' M'"],
  [28, GROUPS.ollAllCorners, "L F R' F' R L' U R U' R'", "r U R' U' M U R U' R'"],
  [29, GROUPS.ollAwkward, "R U R' U' R U' R' F' U' F R U R'"],
  [30, GROUPS.ollAwkward, "F U R U2 R' U' R U2 R' U' F'"],
  [31, GROUPS.ollP, "R' U' F U R U' R' F' R"],
  [32, GROUPS.ollP, "L U F' U' L' U L F L'", "S R U R' U' R' F R f'"],
  [33, GROUPS.ollT, "R U R' U' R' F R F'"],
  [34, GROUPS.ollC, "R U R2 U' R' F R U R U' F'"],
  [35, GROUPS.ollFish, "R U2 R2 F R F' R U2 R'"],
  [36, GROUPS.ollW, "L' U' L U' L' U L U L F' L' F"],
  [37, GROUPS.ollFish, "F R U' R' U' R U R' F'"],
  [38, GROUPS.ollW, "R U R' U R U' R' U' R' F R F'"],
  [39, GROUPS.ollLightning, "L F' L' U' L U F U' L'"],
  [40, GROUPS.ollLightning, "R' F R U R' U' F' U R"],
  [41, GROUPS.ollAwkward, "R U R' U R U2 R' F R U R' U' F'"],
  [42, GROUPS.ollAwkward, "R' U' R U' R' U2 R F R U R' U' F'"],
  [43, GROUPS.ollP, "R' U' F' U F R"],
  [44, GROUPS.ollP, "F U R U' R' F'", "f R U R' U' f'"],
  [45, GROUPS.ollT, "F R U R' U' F'"],
  [46, GROUPS.ollC, "R' U' R' F R F' U R"],
  [47, GROUPS.ollL, "F' L' U' L U L' U' L U F"],
  [48, GROUPS.ollL, "F R U R' U' R U R' U' F'"],
  [49, GROUPS.ollL, "R B' R2 F R2 B R2 F' R", "y2 r U' r2 U r2 U r2 U' r"],
  [50, GROUPS.ollL, "R' F R2 B' R2 F' R2 B R'", "r' U r2 U' r2 U' r2 U r'"],
  [51, GROUPS.ollLine, "F U R U' R' U R U' R' F'", "f R U R' U' R U R' U' f'"],
  [52, GROUPS.ollLine, "R' F' U' F U' R U R' U R"],
  [53, GROUPS.ollL, "L' B' R B' R' B R B' R' B2 L", "r' U' R U' R' U R U' R' U2 r"],
  [54, GROUPS.ollL, "L F R' F R F' R' F R F2 L'", "r U R' U R U' R' U R U2 r'"],
  [55, GROUPS.ollLine, "R U2 R2 U' R U' R' U2 F R F'"],
  [56, GROUPS.ollLine, "L F L' U R U' R2 L F R F2 L'", "r U r' U R U' R' U R U' R' r U' r'"],
  [57, GROUPS.ollAllCorners, "R U R' U' R' L F R F' L'", "R U R' U' M' U R U' r'"],
];

// Full PLL: [id, group, name, moves, usual version if different].
type PllRow = readonly [id: string, group: string, name: string, moves: string, usual?: string];
const PLL_FULL: readonly PllRow[] = [
  [
    'pll-aa',
    GROUPS.pllAdjacent,
    'Aa-perm',
    "R' F R' B2 R F' R' B2 R2",
    "x R' U R' D2 R U' R' D2 R2 x'",
  ],
  [
    'pll-ab',
    GROUPS.pllAdjacent,
    'Ab-perm',
    "R' B' R U' R D R' U R D' R2 B R",
    "x R2 D2 R U R' D2 R U' R x'",
  ],
  [
    'pll-e',
    GROUPS.pllDiagonal,
    'E-perm',
    "R' U' R' D' R U' R' D R U R' D' R U R' D R2",
    "y x' R U' R' D R U R' D' R U R' D R U' R' D' x",
  ],
  ['pll-f', GROUPS.pllAdjacent, 'F-perm', "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R"],
  ['pll-ga', GROUPS.pllAdjacent, 'Ga-perm', "R2 U R' U R' U' R U' R2 D U' R' U R D'"],
  ['pll-gb', GROUPS.pllAdjacent, 'Gb-perm', "R' U' R U D' R2 U R' U R U' R U' R2 D"],
  ['pll-gc', GROUPS.pllAdjacent, 'Gc-perm', "R2 U' R U' R U R' U R2 D' U R U' R' D"],
  ['pll-gd', GROUPS.pllAdjacent, 'Gd-perm', "R U R' U' D R2 U' R U' R' U R' U R2 D'"],
  ['pll-ja', GROUPS.pllAdjacent, 'Ja-perm', "R' U L' U2 R U' R' U2 R L"],
  ['pll-jb', GROUPS.pllAdjacent, 'Jb-perm', "R U R' F' R U R' U' R' F R2 U' R'"],
  [
    'pll-na',
    GROUPS.pllDiagonal,
    'Na-perm',
    "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'",
  ],
  ['pll-nb', GROUPS.pllDiagonal, 'Nb-perm', "R' U R U' R' F' U' F R U R' F R' F' R U' R"],
  ['pll-ra', GROUPS.pllAdjacent, 'Ra-perm', "R U' R' U' R U R D R' U' R D' R' U2 R'"],
  ['pll-rb', GROUPS.pllAdjacent, 'Rb-perm', "R' U2 R U2 R' F R U R' U' R' F' R2"],
  ['pll-v', GROUPS.pllDiagonal, 'V-perm', "R' U R' U' R D' R' D R' U D' R2 U' R2 D R2"],
];

/** 2-look cards that are also full OLL/PLL cases: the same card, so a "learned" mark carries over. */
const SHARED: Readonly<Record<string, Pick<CfopAlgorithm, 'number' | 'fullGroup' | 'usual'>>> = {
  'oll-h': { number: 21, fullGroup: GROUPS.ollOcll },
  'oll-pi': { number: 22, fullGroup: GROUPS.ollOcll },
  'oll-headlights': { number: 23, fullGroup: GROUPS.ollOcll },
  'oll-t': { number: 24, fullGroup: GROUPS.ollOcll, usual: "r U R' U' r' F R F'" },
  'oll-bowtie': { number: 25, fullGroup: GROUPS.ollOcll, usual: "y F' r U R' U' r' F R" },
  'oll-antisune': { number: 26, fullGroup: GROUPS.ollOcll },
  'oll-sune': { number: 27, fullGroup: GROUPS.ollOcll },
  'pll-h': { fullGroup: GROUPS.pllEdgesOnly, usual: "M2 U' M2 U2 M2 U' M2" },
  'pll-t': { fullGroup: GROUPS.pllAdjacent },
  'pll-ua': { fullGroup: GROUPS.pllEdgesOnly, usual: "y2 M2 U M U2 M' U M2" },
  'pll-ub': { fullGroup: GROUPS.pllEdgesOnly, usual: "y2 M2 U' M U2 M' U' M2" },
  'pll-y': { fullGroup: GROUPS.pllDiagonal },
  'pll-z': { fullGroup: GROUPS.pllEdgesOnly, usual: "M2 U M2 U M' U2 M2 U2 M'" },
};

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
  ...OLL_FULL.map(([number, group, moves, usual]) => ({
    id: `oll-${number}`,
    set: 'OLL' as const,
    group,
    name: `OLL ${number}`,
    moves,
    provenance: proposed,
    number,
    usual,
  })),
  ...PLL_FULL.map(([id, group, name, moves, usual]) => ({
    id,
    set: 'PLL' as const,
    group,
    name,
    moves,
    provenance: proposed,
    usual,
  })),
].map((a) => ({ ...a, ...SHARED[a.id] }));

export const inGroup = (group: string): CfopAlgorithm[] =>
  CFOP_ALGORITHMS.filter((a) => a.group === group);

/** Every card in a set. Full OLL and PLL include the shared 2-look cards. */
export function inSet(set: CfopSet): CfopAlgorithm[] {
  if (set === 'OLL') {
    return CFOP_ALGORITHMS.filter((a) => a.number !== undefined).sort(
      (a, b) => a.number! - b.number!,
    );
  }
  if (set === 'PLL') {
    return CFOP_ALGORITHMS.filter((a) => a.set === 'PLL' || a.set === 'PLL-2LOOK').sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }
  return CFOP_ALGORITHMS.filter((a) => a.set === set);
}

/** The group a card sits in when a set is shown. */
export const groupIn = (a: CfopAlgorithm, set: CfopSet): string =>
  set === 'OLL' || set === 'PLL' ? (a.fullGroup ?? a.group) : a.group;

/** "OLL 27 (Sune)", "OLL 1", "T-perm", "F2L 12". */
export function cardTitle(a: { name: string; number?: number }): string {
  if (a.number === undefined || a.name === `OLL ${a.number}`) return a.name;
  return `OLL ${a.number} (${a.name})`;
}

/** The solved cube held for CFOP: yellow on top, green facing you. */
export const CASE_HOME: Cube = applyMoves(solved(), mustParse('z2'));

/** The case an algorithm solves, as it expects it: undo the algorithm from solved. */
export const caseCube = (moves: string): Cube =>
  applyMoves(CASE_HOME, invertMoves(mustParse(moves)));

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

/** For each half of the last layer: two looks (fewer algorithms) or one (faster). */
export type LookChoice = 'two-look' | 'full';
export interface LastLayerChoice {
  oll: LookChoice;
  pll: LookChoice;
}
export const TWO_LOOK: LastLayerChoice = { oll: 'two-look', pll: 'two-look' };

/** The four stage titles of a CFOP solve: the matching lesson titles. */
// Until the full OLL/PLL lessons exist (Task 3), both choices use the 2-look titles.
export const cfopStageTitles = (_choice: LastLayerChoice): string[] =>
  CFOP_STAGES.map((s) => s.title);
