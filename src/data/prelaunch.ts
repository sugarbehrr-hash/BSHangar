/* ============================================================
   Pre-launch curtain — single switch for the whole site
   ------------------------------------------------------------
   The 2026 TA vote guide is being shared with crew while the
   rest of the site is still under construction. While PRELAUNCH
   is true:

     - `/` renders a coming-soon page instead of the homepage
       (src/pages/index.astro)
     - every BaseLayout page carries noindex, and the 404 stops
       listing the section nav
     - sitemap.xml emits no URLs (src/pages/sitemap.xml.ts)
     - robots.txt allows only /contract/ (src/pages/robots.txt.ts)
     - the real homepage stays reachable at PREVIEW_PATH —
       unlinked and unguessable, for internal review only

   Launch day: flip PRELAUNCH to false and delete the preview
   directory under src/pages/. Nothing else to touch.
   ============================================================ */

export const PRELAUNCH = true;

/**
 * Unlinked entry point to the full site while the curtain is up. From here the
 * section nav works normally; only the brand / Home links lead back to the
 * curtain, since they point at `/`.
 */
export const PREVIEW_PATH = '/preview-49b94f56/';
