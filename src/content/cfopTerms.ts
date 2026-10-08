import type { CfopSet } from './cfop';

/**
 * Plain-English explanations of the CFOP names, for someone who knows the beginner method
 * but has never studied CFOP. Shown on the Algorithms and Solve screens. The claims that
 * tie CFOP to the beginner method (shared algorithms, counts) are checked in
 * cfopTerms.test.ts.
 */

export interface Term {
  term: string;
  standsFor: string;
  meaning: string;
}

export const CFOP_TERMS: readonly Term[] = [
  {
    term: 'CFOP',
    standsFor: 'Cross, F2L, OLL, PLL',
    meaning:
      'The method most fast solvers use, named after its four steps. It starts like your beginner method (a white cross, then the first two layers), but each step does more at once, so a solve takes fewer moves.',
  },
  {
    term: 'F2L',
    standsFor: 'First Two Layers',
    meaning:
      'Finish the bottom two layers by pairing each white corner with the middle edge that sits above it, then putting the pair in together. The beginner method does the corners (stage 3) and the middle edges (stage 4) separately; F2L does both at once. 41 cases.',
  },
  {
    term: 'OLL',
    standsFor: 'Orient the Last Layer',
    meaning:
      '"Orient" means turn each piece the right way up: make the whole top face yellow. The top pieces don\'t have to be in their right places yet, just yellow side up. Like beginner stages 6 (yellow cross) and 10 (twist the corners) together.',
  },
  {
    term: 'PLL',
    standsFor: 'Permute the Last Layer',
    meaning:
      '"Permute" means rearrange: move the top pieces to their right places without spoiling the yellow top. This finishes the cube. Like beginner stages 8 (yellow edges) and 9 (place the corners) together.',
  },
];

export const TWO_LOOK_VS_FULL = {
  twoLook:
    '2-look: do OLL in two smaller steps (first a yellow cross, 3 cases; then the yellow corners, 7 cases) and PLL in two steps too (first the corners, 2 cases; then the edges, 4 cases). 16 algorithms in all, and you already know two of them: the beginner yellow-cross algorithm is the 2-look "Line", and the beginner yellow-edges algorithm is "Sune".',
  full: 'Full (also called 1-look): recognize the whole top at once and do one algorithm for OLL (57 cases) and one for PLL (21 cases): 78 algorithms. Faster, but much more to learn. On 1,000 test scrambles in this app, the median solve took 69 turns with full instead of 84 with 2-look.',
  advice:
    "New to CFOP? Leave both on 2-look. Most people learn the full algorithms a few at a time, once the cross and F2L feel comfortable, and keep using 2-look for the cases they don't know yet.",
};

/** One line under each set button on the Algorithms screen. */
export const SET_DESCRIPTIONS: Record<CfopSet, string> = {
  F2L: 'First Two Layers: each corner-and-edge pair goes in together. 41 cases.',
  OLL: 'Orient the Last Layer in one look: make the whole top yellow with one algorithm. 57 cases.',
  PLL: 'Permute the Last Layer in one look: put the top pieces in place with one algorithm. 21 cases.',
  'OLL-2LOOK':
    '2-look OLL: make the top yellow in two steps (3 cross cases, then 7 corner cases). 10 algorithms. Start here.',
  'PLL-2LOOK':
    '2-look PLL: finish the top in two steps (2 corner cases, then 4 edge cases). 6 algorithms. Start here.',
};
