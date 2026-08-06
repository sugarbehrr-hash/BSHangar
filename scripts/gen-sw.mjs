/**
 * Generate dist/sw.js — the offline service worker and its precache manifest.
 *
 * Runs last in `npm run build`, after Astro, the OG cards and Pagefind, so it
 * sees the finished tree. The manifest is DERIVED from dist/ and never written
 * by hand: a hand-kept list drifts from what actually shipped, and the failure
 * mode is silent — a page missing from the list is simply unavailable offline,
 * with nothing to notice it.
 *
 * VERSION is a hash of every precached file's contents. Same output, same
 * version, byte-identical sw.js, so the browser sees no update and no cache
 * churn. Change one byte of one page and the version moves, which is the whole
 * update mechanism: a different sw.js is what makes the browser install a new
 * worker and drop the previous cache.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, sep } from 'node:path';

const DIST = 'dist';
const TEMPLATE = 'scripts/sw.template.js';
const OUT = join(DIST, 'sw.js');

/**
 * Files in dist/ that no visitor ever loads as part of the site.
 *
 * Precaching is not free — every byte here is a byte a phone downloads on a
 * hotel connection before the site is usable offline — so anything that is not
 * part of reading the site stays out.
 */
const EXCLUDE = [
  // The worker itself. The browser fetches it outside the cache by design;
  // caching it is how a service worker gets stuck on an old version.
  /^sw\.js$/,

  // Crawler and scraper surface. og/ is 550 KB of social cards that are only
  // ever fetched by Facebook's scraper, never rendered on a page.
  /^og\//,
  /^robots\.txt$/,
  /^sitemap\.xml$/,

  // The maintainer inbox. An authenticated tool, not part of reading the site,
  // and precaching it would hand a stale shell to whoever opened it next on a
  // shared phone. Excluded here, the worker's network-first navigate() path
  // fetches it fresh every time and never has a copy to fall back on.
  /^inbox\//,

  // Design scratch: logo labs, plane lab, streak variants, the prototype
  // directory. Not linked from anywhere in the site.
  /^_logo-/,
  /^_plane-lab\./,
  /^_streak-variants\./,
  /^_brand-logo\.svg$/,
  /^_proto\//,

  // Host infrastructure, not content.
  /^CNAME$/,
  /^\.nojekyll$/,
  /(^|\/)\.DS_Store$/,
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/**
 * Map a built file to the URL the browser will actually request it by.
 *
 * With trailingSlash 'always' and build.format 'directory', Astro emits a route
 * as `<route>/index.html` but the browser only ever asks for `<route>/`. The
 * cache key has to be the request URL, not the file path, or every navigation
 * misses.
 */
function toUrl(file) {
  const rel = relative(DIST, file).split(sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel}`;
}

const files = walk(DIST)
  .filter((f) => {
    const rel = relative(DIST, f).split(sep).join('/');
    return !EXCLUDE.some((re) => re.test(rel));
  })
  .sort();

if (!files.length) throw new Error('gen-sw: dist/ is empty — run astro build first');

// Hash contents, not paths or mtimes: mtimes move on every build and would
// churn the version (and so every visitor's whole cache) with nothing changed.
const hash = createHash('sha256');
for (const file of files) {
  hash.update(relative(DIST, file));
  hash.update(readFileSync(file));
}
const version = hash.digest('hex').slice(0, 12);

const urls = files.map(toUrl);
const bytes = files.reduce((sum, f) => sum + statSync(f).size, 0);

const sw = readFileSync(TEMPLATE, 'utf8')
  .replaceAll('__VERSION__', version)
  .replaceAll('__PRECACHE__', JSON.stringify(urls, null, 2));

// A placeholder that survives substitution is a ReferenceError the moment the
// browser parses the worker, and a worker that fails to parse fails silently —
// the site just quietly never goes offline. Catch it here instead.
const leftover = sw.match(/__[A-Z_]+__/);
if (leftover) throw new Error(`gen-sw: placeholder ${leftover[0]} was not substituted`);

writeFileSync(OUT, sw);

console.log(
  `gen-sw: ${urls.length} files, ${(bytes / 1024 / 1024).toFixed(2)} MB precached  →  ${OUT}  (version ${version})`,
);
