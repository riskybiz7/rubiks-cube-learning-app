import { describe, expect, it } from 'vitest';
import { STICKER_SLOTS } from '../cube/geometry';
import { AXIS_INDEX, MOVE_SPECS, movePermutation } from '../cube/moves';
import { MOVE_BASES } from '../cube/notation';
import { MOVE_KEY, READING_TIPS } from './moveKey';

describe('move key', () => {
  it('explains every move letter the app understands, once', () => {
    expect(MOVE_KEY.map((entry) => entry.base).sort()).toEqual([...MOVE_BASES].sort());
  });

  it('says where squares move, and the cube model agrees for every move', () => {
    for (const entry of MOVE_KEY) {
      const { axis, layers } = MOVE_SPECS[entry.base];
      // A square on the "from" face that sits in a layer this move turns.
      const square = STICKER_SLOTS.find(
        (s) => s.face === entry.from && layers.includes(s.position[AXIS_INDEX[axis]]),
      );
      expect(square, entry.base).toBeDefined();
      if (!square) continue;
      const after = movePermutation({ base: entry.base, turns: 1 });
      const landsOn = STICKER_SLOTS[after.indexOf(square.index)].face;
      expect(landsOn, `${entry.base}: ${entry.says}`).toBe(entry.to);
    }
  });

  it('uses plain words: "squares", never "stickers"', () => {
    const allText = [...READING_TIPS, ...MOVE_KEY.flatMap((e) => [e.name, e.says])].join(' ');
    expect(allText).not.toMatch(/sticker/i);
  });
});
