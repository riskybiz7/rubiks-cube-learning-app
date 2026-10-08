import type { Cube } from '../cube/types';
import { solveBeginner } from '../solver/beginner';
import { solveCfop } from '../solver/cfop';
import type { SolveResult } from '../solver/plan';
import { BEGINNER_STAGES, type StageInfo } from './beginner';
import { CFOP_STAGES, TWO_LOOK, type LastLayerChoice } from './cfop';

/** The solving methods the app teaches. */
export type Method = 'beginner' | 'cfop';

export const METHODS: readonly { method: Method; label: string }[] = [
  { method: 'beginner', label: 'Beginner (daisy)' },
  { method: 'cfop', label: 'CFOP' },
];

export const STAGES_FOR: Record<Method, readonly StageInfo[]> = {
  beginner: BEGINNER_STAGES,
  cfop: CFOP_STAGES,
};

/** Solve with a method. For CFOP, `choice` picks 2-look or full for OLL and PLL. */
export function solveWith(
  method: Method,
  cube: Cube,
  choice: LastLayerChoice = TWO_LOOK,
): SolveResult {
  return method === 'cfop' ? solveCfop(cube, choice) : solveBeginner(cube);
}
