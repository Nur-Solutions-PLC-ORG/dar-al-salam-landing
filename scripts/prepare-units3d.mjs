#!/usr/bin/env node
/**
 * 3D apartment inputs (DESIGN §9.6.1 rev 8). Run with `npm run assets:units`; outputs are committed.
 * For every docs/design/units/{id}.json:
 * - copies the geometry to src/data/units3d/{id}.json (imported dynamically by the explorer)
 * - writes the floor texture to public/units/{id}-floor.avif (≤ 90 KB, the highest quality that fits) and copies the
 *   design WebP next to it as the fallback
 */
import { readdir, copyFile, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (...p) => path.join(root, ...p);
const AVIF_MAX = 90 * 1024;

await mkdir(r('src/data/units3d'), { recursive: true });
await mkdir(r('public/units'), { recursive: true });

const ids = (await readdir(r('docs/design/units'))).filter((f) => /^bl0\d\.json$/.test(f)).map((f) => f.slice(0, 4));
for (const id of ids) {
  await copyFile(r(`docs/design/units/${id}.json`), r(`src/data/units3d/${id}.json`));
  const src = r(`docs/design/units/${id}-floor.webp`);
  await copyFile(src, r(`public/units/${id}-floor.webp`));
  const out = r(`public/units/${id}-floor.avif`);
  let q = 70;
  for (; q >= 30; q -= 4) {
    await sharp(src).avif({ quality: q, effort: 7, chromaSubsampling: '4:2:0' }).toFile(out);
    if ((await stat(out)).size <= AVIF_MAX) break;
  }
  const { size } = await stat(out);
  if (size > AVIF_MAX) throw new Error(`${id}: AVIF is ${size} B even at q${q}`);
  const webp = (await stat(src)).size;
  console.log(`${id}: json copied; avif q${q} ${(size / 1024).toFixed(1)} KB; webp ${(webp / 1024).toFixed(1)} KB`);
}
