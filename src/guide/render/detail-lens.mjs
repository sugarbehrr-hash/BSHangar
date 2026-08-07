/**
 * Merges a change card's two lenses into one copy of the card.
 *
 * THE PROBLEM
 * `card-render.js` renders a change card in one of two registers. Short shows
 * the member-facing `plain` paragraph; Full SWAPS it for `meaning` and appends
 * an "In real terms" block. Not a superset — a swap — so a static build cannot
 * satisfy both from one render.
 *
 * The obvious fix, rendering the card twice and hiding one, is unavailable:
 * the reader-feedback layer finds its anchors with
 * `document.querySelector('[data-card-id=…]')` and repaints the FIRST match, so
 * two copies of a card on one page silently break feedback on it. And
 * re-rendering in the browser on toggle means shipping the analyzer runtime to
 * every reader — the ~236KB this rebuild exists to remove.
 *
 * THE FIX
 * One card, both prose blocks, each labelled with the lens it belongs to. An
 * attribute on `<html>` decides which is visible. One `data-card-id`, no
 * runtime, and switching lenses costs a class match.
 *
 * HOW IT VERIFIES ITSELF
 * The merge is only correct if it is lossless in both directions, so that is
 * asserted rather than assumed: delete the Full-only blocks from the merged
 * card and you must get back exactly what card-render.js produces for Short;
 * delete the Short-only blocks and you must get back exactly Full. Any card
 * where that round-trip fails is reported by id instead of quietly shipping a
 * lens that shows the wrong paragraph — the failure mode that matters here,
 * because a reader would have no way to tell.
 */

/** Marks a block that belongs to one lens only. */
export const SHORT_ONLY = 'lens-short';
export const FULL_ONLY = 'lens-full';

const escapeHtml = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Finds the `<p>` element whose text begins with `text`.
 *
 * Matching on a prefix of the escaped copy rather than the whole string keeps
 * this working when the renderer decorates the interior — the glossary linker
 * and the reference chips both inject markup mid-paragraph.
 */
function findParagraph(html, text) {
  if (!text) return null;
  const needle = escapeHtml(text).slice(0, 60);
  const at = html.indexOf(needle);
  if (at < 0) return null;
  const open = html.lastIndexOf('<p', at);
  const close = html.indexOf('</p>', at);
  if (open < 0 || close < 0) return null;
  return { start: open, end: close + 4, html: html.slice(open, close + 4) };
}

/** Adds a class to a `<p …>` open tag that has no class attribute of its own. */
function withClass(paragraphHtml, className) {
  if (paragraphHtml.startsWith(`<p class="`)) {
    return paragraphHtml.replace('<p class="', `<p class="${className} `);
  }
  return paragraphHtml.replace(/^<p\b/, `<p class="${className}"`);
}

/** Strips every `<p class="… name …">…</p>` block. Used only to verify. */
function dropClass(html, className) {
  return html.replace(new RegExp(`<p class="[^"]*\\b${className}\\b[^"]*"[^>]*>.*?<\\/p>`, 'gs'), '');
}

/**
 * Builds a single card carrying both lenses.
 *
 * @param {object} change A `topics[].changes[]` entry.
 * @param {(detail: string) => string} render Renders the card for one lens.
 * @returns {string}
 */
export function mergeLenses(change, render) {
  const short = render('short');
  const full = render('long');

  // Nothing to merge when the registers coincide — some items carry the same
  // sentence in both, and a card with no realterms has no Full-only block.
  if (short === full) return short;

  const meaningP = findParagraph(full, change.meaning);
  const plainP = findParagraph(short, change.plain);

  if (!meaningP || !plainP) {
    throw new Error(
      `detail lens: cannot locate the prose block for change "${change.id}" ` +
        `(plain ${plainP ? 'found' : 'MISSING'}, meaning ${meaningP ? 'found' : 'MISSING'}).\n` +
        'The card renderer changed how it emits item prose, so the two lenses can no longer be ' +
        'merged into one card. Until this is updated, that card would show only one register.'
    );
  }

  // Build from the Full render: it already carries the "In real terms" block,
  // which has no counterpart in Short and only needs labelling.
  let merged =
    full.slice(0, meaningP.start) +
    withClass(plainP.html, SHORT_ONLY) +
    withClass(meaningP.html, FULL_ONLY) +
    full.slice(meaningP.end);

  const realtermsP = findParagraph(merged, change.realterms);
  if (realtermsP) {
    merged =
      merged.slice(0, realtermsP.start) +
      withClass(realtermsP.html, FULL_ONLY) +
      merged.slice(realtermsP.end);
  }

  assertLossless(merged, { short, full, id: change.id });
  return merged;
}

/**
 * Proves the merged card still contains exactly both originals.
 *
 * Chart wrap ids come from a counter that advances on every render, so the two
 * source renders and the merge cannot be compared byte-for-byte without
 * normalising it away first (see group-lens.mjs for the same wrinkle).
 */
function assertLossless(merged, { short, full, id }) {
  // The surviving block keeps the lens class this transform added, which the
  // original renders naturally do not have — strip it before comparing, or the
  // check fails on its own bookkeeping rather than on real content.
  const stripLensClass = (html) =>
    html
      .replace(new RegExp(`\\s*class="(?:${SHORT_ONLY}|${FULL_ONLY})"`, 'g'), '')
      .replace(new RegExp(`class="(?:${SHORT_ONLY}|${FULL_ONLY}) `, 'g'), 'class="');

  const norm = (html) =>
    stripLensClass(html)
      .replace(/vc-chart-([a-z0-9_]+)-\d+/g, 'vc-chart-$1-N')
      .replace(/\s+/g, ' ')
      .trim();

  const asShort = norm(dropClass(merged, FULL_ONLY));
  const asFull = norm(dropClass(merged, SHORT_ONLY));

  if (asShort !== norm(short)) {
    throw new Error(
      `detail lens: merging "${id}" did not round-trip back to the Short register. ` +
        'The merged card would show a reader something other than what card-render.js produces ' +
        'for the default lens.'
    );
  }
  if (asFull !== norm(full)) {
    throw new Error(
      `detail lens: merging "${id}" did not round-trip back to the Full register. ` +
        'Detail content would be lost or duplicated when a reader switches lens.'
    );
  }
}
