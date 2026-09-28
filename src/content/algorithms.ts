import { BEGINNER_ALGORITHMS, type Provenance } from './beginner';
import { CFOP_ALGORITHMS } from './cfop';

/** What a card needs to show any algorithm, beginner or CFOP. */
export interface AlgorithmInfo {
  id: string;
  name: string;
  moves: string;
  provenance: Provenance;
  group?: string;
}

const ALL: readonly AlgorithmInfo[] = [...Object.values(BEGINNER_ALGORITHMS), ...CFOP_ALGORITHMS];

export function findAlgorithm(id: string): AlgorithmInfo {
  const found = ALL.find((a) => a.id === id);
  if (!found) throw new Error(`Unknown algorithm: ${id}`);
  return found;
}
