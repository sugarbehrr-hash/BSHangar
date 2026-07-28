/**
 * URL-safe anchor id from a heading, e.g. "Duty Time & Rest Limits" →
 * "duty-time-and-rest-limits".
 *
 * This is the single slug rule for in-page anchors: GuideSection stamps ids
 * with it, GuideToc links with it, and /contract/ deep-links cards with it —
 * so an anchor can only ever be derived one way.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
