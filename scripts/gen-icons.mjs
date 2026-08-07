/**
 * Generate src/styles/tokens/icons.css from the icons the site actually uses.
 *
 * Replaces the @phosphor-icons/web CDN webfont. That script tag was a
 * render-blocking request to unpkg.com, so with no network every icon on the
 * site became a blank box — on a site whose readers are routinely offline.
 *
 * WHY MASKS AND NOT INLINE <svg>
 *
 * Two constraints rule inline SVG out:
 *
 *   1. Roughly forty-five rules in system.css target the bare element —
 *      `.notice i { font-size: 1.5rem; color: var(--sky-700) }` and friends.
 *      Icons have to stay an <i> that `font-size` sizes and `color` colours,
 *      or every one of those rules needs rewriting.
 *   2. Six icons are built as HTML strings by client-side scripts at runtime
 *      (lib/pay-calendar-view.ts, lib/stepper.ts, SiteHeader's search results,
 *      payslip-check's verdict card). Nothing Astro inlines at build time can
 *      reach those.
 *
 * A CSS mask satisfies both: the element stays an <i>, `width/height: 1em`
 * keeps `font-size` as the sizing lever, `background-color: currentColor`
 * keeps `color` as the colour lever, and markup built at runtime picks the
 * rules up like any other class. The icons are monochrome either way, so
 * nothing is lost against the webfont.
 *
 * The SVGs are inlined as data URIs — 88 separate icon requests would be far
 * worse than the CDN this replaces, and precaching one stylesheet is simpler
 * than precaching 88 files.
 *
 * Runs ahead of `astro build`. The output is committed so `astro dev` works
 * without it, but the build regenerates to catch drift.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PUBLIC, SRC, forDisplay, fromRoot } from './lib/paths.mjs';

// The vote guide's card renderer is vendored here, not in src/ — see
// scripts/sync-vote-guide.mjs — but /inbox/ calls window.VoteCard.changeCard()
// directly (single source of truth with the guide itself, see card-render.js's
// own header) rather than re-implementing the card's markup. Its icons need to
// ship in the same self-hosted set as everything else, or they render as blank
// boxes on the one page that reuses this script.
const SRC_EXTRA = join(PUBLIC, 'contract/_assets');
const OUT = fromRoot('src/styles/tokens/icons.css');

/** Phosphor's weight classes — every icon element carries exactly one. */
const WEIGHTS = ['thin', 'light', 'regular', 'bold', 'fill', 'duotone'];

/**
 * The weight Icon.astro applies when a call site does not say. Most icon names
 * reach the component through data (`<Icon name={tier.icon} />`), so they can
 * never be resolved to a weight statically — they all get this one.
 */
const DEFAULT_WEIGHT = 'fill';

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(astro|ts|js)$/.test(p)) out.push(p);
  }
  return out;
}

const sources = [...walk(SRC), ...walk(SRC_EXTRA)].map((f) => readFileSync(f, 'utf8'));

/** Every icon name mentioned anywhere in src, including data files. */
const names = new Set();
for (const src of sources) {
  for (const m of src.matchAll(/\bph-([a-z0-9-]+)/g)) {
    if (!WEIGHTS.includes(m[1])) names.add(m[1]);
  }
}

/**
 * (weight, name) pairs to emit. Every name gets the default weight; a name
 * additionally rendered at another weight gets that one too, so the pair count
 * tracks real usage instead of multiplying every name by every weight.
 */
const pairs = new Set([...names].map((n) => `${DEFAULT_WEIGHT} ${n}`));

for (const src of sources) {
  // Literal class strings, both in markup and in runtime-built HTML:
  //   <i class="ph-fill ph-check">
  for (const m of src.matchAll(new RegExp(`\\bph-(${WEIGHTS.join('|')})\\s+ph-([a-z0-9-]+)`, 'g'))) {
    pairs.add(`${m[1]} ${m[2]}`);
  }
  // Component call sites that name a weight:
  //   <Icon name="ph-arrows-in-simple" weight="bold" />
  for (const tag of src.matchAll(/<Icon\b[^>]*\/?>/g)) {
    const weight = tag[0].match(/weight="(\w+)"/)?.[1];
    const name = tag[0].match(/name="ph-([a-z0-9-]+)"/)?.[1];
    if (weight && name) pairs.add(`${weight} ${name}`);
  }
}

/**
 * Where one icon's SVG lives, asked of the package rather than assumed.
 *
 * `node_modules/@phosphor-icons/core/assets` looks equivalent and is not: it is
 * a path relative to the process's working directory, so it only finds anything
 * in a checkout that has its own node_modules. In a git worktree — which shares
 * the main checkout's install rather than duplicating it — every icon came back
 * missing and the build died claiming 121 icons had been misspelled.
 *
 * import.meta.resolve walks the same way `import` does, from this file outward,
 * so it finds the package wherever npm actually put it. It resolves through the
 * package's own `exports` map, which publishes `./assets/<weight>/*.svg` by
 * pattern — the pattern matches on shape and does not stat, so a name that does
 * not exist still resolves and is caught by the readFileSync below, exactly as
 * a bad path was before. Nothing about the missing-icon report changes.
 *
 * Phosphor names the regular weight `check.svg` and the rest `check-fill.svg`.
 */
function assetPath(weight, name) {
  const file = weight === 'regular' ? `${name}.svg` : `${name}-${weight}.svg`;
  return fileURLToPath(import.meta.resolve(`@phosphor-icons/core/assets/${weight}/${file}`));
}

/**
 * Percent-encode an SVG for a url() data URI. Single quotes for attributes so
 * the value survives being wrapped in double quotes, and only the characters
 * that actually break parsing are escaped — full encodeURIComponent would
 * roughly double the stylesheet for no benefit.
 */
function dataUri(svg) {
  const encoded = svg
    .replace(/"/g, "'")
    .replace(/>\s+</g, '><')
    .trim()
    .replace(/[%#<>?[\]^`{|}]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `url("data:image/svg+xml,${encoded}")`;
}

const missing = [];
const rules = [];

for (const pair of [...pairs].sort()) {
  const [weight, name] = pair.split(' ');
  let svg;
  try {
    svg = readFileSync(assetPath(weight, name), 'utf8');
  } catch {
    missing.push(`ph-${weight} ph-${name}`);
    continue;
  }
  // The mask reads alpha only, so the source colour is irrelevant — but
  // `currentColor` has no element to resolve against inside a data URI, and
  // leaving it there makes the rendered alpha depend on a UA default. The
  // keyword, not #000: a hex fill would be percent-encoded on the way into the
  // URI and reach the SVG parser still escaped, i.e. an invalid colour that
  // only renders because the fallback happens to be black.
  svg = svg.replace(/fill="currentColor"/, 'fill="black"');
  rules.push(`.ph-${weight}.ph-${name} { --ph: ${dataUri(svg)}; }`);
}

if (missing.length) {
  console.error(`\ngen-icons: ${missing.length} icon(s) not in @phosphor-icons/core\n`);
  for (const m of missing) console.error(`  ${m}`);
  console.error('\nCheck the spelling against phosphoricons.com, or pick one that exists.\n');
  process.exit(1);
}

const usedWeights = [...new Set([...pairs].map((p) => p.split(' ')[0]))].sort();

const css = `/* ============================================================
   Blue Streak Hangar — Icons
   ------------------------------------------------------------
   GENERATED by scripts/gen-icons.mjs — do not edit by hand.
   Regenerate with \`node scripts/gen-icons.mjs\`; the build runs
   it ahead of \`astro build\`.

   Self-hosted replacement for the @phosphor-icons/web CDN font.
   Each icon is a CSS mask, so the <i> element is still sized by
   \`font-size\` and coloured by \`color\` exactly as the webfont
   was — every existing \`.card-badge i { … }\` rule keeps working,
   and so does markup that scripts build at runtime.

   ${rules.length} icons, ${usedWeights.join(' + ')} weight${usedWeights.length > 1 ? 's' : ''}.
   ============================================================ */

${usedWeights.map((w) => `.ph-${w}`).join(',\n')} {
  display: inline-block;
  width: 1em;
  height: 1em;
  /* Sits the box where the webfont sat its glyph, so nothing that was
     optically aligned against the old icons shifts by a pixel. */
  vertical-align: -0.125em;
  background-color: currentColor;
  -webkit-mask-image: var(--ph);
  mask-image: var(--ph);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
}

${rules.join('\n')}
`;

writeFileSync(OUT, css);
console.log(
  `gen-icons: ${rules.length} icons (${usedWeights.join(', ')}) → ${forDisplay(OUT)}  ${(css.length / 1024).toFixed(1)} KB`,
);
