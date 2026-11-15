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
 * - B3 the inside look (geometry, until panoramas exist): a lit ceiling, 10 cm skirting, door frames, 5 cm glazing
 *   jambs, a plain soft sky beyond the glass (no skyline), a warm point light at the room's centroid that moves with
 *   the room, the camera fill at 40%, gradient "ambient occlusion" strips along wall bases and ceiling corners, and
 *   furniture derived from the blocks (headboards and mattress steps, sofa backs, counter overhangs). A chip says
 *   "Simplified 3D model from the floor plan". Everything here is visible only inside.
 * - B4 moving: every door of the current room (or hall standpoint) gets a ring on the floor 0.7 m inside it, projected
 *   HTML (≥ 44 px). Where a door leads is computed: the points 0.5 m either side of the opening are tested against the
 *   room polygons and the hall. The hall has one standpoint per door, 0.9 m in. Taking a ring glides through the
 *   door's centre (U10, 1.2 s power2.inOut) with the yaw easing to the direction of travel; the lamp follows. Rings
 *   behind the camera or beyond 9 m hide. Reduced motion: 0.2 s cross-fades.
 * - B6 toolbar and minimap: "Back to 3D model" (and the gyro toggle) top-left; top-right the unit's plan at 132 px
 *   (96 px on phones) with a gold "you are here" dot and a 60° view cone; tapping a room jumps there. The minimap is
 *   aria-hidden (the room list is its accessible twin) and hides on stages under 320 px. A 4 s hint on first entry.
 * - B5 the panorama slot: an approved rooms[].pano replaces the geometry for that room (0.5 s cross-fade once decoded):
 *   equirect on an inside-out sphere (r 20 m) centred on the standpoint, or a 3:1 strip on a cylinder arc with the
 *   yaw clamped to the arc and the pitch to ±12°. The chip then reads "Artist's impression; finishes may vary.".
 *   One panorama at a time; the previous one is disposed. Door rings keep their true bearings (world positions).
 */
import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Quaternion,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { WalkHost } from './unit3d';
import type { P2, RoomPano } from '../../data/units3d/types';

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
const LAMP = 6; // r187 units, tuned in a settled capture so the walls read about sand-100, not clipped and not grey

export function createWalk(
  h: WalkHost,
  o: {
    onArrive: (roomId: string) => void;
    /** Back to the 3D model, or a jump (minimap): the controller owns the state and hash. */
    onBack: () => void;
    onPick: (roomId: string) => void;
    strings: Record<string, string>;
    names: Record<string, string>;
    /** Approved-or-not panoramas by room id, and the AI label for the chip. */
    panos: Partial<Record<string, RoomPano>>;
    aiLabel: string;
    lang: string;
  },
): Walk {
  const { camera, data, uniforms: U } = h;
  const rooms = new Map(data.rooms.map((r) => [r.id, r]));

  /* ---------- B4: where each door leads ---------- */
  const hall = data.hall?.poly ?? null;
  /** Rev 9.2: unlabelled spaces to stand in, as locations 'w-<id>'. */
  const spaceList = new Map((data.walkable ?? []).map((w) => [`w-${w.id}`, w]));
  const spaces = new Map([...spaceList].map(([k, w]) => [k, w.poly]));
  /** Rev 9.4: a space with under 0.3 m of clear floor (a ledge) is no walk destination. */
  // review r8 M3: a hall standpoint must name a door that opens onto the hall (`doors` is defined below; called later)
  const known = (loc: string) => rooms.has(loc) || spaceList.has(loc) || doors.some((d) => `hall-${d.id}` === loc && (d.plus === 'hall' || d.minus === 'hall'));
  const canStand = (loc: string) => loc.startsWith('hall-') || ((spaceList.get(loc) ?? rooms.get(loc))?.standClearance ?? 1) >= 0.3;
  /** The room, 'hall' or walkable space containing a plan point (tested in that order), else null (outside). */
  const where = (q: P2): string | null =>
    data.rooms.find((r) => insidePoly(q, r.poly))?.id ?? (hall && insidePoly(q, hall) ? 'hall' : ([...spaces].find(([, p]) => insidePoly(q, p))?.[0] ?? null));
  /** The polygon a location stands in. */
  const polyOf = (loc: string) => (loc.startsWith('hall-') ? hall : (spaces.get(loc) ?? rooms.get(loc)?.poly ?? null));
  const doors = data.openings
    .filter((op) => op.type !== 'window')
    .map((op) => {
      const m: P2 = [(op.a[0] + op.b[0]) / 2, (op.a[1] + op.b[1]) / 2];
      const len = Math.hypot(op.b[0] - op.a[0], op.b[1] - op.a[1]);
      const n: P2 = [-(op.b[1] - op.a[1]) / len, (op.b[0] - op.a[0]) / len];
      const at = (d: number): P2 => [m[0] + n[0] * d, m[1] + n[1] * d];
      return { id: op.id, m, at, plus: where(at(0.5)), minus: where(at(-0.5)) };
    })
    .filter((d) => d.plus && d.minus && d.plus !== d.minus);
  /** The area a location stands in: a room id, or 'hall' for the hall's door standpoints ('hall-<door>'). */
  const areaOf = (loc: string) => (loc.startsWith('hall-') ? 'hall' : loc);
  /** Rings for a location: each door of its area, 0.7 m inside, and where it leads. */
  const ringsAt = (loc: string) =>
    doors
      .filter((d) => d.plus === areaOf(loc) || d.minus === areaOf(loc))
      .map((d) => {
        const side = d.plus === areaOf(loc) ? 1 : -1;
        const other = side > 0 ? d.minus! : d.plus!;
        return { door: d, at: d.at(side * 0.7), to: other === 'hall' ? `hall-${d.id}` : other };
      })
      .filter((r) => canStand(r.to));
  const nameOf = (loc: string) => {
    const sp = spaceList.get(loc);
    if (sp) return o.strings[sp.name] ?? sp.name; // rev 9.4: "the lobby", "the room off the kitchen"
    const key = rooms.get(loc)?.name ?? 'hall';
    const n = o.names[key] ?? key;
    return o.lang === 'en' ? n.toLowerCase() : n;
  };
  /** Rev 9.4: ring labels are unique in a view; same-named rooms add their place in plan order ("1 of 2"). */
  const goTo = (loc: string, n = 0, total = 0) => {
    const r = rooms.get(loc);
    const same = r ? data.rooms.filter((x) => x.name === r.name) : [];
    if (same.length > 1) [n, total] = [same.indexOf(r!) + 1, same.length];
    const f = (s: string) => s.replace('{room}', nameOf(loc)).replace('{n}', String(n)).replace('{total}', String(total));
    return f((total ? o.strings.goToN : o.strings.goTo) ?? '');
  };

  // ceiling: the footprint at full storey height, fading in at the end of the fly-in
  const s = new Shape();
  data.footprint.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
  // B3: a Lambert ceiling, lit from below by the room's point light
  // a little self-light: the lamp sits 0.4 m below it, so it only grazes the far corners
  const ceilMat = new MeshLambertMaterial({ color: '#FBF7F2', emissive: '#A39B90', side: DoubleSide, transparent: true, opacity: 0 });
  const ceiling = new Mesh(new ShapeGeometry(s).rotateX(-Math.PI / 2), ceilMat);
  ceiling.position.y = h.fullH;
  ceiling.visible = false;
  h.root.add(ceiling);

  /* ---------- B3: dressing (built once, shown only inside) ---------- */
  const dress = new Group();
  dress.visible = false;
  h.root.add(dress);
  const own: { dispose(): void }[] = [ceilMat, ceiling.geometry];
  /** A box along a→b from y0 to y1, t deep, pushed `off` metres along the segment's normal. */
  const seg = (a: P2, b: P2, y0: number, y1: number, t: number, off = 0) => {
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    const g = new BoxGeometry(len, y1 - y0, t).toNonIndexed();
    g.translate(0, (y0 + y1) / 2, off);
    g.rotateY(-Math.atan2(dz, dx));
    g.translate((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2);
    return g;
  };
  const mesh = (gs: BufferGeometry[], m: MeshLambertMaterial | MeshBasicMaterial) => {
    if (!gs.length) return;
    const g = mergeGeometries(gs)!;
    gs.forEach((x) => x.dispose());
    own.push(g, m);
    dress.add(new Mesh(g, m));
  };
  // skirting, both faces of every wall
  mesh(
    data.walls.map((w) => seg(w.a, w.b, 0, 0.1, w.t + 0.02)),
    new MeshLambertMaterial({ color: '#E4DACB' }),
  );
  // door frames (6 cm) and glazing jambs (5 cm, navy)
  const frames: BufferGeometry[] = [];
  const jambs: BufferGeometry[] = [];
  for (const op of data.openings) {
    if (op.type === 'open') continue; // archways: no frame
    const len = Math.hypot(op.b[0] - op.a[0], op.b[1] - op.a[1]);
    const ux = (op.b[0] - op.a[0]) / len;
    const uz = (op.b[1] - op.a[1]) / len;
    const at = (d: number): P2 => [op.a[0] + ux * d, op.a[1] + uz * d];
    const top = Math.min(op.head, h.fullH);
    if (op.type === 'door') {
      const w = 0.06;
      frames.push(seg(at(0), at(w), 0, top, op.t + 0.03), seg(at(len - w), at(len), 0, top, op.t + 0.03), seg(op.a, op.b, top - w, top, op.t + 0.03));
    } else {
      const w = 0.05;
      const y0 = op.type === 'window' ? op.sill : 0;
      jambs.push(seg(at(0), at(w), y0, top, 0.05), seg(at(len - w), at(len), y0, top, 0.05));
    }
  }
  mesh(frames, new MeshLambertMaterial({ color: '#D9CFC0' }));
  mesh(jambs, new MeshBasicMaterial({ color: '#1E2226' })); // F4: black, like the dollhouse mullions
  // fake ambient occlusion: 0.35 m gradient strips on the floor along each wall face, and in the ceiling corners
  const ao = document.createElement('canvas');
  ao.width = 1;
  ao.height = 64;
  const actx = ao.getContext('2d')!;
  const grad = actx.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, 'rgba(11,18,32,0.18)');
  grad.addColorStop(1, 'rgba(11,18,32,0)');
  actx.fillStyle = grad;
  actx.fillRect(0, 0, 1, 64);
  const aoTex = new CanvasTexture(ao);
  own.push(aoTex);
  const strips: BufferGeometry[] = [];
  for (const w of data.walls) {
    const dx = w.b[0] - w.a[0];
    const dz = w.b[1] - w.a[1];
    const len = Math.hypot(dx, dz);
    for (const side of [1, -1]) {
      for (const y of [0.012, h.fullH - 0.012]) {
        // a plane in XZ: v = 0 at the wall face, 1 at 0.35 m out
        const g = new PlaneGeometry(len, 0.35).toNonIndexed();
        g.rotateX(side * (y < 1 ? -Math.PI / 2 : Math.PI / 2));
        g.translate(0, y, side * (w.t / 2 + 0.175));
        g.rotateY(-Math.atan2(dz, dx));
        g.translate((w.a[0] + w.b[0]) / 2, 0, (w.a[1] + w.b[1]) / 2);
        const uv = g.getAttribute('uv');
        for (let i = 0; i < uv.count; i++) uv.setY(i, side > 0 === y < 1 ? 1 - uv.getY(i) : uv.getY(i));
        strips.push(g);
      }
    }
  }
  mesh(strips, new MeshBasicMaterial({ map: aoTex, transparent: true, depthWrite: false, side: DoubleSide }));
  // (rev 10 F1: the furniture itself is modelled now — headboards, sofa backs and worktops come from furniture.ts)
  // the room light: warm, at the room's centroid, 2.4 m up; it follows the room
  const lamp = new PointLight('#FFE9CC', LAMP, 9, 2);
  lamp.visible = false;
  h.root.add(lamp);
  // sky beyond the glass: a plain vertical gradient, horizon sand to pale blue overhead
  const sky = document.createElement('canvas');
  sky.width = 1;
  sky.height = 128;
  const sctx = sky.getContext('2d')!;
  const sg = sctx.createLinearGradient(0, 0, 0, 128);
  sg.addColorStop(0, '#CFE0EA');
  sg.addColorStop(1, '#F3ECE2');
  sctx.fillStyle = sg;
  sctx.fillRect(0, 0, 1, 128);
  const skyTex = new CanvasTexture(sky);
  own.push(skyTex);
  const fillBase = h.fill.intensity;
  /** Inside on / off: dressing, lamp, sky, the fill at 40%, the honesty chip. */
  const inside = (on: boolean) => {
    dress.visible = on;
    lamp.visible = on;
    h.scene.background = on ? skyTex : null;
    h.fill.intensity = on ? fillBase * 0.4 : fillBase;
    chip.hidden = !on;
  };
  const moveLamp = (id: string) => {
    const poly = polyOf(id);
    if (!poly) return;
    const c = centroidOf(poly);
    lamp.position.set(c[0], 2.4, c[1]); // the lamp lives in the model's (plan) space
  };

  const view = { yaw: 0, pitch: 0 };
  let current: string | null = null;
  /** Review r8 H1: the walk's live tweens, so an exit can stop a fly-in or glide midway; `seq` marks the newest move. */
  const live = new Set<ReturnType<WalkHost['run']>>();
  let seq = 0;
  const run: WalkHost['run'] = (target, vars) => {
    let tw: ReturnType<WalkHost['run']> | undefined = undefined;
    const drop = () => tw && live.delete(tw);
    tw = h.run(target, {
      ...vars,
      onComplete: () => (drop(), (vars.onComplete as (() => void) | undefined)?.()),
      onInterrupt: () => (drop(), (vars.onInterrupt as (() => void) | undefined)?.()),
    });
    if (tw.progress() < 1) live.add(tw);
    return tw;
  };
  const stopAll = () => {
    [...live].forEach((t) => t.kill());
    live.clear();
  };
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
  /** Pitch ±25° (on a strip panorama: the strip's own pitch room and a yaw window inside the arc). */
  let strip: { mid: number; arc: number; pitch: number } | null = null;
  const clampPitch = () => {
    const lim = strip ? strip.pitch : PITCH;
    view.pitch = Math.max(-lim, Math.min(lim, view.pitch));
    if (!strip) return;
    // keep the horizontal field of view inside the arc
    const half = Math.max(0, strip.arc / 2 - Math.atan(Math.tan((camera.fov * DEG) / 2) * camera.aspect));
    view.yaw = strip.mid + Math.max(-half, Math.min(half, Math.atan2(Math.sin(view.yaw - strip.mid), Math.cos(view.yaw - strip.mid))));
  };
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
    run(t, { y: view.yaw + dir * STEP, duration: h.reduced ? 0 : 0.3, ease: 'power2.out', onUpdate: () => ((view.yaw = t.y), clampPitch(), apply()) });
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
  const ringLayer = document.createElement('div');
  ringLayer.className = 'walk-rings';
  ui.append(ringLayer);
  let rings: { b: HTMLButtonElement; at: Vector3; edge: Vector3; arrow: HTMLElement }[] = [];
  /** H2: a ring closer than 1.8 m to the standpoint sits on the threshold instead (else it hides under the camera). */
  const ringAt = (loc: string, r: { door: { m: P2 }; at: P2 }) => {
    const at = h.toWorld(r.at, 0.02);
    const st = pose(loc).at;
    return Math.hypot(at.x - st.x, at.z - st.z) < 1.8 ? h.toWorld(r.door.m, 0.02) : at;
  };
  /**
   * Rev 10.9: arrive facing the room's focus — its bed, sofa (else the dining table), the counter in a kitchen, the
   * basin in a shower room, else its largest piece — pitched 0° to −8°; with no furniture, the pose's own view (the
   * balcony glazing or the longest wall). In the hall and walkable spaces: `null`, the caller keeps the way of travel.
   * The edge chips keep every exit on screen.
   */
  const FOCUS: Record<string, string[]> = { bedroom: ['bed'], masterBedroom: ['bed'], livingDining: ['sofa', 'dining'], kitchen: ['counter'], shower: ['basin', 'wc'] };
  const arrivalView = (id: string): { yaw: number; pitch: number } | null => {
    const r = rooms.get(id);
    if (!r) return null;
    const p = pose(id);
    const inRoom = data.solids.filter((s) => s.kind !== 'column' && s.kind !== 'shaft' && insidePoly(centroidOf(s.poly), r.poly));
    const tag = (s: (typeof inRoom)[number]) => (s.kind === 'furniture' ? (s.piece ?? '') : s.kind);
    const size = (s: (typeof inRoom)[number]) => Math.abs(s.poly.reduce((a, [x0, z0], i) => a + x0 * s.poly[(i + 1) % s.poly.length]![1] - s.poly[(i + 1) % s.poly.length]![0] * z0, 0));
    let focus: (typeof inRoom)[number] | undefined;
    for (const want of FOCUS[r.name] ?? []) if ((focus = inRoom.filter((s) => tag(s) === want).sort((a, b) => size(b) - size(a))[0])) break;
    focus ??= inRoom.filter((s) => s.kind !== 'rug').sort((a, b) => size(b) - size(a))[0];
    if (!focus) return { yaw: p.yaw, pitch: 0 };
    const at = h.toWorld(centroidOf(focus.poly), Math.min(focus.h, 1.2) / 2);
    const dx = at.x - p.at.x;
    const dz = at.z - p.at.z;
    const down = Math.atan2(EYE - at.y, Math.hypot(dx, dz) || 1);
    // close to the focus (< 1.5 m, e.g. over the foot of a bed): face it but keep the room in view (≥ −5°)
    const lim = Math.hypot(dx, dz) < 1.5 ? 5 : 8;
    return { yaw: Math.atan2(-dx, -dz), pitch: -Math.min(lim * DEG, Math.max(0, down)) };
  };
  const showRings = (loc: string | null) => {
    ringLayer.replaceChildren();
    rings = [];
    if (!loc) return;
    const list = ringsAt(loc);
    // several doors into the hall from one room: number those within the view
    const halls = list.filter((r) => r.to.startsWith('hall-'));
    for (const r of list) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'walk-ring';
      const hn = halls.length > 1 && halls.includes(r) ? halls.indexOf(r) + 1 : 0;
      const label = hn ? goTo(r.to, hn, halls.length) : goTo(r.to);
      b.setAttribute('aria-label', label);
      b.innerHTML = '<span class="walk-ring__dot" aria-hidden="true"></span><span class="walk-ring__arrow" aria-hidden="true"></span><span class="walk-ring__label" aria-hidden="true"></span><span class="walk-ring__short" aria-hidden="true"></span>';
      b.children[2]!.textContent = label;
      // phones: the chip shows the room name only ("Kitchen ↓"); the full label stays the accessible name
      const room = rooms.get(r.to);
      const same = room ? data.rooms.filter((x) => x.name === room.name) : [];
      const n = same.length > 1 ? same.indexOf(room!) + 1 : hn;
      const nm = nameOf(r.to);
      b.lastElementChild!.textContent = nm.charAt(0).toUpperCase() + nm.slice(1) + (n ? ` ${n}` : '');
      b.addEventListener('click', () => {
        // review r8 nit: taken by keyboard, the ring goes away mid-glide; focus lands on the stage (arrow keys look)
        const kb = document.activeElement === b;
        void through(r.door, r.to).then(() => kb && h.stage.focus({ preventScroll: true }));
      });
      ringLayer.append(b);
      const at = ringAt(loc, r);
      rings.push({ b, at, edge: at.clone().add(new Vector3(0.45, 0, 0)), arrow: b.children[1] as HTMLElement });
    }
  };
  const pv = new Vector3();
  const cv = new Vector3();
  /**
   * Review r8 H2 / rev 10.4: a ring always offers a way on. On the floor in view it is the ring (≤ 160 px); off the
   * stage, behind the camera or under it, the same button becomes a 44 px chip pinned to the nearest edge with an
   * arrow, stacked 8 px apart (sides: the middle band, clear of the toolbar and minimap; bottom: above the controls).
   */
  const projectRings = () => {
    if (!rings.length) return;
    camera.updateMatrixWorld();
    const w = h.host.clientWidth;
    const hh = h.host.clientHeight;
    const chips: { r: (typeof rings)[number]; edge: 'l' | 'r' | 'b'; k: number }[] = [];
    ringLayer.classList.toggle('is-narrow', w < 640);
    // the bottom chip row sits above the honesty chip and the look buttons, whichever is higher
    const lookTop = Math.min(...[...ui.querySelectorAll<HTMLElement>('.walk-look')].map((e) => e.offsetTop), hh - 16);
    const base = Math.min(chip.hidden ? hh - 16 : chip.offsetTop, lookTop) - 52;
    for (const r of rings) {
      const c = cv.copy(r.at).applyMatrix4(camera.matrixWorldInverse); // camera space: −z is ahead
      let x = 0, y = 0;
      if (c.z < -0.3) {
        pv.copy(r.at).project(camera);
        x = ((pv.x + 1) / 2) * w;
        y = ((1 - pv.y) / 2) * hh;
      }
      let size = 44;
      if (c.z < -0.3) {
        pv.copy(r.edge).project(camera);
        size = Math.min(160, Math.max(44, Math.abs(((pv.x + 1) / 2) * w - x) * 2));
      }
      // the whole ring must fit inside the stage (a big one near an edge spilled out: review r9b sweep)
      const onStage = c.z < -0.3 && x > size / 2 + 8 && x < w - size / 2 - 8 && y > 24 && y < hh - 60;
      r.b.classList.toggle('is-chip', !onStage);
      r.b.classList.remove('is-hidden');
      r.b.inert = false;
      if (onStage) {
        r.b.style.setProperty('--size', `${size}px`);
        r.b.style.transform = `translate(${x}px, ${y}px)`;
        continue;
      }
      // ahead but below the frame → the bottom edge; otherwise the side it lies toward
      const below = c.z < -0.3 && x > 24 && x < w - 24;
      const edge = below ? 'b' : c.x < 0 ? 'l' : 'r';
      chips.push({ r, edge, k: below ? x : Math.atan2(c.x, -c.z) });
      r.arrow.textContent = edge === 'b' ? '↓' : edge === 'l' ? '←' : '→';
    }
    if (w < 640 && chips.length) {
      // phones: two labelled chips can't share a row edge to edge, so they flow in centred rows from the bottom up
      const sized = chips.sort((p, q) => (p.edge === q.edge ? p.k - q.k : p.edge < q.edge ? -1 : 1)).map((q) => ({ q, s: q.r.b.offsetWidth || 120 }));
      const lines: (typeof sized)[] = [[]];
      for (const c of sized) {
        const line = lines.at(-1)!;
        if (line.length && line.reduce((a, x) => a + x.s + 8, 0) + c.s > w - 24) lines.push([c]);
        else line.push(c);
      }
      lines.forEach((line, i) => {
        let x = (w - line.reduce((a, c) => a + c.s + 8, -8)) / 2;
        for (const c of line) {
          c.q.r.b.style.transform = `translate(${Math.max(12, x)}px, ${base - (lines.length - 1 - i) * 52}px)`;
          x += c.s + 8;
        }
      });
      return;
    }
    for (const edge of ['l', 'r', 'b'] as const) {
      const row = chips.filter((q) => q.edge === edge).sort((a, b) => a.k - b.k);
      if (!row.length) continue;
      const sizes = row.map((q) => q.r.b.offsetWidth || 120);
      if (edge === 'b' && sizes.reduce((a, b) => a + b + 8, 0) > w - 16) {
        // too many for one row (phones): a column above the bottom controls
        row.forEach((q, i) => (q.r.b.style.transform = `translate(${Math.max(12, (w - sizes[i]!) / 2)}px, ${base - (row.length - 1 - i) * 52}px)`));
      } else if (edge === 'b') {
        // centred on their own x where possible, then pushed apart 8 px and kept inside the stage
        const xs = row.map((q, i) => q.k - sizes[i]! / 2);
        for (let i = 0, min = 12; i < xs.length; i++) min = (xs[i] = Math.max(xs[i]!, min)) + sizes[i]! + 8;
        for (let i = xs.length - 1, max = w - 12; i >= 0; i--) max = (xs[i] = Math.min(xs[i]!, max - sizes[i]!)) - 8;
        row.forEach((q, i) => (q.r.b.style.transform = `translate(${Math.max(12, xs[i]!)}px, ${base}px)`));
      } else {
        // review r8 nit: the stacks start below the minimap (right) or the toolbar (left)
        const clear = edge === 'r' ? (mini.hidden ? 0 : mini.offsetTop + mini.offsetHeight) : toolbar.offsetTop + toolbar.offsetHeight;
        const y0 = Math.max(hh * 0.3, clear + 8, hh / 2 - (row.length * 52) / 2);
        row.forEach((q, i) => (q.r.b.style.transform = `translate(${edge === 'l' ? 12 : w - 12 - sizes[i]!}px, ${Math.min(hh - 128, y0 + i * 52)}px)`));
      }
    }
  };
  // B6: "Back to 3D model" first in the toolbar
  const backBtn = button('walk-back', o.strings.back ?? '', () => o.onBack(), `<span>${o.strings.back ?? ''}</span>`);
  backBtn.removeAttribute('aria-label');
  toolbar.prepend(backBtn);
  // B6: the minimap (the unit's plan texture), a dot and a 60° view cone
  const { minX, minZ, maxX, maxZ } = data.texture.plane;
  const mini = document.createElement('div');
  mini.className = 'walk-mini';
  mini.setAttribute('aria-hidden', 'true');
  mini.style.aspectRatio = `${h.image.naturalWidth} / ${h.image.naturalHeight}`;
  const miniImg = document.createElement('img');
  miniImg.src = h.image.currentSrc || h.image.src;
  miniImg.alt = '';
  const cone = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  cone.setAttribute('viewBox', '-20 -20 40 40');
  cone.innerHTML = '<path d="M0 0 L17.3 -10 A20 20 0 0 1 17.3 10 Z" fill="rgb(181 148 88 / .45)"/><circle r="4" fill="#B59458" stroke="#FBF7F2" stroke-width="1.5"/>';
  mini.append(miniImg, cone);
  ui.append(mini);
  /** Plan point ↔ minimap fraction (the texture covers texture.plane). */
  const toMini = (x: number, z: number) => [(x - minX) / (maxX - minX), (z - minZ) / (maxZ - minZ)] as const;
  mini.addEventListener('click', (e) => {
    const r = mini.getBoundingClientRect();
    const q: P2 = [minX + ((e.clientX - r.left) / r.width) * (maxX - minX), minZ + ((e.clientY - r.top) / r.height) * (maxZ - minZ)];
    const at = where(q);
    if (!at || !canStand(at)) return;
    // a tap in the hall lands at its nearest door standpoint
    const to = at === 'hall' ? `hall-${[...doors].filter((d) => d.plus === 'hall' || d.minus === 'hall').sort((a, b) => Math.hypot(a.m[0] - q[0], a.m[1] - q[1]) - Math.hypot(b.m[0] - q[0], b.m[1] - q[1]))[0]?.id}` : at;
    if (to !== current) o.onPick(to);
  });
  const updateMini = () => {
    const w = h.host.clientWidth;
    mini.hidden = w < 320; // coordinator: 320, so the 96 px minimap shows on common phones (390 px → a 358 px stage)
    if (mini.hidden) return;
    const p = camera.position;
    const [fx, fz] = toMini(p.x - h.root.position.x, p.z - h.root.position.z);
    // the cone points along the camera's forward (−sin yaw, −cos yaw) in plan x/z
    const ang = (Math.atan2(-Math.cos(view.yaw), -Math.sin(view.yaw)) * 180) / Math.PI;
    cone.style.left = `${fx * 100}%`;
    cone.style.top = `${fz * 100}%`;
    cone.style.transform = `translate(-50%, -50%) rotate(${ang}deg)`;
  };
  // B6: the hint, 4 s on the first entry
  const hint = document.createElement('p');
  hint.className = 'walk-hint';
  hint.textContent = o.strings.hint ?? '';
  hint.hidden = true;
  ui.append(hint);
  let hinted = false;
  const chip = document.createElement('p');
  chip.className = 'walk-chip';
  chip.textContent = o.strings.geometryLabel ?? '';
  chip.hidden = true;
  ui.append(toolbar, chip);
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
      if (current) {
        apply();
        projectRings();
        updateMini();
      }
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
    if (id.startsWith('hall-')) {
      // 0.9 m into the hall from that door, looking on into the hall
      const d = doors.find((x) => `hall-${x.id}` === id)!; // known() vouched for it
      const at = h.toWorld(d.at((d.plus === 'hall' ? 1 : -1) * 0.9), EYE);
      return { at, yaw: yawTo(h.toWorld(d.m, EYE), at) };
    }
    const sp = spaceList.get(id);
    if (sp) {
      // a walkable space: stand at its `stand` point, looking at its farthest door
      const at = h.toWorld(sp.stand ?? centroidOf(sp.poly), EYE);
      const far = ringsAt(id).sort((a, b) => h.toWorld(b.door.m, EYE).distanceTo(at) - h.toWorld(a.door.m, EYE).distanceTo(at))[0];
      return { at, yaw: far ? yawTo(at, h.toWorld(far.door.m, EYE)) : 0 };
    }
    const r = rooms.get(id)!;
    const stand = r.stand ?? r.label; // rev 9.4: never the label (it can sit in a bed or against a sofa)
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
      run(t, {
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
        onInterrupt: resolve,
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
    run(cut, {
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
    run(ceilMat, { opacity: inside ? 1 : 0, duration, delay });
  };

  /* ---------- B5: the panorama slot ---------- */
  const panoAlt = document.createElement('p');
  panoAlt.className = 'visually-hidden';
  ui.append(panoAlt);
  let pano: { mesh: Mesh; tex: Texture; mat: MeshBasicMaterial } | null = null;
  const loadPano = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => (src.endsWith('.avif') ? (img.src = src.replace(/\.avif$/, '.webp'), (img.onerror = reject)) : reject());
      img.src = src;
    });
  const dropPano = (instant: boolean) => {
    const old = pano;
    pano = null;
    if (strip) {
      strip = null;
      if (instant || h.reduced) camera.fov = FOV;
      else run(camera, { fov: FOV, duration: 0.5, ease: 'power2.out', overwrite: true, onUpdate: apply });
    }
    h.root.visible = true;
    chip.textContent = o.strings.geometryLabel ?? '';
    panoAlt.textContent = '';
    if (!old) return;
    const bye = () => {
      h.scene.remove(old.mesh);
      old.mesh.geometry.dispose();
      old.mat.dispose();
      old.tex.dispose();
    };
    if (instant || h.reduced) bye();
    else run(old.mat, { opacity: 0, duration: 0.5, onComplete: bye, onInterrupt: bye });
  };
  /** The room's approved panorama, if any (else back to geometry). */
  const showPano = async (id: string) => {
    const pn = o.panos[id];
    if (!pn?.approved) return dropPano(false);
    let img: HTMLImageElement;
    try {
      img = await loadPano(pn.src);
      await img.decode();
    } catch {
      return dropPano(false); // no image: the geometry stays
    }
    if (current !== id) return;
    dropPano(true);
    const tex = new Texture(img);
    tex.colorSpace = SRGBColorSpace;
    tex.needsUpdate = true;
    const arc = (pn.arc ?? 180) * DEG;
    const geo =
      pn.kind === 'equirect'
        ? new SphereGeometry(20, 48, 24)
        : new CylinderGeometry(20, 20, (20 * arc) / 3, 64, 1, true, Math.PI - arc / 2, arc); // 3:1, centred ahead
    geo.scale(-1, 1, 1); // seen from inside without mirroring the image
    const mat = new MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false });
    const mesh = new Mesh(geo, mat);
    mesh.position.copy(camera.position);
    mesh.rotation.y = pn.yawOffset * DEG;
    mesh.renderOrder = 10;
    h.scene.add(mesh);
    pano = { mesh, tex, mat };
    if (pn.kind === 'strip') {
      // a 3:1 strip covers ±atan(arc/6) vertically: narrow the view to fit inside it, leaving up to ±12° to look
      const v = Math.atan(arc / 6);
      const fov = Math.min(FOV * DEG, 2 * v - 8 * DEG);
      strip = { mid: pn.yawOffset * DEG, arc, pitch: Math.min(12 * DEG, v - fov / 2) };
      run(camera, { fov: fov / DEG, duration: h.reduced ? 0 : 0.5, ease: 'power2.out', overwrite: true, onUpdate: () => (clampPitch(), apply()) });
    }
    chip.textContent = o.aiLabel;
    panoAlt.textContent = pn.alt;
    run(mat, {
      opacity: 1,
      duration: h.reduced ? 0 : 0.5,
      ease: 'power2.out',
      onComplete: () => {
        if (pano?.mat === mat) h.root.visible = false; // the geometry hides behind a finished panorama
      },
    });
  };

  const fade = (to: number) => h.host.animate([{ opacity: to ? 0 : 1 }, { opacity: to }], { duration: 200, fill: 'forwards' }).finished;

  /** U10: through a door's centre to the next standpoint; the yaw eases to the direction of travel. */
  const through = async (door: { m: P2; id: string }, to: string) => {
    if (h.reduced) return arrive(to, 0, ++seq, door.id);
    const my = ++seq;
    showRings(null);
    dropPano(false); // the glide happens in the geometry
    const p = pose(to);
    const mid = h.toWorld(door.m, EYE);
    const start = camera.position.clone();
    const a = start.distanceTo(mid);
    const b = mid.distanceTo(p.at);
    const split = a / (a + b || 1);
    const yaw0 = view.yaw;
    const pitch0 = view.pitch;
    const short = (from: number, a: number) => from + Math.atan2(Math.sin(a - from), Math.cos(a - from)); // the short way round
    const yawGo = short(yaw0, yawTo(mid, p.at)); // through the door facing the way of travel…
    const v = arrivalView(to) ?? { yaw: yawGo, pitch: 0 }; // (hall, walkable: keep facing the way of travel)
    const yaw1 = short(yawGo, v.yaw); // …then turn to the room's focus
    const t = { p: 0 };
    moveLamp(to);
    await new Promise<void>((resolve) =>
      run(t, {
        p: 1,
        duration: 1.2,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (t.p < split) camera.position.lerpVectors(start, mid, t.p / split);
          else camera.position.lerpVectors(mid, p.at, (t.p - split) / (1 - split || 1));
          view.yaw = t.p < split ? yaw0 + (yawGo - yaw0) * (t.p / split) : yawGo + (yaw1 - yawGo) * ((t.p - split) / (1 - split || 1));
          view.pitch = pitch0 + (v.pitch - pitch0) * t.p;
          apply();
        },
        onComplete: resolve,
        onInterrupt: resolve,
      }),
    );
    if (my !== seq) return; // stopped (Esc / Back) or overtaken
    current = to;
    showRings(to);
    void showPano(to);
    o.onArrive(to);
  };

  const arrive = async (id: string, glide: number, my = ++seq, via?: string) => {
    const p = pose(id);
    const v = arrivalView(id) ?? { yaw: p.yaw, pitch: 0 };
    view.yaw = v.yaw;
    view.pitch = v.pitch;
    current = id;
    moveLamp(id);
    showRings(id);
    if (h.reduced || glide === 0) {
      await fade(0);
      if (my !== seq) return;
      camera.position.copy(p.at);
      camera.fov = FOV;
      apply();
      h.request();
      o.onArrive(id); // review r8 L9: announce as the view changes, not after the fade back in
      await fade(1);
    } else await fly({ at: p.at, quat: quatFor(view.yaw, view.pitch), fov: FOV }, glide);
    if (my !== seq) return; // stopped (Esc / Back) or overtaken: no arrival
    void showPano(id);
    if (!h.reduced && glide) o.onArrive(id);
  };

  return {
    get room() {
      return current;
    },
    async enter(id) {
      // a ledge or an unknown id (an old link) starts in the living room instead
      if (!known(id) || !canStand(id)) id = (data.rooms.find((r) => r.name === 'livingDining' && canStand(r.id)) ?? data.rooms.find((r) => canStand(r.id)))!.id;
      h.spots.classList.add('is-walking');
      h.setDriver(driver);
      listen(true);
      inside(true);
      if (!hinted) {
        hinted = true;
        hint.hidden = false;
        setTimeout(() => (hint.hidden = true), 4000);
      }
      const my = ++seq;
      if (h.reduced) {
        enclose(true, 0, 0);
        await arrive(id, 0, my);
        return;
      }
      enclose(true, 0.6, 1.0);
      await arrive(id, 1.6, my);
    },
    goTo(id) {
      if (known(id) && canStand(id)) return arrive(id, 0);
      if (current) o.onArrive(current); // not a destination: stay, and put the state back
      return Promise.resolve();
    },
    async exit() {
      const my = ++seq;
      stopAll(); // a fly-in, glide or delayed cut still running
      const back = new PerspectiveCamera(30, camera.aspect);
      h.orbitPose(back);
      current = null;
      showRings(null);
      dropPano(true);
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
      if (my !== seq) return; // stepped back in meanwhile
      h.spots.classList.remove('is-walking');
      inside(false);
      listen(false);
      h.setDriver(null);
    },
    destroy() {
      listen(false);
      ui.remove();
      inside(false);
      h.root.remove(dress, lamp);
      own.forEach((x) => x.dispose());
      h.root.remove(ceiling);
    },
  };
}
