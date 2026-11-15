/**
 * Parametric furniture (DESIGN §9.10 F1, rev 10): every piece is generated in code from its traced footprint (`poly`),
 * its kind (`solids[].kind`, refined by `piece`, else inferred from the id prefix) and the nearest wall, which sets its
 * back. No model files. Two tiers: `full` (dollhouse, walk-in) and `low` (the assembled floor: main volumes only).
 * Furniture is illustrative; it follows the plans' furniture drawings.
 *
 * Output: one geometry per piece and material class, with vertex colours, so a unit needs only four materials
 * (matte, gloss, metal, glass). The caller tags and merges them (one mesh per material).
 */
import { BoxGeometry, BufferGeometry, Color, CylinderGeometry, ExtrudeGeometry, Float32BufferAttribute, Matrix4, Shape, Vector3 } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { P2, Unit3d } from '../../data/units3d/types';

/** Material classes (F3): wood takes the oak grain, fabric the linen weave; the colour is always the vertex colour. */
export type FurnMat = 'matte' | 'wood' | 'fabric' | 'gloss' | 'metal' | 'glass';
export interface FurnPiece {
  g: BufferGeometry;
  m: FurnMat;
  /** Footprint centre (plan metres), for staggered animation. */
  c: P2;
}

const C = {
  oak: '#C9A77C',
  darkOak: '#6E5A48',
  greige: '#B5A08A',
  mattress: '#F4F0E8',
  linen: '#E9E2D6',
  sofa: '#C9BDA9', // base, back and arms (design F1 fix 3)
  cushion: '#D8CDBC',
  pillow: '#F1ECE4',
  oakTop: '#A88762', // the darker top edge of side and coffee tables
  groove: '#9A8875', // wardrobe door grooves, 15% darker than the greige oak
  mirror: '#C9D6DE',
  basin: '#DCE1E4',
  rugEdge: '#8E96A6',
  upholstery: '#CFC3B1',
  navy: '#1A273F',
  chair: '#B79B74',
  ivory: '#EFE9DF',
  stone: '#CFC8BC',
  white: '#F6F5F2',
  black: '#1B1C1F',
  line: '#8C7B68',
  gold: '#B59458', // brushed gold (design F1 fix 4)
  steel: '#B9BDC1',
  rug: '#D9D2C6',
};

const WOOD = new Set([C.oak, C.darkOak, C.greige, C.chair, C.oakTop]);
const FABRIC = new Set([C.sofa, C.cushion, C.upholstery, C.linen, C.mattress, C.pillow, C.navy, C.rug, C.rugEdge]);

type Kind = 'bed' | 'nightstand' | 'sofa' | 'dining' | 'chair' | 'tvUnit' | 'sideTable' | 'wardrobe' | 'counter' | 'rug' | 'shower' | 'basin' | 'wc' | 'hob' | 'sink' | 'block';

/** The furniture kind: `piece` when the data has it, else the id prefix (f-bed, f-sofa, …, -ns- nightstands). */
const kindOf = (s: Unit3d['solids'][number]): Kind => {
  if (s.kind !== 'furniture') return (['wardrobe', 'counter', 'rug', 'shower', 'basin', 'wc', 'hob', 'sink'] as const).find((k) => k === s.kind) ?? 'block';
  if (s.piece) return s.piece;
  const id = s.id.toLowerCase();
  if (id.includes('-ns')) return 'nightstand';
  for (const [p, k] of [['f-bed', 'bed'], ['f-sofa', 'sofa'], ['f-dining', 'dining'], ['f-chair', 'chair'], ['f-tv', 'tvUnit'], ['f-side', 'sideTable']] as const) if (id.startsWith(p)) return k;
  return 'block';
};

/**
 * UVs in metres on the face's own plane (top faces x/z, sides along their run and height), so a texture's repeat is
 * set once per material and reads the same on every piece and wall.
 */
export const metreUV = (geo: BufferGeometry) => {
  if (!geo.getAttribute('normal')) geo.computeVertexNormals(); // keep rounded boxes' smooth normals
  const pos = geo.getAttribute('position');
  const nor = geo.getAttribute('normal');
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const ax = Math.abs(nor.getX(i));
    const ay = Math.abs(nor.getY(i));
    const az = Math.abs(nor.getZ(i));
    const [u, v] = ay >= ax && ay >= az ? [pos.getX(i), pos.getZ(i)] : ax >= az ? [pos.getZ(i), pos.getY(i)] : [pos.getX(i), pos.getY(i)];
    uv[i * 2] = u;
    uv[i * 2 + 1] = v;
  }
  geo.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  return geo;
};

const paint = (g: BufferGeometry, hex: string) => {
  const geo = g.index ? g.toNonIndexed() : g;
  if (geo !== g) g.dispose();
  metreUV(geo);
  const c = new Color(hex);
  const n = geo.getAttribute('position').count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3);
  geo.setAttribute('color', new Float32BufferAttribute(a, 3));
  return geo;
};

const dist2seg = ([x, z]: P2, a: P2, b: P2) => {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(x - (a[0] + dx * t), z - (a[1] + dz * t));
};
const centre = (p: readonly P2[]): P2 => [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length];

/**
 * A piece's frame: x along its back (centred), y up, z from the back into the room. `back` picks which side of the
 * footprint is the back (default: the side nearest a wall).
 */
interface Frame {
  w: number;
  d: number;
  m: Matrix4;
}
function frameOf(poly: readonly P2[], back: (sides: [P2, P2][]) => number): Frame | null {
  if (poly.length !== 4) return null;
  const sides = poly.map((a, i) => [a, poly[(i + 1) % 4]!] as [P2, P2]);
  // only true rectangles get a frame; a trapezoid (wr-mbed) is extruded as drawn, flat-topped
  for (let i = 0; i < 4; i++) {
    const [a, b] = sides[i]!;
    const [, c] = sides[(i + 1) % 4]!;
    const ux = b[0] - a[0], uz = b[1] - a[1], vx = c[0] - b[0], vz = c[1] - b[1];
    if (Math.abs(ux * vx + uz * vz) > 0.08 * Math.hypot(ux, uz) * Math.hypot(vx, vz)) return null;
  }
  const bi = back(sides);
  const [a, b] = sides[bi]!;
  const w = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const [o0, o1] = sides[(bi + 1) % 4]!;
  const d = Math.hypot(o1[0] - o0[0], o1[1] - o0[1]);
  if (w < 0.05 || d < 0.05) return null;
  const mid: P2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const c = centre(poly);
  let u = new Vector3((b[0] - a[0]) / w, 0, (b[1] - a[1]) / w);
  let v = new Vector3(-u.z, 0, u.x);
  if (v.x * (c[0] - mid[0]) + v.z * (c[1] - mid[1]) < 0) v = v.negate(); // into the room
  // keep the basis right-handed (x × y = z) so no face turns inside out
  if (new Vector3().crossVectors(u, new Vector3(0, 1, 0)).dot(v) < 0) u = u.negate();
  const m = new Matrix4().makeBasis(u, new Vector3(0, 1, 0), v).setPosition(mid[0], 0, mid[1]);
  return { w, d, m };
}

export function buildFurniture(data: Unit3d, tier: 'full' | 'low'): FurnPiece[] {
  const full = tier === 'full';
  const out: FurnPiece[] = [];
  const walls = data.walls;
  const nearWall = (sides: [P2, P2][]) => {
    let best = 0;
    let bd = Infinity;
    sides.forEach(([a, b], i) => {
      const m: P2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const d = Math.min(...walls.map((w) => dist2seg(m, w.a, w.b)));
      if (d < bd) (bd = d), (best = i);
    });
    return best;
  };
  const dining = data.solids.filter((s) => kindOf(s) === 'dining').map((s) => centre(s.poly));
  const awayFrom = (p: P2) => (sides: [P2, P2][]) => {
    // a chair's back is the side farthest from the table
    let best = 0;
    let bd = -1;
    sides.forEach(([a, b], i) => {
      const d = Math.hypot((a[0] + b[0]) / 2 - p[0], (a[1] + b[1]) / 2 - p[1]);
      if (d > bd) (bd = d), (best = i);
    });
    return best;
  };

  for (const s of data.solids) {
    const kind = kindOf(s);
    const c = centre(s.poly);
    const push = (g: BufferGeometry, hex: string, m: FurnMat = 'matte') =>
      out.push({ g: paint(g, hex), m: m === 'matte' ? (WOOD.has(hex) ? 'wood' : FABRIC.has(hex) ? 'fabric' : m) : m, c });
    const H = Math.min(s.h, 2.4);
    // non-rectangular footprints (L counters, odd blocks): an honest extrusion
    const extrude = (h: number, hex: string, y0 = 0, m: FurnMat = 'matte') => {
      const sh = new Shape();
      s.poly.forEach(([x, z], i) => (i ? sh.lineTo(x, -z) : sh.moveTo(x, -z)));
      const g = new ExtrudeGeometry(sh, { depth: Math.max(0.01, h), bevelEnabled: false }).rotateX(-Math.PI / 2);
      g.translate(0, y0, 0);
      push(g, hex, m);
    };
    const back = kind === 'chair' && dining.length ? awayFrom(dining.reduce((b, p) => (Math.hypot(p[0] - c[0], p[1] - c[1]) < Math.hypot(b[0] - c[0], b[1] - c[1]) ? p : b))) : nearWall;
    const f = frameOf(s.poly, back);
    if (!f) {
      if (kind === 'counter') {
        extrude(s.h - 0.04, C.ivory);
        extrude(0.04, C.stone, s.h - 0.04, 'gloss');
      } else if (kind === 'rug') extrude(0.01, C.rug);
      else if (kind !== 'hob' && kind !== 'sink') extrude(H, kind === 'wardrobe' ? C.greige : C.oak);
      continue;
    }
    const { w, d, m } = f;
    /** A box in the piece's frame: x0..x1 across (centred), y0..y1 up, z0..z1 from the back. */
    const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, hex: string, mm: FurnMat = 'matte', r = 0) => {
      const sx = x1 - x0;
      const sy = y1 - y0;
      const sz = z1 - z0;
      if (sx <= 0.001 || sy <= 0.001 || sz <= 0.001) return;
      const g = r > 0 && full ? new RoundedBoxGeometry(sx, sy, sz, 2, Math.min(r, sx / 2, sy / 2, sz / 2)) : new BoxGeometry(sx, sy, sz);
      g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      g.applyMatrix4(m);
      push(g, hex, mm);
    };
    const cyl = (x: number, z: number, r: number, y0: number, y1: number, hex: string, mm: FurnMat = 'matte', seg = 12) => {
      const g = new CylinderGeometry(r, r, y1 - y0, full ? seg : 8);
      g.translate(x, (y0 + y1) / 2, z);
      g.applyMatrix4(m);
      push(g, hex, mm);
    };
    const W = w / 2;
    const legs = (y1: number, inset: number, t: number, hex: string) => {
      for (const [x, z] of [[-W + inset, inset], [W - inset, inset], [-W + inset, d - inset], [W - inset, d - inset]] as const) box(x - t / 2, x + t / 2, 0, y1, z - t / 2, z + t / 2, hex);
    };
    /** Door lines on the front face (z = d), every `step` metres, from y0 to y1. */
    const doors = (step: number, y0: number, y1: number, handles: boolean) => {
      if (!full) return;
      const n = Math.max(1, Math.round(w / step));
      for (let i = 1; i < n; i++) {
        const x = -W + (w / n) * i;
        box(x - 0.005, x + 0.005, y0 + 0.02, y1 - 0.02, d - 0.002, d + 0.004, handles ? C.groove : C.line);
      }
      if (handles)
        for (let i = 0; i < n; i++) {
          const x = -W + (w / n) * (i + 0.5) + (i % 2 ? -1 : 1) * (w / n) * 0.35;
          box(x - 0.008, x + 0.008, (y0 + y1) / 2 - 0.15, (y0 + y1) / 2 + 0.15, d, d + 0.02, C.gold, 'metal');
        }
    };

    switch (kind) {
      case 'bed': {
        box(-W, W, 0, 0.3, 0.06, d, C.oak); // frame
        box(-W + 0.03, W - 0.03, 0.3, 0.48, 0.1, d - 0.03, C.mattress, 'matte', 0.04); // mattress, 0.18 m above the frame
        box(-W - 0.01, W + 0.01, 0.4, 0.54, d / 3, d + 0.01, C.linen, 'matte', 0.05); // duvet, lower two thirds
        box(-W - 0.05, W + 0.05, 0, Math.min(1, H + 0.6), 0, 0.08, C.upholstery, 'matte', full ? 0.03 : 0); // headboard
        if (full) {
          const pw = Math.min(0.7, w / 2 - 0.1);
          for (const sx of [-1, 1]) box(sx * (w / 4) - pw / 2, sx * (w / 4) + pw / 2, 0.48, 0.62, 0.14, 0.5, C.pillow, 'matte', 0.06); // pillows
          box(-W - 0.02, W + 0.02, 0.54, 0.57, d - 0.5, d - 0.12, C.navy); // throw across the foot
        }
        break;
      }
      case 'nightstand':
        box(-W, W, 0, Math.min(0.5, H + 0.1), 0, d, C.oak);
        if (full) {
          box(-W + 0.03, W - 0.03, 0.33, 0.34, d, d + 0.005, C.line); // drawer line
          cyl(0, d / 2, 0.012, 0.5, 0.82, C.gold, 'matte', 6); // lamp stem, brushed gold
          cyl(0, d / 2, 0.11, 0.82, 1.0, C.linen); // shade
        }
        break;
      case 'sofa': {
        const aw = Math.min(0.16, w * 0.12);
        box(-W, W, 0, 0.25, 0, d, C.sofa); // base
        box(-W, W, 0.25, 0.8, 0, Math.min(0.22, d * 0.3), C.sofa, 'matte', 0.05); // back
        for (const sx of [-1, 1]) box(sx > 0 ? W - aw : -W, sx > 0 ? W : -W + aw, 0, 0.6, 0, d, C.sofa, 'matte', 0.04); // arms
        if (full) {
          const n = Math.max(1, Math.round((w - 2 * aw) / 0.7));
          const cw = (w - 2 * aw) / n;
          for (let i = 0; i < n; i++) {
            const x = -W + aw + cw * i;
            box(x + 0.01, x + cw - 0.01, 0.25, 0.42, 0.22, d - 0.02, C.cushion, 'matte', 0.05); // seat cushions
            box(x + 0.03, x + cw - 0.03, 0.42, 0.78, 0.18, 0.34, i === 0 ? C.navy : C.cushion, 'matte', 0.06); // back cushions (one navy)
          }
        }
        break;
      }
      case 'sideTable':
        if (w * d > 0.6) {
          // a coffee table: a top on four legs, with a gold tray
          box(-W, W, 0.36, 0.385, 0, d, C.oak);
          box(-W, W, 0.385, 0.4, 0, d, C.oakTop);
          if (full) {
            legs(0.36, 0.06, 0.04, C.oak);
            box(-0.18, 0.18, 0.4, 0.42, d / 2 - 0.12, d / 2 + 0.12, C.gold, 'metal');
          }
        } else {
          cyl(0, d / 2, Math.min(w, d) / 2, 0, 0.53, C.oak); // a drum
          cyl(0, d / 2, Math.min(w, d) / 2 + 0.01, 0.53, 0.55, C.oakTop);
        }
        break;
      case 'dining':
        box(-W, W, 0.71, 0.75, 0, d, C.oak);
        if (full) {
          legs(0.71, 0.06, 0.06, C.oak);
          cyl(0, d / 2, 0.006, 1.6, 2.4, C.gold, 'metal', 6); // pendant cord
          cyl(0, d / 2, 0.16, 1.45, 1.6, C.gold, 'metal'); // pendant
        } else box(-0.1, 0.1, 0, 0.71, d / 2 - 0.1, d / 2 + 0.1, C.oak);
        break;
      case 'chair':
        box(-W, W, 0.42, 0.46, 0, d, C.chair); // seat
        box(-W, W, 0.46, 0.9, 0, 0.05, C.chair); // back (away from the table)
        if (full) legs(0.42, 0.03, 0.03, C.darkOak);
        else box(-W + 0.05, W - 0.05, 0, 0.42, 0.05, d - 0.05, C.chair);
        break;
      case 'tvUnit':
        box(-W, W, 0.05, 0.5, 0, d, C.darkOak);
        doors(0.6, 0.05, 0.5, false);
        // the TV on the wall above, 1.2 m wide
        box(-Math.min(0.6, W), Math.min(0.6, W), 0.95, 1.65, 0, 0.04, C.black, 'gloss');
        break;
      case 'wardrobe':
        // 2 cm inside its footprint: traced walls run slightly off-axis, and a flush side z-fought (striped) from inside
        box(-W + 0.02, W - 0.02, 0, Math.min(2.2, Math.max(H, 2.2)), 0.02, d, C.greige);
        doors(0.5, 0, 2.2, true);
        break;
      case 'counter': {
        const top = s.h;
        box(-W + 0.005, W - 0.005, 0.1, top - 0.04, 0.005, d - 0.02, C.ivory); // base cabinets (5 mm off the walls)
        box(-W, W, 0, 0.1, 0.05, d - 0.07, C.darkOak); // plinth
        box(-W - 0.02, W + 0.02, top - 0.04, top, 0, d + 0.02, C.stone, 'gloss'); // worktop, 2 cm overhang
        doors(0.6, 0.1, top - 0.04, false);
        // wall cabinets where the counter's back is on a wall (they sit 1.5–2.2 m, inside the 2.4 m cut)
        if (full && Math.min(...walls.map((wl) => dist2seg(c, wl.a, wl.b))) < d + 0.3) box(-W, W, 1.5, 2.2, 0, 0.35, C.ivory);
        break;
      }
      case 'hob':
        box(-W, W, s.h, s.h + 0.008, 0, d, C.black, 'gloss');
        break;
      case 'sink':
        box(-W, W, s.h - 0.15, s.h + 0.004, 0, d, C.steel, 'metal'); // the basin, inset
        if (full) {
          cyl(0, 0.05, 0.014, s.h, s.h + 0.3, C.steel, 'metal', 6); // tap
          box(-0.012, 0.012, s.h + 0.27, s.h + 0.3, 0.05, 0.2, C.steel, 'metal');
        }
        break;
      case 'rug':
        box(-W, W, 0, 0.01, 0, d, C.rugEdge); // a 6 cm muted navy border
        box(-W + 0.06, W - 0.06, 0.0005, 0.0105, 0.06, d - 0.06, C.rug);
        break;
      case 'shower':
        box(-W, W, 0, 0.08, 0, d, C.white, 'gloss'); // tray
        if (full) box(-W, W, 0.08, 2.0, d - 0.01, d, '#DDE8EE', 'glass'); // a clear glass screen on the open side
        break;
      case 'basin':
        box(-W, W, 0.15, 0.8, 0, d, C.oak); // vanity
        box(-W, W, 0.8, 0.86, 0, d, C.white, 'gloss'); // white top
        box(-W + 0.07, W - 0.07, 0.8605, 0.8615, 0.08, d - 0.06, C.basin, 'gloss'); // the inset basin
        if (full) {
          const mw = Math.min(0.35, W);
          box(-mw - 0.015, mw + 0.015, 1.085, 1.915, 0, 0.015, C.darkOak); // thin frame
          box(-mw, mw, 1.1, 1.9, 0.015, 0.02, C.mirror, 'gloss'); // mirror, 1.1–1.9 m
          cyl(0, 0.06, 0.012, 0.86, 1.0, C.steel, 'metal', 6); // tap
        }
        break;
      case 'wc':
        box(-Math.min(0.2, W), Math.min(0.2, W), 0, 0.4, 0.15, d, C.white, 'gloss', 0.04); // bowl
        box(-W, W, 0, 0.8, 0, 0.18, C.white, 'gloss', 0.03); // tank
        break;
      default:
        box(-W, W, 0, H, 0, d, C.oak);
    }
  }
  return out;
}
