import { describe, expect, it } from 'vitest';
import { solved } from './geometry';
import { applyMove, applyMoves, isSolved, movePermutation } from './moves';
import { MOVE_BASES, invertMoves, mustParse, type Turns } from './notation';
import { FACES, type Cube, type Face } from './types';

const apply = (cube: Cube, algorithm: string): Cube => applyMoves(cube, mustParse(algorithm));

/** One face's 9 stickers as a string, row by row, e.g. 'WWGWWGWWG'. */
function faceString(cube: Cube, face: Face): string {
  const f = FACES.indexOf(face);
  return cube.stickers.slice(f * 9, f * 9 + 9).join('');
}

const ALL_TURNS: Turns[] = [1, 2, 3];
const SCRAMBLED = apply(solved(), "R U2 F' L D B2 M E' S r' u f2 x y' z2 l d' b");

describe('every move', () => {
  it('rearranges the 54 stickers without losing or copying any', () => {
    for (const base of MOVE_BASES) {
      for (const turns of ALL_TURNS) {
        const sorted = [...movePermutation({ base, turns })].sort((a, b) => a - b);
        expect(sorted, `${base} turns=${turns}`).toEqual([...Array(54).keys()]);
      }
    }
  });

  it('returns to the start after four quarter turns', () => {
    for (const base of MOVE_BASES) {
      let cube = SCRAMBLED;
      for (let i = 0; i < 4; i++) cube = applyMove(cube, { base, turns: 1 });
      expect(cube, base).toEqual(SCRAMBLED);
    }
  });

  it('is undone by its inverse', () => {
    const algorithm = mustParse("R U2 F' L D B2 M E' S r' u f2 x y' z2 l d' b");
    expect(applyMoves(SCRAMBLED, [...algorithm, ...invertMoves(algorithm)])).toEqual(SCRAMBLED);
  });
});

describe('known effects on a solved cube (white up, green front, red right)', () => {
  it('R lifts the front column onto the top, top to back, back to bottom, bottom to front', () => {
    const cube = apply(solved(), 'R');
    expect(faceString(cube, 'U')).toBe('WWGWWGWWG');
    expect(faceString(cube, 'F')).toBe('GGYGGYGGY');
    expect(faceString(cube, 'D')).toBe('YYBYYBYYB');
    expect(faceString(cube, 'B')).toBe('WBBWBBWBB');
  });

  it("U brings the right face's top row to the front, and front to left", () => {
    const cube = apply(solved(), 'U');
    expect(faceString(cube, 'F')).toBe('RRRGGGGGG');
    expect(faceString(cube, 'L')).toBe('GGGOOOOOO');
  });

  it('F moves the top onto the right, and the left onto the top', () => {
    const cube = apply(solved(), 'F');
    expect(faceString(cube, 'R')).toBe('WRRWRRWRR');
    expect(faceString(cube, 'U')).toBe('WWWWWWOOO');
  });

  it('slices: M follows L, E follows D, S follows F', () => {
    expect(faceString(apply(solved(), 'M'), 'F')).toBe('GWGGWGGWG');
    expect(faceString(apply(solved(), 'E'), 'F')).toBe('GGGOOOGGG');
    expect(faceString(apply(solved(), 'S'), 'R')).toBe('RWRRWRRWR');
  });

  it('rotations: x follows R, y follows U, z follows F', () => {
    expect(faceString(apply(solved(), 'x'), 'U')).toBe('GGGGGGGGG');
    expect(faceString(apply(solved(), 'y'), 'F')).toBe('RRRRRRRRR');
    expect(faceString(apply(solved(), 'z'), 'R')).toBe('WWWWWWWWW');
  });
});

describe('wide moves and rotations equal their parts', () => {
  const equivalents: [string, string][] = [
    ['r', "R M'"],
    ['l', 'L M'],
    ['u', "U E'"],
    ['d', 'D E'],
    ['f', 'F S'],
    ['b', "B S'"],
    ['x', "R M' L'"],
    ['y', "U E' D'"],
    ['z', "F S B'"],
  ];
  for (const [single, parts] of equivalents) {
    it(`${single} = ${parts}`, () => {
      expect(apply(SCRAMBLED, single)).toEqual(apply(SCRAMBLED, parts));
    });
  }
});

describe('well-known cube facts', () => {
  it("(R U R' U') six times returns to solved", () => {
    expect(apply(solved(), "R U R' U' ".repeat(6))).toEqual(solved());
  });

  it('repeating R U takes exactly 105 times to return to solved', () => {
    const start = solved();
    let cube = apply(start, 'R U');
    let count = 1;
    while (cube.stickers.join('') !== start.stickers.join('') && count < 1000) {
      cube = apply(cube, 'R U');
      count++;
    }
    expect(count).toBe(105);
  });

  it('isSolved accepts any orientation but not a turned face', () => {
    expect(isSolved(solved())).toBe(true);
    expect(isSolved(apply(solved(), 'x y'))).toBe(true);
    expect(isSolved(apply(solved(), 'R'))).toBe(false);
  });
});
