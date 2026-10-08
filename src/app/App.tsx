import { useEffect, useMemo, useState } from 'react';
import { solved } from '../cube/geometry';
import { randomScramble } from '../cube/scramble';
import type { Cube } from '../cube/types';
import type { KeyMethod } from '../content/moveKey';
import { blankStickers, type EditorStickers } from '../input/editorState';
import { AlgorithmsScreen } from './AlgorithmsScreen';
import { EnterCubeScreen } from './EnterCubeScreen';
import { LearnScreen } from './LearnScreen';
import { MoveKey } from './MoveKey';
import { PlayerScreen } from './PlayerScreen';
import { browserStorage, loadProgress, saveProgress } from './progress';
import { SolveScreen, type SolveState } from './SolveScreen';

type Screen = 'learn' | 'algorithms' | 'solve' | 'enter' | 'player';

const TABS: { screen: Screen; label: string }[] = [
  { screen: 'learn', label: 'Learn' },
  { screen: 'algorithms', label: 'Algorithms' },
  { screen: 'solve', label: 'Solve my cube' },
  { screen: 'enter', label: 'Enter my cube' },
  { screen: 'player', label: 'Algorithm player' },
];

export function App() {
  const [screen, setScreen] = useState<Screen>('learn');
  // Progress (card marks, lesson ticks, 2-look/full, method) is kept in this browser only.
  const storage = useMemo(browserStorage, []);
  const [progress, setProgress] = useState(() => loadProgress(storage));
  const [canSave, setCanSave] = useState(true);
  useEffect(() => {
    setCanSave(saveProgress(storage, progress));
  }, [storage, progress]);
  // Kept here (not inside each screen) so switching tabs doesn't lose anything.
  const [algorithm, setAlgorithm] = useState("R U R' U'");
  const [playerStart, setPlayerStart] = useState<Cube>(solved);
  const [isCustomStart, setIsCustomStart] = useState(false);
  const [editorStickers, setEditorStickers] = useState<EditorStickers>(blankStickers);
  const [enteredCube, setEnteredCube] = useState<Cube | null>(null);
  const [solve, setSolve] = useState<SolveState>(() => ({
    useEntered: false,
    scramble: randomScramble(),
    index: 0,
  }));
  const [learnLesson, setLearnLesson] = useState(0);
  const [learnOnMyCube, setLearnOnMyCube] = useState(true);

  // A new method (picked on either screen, or by a reset) means a different list of
  // lessons and a different solve, so both start again from the top.
  useEffect(() => {
    setLearnLesson(0);
    setSolve((current) => ({ ...current, index: 0 }));
  }, [progress.method]);

  // The move key follows the method in use: CFOP for the Algorithms screen, every move for
  // the algorithm player (it takes any notation), and the chosen method everywhere else.
  const keyMethod: KeyMethod =
    screen === 'algorithms' ? 'cfop' : screen === 'player' ? 'all' : progress.method;

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

      {!canSave && (
        <p className="hint">
          This browser isn't keeping your progress (for example, in a private window).
        </p>
      )}

      {screen === 'learn' && (
        <LearnScreen
          progress={progress}
          onProgressChange={setProgress}
          lesson={learnLesson}
          onLessonChange={setLearnLesson}
          enteredCube={enteredCube}
          onMyCube={learnOnMyCube}
          onOnMyCubeChange={setLearnOnMyCube}
        />
      )}
      {screen === 'algorithms' && (
        <AlgorithmsScreen progress={progress} onProgressChange={setProgress} />
      )}
      {screen === 'solve' && (
        <SolveScreen
          enteredCube={enteredCube}
          state={solve}
          onStateChange={setSolve}
          onNewScramble={() =>
            setSolve({ ...solve, useEntered: false, scramble: randomScramble(), index: 0 })
          }
          onEnterCube={() => setScreen('enter')}
          progress={progress}
          onProgressChange={setProgress}
        />
      )}
      {screen === 'enter' && (
        <EnterCubeScreen
          stickers={editorStickers}
          onStickersChange={setEditorStickers}
          onCubeChecked={setEnteredCube}
          onSolveCube={(cube) => {
            setEnteredCube(cube);
            setSolve({ ...solve, useEntered: true, index: 0 });
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

      {/* Always at the very bottom, whichever screen is showing. */}
      <MoveKey method={keyMethod} />
    </main>
  );
}
