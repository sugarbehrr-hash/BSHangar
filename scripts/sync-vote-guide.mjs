/**
 * Sync the TA vote guide + report from their sources into public/.
 *
 * WHY THIS EXISTS
 * The vote guide is not built by this site. Its HTML shell comes from the Blue
 * Streak Hangar design-system export and its data comes from the
 * contract-vote-analyzer pipeline (PSA/out_v2/assessment.data.js). Until now
 * that hand-off was a manual file copy that lived only in someone's memory,
 * which is how the repo ended up serving two different builds of the same
 * document at two URLs with 19KB of data drift between them.
 *
 * WHAT IT DOES
 * 1. Copies the shared runtime + design system into public/contract/_assets/
 *    ONCE, rather than once per document (the two documents share ~265KB).
 * 2. Emits each document at its own clean URL.
 * 3. Rewrites the documents' "./foo.js" script srcs to absolute
 *    /contract/_assets/foo.js paths, because the originals resolve relative to
 *    the document URL and the documents are no longer at the site root.
 * 4. Rewrites ds-base.js's `base` constant for the same reason. The file was
 *    written expecting exactly this edit.
 * 5. Guards the self-loader the DS compiler inlined into _ds_bundle.js. The
 *    bundle carries an old, unguarded copy of the root-level ds-base loader
 *    (`base = '.'`) that re-injects ./_ds_bundle.js relative to the DOCUMENT
 *    url — a guaranteed 404 at /contract/<slug>/ on every page load. The
 *    current ds-base.js source already has the dsBaseLoaded guard; the
 *    compiled bundle predates it, and the compiler lives outside this repo.
 *
 * Run: node scripts/sync-vote-guide.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Where the analyzer publishes fresh assessment data. Optional. */
const ANALYZER_OUT = resolve(ROOT, '../contract-vote-analyzer/PSA/out_v2');

const ASSETS_URL = '/contract/_assets';
const ASSETS_DIR = join(ROOT, 'public/contract/_assets');

/**
 * Shared by both documents; copied once.
 *
 * `review.js` used to be in this list. It was the beta fact-checking layer —
 * always-on Confirm/Flag controls plus a fixed bottom bar, persisting to
 * localStorage and exporting a JSON file the reviewer emailed back. It has been
 * replaced by the permanent reader-feedback layer, which is site-owned
 * (src/guide/feedback/) and built straight into the asset directory by
 * scripts/build-guide-feedback.mjs rather than copied from the repo root. Since
 * that layer is not a vendored file, it deliberately does not appear here.
 */
const SHARED = [
  'support.js',
  '_ds_bundle.js',
  'card-render.js',
  'assessment-charts.js',
  'assessment.data.js',
  'styles.css',
];

/**
 * The feedback layer's entry bundle, injected in place of the retired
 * review.js script tag. Produced by scripts/build-guide-feedback.mjs, which
 * writes it directly into ASSETS_DIR — so unlike everything in SHARED it is
 * never copied from the repo root.
 */
const FEEDBACK_BUNDLE = 'guide-feedback.js';

/**
 * Built into ASSETS_DIR by scripts/build-guide-feedback.mjs rather than copied
 * from the repo root, so the prune below must not treat them as strays.
 */
const BUILT_ASSETS = [FEEDBACK_BUNDLE, 'guide-feedback-net.js'];

const TOKENS = ['colors.css', 'effects.css', 'fonts.css', 'spacing.css', 'typography.css'];

/**
 * source file at repo root -> published directory under public/
 *
 * `feedback` marks the documents that carry per-card reader feedback. Only the
 * guide renders `data-card-id` cards; the report has none, so a prompt there
 * would have nothing to attach to.
 */
const DOCUMENTS = [
  { src: 'index.html', out: 'public/contract/2026-ta-vote-guide', feedback: true },
  { src: 'report.html', out: 'public/contract/2026-ta-report', feedback: false },
];

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

/**
 * The DS compiler sweeps every root .js file into the bundle, including the
 * root-level ds-base loader itself. The inlined copy is an OLD revision without
 * the dsBaseLoaded double-injection guard, so when the bundle executes it
 * unconditionally injects `./styles.css` and `./_ds_bundle.js` — both resolve
 * relative to /contract/<slug>/ and 404 on every visit. The page still renders
 * because the outer (guarded, absolute-path) loader already did the real work;
 * this dead re-load is pure console noise. Insert the same guard the current
 * ds-base.js source carries, so the inlined copy no-ops.
 *
 * If a future export drops or fixes the inlined loader, this becomes a clean
 * pass-through; if it changes shape in a way this doesn't recognize, fail loudly
 * so a human re-verifies instead of shipping the 404 back.
 */
const UNGUARDED_LOADER = "// Root-level DS loader — used by root .dc.html pages\n(() => {\n  const base = '.';";
const GUARDED_LOADER =
  "// Root-level DS loader — used by root .dc.html pages\n(() => {\n" +
  '  if (document.documentElement.dataset.dsBaseLoaded) return;\n' +
  '  document.documentElement.dataset.dsBaseLoaded = "1";\n' +
  "  const base = '.';";

function patchBundleSelfLoader(bundle) {
  if (bundle.includes(UNGUARDED_LOADER)) {
    return { text: bundle.replace(UNGUARDED_LOADER, GUARDED_LOADER), note: ' (self-loader guarded)' };
  }
  if (bundle.includes('Root-level DS loader')) {
    throw new Error(
      'sync-vote-guide: _ds_bundle.js contains a root-level DS loader in an unrecognized shape — ' +
        'verify it no longer re-injects ./_ds_bundle.js, then update patchBundleSelfLoader.'
    );
  }
  return { text: bundle, note: '' };
}

// --- 1. Shared assets -------------------------------------------------------

ensureDir(ASSETS_DIR);
ensureDir(join(ASSETS_DIR, 'tokens'));

for (const file of SHARED) {
  // Prefer the analyzer's output for the data + charts when it is present, so a
  // refresh there propagates here instead of silently going stale.
  const analyzerCopy = join(ANALYZER_OUT, file);
  const source = existsSync(analyzerCopy) ? analyzerCopy : join(ROOT, file);

  if (!existsSync(source)) {
    throw new Error(`sync-vote-guide: missing required asset "${file}" (looked in ${source})`);
  }

  const origin = source === analyzerCopy ? 'analyzer' : 'repo';
  if (file === '_ds_bundle.js') {
    const { text, note } = patchBundleSelfLoader(readFileSync(source, 'utf8'));
    writeFileSync(join(ASSETS_DIR, file), text);
    log(`  asset  ${file.padEnd(24)} <- ${origin}${note}`);
  } else {
    copyFileSync(source, join(ASSETS_DIR, file));
    log(`  asset  ${file.padEnd(24)} <- ${origin}`);
  }
}

for (const token of TOKENS) {
  const source = join(ROOT, 'tokens', token);
  if (!existsSync(source)) throw new Error(`sync-vote-guide: missing token "${token}"`);
  copyFileSync(source, join(ASSETS_DIR, 'tokens', token));
}
log(`  tokens ${TOKENS.length} files`);

// --- 1b. Prune assets nothing publishes any more ----------------------------

/**
 * Removes files in ASSETS_DIR that this script no longer produces.
 *
 * This exists because dropping review.js from SHARED did not unpublish it: the
 * script only ever wrote files, so the retired 20KB beta layer kept shipping to
 * production for as long as the stale copy sat in the directory — referenced by
 * nothing, served with a 200, and invisible in every diff because the file had
 * not changed. Removing a file from SHARED must actually remove it.
 *
 * Deliberately scoped to the flat asset directory: `tokens/` is walked
 * separately above, and anything the build steps drop here is listed in
 * BUILT_ASSETS so a prune cannot race them.
 */
const EXPECTED = new Set([...SHARED, ...BUILT_ASSETS, 'ds-base.js', 'styles.css']);

for (const entry of readdirSync(ASSETS_DIR, { withFileTypes: true })) {
  if (entry.isDirectory() || EXPECTED.has(entry.name)) continue;
  rmSync(join(ASSETS_DIR, entry.name));
  log(`  prune  ${entry.name.padEnd(24)} -> removed (nothing publishes it)`);
}

// --- 2. ds-base.js, repointed at the shared asset directory -----------------

const dsBase = `// GENERATED by scripts/sync-vote-guide.mjs — do not edit by hand.
//
// The original resolved the design-system root relative to the DOCUMENT url
// (base = "."), which only worked while the guide was served from the site
// root. The documents now live at /contract/<slug>/, so the root is absolute.
(() => {
  if (document.documentElement.dataset.dsBaseLoaded) return;
  document.documentElement.dataset.dsBaseLoaded = "1";
  const base = ${JSON.stringify(ASSETS_URL)};
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
`;

writeFileSync(join(ASSETS_DIR, 'ds-base.js'), dsBase);
log(`  asset  ds-base.js               <- generated (base=${ASSETS_URL})`);

// --- 3. Documents, with asset paths rewritten -------------------------------

/**
 * Cross-links BETWEEN the two documents, which must resolve to the published
 * routes rather than to the asset directory.
 *
 * These keys are the design-export's original filenames. The guide links to
 * "./CbaVoteReportV2.dc.html", but the file published alongside it has always
 * been named report.html — so that link has been a 404 on the live site the
 * whole time (verified against production: /CbaVoteReportV2.dc.html returns
 * 404, /report.html returns 200). Mapping it here fixes it as a side effect of
 * moving to real routes.
 */
const DOC_LINKS = {
  'CbaVoteReportV2.dc.html': '/contract/2026-ta-report/',
  'report.html': '/contract/2026-ta-report/',
  'CbaVoteGuideV2.dc.html': '/contract/2026-ta-vote-guide/',
  'index.html': '/contract/2026-ta-vote-guide/',
};

/**
 * Rewrites "./x" references. Document cross-links go to their published route;
 * everything else is an asset and goes to the shared asset directory.
 */
function rewriteAssetPaths(html) {
  let assets = 0;
  let links = 0;

  const out = html.replace(/(src|href)="\.\/([^"?]+)(\?[^"]*)?"/g, (_match, attr, file, query) => {
    const link = DOC_LINKS[file];
    if (link) {
      links++;
      return `${attr}="${link}"`;
    }
    assets++;
    return `${attr}="${ASSETS_URL}/${file}${query ?? ''}"`;
  });

  return { out, count: assets, links };
}

/** Matches the retired beta layer's script tag in the vendored export. */
// Anchored to its own line: the trailing match stops at the newline rather
// than using \s*, which would swallow the next line's indentation too.
const REVIEW_TAG = /[ \t]*<script\s+src="\.\/review\.js"[^>]*>[^<]*<\/script>[ \t]*\r?\n?/;
const FEEDBACK_TAG = `  <script src="${ASSETS_URL}/${FEEDBACK_BUNDLE}"></script>\n`;

/**
 * Swaps the vendored beta review layer for the permanent feedback layer.
 *
 * This runs against the vendored source rather than being committed into it,
 * because index.html is a design-system export: anything edited there is lost
 * the next time the document is regenerated. Doing the swap here means a fresh
 * export drops straight in and still publishes with feedback attached.
 *
 * The already-swapped case is a no-op so the script stays re-runnable. The
 * neither-case throws: if a future export stops emitting the review.js tag,
 * that is the one signal we get that the injection point moved, and silently
 * publishing a guide with no feedback layer is exactly the kind of quiet
 * regression this repo has shipped before.
 */
function swapFeedbackLayer(html, doc) {
  if (!doc.feedback) {
    if (REVIEW_TAG.test(html)) {
      throw new Error(
        `sync-vote-guide: ${doc.src} carries a review.js tag but is not marked feedback:true — ` +
          'decide whether it should have the feedback layer, then update DOCUMENTS.'
      );
    }
    return { out: html, note: '' };
  }

  if (html.includes(`${ASSETS_URL}/${FEEDBACK_BUNDLE}`)) {
    return { out: html, note: ' (feedback layer already present)' };
  }

  if (!REVIEW_TAG.test(html)) {
    throw new Error(
      `sync-vote-guide: ${doc.src} has neither the review.js tag nor the feedback bundle. ` +
        'The export changed shape — re-point the injection in swapFeedbackLayer().'
    );
  }

  return { out: html.replace(REVIEW_TAG, FEEDBACK_TAG), note: ' (feedback layer injected)' };
}

for (const doc of DOCUMENTS) {
  const source = join(ROOT, doc.src);
  if (!existsSync(source)) throw new Error(`sync-vote-guide: missing document "${doc.src}"`);

  if (doc.feedback && !existsSync(join(ASSETS_DIR, FEEDBACK_BUNDLE))) {
    throw new Error(
      `sync-vote-guide: ${FEEDBACK_BUNDLE} is missing from ${ASSETS_DIR}. ` +
        'Run `node scripts/build-guide-feedback.mjs` first.'
    );
  }

  const swapped = swapFeedbackLayer(readFileSync(source, 'utf8'), doc);
  const { out, count, links } = rewriteAssetPaths(swapped.out);
  const dir = join(ROOT, doc.out);
  ensureDir(dir);
  writeFileSync(join(dir, 'index.html'), out);
  log(
    `  doc    ${doc.src.padEnd(24)} -> ${doc.out}/index.html  ` +
      `(${count} assets, ${links} cross-link${links === 1 ? '' : 's'})${swapped.note}`
  );
}

log('sync-vote-guide: done');
