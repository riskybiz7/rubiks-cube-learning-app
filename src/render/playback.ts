import { solved } from '../cube/geometry';
import { applyMove } from '../cube/moves';
import { invertMove, type Move } from '../cube/notation';
import type { Cube } from '../cube/types';

/** Anything that can draw the cube: the real 3D view, or a fake one in tests. */
export interface CubeDisplay {
  /** Jump straight to a state, with no animation (cancels any animation in progress). */
  show(cube: Cube): void;
  /** Animate one move from what's on screen now; must finish by showing `next`. */
  animate(move: Move, next: Cube, durationMs: number): Promise<void>;
}

/**
 * Steps through an algorithm on a CubeDisplay.
 *
 * Every state is worked out in advance (states[i] = the cube after i moves), like
 * a column of running totals, so stepping forward or back never has to recompute.
 * Only one animation runs at a time; clicks that arrive mid-animation are ignored.
 */
export class Playback {
  msPerMove = 400;
  onChange: () => void = () => {};

  private moves: readonly Move[] = [];
  private states: Cube[];
  private pos = 0;
  private busy = false;
  private playing = false;
  /** Goes up whenever load() or reset() happens, so an animation that finishes late knows it's stale. */
  private generation = 0;

  constructor(
    private readonly display: CubeDisplay,
    start: Cube = solved(),
  ) {
    this.states = [start];
    display.show(start);
  }

  get position(): number {
    return this.pos;
  }
  get length(): number {
    return this.moves.length;
  }
  get isPlaying(): boolean {
    return this.playing;
  }
  get isBusy(): boolean {
    return this.busy;
  }
  get currentCube(): Cube {
    return this.states[this.pos];
  }

  /** Switch to a new algorithm and show its starting cube. */
  load(moves: readonly Move[], start: Cube = this.states[0]): void {
    this.generation++;
    this.playing = false;
    this.moves = moves;
    this.states = [start];
    for (const move of moves) {
      this.states.push(applyMove(this.states[this.states.length - 1], move));
    }
    this.pos = 0;
    this.display.show(start);
    this.onChange();
  }

  /** Back to the starting cube. */
  reset(): void {
    this.generation++;
    this.playing = false;
    this.pos = 0;
    this.display.show(this.states[0]);
    this.onChange();
  }

  async stepForward(): Promise<void> {
    if (this.busy || this.pos >= this.moves.length) return;
    await this.animateTo(this.pos + 1, this.moves[this.pos]);
  }

  async stepBack(): Promise<void> {
    if (this.busy || this.pos === 0) return;
    await this.animateTo(this.pos - 1, invertMove(this.moves[this.pos - 1]));
  }

  /** Play from the current position to the end. At the end already? Start over. */
  async play(): Promise<void> {
    if (this.playing || this.busy) return;
    if (this.pos >= this.moves.length) this.reset();
    this.playing = true;
    this.onChange();
    const generation = this.generation;
    while (this.playing && generation === this.generation && this.pos < this.moves.length) {
      await this.stepForward();
    }
    if (generation === this.generation) {
      this.playing = false;
      this.onChange();
    }
  }

  /** Stop after the move that's currently animating. */
  pause(): void {
    this.playing = false;
    this.onChange();
  }

  private async animateTo(target: number, move: Move): Promise<void> {
    const generation = this.generation;
    this.busy = true;
    this.onChange();
    await this.display.animate(move, this.states[target], this.msPerMove);
    this.busy = false;
    if (generation === this.generation) {
      this.pos = target;
    } else {
      // load() or reset() happened mid-animation, so the animation just drew a
      // stale cube. Redraw the correct one.
      this.display.show(this.states[this.pos]);
    }
    this.onChange();
  }
}
