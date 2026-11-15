/**
 * The assembled floor (DESIGN §9.9 T5, rev 10): the nine units' real geometry on one plate, inside the 3D tower once a
 * floor has slid out. A lazy chunk of its own, with the nine unit JSONs, fetched in parallel on the first floor pick.
 *
 * Each unit is placed by tower3d.json's `units{}`: world = R(rot, after an optional x-mirror) · local + t, then the
 * tower's centre is subtracted. Low tier: walls cut at 2.4 m with door headers and window sills, flat floor colours per
 * room kind (parquet where the plan labels it), solids as plain blocks (F1 replaces the furniture), no floor textures.
 * One merged mesh per unit per material: walls, floors, solids (vertex colours). Floors also serve as pick targets.
 */
import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { units3d } from '../../data/units3d';
import type { Unit3d } from '../../data/units3d/types';

type P2 = [number, number];
type Tower3d = typeof import('../../data/tower3d.json');

const CUT = 2.4;

export interface FloorUnit {
  code: string;
  group: Group;
  /** The unit's floor (rooms), also the pick target. */
  floor: Mesh;
  mats: MeshStandardMaterial[];
  floorMat: MeshStandardMaterial;
  centre: Vector3;
}

export interface AssembledFloor {
  group: Group;
  units: FloorUnit[];
  /** Hatched (to be confirmed) or plain. */
  setTbc(codes: ReadonlySet<string>): void;
  dispose(): void;
}

const box = (a: P2, b: P2, y0: number, y1: number, t: number) => {
  const g = new BoxGeometry(Math.hypot(b[0] - a[0], b[1] - a[1]), y1 - y0, t);
  g.translate(0, (y0 + y1) / 2, 0);
  g.rotateY(-Math.atan2(b[1] - a[1], b[0] - a[0]));
  g.translate((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2);
  return g.toNonIndexed();
};
const shape = (p: P2[]) => {
  const s = new Shape();
  p.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
  return s;
};
const prism = (p: P2[], h: number) => new ExtrudeGeometry(shape(p), { depth: Math.max(0.01, h), bevelEnabled: false }).rotateX(-Math.PI / 2);
const flat = (p: P2[], y: number) => new ShapeGeometry(shape(p)).rotateX(-Math.PI / 2).translate(0, y, 0).toNonIndexed();
const paint = (g: BufferGeometry, hex: string, uv = false) => {
  const c = new Color(hex);
  const n = g.getAttribute('position').count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3);
  g.setAttribute('color', new Float32BufferAttribute(a, 3));
  if (!uv) g.deleteAttribute('uv'); // floors keep theirs (metres) for the to-be-confirmed hatch
  g.deleteAttribute('normal');
  g.computeVertexNormals();
  return g;
};

// flat floor colours by room kind (no textures in this view); bedrooms oak where the plan says parquet
const FLOOR: Record<string, string> = { livingDining: '#D9D3C8', corridor: '#D9D3C8', bedroom: '#E2DDD4', masterBedroom: '#E2DDD4', kitchen: '#C3C8CB', shower: '#BCC2C6', store: '#D3CEC5', balcony: '#B8B2A8' };
const PIECE: Record<string, string> = { bed: '#ECE7DE', nightstand: '#8B6A4A', sofa: '#9A9389', dining: '#8B6A4A', chair: '#8B6A4A', tvUnit: '#5A5550', sideTable: '#8B6A4A' };
const KIND: Record<string, string> = { column: '#EFEBE5', shaft: '#EFEBE5', wardrobe: '#B08A5E', counter: '#D9D4CC', shower: '#E8EBED', basin: '#F4F4F2', wc: '#F4F4F2', hob: '#2E2E2E', sink: '#C9CDD0', rug: '#B9A98F' };

export async function buildFloor(d: Tower3d): Promise<AssembledFloor> {
  const [cx, cz] = d.centre as P2;
  const codes = Object.keys(d.units);
  const packs = await Promise.all(codes.map((c) => units3d[c]!().then((p) => p.geo)));
  const group = new Group();
  const keep: { dispose(): void }[] = [];
  const hatch = document.createElement('canvas');
  hatch.width = hatch.height = 16;
  const hx = hatch.getContext('2d')!;
  hx.fillStyle = '#E9E4DA';
  hx.fillRect(0, 0, 16, 16);
  hx.strokeStyle = '#B59458';
  hx.lineWidth = 2;
  hx.beginPath();
  hx.moveTo(-4, 20);
  hx.lineTo(20, -4);
  hx.stroke();
  const hatchTex = new CanvasTexture(hatch);
  hatchTex.colorSpace = SRGBColorSpace;
  hatchTex.wrapS = hatchTex.wrapT = RepeatWrapping;
  hatchTex.repeat.set(1.5, 1.5);
  keep.push(hatchTex);

  const units = codes.map((code, ui) => {
    const u = d.units[code as keyof typeof d.units] as { mirror: boolean; rot: number; t: number[] };
    const geo = packs[ui] as Unit3d;
    const r = (u.rot * Math.PI) / 180;
    const [cr, sr] = [Math.cos(r), Math.sin(r)];
    // local → tower → centred on the tower (rot counter-clockwise after the optional x-mirror)
    const T = ([x0, z0]: readonly [number, number]): P2 => {
      const x = u.mirror ? -x0 : x0;
      return [x * cr - z0 * sr + u.t[0]! - cx, x * sr + z0 * cr + u.t[1]! - cz];
    };
    // a mirrored unit's polygons flip their winding; reverse them so extrusions and floors face the right way
    const TP = (poly: readonly (readonly [number, number])[]) => (u.mirror ? poly.map(T).reverse() : poly.map(T));
    const walls: BufferGeometry[] = [];
    for (const w of geo.walls) walls.push(box(T(w.a), T(w.b), 0, Math.min(w.h, CUT), w.t));
    for (const op of geo.openings) {
      if (op.type === 'window' && op.sill > 0.01) walls.push(box(T(op.a), T(op.b), 0, op.sill, op.t));
      if (op.type !== 'open' && op.head < CUT) walls.push(box(T(op.a), T(op.b), op.head, CUT, op.t));
    }
    const floors = geo.rooms.map((rm) => paint(flat(TP(rm.poly), 0.02), rm.finish === 'parquet' ? '#C9A57A' : (FLOOR[rm.name] ?? '#D9D3C8'), true));
    const solids = geo.solids.map((s) => paint(prism(TP(s.poly), Math.min(s.h, CUT)), s.kind === 'furniture' ? (PIECE[s.piece ?? ''] ?? '#CFC7BB') : (KIND[s.kind] ?? '#CFC7BB')));
    for (const rl of geo.railings) solids.push(paint(box(T(rl.a), T(rl.b), 0, rl.h, 0.05), '#3A3A3A'));

    const wallMat = new MeshStandardMaterial({ color: '#F2EEE8', roughness: 0.9, transparent: true });
    const floorMat = new MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: DoubleSide, transparent: true });
    const solidMat = new MeshStandardMaterial({ vertexColors: true, roughness: 0.8, transparent: true });
    const ug = new Group();
    const add = (gs: BufferGeometry[], m: MeshStandardMaterial, shadow: boolean) => {
      const g = mergeGeometries(gs)!;
      gs.forEach((x) => x.dispose());
      keep.push(g, m);
      const mesh = new Mesh(g, m);
      mesh.castShadow = shadow;
      mesh.receiveShadow = true;
      ug.add(mesh);
      return mesh;
    };
    add(walls, wallMat, true);
    const floor = add(floors, floorMat, false);
    if (solids.length) add(solids, solidMat, true);
    group.add(ug);
    const c = T([(geo.texture.plane.minX + geo.texture.plane.maxX) / 2, (geo.texture.plane.minZ + geo.texture.plane.maxZ) / 2]);
    return { code, group: ug, floor, mats: [wallMat, floorMat, solidMat], floorMat, centre: new Vector3(c[0], 0, c[1]) } satisfies FloorUnit;
  });

  return {
    group,
    units,
    setTbc(tbc) {
      for (const u of units) {
        const want = tbc.has(u.code) ? hatchTex : null;
        if (u.floorMat.map === want) continue;
        u.floorMat.map = want;
        u.floorMat.needsUpdate = true;
      }
    },
    dispose() {
      keep.forEach((x) => x.dispose());
    },
  };
}
