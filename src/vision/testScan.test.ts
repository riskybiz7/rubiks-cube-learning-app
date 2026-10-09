import { describe, expect, it } from 'vitest';
import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { mustParse } from '../cube/notation';
import { STICKER_HEX } from '../render/colors';
import { hexToRgb, paintFrame } from '../test-utils/frames';
import { seededRandom } from '../test-utils/random';
import { cameraViews } from '../test-utils/scans';
import { readCube } from './pipeline';
import {
  buildTestScan,
  decodePixels,
  encodePixels,
  expectedColors,
  newTestScramble,
  parseTestScan,
  scoreScan,
} from './testScan';

/** A test scan of a scramble, from synthetic pictures of the cube it makes. */
function syntheticScan(scramble: string, seed: number) {
  const random = seededRandom(seed);
  const cube = applyMoves(solved(), mustParse(scramble));
  const frames = cameraViews(cube).map((view) =>
    paintFrame(
      view.map((color) => hexToRgb(STICKER_HEX[color])),
      { noise: 10, random },
    ),
  );
  return buildTestScan({
    scramble,
    light: 'lamp',
    camera: 'back',
    device: 'test',
    frames,
    pictures: frames.map(() => ''),
    result: readCube(frames),
    savedAt: new Date('2026-10-09T12:00:00Z'),
  });
}

describe('test-scan files', () => {
  it('pixels survive the trip to text and back', () => {
    const random = seededRandom(41);
    const data = Uint8ClampedArray.from({ length: 90_000 }, () => Math.floor(random() * 256));
    expect(decodePixels(encodePixels(data))).toEqual(data);
  });

  it('the expected colors are what the scramble makes', () => {
    expect(expectedColors('R')).toEqual([...applyMoves(solved(), mustParse('R')).stickers]);
  });

  it('test scrambles are 15 face turns', () => {
    expect(mustParse(newTestScramble(seededRandom(42)))).toHaveLength(15);
  });

  it('a saved file reads back exactly', () => {
    const file = syntheticScan(newTestScramble(seededRandom(43)), 1);
    const parsed = parseTestScan(JSON.stringify(file));
    expect(parsed).toEqual({ ok: true, file });
  });

  it('rejects files that are not test scans, or whose colors do not match the scramble', () => {
    const file = syntheticScan(newTestScramble(seededRandom(44)), 2);
    expect(parseTestScan('not json').ok).toBe(false);
    expect(parseTestScan(JSON.stringify({ ...file, format: 'something else' })).ok).toBe(false);
    expect(parseTestScan(JSON.stringify({ ...file, scramble: 'R Q' })).ok).toBe(false);
    const edited = [...file.expected];
    [edited[0], edited[53]] = [edited[53], edited[0]];
    expect(edited).not.toEqual(file.expected);
    expect(parseTestScan(JSON.stringify({ ...file, expected: edited }))).toEqual({
      ok: false,
      error: 'expected colors do not match the scramble',
    });
  });

  it('a face with missing or broken pixels is reported, not a crash', () => {
    const file = syntheticScan(newTestScramble(seededRandom(47)), 5);
    const missing = { ...file, faces: file.faces.map((f, i) => (i === 3 ? { picture: '' } : f)) };
    const broken = {
      ...file,
      faces: file.faces.map((f, i) => (i === 3 ? { ...f, pixels: '%%%' } : f)),
    };
    for (const bad of [missing, broken]) {
      expect(parseTestScan(JSON.stringify(bad))).toEqual({
        ok: false,
        error: 'a face has missing or broken pixels',
      });
    }
  });
});

describe('scoreScan', () => {
  it('a clean scan scores 54 of 54', () => {
    const score = scoreScan(syntheticScan(newTestScramble(seededRandom(45)), 3));
    expect(score).toEqual({
      right: 54,
      wrongMarked: 0,
      wrongUnmarked: 0,
      marked: 0,
      passesCheck: true,
      slip: false,
    });
  });

  it('a real cube that is not the scrambled one is flagged as a likely slip', () => {
    const scramble = newTestScramble(seededRandom(46));
    const file = syntheticScan(scramble, 4);
    // Pretend the scramble said one more turn than the owner actually made.
    const slipped = {
      ...file,
      scramble: `${scramble} U`,
      expected: expectedColors(`${scramble} U`),
    };
    const score = scoreScan(slipped);
    expect(score.passesCheck).toBe(true);
    expect(score.slip).toBe(true);
    expect(score.right).toBeLessThan(54);
  });
});
