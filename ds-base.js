// Loads the Blue Streak Hangar design system for this standalone site.
// Every asset lives in this same folder, so the base is just ".".
(() => {
  const base = '.';
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
