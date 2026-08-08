/**
 * Fail the build if any class in the output has no CSS rule behind it.
 *
 * This exists because of a real incident: the eleven per-component stylesheets
 * were replaced by system.css in one commit, and the pages that still used the
 * old class names were converted over the following commits. In between, the
 * discount pages deployed with .baseintro, .explorer, .znone and the old button
 * variants completely unstyled — a raw giant "CLT" and bare links, live, for
 * about forty minutes. Nothing failed: the build was green and the links all
 * resolved, because no check looked at whether the markup and the stylesheet
 * still agreed.
 *
 * Runs after `astro build`, over dist/ and the emitted CSS.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { DIST, SRC, forDisplay } from './lib/paths.mjs';

/** Classes that are hooks for script or tooling, never styled. */
const IGNORE = [
  /^(sr-only|skip-link)$/,
  /^pagefind/,
  /^astro-/,
  // Not a class name at all: an unrendered template hole. The standalone lab
  // pages under public/ ship their JS templates verbatim, so
  // `class="chip ${card.unclear ? 'on' : ''}"` reaches dist as literal text.
  // These used to be dodged by skipping any page with an inline <style>, which
  // also exempted every real page — Astro emits one for component styles, so
  // the markup scan was skipping essentially the whole site.
  /[${}'"`]/,
  // card-render.js injects its own stylesheet at runtime (the card container
  // queries and the reference popover), so its rules are never in dist.
  /^vc-/,
];

function walk(dir, ext, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, ext, out);
    else if (p.endsWith(ext)) out.push(p);
  }
  return out;
}

/**
 * Documents this repo does not author, so their classes are not ours to check
 * — and, equally, their rules must not vouch for OUR markup.
 *
 * Matched on the full directory segment rather than a `2026-ta-` prefix: the
 * rebuilt guide and report live at `2026-ta-vote-guide-v2` and
 * `2026-ta-report-v2`, are site-owned, and have to be held to this gate like
 * every other page. A prefix test silently exempted them.
 */
const VENDORED = ['/contract/2026-ta-vote-guide/', '/contract/2026-ta-report/', '/templates/'];
const isVendored = (file) => {
  const path = `/${relative(DIST, file).split(sep).join('/')}`;
  // Underscore-prefixed files are the repo's convention for standalone lab and
  // prototype pages kept in public/ — hand-written, self-contained, and not
  // part of the site's component system.
  if (path.split('/').pop().startsWith('_') || path.includes('/_')) return true;
  return VENDORED.some((dir) => path.startsWith(dir));
};

const ours = walk(DIST, '.html').filter((f) => !isVendored(f));

/**
 * Astro inlines small stylesheets straight into the page instead of emitting a
 * .css file, so reading only dist/*.css misses them entirely — every class
 * styled that way looks unstyled. That blind spot reported the TA report's own
 * printer-friendly mode as having no rule while its rule was sitting in the
 * page it was flagging.
 */
const inlineCss = ours.flatMap((f) =>
  [...readFileSync(f, 'utf8').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1])
);

const css = [...walk(DIST, '.css').map((f) => readFileSync(f, 'utf8')), ...inlineCss].join('\n');

/** Every class name that appears anywhere in a selector. */
const styled = new Set([...css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));

const offenders = new Map();

for (const file of ours) {
  const html = readFileSync(file, 'utf8');

  for (const m of html.matchAll(/class="([^"]+)"/g)) {
    for (const cls of m[1].split(/\s+/)) {
      if (!cls || styled.has(cls)) continue;
      if (IGNORE.some((re) => re.test(cls))) continue;
      if (!offenders.has(cls)) offenders.set(cls, new Set());
      offenders.get(cls).add(relative(DIST, file).split(sep).join('/').replace('/index.html', '/'));
    }
  }
}

// Classes the page never renders but a script builds at runtime — the
// reconcile table, the answer breakdown, re-rendered form fields. check-styles
// reads dist/, so these are invisible to it; scan the source scripts too.
// Every one of these has shipped unstyled at least once.
for (const file of walk(SRC, '.astro')) {
  const src = readFileSync(file, 'utf8');
  const script = src.indexOf('<script>');
  if (script < 0) continue;
  // Literal class="..." plus names assigned through className / classList,
  // which is how .slip-status and .warn got past the literal-only scan.
  const names = [
    ...[...src.slice(script).matchAll(/class="([^"$]*)"/g)].map((m) => m[1]),
    ...[...src.slice(script).matchAll(/className\s*=\s*[`'"]([^`'"$]*)/g)].map((m) => m[1]),
    ...[...src.slice(script).matchAll(/classList\.(?:add|toggle|remove)\(([^)]*)\)/g)]
      .flatMap((m) => [...m[1].matchAll(/['"]([\w-]+)['"]/g)].map((q) => q[1])),
  ];
  for (const group of names) {
    for (const cls of group.split(/\s+/)) {
      if (!cls || styled.has(cls)) continue;
      if (IGNORE.some((re) => re.test(cls))) continue;
      if (!offenders.has(cls)) offenders.set(cls, new Set());
      offenders.get(cls).add(`${forDisplay(file)} (runtime)`);
    }
  }
}

if (offenders.size === 0) {
  console.log(`check-styles: every class in ${forDisplay(DIST)} and in runtime scripts has a rule`);
  process.exit(0);
}

console.error(`\ncheck-styles: ${offenders.size} class(es) with NO CSS rule\n`);
for (const [cls, files] of [...offenders].sort()) {
  const list = [...files];
  console.error(`  .${cls}`);
  console.error(`      ${list.slice(0, 4).join(', ')}${list.length > 4 ? ` … +${list.length - 4}` : ''}`);
}
console.error('\nEither style them or remove them — do not ship half-converted markup.\n');
process.exit(1);
