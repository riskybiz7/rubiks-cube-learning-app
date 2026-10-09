import type { Color } from '../cube/types';
import { STICKER_HEX } from '../render/colors';

/**
 * A color in CIELAB ("Lab"): L = lightness (0 black to 100 white), a = green (−) to red (+),
 * b = blue (−) to yellow (+). Lab keeps "how light" (L) apart from "which color" (a, b), so a
 * shadow moves L much more than a and b.
 */
export interface Lab {
  L: number;
  a: number;
  b: number;
}

/** A camera color (red, green, blue, each 0–255) as Lab, by the standard sRGB formulas (D65 white). */
export function rgbToLab(red: number, green: number, blue: number): Lab {
  // 1. Undo the screen's brightness curve, so the values add up like real light.
  const linear = (value: number) => {
    const v = value / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const r = linear(red);
  const g = linear(green);
  const b = linear(blue);
  // 2. Mix into X, Y, Z (how the eye's three color sensors respond), relative to daylight white.
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  // 3. A cube-root curve, close to how strongly we see differences.
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);
  return { L: 116 * f(y) - 16, a: 500 * (f(x) - f(y)), b: 200 * (f(y) - f(z)) };
}

/** How different two colors look: the straight-line distance between them in Lab. */
export function labDistance(p: Lab, q: Lab): number {
  return Math.hypot(p.L - q.L, p.a - q.a, p.b - q.b);
}

/** A square picture of the grid area, as the browser hands it over: red, green, blue, alpha, row by row. */
export interface Frame {
  size: number; // width and height, in pixels
  data: ArrayLike<number>; // size × size × 4 numbers, each 0–255
}

/** The grid area is shrunk to this many pixels a side before it's read. */
export const FRAME_SIZE = 150;

/** Only the middle half of each grid cell is read, clear of the black edges between squares. Tuned in ④c. */
export const SAMPLE_FRACTION = 0.5;

function median(values: number[]): number {
  const sorted = [...values].sort((x, y) => x - y);
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * A face's 9 colors, row by row as the camera sees it (not mirrored). Each is the median (middle
 * value) of its cell's middle half, so a glint of light or a small logo doesn't change the answer.
 */
export function readFace(frame: Frame): Lab[] {
  const cell = frame.size / 3;
  const margin = (cell * (1 - SAMPLE_FRACTION)) / 2;
  const readings: Lab[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const reds: number[] = [];
      const greens: number[] = [];
      const blues: number[] = [];
      const top = Math.round(row * cell + margin);
      const bottom = Math.round((row + 1) * cell - margin);
      const left = Math.round(col * cell + margin);
      const right = Math.round((col + 1) * cell - margin);
      for (let y = top; y < bottom; y++) {
        for (let x = left; x < right; x++) {
          const i = (y * frame.size + x) * 4;
          reds.push(frame.data[i]);
          greens.push(frame.data[i + 1]);
          blues.push(frame.data[i + 2]);
        }
      }
      readings.push(rgbToLab(median(reds), median(greens), median(blues)));
    }
  }
  return readings;
}

function hexToLab(hex: number): Lab {
  return rgbToLab(hex >> 16, (hex >> 8) & 0xff, hex & 0xff);
}

/**
 * Starting guesses for how each color looks: the app's own screen colors. Used for the live dots
 * and to name the centers. ④c may replace them with values measured from test batch A.
 */
export const START_GUESSES: Record<Color, Lab> = {
  W: hexToLab(STICKER_HEX.W),
  Y: hexToLab(STICKER_HEX.Y),
  G: hexToLab(STICKER_HEX.G),
  B: hexToLab(STICKER_HEX.B),
  R: hexToLab(STICKER_HEX.R),
  O: hexToLab(STICKER_HEX.O),
};

/** The color whose guess is nearest, and how much further the next nearest is (small gap = close call). */
export function nearestColor(
  reading: Lab,
  guesses: Record<Color, Lab>,
): { color: Color; gap: number } {
  const ranked = (Object.keys(guesses) as Color[])
    .map((color) => ({ color, distance: labDistance(reading, guesses[color]) }))
    .sort((p, q) => p.distance - q.distance);
  return { color: ranked[0].color, gap: ranked[1].distance - ranked[0].distance };
}
