/**
 * Version ordering for the analyzer deliverable.
 *
 * Lives apart from the sync script because it is the one piece of that script
 * carrying real logic, and the script itself runs its whole job on import —
 * there is no way to reach inside it from a test. The rule it encodes is the
 * script's entire reason for existing: a guide must never silently roll
 * backwards to an older set of numbers.
 */

/**
 * Compares dot-separated integer versions.
 *
 * Deliberately not a full semver parser: the analyzer authors its version once,
 * in `SKILL.md` frontmatter, as plain MAJOR.MINOR.PATCH with no pre-release or
 * build metadata, and every output stamps that exact string. Accepting shapes
 * the producer cannot emit would mean guessing at an ordering nobody defined.
 *
 * @param {string} a
 * @param {string} b
 * @returns {-1 | 0 | 1} -1 when a < b, 1 when a > b, 0 when equal.
 */
export function compareVersions(a, b) {
  const parse = (v) => {
    const parts = String(v).split('.');
    if (!parts.every((p) => /^\d+$/.test(p))) {
      throw new Error(
        `assessment version: "${v}" is not a dot-separated integer version. ` +
          'The analyzer stamps MAJOR.MINOR.PATCH from its SKILL.md frontmatter; ' +
          'anything else means the deliverable came from somewhere unexpected.'
      );
    }
    return parts.map(Number);
  };

  const pa = parse(a);
  const pb = parse(b);

  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da !== db) return da < db ? -1 : 1;
  }
  return 0;
}
