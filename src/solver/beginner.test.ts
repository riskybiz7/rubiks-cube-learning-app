import { describe, expect, it } from 'vitest';
import { BEGINNER_STAGES } from '../content/beginner';
import { placeName } from '../cube/describe';
import { solved } from '../cube/geometry';
import { applyMoves, isSolved } from '../cube/moves';
import { formatAlgorithm, mustParse } from '../cube/notation';
import type { Cube } from '../cube/types';
import { randomMoves, seededRandom } from '../test-utils/random';
import { centerColor, isCornerInPlace, isSlotSolved, TOP_CORNERS, TOP_EDGES } from './checks';
import { listSteps, selfCheck, solveBeginner, type SolvePlan } from './beginner';
import { CROSS_ALREADY_MADE } from './beginner';
import { ALREADY_SOLVED } from './plan';

function mustSolve(cube: Cube): SolvePlan {
  const result = solveBeginner(cube);
  if (!result.ok) throw new Error(result.error);
  return result.plan;
}

const scrambles = (() => {
  const random = seededRandom(21);
  return Array.from({ length: 300 }, () => applyMoves(solved(), randomMoves(25, random)));
})();
const plans = scrambles.map(mustSolve);

/** The cube just before each step, for every plan, with the step's stage number. */
const everyStep = plans.flatMap((plan) => listSteps(plan));

describe('solveBeginner', () => {
  it('solves 300 random scrambles, every stage reaching its goal', () => {
    for (const plan of plans) {
      expect(plan.stages.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(selfCheck(plan)).toBeNull();
    }
  });

  it('starts by turning the cube so yellow is on top and green faces you, whatever the hold', () => {
    const fromReference = mustSolve(applyMoves(solved(), mustParse('R U F')));
    expect(formatAlgorithm(fromReference.stages[0].steps[0].moves)).toBe('z2');
    for (const hold of ['y', 'x', "z'", 'x2 y']) {
      const plan = mustSolve(applyMoves(solved(), mustParse(`R U F ${hold}`)));
      const afterFirst = applyMoves(plan.start, plan.stages[0].steps[0].moves);
      expect([centerColor(afterFirst, 'U'), centerColor(afterFirst, 'F')]).toEqual(['Y', 'G']);
    }
  });

  it('handles an already-solved cube', () => {
    const plan = mustSolve(solved());
    expect(selfCheck(plan)).toBeNull();
  });

  it('refuses a cube that cannot be solved, with the validation message', () => {
    const stickers = [...solved().stickers];
    [stickers[7], stickers[19]] = [stickers[19], stickers[7]]; // one edge flipped in place
    const result = solveBeginner({ stickers });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('edge is flipped');
  });

  it("stage 6 holds match the owner's procedure (line left-right; reverse L back-left)", () => {
    for (const { stage, step, start } of everyStep) {
      if (stage.number !== 6 || step.algorithmId !== 'yellow-cross') continue;
      const yellow = [1, 3, 5, 7].filter((square) => start.stickers[square] === 'Y');
      const times = step.moves.length / 6;
      if (times === 2) expect(yellow).toEqual([1, 3]); // back and left: the reverse L of photo 5.0
      if (times === 1 && yellow.length === 2) expect(yellow).toEqual([3, 5]); // a left-right line
    }
  });

  it('stage 8 and 9 always use one hold, and the lesson says which', () => {
    const edgeHolds = new Set<string>();
    const cornerHolds = new Set<string>();
    for (const { stage, step, start } of everyStep) {
      if (stage.number === 8 && step.algorithmId === 'yellow-edges') {
        const matched = TOP_EDGES.filter((slot) => isSlotSolved(start, slot));
        const opposite =
          matched.length === 2 &&
          Math.abs(TOP_EDGES.indexOf(matched[0]) - TOP_EDGES.indexOf(matched[1])) === 2;
        if (matched.length === 2 && !opposite) {
          edgeHolds.add(matched.map((s) => placeName([s.faces[1]])).join(' and '));
        }
      }
      if (stage.number === 9 && step.algorithmId === 'corner-cycle') {
        const placed = TOP_CORNERS.filter((slot) => isCornerInPlace(start, slot));
        if (placed.length === 1) cornerHolds.add(placeName(placed[0].faces));
      }
    }
    expect([...edgeHolds]).toHaveLength(1);
    expect([...cornerHolds]).toEqual(['top-front-right']);
    const [edgeHold] = [...edgeHolds]; // e.g. "right and back"
    const words = edgeHold.split(' and ');
    for (const word of words) expect(BEGINNER_STAGES[7].howTo).toContain(word);
    expect(BEGINNER_STAGES[8].howTo).toContain('front right');
  });

  it('listSteps gives each step the cube it starts from', () => {
    for (const plan of plans.slice(0, 30)) {
      const steps = listSteps(plan);
      let cube = plan.start;
      for (const s of steps) {
        expect(s.start).toEqual(cube);
        cube = applyMoves(cube, s.step.moves);
      }
      expect(isSolved(cube)).toBe(true);
    }
  });

  it('never shows the word "sticker" in a step', () => {
    for (const { step } of everyStep) expect(step.text).not.toMatch(/sticker/i);
  });
});

describe('solveBeginner: every step says what to do', () => {
  it('gives every stage at least one step, even when it is already done', () => {
    for (const plan of plans) {
      for (const stage of plan.stages)
        expect(stage.steps.length, `stage ${stage.number}`).toBeGreaterThan(0);
    }
  });

  it('always explains the case, even when the cube needs no whole-cube turn', () => {
    for (const plan of plans) {
      const texts = (n: number) => plan.stages[n - 1].steps.map((s) => s.text);
      // Stage 3: every corner put in is named first.
      const named = texts(3).filter((t) => t.includes('home of the white-')).length;
      const inserted = texts(3).filter((t) =>
        t.startsWith("Repeat R' D' R D until the corner"),
      ).length;
      expect(named, 'stage 3').toBe(inserted);
      // Stage 6: the pattern is named before the algorithm is done once or twice from a hold.
      const held = texts(6).filter((t) => t.includes('Line:') || t.includes('Reverse L:')).length;
      const done = texts(6).filter(
        (t) => t === "Do F R U R' U' F' once." || t === "Do F R U R' U' F' twice in a row.",
      ).length;
      expect(held, 'stage 6').toBe(done);
      // Stage 8: the side-by-side hold is explained before the swap.
      const sideBySide = texts(8).filter((t) => t.includes('side by side')).length;
      const swaps = texts(8).filter((t) => t === "Do R U R' U R U2 R'.").length;
      expect(sideBySide, 'stage 8').toBe(swaps);
      // Stage 9: the corner already in its spot is pointed out before the algorithm.
      const pointed = texts(9).filter((t) => t.includes('already in its spot')).length;
      const cycles = texts(9).filter((t) => t.startsWith("Do U R U' L' U R' U' L")).length;
      expect(pointed, 'stage 9').toBe(cycles);
    }
  });
});

describe('solveBeginner: no back-face turns for a beginner', () => {
  it('never turns the back face; the cube is turned so that side faces you (owner: "U F", not "U B")', () => {
    const turnedToFront = { daisy: 0, cross: 0 };
    for (const plan of plans) {
      for (const stage of plan.stages) {
        stage.steps.forEach((step, i) => {
          const where = `stage ${stage.number}: ${formatAlgorithm(step.moves)}`;
          expect(
            step.moves.some((m) => m.base === 'B'),
            where,
          ).toBe(false);
          const previous = i > 0 ? stage.steps[i - 1] : null;
          if (previous?.kind !== 'rotate' || !previous.text.includes('center faces you')) return;
          if (stage.number === 1) turnedToFront.daisy++;
          if (stage.number === 2) {
            turnedToFront.cross++;
            expect(step.text, where).toContain('turn the front face twice');
          }
        });
      }
    }
    // Both situations really come up in these scrambles.
    expect(turnedToFront.daisy).toBeGreaterThan(0);
    expect(turnedToFront.cross).toBeGreaterThan(0);
  });

  it('never tells a beginner to turn the back face in words either', () => {
    for (const { step } of everyStep) expect(step.text).not.toContain('back face');
  });
});

describe('solveBeginner: white cross the way the owner does it', () => {
  it('sends every petal down from the front: that center faces you first (owner: "every petal\'s center faces you")', () => {
    for (const plan of plans) {
      const cross = plan.stages[1].steps;
      const petals = cross.filter((s) => s.kind === 'moves');
      expect(petals).toHaveLength(4);
      cross.forEach((step, i) => {
        if (step.kind !== 'moves') return;
        const where = formatAlgorithm(step.moves);
        // Only top and front turns, ending with the front turned twice.
        expect(
          step.moves.every((m) => m.base === 'U' || m.base === 'F'),
          where,
        ).toBe(true);
        expect(step.moves[step.moves.length - 1], where).toEqual({ base: 'F', turns: 2 });
        expect(step.text, where).toContain('turn the front face twice');
        // The step before says which center faces you (turned there, or already there).
        expect(i > 0 && cross[i - 1].text.includes('faces you'), where).toBe(true);
      });
    }
  });
});

describe('solveBeginner: skips work that is already done (owner, 2026-10-08)', () => {
  const HOLDS = ['', 'y', 'x2', "z'", 'x2 y', 'x'];
  const layerMoves = (plan: SolvePlan, stage?: number) =>
    plan.stages
      .filter((s) => stage === undefined || s.number === stage)
      .flatMap((s) => s.steps.flatMap((step) => step.moves));

  it('a solved cube, held any way: no moves at all, and it says so', () => {
    for (const hold of HOLDS) {
      const plan = mustSolve(applyMoves(solved(), mustParse(hold)));
      expect(layerMoves(plan), hold).toEqual([]);
      expect(plan.stages[0].steps).toEqual([{ kind: 'check', moves: [], text: ALREADY_SOLVED }]);
      expect(selfCheck(plan)).toBeNull();
    }
  });

  it('a white cross already made: no daisy, and the cross stage only turns the cube', () => {
    // Corner and middle-layer moves that leave the white cross (on top) in place.
    const crossKept = "R' D' R D L D L' D' F' D2 F D2 B D B' D";
    for (const hold of HOLDS) {
      const start = applyMoves(solved(), mustParse(`${crossKept} ${hold}`));
      expect(isSolved(start)).toBe(false);
      const plan = mustSolve(start);
      expect(layerMoves(plan, 1), hold).toEqual([]);
      expect(plan.stages[0].steps[0].text).toBe(CROSS_ALREADY_MADE);
      const crossTurns = layerMoves(plan, 2).filter((m) => !'xyz'.includes(m.base));
      expect(crossTurns, hold).toEqual([]);
      expect(selfCheck(plan)).toBeNull();
    }
  });
});
