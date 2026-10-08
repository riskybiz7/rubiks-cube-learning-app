import { describe, expect, it } from 'vitest';
import { seededRandom } from '../test-utils/random';
import { randomScramble } from './scramble';

describe('randomScramble', () => {
  it('makes 25 face turns, never the same face twice in a row', () => {
    const moves = randomScramble(25, seededRandom(5));
    expect(moves).toHaveLength(25);
    expect(moves.every((m) => 'URFDLB'.includes(m.base))).toBe(true);
    moves.slice(1).forEach((m, i) => expect(m.base).not.toBe(moves[i].base));
  });
});
