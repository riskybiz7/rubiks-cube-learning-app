import { useMemo } from 'react';
import { findAlgorithm } from '../content/algorithms';
import { plainMoveLabel } from '../content/cubeTurnWords';
import { demoLesson } from '../content/demo';
import { STAGES_FOR, type Method } from '../content/methods';
import { holdDescription } from '../cube/describe';
import type { Cube } from '../cube/types';
import { CROSS_ALREADY_MADE } from '../solver/beginner';
import { ALREADY_DONE, ALREADY_SOLVED } from '../solver/plan';
import { AlgorithmCard } from './AlgorithmCard';
import { CubePlayer } from './CubePlayer';
import { MethodButtons } from './MethodButtons';
import { lessonKey, withLessonDone, withMethod, type Progress } from './progress';

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
  progress: Progress; // holds the method, shared with the Solve screen and the move key
  onProgressChange: (progress: Progress) => void;
  lesson: number; // kept in App so switching tabs doesn't lose it
  onLessonChange: (lesson: number) => void;
  enteredCube: Cube | null; // a checked cube from "Enter my cube", if there is one
  onMyCube: boolean; // show the examples on that cube (true) or on the standard example
  onOnMyCubeChange: (onMyCube: boolean) => void;
}

/** Steps that mean "nothing to do here on this cube". */
const NOTHING_TO_DO = [ALREADY_DONE, ALREADY_SOLVED, CROSS_ALREADY_MADE];

/**
 * The example for a lesson: that stage of solving your cube when asked for and possible,
 * otherwise of the standard example. (Your cube was already checked, so it always solves;
 * the fallback is only a safety net.)
 */
function lessonExample(lesson: number, method: Method, mine: Cube | null) {
  if (mine) {
    try {
      return { ...demoLesson(lesson, method, mine), isMine: true };
    } catch {
      // fall through to the standard example
    }
  }
  return { ...demoLesson(lesson, method), isMine: false };
}

export function LearnScreen(props: LearnScreenProps) {
  const { progress, onProgressChange, enteredCube, onMyCube, onOnMyCubeChange } = props;
  const method = progress.method;
  const stages = STAGES_FOR[method];
  const selected = Math.min(props.lesson, stages.length - 1);
  const info = stages[selected];
  const mine = onMyCube ? enteredCube : null;
  // Remembered, so the 3D example isn't reloaded every time something else on the page changes.
  const demo = useMemo(() => lessonExample(selected, method, mine), [selected, method, mine]);
  const isDone = (number: number) => progress.lessonsDone.includes(lessonKey(method, number));
  const where = demo.isMine ? 'your cube' : 'the example cube';
  const alreadyDone = demo.steps.some((s) => NOTHING_TO_DO.includes(s.step.text));

  return (
    <>
      <h1>{INTRO[method].heading}</h1>
      <MethodButtons
        method={method}
        onChange={(next) => {
          onProgressChange(withMethod(progress, next));
          props.onLessonChange(0);
        }}
      />
      <p className="hint">{INTRO[method].hint}</p>
      <ol className="stage-list">
        {stages.map((stage, i) => (
          <li key={stage.number}>
            <button
              className={i === selected ? 'active' : ''}
              onClick={() => props.onLessonChange(i)}
            >
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
      {enteredCube && (
        <div className="controls" role="group" aria-label="Example cube">
          <button
            className={onMyCube ? 'active' : ''}
            aria-pressed={onMyCube}
            onClick={() => onOnMyCubeChange(true)}
          >
            On my cube
          </button>
          <button
            className={!onMyCube ? 'active' : ''}
            aria-pressed={!onMyCube}
            onClick={() => onOnMyCubeChange(false)}
          >
            Standard example
          </button>
        </div>
      )}
      <CubePlayer
        moves={demo.moves}
        start={demo.start}
        label={plainMoveLabel}
        caption={
          demo.moves.length > 0
            ? `${holdDescription(demo.start)} This stage took ${demo.moves.length} ${demo.moves.length === 1 ? 'move' : 'moves'} on ${where}.`
            : alreadyDone
              ? `${holdDescription(demo.start)} This stage is already done on ${where}, so there's nothing to turn.`
              : `${holdDescription(demo.start)} This stage is just looking; there's nothing to turn.`
        }
      />
    </>
  );
}
