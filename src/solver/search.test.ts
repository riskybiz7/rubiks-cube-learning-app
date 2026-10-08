import { describe, expect, it } from 'vitest';
import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { formatAlgorithm, mustParse } from '../cube/notation';
import type { Cube } from '../cube/types';
import { searchMoves } from './search';

const isHome = (c: Cube) => c.stickers.join('') === solved().stickers.join('');

describe('searchMoves', () => {
  it('returns no moves when the goal is already met', () => {
    expect(searchMoves(solved(), isHome, 3)).toEqual([]);
  });

  it('finds the shortest undo', () => {
    const moves = searchMoves(applyMoves(solved(), mustParse('R U')), isHome, 3);
    expect(moves && formatAlgorithm(moves)).toBe("U' R'");
  });

  it('gives up beyond the depth limit', () => {
    expect(searchMoves(applyMoves(solved(), mustParse('R U F')), isHome, 2)).toBeNull();
  });
});
