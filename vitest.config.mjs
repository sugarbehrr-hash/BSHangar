import { defineConfig } from 'vitest/config';

// Scoped deliberately to tests/. Astro owns src/, and a stray *.test.ts in a
// component directory should not silently join the rules suite.
export default defineConfig({
  test: {
    include: ['tests/**/*.spec.mjs'],
    // The Firestore emulator is a single shared process with one datastore.
    // Parallel files would clear each other's seeded documents mid-assertion.
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 30000,
  },
});
