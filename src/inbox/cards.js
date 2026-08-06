/**
 * The cards that exist in the guide TODAY, resolved at BUILD time.
 *
 * BUILD ONLY. Imported from Astro frontmatter, never from a browser module.
 * Keeping it out of the client bundle is what lets the inbox ship card titles
 * without shipping the 165 KB data file they come from.
 *
 * The titles have to come from somewhere: Firestore stores a block id, not a
 * heading, so without this the inbox would rank a worklist of slugs. Reading the
 * same assessment.data.js the guide renders from is what keeps the two in
 * agreement — and what makes drift detectable, since a response whose block is
 * missing here is a response about text that has since been regenerated.
 *
 * WHY `?raw` AND NOT node:fs
 *
 * The first version read the file with readFileSync off a path derived from
 * import.meta.url. That works under `astro dev` and silently does not under
 * `astro build` — Vite relocates the module, the relative path misses, and the
 * page shipped with `titles: {}`. Every card would have rendered as its slug,
 * and nothing would have said so.
 *
 * Vite resolves `?raw` statically, at bundle time, relative to THIS file. There
 * is no runtime path to get wrong and no dev/build divergence to discover in
 * production.
 */

import ASSESSMENT_SOURCE from '../../assessment.data.js?raw';

/**
 * @returns {{titles: Record<string, {title: string, topic: string}>, askable: number, version: string|null}}
 */
export function readCards() {
  // The data file is a plain `window.ASSESSMENT = {...}` assignment, so it is
  // evaluated against a bare object rather than parsed.
  const sandbox = {};
  new Function('window', ASSESSMENT_SOURCE)(sandbox);
  const assessment = sandbox.ASSESSMENT ?? {};

  const titles = {};
  let askable = 0;

  for (const topic of assessment.topics ?? []) {
    for (const change of topic.changes ?? []) {
      if (!change.id) continue;
      titles[change.id] = { title: change.title ?? change.id, topic: topic.title ?? '' };
      askable++;
    }
  }

  // marketCards resolve titles but do NOT count toward coverage. card-render.js
  // can render them; this guide does not — so counting them would report a
  // coverage gap no reader is able to close.
  for (const card of assessment.marketCards ?? []) {
    if (card.id) titles[card.id] = { title: card.title ?? card.id, topic: 'Market reality' };
  }

  // Fail the build rather than ship a worklist of slugs.
  //
  // The bug this exists to catch has already happened once, and its signature
  // was silence: an empty map is indistinguishable from "nobody has answered
  // anything yet" once the page is live. Anything that stops this file
  // resolving — a rename, a regeneration that changes the shape, a bundler
  // change — should stop the build instead.
  if (askable === 0) {
    throw new Error(
      'inbox: assessment.data.js yielded no cards. The inbox cannot render titles ' +
        'without it, and shipping an empty map would silently turn every card into a slug.'
    );
  }

  return { titles, askable, version: assessment.meta?.version ?? null };
}
