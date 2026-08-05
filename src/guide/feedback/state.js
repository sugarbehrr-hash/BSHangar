/**
 * The device's own record of what it has answered.
 *
 * SINGLE SOURCE OF TRUTH, LOCALLY
 * There is exactly one map here, keyed "doc::block". Each entry carries its own
 * delivery state (`synced`, `attempts`, `error`), so the "outbox" of unsent
 * answers is DERIVED from that map (see `pending`) rather than kept as a second
 * array beside it. A parallel queue would be the classic dual-write: two places
 * describing the same submission, drifting the moment a flush half-succeeds.
 *
 * This is a UI cache, not a second copy of the data we depend on. Firestore
 * holds the record; this holds "what should the strip on this card look like
 * right now", which the client cannot ask the server for — reads are closed
 * (see firestore.rules). The two cannot meaningfully drift, because clearing
 * site data resets the anonymous uid and this map together: a wiped browser is
 * a new reader on both sides.
 *
 * Every function returns a new object. Nothing here mutates in place.
 */

const KEY = 'bsh-feedback-v1';

/** Delivery states an answer can be in. */
export const SYNCED = 'synced';
export const PENDING = 'pending';
export const FAILED = 'failed';

/** Give up after this many rejected attempts and tell the reader plainly. */
export const MAX_ATTEMPTS = 3;

const EMPTY = { base: '', answers: {} };

export const answerKey = (doc, block) => `${doc}::${block}`;

/**
 * Reads the map. A corrupt or partially-written value resolves to the empty
 * state rather than throwing — a bad localStorage entry must not take the
 * whole guide down with it.
 */
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || typeof parsed.answers !== 'object') return EMPTY;
    return { base: typeof parsed.base === 'string' ? parsed.base : '', answers: parsed.answers ?? {} };
  } catch {
    return EMPTY;
  }
}

/**
 * Persists the map. Storage can be unavailable (private mode, quota, a locked
 * down browser); that costs us the local echo but must not break submission,
 * so the failure is reported to the caller instead of thrown or swallowed.
 */
export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function getAnswer(state, doc, block) {
  return state.answers[answerKey(doc, block)] ?? null;
}

/**
 * Records an answer optimistically, as pending delivery.
 *
 * `everSynced` is sticky: once a record has reached Firestore we remember that
 * forever, because it decides whether the next write is a create or an amend
 * (see store.js — the two take different shapes, and guessing wrong costs a
 * round trip).
 */
export function putAnswer(state, doc, block, { verdict, note, base, contentVersion }) {
  const k = answerKey(doc, block);
  const prior = state.answers[k];
  return {
    ...state,
    base: base || state.base,
    answers: {
      ...state.answers,
      [k]: {
        doc,
        block,
        verdict,
        note,
        base,
        contentVersion,
        status: PENDING,
        attempts: 0,
        error: null,
        everSynced: prior?.everSynced === true,
        updatedAt: nowIso(),
      },
    },
  };
}

export function markSynced(state, doc, block) {
  return patchAnswer(state, doc, block, (a) => ({
    ...a,
    status: SYNCED,
    attempts: 0,
    error: null,
    everSynced: true,
  }));
}

/**
 * Records a failed delivery. Retryable failures (offline, transient) keep the
 * answer PENDING so the next flush picks it up; a rejection that survives
 * MAX_ATTEMPTS becomes FAILED, which is the one state the reader is told about.
 */
export function markAttemptFailed(state, doc, block, { retryable, message }) {
  return patchAnswer(state, doc, block, (a) => {
    const attempts = a.attempts + 1;
    const exhausted = !retryable && attempts >= MAX_ATTEMPTS;
    return {
      ...a,
      attempts,
      error: message ?? null,
      status: exhausted ? FAILED : PENDING,
    };
  });
}

/** The outbox, derived — never stored. */
export function pending(state) {
  return Object.values(state.answers).filter((a) => a.status === PENDING);
}

export function rememberBase(state, base) {
  return { ...state, base };
}

function patchAnswer(state, doc, block, fn) {
  const k = answerKey(doc, block);
  const current = state.answers[k];
  if (!current) return state;
  return { ...state, answers: { ...state.answers, [k]: fn(current) } };
}

function nowIso() {
  return new Date().toISOString();
}
