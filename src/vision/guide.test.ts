import { describe, expect, it } from 'vitest';
import { CUBE_TURN_WORDS } from '../content/cubeTurnWords';
import { HOME_COLORS, solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { formatMove, mustParse } from '../cube/notation';
import { randomScramble } from '../cube/scramble';
import { FACES, type Color, type Face } from '../cube/types';
import { seededRandom } from '../test-utils/random';
import { SCAN_STEPS } from './guide';

const faceStickers = (stickers: readonly Color[], face: Face) => {
  const f = FACES.indexOf(face);
  return stickers.slice(f * 9, f * 9 + 9);
};

/** The 6 centers after some whole-cube turns: they say exactly how the cube is held. */
const heldAs = (moves: string) => {
  const cube = applyMoves(solved(), mustParse(moves));
  return FACES.map((_, f) => cube.stickers[f * 9 + 4]).join('');
};

describe('the guided scan steps', () => {
  it('show each face exactly once', () => {
    expect(SCAN_STEPS.map((s) => s.face).sort()).toEqual([...FACES].sort());
  });

  it('name the center a standard cube has on that face', () => {
    for (const step of SCAN_STEPS) expect(step.center).toBe(HOME_COLORS[step.face]);
  });

  it('the camera sees each face exactly as the app stores it (200 scrambles)', () => {
    // A camera in front of the cube sees the front face, read row by row (FACE_FRAMES).
    const random = seededRandom(4);
    for (let n = 0; n < 200; n++) {
      const cube = applyMoves(solved(), randomScramble(25, random));
      for (const step of SCAN_STEPS) {
        const held = applyMoves(cube, mustParse(step.hold));
        expect(faceStickers(held.stickers, 'F')).toEqual(faceStickers(cube.stickers, step.face));
      }
    }
  });

  it('the words on screen lead from each hold to the next', () => {
    SCAN_STEPS.forEach((step, i) => {
      const before = i === 0 ? '' : SCAN_STEPS[i - 1].hold;
      const moves = step.turns.map((label) => {
        const word = CUBE_TURN_WORDS.find((w) => w.label === label);
        if (!word) throw new Error(`"${label}" is not one of the app's cube-turn words`);
        expect(step.says).toContain(label);
        return formatMove({ base: word.base, turns: word.turns });
      });
      expect(heldAs([before, ...moves].join(' '))).toBe(heldAs(step.hold));
    });
  });
});
