/**
 * Unit tests for the group-lens transform.
 *
 * The whole static render rests on one claim: a change card's only
 * group-dependent difference is which of the three "Worth to each group" rows
 * is emphasised. If that holds, one rendered card serves every reader and the
 * lens costs nothing. If it stops holding and nobody notices, every reader sees
 * the New Hire view regardless of what they picked — a silent, plausible-looking
 * wrong answer, which is the worst failure this document can have.
 *
 * So the transform ships with its own proof, and these tests check both that
 * the proof passes today and that it actually fails when it should.
 *
 * Run: npm run test:unit
 */

import { describe, expect, it } from 'vitest';

import { getAssessment } from '../../src/guide/assessment/index.mjs';
import {
  GROUP_KEYS,
  assertGroupNeutral,
  neutraliseGroupEmphasis,
} from '../../src/guide/render/group-lens.mjs';

const { assessment, cards } = getAssessment();
const allChanges = assessment.topics.flatMap((t) => t.changes);

describe('neutraliseGroupEmphasis', () => {
  it('replaces all three rows with data-driven markup', () => {
    const html = cards.changeCard(allChanges[0], { detail: 'short', group: 'nh' });
    const out = neutraliseGroupEmphasis(html);

    for (const key of GROUP_KEYS) {
      expect(out).toContain(`<span class="ink-onnavy wg" data-g="${key}">`);
    }
    // The emphasis the transform exists to remove must be gone.
    expect(out).not.toContain('white-space:nowrap; font-family:var(--font-heading); font-weight:800; font-size:12px; color:#fff;');
  });

  it('throws rather than half-transforming markup it does not recognise', () => {
    expect(() => neutraliseGroupEmphasis('<div>no group panel here</div>')).toThrow(
      /expected exactly one row per group/
    );
  });

  it('throws when a row is missing, instead of silently emphasising nothing', () => {
    const html = cards.changeCard(allChanges[0], { detail: 'short', group: 'nh' });
    const missingSenior = html.replace(
      /<span class="ink-onnavy" style="white-space:nowrap;[^"]*">Senior<\/span>/,
      '<span>Senior</span>'
    );
    expect(() => neutraliseGroupEmphasis(missingSenior)).toThrow(/expected exactly one row per group/);
  });
});

describe('assertGroupNeutral', () => {
  it('holds for every change card in both lenses', () => {
    // 46 changes x 2 lenses. A failure here names the exact card, which is the
    // difference between a five-minute fix and an afternoon of bisecting.
    for (const change of allChanges) {
      for (const detail of ['short', 'long']) {
        expect(() =>
          assertGroupNeutral(
            (group) => cards.changeCard(change, { detail, group }),
            `${change.id}/${detail}`
          )
        ).not.toThrow();
      }
    }
  });

  it('ignores per-instance chart ids, which differ on every call', () => {
    const withChart = allChanges.find(
      (c) => c.chart && assessment.charts.some((s) => s.id === c.chart)
    );
    expect(withChart).toBeTruthy();
    expect(() =>
      assertGroupNeutral((group) => cards.changeCard(withChart, { detail: 'short', group }), withChart.id)
    ).not.toThrow();
  });

  it('DOES fail when a real group-dependent difference appears', () => {
    // Guards the guard: an assertion that cannot fail is not protecting
    // anything. Inject a difference of exactly the kind we are afraid of.
    const change = allChanges[0];
    expect(() =>
      assertGroupNeutral(
        (group) =>
          cards.changeCard(change, { detail: 'short', group }) +
          `<p>outlook written for ${group}</p>`,
        'injected'
      )
    ).toThrow(/still renders differently/);
  });

  it('returns a usable render, not the normalised comparison string', () => {
    const withChart = allChanges.find(
      (c) => c.chart && assessment.charts.some((s) => s.id === c.chart)
    );
    const out = assertGroupNeutral(
      (group) => cards.changeCard(withChart, { detail: 'short', group }),
      withChart.id
    );
    // A real instance id, not the "-N" placeholder used for comparison.
    expect(out).toMatch(/vc-chart-[a-z0-9_]+-\d+/);
    expect(out).not.toContain('-N"');
  });
});
