/**
 * Tower massing constants shared by the build-time SVG maquette (tier 0/1) and the Three.js scene (tier 2).
 * Heights are ILLUSTRATIVE (DESIGN §9.4): used for the model only, never shown in the UI.
 */
import hotspots from './keyplan-hotspots.json';

export const PX_PER_M = hotspots.pxPerMetre; // 35.7
export const RESIDENTIAL_FLOORS = 14;
export const FLOOR_TO_FLOOR = 3.2; // illustrative
export const SLAB_DEPTH = 2.9; // illustrative (0.3 m gap reads as a floor line)
export const GROUND_HEIGHT = 4.8; // illustrative, commercial ground floor
export const GROUND_INSET = 0.6;
export const PARAPET = 1.2;
export const GLAZING_BAND = 0.5;

/** Floor-plate outline in metres, centred on its bounding box; y grows "south" (down the plan). */
export const floorOutlineM: readonly (readonly [number, number])[] = (() => {
  const pts = hotspots.floorOutline.map(([x = 0, y = 0]) => [x / PX_PER_M, y / PX_PER_M] as const);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  return pts.map(([x, y]) => [x - cx, y - cy] as const);
})();

/** Bottom of residential floor n (1-based), metres above ground. */
export const floorBase = (n: number) => GROUND_HEIGHT + (n - 1) * FLOOR_TO_FLOOR;
export const towerTop = floorBase(RESIDENTIAL_FLOORS) + SLAB_DEPTH;

/** Inset a polygon toward its centroid by `d` metres (approximation, fine for a convex-ish plate). */
export function insetPolygon(pts: readonly (readonly [number, number])[], d: number) {
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  return pts.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    const len = Math.hypot(dx, dy) || 1;
    return [x - (dx / len) * d, y - (dy / len) * d] as const;
  });
}
