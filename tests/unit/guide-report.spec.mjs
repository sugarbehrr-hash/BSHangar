/**
 * Unit tests for the report's sheet plan.
 *
 * The analyzer's contract calls the website and the report two renders of ONE
 * object, differing on exactly one axis — reading register. They must share
 * the narrative spine, the page order, the legend, and every topic opener and
 * chart lead-in. If they ever disagree on flow, that is a bug by definition.
 *
 * These tests hold the report to that: same order as the website, same
 * sections, nothing skipped, nothing invented, and every sheet renderable by
 * one of the two components the website already uses.
 *
 * Run: npm run test:unit
 */

import { describe, expect, it } from 'vitest';

import { getAssessment, pageOrder } from '../../src/guide/assessment/index.mjs';
import { guidePages } from '../../src/guide/model/pages.mjs';
import { reportContents, reportSheets } from '../../src/guide/model/report.mjs';

const { assessment } = getAssessment();

describe('the report sheet plan', () => {
  it('covers every page_order section exactly once', () => {
    const covered = reportSheets().flatMap((sheet) => sheet.sections);
    expect([...new Set(covered)].sort()).toEqual([...pageOrder()].sort());
  });

  it('keeps the authored order', () => {
    const spine = [];
    for (const sheet of reportSheets()) {
      for (const key of sheet.sections) {
        if (spine[spine.length - 1] !== key) spine.push(key);
      }
    }
    expect(spine).toEqual(pageOrder());
  });

  it('follows the same spine as the website', () => {
    // The one thing that must never drift between the two renders.
    const flatten = (pages) => {
      const out = [];
      for (const page of pages) {
        for (const key of page.sections) if (out[out.length - 1] !== key) out.push(key);
      }
      return out;
    };
    expect(flatten(reportSheets())).toEqual(flatten(guidePages()));
  });

  it('gives every topic its own sheet, in data order', () => {
    const topics = reportSheets().filter((sheet) => sheet.kind === 'topic');
    expect(topics.map((s) => s.topic.anchor)).toEqual(assessment.topics.map((t) => t.anchor));
  });

  it('renders nothing for a retired section', () => {
    expect(pageOrder()).not.toContain('find_your_position');
    expect(reportSheets().flatMap((s) => s.sections)).not.toContain('find_your_position');
  });

  it('routes every sheet to a component that can render it', () => {
    // A sheet whose kind no page handles would print blank — the failure mode
    // is a missing section in a document nobody notices is short.
    for (const sheet of reportSheets()) {
      expect(['hub', 'topic', 'closing'], sheet.id).toContain(sheet.kind);
      if (sheet.kind === 'topic') expect(sheet.topic).toBeTruthy();
      else expect(sheet.sections.length).toBeGreaterThan(0);
    }
  });

  it('gives every sheet a title for its contents entry', () => {
    for (const sheet of reportSheets()) {
      expect(sheet.title, sheet.id).toBeTruthy();
    }
  });
});

describe('the contents listing', () => {
  it('numbers sheets consecutively after the cover and contents', () => {
    const pages = reportContents().map((sheet) => sheet.page);
    expect(pages[0]).toBe(3);
    for (let i = 1; i < pages.length; i++) {
      expect(pages[i]).toBe(pages[i - 1] + 1);
    }
  });

  it('lists one entry per sheet', () => {
    expect(reportContents().length).toBe(reportSheets().length);
  });
});
