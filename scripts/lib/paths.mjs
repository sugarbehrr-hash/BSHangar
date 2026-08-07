/**
 * Where this repo's directories are — resolved once, from this file outward.
 *
 * WHY THIS EXISTS
 *
 * Build scripts used to name their inputs as bare relative strings: `'dist'`,
 * `'src/data/site.ts'`, `'node_modules/@phosphor-icons/core/assets'`. Those are
 * resolved against the process's working directory, not against the repo, so
 * every one of them was really an unwritten assumption that the script is only
 * ever run from the root by `npm run`.
 *
 * That assumption failed the first time the build ran from a git worktree —
 * which shares the main checkout's node_modules instead of duplicating it —
 * and gen-icons reported all 121 icons as misspelled. The report named a cause
 * that did not exist, which is the expensive part: a script that cannot find
 * its inputs should say so, not blame the inputs.
 *
 * Anchoring to `import.meta.url` makes location a property of the file rather
 * than of however it was invoked. A script can then be run from anywhere — a
 * subdirectory, an editor task, a worktree, a CI step that cd'd somewhere first
 * — and read and write exactly the same files.
 *
 * ONE DEFINITION, NOT TWELVE
 *
 * Five scripts already anchored correctly, each carrying its own copy of
 * `resolve(dirname(fileURLToPath(import.meta.url)), '..')`. Copies drift: the
 * moment one script moves into a subdirectory, its `'..'` is wrong and nothing
 * says so. The root is defined here and nowhere else.
 */

import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The repo root. This file lives in scripts/lib/, so up two. */
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** Build an absolute path from the repo root: fromRoot('src', 'data') */
export const fromRoot = (...segments) => join(ROOT, ...segments);

/** The directories more than one script needs. Anything narrower stays local. */
export const SRC = fromRoot('src');
export const PUBLIC = fromRoot('public');
export const DIST = fromRoot('dist');
export const SCRIPTS = fromRoot('scripts');

/**
 * A path as a human should read it: relative to the repo, forward slashes.
 *
 * Paths are absolute internally so they cannot depend on the working directory,
 * but an absolute path in a build log is noise — it buries the part that
 * identifies the file under a prefix that is the same on every line and
 * different on every machine. This is display only; never feed it back to fs.
 */
export const forDisplay = (path) => relative(ROOT, path).split(sep).join('/');
