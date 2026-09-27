import { describe, expect, it } from 'vitest';
import { FACE_FRAMES, HOME_COLORS, STICKER_SLOTS, findSlot, slotKey, solved } from './geometry';
import { FACES } from './types';

describe('sticker slots', () => {
  it('has 54 slots numbered 0 to 53 in order', () => {
    expect(STICKER_SLOTS).toHaveLength(54);
    STICKER_SLOTS.forEach((slot, i) => expect(slot.index).toBe(i));
  });

  it('gives every slot a unique place on the cube', () => {
    const keys = new Set(STICKER_SLOTS.map((s) => slotKey(s.position, s.normal)));
    expect(keys.size).toBe(54);
  });

  it('puts every sticker on the outside surface, facing outward', () => {
    for (const s of STICKER_SLOTS) {
      const [px, py, pz] = s.position;
      const [nx, ny, nz] = s.normal;
      expect(px * nx + py * ny + pz * nz).toBe(1);
      expect(s.position.every((c) => c >= -1 && c <= 1)).toBe(true);
    }
  });

  it('puts each face center (sticker 4) in the middle of its face', () => {
    FACES.forEach((face, f) => {
      expect(STICKER_SLOTS[f * 9 + 4].position).toEqual(FACE_FRAMES[face].normal);
    });
  });

  it('starts numbering each face from the corner described in geometry.ts', () => {
    expect(STICKER_SLOTS[0].position).toEqual([-1, 1, -1]); // U: back-left corner
    expect(STICKER_SLOTS[9].position).toEqual([1, 1, 1]); // R: top corner next to the front
    expect(STICKER_SLOTS[18].position).toEqual([-1, 1, 1]); // F: top-left
    expect(STICKER_SLOTS[27].position).toEqual([-1, -1, 1]); // D: front-left
    expect(STICKER_SLOTS[36].position).toEqual([-1, 1, -1]); // L: top corner next to the back
    expect(STICKER_SLOTS[45].position).toEqual([1, 1, -1]); // B: top corner next to the right
  });

  it('finds a slot by position and facing direction', () => {
    expect(findSlot([1, 1, 1], [1, 0, 0])).toBe(9);
    expect(() => findSlot([0, 0, 0], [1, 0, 0])).toThrow();
  });
});

describe('solved cube', () => {
  it('uses the reference hold: white up, green front, red right', () => {
    expect(HOME_COLORS).toEqual({ U: 'W', R: 'R', F: 'G', D: 'Y', L: 'O', B: 'B' });
  });

  it('has every face a single color', () => {
    const cube = solved();
    FACES.forEach((face, f) => {
      expect(cube.stickers.slice(f * 9, f * 9 + 9)).toEqual(Array(9).fill(HOME_COLORS[face]));
    });
  });
});
