/**
 * Download the three brand webfonts from Google Fonts into public/fonts/.
 *
 * Run by hand (`node scripts/fetch-fonts.mjs`), not by `npm run build`. The
 * woff2 files are committed, because a build that reaches out to a third party
 * for a render-blocking asset is exactly what this change removes — making the
 * build itself depend on fonts.googleapis.com would just move the problem.
 *
 * Re-run it only to pick up an upstream font revision, then commit the diff.
 *
 * Archivo and Libre Franklin are variable fonts: one file each covers the whole
 * weight range the design uses, which is smaller than the static instances and
 * means a new weight costs nothing. Anton ships a single weight and no axes.
 *
 * Only the `latin` subset is kept. The site is English-only; latin-ext, Cyrillic
 * and Vietnamese would roughly triple the bytes for glyphs nothing renders.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { PUBLIC, forDisplay } from './lib/paths.mjs';

// Google serves woff2 + variable fonts only to a UA it recognises as modern.
// With the default Node UA it falls back to ttf, which is ~3x the bytes.
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const OUT = join(PUBLIC, 'fonts');

/** The exact axes the design uses — see src/styles/tokens/fonts.css. */
const FAMILIES = [
  { css: 'Anton', file: 'anton-latin' },
  { css: 'Archivo:wght@400..800', file: 'archivo-latin-var' },
  { css: 'Libre+Franklin:wght@400..700', file: 'libre-franklin-latin-var' },
];

async function get(url, as = 'text') {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return as === 'text' ? res.text() : Buffer.from(await res.arrayBuffer());
}

/**
 * Pull the woff2 URL for the `latin` subset out of the stylesheet Google
 * returns. Each @font-face block is preceded by a comment naming its subset
 * (`/* latin *\/`, `/* latin-ext *\/`, …); that label is what we match on,
 * rather than the unicode-range, whose formatting is not contractual.
 */
function latinSource(css, family) {
  const block = css.match(/\/\*\s*latin\s*\*\/\s*@font-face\s*\{([^}]*)\}/)?.[1];
  if (!block) throw new Error(`no latin subset in the CSS for ${family}`);
  const url = block.match(/url\((https:\/\/[^)]+\.woff2)\)/)?.[1];
  if (!url) throw new Error(`latin subset for ${family} is not woff2`);
  return url;
}

await mkdir(OUT, { recursive: true });

for (const { css: spec, file } of FAMILIES) {
  const sheet = await get(`https://fonts.googleapis.com/css2?family=${spec}&display=swap`);
  const woff2 = await get(latinSource(sheet, spec), 'buffer');
  await writeFile(join(OUT, `${file}.woff2`), woff2);
  console.log(`${file}.woff2  ${(woff2.length / 1024).toFixed(1)} KB  ${spec}`);
}

console.log(`\n${FAMILIES.length} families written to ${forDisplay(OUT)}/`);
