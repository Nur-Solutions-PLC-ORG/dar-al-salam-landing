/**
 * `npm run assets:tower3d`: copies design's docs/design/tower3d.json (DESIGN §9.9, rev 10) to src/data/tower3d.json,
 * keeping only what the 3D tower reads at runtime (drops notes, the key-plan fit polygons and scores). The output is
 * committed; the explorer imports it as its own lazy chunk.
 */
import { readFile, writeFile } from 'node:fs/promises';

const r = (p) => new URL(`../${p}`, import.meta.url);
const d = JSON.parse(await readFile(r('docs/design/tower3d.json'), 'utf8'));
const keep = {
  centre: d.centre,
  outline: d.outline,
  heights: d.heights,
  levels: d.levels.map(({ id, floor, y0, h, status, selectable, clad, use }) => ({ id, floor, y0, h, status, selectable, clad, use })),
  units: Object.fromEntries(Object.entries(d.units).map(([k, u]) => [k, { mirror: u.mirror, rot: u.rot, t: u.t, centroid: u.centroid }])),
  twoBedFloors: d.twoBedFloors,
  balconies: d.balconies.map(({ unit, poly }) => ({ unit, poly })),
  glazing: d.glazing.map(({ unit, a, b, sill, head }) => ({ unit, a, b, sill, head })),
  facadeStyle: d.facadeStyle,
  context: d.context,
};
delete keep.heights.basis;
delete keep.facadeStyle.basis;
delete keep.context.basis;
const out = JSON.stringify(keep);
await writeFile(r('src/data/tower3d.json'), out + '\n');
console.log(`tower3d.json: ${(out.length / 1024).toFixed(1)} KB`);
