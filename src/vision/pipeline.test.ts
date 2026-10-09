import { describe, expect, it } from 'vitest';
import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { randomScramble } from '../cube/scramble';
import { STICKER_HEX } from '../render/colors';
import { hexToRgb, paintFrame } from '../test-utils/frames';
import { seededRandom } from '../test-utils/random';
import { cameraViews } from '../test-utils/scans';
import { readCube } from './pipeline';

describe('readCube (pictures in, cube out)', () => {
  it('reads 10 scrambled cubes from noisy pictures of their faces', () => {
    const random = seededRandom(31);
    for (let n = 0; n < 10; n++) {
      const cube = applyMoves(solved(), randomScramble(25, random));
      const frames = cameraViews(cube).map((view) =>
        paintFrame(
          view.map((color) => hexToRgb(STICKER_HEX[color])),
          { noise: 10, random },
        ),
      );
      const result = readCube(frames);
      expect(result.stickers).toEqual(cube.stickers);
      expect(result.note).toBeNull();
    }
  });
});
