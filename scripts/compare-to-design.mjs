/**
 * Compare every built page against its design prototype.
 *
 * Both sides are static HTML, so everything is comparable without a browser —
 * including copy inside collapsed accordions and hidden detail panes, which is
 * present in the markup regardless of display state. That is the whole point:
 * a rendered check can only see what is currently visible.
 *
 * Three passes per page, each in document order:
 *   icons     every ph-* glyph
 *   text      every text run
 *   elements  every tag.class
 *
 * Usage: node scripts/compare-to-design.mjs <path-to-design-dir>
 */

import { readFileSync, existsSync } from 'node:fs';
import { argv } from 'node:process';

const DESIGN = argv[2];
if (!DESIGN || !existsSync(DESIGN)) {
  console.error('Usage: node scripts/compare-to-design.mjs <design-dir>');
  process.exit(1);
}

/** prototype file -> built file */
const PAGES = [
  ['Home.dc.html', 'dist/preview-49b94f56/index.html'],
  ['Contract Hub.dc.html', 'dist/contract/index.html'],
  ['Commuting Guide.dc.html', 'dist/commuting/index.html'],
  ['CLT Discounts.dc.html', 'dist/crew-discounts/clt/index.html'],
  ['Essentials.dc.html', 'dist/crew-essentials/index.html'],
  ['Essentials Item.dc.html', 'dist/crew-essentials/roller-pro/index.html'],
  ['FA Approved.dc.html', 'dist/fa-approved/index.html'],
  ['Tools.dc.html', 'dist/tools/index.html'],
];

/** Just the <main>, so chrome differences don't drown the page diff. */
function body(html) {
  const m = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  return m ? m[1] : html;
}

/**
 * The prototype is authored in a tool that leaves <sc-if> wrappers and
 * placeholder attributes behind; strip them so they don't read as differences.
 */
function normalise(html) {
  return html
    .replace(/<\/?sc-[^>]*>/g, '')
    .replace(/\s(data-astro-cid-[\w-]+|astro-[\w-]+)(="[^"]*")?/g, '')
    .replace(/\shint-placeholder-val="[^"]*"/g, '');
}

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

/** Every ph-* glyph, in order. */
const icons = (html) =>
  [...html.matchAll(/class="([^"]*\bph-[\w-]+[^"]*)"/g)]
    .flatMap((m) => m[1].split(/\s+/).filter((c) => /^ph-[a-z-]+$/.test(c) && c !== 'ph-fill' && c !== 'ph-bold'));

/** Every text run, in order, whitespace-normalised. */
const texts = (html) =>
  html
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, '')
    .split(/<[^>]+>/)
    .map((t) => decode(t).replace(/\s+/g, ' ').trim())
    .filter(Boolean);

/** Every inline custom property and colour, in order — accents live here.
    They were invisible before, so two cards with swapped --accent values
    read as identical on every other pass. */
const styles = (html) =>
  [...html.matchAll(/style="([^"]*)"/g)]
    .flatMap((m) => m[1].split(';'))
    .map((d) => d.trim())
    .filter((d) => /^(--|color|background)/.test(d));

/** Every element as tag.class, in order. */
const elements = (html) =>
  [...html.matchAll(/<([a-zA-Z][\w-]*)([^>]*)>/g)]
    .filter((m) => !/^(br|meta|link)$/i.test(m[1]))
    .map((m) => {
      const cls = (m[2].match(/class="([^"]*)"/) || [, ''])[1].trim().split(/\s+/).filter(Boolean);
      const meaningful = cls.filter((c) => !c.startsWith('ph-'));
      return m[1].toLowerCase() + (meaningful.length ? '.' + meaningful.join('.') : '');
    });

/** Multiset difference, so repeated items are counted rather than collapsed. */
function diff(a, b) {
  const count = (xs) => xs.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map());
  const A = count(a);
  const B = count(b);
  const only = (X, Y) =>
    [...X].flatMap(([k, n]) => {
      const d = n - (Y.get(k) || 0);
      return d > 0 ? [{ item: k, n: d }] : [];
    });
  return { missing: only(A, B), extra: only(B, A) };
}

let totalIssues = 0;

for (const [proto, built] of PAGES) {
  const p = `${DESIGN}/${proto}`;
  if (!existsSync(p) || !existsSync(built)) {
    console.log(`\n## ${proto}\n  SKIP — ${!existsSync(p) ? 'prototype' : 'build'} not found`);
    continue;
  }

  const P = normalise(body(readFileSync(p, 'utf8')));
  const M = normalise(body(readFileSync(built, 'utf8')));

  console.log(`\n${'='.repeat(78)}\n## ${proto}  ->  ${built}\n${'='.repeat(78)}`);

  for (const [label, fn, limit] of [
    ['ICONS', icons, 40],
    ['TEXT', texts, 40],
    ['ELEMENTS', elements, 30],
    ['STYLES', styles, 24],
  ]) {
    const { missing, extra } = diff(fn(P), fn(M));
    totalIssues += missing.length + extra.length;
    if (!missing.length && !extra.length) {
      console.log(`\n  ${label}: identical`);
      continue;
    }
    console.log(`\n  ${label}:  ${missing.length} missing · ${extra.length} extra`);
    for (const { item, n } of missing.slice(0, limit)) {
      console.log(`    - MISSING${n > 1 ? ` x${n}` : ''}: ${String(item).slice(0, 150)}`);
    }
    if (missing.length > limit) console.log(`    … ${missing.length - limit} more missing`);
    for (const { item, n } of extra.slice(0, limit)) {
      console.log(`    + EXTRA${n > 1 ? ` x${n}` : ''}: ${String(item).slice(0, 150)}`);
    }
    if (extra.length > limit) console.log(`    … ${extra.length - limit} more extra`);
  }
}

console.log(`\n${'='.repeat(78)}\nTOTAL DIFFERENCES: ${totalIssues}\n`);
