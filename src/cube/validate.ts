import { COLOR_NAMES, capitalize, colorList, listJoin, placeName } from './describe';
import { solved } from './geometry';
import { applyMoves } from './moves';
import { mustParse } from './notation';
import {
  CORNER_SLOTS,
  EDGE_SLOTS,
  cornerTwistTotal,
  edgeFlipTotal,
  permutationParity,
  readPieces,
  type PieceReading,
  type Pieces,
} from './pieces';
import { FACES, type Color, type Cube, type Face } from './types';

export type ProblemCode =
  | 'blank'
  | 'color-count'
  | 'duplicate-center'
  | 'center-opposites'
  | 'center-mirror'
  | 'impossible-edge'
  | 'impossible-corner'
  | 'mirrored-corner'
  | 'duplicate-piece'
  | 'corner-twist'
  | 'edge-flip'
  | 'parity';

/** One thing wrong with an entered cube: a plain-English message and the stickers to double-check. */
export interface Problem {
  code: ProblemCode;
  message: string;
  stickers: number[];
}

export type ValidationResult =
  { ok: true; cube: Cube; pieces: Pieces } | { ok: false; problems: Problem[] };

const ALL_COLORS: readonly Color[] = ['W', 'Y', 'G', 'B', 'R', 'O'];
const CENTER_STICKERS: readonly number[] = FACES.map((_, f) => f * 9 + 4);
const OPPOSITE_FACE: Record<Face, Face> = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' };
const OPPOSITE_COLORS: readonly [Color, Color][] = [
  ['W', 'Y'],
  ['R', 'O'],
  ['G', 'B'],
];

/**
 * Every way the six centers of a standard cube can look: the solved cube turned
 * into each of its 24 orientations (6 choices of top face × 4 of front face).
 */
export const REAL_CENTER_LAYOUTS: ReadonlySet<string> = (() => {
  const layouts = new Set<string>();
  for (const top of ['', 'x', 'x2', "x'", 'z', "z'"]) {
    for (const front of ['', 'y', 'y2', "y'"]) {
      const cube = applyMoves(solved(), mustParse(`${top} ${front}`));
      layouts.add(CENTER_STICKERS.map((i) => cube.stickers[i]).join(''));
    }
  }
  return layouts;
})();

/**
 * Check that 54 entered stickers make a real, solvable cube. Checks run in stages,
 * like tying out a model from the top down, and stop at the first stage with a
 * problem, because later checks only make sense once earlier ones pass.
 */
export function validateStickers(stickers: readonly (Color | null)[]): ValidationResult {
  if (stickers.length !== 54) throw new Error(`Expected 54 stickers, got ${stickers.length}`);

  // Stage 1: every sticker filled in.
  const blanks = stickers.flatMap((color, i) => (color === null ? [i] : []));
  if (blanks.length > 0) {
    const needs = blanks.length === 1 ? 'sticker still needs' : 'stickers still need';
    return fail([
      { code: 'blank', message: `${blanks.length} ${needs} a color.`, stickers: blanks },
    ]);
  }
  const cube: Cube = { stickers: stickers as Color[] };

  // Stage 2: nine stickers of each color.
  const countProblem = checkColorCounts(cube);
  if (countProblem) return fail([countProblem]);

  // Stage 3: centers are six different colors, laid out like a standard cube.
  const centerProblems = checkCenters(cube);
  if (centerProblems.length > 0) return fail(centerProblems);

  // Stage 4: every corner and edge is a piece that really exists.
  const reading = readPieces(cube);
  if (!reading.ok) return fail(describeImpossiblePieces(cube, reading));

  // Stage 5: each piece appears exactly once.
  const duplicateProblems = checkDuplicates(reading.pieces);
  if (duplicateProblems.length > 0) return fail(duplicateProblems);

  // Stage 6: the three hidden rules every solvable cube obeys.
  const ruleProblems = checkHiddenRules(reading.pieces);
  if (ruleProblems.length > 0) return fail(ruleProblems);

  return { ok: true, cube, pieces: reading.pieces };
}

function fail(problems: Problem[]): ValidationResult {
  return { ok: false, problems };
}

function checkColorCounts(cube: Cube): Problem | null {
  const counts = new Map<Color, number>(ALL_COLORS.map((c): [Color, number] => [c, 0]));
  for (const color of cube.stickers) counts.set(color, (counts.get(color) ?? 0) + 1);
  const countOf = (c: Color) => counts.get(c) ?? 0;
  const wrong = ALL_COLORS.filter((c) => countOf(c) !== 9);
  if (wrong.length === 0) return null;

  const over = wrong.filter((c) => countOf(c) > 9);
  const under = wrong.filter((c) => countOf(c) < 9);
  let message =
    'Each color should appear exactly 9 times, but there are ' +
    `${listJoin(wrong.map((c) => `${countOf(c)} ${COLOR_NAMES[c]}`))}.`;
  if (
    over.length === 1 &&
    under.length === 1 &&
    countOf(over[0]) === 10 &&
    countOf(under[0]) === 8
  ) {
    message += ` One ${COLOR_NAMES[under[0]]} sticker was probably entered as ${COLOR_NAMES[over[0]]}.`;
  }
  // Suspects: every sticker of a color that appears too often. A center only counts
  // when another center has the same color, because then one of those centers is wrong.
  const centerCount = (c: Color) => CENTER_STICKERS.filter((i) => cube.stickers[i] === c).length;
  const suspects = cube.stickers.flatMap((c, i) => {
    if (!over.includes(c)) return [];
    const isCenter = i % 9 === 4;
    return !isCenter || centerCount(c) > 1 ? [i] : [];
  });
  return { code: 'color-count', message, stickers: suspects };
}

function checkCenters(cube: Cube): Problem[] {
  const centers = CENTER_STICKERS.map((i) => cube.stickers[i]);

  const repeated = ALL_COLORS.filter((c) => centers.filter((x) => x === c).length > 1);
  if (repeated.length > 0) {
    return repeated.map((c): Problem => {
      const count = centers.filter((x) => x === c).length;
      const start =
        count === 2
          ? `Two centers are both ${COLOR_NAMES[c]}`
          : `${count} centers are ${COLOR_NAMES[c]}`;
      return {
        code: 'duplicate-center',
        message: `${start}. Each face has its own center color, so one of them was entered wrong.`,
        stickers: CENTER_STICKERS.filter((i) => cube.stickers[i] === c),
      };
    });
  }

  // From here on all six center colors are different, so each color names one face.
  const faceOf = (c: Color): Face => FACES[centers.indexOf(c)];
  const notOpposite = OPPOSITE_COLORS.filter(([a, b]) => OPPOSITE_FACE[faceOf(a)] !== faceOf(b));
  if (notOpposite.length > 0) {
    return notOpposite.map(([a, b]): Problem => ({
      code: 'center-opposites',
      message:
        `The ${COLOR_NAMES[a]} and ${COLOR_NAMES[b]} centers should be on opposite sides of the cube, ` +
        "but they're next to each other. Two center caps may have been swapped, or two centers were entered in the wrong places.",
      stickers: [a, b].map((c) => CENTER_STICKERS[centers.indexOf(c)]),
    }));
  }

  if (!REAL_CENTER_LAYOUTS.has(centers.join(''))) {
    return [
      {
        code: 'center-mirror',
        message:
          'The centers are a mirror image of a standard cube (with white on top and green facing you, ' +
          'red should be on the right). Two center caps may have been swapped, or two centers were entered in the wrong places.',
        stickers: [...CENTER_STICKERS],
      },
    ];
  }
  return [];
}

function describeImpossiblePieces(
  cube: Cube,
  reading: Extract<PieceReading, { ok: false }>,
): Problem[] {
  const colorName = (sticker: number) => COLOR_NAMES[cube.stickers[sticker]];
  const edgeProblems = reading.impossibleEdges.map((s): Problem => {
    const slot = EDGE_SLOTS[s];
    const [a, b] = slot.stickers.map(colorName);
    const shows = a === b ? `two ${a} stickers` : `${a} and ${b}`;
    return {
      code: 'impossible-edge',
      message: `The ${placeName(slot.faces)} edge shows ${shows}, a combination no real edge has. One of its stickers is probably wrong.`,
      stickers: [...slot.stickers],
    };
  });
  const cornerProblems = reading.impossibleCorners.map((s): Problem => {
    const slot = CORNER_SLOTS[s];
    return {
      code: 'impossible-corner',
      message: `The ${placeName(slot.faces)} corner shows ${listJoin(slot.stickers.map(colorName))}, a combination no real corner has. One of its stickers is probably wrong.`,
      stickers: [...slot.stickers],
    };
  });
  const mirrorProblems = reading.mirroredCorners.map((s): Problem => {
    const slot = CORNER_SLOTS[s];
    return {
      code: 'mirrored-corner',
      message: `The ${placeName(slot.faces)} corner has the right colors in the wrong order, so two of its stickers are probably swapped.`,
      stickers: [...slot.stickers],
    };
  });
  return [...edgeProblems, ...cornerProblems, ...mirrorProblems];
}

function checkDuplicates(pieces: Pieces): Problem[] {
  const colorsOf = (faces: readonly Face[]) =>
    colorList(faces.map((f) => pieces.centers[FACES.indexOf(f)]));
  const groups: {
    kind: string;
    slots: readonly { faces: readonly Face[]; stickers: readonly number[] }[];
    found: number[];
  }[] = [
    { kind: 'corner', slots: CORNER_SLOTS, found: pieces.corners.map((c) => c.piece) },
    { kind: 'edge', slots: EDGE_SLOTS, found: pieces.edges.map((e) => e.piece) },
  ];

  const problems: Problem[] = [];
  for (const { kind, slots, found } of groups) {
    const allPieces = slots.map((_, p) => p);
    const repeated = allPieces.filter((p) => found.filter((x) => x === p).length > 1);
    if (repeated.length === 0) continue;
    const missing = allPieces.filter((p) => !found.includes(p));
    const names = (list: number[]) =>
      listJoin(list.map((p) => `the ${colorsOf(slots[p].faces)} ${kind}`));
    problems.push({
      code: 'duplicate-piece',
      message:
        `${capitalize(names(repeated))} ${repeated.length === 1 ? 'appears' : 'appear'} more than once, ` +
        `and ${names(missing)} ${missing.length === 1 ? 'is' : 'are'} missing. ` +
        'A sticker on one of the repeated pieces is probably wrong.',
      stickers: found.flatMap((p, s) => (repeated.includes(p) ? [...slots[s].stickers] : [])),
    });
  }
  return problems;
}

function checkHiddenRules(pieces: Pieces): Problem[] {
  const problems: Problem[] = [];
  if (cornerTwistTotal(pieces) !== 0) {
    problems.push({
      code: 'corner-twist',
      message:
        'A corner is twisted in place. A real cube can never get this way just by turning, so either a corner ' +
        'sticker was entered wrong, or a corner was twisted or popped out and put back. Compare the corner stickers with your cube.',
      stickers: [],
    });
  }
  if (edgeFlipTotal(pieces) !== 0) {
    problems.push({
      code: 'edge-flip',
      message:
        "An edge is flipped in place. A real cube can never get this way just by turning, so either an edge's two " +
        'stickers were entered the wrong way round, or an edge was popped out and put back flipped. Compare the edge stickers with your cube.',
      stickers: [],
    });
  }
  const cornerOrder = pieces.corners.map((c) => c.piece);
  const edgeOrder = pieces.edges.map((e) => e.piece);
  if (permutationParity(cornerOrder) !== permutationParity(edgeOrder)) {
    problems.push({
      code: 'parity',
      message:
        'Two pieces appear to be swapped. A real cube can never get this way just by turning, so either stickers were ' +
        'entered in the wrong places, or the cube was taken apart and put back together differently.',
      stickers: [],
    });
  }
  return problems;
}
