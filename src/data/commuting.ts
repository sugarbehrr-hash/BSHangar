/* ============================================================
   Commuting & non-rev
   ------------------------------------------------------------
   Ported verbatim from the export's commuting page. Lives in data
   rather than in the page because Phase 5 renders the same content
   into the printable commuting guide — the export maintained those
   two copies separately.

   **double asterisks** mark what were inline <b> tags.
   ============================================================ */

export interface Step {
  title: string;
  body: string;
}

export interface InfoCard {
  title: string;
  /** Sub-line under the title. May be omitted. */
  ref?: string;
  icon: string;
  accent: string;
  points: string[];
}

/** The four-step commuter program. Follow every time to stay covered. */
export const commuterProgram: Step[] = [
  {
    title: 'List 24h early',
    body: 'A **primary and secondary** flight — both with open seats — no less than 24 hours ahead.',
  },
  {
    title: 'Allow enough time',
    body: 'Both flights should land with time to check in — **1 hour is recommended**.',
  },
  {
    title: 'Notify Crew Scheduling',
    body: 'Primary delayed or full? **Immediately** tell CS your back-up flight # and time.',
  },
  {
    title: 'Keep trying',
    body: 'Once your commute begins, keep working to reach base unless released on the recorded line.',
  },
];

export const commuteFailure: InfoCard = {
  title: 'If your commute fails',
  ref: 'Call CS — confirm one option, in order',
  icon: 'ph-warning',
  accent: 'var(--red-600)',
  points: [
    '**Line holder:** rejoin your trip once you reach base (§8.Q.2), or be reassigned up to equal days.',
    '**Reserve:** move your reserve period, take Ready (Hot) Reserve, or agree a new reserve day — **CS must approve**.',
    '**Within 24 hrs:** advise your Supervisor & submit docs so the CNC code converts to **COM**.',
  ],
};

export const freeFlying: InfoCard = {
  title: 'Free flying & listing',
  ref: 'Jumpseat · Cabin seat · Commuter',
  icon: 'ph-ticket',
  accent: 'var(--sky-700)',
  points: [
    '**List with ID90:** Frontier · United.',
    '**At the counter / gate:** Delta · Alaska / Hawaiian.',
    '**List with MyIDtravel:** Allegiant · JetBlue · Sun Country · Southwest.',
    '**Always use your AA info** — 6-digit # & first.last@aa.com. Never the PSA option.',
  ],
};

/** "Getting to your gate" — the grab-and-go trio. */
export const gateGuide: InfoCard[] = [
  {
    title: 'Timing',
    icon: 'ph-clock-countdown',
    accent: 'var(--navy-700)',
    points: [
      'Check in **24h early** via Travel Planner to top the standby list.',
      'Allow **45 minutes** from parking to gate.',
      'Large airport? Build in extra time between concourses.',
    ],
  },
  {
    title: 'Documentation',
    icon: 'ph-image-square',
    accent: 'var(--gold-600)',
    points: [
      '**Print outside security** & photograph immediately.',
      'Keep **2 hard copies** of 2 different boarding passes.',
      'Save every receipt, screenshot & boarding pass.',
    ],
  },
  {
    title: 'Dress',
    icon: 'ph-t-shirt',
    accent: 'var(--success-600)',
    points: [
      'Neat, clean, not distracting — any cabin, including premium.',
      'No swimwear, sleepwear, or torn/revealing attire.',
      'Other carriers: smart-casual; check **flyzed.info**.',
    ],
  },
];

export const commutingCallouts = {
  disclaimer:
    "**This guide assists you — it doesn't carry protections.** It's plain-language " +
    'reference from the CBA & Commuting Policy. Always confirm current terms with ' +
    'your Inflight Supervisor or a union rep.',
  idTravel:
    '**MyIDtravel and ID90 are two different things.** MyIDtravel is on the PSA ' +
    "website; ID90 is an app. Don't mix them up. Check in with your confirmation " +
    'code — except United, where you see a gate agent.',
} as const;
