import { findAlgorithm } from '../content/algorithms';
import { cardTitle } from '../content/cfop';

/**
 * An algorithm with a badge saying whether the owner has confirmed it yet. When the card's
 * moves differ from the version usually seen online (this app uses face turns only), that
 * version is shown underneath so the two can be matched up.
 */
export function AlgorithmCard({ id }: { id: string }) {
  const algorithm = findAlgorithm(id);
  const confirmed = algorithm.provenance === 'owner-confirmed';
  return (
    <div className="algorithm">
      <strong>{cardTitle(algorithm)}:</strong> <code>{algorithm.moves}</code>{' '}
      <span className={`badge ${confirmed ? 'confirmed' : 'proposed'}`}>
        {confirmed ? '✓ Confirmed' : 'Proposed: check against your cube'}
      </span>
      {algorithm.usual && (
        <div className="usual">
          Usual version: <code>{algorithm.usual}</code> (written here with face turns only)
        </div>
      )}
    </div>
  );
}
