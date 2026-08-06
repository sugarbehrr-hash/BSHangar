/**
 * Configuration for the reader-feedback layer.
 *
 * ── THE VALUES BELOW ARE PUBLIC BY DESIGN ────────────────────────────────────
 * A Firebase web config is not a secret. It ships inside every client bundle of
 * every Firebase web app that has ever existed, and it identifies the project
 * rather than authorizing anything. What actually protects this collection is:
 *
 *   - firestore.rules   — validation and authorization (the real server)
 *   - App Check         — proves the request came from our page, not a script
 *
 * Do not "hide" these in an env var and think something was gained; do harden
 * the two things above. See the threat-model comment at the top of
 * firestore.rules.
 */

/**
 * From Firebase console → Project settings → Your apps.
 *
 * `measurementId` from that snippet is deliberately omitted: it exists only for
 * Google Analytics, which this site does not load. Wiring it up would collect
 * behavioural data on every reader and contradict what /privacy/ tells them.
 */
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDvTu6kE4cYGLCmAJpvRhRm_XTa2qL08nc',
  authDomain: 'bluestreakhangar.firebaseapp.com',
  projectId: 'bluestreakhangar',
  storageBucket: 'bluestreakhangar.firebasestorage.app',
  messagingSenderId: '855469999531',
  appId: '1:855469999531:web:244ed20276332b2ba53eee',
};

/**
 * reCAPTCHA ENTERPRISE site key, registered against this project's App Check
 * config. Enterprise, not v3 — they are different products with different
 * client providers, and net.js must use ReCaptchaEnterpriseProvider to match.
 *
 * Scoped to bluestreakhangar.com and www.bluestreakhangar.com, so it is useless
 * anywhere else. Public like the rest of this file.
 */
export const RECAPTCHA_SITE_KEY = '6LdTrXctAAAAAG-JsAo59pv9omS7HDnoWsFIo5B4';

/** Emulator ports, mirrored from firebase.json. */
export const EMULATOR = { firestoreHost: '127.0.0.1', firestorePort: 8080, authPort: 9099 };

export const COLLECTION = 'feedback';

/** Mirrors the caps in firestore.rules. Enforced here too so the UI can stop a
 *  reader before a write that the rules would only reject after a round trip. */
export const LIMITS = { note: 1000, base: 8, contentVersion: 24 };

export const PRIVACY_URL = '/privacy/';

const PLACEHOLDER = 'REPLACE_ME';

/**
 * True until Phase 0 has been done and the real config pasted in.
 *
 * Callers use this to fail loudly rather than to fail quietly: an unconfigured
 * production build hides the feedback UI entirely, because a control that
 * accepts a note it can never deliver is worse than no control at all.
 */
export function isUnconfigured() {
  return FIREBASE_CONFIG.projectId.includes(PLACEHOLDER) || RECAPTCHA_SITE_KEY.includes(PLACEHOLDER);
}

/** Local dev talks to the emulator, so the whole flow is exercisable offline. */
export function isEmulated() {
  const h = typeof location === 'undefined' ? '' : location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
}

/**
 * Emulator-only stand-in, so the full submit path can be exercised locally
 * before the real project exists.
 *
 * The id must match `singleProjectMode` in firebase.json — the emulator serves
 * exactly one project and rejects writes addressed to any other. The `demo-`
 * prefix is Firebase's own convention for "never talks to production", which
 * makes it impossible for a local run to reach real infrastructure even if the
 * real config were pasted in beside it.
 */
const EMULATOR_CONFIG = {
  apiKey: 'demo-key',
  authDomain: 'demo-bshangar.firebaseapp.com',
  projectId: 'demo-bshangar',
  storageBucket: 'demo-bshangar.firebasestorage.app',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:demo',
};

/**
 * Localhost ALWAYS uses the emulator config, whether or not the real one is
 * filled in.
 *
 * The earlier `isEmulated() && isUnconfigured()` was only correct while the
 * placeholders were still in place. net.js calls connectFirestoreEmulator()
 * whenever isEmulated(), so the moment the real config landed, local dev would
 * have pointed a `bluestreakhangar` client at an emulator running as
 * `demo-bshangar` — a project mismatch against firebase.json's
 * singleProjectMode, and every local write would have failed for a reason that
 * looks nothing like its cause.
 *
 * Keeping the `demo-` project on localhost is also what guarantees a dev run
 * can never reach the real database.
 */
export function effectiveConfig() {
  return isEmulated() ? EMULATOR_CONFIG : FIREBASE_CONFIG;
}

/**
 * Whether an answer can actually be delivered right now. False only in the one
 * case that matters: a production build where Phase 0 was never done. Answers
 * stay in the outbox rather than being attempted and burned through their retry
 * budget against a project that does not exist.
 */
export function canDeliver() {
  return !isUnconfigured() || isEmulated();
}

/**
 * Which published document is being read, derived from the URL rather than
 * hardcoded — so lighting this up on the Field Manual or the Commuting Guide
 * is a routing fact, not a code change.
 *
 *   /contract/2026-ta-vote-guide/            ->  "2026-ta-vote-guide"
 *   /contract/2026-ta-vote-guide/index.html  ->  "2026-ta-vote-guide"
 *   /commuting/                              ->  "commuting"
 *
 * The explicit-index.html form matters: the site is served from GitHub Pages,
 * which resolves both, and a reader who lands on the longer URL must not
 * silently lose the feedback layer. A trailing filename is dropped rather than
 * treated as the slug.
 *
 * Must satisfy the same slug shape firestore.rules enforces on `doc`; anything
 * else returns null and the layer stays dormant.
 */
export function documentIdFromLocation(pathname) {
  const path = pathname ?? (typeof location === 'undefined' ? '' : location.pathname);
  const segments = path.split('/').filter(Boolean);
  if (segments.length && /\.[a-z0-9]+$/i.test(segments[segments.length - 1])) segments.pop();
  const last = segments[segments.length - 1];
  if (!last) return null;
  return /^[a-z0-9][a-z0-9-]{0,63}$/.test(last) ? last : null;
}

/** The content revision a note was written against, so triage can spot drift. */
export function contentVersion() {
  const v = typeof window !== 'undefined' && window.ASSESSMENT?.meta?.version;
  if (typeof v !== 'string') return '';
  // Clamped to the charset firestore.rules enforces, NOT merely truncated.
  //
  // This value is not ours — it is whatever the analyzer put in
  // ASSESSMENT.meta.version, and that file is a regenerated export. Today it is
  // "2.1.1" and passes. A future "2.2.0 rc1" would not, and because this field
  // rides on every single submission, one space in someone else's metadata
  // would fail every write from every reader, feature-wide, with nothing on the
  // page to explain it. Provenance is worth having; it is not worth taking the
  // whole feature down for, so anything unexpected is dropped rather than sent.
  return v.replace(/[^0-9A-Za-z._-]/g, '').slice(0, LIMITS.contentVersion);
}
