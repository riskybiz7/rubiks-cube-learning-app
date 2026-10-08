import { BEGINNER_ALGORITHMS, BEGINNER_STAGES } from '../content/beginner';
import { COLOR_NAMES, colorList, faceWord, listJoin, placeName } from '../cube/describe';
import { applyMoves, isSolved } from '../cube/moves';
import { mustParse, type Move, type MoveBase, type Turns } from '../cube/notation';
import { CORNER_SLOTS, EDGE_SLOTS } from '../cube/pieces';
import type { Color, Cube, Face } from '../cube/types';
import { validateStickers } from '../cube/validate';
import {
  BOTTOM_CORNERS,
  BOTTOM_EDGES,
  MIDDLE_EDGES,
  TOP_CORNERS,
  TOP_EDGES,
  TOP_EDGE_SQUARES,
  allSlotsSolved,
  areYellowCornersPlaced,
  areYellowEdgesSolved,
  centerColor,
  isCornerInPlace,
  isDaisy,
  isFirstLayer,
  isFirstTwoLayers,
  isFlippedTwoLayers,
  isSlotSolved,
  isWhiteCross,
  isYellowCross,
} from './checks';
import {
  CUBE_TURNS,
  PlanWriter,
  TOP_TURNS,
  checkPlan,
  quarterTurns,
  reorientTo,
  type SolvePlan,
  type SolveResult,
} from './plan';
import { searchMoves } from './search';

export type { PlannedStep, SolvePlan, SolveResult, SolveStage, SolveStep } from './plan';
export { listSteps } from './plan';

// ── Small helpers ───────────────────────────────────────────────────────

const algorithm = (key: keyof typeof BEGINNER_ALGORITHMS): Move[] =>
  mustParse(BEGINNER_ALGORITHMS[key].moves);

const repeat = (moves: readonly Move[], times: number): Move[] =>
  Array.from({ length: times }, () => moves).flat();

const BOTTOM_TURNS = quarterTurns('D');
const name = (color: Color) => COLOR_NAMES[color];

// ── Stage 1: the daisy ──────────────────────────────────────────────────

/** The other colors of the white edges that are currently petals. */
function petalColors(cube: Cube): Color[] {
  return TOP_EDGES.filter((slot) => cube.stickers[slot.stickers[0]] === 'W').map(
    (slot) => cube.stickers[slot.stickers[1]],
  );
}

/**
 * How face names change after turning the whole cube with y (like turning the top layer):
 * the back ends up on the right, the right at the front, and so on. Top and bottom stay.
 */
const FACE_AFTER_CUBE_TURN: Partial<Record<MoveBase, MoveBase>> = {
  F: 'L',
  R: 'F',
  B: 'R',
  L: 'B',
  U: 'U',
  D: 'D',
};

/**
 * The same physical face turns, named as they'd be after turning the whole cube
 * `quarters` times with y. Only face turns are expected (that's all the daisy search uses).
 */
function renameAfterCubeTurns(moves: readonly Move[], quarters: number): Move[] {
  return moves.map((move) => {
    let base = move.base;
    for (let i = 0; i < quarters; i++) {
      const renamed = FACE_AFTER_CUBE_TURN[base];
      if (!renamed) throw new Error(`Can't rename ${base} after a cube turn.`);
      base = renamed;
    }
    return { base, turns: move.turns };
  });
}

const usesBackFace = (moves: readonly Move[]) => moves.some((m) => m.base === 'B');

/**
 * The owner never has a beginner turn the back face: instead, turn the whole cube so
 * that side faces you and turn the front (e.g. "U F", not "U B"). It's easier to line a
 * petal up with a center that faces you directly. Adds that cube-turn step when needed
 * and returns the same physical turns, named for the new hold.
 */
function withoutBackFace(w: PlanWriter, moves: readonly Move[]): Move[] {
  if (!usesBackFace(moves)) return [...moves];
  // A half turn of the cube (y2) brings the back to the front; try it first.
  const quarters = [2, 1, 3].find((q) => !usesBackFace(renameAfterCubeTurns(moves, q)));
  if (quarters === undefined) return [...moves];
  const facing = centerColor(applyMoves(w.cube, CUBE_TURNS[quarters]), 'F');
  const why = `Turn the whole cube so the ${name(facing)} center faces you.`;
  w.rotate(CUBE_TURNS[quarters], why, why);
  return renameAfterCubeTurns(moves, quarters);
}

function daisy(w: PlanWriter): void {
  w.startStage(1);
  w.rotate(
    reorientTo(w.cube, 'Y', 'G'),
    'Turn the cube so yellow is on top.',
    'Hold the cube with yellow on top and green facing you.',
  );
  while (petalColors(w.cube).length < 4) {
    const before = petalColors(w.cube);
    const found = searchMoves(w.cube, (c) => petalColors(c).length > before.length, 5);
    if (!found) throw new Error("Couldn't find a way to add a daisy petal.");
    const moves = withoutBackFace(w, found);
    const added = petalColors(applyMoves(w.cube, moves)).filter((c) => !before.includes(c));
    const edges = listJoin(added.map((c) => `white-${name(c)}`));
    w.step(
      'moves',
      moves,
      `Bring the ${edges} edge${added.length > 1 ? 's' : ''} up beside the yellow center, white facing up.`,
    );
  }
}

// ── Stage 2: the white cross ────────────────────────────────────────────

function whiteCross(w: PlanWriter): void {
  w.startStage(2);
  for (let petal = 0; petal < 4; petal++) {
    let choice: { k: number; face: Face } | null = null;
    for (let k = 0; k < 4 && !choice; k++) {
      const turned = applyMoves(w.cube, TOP_TURNS[k]);
      const slot = TOP_EDGES.find(
        (s) =>
          turned.stickers[s.stickers[0]] === 'W' &&
          turned.stickers[s.stickers[1]] === centerColor(turned, s.faces[1]),
      );
      if (slot) choice = { k, face: slot.faces[1] };
    }
    if (!choice) throw new Error("Couldn't line up a daisy petal.");
    const color = name(centerColor(w.cube, choice.face));
    // The owner sends every petal down from the front: first turn the whole cube so the
    // matching center faces you, then the same turns are "top, then front twice".
    const moves = [...TOP_TURNS[choice.k], { base: choice.face, turns: 2 as Turns }];
    const quarters = [0, 1, 2, 3].find(
      (q) => renameAfterCubeTurns([moves[moves.length - 1]], q)[0].base === 'F',
    );
    if (quarters === undefined) throw new Error("Couldn't turn a petal's center to face you.");
    w.rotate(
      CUBE_TURNS[quarters],
      `Turn the whole cube so the ${color} center faces you.`,
      `The ${color} center already faces you.`,
    );
    w.step(
      'moves',
      renameAfterCubeTurns(moves, quarters),
      `Turn the top until the white-${color} petal sits above the ${color} center, then turn the front face twice to send it down.`,
    );
  }
  w.rotate(
    reorientTo(w.cube, 'W', 'G'),
    'Turn the cube over so the white cross is on top.',
    'The white cross is already on top, with green facing you.',
  );
}

// ── Stage 3: white corners ──────────────────────────────────────────────

const URF = CORNER_SLOTS[0];
const DFR = CORNER_SLOTS[4];

function whiteCorners(w: PlanWriter): void {
  w.startStage(3);
  const insert = algorithm('cornerInsert');
  for (let guard = 0; !allSlotsSolved(w.cube, TOP_CORNERS); guard++) {
    if (guard > 12) throw new Error("The white corners didn't finish.");
    const bottom = BOTTOM_CORNERS.find((slot) =>
      slot.stickers.some((s) => w.cube.stickers[s] === 'W'),
    );
    if (!bottom) {
      // Every white corner is on top, but one is in the wrong spot or twisted: drop it down.
      const k = CUBE_TURNS.findIndex((y) => !isSlotSolved(applyMoves(w.cube, y), URF));
      w.rotate(
        CUBE_TURNS[k],
        'Turn the whole cube so a wrong top corner is at the front right.',
        'The top corner at the front right is in the wrong spot or twisted.',
      );
      w.step(
        'moves',
        insert,
        "Do R' D' R D once to drop that corner to the bottom layer.",
        'corner-insert',
      );
      continue;
    }
    const others: Color[] = bottom.stickers.map((s) => w.cube.stickers[s]).filter((c) => c !== 'W');
    const k = CUBE_TURNS.findIndex((y) => {
      const turned = applyMoves(w.cube, y);
      return [centerColor(turned, 'R'), centerColor(turned, 'F')].every((c) => others.includes(c));
    });
    w.rotate(
      CUBE_TURNS[k],
      `Turn the whole cube so the home of the white-${colorList(others)} corner, between the ${name(others[0])} and ${name(others[1])} centers, is at the front right.`,
      `The home of the white-${colorList(others)} corner, between the ${name(others[0])} and ${name(others[1])} centers, is already at the front right.`,
    );
    const j = BOTTOM_TURNS.findIndex((d) => {
      const turned = applyMoves(w.cube, d);
      const colors = DFR.stickers.map((s) => turned.stickers[s]);
      return colors.includes('W') && others.every((c) => colors.includes(c));
    });
    w.step('moves', BOTTOM_TURNS[j], 'Turn the bottom until the corner is right below its home.');
    let moves: Move[] = [];
    let times = 0;
    while (!isSlotSolved(applyMoves(w.cube, moves), URF)) {
      moves = [...moves, ...insert];
      times++;
      if (times > 5) throw new Error("A white corner wouldn't go in.");
    }
    w.step(
      'moves',
      moves,
      `Repeat R' D' R D until the corner is in place with white on top (${times} time${times > 1 ? 's' : ''}).`,
      'corner-insert',
    );
  }
}

// ── Stage 4: middle layer ───────────────────────────────────────────────

const FRONT_RIGHT_EDGE = EDGE_SLOTS[8];

function middleLayer(w: PlanWriter): void {
  w.startStage(4);
  for (let guard = 0; !allSlotsSolved(w.cube, MIDDLE_EDGES); guard++) {
    if (guard > 12) throw new Error("The middle layer didn't finish.");
    const bottom = BOTTOM_EDGES.find((slot) =>
      slot.stickers.every((s) => w.cube.stickers[s] !== 'Y'),
    );
    if (!bottom) {
      // No middle edge is waiting in the bottom layer, so one must be stuck in the middle.
      const k = CUBE_TURNS.findIndex((y) => !isSlotSolved(applyMoves(w.cube, y), FRONT_RIGHT_EDGE));
      w.rotate(
        CUBE_TURNS[k],
        'Turn the whole cube so a wrong middle edge is at the front right.',
        'The middle edge at the front right is in the wrong spot or flipped.',
      );
      w.step(
        'moves',
        algorithm('middleRight'),
        'Send any bottom edge to the right. That knocks the stuck edge down to the bottom layer.',
        'middle-right',
      );
      continue;
    }
    const down = w.cube.stickers[bottom.stickers[0]]; // the square on the bottom face
    const side = w.cube.stickers[bottom.stickers[1]];
    const k = CUBE_TURNS.findIndex((y) => centerColor(applyMoves(w.cube, y), 'F') === side);
    w.rotate(
      CUBE_TURNS[k],
      `Turn the whole cube so the ${name(side)} center faces you.`,
      `Next: the ${name(side)}-${name(down)} edge. The ${name(side)} center already faces you.`,
    );
    const j = BOTTOM_TURNS.findIndex((d) => {
      const turned = applyMoves(w.cube, d);
      return turned.stickers[25] === side && turned.stickers[28] === down; // bottom-front edge
    });
    w.step(
      'moves',
      BOTTOM_TURNS[j],
      `Turn the bottom until the ${name(side)}-${name(down)} edge is right below the ${name(side)} center.`,
    );
    const left = centerColor(w.cube, 'L') === down;
    w.step(
      'moves',
      algorithm(left ? 'middleLeft' : 'middleRight'),
      `Its bottom color is ${name(down)}, like the ${left ? 'left' : 'right'} center, so send it ${left ? 'left' : 'right'}.`,
      left ? 'middle-left' : 'middle-right',
    );
  }
}

// ── Stage 5: turn over and read the top ─────────────────────────────────

type TopPattern = 'dot' | 'reverse L' | 'line' | 'cross';

function topPattern(cube: Cube): TopPattern {
  const yellow = TOP_EDGE_SQUARES.filter((square) => cube.stickers[square] === 'Y');
  if (yellow.length === 4) return 'cross';
  if (yellow.length === 0) return 'dot';
  const opposite = yellow.includes(1) === yellow.includes(7); // back+front or left+right
  return opposite ? 'line' : 'reverse L';
}

function turnOver(w: PlanWriter): void {
  w.startStage(5);
  w.rotate(
    reorientTo(w.cube, 'Y', 'G'),
    'Turn the cube over so yellow is on top.',
    'Yellow is already on top, with green facing you.',
  );
  const pattern = topPattern(w.cube);
  const seen = pattern === 'cross' ? 'a yellow cross already' : `a ${pattern}`;
  w.step(
    'check',
    [],
    `Look at the yellow squares in the middle of each top edge: you have ${seen}.`,
  );
}

// ── Stage 6: yellow cross (the owner's procedure) ───────────────────────

function yellowCross(w: PlanWriter): void {
  w.startStage(6);
  const cross = algorithm('yellowCross');
  let pattern = topPattern(w.cube);
  if (pattern === 'cross') {
    w.step('check', [], 'You already have a yellow cross, so move on.');
    return;
  }
  if (pattern === 'dot') {
    w.step('moves', cross, "Dot: do F R U R' U' F' once. You'll get a reverse L.", 'yellow-cross');
    pattern = topPattern(w.cube);
  }
  const times = pattern === 'line' ? 1 : 2;
  const k = CUBE_TURNS.findIndex((y) =>
    isYellowCross(applyMoves(w.cube, [...y, ...repeat(cross, times)])),
  );
  if (k < 0) throw new Error("The yellow cross algorithm didn't work from any side.");
  w.rotate(
    CUBE_TURNS[k],
    pattern === 'line'
      ? 'Line: turn the whole cube so the line runs left to right.'
      : 'Reverse L: turn the whole cube so the L points to the back and left.',
    pattern === 'line'
      ? 'Line: it already runs left to right.'
      : 'Reverse L: it already points to the back and left.',
  );
  w.step(
    'moves',
    repeat(cross, times),
    times === 1 ? "Do F R U R' U' F' once." : "Do F R U R' U' F' twice in a row.",
    'yellow-cross',
  );
}

// ── Stage 7: check the yellow edges ─────────────────────────────────────

const matchingTopEdges = (cube: Cube) => TOP_EDGES.filter((slot) => isSlotSolved(cube, slot));

/** How far to turn the top so the most yellow edges match their centers. */
function bestTopTurn(cube: Cube): number {
  const counts = TOP_TURNS.map((u) => matchingTopEdges(applyMoves(cube, u)).length);
  return counts.indexOf(Math.max(...counts));
}

const areOpposite = (slots: readonly (typeof TOP_EDGES)[number][]) =>
  slots.length === 2 && Math.abs(TOP_EDGES.indexOf(slots[0]) - TOP_EDGES.indexOf(slots[1])) === 2;

function checkEdges(w: PlanWriter): void {
  w.startStage(7);
  const k = bestTopTurn(w.cube);
  const matched = matchingTopEdges(applyMoves(w.cube, TOP_TURNS[k]));
  const how =
    matched.length === 4
      ? 'all four match'
      : areOpposite(matched)
        ? 'two opposite edges match'
        : 'two side-by-side edges match';
  w.step(
    k === 0 ? 'check' : 'moves',
    TOP_TURNS[k],
    `Turn the top until the most yellow edges match the centers below them: ${how}.`,
  );
}

// ── Stage 8: yellow edges ───────────────────────────────────────────────

function yellowEdges(w: PlanWriter): void {
  w.startStage(8);
  const swap = algorithm('yellowEdges');
  for (let guard = 0; !allSlotsSolved(w.cube, TOP_EDGES); guard++) {
    if (guard > 3) throw new Error("The yellow edges didn't finish.");
    if (areOpposite(matchingTopEdges(w.cube))) {
      w.step(
        'moves',
        swap,
        "The matching edges are opposite: do R U R' U R U2 R' once from any side.",
        'yellow-edges',
      );
      w.step(
        'moves',
        TOP_TURNS[bestTopTurn(w.cube)],
        'Turn the top again until the most edges match.',
      );
      continue;
    }
    let found: { k: number; j: number } | null = null;
    for (let k = 0; k < 4 && !found; k++) {
      for (let j = 0; j < 4 && !found; j++) {
        const after = applyMoves(w.cube, [...CUBE_TURNS[k], ...swap, ...TOP_TURNS[j]]);
        if (allSlotsSolved(after, TOP_EDGES)) found = { k, j };
      }
    }
    if (!found) throw new Error("The yellow edge swap didn't work from any side.");
    const held = applyMoves(w.cube, CUBE_TURNS[found.k]);
    const where = listJoin(matchingTopEdges(held).map((slot) => faceWord(slot.faces[1])));
    w.rotate(
      CUBE_TURNS[found.k],
      `Two matching edges side by side: turn the whole cube so they're at the ${where}.`,
      `Two matching edges side by side: they're already at the ${where}.`,
    );
    w.step('moves', swap, "Do R U R' U R U2 R'.", 'yellow-edges');
    w.step('moves', TOP_TURNS[found.j], 'Turn the top to line the edges up with their centers.');
  }
}

// ── Stage 9: place the yellow corners ───────────────────────────────────

const cornersPlaced = (cube: Cube) => TOP_CORNERS.filter((slot) => isCornerInPlace(cube, slot));

function placeCorners(w: PlanWriter): void {
  w.startStage(9);
  const cycle = algorithm('cornerCycle');
  for (let guard = 0; cornersPlaced(w.cube).length < 4; guard++) {
    if (guard > 3) throw new Error("The yellow corners wouldn't go into place.");
    if (cornersPlaced(w.cube).length === 0) {
      w.step(
        'moves',
        cycle,
        "No corner is in its spot yet: do U R U' L' U R' U' L once, then look again.",
        'corner-cycle',
      );
      continue;
    }
    let found: { k: number; times: number } | null = null;
    for (let k = 0; k < 4 && !found; k++) {
      for (const times of [1, 2]) {
        if (found) break;
        const after = applyMoves(w.cube, [...CUBE_TURNS[k], ...repeat(cycle, times)]);
        if (cornersPlaced(after).length === 4) found = { k, times };
      }
    }
    if (!found) throw new Error("The corner algorithm didn't work from any side.");
    const held = applyMoves(w.cube, CUBE_TURNS[found.k]);
    const spot = placeName(cornersPlaced(held)[0].faces);
    w.rotate(
      CUBE_TURNS[found.k],
      `One corner is already in its spot: turn the whole cube so it's at the ${spot}.`,
      `One corner is already in its spot, at the ${spot}.`,
    );
    w.step(
      'moves',
      repeat(cycle, found.times),
      found.times === 1 ? "Do U R U' L' U R' U' L." : "Do U R U' L' U R' U' L twice.",
      'corner-cycle',
    );
  }
}

// ── Stage 10: twist the yellow corners ──────────────────────────────────

const yellowOnTop = (cube: Cube) => cube.stickers[URF.stickers[0]] === 'Y';

function twistCorners(w: PlanWriter): void {
  w.startStage(10);
  const twist = algorithm('cornerTwist');
  for (let corner = 0; corner < 4; corner++) {
    if (TOP_CORNERS.every((slot) => w.cube.stickers[slot.stickers[0]] === 'Y')) break;
    const k = TOP_TURNS.findIndex((u) => !yellowOnTop(applyMoves(w.cube, u)));
    w.step(
      'moves',
      TOP_TURNS[k],
      'Turn only the top to bring an unfinished corner to the front right.',
    );
    let moves: Move[] = [];
    let times = 0;
    while (!yellowOnTop(applyMoves(w.cube, moves))) {
      moves = [...moves, ...twist];
      times++;
      if (times > 5) throw new Error("A yellow corner wouldn't twist into place.");
    }
    w.step(
      'moves',
      moves,
      `Repeat R' D' R D until this corner's yellow faces up (${times} times). The lower layers look scrambled for now; that's normal.`,
      'corner-twist',
    );
  }
  const k = TOP_TURNS.findIndex((u) => isSolved(applyMoves(w.cube, u)));
  if (k < 0) throw new Error("The cube didn't finish solved.");
  if (k === 0) w.step('check', [], 'Solved!');
  else w.step('moves', TOP_TURNS[k], 'Turn the top to line it up. Solved!');
}

// ── Putting it together ─────────────────────────────────────────────────

const STAGE_GOALS: ((cube: Cube) => boolean)[] = [
  isDaisy,
  isWhiteCross,
  isFirstLayer,
  isFirstTwoLayers,
  isFlippedTwoLayers,
  isYellowCross,
  (cube) => isYellowCross(cube) && matchingTopEdges(cube).length >= 2,
  areYellowEdgesSolved,
  areYellowCornersPlaced,
  isSolved,
];

/** Replay a plan from its start and confirm each stage reaches its goal and the cube ends solved. */
export function selfCheck(plan: SolvePlan): string | null {
  return checkPlan(plan, STAGE_GOALS);
}

/** Work out the owner's beginner method, stage by stage, for this cube. */
export function solveBeginner(start: Cube): SolveResult {
  const check = validateStickers(start.stickers);
  if (!check.ok) return { ok: false, error: check.problems.map((p) => p.message).join(' ') };
  try {
    const w = new PlanWriter(
      start,
      BEGINNER_STAGES.map((s) => s.title),
    );
    daisy(w);
    whiteCross(w);
    whiteCorners(w);
    middleLayer(w);
    turnOver(w);
    yellowCross(w);
    checkEdges(w);
    yellowEdges(w);
    placeCorners(w);
    twistCorners(w);
    const plan: SolvePlan = { start, stages: w.finish() };
    const problem = selfCheck(plan);
    return problem ? { ok: false, error: problem } : { ok: true, plan };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: `${detail} This is a bug in the app, not a problem with your cube.`,
    };
  }
}
