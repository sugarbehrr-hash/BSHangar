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
   * Phosphor icon name (e.g. "ph-house"), used by the mobile tab bar and the
   * "More" sheet — the desktop nav is text-only and ignores this.
   */
  icon: string;
}

export const NAV: NavItem[] = [
  { label: 'Home', href: '/', icon: 'ph-house' },
  { label: 'Commuting', href: '/commuting/', icon: 'ph-airplane-takeoff' },
  { label: 'Your Contract', href: '/contract/', short: 'Contract', icon: 'ph-scroll' },
  { label: 'Discounts', href: '/crew-discounts/clt/', icon: 'ph-tag' },
  { label: 'Essentials', href: '/crew-essentials/', icon: 'ph-suitcase-rolling' },
  { label: 'Tools', href: '/tools/', icon: 'ph-calculator' },
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
