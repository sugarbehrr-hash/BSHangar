/**
 * Runs the analyzer's deliverable in Node, at build time.
 *
 * WHY THIS EXISTS
 * The TA vote guide's content, chart drawing and card design language are all
 * authored outside this repo: `assessment.data.js` and `assessment-charts.js`
 * come from the contract-vote-analyzer skill, and `card-render.js` is the
 * shared card language the guide, the report and the inbox all render through.
 * The design handoff is explicit that this site is the DISPLAY layer only — it
 * owns layout, never the numbers and never the chart drawing.
 *
 * Until now that meant shipping all three files to the browser and letting a
 * design-system runtime assemble the page on the reader's phone: ~236KB of
 * JavaScript before a single word appeared. But none of the three actually
 * needs a DOM. They are string builders:
 *
 *   assessment.data.js    assigns window.ASSESSMENT — pure data
 *   assessment-charts.js  window.AssessmentChart(spec, opts) -> SVG string
 *   card-render.js        window.VoteCard.*(entry, ctx)      -> HTML string
 *
 * So they are evaluated HERE instead, in a VM sandbox whose only global is a
 * plain `window` object, and the guide is rendered to static HTML at build
 * time. Readers get markup; the runtime stays on the build machine.
 *
 * `document` is deliberately NOT provided. card-render.js guards its one
 * module-scope DOM touch with `typeof document === "undefined"` (the mobile
 * container-query stylesheet it injects for its own cards), so leaving it
 * undefined is what makes that guard fire. Everything else it touches lives
 * inside click handlers that only ever run in a browser.
 */

import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

/**
 * The three vendored files, in dependency order.
 *
 * They live at the repo root because that is where `scripts/sync-vote-guide.mjs`
 * already treats them as the source of truth — it copies them from here into
 * `public/contract/_assets/` for the vendored document. Reading the same files
 * rather than keeping a second copy under `src/` is what stops the two renders
 * of this data from drifting apart, which has happened before: four copies of
 * `assessment.data.js` at three different versions across two repositories.
 *
 * Order matters. card-render.js reads `window.ASSESSMENT` at module scope to
 * build its chart registry, so the data has to be in place before it evaluates.
 */
export const SOURCES = Object.freeze([
  'assessment.data.js',
  'assessment-charts.js',
  'card-render.js',
]);

/**
 * Evaluates the deliverable and returns the globals it defines.
 *
 * Each call builds a fresh sandbox: the caller decides whether to cache (see
 * ./index.mjs), and tests need to be able to load a doctored copy without
 * poisoning every later import.
 *
 * @param {object} [options]
 * @param {string} [options.root] Directory holding the three source files.
 * @returns {{assessment: object, chart: Function, chartUnits: Function, cards: object}}
 */
export function loadAssessmentRuntime({ root = ROOT } = {}) {
  const sandbox = { window: {} };
  // Some bundled builds of these files feature-detect via globalThis rather
  // than a bare identifier; point it at the sandbox so both spellings agree.
  sandbox.globalThis = sandbox;
  const context = createContext(sandbox);

  for (const file of SOURCES) {
    const path = join(root, file);
    let source;
    try {
      source = readFileSync(path, 'utf8');
    } catch (cause) {
      throw new Error(
        `assessment runtime: cannot read "${file}" at ${path}. ` +
          'It is part of the analyzer deliverable — run `node scripts/sync-assessment.mjs` ' +
          'to refresh it from TA-Analyzer.',
        { cause }
      );
    }

    try {
      runInContext(source, context, { filename: file });
    } catch (cause) {
      throw new Error(
        `assessment runtime: "${file}" threw while evaluating in Node. ` +
          'These files must stay DOM-free string builders; if a new export ' +
          'reaches for document/window APIs, the static render cannot run.',
        { cause }
      );
    }
  }

  const { ASSESSMENT, AssessmentChart, AssessmentChartUnits, VoteCard } = sandbox.window;

  if (!ASSESSMENT || typeof ASSESSMENT !== 'object') {
    throw new Error('assessment runtime: assessment.data.js did not set window.ASSESSMENT.');
  }
  if (typeof AssessmentChart !== 'function') {
    throw new Error('assessment runtime: assessment-charts.js did not set window.AssessmentChart.');
  }
  if (!VoteCard || typeof VoteCard.changeCard !== 'function') {
    throw new Error('assessment runtime: card-render.js did not set a usable window.VoteCard.');
  }

  return {
    assessment: ASSESSMENT,
    chart: AssessmentChart,
    chartUnits: typeof AssessmentChartUnits === 'function' ? AssessmentChartUnits : (spec) => spec.units ?? [],
    cards: VoteCard,
  };
}
