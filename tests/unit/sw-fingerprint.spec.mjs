/**
 * The service worker's version is not a label — sw.template.js names its cache
 * `bsh-${VERSION}` and deletes every cache that is not that name, so moving it
 * throws away the reader's whole offline copy and re-downloads 8.24 MB.
 *
 * These tests pin both directions of that, because only one of them fails
 * loudly. A version that fails to move when content changes strands readers on
 * a deploy that no longer exists; a version that moves when nothing changed
 * costs everyone a full re-download over hotel wifi and looks like nothing at
 * all from the inside.
 *
 * Run: npm run test:unit
 */

import { describe, expect, it } from 'vitest';

import { fingerprint } from '../../scripts/lib/precache-fingerprint.mjs';

const bytes = (s) => Buffer.from(s, 'utf8');

/** The Pagefind manifest, in the shape the real one has. */
const entry = ({ hash = 'en_6895c6cead', version = '1.5.2', pageCount = 43 } = {}) =>
  JSON.stringify({
    version,
    languages: { en: { hash, wasm: 'en', page_count: pageCount } },
    include_characters: ['_', '‿'],
  });

/** A dist tree: real content plus Pagefind's derived output. */
const tree = ({
  page = '<html>pay</html>',
  asset = 'body{}',
  chunk = 'INDEX-CHUNK-BYTES',
  chunkName = 'pagefind/index/en_3b5f5eb.pf_index',
  wasm = 'WASM-BYTES',
  manifest = entry(),
} = {}) => [
  { rel: '404.html', bytes: bytes('<html>404</html>') },
  { rel: '_astro/global.ABC123.css', bytes: bytes(asset) },
  { rel: 'contract/2026-ta-vote-guide-v2/pay/index.html', bytes: bytes(page) },
  { rel: chunkName, bytes: bytes(chunk) },
  { rel: 'pagefind/pagefind-entry.json', bytes: bytes(manifest) },
  { rel: 'pagefind/wasm.en.pagefind', bytes: bytes(wasm) },
];

describe('what must NOT move the version', () => {
  it('is stable for the same tree', () => {
    expect(fingerprint(tree())).toBe(fingerprint(tree()));
  });

  it('ignores Pagefind index bytes, chunk names and wasm — the platform difference', () => {
    // Exactly what building the same commit on macOS vs the CI runner produced:
    // every page and asset identical, every Pagefind byte slightly different.
    const darwin = tree();
    const linux = tree({
      chunk: 'INDEX-CHUNK-BYTES-BUT-COMPRESSED-DIFFERENTLY',
      chunkName: 'pagefind/index/en_194bbce.pf_index',
      wasm: 'WASM-BYTES-BUILT-FOR-LINUX',
      manifest: entry({ hash: 'en_301bebcadc' }),
    });
    expect(fingerprint(linux)).toBe(fingerprint(darwin));
  });

  it('ignores where the Pagefind files sit in the list', () => {
    // Content order is significant and gen-sw sorts to fix it; Pagefind's
    // position is not, since its chunk names move between platforms and would
    // otherwise re-sort the list around them.
    const t = tree();
    const content = t.filter((f) => !f.rel.startsWith('pagefind/'));
    const pagefind = t.filter((f) => f.rel.startsWith('pagefind/'));
    expect(fingerprint([...pagefind.reverse(), ...content])).toBe(fingerprint(t));
  });
});

describe('what MUST move the version', () => {
  it('moves when a page changes', () => {
    expect(fingerprint(tree({ page: '<html>pay, revised</html>' }))).not.toBe(fingerprint(tree()));
  });

  it('moves when a hashed asset changes', () => {
    expect(fingerprint(tree({ asset: 'body{color:red}' }))).not.toBe(fingerprint(tree()));
  });

  it('moves when a file is added or removed', () => {
    const extra = [...tree(), { rel: 'commuting/index.html', bytes: bytes('<html>c</html>') }];
    expect(fingerprint(extra)).not.toBe(fingerprint(tree()));
  });

  it('moves when Pagefind itself is upgraded, even with every page untouched', () => {
    // The one thing the index bytes would have caught on their own. The
    // manifest is folded in precisely so this still registers.
    expect(fingerprint(tree({ manifest: entry({ version: '1.6.0' }) })))
      .not.toBe(fingerprint(tree()));
  });

  it('moves when the indexed page count changes', () => {
    // Guards the nested-key bug: JSON.stringify's array replacer is an
    // allowlist that applies at every depth, so normalising the manifest with
    // it emptied `languages` and silently discarded page_count.
    expect(fingerprint(tree({ manifest: entry({ pageCount: 44 }) })))
      .not.toBe(fingerprint(tree()));
  });
});

describe('a tree with no search index at all', () => {
  it('fingerprints without throwing', () => {
    const noPagefind = tree().filter((f) => !f.rel.startsWith('pagefind/'));
    expect(fingerprint(noPagefind)).toMatch(/^[a-f0-9]{12}$/);
    // And is not confused with a tree that does have one.
    expect(fingerprint(noPagefind)).not.toBe(fingerprint(tree()));
  });
});
