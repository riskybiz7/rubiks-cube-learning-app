import { describe, expect, it } from 'vitest';
import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { randomScramble } from '../cube/scramble';
import { FACES, type Color, type Cube } from '../cube/types';
import { validateStickers } from '../cube/validate';
import { seededRandom } from '../test-utils/random';
import { cameraViews } from '../test-utils/scans';
import { assemble, NOTE_REORDERED, NOTE_TURNED, turnFace } from './assemble';

const scrambled = (seed: number) => applyMoves(solved(), randomScramble(25, seededRandom(seed)));

/** A perfect reading of what the camera saw for these holds (colors already sorted). */
const scanOf = (cube: Cube, holds?: readonly string[], unsure: number[] = []) => ({
  colors: cameraViews(cube, holds).flat(),
  unsure,
});

describe('turnFace', () => {
  it('turns a face a quarter turn clockwise; four turns give it back', () => {
    const nine = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    expect(turnFace(nine)).toEqual([6, 3, 0, 7, 4, 1, 8, 5, 2]);
    expect(turnFace(turnFace(turnFace(turnFace(nine))))).toEqual(nine);
  });
});

describe('assemble', () => {
  it('a scan held as instructed comes out as the cube, with no note', () => {
    const cube = scrambled(21);
    const result = assemble(scanOf(cube));
    expect(result.stickers).toEqual(cube.stickers);
    expect(result.note).toBeNull();
  });

  it('unsure marks land on the right squares', () => {
    // Scan position 9 is step 1's first square; step 1 shows the right face (R).
    const result = assemble(scanOf(scrambled(22), undefined, [9]));
    expect(result.unsure).toEqual([FACES.indexOf('R') * 9 + 0]);
  });

  it('SPIN RIGHT instead of SPIN LEFT is fixed by the centers', () => {
    const cube = scrambled(23);
    const result = assemble(scanOf(cube, ['', "y'", 'y2', 'y', "x'", 'x']));
    expect(result.stickers).toEqual(cube.stickers);
    expect(result.note).toBe(NOTE_REORDERED);
  });

  it('TIP BACK instead of TIP FORWARD is fixed by the centers', () => {
    const cube = scrambled(24);
    const result = assemble(scanOf(cube, ['', 'y', 'y2', "y'", 'x', "x'"]));
    expect(result.stickers).toEqual(cube.stickers);
    expect(result.note).toBe(NOTE_REORDERED);
  });

  it('tipping without first spinning back to green is fixed by turning white and yellow back', () => {
    const cube = scrambled(25);
    const result = assemble(scanOf(cube, ['', 'y', 'y2', "y'", "y' x'", "y' x"]));
    expect(result.stickers).toEqual(cube.stickers);
    expect(result.note).toBe(NOTE_TURNED);
  });

  it('a real misread is left as scanned, for the check to explain', () => {
    const cube = scrambled(26);
    const scan = scanOf(cube);
    // Swap two non-center squares of different colors in step 0 (the green face).
    const [p, q] = [0, 8];
    expect(scan.colors[p]).not.toBe(scan.colors[q]);
    [scan.colors[p], scan.colors[q]] = [scan.colors[q], scan.colors[p]];
    const asScanned = assemble({ colors: scan.colors, unsure: [] });
    expect(asScanned.note).toBeNull();
    expect(validateStickers(asScanned.stickers).ok).toBe(false);
    const f = FACES.indexOf('F') * 9;
    expect(asScanned.stickers.slice(f, f + 9)).toEqual(scan.colors.slice(0, 9));
  });

  it('swapped center caps are not "fixed" away: the check still reports them', () => {
    const stickers: Color[] = [...scrambled(27).stickers];
    const [right, left] = [FACES.indexOf('R') * 9 + 4, FACES.indexOf('L') * 9 + 4];
    [stickers[right], stickers[left]] = [stickers[left], stickers[right]];
    const capsSwapped: Cube = { stickers };
    const result = assemble(scanOf(capsSwapped));
    expect(result.stickers).toEqual(stickers);
    expect(result.note).toBeNull();
    const checked = validateStickers(result.stickers);
    expect(checked.ok).toBe(false);
    if (!checked.ok) expect(checked.problems.map((p) => p.code)).toContain('center-mirror');
  });
});
