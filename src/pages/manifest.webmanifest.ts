import type { APIRoute } from 'astro';
import { SITE } from '../data/site';

/**
 * Web app manifest — what makes the site installable to a home screen.
 *
 * A route rather than a static file in public/ for the same reason as
 * robots.txt and sitemap.xml: the name and description already live in
 * src/data/site.ts, and a hand-written copy in public/ would be a second place
 * to remember whenever either changes.
 *
 * The icons themselves are NOT generated here — they are committed PNGs under
 * public/icons/, written by scripts/gen-app-icons.mjs. Only the metadata is
 * derived.
 */

/** --navy-900. Matches .topbar, so the browser chrome continues the header. */
const NAVY = '#0F1E3D';

const manifest = {
  name: SITE.name,
  // Home screens truncate hard — anything past roughly twelve characters is
  // replaced with an ellipsis under the icon.
  short_name: 'Hangar',
  description: SITE.description,
  lang: 'en-US',
  dir: 'ltr',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  // The splash screen is this colour behind the icon, which is itself drawn on
  // navy — anything else would frame the icon in a band of the wrong colour.
  background_color: NAVY,
  theme_color: NAVY,
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    // Kept separate from the `any` icons: a masked icon is cropped to the
    // middle 80%, so it is drawn smaller. Declaring one file as both would
    // either crop the art or leave the unmasked icon floating in dead space.
    {
      src: '/icons/icon-maskable-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
};

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
};
