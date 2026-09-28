import { MOVE_GROUPS, MOVE_KEY, READING_TIPS } from '../content/moveKey';

/** The move key: always at the bottom of the page, collapsed until tapped. */
export function MoveKey() {
  return (
    <details className="move-key">
      <summary>Move key: what R, U', F2 and the other letters mean</summary>
      <ul className="reading-tips">
        {READING_TIPS.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
      {MOVE_GROUPS.map((group) => (
        <section key={group}>
          <h3>{group}</h3>
          <table>
            <tbody>
              {MOVE_KEY.filter((entry) => entry.group === group).map((entry) => (
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
