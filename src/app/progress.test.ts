import { describe, expect, it } from 'vitest';
import {
  NO_PROGRESS,
  STORAGE_KEY,
  countStatus,
  lessonKey,
  loadProgress,
  parseProgress,
  saveProgress,
  withCaseStatus,
  withLastLayer,
  withLessonDone,
  type ProgressStorage,
} from './progress';

/** A pretend browser storage, like a one-sheet workbook. */
function memoryStorage(): ProgressStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
}

const blocked: ProgressStorage = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
};

describe('progress', () => {
  it('saves and loads back exactly', () => {
    const storage = memoryStorage();
    let p = withCaseStatus(NO_PROGRESS, 'oll-sune', 'learned');
    p = withCaseStatus(p, 'f2l-3', 'learning');
    p = withLessonDone(p, lessonKey('beginner', 3), true);
    p = withLastLayer(p, { oll: 'full', pll: 'two-look' });
    expect(saveProgress(storage, p)).toBe(true);
    expect(loadProgress(storage)).toEqual(p);
  });

  it('starts empty when nothing is saved, the text is broken, or storage is blocked', () => {
    expect(loadProgress(memoryStorage())).toEqual(NO_PROGRESS);
    expect(parseProgress('{not json')).toEqual(NO_PROGRESS);
    expect(parseProgress('42')).toEqual(NO_PROGRESS);
    expect(parseProgress('[]')).toEqual(NO_PROGRESS);
    expect(loadProgress(blocked)).toEqual(NO_PROGRESS);
    expect(loadProgress(null)).toEqual(NO_PROGRESS);
    expect(saveProgress(blocked, NO_PROGRESS)).toBe(false);
    expect(saveProgress(null, NO_PROGRESS)).toBe(false);
  });

  it('keeps what it can read and skips the rest', () => {
    const p = parseProgress(
      JSON.stringify({
        cases: { 'oll-sune': 'learned', 'no-such-case': 'learned', 'pll-t': 'mastered' },
        lessonsDone: ['cfop-2', 'cfop-99', 7, 'cfop-2'],
        lastLayer: { oll: 'full', pll: 'sideways' },
      }),
    );
    expect(p).toEqual({
      cases: { 'oll-sune': 'learned' },
      lessonsDone: ['cfop-2'],
      lastLayer: { oll: 'full', pll: 'two-look' },
    });
  });

  it('clearing a mark removes it, and counts add up', () => {
    let p = withCaseStatus(NO_PROGRESS, 'oll-sune', 'learned');
    p = withCaseStatus(p, 'oll-h', 'learning');
    p = withCaseStatus(p, 'oll-h', null);
    expect(p.cases).toEqual({ 'oll-sune': 'learned' });
    expect(countStatus(p, ['oll-sune', 'oll-h', 'oll-pi'])).toEqual({ learning: 0, learned: 1 });
  });

  it('ticking and unticking a lesson', () => {
    const key = lessonKey('cfop', 5);
    const done = withLessonDone(NO_PROGRESS, key, true);
    expect(withLessonDone(done, key, true).lessonsDone).toEqual([key]);
    expect(withLessonDone(done, key, false).lessonsDone).toEqual([]);
  });

  it('never changes the progress it was given', () => {
    const before = JSON.stringify(NO_PROGRESS);
    withCaseStatus(NO_PROGRESS, 'oll-sune', 'learned');
    withLessonDone(NO_PROGRESS, 'cfop-1', true);
    withLastLayer(NO_PROGRESS, { oll: 'full', pll: 'full' });
    expect(JSON.stringify(NO_PROGRESS)).toBe(before);
  });

  it('uses one versioned storage entry', () => {
    const storage = memoryStorage();
    saveProgress(storage, NO_PROGRESS);
    expect([...storage.data.keys()]).toEqual([STORAGE_KEY]);
    expect(STORAGE_KEY).toMatch(/\.v1$/);
  });
});
