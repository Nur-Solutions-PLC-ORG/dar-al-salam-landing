/**
 * Units with 3D geometry (DESIGN §9.6 rev 8). Each entry loads the traced geometry and the room-image slot on demand;
 * the floor texture is public/units/{id}-floor.{avif,webp}. BL05 is the pilot; the others switch on one at a time.
 */
import type { RoomImage, Unit3d } from './types';

export const units3d: Partial<Record<string, () => Promise<{ geo: Unit3d; images: Partial<Record<string, RoomImage>> }>>> = {
  BL05: async () => {
    const [geo, img] = await Promise.all([import('./bl05.json'), import('./bl05')]);
    return { geo: geo.default as unknown as Unit3d, images: img.images };
  },
};

export const HAS3D: readonly string[] = ['BL05'];
