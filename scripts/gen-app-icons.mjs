/**
 * Render the app icons from src/assets/brand-mark.svg.
 *
 * Run by hand — `node scripts/gen-app-icons.mjs` — not by `npm run build`, for
 * the same reason as scripts/fetch-fonts.mjs: the outputs are committed, so the
 * build has nothing to compute and CI has nothing extra to get wrong. Re-run it
 * when the mark changes and commit the diff.
 *
 * brand-mark.svg is the jet and streak from the shipped lockup, rotated so the
 * climb fills a square. It is itself an output of the logo pipeline in
 * scripts/logo — the same relationship src/assets/brand-logo.svg has to
 * `build.mjs --ship=C`. This script deliberately depends only on the committed
 * SVG, never on that pipeline.
 *
 * Every output has the navy baked in. The mark's aircraft is white and its
 * streak is mid-blue: on a transparent ground both vanish against a light
 * browser tab strip or a light home screen, which is exactly where these get
 * used.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';

const SOURCE = 'src/assets/brand-mark.svg';
const ICON_DIR = 'public/icons';
const PUBLIC = 'public';

/** --navy-900 in src/styles/tokens/colors.css. */
const NAVY = '#0F1E3D';

/**
 * Android and friends crop a maskable icon to a circle or squircle, keeping
 * only the middle 80%. Art drawn to the edge loses its corners, so the maskable
 * variant is rendered smaller inside the same canvas.
 */
const MASKABLE_SAFE_ZONE = 0.8;

const svg = readFileSync(SOURCE, 'utf8');

/** Square canvas of `size`, with the mark scaled to `fill` of it, on navy. */
async function icon(size, fill = 1) {
  const art = await sharp(Buffer.from(svg))
    .resize(Math.round(size * fill), Math.round(size * fill))
    .png()
    .toBuffer();

  const offset = Math.round((size - Math.round(size * fill)) / 2);
  return sharp({
    create: { width: size, height: size, channels: 4, background: NAVY },
  })
    .composite([{ input: art, left: offset, top: offset }])
    .png()
    .toBuffer();
}

mkdirSync(ICON_DIR, { recursive: true });

const outputs = [
  { file: `${ICON_DIR}/icon-192.png`, size: 192, fill: 1 },
  { file: `${ICON_DIR}/icon-512.png`, size: 512, fill: 1 },
  { file: `${ICON_DIR}/icon-maskable-512.png`, size: 512, fill: MASKABLE_SAFE_ZONE },
  // iOS ignores the manifest for the home-screen icon and never applies a mask,
  // so this one is full-bleed and referenced by its own <link> tag.
  { file: `${PUBLIC}/apple-touch-icon.png`, size: 180, fill: 1 },
  { file: `${PUBLIC}/favicon-32.png`, size: 32, fill: 1 },
];

for (const { file, size, fill } of outputs) {
  writeFileSync(file, await icon(size, fill));
  console.log(`  ${String(size).padStart(3)}px  ${file}`);
}

/**
 * SVG favicon for browsers that prefer one — it stays sharp at any tab density.
 * The navy has to be painted in rather than left to the page, because a favicon
 * is composited onto browser chrome this stylesheet does not control.
 */
const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1];
if (!viewBox) throw new Error(`gen-app-icons: no viewBox in ${SOURCE}`);
const [vx, vy, vw, vh] = viewBox.split(/\s+/).map(Number);

const favicon = svg.replace(
  /(<svg[^>]*>)/,
  `$1\n<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="${NAVY}"/>`,
);
writeFileSync(`${PUBLIC}/favicon.svg`, favicon);
console.log(`  vector  ${PUBLIC}/favicon.svg`);
