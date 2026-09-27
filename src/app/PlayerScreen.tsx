import { useEffect, useReducer, useRef, useState } from 'react';
import { holdDescription } from '../cube/describe';
import { formatMove, parseAlgorithm } from '../cube/notation';
import type { Cube } from '../cube/types';
import { CubeView } from '../render/CubeView';
import { Playback } from '../render/playback';

interface PlayerScreenProps {
  algorithm: string;
  onAlgorithmChange: (text: string) => void;
  start: Cube; // the cube the algorithm starts from
  isCustomStart: boolean; // true when `start` is a cube the user entered
  onUseSolvedStart: () => void;
}

export function PlayerScreen(props: PlayerScreenProps) {
  const { algorithm, onAlgorithmChange, start, isCustomStart, onUseSolvedStart } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const playbackRef = useRef<Playback | null>(null);
  const [, refresh] = useReducer((n: number) => n + 1, 0); // re-draw the page when playback changes
  const [msPerMove, setMsPerMove] = useState(400);
  const parsed = parseAlgorithm(algorithm);

  // Create the 3D view once, and clean it up when the screen goes away.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const view = new CubeView(container);
    const playback = new Playback(view);
    playback.onChange = refresh;
    playbackRef.current = playback;
    return () => {
      playback.pause();
      playbackRef.current = null;
      view.dispose();
    };
  }, []);

  // Load the algorithm whenever the text changes to a different valid one, or the start cube changes.
  const normalized = parsed.ok ? parsed.moves.map(formatMove).join(' ') : null;
  useEffect(() => {
    if (normalized === null) return;
    const result = parseAlgorithm(normalized);
    if (result.ok) playbackRef.current?.load(result.moves, start);
  }, [normalized, start]);

  useEffect(() => {
    if (playbackRef.current) playbackRef.current.msPerMove = msPerMove;
  }, [msPerMove]);

  const playback = playbackRef.current;
  const position = playback?.position ?? 0;
  const busy = playback?.isBusy ?? false;
  const playing = playback?.isPlaying ?? false;
  const moves = parsed.ok ? parsed.moves : [];
  const canUse = parsed.ok && playback !== null;

  return (
    <>
      <h1>Algorithm player</h1>
      <div className="cube-view" ref={containerRef} />
      <p className="hint">
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
      </p>

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

      <ol className="move-list">
        {moves.map((move, i) => (
          <li key={i} className={i < position ? 'done' : i === position ? 'next' : ''}>
            {formatMove(move)}
          </li>
        ))}
      </ol>

      <div className="controls">
        <button onClick={() => playback?.reset()} disabled={!canUse}>
          ⏮ Reset
        </button>
        <button
          onClick={() => void playback?.stepBack()}
          disabled={!canUse || busy || playing || position === 0}
        >
          ◀ Step back
        </button>
        {playing ? (
          <button onClick={() => playback?.pause()}>⏸ Pause</button>
        ) : (
          <button
            onClick={() => void playback?.play()}
            disabled={!canUse || busy || moves.length === 0}
          >
            ▶ Play
          </button>
        )}
        <button
          onClick={() => void playback?.stepForward()}
          disabled={!canUse || busy || playing || position >= moves.length}
        >
          Step ▶
        </button>
      </div>

      <label className="field">
        Speed
        {/* Slider right = faster: the value is stored as 1100 - milliseconds per move. */}
        <input
          type="range"
          min={100}
          max={1000}
          step={50}
          value={1100 - msPerMove}
          onChange={(e) => setMsPerMove(1100 - Number(e.target.value))}
        />
      </label>
    </>
  );
}
