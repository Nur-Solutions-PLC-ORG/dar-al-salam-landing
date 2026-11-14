/**
 * Units with 3D geometry (DESIGN §9.6 rev 8). Each entry loads the traced geometry and the room-image slot on demand;
 * the floor texture is public/units/{id}-floor.{avif,webp}. BL05 is the pilot; the others switch on one at a time.
 */
import type { RoomImage, Unit3d } from './types';

export const units3d: Partial<Record<string, () => Promise<{ geo: Unit3d; images: Partial<Record<string, RoomImage>> }>>> = {
  BL01: async () => {
    const [geo, img] = await Promise.all([import('./bl01.json'), import('./bl01')]);
    return { geo: geo.default as unknown as Unit3d, images: img.images };
  },
  BL05: async () => {
    const [geo, img] = await Promise.all([import('./bl05.json'), import('./bl05')]);
    return { geo: geo.default as unknown as Unit3d, images: img.images };
  },
};

/** BL01 (rev 8.4) only where it is confirmed (floors 4, 6, 8, 10, 11): TBC positions never get 3D. */
export const HAS3D: readonly string[] = ['BL01', 'BL05'];
