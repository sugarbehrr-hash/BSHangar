/**
 * Pulls the analyzer's deliverable into this repo.
 *
 * WHY THIS EXISTS
 * The vote guide's content is produced by the ta-analyzer skill, whose build
 * emits exactly two files that ship together (ADR-034): `assessment.data.js`
 * (the single source of truth, `window.ASSESSMENT`) and `assessment-charts.js`
 * (the skill-OWNED chart renderer, loaded verbatim). Everything else about the
 * guide — layout, typography, the card language, the page structure — belongs
 * to this repo.
 *
 * That hand-off used to be a manual file copy, and the result is on record:
 * FOUR copies of `assessment.data.js` at THREE different versions across the
 * two repositories, with the newest (v2.1.1) existing only here and the
 * analyzer's own output two patch versions behind. The old sync script still
 * points at `../contract-vote-analyzer/`, a directory that stopped existing
 * when the project was renamed to `TA-Analyzer`, so its "prefer the analyzer's
 * copy" branch has silently never fired.
 *
 * WHAT THIS DOES DIFFERENTLY
 * 1. Points at the analyzer's real location, and says so out loud when it is
 *    missing instead of quietly falling back to whatever is already here.
 * 2. REFUSES TO GO BACKWARDS. A sync that overwrites v2.1.1 with v2.1.0
 *    because someone re-ran an old build is a content regression that no test
 *    would catch — the page would render perfectly, with last month's numbers.
 *    The version comparison is the whole point of the script.
 * 3. Writes to the repo root, which is where both renders already read from,
 *    so there is one copy of the data in this repo and no opportunity to drift.
 *
 * `card-render.js` is deliberately NOT synced: it is the DESIGN layer's file
 * (the shared card language the guide, the report and the inbox all render
 * through), it is owned here, and the analyzer does not emit it.
 *
 * Run: node scripts/sync-assessment.mjs [--check] [--force] [--from <dir>]
 */

import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';

import { compareVersions } from '../src/guide/assessment/version.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Where `python scripts/build.py … -o out_v2` publishes the deliverable. */
const DEFAULT_SOURCE = resolve(ROOT, '../TA-Analyzer/PSA/out_v2');

/** The deliverable, per the analyzer's ADR-034. Both ship together or neither. */
const DELIVERABLE = ['assessment.data.js', 'assessment-charts.js'];

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const force = args.includes('--force');
const fromIndex = args.indexOf('--from');
const SOURCE = fromIndex >= 0 && args[fromIndex + 1] ? resolve(args[fromIndex + 1]) : DEFAULT_SOURCE;

const log = (msg) => process.stdout.write(`${msg}\n`);

/** Reads `meta.version` out of an assessment.data.js without trusting a regex. */
function versionOf(path) {
  const sandbox = { window: {} };
  sandbox.globalThis = sandbox;
  const context = createContext(sandbox);
  runInContext(readFileSync(path, 'utf8'), context, { filename: path });
  const meta = sandbox.window.ASSESSMENT?.meta;
  if (!meta?.version) {
    throw new Error(`sync-assessment: ${path} does not set window.ASSESSMENT.meta.version.`);
  }
  return { version: meta.version, generator: meta.generator ?? 'unknown', contract: meta.contract ?? '' };
}

// --- locate the source ------------------------------------------------------

if (!existsSync(SOURCE)) {
  throw new Error(
    `sync-assessment: no analyzer output at ${SOURCE}.\n` +
      'Run the analyzer build first (python scripts/build.py <name>_data.json -o PSA/out_v2 ' +
      'inside TA-Analyzer), or pass --from <dir>. Refusing to guess: silently keeping the ' +
      'existing copy is how this repo ended up serving three different versions of the same guide.'
  );
}

for (const file of DELIVERABLE) {
  if (!existsSync(join(SOURCE, file))) {
    throw new Error(
      `sync-assessment: ${SOURCE} is missing "${file}". The deliverable is both files together ` +
        '(ADR-034) — a data refresh without its matching chart renderer can silently drop a ' +
        'chart directive the data relies on.'
    );
  }
}

// --- compare versions -------------------------------------------------------

const incoming = versionOf(join(SOURCE, 'assessment.data.js'));
const currentPath = join(ROOT, 'assessment.data.js');
const current = existsSync(currentPath) ? versionOf(currentPath) : null;

log(`  source   ${SOURCE}`);
log(`  incoming v${incoming.version}  (${incoming.generator})`);
log(`  current  ${current ? `v${current.version}  (${current.generator})` : '— none in repo —'}`);

if (current) {
  const direction = compareVersions(incoming.version, current.version);

  if (direction < 0 && !force) {
    throw new Error(
      `sync-assessment: refusing to downgrade the guide from v${current.version} to ` +
        `v${incoming.version}.\n` +
        'The copy in this repo is NEWER than the analyzer output you are syncing from — which is ' +
        'the actual state of these two repos today. Re-run the analyzer build so its output is ' +
        'current, or pass --force if you genuinely mean to roll the published guide back.'
    );
  }

  if (direction === 0) {
    log(`  result   already at v${incoming.version} — nothing to do.`);
    process.exit(0);
  }

  if (direction < 0) {
    log(`  WARNING  forced downgrade v${current.version} -> v${incoming.version}`);
  }
}

// --- copy -------------------------------------------------------------------

if (checkOnly) {
  log(`  result   --check: would update to v${incoming.version} (no files written).`);
  process.exit(0);
}

for (const file of DELIVERABLE) {
  copyFileSync(join(SOURCE, file), join(ROOT, file));
  log(`  copied   ${file}`);
}

log(`  result   guide data now at v${incoming.version} — "${incoming.contract}".`);
log('');
log('  Next: `npm run build` re-renders every guide page from the new data. The render-contract');
log('  gate (src/guide/assessment/contract.mjs) will fail the build if the new deliverable adds a');
log('  chart, table or placement the templates do not cover.');
