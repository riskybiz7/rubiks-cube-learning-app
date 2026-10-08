import { describe, expect, it } from 'vitest';
import { BEGINNER_ALGORITHMS } from './beginner';
import { CFOP_ALGORITHMS } from './cfop';
import { applyMoves, isSolved } from '../cube/moves';
import { mustParse } from '../cube/notation';
import { centerColor } from '../solver/checks';
import { BEGINNER_CARDS, caseStart, findAlgorithm } from './algorithms';

describe('findAlgorithm', () => {
  it('finds every beginner and CFOP algorithm by id, and ids never clash', () => {
    const ids = [...Object.values(BEGINNER_ALGORITHMS), ...CFOP_ALGORITHMS].map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(findAlgorithm(id).id).toBe(id);
  });

  it('says clearly when an id is unknown', () => {
    expect(() => findAlgorithm('nope')).toThrow('Unknown algorithm: nope');
  });
});

describe('caseStart: the cube a card starts from', () => {
  it('every algorithm solves the case it is shown with', () => {
    for (const a of [...Object.values(BEGINNER_ALGORITHMS), ...CFOP_ALGORITHMS]) {
      expect(isSolved(applyMoves(caseStart(a.id), mustParse(a.moves))), a.id).toBe(true);
    }
  });

  it('beginner cards are held the way their stage is done', () => {
    for (const a of Object.values(BEGINNER_ALGORITHMS)) {
      const top = centerColor(caseStart(a.id), 'U');
      expect(top, a.id).toBe(a.stage <= 4 ? 'W' : 'Y'); // stages 2-4 white up, 5-10 yellow up
      expect(centerColor(caseStart(a.id), 'F'), a.id).toBe('G');
    }
  });

  it('beginner cards are listed in stage order', () => {
    expect(BEGINNER_CARDS.map((a) => a.stage)).toEqual(
      [...BEGINNER_CARDS.map((a) => a.stage)].sort((a, b) => a - b),
    );
    expect(BEGINNER_CARDS).toHaveLength(Object.values(BEGINNER_ALGORITHMS).length);
  });
});
