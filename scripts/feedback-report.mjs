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

/** Control characters and whitespace runs collapse to a single space. */
const flatten = (value) =>
  String(value ?? '')
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * For a value going inside `backticks`.
 *
 * Markdown gives nothing special meaning inside a code span, so escaping there
 * only produces an unreadable `pay\-retro`. The one character that must go is
 * the backtick itself, which would close the span and let everything after it
 * out into the document.
 */
function mdCode(value, max = 160) {
  return flatten(value).replace(/`/g, "'").slice(0, max);
}

/**
 * Neutralises reader-supplied text for the Markdown report.
 *
 * Every note, base and contentVersion was typed by an anonymous member of the
 * public, and this report is read by a maintainer — often rendered, since it is
 * Markdown. Left raw, a note could forge a heading, open a fenced block that
 * swallowed the rest of the report, insert a link or image that phoned home when
 * previewed, or fabricate a finding attributed to another card. The earlier
 * `replace(/\n+/g, ' ')` looked like a sanitizer but only touched newlines —
 * carriage returns, backticks and raw HTML all went straight through.
 */
/**
 * Default matches the 1000-char cap in firestore.rules and the textarea's own
 * maxlength. An earlier 600 silently cut the longest notes with no marker, so a
 * truncated note was indistinguishable from a reader who stopped typing — and
 * the longest notes are the substantive ones this report exists to surface.
 * Anything that does get cut says so.
 */
function mdText(value, max = 1000) {
  const flat = flatten(value);
  const cut = flat.length > max;
  return (
    flat
      .slice(0, max)
      .replace(/([\\`*_[\]()<>#|~!+-])/g, '\\$1') + (cut ? ' …[truncated]' : '')
  );
}

function groupByBlock(rows) {
  const blocks = new Map();
  for (const row of rows) {
    if (!blocks.has(row.block)) {
      blocks.set(row.block, { block: row.block, clear: 0, unclear: 0, withdrawn: 0, notes: [], times: [] });
    }
    const entry = blocks.get(row.block);
    if (row.verdict === 'clear') entry.clear++;
    else if (row.verdict === 'unclear') entry.unclear++;
    else entry.withdrawn++;

    const created = row.createdAt?.toMillis?.() ?? null;
    if (created !== null) entry.times.push(created);

    // A withdrawn answer's note is withdrawn too — the reader took it back.
    if (row.note && row.verdict !== 'withdrawn') {
      entry.notes.push({ note: row.note, base: row.base, version: row.contentVersion, id: row.id, status: row.status });
    }
  }
  for (const entry of blocks.values()) entry.burst = burstShare(entry.times);
  return [...blocks.values()];
}

/** Responses per card arriving in the tightest 10-minute window, as a share. */
const BURST_WINDOW_MS = 10 * 60 * 1000;

function burstShare(times) {
  if (times.length < MIN_BURST_RESPONSES) return 0;
  const sorted = [...times].sort((a, b) => a - b);
  let best = 0;
  let start = 0;
  for (let end = 0; end < sorted.length; end++) {
    while (sorted[end] - sorted[start] > BURST_WINDOW_MS) start++;
    best = Math.max(best, end - start + 1);
  }
  return best / sorted.length;
}

/**
 * Below this, a tight cluster is just a few crew reading the guide together on
 * the same layover — which is normal and not worth flagging.
 */
const MIN_BURST_RESPONSES = 10;
const BURST_ALERT = 0.6;

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

    // meta.title comes from our own data file; entry.block came off the wire.
    lines.push(`## ${meta?.title ?? mdText(entry.block, 80)}`);
    lines.push(
      `\`${mdCode(entry.block, 80)}\`${meta?.topic ? ` · ${meta.topic}` : ''} — ` +
        `**${entry.clear} clear / ${entry.unclear} unclear** (${pct}% unclear)` +
        (entry.withdrawn ? ` · ${entry.withdrawn} withdrawn` : '')
    );

    // This ranking is the rewrite worklist, and it is a direct function of
    // verdicts submitted by anonymous strangers. Nothing in firestore.rules can
    // stop one person minting uids and stuffing a card — anonymous auth is free
    // by design. What we can do is refuse to present a stuffed tally as if it
    // were a reading of the crew, so a suspiciously tight arrival cluster is
    // stated next to the number it would distort.
    if (entry.burst >= BURST_ALERT) {
      lines.push(
        `> ⚠ ${Math.round(entry.burst * 100)}% of these arrived within ten minutes of each other. ` +
          `Treat the ranking for this card as unverified.`
      );
    }
    lines.push('');

    for (const note of entry.notes) {
      const tags = [
        note.base ? mdText(note.base, 8) : null,
        note.version && note.version !== version ? `v${mdText(note.version, 24)} (stale)` : null,
      ]
        .filter(Boolean)
        .join(' · ');
      lines.push(`- ${mdText(note.note)}${tags ? `  \n  _${tags}_` : ''}`);
      lines.push(`  \`${mdCode(note.id, 160)}\`${note.status === 'triaged' ? ' · triaged' : ''}`);
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
      // Every field here is attacker-chosen: a drift row exists precisely
      // because its block id matched no card we know about.
      const note = row.note ? mdText(row.note) : `_${mdText(row.verdict, 16)}, no note_`;
      lines.push(`- \`${mdCode(row.block, 80)}\` (v${mdText(row.contentVersion, 24) || '?'}) — ${note}`);
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
  // This repo is public and the file just written is verbatim writing by
  // members of the public who were told it stays private.
  if (resolve(args.out).startsWith(`${ROOT}/`)) {
    process.stdout.write(
      'note: that path is inside the repo. feedback-*.md is gitignored, but do not rename it\n' +
        '      into something tracked — the contents are private reader feedback.\n'
    );
  }
} else {
  process.stdout.write(`${report}\n`);
}
