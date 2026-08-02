/* ============================================================
   Your Contract — plain-language CBA reference cards
   ------------------------------------------------------------
   Ported verbatim from the export's contractual page. `bold`
   segments in the source were inline <b> tags; they are marked up
   with **double asterisks** here and rendered by the page, so the
   copy stays readable as data instead of embedded HTML.
   ============================================================ */

export interface ContractCard {
  title: string;
  /** CBA section reference shown under the title, e.g. "§7". */
  ref: string;
  icon: string;
  /** CSS custom-property value driving the card accent. */
  accent: string;
  points: string[];
  /**
   * EXACT title of the CBA Field Manual section this card summarizes. The
   * contract page derives the deep-link anchor from it and fails the build if
   * no manual section carries this title, so the link cannot silently rot.
   */
  section: string;
}

export const contractCards: ContractCard[] = [
  {
    title: 'Duty & Rest',
    ref: '§7',
    icon: 'ph-clock',
    accent: 'var(--navy-700)',
    points: [
      '**15 hrs** hard max duty between rest — never exceed.',
      '**10 hrs** minimum rest between duty periods.',
      'No contact during rest for scheduling changes (§8.N.3).',
    ],
    section: 'Duty Time & Rest Limits',
  },
  {
    title: 'Scheduling',
    ref: '§8',
    icon: 'ph-calendar-check',
    accent: 'var(--red-600)',
    points: [
      'Final awards post the **21st · 1700 ET** — you own that line.',
      'Junior assignment: reverse seniority, **1.5× pay**, max 3/mo.',
      'Days off dropped below minimum must be restored.',
    ],
    section: 'Scheduling Rights',
  },
  {
    title: 'Pay Protections',
    ref: '§3',
    icon: 'ph-money',
    accent: 'var(--gold-600)',
    points: [
      '**75-hr** monthly guarantee when available all month.',
      'Minimum day pay: greater of actual or **3.5 hrs**.',
      'Report a pay error in writing within **5 business days**.',
    ],
    section: 'Pay Protections',
  },
  {
    title: 'Reserve Rights',
    ref: '§9',
    icon: 'ph-phone-call',
    accent: 'var(--sky-700)',
    points: [
      '**Long-call:** 12-hr notice before first assignment.',
      "**Short-call:** report 2 hrs; first-day RAP can't change without consent.",
      'FOLO preference: submit **72 hrs** before your block.',
    ],
    section: 'Reserve Rights',
  },
  {
    title: 'Sick & Vacation',
    ref: '§4 · §5',
    icon: 'ph-first-aid',
    accent: 'var(--success-600)',
    points: [
      'Sick accrues **3.5 hrs/mo**; only you can call yourself sick.',
      'Vacation earned by longevity — up to **5 weeks**.',
      'Not required to share your whereabouts on vacation.',
    ],
    section: 'Sick Leave & Vacation',
  },
  {
    title: 'Grievances',
    ref: '§16 · §24',
    icon: 'ph-gavel',
    accent: 'var(--navy-900)',
    points: [
      'No discipline without an investigatory meeting + rep.',
      'File within **15 days** (discipline) / **30 days** (contract).',
      'The **contract prevails** over conflicting Company policy (§24.F).',
    ],
    section: 'Grievances & Discipline',
  },
];

/**
 * The contract-status panel in the masthead's second column.
 *
 * This is live status content, not structure: edit the rows as real news
 * lands (afapsa.org/negotiations/ is the primary source), and set
 * `show: false` if the situation ever goes quiet enough that a status
 * panel would just be noise.
 *
 * Current state (verified Aug 2026): the Feb 19 TA was rejected ~60/40 in
 * the vote that closed Mar 6, 2026. The 2019 CBA remains in force and AFA
 * is back in negotiations ("TA2"); no new agreement or vote is scheduled.
 */
export const taPanel = {
  show: true,
  flagIcon: 'ph-scales',
  flag: 'TA voted down · back at the table',
  heading: 'The 2026 TA was rejected.',
  headingAccent: 'AFA is negotiating TA2 now.',
  rows: [
    { k: 'Vote result', v: '60% no · Mar 6', live: true },
    { k: 'Contract today', v: '2019 CBA stays in force' },
    { k: 'TA2 status', v: 'In negotiations' },
  ],
  ctaLabel: 'What was in the TA',
} as const;

/** Standing callouts on the contract page. */
export const contractCallouts = {
  sectionKey:
    '**"§" means Section of the CBA.** For example, **§7.D.5** is Section 7, ' +
    'paragraph D, subpart 5 — so you can look it up or cite it directly.',
  investigatory:
    "**Called into a meeting with management?** The Company can't issue discipline " +
    'with pay loss, a final warning, or discharge without an investigatory meeting ' +
    'where you have representation. **Call the union before you sit down.**',
} as const;
