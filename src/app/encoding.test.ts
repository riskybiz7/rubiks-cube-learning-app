import { describe, expect, it } from 'vitest';

/**
 * Text that was saved in the wrong encoding turns "◀" into "â—€" and "é" into "Ã©".
 * Windows PowerShell 5.1 does this easily, so check every source file for the tell-tale
 * pairs ("â€", "â—", "â–", "Ã"). Vite reads the files for us (import.meta.glob, as text).
 */
const GARBLED = /â€|â—|â–|Ã/;
const SOURCES = import.meta.glob<string>('/src/**/*.{ts,tsx,css}', {
  query: '?raw',
  import: 'default',
  eager: true,
});

describe('source text', () => {
  it('has no garbled characters from a wrong encoding', () => {
    const files = Object.keys(SOURCES).filter((file) => !file.endsWith('encoding.test.ts')); // this file shows the pairs
    expect(files.length).toBeGreaterThan(50);
    expect(files.filter((file) => GARBLED.test(SOURCES[file]))).toEqual([]);
  });
});
