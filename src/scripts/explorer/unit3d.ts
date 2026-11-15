/**
 * The unit "dollhouse" (DESIGN §9.6.3–§9.6.4 rev 8): a Three.js cutaway of one home, built from the plan's own
 * measurements (src/data/units3d). Imported by the controller on the first UNIT entry with `has3d`; reuses the
 * tier 2 renderer and canvas (one WebGL context) and swaps scenes.
 *
 * Draw calls are kept low by merging: every wall, header, sill and column is ONE mesh. Two vertex attributes drive
 * the shader: `aDelay` (the staggered rise of the lift, U1) and `aSide` (−1 interior, else the perimeter side 0–3).
 * The model is cut at `defaults.modelCutH` (2.4 m, rev 8.1 B) like a section model: walls, columns, the shaft and
 * opening headers stop there, and glazing heads clamp to it.
 * The cutaway (U3) clamps a side's vertices to `uCut[side]` (2.4 → 1.0 m) instead of scaling separate meshes, so
 * headers and glass on a lowered façade go down with it. Raycasts (hotspot occlusion) apply the same clamp.
 * Heights are illustrative (not on the plans) and never shown in the UI.
 */
import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  PMREMGenerator,
  ACESFilmicToneMapping,
  Mesh,
  MeshBasicMaterial,
  MeshDepthMaterial,
  MeshLambertMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PCFShadowMap,
  RepeatWrapping,
  TextureLoader,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  RGBADepthPacking,
  Scene,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  Texture,
  Vector2,
  Vector3,
  type Material,
  type WebGLRenderer,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildFurniture, metreUV, type FurnMat } from './furniture';
import { gsap } from '../motion';
import { onVisibility } from '../lazy';
import type { P2, Unit3d } from '../../data/units3d/types';
import css from '../../styles/unit3d.css?inline';

const DEG = Math.PI / 180;
const MODEL_CUT = 2.4; // rev 8.1 B: default when the JSON has no defaults.modelCutH
const CUT_H = 1.0;
const EL = 60 * DEG;
const AZ = -35 * DEG;
const EL_MIN = 52 * DEG;
const EL_MAX = 68 * DEG;
const ORBIT = 5 * DEG; // per second
const RESUME = 5000;
const FILL = 0; // rev 10 F5: the camera fill is retired (environment light + ACES); kept as a zero-intensity hook for the walk
/**
 * Floor and furniture-lid tint (design's exposure note, rev 8.5): the lights that keep the walls cream would push the
 * plan texture to white, so the texture's own materials are dimmed instead (r187 has no per-object light layers).
 * Tuned so a mid-grey plan texel (~199) renders within ±10 of itself.
 */

export interface DollhouseOpts {
  renderer: WebGLRenderer;
  host: HTMLElement;
  stage: HTMLElement;
  data: Unit3d;
  image: HTMLImageElement;
  /** Room key → localised name; area formatter. */
  names: Record<string, string>;
  area: (m2: number) => string;
  reduced: boolean;
  onRoom: (id: string | null) => void;
  onInteract: () => void;
}

/** What the walk-in chunk (walk.ts, rev 9 B1–B6) drives inside this scene. */
export interface WalkHost {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  root: Group;
  host: HTMLElement;
  stage: HTMLElement;
  data: Unit3d;
  image: HTMLImageElement;
  /** Plan point → world (the model is centred on its footprint centroid). */
  toWorld: (p: P2, y?: number) => Vector3;
  /** Model cut (2.4 m) and the full storey wall (2.8 m). */
  cutH: number;
  fullH: number;
  /** Shader uniforms: uModel (whole-model cut) and uCut (camera-side cutaway, per side). */
  uniforms: { uModel: { value: number }; uCut: { value: number[] } };
  fill: DirectionalLight;
  spots: HTMLElement;
  reduced: boolean;
  request(): void;
  run(target: object, vars: gsap.TweenVars): gsap.core.Tween;
  /** Take the camera (walk mode) or give it back to the orbit (null). */
  setDriver(d: { frame(dt: number): boolean } | null): void;
  /** Put a camera where the orbit would (the way back from walk mode). */
  orbitPose(target: PerspectiveCamera): void;
}

export interface Dollhouse {
  /** Rev 9 B1: hooks for the walk-in chunk. */
  walkHost(): WalkHost;
  /** U1: flat top-down → 56°/−35° with walls rising; or the static angle (reduced motion, or `skipLift`: rev 10 T5,
   *  arriving from the 3D tower's assembled floor, where the walls are already up). */
  enter(opts?: { skipLift?: boolean }): Promise<void>;
  /** U2: walls drop flat. */
  leave(): Promise<void>;
  select(id: string | null): void;
  highlight(id: string | null): void;
  pause(on: boolean): void;
  destroy(): void;
}

/* ---------- geometry helpers ---------- */

const shape = (ring: readonly P2[]) => {
  const s = new Shape();
  ring.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
  return s;
};
const flat = (ring: readonly P2[]) => new ShapeGeometry(shape(ring)).rotateX(-Math.PI / 2).toNonIndexed();
const prism = (ring: readonly P2[], h: number) =>
  new ExtrudeGeometry(shape(ring), { depth: h, bevelEnabled: false }).rotateX(-Math.PI / 2);

/** A box along segment a→b from y0 to y1, `t` deep. */
function seg(a: P2, b: P2, y0: number, y1: number, t: number, plane = false) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const g = (plane ? new PlaneGeometry(Math.hypot(dx, dz), y1 - y0) : new BoxGeometry(Math.hypot(dx, dz), y1 - y0, t)).toNonIndexed();
  g.translate(0, (y0 + y1) / 2, 0);
  g.rotateY(-Math.atan2(dz, dx));
  g.translate((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2);
  return g;
}

/* ---------- rev 10 F3: CC0 texture sets (public/textures), loaded once on first entering a unit's 3D view ---------- */
type TexName = 'tile-col' | 'tile-nor' | 'tile-rough' | 'parquet-col' | 'parquet-nor' | 'parquet-rough' | 'plaster-nor' | 'plaster-rough' | 'linen-nor' | 'oak-grain' | 'oak-rough';
const COLOUR: TexName[] = ['tile-col', 'parquet-col', 'oak-grain'];
let texJob: Promise<Partial<Record<TexName, Texture>>> | null = null;
/** Phones (coarse pointer or deviceMemory < 8) load the colour maps only, with constant roughness. */
export function loadTextures(phone: boolean, maxAniso: number) {
  return (texJob ??= (async () => {
    const names: TexName[] = phone ? COLOUR : [...COLOUR, 'tile-nor', 'tile-rough', 'parquet-nor', 'parquet-rough', 'plaster-nor', 'plaster-rough', 'linen-nor', 'oak-rough'];
    const loader = new TextureLoader();
    const out: Partial<Record<TexName, Texture>> = {};
    await Promise.all(
      names.map((n) =>
        loader
          .loadAsync(`/textures/${n}.webp`)
          .then((t) => {
            t.wrapS = t.wrapT = RepeatWrapping;
            t.anisotropy = Math.min(4, maxAniso);
            if (n.endsWith('-col') || n === 'oak-grain') t.colorSpace = SRGBColorSpace;
            out[n] = t;
          })
          .catch(() => undefined), // a missing map leaves the flat colour
      ),
    );
    return out;
  })());
}

/** Tag every vertex with the lift delay and the cutaway side. */
function tag(g: BufferGeometry, delay: number, side: number) {
  const n = g.getAttribute('position').count;
  g.setAttribute('aDelay', new Float32BufferAttribute(new Float32Array(n).fill(delay), 1));
  g.setAttribute('aSide', new Float32BufferAttribute(new Float32Array(n).fill(side), 1));
  if (!g.getAttribute('uv')) g.setAttribute('uv', new Float32BufferAttribute(new Float32Array(n * 2), 2));
  return g;
}

const centroid = (poly: readonly P2[]): P2 => {
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

const inside = ([x, z]: P2, poly: readonly P2[]) => {
  let r = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i]!;
    const [xj, zj] = poly[j]!;
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) r = !r;
  }
  return r;
};

function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(256, 256, 20, 256, 256, 256);
  g.addColorStop(0, 'rgba(11,18,32,0.6)');
  g.addColorStop(1, 'rgba(11,18,32,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  return new CanvasTexture(c);
}

/* ---------- the scene ---------- */

export function createDollhouse(o: DollhouseOpts): Dollhouse {
  const { renderer, host, stage, data } = o;
  const WALL_H = data.defaults.modelCutH ?? MODEL_CUT;
  // rev 9 B1: geometry is built to the full storey (2.8 m) and the 2.4 m section cut is the uModel uniform, so walk
  // mode can raise the walls to full height
  const FULL_H = data.defaults.wallH ?? 2.8;
  const cut = (h: number) => Math.min(h, FULL_H);
  const canvas = renderer.domElement;
  if (!document.getElementById('u3d-css')) {
    const st = document.createElement('style');
    st.id = 'u3d-css';
    st.textContent = css;
    document.head.append(st);
  }

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.5, 200);
  const root = new Group();
  scene.add(root);
  const [cx, cz] = centroid(data.footprint);
  root.position.set(-cx, 0, -cz);
  const R = Math.max(...data.footprint.map(([x, z]) => Math.hypot(x - cx, z - cz)));

  const keep: { dispose(): void }[] = [];
  const k = <T extends { dispose(): void }>(x: T) => (keep.push(x), x);

  /* shader: lift (rise, staggered), leave (drop), cutaway (clamp per side) */
  const U = {
    uRise: { value: 99 },
    uDrop: { value: 1 },
    uCut: { value: [WALL_H, WALL_H, WALL_H, WALL_H] },
    uModel: { value: WALL_H },
  };
  const inject = <M extends Material>(m: M, cut = true, dur = 0.7) => {
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader =
        'attribute float aDelay;\nattribute float aSide;\nuniform float uRise;\nuniform float uDrop;\nuniform float uCut[4];\nuniform float uModel;\n' +
        sh.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
float rp = clamp((uRise - aDelay) / ${dur.toFixed(2)}, 0.0, 1.0);
transformed.y *= max(0.01, (1.0 - pow(1.0 - rp, 3.0)) * uDrop);
transformed.y = min(transformed.y, uModel);
${cut ? 'if (aSide > -0.5) transformed.y = min(transformed.y, uCut[int(aSide + 0.5)]);' : 'if (aSide > -0.5) transformed.y = 0.0;'}`,
        );
    };
    return k(m);
  };

  const glassTier = !matchMedia('(pointer: coarse)').matches && ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) >= 8;
  const mat = {
    // F3: plaster normal + roughness. Polygon offset: furniture traced flush with a wall wins the depth tie (no stripes)
    wall: inject(new MeshStandardMaterial({ color: '#EFE1CD', roughness: 0.92, // warmer: the neutral light cools it to ~ (232,224,212)
       polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 })),
    oak: inject(new MeshStandardMaterial({ color: '#B5A08A', roughness: 0.6 })), // rev 8.2 H: greige oak
    counter: inject(new MeshStandardMaterial({ color: '#E4DACB', roughness: 0.6 })),
    top: inject(new MeshStandardMaterial({ color: '#B9AE9E', roughness: 0.35 })),
    // F4: desktop glass reflects the environment (a physical pane; `transmission` was tried and dropped: its extra
    // render pass washed out the whole frame with the GTAO composer in r187); phones a plain pane at 0.25
    glass: inject(
      glassTier
        ? new MeshPhysicalMaterial({ color: '#DCE7EE', transparent: true, opacity: 0.3, roughness: 0.04, metalness: 0, reflectivity: 0.6, envMapIntensity: 1.4, depthWrite: false, side: DoubleSide })
        : new MeshBasicMaterial({ color: '#CFE0EA', transparent: true, opacity: 0.25, depthWrite: false, side: DoubleSide }),
    ),
    dark: inject(new MeshStandardMaterial({ color: '#1E2226', roughness: 0.45, metalness: 0.3 })), // black frames and rails
  };
  // shadows follow the rise; perimeter walls never cast (the cutaway would leave stale shadows)
  const depth = inject(new MeshDepthMaterial({ depthPacking: RGBADepthPacking }), false);

  /* perimeter sides: outward normal quantised to ±x / ±z */
  const sideOf = (a: P2, b: P2) => {
    const mx = (a[0] + b[0]) / 2 - cx;
    const mz = (a[1] + b[1]) / 2 - cz;
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    let nx = -dz, nz = dx;
    if (nx * mx + nz * mz < 0) (nx = -nx), (nz = -nz);
    return Math.abs(nx) > Math.abs(nz) ? (nx > 0 ? 0 : 2) : nz > 0 ? 1 : 3;
  };
  const NORMALS = [new Vector2(1, 0), new Vector2(0, 1), new Vector2(-1, 0), new Vector2(0, -1)];
  const perimeter = data.walls.filter((w) => w.kind !== 'interior');
  /** The perimeter side an opening sits on (collinear with a perimeter wall), else −1. */
  const openingSide = (a: P2, b: P2) => {
    const horiz = Math.abs(b[1] - a[1]) < Math.abs(b[0] - a[0]);
    const w = perimeter.find((p) => {
      const ph = Math.abs(p.b[1] - p.a[1]) < Math.abs(p.b[0] - p.a[0]);
      return ph === horiz && (horiz ? Math.abs(p.a[1] - a[1]) < 0.1 : Math.abs(p.a[0] - a[0]) < 0.1);
    });
    return w ? sideOf(w.a, w.b) : -1;
  };

  /* pieces, ordered by distance from the centroid for the staggered rise */
  type Piece = { g: BufferGeometry; m: keyof typeof mat; mid: P2; side: number; solid?: boolean };
  const pieces: Piece[] = [];
  const mid = (a: P2, b: P2): P2 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  for (const w of data.walls) {
    pieces.push({ g: seg(w.a, w.b, 0, cut(w.h), w.t), m: 'wall', mid: mid(w.a, w.b), side: w.kind === 'interior' ? -1 : sideOf(w.a, w.b) });
  }
  for (const op of data.openings) {
    const side = openingSide(op.a, op.b);
    const m = mid(op.a, op.b);
    const head = cut(op.head);
    if (head < FULL_H) pieces.push({ g: seg(op.a, op.b, head, FULL_H, op.t), m: 'wall', mid: m, side });
    if (op.type === 'window') pieces.push({ g: seg(op.a, op.b, 0, op.sill, op.t), m: 'wall', mid: m, side });
    if (op.type === 'window' || op.type === 'glazed-door') {
      const y0 = op.type === 'window' ? op.sill : 0;
      pieces.push({ g: seg(op.a, op.b, y0, head, 0, true), m: 'glass', mid: m, side });
      // rev 10 F4: black mullions, as in the reference — a 4 cm frame (head, sill, jambs) and a vertical every 0.9 m
      const L = Math.hypot(op.b[0] - op.a[0], op.b[1] - op.a[1]);
      const at = (d: number): P2 => [op.a[0] + ((op.b[0] - op.a[0]) / L) * d, op.a[1] + ((op.b[1] - op.a[1]) / L) * d];
      const F = 0.04;
      pieces.push({ g: seg(op.a, op.b, head - F, head, 0.05), m: 'dark', mid: m, side });
      pieces.push({ g: seg(op.a, op.b, y0, y0 + F, 0.05), m: 'dark', mid: m, side });
      const n = Math.max(1, Math.round(L / 0.9));
      for (let i = 0; i <= n; i++) {
        const d = Math.min(L - F, Math.max(0, (L / n) * i - F / 2));
        pieces.push({ g: seg(at(d), at(d + F), y0, head, 0.05), m: 'dark', mid: m, side });
      }
    }
  }
  for (const r of data.railings) {
    const m = mid(r.a, r.b);
    pieces.push({ g: seg(r.a, r.b, 0, r.h, 0, true), m: 'glass', mid: m, side: -1 });
    pieces.push({ g: seg(r.a, r.b, r.h - 0.04, r.h, 0.04), m: 'dark', mid: m, side: -1 });
  }
  for (const s of data.solids) {
    // rev 10 F1: furniture, wardrobes, counters and fixtures are modelled by furniture.ts (below); the structure stays here
    if (s.kind !== 'column' && s.kind !== 'shaft') continue;
    pieces.push({ g: prism(s.poly, cut(s.h)), m: 'wall', mid: centroid(s.poly), side: -1, solid: true });
  }
  const sub = ([x, z]: P2): [number, number] => [x - cx, z - cz];
  const dist = (p: Piece) => Math.hypot(...sub(p.mid));
  const walls = pieces.filter((p) => !p.solid).sort((a, b) => dist(a) - dist(b));
  const solids = pieces.filter((p) => p.solid).sort((a, b) => dist(a) - dist(b));
  walls.forEach((p, i) => tag(p.g, i * 0.012, p.side));
  solids.forEach((p, i) => tag(p.g, 0.3 + i * 0.012, -1));
  const furniture = data.solids.filter((x) => x.kind !== 'column' && x.kind !== 'shaft');
  const riseEnd = Math.max(walls.length * 0.012 + 0.7, 0.3 + solids.length * 0.012 + 0.7, 0.45 + furniture.length * 0.012 + 0.5);

  const meshes: Partial<Record<keyof typeof mat, Mesh>> = {};
  for (const key of Object.keys(mat) as (keyof typeof mat)[]) {
    const gs = pieces.filter((p) => p.m === key).map((p) => p.g);
    if (!gs.length) continue;
    const merged = k(mergeGeometries(gs)!);
    gs.forEach((g) => g.dispose());
    if (key === 'wall') metreUV(merged); // plaster at 2 m, the same on every wall
    const mesh = new Mesh(merged, mat[key]);
    if (key !== 'glass' && key !== 'dark') {
      mesh.castShadow = true;
      mesh.customDepthMaterial = depth;
    }
    meshes[key] = mesh;
    root.add(mesh);
  }

  /* floor (the plan texture), plinth, soft ground shadow */

  // F3: one material per class (the colour is the vertex colour; wood and fabric get their maps when they load)
  const furnMat: Partial<Record<FurnMat, MeshStandardMaterial>> = {
    matte: new MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }),
    wood: new MeshStandardMaterial({ vertexColors: true, roughness: 0.55 }),
    fabric: new MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }),
    stone: new MeshStandardMaterial({ vertexColors: true, roughness: 0.35 }), // worktops (F3: flat colour, 0.35)
    gloss: new MeshStandardMaterial({ vertexColors: true, roughness: 0.2 }),
    metal: new MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.8 }),
  };

  /* rev 10 F1: modelled furniture (full tier): one vertex-coloured mesh, plus the shower screens' glass. Pieces rise
     after the walls (+0.45 s, 0.5 s), nearest the middle first. */
  {
    const parts = buildFurniture(data, 'full').sort((a, b) => Math.hypot(...sub(a.c)) - Math.hypot(...sub(b.c)));
    const order = new Map<string, number>();
    for (const p of parts) if (!order.has(p.c.join())) order.set(p.c.join(), order.size);
    parts.forEach((p) => tag(p.g, 0.45 + order.get(p.c.join())! * 0.012, -1));
    const glass = parts.filter((p) => p.m === 'glass').map((p) => p.g);
    const fdepth = inject(new MeshDepthMaterial({ depthPacking: RGBADepthPacking }), false, 0.5);
    for (const cls of ['matte', 'wood', 'fabric', 'stone', 'gloss', 'metal'] as FurnMat[]) {
      const gs = parts.filter((p) => p.m === cls).map((p) => p.g);
      if (!gs.length) continue;
      const mesh = new Mesh(k(mergeGeometries(gs)!), inject(furnMat[cls]!, true, 0.5));
      gs.forEach((g) => g.dispose());
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.customDepthMaterial = fdepth;
      root.add(mesh);
    }
    if (glass.length) root.add(new Mesh(k(mergeGeometries(glass)!), inject(new MeshBasicMaterial({ color: '#DDE8EE', transparent: true, opacity: 0.25, depthWrite: false, side: DoubleSide }), true, 0.5)));
    glass.forEach((g) => g.dispose());
  }
  /* F3: real floors. The plan image is retired here (it stays for the minimap, the room card and the 2D plan). A base
     of large-format tile under the whole unit (living rooms, kitchens, halls, balconies), and per room on top: wet
     rooms in a cool-grey tile at 0.3 m, bedrooms labelled tile in the tile tinted warm oak-tan (not parquet: the label
     wins), and parquet only where the plan says PARQUET. UVs in metres. */
  const FIN = {
    // the tile map has 5 × 5 tiles: 3 m → 0.6 m tiles, 1.5 m → 0.3 m in wet rooms
    tile: { colour: '#E6E0D6', tex: 'tile', size: 3 },
    wet: { colour: '#C9CFD3', tex: 'tile', size: 1.5 },
    tan: { colour: '#E2C9A2', tex: 'tile', size: 3 },
    parquet: { colour: '#FFFFFF', tex: 'parquet', size: 2.4 },
  } as const;
  const finishOf = (r: Unit3d['rooms'][number]): keyof typeof FIN =>
    r.finish === 'parquet' ? 'parquet' : r.name === 'shower' ? 'wet' : r.name === 'bedroom' || r.name === 'masterBedroom' ? 'tan' : 'tile';
  const floorMats = Object.fromEntries(
    (Object.keys(FIN) as (keyof typeof FIN)[]).map((f) => [f, k(new MeshStandardMaterial({ color: FIN[f].colour, roughness: 0.6 }))]),
  ) as Record<keyof typeof FIN, MeshStandardMaterial>;
  const metres = (g: BufferGeometry, size: number) => {
    const pos = g.getAttribute('position');
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) (uv[i * 2] = pos.getX(i) / size), (uv[i * 2 + 1] = pos.getZ(i) / size);
    g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
    return g;
  };
  const floor = new Mesh(k(metres(flat(data.footprint), FIN.tile.size)), floorMats.tile);
  floor.receiveShadow = true;
  root.add(floor);
  for (const f of ['wet', 'tan', 'parquet'] as const) {
    const gs = data.rooms.filter((r) => finishOf(r) === f).map((r) => metres(flat(r.poly), FIN[f].size).translate(0, 0.003, 0));
    if (!gs.length) continue;
    const m = new Mesh(k(mergeGeometries(gs)!), floorMats[f]);
    gs.forEach((g) => g.dispose());
    m.receiveShadow = true;
    root.add(m);
  }
  // the maps arrive once; flat colours meanwhile (and on phones, colour maps only with constant roughness)
  const phone = matchMedia('(pointer: coarse)').matches || ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) < 8;
  void loadTextures(phone, renderer.capabilities.getMaxAnisotropy()).then((t) => {
    if (destroyed) return;
    for (const f of Object.keys(FIN) as (keyof typeof FIN)[]) {
      const m = floorMats[f];
      m.map = t[`${FIN[f].tex}-col`] ?? null;
      m.normalMap = t[`${FIN[f].tex}-nor`] ?? null;
      m.roughnessMap = t[`${FIN[f].tex}-rough`] ?? null;
      m.needsUpdate = true;
    }
    const wall = mat.wall as MeshStandardMaterial;
    wall.normalMap = t['plaster-nor'] ?? null;
    wall.roughnessMap = t['plaster-rough'] ?? null;
    wall.needsUpdate = true;
    // plaster at 2 m, linen at 0.5 m, oak at 1 m: the UVs are metres, so a texture's repeat sets its scale
    for (const [name, rep2] of [['plaster-nor', 0.5], ['plaster-rough', 0.5], ['linen-nor', 2], ['oak-grain', 1], ['oak-rough', 1]] as const) t[name]?.repeat.set(rep2, rep2);
    furnMat.wood!.map = t['oak-grain'] ?? null;
    furnMat.wood!.roughnessMap = t['oak-rough'] ?? null;
    furnMat.fabric!.normalMap = t['linen-nor'] ?? null;
    for (const m of Object.values(furnMat)) m.needsUpdate = true;
    renderer.shadowMap.needsUpdate = true;
    request();
  });
  const plinth = new Mesh(k(prism(data.footprint, 0.35)), k(new MeshLambertMaterial({ color: '#FBF7F2' })));
  plinth.position.y = -0.351;
  plinth.receiveShadow = true;
  root.add(plinth);
  const ground = new Mesh(
    k(new PlaneGeometry(R * 3, R * 3).rotateX(-Math.PI / 2)),
    k(new MeshBasicMaterial({ map: k(shadowTexture()), transparent: true, depthWrite: false })),
  );
  ground.position.set(cx, -0.36, cz);
  root.add(ground);

  /* room highlight (U5) */
  const hlMat = k(new MeshBasicMaterial({ color: '#B59458', transparent: true, opacity: 0, depthWrite: false }));
  const hl = new Mesh(new BufferGeometry(), hlMat);
  hl.position.y = 0.02;
  root.add(hl);

  /* light (rev 10 F5, by tier): a RoomEnvironment through PMREM, a warm sun with shadows baked at rest, a soft sky
     fill; ACES filmic at exposure 1.0. Phones (coarse pointer or deviceMemory < 8): environment 0.6, 1024² shadows.
     Desktop: environment 0.8, 2048² shadows with a wider PCF radius, and GTAO while the camera rests. */
  const lowTier = matchMedia('(pointer: coarse)').matches || ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) < 8;
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = k(pmrem.fromScene(new RoomEnvironment(), 0.04).texture);
  scene.environmentIntensity = lowTier ? 0.5 : 0.65; // review r9b L3: the neutral environment washed colours toward cool white
  pmrem.dispose();
  scene.add(new HemisphereLight('#FFE6C8', '#3A4558', 0.9)); // warm sky: the walls read cream, not grey-white
  const sun = new DirectionalLight('#FFE3BD', 1.9); // (L3: less sun on horizontal faces — duvets, worktops)
  sun.position.set(-6, 14, -4);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(lowTier ? 1024 : 2048);
  sun.shadow.radius = lowTier ? 4 : 6;
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.05; // F5 tuning: no striped acne on vertical oak faces at 2048²
  Object.assign(sun.shadow.camera, { left: -R - 1, right: R + 1, top: R + 1, bottom: -R - 1, near: 1, far: 40 });
  scene.add(sun, sun.target);
  // rev 8.1 A: a camera fill (no shadows) keeps camera-facing wall faces cream; it turns with the camera, offset
  // 25° left and 20° up from the view direction, so the baked sun shadows never need an update
  const fill = new DirectionalLight('#FFF6EA', FILL);
  fill.position.set(-Math.sin(25 * DEG), Math.sin(20 * DEG), 1);
  fill.target.position.set(0, 0, -1);
  camera.add(fill, fill.target);
  scene.add(camera);
  /** This scene's renderer state (the canvas is shared: the slab and the tower set theirs when they draw). */
  let refit: (() => void) | null = null;
  const ratio = Math.min(devicePixelRatio, lowTier ? 1.5 : 2); // F5 (review r9b L4): phones ≤ 1.5, whoever made the renderer
  const rendererState = () => {
    if (renderer.getPixelRatio() !== ratio) {
      renderer.setPixelRatio(ratio);
      refit?.(); // (the first call runs before fit() exists; the initial fit applies it)
    }
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95; // design (F5 tuning) + review L3: lit walls ~ (232–238, 224–230, 212–218)
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap; // (PCFSoftShadowMap is gone in r187: PCF with a wider radius on desktop)
    renderer.shadowMap.autoUpdate = false;
  };
  rendererState();
  renderer.shadowMap.needsUpdate = true;
  // phones (no GTAO): a soft dark blob under each piece of furniture grounds it (design F5 tuning)
  if (lowTier) {
    const blobs = data.solids
      .filter((s) => !['column', 'shaft', 'rug', 'hob', 'sink'].includes(s.kind))
      .map((s) => {
        const xs = s.poly.map((p) => p[0]);
        const zs = s.poly.map((p) => p[1]);
        const w = (Math.max(...xs) - Math.min(...xs)) * 1.25;
        const dd = (Math.max(...zs) - Math.min(...zs)) * 1.25;
        const g = new PlaneGeometry(w, dd).rotateX(-Math.PI / 2).toNonIndexed();
        g.translate((Math.max(...xs) + Math.min(...xs)) / 2, 0.006, (Math.max(...zs) + Math.min(...zs)) / 2);
        return tag(g, 0.45, -1);
      });
    if (blobs.length) {
      const bm = new Mesh(k(mergeGeometries(blobs)!), inject(new MeshBasicMaterial({ map: k(shadowTexture()), transparent: true, opacity: 0.25, depthWrite: false }), true, 0.5));
      blobs.forEach((g) => g.dispose());
      root.add(bm);
    }
  }
  // desktop: GTAO at rest (a lazy chunk)
  let ao: import('./ao').Ao | null = null;
  if (!lowTier) // (also with reduced motion: AO only draws at rest, it never animates)
    void import('./ao').then(({ createAo }) => {
      if (destroyed) return;
      ao = createAo(renderer, scene, camera, host.clientWidth || 1, host.clientHeight || 1);
      request();
    });

  /* ---------- camera ---------- */
  const cam = { az: AZ, el: EL, x: 0, z: 0 };
  let d = 30;
  const fit = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const half = Math.atan(Math.tan((camera.fov * DEG) / 2) * Math.min(1, camera.aspect));
    // rev 8.1 C: the bounding circle fills 100% of the shorter side (the same at every azimuth, so no pop)
    d = R / Math.sin(half);
    renderer.setSize(w, h, false);
    ao?.setSize(w, h);
  };
  refit = fit;
  const place = () => {
    const c = Math.cos(cam.el);
    camera.position.set(cam.x + Math.sin(cam.az) * c * d, 0.6 + Math.sin(cam.el) * d, cam.z + Math.cos(cam.az) * c * d);
    camera.lookAt(cam.x, 0.6, cam.z);
  };

  /* ---------- hotspots (HTML, projected per frame). Rev 8.1 F: they float 0.35 m above the cut over each room's
     label point, with a 1 px leader line down to the floor; no occlusion test, so all of them stay reachable. When two
     dots come within 28 px, the one nearer the camera shows and the other goes inert until they separate. */
  const layer = document.createElement('div');
  layer.className = 'u3d-spots';
  stage.append(layer);
  const spots = data.rooms.map((r, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'u3d-spot';
    b.style.setProperty('--i', String(i));
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = '<span class="u3d-spot__dot" aria-hidden="true"></span><span class="u3d-spot__pill"></span>';
    const name = o.names[r.name] ?? r.name;
    b.lastElementChild!.textContent = r.area == null ? name : `${name} · ${o.area(r.area)}`; // rev 8.4: no m² when illegible
    b.addEventListener('click', () => o.onRoom(r.id));
    b.addEventListener('pointerenter', () => setHl(r.id, false));
    b.addEventListener('pointerleave', () => setHl(null, false));
    b.addEventListener('focus', () => setHl(r.id, false));
    b.addEventListener('blur', () => setHl(null, false));
    const line = document.createElement('span');
    line.className = 'u3d-spot__line';
    line.setAttribute('aria-hidden', 'true');
    layer.append(line, b);
    const [x, z] = sub(r.label);
    return { r, b, line, top: new Vector3(x, WALL_H + 0.35, z), base: new Vector3(x, 0.05, z), hidden: false, sx: 0, sy: 0, d: 0 };
  });

  const ray = new Raycaster();
  const v = new Vector3();
  const wp = new Vector3();
  const projectSpots = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    const px = (p: Vector3) => {
      v.copy(p).project(camera);
      return [((v.x + 1) / 2) * w, ((1 - v.y) / 2) * h] as const;
    };
    for (const s of spots) {
      const [tx, ty] = px(s.top);
      const [bx, by] = px(s.base);
      s.sx = tx;
      s.sy = ty;
      s.d = camera.position.distanceTo(root.localToWorld(wp.copy(s.top)));
      s.b.style.transform = `translate(${tx}px, ${ty}px)`;
      s.line.style.width = `${Math.hypot(bx - tx, by - ty)}px`;
      s.line.style.transform = `translate(${tx}px, ${ty}px) rotate(${Math.atan2(by - ty, bx - tx)}rad)`;
    }
    // nearer dots win a 28 px overlap
    const shown: typeof spots = [];
    for (const s of [...spots].sort((a, b) => a.d - b.d)) {
      const clash = shown.some((o) => Math.hypot(o.sx - s.sx, o.sy - s.sy) < 28);
      if (!clash) shown.push(s);
      const hide = !ready || clash;
      if (hide !== s.hidden) {
        s.hidden = hide;
        s.b.classList.toggle('is-hidden', hide);
        s.line.classList.toggle('is-hidden', hide);
        s.b.inert = hide;
      }
    }
  };

  /* ---------- render on demand ---------- */
  let frame = 0;
  let visible = true;
  let paused = false;
  let destroyed = false;
  let ready = false; // lift done: hotspots on, orbit allowed
  let tweening = 0;
  let selected: string | null = null;
  let dragging = false;
  let velAz = 0;
  let lastT = 0;
  let resumeAt = Infinity;

  // U3: perimeter sides facing the camera go down to 1.0 m (and back up when they turn away)
  const cutTarget = [WALL_H, WALL_H, WALL_H, WALL_H];
  const cutaway = () => {
    // rev 10.3: azimuth from +z (the plan's bottom, "south") toward −x, the same in every explorer scene
    const tx = Math.sin(cam.az);
    const tz = Math.cos(cam.az);
    NORMALS.forEach((n, i) => {
      const want = n.x * tx + n.y * tz > 0.25 ? CUT_H : WALL_H;
      if (want === cutTarget[i]) return;
      cutTarget[i] = want;
      const box = { h: U.uCut.value[i]! };
      run(box, { h: want, duration: o.reduced ? 0 : 0.35, ease: 'power2.out', onUpdate: () => (U.uCut.value[i] = box.h) });
    });
  };

  const autoOrbit = () => !o.reduced && ready && !dragging && !paused && !selected && performance.now() > resumeAt;

  let driver: { frame(dt: number): boolean } | null = null;
  /** The shared canvas is here (rev 10: the 3D tower takes it back when it shows; then this scene doesn't draw). */
  const mine = () => canvas.parentElement === host;
  const tick = (now: number) => {
    frame = 0;
    if (destroyed || !visible || !mine()) return;
    const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0;
    lastT = now;
    rendererState();
    if (driver) {
      // walk mode owns the camera
      const more = driver.frame(dt) || tweening > 0;
      // inside too: GTAO once the view rests (contact shadows under the bed, darker corners)
      if (ao && !more) ao.render();
      else renderer.render(scene, camera);
      if (more) request();
      else lastT = 0;
      return;
    }
    let again = tweening > 0;
    if (!dragging && Math.abs(velAz) > 1e-4) {
      cam.az += velAz;
      velAz *= 0.92;
      again = true;
    }
    if (autoOrbit()) {
      cam.az += ORBIT * dt;
      again = true;
    } else if (ready && !o.reduced && resumeAt !== Infinity && !selected && !paused) again = true; // wait to resume
    cutaway();
    place();
    if (tweening > 0 && !ready) renderer.shadowMap.needsUpdate = true; // shadows follow the lift
    // F5: GTAO only while the camera rests (orbit, drags and tweens draw without it)
    if (ao && !again && !dragging) ao.render();
    else renderer.render(scene, camera);
    projectSpots();
    if (again) request();
    else lastT = 0;
  };
  const request = () => {
    if (!frame && !destroyed) frame = requestAnimationFrame(tick);
  };
  const run = (target: object, vars: gsap.TweenVars) => {
    tweening++;
    const done = vars.onComplete as (() => void) | undefined;
    return gsap.to(target, {
      ...vars,
      onUpdate() {
        (vars.onUpdate as (() => void) | undefined)?.();
        request();
      },
      onComplete() {
        tweening--;
        done?.();
        request();
      },
      // killed midway (review r8 H1: an exit stops a fly-in): keep the count balanced, or the loop never idles
      onInterrupt() {
        tweening--;
        (vars.onInterrupt as (() => void) | undefined)?.();
        request();
      },
    });
  };

  /* ---------- pointer: drag to turn (inertia), tap a room ---------- */
  const ndc = new Vector2();
  let downX = 0, downY = 0, lastX = 0, lastY = 0, moved = 0;
  const onDown = (e: PointerEvent) => {
    if (driver || !mine()) return; // walk mode has its own look controls; the tower may hold the canvas
    o.onInteract();
    dragging = true;
    downX = lastX = e.clientX;
    downY = lastY = e.clientY;
    moved = 0;
    velAz = 0;
    resumeAt = Infinity;
    if (e.pointerType === 'mouse') canvas.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging || driver) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    moved = Math.max(moved, Math.hypot(e.clientX - downX, e.clientY - downY));
    velAz = -(dx / canvas.clientWidth) * Math.PI;
    cam.az += velAz;
    if (e.pointerType === 'mouse') cam.el = Math.min(EL_MAX, Math.max(EL_MIN, cam.el + (dy / canvas.clientHeight) * 0.6));
    request();
  };
  const onUp = (e: PointerEvent) => {
    if (!dragging || driver) return;
    dragging = false;
    resumeAt = performance.now() + RESUME;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    if (moved < 6 && ready) {
      const r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      ray.far = Infinity;
      const hit = ray.intersectObject(floor, false)[0];
      if (hit) {
        const p: P2 = [hit.point.x + cx, hit.point.z + cz];
        o.onRoom(data.rooms.find((room) => inside(p, room.poly))?.id ?? null);
      }
    }
    request();
  };
  const onCancel = () => {
    dragging = false;
    resumeAt = performance.now() + RESUME;
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onCancel);
  canvas.style.cursor = 'grab';

  const ro = new ResizeObserver(() => {
    if (!mine()) return;
    fit();
    request();
  });
  ro.observe(host);
  const stopVis = onVisibility(stage, (vis) => {
    visible = vis && document.visibilityState === 'visible';
    if (visible) request();
  });

  /* ---------- rooms ---------- */
  function setHl(id: string | null, sel: boolean) {
    const room = data.rooms.find((r) => r.id === (id ?? selected));
    if (room) {
      hl.geometry.dispose();
      hl.geometry = flat(room.poly);
    }
    spots.forEach((s) => s.b.classList.toggle('is-hot', s.r.id === id));
    run(hlMat, { opacity: room ? 0.22 : 0, duration: o.reduced ? 0 : 0.3 });
    if (!sel) return;
    const c = room ? centroid(room.poly) : null;
    const to = c ? { x: (c[0] - cx) * 0.35, z: (c[1] - cz) * 0.35 } : { x: 0, z: 0 };
    run(cam, { ...to, duration: o.reduced ? 0 : 0.8, ease: 'power2.inOut' });
  }

  fit();
  place();

  const walkHost = (): WalkHost => ({
    scene,
    camera,
    renderer,
    root,
    host,
    stage,
    data,
    image: o.image,
    toWorld: (p, y = 0) => new Vector3(p[0] - cx, y, p[1] - cz),
    cutH: WALL_H,
    fullH: FULL_H,
    uniforms: U,
    fill,
    spots: layer,
    reduced: o.reduced,
    request,
    run,
    setDriver(d) {
      driver = d;
      dragging = false;
      canvas.style.cursor = d ? 'grab' : 'grab';
      if (!d) resumeAt = performance.now() + RESUME;
      request();
    },
    orbitPose(target) {
      const c = Math.cos(cam.el);
      target.position.set(cam.x + Math.sin(cam.az) * c * d, 0.6 + Math.sin(cam.el) * d, cam.z + Math.cos(cam.az) * c * d);
      target.lookAt(cam.x, 0.6, cam.z);
    },
  });

  return {
    walkHost,
    enter(opts) {
      return new Promise<void>((resolve) => {
        const done = () => {
          ready = true;
          renderer.shadowMap.needsUpdate = true;
          layer.classList.add('is-ready');
          resumeAt = performance.now() + 600;
          request();
          resolve();
        };
        if (o.reduced || opts?.skipLift) {
          U.uRise.value = 99;
          done();
          return;
        }
        Object.assign(cam, { az: -90 * DEG, el: 89 * DEG });
        U.uRise.value = 0;
        run(cam, { az: AZ, el: EL, duration: 1.4, ease: 'power3.inOut' });
        run(U.uRise, { value: riseEnd, duration: riseEnd, ease: 'none', onComplete: done });
      });
    },
    leave() {
      ready = false;
      layer.classList.remove('is-ready');
      spots.forEach((s) => (s.b.inert = true));
      return new Promise<void>((resolve) =>
        o.reduced ? resolve() : void run(U.uDrop, { value: 0.01, duration: 0.45, ease: 'power2.in', onComplete: resolve }),
      );
    },
    select(id) {
      selected = id;
      spots.forEach((s) => s.b.setAttribute('aria-pressed', String(s.r.id === id)));
      if (!id) resumeAt = performance.now() + RESUME;
      setHl(id, true);
    },
    highlight(id) {
      setHl(id, false);
    },
    pause(on) {
      paused = on;
      if (!on) resumeAt = performance.now() + RESUME;
      request();
    },
    destroy() {
      destroyed = true;
      if (frame) cancelAnimationFrame(frame);
      ro.disconnect();
      stopVis();
      gsap.killTweensOf([cam, U.uRise, U.uDrop, U.uModel, hlMat]);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onCancel);
      layer.remove();
      hl.geometry.dispose();
      keep.forEach((x) => x.dispose());
      ao?.dispose();
      scene.environment = null;
      renderer.shadowMap.autoUpdate = true;
    },
  };
}

/** Load the texture image: AVIF, else the WebP fallback. */
export function loadFloorImage(id: string) {
  const tryLoad = (ext: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = `/units/${id}-floor.${ext}`;
    });
  return tryLoad('avif').catch(() => tryLoad('webp'));
}

/** The placeholder for the room card: the room's crop of the floor texture (bounding box + 0.3 m). */
export function roomCrop(img: HTMLImageElement, data: Unit3d, id: string): Promise<Blob | null> {
  const room = data.rooms.find((r) => r.id === id);
  if (!room) return Promise.resolve(null);
  const { minX, minZ, maxX, maxZ } = data.texture.plane;
  const xs = room.poly.map((p) => p[0]);
  const zs = room.poly.map((p) => p[1]);
  const px = (x: number) => ((x - minX) / (maxX - minX)) * img.naturalWidth;
  const pz = (z: number) => ((z - minZ) / (maxZ - minZ)) * img.naturalHeight;
  const x0 = Math.max(0, px(Math.min(...xs) - 0.3));
  const x1 = Math.min(img.naturalWidth, px(Math.max(...xs) + 0.3));
  const z0 = Math.max(0, pz(Math.min(...zs) - 0.3));
  const z1 = Math.min(img.naturalHeight, pz(Math.max(...zs) + 0.3));
  // fit the crop into a 3:2 frame (letterboxed on sand), so the whole room shows
  const W = 900, H = 600;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#F3ECE2';
  ctx.fillRect(0, 0, W, H);
  const s = Math.min(W / (x1 - x0), H / (z1 - z0));
  const w = (x1 - x0) * s;
  const h = (z1 - z0) * s;
  ctx.drawImage(img, x0, z0, x1 - x0, z1 - z0, (W - w) / 2, (H - h) / 2, w, h);
  return new Promise((resolve) => c.toBlob(resolve, 'image/webp', 0.85));
}

