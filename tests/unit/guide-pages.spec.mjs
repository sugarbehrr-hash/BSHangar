/**
 * Unit tests for the guide's page map.
 *
 * The routes are derived from `howToRead.page_order` rather than listed by
 * hand, so that a data refresh which reorders, retires or adds a section
 * cannot leave the site quietly rendering a different document than the one
 * the analyzer authored. These tests hold that derivation to the contract:
 * every section appears exactly once, in the authored order, and a section the
 * page map does not know about stops the build instead of vanishing.
 *
 * Run: npm run test:unit
 */

import { describe, expect, it } from 'vitest';

import { getAssessment, pageOrder } from '../../src/guide/assessment/index.mjs';
import {
  GUIDE_BASE,
  guidePages,
  jumpIndex,
  pageForSection,
  pageForTopic,
  topicSlug,
} from '../../src/guide/model/pages.mjs';

const { assessment } = getAssessment();

describe('the page map', () => {
  it('covers every page_order key exactly once', () => {
    const covered = guidePages().flatMap((page) => page.sections);
    const unique = [...new Set(covered)];
    expect(unique.sort()).toEqual([...pageOrder()].sort());
  });

  it('keeps sections in the authored order', () => {
    // `topics` appears once per topic page; collapse it to compare the spine.
    const spine = [];
    for (const page of guidePages()) {
      for (const key of page.sections) {
        if (spine[spine.length - 1] !== key) spine.push(key);
      }
    }
    expect(spine).toEqual(pageOrder());
  });

  it('renders one page per topic, in data order', () => {
    const topicPages = guidePages().filter((page) => page.kind === 'topic');
    expect(topicPages.map((p) => p.topic.anchor)).toEqual(assessment.topics.map((t) => t.anchor));
  });

  it('renders nothing for a retired section', () => {
    // find_your_position exists in the data but is absent from page_order, and
    // the contract is explicit that a retired section shows nothing at all.
    expect(pageOrder()).not.toContain('find_your_position');
    const covered = guidePages().flatMap((page) => page.sections);
    expect(covered).not.toContain('find_your_position');
  });

  it('gives every page a distinct url under the guide base', () => {
    const hrefs = guidePages().map((page) => page.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs) expect(href.startsWith(`${GUIDE_BASE}/`)).toBe(true);
  });
});

describe('topic slugs', () => {
  it('derives from the contracted cat-<token> anchor', () => {
    expect(topicSlug('cat-pay')).toBe('pay');
    expect(topicSlug('cat-reserve')).toBe('reserve');
  });

  it('refuses an anchor shape the routes cannot be built from', () => {
    // Anchors are contracted to be stable single tokens; a multi-part anchor
    // would silently produce a nested or colliding route.
    expect(() => topicSlug('cat-pay-and-benefits')).toThrow(/cat-<token>/);
    expect(() => topicSlug('pay')).toThrow(/cat-<token>/);
    expect(() => topicSlug(undefined)).toThrow(/cat-<token>/);
  });
});

describe('the jump index', () => {
  const links = jumpIndex();

  it('lists every section, not only the topics', () => {
    // meta.showFullIndex is set, and the contract requires the full index be
    // derived from page_order "so it can never drift".
    expect(assessment.meta.showFullIndex).toBe(true);
    const labels = links.map((l) => l.label);
    for (const key of pageOrder()) {
      if (key === 'topics') continue;
      expect(labels).toContain(assessment.sections[key].title);
    }
  });

  it('links every topic to its own page', () => {
    for (const topic of assessment.topics) {
      const link = links.find((l) => l.label === topic.title);
      expect(link, topic.title).toBeTruthy();
      expect(link.href).toBe(pageForTopic(topic.anchor).href);
    }
  });

  it('points cross-page section links at the page that renders them', () => {
    for (const link of links) {
      if (link.kind === 'header' || !link.href.includes('#sec-')) continue;
      const key = link.href.split('#sec-')[1];
      expect(link.href).toBe(`${pageForSection(key).href}#sec-${key}`);
    }
  });

  it('has no link without a destination', () => {
    for (const link of links) {
      if (link.kind === 'header') continue;
      expect(link.href, link.label).toBeTruthy();
    }
  });
});
