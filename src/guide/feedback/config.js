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

/** Replace with the config from Firebase console → Project settings → Your apps. */
export const FIREBASE_CONFIG = {
  apiKey: 'REPLACE_ME',
  authDomain: 'REPLACE_ME.firebaseapp.com',
  projectId: 'REPLACE_ME',
  storageBucket: 'REPLACE_ME.firebasestorage.app',
  messagingSenderId: 'REPLACE_ME',
  appId: 'REPLACE_ME',
};

/** Firebase console → App Check → your web app → reCAPTCHA v3. */
export const RECAPTCHA_SITE_KEY = 'REPLACE_ME';

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

export function effectiveConfig() {
  return isEmulated() && isUnconfigured() ? EMULATOR_CONFIG : FIREBASE_CONFIG;
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
  return typeof v === 'string' ? v.slice(0, LIMITS.contentVersion) : '';
}
