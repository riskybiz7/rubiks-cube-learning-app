import { describe, expect, it } from 'vitest';
import { parseTestScan, scoreScan, type ScanScore, type TestScanFile } from './testScan';

/**
 * Scanner accuracy on the owner's test scans (decisions #65, #66). Skipped in normal runs. The
 * scans are gitignored, so they exist only on the owner's PC. To run it (PowerShell):
 *   $env:VITE_MEASURE = '1'; npx vitest run src/vision/measure.test.ts --silent=false
 * Files go in reference/camera-test/batch-a/ (tuning) and batch-b/ (the reported figure).
 */
const FILES = import.meta.glob<string>('/reference/camera-test/**/*.json', {
  query: '?raw',
  import: 'default',
}); // loaded only when this test runs

interface Row {
  path: string;
  batch: string;
  file: TestScanFile;
  score: ScanScore;
}

interface Totals {
  scans: number;
  squares: number;
  right: number;
  perfect: number; // scans needing no fixes
  wrong: number;
  wrongMarked: number;
}

function totalsOf(rows: readonly Row[]): Totals {
  return rows.reduce(
    (t, { score }) => ({
      scans: t.scans + 1,
      squares: t.squares + 54,
      right: t.right + score.right,
      perfect: t.perfect + (score.right === 54 ? 1 : 0),
      wrong: t.wrong + score.wrongMarked + score.wrongUnmarked,
      wrongMarked: t.wrongMarked + score.wrongMarked,
    }),
    { scans: 0, squares: 0, right: 0, perfect: 0, wrong: 0, wrongMarked: 0 },
  );
}

const line = (label: string, t: Totals) =>
  `${label}: ${t.scans} scans; squares right ${t.right} of ${t.squares} ` +
  `(${((100 * t.right) / Math.max(t.squares, 1)).toFixed(1)}%); needing no fixes ${t.perfect} of ${t.scans}; ` +
  `wrong squares marked unsure ${t.wrongMarked} of ${t.wrong}`;

describe.skipIf(!import.meta.env.VITE_MEASURE)('camera accuracy', () => {
  it('scores every saved test scan', async () => {
    const rows: Row[] = [];
    for (const [path, load] of Object.entries(FILES)) {
      const parsed = parseTestScan(await load());
      if (!parsed.ok) {
        console.log(`${path}: skipped (${parsed.error})`);
        continue;
      }
      const batch = path.split('/').slice(-2)[0];
      rows.push({ path, batch, file: parsed.file, score: scoreScan(parsed.file) });
    }
    expect(rows.length).toBeGreaterThan(0);

    for (const batch of [...new Set(rows.map((r) => r.batch))].sort()) {
      const inBatch = rows.filter((r) => r.batch === batch);
      console.log(`\n=== ${batch} ===`);
      for (const { path, file, score } of inBatch) {
        console.log(
          `${path.split('/').pop()}: ${file.camera}, ${file.light}: right ${score.right}/54, ` +
            `wrong marked ${score.wrongMarked}/${score.wrongMarked + score.wrongUnmarked}, ` +
            `passes check ${score.passesCheck}${score.slip ? ', SET ASIDE (likely scrambling slip)' : ''}`,
        );
      }
      // Slips are left out of the figures and listed on their own (decision #64).
      const counted = inBatch.filter((r) => !r.score.slip);
      const groups = [...new Set(counted.map((r) => `${r.file.camera}, ${r.file.light}`))].sort();
      const groupTotals = groups.map((g) =>
        totalsOf(counted.filter((r) => `${r.file.camera}, ${r.file.light}` === g)),
      );
      groups.forEach((g, i) => console.log(line(g, groupTotals[i])));
      const batchTotals = totalsOf(counted);
      console.log(line(`${batch} total`, batchTotals));
      console.log(`set aside as likely slips: ${inBatch.length - counted.length}`);

      // Re-foot: the group lines must add up to the batch total.
      const summed = groupTotals.reduce(
        (s, t) => ({
          scans: s.scans + t.scans,
          squares: s.squares + t.squares,
          right: s.right + t.right,
          perfect: s.perfect + t.perfect,
          wrong: s.wrong + t.wrong,
          wrongMarked: s.wrongMarked + t.wrongMarked,
        }),
        { scans: 0, squares: 0, right: 0, perfect: 0, wrong: 0, wrongMarked: 0 },
      );
      expect(summed).toEqual(batchTotals);
      expect(batchTotals.right + batchTotals.wrong).toBe(batchTotals.squares);
    }
  });
});
