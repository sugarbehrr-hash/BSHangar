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
  variant: 'primary' | 'gold' | 'navy';
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
    format: 'PDF · full text · print-ready',
    blurb:
      'Every provision above in full, plus the rest — duty & rest, pay, scheduling, ' +
      'reserve, sick, vacation and grievances, each sourced to the CBA and the LOAs.',
    icon: 'ph-scroll',
    accent: 'var(--navy-700)',
    kind: 'generated',
    links: [
      { label: 'Download PDF', href: '/print/contract-field-manual/', variant: 'gold', icon: 'ph-file-pdf' },
    ],
  },
  {
    id: 'reserve-field-guide',
    title: 'Reserve Field Guide',
    format: 'PDF · full text · print-ready',
    blurb:
      'Short-call reserve, SCR, the duty clock and rest rules — the whole §7 & §9 ' +
      'reference for reserve life, in plain language.',
    icon: 'ph-phone-call',
    accent: 'var(--sky-700)',
    kind: 'generated',
    links: [
      { label: 'Download PDF', href: '/print/reserve-field-guide/', variant: 'gold', icon: 'ph-file-pdf' },
    ],
  },
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
      { label: 'Read', href: '/contract/2026-ta-vote-guide/', variant: 'primary', icon: 'ph-book-open' },
      { label: 'PDF', href: '/contract/2026-ta-report/', variant: 'gold', icon: 'ph-file-pdf' },
    ],
  },
];


/** Shown in "Take the guide with you" on /commuting/. */
export const commutingResources: Resource[] = [
  {
    id: 'commuting-guide',
    title: 'Commuting Guide',
    format: 'PDF · full text · print-ready',
    blurb:
      'The whole program in full — listing, the four steps, commute-fail protections, ' +
      "dress guidelines and the pro tips that don't fit on a page.",
    icon: 'ph-airplane-takeoff',
    accent: 'var(--sky-700)',
    kind: 'generated',
    links: [
      { label: 'Download PDF', href: '/print/commuting-guide/', variant: 'gold', icon: 'ph-file-pdf' },
    ],
  },
  {
    id: 'how-to-list',
    title: 'How to List, by Airline',
    format: 'PDF · step-by-step · print-ready',
    blurb:
      'Screen-by-screen listing for every carrier we have an agreement with, including ' +
      'which system to use and what to enter.',
    icon: 'ph-list-numbers',
    accent: 'var(--navy-700)',
    kind: 'generated',
    // TODO: this has no artifact of its own yet — the listing tables live inside
    // the commuting guide, so it points there until one is authored.
    links: [
      { label: 'Download PDF', href: '/print/commuting-guide/', variant: 'gold', icon: 'ph-file-pdf' },
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
