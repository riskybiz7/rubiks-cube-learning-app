import { describe, expect, it } from 'vitest';
import { CASE_HOME } from '../content/cfop';
import { applyMoves } from '../cube/moves';
import { mustParse } from '../cube/notation';
import { topView } from './caseDiagram';

/**
 * The expected colors come from how the cube physically turns, so a wrong index fails.
 * Held for CFOP: yellow on top, green facing you, so orange is on the right and red on
 * the left. R brings the front's right column up onto the top, sends the top's
 * front-right square to the back, and brings the bottom's front-right square to the front.
 */
describe('topView (seen from above, back at the top of the picture)', () => {
  it('a solved cube held for CFOP', () => {
    expect(topView(CASE_HOME)).toEqual({
      top: Array(9).fill('Y'),
      back: ['B', 'B', 'B'],
      right: ['O', 'O', 'O'],
      front: ['G', 'G', 'G'],
      left: ['R', 'R', 'R'],
    });
  });

  it('after R: lists run left to right (back, front) and back to front (left, right)', () => {
    const view = topView(applyMoves(CASE_HOME, mustParse('R')));
    expect([2, 5, 8].map((i) => view.top[i])).toEqual(['G', 'G', 'G']);
    expect([0, 1, 3, 4, 6, 7].every((i) => view.top[i] === 'Y')).toBe(true);
    expect(view.back).toEqual(['B', 'B', 'Y']);
    expect(view.front).toEqual(['G', 'G', 'W']);
    expect(view.right).toEqual(['O', 'O', 'O']);
    expect(view.left).toEqual(['R', 'R', 'R']);
  });

  it('after L: the left column changes, and the strips run the right way', () => {
    // L brings the back's left column up onto the top, and the top's left column to the front.
    const view = topView(applyMoves(CASE_HOME, mustParse('L')));
    expect([0, 3, 6].map((i) => view.top[i])).toEqual(['B', 'B', 'B']);
    expect(view.front).toEqual(['Y', 'G', 'G']);
    expect(view.back).toEqual(['W', 'B', 'B']);
  });

  it('after U: the front shows what was on the right, and the left what was in front', () => {
    const view = topView(applyMoves(CASE_HOME, mustParse('U')));
    expect(view.front).toEqual(['O', 'O', 'O']);
    expect(view.left).toEqual(['G', 'G', 'G']);
  });

  it('after F: the right strip shows yellow at its front end', () => {
    // F sends the top's front row to the right side, at the top.
    const view = topView(applyMoves(CASE_HOME, mustParse('F')));
    expect(view.right).toEqual(['O', 'O', 'Y']);
    expect(view.left).toEqual(['R', 'R', 'W']);
  });
});
