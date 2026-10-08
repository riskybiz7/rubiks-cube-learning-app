import { describe, expect, it } from 'vitest';
import { STICKER_SLOTS } from '../cube/geometry';
import { NET_CELLS, NET_COLS, NET_ROWS } from './net';

describe('unfolded-cube map', () => {
  it('gives every sticker its own square inside the grid', () => {
    expect(NET_CELLS).toHaveLength(54);
    expect(new Set(NET_CELLS.map((c) => `${c.row},${c.col}`)).size).toBe(54);
    for (const c of NET_CELLS) {
      expect(c.row).toBeGreaterThanOrEqual(0);
      expect(c.row).toBeLessThan(NET_ROWS);
      expect(c.col).toBeGreaterThanOrEqual(0);
      expect(c.col).toBeLessThan(NET_COLS);
    }
  });

  it('joins faces the way a real cube folds up', () => {
    // Two squares side by side on different faces must be the same physical piece.
    const at = new Map(NET_CELLS.map((c) => [`${c.row},${c.col}`, c]));
    let joins = 0;
    for (const cell of NET_CELLS) {
      for (const [dRow, dCol] of [
        [0, 1],
        [1, 0],
      ]) {
        const next = at.get(`${cell.row + dRow},${cell.col + dCol}`);
        if (!next) continue;
        const a = STICKER_SLOTS[cell.slot];
        const b = STICKER_SLOTS[next.slot];
        if (a.face === b.face) continue;
        joins++;
        expect(b.position, `${a.face}${cell.slot} beside ${b.face}${next.slot}`).toEqual(
          a.position,
        );
      }
    }
    expect(joins).toBe(15); // 5 folds (U-F, L-F, F-R, R-B, F-D) × 3 squares each
  });
});
