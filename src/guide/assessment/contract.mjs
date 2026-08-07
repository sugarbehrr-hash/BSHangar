/**
 * Checks the loaded deliverable against the contract it ships with itself.
 *
 * WHY THIS EXISTS
 * `assessment.data.js` carries a `renderContract` written by the analyzer for
 * whoever renders it, and inside it a `renderContractChangelog` that is an
 * exact manifest of this build: which charts exist and where they belong,
 * which tables anchor to which card or item, which section order is authored,
 * whether a hero chart exists at all.
 *
 * That manifest is the only thing standing between a data refresh and a silent
 * regression. If the next build adds a chart placed on `cat-reserve`, nothing
 * about the page templates would fail — the chart simply would not appear, and
 * a reader would never know a figure was missing. The manifest knows it should
 * be there, so we check the data against it and fail the build instead.
 *
 * Deliberately validates the DATA, not the markup: it answers "does the render
 * plan cover everything the analyzer says exists", which is the question a
 * template cannot answer about itself.
 */

import { getAssessment, pageOrder } from './index.mjs';

/** Collects problems rather than throwing on the first, so one run lists them all. */
class Report {
  constructor() {
    this.problems = [];
  }
  check(condition, message) {
    if (!condition) this.problems.push(message);
    return condition;
  }
  get ok() {
    return this.problems.length === 0;
  }
}

/**
 * @returns {{ok: boolean, problems: string[]}}
 */
export function verifyRenderContract() {
  const { assessment } = getAssessment();
  const report = new Report();
  const changelog = assessment.renderContract?.renderContractChangelog;

  if (!changelog) {
    report.check(
      false,
      'renderContract.renderContractChangelog is absent — the deliverable no longer ships the ' +
        'build manifest this gate checks against. Confirm the analyzer still emits it before ' +
        'removing this check.'
    );
    return { ok: report.ok, problems: report.problems };
  }

  // --- section order -------------------------------------------------------
  const order = pageOrder();
  const declared = changelog.sections_in_order ?? [];
  report.check(
    JSON.stringify(order) === JSON.stringify(declared),
    `page_order and renderContractChangelog.sections_in_order disagree.\n` +
      `  page_order:        ${JSON.stringify(order)}\n` +
      `  sections_in_order: ${JSON.stringify(declared)}`
  );

  for (const key of order) {
    report.check(
      assessment.sections?.[key],
      `page_order names section "${key}" but sections["${key}"] has no title/intro copy.`
    );
  }

  // --- charts --------------------------------------------------------------
  const charts = new Map((assessment.charts ?? []).map((c) => [c.id, c]));
  for (const declaredChart of changelog.charts ?? []) {
    const chart = charts.get(declaredChart.id);
    if (!report.check(chart, `Manifest declares chart "${declaredChart.id}" but charts[] has no such id.`)) {
      continue;
    }
    report.check(
      chart.placement === declaredChart.placement,
      `Chart "${chart.id}" is placed on "${chart.placement}" but the manifest says "${declaredChart.placement}".`
    );
    const hasUnits = (chart.units ?? []).length >= 2;
    report.check(
      hasUnits === Boolean(declaredChart.hasUnits),
      `Chart "${chart.id}" unit-toggle presence (${hasUnits}) disagrees with the manifest (${Boolean(declaredChart.hasUnits)}).`
    );
  }
  for (const chart of charts.values()) {
    report.check(
      (changelog.charts ?? []).some((c) => c.id === chart.id),
      `charts[] carries "${chart.id}", which the manifest does not list — it would render nowhere.`
    );
  }

  report.check(
    Boolean(changelog.has_hero_chart) === (assessment.charts ?? []).some((c) => c.placement === 'hero'),
    `has_hero_chart (${changelog.has_hero_chart}) disagrees with the actual chart placements.`
  );

  // --- tables --------------------------------------------------------------
  const tables = assessment.tables ?? [];
  for (const declaredTable of changelog.tables ?? []) {
    const table = tables.find((t) => t.id === declaredTable.id);
    if (!report.check(table, `Manifest declares table "${declaredTable.id}" but tables[] has no such id.`)) {
      continue;
    }
    report.check(
      table.placement === declaredTable.placement,
      `Table "${table.id}" is placed on "${table.placement}" but the manifest says "${declaredTable.placement}".`
    );
    report.check(
      (table.afterItem ?? null) === (declaredTable.afterItem ?? null),
      `Table "${table.id}" afterItem is ${JSON.stringify(table.afterItem ?? null)}, manifest says ${JSON.stringify(declaredTable.afterItem ?? null)}.`
    );
    report.check(
      (table.afterCard ?? null) === (declaredTable.afterCard ?? null),
      `Table "${table.id}" afterCard is ${JSON.stringify(table.afterCard ?? null)}, manifest says ${JSON.stringify(declaredTable.afterCard ?? null)}.`
    );
  }

  // An afterItem/afterCard that resolves to nothing is called out by the
  // contract as a skill bug rather than something to silently fall back from.
  const itemIds = new Set((assessment.topics ?? []).flatMap((t) => (t.changes ?? []).map((c) => c.id)));
  const cardIds = new Set((assessment.marketCards ?? []).map((m) => m.id));
  for (const table of tables) {
    if (table.afterItem) {
      report.check(
        itemIds.has(table.afterItem),
        `Table "${table.id}" anchors afterItem "${table.afterItem}", which is not a change id.`
      );
    }
    if (table.afterCard) {
      report.check(
        cardIds.has(table.afterCard),
        `Table "${table.id}" anchors afterCard "${table.afterCard}", which is not a market-card id.`
      );
    }
  }

  // --- market-card routing -------------------------------------------------
  // The contract enumerates every placement value emitted this build and asks
  // for an assertion that none is left unplaced.
  const renderable = new Set(changelog.renderable_placements ?? []);
  const sectionKeys = new Set(order);
  const topicAnchors = new Set((assessment.topics ?? []).map((t) => t.anchor));
  for (const card of assessment.marketCards ?? []) {
    report.check(
      renderable.has(card.placement),
      `Market card "${card.id}" is placed on "${card.placement}", which the manifest's ` +
        `renderable_placements does not list.`
    );
    const resolvable =
      sectionKeys.has(card.placement) || topicAnchors.has(card.placement) || itemIds.has(card.placement);
    report.check(
      resolvable,
      `Market card "${card.id}" placement "${card.placement}" resolves to no section, topic or item — ` +
        'it would be dropped from the page.'
    );
  }

  // --- topics --------------------------------------------------------------
  for (const topic of assessment.topics ?? []) {
    report.check(
      /^cat-[a-z0-9]+$/.test(topic.anchor ?? ''),
      `Topic "${topic.title}" has anchor "${topic.anchor}" — anchors are contracted to be short, ` +
        'stable, single-token cat-<token> slugs, and the routes are built from them.'
    );
  }

  // --- version stamp -------------------------------------------------------
  report.check(
    assessment.meta?.version && changelog.version === assessment.meta.version,
    `Version stamp disagreement: meta.version=${assessment.meta?.version}, ` +
      `renderContractChangelog.version=${changelog.version}.`
  );

  return { ok: report.ok, problems: report.problems };
}

/** Throwing wrapper for build-time use. */
export function assertRenderContract() {
  const { ok, problems } = verifyRenderContract();
  if (!ok) {
    throw new Error(
      `The vote guide data does not match the render contract it ships with:\n` +
        problems.map((p) => `  • ${p}`).join('\n')
    );
  }
}
