import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { cleanVec, findSlot, type Vec3 } from '../cube/geometry';
import { movePermutation } from '../cube/moves';
import { MOVE_BASES, formatMove, type Turns } from '../cube/notation';
import { CUBIES, moveRotation } from './layout';

describe('cubie layout', () => {
  it('has 26 visible cubies: 6 centers, 12 edges, 8 corners', () => {
    expect(CUBIES).toHaveLength(26);
    const bySize = [1, 2, 3].map((n) => CUBIES.filter((c) => c.stickers.length === n).length);
    expect(bySize).toEqual([6, 12, 8]);
  });

  it('places each of the 54 stickers on exactly one cubie', () => {
    const slots = CUBIES.flatMap((c) => c.stickers.map((s) => s.slot)).sort((a, b) => a - b);
    expect(slots).toEqual([...Array(54).keys()]);
  });
});

describe('moveRotation', () => {
  it('turns the right layer for R, a quarter turn clockwise seen from the right', () => {
    const r = moveRotation({ base: 'R', turns: 1 });
    expect(r.axis).toEqual([1, 0, 0]);
    expect(r.angle).toBeCloseTo(-Math.PI / 2);
    expect(r.cubieIndices).toHaveLength(9);
    expect(r.cubieIndices.every((i) => CUBIES[i].position[0] === 1)).toBe(true);
  });

  it("animates R' the short way (+90°) and R2 as a half turn", () => {
    expect(moveRotation({ base: 'R', turns: 3 }).angle).toBeCloseTo(Math.PI / 2);
    expect(moveRotation({ base: 'R', turns: 2 }).angle).toBeCloseTo(-Math.PI);
  });

  it('moves the right number of cubies for slices, wide turns and rotations', () => {
    expect(moveRotation({ base: 'M', turns: 1 }).cubieIndices).toHaveLength(8); // middle slice minus hidden core
    expect(moveRotation({ base: 'r', turns: 1 }).cubieIndices).toHaveLength(17);
    expect(moveRotation({ base: 'x', turns: 1 }).cubieIndices).toHaveLength(26);
  });

  it('animates every move the same way the model turns it', () => {
    const round = (v: Vector3): Vec3 => cleanVec(Math.round(v.x), Math.round(v.y), Math.round(v.z));
    for (const base of MOVE_BASES) {
      for (const turns of [1, 2, 3] as Turns[]) {
        const move = { base, turns };
        const gather = movePermutation(move);
        const { axis, angle, cubieIndices } = moveRotation(move);
        const axisVector = new Vector3(...axis);
        const moving = new Set(cubieIndices);
        CUBIES.forEach((cubie, i) => {
          for (const { slot, normal } of cubie.stickers) {
            let destination = slot;
            if (moving.has(i)) {
              const p = new Vector3(...cubie.position).applyAxisAngle(axisVector, angle);
              const n = new Vector3(...normal).applyAxisAngle(axisVector, angle);
              destination = findSlot(round(p), round(n));
            }
            // The model must put this sticker exactly where the animation carries it.
            expect(gather[destination], `${formatMove(move)}, sticker ${slot}`).toBe(slot);
          }
        });
      }
    }
  });
});
