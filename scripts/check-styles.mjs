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
import { join } from 'node:path';

const DIST = 'dist';

/** Classes that are hooks for script or tooling, never styled. */
const IGNORE = [
  /^(sr-only|skip-link)$/,
  /^pagefind/,
  /^astro-/,
  /^ph-/, // icon font
];

function walk(dir, ext, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, ext, out);
    else if (p.endsWith(ext)) out.push(p);
  }
  return out;
}

const css = walk(DIST, '.css')
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');

/** Every class name that appears anywhere in a selector. */
const styled = new Set([...css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));

const offenders = new Map();

for (const file of walk(DIST, '.html')) {
  // Vendored artifacts ship their own stylesheets; they are not ours to check.
  if (file.includes('2026-ta-') || file.includes('templates/')) continue;
  const html = readFileSync(file, 'utf8');
  const inline = /<style[\s>]/.test(html);
  if (inline) continue;

  for (const m of html.matchAll(/class="([^"]+)"/g)) {
    for (const cls of m[1].split(/\s+/)) {
      if (!cls || styled.has(cls)) continue;
      if (IGNORE.some((re) => re.test(cls))) continue;
      if (!offenders.has(cls)) offenders.set(cls, new Set());
      offenders.get(cls).add(file.replace(`${DIST}/`, '').replace('/index.html', '/'));
    }
  }
}

if (offenders.size === 0) {
  console.log(`check-styles: every class in ${DIST} has a rule`);
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
