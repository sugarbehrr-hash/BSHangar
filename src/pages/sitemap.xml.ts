import type { APIRoute } from 'astro';
import { bases } from '../data/bases';
import { SITE } from '../data/site';

/**
 * sitemap.xml, generated from the same data that generates the routes.
 *
 * Written as a route rather than pulled in via @astrojs/sitemap so the priority
 * and changefreq hints can reflect what this site actually is: the base
 * discount pages are the highest-value entry points (they answer a literal
 * search query) and the vendored vote guide is excluded, since it is a
 * client-rendered artifact with nothing for a crawler to read.
 */

interface Entry {
  path: string;
  priority: number;
  changefreq: 'weekly' | 'monthly';
}

function buildEntries(): Entry[] {
  const entries: Entry[] = [
    { path: '/', priority: 1.0, changefreq: 'weekly' },
    { path: '/new-here/', priority: 0.6, changefreq: 'monthly' },
    { path: '/commuting/', priority: 0.9, changefreq: 'monthly' },
    { path: '/contract/', priority: 0.9, changefreq: 'weekly' },
    { path: '/crew-discounts/', priority: 0.9, changefreq: 'weekly' },
    { path: '/crew-essentials/', priority: 0.6, changefreq: 'monthly' },
    { path: '/tools/', priority: 0.7, changefreq: 'monthly' },
  ];

  for (const base of bases) {
    // The first category is served at the base root, so it is not emitted
    // separately — one canonical URL per view.
    entries.push({ path: `/crew-discounts/${base.key}/`, priority: 0.8, changefreq: 'weekly' });
    for (const category of base.categories.slice(1)) {
      entries.push({
        path: `/crew-discounts/${base.key}/${category.key}/`,
        priority: 0.7,
        changefreq: 'weekly',
      });
    }
  }

  return entries;
}

export const GET: APIRoute = () => {
  const origin = SITE.url.replace(/\/$/, '');
  const lastmod = new Date().toISOString().slice(0, 10);

  const urls = buildEntries()
    .map(
      (entry) =>
        `  <url>\n` +
        `    <loc>${origin}${entry.path}</loc>\n` +
        `    <lastmod>${lastmod}</lastmod>\n` +
        `    <changefreq>${entry.changefreq}</changefreq>\n` +
        `    <priority>${entry.priority.toFixed(1)}</priority>\n` +
        `  </url>`
    )
    .join('\n');

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls}\n` +
    `</urlset>\n`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
