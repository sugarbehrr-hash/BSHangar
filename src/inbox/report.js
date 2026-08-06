/**
 * Turning raw feedback rows into a rewrite worklist.
 *
 * Pure functions only — no Firebase, no DOM, no clock. Everything here is a
 * function of its arguments, which is what makes it testable and what let it
 * move out of the old Admin-SDK report script without changing a single
 * ranking decision.
 *
 * The shape this produces is deliberately "which cards should I rewrite, in
 * what order" rather than a chronological dump. Collecting feedback nobody
 * reads is just a more elaborate way of ignoring people, and a reverse-
 * chronological list is how that happens: the loudest recent note wins and the
 * card that quietly lost half its readers never surfaces.
 */

/** Responses per card arriving in the tightest window of this length. */
const BURST_WINDOW_MS = 10 * 60 * 1000;

/**
 * Below this many responses, a tight cluster is just a few crew reading the
 * guide together on the same layover — normal, and not worth flagging.
 */
export const MIN_BURST_RESPONSES = 10;

/** Share of a card's responses inside one window before we distrust the tally. */
export const BURST_ALERT = 0.6;

/**
 * The largest share of a card's responses that fall inside any single
 * BURST_WINDOW_MS, as a fraction of that card's responses.
 *
 * Sliding window over sorted arrival times: `start` only ever moves forward, so
 * this is linear in the number of responses rather than quadratic.
 */
export function burstShare(times) {
  if (times.length < MIN_BURST_RESPONSES) return 0;

  const sorted = [...times].sort((a, b) => a - b);
  let best = 0;
  let start = 0;

  for (let end = 0; end < sorted.length; end++) {
    while (sorted[end] - sorted[start] > BURST_WINDOW_MS) start++;
    best = Math.max(best, end - start + 1);
  }

  return best / sorted.length;
}

/**
 * Collapses rows into one entry per card.
 *
 * Withdrawn answers are counted but their notes are not carried: the reader
 * took the note back, and showing it anyway would be reading something we were
 * asked to forget.
 */
export function groupByBlock(rows) {
  const blocks = new Map();

  for (const row of rows) {
    if (!blocks.has(row.block)) {
      blocks.set(row.block, {
        block: row.block,
        clear: 0,
        unclear: 0,
        withdrawn: 0,
        notes: [],
        times: [],
      });
    }
    const entry = blocks.get(row.block);

    if (row.verdict === 'clear') entry.clear++;
    else if (row.verdict === 'unclear') entry.unclear++;
    else entry.withdrawn++;

    // Firestore Timestamp in production, plain millis in tests.
    const created = typeof row.createdAt === 'number' ? row.createdAt : (row.createdAt?.toMillis?.() ?? null);
    if (created !== null) entry.times.push(created);

    if (row.note && row.verdict !== 'withdrawn') {
      entry.notes.push({
        id: row.id,
        note: row.note,
        base: row.base,
        version: row.contentVersion,
        status: row.status,
      });
    }
  }

  for (const entry of blocks.values()) entry.burst = burstShare(entry.times);

  return [...blocks.values()];
}

/** Share of readers who answered this card who said it was NOT clear. */
export function share(entry) {
  const answered = entry.clear + entry.unclear;
  return answered === 0 ? 0 : entry.unclear / answered;
}

/**
 * Worst first.
 *
 * Ranked by unclear SHARE, with the raw unclear count breaking ties, so one
 * grumpy response on a card nobody else read cannot outrank a card that
 * genuinely lost half its readers. Sorts a copy — the caller's array is not
 * reordered underneath it.
 */
export function rank(entries) {
  return [...entries].sort((a, b) => {
    const rateA = share(a);
    const rateB = share(b);
    if (rateB !== rateA) return rateB - rateA;
    return b.unclear - a.unclear;
  });
}

/**
 * Splits rows into those about cards that still exist and those that are not.
 *
 * Feedback keyed to a block that is no longer in the guide is not dropped — it
 * is surfaced separately, because a note written against text that has since
 * been regenerated may be answering a question that no longer exists, and
 * folding it into a live card's tally would be a lie.
 */
export function splitByDrift(rows, titles) {
  return {
    live: rows.filter((row) => titles.has(row.block)),
    drift: rows.filter((row) => !titles.has(row.block)),
  };
}

/**
 * Everything the header needs, in one pass so the view does not recount.
 *
 * `cards` counts cards that got any response at all, which is the honest
 * denominator for "how much of the guide have we heard about" — a card with
 * only withdrawn answers still counts as heard from.
 */
export function summarise(entries, total) {
  return {
    total,
    cards: entries.length,
    notes: entries.reduce((n, entry) => n + entry.notes.length, 0),
  };
}
