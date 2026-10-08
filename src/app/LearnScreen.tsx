import { useState } from 'react';
import { findAlgorithm } from '../content/algorithms';
import { plainMoveLabel } from '../content/cubeTurnWords';
import { demoLesson } from '../content/demo';
import { STAGES_FOR, type Method } from '../content/methods';
import { holdDescription } from '../cube/describe';
import { AlgorithmCard } from './AlgorithmCard';
import { CubePlayer } from './CubePlayer';
import { MethodButtons } from './MethodButtons';
import { lessonKey, withLessonDone, type Progress } from './progress';

/**
 * A lesson's algorithm cards, folded into groups when the algorithms have them (e.g. F2L).
 * The full OLL/PLL lessons group by shape (`fullGroup`) instead of by 2-look step.
 */
function AlgorithmList({ ids, fullSet }: { ids: readonly string[]; fullSet?: boolean }) {
  const algorithms = ids.map(findAlgorithm);
  const groupOf = (a: (typeof algorithms)[number]) =>
    fullSet ? (a.fullGroup ?? a.group) : a.group;
  const groups = [...new Set(algorithms.map(groupOf))];
  if (groups.every((group) => group === undefined)) {
    return (
      <>
        {ids.map((id) => (
          <AlgorithmCard key={id} id={id} />
        ))}
      </>
    );
  }
  return (
    <>
      {groups.map((group) => {
        const inGroup = algorithms.filter((a) => groupOf(a) === group);
        return (
          <details key={group} className="algorithm-group">
            <summary>
              {group} ({inGroup.length})
            </summary>
            {inGroup.map((a) => (
              <AlgorithmCard key={a.id} id={a.id} />
            ))}
          </details>
        );
      })}
    </>
  );
}

const INTRO: Record<Method, { heading: string; hint: string }> = {
  beginner: {
    heading: 'Learn: the beginner method',
    hint: 'The daisy method in 10 stages. Pick a stage to read how it works and watch an example.',
  },
  cfop: {
    heading: 'Learn: CFOP',
    hint: 'Cross, F2L, then the last layer: first in two looks for each half (OLL and PLL), then in one look each. Pick a stage to read how it works and watch an example.',
  },
};

interface LearnScreenProps {
  progress: Progress;
  onProgressChange: (progress: Progress) => void;
}

export function LearnScreen({ progress, onProgressChange }: LearnScreenProps) {
  const [method, setMethod] = useState<Method>('beginner');
  const [selected, setSelected] = useState(0);
  const stages = STAGES_FOR[method];
  const info = stages[selected];
  const demo = demoLesson(selected, method);
  const isDone = (number: number) => progress.lessonsDone.includes(lessonKey(method, number));

  return (
    <>
      <h1>{INTRO[method].heading}</h1>
      <MethodButtons
        method={method}
        onChange={(next) => {
          setMethod(next);
          setSelected(0);
        }}
      />
      <p className="hint">{INTRO[method].hint}</p>
      <ol className="stage-list">
        {stages.map((stage, i) => (
          <li key={stage.number}>
            <button className={i === selected ? 'active' : ''} onClick={() => setSelected(i)}>
              {stage.number}. {stage.title}
              {isDone(stage.number) && ' ✓'}
            </button>
          </li>
        ))}
      </ol>

      <section className="lesson">
        <h2>
          {info.number}. {info.title}
        </h2>
        <p>
          <strong>Hold:</strong> {info.hold}
        </p>
        <p>
          <strong>Goal:</strong> {info.goal}
        </p>
        <p>{info.howTo}</p>
        {info.tip && <p className="hint">Tip: {info.tip}</p>}
        <AlgorithmList ids={info.algorithmIds} fullSet={info.fullSet} />
        <label className="lesson-done">
          <input
            type="checkbox"
            checked={isDone(info.number)}
            onChange={(e) =>
              onProgressChange(
                withLessonDone(progress, lessonKey(method, info.number), e.target.checked),
              )
            }
          />{' '}
          Mark this lesson done
        </label>
      </section>

      <h2>Example</h2>
      <CubePlayer
        moves={demo.moves}
        start={demo.start}
        label={plainMoveLabel}
        caption={
          demo.moves.length > 0
            ? `${holdDescription(demo.start)} This stage took ${demo.moves.length} ${demo.moves.length === 1 ? 'move' : 'moves'} on the example cube.`
            : `${holdDescription(demo.start)} This stage is just looking; there's nothing to turn.`
        }
      />
    </>
  );
}
