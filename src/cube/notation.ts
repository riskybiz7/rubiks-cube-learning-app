/**
 * Every move letter the app understands (standard Singmaster/WCA notation):
 * - U R F D L B: turn one outer face
 * - u r f d l b: "wide" turns (the face plus the middle layer next to it; also written Rw)
 * - M E S:       turn a middle slice (M follows L, E follows D, S follows F)
 * - x y z:       turn the whole cube in your hands (x follows R, y follows U, z follows F)
 */
// prettier-ignore
export type MoveBase =
  | 'U' | 'R' | 'F' | 'D' | 'L' | 'B'
  | 'u' | 'r' | 'f' | 'd' | 'l' | 'b'
  | 'M' | 'E' | 'S'
  | 'x' | 'y' | 'z';

// prettier-ignore
export const MOVE_BASES: readonly MoveBase[] = [
  'U', 'R', 'F', 'D', 'L', 'B',
  'u', 'r', 'f', 'd', 'l', 'b',
  'M', 'E', 'S',
  'x', 'y', 'z',
];

/** How far to turn: 1 = quarter clockwise, 2 = half turn, 3 = quarter counter-clockwise (written '). */
export type Turns = 1 | 2 | 3;

export interface Move {
  readonly base: MoveBase;
  readonly turns: Turns;
}

export type ParseResult =
  { ok: true; moves: Move[] } | { ok: false; message: string; index: number };

const WIDE_CAPABLE = 'URFDLB';

/**
 * One move: a letter, an optional "w" (wide), then an optional suffix.
 * Suffixes: ' (also the curly ’ and prime ′ that websites use), 2, or 2'.
 * The "y" flag makes the pattern match exactly at lastIndex.
 */
const MOVE_PATTERN = /([URFDLBurfdlbMESxyz])(w?)(2'|2|'|’|′)?/y;

/** Turn algorithm text into moves, or explain what's wrong and where. */
export function parseAlgorithm(text: string): ParseResult {
  const moves: Move[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    // Spaces, line breaks and grouping parentheses carry no meaning, so skip them.
    if (/\s/.test(ch) || ch === '(' || ch === ')') {
      i++;
      continue;
    }
    MOVE_PATTERN.lastIndex = i;
    const match = MOVE_PATTERN.exec(text);
    if (!match) {
      return {
        ok: false,
        index: i,
        message:
          `Unexpected "${ch}" at position ${i + 1}. Moves use the letters U R F D L B, ` +
          `u r f d l b, M E S and x y z, optionally followed by ' or 2.`,
      };
    }
    const [token, letter, wide, suffix = ''] = match;
    if (wide && !WIDE_CAPABLE.includes(letter)) {
      return {
        ok: false,
        index: i,
        message: `"${letter}w" at position ${i + 1} isn't a move. Only U R F D L B can be wide (for example Rw).`,
      };
    }
    const base = (wide ? letter.toLowerCase() : letter) as MoveBase;
    const turns: Turns = suffix.startsWith('2') ? 2 : suffix === '' ? 1 : 3;
    moves.push({ base, turns });
    i += token.length;
  }
  return { ok: true, moves };
}

/** Like parseAlgorithm, but throws on bad input. For trusted text such as tests and built-in content. */
export function mustParse(text: string): Move[] {
  const result = parseAlgorithm(text);
  if (!result.ok) throw new Error(result.message);
  return result.moves;
}

const SUFFIX: Record<Turns, string> = { 1: '', 2: '2', 3: "'" };

export function formatMove(move: Move): string {
  return move.base + SUFFIX[move.turns];
}

export function formatAlgorithm(moves: readonly Move[]): string {
  return moves.map(formatMove).join(' ');
}

/** The move that undoes this one: a quarter turn the other way; a half turn undoes itself. */
export function invertMove(move: Move): Move {
  return { base: move.base, turns: (4 - move.turns) as Turns };
}

/** Undo a whole algorithm: undo the last move first. */
export function invertMoves(moves: readonly Move[]): Move[] {
  return [...moves].reverse().map(invertMove);
}
