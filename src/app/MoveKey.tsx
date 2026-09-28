import { useState } from 'react';
import {
  KEY_METHODS,
  keyEntries,
  MOVE_GROUPS,
  readingTips,
  type KeyMethod,
} from '../content/moveKey';

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
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      ))}
    </details>
  );
}
