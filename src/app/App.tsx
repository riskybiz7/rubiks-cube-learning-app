import { useState } from 'react';
import { solved } from '../cube/geometry';
import type { Cube } from '../cube/types';
import { blankStickers, type EditorStickers } from '../input/editorState';
import { EnterCubeScreen } from './EnterCubeScreen';
import { PlayerScreen } from './PlayerScreen';

type Screen = 'player' | 'enter';

export function App() {
  const [screen, setScreen] = useState<Screen>('player');
  // Kept here (not inside each screen) so switching tabs doesn't lose anything.
  const [algorithm, setAlgorithm] = useState("R U R' U'");
  const [start, setStart] = useState<Cube>(solved);
  const [isCustomStart, setIsCustomStart] = useState(false);
  const [editorStickers, setEditorStickers] = useState<EditorStickers>(blankStickers);

  return (
    <main className="app">
      <nav className="tabs" aria-label="Screens">
        <button
          className={screen === 'player' ? 'active' : ''}
          aria-current={screen === 'player' ? 'page' : undefined}
          onClick={() => setScreen('player')}
        >
          Algorithm player
        </button>
        <button
          className={screen === 'enter' ? 'active' : ''}
          aria-current={screen === 'enter' ? 'page' : undefined}
          onClick={() => setScreen('enter')}
        >
          Enter my cube
        </button>
      </nav>

      {screen === 'player' ? (
        <PlayerScreen
          algorithm={algorithm}
          onAlgorithmChange={setAlgorithm}
          start={start}
          isCustomStart={isCustomStart}
          onUseSolvedStart={() => {
            setStart(solved());
            setIsCustomStart(false);
          }}
        />
      ) : (
        <EnterCubeScreen
          stickers={editorStickers}
          onStickersChange={setEditorStickers}
          onUseCube={(cube) => {
            setStart(cube);
            setIsCustomStart(true);
            setScreen('player');
          }}
        />
      )}
    </main>
  );
}
