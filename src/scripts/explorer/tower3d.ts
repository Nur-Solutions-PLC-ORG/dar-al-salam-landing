/**
 * The real 3D tower (DESIGN §9.9, rev 10: T1 geometry, T2 city context, T3 light and camera). Built in code from
 * src/data/tower3d.json (`npm run assets:tower3d`, from design's docs/design/tower3d.json); a lazy chunk, tier 2 only.
 *
 * - T1 floors: every typical floor is the same set of parts (slab, façade walls with window and balcony openings, balcony
 *   fronts and rails, traced glazing, illustrative glazing), drawn as one InstancedMesh per part with one instance per
 *   floor, so the 14 floors cost 6 draw calls and a floor can later slide out on its own (T4). Balconies are recesses
 *   inside the outline: the façade wall opens over their outer edges, a grey front and rail stand on the outline, and
 *   the recess gets side and back walls, with the traced glazing set into the back walls. Window bays without a traced
 *   opening get the illustrative punched windows of `facadeStyle.windowBay` in their own mesh, so they can be removed if
 *   the client supplies real positions. White fins on the two street faces; ground storey (cladding, shopfronts,
 *   canopy); the planned storey at 0.35 opacity with a dashed gold edge; roof slab, parapet and plant room.
 * - T2: a round ground fading out, road and pavement on the two street sides, instanced palms and trees, ten plain
 *   blocks, a gradient sky. Generic: no real buildings, signs or cars.
 * - T3: a warm sun from the south-west (38°) with soft shadows baked once, a hemisphere light and a RoomEnvironment,
 *   ACES tone mapping; fov 30, azimuth −35°, elevation 14°, fitted to 82% of the stage height; drag orbits ±50° with
 *   inertia (vertical swipes scroll the page); idle sway ±5° over 24 s; no zoom.
 *
 * Quality tiers: desktop (fine pointer, ≥ 1024 px) renders at up to 2× DPR with 2048² shadows, phones at 1.5× and 1024².
 * Rendering stops off-screen, in a hidden tab and while hidden; reduced motion renders on demand (no sway).
 */
import {
  ACESFilmicToneMapping,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  HemisphereLight,
  IcosahedronGeometry,
  InstancedBufferAttribute,
  InstancedMesh,
  LineDashedMaterial,
  LineSegments,
  Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Raycaster,
  RepeatWrapping,
  Scene,
  Shape,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import type { MeshStandardMaterialParameters } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gsap, prefersReducedMotion } from '../motion';
import type { ModelAdapter, ModelCallbacks } from './types';
import { onVisibility } from '../lazy';

type P2 = [number, number];
/** A window opening along a run; `u` is the unit it belongs to (index into tower3d.units), for the per-unit lit rule. */
type Win = { t0: number; t1: number; sill: number; head: number; traced: boolean; u: number };
type Tower3d = typeof import('../../data/tower3d.json');

const DEG = Math.PI / 180;
const AZ = -35 * DEG;
const EL = 14 * DEG;
const ORBIT = 50 * DEG;
const SWAY = 5 * DEG;

/** The 3D tower is a tower stage like the photo (ModelAdapter), plus showing/hiding and QA stats. */
export interface TowerAdapter extends ModelAdapter {
  /** Show (resume rendering) or hide (stop). */
  show(on: boolean): void;
  /** T5: the chosen unit on the assembled floor (the others sink and fade), or none. */
  selectUnit(code: string | null): void;
  /** T5: units to be confirmed on the shown floor (hatched). */
  setTbc(codes: ReadonlySet<string>): void;
  /** Triangles and draw calls of the last frame (QA). */
  stats(): { tris: number; calls: number };
}

/* ---------- small geometry helpers (plan x/z, already centred; y up) ---------- */
const len = (a: P2, b: P2) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const area = (p: P2[]) => p.reduce((s, [x0, z0], i) => s + x0 * p[(i + 1) % p.length]![1] - p[(i + 1) % p.length]![0] * z0, 0) / 2;
/** A box along a→b from y0 to y1, t thick, its centre pushed `off` along the edge's left normal (−dz, dx). */
const box = (a: P2, b: P2, y0: number, y1: number, t: number, off = 0) => {
  const g = new BoxGeometry(len(a, b), y1 - y0, t);
  g.translate(0, (y0 + y1) / 2, off);
  g.rotateY(-Math.atan2(b[1] - a[1], b[0] - a[0]));
  g.translate((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2);
  return g;
};
/** A vertical pane along a→b (two-sided), pushed `off` along the left normal. */
const pane = (a: P2, b: P2, y0: number, y1: number, off = 0) => {
  const g = new PlaneGeometry(len(a, b), y1 - y0);
  g.translate(0, (y0 + y1) / 2, off);
  g.rotateY(-Math.atan2(b[1] - a[1], b[0] - a[0]));
  g.translate((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2);
  return g;
};
/** A polygon extruded from y0 up by h. */
const prism = (p: P2[], y0: number, h: number) => {
  const s = new Shape();
  p.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
  const g = new ExtrudeGeometry(s, { depth: h, bevelEnabled: false }).rotateX(-Math.PI / 2);
  g.translate(0, y0, 0);
  return g;
};
/** Move a polygon's edges inward by d (miter joins); for the ground storey's 0.6 m set-back. */
const inset = (p: P2[], d: number): P2[] => {
  const s = area(p) > 0 ? 1 : -1; // left normal points inside when the area is positive
  const lines = p.map((a, i) => {
    const b = p[(i + 1) % p.length]!;
    const l = len(a, b);
    const n: P2 = [(-(b[1] - a[1]) / l) * s * d, ((b[0] - a[0]) / l) * s * d];
    return [[a[0] + n[0], a[1] + n[1]], [b[0] + n[0], b[1] + n[1]]] as [P2, P2];
  });
  return lines.map((cur, i) => {
    const [[x1, z1], [x2, z2]] = lines[(i + lines.length - 1) % lines.length]!;
    const [[x3, z3], [x4, z4]] = cur;
    const den = (x1 - x2) * (z3 - z4) - (z1 - z2) * (x3 - x4);
    if (Math.abs(den) < 1e-6) return cur[0];
    const t = ((x1 - x3) * (z3 - z4) - (z1 - z3) * (x3 - x4)) / den;
    return [x1 + t * (x2 - x1), z1 + t * (z2 - z1)] as P2;
  });
};
/** Deterministic pseudo-random numbers (the scene looks the same on every visit). */
const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

const gradient = (w: number, h: number, paint: (c: CanvasRenderingContext2D) => void) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  paint(c.getContext('2d')!);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
};

export async function createTower(
  host: HTMLElement,
  stage: HTMLElement,
  cb: ModelCallbacks & { onFail: () => void; label: (floor: number) => string; unitLabel: (code: string) => string; onUnit: (code: string) => void },
): Promise<TowerAdapter> {
  const d: Tower3d = (await import('../../data/tower3d.json')).default;
  const hi = matchMedia('(pointer: fine)').matches && innerWidth >= 1024;
  const reduced = prefersReducedMotion();

  const renderer = new WebGLRenderer({ antialias: hi || devicePixelRatio < 2, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, hi ? 2 : 1.5));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.shadowMap.autoUpdate = false; // nothing moves at rest: baked once
  const canvas = renderer.domElement;
  canvas.className = 'tower3d';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.tabIndex = -1;
  canvas.style.touchAction = 'pan-y';
  host.append(canvas);

  const keep: { dispose(): void }[] = [];
  const k = <T extends { dispose(): void }>(x: T) => (keep.push(x), x);
  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 1, 900);

  /* ---------- the plate ---------- */
  const [cx, cz] = d.centre as P2;
  const c = (p: number[]): P2 => [p[0]! - cx, p[1]! - cz];
  const outline = d.outline.map(c);
  const side = area(outline) > 0 ? -1 : 1; // × left normal = outward
  const fs = d.facadeStyle;
  const H = d.heights;
  const WALL = 0.25;
  const edges = outline.map((a, i) => {
    const b = outline[(i + 1) % outline.length]!;
    const l = len(a, b);
    const u: P2 = [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
    const n: P2 = [-u[1] * side, u[0] * side]; // outward
    const at = (t: number): P2 => [a[0] + u[0] * t, a[1] + u[1] * t];
    return { a, b, l, u, n, at, cuts: [] as [number, number][], wins: [] as Win[] };
  });
  const street = (e: (typeof edges)[number]) => e.n[1] > 0.7 || e.n[0] < -0.7; // south (+z) and west (−x) faces
  /** The outline edge a plan segment lies along (parallel, within `tol` inside it), and its span on that edge. */
  const onOutline = (a: P2, b: P2, tol: number) => {
    const m: P2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const u: P2 = [(b[0] - a[0]) / len(a, b), (b[1] - a[1]) / len(a, b)];
    for (const e of edges) {
      if (Math.abs(u[0] * e.u[1] - u[1] * e.u[0]) > 0.26) continue;
      const s = (m[0] - e.a[0]) * e.n[0] + (m[1] - e.a[1]) * e.n[1];
      const tm = (m[0] - e.a[0]) * e.u[0] + (m[1] - e.a[1]) * e.u[1];
      if (s < -tol || s > 0.5 || tm < 0 || tm > e.l) continue; // traced edges can sit a little outside the outline
      const ta = (a[0] - e.a[0]) * e.u[0] + (a[1] - e.a[1]) * e.u[1];
      const tb = (b[0] - e.a[0]) * e.u[0] + (b[1] - e.a[1]) * e.u[1];
      return { e, t0: Math.max(0, Math.min(ta, tb)), t1: Math.min(e.l, Math.max(ta, tb)) };
    }
    return null;
  };

  const FH = H.typical;
  const SL = H.slab;
  const parts = { slab: [] as BufferGeometry[], wall: [] as BufferGeometry[], front: [] as BufferGeometry[], rail: [] as BufferGeometry[], traced: [] as BufferGeometry[], illus: [] as BufferGeometry[] };
  parts.slab.push(prism(outline, 0, SL));
  const UNITS = Object.keys(d.units);
  const cents = Object.values(d.units).map((u) => c(u.centroid));
  const nearest = (p: P2) => cents.reduce((bi, q, i) => (len(p, q) < len(p, cents[bi]!) ? i : bi), 0);
  const glazing = d.glazing.map((g) => ({ a: c(g.a), b: c(g.b), sill: g.sill, head: g.head, used: false, u: UNITS.indexOf(g.unit) }));

  // balconies: open the façade over each outer edge, put the front and rail on the outline, wall the recess
  const fr = fs.balconyFront;
  for (const bal of d.balconies) {
    const p = bal.poly.map(c);
    const bs = area(p) > 0 ? -1 : 1;
    p.forEach((a, i) => {
      const b = p[(i + 1) % p.length]!;
      const l = len(a, b);
      if (l < 0.05) return;
      const n: P2 = [(-(b[1] - a[1]) / l) * bs, ((b[0] - a[0]) / l) * bs];
      const hit = onOutline(a, b, 1.5);
      if (hit && hit.e.n[0] * n[0] + hit.e.n[1] * n[1] > 0.9) {
        const { e, t0, t1 } = hit;
        e.cuts.push([t0, t1]);
        const [A, B] = [e.at(t0), e.at(t1)];
        parts.front.push(box(A, B, SL, SL + fr.height, 0.12, -side * 0.06));
        parts.rail.push(box(A, B, SL + fr.height, SL + fr.height + 0.06, 0.08, -side * 0.06));
        // side walls from the balcony's corners out to the outline
        for (const [q, Q] of [[a, e.at((a[0] - e.a[0]) * e.u[0] + (a[1] - e.a[1]) * e.u[1])], [b, e.at((b[0] - e.a[0]) * e.u[0] + (b[1] - e.a[1]) * e.u[1])]] as [P2, P2][]) {
          if (len(q, Q) > 0.05) parts.wall.push(box(q, Q, SL, FH, 0.2));
        }
        return;
      }
      // a back or side wall of the recess, with any traced glazing that lies on it
      const wins = glazing
        .filter((g) => !g.used && Math.abs((g.b[0] - g.a[0]) * n[0] + (g.b[1] - g.a[1]) * n[1]) < 0.26 * len(g.a, g.b))
        .filter((g) => Math.abs(((g.a[0] + g.b[0]) / 2 - a[0]) * n[0] + ((g.a[1] + g.b[1]) / 2 - a[1]) * n[1]) < 0.3)
        .map((g) => {
          const ta = ((g.a[0] - a[0]) * (b[0] - a[0]) + (g.a[1] - a[1]) * (b[1] - a[1])) / l;
          const tb = ((g.b[0] - a[0]) * (b[0] - a[0]) + (g.b[1] - a[1]) * (b[1] - a[1])) / l;
          return { g, t0: Math.max(0, Math.min(ta, tb)), t1: Math.min(l, Math.max(ta, tb)) };
        })
        .filter((w) => w.t1 - w.t0 > 0.3);
      wins.forEach((w) => (w.g.used = true));
      const at = (t: number): P2 => [a[0] + ((b[0] - a[0]) / l) * t, a[1] + ((b[1] - a[1]) / l) * t];
      wallRun(l, at, wins.map((w) => ({ t0: w.t0, t1: w.t1, sill: w.g.sill, head: w.g.head, traced: true, u: w.g.u })), 0.2, 0);
    });
  }

  /** Wall pieces along a run of length l with window openings, and the glass in them. */
  function wallRun(l: number, at: (t: number) => P2, wins: Win[], t: number, off: number, glassOff = 0) {
    let cur = 0;
    for (const w of [...wins].sort((x, y) => x.t0 - y.t0)) {
      if (w.t0 > cur + 0.01) parts.wall.push(box(at(cur), at(w.t0), SL, FH, t, off));
      const [A, B] = [at(w.t0), at(w.t1)];
      if (w.sill > 0.01) parts.wall.push(box(A, B, SL, SL + w.sill, t, off));
      if (SL + w.head < FH - 0.01) parts.wall.push(box(A, B, SL + w.head, FH, t, off));
      const g = pane(A, B, SL + w.sill, SL + Math.min(w.head, FH - SL), glassOff);
      g.setAttribute('aUnit', new Float32BufferAttribute(new Float32Array(g.getAttribute('position').count).fill(w.u), 1));
      (w.traced ? parts.traced : parts.illus).push(g);
      cur = Math.max(cur, w.t1);
    }
    if (l > cur + 0.01) parts.wall.push(box(at(cur), at(l), SL, FH, t, off));
  }

  // traced glazing on the façade line itself
  for (const g of glazing) {
    if (g.used) continue;
    const hit = onOutline(g.a, g.b, 0.8);
    if (!hit) continue;
    g.used = true;
    hit.e.wins.push({ t0: hit.t0, t1: hit.t1, sill: g.sill, head: g.head, traced: true, u: g.u });
  }
  // façade walls: illustrative punched windows on a 3.6 m grid wherever the wall is free
  const wb = fs.windowBay;
  const fins: BufferGeometry[] = [];
  const f1 = d.levels.find((l) => l.id === 'f1')!;
  const top = d.levels.filter((l) => l.status === 'plan').at(-1)!;
  for (const e of edges) {
    const busy = [...e.cuts, ...e.wins.map((w) => [w.t0, w.t1] as [number, number])];
    const free = (t0: number, t1: number) => t0 > 0.3 && t1 < e.l - 0.3 && busy.every(([b0, b1]) => t1 < b0 - 0.3 || t0 > b1 + 0.3);
    for (let i = 0; (i + 0.5) * wb.spacing < e.l; i++) {
      const m = (i + 0.5) * wb.spacing;
      if (free(m - wb.width / 2, m + wb.width / 2)) e.wins.push({ t0: m - wb.width / 2, t1: m + wb.width / 2, sill: wb.sill, head: wb.head, traced: false, u: nearest(e.at(m)) });
    }
    // the façade, split around the balcony openings
    let cur = 0;
    for (const [c0, c1] of [...e.cuts, [e.l, e.l] as [number, number]].sort((x, y) => x[0] - y[0])) {
      if (c0 > cur + 0.01) {
        const s0 = cur;
        wallRun(c0 - s0, (t) => e.at(s0 + t), e.wins.filter((w) => w.t0 >= s0 && w.t1 <= c0).map((w) => ({ ...w, t0: w.t0 - s0, t1: w.t1 - s0 })), WALL, -side * (WALL / 2), -side * 0.05);
      }
      cur = Math.max(cur, c1);
    }
    if (!street(e)) continue;
    const fin = fs.fin;
    for (let t = fin.spacing; t < e.l - 0.3; t += fin.spacing) {
      if (e.cuts.some(([c0, c1]) => t > c0 - 0.3 && t < c1 + 0.3)) continue;
      const p = e.at(t);
      const q = e.at(t + fin.width);
      fins.push(box(p, q, f1.y0, top.y0 + top.h, fin.depth, side * (fin.depth / 2)));
    }
  }

  /* ---------- materials ---------- */
  // design's early tower fixes (rev 10): whiter walls than the cream data value, and the film's grey-blue glass
  const WALL_C = '#F7F5F1';
  const GLASS_C = '#5B7388';
  const std = (color: string, x: MeshStandardMaterialParameters = {}) => k(new MeshStandardMaterial({ color, roughness: 0.85, ...x }));
  const mats = {
    slab: std('#E4DED4'),
    wall: std(WALL_C, { side: DoubleSide }),
    front: std(fr.colour),
    rail: std(fr.railColour, { roughness: 0.5 }),
    traced: std(GLASS_C, { roughness: 0.15, envMapIntensity: 0.6, transparent: true, opacity: 0.8, side: DoubleSide }),
    illus: std(GLASS_C, { roughness: 0.15, envMapIntensity: 0.6, transparent: true, opacity: 0.8, side: DoubleSide }),
  };
  // the walls' inner faces read dark through the glass
  mats.wall.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\nif (!gl_FrontFacing) diffuseColor.rgb *= 0.25;');
  };
  // T4 hook: a per-floor "lit" amount warms and lights the glazing
  const lit = new Color('#FFC46B'); // design T4 fix 3: the reference's amber, obvious at a glance
  const uSkip = { value: -1 }; // the unit whose glazing stays dark (BL01 off its two-bedroom floors)
  for (const m of [mats.traced, mats.illus]) {
    m.onBeforeCompile = (s) => {
      s.uniforms.uSkip = uSkip;
      s.vertexShader = s.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aLit;\nattribute float aUnit;\nuniform float uSkip;\nvarying float vLit;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLit = aLit * step(0.5, abs(aUnit - uSkip));');
      s.fragmentShader = s.fragmentShader
        .replace('#include <common>', `#include <common>\nvarying float vLit;\nconst vec3 LIT = vec3(${lit.r.toFixed(3)}, ${lit.g.toFixed(3)}, ${lit.b.toFixed(3)});`)
        .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor = mix(diffuseColor, vec4(LIT, 1.0), vLit);')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += LIT * vLit * 1.6;');
    };
  }

  /* ---------- floors: one instance per typical floor ---------- */
  const typical = d.levels.filter((l) => l.status === 'plan');
  const lits: InstancedBufferAttribute[] = [];
  const ims: InstancedMesh[] = [];
  /** What rises with the floors above a chosen floor, and what drops with the floors below (T4 slide-out). */
  const above: Object3D[] = [];
  const below: Object3D[] = [];
  const m4 = new Matrix4();
  const floorGeo = {} as Record<keyof typeof parts, BufferGeometry>;
  // design (rev 10.8): the floors above dissolve as they leave — a per-instance dither, so no transparency sorting
  const fades: InstancedBufferAttribute[] = [];
  const dissolve = (m: MeshStandardMaterial, key: string) => {
    const prev = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => {
      prev.call(m, sh, r);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aFade;\nvarying float vFade;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFade = aFade;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vFade;')
        .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif (vFade < 0.999 && fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) > vFade) discard;');
    };
    m.customProgramCacheKey = () => `tower-floor-${key}`; // each part keeps its own program (the patches differ)
  };
  for (const key of Object.keys(parts) as (keyof typeof parts)[]) {
    const flat = parts[key].map((x) => (x.index ? x.toNonIndexed() : x)); // boxes are indexed, extrusions are not
    const g = k(mergeGeometries(flat)!);
    [...parts[key], ...flat].forEach((x) => x.dispose());
    floorGeo[key] = g;
    const im = new InstancedMesh(g, mats[key], typical.length);
    ims.push(im);
    const fa = new InstancedBufferAttribute(new Float32Array(typical.length).fill(1), 1);
    g.setAttribute('aFade', fa);
    fades.push(fa);
    dissolve(mats[key], key);
    typical.forEach((l, i) => im.setMatrixAt(i, m4.makeTranslation(0, l.y0, 0)));
    if (key === 'traced' || key === 'illus') {
      const a = new InstancedBufferAttribute(new Float32Array(typical.length), 1);
      g.setAttribute('aLit', a);
      lits.push(a);
    } else {
      im.castShadow = true;
    }
    im.receiveShadow = true;
    scene.add(im);
  }
  const solid = (g: BufferGeometry, m: Material, cast = true) => {
    const mesh = new Mesh(k(g), m);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  };
  const finMesh = fins.length ? solid(mergeGeometries(fins)!, std(fs.fin.colour)) : null;
  fins.forEach((x) => x.dispose());

  // the planned storey: the same parts, faint, with a dashed gold edge; then the roof
  const planned = d.levels.find((l) => l.status === 'planned');
  let roofY = top.y0 + top.h;
  if (planned) {
    for (const key of Object.keys(parts) as (keyof typeof parts)[]) {
      const m = k(mats[key].clone());
      m.userData.base = 0.35 * (key === 'traced' || key === 'illus' ? 0.6 : 1);
      m.transparent = true;
      m.opacity = 0.35 * (key === 'traced' || key === 'illus' ? 0.6 : 1);
      m.depthWrite = false;
      const pm = solid(floorGeo[key].clone(), m, false);
      pm.position.y = planned.y0;
      above.push(pm);
    }
    const pts: number[] = [];
    for (const y of [planned.y0 + SL, planned.y0 + planned.h]) outline.forEach((a, i) => pts.push(a[0], y, a[1], ...[outline[(i + 1) % outline.length]![0], y, outline[(i + 1) % outline.length]![1]]));
    const lg = k(new BufferGeometry());
    lg.setAttribute('position', new Float32BufferAttribute(pts, 3));
    const line = new LineSegments(lg, k(new LineDashedMaterial({ color: '#B59458', dashSize: 0.9, gapSize: 0.6, transparent: true })));
    line.computeLineDistances();
    scene.add(line);
    above.push(line);
    roofY = planned.y0 + planned.h;
  }
  const white = std(WALL_C, { transparent: true }); // the roof fades out with the floors above (T4)
  above.push(solid(prism(outline, roofY, SL), white), solid(mergeGeometries(edges.map((e) => box(e.a, e.b, roofY + SL, roofY + SL + H.parapet, 0.2, -side * 0.1)))!, white));
  const xs = outline.map((p) => p[0]);
  const zs = outline.map((p) => p[1]);
  const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
  const pr = fs.roof.plantRoom;
  above.push(solid(prism([[x0 + pr.inset + 4, z0 + pr.inset], [x1 - pr.inset, z0 + pr.inset], [x1 - pr.inset, z1 - pr.inset], [x0 + pr.inset + 4, z1 - pr.inset]], roofY + SL, pr.h), white));

  /* ---------- ground storey ---------- */
  const gc = fs.groundCladding;
  const g0 = d.levels[0]!;
  const stripes = k(
    gradient(4, 64, (x) => {
      x.fillStyle = '#A39C92'; // a lighter stone than the shopfront glass below it (design fix 5)
      x.fillRect(0, 0, 4, 64);
      x.fillStyle = 'rgba(255,255,255,0.22)';
      for (let y = 0; y < 64; y += 16) x.fillRect(0, y, 4, 3);
    }),
  );
  stripes.wrapS = stripes.wrapT = RepeatWrapping;
  stripes.repeat.set(1, 1 / 1.2);
  const base = inset(outline, 0.6);
  below.push(solid(prism(base, 0, g0.h), std('#FFFFFF', { map: stripes })));
  const shop: BufferGeometry[] = [];
  const mull: BufferGeometry[] = [];
  let entrance: { a: P2; b: P2; l: number } | null = null;
  base.forEach((a, i) => {
    const b = base[(i + 1) % base.length]!;
    if (!street(edges[i]!) || len(a, b) < 1.5) return;
    const l = len(a, b);
    if (!entrance || l > entrance.l) entrance = { a, b, l };
    const at = (s: number): P2 => [a[0] + ((b[0] - a[0]) / l) * s, a[1] + ((b[1] - a[1]) / l) * s];
    // shopfront glass up to shopfrontHead, white mullions on the fins' 3.6 m grid (design fix 5)
    shop.push(pane(at(0.15), at(l - 0.15), 0.15, gc.shopfrontHead, side * 0.03));
    for (let t = fs.fin.spacing; t < l - 0.3; t += fs.fin.spacing) mull.push(box(at(t), at(t + 0.25), 0, gc.shopfrontHead, 0.3, side * 0.15));
  });
  if (shop.length) below.push(solid(mergeGeometries(shop)!, std(gc.shopfrontGlass, { roughness: 0.2, metalness: 0.3 }), false));
  if (mull.length) below.push(solid(mergeGeometries(mull)!, std(fs.fin.colour)));
  [...shop, ...mull].forEach((x) => x.dispose());
  if (entrance) {
    const { a, b, l } = entrance as { a: P2; b: P2; l: number };
    const u: P2 = [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
    const w = Math.min(10, l * 0.4);
    const m: P2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const A: P2 = [m[0] - (u[0] * w) / 2, m[1] - (u[1] * w) / 2];
    const B: P2 = [m[0] + (u[0] * w) / 2, m[1] + (u[1] * w) / 2];
    const cn = gc.canopy;
    const out = (p: P2, s: number): P2 => [p[0] - u[1] * side * s, p[1] + u[0] * side * s];
    below.push(solid(mergeGeometries([box(A, B, cn.height, cn.height + 0.35, cn.depth, side * (cn.depth / 2)), box(out(A, cn.depth - 0.3), out(A, cn.depth), 0, cn.height, 0.3), box(out(B, cn.depth - 0.3), out(B, cn.depth), 0, cn.height, 0.3)])!, std(cn.colour)));
  }

  /* ---------- T2: city context (generic) ---------- */
  const cx2 = d.context;
  const R = cx2.ground.radius;
  /** Blocks and trees that fade out in the final floor view (design rev 10.8: nothing floats over the floor). */
  const ctxMats: MeshStandardMaterial[] = [];
  const ctxFade = (m: MeshStandardMaterial) => ((m.userData.base = m.opacity), ctxMats.push(m), m);
  /** Design T4 fix 5: the context fades into the section's navy with distance from the tower (a clear canvas). */
  const fadeOut = <M extends MeshStandardMaterial>(m: M, r0: number, r1: number) => {
    m.transparent = true;
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vFadeXZ;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvec4 fw = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nfw = instanceMatrix * fw;\n#endif\nvFadeXZ = (modelMatrix * fw).xz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vFadeXZ;')
        .replace('#include <dithering_fragment>', `#include <dithering_fragment>\ngl_FragColor.a *= 1.0 - smoothstep(${r0.toFixed(1)}, ${r1.toFixed(1)}, length(vFadeXZ));`);
    };
    return m;
  };
  solid(new CircleGeometry(R, 64).rotateX(-Math.PI / 2), fadeOut(std('#8E8A82'), R * 0.3, R * 0.6), false).renderOrder = -1; // writes depth: the lowered storeys sink out of sight (T4)
  // the two street faces' longest edges set the roads' directions
  const longest = (f: (e: (typeof edges)[number]) => boolean) => edges.filter(f).sort((p, q) => q.l - p.l)[0]!;
  const roadSides = [longest((e) => e.n[1] > 0.7), longest((e) => e.n[0] < -0.7)];
  const road: BufferGeometry[] = [];
  const walk: BufferGeometry[] = [];
  const rw = cx2.road.width;
  const pw = cx2.pavement.width;
  const roadLines: { p: P2; n: P2 }[] = [];
  roadSides.forEach((e, i) => {
    // run the strip ±R along the edge's direction, offset out from the face
    const m: P2 = [(e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2];
    const A: P2 = [m[0] - e.u[0] * R, m[1] - e.u[1] * R];
    const B: P2 = [m[0] + e.u[0] * R, m[1] + e.u[1] * R];
    walk.push(box(A, B, 0, 0.15 + i * 0.002, pw + 1, side * (pw / 2 - 0.5)));
    road.push(box(A, B, 0, 0.02 + i * 0.004, rw, side * (pw + rw / 2)));
    roadLines.push({ p: [m[0] + e.n[0] * (pw + rw / 2), m[1] + e.n[1] * (pw + rw / 2)], n: e.n });
  });
  solid(mergeGeometries(road)!, fadeOut(std('#2E3138', { roughness: 0.95 }), R * 0.3, R * 0.6), false);
  solid(mergeGeometries(walk)!, fadeOut(std('#A39E95'), R * 0.3, R * 0.6), false);
  [...road, ...walk].forEach((x) => x.dispose());
  const nearRoad = (p: P2, w: number) => roadLines.some((r) => Math.abs((p[0] - r.p[0]) * r.n[0] + (p[1] - r.p[1]) * r.n[1]) < w);
  const insideTower = (p: P2, w: number) => p[0] > x0 - w && p[0] < x1 + w && p[1] > z0 - w && p[1] < z1 + w;
  const rand = rng(7);
  const camDir: P2 = [Math.sin(AZ), Math.cos(AZ)];

  // blocks: plain boxes beyond 28 m, kept out of the roads and out of the camera's line to the tower
  const bl = cx2.blocks;
  const boxes: { p: P2; w: number; dd: number; h: number }[] = [];
  for (let tries = 0; boxes.length < bl.count && tries < 400; tries++) {
    const ang = rand() * Math.PI * 2;
    const r = 40 + rand() * 45;
    const p: P2 = [Math.sin(ang) * r, Math.cos(ang) * r];
    const w = 12 + rand() * 10;
    const dd = 12 + rand() * 10;
    if (nearRoad(p, rw / 2 + Math.max(w, dd) / 2 + 2) || insideTower(p, bl.minDistance + Math.hypot(w, dd) / 2)) continue; // ≥ 28 m clear
    if ((p[0] * camDir[0] + p[1] * camDir[1]) / r > Math.cos(55 * DEG)) continue;
    if (boxes.some((q) => Math.hypot(q.p[0] - p[0], q.p[1] - p[1]) < (q.w + w) / 2 + 4)) continue;
    boxes.push({ p, w, dd, h: bl.minH + rand() * (bl.maxH - bl.minH) });
  }
  const blocks = new InstancedMesh(k(new BoxGeometry(1, 1, 1).translate(0, 0.5, 0)), ctxFade(fadeOut(std('#CFC9BE', { opacity: 0.8 }), R * 0.55, R * 0.95)), boxes.length); // quieter than the tower (fix 6)
  const dummy = new Object3D();
  boxes.forEach((b, i) => {
    dummy.position.set(b.p[0], 0, b.p[1]);
    dummy.rotation.set(0, -Math.atan2(roadSides[0]!.u[1], roadSides[0]!.u[0]), 0); // square to the south street
    dummy.scale.set(b.w, b.h, b.dd);
    dummy.updateMatrix();
    blocks.setMatrixAt(i, dummy.matrix);
  });
  blocks.castShadow = blocks.receiveShadow = true;
  scene.add(blocks);

  // palms along the two street faces' pavements; trees scattered beyond the roads
  const plant = (n: number, trunkG: BufferGeometry, crownG: BufferGeometry, trunkC: string, crownC: string, spots: { p: P2; s: number }[]) => {
    const t = new InstancedMesh(k(trunkG), ctxFade(fadeOut(std(trunkC), R * 0.45, R * 0.8)), n);
    const cr = new InstancedMesh(k(crownG), ctxFade(fadeOut(std(crownC, { flatShading: true, side: DoubleSide }), R * 0.45, R * 0.8)), n);
    spots.slice(0, n).forEach(({ p, s }, i) => {
      dummy.position.set(p[0], 0, p[1]);
      dummy.rotation.set(0, rand() * 6.28, 0);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      t.setMatrixAt(i, dummy.matrix);
      cr.setMatrixAt(i, dummy.matrix);
    });
    t.count = cr.count = Math.min(n, spots.length);
    for (const m of [t, cr]) {
      m.castShadow = m.receiveShadow = true;
      scene.add(m);
    }
  };
  const palmSpots: { p: P2; s: number }[] = [];
  roadSides.forEach((e) => {
    for (let i = 0; palmSpots.length < cx2.palms && i < cx2.palms; i++) {
      const t = 2 + ((i + 0.5) * e.l) / Math.ceil(cx2.palms / 2);
      if (t > e.l + 8) break;
      const p = e.at(t);
      palmSpots.push({ p: [p[0] + e.n[0] * (pw - 1), p[1] + e.n[1] * (pw - 1)], s: 0.85 + rand() * 0.35 });
    }
  });
  plant(
    cx2.palms,
    new CylinderGeometry(0.14, 0.22, 7, 6).translate(0, 3.5, 0),
    new ConeGeometry(3, 1.6, 8, 1, true).rotateX(Math.PI).translate(0, 7, 0),
    '#8A7660',
    '#5C7A3C',
    palmSpots,
  );
  const treeSpots: { p: P2; s: number }[] = [];
  for (let tries = 0; treeSpots.length < cx2.trees && tries < 600; tries++) {
    const ang = rand() * Math.PI * 2;
    const r = 24 + rand() * 50;
    const p: P2 = [Math.sin(ang) * r, Math.cos(ang) * r];
    if (nearRoad(p, rw / 2 + 2) || insideTower(p, 4) || boxes.some((b) => Math.hypot(b.p[0] - p[0], b.p[1] - p[1]) < Math.max(b.w, b.dd) / 2 + 3)) continue;
    treeSpots.push({ p, s: 0.8 + rand() * 0.5 });
  }
  plant(cx2.trees, new CylinderGeometry(0.18, 0.26, 2.6, 6).translate(0, 1.3, 0), new IcosahedronGeometry(2.3, 0).scale(1, 0.85, 1).translate(0, 3.9, 0), '#7A6A55', '#4F6B3A', treeSpots);
  const ctxMeshes = scene.children.filter((x) => ctxMats.includes((x as Mesh).material as MeshStandardMaterial));

  /* ---------- T3: sky, light, environment ---------- */
  // design fix 1: no sky disc; the canvas stays clear over the section's navy and a soft CSS glow sits behind the tower
  const pm = new PMREMGenerator(renderer);
  scene.environment = k(pm.fromScene(new RoomEnvironment(), 0.04).texture);
  scene.environmentIntensity = 0.3;
  pm.dispose();
  scene.add(new HemisphereLight('#DCE8F2', '#8F887C', 0.8));
  const sun = new DirectionalLight('#FFE3BD', 2.6);
  const se = 38 * DEG;
  sun.position.set(-Math.cos(se) * Math.SQRT1_2 * 120, Math.sin(se) * 120 + 20, Math.cos(se) * Math.SQRT1_2 * 120);
  sun.target.position.set(0, 20, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(hi ? 2048 : 1024);
  Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 20, far: 320 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.05;
  sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun, sun.target);

  /* ---------- T3: camera (fitted by projection: ground to the top of the planned storey = 82% of the stage) ---------- */
  const towerTop = roofY;
  const corners = [0, towerTop].flatMap((y) => outline.map(([x, z]) => new Vector3(x, y, z)));
  const view = { az: AZ, sway: 0 };
  // T4: push (camera in toward the chosen floor) and slide (that floor out, the rest apart), both 0 → 1
  const part = { push: 0, slide: 0, floor: 0, cut: 0, unit: 0 }; // T5: cut = the assembled floor in, unit = one chosen
  let plate: import('./tower-floor').AssembledFloor | null = null;
  let plateJob: Promise<void> | null = null;
  let chosenUnit: string | null = null;
  let tbcSet: ReadonlySet<string> = new Set();
  const rest = { dist: 120, ty: towerTop / 2 };
  const out: P2 = [Math.sin(AZ), Math.cos(AZ)]; // the camera's ground direction at rest; a chosen floor slides along it
  const midY = (n: number) => {
    const l = typical.find((x) => x.floor === n);
    return l ? l.y0 + l.h / 2 : towerTop / 2;
  };
  let near = 60; // the push-in distance for the chosen floor (fitFloor)
  const place = (dist = rest.dist, ty = rest.ty) => {
    const az = view.az + view.sway;
    const p = part.push;
    // aim from the tower's middle to the chosen floor's middle, which slides 14 m out toward the camera
    const s = 14 * part.slide;
    const uc = plate?.units.find((u) => u.code === chosenUnit)?.centre;
    const ax = out[0] * s * p + (uc ? uc.x * part.unit : 0);
    const az2 = out[1] * s * p + (uc ? uc.z * part.unit : 0);
    const ay = ty + (midY(part.floor) - ty) * p;
    // push: in toward the floor at the street-corner angle; slide: on to the slid-out floor, rising to 52°
    const sl = part.slide;
    const dd = dist + (dist * 0.6 - dist) * p + (near - dist * 0.6) * sl;
    const el = EL + 6 * DEG * p * (1 - sl) + (52 * DEG - EL) * sl;
    camera.position.set(ax + Math.sin(az) * Math.cos(el) * dd, ay + Math.sin(el) * dd, az2 + Math.cos(az) * Math.cos(el) * dd);
    camera.lookAt(ax, ay, az2);
    camera.updateMatrixWorld();
  };
  const v3 = new Vector3();
  const extent = (pts = corners) => {
    let lo = 1, hi2 = -1, l = 1, r = -1;
    for (const c of pts) {
      v3.copy(c).project(camera);
      lo = Math.min(lo, v3.y);
      hi2 = Math.max(hi2, v3.y);
      l = Math.min(l, v3.x);
      r = Math.max(r, v3.x);
    }
    return { h: (hi2 - lo) / 2, w: (r - l) / 2, mid: (hi2 + lo) / 2 };
  };
  const fit = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    // the distance where the tower fills 82% of the height (and ≤ 86% of the width), then centre it. Measured at
    // rest (review r9a H1: a refit while a floor is out used to fold the push-in into the rest view)
    const az = view.az;
    const was = { push: part.push, slide: part.slide, unit: part.unit, sway: view.sway };
    Object.assign(part, { push: 0, slide: 0, unit: 0 });
    view.az = AZ;
    view.sway = 0;
    rest.ty = towerTop / 2;
    let a = 30, b = 600;
    for (let i = 0; i < 24; i++) {
      const m = (a + b) / 2;
      place(m, rest.ty);
      const e = extent();
      if (e.h > 0.82 || e.w > 0.86) a = m;
      else b = m;
    }
    rest.dist = b;
    for (let i = 0; i < 3; i++) {
      place(rest.dist, rest.ty);
      // centre it in the room under the hint chip (56 px): aim so its mid sits 28 px below the stage's middle
      rest.ty += (extent().mid + 56 / h) * Math.tan((camera.fov * DEG) / 2) * rest.dist;
    }
    view.az = az;
    Object.assign(part, { push: was.push, slide: was.slide, unit: was.unit });
    view.sway = was.sway;
    fitFloor();
    // the CSS glow sits at the tower's mid-height on screen
    place();
    v3.set(0, towerTop / 2, 0).project(camera);
    canvas.style.setProperty('--glow-y', `${(((1 - v3.y) / 2) * 100).toFixed(1)}%`);
  };

  /** T4: the distance where the slid-out floor, seen from 52°, spans 70% of the stage width. */
  function fitFloor() {
    const l = typical.find((x) => x.floor === part.floor) ?? typical[0]!;
    const pts = [l.y0, l.y0 + l.h].flatMap((y) => outline.map(([x, z]) => new Vector3(x + out[0] * 14, y, z + out[1] * 14)));
    const keep2 = { push: part.push, slide: part.slide, az: view.az, sway: view.sway };
    Object.assign(part, { push: 1, slide: 1 });
    Object.assign(view, { az: AZ, sway: 0 });
    let a = 10, b = 400;
    for (let i = 0; i < 24; i++) {
      near = (a + b) / 2;
      place();
      const e = extent(pts);
      if (e.w > 0.7 || e.h > 0.85) a = near; // its bounding box at 70% of the stage width (design T4 fix 2)
      else b = near;
    }
    near = b;
    Object.assign(part, { push: keep2.push, slide: keep2.slide });
    Object.assign(view, { az: keep2.az, sway: keep2.sway });
  }

  /* ---------- T4: floors apart ---------- */
  const ci = () => typical.findIndex((l) => l.floor === part.floor);
  const arrange = () => {
    const k2 = part.slide;
    const c = ci();
    // above: 1.6 m with the slide, then on up out of the frame as the camera rises to 52° (it would hide the floor)
    const up = 1.6 * k2 + 60 * Math.max(0, (k2 - 0.35) / 0.65) ** 2;
    const keep3 = c < 0 ? 1 : 1 - Math.min(1, Math.max(0, (k2 - 0.35) / 0.45)); // the floors above dissolve as they leave
    for (const im of ims) {
      typical.forEach((l, i) => {
        const dy = c < 0 ? 0 : i > c ? up : i < c ? -1.6 * k2 : 0;
        const s = i === c ? 14 * k2 : 0;
        // gone entirely once dissolved (no stray shadow from above the frame)
        if (i > c && c >= 0 && keep3 < 0.02) im.setMatrixAt(i, m4.makeScale(0, 0, 0));
        else im.setMatrixAt(i, m4.makeTranslation(out[0] * s, l.y0 + dy, out[1] * s));
      });
      im.instanceMatrix.needsUpdate = true;
    }
    fades.forEach((fa, k3) => {
      // T5 cutaway: the chosen floor keeps its slab (k3 = 0); its façade, balconies and glass dissolve as the plate comes in
      typical.forEach((_, i) => (fa.array[i] = c >= 0 && i > c ? keep3 : c >= 0 && i === c && k3 > 0 ? 1 - part.cut : 1));
      fa.needsUpdate = true;
    });
    if (plate) {
      plate.group.visible = c >= 0 && part.cut > 0.01;
      plate.group.position.set(out[0] * 14 * k2, (typical[c]?.y0 ?? 0) + SL, out[1] * 14 * k2);
      for (const u of plate.units) {
        const other = chosenUnit !== null && u.code !== chosenUnit;
        u.group.position.y = other ? -0.4 * part.unit : 0;
        for (const m of u.mats) m.opacity = part.cut * (other ? 1 - 0.75 * part.unit : 1);
      }
    }
    for (const o2 of above) {
      o2.position.y = ((o2.userData.y0 as number | undefined) ?? (o2.userData.y0 = o2.position.y)) + (c < 0 ? 0 : up);
      o2.visible = keep3 > 0.02;
      const m = (o2 as Mesh).material as MeshStandardMaterial;
      m.opacity = ((m.userData.base as number | undefined) ?? 1) * keep3;
    }
    for (const m of ctxMats) m.opacity = (m.userData.base as number) * (1 - k2);
    for (const x of ctxMeshes) x.visible = k2 < 0.98; // gone, they cast no shadow either
    for (const o2 of below) o2.position.y = ((o2.userData.y0 as number | undefined) ?? (o2.userData.y0 = o2.position.y)) - (c < 0 ? 0 : 1.6 * k2);
    if (finMesh) finMesh.visible = k2 < 0.02; // the fins run through every storey; they step aside while it's apart
    lid.visible = c >= 0 && k2 > 0.01 && part.cut < 0.5;
    if (lid.visible) lid.position.set(out[0] * 14 * k2, typical[c]!.y0, out[1] * 14 * k2);
    edge.position.set(c >= 0 && litFloor === part.floor ? out[0] * 14 * k2 : 0, (typical.find((l) => l.floor === litFloor)?.y0 ?? 0) + (c < 0 || litFloor === part.floor ? 0 : 1.6 * k2 * Math.sign(typical.findIndex((l) => l.floor === litFloor) - c)), c >= 0 && litFloor === part.floor ? out[1] * 14 * k2 : 0);
  };
  ims.forEach((im) => (im.frustumCulled = false)); // instances move; the tower is always in view

  /* ---------- T4: lit glazing (0.25 s), gold slab edge ---------- */
  // the lit floor's slab edge turns gold (design T4 fix 3): a thin band just proud of the slab
  const edge = new Mesh(k(mergeGeometries(edges.map((e) => box(e.a, e.b, -0.02, SL + 0.02, 0.06, side * 0.05)))!), k(new MeshBasicMaterial({ color: '#D9A441' })));
  edge.visible = false;
  scene.add(edge);
  // until T5 fills it, the slid-out floor gets a plain slab top so it isn't see-through (design T4 fix 2)
  const lid = new Mesh(k(prism(outline, FH - 0.04, 0.04)), std('#DAD4C8'));
  lid.visible = false;
  lid.castShadow = true;
  scene.add(lid);
  const litAmt = new Float32Array(typical.length);
  let litFloor: number | null = null;
  const BL01 = UNITS.indexOf('BL01');
  const setLit = (n: number | null) => {
    litFloor = n;
    edge.visible = n !== null;
    // BL01's bay lights only on its two-bedroom floors (lit.rule)
    uSkip.value = n !== null && !d.twoBedFloors.includes(n) ? BL01 : -1;
    arrange();
    request();
  };
  const litStep = (dt: number) => {
    let moving = false;
    typical.forEach((l, i) => {
      const want = l.floor === litFloor ? 1 : 0;
      const v = litAmt[i]!;
      if (v === want) return;
      litAmt[i] = reduced ? want : want > v ? Math.min(1, v + dt / 0.25) : Math.max(0, v - dt / 0.25);
      moving = true;
    });
    if (moving)
      for (const a of lits) {
        (a.array as Float32Array).set(litAmt);
        a.needsUpdate = true;
      }
    return moving;
  };

  /* ---------- T4: pins (HTML, projected each frame) ---------- */
  const PINS = [2, 5, 8, 11, 14].filter((n) => typical.some((l) => l.floor === n));
  // the street corner: the outline vertex furthest toward the camera
  const corner = outline.reduce((b2, p) => (p[0] * out[0] + p[1] * out[1] > b2[0] * out[0] + b2[1] * out[1] ? p : b2));
  const layer = document.createElement('div');
  layer.className = 'tower-pins';
  layer.setAttribute('aria-hidden', 'true');
  const leaders = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  leaders.setAttribute('class', 'tower-pins__lines');
  layer.append(leaders);
  stage.append(layer);
  const pins = PINS.map((n) => {
    const b2 = document.createElement('button');
    b2.type = 'button';
    b2.tabIndex = -1;
    b2.className = 'tower-pin';
    b2.dataset.floor = String(n);
    b2.innerHTML = '<span class="tower-pin__card"></span>';
    b2.firstElementChild!.textContent = cb.label(n); // "Floor 8 · 1 × 2-bed · 8 × 3-bed" (design T4 fix 4)
    b2.addEventListener('click', () => cb.onPick(n));
    b2.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && hoverFloor(n));
    b2.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && hoverFloor(null));
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    leaders.append(line);
    layer.append(b2);
    return { n, b: b2, line, at: new Vector3(), from: new Vector3() };
  });
  const toStage = (p: Vector3) => {
    const cr = canvas.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    v3.copy(p).project(camera);
    return { x: cr.left - sr.left + ((v3.x + 1) / 2) * cr.width, y: cr.top - sr.top + ((1 - v3.y) / 2) * cr.height };
  };
  const projectPins = () => {
    layer.hidden = part.push > 0.01 || !shown;
    if (layer.hidden) return;
    for (const p of pins) {
      const y = midY(p.n);
      p.from.set(corner[0], y, corner[1]);
      p.at.set(corner[0] + out[0] * 7 - out[1] * 3, y, corner[1] + out[1] * 7 + out[0] * 3);
      const A = toStage(p.at);
      const F = toStage(p.from);
      p.b.style.transform = `translate(${A.x}px, ${A.y}px)`;
      p.b.classList.toggle('is-on', litFloor === p.n);
      // the card flips to the dot's left when it would cross the stage's right edge
      p.b.classList.toggle('is-flip', A.x + 30 + (p.b.firstElementChild as HTMLElement).offsetWidth > stage.clientWidth - 12);
      p.line.setAttribute('x1', String(A.x));
      p.line.setAttribute('y1', String(A.y));
      p.line.setAttribute('x2', String(F.x));
      p.line.setAttribute('y2', String(F.y));
    }
  };
  /** The chip anchor for floor n: the street corner at that floor (stage px); a pinned floor shows its own card. */
  const anchor = (n: number) => (PINS.includes(n) ? null : ((A) => ({ x: A.x + 26, y: A.y }))(toStage(v3.set(corner[0], midY(n), corner[1]).clone())));

  /* ---------- T4: hover and picking by raycast (an invisible prism of the typical floors) ---------- */
  const hit = new Mesh(k(prism(outline, f1.y0, top.y0 + top.h - f1.y0)), mats.slab);
  hit.updateMatrixWorld();
  const ray = new Raycaster();
  const ndc = new Vector2();
  const floorAt = (e: PointerEvent | MouseEvent) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const h2 = ray.intersectObject(hit)[0];
    return h2 ? (typical.find((l) => h2.point.y >= l.y0 && h2.point.y < l.y0 + l.h)?.floor ?? null) : null;
  };
  let selected: number | null = null;
  let hovered: number | null = null;
  const hoverFloor = (n: number | null) => {
    if (selected !== null || n === hovered) return;
    hovered = n;
    setLit(n);
    cb.onHover(null); // drop the previous chip (a pinned floor shows its card instead)
    if (n) cb.onHover(n, anchor(n) ?? undefined);
  };

  /* ---------- T5: the assembled floor (its own chunk, with the nine unit JSONs) ---------- */
  const loadPlate = () =>
    (plateJob ??= import('./tower-floor')
      .then((m) => m.buildFloor(d))
      .then((f) => {
        if (destroyed) return f.dispose();
        plate = f;
        f.group.visible = false;
        f.setTbc(tbcSet);
        scene.add(f.group);
        f.group.updateMatrixWorld(true);
        arrange();
        renderer.shadowMap.needsUpdate = true;
        request();
      })
      .catch((err: unknown) => console.warn('[explorer] assembled floor unavailable; the plain floor stays', err)));
  const unitAt = (e: PointerEvent) => {
    if (!plate || part.cut < 0.99) return null;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    plate.group.updateMatrixWorld(true);
    const h3 = ray.intersectObjects(plate.units.map((u) => u.floor))[0];
    return h3 ? (plate.units.find((u) => u.floor === h3.object)?.code ?? null) : null;
  };
  // the unit chip: "BL05 · 3 bedroom · 169.23 m²" over the hovered unit (to be confirmed: "BL01 · To be confirmed")
  const uchip = document.createElement('p');
  uchip.className = 'tower-uchip';
  uchip.setAttribute('aria-hidden', 'true');
  uchip.hidden = true;
  stage.append(uchip);
  let hovUnit: string | null = null;
  let touchUnit: string | null = null;
  const GOLD = new Color('#F0C46A');
  function hoverUnit(code: string | null) {
    if (code === hovUnit) return;
    hovUnit = code;
    // the hovered unit turns gold (a colour tint: emissive washes out to white under ACES on these light walls)
    for (const u of plate?.units ?? [])
      u.mats.forEach((m) => {
        const base = ((m.userData.base as Color | undefined) ??= m.color.clone());
        m.color.copy(base);
        if (u.code === code) m.color.multiply(GOLD);
      });
    uchip.hidden = !code;
    if (code) uchip.textContent = cb.unitLabel(code);
    placeChip();
    request();
  }
  const placeChip = () => {
    const u = plate?.units.find((x) => x.code === hovUnit);
    if (!u || !plate) return;
    const A = toStage(v3.copy(u.centre).add(plate.group.position).setY(plate.group.position.y + 1.2).clone());
    uchip.style.transform = `translate(${A.x}px, ${A.y}px) translate(-50%, -100%)`;
  };

  /* ---------- render loop ---------- */
  let frame = 0;
  let visible = true;
  let shown = true;
  let destroyed = false;
  let dragging = false;
  let tweening = 0;
  let vel = 0;
  let last = performance.now();
  let idleSince = last;
  const tick = (now: number) => {
    frame = 0;
    if (destroyed || !visible || !shown) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    let again = tweening > 0 || litStep(dt);
    if (!dragging && Math.abs(vel) > 1e-4) {
      view.az = Math.max(AZ - ORBIT, Math.min(AZ + ORBIT, view.az + vel));
      vel *= 0.92;
      again = true;
    }
    if (!reduced && !dragging && part.push === 0) {
      // the sway eases in after a second of rest
      const k2 = Math.min(1, (now - idleSince) / 2000);
      view.sway += (Math.sin((now / 24000) * Math.PI * 2) * SWAY * k2 - view.sway) * 0.05;
      again = true;
    }
    if (tweening > 0) {
      arrange();
      renderer.shadowMap.needsUpdate = true; // the floors move: shadows follow
    }
    place();
    renderer.render(scene, camera);
    projectPins();
    if (hovUnit) placeChip();
    if (again) request();
  };
  const request = () => {
    if (!frame && !destroyed) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };
  const run = (vars: gsap.TweenVars) => {
    tweening++;
    // the end state is applied even if no frame was drawn during the tween (a slow device, a hidden tab)
    const settle = () => {
      tweening--;
      arrange();
      renderer.shadowMap.needsUpdate = true;
      request();
    };
    return gsap.to(part, { ...vars, onComplete: settle, onInterrupt: settle });
  };

  let downX = 0;
  let downY = 0;
  let lastX = 0;
  let touchPick: number | null = null;
  const onDown = (e: PointerEvent) => {
    cb.onInteract();
    dragging = true;
    downX = lastX = e.clientX;
    downY = e.clientY;
    vel = 0;
    if (e.pointerType === 'mouse') canvas.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) {
      if (e.pointerType === 'mouse') {
        if (selected === null) hoverFloor(floorAt(e));
        else hoverUnit(unitAt(e));
      }
      return;
    }
    if (selected !== null) return; // apart: no orbit
    vel = -((e.clientX - lastX) / canvas.clientWidth) * Math.PI * 0.6;
    lastX = e.clientX;
    view.az = Math.max(AZ - ORBIT, Math.min(AZ + ORBIT, view.az + vel));
    if (Math.abs(e.clientX - downX) > 6) canvas.style.cursor = 'grabbing';
    request();
  };
  const onUp = (e: PointerEvent) => {
    const moved = Math.hypot(e.clientX - downX, e.clientY - downY) > 6;
    dragging = false;
    idleSince = performance.now();
    canvas.style.cursor = 'grab';
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    request();
    if (moved || e.type === 'pointercancel') return;
    if (selected !== null) {
      // T5: on the assembled floor a click picks a unit; on touch the first tap shows its chip
      const u = unitAt(e);
      if (!u) return;
      if (e.pointerType === 'mouse' || touchUnit === u) {
        touchUnit = null;
        cb.onUnit(u);
      } else {
        touchUnit = u;
        hoverUnit(u);
      }
      return;
    }
    // a click picks; on touch the first tap previews and a second tap on the same floor picks
    const n = floorAt(e);
    if (n === null) return;
    if (e.pointerType === 'mouse' || touchPick === n) {
      touchPick = null;
      cb.onPick(n);
    } else {
      touchPick = n;
      hovered = null;
      hoverFloor(n);
    }
  };
  const onLeave = (e: PointerEvent) => e.pointerType === 'mouse' && !dragging && (selected === null ? hoverFloor(null) : hoverUnit(null));
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.style.cursor = 'grab';
  const onLost = (e: Event) => {
    e.preventDefault();
    console.warn('[explorer] WebGL context lost; keeping the photo stage');
    cb.onFail();
  };
  canvas.addEventListener('webglcontextlost', onLost);
  const ro = new ResizeObserver(() => {
    fit();
    renderer.shadowMap.needsUpdate = true;
    request();
  });
  ro.observe(host);
  const stopVis = onVisibility(host, (v) => {
    visible = v && document.visibilityState === 'visible';
    if (visible) request();
  });

  fit();
  place();
  renderer.shadowMap.needsUpdate = true;
  renderer.render(scene, camera);
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  // the photo stage stays underneath until the first frame is up, then the tower fades in over it (T6: 0.6 s)
  const shownIn = canvas.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduced ? 0 : 600, fill: 'forwards' });
  // the canvas is clear (navy shows through), so the photo under it steps aside once the tower is in
  void shownIn.finished.then(() => !destroyed && host.setAttribute('data-tower3d', ''));
  request();

  return {
    show(on) {
      shown = on;
      canvas.hidden = !on;
      layer.hidden = !on;
      if (on) {
        fit();
        request();
      } else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
    preview(n) {
      if (selected !== null) return;
      hovered = n;
      setLit(n);
    },
    select(n) {
      if (n === selected) return;
      const was = selected;
      selected = n;
      touchPick = null;
      hovered = null;
      gsap.killTweensOf(part);
      tweening = 0;
      if (n !== null) {
        cb.onHover(null); // the chip would sit stale over a moving view
        part.floor = n;
        fitFloor();
        setLit(n);
        vel = 0;
        if (reduced || was !== null) {
          // reduced motion cross-fades straight to the floor; changing floors keeps the tower apart
          part.push = part.slide = 1;
          void loadPlate().then(() => selected === n && ((part.cut = 1), arrange(), request()));
          arrange();
          request();
          return;
        }
        gsap.to(view, { az: AZ, sway: 0, duration: 1.2, ease: 'power3.inOut' });
        run({ push: 1, duration: 1.2, ease: 'power3.inOut' });
        run({ slide: 1, duration: 0.9, delay: 0.9, ease: 'power3.out' });
        // T5: the assembled floor fades in once the floor is out (and its units have loaded)
        void Promise.all([loadPlate(), new Promise((r) => setTimeout(r, 1800))]).then(() => {
          if (selected === n && plate) run({ cut: 1, duration: 0.6, ease: 'power2.out' });
        });
      } else {
        setLit(null);
        chosenUnit = null;
        hoverUnit(null);
        part.unit = 0;
        if (reduced) {
          part.push = part.slide = part.cut = 0;
          arrange();
          request();
          return;
        }
        run({ cut: 0, duration: 0.3 });
        run({ push: 0, slide: 0, duration: 1.2, delay: 0.2, ease: 'power3.inOut' });
      }
      request();
    },
    selectUnit(code) {
      if (code === chosenUnit) return;
      chosenUnit = code;
      hoverUnit(null);
      if (reduced) {
        part.unit = code ? 1 : 0;
        arrange();
        request();
        return;
      }
      if (code) part.unit = 0;
      run({ unit: code ? 1 : 0, duration: 0.5, ease: 'power2.inOut' });
      request();
    },
    setTbc(codes) {
      tbcSet = codes;
      plate?.setTbc(codes);
      request();
    },
    anchor: (n) => (selected === null ? anchor(n) : null),
    stats: () => ({ tris: renderer.info.render.triangles, calls: renderer.info.render.calls }),
    destroy() {
      destroyed = true;
      if (frame) cancelAnimationFrame(frame);
      gsap.killTweensOf([part, view]);
      ro.disconnect();
      stopVis();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('webglcontextlost', onLost);
      layer.remove();
      uchip.remove();
      plate?.dispose();
      host.removeAttribute('data-tower3d');
      scene.traverse((x) => (x as Mesh).geometry?.dispose());
      keep.forEach((x) => x.dispose());
      renderer.dispose();
      canvas.remove();
    },
  };
}
