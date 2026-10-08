import { describe, expect, it } from 'vitest';
import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { listSteps } from '../solver/plan';
import { randomMoves, seededRandom } from '../test-utils/random';
import { CFOP_STAGES, TWO_LOOK, cfopStageTitles } from './cfop';
import { demoLesson, demoPlan } from './demo';
import { solveWith } from './methods';

describe('Learn screen examples', () => {
  it('beginner: real moves to watch in every stage except the "look" stages', () => {
    demoPlan('beginner').stages.forEach((stage, i) => {
      if (stage.number === 5 || stage.number === 7) return;
      expect(demoLesson(i, 'beginner').moves.length, `stage ${stage.number}`).toBeGreaterThan(0);
    });
  });

  it('CFOP: the 2-look demo has the four 2-look stage titles', () => {
    expect(demoPlan('cfop').stages.map((s) => s.title)).toEqual(cfopStageTitles(TWO_LOOK));
  });

  it('CFOP: every lesson has real moves to watch', () => {
    CFOP_STAGES.forEach((lesson, i) => {
      expect(demoLesson(i, 'cfop').moves.length, lesson.title).toBeGreaterThan(0);
    });
  });

  it('CFOP: the full OLL and PLL examples use one algorithm each', () => {
    const ids = (i: number) =>
      demoLesson(i, 'cfop').steps.flatMap((s) => (s.step.algorithmId ? [s.step.algorithmId] : []));
    expect(ids(4)).toHaveLength(1);
    expect(ids(5)).toHaveLength(1);
  });
});

describe('Learn examples on your own cube', () => {
  const mine = applyMoves(solved(), randomMoves(25, seededRandom(7)));

  it('each lesson starts where the solve of your cube reaches that stage', () => {
    for (const method of ['beginner', 'cfop'] as const) {
      const result = solveWith(method, mine);
      if (!result.ok) throw new Error(result.error);
      const steps = listSteps(result.plan);
      expect(demoLesson(0, method, mine).start, method).toEqual(mine);
      for (let lesson = 0; lesson < 4; lesson++) {
        const first = steps.find((s) => s.stageIndex === lesson)!;
        expect(demoLesson(lesson, method, mine).start, `${method} ${lesson}`).toEqual(first.start);
      }
    }
  });

  it('the full OLL and PLL lessons use the full solve of your cube', () => {
    const result = solveWith('cfop', mine, { oll: 'full', pll: 'full' });
    if (!result.ok) throw new Error(result.error);
    const steps = listSteps(result.plan);
    const stage4 = steps.find((s) => s.stageIndex === 3)!;
    expect(demoLesson(5, 'cfop', mine).start).toEqual(stage4.start);
  });

  it('without your cube, the standard example is unchanged', () => {
    expect(demoLesson(2, 'cfop', null)).toEqual(demoLesson(2, 'cfop'));
  });
});
