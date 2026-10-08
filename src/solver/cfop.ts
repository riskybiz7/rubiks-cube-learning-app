import {
  CFOP_ALGORITHMS,
  GROUPS,
  TWO_LOOK,
  cardTitle,
  cfopStageTitles,
  inGroup,
  inSet,
  type CfopAlgorithm,
  type LastLayerChoice,
} from '../content/cfop';
import { COLOR_NAMES, capitalize, colorList } from '../cube/describe';
import { applyMoves, isSolved } from '../cube/moves';
import { mustParse, type Move } from '../cube/notation';
import type { Color, Cube } from '../cube/types';
import { validateStickers } from '../cube/validate';
import {
  F2L_PAIRS,
  centerColor,
  isCfopCross,
  isFlippedTwoLayers,
  isPairSolved,
  isYellowCross,
  isYellowFace,
  topCornersMatchAfterTopTurn,
} from './checks';
import { crossMoves } from './cross';
import {
  CUBE_TURNS,
  PlanWriter,
  TOP_TURNS,
  checkPlan,
  reorientTo,
  type SolvePlan,
  type SolveResult,
} from './plan';

const name = (color: Color) => COLOR_NAMES[color];
const MOVES = new Map(CFOP_ALGORITHMS.map((a) => [a.id, mustParse(a.moves)]));
const F2L = CFOP_ALGORITHMS.filter((a) => a.set === 'F2L');
const PULL_OUT = mustParse("R U R'");
const STAGE_GOALS = [isCfopCross, isFlippedTwoLayers, isYellowFace, isSolved];

/** A turn of the top plus one of `algorithms` that reaches `goal`, or null if none does. */
function findCase(
  cube: Cube,
  algorithms: readonly CfopAlgorithm[],
  goal: (cube: Cube) => boolean,
): Found | null {
  for (const algorithm of algorithms) {
    const moves = MOVES.get(algorithm.id)!;
    for (const top of TOP_TURNS) {
      if (goal(applyMoves(cube, [...top, ...moves]))) return { top, moves, algorithm };
    }
  }
  return null;
}

/** A case found: the top turn that lines it up, then the algorithm exactly as on its card. */
interface Found {
  top: Move[];
  moves: Move[];
  algorithm: CfopAlgorithm;
}

/** Two steps: turn the top to line up the case (if needed), then the algorithm as learned. */
function lineUpAndDo(w: PlanWriter, found: Found, lineUp: string, doIt: string): void {
  w.step('moves', found.top, lineUp);
  w.step('moves', found.moves, doIt, found.algorithm.id);
}

// ── Stage 1: the cross ──────────────────────────────────────────────────

function cross(w: PlanWriter): void {
  w.startStage(1);
  w.rotate(
    reorientTo(w.cube, 'Y', 'G'),
    'Turn the cube so yellow is on top: CFOP builds the white cross on the bottom.',
    'Yellow is already on top, with green facing you.',
  );
  const sides = (['F', 'R', 'B', 'L'] as const).map((face) => centerColor(w.cube, face));
  const placed: Color[] = [];
  while (placed.length < sides.length) {
    // Next, the edge that takes the fewest turns (keeping the ones already placed).
    let best: { color: Color; moves: Move[] } | null = null;
    for (const color of sides) {
      if (placed.includes(color)) continue;
      const moves = crossMoves(w.cube, [...placed, color]);
      if (!moves) throw new Error(`Couldn't place the white-${name(color)} edge.`);
      if (!best || moves.length < best.moves.length) best = { color, moves };
    }
    if (!best) break;
    w.step(
      'moves',
      best.moves,
      `Put the white-${name(best.color)} edge on the bottom, under the ${name(best.color)} center, with its white square facing down.`,
    );
    placed.push(best.color);
  }
}

// ── Stage 2: F2L ────────────────────────────────────────────────────────

const FRONT_RIGHT = F2L_PAIRS[0];
const frontRightDone = (cube: Cube) => isCfopCross(cube) && isPairSolved(cube, FRONT_RIGHT);
/** The front-right slot's two colors, e.g. "green-orange". */
const slotName = (cube: Cube) => colorList([centerColor(cube, 'F'), centerColor(cube, 'R')]);

/**
 * Does the front-right slot hold a piece another slot needs? A white corner or a middle
 * edge (no white, no yellow) that isn't this slot's own. Yellow top-layer pieces don't
 * count: they're in nobody's way, and the F2L cases already expect them there.
 */
function holdsAnotherSlotsPiece(cube: Cube): boolean {
  const mine = [centerColor(cube, 'F'), centerColor(cube, 'R')];
  const isMine = (colors: Color[]) => mine.every((color) => colors.includes(color));
  const [corner, edge] = FRONT_RIGHT;
  const cornerColors = corner.stickers.map((square) => cube.stickers[square]);
  const edgeColors = edge.stickers.map((square) => cube.stickers[square]);
  const slotCorner = cornerColors.includes('W');
  const slotEdge = !edgeColors.includes('W') && !edgeColors.includes('Y');
  return (slotCorner && !isMine(cornerColors)) || (slotEdge && !isMine(edgeColors));
}

/** Can some unfinished slot be finished straight away (from the front right, after a cube turn)? */
const someSlotReady = (cube: Cube) =>
  CUBE_TURNS.some((turn) => {
    const turned = applyMoves(cube, turn);
    return !isPairSolved(turned, FRONT_RIGHT) && findCase(turned, F2L, frontRightDone) !== null;
  });

/**
 * Which stuck slot to empty, and which top turn to do first. R U R' also drops two top
 * pieces into the slot, so look one step ahead: prefer the choice after which some slot
 * can be finished straight away, and among those the one with the fewest turns.
 */
function choosePullOut(cube: Cube): { quarters: number; top: Move[] } | null {
  let fallback: { quarters: number; top: Move[] } | null = null;
  for (const top of TOP_TURNS) {
    for (let quarters = 0; quarters < 4; quarters++) {
      const turned = applyMoves(cube, CUBE_TURNS[quarters]);
      if (!holdsAnotherSlotsPiece(turned)) continue;
      fallback ??= { quarters, top: [] };
      if (someSlotReady(applyMoves(turned, [...top, ...PULL_OUT]))) return { quarters, top };
    }
  }
  return fallback;
}

function firstTwoLayers(w: PlanWriter): void {
  w.startStage(2);
  for (let guard = 0; guard < 16; guard++) {
    if (isFlippedTwoLayers(w.cube)) return;
    // Try every unfinished slot from the front right, and take the shortest.
    let best: { quarters: number; found: Found; length: number } | null = null;
    for (let quarters = 0; quarters < 4; quarters++) {
      const turned = applyMoves(w.cube, CUBE_TURNS[quarters]);
      if (isPairSolved(turned, FRONT_RIGHT)) continue;
      const found = findCase(turned, F2L, frontRightDone);
      const length = found ? found.top.length + found.moves.length : Infinity;
      if (found && (!best || length < best.length)) best = { quarters, found, length };
    }
    if (best) {
      const slot = slotName(applyMoves(w.cube, CUBE_TURNS[best.quarters]));
      const name = best.found.algorithm.name;
      w.rotate(
        CUBE_TURNS[best.quarters],
        `Turn the whole cube so the ${slot} slot is at the front right.`,
        `The ${slot} slot is already at the front right.`,
      );
      lineUpAndDo(
        w,
        best.found,
        `Turn the top to line up the ${slot} corner and edge for ${name}.`,
        `Do ${name} to drop the ${slot} corner and edge into the slot together.`,
      );
      continue;
    }
    // No slot can be finished yet: a piece is stuck in another slot. Take one out.
    const pull = choosePullOut(w.cube);
    if (!pull) break;
    w.rotate(
      CUBE_TURNS[pull.quarters],
      "Turn the whole cube so the slot holding another slot's piece is at the front right.",
      "The slot at the front right holds another slot's piece.",
    );
    w.step(
      'moves',
      pull.top,
      'Turn the top first, so the pieces you still need stay out of this slot.',
    );
    w.step(
      'moves',
      PULL_OUT,
      "Take its pieces out to the top layer with R U R', so they can go where they belong.",
    );
  }
  if (!isFlippedTwoLayers(w.cube)) throw new Error("Couldn't finish the first two layers.");
}

// ── Stages 3 and 4: the last layer ──────────────────────────────────────

function lookAndDo(
  w: PlanWriter,
  algorithms: readonly CfopAlgorithm[],
  goal: (cube: Cube) => boolean,
  what: string,
): void {
  if (goal(w.cube)) return;
  const found = findCase(w.cube, algorithms, goal);
  if (!found) throw new Error(`Couldn't ${what}.`);
  const title = cardTitle(found.algorithm);
  lineUpAndDo(
    w,
    found,
    `Turn the top to line up the ${title} case.`,
    `${capitalize(what)}: it's the ${title} case, so do its algorithm.`,
  );
}

const lastLayerLinesUp = (cube: Cube) => TOP_TURNS.some((turn) => isSolved(applyMoves(cube, turn)));

function yellowTop(w: PlanWriter, choice: LastLayerChoice): void {
  w.startStage(3);
  if (choice.oll === 'full') {
    lookAndDo(w, inSet('OLL'), isYellowFace, 'make the whole top yellow');
    return;
  }
  lookAndDo(w, inGroup(GROUPS.ollEdges), isYellowCross, 'make the yellow cross');
  lookAndDo(w, inGroup(GROUPS.ollCorners), isYellowFace, 'make the whole top yellow');
}

function finishTop(w: PlanWriter, choice: LastLayerChoice): void {
  w.startStage(4);
  if (choice.pll === 'full') {
    lookAndDo(w, inSet('PLL'), lastLayerLinesUp, 'finish the top');
  } else {
    lookAndDo(
      w,
      inGroup(GROUPS.pllCorners),
      topCornersMatchAfterTopTurn,
      'put the corners in place',
    );
    lookAndDo(w, inGroup(GROUPS.pllEdges), lastLayerLinesUp, 'put the edges in place');
  }
  const k = TOP_TURNS.findIndex((turn) => isSolved(applyMoves(w.cube, turn)));
  if (k < 0) throw new Error("The cube didn't finish solved.");
  w.step('moves', TOP_TURNS[k], 'Turn the top to line it up. Solved!');
}

/** Replay a CFOP plan and confirm each stage reaches its goal and the cube ends solved. */
export function cfopSelfCheck(plan: SolvePlan): string | null {
  return checkPlan(plan, STAGE_GOALS);
}

/** Work out a CFOP solve: cross, F2L, then OLL and PLL in two looks or one, as chosen. */
export function solveCfop(start: Cube, choice: LastLayerChoice = TWO_LOOK): SolveResult {
  const check = validateStickers(start.stickers);
  if (!check.ok) return { ok: false, error: check.problems.map((p) => p.message).join(' ') };
  try {
    const w = new PlanWriter(start, cfopStageTitles(choice));
    cross(w);
    firstTwoLayers(w);
    yellowTop(w, choice);
    finishTop(w, choice);
    const plan: SolvePlan = { start, stages: w.finish() };
    const problem = cfopSelfCheck(plan);
    return problem ? { ok: false, error: problem } : { ok: true, plan };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: `${detail} This is a bug in the app, not a problem with your cube.`,
    };
  }
}
