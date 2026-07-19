/**
 * Fail the build on broken internal links.
 *
 * Added after shipping 14 of them: pages linked /print/* routes written against
 * a registry describing routes that did not exist yet. A green `astro build`
 * and a clean `astro check` both passed while every one of those links 404'd,
 * because neither tool knows what a link is supposed to resolve to.
 *
 * Runs after the build, over the emitted HTML. Anchors, external URLs, mailto:
 * and tel: are ignored; everything site-absolute must resolve to a real file.
 *
 * Run: node scripts/check-links.mjs   (wired into `npm run build`)
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

/** Emitted by tooling, not authored — nothing to check inside. */
const SKIP_DIRS = new Set(['pagefind', '_astro', 'og']);

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (entry.endsWith('.html')) acc.push(full);
  }
  return acc;
}

/** Does a site-absolute path resolve to something we actually emitted? */
function resolves(href) {
  const clean = href.split('#')[0].split('?')[0];
  const rel = clean.replace(/^\//, '');
  if (rel === '') return existsSync(join(DIST, 'index.html'));

  const candidates = [
    join(DIST, rel),
    join(DIST, rel, 'index.html'),
    join(DIST, rel.replace(/\/$/, '') + '/index.html'),
  ];
  return candidates.some((c) => existsSync(c) && statSync(c).isFile());
}

const pages = walk(DIST);
const broken = new Map();

for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const from = relative(DIST, file).split(sep).join('/');

  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const href = match[1];

    // Only site-absolute paths are ours to verify.
    if (!href.startsWith('/')) continue;
    // Protocol-relative //cdn... is external.
    if (href.startsWith('//')) continue;

    if (!resolves(href)) {
      if (!broken.has(href)) broken.set(href, new Set());
      broken.get(href).add(from);
    }
  }
}

process.stdout.write(`check-links: scanned ${pages.length} html files\n`);

if (broken.size > 0) {
  process.stderr.write(`\ncheck-links: ${broken.size} BROKEN internal target(s)\n\n`);
  for (const href of [...broken.keys()].sort()) {
    const sources = [...broken.get(href)].sort();
    process.stderr.write(`  ${href}\n`);
    process.stderr.write(
      `      linked from: ${sources.slice(0, 4).join(', ')}${sources.length > 4 ? ` (+${sources.length - 4} more)` : ''}\n`
    );
  }
  process.stderr.write('\n');
  process.exit(1);
}

process.stdout.write('check-links: no broken internal links\n');
