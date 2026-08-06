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
 * TWO STRATEGIES, SPLIT BY WHETHER THE URL CHANGES WHEN THE CONTENT DOES
 *
 * The real boundary is not "pages vs assets" — it is content-addressed vs not.
 * Astro's own build output — /_astro/*.css, fonts, hashed images — is
 * cache-first with no revalidation, correctly: the hash lives in the filename,
 * so a hit can never be stale and a changed file is simply a different URL.
 *
 * EVERYTHING ELSE is network-first, with the precached copy as the fallback:
 * pages, and also the vote guide's shared files (support.js, guide-feedback.js,
 * assessment.data.js, card-render.js...), Pagefind's bundle, the manifest, the
 * icons — anything published at one fixed path for its whole life while its
 * content changes underneath it.
 *
 * Pages were cache-first once, and that stranded people: the installed app
 * kept serving a page from the previous deploy, that page asked for the
 * previous deploy's hashed asset names, and those names no longer existed on
 * the server — so the app came back with no CSS until it was force-quit. The
 * fix at the time was scoped to "pages," which was too narrow: the vote
 * guide's shared files hit the identical failure the same way — a reader's
 * browser precached guide-feedback.js before Firebase was even configured,
 * and every visit after kept serving that dormant build indefinitely, because
 * a cache-first hit never asks the network at all. Same cause, same fix,
 * generalized to the actual invariant this time: a fixed URL is the one thing
 * that has to be asked about rather than assumed, whatever kind of file it is.
 *
 * What that costs: these requests now wait on the network. NAV_TIMEOUT caps
 * that wait, because "slow" and "offline" look identical to a phone on a
 * hotel wifi that resolves DNS and then stalls — past the cap we serve the
 * downloaded copy rather than spin.
 *
 * What it does NOT do is write a fresh fetch into the cache as it happens. The
 * precache is one deploy's coherent snapshot; dropping today's page or asset
 * into last deploy's cache would leave it asking, offline, for something that
 * deploy has and this cache does not.
 *
 * A new deploy still ships a new VERSION, which makes a byte-different sw.js,
 * which is what triggers the browser to install the new worker and drop every
 * older cache. That is now how the offline copy is refreshed, not how a
 * reader gets today's page.
 */

const VERSION = '__VERSION__';
const CACHE = `bsh-${VERSION}`;
const PRECACHE = __PRECACHE__;

/** Served when a navigation has no cached page and no network. */
const OFFLINE_FALLBACK = '/404.html';

/**
 * How long a navigation waits for the network before the downloaded copy is
 * served instead. Long enough that a merely slow connection still wins and
 * the reader gets today's page; short enough that a stalled one does not hold
 * a blank screen while they are trying to look something up on a jetway.
 */
const NAV_TIMEOUT = 3000;

self.addEventListener('install', (event) => {
  // No skipWaiting: a page already open was built against the previous
  // deploy's hashed asset names, and activating underneath it would start
  // serving the new ones mid-session. The new worker takes over once the last
  // tab is gone.
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)),
  );
});

/**
 * The page asks for the new worker when the reader accepts the update prompt.
 *
 * This is the only route past the deliberate lack of skipWaiting on install:
 * the swap happens because someone chose it and the page reloads immediately
 * after, so nothing is left running against the previous deploy's assets.
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
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
 * Paths are matched as the build emitted them: `astro.config.mjs` sets
 * trailingSlash 'always' and format 'directory', so a route is cached under
 * `/tools/`, never `/tools/index.html`. A bare `/tools` still resolves — the
 * host would redirect it, and offline there is nothing to do the redirecting.
 */
async function respond(request, url) {
  const cache = await caches.open(CACHE);
  if (request.mode === 'navigate') return navigate(request, url, cache);

  // Astro's own build output is genuinely content-addressed — the hash lives
  // in the filename (global.CHbUSdCP.css), so a hit can never be stale and a
  // changed file simply arrives under a different URL. Cache-first, no
  // revalidation, is correct here, and ONLY here.
  if (url.pathname.startsWith('/_astro/')) return assetCacheFirst(request, url, cache);

  // Everything else keeps ONE fixed URL for its whole life while its content
  // changes underneath it: the vote guide's shared files (support.js,
  // guide-feedback.js, assessment.data.js, card-render.js...), Pagefind's
  // search bundle, the manifest, the icons. Treating these as cache-first was
  // an actual bug, not a theoretical one — a reader's browser precached
  // guide-feedback.js before Firebase was configured, and every one of that
  // reader's visits kept being served that dormant copy from the very first
  // version ever downloaded, because a cache hit here never asks the network
  // at all. Same fix as pages, same reason: ask the network, capped, before
  // trusting what was fetched on some earlier visit.
  return assetNetworkFirst(request, url, cache);
}

/** Cache-first for genuinely content-hashed assets — see respond(). */
async function assetCacheFirst(request, url, cache) {
  const hit = await cache.match(url.pathname);
  if (hit) return hit;
  try {
    return await fetch(request);
  } catch {
    return offline();
  }
}

/**
 * Network first, capped by NAV_TIMEOUT, then the downloaded copy, then a
 * plain offline response. Mirrors navigate() below, minus the page-specific
 * 404 fallback — an asset that is neither on the network nor in the cache has
 * nothing sensible to substitute.
 */
async function assetNetworkFirst(request, url, cache) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(null), NAV_TIMEOUT);
  });

  try {
    const response = await Promise.race([fetch(request), timeout]);
    if (response && response.ok) return response;
    const cached = await cache.match(url.pathname);
    if (cached) return cached;
    if (response) return response;
  } catch {
    const cached = await cache.match(url.pathname);
    if (cached) return cached;
  } finally {
    clearTimeout(timer);
  }

  return offline();
}

/** The precached page for this URL, however the request spelled it. */
function cachedPage(url, cache) {
  return url.pathname.endsWith('/')
    ? cache.match(url.pathname)
    : cache.match(url.pathname).then((hit) => hit || cache.match(`${url.pathname}/`));
}

/**
 * Network first, capped by NAV_TIMEOUT, then the downloaded copy, then 404.
 *
 * A non-ok response falls back to the cache as well: a deploy that briefly
 * 500s should show the page the reader already has rather than an error, and
 * a genuine 404 for a page nobody has cached still surfaces as itself.
 */
async function navigate(request, url, cache) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(null), NAV_TIMEOUT);
  });

  try {
    const response = await Promise.race([fetch(request), timeout]);
    if (response && response.ok) return response;
    const cached = await cachedPage(url, cache);
    if (cached) return cached;
    if (response) return response;
  } catch {
    const cached = await cachedPage(url, cache);
    if (cached) return cached;
  } finally {
    clearTimeout(timer);
  }

  const fallback = await cache.match(OFFLINE_FALLBACK);
  return fallback || offline();
}

/**
 * Nothing cached and no network. Say so, rather than letting the request
 * surface as an opaque failure with no explanation.
 */
function offline() {
  return new Response('Offline, and this is not in the downloaded site.', {
    status: 504,
    statusText: 'Offline',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
