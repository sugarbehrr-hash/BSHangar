/**
 * Bundles the reader-feedback layer into public/contract/_assets/.
 *
 * TWO ARTIFACTS, ON PURPOSE
 *
 *   guide-feedback.js      IIFE, loaded by every reader of the guide.
 *                          CSS, strips, interactions, and the durable outbox.
 *                          Works with the network down.
 *
 *   guide-feedback-net.js  ESM, pulled by a dynamic import the first time
 *                          somebody actually answers something. Carries the
 *                          Firebase SDK.
 *
 * The guide is read on airport wifi between legs by people looking up one fact
 * under time pressure. Putting the SDK on the critical path would tax every
 * reader for a feature only a fraction use. The split keeps page load at a few
 * KB and defers the rest to the moment it is genuinely needed.
 *
 * The dynamic import in store.js resolves its URL at runtime from
 * document.currentScript, so esbuild cannot (and must not) inline it — that is
 * what keeps these two builds independent rather than silently re-merged.
 *
 * Run: node scripts/build-guide-feedback.mjs   (wired into predev and build)
 */

import { build } from 'esbuild';
import { mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { ROOT } from './lib/paths.mjs';

const SRC = join(ROOT, 'src/guide/feedback');
const OUT = join(ROOT, 'public/contract/_assets');

// Matches the browsers the rest of the guide already assumes: the document
// relies on optional chaining, CSS custom properties and dynamic import.
const TARGET = ['es2022', 'chrome100', 'safari15', 'firefox100'];

mkdirSync(OUT, { recursive: true });

const shared = {
  bundle: true,
  minify: true,
  target: TARGET,
  legalComments: 'none',
  logLevel: 'warning',
};

await build({
  ...shared,
  entryPoints: [join(SRC, 'index.js')],
  outfile: join(OUT, 'guide-feedback.js'),
  format: 'iife',
});

await build({
  ...shared,
  entryPoints: [join(SRC, 'net.js')],
  outfile: join(OUT, 'guide-feedback-net.js'),
  format: 'esm',
});

const kb = (file) => `${(statSync(join(OUT, file)).size / 1024).toFixed(1)} KB`;

process.stdout.write(
  `build-guide-feedback: guide-feedback.js ${kb('guide-feedback.js')} (always loaded), ` +
    `guide-feedback-net.js ${kb('guide-feedback-net.js')} (lazy)\n`
);
