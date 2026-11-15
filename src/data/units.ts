import type { ImageMetadata } from 'astro';
import bl01 from '../assets/plans/bl01.jpg';
import bl02 from '../assets/plans/bl02.jpg';
import bl03 from '../assets/plans/bl03.jpg';
import bl04 from '../assets/plans/bl04.jpg';
import bl05 from '../assets/plans/bl05.jpg';
import bl06 from '../assets/plans/bl06.jpg';
import bl07 from '../assets/plans/bl07.jpg';
import bl08 from '../assets/plans/bl08.jpg';
import bl09 from '../assets/plans/bl09.jpg';
import keyplanDuotone from '../assets/plans/keyplan-duotone.png';
import hotspots from './keyplan-hotspots.json';
import { HAS3D } from './units3d';
import { site } from './site';

/** Room labels; translated in src/i18n/*.ts under `rooms`. */
export type RoomKey =
  | 'livingDining'
  | 'masterBedroom'
  | 'bedroom'
  | 'bedrooms2'
  | 'kitchen'
  | 'bathrooms2'
  | 'store'
  | 'storeOrBedroom';

export type UnitCode = 'BL01' | 'BL02' | 'BL03' | 'BL04' | 'BL05' | 'BL06' | 'BL07' | 'BL08' | 'BL09';

export interface Unit {
  code: UnitCode;
  /** Lower-case id for URLs/DOM ids, e.g. 'bl01'. */
  id: Lowercase<UnitCode>;
  bedrooms: 2 | 3;
  /** Gross area in m². */
  gross: number;
  /** Net area in m². */
  net: number;
  rooms: readonly RoomKey[];
  plan: ImageMetadata;
  /** Key-plan polygon + label position, in key-plan pixels (viewBox 0 0 1549 1940). */
  hotspot: { points: readonly (readonly [number, number])[]; centroid: readonly [number, number] };
  /** Internal grouping only (DESIGN §9.1 rev 2): never rendered in the UI. */
  block: 'north' | 'south';
  /**
   * Plan floors where this home is confirmed (BRIEF update 2026-11-14). Omitted = every plan floor.
   * On the other floors its position is `'tbc'`: shown as "to be confirmed", never as another type or missing.
   */
  confirmedOn?: readonly number[];
  /** Has traced 3D geometry (DESIGN §9.6 rev 8, src/data/units3d): BL05 only, for now. */
  has3d: boolean;
}

// Room lists corrected 2026-11-15 against the plans (BRIEF c40602f, review round 7): BL01, BL02 and BL04 label both
// bedrooms "Bedroom" (no master); BL09 has no store (its unlabelled wet room is not listed).
const twoBed: readonly RoomKey[] = ['livingDining', 'bedrooms2', 'kitchen', 'bathrooms2'];
const threeBedFlex: readonly RoomKey[] = [...twoBed, 'storeOrBedroom'];
const threeBed: readonly RoomKey[] = ['livingDining', 'masterBedroom', 'bedrooms2', 'kitchen', 'bathrooms2', 'store'];
const threeBedNoStore: readonly RoomKey[] = ['livingDining', 'masterBedroom', 'bedrooms2', 'kitchen', 'bathrooms2'];

/** Source: docs/BRIEF.md. */
type UnitBase = Omit<Unit, 'hotspot' | 'block' | 'has3d'>;

/** BRIEF update 2026-11-14: the 2-bedroom home (BL01) is confirmed only on these floors. */
export const twoBedFloors: readonly number[] = [4, 6, 8, 10, 11];

const base: readonly UnitBase[] = [
  { code: 'BL01', id: 'bl01', bedrooms: 2, gross: 158.54, net: 108.57, rooms: twoBed, plan: bl01, confirmedOn: twoBedFloors },
  { code: 'BL02', id: 'bl02', bedrooms: 3, gross: 166.97, net: 117.0, rooms: threeBedFlex, plan: bl02 },
  { code: 'BL03', id: 'bl03', bedrooms: 3, gross: 166.97, net: 117.0, rooms: threeBed, plan: bl03 },
  { code: 'BL04', id: 'bl04', bedrooms: 3, gross: 166.97, net: 117.0, rooms: threeBedFlex, plan: bl04 },
  { code: 'BL05', id: 'bl05', bedrooms: 3, gross: 169.23, net: 119.05, rooms: threeBed, plan: bl05 },
  { code: 'BL06', id: 'bl06', bedrooms: 3, gross: 171.18, net: 121.21, rooms: threeBed, plan: bl06 },
  { code: 'BL07', id: 'bl07', bedrooms: 3, gross: 169.24, net: 119.27, rooms: threeBed, plan: bl07 },
  { code: 'BL08', id: 'bl08', bedrooms: 3, gross: 167.63, net: 117.66, rooms: threeBed, plan: bl08 },
  { code: 'BL09', id: 'bl09', bedrooms: 3, gross: 168.55, net: 118.54, rooms: threeBedNoStore, plan: bl09 },
];

const NORTH = new Set<UnitCode>(['BL01', 'BL02', 'BL03', 'BL04']);

/**
 * The 9 apartment types of the typical floor plan (rev 11: floors 3–16 use it). BL01 is confirmed only
 * on `twoBedFloors`; see `slotStatus()` for what a given floor holds.
 */
export const units: readonly Unit[] = base.map((u) => {
  const h = (hotspots.units as Record<string, { points: number[][]; centroid: number[] }>)[u.code];
  if (!h) throw new Error(`keyplan-hotspots.json: missing ${u.code}`);
  return {
    ...u,
    hotspot: {
      points: h.points.map(([x = 0, y = 0]) => [x, y] as const),
      centroid: [h.centroid[0] ?? 0, h.centroid[1] ?? 0] as const,
    },
    block: NORTH.has(u.code) ? 'north' : 'south',
    has3d: HAS3D.includes(u.code),
  };
});

/** Duotone typical-floor key plan (base image for the floor view). */
export const keyplan = keyplanDuotone;
/** DESIGN §9.3: crops the empty margin and grid bubbles. */
export const keyplanViewBox = '100 60 1200 1840';

/**
 * Floors the explorer shows (rev 11): the residential floors 3–16, nine homes each on the typical plan. The ground
 * floor (reception) and floors 1–2 are never selectable.
 */
const { from: FIRST_FLOOR, to: LAST_FLOOR } = site.project.residentialFloors;
export const PLAN_FLOORS = LAST_FLOOR - FIRST_FLOOR + 1;
export const planFloors: readonly number[] = Array.from({ length: PLAN_FLOORS }, (_, i) => i + FIRST_FLOOR);

/* ---------- per-floor composition ---------- */

/** 'confirmed' = this home type is on this floor; 'tbc' = what sits in this position is not confirmed yet. */
export type SlotStatus = 'confirmed' | 'tbc';

export interface FloorSlot {
  code: UnitCode;
  status: SlotStatus;
  /** null when the position is to be confirmed. */
  bedrooms: 2 | 3 | null;
}

export interface FloorComposition {
  twoBed: number;
  threeBed: number;
  tbc: number;
}

const assertPlanFloor = (floor: number) => {
  if (!Number.isInteger(floor) || floor < FIRST_FLOOR || floor > LAST_FLOOR) throw new Error(`No plan for floor ${floor}`);
};

export const slotStatus = (floor: number, code: UnitCode): SlotStatus => {
  assertPlanFloor(floor);
  const u = units.find((x) => x.code === code);
  if (!u) throw new Error(`Unknown unit ${code}`);
  return !u.confirmedOn || u.confirmedOn.includes(floor) ? 'confirmed' : 'tbc';
};

/** The nine positions of a plan floor, in unit order. */
export const floorSlots = (floor: number): FloorSlot[] =>
  units.map((u) => {
    const status = slotStatus(floor, u.code);
    return { code: u.code, status, bedrooms: status === 'confirmed' ? u.bedrooms : null };
  });

/** e.g. floor 4 → { twoBed: 1, threeBed: 8, tbc: 0 }; floor 3 → { twoBed: 0, threeBed: 8, tbc: 1 }. */
export const floorComposition = (floor: number): FloorComposition =>
  floorSlots(floor).reduce<FloorComposition>(
    (c, s) => {
      if (s.status === 'tbc') c.tbc++;
      else if (s.bedrooms === 2) c.twoBed++;
      else c.threeBed++;
      return c;
    },
    { twoBed: 0, threeBed: 0, tbc: 0 },
  );

/** Plan floors where a home type is confirmed. */
export const floorsOf = (code: UnitCode): readonly number[] =>
  units.find((u) => u.code === code)?.confirmedOn ?? planFloors;

/** Number of home *layouts* (plan types) per bedroom count, for the Homes filter: 1 × 2-bed, 8 × 3-bed. */
export const unitMix = {
  twoBed: units.filter((u) => u.bedrooms === 2).length,
  threeBed: units.filter((u) => u.bedrooms === 3).length,
} as const;

const grossAreas = units.map((u) => u.gross);
/** Whole-number gross range for marketing copy: 158–171 m². */
export const grossRange = {
  min: Math.floor(Math.min(...grossAreas)),
  max: Math.floor(Math.max(...grossAreas)),
} as const;

export const unitByCode = (code: string) => units.find((u) => u.code === code.toUpperCase());

/** Format an area with the locale's decimal style, always with 'm²'. */
export const formatArea = (m2: number, locale = 'en') =>
  `${m2.toLocaleString(locale === 'am' ? 'am-ET' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²`;
