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
 * Escape `text`, then turn **bold** runs into <strong>.
 * Returns an HTML string intended for set:html.
 */
export function richText(text: string): string {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
