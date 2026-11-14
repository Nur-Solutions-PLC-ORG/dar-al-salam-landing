/**
 * Walk-in mode, "Step inside" (DESIGN §9.8 rev 9). Loaded on the first "Step inside" / "Enter the home"; it drives
 * the dollhouse's camera (WalkHost) from fixed standpoints: one per room, at eye height 1.5 m.
 * - B1 entering (U8, 1.6 s power2.inOut): from the orbit view down to the standpoint, fov 30 → 72; during the last
 *   0.6 s the walls rise from the 2.4 m cut to the full 2.8 m, the camera-side cutaway lifts and the ceiling fades in.
 *   The initial view faces the room's balcony opening, else the middle of its longest wall. Back: the reverse (U9,
 *   1.0 s). Reduced motion: 0.2 s cross-fades.
 * - B2 looking: drag or swipe turns the view (yaw 360°, pitch ±25°, 0.25°/px, inertia 0.9 per frame). On touch the
 *   axis locks after 8 px and a vertical swipe still scrolls the page (touch-action: pan-y). No zoom. "Look left /
 *   Look right" buttons (30°, 0.3 s) and the arrow keys; an optional "Use motion" toggle on phones (off by default).
 */
import { DoubleSide, Mesh, MeshBasicMaterial, PerspectiveCamera, Quaternion, Shape, ShapeGeometry, Vector3 } from 'three';
import type { WalkHost } from './unit3d';
import type { P2 } from '../../data/units3d/types';

const EYE = 1.5;
const FOV = 72;

const centroidOf = (poly: readonly P2[]): P2 => {
  let a = 0, x = 0, z = 0;
  poly.forEach(([x0, z0], i) => {
    const [x1, z1] = poly[(i + 1) % poly.length]!;
    const c = x0 * z1 - x1 * z0;
    a += c;
    x += (x0 + x1) * c;
    z += (z0 + z1) * c;
  });
  return [x / (3 * a), z / (3 * a)];
};
export const insidePoly = ([x, z]: P2, poly: readonly P2[]) => {
  let r = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i]!;
    const [xj, zj] = poly[j]!;
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) r = !r;
  }
  return r;
};

export interface Walk {
  /** Step inside at a room (U8), or move to another room while inside. */
  enter(roomId: string): Promise<void>;
  goTo(roomId: string): Promise<void>;
  /** Back to the 3D model (U9). */
  exit(): Promise<void>;
  readonly room: string | null;
  destroy(): void;
}

const DEG = Math.PI / 180;
const PITCH = 25 * DEG;
const STEP = 30 * DEG;

export function createWalk(h: WalkHost, o: { onArrive: (roomId: string) => void; strings: Record<string, string> }): Walk {
  const { camera, data, uniforms: U } = h;
  const rooms = new Map(data.rooms.map((r) => [r.id, r]));

  // ceiling: the footprint at full storey height, fading in at the end of the fly-in
  const s = new Shape();
  data.footprint.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
  // unlit ivory for now: seen from below, a Lambert ceiling only gets the hemisphere's navy ground (B3 lights it)
  const ceilMat = new MeshBasicMaterial({ color: '#EFE8DE', side: DoubleSide, transparent: true, opacity: 0 });
  const ceiling = new Mesh(new ShapeGeometry(s).rotateX(-Math.PI / 2), ceilMat);
  ceiling.position.y = h.fullH;
  ceiling.visible = false;
  h.root.add(ceiling);

  const view = { yaw: 0, pitch: 0 };
  let current: string | null = null;
  let cutBefore: number[] = [];

  const apply = () => {
    camera.rotation.set(view.pitch, view.yaw, 0, 'YXZ');
    camera.updateProjectionMatrix();
  };
  /* ---------- B2: looking ---------- */
  const canvas = h.renderer.domElement;
  let vel = 0;
  let velP = 0;
  let drag: { x: number; y: number; axis: 'x' | 'y' | null; touch: boolean } | null = null;
  const clampPitch = () => (view.pitch = Math.max(-PITCH, Math.min(PITCH, view.pitch)));
  const onDown = (e: PointerEvent) => {
    if (!current) return;
    drag = { x: e.clientX, y: e.clientY, axis: e.pointerType === 'mouse' ? 'x' : null, touch: e.pointerType !== 'mouse' };
    vel = velP = 0;
    if (!drag.touch) canvas.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (drag.touch && !drag.axis) {
      if (Math.hypot(dx, dy) < 8) return;
      drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    drag.x = e.clientX;
    drag.y = e.clientY;
    if (drag.axis === 'y' && drag.touch) return; // the page scrolls
    vel = dx * 0.25 * DEG;
    velP = drag.touch ? 0 : dy * 0.25 * DEG;
    view.yaw += vel;
    view.pitch += velP;
    clampPitch();
    h.request();
  };
  const onUp = (e: PointerEvent) => {
    drag = null;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    h.request();
  };
  /** One 30° look step (buttons and arrow keys). */
  const turn = (dir: number) => {
    if (!current) return;
    vel = velP = 0;
    const t = { y: view.yaw };
    h.run(t, { y: view.yaw + dir * STEP, duration: h.reduced ? 0 : 0.3, ease: 'power2.out', onUpdate: () => ((view.yaw = t.y), apply()) });
  };
  const onKey = (e: KeyboardEvent) => {
    if (!current || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    turn(e.key === 'ArrowLeft' ? 1 : -1);
  };

  // the controls, in the stage: look left / right at the bottom corners, the toolbar top-left (B6 adds to it)
  const ui = document.createElement('div');
  ui.className = 'walk-ui';
  ui.hidden = true;
  const button = (cls: string, label: string, onClick: () => void, html = '') => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.setAttribute('aria-label', label);
    b.innerHTML = html;
    b.addEventListener('click', onClick);
    return b;
  };
  const arrow = (d: string) => `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="${d}"/></svg>`;
  ui.append(
    button('walk-look walk-look--l', o.strings.lookLeft ?? '', () => turn(1), arrow('M12 4 6 10l6 6')),
    button('walk-look walk-look--r', o.strings.lookRight ?? '', () => turn(-1), arrow('M8 4l6 6-6 6')),
  );
  const toolbar = document.createElement('div');
  toolbar.className = 'walk-toolbar';
  ui.append(toolbar);
  h.stage.append(ui);

  // gyro (phones, opt-in, never with reduced motion)
  type Orient = DeviceOrientationEvent & { webkitCompassHeading?: number };
  const DOE = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> };
  let gyro: { yaw: number; alpha: number | null } | null = null;
  const onOrient = (e: Orient) => {
    if (!gyro || e.alpha == null || e.beta == null) return;
    if (gyro.alpha === null) gyro.alpha = e.alpha;
    view.yaw = gyro.yaw + (e.alpha - gyro.alpha) * DEG;
    view.pitch = (e.beta - 90) * DEG;
    clampPitch();
    h.request();
  };
  if (DOE && matchMedia('(pointer: coarse)').matches && !h.reduced) {
    const g = button('walk-gyro', o.strings.useMotion ?? '', async () => {
      if (gyro) {
        gyro = null;
        window.removeEventListener('deviceorientation', onOrient);
        g.setAttribute('aria-pressed', 'false');
        return;
      }
      try {
        if (DOE.requestPermission && (await DOE.requestPermission()) !== 'granted') throw new Error('denied');
        gyro = { yaw: view.yaw, alpha: null };
        window.addEventListener('deviceorientation', onOrient);
        g.setAttribute('aria-pressed', 'true');
      } catch {
        g.hidden = true; // refused or unsupported: the toggle goes away
      }
    }, `<span>${o.strings.useMotion ?? ''}</span>`);
    g.setAttribute('aria-pressed', 'false');
    g.removeAttribute('aria-label');
    toolbar.append(g);
  }

  /** The walk driver: inertia after a drag, then hand the frame back. */
  const driver = {
    frame() {
      if (!drag && (Math.abs(vel) > 1e-4 || Math.abs(velP) > 1e-4)) {
        view.yaw += vel;
        view.pitch += velP;
        clampPitch();
        vel *= 0.9;
        velP *= 0.9;
      }
      if (current) apply();
      return Boolean(gyro) || Math.abs(vel) > 1e-4 || Math.abs(velP) > 1e-4;
    },
  };
  const listen = (on: boolean) => {
    const f = on ? 'addEventListener' : 'removeEventListener';
    canvas[f]('pointerdown', onDown as EventListener);
    canvas[f]('pointermove', onMove as EventListener);
    canvas[f]('pointerup', onUp as EventListener);
    canvas[f]('pointercancel', onUp as EventListener);
    h.stage[f]('keydown', onKey as EventListener);
    ui.hidden = !on;
    if (on) h.stage.tabIndex = 0;
    else {
      h.stage.removeAttribute('tabindex');
      gyro = null;
      window.removeEventListener('deviceorientation', onOrient);
    }
  };

  /** The yaw that looks from p toward q (camera forward is −z). */
  const yawTo = (p: Vector3, q: Vector3) => Math.atan2(-(q.x - p.x), -(q.z - p.z));

  /** The standpoint (rooms[].stand, else the label point) and the initial view target. */
  const pose = (id: string) => {
    const r = rooms.get(id)!;
    const stand = (r as typeof r & { stand?: P2 }).stand ?? r.label;
    const at = h.toWorld(stand, EYE);
    // face the balcony opening if the room has one, else the middle of its longest wall
    const balconies = data.rooms.filter((x) => x.name === 'balcony');
    let target: Vector3 | null = null;
    let best = 0;
    for (const op of data.openings) {
      if (op.type !== 'glazed-door') continue;
      const m: P2 = [(op.a[0] + op.b[0]) / 2, (op.a[1] + op.b[1]) / 2];
      const len = Math.hypot(op.b[0] - op.a[0], op.b[1] - op.a[1]);
      const dx = -(op.b[1] - op.a[1]) / len;
      const dz = (op.b[0] - op.a[0]) / len;
      const sides: P2[] = [[m[0] + dx * 0.5, m[1] + dz * 0.5], [m[0] - dx * 0.5, m[1] - dz * 0.5]];
      const here = sides.some((q) => insidePoly(q, r.poly));
      const toBalcony = sides.some((q) => balconies.some((b) => insidePoly(q, b.poly)));
      if (here && toBalcony && len > best) {
        best = len;
        target = h.toWorld(m, EYE);
      }
    }
    if (!target) {
      let longest = -1;
      r.poly.forEach((a, i) => {
        const b = r.poly[(i + 1) % r.poly.length]!;
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (len > longest) {
          longest = len;
          target = h.toWorld([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], EYE);
        }
      });
    }
    return { at, yaw: yawTo(at, target ?? h.toWorld(centroidOf(r.poly), EYE)) };
  };

  /** Fly the camera from where it is now to a position + orientation + fov. */
  const fly = (to: { at: Vector3; quat: Quaternion; fov: number }, duration: number) => {
    const from = { at: camera.position.clone(), quat: camera.quaternion.clone(), fov: camera.fov };
    const t = { p: 0 };
    return new Promise<void>((resolve) => {
      h.run(t, {
        p: 1,
        duration,
        ease: 'power2.inOut',
        onUpdate: () => {
          camera.position.lerpVectors(from.at, to.at, t.p);
          camera.quaternion.slerpQuaternions(from.quat, to.quat, t.p);
          camera.fov = from.fov + (to.fov - from.fov) * t.p;
          camera.updateProjectionMatrix();
        },
        onComplete: resolve,
      });
    });
  };
  const quatFor = (yaw: number, pitch = 0) => new Quaternion().setFromEuler(new PerspectiveCamera().rotation.set(pitch, yaw, 0, 'YXZ'));

  /** The cut lifts and the ceiling fades in (in), or back (out). */
  const enclose = (inside: boolean, duration: number, delay: number) => {
    if (inside) {
      cutBefore = [...U.uCut.value];
      ceiling.visible = true;
    }
    const cut = { m: U.uModel.value };
    h.run(cut, {
      m: inside ? h.fullH : h.cutH,
      duration,
      delay,
      onUpdate: () => {
        U.uModel.value = cut.m;
        U.uCut.value = U.uCut.value.map(() => cut.m); // no camera-side cutaway inside
      },
      onComplete: () => {
        if (inside) return;
        U.uCut.value = [...cutBefore]; // the orbit's cutaway, as it was
        ceiling.visible = false;
      },
    });
    h.run(ceilMat, { opacity: inside ? 1 : 0, duration, delay });
  };

  const fade = (to: number) => h.host.animate([{ opacity: to ? 0 : 1 }, { opacity: to }], { duration: 200, fill: 'forwards' }).finished;

  const arrive = async (id: string, glide: number) => {
    const p = pose(id);
    view.yaw = p.yaw;
    view.pitch = 0;
    current = id;
    if (h.reduced || glide === 0) {
      await fade(0);
      camera.position.copy(p.at);
      camera.fov = FOV;
      apply();
      h.request();
      await fade(1);
    } else await fly({ at: p.at, quat: quatFor(view.yaw), fov: FOV }, glide);
    o.onArrive(id);
  };

  return {
    get room() {
      return current;
    },
    async enter(id) {
      h.spots.classList.add('is-walking');
      h.setDriver(driver);
      listen(true);
      if (h.reduced) {
        enclose(true, 0, 0);
        await arrive(id, 0);
        return;
      }
      enclose(true, 0.6, 1.0);
      await arrive(id, 1.6);
    },
    goTo(id) {
      return arrive(id, 0);
    },
    async exit() {
      const back = new PerspectiveCamera(30, camera.aspect);
      h.orbitPose(back);
      current = null;
      if (h.reduced) {
        await fade(0);
        enclose(false, 0, 0);
        camera.fov = 30;
        camera.position.copy(back.position);
        camera.quaternion.copy(back.quaternion);
        camera.updateProjectionMatrix();
        await fade(1);
      } else {
        enclose(false, 0.4, 0);
        await fly({ at: back.position, quat: back.quaternion, fov: 30 }, 1.0);
      }
      h.spots.classList.remove('is-walking');
      listen(false);
      h.setDriver(null);
    },
    destroy() {
      listen(false);
      ui.remove();
      h.root.remove(ceiling);
      ceiling.geometry.dispose();
      ceilMat.dispose();
    },
  };
}
