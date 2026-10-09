import { FRAME_SIZE, type Frame } from '../vision/color';

export type Rgb = readonly [number, number, number];

/**
 * A synthetic grid picture for tests: 9 flat-colored cells with dark lines between them, like a
 * cube face lined up with the on-screen grid. `noise` adds up to ± that much to every value.
 */
export function paintFrame(
  cells: readonly Rgb[],
  options: { noise?: number; random?: () => number; size?: number } = {},
): Frame {
  const size = options.size ?? FRAME_SIZE;
  const cell = size / 3;
  const noise = options.noise ?? 0;
  const random = options.random ?? (() => 0.5);
  const data = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inX = x % cell;
      const inY = y % cell;
      const onLine = inX < 3 || inX >= cell - 3 || inY < 3 || inY >= cell - 3;
      const [r, g, b] = onLine
        ? [12, 12, 12]
        : cells[Math.floor(y / cell) * 3 + Math.floor(x / cell)];
      const jitter = () => (random() - 0.5) * 2 * noise;
      const i = (y * size + x) * 4;
      data[i] = r + jitter();
      data[i + 1] = g + jitter();
      data[i + 2] = b + jitter();
      data[i + 3] = 255;
    }
  }
  return { size, data };
}

/** Puts a small bright spot (a glint of light) into a frame, top-left corner at (x, y). */
export function addGlint(frame: Frame, x: number, y: number, width = 6): Frame {
  const data = Uint8ClampedArray.from(frame.data);
  for (let dy = 0; dy < width; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const i = ((y + dy) * frame.size + (x + dx)) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
    }
  }
  return { size: frame.size, data };
}

/** The screen color of a sticker color, as camera-style red, green, blue. */
export function hexToRgb(hex: number): Rgb {
  return [hex >> 16, (hex >> 8) & 0xff, hex & 0xff];
}
