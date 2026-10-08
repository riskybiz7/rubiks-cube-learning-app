import type { Color, Cube, Face } from './types';

export const COLOR_NAMES: Record<Color, string> = {
  W: 'white',
  Y: 'yellow',
  G: 'green',
  B: 'blue',
  R: 'red',
  O: 'orange',
};

const FACE_WORDS: Record<Face, string> = {
  U: 'top',
  D: 'bottom',
  F: 'front',
  B: 'back',
  L: 'left',
  R: 'right',
};

/** The order people say place words in: "top-front-right", not "right-top-front". */
const WORD_ORDER: readonly Face[] = ['U', 'D', 'F', 'B', 'L', 'R'];

/** A place on the cube in everyday words, e.g. ['U', 'R', 'F'] → "top-front-right". */
export function placeName(faces: readonly Face[]): string {
  return [...faces]
    .sort((a, b) => WORD_ORDER.indexOf(a) - WORD_ORDER.indexOf(b))
    .map((face) => FACE_WORDS[face])
    .join('-');
}

/** One face in everyday words, e.g. 'U' → "top". */
export function faceWord(face: Face): string {
  return FACE_WORDS[face];
}

/** Color names joined with dashes, e.g. ['W', 'R', 'G'] → "white-red-green". */
export function colorList(colors: readonly Color[]): string {
  return colors.map((c) => COLOR_NAMES[c]).join('-');
}

/** Join a list the way people write it: "a", "a and b", "a, b and c". */
export function listJoin(items: readonly string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export function capitalize(text: string): string {
  return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}

/** How to hold the cube so it matches the screen, e.g. "White on top, green facing you." */
export function holdDescription(cube: Cube): string {
  const top = COLOR_NAMES[cube.stickers[4]]; // U center
  const front = COLOR_NAMES[cube.stickers[22]]; // F center
  return `${capitalize(top)} on top, ${front} facing you.`;
}
