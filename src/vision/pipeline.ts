import { assemble, type AssembledCube } from './assemble';
import { readFace, START_GUESSES, type Frame } from './color';
import { sortColors } from './sort';

/** The whole scanner after the 6 faces are taken: pictures in (in scan order), cube out. */
export function readCube(frames: readonly Frame[]): AssembledCube {
  return assemble(sortColors(frames.map(readFace), START_GUESSES));
}
