/**
 * Splits the preface's "whose interest is whose" copy into rows.
 *
 * The analyzer authors this as ONE string with bullet lines in it:
 *
 *   Everyone at the table wants something different:
 *   • The COMPANY wants …
 *   • The UNION wants …
 *   • YOU want …
 *   None of that makes anyone a villain.
 *
 * Presenting it as a labelled row per party is a layout decision, which is
 * ours — but the words are not, so this only splits and never rewrites. The
 * party name is read out of the line rather than assumed from position,
 * because the order is the analyzer's to change.
 */

const BULLET = '•';
const PARTIES = /\b(COMPANY|UNION|YOU)\b/;

/**
 * @param {string} incentives The authored `preface.incentives` string.
 * @returns {{intro: string, rows: Array<{who: string, text: string}>, outro: string}}
 */
export function parseIncentives(incentives) {
  const lines = String(incentives ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const first = lines.findIndex((line) => line.startsWith(BULLET));
  const last = lines.reduce((at, line, i) => (line.startsWith(BULLET) ? i : at), -1);

  if (first < 0) return { intro: lines.join(' '), rows: [], outro: '' };

  // The lead-in ends in a colon introducing the list; as its own paragraph it
  // reads better closed.
  const intro = lines.slice(0, first).join(' ').replace(/:\s*$/, '.');
  const outro = last < lines.length - 1 ? lines.slice(last + 1).join(' ') : '';

  const rows = lines
    .slice(first, last + 1)
    .filter((line) => line.startsWith(BULLET))
    .map((line) => {
      const raw = line.replace(new RegExp(`^${BULLET}\\s*`), '');
      const who = PARTIES.exec(raw)?.[1] ?? '';
      // The party is already the row's label, so drop it from the sentence
      // rather than saying it twice.
      const stripped = raw.replace(/^(the\s+)?(company|union|you)\b[\s,—-]*/i, '');
      const text = stripped ? stripped[0].toUpperCase() + stripped.slice(1) : raw;
      return { who, text };
    })
    .filter((row) => row.who);

  return { intro, rows, outro };
}
