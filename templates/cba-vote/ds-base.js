// Loads this design system into the template. In a consuming project, point
// base at the bound DS folder relative to this file (e.g. '_ds/<folder>' at
// the project root, '../_ds/<folder>' one level down) — one line to edit.
(() => {
  // Guard against double-injection: this script (or the whole helmet) can run
  // more than once if the DC is mounted in a second context whose location
  // differs from the top-level page (nested preview, re-hydration, etc). A
  // second run computed `base` from THAT context's href and got it wrong —
  // producing a stray 404'd stylesheet pair alongside the correct one. Only
  // the first, correct injection is ever needed, so skip entirely on repeat.
  if (document.documentElement.dataset.dsBaseLoaded) return;
  document.documentElement.dataset.dsBaseLoaded = "1";
  // This static deploy always has a fixed layout: this file lives at
  // templates/cba-vote/, two levels below the deploy root. Hardcode it —
  // href-stripping is fragile across double-mount/re-hydration contexts.
  const base = '../..';
  for (const p of ["tokens/fonts.css","tokens/colors.css","tokens/typography.css","tokens/spacing.css","tokens/effects.css","styles.css"]) {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + '/' + p;
    document.head.appendChild(l);
  }
  const s = document.createElement('script');
  s.src = base + '/_ds_bundle.js';
  s.onerror = () => console.error('ds-base.js: failed to load ' + s.src + ' — if this is a consuming project, point the base line in ds-base.js at the bound _ds/<folder> tree relative to this page (e.g. _ds/<folder> at the project root, ../_ds/<folder> one level down); in a fresh design system this can just mean the bundle is not compiled yet');
  document.head.appendChild(s);
})();
