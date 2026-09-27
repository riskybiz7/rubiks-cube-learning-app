import { describe, expect, it } from 'vitest';
import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { mustParse } from '../cube/notation';
import type { Cube } from '../cube/types';
import {
  areYellowCornersPlaced,
  areYellowEdgesSolved,
  isDaisy,
  isFirstLayer,
  isFirstTwoLayers,
  isFlippedTwoLayers,
  isWhiteCross,
  isYellowCross,
} from './checks';

const apply = (cube: Cube, text: string) => applyMoves(cube, mustParse(text));

describe('stage goals', () => {
  it('sees a solved cube held white-up as done through stage 4', () => {
    const cube = solved();
    expect([isWhiteCross(cube), isFirstLayer(cube), isFirstTwoLayers(cube)]).toEqual([
      true,
      true,
      true,
    ]);
    expect(isDaisy(cube)).toBe(false);
  });

  it('sees a solved cube held yellow-up as done for stages 5 to 9', () => {
    const cube = apply(solved(), 'z2');
    expect([
      isFlippedTwoLayers(cube),
      isYellowCross(cube),
      areYellowEdgesSolved(cube),
      areYellowCornersPlaced(cube),
    ]).toEqual([true, true, true, true]);
  });

  it('knows a turned top layer still has the yellow cross but not matching edges', () => {
    const cube = apply(solved(), 'z2 U');
    expect(isYellowCross(cube)).toBe(true);
    expect(areYellowEdgesSolved(cube)).toBe(false);
    expect(areYellowCornersPlaced(cube)).toBe(false);
  });

  it('recognizes a daisy: white edges around the yellow center', () => {
    // Yellow up, then lift the four white-cross edges from the bottom to the top.
    expect(isDaisy(apply(solved(), 'z2 F2 R2 B2 L2'))).toBe(true);
    expect(isDaisy(apply(solved(), 'z2 F2 R2 B2'))).toBe(false);
  });

  it('notices when a turn breaks the first layer', () => {
    expect(isFirstLayer(apply(solved(), 'R'))).toBe(false);
    expect(isFlippedTwoLayers(apply(solved(), 'z2 R'))).toBe(false);
  });
});
