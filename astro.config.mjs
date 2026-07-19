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
});
