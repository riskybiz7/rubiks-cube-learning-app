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
   - The scramble stays until you press **New scramble** (decision #70). If your cube already
     has it from your last scan, skip this step.
3. Pick the light: daylight, lamp, dim or other.
4. Press **Start the camera**. For each face the screen asks for, line it up in the grid and
   press **📷 Take this face**. In test mode the camera never takes a face by itself
   (decision #69). Watch the small map below the video: each face fills in once it's taken.
5. Press **Download test scan**, or **Share test scan…** on a phone.
   - **iPhone:** Download usually lands in Files › Downloads; Share opens the share sheet (Save
     to Files or Mail). Get the file to the PC.
   - **Computer:** the file downloads.
6. Put the file in `batch-a/` or `batch-b/` here.
7. To scan again: **Scan again, same scramble** (no re-scrambling) or **Scan again, new
   scramble**.

**Save every scan, good or bad.** Dropping the bad ones would flatter the result.

## What's in a batch (decision #65)

8 scans. Since decision #70, scans under the same camera and light may share a scramble:

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
