/**
 * The report's sheet plan.
 *
 * The website splits the guide by what a reader wants to look up; the report
 * paginates it, because it is a document someone prints and hands to a rep.
 * Both orders are the same order — `howToRead.page_order` — and this derives
 * the sheets from it rather than listing them, so a section added, retired or
 * moved upstream moves here too.
 *
 * The old report did this by rendering the whole flow into an offscreen stage,
 * measuring it, and slicing it into fixed sheets in the browser. That cannot
 * run in a static build, and it does not need to: giving each section its own
 * sheet produces the same thing a technical report wants anyway — a major
 * section starts on a fresh page — and the browser handles the overflow inside
 * a long section far better than a measuring loop can.
 */

import { getAssessment, pageOrder, sectionCopy } from '../assessment/index.mjs';

/**
 * The three short prose sections that open the document share a sheet.
 *
 * Each is two or three sentences. Alone, each would print a nearly empty page,
 * and three of those before the argument starts is how a report gets put down.
 * They are grouped because they are short, not because they are related — any
 * of them growing is a reason to revisit this.
 */
const OPENING_PROSE = Object.freeze(['what_this_is', 'deal_in_one_paragraph', 'how_to_use']);

/**
 * @returns {Array<{id: string, kind: string, title: string, sections: string[], topic?: object}>}
 */
export function reportSheets() {
  const { assessment } = getAssessment();
  const sheets = [];
  let opening = null;

  for (const key of pageOrder()) {
    if (OPENING_PROSE.includes(key)) {
      if (!opening) {
        opening = { id: 'opening', kind: 'hub', title: 'What this is', sections: [] };
        sheets.push(opening);
      }
      opening.sections.push(key);
      continue;
    }

    if (key === 'topics') {
      for (const [index, topic] of (assessment.topics ?? []).entries()) {
        sheets.push({
          id: `topic:${topic.anchor}`,
          kind: 'topic',
          title: topic.title,
          sections: ['topics'],
          topic,
          topicIndex: index,
          topicTotal: assessment.topics.length,
        });
      }
      continue;
    }

    sheets.push({
      id: key,
      kind: HUB_SECTIONS.has(key) ? 'hub' : 'closing',
      title: sectionCopy(key).title || key,
      sections: [key],
    });
  }

  return sheets;
}

/**
 * Which component renders a given section.
 *
 * Split the same way the website splits it, so both renders go through the
 * same two components and cannot drift into two descriptions of one section.
 */
const HUB_SECTIONS = new Set([
  'what_this_is',
  'deal_in_one_paragraph',
  'how_to_use',
  'preface',
  'outlook',
  'anchors',
  'scoreboard',
]);

/** Cover, then the sheets, so page numbers count the way a reader does. */
export function reportContents() {
  return reportSheets().map((sheet, index) => ({
    ...sheet,
    // +2: the cover is sheet 1 and the contents sheet is 2.
    page: index + 3,
  }));
}
