/**
 * Delivery-loop tests for the reader-feedback outbox.
 *
 * These exist because an audit found three real data-loss bugs living in
 * exactly the gap this file now covers: the unit tests exercised state.js's
 * helpers in isolation and never once ran store.js's flush loop, so nothing
 * noticed that a reader who tapped Undo while their first answer was still in
 * the air had that retraction marked delivered and silently dropped.
 *
 * The real store.js is imported and driven — only the browser globals and the
 * lazily imported network chunk are stubbed, which is the same boundary the
 * shipped bundle already has.
 *
 * Run: npm run test:unit
 */

import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MAX_ATTEMPTS, MAX_REVIVALS } from '../../src/guide/feedback/state.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const DOC = '2026-ta-vote-guide';

/** A localStorage that behaves, and can be told to refuse writes. */
function makeStorage() {
  const map = new Map();
  return {
    refuse: false,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem(k, v) {
      if (this.refuse) throw new DOMException('QuotaExceededError');
      map.set(k, String(v));
    },
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
    _map: map,
  };
}

/** The browser globals store.js reads. Nothing outside this list is touched. */
const STUBBED = ['__net', 'localStorage', 'location', 'document', 'window'];

let storage;
let listeners;
/**
 * What each stubbed name was before this file ran, so afterEach can put the
 * realm back rather than leave holes in it.
 *
 * `delete globalThis[k]` is not a reset — for any name Node itself defines it is
 * a permanent removal from the realm, and every later test file in the same
 * process sees the hole. That is invisible today only because vitest isolates
 * files by default, which makes it exactly the kind of landmine that surfaces
 * later as an unexplained order-dependent failure.
 */
const original = new Map();

beforeEach(() => {
  vi.resetModules();

  storage = makeStorage();
  listeners = new Map();

  for (const k of STUBBED) original.set(k, Object.getOwnPropertyDescriptor(globalThis, k));

  globalThis.__net = { sent: [], hold: null, failWith: null };

  globalThis.localStorage = storage;
  globalThis.location = { hostname: 'localhost', href: 'http://localhost/contract/x/' };
  globalThis.document = {
    // Resolves store.js's dynamic import to tests/unit/_stub/guide-feedback-net.js
    currentScript: { src: pathToFileURL(join(HERE, '_stub', 'entry.js')).href },
  };
  globalThis.window = {
    ASSESSMENT: { meta: { version: '2.1.1' } },
    addEventListener: (type, fn) => listeners.set(type, fn),
    removeEventListener: (type) => listeners.delete(type),
  };
});

/**
 * Lets the outgoing test's delivery loop finish before its globals are taken
 * away.
 *
 * submit() starts a flush and deliberately does not await it, so a test that
 * stops at `await tick()` can end with a chunk import still in the air. The
 * stub reads globalThis.__net when write() is CALLED, so that straggler resumes
 * during the NEXT test and files its answer in the next test's inbox — an
 * order-dependent phantom that only appears when a leaky test happens to run
 * immediately before one that inspects __net.sent early.
 *
 * Draining here rather than making every test remember to settle keeps the
 * guarantee in one place: whatever a test starts, it also finishes.
 */
afterEach(async () => {
  await settle();

  for (const k of STUBBED) {
    const before = original.get(k);
    if (before) Object.defineProperty(globalThis, k, before);
    else delete globalThis[k];
  }
  original.clear();
});

/**
 * The only way this file reaches store.js.
 *
 * Never import it at the top: it reads document.currentScript while it
 * evaluates, so it can only be loaded once beforeEach has put the browser
 * globals in place.
 */
async function loadStore() {
  const store = await import('../../src/guide/feedback/store.js');
  store.init(DOC);
  // init() kicks a flush; let it settle so tests start from a quiet state.
  await settle();
  return store;
}

const tick = () => new Promise((r) => setTimeout(r, 0));

/**
 * Drains the delivery loop to a quiet baseline. A single tick is not enough: a
 * flush that finds work queued mid-pass re-enters itself, and each pass awaits
 * a dynamic import plus a write, so the chain is several turns deep.
 *
 * Used only where nothing afterward asserts on the OUTCOME of that drain — the
 * "let the store go quiet before the test really starts" spots. Anywhere a
 * test's assertions depend on delivery having actually finished, use waitFor()
 * below instead: a fixed tick count is a guess about how long delivery takes,
 * and a guess that happens to be generous enough on this machine today is not
 * the same thing as a guarantee.
 */
async function settle(turns = 12) {
  for (let i = 0; i < turns; i++) await tick();
}

/**
 * Polls a real condition until it's true, rather than a fixed number of ticks.
 *
 * settle()'s "12 ticks is enough" is exactly the kind of assumption that
 * degrades quietly: fine on a fast, idle machine, and a source of exactly the
 * order-dependent phantom this file was built to catch if a slower CI box, a
 * heavier neighbor process, or a busier module graph ever pushes the real
 * delivery chain past whatever budget a fixed guess set — silently, since nothing
 * would fail LOUDLY at the moment the budget stopped being enough. A caller
 * asserting the OUTCOME of delivery (a record reaching `synced`, `sent`
 * gaining an entry) should wait for that outcome directly instead of a proxy
 * for it. Bounded by wall-clock time, not tick count, so it self-adjusts to
 * whatever this machine actually needs and fails with a clear timeout — not a
 * confusing wrong-value assertion — if delivery genuinely never completes.
 */
async function waitFor(predicate, { timeoutMs = 2000, label = 'condition' } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (predicate()) return;
    if (Date.now() >= deadline) {
      throw new Error(`waitFor: "${label}" was not true within ${timeoutMs}ms`);
    }
    await tick();
  }
}
const stored = () => JSON.parse(storage.getItem('bsh-feedback-v1') ?? '{"answers":{}}');
const record = (block) => stored().answers[`${DOC}::${block}`];

describe('lost update — an answer replaced mid-flight', () => {
  it('does not mark a retraction delivered that was never sent', async () => {
    const store = await loadStore();

    // Hold the first write open, the way a cold SDK import on airport wifi does.
    let release;
    globalThis.__net.hold = new Promise((r) => (release = r));

    store.submit('pay-levelset', { verdict: 'clear' });
    await tick();

    // The strip already offers Undo at this point. Reader takes it.
    store.submit('pay-levelset', { verdict: 'withdrawn' });
    await tick();

    release();
    await waitFor(() => record('pay-levelset')?.status === 'synced', { label: 'pay-levelset synced' });

    const sent = globalThis.__net.sent.map((s) => s.verdict);
    expect(sent).toContain('withdrawn');
    expect(record('pay-levelset').verdict).toBe('withdrawn');
    expect(record('pay-levelset').status).toBe('synced');
  });

  it('does not lose a note added while the first answer was in the air', async () => {
    const store = await loadStore();

    let release;
    globalThis.__net.hold = new Promise((r) => (release = r));

    store.submit('pay-levelset', { verdict: 'clear' });
    await tick();

    // Reader taps Change, writes a real note, sends.
    store.submit('pay-levelset', { verdict: 'unclear', note: 'contradicts the chart above it' });
    await tick();

    release();
    await waitFor(() => record('pay-levelset')?.status === 'synced', { label: 'pay-levelset synced' });

    const notes = globalThis.__net.sent.map((s) => s.note);
    expect(notes).toContain('contradicts the chart above it');
    expect(record('pay-levelset').note).toBe('contradicts the chart above it');
    expect(record('pay-levelset').status).toBe('synced');
  });

  it('transmits the newer payload when a card is re-answered during a backlog drain', async () => {
    const store = await loadStore();

    // Three queued answers, as after a spell offline.
    let release;
    globalThis.__net.hold = new Promise((r) => (release = r));
    store.submit('a-one', { verdict: 'clear' });
    store.submit('a-two', { verdict: 'clear' });
    store.submit('a-three', { verdict: 'clear' });
    await tick();

    // While the drain is mid-flight, the reader corrects the last card.
    store.submit('a-three', { verdict: 'unclear', note: 'this card is actually wrong' });
    await tick();

    globalThis.__net.hold = null;
    release();
    await waitFor(() => record('a-three')?.status === 'synced', { label: 'a-three synced' });

    const three = globalThis.__net.sent.filter((s) => s.block === 'a-three');
    expect(three.some((s) => s.note === 'this card is actually wrong')).toBe(true);
    expect(record('a-three').note).toBe('this card is actually wrong');
    expect(record('a-three').status).toBe('synced');
  });
});

describe('a delivery that never comes back', () => {
  /**
   * Same job as settle(), but drives the fake clock. The real one is frozen
   * inside this block, so the tick() above would never fire.
   */
  async function settleFake(turns = 12) {
    for (let i = 0; i < turns; i++) {
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(0);
    }
  }

  const sentBlocks = () => globalThis.__net.sent.map((s) => s.block);

  it('gives up the drain instead of wedging it for the rest of the visit', async () => {
    const store = await loadStore();

    // One ordinary answer first, under the real clock. The store imports the
    // network chunk lazily on its first delivery, and a dynamic import cannot
    // resolve while the clock is frozen. It also puts the hang on a later card,
    // which is the realistic shape: the reader is partway through the guide
    // when the wifi goes.
    store.submit('a-zero', { verdict: 'clear' });
    await settle();
    expect(sentBlocks()).toEqual(['a-zero']);

    vi.useFakeTimers();

    try {
      // Accepted and then silence — a captive portal, or an inflight session
      // that drops the connection without closing it. Neither fetch nor the
      // Firestore SDK ever answers, so this promise never settles.
      globalThis.__net.hold = new Promise(() => {});
      store.submit('a-one', { verdict: 'clear' });
      await settleFake();
      expect(sentBlocks()).toEqual(['a-zero', 'a-one']);

      // The reader carries on through the guide while that hangs. The strip
      // says "Sent" for both, because a pending record with no failed attempt
      // is shown optimistically.
      globalThis.__net.hold = null;
      store.submit('a-two', { verdict: 'unclear', note: 'this one must not vanish' });
      await settleFake();
      expect(sentBlocks()).toEqual(['a-zero', 'a-one']);

      await vi.advanceTimersByTimeAsync(store.ATTEMPT_TIMEOUT_MS + 1);
      await settleFake();

      // Written off as a retryable failure: the attempt is over, but the answer
      // is kept and its retry budget is untouched.
      expect(record('a-one').attempts).toBe(1);
      expect(record('a-one').error).toBe('deadline-exceeded');
      expect(record('a-one').status).toBe('pending');
      expect(record('a-two').status).toBe('pending');

      // And the lock is free, so the retry the store already promises — the
      // next `online` event — actually drains the backlog.
      await listeners.get('online')();
      await settleFake();

      expect(sentBlocks()).toContain('a-two');
      expect(record('a-two').note).toBe('this one must not vanish');
      expect(record('a-two').status).toBe('synced');
      expect(record('a-one').status).toBe('synced');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('recovering a given-up answer', () => {
  /**
   * Spends one record's whole retry budget.
   *
   * Deliberately ONE submit followed by repeated flushes: re-submitting would
   * mint a new revision with attempts back at 0, so the record would never
   * reach the given-up state at all.
   */
  async function failUntilGivenUp(store, block) {
    globalThis.__net.failWith = 'permission-denied';
    store.submit(block, { verdict: 'unclear', note: 'please keep this' });
    await settle();
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      await store.flush();
      await settle();
    }
  }

  it('reaches the failed state after the retry budget is spent', async () => {
    const store = await loadStore();
    await failUntilGivenUp(store, 'pay-floor');
    expect(record('pay-floor').status).toBe('failed');
  });

  it('retry() actually re-attempts — the control is not inert', async () => {
    const store = await loadStore();
    await failUntilGivenUp(store, 'pay-floor');

    const before = globalThis.__net.sent.length;
    globalThis.__net.failWith = null;
    store.retry('pay-floor');
    await waitFor(() => record('pay-floor')?.status === 'synced', { label: 'pay-floor synced after retry' });

    expect(globalThis.__net.sent.length).toBeGreaterThan(before);
    expect(record('pay-floor').status).toBe('synced');
    expect(record('pay-floor').note).toBe('please keep this');
  });

  it('revives a given-up answer on the next page load, so a blocked reCAPTCHA is not fatal', async () => {
    const store = await loadStore();
    await failUntilGivenUp(store, 'pay-floor');
    expect(record('pay-floor').status).toBe('failed');

    // New visit: same storage, fresh module state, and the condition has cleared.
    vi.resetModules();
    globalThis.__net = { sent: [], hold: null, failWith: null };
    const reloaded = await import('../../src/guide/feedback/store.js');
    reloaded.init(DOC);
    await waitFor(() => record('pay-floor')?.status === 'synced', { label: 'pay-floor synced after revival' });

    expect(globalThis.__net.sent.map((s) => s.block)).toContain('pay-floor');
    expect(record('pay-floor').status).toBe('synced');
  });

  it('stops reviving automatically once the cap is reached', async () => {
    const store = await loadStore();
    await failUntilGivenUp(store, 'pay-floor');

    // Every reload keeps failing. Each visit must burn the whole retry budget
    // so the record ends that visit given up on again — otherwise it is simply
    // still pending and the revival counter never advances.
    for (let visit = 0; visit < MAX_REVIVALS + 2; visit++) {
      vi.resetModules();
      globalThis.__net = { sent: [], hold: null, failWith: 'permission-denied' };
      const s = await import('../../src/guide/feedback/store.js');
      s.init(DOC);
      await settle();
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        await s.flush();
        await settle();
      }
    }

    // The last visit is past the cap: nothing was even attempted.
    expect(globalThis.__net.sent.length).toBe(0);
    expect(record('pay-floor').status).toBe('failed');
    // The note is still there — given up on, never discarded.
    expect(record('pay-floor').note).toBe('please keep this');
  });
});

describe('storage that refuses to store', () => {
  it('reports that the local echo is not durable instead of claiming "Saved"', async () => {
    const store = await loadStore();
    expect(store.isDurable()).toBe(true);

    storage.refuse = true;
    store.submit('pay-retro', { verdict: 'clear' });
    await tick();

    expect(store.isDurable()).toBe(false);
  });

  it('still delivers the answer even though it could not be persisted', async () => {
    const store = await loadStore();
    storage.refuse = true;

    store.submit('pay-retro', { verdict: 'clear', note: 'still gets through' });
    await waitFor(() => globalThis.__net.sent.some((s) => s.note === 'still gets through'), {
      label: 'pay-retro delivered despite refused storage',
    });

    expect(globalThis.__net.sent.map((s) => s.note)).toContain('still gets through');
  });
});

describe('two tabs sharing one storage key', () => {
  it('does not erase another tab\'s undelivered record on save', async () => {
    const store = await loadStore();

    // Another tab recorded an undelivered answer directly into storage.
    const other = stored();
    other.answers[`${DOC}::other-tab-card`] = {
      doc: DOC,
      block: 'other-tab-card',
      verdict: 'unclear',
      note: 'typed in the other tab',
      base: '',
      contentVersion: '2.1.1',
      status: 'pending',
      attempts: 1,
      error: null,
      everSynced: false,
      revivals: 0,
      rev: 1,
      updatedAt: new Date(Date.now() + 5000).toISOString(),
    };
    storage.setItem('bsh-feedback-v1', JSON.stringify(other));

    store.submit('pay-retro', { verdict: 'clear' });
    await settle();

    expect(record('other-tab-card')).toBeDefined();
    expect(record('other-tab-card').note).toBe('typed in the other tab');
    expect(record('pay-retro')).toBeDefined();
  });

  it('adopts the other tab\'s work rather than reverting it on the next write', async () => {
    const store = await loadStore();

    const other = stored();
    other.answers[`${DOC}::shared-card`] = {
      doc: DOC,
      block: 'shared-card',
      verdict: 'unclear',
      note: 'newer, from the other tab',
      base: '',
      contentVersion: '2.1.1',
      status: 'synced',
      attempts: 0,
      error: null,
      everSynced: true,
      revivals: 0,
      rev: 9,
      updatedAt: new Date(Date.now() + 60000).toISOString(),
    };
    storage.setItem('bsh-feedback-v1', JSON.stringify(other));

    store.submit('pay-retro', { verdict: 'clear' });
    await settle();
    store.submit('pay-wagepath', { verdict: 'clear' });
    await settle();

    expect(record('shared-card').note).toBe('newer, from the other tab');
  });
});
