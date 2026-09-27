import { useEffect, useMemo, useState } from 'react';
import { BEGINNER_STAGES } from '../content/beginner';
import { holdDescription } from '../cube/describe';
import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { formatAlgorithm, type Move } from '../cube/notation';
import { randomScramble } from '../cube/scramble';
import type { Cube } from '../cube/types';
import { listSteps, solveBeginner } from '../solver/beginner';
import { CubePlayer } from './CubePlayer';
import { AlgorithmCard } from './LearnScreen';

interface SolveScreenProps {
  enteredCube: Cube | null; // a checked cube from "Enter my cube", if there is one
  onEnterCube: () => void;
}

export function SolveScreen({ enteredCube, onEnterCube }: SolveScreenProps) {
  const [useEntered, setUseEntered] = useState(enteredCube !== null);
  const [scramble, setScramble] = useState<Move[]>(() => randomScramble());
  const start = useMemo(
    () => (useEntered && enteredCube ? enteredCube : applyMoves(solved(), scramble)),
    [useEntered, enteredCube, scramble],
  );
  const result = useMemo(() => solveBeginner(start), [start]);
  const steps = useMemo(() => (result.ok ? listSteps(result.plan) : []), [result]);
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [steps]); // a new cube starts again at the first step

  const current = steps[Math.min(index, steps.length - 1)];

  return (
    <>
      <h1>Solve my cube</h1>
      <div className="controls">
        <button
          className={useEntered ? 'active' : ''}
          disabled={!enteredCube}
          onClick={() => setUseEntered(true)}
        >
          My entered cube
        </button>
        <button className={!useEntered ? 'active' : ''} onClick={() => setUseEntered(false)}>
          A random scramble
        </button>
        {!useEntered && <button onClick={() => setScramble(randomScramble())}>New scramble</button>}
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
          Scramble: <code>{formatAlgorithm(scramble)}</code>. Do these moves on a solved cube (white
          on top, green facing you) to follow along.
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
            {BEGINNER_STAGES.map((stage, i) => (
              <li key={stage.number} className={i === current.stageIndex ? 'current' : ''}>
                <button onClick={() => setIndex(steps.findIndex((s) => s.stageIndex === i))}>
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
            caption={`${holdDescription(current.start)} Copy each turn on your cube.`}
          />

          <div className="controls">
            <button disabled={index === 0} onClick={() => setIndex(index - 1)}>
              ◀ Previous step
            </button>
            <button disabled={index >= steps.length - 1} onClick={() => setIndex(index + 1)}>
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
