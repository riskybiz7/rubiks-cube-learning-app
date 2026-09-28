import { describe, expect, it } from 'vitest';
import { BEGINNER_ALGORITHMS } from './beginner';
import { CFOP_ALGORITHMS } from './cfop';
import { findAlgorithm } from './algorithms';

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
