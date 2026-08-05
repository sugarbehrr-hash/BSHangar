/**
 * Reads the reader-feedback inbox and prints a worklist.
 *
 * This is the other half of the feature. Collecting feedback nobody reads is
 * just a more elaborate way of ignoring people, so the output is deliberately
 * shaped as "which cards should I rewrite, in what order" rather than as a
 * chronological dump.
 *
 * Cards are ranked by the share of readers who said the card was NOT clear,
 * because that is the signal you cannot get any other way — a card everyone
 * understood needs nothing from you, however many notes it collected.
 *
 * LOCAL TOOL, NEVER DEPLOYED. It authenticates with a service-account key and
 * therefore bypasses firestore.rules entirely, which is exactly why the key
 * lives outside the repo and this file is not part of any build.
 *
 *   npm run feedback:report -- --since 7d
 *   npm run feedback:report -- --unread --out feedback-2026-08-05.md
 *   npm run feedback:report -- --resolve 2026-ta-vote-guide__pay-levelset__abc
 *   npm run feedback:report -- --resolve-all --doc 2026-ta-vote-guide
 *
 * Credentials, in order of preference:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080   -> local emulator, no key needed
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/key.json
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_DOC = '2026-ta-vote-guide';

// --------------------------------------------------------------------- args

function parseArgs(argv) {
  const args = { doc: DEFAULT_DOC, since: null, unread: false, out: null, resolve: null, resolveAll: false };

  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = () => {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) fail(`${flag} needs a value`);
      return v;
    };

    switch (flag) {
      case '--doc': args.doc = value(); break;
      case '--since': args.since = parseSince(value()); break;
      case '--unread': args.unread = true; break;
      case '--out': args.out = value(); break;
      case '--resolve': args.resolve = value(); break;
      case '--resolve-all': args.resolveAll = true; break;
      case '--help': case '-h': usage(); process.exit(0); break;
      default: fail(`unknown option "${flag}" — try --help`);
    }
  }
  return args;
}

/** "7d", "36h", "90m" -> a Date. Anything else is a mistake worth stopping for. */
function parseSince(text) {
  const match = /^(\d+)([dhm])$/.exec(text.trim());
  if (!match) fail(`--since expects something like 7d, 36h or 90m (got "${text}")`);
  const scale = { d: 86400e3, h: 3600e3, m: 60e3 }[match[2]];
  return new Date(Date.now() - Number(match[1]) * scale);
}

function fail(message) {
  process.stderr.write(`feedback-report: ${message}\n`);
  process.exit(1);
}

function usage() {
  process.stdout.write(
    'Usage: node scripts/feedback-report.mjs [options]\n\n' +
      '  --doc <id>        document to report on (default: ' + DEFAULT_DOC + ')\n' +
      '  --since <7d|36h>  only responses updated within this window\n' +
      '  --unread          only responses not yet marked triaged\n' +
      '  --out <file>      write markdown to a file instead of stdout\n' +
      '  --resolve <id>    mark one response triaged\n' +
      '  --resolve-all     mark every response in the current selection triaged\n'
  );
}

// ------------------------------------------------------------------ firebase

function connect() {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    // Without these the Admin SDK tries to mint a real access token, probes
    // the GCE metadata server that is not there, and prints a
    // MetadataLookupWarning before falling back. google-auth-library reads
    // METADATA_SERVER_DETECTION; the auth-emulator host stops the token mint.
    process.env.METADATA_SERVER_DETECTION ??= 'none';
    process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
    initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? 'demo-bshangar' });
    return getFirestore();
  }

  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyPath) {
    fail(
      'no credentials. Either set GOOGLE_APPLICATION_CREDENTIALS to a service-account key,\n' +
        '  or set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 to read the local emulator.'
    );
  }
  if (!existsSync(keyPath)) fail(`service-account key not found at ${keyPath}`);

  initializeApp({ credential: cert(JSON.parse(readFileSync(keyPath, 'utf8'))) });
  return getFirestore();
}

// ------------------------------------------------------------- current cards

/**
 * The cards that exist in the guide TODAY, with their titles.
 *
 * Feedback keyed to a block that is no longer here is not dropped — it is
 * called out separately as content drift, because a note written against text
 * the analyzer has since regenerated may be answering a question that no longer
 * exists, and silently folding it into a live card's tally would be a lie.
 */
function currentBlocks() {
  const path = join(ROOT, 'assessment.data.js');
  if (!existsSync(path)) return { titles: new Map(), askable: 0, version: null };

  const sandbox = {};
  // The data file is a plain `window.ASSESSMENT = {...}` assignment.
  new Function('window', readFileSync(path, 'utf8'))(sandbox);

  const titles = new Map();
  let askable = 0;

  for (const topic of sandbox.ASSESSMENT?.topics ?? []) {
    for (const change of topic.changes ?? []) {
      if (!change.id) continue;
      titles.set(change.id, { title: change.title ?? change.id, topic: topic.title ?? '' });
      askable++;
    }
  }

  // marketCards resolve titles but do NOT count toward coverage: card-render.js
  // can render them, but this guide does not — it emits 46 change cards and no
  // market cards, so counting all 57 would report a coverage gap that no reader
  // is able to close.
  for (const card of sandbox.ASSESSMENT?.marketCards ?? []) {
    if (card.id) titles.set(card.id, { title: card.title ?? card.id, topic: 'Market reality' });
  }

  return { titles, askable, version: sandbox.ASSESSMENT?.meta?.version ?? null };
}

// ---------------------------------------------------------------- reporting

function groupByBlock(rows) {
  const blocks = new Map();
  for (const row of rows) {
    if (!blocks.has(row.block)) {
      blocks.set(row.block, { block: row.block, clear: 0, unclear: 0, withdrawn: 0, notes: [] });
    }
    const entry = blocks.get(row.block);
    if (row.verdict === 'clear') entry.clear++;
    else if (row.verdict === 'unclear') entry.unclear++;
    else entry.withdrawn++;

    // A withdrawn answer's note is withdrawn too — the reader took it back.
    if (row.note && row.verdict !== 'withdrawn') {
      entry.notes.push({ note: row.note, base: row.base, version: row.contentVersion, id: row.id, status: row.status });
    }
  }
  return [...blocks.values()];
}

/**
 * Ranks by unclear share, with the raw count breaking ties, so one grumpy
 * response on a card nobody else read cannot outrank a card that genuinely
 * lost half its readers.
 */
function rank(entries) {
  return entries.sort((a, b) => {
    const rateA = share(a);
    const rateB = share(b);
    if (rateB !== rateA) return rateB - rateA;
    return b.unclear - a.unclear;
  });
}

function share(entry) {
  const answered = entry.clear + entry.unclear;
  return answered === 0 ? 0 : entry.unclear / answered;
}

function render(entries, { doc, titles, askable, version, drift, total, since, unread }) {
  const lines = [];
  const cardsTouched = entries.length;
  const noteCount = entries.reduce((n, e) => n + e.notes.length, 0);

  lines.push(`# Reader feedback — ${doc}`);
  lines.push('');
  const scope = [
    `${total} response${total === 1 ? '' : 's'}`,
    `${cardsTouched} of ${askable} cards`,
    `${noteCount} note${noteCount === 1 ? '' : 's'}`,
  ];
  if (since) scope.push(`since ${since.toISOString().slice(0, 16).replace('T', ' ')}`);
  if (unread) scope.push('untriaged only');
  lines.push(scope.join(' · '));
  lines.push('');

  if (entries.length === 0) {
    lines.push('_Nothing in this window._');
    lines.push('');
  } else {
    lines.push('Ordered by the share of readers who said the card was not clear — this is the rewrite worklist.');
    lines.push('');
  }

  for (const entry of entries) {
    const meta = titles.get(entry.block);
    const answered = entry.clear + entry.unclear;
    const pct = answered ? Math.round(share(entry) * 100) : 0;

    lines.push(`## ${meta?.title ?? entry.block}`);
    lines.push(
      `\`${entry.block}\`${meta?.topic ? ` · ${meta.topic}` : ''} — ` +
        `**${entry.clear} clear / ${entry.unclear} unclear** (${pct}% unclear)` +
        (entry.withdrawn ? ` · ${entry.withdrawn} withdrawn` : '')
    );
    lines.push('');

    for (const note of entry.notes) {
      const tags = [note.base || null, note.version && note.version !== version ? `v${note.version} (stale)` : null]
        .filter(Boolean)
        .join(' · ');
      lines.push(`- ${note.note.replace(/\n+/g, ' ').trim()}${tags ? `  \n  _${tags}_` : ''}`);
      lines.push(`  \`${note.id}\`${note.status === 'triaged' ? ' · triaged' : ''}`);
    }
    if (entry.notes.length) lines.push('');
  }

  if (drift.length) {
    lines.push('---');
    lines.push('');
    lines.push(`## Content drift — ${drift.length} response${drift.length === 1 ? '' : 's'}`);
    lines.push('');
    lines.push('These reference cards that are no longer in `assessment.data.js`. The text they were');
    lines.push('written about has been regenerated, so read them against the old revision, not the new one.');
    lines.push('');
    for (const row of drift) {
      lines.push(`- \`${row.block}\` (v${row.contentVersion || '?'}) — ${row.note || `_${row.verdict}, no note_`}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// --------------------------------------------------------------------- main

const args = parseArgs(process.argv.slice(2));
const db = connect();

if (args.resolve) {
  const ref = db.collection('feedback').doc(args.resolve);
  const snap = await ref.get();
  if (!snap.exists) fail(`no response with id "${args.resolve}"`);
  await ref.update({ status: 'triaged' });
  process.stdout.write(`marked triaged: ${args.resolve}\n`);
  process.exit(0);
}

let query = db.collection('feedback').where('doc', '==', args.doc);
if (args.unread) query = query.where('status', '==', 'new');
if (args.since) query = query.where('updatedAt', '>=', args.since);

const snapshot = await query.get();
const rows = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

if (args.resolveAll) {
  if (rows.length === 0) fail('nothing in the current selection to resolve');
  // Firestore caps a batch at 500 writes.
  for (let i = 0; i < rows.length; i += 500) {
    const batch = db.batch();
    for (const row of rows.slice(i, i + 500)) {
      batch.update(db.collection('feedback').doc(row.id), { status: 'triaged' });
    }
    await batch.commit();
  }
  process.stdout.write(`marked ${rows.length} response${rows.length === 1 ? '' : 's'} triaged\n`);
  process.exit(0);
}

const { titles, askable, version } = currentBlocks();
const live = rows.filter((r) => titles.has(r.block));
const drift = rows.filter((r) => !titles.has(r.block));

const report = render(rank(groupByBlock(live)), {
  doc: args.doc,
  titles,
  askable,
  version,
  drift,
  total: rows.length,
  since: args.since,
  unread: args.unread,
});

if (args.out) {
  writeFileSync(args.out, `${report}\n`);
  process.stdout.write(`wrote ${args.out}\n`);
} else {
  process.stdout.write(`${report}\n`);
}
