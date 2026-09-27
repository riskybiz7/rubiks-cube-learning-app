import { describe, expect, it } from 'vitest';
import { colorList, faceWord, holdDescription, listJoin, placeName } from './describe';
import { solved } from './geometry';
import { applyMoves } from './moves';
import { mustParse } from './notation';

describe('describe', () => {
  it('names places in everyday words, top/bottom first', () => {
    expect(placeName(['U', 'R', 'F'])).toBe('top-front-right');
    expect(placeName(['D', 'L', 'F'])).toBe('bottom-front-left');
    expect(placeName(['F', 'R'])).toBe('front-right');
    expect(placeName(['B', 'L'])).toBe('back-left');
  });

  it('names a single face', () => {
    expect(faceWord('U')).toBe('top');
    expect(faceWord('B')).toBe('back');
  });

  it('names colors', () => {
    expect(colorList(['W', 'R', 'G'])).toBe('white-red-green');
  });

  it('joins lists the way people write them', () => {
    expect(listJoin([])).toBe('');
    expect(listJoin(['a'])).toBe('a');
    expect(listJoin(['a', 'b'])).toBe('a and b');
    expect(listJoin(['a', 'b', 'c'])).toBe('a, b and c');
  });

  it('describes how to hold the cube from its centers', () => {
    expect(holdDescription(solved())).toBe('White on top, green facing you.');
    expect(holdDescription(applyMoves(solved(), mustParse('x2')))).toBe(
      'Yellow on top, blue facing you.',
    );
  });
});
