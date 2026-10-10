import { useEffect, useRef, useState } from 'react';
import { COLOR_NAMES } from '../cube/describe';
import { STICKER_SLOTS } from '../cube/geometry';
import type { Color } from '../cube/types';
import { NET_CELLS } from '../input/net';
import { cssColor } from '../render/colors';
import type { AssembledCube } from '../vision/assemble';
import {
  GRID_FRACTION,
  grabGrid,
  pictureOf,
  startCamera,
  stopCamera,
  type CameraProblem,
} from '../vision/camera';
import { nearestColor, readFace, START_GUESSES, type Frame, type Lab } from '../vision/color';
import { SCAN_STEPS } from '../vision/guide';
import { readCube } from '../vision/pipeline';
import {
  buildTestScan,
  LIGHTS,
  newTestScramble,
  rememberedScramble,
  rememberScramble,
  scoreScan,
  type CameraKind,
  type Light,
  type ScanScore,
  type TestScanFile,
} from '../vision/testScan';
import {
  earlierFaceLike,
  HOLD_MS,
  isSteady,
  isTooDark,
  readyToTake,
  type LiveReading,
} from '../vision/watch';
import { browserStorage } from './progress';

interface ScanScreenProps {
  testMode: boolean; // ?scan=test: a scramble first, faces taken by button, the scan saved as a file
  onDone: (cube: AssembledCube) => void; // go to the review map with this cube
  onCancel: () => void; // back to entering the cube by hand
}

/** One face that has been taken: the exact pixels read, and what they read as. */
interface Captured {
  frame: Frame;
  readings: Lab[];
}

type Stage = 'intro' | 'scanning' | 'finished';
type Hint = 'still' | 'dark' | 'repeat' | 'press' | null;

const READ_EVERY_MS = 66; // about 15 readings a second
const GOT_IT_MS = 900; // how long "Got it" shows after a face is taken

const PROBLEM_TEXT: Record<CameraProblem, string> = {
  'not-secure': 'The camera only works when the app is opened from a secure (https://) address.',
  'not-allowed':
    "The camera wasn't allowed. To scan, allow the camera for this site in your browser's settings, then try again.",
  'no-camera': 'No camera was found on this device.',
  stopped: 'The camera stopped. Press Start the camera to scan again.',
  other:
    "The camera couldn't start ({detail}). If another app is using it, close that app and try again.",
};

const HINT_TEXT: Record<Exclude<Hint, null>, string> = {
  still: 'Hold still…',
  dark: "It's a bit dark. Move to more light.",
  repeat: "You've already scanned this face. If it isn't, press {button}.",
  press: 'When the face is in the grid, press {button}.', // test mode only
};

/** The guided camera scan (decisions #50, #57–#62). */
export function ScanScreen({ testMode, onDone, onCancel }: ScanScreenProps) {
  const [stage, setStage] = useState<Stage>('intro');
  const [problem, setProblem] = useState<{ problem: CameraProblem; detail: string } | null>(null);
  const [captured, setCaptured] = useState<Captured[]>([]);
  const [live, setLive] = useState<{ colors: Color[]; hint: Hint }>({ colors: [], hint: null });
  const [gotIt, setGotIt] = useState(false);
  const [kind, setKind] = useState<CameraKind>('unknown');
  // Test mode keeps its scramble until "New scramble" (decision #70).
  const [scramble, setScramble] = useState(
    () => (testMode && rememberedScramble(browserStorage())) || newTestScramble(),
  );
  // Test mode: no default, so every test scan carries the light that was really picked.
  const [light, setLight] = useState<Light | null>(null);
  const [finished, setFinished] = useState<{
    cube: AssembledCube;
    file: TestScanFile;
    score: ScanScore;
  } | null>(null);
  const [saveMessage, setSaveMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const pressedAt = useRef<number | null>(null); // when "Take it now" / "Take this face" was pressed
  const facesBefore = useRef(0);
  const takeLabel = testMode ? 'Take this face' : 'Take it now';

  useEffect(() => {
    if (testMode) rememberScramble(browserStorage(), scramble);
  }, [testMode, scramble]);

  // The camera is on only while scanning. Leaving the screen (or finishing) turns it off.
  useEffect(() => {
    if (stage !== 'scanning') return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    void startCamera().then((started) => {
      if (cancelled) {
        if ('stream' in started) stopCamera(started.stream);
        return;
      }
      if ('problem' in started) {
        setProblem(started);
        setStage('intro');
        return;
      }
      stream = started.stream;
      setKind(started.kind);
      // If the camera dies mid-scan, its last picture would freeze on screen and could be taken
      // as a face. Stop and say so instead. (Our own stopCamera doesn't fire "ended".)
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        if (cancelled) return;
        setProblem({ problem: 'stopped', detail: '' });
        setStage('intro');
      });
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        void video.play().catch(() => undefined);
      }
    });
    return () => {
      cancelled = true;
      if (stream) stopCamera(stream);
    };
  }, [stage]);

  // Read the grid about 15 times a second, and take the face when it's ready (decisions #58,
  // #69). Starts afresh after every capture or redo, so the steadiness check starts over too.
  useEffect(() => {
    if (stage !== 'scanning' || captured.length >= SCAN_STEPS.length) return;
    const canvas = document.createElement('canvas');
    const history: LiveReading[] = [];
    const earlierFaces = captured.map((c) => c.readings);
    let frameId = 0;
    let last = -Infinity;
    let taken = false;
    const tick = (time: number) => {
      frameId = requestAnimationFrame(tick);
      const video = videoRef.current;
      if (taken || !video || time - last < READ_EVERY_MS) return;
      last = time;
      const frame = grabGrid(video, canvas);
      if (!frame) return;
      const readings = readFace(frame);
      history.push({ time, readings });
      while (time - history[0].time > 2 * HOLD_MS) history.shift();

      const earlier = earlierFaceLike(readings, earlierFaces);
      // Still showing the face just taken is normal (it's time to turn the cube), so only an
      // older face counts as a repeat worth mentioning. Neither is ever taken again.
      const repeat = earlier >= 0;
      const olderRepeat = repeat && earlier < earlierFaces.length - 1;
      const dark = isTooDark(readings);
      const pressed = pressedAt.current;
      let hint: Hint;
      if (testMode) {
        // Faces are taken only by the button; until it's pressed, just warn.
        hint = pressed !== null ? 'still' : olderRepeat ? 'repeat' : dark ? 'dark' : 'press';
      } else {
        const steady = isSteady(history);
        hint = olderRepeat ? 'repeat' : repeat ? null : dark ? 'dark' : steady ? null : 'still';
      }
      setLive({ colors: readings.map((r) => nearestColor(r, START_GUESSES).color), hint });

      if (readyToTake({ manual: testMode, pressedAt: pressed, time, history, dark, repeat })) {
        pressedAt.current = null;
        taken = true;
        setCaptured((list) => [...list, { frame, readings }]);
      }
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [stage, captured]);

  // A short "Got it" after each face taken (not after Redo, which takes one away).
  useEffect(() => {
    const added = captured.length > facesBefore.current;
    facesBefore.current = captured.length;
    if (!added) {
      setGotIt(false);
      return;
    }
    setGotIt(true);
    const timer = setTimeout(() => setGotIt(false), GOT_IT_MS);
    return () => clearTimeout(timer);
  }, [captured.length]);

  // All 6 faces: work out the cube. Runs once per new list of faces (deliberately not on every
  // re-render, so onDone is never called twice).
  useEffect(() => {
    if (captured.length < SCAN_STEPS.length) return;
    const frames = captured.map((c) => c.frame);
    const cube = readCube(frames);
    if (!testMode) {
      onDone(cube);
      return;
    }
    const file = buildTestScan({
      scramble,
      light: light ?? 'other', // can't be null: test mode only starts once a light is picked
      camera: kind,
      capture: 'manual', // test mode takes faces only when the button is pressed (#69)
      device: navigator.userAgent,
      frames,
      pictures: frames.map(pictureOf),
      result: cube,
    });
    setFinished({ cube, file, score: scoreScan(file) });
    setStage('finished');
  }, [captured]);

  function startScanning() {
    setProblem(null);
    setCaptured([]);
    setFinished(null);
    setSaveMessage('');
    pressedAt.current = null;
    setStage('scanning');
  }

  function scanAnother(newScramble: boolean) {
    if (newScramble) setScramble(newTestScramble());
    setLight(null); // the light may have changed: pick it again
    setCaptured([]);
    setFinished(null);
    setSaveMessage('');
    setStage('intro');
  }

  if (stage === 'intro') {
    return (
      <>
        <h1>Scan my cube</h1>
        {problem && (
          <p className="error" role="alert">
            {PROBLEM_TEXT[problem.problem].replace('{detail}', problem.detail)}
          </p>
        )}
        <p className="hint">
          The camera reads your cube one face at a time. Hold each face so its squares sit in the
          grid. Good, even light works best; avoid a lamp shining straight at the cube. Nothing is
          recorded or sent anywhere.
        </p>
        {testMode && (
          <div className="lesson">
            <p>
              <strong>Test mode</strong> keeps the 6 pictures so you can save this scan as a file
              for measuring the scanner.
            </p>
            <ol>
              <li>Start from a solved cube, held with white on top and green facing you.</li>
              <li>
                Do these moves: <code>{scramble}</code>{' '}
                <button onClick={() => setScramble(newTestScramble())}>New scramble</button>
                <br />
                <span className="hint">
                  This scramble stays until you press New scramble. If your cube already has it from
                  your last scan, skip steps 1 and 2.
                </span>
              </li>
              <li>Pick the light:</li>
            </ol>
            <div className="controls" role="radiogroup" aria-label="Light">
              {LIGHTS.map((l) => (
                <button
                  key={l}
                  role="radio"
                  aria-checked={l === light}
                  className={l === light ? 'active' : ''}
                  onClick={() => setLight(l)}
                >
                  {l}
                </button>
              ))}
            </div>
            <p>
              Then press Start the camera. For each face, line it up in the grid and press{' '}
              <strong>📷 Take this face</strong>. The camera never takes a face by itself in test
              mode.
            </p>
          </div>
        )}
        <div className="controls">
          <button onClick={startScanning} disabled={testMode && light === null}>
            📷 Start the camera
          </button>
          <button onClick={onCancel}>Enter by hand instead</button>
        </div>
        {testMode && light === null && <p className="hint">Pick the light first.</p>}
      </>
    );
  }

  if (stage === 'finished' && finished) {
    const { score, file, cube } = finished;
    const wrong = score.wrongMarked + score.wrongUnmarked;
    return (
      <>
        <h1>Test scan done</h1>
        <p>
          The camera read {score.right} of 54 squares right.
          {wrong > 0 && ` ${score.wrongMarked} of the ${wrong} wrong squares were marked unsure.`}
        </p>
        {score.slip && (
          <p className="hint">
            This looks like a different real cube from the scramble, probably a slip while
            scrambling. Save it anyway; it will be listed separately.
          </p>
        )}
        <p className="hint">Please save every test scan, good or bad.</p>
        <div className="controls">
          <button onClick={() => setSaveMessage(downloadScan(file))}>Download test scan</button>
          {canShareFiles() && (
            <button
              onClick={() =>
                void shareScan(file).then((message) => message && setSaveMessage(message))
              }
            >
              Share test scan…
            </button>
          )}
          <button onClick={() => onDone(cube)}>Review on the map</button>
          <button onClick={() => scanAnother(false)}>Scan again, same scramble</button>
          <button onClick={() => scanAnother(true)}>Scan again, new scramble</button>
        </div>
        {saveMessage && <p className="hint">{saveMessage}</p>}
      </>
    );
  }

  // Scanning.
  const stepIndex = Math.min(captured.length, SCAN_STEPS.length - 1);
  const step = SCAN_STEPS[stepIndex];
  const mirrored = kind !== 'back';
  const gridStart = (100 * (1 - GRID_FRACTION)) / 2;
  const cell = (100 * GRID_FRACTION) / 3;
  const lines = [1, 2].map((i) => gridStart + i * cell);

  return (
    <>
      <h1>Scan my cube</h1>
      <h2>
        Face {stepIndex + 1} of {SCAN_STEPS.length}
      </h2>
      <p className="lesson">
        <span className="color-chip" style={{ background: cssColor(step.center) }} />
        {step.says}
      </p>

      <div className="scan-view">
        <video ref={videoRef} className={mirrored ? 'mirrored' : ''} playsInline muted autoPlay />
        <svg viewBox="0 0 100 100" aria-hidden="true">
          {[3, 1.2].map((width, pass) => (
            <g
              key={pass}
              stroke={pass === 0 ? 'rgba(0,0,0,0.6)' : '#fff'}
              strokeWidth={width * 0.4}
              fill="none"
            >
              <rect x={gridStart} y={gridStart} width={3 * cell} height={3 * cell} rx={1.5} />
              {lines.map((at) => (
                <g key={at}>
                  <line x1={at} y1={gridStart} x2={at} y2={gridStart + 3 * cell} />
                  <line x1={gridStart} y1={at} x2={gridStart + 3 * cell} y2={at} />
                </g>
              ))}
            </g>
          ))}
          {live.colors.map((color, k) => {
            // Readings are in camera order; a mirrored view shows each column on the other side.
            const col = mirrored ? 2 - (k % 3) : k % 3;
            const row = Math.floor(k / 3);
            return (
              <circle
                key={k}
                cx={gridStart + (col + 0.5) * cell}
                cy={gridStart + (row + 0.5) * cell}
                r={3.2}
                fill={cssColor(color)}
                stroke="#fff"
                strokeWidth={0.8}
              />
            );
          })}
        </svg>
      </div>

      <p className="scan-status" role="status">
        {gotIt ? 'Got it ✓' : live.hint ? HINT_TEXT[live.hint].replace('{button}', takeLabel) : ''}
      </p>

      <div className="controls">
        <button onClick={() => (pressedAt.current = performance.now())}>
          {testMode ? `📷 ${takeLabel}` : takeLabel}
        </button>
        {captured.length > 0 && (
          <button
            onClick={() => {
              pressedAt.current = null;
              setCaptured((list) => list.slice(0, -1));
            }}
          >
            Redo last face
          </button>
        )}
        <button onClick={onCancel}>Cancel</button>
      </div>

      <div className="net scan-map" aria-label="Faces scanned so far">
        {NET_CELLS.map(({ slot, row, col }) => {
          const faceStep = SCAN_STEPS.findIndex((s) => s.face === STICKER_SLOTS[slot].face);
          const reading = captured[faceStep]?.readings[slot % 9];
          const color = reading ? nearestColor(reading, START_GUESSES).color : null;
          const classes = ['net-cell'];
          if (faceStep === captured.length) classes.push('current');
          return (
            <div
              key={slot}
              className={classes.join(' ')}
              style={{ gridRow: row + 1, gridColumn: col + 1, background: cssColor(color) }}
              title={color ? COLOR_NAMES[color] : undefined}
            />
          );
        })}
      </div>
    </>
  );
}

function scanFileName(file: TestScanFile): string {
  // savedAt is like 2026-10-09T15:32:07.123Z → 2026-10-09-1532 (UTC).
  const stamp = file.savedAt.slice(0, 16).replace('T', '-').replace(':', '');
  return `scan-${stamp}-${file.light}-${file.camera}.json`;
}

function scanAsFile(file: TestScanFile): File {
  return new File([JSON.stringify(file)], scanFileName(file), { type: 'application/json' });
}

function canShareFiles(): boolean {
  try {
    const probe = new File(['{}'], 'probe.json', { type: 'application/json' });
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

/** Saves the scan through the browser's download (iPhone: Files › Downloads). */
function downloadScan(file: TestScanFile): string {
  const blob = scanAsFile(file);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = blob.name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return `Downloaded ${blob.name}.`;
}

/** Opens the share sheet (Mail, Save to Files, …). A cancelled share is not an error. */
async function shareScan(file: TestScanFile): Promise<string | null> {
  try {
    await navigator.share({ files: [scanAsFile(file)] });
    return 'Shared.';
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return null;
    return "Sharing didn't work here. Try Download instead.";
  }
}
