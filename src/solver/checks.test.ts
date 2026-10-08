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
  F2L_PAIRS,
  isCfopCross,
  isPairSolved,
  isYellowFace,
  topCornersMatchAfterTopTurn,
} from './checks';

const CFOP_HOME = applyMoves(solved(), mustParse('z2')); // yellow on top, green facing you

describe('CFOP goals', () => {
  it('the cross is the four white edges on the bottom, with yellow on top', () => {
    expect(isCfopCross(CFOP_HOME)).toBe(true);
    expect(isCfopCross(applyMoves(CFOP_HOME, mustParse('R')))).toBe(false);
    expect(isCfopCross(solved())).toBe(false); // white on top: not the CFOP hold
  });

  it('pairs are the bottom corner and the middle edge of each slot', () => {
    expect(F2L_PAIRS.map(([corner, edge]) => `${corner.name}+${edge.name}`)).toEqual([
      'DFR+FR',
      'DLF+FL',
      'DBL+BL',
      'DRB+BR',
    ]);
    const afterR = applyMoves(CFOP_HOME, mustParse('R'));
    expect(isPairSolved(afterR, F2L_PAIRS[0])).toBe(false);
    expect(isPairSolved(afterR, F2L_PAIRS[1])).toBe(true);
  });

  it('the yellow face is the whole top yellow, with the first two layers done', () => {
    expect(isYellowFace(CFOP_HOME)).toBe(true);
    expect(isYellowFace(applyMoves(CFOP_HOME, mustParse("R U R' U R U2 R'")))).toBe(false);
  });

  it('top corners "match after a top turn" when one turn of the top would line them all up', () => {
    expect(topCornersMatchAfterTopTurn(applyMoves(CFOP_HOME, mustParse('U')))).toBe(true);
    const tPerm = mustParse("R U R' U' R' F R2 U' R' U' R U R' F'");
    expect(topCornersMatchAfterTopTurn(applyMoves(CFOP_HOME, tPerm))).toBe(false);
  });
});

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
