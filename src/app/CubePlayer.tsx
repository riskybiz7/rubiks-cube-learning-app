import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { formatAlgorithm, formatMove, type Move } from '../cube/notation';
import type { Cube } from '../cube/types';
import { CubeView } from '../render/CubeView';
import { Playback } from '../render/playback';

interface CubePlayerProps {
  moves: readonly Move[];
  start: Cube;
  caption?: ReactNode;
}

/** A 3D cube that plays a list of moves from a starting cube, with play/pause/step/speed. */
export function CubePlayer({ moves, start, caption }: CubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playbackRef = useRef<Playback | null>(null);
  const [, refresh] = useReducer((n: number) => n + 1, 0); // re-draw when playback changes
  const [msPerMove, setMsPerMove] = useState(400);

  // Create the 3D view once, starting from the right cube, and clean it up afterwards.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const view = new CubeView(container);
    const playback = new Playback(view, start);
    playback.msPerMove = msPerMove;
    playback.onChange = refresh;
    playbackRef.current = playback;
    return () => {
      playback.pause();
      playbackRef.current = null;
      view.dispose();
    };
    // Created once; later changes arrive through the effects below.
  }, []);

  // Reload whenever the moves or the starting cube change.
  const movesKey = formatAlgorithm(moves);
  useEffect(() => {
    playbackRef.current?.load(moves, start);
  }, [movesKey, start]);

  useEffect(() => {
    if (playbackRef.current) playbackRef.current.msPerMove = msPerMove;
  }, [msPerMove]);

  const playback = playbackRef.current;
  const position = playback?.position ?? 0;
  const busy = playback?.isBusy ?? false;
  const playing = playback?.isPlaying ?? false;
  const ready = playback !== null;

  return (
    <div className="cube-player">
      <div className="cube-view" ref={containerRef} />
      {caption && <p className="hint">{caption}</p>}
      {moves.length > 0 && (
        <ol className="move-list">
          {moves.map((move, i) => (
            <li key={i} className={i < position ? 'done' : i === position ? 'next' : ''}>
              {formatMove(move)}
            </li>
          ))}
        </ol>
      )}
      <div className="controls">
        <button onClick={() => playback?.reset()} disabled={!ready}>
          ⏮ Reset
        </button>
        <button
          onClick={() => void playback?.stepBack()}
          disabled={!ready || busy || playing || position === 0}
        >
          ◀ Step back
        </button>
        {playing ? (
          <button onClick={() => playback?.pause()}>⏸ Pause</button>
        ) : (
          <button
            onClick={() => void playback?.play()}
            disabled={!ready || busy || moves.length === 0}
          >
            ▶ Play
          </button>
        )}
        <button
          onClick={() => void playback?.stepForward()}
          disabled={!ready || busy || playing || position >= moves.length}
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
    </div>
  );
}
