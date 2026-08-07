/**
 * Draws each chart twice so a phone gets a legible one.
 *
 * THE PROBLEM
 * `assessment-charts.js` sizes label text in viewBox user units — 11 of them,
 * at every width. When a 1000-unit-wide chart is scaled into a 340px phone
 * column, those 11 units land at about 3.7 real pixels. The chart is present,
 * correctly drawn, and unreadable. That is the state of every chart in the
 * guide today.
 *
 * THE FIX
 * `opts.width` does not scale the drawing — it re-lays it out, emitting a
 * viewBox of that width with label text still at 11 units. So a chart drawn at
 * a narrow width renders its labels near 1:1 on a phone. Because the renderer
 * runs at build time and is deterministic, drawing each chart at both widths
 * costs nothing at runtime and CSS picks the one that fits.
 *
 * The alternative — one wide chart in a sideways-scrolling box — was rejected:
 * it makes the reader swipe a figure whose whole job is to be taken in at a
 * glance, and the guide's flagship chart is the argument, not an illustration.
 *
 * This does NOT touch the drawing. Same renderer, same spec, same directives,
 * loaded verbatim exactly as the contract requires; only the width handed to it
 * differs, which is a framing decision and therefore ours.
 */

import { getAssessment } from '../assessment/index.mjs';

/**
 * The drawing width for phones, chosen to land near 1:1.
 *
 * A 375px screen gives the chart about 305px of column. Label text is 11
 * viewBox units, so the rendered size is 11 x (column / viewBox width): at the
 * document's usual 1000 that is 3.4px, and at 340 it is just under 10px. Going
 * narrower still would start crowding the axis rather than helping.
 */
export const NARROW_WIDTH = 340;

/** The wide render, matching what the document has always used for figures. */
export const WIDE_WIDTH = 1000;

/** In-card charts sit in a narrower column than a full-width section figure. */
export const IN_CARD_WIDTH = 660;

/** The widest a phone drawing may get before it stops being a phone drawing. */
const NARROW_CEILING = 660;

/**
 * Estimates how far right an SVG's text reaches, in viewBox units.
 *
 * Needed because the narrow width cannot simply be "as narrow as possible":
 * legends and annotations are drawn at a fixed size and do NOT reflow, so past
 * a certain point they run off the edge of the viewBox and get clipped — which
 * is worse than small text, because the sentence silently loses its end. That
 * is exactly what happens to "THE GAP — buying power you never get back", the
 * label carrying the guide's central claim.
 *
 * A character-width estimate is enough here: it only has to be conservative,
 * since the cost of over-estimating is a slightly wider drawing and the cost of
 * under-estimating is a truncated label. The ratio is for the sans-serif the
 * design system loads at these sizes.
 */
const AVG_GLYPH_RATIO = 0.52;

/**
 * The smallest label size worth calling readable, in CSS pixels.
 *
 * Used to derive a minimum on-screen width from a chart's drawing width: label
 * text is 11 viewBox units, so a chart shown narrower than
 * `viewBox x (MIN_LABEL_PX / 11)` has labels below this. Most charts clear it
 * inside a phone column; the one or two whose legends force a wide viewBox get
 * a scroll of their own rather than dragging every chart into one.
 */
const MIN_LABEL_PX = 9;
const LABEL_UNITS = 11;

function textExtent(svg) {
  let max = 0;
  const TEXT = /<text\b([^>]*)>([\s\S]*?)<\/text>/g;

  for (const [, attrs, body] of svg.matchAll(TEXT)) {
    const content = body.replace(/<[^>]*>/g, '').trim();
    if (!content) continue;

    const x = Number(/\bx="([-\d.]+)"/.exec(attrs)?.[1] ?? 0);
    const size = Number(/\bfont-size="?([\d.]+)/.exec(attrs)?.[1] ?? 11);
    const anchor = /\btext-anchor="(\w+)"/.exec(attrs)?.[1] ?? 'start';
    const width = content.length * size * AVG_GLYPH_RATIO;

    const right = anchor === 'middle' ? x + width / 2 : anchor === 'end' ? x : x + width;
    if (right > max) max = right;
  }
  return max;
}

/**
 * The narrowest drawing of this chart that does not clip its own labels.
 *
 * Measured from the chart's actual content rather than fixed, because the four
 * charts in this guide disagree by more than 200 units about what they need —
 * one fits comfortably at 340, another cannot go below ~580 without losing the
 * end of a legend entry.
 */
export function narrowWidthFor(spec) {
  const { chart } = getAssessment();
  const needed = Math.ceil(textExtent(chart(spec, { thick: true, width: NARROW_WIDTH }))) + 8;
  return Math.min(NARROW_CEILING, Math.max(NARROW_WIDTH, needed));
}

/**
 * Both renders of one chart spec.
 *
 * @param {object} spec A `charts[]` entry.
 * @param {object} [options]
 * @param {number} [options.wide] Width for the wide render.
 * @returns {{narrow: string, wide: string, narrowWidth: number}}
 */
export function chartPair(spec, { wide = WIDE_WIDTH } = {}) {
  const { chart } = getAssessment();
  const narrowWidth = narrowWidthFor(spec);
  return {
    narrow: chart(spec, { thick: true, width: narrowWidth }),
    wide: chart(spec, { thick: true, width: wide }),
    narrowWidth,
    /** On-screen floor that keeps this chart's labels at MIN_LABEL_PX. */
    narrowMinPx: Math.round(narrowWidth * (MIN_LABEL_PX / LABEL_UNITS)),
  };
}

/**
 * Looks up the charts placed on a section or topic.
 *
 * Placement is authoritative — "Place every chart in its chart.placement" — and
 * a chart that matches nothing is a chart the reader never sees, so callers
 * that expect one should say so rather than rendering an empty frame.
 *
 * @param {string} placement A page_order key, topic anchor, or item id.
 * @returns {object[]}
 */
export function chartsFor(placement) {
  const { assessment } = getAssessment();
  return (assessment.charts ?? []).filter((spec) => spec.placement === placement);
}

/** The unit toggle's buttons, when a chart declares alternate units. */
export function unitsFor(spec) {
  const { chartUnits } = getAssessment();
  const units = chartUnits(spec) ?? [];
  return units.length >= 2 ? units : [];
}
