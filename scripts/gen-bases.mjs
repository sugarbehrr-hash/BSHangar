// Transform the export's siteData.js (window.BSH_DATA) into a typed TS module.
//
// Done programmatically rather than by hand so the ~400 venue records cannot
// pick up transcription errors. Two structural changes, both of which remove a
// class of silent bug:
//
// 1. Venue items shipped in TWO shapes — a bare string ("Name · type") or an
//    object {n,s,d} — and every consumer had to call a `norm()` helper to cope.
//    They are normalized to ONE shape here, at build time, once.
//
// 2. Category metadata (`cats`) and category content (`data`) were parallel
//    structures joined by key. A cat whose key had no matching data key would
//    silently render an empty tab. Zones now live INSIDE their category, so
//    the join cannot desync.

import { readFileSync, writeFileSync } from 'node:fs';

const SRC = process.argv[2];
const OUT = process.argv[3];

// siteData.js assigns to `window`; give it one and eval in this scope.
const window = {};
// eslint-disable-next-line no-eval
eval(readFileSync(SRC, 'utf8'));
const bases = window.BSH_DATA.bases;

// Mirrors the export's norm() at BlueStreakHangar.dc.html:942-945.
function normalizeVenue(item) {
  if (typeof item === 'string') {
    const parts = item.split(' · ');
    return { name: parts[0], detail: parts[1] || '', highlight: '' };
  }
  return { name: item.n || '', detail: item.d || '', highlight: item.s || '' };
}

const q = (s) => JSON.stringify(s);

let venueCount = 0;
let zoneCount = 0;

const baseEntries = Object.entries(bases).map(([key, b]) => {
  const categories = (b.cats || []).map((cat) => {
    const zones = (b.data?.[cat.k] || []).map((z) => {
      const venues = (z.items || []).map(normalizeVenue);
      venueCount += venues.length;
      zoneCount += 1;
      return { name: z.z, badge: z.b, note: z.note || '', venues };
    });
    return { key: cat.k, label: cat.label, icon: cat.icon, zones };
  });
  return { key, code: b.code, name: b.name, sub: b.sub, blurb: b.blurb, categories };
});

const body = baseEntries
  .map((b) => {
    const cats = b.categories
      .map((c) => {
        const zones = c.zones
          .map((z) => {
            const venues = z.venues
              .map(
                (v) =>
                  `          { name: ${q(v.name)}, detail: ${q(v.detail)}, highlight: ${q(v.highlight)} },`
              )
              .join('\n');
            return [
              `        {`,
              `          name: ${q(z.name)}, badge: ${q(z.badge)}, note: ${q(z.note)},`,
              `          venues: [`,
              venues,
              `          ],`,
              `        },`,
            ].join('\n');
          })
          .join('\n');
        return [
          `      {`,
          `        key: ${q(c.key)}, label: ${q(c.label)}, icon: ${q(c.icon)},`,
          `        zones: [`,
          zones,
          `        ],`,
          `      },`,
        ].join('\n');
      })
      .join('\n');
    return [
      `  {`,
      `    key: ${q(b.key)},`,
      `    code: ${q(b.code)},`,
      `    name: ${q(b.name)},`,
      `    sub: ${q(b.sub)},`,
      `    blurb: ${q(b.blurb)},`,
      `    categories: [`,
      cats,
      `    ],`,
      `  },`,
    ].join('\n');
  })
  .join('\n');

const header = `/* ============================================================
   Crew discounts — the single source of truth
   ------------------------------------------------------------
   GENERATED from the design export's siteData.js. Do not hand-edit
   the records below; edit this file directly from now on (the
   export is retired) or regenerate via scripts/gen-bases.mjs.

   This dataset feeds BOTH the on-site explorer (/crew-discounts/*)
   AND the printable flyers (/print/*). The export duplicated the
   same content across siteData.js and 12 separate flyer templates,
   so a price change had to be made in two places. It does not
   anymore.
   ============================================================ */

/** One venue. The export shipped these in two different shapes; normalized. */
export interface Venue {
  /** Display name, e.g. "Pappadeaux". */
  name: string;
  /** Supporting detail: gate, cuisine, what the deal covers. May be "". */
  detail: string;
  /** Right-rail highlight: price or percentage, e.g. "$9.95+". May be "". */
  highlight: string;
}

/** A terminal, concourse or landside area within a base. */
export interface Zone {
  name: string;
  /** Short badge shown left of the zone name, e.g. "A/B". */
  badge: string;
  /** Qualifier such as "Pre-security" or "Airside". May be "". */
  note: string;
  venues: Venue[];
}

/** A tab within a base: food, shops, percentage discounts. */
export interface Category {
  /** URL segment, e.g. "eat" | "shop" | "deals". */
  key: string;
  label: string;
  /** Phosphor icon name, e.g. "ph-fork-knife". */
  icon: string;
  zones: Zone[];
}

/** A crew base. \`key\` is the URL segment: /crew-discounts/<key>/ */
export interface Base {
  key: string;
  code: string;
  name: string;
  sub: string;
  blurb: string;
  categories: Category[];
}

export const bases: Base[] = [
`;

const footer = `];

/** Lookup by URL segment. */
export const baseByKey = new Map(bases.map((b) => [b.key, b]));

/** Total venues in a category — used for the tab counts. */
export function venueCount(category: Category): number {
  return category.zones.reduce((n, z) => n + z.venues.length, 0);
}
`;

writeFileSync(OUT, header + body + '\n' + footer);

console.log(`bases:      ${baseEntries.length}`);
console.log(`categories: ${baseEntries.reduce((n, b) => n + b.categories.length, 0)}`);
console.log(`zones:      ${zoneCount}`);
console.log(`venues:     ${venueCount}`);
