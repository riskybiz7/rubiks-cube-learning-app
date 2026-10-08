import { useMemo, useState } from 'react';
import { BEGINNER_CARDS, caseStart, findAlgorithm } from '../content/algorithms';
import { BEGINNER_STAGES } from '../content/beginner';
import {
  GROUPS,
  cardTitle,
  groupIn,
  inSet,
  type CfopAlgorithm,
  type CfopSet,
} from '../content/cfop';
import { CFOP_TERMS, SET_DESCRIPTIONS, TWO_LOOK_VS_FULL } from '../content/cfopTerms';
import type { Method } from '../content/methods';
import { holdDescription } from '../cube/describe';
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

/** The CFOP sets you can browse, in the order you'd learn them. */
const SETS: readonly { set: CfopSet; label: string }[] = [
  { set: 'F2L', label: 'F2L' },
  { set: 'OLL-2LOOK', label: '2-look OLL' },
  { set: 'PLL-2LOOK', label: '2-look PLL' },
  { set: 'OLL', label: 'Full OLL' },
  { set: 'PLL', label: 'Full PLL' },
];

/** How a set's case diagrams are drawn (F2L and beginner cards have none: D7). */
function diagramStyle(a: CfopAlgorithm, set: CfopSet): DiagramStyle | null {
  if (set === 'F2L') return null;
  if (set === 'PLL' || set === 'PLL-2LOOK') return 'pll';
  // The first 2-look step only looks at the edges, so its diagrams show only those.
  return a.group === GROUPS.ollEdges ? 'oll-edges' : 'oll';
}

/** One card on the screen, beginner or CFOP. */
interface Card {
  id: string;
  title: string;
  group: string;
  style: DiagramStyle | null;
}

function cardsFor(method: Method, set: CfopSet): Card[] {
  if (method === 'beginner') {
    return BEGINNER_CARDS.map((a) => ({
      id: a.id,
      title: a.name,
      group: `Stage ${a.stage}: ${BEGINNER_STAGES[a.stage - 1].title}`,
      style: null,
    }));
  }
  return inSet(set).map((a) => ({
    id: a.id,
    title: cardTitle(a),
    group: groupIn(a, set),
    style: diagramStyle(a, set),
  }));
}

/** What F2L, OLL, PLL, 2-look and full mean, for someone new to CFOP. */
function CfopTerms() {
  return (
    <details className="help" open>
      <summary>What do F2L, OLL, PLL and 2-look mean?</summary>
      <dl className="terms">
        {CFOP_TERMS.map((t) => (
          <div key={t.term}>
            <dt>
              {t.term} ({t.standsFor})
            </dt>
            <dd>{t.meaning}</dd>
          </div>
        ))}
      </dl>
      <p>{TWO_LOOK_VS_FULL.twoLook}</p>
      <p>{TWO_LOOK_VS_FULL.full}</p>
      <p className="hint">{TWO_LOOK_VS_FULL.advice}</p>
    </details>
  );
}

const REPEAT_NOTE = " For algorithms you repeat (like R' D' R D), this shows one round.";

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
  progress: Progress; // holds the method: the screen shows that method's algorithms
  onProgressChange: (progress: Progress) => void;
}

export function AlgorithmsScreen({ progress, onProgressChange }: AlgorithmsScreenProps) {
  const [set, setSet] = useState<CfopSet>('F2L');
  const [filter, setFilter] = useState<Filter>('all');
  const [watching, setWatching] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const method = progress.method;

  const cards = cardsFor(method, set);
  const counts = countStatus(
    progress,
    cards.map((c) => c.id),
  );
  const statusOf = (c: Card): CaseStatus | null => progress.cases[c.id] ?? null;
  const shown = cards.filter((c) =>
    filter === 'all' ? true : filter === 'none' ? statusOf(c) === null : statusOf(c) === filter,
  );
  const groups = [...new Set(shown.map((c) => c.group))];

  // One 3D player for the whole screen (D8): browsers allow only a few live 3D views.
  const watched = cards.find((c) => c.id === watching) ?? cards[0];
  const start = useMemo(() => caseStart(watched.id), [watched.id]);
  const moves = useMemo(() => mustParse(findAlgorithm(watched.id).moves), [watched.id]);

  return (
    <>
      <h1>Algorithms: {method === 'cfop' ? 'CFOP' : 'the beginner method'}</h1>
      {method === 'beginner' ? (
        <p className="hint">
          The {cards.length} algorithms of your beginner method, by stage. Mark them as you learn
          them, and press Watch to see one fix its case. To see the CFOP algorithms, choose CFOP on
          the Learn or Solve screen.
        </p>
      ) : (
        <>
          <CfopTerms />
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
          <p className="hint">{SET_DESCRIPTIONS[set]}</p>
        </>
      )}
      <p className="hint">
        Learned {counts.learned} of {cards.length} · learning {counts.learning}. Marks are saved in
        this browser only.
      </p>

      <h2>Watching: {watched.title}</h2>
      <CubePlayer
        moves={moves}
        start={start}
        caption={`${holdDescription(start)} The cube starts in this case and the algorithm fixes it.${
          method === 'beginner' ? REPEAT_NOTE : ''
        }`}
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
        const inGroup = shown.filter((c) => c.group === group);
        return (
          <details key={group} className="algorithm-group" open>
            <summary>
              {group} ({inGroup.length})
            </summary>
            <div className="case-grid">
              {inGroup.map((a) => {
                return (
                  <div key={a.id} className={`case-card ${statusOf(a) ?? ''}`}>
                    {a.style && (
                      <CaseDiagram
                        cube={caseStart(a.id)}
                        style={a.style}
                        label={`Top view of ${a.title}`}
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
