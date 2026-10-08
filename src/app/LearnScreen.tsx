import { useState } from 'react';
import { BEGINNER_STAGES, algorithmById } from '../content/beginner';
import { beginnerMoveLabel } from '../content/cubeTurnWords';
import { demoStage } from '../content/demo';
import { holdDescription } from '../cube/describe';
import { CubePlayer } from './CubePlayer';

/** An algorithm with a badge saying whether the owner has confirmed it yet. */
export function AlgorithmCard({ id }: { id: string }) {
  const algorithm = algorithmById(id);
  const confirmed = algorithm.provenance === 'owner-confirmed';
  return (
    <div className="algorithm">
      <strong>{algorithm.name}:</strong> <code>{algorithm.moves}</code>{' '}
      <span className={`badge ${confirmed ? 'confirmed' : 'proposed'}`}>
        {confirmed ? '✓ Confirmed' : 'Proposed: check against your cube'}
      </span>
    </div>
  );
}

export function LearnScreen() {
  const [selected, setSelected] = useState(0);
  const info = BEGINNER_STAGES[selected];
  const demo = demoStage(selected);

  return (
    <>
      <h1>Learn: the beginner method</h1>
      <p className="hint">
        The daisy method in 10 stages. Pick a stage to read how it works and watch an example.
      </p>
      <ol className="stage-list">
        {BEGINNER_STAGES.map((stage, i) => (
          <li key={stage.number}>
            <button className={i === selected ? 'active' : ''} onClick={() => setSelected(i)}>
              {stage.number}. {stage.title}
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
        {info.algorithmIds.map((id) => (
          <AlgorithmCard key={id} id={id} />
        ))}
      </section>

      <h2>Example</h2>
      <CubePlayer
        moves={demo.moves}
        start={demo.start}
        label={beginnerMoveLabel}
        caption={
          demo.moves.length > 0
            ? `${holdDescription(demo.start)} This stage took ${demo.moves.length} ${demo.moves.length === 1 ? 'move' : 'moves'} on the example cube.`
            : `${holdDescription(demo.start)} This stage is just looking; there's nothing to turn.`
        }
      />
    </>
  );
}
