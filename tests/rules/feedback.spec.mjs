/**
 * Contract tests for firestore.rules.
 *
 * firestore.rules is the only server this site has — there is no route handler
 * in front of the database, so every authorization and validation guarantee the
 * feedback feature makes is asserted here or nowhere. Treat a failure in this
 * file as a live security regression, not a broken test.
 *
 * Run: npm run test:rules   (starts the emulator, runs this, tears it down)
 */

import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, getDoc, deleteDoc, getDocs, collection, serverTimestamp } from 'firebase/firestore';

const DOC = '2026-ta-vote-guide';
const BLOCK = 'pay-levelset';
const UID = 'reader-alice';
const OTHER_UID = 'reader-bob';

/** The deterministic key the rules enforce: {doc}__{block}__{uid}. */
const key = (d = DOC, b = BLOCK, u = UID) => `${d}__${b}__${u}`;

/**
 * A complete, valid create payload. Every test starts from this and mutates
 * exactly one thing, so a failure names the field that broke.
 */
const payload = (over = {}) => ({
  doc: DOC,
  block: BLOCK,
  verdict: 'unclear',
  note: '',
  base: '',
  contentVersion: '2.1.1',
  status: 'new',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...over,
});

/** The mutable subset a client sends when amending (merge semantics). */
const amendment = (over = {}) => ({
  verdict: 'clear',
  note: '',
  base: '',
  contentVersion: '2.1.1',
  status: 'new',
  updatedAt: serverTimestamp(),
  ...over,
});

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-bshangar',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

/** Firestore handle for a signed-in anonymous reader. */
const asReader = (uid = UID) => testEnv.authenticatedContext(uid).firestore();
const asStranger = () => testEnv.unauthenticatedContext().firestore();

/**
 * Firestore handle for a maintainer on the allowlist in firestore.rules — what
 * /inbox/ runs as.
 *
 * The uid is deliberately NOT any reader's uid, so every admin assertion here
 * also proves the admin path is reached through isAdmin() and not by
 * accidentally satisfying ownsPath().
 */
const asAdmin = (token = {}) =>
  testEnv
    .authenticatedContext('maintainer-uid', {
      email: 'dimmonk@gmail.com',
      email_verified: true,
      ...token,
    })
    .firestore();

/** Seeds an existing record, bypassing rules, so amend paths have something to hit. */
async function seed(over = {}) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'feedback', key()), {
      ...payload(over),
      createdAt: new Date('2026-08-01T00:00:00Z'),
      updatedAt: new Date('2026-08-01T00:00:00Z'),
    });
  });
}

describe('create', () => {
  it('accepts a well-formed first answer', async () => {
    const db = asReader();
    await assertSucceeds(setDoc(doc(db, 'feedback', key()), payload()));
  });

  it('accepts a block id containing underscores (marketCards use them)', async () => {
    const db = asReader();
    const b = 'peer_benchmark';
    await assertSucceeds(
      setDoc(doc(db, 'feedback', key(DOC, b)), payload({ block: b }))
    );
  });

  it('accepts a note at exactly the 1000-char cap', async () => {
    const db = asReader();
    await assertSucceeds(
      setDoc(doc(db, 'feedback', key()), payload({ note: 'x'.repeat(1000) }))
    );
  });

  it('accepts an optional base', async () => {
    const db = asReader();
    await assertSucceeds(
      setDoc(doc(db, 'feedback', key()), payload({ base: 'CLT' }))
    );
  });

  // --- authorization -------------------------------------------------------

  it('rejects an unauthenticated write', async () => {
    const db = asStranger();
    await assertFails(setDoc(doc(db, 'feedback', key()), payload()));
  });

  it("rejects writing to another user's path", async () => {
    const db = asReader(UID);
    await assertFails(
      setDoc(doc(db, 'feedback', key(DOC, BLOCK, OTHER_UID)), payload())
    );
  });

  it('rejects a payload whose block disagrees with the path', async () => {
    const db = asReader();
    // Path says pay-levelset, body claims pay-retro. Without the ownsPath
    // check this would let one tap poison a different card's tally.
    await assertFails(
      setDoc(doc(db, 'feedback', key()), payload({ block: 'pay-retro' }))
    );
  });

  it('rejects a payload whose doc disagrees with the path', async () => {
    const db = asReader();
    await assertFails(
      setDoc(doc(db, 'feedback', key()), payload({ doc: 'commuting-guide' }))
    );
  });

  // --- shape ---------------------------------------------------------------

  it('rejects an unknown verdict', async () => {
    const db = asReader();
    await assertFails(
      setDoc(doc(db, 'feedback', key()), payload({ verdict: 'excellent' }))
    );
  });

  it('rejects a note over the cap', async () => {
    const db = asReader();
    await assertFails(
      setDoc(doc(db, 'feedback', key()), payload({ note: 'x'.repeat(1001) }))
    );
  });

  it('rejects an over-long base', async () => {
    const db = asReader();
    await assertFails(
      setDoc(doc(db, 'feedback', key()), payload({ base: 'CHARLOTTE' }))
    );
  });

  // A size cap alone let a 4-character base of "\n```" through — enough to open
  // a fenced block in the triage report and hide every card below it.
  it('rejects control characters in base even when it is short', async () => {
    const db = asReader();
    await assertFails(setDoc(doc(db, 'feedback', key()), payload({ base: '\n```' })));
  });

  it('rejects a newline in base', async () => {
    const db = asReader();
    await assertFails(setDoc(doc(db, 'feedback', key()), payload({ base: '\n# X' })));
  });

  it('rejects markdown structure in contentVersion', async () => {
    const db = asReader();
    await assertFails(
      setDoc(doc(db, 'feedback', key()), payload({ contentVersion: '1\n## Vote YES\n' }))
    );
  });

  it('rejects an HTML comment opener in contentVersion', async () => {
    const db = asReader();
    await assertFails(
      setDoc(doc(db, 'feedback', key()), payload({ contentVersion: '1\n<!--' }))
    );
  });

  it('still accepts a normal dotted version', async () => {
    const db = asReader();
    await assertSucceeds(
      setDoc(doc(db, 'feedback', key()), payload({ contentVersion: '2.1.1' }))
    );
  });

  // Readers write sentences; the note keeps its newlines and is escaped at the
  // point it is rendered instead. Asserted so nobody "hardens" it by accident.
  it('accepts a multi-line note, which is what a reader actually writes', async () => {
    const db = asReader();
    await assertSucceeds(
      setDoc(doc(db, 'feedback', key()), payload({ note: 'first line\nsecond line' }))
    );
  });

  it('rejects a non-string note', async () => {
    const db = asReader();
    await assertFails(
      setDoc(doc(db, 'feedback', key()), payload({ note: 42 }))
    );
  });

  it('rejects an extra field', async () => {
    const db = asReader();
    await assertFails(
      setDoc(doc(db, 'feedback', key()), payload({ email: 'me@example.com' }))
    );
  });

  it('rejects a missing field', async () => {
    const db = asReader();
    const { base, ...withoutBase } = payload();
    await assertFails(setDoc(doc(db, 'feedback', key()), withoutBase));
  });

  it('rejects an uppercase doc slug', async () => {
    const db = asReader();
    const d = 'Vote-Guide';
    await assertFails(
      setDoc(doc(db, 'feedback', key(d)), payload({ doc: d }))
    );
  });

  it('rejects an over-long contentVersion', async () => {
    const db = asReader();
    await assertFails(
      setDoc(doc(db, 'feedback', key()), payload({ contentVersion: 'v'.repeat(25) }))
    );
  });

  // --- fields the client does not own --------------------------------------

  it('rejects a client pre-marking its own record as triaged', async () => {
    const db = asReader();
    await assertFails(
      setDoc(doc(db, 'feedback', key()), payload({ status: 'triaged' }))
    );
  });

  it('rejects a client-supplied timestamp instead of server time', async () => {
    const db = asReader();
    await assertFails(
      setDoc(doc(db, 'feedback', key()), payload({ createdAt: new Date('2020-01-01') }))
    );
  });

  it('rejects an updatedAt that is not server time', async () => {
    const db = asReader();
    await assertFails(
      setDoc(doc(db, 'feedback', key()), payload({ updatedAt: new Date('2020-01-01') }))
    );
  });
});

describe('amend', () => {
  it('accepts changing your mind', async () => {
    await seed({ verdict: 'unclear' });
    const db = asReader();
    await assertSucceeds(
      updateDoc(doc(db, 'feedback', key()), amendment({ verdict: 'clear' }))
    );
  });

  it('accepts withdrawing an answer', async () => {
    await seed();
    const db = asReader();
    await assertSucceeds(
      updateDoc(doc(db, 'feedback', key()), amendment({ verdict: 'withdrawn' }))
    );
  });

  it('accepts adding a note to an existing answer', async () => {
    await seed({ verdict: 'clear' });
    const db = asReader();
    await assertSucceeds(
      updateDoc(doc(db, 'feedback', key()), amendment({ note: 'second thought' }))
    );
  });

  it('re-opens a triaged record, by design', async () => {
    // An edited note should come back into the queue: our previous read of it
    // is stale. See the status commentary in firestore.rules.
    await seed({ status: 'triaged' });
    const db = asReader();
    await assertSucceeds(
      updateDoc(doc(db, 'feedback', key()), amendment({ note: 'actually, also this' }))
    );
  });

  it('rejects repointing a record at a different card', async () => {
    await seed();
    const db = asReader();
    await assertFails(
      updateDoc(doc(db, 'feedback', key()), amendment({ block: 'pay-retro' }))
    );
  });

  it('rejects rewriting createdAt', async () => {
    await seed();
    const db = asReader();
    await assertFails(
      updateDoc(doc(db, 'feedback', key()), amendment({ createdAt: serverTimestamp() }))
    );
  });

  it('rejects an amend that skips updatedAt', async () => {
    await seed();
    const db = asReader();
    const { updatedAt, ...stale } = amendment();
    await assertFails(updateDoc(doc(db, 'feedback', key()), stale));
  });

  it("rejects amending someone else's record", async () => {
    await seed();
    const db = asReader(OTHER_UID);
    await assertFails(
      updateDoc(doc(db, 'feedback', key()), amendment())
    );
  });

  it('rejects an over-cap note on amend', async () => {
    await seed();
    const db = asReader();
    await assertFails(
      updateDoc(doc(db, 'feedback', key()), amendment({ note: 'x'.repeat(1001) }))
    );
  });
});

describe('reads are maintainer-only', () => {
  it('denies a reader their own record', async () => {
    // Feedback is a private inbox. The client keeps a local echo of what it
    // sent and never needs the server's copy back.
    await seed();
    const db = asReader();
    await assertFails(getDoc(doc(db, 'feedback', key())));
  });

  it('denies a reader listing the collection', async () => {
    await seed();
    const db = asReader();
    await assertFails(getDocs(collection(db, 'feedback')));
  });

  it('denies an unauthenticated visitor', async () => {
    await seed();
    const db = asStranger();
    await assertFails(getDocs(collection(db, 'feedback')));
  });

  it('allows a maintainer to read one record', async () => {
    await seed();
    await assertSucceeds(getDoc(doc(asAdmin(), 'feedback', key())));
  });

  it('allows a maintainer to list the collection', async () => {
    // This is the query /inbox/ actually runs.
    await seed();
    await assertSucceeds(getDocs(collection(asAdmin(), 'feedback')));
  });

  it('denies a signed-in account that is not on the allowlist', async () => {
    await seed();
    const db = asAdmin({ email: 'someone-else@gmail.com' });
    await assertFails(getDocs(collection(db, 'feedback')));
  });

  it('denies an allowlisted address whose email is unverified', async () => {
    // The whole allowlist is defeated if an unverified claim counts. Google
    // sign-in always verifies, so this can only fire if a second provider is
    // enabled later — which is exactly when nobody will be looking.
    await seed();
    const db = asAdmin({ email_verified: false });
    await assertFails(getDocs(collection(db, 'feedback')));
  });
});

describe('triage', () => {
  it('lets a maintainer mark a response done', async () => {
    await seed();
    await assertSucceeds(updateDoc(doc(asAdmin(), 'feedback', key()), { status: 'triaged' }));
  });

  it('lets a maintainer undo that', async () => {
    // Undo needs no rule of its own — it is the same one-field move, reversed.
    await seed({ status: 'triaged' });
    await assertSucceeds(updateDoc(doc(asAdmin(), 'feedback', key()), { status: 'new' }));
  });

  it('rejects an invented status', async () => {
    await seed();
    await assertFails(updateDoc(doc(asAdmin(), 'feedback', key()), { status: 'spam' }));
  });

  it("rejects a maintainer editing somebody's note", async () => {
    // Triage is not editorial control over what a reader wrote.
    await seed({ note: 'the retro table is wrong' });
    await assertFails(updateDoc(doc(asAdmin(), 'feedback', key()), { note: 'nothing to see' }));
  });

  it('rejects a maintainer changing a verdict', async () => {
    await seed();
    await assertFails(updateDoc(doc(asAdmin(), 'feedback', key()), { verdict: 'clear' }));
  });

  it('rejects a maintainer moving updatedAt', async () => {
    // updatedAt means "when the reader last touched this" and is what the inbox
    // orders by. If triage bumped it, reading the queue would reshuffle it.
    await seed();
    await assertFails(
      updateDoc(doc(asAdmin(), 'feedback', key()), { status: 'triaged', updatedAt: serverTimestamp() })
    );
  });

  it('rejects a status change smuggled in beside another field', async () => {
    await seed();
    await assertFails(
      updateDoc(doc(asAdmin(), 'feedback', key()), { status: 'triaged', base: 'PHL' })
    );
  });

  it('rejects a non-allowlisted account marking anything done', async () => {
    await seed();
    const db = asAdmin({ email: 'someone-else@gmail.com' });
    await assertFails(updateDoc(doc(db, 'feedback', key()), { status: 'triaged' }));
  });

  it('rejects a reader triaging their own record', async () => {
    // The reader amend path pins status to 'new' and requires updatedAt to move
    // to server time, so a status-only write fails both ways. Worth asserting:
    // self-triage would let anyone quietly clear their own note out of the queue.
    await seed();
    await assertFails(updateDoc(doc(asReader(), 'feedback', key()), { status: 'triaged' }));
  });
});

describe('deletes are closed to everyone', () => {
  it('denies a reader deleting their own record', async () => {
    await seed();
    const db = asReader();
    await assertFails(deleteDoc(doc(db, 'feedback', key())));
  });

  it('denies a maintainer deleting a record', async () => {
    // Deliberate. A retraction is already a state (verdict: 'withdrawn'), which
    // keeps "never answered" distinguishable from "thought better of it", and an
    // abusive note is handled by marking it done rather than by leaving a hole.
    await seed();
    await assertFails(deleteDoc(doc(asAdmin(), 'feedback', key())));
  });

  it('denies reaching any other collection', async () => {
    const db = asReader();
    await assertFails(setDoc(doc(db, 'anything', 'x'), { a: 1 }));
  });

  it('denies a maintainer reaching any other collection', async () => {
    await assertFails(setDoc(doc(asAdmin(), 'anything', 'x'), { a: 1 }));
  });
});
