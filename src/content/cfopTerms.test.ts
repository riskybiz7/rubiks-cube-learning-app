import { describe, expect, it } from 'vitest';
import { BEGINNER_ALGORITHMS } from './beginner';
import { GROUPS, inGroup, inSet, type CfopSet } from './cfop';
import { CFOP_TERMS, SET_DESCRIPTIONS, TWO_LOOK_VS_FULL } from './cfopTerms';

/** Every explanation the user reads, joined up. */
const allText = [
  ...CFOP_TERMS.flatMap((t) => [t.term, t.standsFor, t.meaning]),
  ...Object.values(TWO_LOOK_VS_FULL),
  ...Object.values(SET_DESCRIPTIONS),
].join(' ');

describe('CFOP explanations', () => {
  it('the case counts quoted match the library', () => {
    expect(allText).toContain('41 cases');
    expect(inSet('F2L')).toHaveLength(41);
    expect(inSet('OLL')).toHaveLength(57);
    expect(inSet('PLL')).toHaveLength(21);
    expect(inGroup(GROUPS.ollEdges)).toHaveLength(3);
    expect(inGroup(GROUPS.ollCorners)).toHaveLength(7);
    expect(inGroup(GROUPS.pllCorners)).toHaveLength(2);
    expect(inGroup(GROUPS.pllEdges)).toHaveLength(4);
    expect(inSet('OLL-2LOOK').length + inSet('PLL-2LOOK').length).toBe(16);
    expect(inSet('OLL').length + inSet('PLL').length).toBe(78);
  });

  it('"you already know two of them" is true: same moves as the beginner algorithms', () => {
    const moves = (id: string) => inSet('OLL-2LOOK').find((a) => a.id === id)!.moves;
    expect(BEGINNER_ALGORITHMS.yellowCross.moves).toBe(moves('oll-line'));
    expect(BEGINNER_ALGORITHMS.yellowEdges.moves).toBe(moves('oll-sune'));
  });

  it('every set on the Algorithms screen has a description', () => {
    const sets: CfopSet[] = ['F2L', 'OLL', 'PLL', 'OLL-2LOOK', 'PLL-2LOOK'];
    for (const set of sets) expect(SET_DESCRIPTIONS[set].length, set).toBeGreaterThan(20);
  });

  it('says "squares", never "stickers"', () => {
    expect(allText.toLowerCase()).not.toContain('sticker');
  });
});
