/**
 * The Firebase half of the feedback layer — and the ONLY file that imports it.
 *
 * This is built as a separate chunk (see scripts/build-guide-feedback.mjs) and
 * pulled in with a dynamic import the first time a reader actually answers
 * something. That split is the whole point: the guide is read on airport wifi
 * between legs, and ~70KB of SDK has no business being on the critical path of
 * a page whose job is answering one question fast. Page load pays ~8KB; the
 * SDK arrives only for the minority who tap.
 *
 * Firestore *lite* is deliberate: this layer only ever writes. It never
 * subscribes, never reads back (rules deny reads outright), and never needs the
 * offline persistence layer — we run our own outbox in state.js, which works
 * across reloads where Firestore's in-memory queue would not.
 */

import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth, signInAnonymously, connectAuthEmulator } from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore/lite';

import { effectiveConfig, RECAPTCHA_SITE_KEY, EMULATOR, COLLECTION, isEmulated } from './config.js';

let ready = null;

/**
 * Boots Firebase once and signs the reader in anonymously.
 *
 * Anonymous auth is not an access control — a script can mint uids all day. It
 * exists to give each reader a stable identity so the deterministic document
 * key can enforce one answer per card. App Check is what actually costs an
 * abuser something; see the threat model in firestore.rules.
 */
function connect() {
  if (ready) return ready;

  ready = (async () => {
    const app = initializeApp(effectiveConfig());

    // App Check cannot run against the emulator without a debug token, and a
    // local dev loop should not depend on reCAPTCHA being reachable.
    if (!isEmulated()) {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });
    }

    const auth = getAuth(app);
    const db = getFirestore(app);

    if (isEmulated()) {
      connectAuthEmulator(auth, `http://${EMULATOR.firestoreHost}:${EMULATOR.authPort}`, {
        disableWarnings: true,
      });
      connectFirestoreEmulator(db, EMULATOR.firestoreHost, EMULATOR.firestorePort);
    }

    const credential = await signInAnonymously(auth);
    return { db, uid: credential.user.uid };
  })();

  // A failed boot must not poison every later attempt — the next tap retries.
  ready.catch(() => {
    ready = null;
  });

  return ready;
}

/**
 * Writes one answer.
 *
 * Create and amend take deliberately different shapes, because the rules freeze
 * `createdAt` and the client is not allowed to read the record back to discover
 * which case it is in:
 *
 *   create — the full payload, including createdAt.
 *   amend  — the mutable fields only. Firestore's merge semantics mean
 *            createdAt survives untouched, which is exactly what the rule
 *            `createdAt == resource.data.createdAt` requires.
 *
 * `everSynced` tells us which to try first, so the common path is one round
 * trip. It is only a hint: if it is wrong (site data cleared while the auth
 * token survived in IndexedDB, say) the other shape is attempted before we call
 * it a failure. That fallback is what makes this correct without a read.
 */
export async function write(answer) {
  const { db, uid } = await connect();
  const ref = doc(db, COLLECTION, `${answer.doc}__${answer.block}__${uid}`);

  const attempts = answer.everSynced ? ['amend', 'create'] : ['create', 'amend'];

  let lastError = null;
  for (const shape of attempts) {
    try {
      if (shape === 'create') {
        await setDoc(ref, {
          doc: answer.doc,
          block: answer.block,
          verdict: answer.verdict,
          note: answer.note,
          base: answer.base,
          contentVersion: answer.contentVersion,
          status: 'new',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(ref, {
          verdict: answer.verdict,
          note: answer.note,
          base: answer.base,
          contentVersion: answer.contentVersion,
          status: 'new',
          updatedAt: serverTimestamp(),
        });
      }
      return;
    } catch (error) {
      lastError = error;
      // Only a rules/existence mismatch is worth retrying with the other
      // shape. A network failure would fail identically either way, and
      // retrying it here just doubles the wait before we can queue it.
      if (!isShapeMismatch(error)) throw error;
    }
  }

  throw lastError;
}

/**
 * Both "the document was not there" and "the document was already there" reach
 * the client as permission-denied, because the rules evaluate `resource` before
 * anything else can distinguish them. So does a genuine rejection — which is
 * why write() tries the other shape rather than assuming, and why store.js
 * treats an exhausted permission-denied as terminal.
 */
function isShapeMismatch(error) {
  return error?.code === 'permission-denied' || error?.code === 'not-found';
}

/**
 * Only these mean "this will never work in this session". Everything else is
 * retried indefinitely.
 *
 * The allowlist is deliberately inverted — terminal codes are enumerated, and
 * anything unrecognised is treated as temporary. An earlier version listed the
 * retryable codes instead, and a server that was simply unreachable produced an
 * error with no `code` at all, fell through as terminal, and burned the note's
 * whole retry budget. Given the choice between retrying something hopeless and
 * discarding something a reader took the trouble to write, retrying is the only
 * defensible default; retryable failures never exhaust, so nothing is lost by
 * being wrong in this direction.
 *
 * `permission-denied` stays here because it is how a genuine rules rejection
 * arrives — but note it is ALSO how a blocked or unreachable reCAPTCHA arrives,
 * since the SDK sends a placeholder App Check token and lets the backend refuse
 * it. Those two are indistinguishable from the client, and the second is
 * temporary: a content blocker, a VPN, or a corporate proxy. So "terminal" is
 * scoped to the session rather than to the record — store.js revives a
 * given-up answer on the next page load (new token, fresh sign-in) and whenever
 * the reader taps "Try again". Nothing a reader wrote is thrown away on a
 * condition that clears itself.
 */
const TERMINAL = ['permission-denied', 'invalid-argument'];

export function isRetryable(error) {
  return !TERMINAL.includes(error?.code);
}

/** A short, greppable description for the outbox record. */
export function describe(error) {
  return error?.code ?? error?.name ?? error?.message ?? 'unknown';
}
