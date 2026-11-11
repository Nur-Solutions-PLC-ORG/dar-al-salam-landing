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
import keyplan from '../assets/plans/keyplan-typical-floor.png';
import groundFloor from '../assets/plans/ground-floor.png';
import basementFloor from '../assets/plans/basement-floor.png';

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
}

const twoBed: readonly RoomKey[] = ['livingDining', 'masterBedroom', 'bedroom', 'kitchen', 'bathrooms2'];
const threeBedFlex: readonly RoomKey[] = [...twoBed, 'storeOrBedroom'];
const threeBed: readonly RoomKey[] = ['livingDining', 'masterBedroom', 'bedrooms2', 'kitchen', 'bathrooms2', 'store'];

/** The 9 apartment types on every residential floor (source: docs/BRIEF.md). */
export const units: readonly Unit[] = [
  { code: 'BL01', id: 'bl01', bedrooms: 2, gross: 158.54, net: 108.57, rooms: twoBed, plan: bl01 },
  { code: 'BL02', id: 'bl02', bedrooms: 3, gross: 166.97, net: 117.0, rooms: threeBedFlex, plan: bl02 },
  { code: 'BL03', id: 'bl03', bedrooms: 3, gross: 166.97, net: 117.0, rooms: threeBed, plan: bl03 },
  { code: 'BL04', id: 'bl04', bedrooms: 3, gross: 166.97, net: 117.0, rooms: threeBedFlex, plan: bl04 },
  { code: 'BL05', id: 'bl05', bedrooms: 3, gross: 169.23, net: 119.05, rooms: threeBed, plan: bl05 },
  { code: 'BL06', id: 'bl06', bedrooms: 3, gross: 171.18, net: 121.21, rooms: threeBed, plan: bl06 },
  { code: 'BL07', id: 'bl07', bedrooms: 3, gross: 169.24, net: 119.27, rooms: threeBed, plan: bl07 },
  { code: 'BL08', id: 'bl08', bedrooms: 3, gross: 167.63, net: 117.66, rooms: threeBed, plan: bl08 },
  { code: 'BL09', id: 'bl09', bedrooms: 3, gross: 168.55, net: 118.54, rooms: threeBed, plan: bl09 },
];

export const floorPlans = { keyplan, groundFloor, basementFloor } as const;

/** Residential floors 1–14. */
export const residentialFloors: readonly number[] = Array.from({ length: 14 }, (_, i) => i + 1);

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
