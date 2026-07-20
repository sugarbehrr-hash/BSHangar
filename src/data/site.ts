/* ============================================================
   Site-wide configuration — brand, nav, external links, legal
   ------------------------------------------------------------
   Everything here was hardcoded inline across the export, in some
   cases inconsistently (see UNION_REP_PHONE below). One definition
   each, consumed everywhere.
   ============================================================ */

export const SITE = {
  name: 'Blue Streak Hangar',
  /** Full legal name used in the footer copyright line. */
  legalName: 'Blue Streak, Junior & Senior Hangar',
  url: 'https://bluestreakhangar.com',
  tagline: 'PSA Flight Attendants · Jr & Sr Hangar',
  description:
    'Non-rev commuting, your CBA in plain language, crew discounts at CLT, DCA, ' +
    'DFW & PHL, and gear that lasts. Written by PSA flight attendants, for PSA ' +
    'flight attendants.',
} as const;

/** Wordmark, split across two lines in the nav and footer. */
export const BRAND = {
  line1: 'Blue Streak',
  line2: 'JR & SR HANGAR',
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

/** Primary navigation. `href` doubles as the active-state key. */
export interface NavItem {
  label: string;
  href: string;
  /**
   * Bar-only label. The header is width-constrained — seven full labels need
   * 1374px, which collapses the bar to a burger on an ordinary 1280px laptop.
   * The footer and the 404 destination list are not constrained and keep the
   * full `label`, where the extra words genuinely help.
   */
  short?: string;
}

export const NAV: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'New Here', href: '/new-here/' },
  { label: 'Commuting', href: '/commuting/' },
  { label: 'Your Contract', href: '/contract/', short: 'Contract' },
  { label: 'Crew Discounts', href: '/crew-discounts/', short: 'Discounts' },
  { label: 'Crew Essentials', href: '/crew-essentials/', short: 'Essentials' },
  { label: 'Crew Tools', href: '/tools/', short: 'Tools' },
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
