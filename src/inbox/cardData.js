/**
 * Reads the live guide content straight from window.ASSESSMENT — the same
 * global the guide itself and window.VoteCard read from.
 *
 * This replaces a build-time extraction that used to run in Astro frontmatter
 * (src/inbox/cards.js, deleted). That approach stopped being viable the moment
 * the inbox needed to render the actual card, not just its title: the guide's
 * own renderer needs the FULL card object (today/proposed/plain/rating/
 * reference/…), and copying that shape into a second build-time extraction
 * would just be a second, driftable copy of assessment.data.js. Loading the
 * exact file the guide loads, the same way, at the same layer, is the point —
 * see card-render.js's own header comment on window.VoteCard.
 */

/**
 * @typedef {{title: string, topic: string, kind: 'change'|'market', card: object}} CardEntry
 */

/**
 * @returns {{
 *   index: Map<string, CardEntry>,
 *   topics: string[],
 *   askable: number,
 *   version: string|null,
 * }}
 */
export function readCardIndex() {
  const assessment = window.ASSESSMENT ?? {};
  const index = new Map();
  const topics = [];
  let askable = 0;

  for (const topic of assessment.topics ?? []) {
    if (topic.title) topics.push(topic.title);
    for (const change of topic.changes ?? []) {
      if (!change.id) continue;
      index.set(change.id, { title: change.title ?? change.id, topic: topic.title ?? '', kind: 'change', card: change });
      askable++;
    }
  }

  // marketCards resolve titles and render through a different real function
  // (window.VoteCard.marketDetailCard) but do NOT count toward askable — this
  // guide renders 46 change cards and no market cards on its own page, so
  // counting all 57 would report a coverage gap no reader is able to close.
  let hasMarket = false;
  for (const card of assessment.marketCards ?? []) {
    if (!card.id) continue;
    index.set(card.id, { title: card.title ?? card.id, topic: 'Market reality', kind: 'market', card });
    hasMarket = true;
  }
  if (hasMarket) topics.push('Market reality');

  return { index, topics, askable, version: assessment.meta?.version ?? null };
}

/**
 * Renders one card exactly as the guide itself does — the real function, not
 * a re-implementation. `detail: 'short'` matches the guide's own web default
 * (plain-language prose), which is what a reader actually saw when they
 * answered, as opposed to `'long'`, which is the PDF report's deeper pass.
 */
export function renderCardHtml(entry) {
  const VoteCard = window.VoteCard;
  if (!VoteCard) return '<p>The card renderer did not load.</p>';
  return entry.kind === 'market'
    ? VoteCard.marketDetailCard(entry.card, { detail: 'short' })
    : VoteCard.changeCard(entry.card, { detail: 'short' });
}
