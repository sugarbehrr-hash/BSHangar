import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Vite resolves `root` — and therefore `include` — against the process's
  // working directory unless told otherwise, so `vitest` run from any
  // subdirectory found the config by walking up and then looked for tests/
  // beside wherever the shell happened to be. It reported "No test files
  // found" and exited 1, which reads as a broken suite rather than a bad cwd.
  // Anchoring to this file makes the suite the same suite from anywhere.
  root: dirname(fileURLToPath(import.meta.url)),

  test: {
    // Scoped deliberately to tests/. Astro owns src/, and a stray *.test.ts in
    // a component directory should not silently join the rules suite.
    include: ['tests/**/*.spec.mjs'],
    // The Firestore emulator is a single shared process with one datastore.
    // Parallel files would clear each other's seeded documents mid-assertion.
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 30000,
  },
});
