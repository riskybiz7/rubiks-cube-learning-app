import { useState } from 'react';
import { CUBE_TURN_WORDS } from '../content/cubeTurnWords';
import { formatMove, type MoveBase } from '../cube/notation';
import {
  KEY_METHODS,
  keyEntries,
  MOVE_GROUPS,
  readingTips,
  type KeyMethod,
} from '../content/moveKey';

/** On an x, y or z row: what the lesson screens call that turn, e.g. SPIN LEFT (y). */
function LessonWords({ base }: { base: MoveBase }) {
  const words = CUBE_TURN_WORDS.filter((word) => word.base === base);
  if (words.length === 0) return null;
  return (
    <span className="variants">
      {' '}
      Lesson screens say{' '}
      {words.map((word, i) => (
        <span key={word.label}>
          {i > 0 && ', '}
          {word.label} (<code>{formatMove(word)}</code>)
        </span>
      ))}
      .
    </span>
  );
}

/**
 * The move key: always at the bottom of the page, collapsed until tapped. It follows the
 * method in use (chosen by App); "Show all moves" adds every other letter.
 */
export function MoveKey({ method: following }: { method: KeyMethod }) {
  const [showAll, setShowAll] = useState(false);
  const method: KeyMethod = showAll ? 'all' : following;
  const label = KEY_METHODS.find((option) => option.method === following)!.label;
  const entries = keyEntries(method);
  // Only groups with at least one move for this method (e.g. no wide turns for beginners).
  const groups = MOVE_GROUPS.filter((group) => entries.some((entry) => entry.group === group));

  return (
    <details className="move-key">
      <summary>Move key: what R, U', F2 and the other letters mean</summary>
      {following === 'all' ? (
        <p className="key-method">Showing every move: the algorithm player takes any notation.</p>
      ) : (
        <p className="key-method">
          Showing the moves for: <strong>{label}</strong>.{' '}
          <label>
            <input
              type="checkbox"
              checked={showAll}
              onChange={(event) => setShowAll(event.target.checked)}
            />{' '}
            Show all moves
          </label>
        </p>
      )}
      <ul className="reading-tips">
        {readingTips(method).map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
      {groups.map((group) => (
        <section key={group}>
          <h3>{group}</h3>
          <table>
            <tbody>
              {entries
                .filter((entry) => entry.group === group)
                .map((entry) => (
                  <tr key={entry.base}>
                    <th scope="row">
                      <code>{entry.base}</code>
                    </th>
                    <td>
                      <strong>{entry.name}.</strong> {entry.says}{' '}
                      <span className="variants">
                        Also <code>{entry.base}'</code> (other way) and <code>{entry.base}2</code>{' '}
                        (twice).
                      </span>
                      <LessonWords base={entry.base} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      ))}
      {method !== 'all' && (
        <section>
          <h3>Turning the whole cube</h3>
          <p className="hint">These move the whole cube in your hands. No layers turn.</p>
          <table>
            <tbody>
              {CUBE_TURN_WORDS.map((word) => (
                <tr key={word.label}>
                  <th scope="row">
                    <code>{word.label}</code>
                  </th>
                  <td>{word.says}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </details>
  );
}
