import { FRAME_SIZE, type Frame } from './color';
import type { CameraKind } from './testScan';

/** The grid's share of the camera view's shorter side. Tuned in ④c. */
export const GRID_FRACTION = 0.7;

export type CameraProblem = 'not-secure' | 'not-allowed' | 'no-camera' | 'other';

/** Starts the camera, preferring the back camera on phones (decision #62). */
export async function startCamera(): Promise<
  { stream: MediaStream; kind: CameraKind } | { problem: CameraProblem; detail: string }
> {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    return { problem: 'not-secure', detail: '' };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
    const facing = stream.getVideoTracks()[0]?.getSettings().facingMode;
    const kind: CameraKind =
      facing === 'environment' ? 'back' : facing === 'user' ? 'front' : 'unknown';
    return { stream, kind };
  } catch (error) {
    const name = error instanceof DOMException ? error.name : '';
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      return { problem: 'not-allowed', detail: name };
    }
    if (name === 'NotFoundError' || name === 'OverconstrainedError') {
      return { problem: 'no-camera', detail: name };
    }
    return { problem: 'other', detail: name || String(error) };
  }
}

export function stopCamera(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}

/**
 * The grid area of the current video picture, shrunk to FRAME_SIZE a side, or null if the video
 * has no picture yet. The grid is the centered square GRID_FRACTION of the shorter side: the same
 * square the screen outlines, because the video is shown as a centered square ("object-fit: cover").
 */
export function grabGrid(video: HTMLVideoElement, canvas: HTMLCanvasElement): Frame | null {
  const { videoWidth: w, videoHeight: h } = video;
  if (video.readyState < 2 || w === 0 || h === 0) return null;
  if (canvas.width !== FRAME_SIZE) canvas.width = canvas.height = FRAME_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  const side = Math.min(w, h) * GRID_FRACTION;
  context.drawImage(
    video,
    (w - side) / 2,
    (h - side) / 2,
    side,
    side,
    0,
    0,
    FRAME_SIZE,
    FRAME_SIZE,
  );
  return { size: FRAME_SIZE, data: context.getImageData(0, 0, FRAME_SIZE, FRAME_SIZE).data };
}

/** A JPEG of a frame, for test files: something to look at (the pixels are what gets measured). */
export function pictureOf(frame: Frame): string {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = frame.size;
  const context = canvas.getContext('2d');
  if (!context) return '';
  const image = new ImageData(Uint8ClampedArray.from(frame.data), frame.size, frame.size);
  context.putImageData(image, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.9);
}
