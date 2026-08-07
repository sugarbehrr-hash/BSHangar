/**
 * Unit tests for the detail-lens merge.
 *
 * The merge lets one rendered card serve both the Short and Full registers, so
 * the guide can be static and still keep its toggle. Two things have to hold,
 * and neither is visible by looking at the page:
 *
 *   - LOSSLESS. Hiding the Full blocks must leave exactly what the renderer
 *     produces for Short, and vice versa. A subtly wrong merge shows a reader a
 *     plausible paragraph from the wrong register, which nobody would report as
 *     a bug because it reads fine.
 *   - ONE ANCHOR PER CARD. The feedback layer repaints the FIRST element
 *     matching a `data-card-id`. A second copy of a card silently breaks
 *     feedback on it — answers vanish with no error anywhere.
 *
 * Run: npm run test:unit
 */

import { describe, expect, it } from 'vitest';

import { getAssessment } from '../../src/guide/assessment/index.mjs';
import { assertGroupNeutral } from '../../src/guide/render/group-lens.mjs';
import { FULL_ONLY, SHORT_ONLY, mergeLenses } from '../../src/guide/render/detail-lens.mjs';

const { assessment, cards } = getAssessment();
const allChanges = assessment.topics.flatMap((t) => t.changes);

/** Renders one card the way the build does: group-neutral, then lens-merged. */
const build = (change) =>
  mergeLenses(change, (detail) =>
    assertGroupNeutral((group) => cards.changeCard(change, { detail, group }), `${change.id}/${detail}`)
  );

describe('mergeLenses', () => {
  it('merges every change card losslessly', () => {
    // The assertion lives inside mergeLenses; this drives all 46 through it.
    for (const change of allChanges) {
      expect(() => build(change), change.id).not.toThrow();
    }
  });

  it('leaves exactly one feedback anchor per card', () => {
    for (const change of allChanges) {
      const matches = build(change).match(/data-card-id=/g) ?? [];
      expect(matches.length, `${change.id} data-card-id count`).toBe(1);
    }
  });

  it('carries both registers in the merged card', () => {
    const change = allChanges.find((c) => c.plain && c.meaning && c.plain !== c.meaning);
    const merged = build(change);
    expect(merged).toContain(`class="${SHORT_ONLY}"`);
    expect(merged).toContain(`class="${FULL_ONLY}"`);
  });

  it('keeps the Full-only "in real terms" reasoning out of the Short lens', () => {
    // renderContract: the market read lives on the item, in the Full layer.
    // If this block ever leaked into Short it would double the card's length
    // for the member audience the short register exists to serve.
    const change = allChanges.find((c) => c.realterms);
    expect(change).toBeTruthy();
    const merged = build(change);
    const realtermsBlock = merged
      .split('<p')
      .find((chunk) => chunk.includes('In real terms'));
    expect(realtermsBlock, 'expected an "In real terms" block').toBeTruthy();
    expect(realtermsBlock).toContain(FULL_ONLY);
  });

  it('returns the untouched render when both registers coincide', () => {
    const identical = { id: 'synthetic', plain: 'same', meaning: 'same' };
    const render = () => '<div data-card-id="synthetic"><p>same</p></div>';
    expect(mergeLenses(identical, render)).toBe(render());
  });

  it('refuses to merge when it cannot find the prose block', () => {
    const change = { id: 'synthetic', plain: 'a plain sentence', meaning: 'a meaning sentence' };
    const render = (detail) => `<div data-card-id="synthetic">${detail}</div>`;
    expect(() => mergeLenses(change, render)).toThrow(/cannot locate the prose block/);
  });

  it('DOES fail when the merge would lose content', () => {
    // Guards the guard. A merge that silently dropped the Full block would be
    // invisible on the page; this proves the round-trip check catches it.
    const change = allChanges.find((c) => c.realterms && c.plain !== c.meaning);
    const good = (detail) =>
      assertGroupNeutral((group) => cards.changeCard(change, { detail, group }), change.id);
    // An untagged extra block survives into the merge, so BOTH round-trips
    // break — Short is checked first. Either message proves detection worked.
    const lossy = (detail) => (detail === 'long' ? `${good('long')}<p>extra unmergeable block</p>` : good('short'));
    expect(() => mergeLenses(change, lossy)).toThrow(/did not round-trip back to the (Short|Full) register/);
  });
});
