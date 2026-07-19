// @ts-check
import { defineConfig } from 'astro/config';

// Production host: GitHub Pages, repo sugarbehrr-hash/BSHangar, custom domain
// bluestreakhangar.com (CNAME file lives in public/ so it survives the build).
//
// No `base`: the custom domain serves from the root. This is deliberate and was
// settled before the first line of markup — a project-site build under
// `/BSHangar/` bakes that prefix into every internal link, asset URL, canonical
// and sitemap entry, and unwinding it later is a full-site rewrite.
//
// `site` drives canonicals, OG URLs and sitemap.xml (src/pages/sitemap.xml.ts).
export default defineConfig({
  site: 'https://bluestreakhangar.com',
  trailingSlash: 'always',
  build: { format: 'directory' },

  // The TA vote guide was served from the site root and shared to the Facebook
  // group at those URLs. Moving it to a real route would dead-end every link
  // already posted, so the old paths redirect.
  //
  // Only DIRECTORY-style paths belong here. With trailingSlash 'always' and
  // format 'directory', a redirect key ending in .html makes Astro emit a
  // *directory* named "report.html" containing index.html — so the real file
  // path /report.html stops resolving, and Pagefind then chokes trying to read
  // it as a file. The .html redirect stubs are literal files in public/
  // instead, which are copied verbatim.
  redirects: {
    '/templates/cba-vote/': '/contract/2026-ta-vote-guide/',
  },
});
