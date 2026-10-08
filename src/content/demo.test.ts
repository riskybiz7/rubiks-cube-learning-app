import { describe, expect, it } from 'vitest';
import { CFOP_STAGES } from './cfop';
import { demoPlan, demoStage } from './demo';

describe('Learn screen examples', () => {
  it('beginner: real moves to watch in every stage except the "look" stages', () => {
    demoPlan('beginner').stages.forEach((stage, i) => {
      if (stage.number === 5 || stage.number === 7) return;
      expect(demoStage(i, 'beginner').moves.length, `stage ${stage.number}`).toBeGreaterThan(0);
    });
  });

  it('CFOP: its own four stages, with real moves to watch in every one', () => {
    expect(demoPlan('cfop').stages.map((s) => s.title)).toEqual(CFOP_STAGES.map((s) => s.title));
    demoPlan('cfop').stages.forEach((stage, i) => {
      expect(demoStage(i, 'cfop').moves.length, `stage ${stage.number}`).toBeGreaterThan(0);
    });
  });
});
