import { useMemo } from 'react';
import { plainMoveLabel } from '../content/cubeTurnWords';
import { STAGES_FOR, solveWith, type Method } from '../content/methods';
import { holdDescription } from '../cube/describe';
import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { formatAlgorithm, type Move } from '../cube/notation';
import type { Cube } from '../cube/types';
import { listSteps } from '../solver/plan';
import { CubePlayer } from './CubePlayer';
import { AlgorithmCard } from './LearnScreen';
import { MethodButtons } from './MethodButtons';

/**
 * Everything about the current solve that must survive switching tabs. It lives in App
 * (not in this screen), because a screen is removed when another tab is showing.
 */
export interface SolveState {
  method: Method; // Beginner or CFOP
  useEntered: boolean; // solving the entered cube (true) or a random scramble (false)
  scramble: readonly Move[];
  index: number; // which step the user is on
}

interface SolveScreenProps {
  enteredCube: Cube | null; // a checked cube from "Enter my cube", if there is one
  state: SolveState;
  onStateChange: (state: SolveState) => void;
  onNewScramble: () => void;
  onEnterCube: () => void;
}

export function SolveScreen(props: SolveScreenProps) {
  const { enteredCube, state, onStateChange, onNewScramble, onEnterCube } = props;
  const useEntered = state.useEntered && enteredCube !== null;
  const start = useMemo(
    () => (useEntered && enteredCube ? enteredCube : applyMoves(solved(), state.scramble)),
    [useEntered, enteredCube, state.scramble],
  );
  const result = useMemo(() => solveWith(state.method, start), [state.method, start]);
  const steps = useMemo(() => (result.ok ? listSteps(result.plan) : []), [result]);
  const index = Math.min(state.index, steps.length - 1);
  const current = steps[index];
  const goTo = (next: number) => onStateChange({ ...state, index: next });

  return (
    <>
      <h1>Solve my cube</h1>
      <MethodButtons
        method={state.method}
        onChange={(method) => onStateChange({ ...state, method, index: 0 })}
      />
      <div className="controls">
        <button
          className={useEntered ? 'active' : ''}
          disabled={!enteredCube}
          onClick={() => onStateChange({ ...state, useEntered: true, index: 0 })}
        >
          My entered cube
        </button>
        <button
          className={!useEntered ? 'active' : ''}
          onClick={() => onStateChange({ ...state, useEntered: false, index: 0 })}
        >
          A random scramble
        </button>
        {!useEntered && <button onClick={onNewScramble}>New scramble</button>}
      </div>
      {!enteredCube && (
        <p className="hint">
          To solve your own cube, first{' '}
          <button className="link" onClick={onEnterCube}>
            enter it
          </button>
          .
        </p>
      )}
      {!useEntered && (
        <p className="hint">
          Scramble: <code>{formatAlgorithm(state.scramble)}</code>. Do these moves on a solved cube
          (white on top, green facing you) to follow along.
        </p>
      )}

      {!result.ok && (
        <p className="error" role="alert">
          {result.error}
        </p>
      )}

      {current && (
        <>
          <ol className="stage-list">
            {STAGES_FOR[state.method].map((stage, i) => (
              <li key={stage.number} className={i === current.stageIndex ? 'current' : ''}>
                <button
                  onClick={() => {
                    const first = steps.findIndex((s) => s.stageIndex === i);
                    if (first >= 0) goTo(first);
                  }}
                >
                  {stage.number}. {stage.title}
                </button>
              </li>
            ))}
          </ol>

          <section className="lesson">
            <h2>
              Stage {current.stage.number}: {current.stage.title}
            </h2>
            <p>
              <strong>
                Step {current.stepIndex + 1} of {current.stage.steps.length}:
              </strong>{' '}
              {current.step.text}
            </p>
            {current.step.algorithmId && <AlgorithmCard id={current.step.algorithmId} />}
          </section>

          <CubePlayer
            moves={current.step.moves}
            start={current.start}
            label={plainMoveLabel}
            caption={`${holdDescription(current.start)} Copy each turn on your cube.`}
          />

          <div className="controls">
            <button disabled={index === 0} onClick={() => goTo(index - 1)}>
              ◀ Previous step
            </button>
            <button disabled={index >= steps.length - 1} onClick={() => goTo(index + 1)}>
              Next step ▶
            </button>
          </div>
          <p className="hint">
            Lost your place?{' '}
            <button className="link" onClick={onEnterCube}>
              Re-enter your cube
            </button>{' '}
            and solve from where it is now.
          </p>
        </>
      )}
    </>
  );
}
