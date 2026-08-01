/* ============================================================
   Flight Attendant Approved — the standard behind the stamp
   ------------------------------------------------------------
   The gate, written down. Copy is final (design handoff,
   FA Approved.dc.html) and lives here rather than in the page,
   so the markup stays structural.

   The three tiers are NOT described here — they are in
   src/data/essentials.ts, on TIERS.explain, because the ladders
   that render them appear all over the site and a tier cannot be
   explained one way here and another way on a product page.

   **bold** and [label](href) are the inline markers understood by
   src/lib/rich-text.ts.
   ============================================================ */

export const faCopy = {
  eyebrow: 'The standard behind the stamp',
  title: 'Flight Attendant',
  titleAccent: 'Approved',
  sub:
    'Nobody on earth travels more than working crew. When the people who live out of a bag ' +
    'say something survives the job, that means more than any ad — and this page is exactly ' +
    'what the stamp promises, every time it appears.',
  backLabel: 'See the approved picks',

  whyKicker: 'Why us',
  whyHeading: 'The most-traveled people in the world',
  whyLead:
    'A frequent flyer takes fifty flights a year. A working flight attendant takes fifty a ' +
    'month — and buys their own gear, lifts it into their own bin, and lives with what ' +
    'breaks. That experience is the whole authority behind this stamp.',

  standardKicker: 'The standard',
  standardHeading: 'What every stamp means',
  standardLead:
    'The stamp is never sold, never traded for product, and never handed out for a launch. ' +
    'A pick has to clear all of this:',

  tiersKicker: 'The tiers',
  tiersHeading: 'Three picks. Pick your compromise.',
  tiersLead:
    "Every pick clears the same quality bar, so the tiers aren't grades — they're price " +
    "levels. You're never choosing the good one. You're choosing which trade you can live " +
    'with, and every pick names its trade in one sentence, right on the page. That sentence ' +
    'is the rating; there are no stars here.',
  tiersNote:
    "**Why Main Cabin is the default.** It's chosen for what most crew earn, lift and fly — " +
    "not for anyone's personal taste. If a pick only makes sense on a senior line, it " +
    'belongs in First Class, flagged.',

  actionTitle: 'The stamp is only as good as the group behind it.',
  actionBody:
    'Flown with something great — or been burned by a pick on this site? Say so in the group.',
} as const;

/** The three cards under "why us". Accent drives the badge colour. */
export const faAuthority = [
  {
    icon: 'ph-airplane-takeoff',
    accent: 'var(--navy-700)',
    title: 'We fly more than anyone',
    text:
      'More airports in a month than most people see in a decade. Gear that works "for ' +
      'travel" and gear that works for **this job** are different products — we can tell ' +
      'them apart in a week.',
  },
  {
    icon: 'ph-wallet',
    accent: 'var(--red-600)',
    title: 'We buy our own',
    text:
      'Nothing here was sent to us free. Everything with the stamp was paid for by crew, on ' +
      'crew pay — which is why price is part of the standard, not a footnote.',
  },
  {
    icon: 'ph-clock-countdown',
    accent: 'var(--sky-700)',
    title: 'We live with the failures',
    text:
      'A wheel that dies in month three dies on a jetbridge at 5 a.m., not in a review lab. ' +
      "What survives our schedule survives anything — and what doesn't, we say so.",
  },
] as const;

/**
 * The five points. The last is flagged gold rather than checked green because
 * it is the only one that is a promise about what we PRINT rather than a test
 * the product passed — and it is the point the whole system rests on.
 */
export const faCriteria = [
  {
    text:
      '**Flown, not sampled.** At least 90 days in a real rotation, by crew who paid for it ' +
      'themselves.',
  },
  {
    text:
      '**Recommended more than once.** It came up in the group repeatedly, unprompted, from ' +
      "crew who don't know each other.",
  },
  {
    text:
      '**It fits our constraints.** The sizer, the bin, the hotel room, the uniform, the TSA ' +
      'line.',
  },
  {
    text:
      '**It survives the schedule.** Built to be repaired or replaced in parts when the ' +
      'miles catch up.',
  },
  {
    flag: true,
    text:
      '**Its compromise is named.** Price, weight, lifespan — every pick says in one ' +
      "sentence what you're giving up. No pick is pretended perfect.",
  },
] as const;

/** The honesty pair that closes the page. */
export const faHonesty = {
  losing: {
    icon: 'ph-eraser',
    accent: 'var(--red-600)',
    title: 'How a pick loses the stamp',
    sub: 'The part that keeps it honest',
    rows: [
      '**Quality drops, stamp comes off.** Brands change factories; we re-check what crew report.',
      '**Prices are re-checked.** Every page shows when its price was last verified. Stale ' +
        'numbers get fixed or pulled.',
      '**Disagreement is welcome.** If crew in the group push back on a pick, that ' +
        'conversation is part of the review — not a comment to delete.',
    ],
  },
  brands: {
    icon: 'ph-handshake',
    accent: 'var(--gold-600)',
    title: 'For brands',
    sub: "You can't buy it — here's what you can do",
    text:
      "We don't accept sponsorships for the stamp, and free samples don't count toward the " +
      '90 days. If you make something you believe survives this job, tell us — and then wait ' +
      'while crew fly with it on their own dime. If it holds up, the stamp finds it.',
    ctaLabel: 'Get in touch',
  },
} as const;
