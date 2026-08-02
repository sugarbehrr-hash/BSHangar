/**
 * Blue Streak Hangar — offline service worker.
 *
 * TEMPLATE. scripts/gen-sw.mjs fills in the version and the precache manifest
 * from the real build output and writes the result to dist/sw.js. Editing
 * dist/sw.js directly is pointless; edit this.
 *
 * The two placeholders below are deliberately not named anywhere else in this
 * file — a second mention would be substituted instead of the real one.
 *
 * The whole site is precached on install. That is affordable because the build
 * is a few megabytes of static files with no API behind it, and it is the right
 * shape for the audience: crew open this at altitude and in hotels, so "the
 * page you happened to visit already" is not good enough — the answer they need
 * offline is usually the one they have not read yet.
 *
 * Cache-first, with no revalidation. Every asset is immutable for the life of a
 * deploy, so a hit is always correct; a new deploy ships a new VERSION, which
 * makes a byte-different sw.js, which is what triggers the browser to install
 * the new worker and drop every older cache.
 */

const VERSION = '__VERSION__';
const CACHE = `bsh-${VERSION}`;
const PRECACHE = __PRECACHE__;

/** Served when a navigation has no cached page and no network. */
const OFFLINE_FALLBACK = '/404.html';

self.addEventListener('install', (event) => {
  // No skipWaiting: a page already open was built against the previous
  // deploy's hashed asset names, and activating underneath it would start
  // serving the new ones mid-session. The new worker takes over once the last
  // tab is gone.
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Anything off-origin — the Facebook group, flyzed, Amazon — is left to the
  // network. Offline those links should fail honestly rather than resolve out
  // of a cache that was never meant to hold them.
  if (url.origin !== self.location.origin) return;

  event.respondWith(respond(request, url));
});

/**
 * Cache-first over the precache, then the network, then a fallback.
 *
 * Paths are matched as the build emitted them: `astro.config.mjs` sets
 * trailingSlash 'always' and format 'directory', so a route is cached under
 * `/tools/`, never `/tools/index.html`. A bare `/tools` still resolves — the
 * host would redirect it, and offline there is nothing to do the redirecting.
 */
async function respond(request, url) {
  const cache = await caches.open(CACHE);

  const hit = await cache.match(url.pathname);
  if (hit) return hit;

  const isNavigation = request.mode === 'navigate';

  if (isNavigation && !url.pathname.endsWith('/')) {
    const slashed = await cache.match(`${url.pathname}/`);
    if (slashed) return slashed;
  }

  try {
    return await fetch(request);
  } catch (err) {
    if (isNavigation) {
      const fallback = await cache.match(OFFLINE_FALLBACK);
      if (fallback) return fallback;
    }
    // Nothing cached and no network. Say so, rather than letting the request
    // surface as an opaque failure with no explanation.
    return new Response('Offline, and this is not in the downloaded site.', {
      status: 504,
      statusText: 'Offline',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
