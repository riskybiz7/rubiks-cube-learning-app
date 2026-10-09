import type { Color, Face } from '../cube/types';

/** One step of the guided scan: which face the camera should see, and how to get there. */
export interface ScanStep {
  face: Face; // the face (named as in the reference hold) that now faces the camera
  center: Color; // its center on a standard cube held white up, green front
  turns: string[]; // whole-cube turns to make first, in the app's words ([] for the first step)
  says: string; // the instruction on screen
  hold: string; // whole-cube turns from the reference hold, in notation (checked by a test)
}

/** Decision #57. The test proves each step's camera view is that face as the app stores it. */
export const SCAN_STEPS: readonly ScanStep[] = [
  {
    face: 'F',
    center: 'G',
    turns: [],
    hold: '',
    says: 'Hold your cube with the white center on top and the green center facing the camera.',
  },
  {
    face: 'R',
    center: 'R',
    turns: ['SPIN LEFT'],
    hold: 'y',
    says: 'SPIN LEFT: keep white on top and turn the cube so red faces the camera.',
  },
  {
    face: 'B',
    center: 'B',
    turns: ['SPIN LEFT'],
    hold: 'y2',
    says: 'SPIN LEFT again: blue faces the camera.',
  },
  {
    face: 'L',
    center: 'O',
    turns: ['SPIN LEFT'],
    hold: "y'",
    says: 'SPIN LEFT again: orange faces the camera.',
  },
  {
    face: 'U',
    center: 'W',
    turns: ['SPIN LEFT', 'TIP FORWARD'],
    hold: "x'",
    says: 'SPIN LEFT once more so green faces the camera, then TIP FORWARD: white faces the camera, with green at the bottom.',
  },
  {
    face: 'D',
    center: 'Y',
    turns: ['TIP TWICE'],
    hold: 'x',
    says: 'TIP TWICE: yellow faces the camera, with green at the top.',
  },
];
