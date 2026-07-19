import type { Guide } from './types';

/**
 * CBA Field Manual — ported in full from the export's contractual-knowledge
 * template (11 sheets, ~3,450 words). The site previously shipped only the six
 * summary cards that /contract/ renders.
 *
 * Includes the three Letters of Agreement the export documented (2022 Quality
 * of Life, 2022 Flex Rates & Retention, 2023 DFW & Time Zones). Their status
 * matters: the 2022 QoL LOA expired July 23, 2023, and the guide says so
 * explicitly rather than presenting expired terms as current.
 */
export const contractGuide: Guide = {
  slug: 'contract-field-manual',
  title: 'CBA Field Manual',
  eyebrow: 'Field Reference · Collective Bargaining Agreement',
  subtitle: 'Know your rights. Use them. Protect each other.',
  intro:
    'A plain-language translation of the provisions that come up most on the line: duty and ' +
    'rest, scheduling, pay, reserve, sick and vacation, grievances, and the general protections ' +
    'people forget they have. Each item is sourced to its CBA section so you can cite it.',
  meta: {
    translates: 'Translates the FA CBA and the 2022–2023 Letters of Agreement',
    revised: 'This guide · last revised June 27, 2026',
  },
  contents: [
    { label: 'Duty Time & Rest Limits', ref: '§7' },
    { label: 'Scheduling Rights', ref: '§8' },
    { label: 'Pay Protections', ref: '§3' },
    { label: 'Reserve Rights', ref: '§9' },
    { label: 'Sick Leave & Vacation', ref: '§4 · §5' },
    { label: 'Grievances & Discipline', ref: '§16' },
    { label: 'General Protections', ref: '§24' },
    { label: 'Quality of Life', ref: 'LOA 2022' },
    { label: 'Flex Rates & Retention', ref: 'LOA 2022' },
    { label: 'DFW & Time Zones', ref: 'LOA 2023' },
  ],

  sections: [
    {
      title: 'Duty Time & Rest Limits',
      ref: '7',
      refLabel: 'Section 7 · Hours of Service',
      lead:
        'These numbers are hard contractual and FAR protections, not suggestions. If Crew ' +
        'Scheduling asks you to exceed them, **you have the right to refuse.**',
      blocks: [
        {
          kind: 'table',
          title: 'Duty & Block Time Limits',
          ref: '§7.A',
          head: ['Limit', 'Max'],
          rows: [
            ['Scheduled duty', '**14 hrs** · §7.A.1'],
            ['Duty between rest periods', '**15 hrs** · hard max, never exceed'],
            ['Block hours / duty period', '**9 hrs** · rescheduled; ≤2-segment exception'],
            ['Sections per trip', '**4 / 5** · 5 on holidays, N/A to reserves on RAP days'],
            ['CDO legs', '**4 legs** · Continuous Duty Overnight'],
            ['Block hours in 7 days', '**33 hrs** · rolling 7-day limit, §8.C.2'],
          ],
        },
        {
          kind: 'list',
          title: 'Rest Requirements',
          ref: '§7.B',
          items: [
            '**10 hrs** minimum rest between all duty periods (release-to-report).',
            'If the **FAR minimum** is more protective, the greater applies.',
            'Lineholder in domicile: **10 hrs** before next-calendar-day duty.',
          ],
        },
        {
          kind: 'list',
          title: 'Report & Release',
          ref: '§7.C',
          items: [
            'Report **45 min** before scheduled departure (30 min if deadhead-start).',
            'Taxi before block-out: report **60 min** before block-out.',
            'Release **15 min** after block-in (domestic) / **30 min** (international).',
          ],
        },
        {
          kind: 'note',
          tone: 'ok',
          text:
            '**Your rest is protected.** The Company may NOT contact you during minimum rest for ' +
            'scheduling changes, except the first or last hour of rest, or a family emergency. (§8.N.3)',
        },
        {
          kind: 'list',
          title: 'Your Days Off',
          ref: '§7.D',
          items: [
            '**Lineholder 11** / **Reserve 10** days off per bid period (full month available). (§7.D.2–3)',
            'Minimum **1 day** free from ALL duty every 7 consecutive days. (§7.D.6)',
            'Junior assignment below minimum? Restored that or the following month. (§7.D.5)',
            'A trip ending before 2400 that actually ends before 0200 counts as the prior day. (§7.D.1)',
          ],
        },
      ],
    },

    {
      title: 'Scheduling Rights',
      ref: '8',
      refLabel: 'Section 8 · Scheduling · pp. 29–46',
      lead:
        'Your monthly schedule is one of your most important contractual rights. Knowing how lines ' +
        'are built, how bids work, and your protections after award **puts you in control.**',
      blocks: [
        {
          kind: 'table',
          title: 'Monthly Bidding Timeline',
          ref: '§8.D · all times ET',
          head: ['Date / Deadline', 'What happens'],
          rows: [
            ['8th', 'Preliminary schedules to the Scheduling Committee'],
            ['10th · 1200', 'Bid lines posted electronically'],
            ['17th · 1200', 'Your bid must be submitted'],
            ['19th · 1700', 'Pre-blend awards posted'],
            ['21st · 1700', '**Final awards posted — you own this schedule**'],
            ['24th · 1700', 'Open-time bids close; awarded by seniority'],
            ['25th · 1700', 'Remaining open time → first-come, first-served'],
            ['27th · 1700', 'Golden Days awarded for reserve FAs'],
          ],
        },
        {
          kind: 'list',
          title: 'Golden Days',
          ref: '§8.I.2',
          items: [
            'Reserve FAs: minimum **4** per bid period (6 under 2022 LOA).',
            'Request up to your days off as Golden, in limited blocks.',
            'Window opens at final awards; closes noon, 2 days later.',
            'Awarded in **seniority order** by operational need.',
            'You may voluntarily fly open time on a Golden Day — your call.',
          ],
        },
        {
          kind: 'list',
          title: 'Junior Assignment',
          ref: '§8.L',
          items: [
            'Made in **reverse seniority** (most junior first).',
            'Never more than **24 hrs** before the section flies.',
            'Max **3/month, 10/year** (2 if at minimum days off).',
            'You **cannot** be junior assigned on a Golden Day or to reserve.',
            'Pay: **1.5×** hourly rate, on top of guarantee. (§3.K)',
          ],
        },
        {
          kind: 'note',
          text:
            '**Days off are protected.** If junior assigning drops you below the monthly minimum, ' +
            'those days must be restored in the same or following month by mutual agreement. (§7.D.5)',
        },
        {
          kind: 'list',
          title: 'Early Reports & Extensions',
          ref: '§8.M',
          items: [
            'Max early report: **3 hrs** before scheduled report. (§8.M.1)',
            'Max extension: **4 hrs** after release (5 to finish a round trip).',
            'Combined first-day early + last-day extension: **3/month, 10/year**.',
            'Premium pay (1.5×) applies only to first-day early reports & last-day extensions. (§3.I)',
          ],
        },
      ],
    },

    {
      title: 'Pay Protections',
      ref: '3',
      refLabel: 'Section 3 · Compensation · pp. 9–15',
      lead:
        'Your pay has multiple layers of protection. Understanding how each works, and when it ' +
        "kicks in, helps you **catch errors and know what you're owed.**",
      blocks: [
        {
          kind: 'list',
          title: 'Pay Calculation Basics',
          ref: '§3.A',
          items: [
            'Paid leg-by-leg on **scheduled or actual** block time, whichever is greater.',
            'Charter / ferry / diversions with no scheduled time: actual block-to-block.',
            'Taxi only: credited **12 min** of flight pay per occurrence.',
          ],
        },
        {
          kind: 'list',
          title: 'Minimum Day Pay',
          ref: '§3.F',
          items: [
            'Greater of actual, scheduled, or **3.5 hrs** per trip day.',
            'Must be away from domicile for the day. **Not** on reserve days.',
            'First day only if scheduled before **1200**; last day only if after **1700**.',
          ],
        },
        {
          kind: 'note',
          tone: 'ok',
          text:
            "**Monthly Guarantee — 75 hrs.** Available the full month? You're guaranteed 75 hrs of " +
            'pay even if you fly less. Prorated if you\'re out part of the month. (§3.B) ' +
            '**Trip Guarantee — 100%.** Lineholders are paid no less than 100% of the credit value ' +
            'of originally-scheduled trips, when the Company removes flying. (§3.E)',
        },
        {
          kind: 'table',
          title: 'Special Pay Situations',
          ref: 'Section 3',
          head: ['Situation', 'Pay rate'],
          rows: [
            ['Junior assignment', '**1.5×** hourly for all hours flown · 3.K'],
            ['Early report / extension', '**1.5×** for early/extended-period flights · 3.I'],
            ['Holiday / critical coverage', '**1.5×** per block hour · 3.N'],
            ['CDO trip', 'Greater of actual or **4 hrs** · 3.H'],
            ['Ready Reserve day', 'Greater of **4 hrs** or actual credit · 3.G'],
            ['Day off — open time flown', 'Paid **in ADDITION** to guarantee · 3.L'],
            ['Deadhead (partial day)', '**50%** of scheduled or actual (greater) · 3.J'],
            ['All-deadhead day', '**100%**; on a day off, +100% min 2.5 hrs · 3.J'],
            ['Random drug/alcohol test', '**+$10.00** upon request · 3.O'],
            ['IOE instructor / line check', '**25%** override; admin $10.00/hr · 3.I'],
          ],
        },
        {
          kind: 'list',
          title: 'Paydays & Pay Errors',
          ref: '§3.P',
          items: [
            'Paid on the **20th** (½ guarantee − 2.5 hrs + prior overage/per diem) and the **5th** (½ guarantee + 2.5 hrs).',
            'Check your FA Time Summary in the crew portal → Crew Pay.',
            'Pay-error response in writing within **5 business days** (10 if >30 days old).',
            'Errors ≥$50 corrected by separate check in 2 business days; <$50 next check. No unauthorized deductions. (§3.P.3)',
          ],
        },
      ],
    },

    {
      title: 'Reserve Rights',
      ref: '9',
      refLabel: 'Section 9 · Reserve Flight Attendants · pp. 47–56',
      lead:
        'The most rule-intensive part of the contract. Know your windows, notification rights, and ' +
        'call-out protections. When in doubt, call the **Reserve Committee at 844-423-2232 ext. 701.**',
      blocks: [
        {
          kind: 'table',
          title: 'The Three Types of Reserve',
          ref: '§9',
          head: ['Type', 'Call-out window & key rules'],
          rows: [
            [
              'Long-Call',
              '**12-hr** notice before 1st assignment. RAP 0001–1200 last day. No contact 0001–0500 unless 12-hr can\'t be met.',
            ],
            [
              'Short-Call',
              "RAP ≤14 hrs; report **2 hrs** (1 at TYS). First-day RAP can't change without consent; ±4 hrs on later days.",
            ],
            [
              'Ready Reserve',
              'At airport; report now. Max 3 consecutive days, 8 hrs each. Dedicated room + per diem.',
            ],
          ],
        },
        {
          kind: 'list',
          title: 'Long-Call Protections',
          ref: '§9.C',
          items: [
            '**12-hr** notice before first assignment.',
            'Not required to report before **0900 LT** after a day off.',
            'Released with no follow-on? The 12-hr clock **resets**.',
            'Converted to short-call **≤2×** per bid period.',
          ],
        },
        {
          kind: 'list',
          title: 'Short-Call RAP',
          ref: '§9.D',
          items: [
            '**First-day RAP fixed** — no change without consent.',
            'Later days: RAP shifts up to **±4 hrs**.',
            '>4-hr CDO adjust? You keep it the rest of the block.',
            'RAP ends unassigned → not available till next RAP.',
          ],
        },
        {
          kind: 'note',
          text:
            '**FOLO — first out / last out.** Submit your call-order preference at least **72 hours** ' +
            'before your block begins; honored in seniority order within your bucket. (§9.F.1–2)',
        },
        {
          kind: 'list',
          title: 'Reserve Transparency — What You See in FLICA',
          ref: '§9.Q',
          items: [
            'Real-time reserve grid (actual, net, projected) for all of next month.',
            'All FAs on reserve in your base, with names & seniority numbers.',
            'Your reserve type, RAP start, remaining days, projected & MTD credit.',
            'Your last and next flight assignment, if assigned.',
          ],
        },
        {
          kind: 'note',
          tone: 'warn',
          text:
            '**Reserve days are not days off.** A trip ending before 0200 is treated as having ' +
            'ended before 0001 for day-off calculations. (§9.J)',
        },
      ],
    },

    {
      title: 'Sick Leave & Vacation',
      ref: '§4 §5',
      refLabel: 'Sections 4 & 5 · Sick Leave / Vacations · pp. 16–21',
      lead:
        'How sick leave accrues and gets used, your documentation rights, and how vacation is ' +
        'earned and protected.',
      blocks: [
        {
          kind: 'list',
          title: 'Sick Leave Basics',
          ref: '§4.A–B',
          items: [
            'Accrues **3.5 hrs/month**; bank caps at **400 hrs**.',
            'Eligible to use after **90 days** of active service.',
            "Keeps accruing during workers'-comp leave.",
            'Balance posted electronically at least monthly.',
          ],
        },
        {
          kind: 'list',
          title: 'Calling In Sick',
          ref: '§4.F',
          items: [
            'Call Crew Scheduling per trip, **≥2 hrs** before report when possible.',
            'Only **you** can call yourself sick (unless incapacitated).',
            'You are **not required** to discuss your illness with a scheduler.',
            'Condition talks are with your supervisor, not Crew Scheduling. (§4.G)',
          ],
        },
        {
          kind: 'note',
          text:
            '**Short on sick leave?** You may **borrow up to 20 hours** against future accruals ' +
            'following a qualifying incident or critical event. (§23.F.3.b)',
        },
        {
          kind: 'table',
          title: 'Vacation — Earned by Longevity',
          ref: '§5.A',
          head: ['Longevity', 'Annual vacation'],
          rows: [
            ['After 1 year', '1 week · **21 hrs** credit'],
            ['After 2 years', '2 weeks · **42 hrs** credit'],
            ['After 6 years', '3 weeks · **63 hrs** credit'],
            ['After 13 years', '4 weeks · **84 hrs** credit'],
            ['After 18+ years', '5 weeks · **105 hrs** credit'],
          ],
        },
        {
          kind: 'list',
          title: 'Your Vacation Rights',
          ref: 'Section 5',
          items: [
            'Bids open **Oct 1**; awarded by seniority; final awards by **Dec 1**. (§5.B.3)',
            "Blackout count can't increase after publication. (§5.B.2)",
            'Released by **1700 the day before** vacation starts. (§5.C.1)',
            'Not required to share your whereabouts during vacation. (§5.C.3)',
            'If the Company cancels: compensation, reschedule, or defer, plus deposit reimbursement. (§5.D.2/.4)',
            'Hospitalized during vacation? Convert it to sick leave. (§5.F)',
            "Resign with 14 days' notice → paid for earned, unused vacation. (§5.E)",
          ],
        },
        {
          kind: 'note',
          tone: 'ok',
          text:
            '**Vacation beats recurrent training.** Vacation will NOT be canceled to require ' +
            "recurrent training, and you can't be required to return from leave to attend it. " +
            '(§5.D.5 & 18.G.4)',
        },
      ],
    },

    {
      title: 'Grievances & Discipline',
      ref: '16',
      refLabel: 'Section 16 · Grievances & Discipline · pp. 76–107',
      lead:
        'Called to a meeting with management, or believe a contract was violated? **Time limits are ' +
        'critical.** Contact the Union Rep Assistance immediately.',
      blocks: [
        {
          kind: 'note',
          tone: 'warn',
          text:
            '**Before ANY discipline — your right to a hearing.** The Company CANNOT issue ' +
            'discipline with pay loss, a final-warning letter, or discharge without first holding ' +
            'an investigatory meeting where you have union representation. **Call us before you sit ' +
            'down with management.** (§16.C.1)',
        },
        {
          kind: 'list',
          title: 'Investigatory Meeting Protections',
          ref: '§16.C.1',
          items: [
            'Written notice **≥7 days** in advance, with the reason stated.',
            "Once scheduled, can't be canceled within 48 hrs (barring extenuating circumstances).",
            'Right to **union representation** (a rep or another FA).',
            'Rep unavailable → rescheduled within 2 business days.',
            'On your day off and you object → moved to a duty period.',
            'Company provides positive-space travel to the meeting/hearing.',
          ],
        },
        {
          kind: 'note',
          tone: 'ok',
          text:
            "**If you're exonerated:** reinstated without loss of seniority or longevity, paid " +
            'retroactively for all time lost, and all references to the investigation removed from ' +
            'your record. (§16.C.2)',
        },
        {
          kind: 'table',
          title: 'Grievance Deadlines',
          ref: 'Section 16',
          head: ['Type', 'Filing deadline & process'],
          rows: [
            [
              'Non-disciplinary (contract violation)',
              '**30 days** after you became aware of it. Director of Inflight decides within 10 days of submission.',
            ],
            [
              'Disciplinary / discharge',
              '**15 days** after you receive notice. Hearing within 15 days; decision within 10 days of hearing.',
            ],
          ],
        },
        {
          kind: 'note',
          tone: 'warn',
          text:
            "**Don't wait.** The 15- or 30-day clock starts the moment you're aware of a potential " +
            "violation. If you're unsure whether to file, contact the Union Rep Assistance right away.",
        },
      ],
    },

    {
      title: 'General Protections',
      ref: '24',
      refLabel: 'Section 24 · General · personnel files & workplace rights',
      lead: 'The protections people most often forget they have.',
      blocks: [
        {
          kind: 'list',
          title: 'Your Personnel File Rights',
          ref: '§24.E',
          items: [
            "Inspect your file (HR, training, attendance, in-flight, medical) with **2 business days'** written notice.",
            'Respond in writing to any critical or unfavorable item.',
            'All derogatory material is **removed after 24 months**.',
            'You must be copied on any adverse material placed in your file.',
          ],
        },
        {
          kind: 'list',
          title: 'Workplace Rights You Need to Know',
          ref: 'Section 24',
          items: [
            '**Not required** to share your whereabouts on days off, leave, or vacation. (§24.N)',
            '**Not required** to perform bomb searches or cabin security inspections (except diverted non-company stations). (§24.J)',
            '**Not required** to do cleaner, provisioner, caterer, or ramp work. (§24.J.2)',
            'You will **not be weighed** or disciplined for weight. (§24.O)',
            "Crew lounge & attendance policy **equal to pilots'**. (§24.R/.S)",
            "CVR/FDR/video recordings can't be used for discipline (except accidents). (§24.L.2.a)",
            'The **contract prevails** over any conflicting Company policy. (§24.F)',
            "Free parking where parking isn't free — Company pays. (§24.H)",
            'Senior FA may choose Forward or Aft, kept the whole trip. (§24.T)',
            'You may carry coolers/food and eat discreetly aboard. (§24.Q)',
          ],
        },
        {
          kind: 'table',
          title: 'Common Questions',
          head: ['Question', 'Answer'],
          rows: [
            [
              'Can scheduling call me during rest?',
              'Only the first or last hour of rest, or for a family emergency. Never for scheduling changes. (§8.N.3)',
            ],
            [
              'Unsure whether to file a grievance?',
              'Contact the Union Rep Assistance immediately — the 15-/30-day clock is already running.',
            ],
            [
              'Does a verbal warning count as discipline?',
              'Yes. Without a prior meeting, the notice must include your right to request one within 7 days. Respond in writing via your rep.',
            ],
            [
              'Can I be disciplined for my weight?',
              'No. You will not be weighed or disciplined for any weight-related matter. (§24.O)',
            ],
            [
              'Company policy differs from the contract?',
              'The contract wins. If any policy, practice, or regulation conflicts with the CBA, the CBA takes precedence. (§24.F)',
            ],
          ],
        },
      ],
    },

    {
      title: 'Quality of Life Enhancements',
      ref: 'LOA 2022',
      refLabel: 'Signed April 2022 · expired July 23, 2023',
      lead:
        'Significant quality-of-life improvements. The LOA expired July 23, 2023, but many ' +
        'provisions carried into later practice — **always verify current status with your LEC ' +
        'officers.**',
      blocks: [
        {
          kind: 'list',
          title: 'Accelerated Pay',
          ref: 'new §3.R',
          items: [
            "Applies when you're awarded a premium-pay trip (§8.I.3).",
            'Minimum **1.5×** hourly for all hours flown.',
            'Paid **in addition** to your monthly guarantee.',
            'Company may raise above 1.5× at its discretion.',
            'Also applies when a Golden Day is moved, restored or not.',
          ],
        },
        {
          kind: 'list',
          title: 'Holiday / Critical Coverage',
          ref: 'updated §3.O',
          items: [
            'Covered: Thanksgiving, Christmas, Memorial Day, July 4th.',
            'Plus any Critical Coverage day the Company designates.',
            'Floor of **1.5×** hourly per block hour (or portion).',
            'Must report for AND complete the assignment to earn it.',
          ],
        },
        {
          kind: 'list',
          title: 'Golden Days — Expanded',
          ref: 'updated §8.I.2',
          items: [
            'Reserve FAs may now request up to **6** Golden Days (up from 4).',
            'Submitted in up to **3 blocks** (up from 2).',
            'Days off moved only when operationally necessary; replaced that bid month.',
            'Moved day not restored → Accelerated Pay (1.5×); if restored, still paid.',
            'Award published by the **27th** of the prior month.',
            'You may always voluntarily pick up open time on your Golden Day.',
          ],
        },
        {
          kind: 'list',
          title: 'Premium Pay Trips',
          ref: 'updated §8.I.4',
          items: [
            'Company may declare any trip a premium-pay trip to protect schedule integrity.',
            'Posted electronically; awarded **first come, first served** for ≥15 minutes.',
            'After 15 minutes the Company may junior assign instead.',
          ],
        },
        {
          kind: 'note',
          tone: 'warn',
          text:
            "**Act fast on premium trips.** They're first-come, first-served, and the Company can " +
            'junior assign after 15 minutes if no one picks them up.',
        },
      ],
    },

    {
      title: 'Flex Hiring & Retention',
      ref: 'LOA 2022',
      refLabel: 'Signed June 11, 2022 · §3.R & §6.B · effective July 1, 2022',
      lead:
        'Flexible starting pay for new hires, one-time retention bonuses, and a new commuter-hotel ' +
        'benefit.',
      blocks: [
        {
          kind: 'list',
          title: 'Flexible Hiring Rates',
          ref: '§3.R',
          items: [
            'Company may hire new FAs at the **2-year rate** when the market requires.',
            'If the start rate is raised, **all FAs below it are raised to match**.',
            'Hired at the 2-year rate? You stay there until you actually reach 2 years, then progress normally.',
            "Range can't go below the 0–6 month rate or above the 18-year rate.",
          ],
        },
        {
          kind: 'table',
          title: 'Retention Bonuses',
          head: ['Who receives it', 'Amount & payment date'],
          rows: [
            [
              'FAs not getting a rate adjustment when flex rates activated',
              '**$1,500** · 1st payroll after Sept 15, 2022',
            ],
            ['Same FAs — second installment', '**$1,500** · 1st payroll after Jan 15, 2023'],
            [
              'FAs whose adjustment was <$3,000 by July 1, 2023',
              'Top-up to **$3,000** · Sept 15, 2022 & Jan 15, 2023',
            ],
          ],
        },
        {
          kind: 'note',
          text: 'Must be employed on each payment date to receive it.',
        },
        {
          kind: 'list',
          title: 'Commuter Training Hotel',
          ref: '§6.B.4',
          items: [
            'Now qualifies at **50+ miles** (down from 100).',
            'Up to **2 nights** Company-paid during recurrent training.',
            'Must register as a Commuter; request 1700 on 21st – 1200 on 23rd (prior month).',
          ],
        },
        {
          kind: 'list',
          title: 'NEW: Monthly Hotel Allowance',
          ref: '§6.B.5',
          items: [
            'Registered commuters 50+ miles out: up to **$250/month** at any base.',
            'Use before, during, or after a trip / reserve block.',
            'Submit all receipts in one Workday report by the **15th**.',
          ],
        },
        {
          kind: 'note',
          tone: 'ok',
          text:
            '**Live 50+ miles from your domicile?** You may qualify for up to **$250/month** in ' +
            'commuter-hotel reimbursement. Register through the Company-approved method and keep ' +
            'ALL receipts. (§6.B.5)',
        },
      ],
    },

    {
      title: 'DFW Base & Time Zones',
      ref: 'LOA 2023',
      refLabel: 'Signed Feb 15, 2023 · §6 & §8',
      lead:
        'With the crew base at Dallas/Fort Worth (Central Time), key deadlines were clarified to ' +
        'use **Eastern Time** as the standard across all bases.',
      blocks: [
        {
          kind: 'note',
          tone: 'warn',
          text:
            '**Based at DFW (Central Time)?** All written contract & LOA deadlines stay in ' +
            '**Eastern Time**. 1700 ET = 1600 CT — always convert to local before submitting.',
        },
        {
          kind: 'list',
          title: 'Training-Hotel Window',
          ref: '§6.B.4',
          items: [
            'Request the month prior to training.',
            'Opens **1700 ET** on the 21st; closes **1200 ET** on the 23rd.',
            'Standardized to Eastern Time for all domiciles.',
          ],
        },
        {
          kind: 'list',
          title: 'Open-Time Bid Deadline',
          ref: '§8.I.a',
          items: [
            'Bids close **1700 ET** on the 24th.',
            'Awards announced by 1700 ET the next day (25th).',
            'Awarded by seniority in domicile, then system-wide.',
          ],
        },
        {
          kind: 'list',
          title: 'Key Reminders for DFW FAs',
          items: [
            'All deadline times are **Eastern** unless stated otherwise.',
            'Bid close (17th 1200 ET), pre-blend (19th 1700 ET), finals (21st 1700 ET) — all Eastern.',
            'Golden Day, open time & commuter-hotel windows all use Eastern.',
            'Reserve notice (12-hr / 2-hr) is **elapsed time**, not time zones.',
          ],
        },
        {
          kind: 'note',
          text:
            "**Example:** open-time bids close 1700 ET on the 24th — that's **1600 CT** for a DFW " +
            "FA. Submit at 1605 CT (1705 ET) and you've missed it by 5 minutes. **Always bid early.**",
        },
      ],
    },
  ],
};
