/* ============================================================
   Site-wide configuration — brand, nav, external links, legal
   ------------------------------------------------------------
   Everything here was hardcoded inline across the export, in some
   cases inconsistently (see UNION_REP_PHONE below). One definition
   each, consumed everywhere.
   ============================================================ */

export const SITE = {
  name: 'Blue Streak Hangar',
  url: 'https://bluestreakhangar.com',
  tagline: 'PSA Flight Attendants · Crew Hub',
  description:
    'Non-rev commuting, your CBA in plain language, crew discounts at CLT, DCA, ' +
    'DFW & PHL, and gear that lasts. Written by PSA flight attendants, for PSA ' +
    'flight attendants.',
} as const;

/** Wordmark, split across two lines in the nav and footer. */
export const BRAND = {
  line1: 'Blue Streak',
  line2: 'HANGAR',
} as const;

export const FACEBOOK_GROUP = 'https://www.facebook.com/groups/bluestreakhangar';

/**
 * Union Rep Assistance.
 *
 * The export shipped TWO different numbers: 844-423-2232 on the contract page
 * and 1.844.433.2232 on the commuting page (digits 3 and 4 transposed).
 * Confirmed correct value is 844-423-2232. Single definition so the two pages
 * cannot drift again.
 */
export const UNION_REP_PHONE = {
  display: '844-423-2232',
  href: 'tel:+18444232232',
} as const;

export const EXTERNAL = {
  flyzed: 'https://www.flyzed.info',
} as const;

/** A page living under a nav section, e.g. the CBA Field Manual under Contract. */
export interface NavChild {
  label: string;
  href: string;
}

/** Primary navigation. `href` doubles as the active-state key. */
export interface NavItem {
  label: string;
  href: string;
  /**
   * Bar-only label, for the rare item whose full label is too long for the
   * width-constrained header. Only "Your Contract" needs one now: the labels
   * below dropped their "Crew " prefix, which was doing no disambiguating
   * work on a site that is entirely for crew, and every other label is now
   * short enough to render identically everywhere.
   */
  short?: string;
  /**
   * Sub-pages of this section. Drives the SectionNav tab strip on the section's
   * pages and keeps the sub-structure in the same tree as the nav itself —
   * there is no second registry of what belongs to a section.
   */
  children?: NavChild[];
}

export const NAV: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Commuting', href: '/commuting/' },
  {
    label: 'Your Contract',
    href: '/contract/',
    short: 'Contract',
    children: [
      { label: 'CBA Field Manual', href: '/contract/field-manual/' },
      { label: 'Reserve Field Guide', href: '/contract/reserve-guide/' },
    ],
  },
  { label: 'Discounts', href: '/crew-discounts/' },
  { label: 'Essentials', href: '/crew-essentials/' },
  { label: 'Tools', href: '/tools/' },
];

/** Standing disclaimers. Carried verbatim from the export. */
export const DISCLAIMER = {
  footer:
    "Guides assist you and don't carry protections — always confirm with your " +
    'supervisor or union rep.',
  contract:
    "These are plain-language summaries to help you — they don't carry " +
    'protections. Always confirm current terms and LOA status with your ' +
    'Inflight Supervisor or LEC officers.',
  /**
   * FTC affiliate disclosure. The export linked to Amazon with
   * rel="noopener sponsored" but displayed no disclosure anywhere, which is a
   * compliance gap the moment those links carry associate tags.
   */
  affiliate:
    'Some links on this page are affiliate links. If you buy through them we may ' +
    'earn a small commission at no extra cost to you. It never changes what we ' +
    'recommend — these are the picks crew actually use.',
} as const;
