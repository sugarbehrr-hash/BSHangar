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

describe('read and delete are closed', () => {
  it('denies reading your own record', async () => {
    await seed();
    const db = asReader();
    await assertFails(getDoc(doc(db, 'feedback', key())));
  });

  it('denies listing the collection', async () => {
    await seed();
    const db = asReader();
    await assertFails(getDocs(collection(db, 'feedback')));
  });

  it('denies deleting your own record', async () => {
    await seed();
    const db = asReader();
    await assertFails(deleteDoc(doc(db, 'feedback', key())));
  });

  it('denies reaching any other collection', async () => {
    const db = asReader();
    await assertFails(setDoc(doc(db, 'anything', 'x'), { a: 1 }));
  });
});
