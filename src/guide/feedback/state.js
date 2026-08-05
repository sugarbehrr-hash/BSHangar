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

/** Exported so store.js can recognise its own key on a cross-tab storage event. */
export const KEY = 'bsh-feedback-v1';

/** Delivery states an answer can be in. */
export const SYNCED = 'synced';
export const PENDING = 'pending';
export const FAILED = 'failed';

/** Give up after this many rejected attempts and tell the reader plainly. */
export const MAX_ATTEMPTS = 3;

/**
 * How many times a given-up record is retried automatically on a fresh load.
 *
 * A new page load means a new App Check token and a fresh sign-in, which is
 * exactly the condition that turns a "permanent" rejection back into a working
 * write — so retrying is usually right. The cap stops a record the server will
 * never accept from re-attempting on every visit for the rest of time.
 */
export const MAX_REVIVALS = 3;

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
 * Persists the map, merging with whatever is on disk first.
 *
 * The read-modify-write is not paranoia. This key is global rather than
 * per-document, and the whole map is serialised under it, so a plain
 * `setItem(JSON.stringify(ourState))` from a second tab erased the first tab's
 * undelivered records outright — a note typed in tab A, still queued because
 * the network was down, silently deleted by an unrelated answer in tab B, with
 * the card rendering as never answered.
 *
 * Merge rule is per record, newest `updatedAt` wins, with an undelivered record
 * beating a delivered one on a tie. Undelivered data is the only kind that
 * cannot be recovered, so ties resolve in its favour.
 *
 * Storage can also be unavailable (private mode, quota, a locked down browser).
 * That costs us the local echo but must not break submission, so the failure is
 * returned to the caller — and callers must act on it, because the UI otherwise
 * promises durability we do not have.
 */
export function save(state) {
  try {
    const merged = mergeWithStored(state);
    localStorage.setItem(KEY, JSON.stringify(merged));
    // The caller adopts what was actually written. A tab that kept its
    // pre-merge copy would overwrite the other tab again on its next save.
    return { ok: true, state: merged };
  } catch {
    return { ok: false, state };
  }
}

/**
 * Folds the on-disk map into ours. Exported for the cross-tab storage event,
 * which needs the merge without a write.
 */
export function mergeWithStored(state) {
  const stored = load();
  const answers = { ...stored.answers };

  for (const [k, ours] of Object.entries(state.answers)) {
    answers[k] = preferred(answers[k], ours);
  }

  return { base: state.base || stored.base, answers };
}

/**
 * Picks a winner between the stored copy of a record and ours.
 *
 * Revision first, because `rev` identifies WHICH answer this is — the reader's
 * latest intent always wins over an older one, whichever tab holds it.
 *
 * Only when both copies are the same answer does delivery state break the tie,
 * and there "already delivered" wins. Getting this backwards is not a subtle
 * bug: a copy that has just been marked delivered would be reverted to pending
 * by its own save, and the flush loop would redeliver it forever.
 */
function preferred(theirs, ours) {
  if (!theirs) return ours;
  if (!ours) return theirs;

  const theirRev = theirs.rev ?? 0;
  const ourRev = ours.rev ?? 0;
  if (theirRev !== ourRev) return theirRev > ourRev ? theirs : ours;

  // Same answer, so whichever copy was touched most recently knows the most.
  // `seq` and not `attempts`: a revived record deliberately resets attempts to
  // zero, and an attempts-based tie-break would hand the stored given-up copy
  // the win and undo the revival on the very save that recorded it.
  const theirSeq = theirs.seq ?? 0;
  const ourSeq = ours.seq ?? 0;
  if (theirSeq !== ourSeq) return theirSeq > ourSeq ? theirs : ours;

  // Genuinely concurrent edits in two tabs. Delivered beats undelivered.
  if (theirs.status === SYNCED) return theirs;
  return ours;
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
        revivals: prior?.revivals ?? 0,
        // `rev` identifies WHICH answer this is. Bumped only when the reader
        // gives a new one, and quoted back by the delivery layer when it
        // reports an outcome — see the rev guard on markSynced.
        rev: (prior?.rev ?? 0) + 1,
        // `seq` counts mutations of any kind, delivery bookkeeping included.
        // It exists so the cross-tab merge can tell which copy of the SAME
        // answer was touched last, which rev alone cannot express.
        seq: (prior?.seq ?? 0) + 1,
        updatedAt: nowIso(),
      },
    },
  };
}

/**
 * Marks a record delivered — but ONLY the exact revision that was transmitted.
 *
 * The rev guard is the fix for a silent data-loss bug. Delivery is async and can
 * take seconds (first submit pulls a ~70KB SDK and signs in), while the strip
 * already shows the answer as sent and offers Change and Undo. A reader who
 * takes either of those during that window replaced the record — and the
 * original write, resolving afterwards, used to stamp SYNCED by key. That
 * marked the NEW answer delivered without ever transmitting it and dropped it
 * from the outbox, so the note or the retraction was gone for good.
 *
 * Quoting the rev makes a superseded outcome a no-op: the newer record stays
 * PENDING and the re-flush picks it up.
 */
export function markSynced(state, doc, block, rev) {
  return patchAnswer(state, doc, block, rev, (a) => ({
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
 *
 * Rev-guarded for the same reason as markSynced: a stale failure must not
 * consume the retry budget of an answer the reader has since replaced.
 */
export function markAttemptFailed(state, doc, block, rev, { retryable, message }) {
  return patchAnswer(state, doc, block, rev, (a) => {
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

/**
 * Puts a given-up record back in the outbox.
 *
 * Without this, "Try again" was decoration: the outbox is derived from
 * `status === PENDING`, so a FAILED record was invisible to every flush, and
 * nothing anywhere moved it back. The reader tapped the only recovery control
 * the feature offers and nothing happened, on that visit and on every visit
 * after it, while their note sat in localStorage forever.
 *
 * `revivals` is counted so an automatic retry on boot cannot loop indefinitely
 * against a record the server will always reject. A manual tap is never capped —
 * if a reader keeps asking, we keep trying.
 */
export function revive(state, doc, block, { automatic = false } = {}) {
  const k = answerKey(doc, block);
  const current = state.answers[k];
  if (!current || current.status !== FAILED) return state;
  if (automatic && (current.revivals ?? 0) >= MAX_REVIVALS) return state;

  return {
    ...state,
    answers: {
      ...state.answers,
      [k]: {
        ...current,
        status: PENDING,
        attempts: 0,
        error: null,
        revivals: (current.revivals ?? 0) + (automatic ? 1 : 0),
        seq: (current.seq ?? 0) + 1,
      },
    },
  };
}

/** Every record the server has given up on, for the boot-time retry. */
export function failed(state) {
  return Object.values(state.answers).filter((a) => a.status === FAILED);
}

/** The outbox, derived — never stored. */
export function pending(state) {
  return Object.values(state.answers).filter((a) => a.status === PENDING);
}

export function rememberBase(state, base) {
  return { ...state, base };
}

function patchAnswer(state, doc, block, rev, fn) {
  const k = answerKey(doc, block);
  const current = state.answers[k];
  if (!current) return state;
  // A report about a revision the reader has already replaced tells us nothing
  // about the record that is there now.
  if (rev !== undefined && current.rev !== rev) return state;
  return {
    ...state,
    answers: { ...state.answers, [k]: { ...fn(current), seq: (current.seq ?? 0) + 1 } },
  };
}

function nowIso() {
  return new Date().toISOString();
}
