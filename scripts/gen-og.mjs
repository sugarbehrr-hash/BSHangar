/**
 * Generate a per-route Open Graph card.
 *
 * Runs AFTER `astro build`, reading titles straight out of the emitted HTML.
 * That ordering is deliberate: it means there is no second registry of routes
 * and titles to keep in step with the real ones. The cards are derived from the
 * built pages the same way the Pagefind index is, so neither can drift.
 *
 * Pipeline: satori (layout + real fonts -> SVG) -> sharp (SVG -> PNG).
 *
 * Run: node scripts/gen-og.mjs   (wired into `npm run build`)
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const OUT_DIR = join(DIST, 'og');
const FONT_DIR = join(ROOT, 'scripts/fonts');

const WIDTH = 1200;
const HEIGHT = 630;

// Straight from src/styles/tokens/colors.css.
const NAVY_900 = '#0F1E3D';
const RED_500 = '#E11D38';
const GOLD_500 = '#E8A33D';
const CREAM_100 = '#FBF7EE';
const SKY_300 = '#9FD0F0';

const fonts = [
  { name: 'Anton', data: readFileSync(join(FONT_DIR, 'Anton-Regular.ttf')), weight: 400, style: 'normal' },
  { name: 'Archivo', data: readFileSync(join(FONT_DIR, 'Archivo-Bold.ttf')), weight: 700, style: 'normal' },
  {
    name: 'Libre Franklin',
    data: readFileSync(join(FONT_DIR, 'LibreFranklin-Regular.ttf')),
    weight: 400,
    style: 'normal',
  },
];

/** Every index.html under dist, excluding the vendored guide + preview. */
function findPages(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'og' || entry === '_astro' || entry === 'pagefind') continue;
      findPages(full, acc);
    } else if (entry === 'index.html') {
      acc.push(full);
    }
  }
  return acc;
}

/** "/" -> "home"; "/crew-discounts/dfw/deals/" -> "crew-discounts-dfw-deals" */
export function slugFor(pathname) {
  const trimmed = pathname.replace(/^\/|\/$/g, '');
  return trimmed === '' ? 'home' : trimmed.replace(/\//g, '-');
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** The card. Plain objects rather than JSX so this file needs no build step. */
function card(title, eyebrow) {
  const el = (type, props, ...children) => ({
    type,
    props: { ...props, children: children.length === 1 ? children[0] : children },
  });

  return el(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: NAVY_900,
        padding: '64px 72px',
      },
    },
    el(
      'div',
      { style: { display: 'flex', alignItems: 'center' } },
      el(
        'div',
        {
          style: {
            display: 'flex',
            backgroundColor: GOLD_500,
            color: NAVY_900,
            fontFamily: 'Archivo',
            fontSize: 22,
            letterSpacing: 3,
            textTransform: 'uppercase',
            padding: '10px 20px',
            borderRadius: 999,
          },
        },
        eyebrow
      )
    ),
    el(
      'div',
      { style: { display: 'flex', flexDirection: 'column' } },
      el(
        'div',
        {
          style: {
            display: 'flex',
            fontFamily: 'Anton',
            fontSize: title.length > 40 ? 76 : 96,
            lineHeight: 1.02,
            color: CREAM_100,
            textTransform: 'uppercase',
          },
        },
        title
      )
    ),
    el(
      'div',
      { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      el(
        'div',
        {
          style: {
            display: 'flex',
            fontFamily: 'Archivo',
            fontSize: 30,
            color: CREAM_100,
          },
        },
        'Blue Streak Hangar'
      ),
      el(
        'div',
        {
          style: {
            display: 'flex',
            fontFamily: 'Libre Franklin',
            fontSize: 24,
            color: SKY_300,
          },
        },
        'bluestreakhangar.com'
      )
    )
  );
}

// --- run --------------------------------------------------------------------

mkdirSync(OUT_DIR, { recursive: true });

const pages = findPages(DIST);
let written = 0;

for (const file of pages) {
  const html = readFileSync(file, 'utf8');

  // Skip the vendored vote guide + report and the review page: they are not
  // ours to restyle, and a card claiming our branding over someone else's
  // document would misrepresent it.
  if (!html.includes('data-pagefind-body')) continue;

  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  if (!titleMatch) continue;

  // Strip the brand from either end. Most routes carry it as a suffix; the
  // homepage sets suffix={false} and leads with it instead. Either way the card
  // footer already says "Blue Streak Hangar", so repeating it in the headline
  // wastes the largest type on the card.
  const title = decodeEntities(titleMatch[1])
    .replace(/\s*[—–-]\s*Blue Streak Hangar\s*$/, '')
    .replace(/^\s*Blue Streak Hangar\s*[—–-]\s*/, '')
    .trim();

  const eyebrowMatch = html.match(/<div class="ph-eyebrow">([^<]*)<\/div>/);
  let eyebrow = eyebrowMatch ? decodeEntities(eyebrowMatch[1]).trim() : 'PSA Flight Attendants';

  // The homepage is a hero, not a pagehead, so it has no .ph-eyebrow and falls
  // back to the default — which then echoes its own headline. If the eyebrow's
  // significant words are already in the title, the card is saying the same
  // thing twice in its two largest type sizes.
  const titleWords = new Set(title.toLowerCase().match(/[a-z]+/g) ?? []);
  const eyebrowWords = (eyebrow.toLowerCase().match(/[a-z]+/g) ?? []).filter((w) => w.length > 2);
  const overlap = eyebrowWords.filter((w) => titleWords.has(w)).length;
  if (eyebrowWords.length > 0 && overlap / eyebrowWords.length >= 0.6) {
    eyebrow = 'Jr & Sr Hangar';
  }

  const pathname = '/' + relative(DIST, dirname(file)).split(sep).filter(Boolean).join('/');
  const slug = slugFor(pathname === '/' ? '/' : pathname + '/');

  const svg = await satori(card(title, eyebrow), { width: WIDTH, height: HEIGHT, fonts });
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  writeFileSync(join(OUT_DIR, `${slug}.png`), png);

  process.stdout.write(`  og  ${String(slug).padEnd(30)} ${title}\n`);
  written++;
}

process.stdout.write(`gen-og: ${written} card${written === 1 ? '' : 's'}\n`);
