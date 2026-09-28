import { CFOP_ALGORITHMS, CFOP_STAGES, GROUPS, inGroup, type CfopAlgorithm } from '../content/cfop';
import { COLOR_NAMES, colorList } from '../cube/describe';
import { applyMoves, isSolved } from '../cube/moves';
import { joinTurns, mustParse, type Move } from '../cube/notation';
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
): { moves: Move[]; algorithm: CfopAlgorithm } | null {
  for (const algorithm of algorithms) {
    for (const top of TOP_TURNS) {
      // The top turn that lines up the case may merge with the algorithm's own first turn.
      const moves = joinTurns([...top, ...MOVES.get(algorithm.id)!]);
      if (goal(applyMoves(cube, moves))) return { moves, algorithm };
    }
  }
  return null;
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

function firstTwoLayers(w: PlanWriter): void {
  w.startStage(2);
  for (let guard = 0; guard < 16; guard++) {
    if (isFlippedTwoLayers(w.cube)) return;
    // Try every unfinished slot from the front right, and take the shortest.
    let best: { quarters: number; moves: Move[]; algorithm: CfopAlgorithm } | null = null;
    for (let quarters = 0; quarters < 4; quarters++) {
      const turned = applyMoves(w.cube, CUBE_TURNS[quarters]);
      if (isPairSolved(turned, FRONT_RIGHT)) continue;
      const found = findCase(turned, F2L, frontRightDone);
      if (found && (!best || found.moves.length < best.moves.length)) {
        best = { quarters, ...found };
      }
    }
    if (best) {
      const slot = slotName(applyMoves(w.cube, CUBE_TURNS[best.quarters]));
      w.rotate(
        CUBE_TURNS[best.quarters],
        `Turn the whole cube so the ${slot} slot is at the front right.`,
        `The ${slot} slot is already at the front right.`,
      );
      w.step(
        'moves',
        best.moves,
        `Turn the top to line up the ${slot} corner and edge, then do ${best.algorithm.name} to drop them into the slot together.`,
        best.algorithm.id,
      );
      continue;
    }
    // No slot can be finished yet: a piece is stuck in another slot. Take one out.
    const quarters = [0, 1, 2, 3].find((q) =>
      holdsAnotherSlotsPiece(applyMoves(w.cube, CUBE_TURNS[q])),
    );
    if (quarters === undefined) break;
    w.rotate(
      CUBE_TURNS[quarters],
      "Turn the whole cube so the slot holding another slot's piece is at the front right.",
      "The slot at the front right holds another slot's piece.",
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
  group: string,
  goal: (cube: Cube) => boolean,
  what: string,
): void {
  if (goal(w.cube)) return;
  const found = findCase(w.cube, inGroup(group), goal);
  if (!found) throw new Error(`Couldn't ${what}.`);
  w.step(
    'moves',
    found.moves,
    `${what[0].toUpperCase()}${what.slice(1)}: it's the ${found.algorithm.name} case, so turn the top to line it up and do its algorithm.`,
    found.algorithm.id,
  );
}

const lastLayerLinesUp = (cube: Cube) => TOP_TURNS.some((turn) => isSolved(applyMoves(cube, turn)));

function yellowTop(w: PlanWriter): void {
  w.startStage(3);
  lookAndDo(w, GROUPS.ollEdges, isYellowCross, 'make the yellow cross');
  lookAndDo(w, GROUPS.ollCorners, isYellowFace, 'make the whole top yellow');
}

function finishTop(w: PlanWriter): void {
  w.startStage(4);
  lookAndDo(w, GROUPS.pllCorners, topCornersMatchAfterTopTurn, 'put the corners in place');
  lookAndDo(w, GROUPS.pllEdges, lastLayerLinesUp, 'put the edges in place');
  const k = TOP_TURNS.findIndex((turn) => isSolved(applyMoves(w.cube, turn)));
  if (k < 0) throw new Error("The cube didn't finish solved.");
  w.step('moves', TOP_TURNS[k], 'Turn the top to line it up. Solved!');
}

/** Replay a CFOP plan and confirm each stage reaches its goal and the cube ends solved. */
export function cfopSelfCheck(plan: SolvePlan): string | null {
  return checkPlan(plan, STAGE_GOALS);
}

/** Work out a CFOP solve (cross, F2L, 2-look OLL, 2-look PLL) for this cube. */
export function solveCfop(start: Cube): SolveResult {
  const check = validateStickers(start.stickers);
  if (!check.ok) return { ok: false, error: check.problems.map((p) => p.message).join(' ') };
  try {
    const w = new PlanWriter(
      start,
      CFOP_STAGES.map((s) => s.title),
    );
    cross(w);
    firstTwoLayers(w);
    yellowTop(w);
    finishTop(w);
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
