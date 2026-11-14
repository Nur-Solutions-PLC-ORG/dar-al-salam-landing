/**
 * Build-time axonometric SVG maquette of the tower (DESIGN §9.4 tier 0). Pure data → SVG strings;
 * rendered by src/components/explorer/Maquette.astro. Zero client JS; tier 1 wires hover/click on top.
 *
 * Projection: rotate the plan by AZIMUTH, then an elevation-only axonometric:
 *   X = xr,  Y = yr·sin(ELEV) − z·cos(ELEV)   (yr grows toward the viewer)
 * Painter's order: floors bottom → top; within a floor, far side faces first, then the top face.
 */
import {
  FLOOR_TO_FLOOR,
  GLAZING_BAND,
  GROUND_HEIGHT,
  GROUND_INSET,
  PARAPET,
  RESIDENTIAL_FLOORS,
  SLAB_DEPTH,
  floorBase,
  floorOutlineM,
  insetPolygon,
  towerTop,
} from '../data/tower';

type P2 = readonly [number, number];

const AZIMUTH = (-35 * Math.PI) / 180;
const ELEV = (24 * Math.PI) / 180;
const SIMPLIFY_EPS = 1.1; // metres (RDP); ~8 vertices per face (review: HTML budget)
/** Selected slab slides out toward the viewer (screen units = metres). */
export const PULL_OUT = { x: 3.2, y: 2.3 } as const; // ≈ 4.5 m, matches the 3D pull (design QA #2)

/* ---------- geometry helpers ---------- */

function rdp(pts: P2[], eps: number): P2[] {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0]!, pts[pts.length - 1]!];
  let maxD = 0;
  let idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i]!;
    const d =
      Math.abs((b[1] - a[1]) * p[0] - (b[0] - a[0]) * p[1] + b[0] * a[1] - b[1] * a[0]) /
      (Math.hypot(b[0] - a[0], b[1] - a[1]) || 1);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD <= eps) return [a, b];
  return [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)];
}

/** Simplify a closed ring (split at the farthest pair so both halves keep their corners). */
function simplifyRing(ring: readonly P2[], eps: number): P2[] {
  const pts = [...ring];
  let far = 0;
  let maxD = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i]![0] - pts[0]![0], pts[i]![1] - pts[0]![1]);
    if (d > maxD) {
      maxD = d;
      far = i;
    }
  }
  const a = rdp(pts.slice(0, far + 1), eps);
  const b = rdp([...pts.slice(far), pts[0]!], eps);
  return [...a.slice(0, -1), ...b.slice(0, -1)];
}

const rot = ([x, y]: P2): P2 => [x * Math.cos(AZIMUTH) - y * Math.sin(AZIMUTH), x * Math.sin(AZIMUTH) + y * Math.cos(AZIMUTH)];

const project = ([xr, yr]: P2, z: number): P2 => [xr, yr * Math.sin(ELEV) - z * Math.cos(ELEV)];

const signedArea = (pts: readonly P2[]) =>
  pts.reduce((s, p, i) => {
    const q = pts[(i + 1) % pts.length]!;
    return s + p[0] * q[1] - q[0] * p[1];
  }, 0) / 2;

const fmt = (n: number) => (Math.round(n * 10) / 10).toString();
const pts = (ps: readonly P2[]) => ps.map((p) => `${fmt(p[0])},${fmt(p[1])}`).join(' ');

export interface Face {
  points: string;
  /** shade class: 'top' | 'side-l' | 'side-m' | 'side-r' | 'glaze' */
  kind: string;
}

export interface Prism {
  faces: Face[];
  /** Screen anchor for the tooltip: right edge, vertical middle. */
  anchor: P2;
}

/** Extrude a rotated ring between z0 and z1 and return its visible faces in paint order. */
function prism(ring: readonly P2[], z0: number, z1: number, opts: { glaze?: boolean } = {}): Prism {
  const ccw = signedArea(ring) > 0;
  const sides: { depth: number; faces: Face[] }[] = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    // outward normal in rotated plan coords
    const nx = ccw ? ey : -ey;
    const ny = ccw ? -ex : ex;
    const len = Math.hypot(nx, ny) || 1;
    if (ny / len <= 0.02) continue; // faces away from the viewer
    const shade = nx / len < -0.35 ? 'side-l' : nx / len > 0.35 ? 'side-r' : 'side-m';
    const faces: Face[] = [
      { points: pts([project(a, z0), project(b, z0), project(b, z1), project(a, z1)]), kind: shade },
    ];
    if (opts.glaze) {
      const g0 = z1 - GLAZING_BAND - 0.35;
      const g1 = z1 - 0.35;
      faces.push({ points: pts([project(a, g0), project(b, g0), project(b, g1), project(a, g1)]), kind: 'glaze' });
    }
    sides.push({ depth: (a[1] + b[1]) / 2, faces });
  }
  sides.sort((p, q) => p.depth - q.depth);
  const top: Face = { points: pts(ring.map((p) => project(p, z1))), kind: 'top' };
  const screen = ring.flatMap((p) => [project(p, z0), project(p, z1)]);
  const right = Math.max(...screen.map((p) => p[0]));
  return { faces: [...sides.flatMap((s) => s.faces), top], anchor: [right, (project([0, 0], z0)[1] + project([0, 0], z1)[1]) / 2] };
}

/* ---------- the maquette ---------- */

export interface Maquette {
  viewBox: string;
  ground: string; // ellipse path
  basement: string; // dashed outline points
  podium: Prism;
  floors: { n: number; prism: Prism }[];
  parapet: Prism;
}

export function buildMaquette(): Maquette {
  const plate = simplifyRing(floorOutlineM, SIMPLIFY_EPS).map(rot);
  const podiumRing = simplifyRing(insetPolygon(floorOutlineM, GROUND_INSET), SIMPLIFY_EPS).map(rot);

  const podium = prism(podiumRing, 0, GROUND_HEIGHT);
  const floors = Array.from({ length: RESIDENTIAL_FLOORS }, (_, i) => {
    const n = i + 1;
    const z0 = floorBase(n);
    return { n, prism: prism(plate, z0, z0 + SLAB_DEPTH, { glaze: true }) };
  });
  const parapet = prism(insetPolygon(plate, 0.4), towerTop, towerTop + PARAPET);

  const basement = pts(plate.map((p) => project(p, -3.2)));

  // ground disc: circle radius 38 m in plan → ellipse on screen
  const R = 38;
  const ground = `M${fmt(-R)},0a${R},${fmt(R * Math.sin(ELEV))} 0 1,0 ${2 * R},0a${R},${fmt(R * Math.sin(ELEV))} 0 1,0 ${-2 * R},0Z`;

  // bounds (include the pull-out offset and ground)
  const all = [podium, parapet, ...floors.map((f) => f.prism)].flatMap((p) =>
    p.faces.flatMap((f) => f.points.split(' ').map((s) => s.split(',').map(Number) as [number, number])),
  );
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const pad = 3;
  const minX = Math.min(...xs, -R) - pad;
  const maxX = Math.max(...xs, R) + PULL_OUT.x + pad;
  const minY = Math.min(...ys) - pad;
  const maxY = Math.max(...ys, R * Math.sin(ELEV)) + pad;

  return {
    viewBox: `${fmt(minX)} ${fmt(minY)} ${fmt(maxX - minX)} ${fmt(maxY - minY)}`,
    ground,
    basement,
    podium,
    floors,
    parapet,
  };
}

/** Floor-to-floor spacing in screen units (for CSS offsets). */
export const FLOOR_STEP_SCREEN = FLOOR_TO_FLOOR * Math.cos(ELEV);
