/**
 * The Firebase half of the maintainer inbox.
 *
 * Mirrors src/guide/feedback/net.js, with the opposite job: that file only ever
 * writes and never reads, this one reads and moves exactly one field. Both talk
 * to the same project through the same config module, which is why the project
 * id and site key live in one place rather than two.
 *
 * No lazy-loading dance here. The guide defers the SDK because it is read on
 * airport wifi by people looking up one fact under time pressure; this page is
 * opened deliberately, by two people, to do one thing.
 *
 * Firestore *lite* is deliberate, same as the guide: the inbox queries once per
 * view and never subscribes. Realtime updates would be worse, not better —
 * rows shifting under Cole's thumb mid-triage is not a feature.
 */

import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import {
  GoogleAuthProvider,
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore/lite';

import { COLLECTION, EMULATOR, RECAPTCHA_SITE_KEY, effectiveConfig, isEmulated } from '../guide/feedback/config.js';

let handles = null;

function connect() {
  if (handles) return handles;

  const app = initializeApp(effectiveConfig());

  // Same reasoning as the guide: App Check cannot run against the emulator
  // without a debug token, and local dev should not depend on reCAPTCHA being
  // reachable. Enterprise provider to match the Enterprise key — pairing it
  // with ReCaptchaV3Provider fails at token exchange and surfaces as a generic
  // permission-denied, which is indistinguishable from a rules rejection.
  if (!isEmulated()) {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY),
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

  handles = { auth, db };
  return handles;
}

/** Fires immediately with the current user (or null), then on every change. */
export function watchAuth(onChange) {
  const { auth } = connect();
  return onAuthStateChanged(auth, onChange);
}

/**
 * Popup, not redirect.
 *
 * The auth domain (bluestreakhangar.firebaseapp.com) is cross-site from
 * bluestreakhangar.com, and redirect flows break under Safari and Chrome
 * third-party storage partitioning unless the auth handler is self-hosted on
 * our own domain. Popup, opened from a real tap, is the path that works on a
 * phone — which is where this page is actually going to be used.
 */
export async function signIn() {
  const { auth } = connect();
  const provider = new GoogleAuthProvider();
  // Always show the chooser. Without this, a maintainer signed into several
  // Google accounts gets silently reconnected to whichever one Google prefers,
  // which is exactly how you end up staring at the not-on-the-list screen.
  provider.setCustomParameters({ prompt: 'select_account' });
  await signInWithPopup(auth, provider);
}

export async function signOutNow() {
  const { auth } = connect();
  await signOut(auth);
}

/**
 * Every response for one document, newest reader activity first.
 *
 * Always the full set — "Needs attention" vs "Everything" is a client-side
 * split on the grouped, per-card result (see report.js's outstanding cards),
 * not a per-row status filter: a card with a 4-of-6 unclear split and zero
 * notes still needs attention even though no individual row has status
 * 'new' pending. A server-side status filter can't express that; one fetch
 * per view, refiltered locally on every click, can. Covered by the
 * `doc, updatedAt` composite index in firestore.indexes.json.
 */
export async function fetchResponses(documentId) {
  const { db } = connect();
  const snapshot = await getDocs(
    query(collection(db, COLLECTION), where('doc', '==', documentId), orderBy('updatedAt', 'desc'))
  );
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * The only write this page can make. The rules allow exactly this field and
 * exactly these two values, so Undo is this same call in the other direction.
 */
export async function setStatus(id, status) {
  const { db } = connect();
  await updateDoc(doc(db, COLLECTION, id), { status });
}

/**
 * Why a read failed, in words a maintainer can act on.
 *
 * permission-denied is the interesting one and it is ambiguous: it is how the
 * allowlist rejects an account, and it is ALSO how a blocked reCAPTCHA arrives,
 * since the SDK sends a placeholder App Check token and lets the backend refuse
 * it. The caller has the signed-in address and can tell those apart; everything
 * else gets named plainly rather than dressed up.
 */
export function describe(error) {
  const code = error?.code ?? '';
  if (code === 'unavailable' || code === 'failed-precondition') {
    return "Couldn't reach the database. Check your connection and try again.";
  }
  if (code === 'auth/popup-blocked') {
    return 'Your browser blocked the sign-in window. Allow popups for this site and try again.';
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return '';
  }
  return error?.message ?? 'Something went wrong.';
}
