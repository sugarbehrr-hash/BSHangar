/**
 * Unit tests for the vote guide's data layer.
 *
 * The guide is rendered from a deliverable this repo does not author: the
 * analyzer's `assessment.data.js` and `assessment-charts.js`, plus the shared
 * card language in `card-render.js`. Two things about that arrangement can
 * break silently, and both are covered here.
 *
 * 1. THE STATIC RENDER. All three files were written to run in a browser. The
 *    entire rebuild rests on the claim that they are DOM-free string builders
 *    and can therefore run in Node at build time. If a future revision reaches
 *    for `document` at module scope, that claim dies and the guide stops
 *    building — these tests are what make that a red suite instead of a
 *    mystery at deploy time.
 *
 * 2. THE CONTRACT. The deliverable ships a manifest of itself. A data refresh
 *    that adds a chart or moves a table renders a page that looks perfectly
 *    fine while quietly missing a figure. The gate compares data to manifest.
 *
 * Run: npm run test:unit
 */

import { describe, expect, it } from 'vitest';

import { loadAssessmentRuntime, SOURCES } from '../../src/guide/assessment/runtime.mjs';
import { getAssessment, pageOrder, sectionCopy, assessmentMeta } from '../../src/guide/assessment/index.mjs';
import { verifyRenderContract } from '../../src/guide/assessment/contract.mjs';
import { compareVersions } from '../../src/guide/assessment/version.mjs';

describe('the analyzer deliverable runs in Node', () => {
  it('evaluates all three sources with no DOM present', () => {
    // The guard in card-render.js keys on `typeof document === "undefined"`,
    // so this assertion is load-bearing: if a test environment ever provides a
    // document, the suite stops testing the thing it means to test.
    expect(typeof document).toBe('undefined');

    const runtime = loadAssessmentRuntime();
    expect(runtime.assessment).toBeTypeOf('object');
    expect(runtime.chart).toBeTypeOf('function');
    expect(runtime.cards.changeCard).toBeTypeOf('function');
  });

  it('loads the data before the card renderer, which reads it at module scope', () => {
    // card-render.js builds its chart registry from window.ASSESSMENT as it
    // evaluates. Reordering SOURCES would leave that registry empty and the
    // unit toggle inert, with nothing else failing.
    expect(SOURCES.indexOf('assessment.data.js')).toBeLessThan(SOURCES.indexOf('card-render.js'));
    expect(SOURCES.indexOf('assessment-charts.js')).toBeLessThan(SOURCES.indexOf('card-render.js'));
  });

  it('names the missing file when a source cannot be read', () => {
    expect(() => loadAssessmentRuntime({ root: '/nonexistent-path-for-test' })).toThrow(
      /assessment.data.js/
    );
  });
});

describe('the loaded assessment', () => {
  it('is deeply frozen, because the display layer may not rewrite the analysis', () => {
    const { assessment } = getAssessment();
    expect(Object.isFrozen(assessment)).toBe(true);
    expect(Object.isFrozen(assessment.topics[0].changes[0])).toBe(true);
  });

  it('is the same object on every call, so an 11-page build parses it once', () => {
    expect(getAssessment()).toBe(getAssessment());
  });

  it('exposes a page_order with copy behind every key', () => {
    const order = pageOrder();
    expect(order.length).toBeGreaterThan(0);
    for (const key of order) {
      expect(sectionCopy(key), `sections[${key}]`).toBeTypeOf('object');
    }
  });

  it('carries the version stamp the page has to display', () => {
    expect(assessmentMeta().version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('renderers produce deterministic strings', () => {
  const { assessment, cards, chart } = getAssessment();

  it('renders a change card without mutating the frozen source', () => {
    const change = assessment.topics[0].changes[0];
    const html = cards.changeCard(change, { detail: 'short', group: 'nh' });
    expect(html).toContain(`data-card-id="${change.id}"`);
    // The feedback layer finds its anchors by this attribute; losing it would
    // silently disable reader feedback on every card.
    expect(html).toMatch(/data-card-id="/);
  });

  it('renders every change in both lenses for all three groups', () => {
    let rendered = 0;
    for (const topic of assessment.topics) {
      for (const change of topic.changes) {
        for (const detail of ['short', 'long']) {
          for (const group of ['nh', 'mc', 'sr']) {
            const html = cards.changeCard(change, { detail, group });
            expect(html.length, `${change.id} ${detail}/${group}`).toBeGreaterThan(0);
            rendered++;
          }
        }
      }
    }
    expect(rendered).toBeGreaterThan(200);
  });

  it('renders identical charts for identical input', () => {
    const spec = assessment.charts[0];
    expect(chart(spec, { width: 660 })).toBe(chart(spec, { width: 660 }));
  });

  it('gives each chart instance a unique id, so cards carrying one are not byte-identical', () => {
    // Not a defect: two charts on one page must not share a DOM id, and the
    // unit toggle's onclick targets that id. It is recorded here because it
    // makes "render the same card twice and compare" an invalid equality test
    // — anything diffing renders has to normalise the counter first.
    const withChart = assessment.topics
      .flatMap((t) => t.changes)
      .find((c) => c.chart && assessment.charts.some((s) => s.id === c.chart));
    expect(withChart, 'expected at least one change to carry a chart').toBeTruthy();

    const ctx = { detail: 'short', group: 'nh' };
    const a = cards.changeCard(withChart, ctx);
    const b = cards.changeCard(withChart, ctx);
    expect(a).not.toBe(b);
    expect(a.replace(/vc-chart-([a-z0-9_]+)-\d+/g, '$1')).toBe(
      b.replace(/vc-chart-([a-z0-9_]+)-\d+/g, '$1')
    );
  });

  it('renders a chartless card identically every time', () => {
    const plain = assessment.topics.flatMap((t) => t.changes).find((c) => !c.chart);
    expect(plain, 'expected at least one change with no chart').toBeTruthy();
    const ctx = { detail: 'short', group: 'nh' };
    expect(cards.changeCard(plain, ctx)).toBe(cards.changeCard(plain, ctx));
  });

  it('re-lays out a chart at a narrower width rather than only scaling it', () => {
    // This is what lets a phone get a legible chart: label font size is fixed
    // in viewBox user units, so a narrower viewBox renders text closer to 1:1
    // instead of shrinking it to a few pixels.
    const spec = assessment.charts[0];
    const wide = chart(spec, { width: 1000 }).match(/viewBox="([^"]+)"/)[1];
    const narrow = chart(spec, { width: 420 }).match(/viewBox="([^"]+)"/)[1];
    expect(wide).not.toBe(narrow);
    expect(Number(wide.split(' ')[2])).toBeGreaterThan(Number(narrow.split(' ')[2]));
  });
});

describe('the render contract', () => {
  it('holds for the deliverable currently in the repo', () => {
    const { ok, problems } = verifyRenderContract();
    expect(problems).toEqual([]);
    expect(ok).toBe(true);
  });
});

describe('version ordering', () => {
  it('orders releases', () => {
    expect(compareVersions('2.1.1', '2.1.0')).toBe(1);
    expect(compareVersions('2.1.0', '2.1.1')).toBe(-1);
    expect(compareVersions('2.1.1', '2.1.1')).toBe(0);
  });

  it('compares numerically, not as text', () => {
    // The bug this guards: "2.1.10" sorts before "2.1.9" as a string, which
    // would let a sync quietly roll the guide back one patch release.
    expect(compareVersions('2.1.10', '2.1.9')).toBe(1);
    expect(compareVersions('10.0.0', '9.9.9')).toBe(1);
  });

  it('treats a missing segment as zero', () => {
    expect(compareVersions('2.1', '2.1.0')).toBe(0);
    expect(compareVersions('2.2', '2.1.9')).toBe(1);
  });

  it('refuses a version shape the analyzer cannot emit', () => {
    expect(() => compareVersions('2.1.0-rc1', '2.1.0')).toThrow(/dot-separated integer/);
  });
});
