import { useEffect, useRef, useState } from 'react';
import { COLOR_NAMES } from '../cube/describe';
import { STICKER_SLOTS } from '../cube/geometry';
import type { Color, Cube, Face } from '../cube/types';
import { validateStickers, type ValidationResult } from '../cube/validate';
import {
  blankStickers,
  countBlanks,
  isCenter,
  paintSticker,
  solvedStickers,
  type EditorStickers,
} from '../input/editorState';
import { NET_CELLS } from '../input/net';
import { cssColor } from '../render/colors';
import { CubeView } from '../render/CubeView';

const PALETTE: readonly Color[] = ['W', 'Y', 'G', 'B', 'R', 'O'];
const FACE_NAMES: Record<Face, string> = {
  U: 'Top',
  D: 'Bottom',
  F: 'Front',
  B: 'Back',
  L: 'Left',
  R: 'Right',
};

interface EnterCubeScreenProps {
  stickers: EditorStickers;
  onStickersChange: (stickers: EditorStickers) => void;
  onUseCube: (cube: Cube) => void;
  onSolveCube: (cube: Cube) => void;
}

export function EnterCubeScreen(props: EnterCubeScreenProps) {
  const { stickers, onStickersChange, onUseCube, onSolveCube } = props;
  const [color, setColor] = useState<Color>('W');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<CubeView | null>(null);

  // Create the 3D preview once, and clean it up when the screen goes away.
  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;
    const view = new CubeView(container);
    viewRef.current = view;
    return () => {
      viewRef.current = null;
      view.dispose();
    };
  }, []);

  // Keep the 3D preview in step with the stickers.
  useEffect(() => {
    viewRef.current?.showStickers(stickers);
  }, [stickers]);

  /** Any edit makes an earlier check out of date, so clear it. */
  function change(next: EditorStickers) {
    onStickersChange(next);
    setResult(null);
  }

  const highlighted = new Set(
    result && !result.ok ? result.problems.flatMap((p) => p.stickers) : [],
  );
  const blanks = countBlanks(stickers);

  return (
    <>
      <h1>Enter my cube</h1>
      <p className="hint">
        Hold your cube with the <strong>white center on top</strong> and the{' '}
        <strong>green center facing you</strong>. Pick a color, then tap squares to match your cube.
      </p>
      <details className="help">
        <summary>How to read each face</summary>
        <ul>
          <li>
            <strong>Front, right, back and left:</strong> keep white on top and turn the whole cube
            until that face points at you.
          </li>
          <li>
            <strong>Top:</strong> tip the cube toward you and look down at the white face, with the
            green side nearest you.
          </li>
          <li>
            <strong>Bottom:</strong> tip the cube away from you and look at the yellow face, with
            the green side at the top.
          </li>
          <li>
            Centers are filled in for you. If yours are different (for example, the center on your
            right isn't red), change them to what you really see. The check will spot swapped
            centers.
          </li>
        </ul>
      </details>

      <div
        className="net"
        aria-label="Unfolded cube: top above front; left, front, right and back in a row; bottom below front"
      >
        {NET_CELLS.map(({ slot, row, col }) => {
          const place = STICKER_SLOTS[slot];
          const current = stickers[slot];
          const classes = ['net-cell'];
          if (isCenter(slot)) classes.push('center');
          if (highlighted.has(slot)) classes.push('problem');
          return (
            <button
              key={slot}
              className={classes.join(' ')}
              style={{ gridRow: row + 1, gridColumn: col + 1, background: cssColor(current) }}
              aria-label={`${FACE_NAMES[place.face]} face, row ${place.row + 1}, column ${
                place.col + 1
              }: ${current ? COLOR_NAMES[current] : 'blank'}`}
              onClick={() => change(paintSticker(stickers, slot, color))}
            />
          );
        })}
      </div>

      <div className="palette" role="radiogroup" aria-label="Paint color">
        {PALETTE.map((c) => (
          <button
            key={c}
            role="radio"
            aria-checked={c === color}
            aria-label={COLOR_NAMES[c]}
            className={`swatch${c === color ? ' selected' : ''}`}
            style={{ background: cssColor(c) }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>

      <div className="controls">
        <button onClick={() => setResult(validateStickers(stickers))}>✔ Check my cube</button>
        <button onClick={() => change(blankStickers())}>Start over</button>
        <button onClick={() => change(solvedStickers())}>Fill as solved</button>
      </div>
      <p className="hint">
        {blanks === 0
          ? 'All 54 squares are filled in.'
          : `${blanks} ${blanks === 1 ? 'square' : 'squares'} left to fill in.`}
      </p>

      {result?.ok && (
        <div className="result ok" role="status">
          <p>✓ This is a real, solvable cube.</p>
          <div className="controls">
            <button onClick={() => onSolveCube(result.cube)}>Solve this cube</button>
            <button onClick={() => onUseCube(result.cube)}>Use in the algorithm player</button>
          </div>
        </div>
      )}
      {result && !result.ok && (
        <div className="result bad" role="alert">
          <p>This cube can't be solved as entered:</p>
          <ul>
            {result.problems.map((p, i) => (
              <li key={i}>{p.message}</li>
            ))}
          </ul>
          {highlighted.size > 0 && (
            <p className="hint">Squares to double-check are outlined in red.</p>
          )}
        </div>
      )}

      <div className="cube-view preview" ref={previewRef} />
    </>
  );
}
