// Loads the design system for a FLAT deploy (this file sits at the site root
// alongside tokens/, styles.css, and _ds_bundle.js — no relative traversal needed).
(() => {
  if (document.documentElement.dataset.dsBaseLoaded) return;
  document.documentElement.dataset.dsBaseLoaded = "1";
  const base = ".";
  for (const p of ["tokens/fonts.css","tokens/colors.css","tokens/typography.css","tokens/spacing.css","tokens/effects.css","styles.css"]) {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + '/' + p;
    document.head.appendChild(l);
  }
  const s = document.createElement('script');
  s.src = base + '/_ds_bundle.js';
  s.onerror = () => console.error('ds-base.js: failed to load ' + s.src);
  document.head.appendChild(s);
})();
