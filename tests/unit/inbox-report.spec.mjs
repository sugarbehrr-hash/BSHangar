/**
 * Unit tests for the inbox's ranking core.
 *
 * This logic decides which card Cole rewrites first. It went years living
 * inside a CLI script with no test at all, which meant the ordering rule — the
 * one thing the whole feature exists to produce — was only ever verified by
 * eyeballing a Markdown dump. These are the tests that should have existed.
 *
 * The cases that matter are the ones where a plausible-looking implementation
 * gives a defensible but wrong answer: a single grumpy response outranking a
 * genuinely broken card, a withdrawn note still being read, and the burst
 * threshold firing on a handful of crew reading together on a layover.
 *
 * Run: npm run test:unit
 */

import { describe, expect, it } from 'vitest';

import {
  BURST_ALERT,
  MIN_BURST_RESPONSES,
  burstShare,
  groupByBlock,
  rank,
  share,
  splitByDrift,
  summarise,
} from '../../src/inbox/report.js';

const MINUTE = 60 * 1000;

/** A row as it arrives from Firestore, with millis standing in for Timestamp. */
const row = (over = {}) => ({
  id: 'doc__block__uid',
  block: 'pay-levelset',
  verdict: 'unclear',
  note: '',
  base: '',
  contentVersion: '2.1.1',
  status: 'new',
  createdAt: 0,
  ...over,
});

/** An entry as groupByBlock produces one, for testing rank/share directly. */
const entry = (over = {}) => ({
  block: 'x',
  clear: 0,
  unclear: 0,
  withdrawn: 0,
  notes: [],
  times: [],
  burst: 0,
  ...over,
});

describe('share', () => {
  it('is the unclear portion of the readers who actually answered', () => {
    expect(share(entry({ clear: 3, unclear: 1 }))).toBe(0.25);
  });

  it('is zero when nobody answered, rather than dividing by zero', () => {
    expect(share(entry())).toBe(0);
    expect(share(entry({ withdrawn: 5 }))).toBe(0);
  });

  it('excludes withdrawn answers from the denominator', () => {
    // A reader who took their answer back is not a reader who found it clear.
    expect(share(entry({ clear: 1, unclear: 1, withdrawn: 8 }))).toBe(0.5);
  });
});

describe('rank', () => {
  it('puts the card that lost the largest share of its readers first', () => {
    const ranked = rank([
      entry({ block: 'mild', clear: 9, unclear: 1 }),
      entry({ block: 'broken', clear: 2, unclear: 8 }),
      entry({ block: 'middling', clear: 5, unclear: 5 }),
    ]);
    expect(ranked.map((e) => e.block)).toEqual(['broken', 'middling', 'mild']);
  });

  it('does not let one grumpy response outrank a genuinely broken card', () => {
    // Both are 100% unclear. The card eleven people struggled with is the one
    // worth a rewrite; the single response is noise until it is corroborated.
    const ranked = rank([
      entry({ block: 'lone-gripe', clear: 0, unclear: 1 }),
      entry({ block: 'really-broken', clear: 0, unclear: 11 }),
    ]);
    expect(ranked.map((e) => e.block)).toEqual(['really-broken', 'lone-gripe']);
  });

  it('leaves the caller array untouched', () => {
    const input = [entry({ block: 'a', unclear: 1 }), entry({ block: 'b', unclear: 9 })];
    rank(input);
    expect(input.map((e) => e.block)).toEqual(['a', 'b']);
  });
});

describe('burstShare', () => {
  /** n responses, `gap` apart. */
  const spread = (n, gap) => Array.from({ length: n }, (_, i) => i * gap);

  it('stays silent below the minimum, however tight the cluster', () => {
    // A few crew reading the guide together on the same layover. Real, normal,
    // and not evidence of anything.
    const together = spread(MIN_BURST_RESPONSES - 1, 1000);
    expect(burstShare(together)).toBe(0);
  });

  it('fires once the same tight cluster crosses the minimum', () => {
    const together = spread(MIN_BURST_RESPONSES, 1000);
    expect(burstShare(together)).toBe(1);
    expect(burstShare(together)).toBeGreaterThanOrEqual(BURST_ALERT);
  });

  it('counts a gap of exactly the window as inside it', () => {
    // The window is inclusive. Two responses ten minutes apart are one cluster,
    // not two — otherwise the flag depends on millisecond jitter.
    const times = [...spread(MIN_BURST_RESPONSES - 1, 1), 10 * MINUTE];
    expect(burstShare(times)).toBe(1);
  });

  it('drops a response that falls just outside the window', () => {
    const times = [...spread(MIN_BURST_RESPONSES - 1, 1), 10 * MINUTE + 1];
    expect(burstShare(times)).toBeCloseTo((MIN_BURST_RESPONSES - 1) / MIN_BURST_RESPONSES);
  });

  it('stays well under the alert line for responses spread over days', () => {
    // What honest traffic looks like: a trickle over a week.
    const times = spread(20, 6 * 60 * MINUTE);
    expect(burstShare(times)).toBeLessThan(BURST_ALERT);
  });

  it('finds the tightest window even when it is not at the start', () => {
    const early = [0, 40 * MINUTE, 80 * MINUTE];
    const cluster = Array.from({ length: 9 }, (_, i) => 200 * MINUTE + i * MINUTE);
    expect(burstShare([...early, ...cluster])).toBeCloseTo(9 / 12);
  });

  it('does not reorder the caller array', () => {
    const times = [5, 1, 3];
    burstShare(times);
    expect(times).toEqual([5, 1, 3]);
  });
});

describe('groupByBlock', () => {
  it('tallies each verdict onto its own card', () => {
    const [entryA] = groupByBlock([
      row({ verdict: 'clear' }),
      row({ verdict: 'clear' }),
      row({ verdict: 'unclear' }),
      row({ verdict: 'withdrawn' }),
    ]);
    expect(entryA).toMatchObject({ clear: 2, unclear: 1, withdrawn: 1 });
  });

  it('keeps cards separate', () => {
    const entries = groupByBlock([row({ block: 'a' }), row({ block: 'b' }), row({ block: 'a' })]);
    expect(entries.map((e) => e.block).sort()).toEqual(['a', 'b']);
  });

  it('collects notes with what triage needs to judge them', () => {
    const [only] = groupByBlock([
      row({ id: 'k', note: 'this contradicts page 4', base: 'CLT', contentVersion: '2.0.0' }),
    ]);
    expect(only.notes).toEqual([
      { id: 'k', note: 'this contradicts page 4', base: 'CLT', version: '2.0.0', status: 'new' },
    ]);
  });

  it('does not carry the note of a withdrawn answer', () => {
    // The reader took it back. Reading it anyway is reading something we were
    // asked to forget.
    const [only] = groupByBlock([row({ verdict: 'withdrawn', note: 'forget I said this' })]);
    expect(only.withdrawn).toBe(1);
    expect(only.notes).toEqual([]);
  });

  it('ignores an empty note rather than listing a blank row', () => {
    const [only] = groupByBlock([row({ note: '' })]);
    expect(only.notes).toEqual([]);
  });

  it('reads a Firestore Timestamp as readily as plain millis', () => {
    const stamp = { toMillis: () => 5000 };
    const [only] = groupByBlock([row({ createdAt: stamp })]);
    expect(only.times).toEqual([5000]);
  });

  it('survives a row with no usable timestamp', () => {
    // Rules pin createdAt to server time, so this should not happen — but a
    // thrown TypeError here would take the whole inbox down over one row.
    const [only] = groupByBlock([row({ createdAt: null })]);
    expect(only.times).toEqual([]);
    expect(only.burst).toBe(0);
  });

  it('attaches the burst share to each card', () => {
    const rows = Array.from({ length: MIN_BURST_RESPONSES }, (_, i) => row({ createdAt: i * 1000 }));
    const [only] = groupByBlock(rows);
    expect(only.burst).toBe(1);
  });
});

describe('splitByDrift', () => {
  const titles = new Map([['pay-levelset', { title: 'Pay', topic: 'Money' }]]);

  it('separates feedback about cards that no longer exist', () => {
    const { live, drift } = splitByDrift(
      [row({ block: 'pay-levelset' }), row({ block: 'deleted-card' })],
      titles
    );
    expect(live.map((r) => r.block)).toEqual(['pay-levelset']);
    expect(drift.map((r) => r.block)).toEqual(['deleted-card']);
  });

  it('keeps every row in exactly one side', () => {
    const rows = [row({ block: 'pay-levelset' }), row({ block: 'gone' }), row({ block: 'also-gone' })];
    const { live, drift } = splitByDrift(rows, titles);
    expect(live.length + drift.length).toBe(rows.length);
  });
});

describe('summarise', () => {
  it('counts cards heard from and notes written', () => {
    const entries = groupByBlock([
      row({ block: 'a', note: 'one' }),
      row({ block: 'a', note: 'two' }),
      row({ block: 'b' }),
    ]);
    expect(summarise(entries, 3)).toEqual({ total: 3, cards: 2, notes: 2 });
  });
});
