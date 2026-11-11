#!/usr/bin/env node
/**
 * Font subsetting (harfbuzz via subset-font). Runs before dev/build so output always matches the copy.
 *
 * 1. Noto Sans Ethiopic (variable, ~200 KB) → only the Ethiopic characters used in src/ (am.ts etc.)
 *    plus the Ethiopic punctuation block → public/fonts/noto-sans-ethiopic-subset.woff2.
 *    Typed user input falls back to the system Ethiopic font for missing glyphs.
 * 2. Cormorant Garamond italic → static weight 500, Latin only (one emphasis word per heading)
 *    → public/fonts/cormorant-garamond-italic-500-latin.woff2.
 */
import { readFile, readdir, writeFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import subsetFont from 'subset-font';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'src');
const FONT_IN = path.join(root, 'brand-source/fonts/noto-sans-ethiopic-ethiopic-wght.woff2');
const FONT_OUT = path.join(root, 'public/fonts/noto-sans-ethiopic-subset.woff2');
const ITALIC_IN = path.join(root, 'node_modules/@fontsource-variable/cormorant-garamond/files/cormorant-garamond-latin-wght-italic.woff2');
const ITALIC_OUT = path.join(root, 'public/fonts/cormorant-garamond-italic-500-latin.woff2');
const LATIN = Array.from({ length: 0xff - 0x20 + 1 }, (_, i) => String.fromCodePoint(0x20 + i)).join('') + '–—‘’“”…•€™';

const ETHIOPIC = /[ሀ-᎟ⶀ-⷟꬀-꬯]/gu;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (/\.(ts|astro|md|json)$/.test(entry.name)) yield p;
  }
}

const chars = new Set();
for await (const file of walk(SRC)) {
  for (const ch of (await readFile(file, 'utf8')).match(ETHIOPIC) ?? []) chars.add(ch);
}
// Ethiopic punctuation and numerals block (U+1360–U+137C) so typography never falls back mid-sentence.
for (let cp = 0x1360; cp <= 0x137c; cp++) chars.add(String.fromCodePoint(cp));
// Shared Latin punctuation the Amharic copy uses inside the same runs.
const text = [...chars].sort().join('') + ' .,:;!?()/–—“”‘’«»0123456789';

const input = await readFile(FONT_IN);
const out = await subsetFont(input, text, { targetFormat: 'woff2' });

async function writeIfChanged(file, buf) {
  try {
    if ((await readFile(file)).equals(buf)) return false;
  } catch {}
  await writeFile(file, buf);
  return true;
}

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const changed = await writeIfChanged(FONT_OUT, out);
console.log(
  `fonts: ethiopic subset ${chars.size} chars, ${kb(out.length)} (full ${kb((await stat(FONT_IN)).size)})${changed ? '' : ', unchanged'}`,
);

const italic = await subsetFont(await readFile(ITALIC_IN), LATIN, {
  targetFormat: 'woff2',
  variationAxes: { wght: 500 },
});
const italicChanged = await writeIfChanged(ITALIC_OUT, italic);
console.log(`fonts: cormorant italic 500 latin ${kb(italic.length)}${italicChanged ? '' : ', unchanged'}`);
