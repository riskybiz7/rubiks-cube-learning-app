import { describe, expect, it } from 'vitest';
import { solved } from '../cube/geometry';
import { applyMoves } from '../cube/moves';
import { mustParse, type Move } from '../cube/notation';
import type { Cube } from '../cube/types';
import { Playback, type CubeDisplay } from './playback';

/** Stands in for the 3D view. Records what was shown; animations finish on command. */
class FakeDisplay implements CubeDisplay {
  shown: Cube[] = [];
  animations: { move: Move; next: Cube; durationMs: number; finish: () => void }[] = [];
  autoFinish = true;

  show(cube: Cube): void {
    this.shown.push(cube);
  }

  animate(move: Move, next: Cube, durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      const finish = () => {
        this.shown.push(next); // like the real view: an animation ends by drawing `next`
        resolve();
      };
      this.animations.push({ move, next, durationMs, finish });
      if (this.autoFinish) finish();
    });
  }

  get current(): Cube {
    return this.shown[this.shown.length - 1];
  }
}

const ALG = mustParse("R U R' U'");

function setup(autoFinish = true) {
  const display = new FakeDisplay();
  display.autoFinish = autoFinish;
  const playback = new Playback(display);
  playback.load(ALG);
  return { display, playback };
}

describe('Playback', () => {
  it('shows the starting cube after loading', () => {
    const { display, playback } = setup();
    expect(playback.position).toBe(0);
    expect(playback.length).toBe(4);
    expect(display.current).toEqual(solved());
  });

  it('steps forward one move at a time', async () => {
    const { display, playback } = setup();
    await playback.stepForward();
    expect(playback.position).toBe(1);
    expect(display.animations[0].move).toEqual({ base: 'R', turns: 1 });
    expect(display.current).toEqual(applyMoves(solved(), ALG.slice(0, 1)));
  });

  it('steps back by animating the reverse move', async () => {
    const { display, playback } = setup();
    await playback.stepForward();
    await playback.stepBack();
    expect(playback.position).toBe(0);
    expect(display.animations[1].move).toEqual({ base: 'R', turns: 3 });
    expect(display.current).toEqual(solved());
  });

  it('does nothing when stepping past either end', async () => {
    const { display, playback } = setup();
    await playback.stepBack();
    expect(display.animations).toHaveLength(0);
    for (let i = 0; i < 5; i++) await playback.stepForward();
    expect(display.animations).toHaveLength(4);
    expect(playback.position).toBe(4);
  });

  it('plays the whole algorithm', async () => {
    const { display, playback } = setup();
    await playback.play();
    expect(playback.position).toBe(4);
    expect(playback.isPlaying).toBe(false);
    expect(display.animations).toHaveLength(4);
    expect(display.current).toEqual(applyMoves(solved(), ALG));
  });

  it('starts over when Play is pressed at the end', async () => {
    const { display, playback } = setup();
    await playback.play();
    await playback.play();
    expect(display.animations).toHaveLength(8);
    expect(playback.position).toBe(4);
  });

  it('pauses after the move that is currently animating', async () => {
    const { display, playback } = setup(false);
    const playing = playback.play();
    expect(playback.isPlaying).toBe(true);
    playback.pause();
    display.animations[0].finish();
    await playing;
    expect(playback.position).toBe(1);
    expect(playback.isPlaying).toBe(false);
    expect(display.animations).toHaveLength(1);
  });

  it('ignores extra clicks while a move is animating', async () => {
    const { display, playback } = setup(false);
    const first = playback.stepForward();
    void playback.stepForward();
    void playback.stepBack();
    void playback.play();
    expect(display.animations).toHaveLength(1);
    display.animations[0].finish();
    await first;
    expect(playback.position).toBe(1);
  });

  it("ends on the new algorithm's start if the algorithm changes mid-move", async () => {
    const { display, playback } = setup(false);
    const step = playback.stepForward();
    playback.load(mustParse('F2'));
    display.animations[0].finish(); // the old move finishes and draws a stale cube
    await step;
    expect(playback.position).toBe(0);
    expect(playback.length).toBe(1);
    expect(display.current).toEqual(solved());
  });

  it('ends on the start if Reset is pressed mid-play', async () => {
    const { display, playback } = setup(false);
    const playing = playback.play();
    playback.reset();
    display.animations[0].finish();
    await playing;
    expect(playback.position).toBe(0);
    expect(playback.isPlaying).toBe(false);
    expect(display.animations).toHaveLength(1);
    expect(display.current).toEqual(solved());
  });

  it('uses the current speed for each move', async () => {
    const { display, playback } = setup();
    playback.msPerMove = 150;
    await playback.stepForward();
    expect(display.animations[0].durationMs).toBe(150);
  });
});
