import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { invertMoves, mustParse } from '../cube/notation';
import type { Cube } from '../cube/types';
import { BEGINNER_ALGORITHMS, type BeginnerAlgorithm, type Provenance } from './beginner';
import { CASE_HOME, CFOP_ALGORITHMS } from './cfop';

/** What a card needs to show any algorithm, beginner or CFOP. */
export interface AlgorithmInfo {
  id: string;
  name: string;
  moves: string;
  provenance: Provenance;
  group?: string;
  number?: number; // OLL 1-57
  fullGroup?: string; // group in full OLL/PLL, for a shared 2-look card
  usual?: string; // SpeedCubeDB's standard version, when this card's differs
}

const ALL: readonly AlgorithmInfo[] = [...Object.values(BEGINNER_ALGORITHMS), ...CFOP_ALGORITHMS];

export function findAlgorithm(id: string): AlgorithmInfo {
  const found = ALL.find((a) => a.id === id);
  if (!found) throw new Error(`Unknown algorithm: ${id}`);
  return found;
}

/** The beginner method's algorithms, in stage order, for the Algorithms screen. */
export const BEGINNER_CARDS: readonly BeginnerAlgorithm[] = Object.values(BEGINNER_ALGORITHMS).sort(
  (a, b) => a.stage - b.stage,
);

const beginnerStage = new Map(BEGINNER_CARDS.map((a) => [a.id, a.stage]));

/**
 * The cube a card starts from: undo its algorithm from a solved cube, held the way it's
 * used. CFOP and beginner stages 5-10: yellow on top. Beginner stages 2-4 are done white
 * on top. For algorithms you repeat (like R' D' R D), this is one round's case.
 */
export function caseStart(id: string): Cube {
  const { moves } = findAlgorithm(id);
  const stage = beginnerStage.get(id);
  const home = stage !== undefined && stage <= 4 ? solved() : CASE_HOME;
  return applyMoves(home, invertMoves(mustParse(moves)));
}
