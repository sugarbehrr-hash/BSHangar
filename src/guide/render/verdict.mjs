/**
 * Verdict colour, decided by the data and never by the words.
 *
 * The render contract is blunt about this: "COLOUR COMES FROM `polarity`
 * ('pos'|'neu'|'neg') … NEVER infer a colour by pattern-matching the verdict's
 * words. Reader-facing wording must be free to change without changing what a
 * colour means; a verdict rename must never repaint a cell."
 *
 * So this maps polarity to a hue and the SCORE to an intensity within that
 * hue — the same two-step the guide has always used — and returns them as data
 * attributes for CSS to colour, rather than baking a colour into markup.
 */

/** Score thresholds separating intensities inside one polarity. */
const STRONG = 8;
const MEDIUM = 4;

/**
 * @param {string|undefined} polarity 'pos' | 'neu' | 'neg'
 * @param {number|undefined} score
 * @returns {{pol: string, strength: number}}
 */
export function verdictTone(polarity, score) {
  if (polarity === 'pos') {
    const magnitude = Number(score ?? 0);
    return { pol: 'pos', strength: magnitude >= STRONG ? 3 : magnitude >= MEDIUM ? 2 : 1 };
  }
  if (polarity === 'neg') {
    const magnitude = Number(score ?? 0);
    return { pol: 'neg', strength: magnitude <= -STRONG ? 3 : magnitude <= -MEDIUM ? 2 : 1 };
  }
  // Anything that is not explicitly positive or negative reads neutral. The
  // legend's own entries carry no score, which is why intensity defaults to 1.
  return { pol: 'neu', strength: 1 };
}

/** Renders a score the way the document does: always signed. */
export function signedScore(score) {
  const value = Number(score ?? 0);
  return value >= 0 ? `+${value}` : `${value}`;
}
