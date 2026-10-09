# Camera test scans (phase ④)

Scanner accuracy is reported **only** from scans measured here (decisions #63–#66). The scan
files stay on this PC: everything in this folder except this README is gitignored. Only the
results get published.

## Taking a test scan

1. Open the app with `?scan=test` at the end of the address, for example
   https://riskybiz7.github.io/rubiks-cube-learning-app/?scan=test. Go to **Enter my cube**,
   then press **Scan with camera**.
2. Start from a **solved** cube. Hold it with white on top and green facing you, and do the
   moves the screen shows (a 15-move scramble).
3. Pick the light: daylight, lamp, dim or other.
4. Scan the 6 faces as the screen guides you.
5. Press **Save test scan**.
   - **iPhone:** the share sheet opens. Choose Save to Files or Mail, and get the file to the PC.
   - **Computer:** the file downloads.
6. Put the file in `batch-a/` or `batch-b/` here.

**Save every scan, good or bad.** Dropping the bad ones would flatter the result.

## What's in a batch (decision #65)

8 scans, each from a new scramble:

| Camera | Daylight | Lamp | Dim |
|---|---|---|---|
| iPhone back camera | 2 | 2 | 2 |
| PC webcam | 1 | 1 | – |

- **Batch A** is for tuning the scanner.
- **Batch B** is taken after tuning is frozen, and gives the reported figure. If tuning changes
  after batch B is measured, a new batch is needed for any reported figure.

## Measuring (PowerShell, from the project root)

```powershell
$env:VITE_MEASURE = '1'; npx vitest run src/vision/measure.test.ts --silent=false
```

It re-runs today's scanner on the saved pixels, so tuning re-scores old scans. The truth comes
from each file's scramble. A scan whose answer is a real cube but not the scrambled one is set
aside as a likely scrambling slip and listed separately (decision #64).
