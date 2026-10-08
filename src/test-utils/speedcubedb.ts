import type { Move, Turns } from '../cube/notation';

/**
 * SpeedCubeDB's "Standard Alg" for every OLL and PLL case, as published at
 * https://www.speedcubedb.com/a/3x3/OLL and https://www.speedcubedb.com/a/3x3/PLL
 * (fetched 2026-10-08). The tests use these only to tie the app's OLL numbers and PLL
 * names to the same cases the site shows. The app's own algorithms are in
 * src/content/cfop.ts.
 */
export const SPEEDCUBEDB_STANDARD = new Map<string, string>([
  ['OLL 1', "R U2 R' R' F R F' U2 R' F R F'"],
  ['OLL 2', "F R U R' U' F' f R U R' U' f'"],
  ['OLL 3', "y' f R U R' U' f' U' F R U R' U' F'"],
  ['OLL 4', "y' f R U R' U' f' U F R U R' U' F'"],
  ['OLL 5', "r' U2 R U R' U r"],
  ['OLL 6', "r U2 R' U' R U' r'"],
  ['OLL 7', "r U R' U R U2 r'"],
  ['OLL 8', "y2 r' U' R U' R' U2 r"],
  ['OLL 9', "y R U R' U' R' F R R U R' U' F'"],
  ['OLL 10', "R U R' U R' F R F' R U2 R'"],
  ['OLL 11', "M R U R' U R U2 R' U M'"],
  ['OLL 12', "y' M' R' U' R U' R' U2 R U' M"],
  ['OLL 13', "r U' r' U' r U r' F' U F"],
  ['OLL 14', "R' F R U R' F' R F U' F'"],
  ['OLL 15', "r' U' r R' U' R U r' U r"],
  ['OLL 16', "r U r' R U R' U' r U' r'"],
  ['OLL 17', "R U R' U R' F R F' U2 R' F R F'"],
  ['OLL 18', "y R U2 R' R' F R F' U2 M' U R U' r'"],
  ['OLL 19', "M U R U R' U' M' R' F R F'"],
  ['OLL 20', "r U R' U' M2 U R U' R' U' M'"],
  ['OLL 21', "R U R' U R U' R' U R U2 R'"],
  ['OLL 22', "R U2 R2' U' R2 U' R2' U' U' R"],
  ['OLL 23', "R2 D R' U2 R D' R' U2 R'"],
  ['OLL 24', "r U R' U' r' F R F'"],
  ['OLL 25', "y F' r U R' U' r' F R"],
  ['OLL 26', "y R U2 R' U' R U' R'"],
  ['OLL 27', "R U R' U R U2 R'"],
  ['OLL 28', "r U R' U' M U R U' R'"],
  ['OLL 29', "y R U R' U' R U' R' F' U' F R U R'"],
  ['OLL 30', "y2 F U R U2 R' U' R U2 R' U' F'"],
  ['OLL 31', "R' U' F U R U' R' F' R"],
  ['OLL 32', "S R U R' U' R' F R f'"],
  ['OLL 33', "R U R' U' R' F R F'"],
  ['OLL 34', "y2 R U R2 U' R' F R U R U' F'"],
  ['OLL 35', "R U2 R' R' F R F' R U2 R'"],
  ['OLL 36', "y2 L' U' L U' L' U L U L F' L' F"],
  ['OLL 37', "F R U' R' U' R U R' F'"],
  ['OLL 38', "R U R' U R U' R' U' R' F R F'"],
  ['OLL 39', "y L F' L' U' L U F U' L'"],
  ['OLL 40', "y R' F R U R' U' F' U R"],
  ['OLL 41', "y2 R U R' U R U2 R' F R U R' U' F'"],
  ['OLL 42', "R' U' R U' R' U2 R F R U R' U' F'"],
  ['OLL 43', "y R' U' F' U F R"],
  ['OLL 44', "f R U R' U' f'"],
  ['OLL 45', "F R U R' U' F'"],
  ['OLL 46', "R' U' R' F R F' U R"],
  ['OLL 47', "F' L' U' L U L' U' L U F"],
  ['OLL 48', "F R U R' U' R U R' U' F'"],
  ['OLL 49', "y2 r U' r2 U r2 U r2 U' r"],
  ['OLL 50', "r' U r2 U' r2 U' r2 U r'"],
  ['OLL 51', "f R U R' U' R U R' U' f'"],
  ['OLL 52', "y2 R' F' U' F U' R U R' U R"],
  ['OLL 53', "r' U' R U' R' U R U' R' U2 r"],
  ['OLL 54', "r U R' U R U' R' U R U2 r'"],
  ['OLL 55', "R U2 R2 U' R U' R' U2 F R F'"],
  ['OLL 56', "r U r' U R U' R' U R U' R' r U' r'"],
  ['OLL 57', "R U R' U' M' U R U' r'"],
  ['Aa', "x R' U R' D2 R U' R' D2 R2 x'"],
  ['Ab', "x R2 D2 R U R' D2 R U' R x'"],
  ['E', "y x' R U' R' D R U R' D' R U R' D R U' R' D' x"],
  ['F', "y R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R"],
  ['Ga', "R2 U R' U R' U' R U' R2 D U' R' U R D'"],
  ['Gb', "R' U' R U D' R2 U R' U R U' R U' R2 D"],
  ['Gc', "R2 U' R U' R U R' U R2 D' U R U' R' D"],
  ['Gd', "R U R' U' D R2 U' R U' R' U R' U R2 D'"],
  ['H', "M2 U' M2 U2 M2 U' M2"],
  ['Ja', "y R' U L' U2 R U' R' U2 R L"],
  ['Jb', "R U R' F' R U R' U' R' F R2 U' R'"],
  ['Na', "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'"],
  ['Nb', "R' U R U' R' F' U' F R U R' F R' F' R U' R"],
  ['Ra', "y R U' R' U' R U R D R' U' R D' R' U2 R'"],
  ['Rb', "R' U2 R U2 R' F R U R' U' R' F' R2"],
  ['T', "R U R' U' R' F R2 U' R' U' R U R' F'"],
  ['Ua', "y2 M2 U M U2 M' U M2"],
  ['Ub', "y2 M2 U' M U2 M' U' M2"],
  ['V', "R' U R' U' R D' R' D R' U D' R2 U' R2 D R2"],
  ['Y', "F R U' R' U' R U R' F' R U R' U' R' F R F'"],
  ['Z', "M2 U M2 U M' U2 M2 U2 M'"],
]);

/** Drop whole-cube y turns at the start and end: they only change the viewing angle. */
export function withoutYTurns(moves: readonly Move[]): Move[] {
  let first = 0;
  let last = moves.length;
  while (first < last && moves[first].base === 'y') first++;
  while (last > first && moves[last - 1].base === 'y') last--;
  return moves.slice(first, last);
}

/** Join back-to-back turns of the same layer: R' R' becomes R2, and R R' disappears. */
export function tidy(moves: readonly Move[]): Move[] {
  const out: Move[] = [];
  for (const move of moves) {
    const last = out[out.length - 1];
    if (last && last.base === move.base) {
      const turns = (last.turns + move.turns) % 4;
      out.pop();
      if (turns) out.push({ base: move.base, turns: turns as Turns });
    } else out.push(move);
  }
  return out.length === moves.length ? out : tidy(out);
}
