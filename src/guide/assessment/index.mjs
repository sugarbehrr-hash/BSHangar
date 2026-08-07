/**
 * The vote guide's data, loaded once per build.
 *
 * Astro renders every page in the same Node process, so without a cache the
 * ~236KB deliverable would be parsed and evaluated once per route. The module
 * cache makes it once per build, and the frozen result makes it impossible for
 * one page's render to leave a mark on another's.
 *
 * FREEZING IS THE CONTRACT, NOT AN OPTIMISATION. The analyzer's renderContract
 * opens with "Claude Design is the DISPLAY LAYER ONLY. Render what is here; do
 * not think for it." A display layer has no business mutating the analysis, so
 * the analysis is handed to it read-only and any attempt to "fix" a value in
 * passing fails loudly in development instead of silently shipping a number the
 * analyzer never produced.
 */

import { loadAssessmentRuntime } from './runtime.mjs';

/** Recursively freezes a plain data tree. Build-time only; depth here is small. */
function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  for (const key of Object.getOwnPropertyNames(value)) {
    deepFreeze(value[key], seen);
  }
  return Object.freeze(value);
}

let cached = null;

/**
 * @returns {{assessment: object, chart: Function, chartUnits: Function, cards: object}}
 */
export function getAssessment() {
  if (cached) return cached;

  const runtime = loadAssessmentRuntime();

  // The renderers read this object but must never write to it. card-render.js
  // keeps its own chart registry on `window`, not on the data, so freezing is
  // safe — and if a future revision starts writing here, this is where we want
  // to find out.
  deepFreeze(runtime.assessment);

  cached = Object.freeze(runtime);
  return cached;
}

/** Test seam: drop the memo so a suite can load a doctored copy. */
export function resetAssessmentCache() {
  cached = null;
}

/**
 * Convenience accessors. Every one of these is a field the renderContract names
 * explicitly, so a rename upstream surfaces here rather than as an empty region
 * on a page.
 */
export function assessmentMeta() {
  return getAssessment().assessment.meta ?? {};
}

/** The authored section sequence. Everything downstream derives from this. */
export function pageOrder() {
  const order = getAssessment().assessment.howToRead?.page_order;
  if (!Array.isArray(order) || order.length === 0) {
    throw new Error(
      'assessment: howToRead.page_order is missing or empty. It is the guide\'s spine — ' +
        'every section, route and jump link derives from it, so there is nothing to render without it.'
    );
  }
  return order;
}

/** `sections[key]` carries the reader-facing title/intro for a page_order key. */
export function sectionCopy(key) {
  return getAssessment().assessment.sections?.[key] ?? {};
}
