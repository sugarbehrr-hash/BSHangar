import type { Guide } from './types';

/**
 * Reserve Field Guide — ported in full from the export's scr-reserve template.
 *
 * Content is carried verbatim, including the CBA citations and the provenance
 * dates the cover printed. The one substantive correction: the cheat-sheet row
 * "You do NOT** have to answer" had a stray unmatched bold marker in the
 * source, which rendered a literal "**" on the printed sheet.
 */
export const reserveGuide: Guide = {
  slug: 'reserve-field-guide',
  title: 'SCR Reserve',
  eyebrow: 'Field Reference · Short-Call Reserve · CBA §7 & §9',
  subtitle: 'Understanding Your On-Call & Duty Hours',
  intro:
    "If you're new to short-call reserve, the rules around your SCR, callouts, and duty " +
    'hours can feel overwhelming. This guide breaks it down in plain English, straight ' +
    'from our CBA. Know your windows. Know your clock. Protect yourself.',
  meta: {
    translates: 'Translates the CBA effective July 15, 2019',
    revised: 'This guide · last revised June 28, 2026',
  },
  contents: [
    { label: 'What is a SCR?', ref: '§9.D' },
    { label: 'When They Call You', ref: '§9' },
    { label: 'The 14-Hour Duty Clock', ref: '§7.A' },
    { label: 'The 15-Hour Extension', ref: '§7.A' },
    { label: 'Rest Between Duties', ref: '§7.B' },
    { label: 'SCR Shifts & Quick Sheet', ref: '§9.D' },
  ],

  sections: [
    {
      title: 'Your SCR, Callout & Duty Clock',
      ref: '§9 · §7',
      refLabel: 'Sections 7 & 9 · Reserve Rules & Hours of Service',
      lead:
        'Three things every SCR flight attendant must know cold: your **SCR window**, ' +
        'your **callout obligations**, and exactly when your **14-hour duty clock** ' +
        'starts, because it is NOT when you get called.',
      blocks: [
        {
          kind: 'stat',
          value: '14',
          unit: 'Hours Maximum',
          caption:
            'Crew Scheduling can only call you during your SCR. Outside of it, you are NOT required to be available.',
        },
        {
          kind: 'list',
          title: 'What is a SCR?',
          ref: '§9.D — Reserve Availability Period',
          lead: 'Your On-Call Window',
          items: [
            '**SCR = Reserve Availability Period** — this is your on-call window.',
            'Your SCR is **no longer than 14 hours**. (§9.D)',
            '**First-day SCR start time cannot be changed without your consent.** Know it before your block starts.',
            'On later reserve days, Crew Scheduling can shift your SCR **up to ±4 hours** earlier or later.',
            '**If your SCR ends and you were not assigned**, you are not available until your next SCR.',
          ],
        },
        {
          kind: 'steps',
          title: 'When They Call You',
          ref: '§9.D',
          steps: [
            {
              label: 'Crew Scheduling Calls During Your SCR',
              body:
                'You have **15 minutes** to respond to the initial message. Don\'t let that call go to ' +
                'voicemail, and if you miss it, call back within 15 minutes.',
            },
            {
              label: 'You Have 2 Hours to Report to the Airport',
              body:
                'Once Crew Scheduling contacts you, you have **2 hours** to report to the gate. Keep your ' +
                'bag packed and ready, and make every effort to report earlier if needed.',
            },
            {
              label: 'Your Duty Clock Starts When You REPORT',
              body:
                'Not when you got the call. Not when you boarded. The clock starts **when you report for ' +
                'duty as directed by the Company**. (§7)',
            },
          ],
        },
        {
          kind: 'prose',
          title: 'When Does Your 14-Hour Duty Clock Start?',
          ref: '§7.A',
          text:
            'This is the big one. Your duty clock does **NOT** start when you get called. It does ' +
            '**NOT** start when you board the plane. Per §7, duty time begins **when you report for ' +
            'duty as directed** and ends **15 minutes after block-in** (domestic).',
        },
        {
          kind: 'table',
          title: 'Example Timeline',
          head: ['Time', 'What it means'],
          rows: [
            ['Crew Scheduling calls you · 8:00 AM', 'You have 2 hours to get there'],
            ['You report to the gate · 10:00 AM', '**YOUR 14-HOUR DUTY CLOCK STARTS NOW**'],
            ['Duty day must end by · 12:00 AM', 'Midnight, or 1:00 AM absolute max (15-hr rule)'],
          ],
        },
        {
          kind: 'list',
          title: '14-Hour Rule — The Numbers',
          ref: '§7.A.1 & 7.A.2',
          items: [
            'Cannot be **scheduled** for more than **14 hours** of duty.',
            'Cannot **exceed 15 hours** of duty between rest periods — this is the hard absolute maximum.',
            '**After 15 hours**, Crew Scheduling must make other arrangements. You cannot contractually operate a flight.',
          ],
        },
        {
          kind: 'list',
          title: 'Release Time',
          ref: '§7.C',
          items: [
            'Duty ends **15 minutes after block-in** on domestic flights.',
            'Or when Crew Scheduling officially releases you — **whichever is later**.',
            'Your rest clock starts the **moment** you are released.',
          ],
        },
      ],
    },

    {
      title: 'Know Your Limits & Your Rest',
      ref: '§7',
      refLabel: 'Section 7 · Protections, Rest & Quick Reference',
      lead:
        'The 15th hour is **not automatic**. Your rest is **protected by contract**. And your SCR ' +
        'can only shift within strict limits. Know all three.',
      blocks: [
        {
          kind: 'note',
          tone: 'warn',
          text:
            '**The 15th hour is NOT automatic.** It is only allowed to complete a flight already in ' +
            'progress or due to irregular operations (IROP). Crew Scheduling cannot simply add flying ' +
            'to push you into that 15th hour without justification.',
        },
        {
          kind: 'list',
          title: 'The 15-Hour Extension — When Can They Do This?',
          lead: "If you're approaching your 14-hour limit and they want you to continue flying:",
          items: [
            '**No passengers boarded:** Call Legality (Option 2) if Crew Scheduling is asking you to exceed your contractual limits. Document the time, scheduler\'s name, and exactly what was said.',
            '**Passengers already boarded:** There can be no passengers boarded when calling Crew Scheduling about limits. If they are boarded, **work through the pilots via ACARS**.',
            'Say this clearly and calmly: "Are you telling me that you are breaking my contractual limit of 15 hours?" This puts it on record.',
            '**Follow up in writing** — send yourself an email or text immediately after the call, documenting what happened.',
            'Consult your union rep, and if limits were broken, **always file a grievance**. A filed grievance holds the Company accountable for all FAs.',
          ],
        },
        {
          kind: 'note',
          tone: 'ok',
          text:
            '**You are not being difficult.** Knowing your contract protects you AND the operation. ' +
            'A fatigued flight attendant is a safety risk. Know your limits and don\'t be afraid to use them.',
        },
        {
          kind: 'list',
          title: 'Rest After Your Duty Day',
          ref: '§7.B',
          items: [
            'Minimum **10 hours rest** between duty periods (release to report).',
            "Rest clock starts the **moment you're released** — 15 min after block-in domestic, or Crew Scheduling release, whichever is later.",
            'The Company **cannot contact you** during rest for scheduling changes, except the first or last hour, or a family emergency. (§8.N.3)',
          ],
        },
        {
          kind: 'list',
          title: 'Can Your SCR Be Shifted?',
          ref: '§9.D',
          items: [
            '**First-day SCR** start time cannot be changed without your consent.',
            'On subsequent reserve days, your SCR can be shifted **up to 4 hours earlier or later**.',
            'Know your SCR **before your block starts**, and confirm if anything changes.',
          ],
        },
        {
          kind: 'table',
          title: 'Quick Cheat Sheet',
          head: ['Situation', 'What to Know'],
          rows: [
            ['Outside your SCR', 'You do **NOT** have to answer — you are not required to be available.'],
            ['During your SCR', "Answer — you have **15 minutes** to respond to Crew Scheduling's initial contact."],
            ['Report time', 'Within **2 hours** of callout — keep your bag packed and ready.'],
            ['Duty clock starts', 'When you **REPORT** to the gate — not when called, not when boarded.'],
            ['Max duty', '**14 hours** scheduled — **15 hours** absolute maximum (IROP only, never automatic).'],
            ['Rest between duties', 'Minimum **10 hours** (release-to-report) — Company cannot contact you mid-rest for scheduling.'],
            ['SCR length / shift', 'Maximum **14 hours** long — can shift **±4 hours** on later days (first-day SCR is protected).'],
          ],
        },
      ],
    },
  ],
};
