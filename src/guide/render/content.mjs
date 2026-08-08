/**
 * The build's card, table and market-card pipeline.
 *
 * Everything a reader reads inside a card comes from `card-render.js` — the
 * shared design language the guide, the print report and the inbox all render
 * through. This module is the thin layer that runs it once per item and applies
 * the two transforms that let a single static copy serve every reader state:
 * the group lens and the detail lens.
 *
 * Nothing here writes copy, changes a verdict, or decides what appears. Order
 * and placement come from the data; this only assembles.
 */

import { getAssessment } from '../assessment/index.mjs';
import { assertGroupNeutral } from './group-lens.mjs';
import { mergeLenses } from './detail-lens.mjs';

/**
 * One change card, carrying both registers and all three group views.
 *
 * @param {object} change A `topics[].changes[]` entry.
 * @returns {string}
 */
export function changeCardHtml(change) {
  const { cards } = getAssessment();
  return mergeLenses(change, (detail) =>
    assertGroupNeutral(
      (group) => cards.changeCard(change, { detail, group }),
      `${change.id}/${detail}`
    )
  );
}

/**
 * A data table, plus the class that hides it outside its register.
 *
 * REGISTER IS VISIBILITY, a different axis from depth: `web` and `both` show in
 * the short reading, `pdf` is detail-only. The entry still renders — it is
 * hidden by lens, not omitted — so switching to Full needs no re-render.
 */
export function tableHtml(table) {
  const { cards } = getAssessment();
  return wrapForRegister(cards.dataTable(table), table.register);
}

/**
 * A market/context card in the full detail-card shell.
 *
 * Short shows the callout, the market verdict and the bullets; Full adds the
 * prose beneath. `marketDetailCard` already implements exactly that split, and
 * unlike a change card its Full render is a superset of its Short one, so both
 * registers are obtained by rendering Full and labelling the extra prose.
 */
export function marketCardHtml(card) {
  const { cards } = getAssessment();
  const short = cards.marketDetailCard(card, { detail: 'short' });
  const full = cards.marketDetailCard(card, { detail: 'long' });

  if (short === full) return wrapForRegister(withContainment(full), card.register);

  // The prose is appended at the end of the card's text column, so the added
  // region is the tail of the Full render that Short does not contain.
  const shared = commonPrefixLength(short, full);
  const addedOpensAtTag = full.lastIndexOf('<', shared);

  if (addedOpensAtTag <= 0) {
    throw new Error(
      `market card "${card.id}": the Full render is not an extension of the Short one, so the ` +
        'two registers cannot share a copy. Render them separately or update this merge.'
    );
  }

  const merged =
    full.slice(0, addedOpensAtTag) +
    `<div class="lens-full">${full.slice(addedOpensAtTag)}`.replace(/(<\/div>)$/, '</div>$1');

  return wrapForRegister(withContainment(merged), card.register);
}

/**
 * Gives a market card the containment wrapper it is missing.
 *
 * `changeCard` renders its card INSIDE a bare container div, and says why in
 * its own source: a container query cannot restyle `grid-template-columns` on
 * the same element that establishes the containment context — browsers reject
 * that as a layout cycle. `marketDetailCard` puts both on one element, so the
 * query that collapses a card to one column is structurally inert for these
 * cards and they keep a 224px side rail at every width. On a phone that leaves
 * the text about 57px wide.
 *
 * Adding the wrapper here fixes it with the renderer's own mechanism rather
 * than a viewport media query second-guessing it, and leaves the shared file —
 * which the live guide, the report and the inbox all render through — alone
 * while the rebuild is still being reviewed beside it.
 */
function withContainment(html) {
  return `<div style="container-type:inline-size; container-name:vc-card;">${html}</div>`;
}

/** Wraps an entry that only belongs to the detail register. */
function wrapForRegister(html, register) {
  if (register === 'pdf') return `<div class="reg-pdf">${html}</div>`;
  return html;
}

function commonPrefixLength(a, b) {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) i++;
  return i;
}

/**
 * Everything placed on a topic, in the order the contract specifies:
 * each change card, then any table anchored to it, then any context card
 * placed on it.
 *
 * @param {object} topic
 * @returns {Array<{kind: string, id: string, html: string}>}
 */
export function topicContent(topic) {
  const { assessment } = getAssessment();
  const tables = assessment.tables ?? [];
  const marketCards = assessment.marketCards ?? [];
  const out = [];

  for (const change of topic.changes ?? []) {
    out.push({ kind: 'change', id: change.id, html: changeCardHtml(change) });

    for (const table of tables.filter((t) => t.afterItem === change.id)) {
      out.push({ kind: 'table', id: table.id, html: tableHtml(table) });
    }
    for (const card of marketCards.filter((m) => m.placement === change.id)) {
      out.push({ kind: 'market', id: card.id, html: marketCardHtml(card) });
    }
  }

  // Tables placed on the topic itself, with no item to anchor to, close it out.
  for (const table of tables.filter((t) => t.placement === topic.anchor && !t.afterItem && !t.afterCard)) {
    out.push({ kind: 'table', id: table.id, html: tableHtml(table) });
  }

  return out;
}

/**
 * Market cards placed on a section key, with any table anchored to them.
 *
 * @param {string} placement
 */
export function sectionCards(placement) {
  const { assessment } = getAssessment();
  const tables = assessment.tables ?? [];
  const out = [];

  for (const card of (assessment.marketCards ?? []).filter((m) => m.placement === placement)) {
    out.push({ kind: 'market', id: card.id, card, html: marketCardHtml(card) });
    for (const table of tables.filter((t) => t.afterCard === card.id)) {
      out.push({ kind: 'table', id: table.id, html: tableHtml(table) });
    }
  }

  for (const table of tables.filter((t) => t.placement === placement && !t.afterItem && !t.afterCard)) {
    out.push({ kind: 'table', id: table.id, html: tableHtml(table) });
  }

  return out;
}
