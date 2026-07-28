import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import { PRELAUNCH } from '../data/prelaunch';

/**
 * robots.txt, generated as a route (replacing the static public/robots.txt) so
 * it flips with the PRELAUNCH flag instead of being a second place to remember
 * at launch (see src/data/prelaunch.ts).
 *
 * Pre-launch: only /contract/ is crawlable — the shared TA pages keep their
 * link previews working, while every unreleased page is off-limits. The Allow
 * line comes first for crawlers that honor first-match; Google uses
 * longest-match, where order is irrelevant. No Sitemap line: the pre-launch
 * sitemap is deliberately empty.
 */

const PRELAUNCH_BODY = `User-agent: *
Allow: /contract/
Disallow: /
`;

const LAUNCH_BODY = `User-agent: *
Allow: /

Sitemap: ${SITE.url}/sitemap.xml
`;

export const GET: APIRoute = () => {
  return new Response(PRELAUNCH ? PRELAUNCH_BODY : LAUNCH_BODY, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
