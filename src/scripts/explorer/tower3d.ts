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
  MeshStandardMaterial,
  NoColorSpace,
  Object3D,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  RepeatWrapping,
  Scene,
  Shape,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';
import type { MeshStandardMaterialParameters } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { prefersReducedMotion } from '../motion';
import { onVisibility } from '../lazy';

type P2 = [number, number];
type Tower3d = typeof import('../../data/tower3d.json');

const DEG = Math.PI / 180;
const AZ = -35 * DEG;
const EL = 14 * DEG;
const ORBIT = 50 * DEG;
const SWAY = 5 * DEG;

export interface TowerAdapter {
  /** Show (resume rendering) or hide (stop). */
  show(on: boolean): void;
  /** Light one floor's glazing warm (T4 refines this per unit), or none. */
  setLit(floor: number | null): void;
  /** Triangles and draw calls of the last frame (QA). */
  stats(): { tris: number; calls: number };
  destroy(): void;
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

export async function createTower(host: HTMLElement, o: { onFail: () => void }): Promise<TowerAdapter> {
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
    return { a, b, l, u, n, at, cuts: [] as [number, number][], wins: [] as { t0: number; t1: number; sill: number; head: number; traced: boolean }[] };
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
  const glazing = d.glazing.map((g) => ({ a: c(g.a), b: c(g.b), sill: g.sill, head: g.head, used: false }));

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
      wallRun(l, at, wins.map((w) => ({ t0: w.t0, t1: w.t1, sill: w.g.sill, head: w.g.head, traced: true })), 0.2, 0);
    });
  }

  /** Wall pieces along a run of length l with window openings, and the glass in them. */
  function wallRun(l: number, at: (t: number) => P2, wins: { t0: number; t1: number; sill: number; head: number; traced: boolean }[], t: number, off: number, glassOff = 0) {
    let cur = 0;
    for (const w of [...wins].sort((x, y) => x.t0 - y.t0)) {
      if (w.t0 > cur + 0.01) parts.wall.push(box(at(cur), at(w.t0), SL, FH, t, off));
      const [A, B] = [at(w.t0), at(w.t1)];
      if (w.sill > 0.01) parts.wall.push(box(A, B, SL, SL + w.sill, t, off));
      if (SL + w.head < FH - 0.01) parts.wall.push(box(A, B, SL + w.head, FH, t, off));
      (w.traced ? parts.traced : parts.illus).push(pane(A, B, SL + w.sill, SL + Math.min(w.head, FH - SL), glassOff));
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
    hit.e.wins.push({ t0: hit.t0, t1: hit.t1, sill: g.sill, head: g.head, traced: true });
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
      if (free(m - wb.width / 2, m + wb.width / 2)) e.wins.push({ t0: m - wb.width / 2, t1: m + wb.width / 2, sill: wb.sill, head: wb.head, traced: false });
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
  const std = (color: string, x: MeshStandardMaterialParameters = {}) => k(new MeshStandardMaterial({ color, roughness: 0.85, ...x }));
  const mats = {
    slab: std('#E4DED4'),
    wall: std(fs.wall, { side: DoubleSide }),
    front: std(fr.colour),
    rail: std(fr.railColour, { roughness: 0.5 }),
    traced: std(fs.glass.colour, { roughness: 0.3, envMapIntensity: 0.5, transparent: true, opacity: 0.92, side: DoubleSide }),
    illus: std(fs.glass.colour, { roughness: 0.3, envMapIntensity: 0.5, transparent: true, opacity: 0.92, side: DoubleSide }),
  };
  // the walls' inner faces read dark through the glass
  mats.wall.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\nif (!gl_FrontFacing) diffuseColor.rgb *= 0.25;');
  };
  // T4 hook: a per-floor "lit" amount warms and lights the glazing
  const lit = new Color(fs.glass.litColour);
  for (const m of [mats.traced, mats.illus]) {
    m.onBeforeCompile = (s) => {
      s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nattribute float aLit;\nvarying float vLit;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLit = aLit;');
      s.fragmentShader = s.fragmentShader
        .replace('#include <common>', `#include <common>\nvarying float vLit;\nconst vec3 LIT = vec3(${lit.r.toFixed(3)}, ${lit.g.toFixed(3)}, ${lit.b.toFixed(3)});`)
        .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor = mix(diffuseColor, vec4(LIT, 1.0), vLit);')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += LIT * vLit * 0.9;');
    };
  }

  /* ---------- floors: one instance per typical floor ---------- */
  const typical = d.levels.filter((l) => l.status === 'plan');
  const lits: InstancedBufferAttribute[] = [];
  const m4 = new Matrix4();
  const floorGeo = {} as Record<keyof typeof parts, BufferGeometry>;
  for (const key of Object.keys(parts) as (keyof typeof parts)[]) {
    const flat = parts[key].map((x) => (x.index ? x.toNonIndexed() : x)); // boxes are indexed, extrusions are not
    const g = k(mergeGeometries(flat)!);
    [...parts[key], ...flat].forEach((x) => x.dispose());
    floorGeo[key] = g;
    const im = new InstancedMesh(g, mats[key], typical.length);
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
  if (fins.length) solid(mergeGeometries(fins)!, std(fs.fin.colour));
  fins.forEach((x) => x.dispose());

  // the planned storey: the same parts, faint, with a dashed gold edge; then the roof
  const planned = d.levels.find((l) => l.status === 'planned');
  let roofY = top.y0 + top.h;
  if (planned) {
    for (const key of Object.keys(parts) as (keyof typeof parts)[]) {
      const m = k(mats[key].clone());
      m.transparent = true;
      m.opacity = 0.35 * (key === 'traced' || key === 'illus' ? 0.6 : 1);
      m.depthWrite = false;
      solid(floorGeo[key].clone(), m, false).position.y = planned.y0;
    }
    const pts: number[] = [];
    for (const y of [planned.y0 + SL, planned.y0 + planned.h]) outline.forEach((a, i) => pts.push(a[0], y, a[1], ...[outline[(i + 1) % outline.length]![0], y, outline[(i + 1) % outline.length]![1]]));
    const lg = k(new BufferGeometry());
    lg.setAttribute('position', new Float32BufferAttribute(pts, 3));
    const line = new LineSegments(lg, k(new LineDashedMaterial({ color: '#B59458', dashSize: 0.9, gapSize: 0.6 })));
    line.computeLineDistances();
    scene.add(line);
    roofY = planned.y0 + planned.h;
  }
  const white = std(fs.wall);
  solid(prism(outline, roofY, SL), white);
  solid(mergeGeometries(edges.map((e) => box(e.a, e.b, roofY + SL, roofY + SL + H.parapet, 0.2, -side * 0.1)))!, white);
  const xs = outline.map((p) => p[0]);
  const zs = outline.map((p) => p[1]);
  const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
  const pr = fs.roof.plantRoom;
  solid(prism([[x0 + pr.inset + 4, z0 + pr.inset], [x1 - pr.inset, z0 + pr.inset], [x1 - pr.inset, z1 - pr.inset], [x0 + pr.inset + 4, z1 - pr.inset]], roofY + SL, pr.h), white);

  /* ---------- ground storey ---------- */
  const gc = fs.groundCladding;
  const g0 = d.levels[0]!;
  const stripes = k(
    gradient(4, 64, (x) => {
      x.fillStyle = gc.colour;
      x.fillRect(0, 0, 4, 64);
      x.fillStyle = 'rgba(255,255,255,0.18)';
      for (let y = 0; y < 64; y += 16) x.fillRect(0, y, 4, 3);
    }),
  );
  stripes.wrapS = stripes.wrapT = RepeatWrapping;
  stripes.repeat.set(1, 1 / 1.2);
  const base = inset(outline, 0.6);
  solid(prism(base, 0, g0.h), std('#FFFFFF', { map: stripes }));
  const shop: BufferGeometry[] = [];
  let entrance: { a: P2; b: P2; l: number } | null = null;
  base.forEach((a, i) => {
    const b = base[(i + 1) % base.length]!;
    if (!street(edges[i]!)) return;
    const l = len(a, b);
    if (!entrance || l > entrance.l) entrance = { a, b, l };
    for (let t = 0.6; t + 3.0 < l - 0.3; t += 3.6) {
      const at = (s: number): P2 => [a[0] + ((b[0] - a[0]) / l) * s, a[1] + ((b[1] - a[1]) / l) * s];
      shop.push(pane(at(t), at(t + 3.0), 0.15, gc.shopfrontHead, side * 0.03));
    }
  });
  if (shop.length) solid(mergeGeometries(shop)!, std(gc.shopfrontGlass, { roughness: 0.2, metalness: 0.3 }), false);
  shop.forEach((x) => x.dispose());
  if (entrance) {
    const { a, b, l } = entrance as { a: P2; b: P2; l: number };
    const u: P2 = [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
    const w = Math.min(10, l * 0.4);
    const m: P2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const A: P2 = [m[0] - (u[0] * w) / 2, m[1] - (u[1] * w) / 2];
    const B: P2 = [m[0] + (u[0] * w) / 2, m[1] + (u[1] * w) / 2];
    const cn = gc.canopy;
    const out = (p: P2, s: number): P2 => [p[0] - u[1] * side * s, p[1] + u[0] * side * s];
    solid(mergeGeometries([box(A, B, cn.height, cn.height + 0.35, cn.depth, side * (cn.depth / 2)), box(out(A, cn.depth - 0.3), out(A, cn.depth), 0, cn.height, 0.3), box(out(B, cn.depth - 0.3), out(B, cn.depth), 0, cn.height, 0.3)])!, std(cn.colour));
  }

  /* ---------- T2: city context (generic) ---------- */
  const cx2 = d.context;
  const R = cx2.ground.radius;
  const fade = k(
    gradient(256, 256, (x) => {
      const g = x.createRadialGradient(128, 128, 60, 128, 128, 128);
      g.addColorStop(0, '#fff');
      g.addColorStop(1, '#000');
      x.fillStyle = g;
      x.fillRect(0, 0, 256, 256);
    }),
  );
  fade.colorSpace = NoColorSpace;
  solid(new CircleGeometry(R, 64).rotateX(-Math.PI / 2), std(cx2.ground.colour, { alphaMap: fade, transparent: true, depthWrite: false }), false).renderOrder = -1;
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
  solid(mergeGeometries(road)!, std(cx2.road.colour, { roughness: 0.95 }), false);
  solid(mergeGeometries(walk)!, std(cx2.pavement.colour), false);
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
    const r = bl.minDistance + 10 + rand() * 40;
    const p: P2 = [Math.sin(ang) * r, Math.cos(ang) * r];
    const w = 12 + rand() * 10;
    const dd = 12 + rand() * 10;
    if (nearRoad(p, rw / 2 + Math.max(w, dd) / 2 + 2) || insideTower(p, 10 + w / 2)) continue;
    if ((p[0] * camDir[0] + p[1] * camDir[1]) / r > Math.cos(55 * DEG)) continue;
    if (boxes.some((q) => Math.hypot(q.p[0] - p[0], q.p[1] - p[1]) < (q.w + w) / 2 + 4)) continue;
    boxes.push({ p, w, dd, h: bl.minH + rand() * (bl.maxH - bl.minH) });
  }
  const blocks = new InstancedMesh(k(new BoxGeometry(1, 1, 1).translate(0, 0.5, 0)), std(bl.colour), boxes.length);
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
    const t = new InstancedMesh(k(trunkG), std(trunkC), n);
    const cr = new InstancedMesh(k(crownG), std(crownC, { flatShading: true, side: DoubleSide }), n);
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

  /* ---------- T3: sky, light, environment ---------- */
  scene.background = k(
    gradient(2, 256, (x) => {
      const g = x.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, '#9DB7CC');
      g.addColorStop(1, '#F3ECE2');
      x.fillStyle = g;
      x.fillRect(0, 0, 2, 256);
    }),
  );
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

  /* ---------- T3: camera ---------- */
  const towerTop = roofY + SL + H.parapet;
  const span = Math.max(x1 - x0, z1 - z0);
  let dist = 120;
  const fit = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const tv = Math.tan((camera.fov * DEG) / 2);
    dist = Math.max(towerTop / (0.82 * 2 * tv), span / (0.9 * 2 * tv * camera.aspect)) + span / 2;
    renderer.setSize(w, h, false);
  };
  const view = { az: AZ, sway: 0 };
  const place = () => {
    const az = view.az + view.sway;
    const ce = Math.cos(EL);
    camera.position.set(Math.sin(az) * ce * dist, towerTop * 0.48 + Math.sin(EL) * dist, Math.cos(az) * ce * dist);
    camera.lookAt(0, towerTop * 0.48, 0);
  };

  /* ---------- render loop ---------- */
  let frame = 0;
  let visible = true;
  let shown = true;
  let destroyed = false;
  let dragging = false;
  let vel = 0;
  let idleSince = performance.now();
  const tick = (now: number) => {
    frame = 0;
    if (destroyed || !visible || !shown) return;
    let again = false;
    if (!dragging && Math.abs(vel) > 1e-4) {
      view.az = Math.max(AZ - ORBIT, Math.min(AZ + ORBIT, view.az + vel));
      vel *= 0.92;
      again = true;
    }
    if (!reduced && !dragging) {
      // the sway eases in after a second of rest
      const k2 = Math.min(1, (now - idleSince) / 2000);
      view.sway += (Math.sin((now / 24000) * Math.PI * 2) * SWAY * k2 - view.sway) * 0.05;
      again = true;
    }
    place();
    renderer.render(scene, camera);
    if (again) request();
  };
  const request = () => {
    if (!frame && !destroyed) frame = requestAnimationFrame(tick);
  };

  let lastX = 0;
  const onDown = (e: PointerEvent) => {
    dragging = true;
    lastX = e.clientX;
    vel = 0;
    if (e.pointerType === 'mouse') canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    vel = -((e.clientX - lastX) / canvas.clientWidth) * Math.PI * 0.6;
    lastX = e.clientX;
    view.az = Math.max(AZ - ORBIT, Math.min(AZ + ORBIT, view.az + vel));
    request();
  };
  const onUp = (e: PointerEvent) => {
    dragging = false;
    idleSince = performance.now();
    canvas.style.cursor = 'grab';
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    request();
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.style.cursor = 'grab';
  const onLost = (e: Event) => {
    e.preventDefault();
    console.warn('[explorer] WebGL context lost; keeping the photo stage');
    o.onFail();
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
  // the photo stage stays underneath until the first frame is up, then the tower fades in over it
  canvas.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduced ? 0 : 600, fill: 'forwards' });
  request();

  return {
    show(on) {
      shown = on;
      canvas.hidden = !on;
      if (on) {
        fit();
        request();
      } else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
    setLit(floor) {
      for (const a of lits) {
        (a.array as Float32Array).fill(0);
        const i = typical.findIndex((l) => l.floor === floor);
        if (i >= 0) a.array[i] = 1;
        a.needsUpdate = true;
      }
      request();
    },
    stats: () => ({ tris: renderer.info.render.triangles, calls: renderer.info.render.calls }),
    destroy() {
      destroyed = true;
      if (frame) cancelAnimationFrame(frame);
      ro.disconnect();
      stopVis();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('webglcontextlost', onLost);
      scene.traverse((x) => (x as Mesh).geometry?.dispose());
      keep.forEach((x) => x.dispose());
      renderer.dispose();
      canvas.remove();
    },
  };
}
