/**
 * `npm run assets:textures` (DESIGN §9.10 F3, rev 10): the CC0 texture originals in brand-source/3d-src/ → small WebP
 * maps in public/textures/, loaded on first entering the dollhouse. Budget: ≤ 1.5 MB in total, colour maps ≤ 600 KB
 * (phones load colour only). Normal maps stay linear; colour maps are sRGB as drawn. Sources and licences:
 * brand-source/3d-src/README.md and public/textures/README.md.
 */
import { mkdir, stat, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const r = (p) => new URL(`../${p}`, import.meta.url);
const SRC = 'brand-source/3d-src';
const OUT = 'public/textures';
// [output name, source file, size px, WebP quality]
const maps = [
  ['tile-col', 'polyhaven-floor_tiles_02/floor_tiles_02_diff_1k.jpg', 512, 72],
  ['tile-nor', 'polyhaven-floor_tiles_02/floor_tiles_02_nor_gl_1k.jpg', 512, 90],
  ['tile-rough', 'polyhaven-floor_tiles_02/floor_tiles_02_rough_1k.jpg', 256, 70],
  ['parquet-col', 'polyhaven-laminate_floor_02/laminate_floor_02_diff_1k.jpg', 512, 72],
  ['parquet-nor', 'polyhaven-laminate_floor_02/laminate_floor_02_nor_gl_1k.jpg', 512, 90],
  ['parquet-rough', 'polyhaven-laminate_floor_02/laminate_floor_02_rough_1k.jpg', 256, 70],
  ['plaster-nor', 'polyhaven-painted_plaster_wall/painted_plaster_wall_nor_gl_1k.jpg', 512, 90],
  ['plaster-rough', 'polyhaven-painted_plaster_wall/painted_plaster_wall_rough_1k.jpg', 256, 70],
  ['linen-nor', 'polyhaven-rough_linen/rough_linen_nor_gl_1k.jpg', 256, 90],
  ['oak-col', 'polyhaven-oak_veneer_01/oak_veneer_01_diff_1k.jpg', 512, 72],
  ['oak-rough', 'polyhaven-oak_veneer_01/oak_veneer_01_rough_1k.jpg', 256, 70],
];

await mkdir(r(OUT), { recursive: true });
let total = 0;
let colour = 0;
for (const [name, src, px, q] of maps) {
  const out = r(`${OUT}/${name}.webp`);
  await writeFile(out, await sharp(r(`${SRC}/${src}`).pathname).resize(px, px).webp({ quality: q, effort: 6 }).toBuffer());
  const { size } = await stat(out);
  total += size;
  if (name.endsWith('-col')) colour += size;
  console.log(`${name}.webp ${px}px ${(size / 1024).toFixed(1)} KB`);
}
// a neutral grain map for the furniture's oak: greyscale, its mean lifted to ~0.92, so it multiplies each piece's own
// colour (oak, dark oak, greige) with a subtle grain instead of replacing it
{
  const src = r(`${SRC}/polyhaven-oak_veneer_01/oak_veneer_01_diff_1k.jpg`).pathname;
  const { channels } = await sharp(src).greyscale().stats();
  const mean = channels[0].mean;
  const out = r(`${OUT}/oak-grain.webp`);
  await writeFile(out, await sharp(src).greyscale().resize(512, 512).linear(0.6 * (235 / mean), 235 * 0.4).webp({ quality: 72 }).toBuffer());
  const { size } = await stat(out);
  total += size;
  console.log(`oak-grain.webp 512px ${(size / 1024).toFixed(1)} KB`);
}
console.log(`total ${(total / 1024).toFixed(0)} KB (budget 1536), colour maps ${(colour / 1024).toFixed(0)} KB (budget 600)`);
