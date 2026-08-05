/**
 * Unit tests for the feedback layer's pure logic.
 *
 * These cover the two places where a quiet wrong answer costs the most: which
 * document a page belongs to (get it wrong and every answer is filed under the
 * wrong key, or the layer silently never appears), and which of the six states
 * a card is showing (get it wrong and a reader is told their note was delivered
 * when it is still sitting in the outbox).
 *
 * Run: npm run test:unit
 */

import { describe, expect, it } from 'vitest';

import { documentIdFromLocation } from '../../src/guide/feedback/config.js';
import {
  FAILED,
  PENDING,
  SYNCED,
  markAttemptFailed,
  markSynced,
  pending,
  putAnswer,
} from '../../src/guide/feedback/state.js';
import { viewState } from '../../src/guide/feedback/ui.js';

const DOC = '2026-ta-vote-guide';
const BLOCK = 'pay-levelset';
const answer = (over = {}) => ({ verdict: 'clear', note: '', base: '', contentVersion: '2.1.1', ...over });

describe('documentIdFromLocation', () => {
  it('reads the slug from a directory URL', () => {
    expect(documentIdFromLocation('/contract/2026-ta-vote-guide/')).toBe(DOC);
  });

  it('reads the slug when the URL names index.html explicitly', () => {
    // GitHub Pages serves both forms; the longer one must not lose the layer.
    expect(documentIdFromLocation('/contract/2026-ta-vote-guide/index.html')).toBe(DOC);
  });

  it('handles a single-segment path', () => {
    expect(documentIdFromLocation('/commuting/')).toBe('commuting');
  });

  it('rejects a slug the rules would reject', () => {
    // Must agree with the `doc` regex in firestore.rules, or the write fails
    // after a round trip instead of never being attempted.
    expect(documentIdFromLocation('/contract/Vote_Guide/')).toBeNull();
  });

  it('returns null at the site root', () => {
    expect(documentIdFromLocation('/')).toBeNull();
  });

  it('returns null for a bare file at the root', () => {
    expect(documentIdFromLocation('/report.html')).toBeNull();
  });
});

describe('viewState', () => {
  const base = { doc: DOC, block: BLOCK, verdict: 'clear', attempts: 0 };

  it('is idle with no answer', () => {
    expect(viewState(null)).toBe('idle');
  });

  it('is idle once withdrawn', () => {
    expect(viewState({ ...base, verdict: 'withdrawn', status: SYNCED })).toBe('idle');
  });

  it('is done when delivered', () => {
    expect(viewState({ ...base, status: SYNCED })).toBe('done');
  });

  it('is done while the first attempt is still in flight', () => {
    // Optimistic on purpose: a failure here is recoverable and will surface.
    expect(viewState({ ...base, status: PENDING, attempts: 0 })).toBe('done');
  });

  it('is queued once an attempt has actually failed', () => {
    expect(viewState({ ...base, status: PENDING, attempts: 1 })).toBe('queued');
  });

  it('is failed when given up on', () => {
    expect(viewState({ ...base, status: FAILED, attempts: 3 })).toBe('failed');
  });
});

describe('outbox', () => {
  const empty = { base: '', answers: {} };

  it('derives the outbox from the answer map rather than a second list', () => {
    const state = putAnswer(empty, DOC, BLOCK, answer());
    expect(pending(state)).toHaveLength(1);
    expect(pending(markSynced(state, DOC, BLOCK, 1))).toHaveLength(0);
  });

  it('does not mutate the state it is given', () => {
    const before = putAnswer(empty, DOC, BLOCK, answer());
    const snapshot = JSON.stringify(before);
    markSynced(before, DOC, BLOCK, 1);
    markAttemptFailed(before, DOC, BLOCK, 1, { retryable: false, message: 'x' });
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it('keeps a retryable failure in the outbox no matter how many times it fails', () => {
    let state = putAnswer(empty, DOC, BLOCK, answer());
    for (let i = 0; i < 8; i++) {
      state = markAttemptFailed(state, DOC, BLOCK, 1, { retryable: true, message: 'offline' });
    }
    // Being offline for a week is not a reason to throw someone's note away.
    expect(pending(state)).toHaveLength(1);
    expect(viewState(state.answers[`${DOC}::${BLOCK}`])).toBe('queued');
  });

  it('gives up on a non-retryable failure after MAX_ATTEMPTS', () => {
    let state = putAnswer(empty, DOC, BLOCK, answer());
    for (let i = 0; i < 3; i++) {
      state = markAttemptFailed(state, DOC, BLOCK, 1, { retryable: false, message: 'permission-denied' });
    }
    expect(pending(state)).toHaveLength(0);
    expect(viewState(state.answers[`${DOC}::${BLOCK}`])).toBe('failed');
  });

  it('remembers that a record reached the server, so later writes amend it', () => {
    let state = putAnswer(empty, DOC, BLOCK, answer());
    state = markSynced(state, DOC, BLOCK, 1);
    state = putAnswer(state, DOC, BLOCK, answer({ verdict: 'unclear' }));
    expect(state.answers[`${DOC}::${BLOCK}`].everSynced).toBe(true);
  });

  it('ignores an outcome for a revision the reader has already replaced', () => {
    // The rev guard. Without it, a write that resolves after the reader hit
    // Undo marked the retraction delivered without ever sending it.
    let state = putAnswer(empty, DOC, BLOCK, answer({ verdict: 'clear' }));
    const inFlight = state.answers[`${DOC}::${BLOCK}`].rev;

    state = putAnswer(state, DOC, BLOCK, answer({ verdict: 'withdrawn' }));
    state = markSynced(state, DOC, BLOCK, inFlight);

    const current = state.answers[`${DOC}::${BLOCK}`];
    expect(current.verdict).toBe('withdrawn');
    expect(current.status).toBe(PENDING);
    expect(pending(state)).toHaveLength(1);
  });

  it('does not spend a replaced revision\'s retry budget', () => {
    let state = putAnswer(empty, DOC, BLOCK, answer());
    const stale = state.answers[`${DOC}::${BLOCK}`].rev;
    state = putAnswer(state, DOC, BLOCK, answer({ note: 'the real one' }));
    state = markAttemptFailed(state, DOC, BLOCK, stale, { retryable: false, message: 'x' });
    expect(state.answers[`${DOC}::${BLOCK}`].attempts).toBe(0);
  });
});
