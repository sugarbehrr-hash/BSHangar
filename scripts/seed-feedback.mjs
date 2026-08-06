/**
 * Fills the Firestore EMULATOR with realistic feedback so /inbox/ can be worked
 * on without waiting for real readers.
 *
 * The point is the awkward states, not the volume. A card whose responses all
 * landed in one ten-minute burst, a note written against a revision that has
 * since been regenerated, a response about a card that no longer exists, an
 * answer somebody withdrew, one already marked done — every one of those has a
 * branch in the inbox that is otherwise only exercised in production, months
 * from now, by whoever is least equipped to debug it.
 *
 * Writes over the emulator's REST API rather than through a client SDK, so it
 * needs no credentials, no dependency, and no rules exemption: the emulator
 * accepts `Bearer owner` as full admin. That is also why this can only ever
 * touch the emulator — the token is meaningless anywhere else, and the project
 * id is the `demo-` one Firebase reserves for never-talks-to-production.
 *
 *   npm run seed        (start the emulator first: npm run emulators)
 */

const PROJECT = 'demo-bshangar';
const HOST = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
const BASE = `http://${HOST}/v1/projects/${PROJECT}/databases/(default)/documents/feedback`;

const DOC = '2026-ta-vote-guide';
const VERSION = '2.1.1';
const MINUTE = 60_000;

/** Fixed origin so runs are reproducible and burst windows are exact. */
const T0 = Date.parse('2026-08-04T14:00:00Z');

/**
 * @typedef {{block: string, verdict: 'clear'|'unclear'|'withdrawn', note?: string,
 *            base?: string, version?: string, status?: 'new'|'triaged', at?: number}} Fixture
 */

/** @type {Fixture[]} */
const FIXTURES = [
  // A card that genuinely lost most of its readers, with substantive notes.
  // This should rank first.
  {
    block: 'pay-progression',
    verdict: 'unclear',
    at: 0,
    base: 'CLT',
    note: "I've read this four times and I still can't tell if I'm better off. I'm a year 8 — the table shows the new rates but not what I'd have made on the old ladder, so there's nothing to compare against.",
  },
  {
    block: 'pay-progression',
    verdict: 'unclear',
    at: 40 * MINUTE,
    base: 'PHL',
    note: 'The word "flatter" is doing a lot of work here. Flatter than what? Say the actual number.',
  },
  {
    block: 'pay-progression',
    verdict: 'unclear',
    at: 3 * 60 * MINUTE,
    note: 'Locked in permanently is buried at the end. That should be the headline.',
  },
  {
    block: 'pay-progression',
    verdict: 'unclear',
    at: 9 * 60 * MINUTE,
    base: 'DCA',
    // Written against an older revision — should be flagged as such.
    version: '2.0.3',
    note: 'This contradicts what the union summary says about step increases.',
  },
  { block: 'pay-progression', verdict: 'clear', at: 5 * 60 * MINUTE },
  { block: 'pay-progression', verdict: 'clear', at: 26 * 60 * MINUTE },

  // Middling: half found it unclear, and one note is already handled — so the
  // done/undo state is visible on first load.
  {
    block: 'pay-retro',
    verdict: 'unclear',
    at: 2 * 60 * MINUTE,
    base: 'CLT',
    status: 'triaged',
    note: 'Is the retro taxed as a bonus? Everyone in the crew room is arguing about this.',
  },
  {
    block: 'pay-retro',
    verdict: 'unclear',
    at: 12 * 60 * MINUTE,
    note: "Doesn't say when it actually hits our checks.",
  },
  { block: 'pay-retro', verdict: 'clear', at: 4 * 60 * MINUTE },
  { block: 'pay-retro', verdict: 'clear', at: 30 * 60 * MINUTE },

  // A withdrawn answer WITH a note. The note must not appear anywhere.
  {
    block: 'pay-retro',
    verdict: 'withdrawn',
    at: 33 * 60 * MINUTE,
    note: 'IF YOU CAN READ THIS THE WITHDRAWN FILTER IS BROKEN',
  },

  // A card everybody understood. Should sink to the bottom, not disappear.
  { block: 'pay-boarding', verdict: 'clear', at: 6 * 60 * MINUTE },
  { block: 'pay-boarding', verdict: 'clear', at: 7 * 60 * MINUTE },
  { block: 'pay-boarding', verdict: 'clear', at: 20 * 60 * MINUTE },

  // A note with no verdict problem — someone tapped "clear" and wrote anyway.
  {
    block: 'pay-minday',
    verdict: 'clear',
    at: 8 * 60 * MINUTE,
    base: 'PHX',
    note: 'Clear, but it would help to show this next to the current minimum day.',
  },
];

// A stuffed card: twelve responses inside eight minutes, from twelve uids. The
// inbox must refuse to present this ranking as a reading of the crew.
for (let i = 0; i < 12; i++) {
  FIXTURES.push({
    block: 'pay-deadhead',
    verdict: i < 10 ? 'unclear' : 'clear',
    at: 15 * 60 * MINUTE + i * 40_000,
    note: i === 0 ? 'this is wrong' : '',
  });
}

// Feedback about a card the analyzer has since regenerated away.
FIXTURES.push({
  block: 'pay-obsolete-card',
  verdict: 'unclear',
  at: 60 * MINUTE,
  version: '1.9.0',
  note: 'The example in here uses 2024 rates.',
});

/** Firestore REST wants every value tagged with its type. */
function encode(fixture, index) {
  const at = new Date(T0 + (fixture.at ?? 0)).toISOString();
  return {
    fields: {
      doc: { stringValue: DOC },
      block: { stringValue: fixture.block },
      verdict: { stringValue: fixture.verdict },
      note: { stringValue: fixture.note ?? '' },
      base: { stringValue: fixture.base ?? '' },
      contentVersion: { stringValue: fixture.version ?? VERSION },
      status: { stringValue: fixture.status ?? 'new' },
      createdAt: { timestampValue: at },
      // Same as createdAt: these are first answers, not amendments.
      updatedAt: { timestampValue: at },
    },
    // One uid per fixture, so the deterministic key never collides and the
    // burst card genuinely looks like twelve separate people.
    _id: `${DOC}__${fixture.block}__seed-${String(index).padStart(3, '0')}`,
  };
}

async function main() {
  const probe = await fetch(`http://${HOST}/`).catch(() => null);
  if (!probe) {
    process.stderr.write(
      `seed-feedback: no Firestore emulator at ${HOST}.\n` + '  Start one with: npm run emulators\n'
    );
    process.exit(1);
  }

  let written = 0;
  for (const [index, fixture] of FIXTURES.entries()) {
    const { _id, ...body } = encode(fixture, index);
    const response = await fetch(`${BASE}?documentId=${encodeURIComponent(_id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // Already-exists is the normal case on a re-run and not worth stopping for.
      if (response.status !== 409) {
        process.stderr.write(`seed-feedback: ${_id} → ${response.status} ${await response.text()}\n`);
      }
      continue;
    }
    written++;
  }

  process.stdout.write(
    `seed-feedback: ${written} of ${FIXTURES.length} written to the emulator (rest already there)\n` +
      '  Open http://localhost:4321/inbox/ and sign in with any email.\n'
  );
}

await main();
