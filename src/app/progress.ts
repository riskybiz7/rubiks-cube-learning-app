import { CFOP_ALGORITHMS, TWO_LOOK, type LastLayerChoice, type LookChoice } from '../content/cfop';
import { METHODS, STAGES_FOR, type Method } from '../content/methods';

/**
 * What the app remembers in this browser: how far you've got with each algorithm, which
 * lessons you've finished, your 2-look/full choice and your method (Beginner or CFOP). Nothing leaves the device.
 * Reading never fails: anything it can't read (an old format, a hand edit, blocked
 * storage) is skipped and the rest is kept, like a lookup that falls back to blank.
 */

export type CaseStatus = 'learning' | 'learned';

export interface Progress {
  cases: Readonly<Record<string, CaseStatus>>; // by algorithm id; no entry = not started
  lessonsDone: readonly string[]; // lessonKey(...) of each finished lesson
  lastLayer: LastLayerChoice;
  method: Method; // shared by the Learn and Solve screens and the move key
}

export const NO_PROGRESS: Progress = {
  cases: {},
  lessonsDone: [],
  lastLayer: TWO_LOOK,
  method: 'beginner',
};
export const STORAGE_KEY = 'rubiks-cube-app.progress.v1';
export type ProgressStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** The name a lesson is saved under, e.g. "beginner-3" or "cfop-5". */
export const lessonKey = (method: Method, number: number) => `${method}-${number}`;

const CASE_IDS = new Set(CFOP_ALGORITHMS.map((a) => a.id));
const LESSON_KEYS = new Set(
  METHODS.flatMap(({ method }) => STAGES_FOR[method].map((s) => lessonKey(method, s.number))),
);
const isStatus = (value: unknown): value is CaseStatus =>
  value === 'learning' || value === 'learned';
const isLook = (value: unknown): value is LookChoice => value === 'two-look' || value === 'full';
const isMethod = (value: unknown): value is Method =>
  METHODS.some((option) => option.method === value);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Read saved text. Never throws: unreadable parts fall back to "nothing saved". */
export function parseProgress(text: string | null): Progress {
  if (!text) return NO_PROGRESS;
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return NO_PROGRESS;
  }
  if (!isRecord(data)) return NO_PROGRESS;

  const cases: Record<string, CaseStatus> = {};
  if (isRecord(data.cases)) {
    for (const [id, status] of Object.entries(data.cases)) {
      if (CASE_IDS.has(id) && isStatus(status)) cases[id] = status;
    }
  }
  const lessons: unknown[] = Array.isArray(data.lessonsDone) ? data.lessonsDone : [];
  const lessonsDone = [
    ...new Set(lessons.filter((k): k is string => typeof k === 'string' && LESSON_KEYS.has(k))),
  ];
  const saved = isRecord(data.lastLayer) ? data.lastLayer : {};
  const lastLayer: LastLayerChoice = {
    oll: isLook(saved.oll) ? saved.oll : 'two-look',
    pll: isLook(saved.pll) ? saved.pll : 'two-look',
  };
  const method = isMethod(data.method) ? data.method : 'beginner';
  return { cases, lessonsDone, lastLayer, method };
}

export function loadProgress(storage: ProgressStorage | null): Progress {
  try {
    return parseProgress(storage ? storage.getItem(STORAGE_KEY) : null);
  } catch {
    return NO_PROGRESS; // e.g. storage blocked in a private window
  }
}

/** Save; returns false if this browser won't keep it. */
export function saveProgress(storage: ProgressStorage | null, progress: Progress): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

/** This browser's storage, or null if it's switched off. */
export function browserStorage(): ProgressStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Mark a card learning or learned, or clear its mark (null). */
export function withCaseStatus(p: Progress, id: string, status: CaseStatus | null): Progress {
  const cases = { ...p.cases };
  if (status) cases[id] = status;
  else delete cases[id];
  return { ...p, cases };
}

export function withLessonDone(p: Progress, key: string, done: boolean): Progress {
  const others = p.lessonsDone.filter((k) => k !== key);
  return { ...p, lessonsDone: done ? [...others, key] : others };
}

export const withLastLayer = (p: Progress, lastLayer: LastLayerChoice): Progress => ({
  ...p,
  lastLayer,
});

export const withMethod = (p: Progress, method: Method): Progress => ({ ...p, method });

/** How many of these cards are marked learning, and how many learned. */
export function countStatus(p: Progress, ids: readonly string[]) {
  return {
    learning: ids.filter((id) => p.cases[id] === 'learning').length,
    learned: ids.filter((id) => p.cases[id] === 'learned').length,
  };
}
