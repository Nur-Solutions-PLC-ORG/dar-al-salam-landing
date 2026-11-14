/**
 * 3D apartment geometry (DESIGN §9.6.1 rev 8), traced by design from the plans: docs/design/units/{id}.json, copied to
 * src/data/units3d/{id}.json by `npm run assets:units`. Metres; x right, z down the plan (plan-aligned, north unknown),
 * y up. Heights are illustrative (not on the plans) and never shown in the UI.
 */
export type P2 = readonly [number, number];

export type WallKind = 'interior' | 'facade' | 'corridor' | 'lightwell';

export type Room3dKey = 'bedroom' | 'masterBedroom' | 'shower' | 'kitchen' | 'store' | 'livingDining' | 'balcony' | 'corridor';

export interface Unit3d {
  unit: string;
  grossM2: number;
  netM2: number;
  texture: { src: string; plane: { minX: number; minZ: number; maxX: number; maxZ: number } };
  /** modelCutH (rev 8.1): the model is cut there like a section model (walls, columns, headers, glazing). */
  defaults: { wallH: number; modelCutH?: number; cutawayH: number; doorHead: number };
  footprint: P2[];
  walls: { id: string; a: P2; b: P2; t: number; h: number; kind: WallKind }[];
  /** `open` (rev 9.2): an archway, full height, no frame or glass; the walk treats it like a door. */
  openings: { id: string; type: 'door' | 'glazed-door' | 'window' | 'open'; a: P2; b: P2; t: number; sill: number; head: number }[];
  railings: { id: string; a: P2; b: P2; h: number }[];
  /** `furniture` (rev 8.1): blocks traced over the plan's furniture; the lid reuses the floor texture, `side` colours the sides. */
  solids: { id: string; kind: 'column' | 'shaft' | 'wardrobe' | 'counter' | 'furniture'; poly: P2[]; h: number; side?: string }[];
  /**
   * `area` is exactly the plan's label; never compute one from the polygon. `label` is the hotspot anchor.
   * Rev 8.4: `area` is null when the plan's label is illegible; the UI then shows the name only (never the `note`).
   */
  /** `stand` (rev 9.4): the walk camera's point, the most clear floor around; under 0.3 m `standClearance` it is no walk destination. */
  rooms: { id: string; name: Room3dKey; area: number | null; note?: string; poly: P2[]; label: P2; stand?: P2; standClearance?: number }[];
  /** The unlabelled hall (walk standpoints only, rev 9). */
  hall?: { poly: P2[] } | null;
  /** Rev 9.2: other unlabelled spaces a visitor can stand in (no hotspot, no list row; announced as "Hall"). */
  walkable?: { id: string; name: string; poly: P2[]; note?: string; stand?: P2; standClearance?: number }[];
}

/**
 * A walk-in panorama for a room (DESIGN §9.8 B5, rev 9): rendered only when `approved`, always with the AI label.
 * `src` is the AVIF (≤ 450 KB) with a same-named .webp fallback beside it. `equirect` is 4096 × 2048 on a sphere;
 * `strip` is 3:1 on a cylinder arc of `arc` degrees (default 180). `yawOffset` (degrees) turns the image so its
 * centre faces the plan direction it was generated for, keeping the door rings on their true bearings.
 */
export interface RoomPano {
  src: string;
  kind: 'equirect' | 'strip';
  yawOffset: number;
  arc?: number;
  alt: string;
  approved: boolean;
}

/** An interior image for a room (DESIGN §9.6.5): rendered only when `approved`, always with the AI label. */
export interface RoomImage {
  src: string;
  alt: string;
  approved: boolean;
}
