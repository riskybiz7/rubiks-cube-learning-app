import { describe, expect, it } from 'vitest';
import { HOME_COLORS, STICKER_SLOTS, solved } from '../cube/geometry';
import { blankStickers, countBlanks, isCenter, paintSticker, solvedStickers } from './editorState';

describe('editor stickers', () => {
  it('starts blank except the six centers, which match the reference hold', () => {
    const stickers = blankStickers();
    expect(countBlanks(stickers)).toBe(48);
    for (const s of STICKER_SLOTS) {
      expect(stickers[s.index]).toBe(isCenter(s.index) ? HOME_COLORS[s.face] : null);
    }
  });

  it('paints one sticker without changing the original list', () => {
    const before = blankStickers();
    const after = paintSticker(before, 0, 'R');
    expect(after[0]).toBe('R');
    expect(before[0]).toBeNull();
    expect(countBlanks(after)).toBe(47);
  });

  it('can fill in a solved cube', () => {
    expect(solvedStickers()).toEqual(solved().stickers);
    expect(countBlanks(solvedStickers())).toBe(0);
  });
});
