import { describe, expect, it } from 'vitest';
import { CFOP_STAGES, TWO_LOOK, cfopStageTitles } from './cfop';
import { demoLesson, demoPlan } from './demo';

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
