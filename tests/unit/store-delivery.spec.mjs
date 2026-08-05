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

let storage;
let listeners;

beforeEach(() => {
  vi.resetModules();

  storage = makeStorage();
  listeners = new Map();

  globalThis.__net = { sent: [], hold: null, failWith: null };

  globalThis.localStorage = storage;
  globalThis.location = { hostname: 'localhost', href: 'http://localhost/contract/x/' };
  // navigator is an accessor on the Node global; plain assignment throws.
  Object.defineProperty(globalThis, 'navigator', {
    value: { onLine: true },
    configurable: true,
    writable: true,
  });
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

afterEach(() => {
  for (const k of ['__net', 'localStorage', 'location', 'navigator', 'document', 'window']) {
    delete globalThis[k];
  }
});

async function loadStore() {
  const store = await import('../../src/guide/feedback/store.js');
  store.init(DOC);
  // init() kicks a flush; let it settle so tests start from a quiet state.
  await settle();
  return store;
}

const tick = () => new Promise((r) => setTimeout(r, 0));

/**
 * Drains the delivery loop. A single tick is not enough: a flush that finds work
 * queued mid-pass re-enters itself, and each pass awaits a dynamic import plus a
 * write, so the chain is several turns deep.
 */
async function settle(turns = 12) {
  for (let i = 0; i < turns; i++) await tick();
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
    await settle();

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
    await settle();

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
    await settle();

    const three = globalThis.__net.sent.filter((s) => s.block === 'a-three');
    expect(three.some((s) => s.note === 'this card is actually wrong')).toBe(true);
    expect(record('a-three').note).toBe('this card is actually wrong');
    expect(record('a-three').status).toBe('synced');
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
    await settle();

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
    await settle();

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
    await settle();

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
