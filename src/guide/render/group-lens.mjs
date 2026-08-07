/**
 * Makes a change card's "which group am I" emphasis CSS-drivable.
 *
 * THE PROBLEM
 * `card-render.js` bakes the group lens into the markup: inside every card's
 * "Worth to each group" panel it renders three rows, and the one matching
 * `ctx.group` gets a different inline style from the other two. That is fine
 * for a page assembled in the browser, which simply re-renders when the reader
 * switches group. It is fatal for a static render — it would mean shipping
 * three copies of all 46 cards.
 *
 * THE FIX
 * Rewrite those three spans so the row states WHICH group it is (`data-g`) and
 * carries no emphasis of its own. A single attribute on an ancestor then picks
 * the highlighted row in CSS, so one rendered card serves all three groups and
 * switching costs no re-render, no JavaScript and no network.
 *
 * The design handoff puts this squarely in our half of the split: the analyzer
 * owns the WHAT, and "interaction (expanders, tabs, the 'which group am I'
 * selector)" is named as the display layer's job.
 *
 * WHY THIS IS A TRANSFORM AND NOT AN EDIT TO card-render.js
 * That file is shared: the currently published guide, the print report and the
 * inbox all render through it. The new guide is being built alongside the live
 * one, which must keep working untouched until it is replaced, so the change
 * lives here for now. At cutover it folds into card-render.js and this module
 * is deleted.
 *
 * HOW IT VERIFIES ITSELF
 * If the transform catches every group-dependent difference, then transforming
 * the SAME card rendered for two different groups must produce byte-identical
 * HTML. `assertGroupNeutral` checks exactly that, so if a future revision of
 * card-render.js introduces a second group-dependent difference, the build
 * fails instead of silently serving one group's emphasis to everybody.
 */

/** The three group keys, in the order the card renders them. */
export const GROUP_KEYS = Object.freeze(['nh', 'mc', 'sr']);

/** Reader-facing labels, as card-render.js writes them. */
const GROUP_LABELS = Object.freeze({ nh: 'New Hire', mc: 'Mid-Career', sr: 'Senior' });

/**
 * Matches one row label in the "Worth to each group" panel.
 *
 * Anchored on three things at once — the `ink-onnavy` class, the
 * `white-space:nowrap;` style prefix and the exact group label — because any
 * one of them alone appears elsewhere in the card. Requiring all three is what
 * keeps this from rewriting an unrelated span.
 */
const ROW_SPAN = /<span class="ink-onnavy" style="white-space:nowrap;[^"]*">(New Hire|Mid-Career|Senior)<\/span>/g;

const LABEL_TO_KEY = Object.freeze(
  Object.fromEntries(Object.entries(GROUP_LABELS).map(([key, label]) => [label, key]))
);

/**
 * Replaces baked-in group emphasis with a data attribute.
 *
 * @param {string} html A card rendered by `VoteCard.changeCard`.
 * @returns {string}
 * @throws when the panel does not contain exactly the three expected rows.
 */
export function neutraliseGroupEmphasis(html) {
  const seen = [];
  const out = html.replace(ROW_SPAN, (_match, label) => {
    const key = LABEL_TO_KEY[label];
    seen.push(key);
    // `ink-onnavy` is kept: card-render.js documents it as the hook a
    // print/ink-saver mode uses to lighten text sitting on a navy fill.
    return `<span class="ink-onnavy wg" data-g="${key}">${label}</span>`;
  });

  if (seen.length !== GROUP_KEYS.length || seen.join() !== GROUP_KEYS.join()) {
    throw new Error(
      'group lens: expected exactly one row per group, in order ' +
        `[${GROUP_KEYS.join(', ')}], but found [${seen.join(', ') || 'none'}].\n` +
        "card-render.js's \"Worth to each group\" panel has changed shape. The static render " +
        'cannot serve all three groups from one copy until this transform is updated to match.'
    );
  }

  return out;
}

/**
 * Chart wrappers carry a per-instance id.
 *
 * `chartPieces()` builds `vc-chart-<specId>-<n>` from a counter that increments
 * on every call, so the same card rendered twice in a row is NOT byte-identical
 * — the ids differ, and the unit toggle's onclick references them. That is
 * correct behaviour (two charts on one page must not share an id) but it means
 * a naive equality check between renders reports a difference that has nothing
 * to do with the group. Normalise the counter away before comparing.
 */
const CHART_INSTANCE_ID = /vc-chart-([a-z0-9_]+)-\d+/g;

const normaliseInstanceIds = (html) => html.replace(CHART_INSTANCE_ID, 'vc-chart-$1-N');

/**
 * Proves the transform captured every group-dependent difference.
 *
 * @param {(group: string) => string} renderForGroup Renders one card.
 * @param {string} label Identifies the card in the failure message.
 */
export function assertGroupNeutral(renderForGroup, label) {
  const rendered = GROUP_KEYS.map((key) => neutraliseGroupEmphasis(renderForGroup(key)));
  const [first, ...rest] = rendered.map(normaliseInstanceIds);

  for (let i = 0; i < rest.length; i++) {
    if (rest[i] !== first) {
      throw new Error(
        `group lens: "${label}" still renders differently for ${GROUP_KEYS[0]} and ` +
          `${GROUP_KEYS[i + 1]} after the emphasis transform.\n` +
          'Something else in the card now depends on ctx.group, so a single static copy would ' +
          "show one group's view to every reader. Find the new difference and make it " +
          'data-driven too, or fall back to rendering this card per group.'
      );
    }
  }

  // Return an actual render rather than the normalised comparison string: the
  // chart instance ids in it are real and the unit toggle depends on them.
  return rendered[0];
}
