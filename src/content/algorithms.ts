import { BEGINNER_ALGORITHMS, type Provenance } from './beginner';
import { CFOP_ALGORITHMS } from './cfop';

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
