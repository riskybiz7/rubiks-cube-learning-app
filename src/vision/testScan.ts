import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { formatAlgorithm, parseAlgorithm } from '../cube/notation';
import { randomScramble } from '../cube/scramble';
import type { Color } from '../cube/types';
import { validateStickers } from '../cube/validate';
import type { AssembledCube } from './assemble';
import type { Frame } from './color';
import { readCube } from './pipeline';

export const TEST_SCAN_FORMAT = 'rubiks-cube-app.test-scan.v1';
export const LIGHTS = ['daylight', 'lamp', 'dim', 'other'] as const;
export type Light = (typeof LIGHTS)[number];
export type CameraKind = 'back' | 'front' | 'unknown';

/** Test scrambles are 15 face turns: fewer chances to slip, still well mixed (decision #64). */
export const TEST_SCRAMBLE_LENGTH = 15;

/** One saved test scan (decision #63). */
export interface TestScanFile {
  format: typeof TEST_SCAN_FORMAT;
  savedAt: string; // ISO date and time
  scramble: string; // done from solved, white on top, green facing you
  expected: Color[]; // the 54 colors the scramble makes (recomputed and compared when measured)
  light: Light;
  camera: CameraKind;
  device: string; // the browser's description of itself
  frameSize: number;
  faces: { pixels: string; picture: string }[]; // scan order; pixels = base64 RGBA, picture = JPEG to look at
  answer: Color[]; // what the app put on the review map
  unsure: number[]; // squares the app marked unsure
}

export function newTestScramble(random: () => number = Math.random): string {
  return formatAlgorithm(randomScramble(TEST_SCRAMBLE_LENGTH, random));
}

/** The 54 colors a scramble makes from a solved cube in the reference hold. */
export function expectedColors(scramble: string): Color[] {
  const parsed = parseAlgorithm(scramble);
  if (!parsed.ok) throw new Error(`Bad scramble: ${parsed.message}`);
  return [...applyMoves(solved(), parsed.moves).stickers];
}

/** Pixels as text (base64), so they fit in a JSON file. */
export function encodePixels(data: ArrayLike<number>): string {
  const chunks: string[] = [];
  for (let start = 0; start < data.length; start += 0x8000) {
    const piece: number[] = [];
    for (let i = start; i < Math.min(start + 0x8000, data.length); i++) piece.push(data[i]);
    chunks.push(String.fromCharCode(...piece));
  }
  return btoa(chunks.join(''));
}

export function decodePixels(text: string): Uint8ClampedArray {
  const binary = atob(text);
  const data = new Uint8ClampedArray(binary.length);
  for (let i = 0; i < binary.length; i++) data[i] = binary.charCodeAt(i);
  return data;
}

export function buildTestScan(input: {
  scramble: string;
  light: Light;
  camera: CameraKind;
  device: string;
  frames: readonly Frame[];
  pictures: readonly string[];
  result: AssembledCube;
  savedAt?: Date;
}): TestScanFile {
  return {
    format: TEST_SCAN_FORMAT,
    savedAt: (input.savedAt ?? new Date()).toISOString(),
    scramble: input.scramble,
    expected: expectedColors(input.scramble),
    light: input.light,
    camera: input.camera,
    device: input.device,
    frameSize: input.frames[0].size,
    faces: input.frames.map((frame, i) => ({
      pixels: encodePixels(frame.data),
      picture: input.pictures[i] ?? '',
    })),
    answer: input.result.stickers,
    unsure: input.result.unsure,
  };
}

/** Reads a saved file, re-checking it ("re-footing"): the expected colors must match the scramble. */
export function parseTestScan(
  text: string,
): { ok: true; file: TestScanFile } | { ok: false; error: string } {
  let file: TestScanFile;
  try {
    file = JSON.parse(text) as TestScanFile;
  } catch {
    return { ok: false, error: 'not JSON' };
  }
  if (file?.format !== TEST_SCAN_FORMAT) return { ok: false, error: 'not a test scan file' };
  if (typeof file.scramble !== 'string' || !parseAlgorithm(file.scramble).ok) {
    return { ok: false, error: 'bad scramble' };
  }
  if (
    !Array.isArray(file.expected) ||
    expectedColors(file.scramble).join('') !== file.expected.join('')
  ) {
    return { ok: false, error: 'expected colors do not match the scramble' };
  }
  if (!Array.isArray(file.faces) || file.faces.length !== 6) {
    return { ok: false, error: 'needs 6 faces' };
  }
  const bytes = file.frameSize * file.frameSize * 4;
  if (file.faces.some((face) => decodePixels(face.pixels).length !== bytes)) {
    return { ok: false, error: 'a face has the wrong number of pixels' };
  }
  return { ok: true, file };
}

export function framesOf(file: TestScanFile): Frame[] {
  return file.faces.map((face) => ({ size: file.frameSize, data: decodePixels(face.pixels) }));
}

/** How the current scanner does on a saved scan (decision #66). */
export interface ScanScore {
  right: number; // squares read right, of 54, before any fixing
  wrongMarked: number; // wrong squares that were marked unsure
  wrongUnmarked: number; // wrong squares that were not
  marked: number; // all squares marked unsure
  passesCheck: boolean; // the answer passes "Check my cube"
  slip: boolean; // a real cube, but not the scrambled one: likely a scrambling slip (#64)
}

/** Scores a saved scan by running today's scanner on its pixels, so re-tuning re-scores old scans. */
export function scoreScan(file: TestScanFile): ScanScore {
  const answer = readCube(framesOf(file));
  const wrong = answer.stickers.flatMap((color, i) => (color === file.expected[i] ? [] : [i]));
  const marked = new Set(answer.unsure);
  const passesCheck = validateStickers(answer.stickers).ok;
  return {
    right: 54 - wrong.length,
    wrongMarked: wrong.filter((i) => marked.has(i)).length,
    wrongUnmarked: wrong.filter((i) => !marked.has(i)).length,
    marked: marked.size,
    passesCheck,
    slip: passesCheck && wrong.length > 0,
  };
}
