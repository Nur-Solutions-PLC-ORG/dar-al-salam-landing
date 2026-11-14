import type { RoomImage, RoomPano } from './types';

/**
 * BL08 room images (DESIGN §9.6.5), keyed by room id in bl08.json. Empty until images are generated and checked
 * against docs/design/units/bl08-check.jpg (wall count, doors, balcony); only `approved: true` ones render, always
 * labelled "Artist's impression; finishes may vary." Until then each room shows its crop of the floor plan.
 */
export const images: Partial<Record<string, RoomImage>> = {};

/** Walk-in panoramas (DESIGN §9.8 B5), keyed by room id: empty until the AI trial's images are approved. */
export const panos: Partial<Record<string, RoomPano>> = {};
