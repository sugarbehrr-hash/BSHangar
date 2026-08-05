/**
 * Orchestrates one answer's journey: optimistic local record -> outbox -> Firestore.
 *
 * Lives in the small always-loaded bundle and knows nothing about Firebase. The
 * SDK is behind a dynamic import that fires on the first submission, so a
 * reader who never taps anything never downloads it.
 *
 * Delivery is best-effort and durable. An answer is written to local state and
 * painted immediately; the network attempt happens after. If it fails for a
 * reason that could resolve itself — offline on a jet bridge, dead airport
 * wifi — the answer stays in the outbox and is retried on the next page load
 * and on the next `online` event. Nothing is ever silently dropped, and the
 * reader is only shown an error for a failure that will not fix itself.
 */

import { canDeliver, contentVersion, LIMITS } from './config.js';
import {
  FAILED,
  KEY as STORAGE_KEY,
  MAX_ATTEMPTS,
  PENDING,
  SYNCED,
  failed,
  getAnswer,
  load,
  markAttemptFailed,
  markSynced,
  mergeWithStored,
  pending,
  putAnswer,
  rememberBase,
  revive,
  save,
} from './state.js';

/**
 * Resolved against our own <script> tag rather than hardcoded, so the chunk is
 * found wherever sync-vote-guide.mjs publishes the asset directory. Captured at
 * load time because document.currentScript is null once we are inside a
 * callback.
 */
const NET_URL = new URL('guide-feedback-net.js', document.currentScript?.src ?? location.href).href;

let documentId = null;
let state = load();
let net = null;
let flushing = false;
/**
 * Set when a submission arrives while a flush is already running. Without it,
 * answering a second card during the first card's round trip left the second
 * one sitting in the outbox until the next page load — the flush had already
 * snapshotted its queue and the re-entrant call returned early.
 */
let flushAgain = false;

/**
 * False once localStorage has refused a write. The UI must not tell a reader
 * their answer is "saved" when nothing was saved — see queued-state copy in
 * ui.js, which asks for this.
 */
let durable = true;

const listeners = new Set();

export function init(id) {
  documentId = id;
  state = load();

  // A fresh load means a fresh App Check token and a fresh sign-in, which is
  // exactly what turns yesterday's "permanent" rejection into today's
  // successful write. Anything we gave up on gets a bounded second chance
  // before the outbox drains.
  for (const answer of failed(state)) {
    state = revive(state, answer.doc, answer.block, { automatic: true });
  }

  flush();
  window.addEventListener('online', flush);

  // Another tab wrote the shared map. Adopt it, or this tab's next save would
  // overwrite whatever that tab just recorded.
  window.addEventListener('storage', (event) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    state = mergeWithStored(state);
    emit();
    flush();
  });
}

/** Whether the local echo is actually being persisted. */
export function isDurable() {
  return durable;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function answerFor(block) {
  return getAnswer(state, documentId, block);
}

export function rememberedBase() {
  return state.base;
}

/**
 * Records an answer and starts trying to deliver it.
 *
 * Input is clamped to the same caps firestore.rules enforces. Doing it here as
 * well is not redundancy for its own sake: it stops a reader losing a long note
 * to a rejection they cannot see the reason for, and it keeps the failure at
 * the edge where we can explain it.
 */
export function submit(block, { verdict, note = '', base = '' }) {
  const clean = {
    verdict,
    note: String(note).trim().slice(0, LIMITS.note),
    // Clamped to the same charset firestore.rules enforces on `base`. Without
    // this a reader typing "CLT!" gets a permission-denied they cannot see the
    // reason for, and the answer burns its retry budget against a rule it can
    // never satisfy. Dropping the stray character is what they meant anyway.
    base: String(base).trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, LIMITS.base),
    contentVersion: contentVersion(),
  };

  state = putAnswer(state, documentId, block, clean);
  if (clean.base) state = rememberBase(state, clean.base);
  persist();
  emit();

  flush();
}

/**
 * Puts a given-up answer back in the outbox and tries again.
 *
 * Wired to the "Try again" control. That control used to call flush() directly,
 * which did nothing at all: the outbox is derived from `status === PENDING`, so
 * a FAILED record was never in the queue and flush() returned on the very first
 * length check. The one recovery path the feature offers was inert.
 */
export function retry(block) {
  state = revive(state, documentId, block);
  persist();
  emit();
  flush();
}

/**
 * Writes the map, remembering whether storage actually accepted it, and adopts
 * the merged result so a second tab's records are not dropped on the next save.
 */
function persist() {
  const result = save(state);
  state = result.state;
  durable = durable && result.ok;
  return result.ok;
}

/**
 * Drains the outbox one answer at a time.
 *
 * Serial on purpose. The realistic worst case is a reader who worked through
 * the whole guide offline and then reconnects with 57 queued answers; firing
 * those in parallel is a burst that looks exactly like the abuse App Check is
 * there to stop.
 */
export async function flush() {
  if (!documentId) return;
  if (flushing) {
    flushAgain = true;
    return;
  }

  const queue = pending(state);
  if (queue.length === 0) return;

  if (!canDeliver()) {
    // No project to deliver to yet (Phase 0 not done). Leave the outbox intact
    // and spend no retry budget — these go out on the first load after the
    // config lands.
    return;
  }

  flushing = true;
  flushAgain = false;
  let stalled = false;

  try {
    for (const answer of queue) {
      try {
        net ??= await import(NET_URL);
        await net.write(answer);
        // answer.rev, not "whatever is at that key now". The reader may have
        // hit Change or Undo while this write was in the air, in which case the
        // record here is a different answer that has NOT been sent — marking it
        // delivered would drop it from the outbox and lose it for good.
        state = markSynced(state, answer.doc, answer.block, answer.rev);
      } catch (error) {
        // A failure to even load the chunk is always retryable — the reader is
        // most likely mid-air with no connection, not holding a bad build.
        const retryable = net ? net.isRetryable(error) : true;
        state = markAttemptFailed(state, answer.doc, answer.block, answer.rev, {
          retryable,
          message: net ? net.describe(error) : 'chunk-unavailable',
        });
        // Log the detail once, for a console the reader will never open but we
        // will. The UI gets a plain sentence, not this.
        console.warn('[feedback] delivery failed', answer.block, error);
        // A network-level failure will hit every remaining item the same way.
        // Stop and let the next `online` event retry the whole outbox.
        if (retryable) {
          stalled = true;
          break;
        }
      }
      persist();
      emit();
    }
  } finally {
    flushing = false;
    persist();
    emit();
  }

  // Anything submitted mid-pass was not in this pass's queue. Go again — but
  // never after a network stall, or a reader tapping through cards on dead
  // wifi would spin one doomed retry per tap.
  if (flushAgain && !stalled) {
    flushAgain = false;
    await flush();
  }
}

function emit() {
  for (const fn of listeners) {
    try {
      fn();
    } catch (error) {
      console.warn('[feedback] listener failed', error);
    }
  }
}

export { FAILED, MAX_ATTEMPTS, PENDING, SYNCED };
