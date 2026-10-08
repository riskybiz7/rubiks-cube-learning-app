import type { Color } from '../cube/types';

/** Screen colors for each sticker color. */
export const STICKER_HEX: Record<Color, number> = {
  W: 0xffffff,
  Y: 0xffd500,
  G: 0x009b48,
  B: 0x0046ad,
  R: 0xb71234,
  O: 0xff5800,
};

/** Screen color for a sticker that hasn't been filled in yet (also "not yellow" on OLL diagrams). */
export const BLANK_HEX = 0x9a9a9a;

/** CSS color for a sticker (null = blank, grey). */
export function cssColor(color: Color | null): string {
  const hex = color === null ? BLANK_HEX : STICKER_HEX[color];
  return `#${hex.toString(16).padStart(6, '0')}`;
}
