/**
 * 3D apartment geometry (DESIGN §9.6.1 rev 8), traced by design from the plans: docs/design/units/{id}.json, copied to
 * src/data/units3d/{id}.json by `npm run assets:units`. Metres; x right, z down the plan (plan-aligned, north unknown),
 * y up. Heights are illustrative (not on the plans) and never shown in the UI.
 */
export type P2 = readonly [number, number];

export type WallKind = 'interior' | 'facade' | 'corridor' | 'lightwell';

export type Room3dKey = 'bedroom' | 'masterBedroom' | 'shower' | 'kitchen' | 'store' | 'livingDining' | 'balcony';

export interface Unit3d {
  unit: string;
  grossM2: number;
  netM2: number;
  texture: { src: string; plane: { minX: number; minZ: number; maxX: number; maxZ: number } };
  defaults: { wallH: number; cutawayH: number; doorHead: number };
  footprint: P2[];
  walls: { id: string; a: P2; b: P2; t: number; h: number; kind: WallKind }[];
  openings: { id: string; type: 'door' | 'glazed-door' | 'window'; a: P2; b: P2; t: number; sill: number; head: number }[];
  railings: { id: string; a: P2; b: P2; h: number }[];
  solids: { id: string; kind: 'column' | 'shaft' | 'wardrobe' | 'counter'; poly: P2[]; h: number }[];
  /** `area` is exactly the plan's label; never compute one from the polygon. `label` is the hotspot anchor. */
  rooms: { id: string; name: Room3dKey; area: number; poly: P2[]; label: P2 }[];
}

/** An interior image for a room (DESIGN §9.6.5): rendered only when `approved`, always with the AI label. */
export interface RoomImage {
  src: string;
  alt: string;
  approved: boolean;
}
