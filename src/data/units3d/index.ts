/**
 * Units with 3D geometry (DESIGN §9.6 rev 8). Each entry loads the traced geometry and the room-image slot on demand;
 * the floor texture is public/units/{id}-floor.{avif,webp}. BL05 is the pilot; the others switch on one at a time.
 */
import type { RoomImage, RoomPano, Unit3d } from './types';

export const units3d: Partial<
  Record<string, () => Promise<{ geo: Unit3d; images: Partial<Record<string, RoomImage>>; panos: Partial<Record<string, RoomPano>> }>>
> = {
  BL01: async () => {
    const [geo, img] = await Promise.all([import('./bl01.json'), import('./bl01')]);
    return { geo: geo.default as unknown as Unit3d, images: img.images, panos: img.panos };
  },
  BL02: async () => {
    const [geo, img] = await Promise.all([import('./bl02.json'), import('./bl02')]);
    return { geo: geo.default as unknown as Unit3d, images: img.images, panos: img.panos };
  },
  BL03: async () => {
    const [geo, img] = await Promise.all([import('./bl03.json'), import('./bl03')]);
    return { geo: geo.default as unknown as Unit3d, images: img.images, panos: img.panos };
  },
  BL04: async () => {
    const [geo, img] = await Promise.all([import('./bl04.json'), import('./bl04')]);
    return { geo: geo.default as unknown as Unit3d, images: img.images, panos: img.panos };
  },
  BL05: async () => {
    const [geo, img] = await Promise.all([import('./bl05.json'), import('./bl05')]);
    return { geo: geo.default as unknown as Unit3d, images: img.images, panos: img.panos };
  },
  BL06: async () => {
    const [geo, img] = await Promise.all([import('./bl06.json'), import('./bl06')]);
    return { geo: geo.default as unknown as Unit3d, images: img.images, panos: img.panos };
  },
  BL07: async () => {
    const [geo, img] = await Promise.all([import('./bl07.json'), import('./bl07')]);
    return { geo: geo.default as unknown as Unit3d, images: img.images, panos: img.panos };
  },
  BL08: async () => {
    const [geo, img] = await Promise.all([import('./bl08.json'), import('./bl08')]);
    return { geo: geo.default as unknown as Unit3d, images: img.images, panos: img.panos };
  },
  BL09: async () => {
    const [geo, img] = await Promise.all([import('./bl09.json'), import('./bl09')]);
    return { geo: geo.default as unknown as Unit3d, images: img.images, panos: img.panos };
  },
};

/** BL01 (rev 8.4) only where it is confirmed (floors 4, 6, 8, 10, 11): TBC positions never get 3D. */
export const HAS3D: readonly string[] = ['BL01', 'BL02', 'BL03', 'BL04', 'BL05', 'BL06', 'BL07', 'BL08', 'BL09'];
