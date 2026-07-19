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
  },
];

/** The featured 2026 Tentative Agreement banner at the top of /contract/. */
export const taBanner = {
  flag: 'On the table now · 2026 TA',
  headline: 'A tentative agreement is out.',
  headlineAccent: 'Read it before you vote.',
  body:
    'An independent, plain-language look at the PSA AFA 2026 Tentative Agreement — ' +
    'what you have today, what would change, and what it actually means for your ' +
    'paycheck, reserve life and schedule. It does not tell you how to vote.',
  note: 'Built from the contract itself and public filings — not a union or company summary.',
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
