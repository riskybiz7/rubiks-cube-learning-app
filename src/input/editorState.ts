import { HOME_COLORS, STICKER_SLOTS, solved } from '../cube/geometry';
import type { Color } from '../cube/types';

/** The editor's 54 stickers: a color, or null for "not filled in yet". */
export type EditorStickers = readonly (Color | null)[];

/** The middle sticker of each face (index 4 of its 9). */
export function isCenter(slot: number): boolean {
  return slot % 9 === 4;
}

/** Centers filled in for the reference hold (white up, green front); everything else blank. */
export function blankStickers(): EditorStickers {
  return STICKER_SLOTS.map((s) => (isCenter(s.index) ? HOME_COLORS[s.face] : null));
}

/** Every sticker filled in as a solved cube. */
export function solvedStickers(): EditorStickers {
  return solved().stickers;
}

/** A copy of the stickers with one sticker painted. The original list is left unchanged. */
export function paintSticker(stickers: EditorStickers, slot: number, color: Color): EditorStickers {
  return stickers.map((current, i) => (i === slot ? color : current));
}

export function countBlanks(stickers: EditorStickers): number {
  return stickers.filter((c) => c === null).length;
}
