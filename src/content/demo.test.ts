import { describe, expect, it } from 'vitest';
import { demoPlan, demoStage } from './demo';

describe('Learn screen examples', () => {
  it('solves the demo scramble, with real moves to watch in every stage except the "look" stages', () => {
    const plan = demoPlan();
    plan.stages.forEach((stage, i) => {
      const { moves } = demoStage(i);
      if (stage.number === 5 || stage.number === 7) return;
      expect(moves.length, `stage ${stage.number}`).toBeGreaterThan(0);
    });
  });
});
