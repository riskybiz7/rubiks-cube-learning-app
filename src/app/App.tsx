import { useState } from 'react';
import { solved } from '../cube/geometry';
import type { Cube } from '../cube/types';
import { blankStickers, type EditorStickers } from '../input/editorState';
import { EnterCubeScreen } from './EnterCubeScreen';
import { LearnScreen } from './LearnScreen';
import { PlayerScreen } from './PlayerScreen';
import { SolveScreen } from './SolveScreen';

type Screen = 'learn' | 'solve' | 'enter' | 'player';

const TABS: { screen: Screen; label: string }[] = [
  { screen: 'learn', label: 'Learn' },
  { screen: 'solve', label: 'Solve my cube' },
  { screen: 'enter', label: 'Enter my cube' },
  { screen: 'player', label: 'Algorithm player' },
];

export function App() {
  const [screen, setScreen] = useState<Screen>('learn');
  // Kept here (not inside each screen) so switching tabs doesn't lose anything.
  const [algorithm, setAlgorithm] = useState("R U R' U'");
  const [playerStart, setPlayerStart] = useState<Cube>(solved);
  const [isCustomStart, setIsCustomStart] = useState(false);
  const [editorStickers, setEditorStickers] = useState<EditorStickers>(blankStickers);
  const [enteredCube, setEnteredCube] = useState<Cube | null>(null);

  return (
    <main className="app">
      <nav className="tabs" aria-label="Screens">
        {TABS.map((tab) => (
          <button
            key={tab.screen}
            className={screen === tab.screen ? 'active' : ''}
            aria-current={screen === tab.screen ? 'page' : undefined}
            onClick={() => setScreen(tab.screen)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {screen === 'learn' && <LearnScreen />}
      {screen === 'solve' && (
        <SolveScreen
          key={enteredCube ? enteredCube.stickers.join('') : 'none'}
          enteredCube={enteredCube}
          onEnterCube={() => setScreen('enter')}
        />
      )}
      {screen === 'enter' && (
        <EnterCubeScreen
          stickers={editorStickers}
          onStickersChange={setEditorStickers}
          onSolveCube={(cube) => {
            setEnteredCube(cube);
            setScreen('solve');
          }}
          onUseCube={(cube) => {
            setPlayerStart(cube);
            setIsCustomStart(true);
            setScreen('player');
          }}
        />
      )}
      {screen === 'player' && (
        <PlayerScreen
          algorithm={algorithm}
          onAlgorithmChange={setAlgorithm}
          start={playerStart}
          isCustomStart={isCustomStart}
          onUseSolvedStart={() => {
            setPlayerStart(solved());
            setIsCustomStart(false);
          }}
        />
      )}
    </main>
  );
}
