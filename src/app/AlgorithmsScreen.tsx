import { useMemo, useState } from 'react';
import {
  GROUPS,
  cardTitle,
  caseCube,
  groupIn,
  inSet,
  type CfopAlgorithm,
  type CfopSet,
} from '../content/cfop';
import { mustParse } from '../cube/notation';
import { AlgorithmCard } from './AlgorithmCard';
import { CaseDiagram, type DiagramStyle } from './CaseDiagram';
import { CubePlayer } from './CubePlayer';
import {
  NO_PROGRESS,
  countStatus,
  withCaseStatus,
  type CaseStatus,
  type Progress,
} from './progress';

/** The sets you can browse, and how their case diagrams are drawn (F2L has none: D7). */
const SETS: readonly { set: CfopSet; label: string }[] = [
  { set: 'F2L', label: 'F2L' },
  { set: 'OLL', label: 'OLL' },
  { set: 'PLL', label: 'PLL' },
  { set: 'OLL-2LOOK', label: '2-look OLL' },
  { set: 'PLL-2LOOK', label: '2-look PLL' },
];

function diagramStyle(a: CfopAlgorithm, set: CfopSet): DiagramStyle | null {
  if (set === 'F2L') return null;
  if (set === 'PLL' || set === 'PLL-2LOOK') return 'pll';
  // The first 2-look step only looks at the edges, so its diagrams show only those.
  return a.group === GROUPS.ollEdges ? 'oll-edges' : 'oll';
}

type Filter = 'all' | 'none' | CaseStatus;
const FILTERS: readonly { filter: Filter; label: string }[] = [
  { filter: 'all', label: 'All' },
  { filter: 'none', label: 'Not started' },
  { filter: 'learning', label: 'Learning' },
  { filter: 'learned', label: 'Learned' },
];

const STATUSES: readonly { status: CaseStatus | null; label: string }[] = [
  { status: null, label: 'Not started' },
  { status: 'learning', label: 'Learning' },
  { status: 'learned', label: 'Learned' },
];

interface AlgorithmsScreenProps {
  progress: Progress;
  onProgressChange: (progress: Progress) => void;
}

export function AlgorithmsScreen({ progress, onProgressChange }: AlgorithmsScreenProps) {
  const [set, setSet] = useState<CfopSet>('OLL');
  const [filter, setFilter] = useState<Filter>('all');
  const [watching, setWatching] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const cards = inSet(set);
  const counts = countStatus(
    progress,
    cards.map((a) => a.id),
  );
  const statusOf = (a: CfopAlgorithm): CaseStatus | null => progress.cases[a.id] ?? null;
  const shown = cards.filter((a) =>
    filter === 'all' ? true : filter === 'none' ? statusOf(a) === null : statusOf(a) === filter,
  );
  const groups = [...new Set(shown.map((a) => groupIn(a, set)))];

  // One 3D player for the whole screen (D8): browsers allow only a few live 3D views.
  const watched = cards.find((a) => a.id === watching) ?? cards[0];
  const start = useMemo(() => caseCube(watched.moves), [watched.moves]);
  const moves = useMemo(() => mustParse(watched.moves), [watched.moves]);

  return (
    <>
      <h1>Algorithms</h1>
      <div className="controls" role="group" aria-label="Algorithm set">
        {SETS.map((option) => (
          <button
            key={option.set}
            className={set === option.set ? 'active' : ''}
            aria-pressed={set === option.set}
            onClick={() => {
              setSet(option.set);
              setWatching(null);
            }}
          >
            {option.label} ({inSet(option.set).length})
          </button>
        ))}
      </div>
      <p className="hint">
        Learned {counts.learned} of {cards.length} · learning {counts.learning}. Marks are saved in
        this browser only.
      </p>

      <h2>Watching: {cardTitle(watched)}</h2>
      <CubePlayer
        moves={moves}
        start={start}
        caption="Yellow on top, green facing you. The cube starts in this case and the algorithm solves it."
      />

      <div className="controls" role="group" aria-label="Show">
        {FILTERS.map((option) => (
          <button
            key={option.filter}
            className={filter === option.filter ? 'active' : ''}
            aria-pressed={filter === option.filter}
            onClick={() => setFilter(option.filter)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {shown.length === 0 && <p className="hint">No cards here yet.</p>}
      {groups.map((group) => {
        const inGroup = shown.filter((a) => groupIn(a, set) === group);
        return (
          <details key={group} className="algorithm-group" open>
            <summary>
              {group} ({inGroup.length})
            </summary>
            <div className="case-grid">
              {inGroup.map((a) => {
                const style = diagramStyle(a, set);
                return (
                  <div key={a.id} className={`case-card ${statusOf(a) ?? ''}`}>
                    {style && (
                      <CaseDiagram
                        cube={caseCube(a.moves)}
                        style={style}
                        label={`Top view of ${cardTitle(a)}`}
                      />
                    )}
                    <AlgorithmCard id={a.id} />
                    <div className="controls status" role="group" aria-label="How well you know it">
                      {STATUSES.map(({ status, label }) => (
                        <button
                          key={label}
                          className={statusOf(a) === status ? 'active' : ''}
                          aria-pressed={statusOf(a) === status}
                          onClick={() => onProgressChange(withCaseStatus(progress, a.id, status))}
                        >
                          {label}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setWatching(a.id);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        Watch
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        );
      })}

      <div className="controls">
        {confirmReset ? (
          <>
            <span>Really reset all your progress (marks, lesson ticks and choices)?</span>
            <button
              onClick={() => {
                onProgressChange(NO_PROGRESS);
                setConfirmReset(false);
              }}
            >
              Yes, reset
            </button>
            <button onClick={() => setConfirmReset(false)}>No</button>
          </>
        ) : (
          <button onClick={() => setConfirmReset(true)}>Reset my progress</button>
        )}
      </div>
    </>
  );
}
