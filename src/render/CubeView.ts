import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Move } from '../cube/notation';
import type { Color, Cube } from '../cube/types';
import { CUBIES, moveRotation } from './layout';
import type { CubeDisplay } from './playback';

/** Screen colors for each sticker color. */
export const STICKER_HEX: Record<Color, number> = {
  W: 0xffffff,
  Y: 0xffd500,
  G: 0x009b48,
  B: 0x0046ad,
  R: 0xb71234,
  O: 0xff5800,
};

interface ActiveAnimation {
  pivot: THREE.Group;
  axis: THREE.Vector3;
  angle: number;
  startMs: number;
  durationMs: number;
  cubies: THREE.Group[];
  next: Cube;
  resolve: () => void;
}

/**
 * The 3D cube. It only DISPLAYS states. To animate a move, it spins the moving
 * cubies around a temporary pivot, then puts them back where they started and
 * recolors every sticker from the model's next state. The model stays the
 * single source of truth, and rounding errors can never build up.
 */
export class CubeView implements CubeDisplay {
  private readonly renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  private readonly controls: OrbitControls;
  private readonly root = new THREE.Group();
  private readonly cubieObjects: THREE.Group[] = [];
  private readonly stickerMaterials: THREE.MeshBasicMaterial[] = []; // indexed by sticker slot
  private readonly disposables: { dispose(): void }[] = [];
  private readonly resizeObserver: ResizeObserver;
  private frameId = 0;
  private animation: ActiveAnimation | null = null;

  constructor(private readonly container: HTMLElement) {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Looking from front-right-above, so U, F and R are visible (the standard view).
    this.camera.position.set(5, 4.5, 7);
    this.camera.lookAt(0, 0, 0);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 16;

    this.scene.add(this.root);
    this.buildCubies();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.frameId = requestAnimationFrame(this.tick);
  }

  show(cube: Cube): void {
    this.finishAnimation(false); // a jump cancels any animation in progress
    this.paint(cube);
  }

  animate(move: Move, next: Cube, durationMs: number): Promise<void> {
    this.finishAnimation(false);
    const { axis, angle, cubieIndices } = moveRotation(move);
    const pivot = new THREE.Group();
    this.root.add(pivot);
    const cubies = cubieIndices.map((i) => this.cubieObjects[i]);
    for (const cubie of cubies) pivot.add(cubie); // the pivot starts unrotated, so nothing moves yet
    return new Promise((resolve) => {
      this.animation = {
        pivot,
        axis: new THREE.Vector3(...axis),
        angle,
        startMs: performance.now(),
        durationMs: Math.max(durationMs, 1),
        cubies,
        next,
        resolve,
      };
    });
  }

  dispose(): void {
    cancelAnimationFrame(this.frameId);
    this.finishAnimation(false);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    for (const item of this.disposables) item.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private buildCubies(): void {
    const bodyGeometry = new THREE.BoxGeometry(0.96, 0.96, 0.96);
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const stickerGeometry = new THREE.PlaneGeometry(0.84, 0.84);
    this.disposables.push(bodyGeometry, bodyMaterial, stickerGeometry);
    const planeFacing = new THREE.Vector3(0, 0, 1); // a new plane faces +z

    for (const layout of CUBIES) {
      const cubie = new THREE.Group();
      cubie.position.set(...layout.position);
      cubie.add(new THREE.Mesh(bodyGeometry, bodyMaterial));
      for (const { slot, normal } of layout.stickers) {
        const material = new THREE.MeshBasicMaterial({ color: 0x888888 });
        this.disposables.push(material);
        this.stickerMaterials[slot] = material;
        const sticker = new THREE.Mesh(stickerGeometry, material);
        const n = new THREE.Vector3(...normal);
        sticker.position.copy(n).multiplyScalar(0.481); // just outside the body's surface
        sticker.quaternion.setFromUnitVectors(planeFacing, n);
        cubie.add(sticker);
      }
      this.root.add(cubie);
      this.cubieObjects.push(cubie);
    }
  }

  private paint(cube: Cube): void {
    cube.stickers.forEach((color, slot) =>
      this.stickerMaterials[slot].color.setHex(STICKER_HEX[color]),
    );
  }

  /** Put the moving cubies back in place. If the animation completed, recolor from the next state. */
  private finishAnimation(completed: boolean): void {
    const animation = this.animation;
    if (!animation) return;
    this.animation = null;
    // Cubies never change their own position, only the pivot rotates, so
    // moving them back to the root puts them exactly home.
    for (const cubie of animation.cubies) this.root.add(cubie);
    this.root.remove(animation.pivot);
    if (completed) this.paint(animation.next);
    animation.resolve();
  }

  private readonly tick = (nowMs: number): void => {
    this.frameId = requestAnimationFrame(this.tick);
    const animation = this.animation;
    if (animation) {
      const t = Math.min(1, Math.max(0, (nowMs - animation.startMs) / animation.durationMs));
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // slow-fast-slow
      animation.pivot.setRotationFromAxisAngle(animation.axis, animation.angle * eased);
      if (t >= 1) this.finishAnimation(true);
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private resize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
