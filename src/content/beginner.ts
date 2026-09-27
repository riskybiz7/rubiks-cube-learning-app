/**
 * The owner's beginner (daisy) method, as data. Source of truth for the stage order
 * and procedures: reference/beginner-method/README.md (read from the owner's photos).
 *
 * Every algorithm records its provenance: "owner-confirmed" once the owner has
 * checked it on a real cube, "claude-proposed" until then. The app shows which.
 */

export type Provenance = 'owner-confirmed' | 'claude-proposed';

export interface BeginnerAlgorithm {
  id: string;
  name: string;
  moves: string;
  provenance: Provenance;
  stage: number;
}

export const BEGINNER_ALGORITHMS = {
  cornerInsert: {
    id: 'corner-insert',
    name: 'Put a white corner in',
    moves: "R' D' R D",
    provenance: 'claude-proposed',
    stage: 3,
  },
  middleLeft: {
    id: 'middle-left',
    name: 'Middle edge to the left',
    moves: "D L D' L' D' F' D F",
    provenance: 'claude-proposed',
    stage: 4,
  },
  middleRight: {
    id: 'middle-right',
    name: 'Middle edge to the right',
    moves: "D' R' D R D F D' F'",
    provenance: 'claude-proposed',
    stage: 4,
  },
  yellowCross: {
    id: 'yellow-cross',
    name: 'Yellow cross',
    moves: "F R U R' U' F'",
    provenance: 'owner-confirmed',
    stage: 6,
  },
  yellowEdges: {
    id: 'yellow-edges',
    name: 'Swap yellow edges',
    moves: "R U R' U R U2 R'",
    provenance: 'claude-proposed',
    stage: 8,
  },
  cornerCycle: {
    id: 'corner-cycle',
    name: 'Move yellow corners into place',
    moves: "U R U' L' U R' U' L",
    provenance: 'claude-proposed',
    stage: 9,
  },
  cornerTwist: {
    id: 'corner-twist',
    name: 'Twist a yellow corner',
    moves: "R' D' R D",
    provenance: 'claude-proposed',
    stage: 10,
  },
} satisfies Record<string, BeginnerAlgorithm>;

export function algorithmById(id: string): BeginnerAlgorithm {
  const found = Object.values(BEGINNER_ALGORITHMS).find((a) => a.id === id);
  if (!found) throw new Error(`Unknown beginner algorithm: ${id}`);
  return found;
}

export interface StageInfo {
  number: number;
  title: string;
  hold: string;
  goal: string;
  howTo: string;
  tip?: string;
  algorithmIds: string[];
}

export const BEGINNER_STAGES: readonly StageInfo[] = [
  {
    number: 1,
    title: 'The daisy',
    hold: 'Yellow on top.',
    goal: 'Four white edges around the yellow center, white squares facing up, like petals.',
    howTo:
      "Find a white edge and bring it up beside the yellow center with its white square facing up. Turn the top first so you don't knock off a petal you already have.",
    algorithmIds: [],
  },
  {
    number: 2,
    title: 'The white cross',
    hold: 'Yellow on top, then white on top.',
    goal: 'A white cross on the white face, each edge matching the center beside it.',
    howTo:
      "For each petal: turn the top until the petal's other color sits above the center of the same color, then turn that face twice. The white square drops to the bottom. When all four are down, turn the cube over so white is on top.",
    algorithmIds: [],
  },
  {
    number: 3,
    title: 'White corners',
    hold: 'White on top.',
    goal: 'The whole white face done, with the top row of every side matching its center.',
    howTo:
      "Find a white corner in the bottom layer. Turn the whole cube so its home (between its two other colors) is at the front right, turn the bottom so the corner sits right below it, then repeat R' D' R D until it pops into place with white on top.",
    tip: "A white corner stuck in the top layer in the wrong spot or twisted? Hold it at the front right and do R' D' R D once to drop it to the bottom layer, then put it in as usual.",
    algorithmIds: ['corner-insert'],
  },
  {
    number: 4,
    title: 'Middle layer',
    hold: 'White on top.',
    goal: 'The top two layers are solved.',
    howTo:
      'Find an edge in the bottom layer with no yellow on it. Turn the whole cube so the center matching its side color faces you, and turn the bottom until the edge is right below that center. If its bottom color matches the left center, send it left; if it matches the right center, send it right.',
    tip: 'An edge stuck in the middle layer in the wrong spot or flipped? Turn the cube so it is at the front right and send any bottom edge to the right. That knocks it down to the bottom layer.',
    algorithmIds: ['middle-left', 'middle-right'],
  },
  {
    number: 5,
    title: 'Turn over and read the top',
    hold: 'Yellow on top.',
    goal: 'Know which yellow pattern you have on top: a dot, a reverse L, or a line.',
    howTo:
      'Turn the cube over so yellow is on top. Look only at the yellow squares in the middle of each top edge and ignore the corners.',
    algorithmIds: [],
  },
  {
    number: 6,
    title: 'Yellow cross',
    hold: 'Yellow on top.',
    goal: 'A yellow cross on top.',
    howTo:
      'Line: turn the cube so the line runs left to right, and do the algorithm once. Reverse L: turn the cube so the L points to the back and left, and do the algorithm twice in a row. Dot: do the algorithm once, turn the cube so the reverse L points to the back and left, then do it twice.',
    algorithmIds: ['yellow-cross'],
  },
  {
    number: 7,
    title: 'Check the yellow edges',
    hold: 'Yellow on top.',
    goal: 'See how many yellow edges match the center below them.',
    howTo:
      'Turn the top until at least two edges match the center below them. Either two side-by-side edges match, two opposite edges match, or all four do.',
    algorithmIds: [],
  },
  {
    number: 8,
    title: 'Yellow edges',
    hold: 'Yellow on top.',
    goal: 'All four yellow edges match the centers below them.',
    howTo:
      'Two matching edges side by side: turn the cube so they are at the back and right, do the algorithm, then turn the top to line everything up. Two opposite: do the algorithm once from any side, then check again.',
    algorithmIds: ['yellow-edges'],
  },
  {
    number: 9,
    title: 'Place the yellow corners',
    hold: 'Yellow on top.',
    goal: 'Every top corner sits in its right spot (it may still be twisted).',
    howTo:
      'Find a corner already in its right spot and turn the cube so it is at the front right, then do the algorithm once or twice. None in place? Do it once from anywhere and look again.',
    algorithmIds: ['corner-cycle'],
  },
  {
    number: 10,
    title: 'Twist the yellow corners',
    hold: 'Yellow on top.',
    goal: 'Solved!',
    howTo:
      "Bring an unfinished corner to the front right. Repeat R' D' R D until its yellow faces up, then turn only the top to bring the next unfinished corner to the front right, and repeat. The lower layers look scrambled halfway through; that's normal, and they come back. Finish by turning the top to line it up.",
    algorithmIds: ['corner-twist'],
  },
];

/** A fixed scramble used for the Learn screen's examples. */
export const DEMO_SCRAMBLE = "D2 R2 B' U2 F' L2 B D2 F' R2 U' L B' U' F D' R' B2 U";
