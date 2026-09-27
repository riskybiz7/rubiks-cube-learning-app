import { useEffect, useReducer, useRef, useState } from 'react';
import { formatMove, parseAlgorithm } from '../cube/notation';
import { CubeView } from '../render/CubeView';
import { Playback } from '../render/playback';

const DEFAULT_ALGORITHM = "R U R' U'";

export function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playbackRef = useRef<Playback | null>(null);
  const [, refresh] = useReducer((n: number) => n + 1, 0); // re-draw the page when playback changes
  const [text, setText] = useState(DEFAULT_ALGORITHM);
  const [msPerMove, setMsPerMove] = useState(400);
  const parsed = parseAlgorithm(text);

  // Create the 3D view once, and clean it up when the page goes away.
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

  // Load the algorithm whenever the text changes to a different valid one.
  const normalized = parsed.ok ? parsed.moves.map(formatMove).join(' ') : null;
  useEffect(() => {
    if (normalized === null) return;
    const result = parseAlgorithm(normalized);
    if (result.ok) playbackRef.current?.load(result.moves);
  }, [normalized]);

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
    <main className="app">
      <h1>Algorithm player</h1>
      <div className="cube-view" ref={containerRef} />
      <p className="hint">White on top, green facing you. Drag the cube to look around.</p>

      <label className="field">
        Algorithm
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
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
    </main>
  );
}
