/**
 * Walk-in mode, "Step inside" (DESIGN §9.8 rev 9). Loaded on the first "Step inside" / "Enter the home"; it drives
 * the dollhouse's camera (WalkHost) from fixed standpoints: one per room, at eye height 1.5 m.
 * - B1 entering (U8, 1.6 s power2.inOut): from the orbit view down to the standpoint, fov 30 → 72; during the last
 *   0.6 s the walls rise from the 2.4 m cut to the full 2.8 m, the camera-side cutaway lifts and the ceiling fades in.
 *   The initial view faces the room's balcony opening, else the middle of its longest wall. Back: the reverse (U9,
 *   1.0 s). Reduced motion: 0.2 s cross-fades.
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

export function createWalk(h: WalkHost, o: { onArrive: (roomId: string) => void }): Walk {
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
      h.setDriver({ frame: () => false });
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
      h.setDriver(null);
    },
    destroy() {
      h.root.remove(ceiling);
      ceiling.geometry.dispose();
      ceilMat.dispose();
    },
  };
}
