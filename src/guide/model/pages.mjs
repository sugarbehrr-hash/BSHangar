/**
 * Turns the analyzer's section order into the guide's page map.
 *
 * `howToRead.page_order` is the document's spine. The analyzer is emphatic
 * that it is authoritative — "Render every section in the EXACT order given by
 * howToRead.page_order — top to bottom, none skipped, none reordered" — and
 * that anything absent from it is retired and renders nothing at all.
 *
 * So the routes are DERIVED from it rather than listed by hand. A future data
 * refresh that reorders the spine, retires a section or adds one changes the
 * site's page map by itself, instead of leaving a hand-maintained list quietly
 * disagreeing with the document it is supposed to describe.
 *
 * WHY THE DOCUMENT IS SPLIT ACROSS PAGES
 * Rendered as one page it is roughly 75,000px tall on a phone — about ninety
 * screens — which is why this rebuild exists. The split keeps the spine intact:
 * sections stay in page_order, nothing is skipped or reordered, and the
 * prev/next footer walks the same sequence. `SINGLE_PAGE_ROUTE` additionally
 * renders the whole flow as one document, which is both the printable view and
 * the literal reading of the contract's "ONE PAGE" clause.
 */

import { getAssessment, pageOrder, sectionCopy } from '../assessment/index.mjs';

/** Where the rebuilt guide lives while it is being reviewed beside the old one. */
export const GUIDE_BASE = '/contract/2026-ta-vote-guide-v2';

/** The complete flow as a single document: print view, and the contract's literal reading. */
export const SINGLE_PAGE_ROUTE = `${GUIDE_BASE}/all/`;

/**
 * Which page each page_order key belongs to.
 *
 * The grouping is a reading decision, not a data one: the three intro cards
 * plus the preface, the big-picture chart, the method and the scoreboard are
 * the argument a reader needs before any individual change makes sense, so
 * they open the guide together. `topics` explodes into one page per topic —
 * that is where the ninety screens actually live.
 */
const PAGE_OF = Object.freeze({
  what_this_is: 'hub',
  deal_in_one_paragraph: 'hub',
  how_to_use: 'hub',
  preface: 'hub',
  outlook: 'hub',
  anchors: 'hub',
  scoreboard: 'hub',
  topics: 'topics',
  market_reality: 'market',
  accountability: 'market',
  key: 'reference',
  glossary: 'reference',
});

/** Page-level identity for everything except the per-topic pages. */
const PAGE_META = Object.freeze({
  hub: { slug: '', title: 'Your Contract, Side by Side' },
  market: { slug: 'market-and-accountability', title: 'Market reality & accountability' },
  reference: { slug: 'key-and-glossary', title: 'The key & glossary' },
});

/** A topic's own page slug, taken from its `cat-<token>` anchor. */
export function topicSlug(anchor) {
  const match = /^cat-([a-z0-9]+)$/.exec(anchor ?? '');
  if (!match) {
    throw new Error(
      `guide routes: topic anchor "${anchor}" is not a cat-<token> slug. ` +
        'Anchors are contracted to be short, stable, single-token slugs precisely because ' +
        'routes and deep links are built from them.'
    );
  }
  return match[1];
}

const href = (slug) => (slug ? `${GUIDE_BASE}/${slug}/` : `${GUIDE_BASE}/`);

/**
 * The ordered list of pages, derived from page_order.
 *
 * @returns {Array<{id: string, kind: string, slug: string, href: string, title: string,
 *                  sections: string[], topic?: object}>}
 */
export function guidePages() {
  const { assessment } = getAssessment();
  const order = pageOrder();

  const pages = [];
  /** Groups consecutive keys that share a page, so page_order alone decides adjacency. */
  let current = null;

  const flush = () => {
    if (current) pages.push(current);
    current = null;
  };

  for (const key of order) {
    const pageId = PAGE_OF[key];

    if (pageId === undefined) {
      throw new Error(
        `guide routes: page_order contains "${key}", which no page claims.\n` +
          'The analyzer has added a section this site does not render. Decide which page it ' +
          'belongs on and add it to PAGE_OF — leaving it unmapped would silently drop a whole ' +
          'section of the guide.'
      );
    }

    if (pageId === 'topics') {
      flush();
      for (const [index, topic] of (assessment.topics ?? []).entries()) {
        const slug = topicSlug(topic.anchor);
        pages.push({
          id: `topic:${topic.anchor}`,
          kind: 'topic',
          slug,
          href: href(slug),
          title: topic.title,
          sections: ['topics'],
          topic,
          topicIndex: index,
          topicTotal: assessment.topics.length,
        });
      }
      continue;
    }

    if (current?.id !== pageId) {
      flush();
      const meta = PAGE_META[pageId];
      current = {
        id: pageId,
        kind: pageId,
        slug: meta.slug,
        href: href(meta.slug),
        title: meta.title,
        sections: [],
      };
    }
    current.sections.push(key);
  }
  flush();

  return pages;
}

/** The page a given page_order key renders on — used to build cross-page jump links. */
export function pageForSection(key) {
  const pages = guidePages();
  const found = pages.find((page) => page.sections.includes(key) && page.kind !== 'topic');
  if (found) return found;
  // `topics` resolves to the first topic page: the jump index links the topics
  // heading to where the topics actually start.
  return pages.find((page) => page.kind === 'topic') ?? pages[0];
}

/** The page a topic anchor renders on. */
export function pageForTopic(anchor) {
  return guidePages().find((page) => page.topic?.anchor === anchor);
}

/**
 * The hierarchical jump index.
 *
 * Derived from page_order exactly as the contract requires when
 * `meta.showFullIndex` is set — "Derive it from page_order so it can never
 * drift" — with the intro sections nested under a stage header and the topics
 * nested under the topics heading. Every href is now cross-page.
 */
const STAGE_KEYS = Object.freeze(['what_this_is', 'deal_in_one_paragraph', 'how_to_use', 'preface']);

export function jumpIndex() {
  const { assessment } = getAssessment();
  const showFull = Boolean(assessment.meta?.showFullIndex);

  const topicLinks = (assessment.topics ?? []).map((topic) => ({
    kind: 'sub',
    label: topic.title,
    href: pageForTopic(topic.anchor).href,
  }));

  if (!showFull) return topicLinks.map((link) => ({ ...link, kind: 'top' }));

  const titleOf = (key) => sectionCopy(key).title || key;
  const links = [];
  let stageOpened = false;

  for (const key of pageOrder()) {
    if (STAGE_KEYS.includes(key)) {
      if (!stageOpened) {
        links.push({ kind: 'header', label: 'Set the stage' });
        stageOpened = true;
      }
      links.push({ kind: 'sub', label: titleOf(key), href: `${pageForSection(key).href}#sec-${key}` });
      continue;
    }
    if (key === 'topics') {
      links.push({ kind: 'header', label: titleOf('topics') });
      links.push(...topicLinks);
      continue;
    }
    links.push({ kind: 'top', label: titleOf(key), href: `${pageForSection(key).href}#sec-${key}` });
  }

  return links;
}
