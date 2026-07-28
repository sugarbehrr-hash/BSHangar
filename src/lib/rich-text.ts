/**
 * Minimal inline markup for copy stored in src/data.
 *
 * The export embedded <b> tags directly in its content strings. Storing raw
 * HTML in a data file means every consumer has to trust and re-emit it, so the
 * data layer uses **double asterisks** instead and this converts them at render
 * time.
 *
 * Input is escaped BEFORE the marker pass, so even though everything in
 * src/data is authored by us, a stray angle bracket in a venue name or contract
 * quote can never become markup.
 */

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => ESCAPES[ch] ?? ch);
}

/**
 * Only schemes we ever author. Anything else is dropped rather than emitted,
 * so a typo can't become a javascript: link.
 */
const SAFE_HREF = /^(\/|https:\/\/|tel:|mailto:|#)/;

/**
 * Escape `text`, then turn **bold** runs into <b> and [label](href) into
 * links. Returns an HTML string intended for set:html.
 *
 * <b> rather than <strong> because the design system styles the bold runs by
 * tag — `.dp p b`, `.zdo b`, `.check b` — and those selectors do not match
 * <strong>, so the emphasis would render at the wrong colour.
 *
 * Links were added for the hub redesign, whose action lines point at the
 * Paycheck Estimator, the union number and the guides. The alternative was
 * storing raw anchors in src/data, which is what the marker syntax exists to
 * avoid.
 */
export function richText(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (whole, label: string, href: string) => {
      // The href arrives HTML-escaped; compare on the decoded form.
      const raw = href.replace(/&amp;/g, '&').replace(/&#39;/g, "'");
      if (!SAFE_HREF.test(raw)) return label;
      const external = raw.startsWith('https://');
      const rel = external ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${href}"${rel}>${label}</a>`;
    });
}
