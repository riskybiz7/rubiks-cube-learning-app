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

/** On an x, y or z row: what the beginner screens call that turn, e.g. SPIN LEFT (y). */
function BeginnerWords({ base }: { base: MoveBase }) {
  const words = CUBE_TURN_WORDS.filter((word) => word.base === base);
  if (words.length === 0) return null;
  return (
    <span className="variants">
      {' '}
      Beginner screens say{' '}
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

/** The move key: always at the bottom of the page, collapsed until tapped. */
export function MoveKey() {
  const [method, setMethod] = useState<KeyMethod>('beginner');
  const entries = keyEntries(method);
  // Only groups with at least one move for this method (e.g. no wide turns for beginners).
  const groups = MOVE_GROUPS.filter((group) => entries.some((entry) => entry.group === group));

  return (
    <details className="move-key">
      <summary>Move key: what R, U', F2 and the other letters mean</summary>
      <label className="key-method">
        Show moves for:{' '}
        <select value={method} onChange={(event) => setMethod(event.target.value as KeyMethod)}>
          {KEY_METHODS.map((option) => (
            <option key={option.method} value={option.method}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
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
                      <BeginnerWords base={entry.base} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      ))}
      {method === 'beginner' && (
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
