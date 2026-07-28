/* ============================================================
   Your Contract — the hub's figures and situations
   ------------------------------------------------------------
   Copy is final (design handoff, Contract Hub.dc.html) and lives
   here rather than in the page, so the markup stays structural.

   **bold** and [label](href) are the inline markers understood by
   src/lib/rich-text.ts.

   One deliberate addition to the handoff copy: the 14-hour
   SCHEDULED cap (§7.A.1). The prototype carried only the 15-hour
   ceiling and phrased it "scheduled or not", which reads as
   though the scheduling limit does not exist. Both numbers are in
   src/data/guides/contract.ts and both matter on the line — 14 is
   what a pairing is built against, 15 is the wall once the day is
   already moving.
   ============================================================ */

/** One row of the figure ledger, plus the pane it loads. */
export interface ContractFigure {
  /** Stable key; ties a row to its detail pane. */
  key: string;
  value: string;
  unit: string;
  label: string;
  caption: string;
  /** CBA citation shown as the row's chip. */
  ref: string;
  pane: {
    title: string;
    sub: string;
    paras: string[];
    /** The single "do this" line closing the pane. */
    action: string;
  };
}

/** The pane shown before any figure is chosen. */
export interface ContractIntro {
  title: string;
  sub: string;
  paras: string[];
  action: string;
}

/** One "find your situation" accordion. */
export interface ContractSituation {
  /** Section chip, e.g. "§16". */
  badge: string;
  title: string;
  /** Uppercase sub-line under the title. */
  note: string;
  /** Red-bordered and open on load. At most one. */
  urgent?: boolean;
  /** Red pill in the summary row, e.g. "Call first". */
  flag?: string;
  rows: { statement: string; detail?: string; ref: string }[];
  action: string;
}

export const contractFigures: ContractFigure[] = [
  {
    "key": "scheduled",
    "value": "14",
    "unit": "hrs",
    "label": "Scheduled duty",
    "caption": "The most they can build into your day",
    "ref": "§7.A.1",
    "pane": {
      "title": "Scheduled duty",
      "sub": "§7.A.1 · 14 hrs",
      "paras": [
        "Fourteen hours is the most the Company can **schedule** you for. It is the number your pairing is built against, and it is a different limit from the 15-hour ceiling.",
        "If a line or a reassignment is built past 14, that is a scheduling error worth raising before you fly it — not something to sort out at the end of a long day."
      ],
      "action": "Check the projected duty on a new pairing **before** you accept it. Built past 14 is a §7.A.1 problem; running past 15 once the day is moving is a §7 problem."
    }
  },
  {
    "key": "duty",
    "value": "15",
    "unit": "hrs",
    "label": "Max duty day",
    "caption": "Between rest periods — a ceiling, not a target",
    "ref": "",
    "pane": {
      "title": "Max duty day",
      "sub": "§7 · 15 hrs",
      "paras": [
        "Duty is the whole clock, not just the flying — report time, ground time, delays and deadheads all count toward the 15.",
        "If a reroute would push you past it, you aren't required to take it. Say the number out loud before you accept anything.",
        "They cannot **schedule** you past 14 (§7.A.1). Fifteen is the wall once the day is already moving."
      ],
      "action": "**Ask Scheduling to read your projected duty-end time back to you** on the recorded line, then write it down."
    }
  },
  {
    "key": "rest",
    "value": "10",
    "unit": "hrs",
    "label": "Minimum rest",
    "caption": "Between duty periods, measured at the hotel",
    "ref": "",
    "pane": {
      "title": "Minimum rest",
      "sub": "§7 · 10 hrs",
      "paras": [
        "Rest is free from **all** duty, and it starts when you reach the hotel — not when you leave the aircraft.",
        "If a delay eats into it, the trip moves, not the rest. And nobody should be calling you during it about a schedule change (§8.N.3)."
      ],
      "action": "**If someone offers to “reduce” your rest, that's a schedule change** — ask for it in writing, then call a rep."
    }
  },
  {
    "key": "gtd",
    "value": "75",
    "unit": "hrs",
    "label": "Monthly guarantee",
    "caption": "When you're available the whole month",
    "ref": "",
    "pane": {
      "title": "Monthly guarantee",
      "sub": "§3 · 75 hrs",
      "paras": [
        "Available all month and the Company still didn't schedule you to 75 hours? You're paid for 75 anyway.",
        "The guarantee assumes full availability — dropped trips and unpaid leave reduce it, which is where most “my check is short” questions actually land."
      ],
      "action": "**Check your Time Summary against 75 before the 20th** with the [Paycheck Estimator](Tools.dc.html)."
    }
  },
  {
    "key": "minday",
    "value": "3.5",
    "unit": "hrs",
    "label": "Minimum day pay",
    "caption": "Actual or 3.5, whichever is greater",
    "ref": "",
    "pane": {
      "title": "Minimum day pay",
      "sub": "§3 · 3.5 hrs",
      "paras": [
        "A short turn still pays a minimum. Any day you work, you're credited the greater of what you actually flew or 3.5 hours.",
        "It's per day worked — so a month of short days shouldn't quietly pay less than the days themselves are worth."
      ],
      "action": "**A day that paid under 3.5 is a pay error.** Report it in writing within 5 business days and keep your copy."
    }
  },
  {
    "key": "shortcall",
    "value": "2",
    "unit": "hrs",
    "label": "Short-call report",
    "caption": "Clock starts when the phone rings",
    "ref": "",
    "pane": {
      "title": "Short-call report",
      "sub": "§9 · 2 hrs",
      "paras": [
        "On short call you have two hours from the moment Scheduling reaches you to be at the airport, ready to work.",
        "It runs from the call — not from when you finally hear the voicemail. Your first-day RAP also can't move without your consent."
      ],
      "action": "**Repeat the time back on the phone** — “so that's 0642, reporting by 0842” — so it's on the recording, and note it."
    }
  },
  {
    "key": "file",
    "value": "30",
    "unit": "days",
    "label": "To file a grievance",
    "caption": "15 days if it's discipline",
    "ref": "",
    "pane": {
      "title": "To file a grievance",
      "sub": "§16 · 30 days",
      "paras": [
        "A contract violation has to be filed within 30 days of when you knew, or should have known, about it. Discipline is 15.",
        "Miss the window and how right you were stops mattering — timeliness is the first thing the Company checks."
      ],
      "action": "**Send your rep the date, the section and your documentation.** They write the filing — you don't have to know the language."
    }
  }
];

export const contractIntro: ContractIntro = {
  "title": "Reading the citations",
  "sub": "§ = Section of the CBA",
  "paras": [
    "**§7.D.5** is Section 7, paragraph D, subpart 5 — enough to look it up or quote it. Every line on this page carries its citation, so you can check us."
  ],
  "action": "**Say it like this:** “Per §7.D my duty day caps at 15 hours — I'm at 14:20 now.” You don't need the wording memorised; the number alone changes the conversation."
};

export const contractSituations: ContractSituation[] = [
  {
    "badge": "§16",
    "title": "I've been called into a meeting with management",
    "note": "Do this before you answer anything",
    "urgent": true,
    "flag": "Call first",
    "rows": [
      {
        "statement": "No discipline with pay loss, a final warning, or discharge without an investigatory meeting.",
        "detail": "And you have the right to representation in that meeting.",
        "ref": "§16"
      },
      {
        "statement": "The contract prevails over conflicting Company policy.",
        "detail": "A policy memo doesn't outrank your CBA.",
        "ref": "§24.F"
      },
      {
        "statement": "File within **15 days** for discipline, **30 days** for a contract violation.",
        "detail": "",
        "ref": "§16"
      }
    ],
    "action": "**Call the union before you sit down.** Union Rep Assistance: [844-423-2232](tel:+18444232232). Say you're requesting representation, then wait."
  },
  {
    "badge": "§7",
    "title": "They're pushing my duty day long",
    "note": "Duty limits & rest",
    "rows": [
      {
        "statement": "**14 hours** is the most they can schedule you for — that is what your pairing is built against.",
        "detail": "Built past 14 is a scheduling error, not a long day.",
        "ref": "§7.A.1"
      },
      {
        "statement": "**15 hours** is the hard ceiling once the day is moving. Duty between rest periods stops there.",
        "detail": "A ceiling, not a target.",
        "ref": "§7"
      },
      {
        "statement": "**10 hours** minimum rest between duty periods.",
        "detail": "",
        "ref": "§7"
      },
      {
        "statement": "No contact during your rest for scheduling changes.",
        "detail": "A call in rest doesn't start your clock over — but it isn't allowed either.",
        "ref": "§8.N.3"
      }
    ],
    "action": "**Write the times down** — report, block-out, block-in, hotel arrival — and tell Crew Scheduling on the recorded line where you are against the limit."
  },
  {
    "badge": "§9",
    "title": "Scheduling just called me on reserve",
    "note": "Notice, report times & FOLO",
    "rows": [
      {
        "statement": "**Long-call:** 12 hours notice before your first assignment.",
        "detail": "",
        "ref": "§9"
      },
      {
        "statement": "**Short-call:** 2 hours to report — and your first-day RAP can't move without your consent.",
        "detail": "",
        "ref": "§9"
      },
      {
        "statement": "**FOLO preference** is due 72 hours before your block starts.",
        "detail": "",
        "ref": "§9"
      }
    ],
    "action": "**Note the minute the phone rang.** Your report clock starts at the call, not when you got the voicemail. Reserve life in full: [Reserve Field Guide](#)."
  },
  {
    "badge": "§3",
    "title": "My paycheck looks wrong",
    "note": "Guarantee, minimums & premiums",
    "rows": [
      {
        "statement": "**75-hour** monthly guarantee when you're available all month.",
        "detail": "",
        "ref": "§3"
      },
      {
        "statement": "Minimum day pay is the greater of actual or **3.5 hours**.",
        "detail": "",
        "ref": "§3"
      },
      {
        "statement": "Junior assignment pays **1.5×**, reverse seniority, max 3 a month.",
        "detail": "",
        "ref": "§8"
      }
    ],
    "action": "**Report it in writing within 5 business days** and keep your copy. Check the math first with the [Paycheck Estimator](Tools.dc.html)."
  },
  {
    "badge": "§8",
    "title": "My line or my days off changed",
    "note": "Awards, trades & days off",
    "rows": [
      {
        "statement": "Final awards post the **21st at 1700 ET** — that line is yours.",
        "detail": "",
        "ref": "§8"
      },
      {
        "statement": "Days off dropped below the minimum must be restored.",
        "detail": "",
        "ref": "§8"
      },
      {
        "statement": "A reassignment for a failed commute is capped at equal days.",
        "detail": "",
        "ref": "§8.Q.2"
      }
    ],
    "action": "**Screenshot before and after.** A changed line you never agreed to is grievable — but only if you can show what it was."
  },
  {
    "badge": "§4",
    "title": "I'm sick, or I'm on vacation",
    "note": "Sick accrual & vacation",
    "rows": [
      {
        "statement": "Sick accrues **3.5 hours a month** — and only you can call yourself sick.",
        "detail": "",
        "ref": "§4"
      },
      {
        "statement": "Vacation is earned by longevity, up to **5 weeks**.",
        "detail": "",
        "ref": "§5"
      },
      {
        "statement": "You're not required to share your whereabouts on vacation.",
        "detail": "",
        "ref": "§5"
      }
    ],
    "action": "**Call sick on the recorded line** and don't let anyone talk you out of it. Fit to fly is your call, not Scheduling's."
  }
];

/** Band openers. The figure count is stated, so it tracks the array. */
export const contractCopy = {
  figuresKicker: 'Keep these in your head',
  figuresHeading: `${
    ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'][
      contractFigures.length
    ] ?? contractFigures.length
  } numbers, and you're covered.`,
  figuresLead:
    'Almost every conversation on the line comes back to one of these. Tap any row for ' +
    'what it actually means and what to do about it.',
  situationsKicker: 'When it happens on the line',
  situationsHeading: 'Find your situation. Open it.',
  situationsLead:
    'You don\'t think in section numbers at 5am in a hotel lobby — you think "can they do ' +
    'this?". Tap the one that\'s happening to you.',
  docsKicker: 'Want every word',
  docsHeading: 'Take the manual with you.',
  docsLead:
    'This page is the streamlined version — the parts you need in the moment. The complete ' +
    'section-by-section text lives in the full guides.',
} as const;
