#!/usr/bin/env node
/**
 * Photoreal tower stage inputs (DESIGN §9.7 rev 9, A1). Run with `npm run assets:tower`; outputs are committed.
 * - crops brand-source/tower-render.jpg to tower-floors.json's cropPx ([x0, y0, x1, y1]) → src/assets/generated/tower-stage.jpg
 *   (astro:assets makes the AVIF/WebP widths from it)
 * - copies docs/design/tower-floors.json → src/data/tower-floors.json (the floor bands, in full-image px)
 */
import { copyFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (...p) => path.join(root, ...p);

const bands = JSON.parse(await readFile(r('docs/design/tower-floors.json'), 'utf8'));
// cropPx is [x0, y0, x1, y1] in full-image px (1350 × 1850, the overlay's viewBox)
const [left, top, x1, y1] = bands.cropPx;
const width = x1 - left;
const height = y1 - top;
await sharp(r(bands.image))
  .extract({ left, top, width, height })
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(r('src/assets/generated/tower-stage.jpg'));
await copyFile(r('docs/design/tower-floors.json'), r('src/data/tower-floors.json'));
console.log(`tower-stage.jpg ${width}×${height}; tower-floors.json copied (${bands.floors.length} floors)`);
