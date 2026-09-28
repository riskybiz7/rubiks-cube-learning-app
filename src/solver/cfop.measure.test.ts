import { describe, it } from 'vitest';
import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { randomScramble } from '../cube/scramble';
import { seededRandom } from '../test-utils/random';
import { centerColor } from './checks';
import { solveCfop } from './cfop';
import { crossMoves } from './cross';
import { listSteps, reorientTo } from './plan';

/**
 * The CFOP figures quoted in docs/phase-3b-review-notes.md, kept so they can be re-run.
 * Skipped in normal test runs. To run it (PowerShell):
 *   $env:VITE_MEASURE = '1'; npx vitest run src/solver/cfop.measure.test.ts --silent=false
 * Fixed seed (99) and 1,000 scrambles of 25 random face turns, so the counts repeat
 * exactly. Timing depends on the computer.
 */

const ROTATIONS = new Set(['x', 'y', 'z']);
const spread = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return `min ${sorted[0]}, median ${median}, max ${sorted[sorted.length - 1]}`;
};

describe.skipIf(!import.meta.env.VITE_MEASURE)('CFOP measurements', () => {
  it('1,000 solves (seed 99)', () => {
    const random = seededRandom(99);
    const scrambles = Array.from({ length: 1000 }, () => randomScramble(25, random));
    const cross: number[] = [];
    const wholeCross: number[] = [];
    const turns: number[] = [];
    const steps: number[] = [];
    let crossWithB = 0;
    let solvesWithPullOut = 0;
    let mostPullOutsInARow = 0;

    const started = performance.now();
    const plans = scrambles.map((scramble) => {
      const result = solveCfop(applyMoves(solved(), scramble));
      if (!result.ok) throw new Error(result.error);
      return result.plan;
    });
    const msPerSolve = (performance.now() - started) / plans.length;

    for (const plan of plans) {
      const all = listSteps(plan);
      const layerTurns = (stage?: number) =>
        all
          .filter((s) => stage === undefined || s.stage.number === stage)
          .flatMap((s) => s.step.moves)
          .filter((m) => !ROTATIONS.has(m.base));
      const crossTurns = layerTurns(1);
      cross.push(crossTurns.length);
      if (crossTurns.some((m) => m.base === 'B')) crossWithB++;
      turns.push(layerTurns().length);
      steps.push(all.length);
      let inARow = 0;
      let any = false;
      for (const { step } of all) {
        if (step.text.startsWith('Take its pieces out')) {
          inARow++;
          any = true;
        }
        if (step.algorithmId) inARow = 0;
        mostPullOutsInARow = Math.max(mostPullOutsInARow, inARow);
      }
      if (any) solvesWithPullOut++;
    }
    for (const scramble of scrambles) {
      const cube = applyMoves(solved(), scramble);
      const held = applyMoves(cube, reorientTo(cube, 'Y', 'G'));
      const sides = (['F', 'R', 'B', 'L'] as const).map((f) => centerColor(held, f));
      wholeCross.push(crossMoves(held, sides)!.length);
    }

    console.log(
      [
        `Cross, one edge at a time (layer turns): ${spread(cross)}; crosses using B: ${crossWithB}`,
        `Shortest whole cross, same scrambles: ${spread(wholeCross)}`,
        `Layer turns for the whole solve: ${spread(turns)}`,
        `Steps on the Solve screen: ${spread(steps)}`,
        `Solves needing a pull-out: ${solvesWithPullOut}; most pull-outs in a row: ${mostPullOutsInARow}`,
        `Average ms per solve (includes building the cross tables once): ${msPerSolve.toFixed(1)}`,
      ].join('\n'),
    );
  }, 600_000);
});
