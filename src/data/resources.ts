import { bases } from './bases';

/* ============================================================
   Resource registry — guides and printable artifacts
   ------------------------------------------------------------
   One entry per document. This registry drives BOTH the resource
   cards on /contract/ and /commuting/ AND the print routes under
   /print/, so a URL change happens in exactly one place.

   `kind` distinguishes how a resource is produced:
     'generated'  built by this site from src/data (Phase 5)
     'vendored'   an artifact produced elsewhere and served as-is.
                  Today that is only the TA vote guide + report,
                  which come out of the contract-vote-analyzer
                  pipeline. See scripts/sync-vote-guide.mjs.
   ============================================================ */

export interface ResourceLink {
  label: string;
  href: string;
  /** Button variant from the design system. */
  variant: 'red' | 'gold' | 'navy';
  icon: string;
}

export interface Resource {
  id: string;
  title: string;
  /** Format line under the title, e.g. "Field manual · print / PDF". */
  format: string;
  blurb: string;
  icon: string;
  accent: string;
  kind: 'generated' | 'vendored';
  links: ResourceLink[];
}

/** Shown in "The full references" on /contract/. */
export const contractResources: Resource[] = [
  {
    id: 'cba-field-manual',
    title: 'CBA Field Manual',
    format: 'Field manual · print / PDF',
    blurb:
      'The full section-by-section reference — duty & rest, pay, scheduling, ' +
      'reserve and grievances, each sourced to the CBA.',
    icon: 'ph-scroll',
    accent: 'var(--navy-700)',
    kind: 'generated',
    links: [
      {
        label: 'Open manual',
        href: '/print/contract-field-manual/',
        variant: 'navy',
        icon: 'ph-book-open',
      },
    ],
  },
  // TODO Reserve Field Guide — deliberately NOT listed yet.
  //
  // Its content lives in the export's scr-reserve template (28KB of long-form
  // prose on short-call reserve, SCR, the duty clock and rest rules) and has
  // not been ported into src/data. Listing the card now would either dead-end
  // on a 404 or point at a stub pretending to be the guide, and a page that
  // looks like a contract reference but isn't one is worse than an absent link.
  // Restore this entry in the same commit that lands the content.
  {
    id: 'ta-vote-guide',
    title: '2026 TA Vote Guide',
    format: 'Web guide + PDF report',
    blurb:
      'The independent side-by-side of today vs. the proposed 2026 agreement — ' +
      'read it online or download the full report.',
    icon: 'ph-scales',
    accent: 'var(--red-600)',
    kind: 'vendored',
    links: [
      { label: 'Read', href: '/contract/2026-ta-vote-guide/', variant: 'red', icon: 'ph-book-open' },
      { label: 'PDF', href: '/contract/2026-ta-report/', variant: 'gold', icon: 'ph-file-pdf' },
    ],
  },
];

/**
 * Canonical URLs for the vendored vote-guide artifacts. Referenced by the TA
 * banner, the resource card above, and the redirect stubs that keep links
 * already shared to the Facebook group working after the move off the root.
 */
export const VOTE_GUIDE = {
  guide: '/contract/2026-ta-vote-guide/',
  report: '/contract/2026-ta-report/',
} as const;

/**
 * Printable flyer per base category, DERIVED from bases.ts.
 *
 * This was hardcoded, and it was already wrong: it listed three flyers for CLT
 * ("Meals", "Retail", "Dining") when the dataset has two categories, so one of
 * those links could never resolve. Same hand-maintained-registry problem as the
 * old search index, one layer down.
 *
 * The export shipped 11 separate flyer templates with overlapping content
 * because each was a hand-built document. One printable per category is the
 * shape the data actually has.
 */
export interface PrintFlyer {
  label: string;
  href: string;
}

export const baseFlyers: Record<string, PrintFlyer[]> = Object.fromEntries(
  bases.map((base) => [
    base.key,
    base.categories.map((category) => ({
      label: category.label,
      href: `/print/${base.key}/${category.key}/`,
    })),
  ])
);
