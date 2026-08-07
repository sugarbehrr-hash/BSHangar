/**
 * The version stamped into the service worker.
 *
 * WHAT THIS HAS TO GET RIGHT
 *
 * sw.template.js names its cache `bsh-${VERSION}` and its activate handler
 * deletes every cache that is not that name. So the version is not a label —
 * it is the instruction to throw away the reader's entire offline copy and
 * download 8.24 MB again. Two rules follow, and they pull against each other:
 *
 *   changed content  -> the version MUST move, or a reader keeps being served
 *                       a deploy that no longer exists.
 *   unchanged content -> the version MUST NOT move, or every reader re-downloads
 *                       the whole site over hotel wifi for nothing.
 *
 * WHY THIS IS NOT JUST "HASH DIST"
 *
 * Hashing every byte of dist/ satisfies the first rule and quietly breaks the
 * second, because not every byte in dist/ is a property of the site. Building
 * the same commit on macOS and on the CI runner produces a byte-identical tree
 * — every page, every hashed asset, all 43 OG cards — except for Pagefind's
 * output, which differs on both platforms:
 *
 *   wasm.en.pagefind        72,740 bytes on darwin-arm64, 72,209 on linux-x64
 *   index/en_*.pf_index     five chunks, each a few bytes apart
 *   pagefind-entry.json     differs only in the language's content hash
 *
 * Pagefind is perfectly deterministic on one platform — three runs here gave
 * byte-identical output — so this is the platform binary, not the tool being
 * unstable. It is upstream and not ours to fix.
 *
 * The consequence was that the version described the machine that ran the build
 * rather than the site: the same commit fingerprinted f9522a31d67f locally and
 * 9b9cbba97bf4 in CI. Only CI deploys, so no reader was ever affected — but it
 * meant a local build could not be used to confirm that a change ships no dist
 * difference, which is exactly the question worth asking before a deploy, and a
 * deploy from anywhere but CI would have wiped every reader's cache for nothing.
 *
 * WHY DROPPING PAGEFIND'S BYTES IS SAFE
 *
 * The index is derived, not authored: Pagefind builds it from the HTML already
 * in dist/. It indexes only pages carrying `data-pagefind-body` — 43 of the 67
 * HTML files in the tree — and every one of those 43 is itself precached and
 * hashed below. So a change to anything the index describes always reaches the
 * version through the page it came from. The chunk bytes carry no signal the
 * page bytes have not already carried.
 *
 * The one case they would have caught on their own is Pagefind itself changing
 * — a version bump or a config change — with every page left untouched. That is
 * why the entry manifest is still folded in, minus the one field that moves per
 * platform: `version`, `page_count` and `include_characters` are all stable
 * across the two builds compared above, and all three move when Pagefind's
 * behaviour actually changes.
 */

import { createHash } from 'node:crypto';

/** Pagefind writes everything under this one directory, relative to dist/. */
const PAGEFIND_PREFIX = 'pagefind/';

/** Its manifest — the only Pagefind file with a platform-stable identity. */
const PAGEFIND_ENTRY = 'pagefind/pagefind-entry.json';

/**
 * Serialise with keys in sorted order at every depth.
 *
 * Written out rather than reached for via JSON.stringify's replacer argument:
 * an array replacer is an allowlist that applies at EVERY level, so passing the
 * top-level keys silently empties every nested object. Here that turned
 * `languages` into `{}` and threw away `page_count` — quietly deleting the one
 * signal the manifest is folded in to preserve.
 */
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const body = Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
      .join(',');
    return `{${body}}`;
  }
  return JSON.stringify(value);
}

/**
 * The manifest, minus the per-language content hash — the only field that
 * differs between two builds of the same commit. Dropping it is what makes the
 * rest usable; keeping the rest is what still catches a Pagefind upgrade.
 */
function stableEntry(json) {
  const parsed = JSON.parse(json);
  const languages = Object.fromEntries(
    Object.entries(parsed.languages ?? {}).map(([lang, meta]) => {
      const { hash, ...rest } = meta;
      return [lang, rest];
    }),
  );
  return canonical({ ...parsed, languages });
}

/**
 * Fingerprint the precache.
 *
 * `files` is [{ rel, bytes }] where `rel` is the path relative to dist/, using
 * forward slashes, in the same order the precache manifest lists them.
 */
export function fingerprint(files) {
  const hash = createHash('sha256');

  for (const { rel, bytes } of files) {
    if (rel.startsWith(PAGEFIND_PREFIX)) continue;
    hash.update(rel);
    hash.update(bytes);
  }

  // Folded in under a fixed key rather than under its real filename, so this
  // contributes the same way whether or not the manifest moves.
  const entry = files.find((f) => f.rel === PAGEFIND_ENTRY);
  if (entry) {
    hash.update(PAGEFIND_ENTRY);
    hash.update(stableEntry(entry.bytes.toString('utf8')));
  }

  return hash.digest('hex').slice(0, 12);
}
