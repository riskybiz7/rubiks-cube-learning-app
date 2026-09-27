import { describe, expect, it } from 'vitest';
import {
  MOVE_BASES,
  formatAlgorithm,
  formatMove,
  invertMove,
  invertMoves,
  mustParse,
  parseAlgorithm,
} from './notation';

describe('parseAlgorithm', () => {
  it('reads a simple algorithm', () => {
    expect(mustParse("R U R' U'")).toEqual([
      { base: 'R', turns: 1 },
      { base: 'U', turns: 1 },
      { base: 'R', turns: 3 },
      { base: 'U', turns: 3 },
    ]);
  });

  it("reads half turns, including the 2' spelling", () => {
    expect(mustParse("R2 U2'")).toEqual([
      { base: 'R', turns: 2 },
      { base: 'U', turns: 2 },
    ]);
  });

  it('knows every move letter', () => {
    expect(mustParse(MOVE_BASES.join(' ')).map((m) => m.base)).toEqual([...MOVE_BASES]);
  });

  it('treats Rw-style wide moves as the lowercase letter', () => {
    expect(mustParse("Rw Uw' Fw2")).toEqual([
      { base: 'r', turns: 1 },
      { base: 'u', turns: 3 },
      { base: 'f', turns: 2 },
    ]);
  });

  it('accepts algorithms pasted from websites and notes', () => {
    expect(formatAlgorithm(mustParse('(R U R’ U′)\n(F2  x)'))).toBe("R U R' U' F2 x");
    expect(formatAlgorithm(mustParse("RUR'U'"))).toBe("R U R' U'");
  });

  it('treats empty text as zero moves', () => {
    expect(mustParse('')).toEqual([]);
    expect(mustParse('   \n ')).toEqual([]);
  });

  it('explains an unknown character and where it is', () => {
    const result = parseAlgorithm('R U Q');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.index).toBe(4);
      expect(result.message).toContain('"Q"');
      expect(result.message).toContain('position 5');
    }
  });

  it('rejects a number other than 2', () => {
    expect(parseAlgorithm('R3')).toMatchObject({ ok: false, index: 1 });
  });

  it('rejects a wide marker on a letter that cannot be wide', () => {
    const result = parseAlgorithm('Mw');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('Only U R F D L B can be wide');
  });

  it('mustParse throws with the same message', () => {
    expect(() => mustParse('R U Q')).toThrow('position 5');
  });
});

describe('formatting', () => {
  it('writes moves back in standard notation', () => {
    expect(formatAlgorithm(mustParse("R U2 R' r' M2 x'"))).toBe("R U2 R' r' M2 x'");
    expect(formatMove({ base: 'S', turns: 3 })).toBe("S'");
  });

  it('writes Rw-style moves in lowercase form', () => {
    expect(formatAlgorithm(mustParse("Rw Uw'"))).toBe("r u'");
  });
});

describe('inverting', () => {
  it('reverses a single move', () => {
    expect(invertMove({ base: 'R', turns: 1 })).toEqual({ base: 'R', turns: 3 });
    expect(invertMove({ base: 'R', turns: 3 })).toEqual({ base: 'R', turns: 1 });
    expect(invertMove({ base: 'R', turns: 2 })).toEqual({ base: 'R', turns: 2 });
  });

  it('reverses an algorithm: last move first, each one undone', () => {
    expect(formatAlgorithm(invertMoves(mustParse("R U2 F'")))).toBe("F U2 R'");
  });
});
