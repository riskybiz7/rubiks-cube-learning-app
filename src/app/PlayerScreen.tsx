import { holdDescription } from '../cube/describe';
import { parseAlgorithm } from '../cube/notation';
import type { Cube } from '../cube/types';
import { CubePlayer } from './CubePlayer';

interface PlayerScreenProps {
  algorithm: string;
  onAlgorithmChange: (text: string) => void;
  start: Cube; // the cube the algorithm starts from
  isCustomStart: boolean; // true when `start` is a cube the user entered
  onUseSolvedStart: () => void;
}

export function PlayerScreen(props: PlayerScreenProps) {
  const { algorithm, onAlgorithmChange, start, isCustomStart, onUseSolvedStart } = props;
  const parsed = parseAlgorithm(algorithm);
  // An invalid algorithm plays nothing (and stops anything already playing).
  const moves = parsed.ok ? parsed.moves : [];

  return (
    <>
      <h1>Algorithm player</h1>
      <label className="field">
        Algorithm
        <input
          value={algorithm}
          onChange={(e) => onAlgorithmChange(e.target.value)}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
      </label>
      {!parsed.ok && (
        <p className="error" role="alert">
          {parsed.message}
        </p>
      )}
      <CubePlayer
        moves={moves}
        start={start}
        caption={
          <>
            {holdDescription(start)} Drag the cube to look around.
            {isCustomStart && (
              <>
                {' '}
                Starting from the cube you entered.{' '}
                <button className="link" onClick={onUseSolvedStart}>
                  Start from solved instead
                </button>
              </>
            )}
          </>
        }
      />
    </>
  );
}
