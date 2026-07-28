/* ============================================================
   Commuting — the hub's figures and situations
   ------------------------------------------------------------
   Same two patterns as the contract hub, driven by commuting's
   OWN content — deliberately not aligned to it:

     · four figures, because only four things are real program
       deadlines. The count is not stated in the copy, so it can
       drift without a rewrite.
     · the chips are a timeline (Before / Before / Before / After),
       not § citations — commuting rules mostly aren't CBA sections.

   **bold** and [label](href) are the markers rich-text.ts reads.

   One correction to the handoff copy: it carried the union number
   as 844-433-2232. That transposition is a known historical bug
   (see UNION_REP_PHONE in src/data/site.ts); the confirmed number
   is 844-423-2232 and pages should render it from that constant.
   ============================================================ */

import type { ContractFigure, ContractIntro, ContractSituation } from './contract-hub';

/** Same shapes as the contract hub — the patterns are shared, the content is not. */
export type CommutingFigure = ContractFigure;
export type CommutingSituation = ContractSituation & { anchor?: string };

export const commutingFigures: CommutingFigure[] = [
  {
    "key": "list",
    "value": "24",
    "unit": "hrs",
    "label": "List before report",
    "caption": "No less than 24 hours ahead of your trip",
    "ref": "Before",
    "pane": {
      "title": "List before report",
      "sub": "Program · 24 hrs",
      "paras": [
        "Listing inside 24 hours doesn't just hurt your odds — it can take you outside the program entirely, which means no protection when the flight fills.",
        "Check in 24 hours early through Travel Planner too. Standby order rewards the people who did it first."
      ],
      "action": "**Set a repeating alarm for 25 hours before report** so listing happens before the evening gets away from you."
    }
  },
  {
    "key": "two",
    "value": "2",
    "unit": "flights",
    "label": "Primary and secondary",
    "caption": "Both need open seats when you list",
    "ref": "Before",
    "pane": {
      "title": "Primary and secondary",
      "sub": "Program · 2 flights",
      "paras": [
        "Two listed flights, both with open seats at the time you list. A back-up that was already full doesn't count as a back-up.",
        "If the primary goes sideways, Crew Scheduling needs the secondary's **flight number and time** — not “I'll figure something out”."
      ],
      "action": "**Screenshot both listings** the moment they confirm. Loads change; your screenshot doesn't."
    }
  },
  {
    "key": "buffer",
    "value": "1",
    "unit": "hr",
    "label": "Cushion before check-in",
    "caption": "On both flights, not just the primary",
    "ref": "Before",
    "pane": {
      "title": "Cushion before check-in",
      "sub": "Program · 1 hr",
      "paras": [
        "Both flights should land with an hour to spare before you have to check in. A same-hour arrival isn't a commute, it's a coin flip.",
        "If only your secondary is that tight, list a different secondary. The cushion is what makes the back-up worth having.",
        "Build the ground in too: **45 minutes** from the parking space to the gate, more at a base where you change concourses."
      ],
      "action": "**Early report? Come in the night before.** A hotel or a crash pad beats a CNC on your record."
    }
  },
  {
    "key": "docs",
    "value": "24",
    "unit": "hrs",
    "label": "To document a failure",
    "caption": "What turns a CNC into a COM code",
    "ref": "After",
    "pane": {
      "title": "To document a failure",
      "sub": "CNC → COM · 24 hrs",
      "paras": [
        "A failed commute posts as **CNC** first. Getting your Supervisor the documentation within 24 hours is what converts it to **COM**.",
        "Send boarding passes, screenshots of the loads, and the times you called Scheduling. Miss the window and the code stays."
      ],
      "action": "**Email it, don't phone it.** A timestamped email to your Supervisor is your proof that you made the window."
    }
  }
];

export const commutingIntro: ContractIntro = {
  "title": "Why the program matters",
  "sub": "Protection, not paperwork",
  "paras": [
    "The Commuter Program is what stands between a bad travel day and an attendance point. It only protects you if you did the four things above **before** the day went wrong."
  ],
  "action": "**Say it like this:** “I'm listed on 4821 primary and 5106 secondary, both had seats at 24 hours.” That one sentence is the whole program."
};

export const commutingSituations: CommutingSituation[] = [
  {
    "badge": "CNC",
    "title": "My commute failed and I can't make report",
    "note": "Call Scheduling before you're late, not after",
    "rows": [
      {
        "statement": "Call Crew Scheduling and confirm **one** option out loud.",
        "ref": "§8.Q.2",
        "detail": "Line holder: rejoin the trip at base, or be reassigned up to equal days."
      },
      {
        "statement": "On reserve: move the reserve period, take Ready (Hot) Reserve, or agree a new reserve day.",
        "ref": "Program",
        "detail": "Crew Scheduling has to approve whichever one you pick."
      },
      {
        "statement": "Keep trying to reach base until you're **released on the recorded line**.",
        "ref": "Program",
        "detail": "Stopping on your own is what turns a protected commute into an attendance issue."
      },
      {
        "statement": "Within **24 hours**, get your Supervisor the documentation so CNC converts to COM.",
        "ref": "CNC"
      }
    ],
    "action": "**Call before the report time passes.** Union Rep Assistance: [844-423-2232](tel:+18444232232) if anyone tells you the program doesn't apply.",
    "urgent": true,
    "flag": "Call first",
    "anchor": "failed"
  },
  {
    "badge": "FULL",
    "title": "My primary is full or delayed",
    "note": "Switching to the back-up",
    "rows": [
      {
        "statement": "Tell Crew Scheduling **immediately** — with the secondary's flight number and time.",
        "ref": "Program",
        "detail": "Not when you land. When you know."
      },
      {
        "statement": "Screenshot the loads and the gate display before you leave the gate area.",
        "ref": "Tip"
      },
      {
        "statement": "Still listed on the secondary with an hour of cushion? You're inside the program.",
        "ref": "Program"
      }
    ],
    "action": "**Check loads early with StaffTraveler** so the switch is a decision, not a surprise."
  },
  {
    "badge": "GATE",
    "title": "I'm leaving for the airport now",
    "note": "Ground time & paperwork",
    "rows": [
      {
        "statement": "Check in **24 hours** early through Travel Planner to sit as high as you can on the standby list.",
        "ref": "Program"
      },
      {
        "statement": "Allow **45 minutes** from the parking space to the gate.",
        "ref": "Tip",
        "detail": "Employee lot, shuttle, security, then the walk — and more if you change concourses."
      },
      {
        "statement": "Print outside security and photograph it immediately.",
        "ref": "Tip",
        "detail": "Two hard copies of two different boarding passes, every time."
      }
    ],
    "action": "**Save every receipt, screenshot and boarding pass.** None of it matters until the day goes wrong — and then it's the only thing that does."
  },
  {
    "badge": "ID90",
    "title": "I don't know how to list on this airline",
    "note": "Who uses what",
    "rows": [
      {
        "statement": "**List with ID90** — the app.",
        "ref": "Frontier · United"
      },
      {
        "statement": "**List with MyIDtravel** — on the PSA website, not the app.",
        "ref": "Allegiant · JetBlue · Sun Country · Southwest"
      },
      {
        "statement": "**At the counter or the gate** — nothing to do in advance.",
        "ref": "Delta · Alaska · Hawaiian"
      },
      {
        "statement": "Check in with your confirmation code — except United, where you see a gate agent.",
        "ref": "Tip"
      }
    ],
    "action": "**Always use your AA info** — 6-digit number and first.last@aa.com. Never the PSA option. Dress codes by carrier: [flyzed.info](#)."
  },
  {
    "badge": "RSV",
    "title": "I'm on reserve and I'm not going to make it",
    "note": "Your three options",
    "rows": [
      {
        "statement": "Move your reserve period to a later start.",
        "ref": "Program"
      },
      {
        "statement": "Take Ready (Hot) Reserve once you reach base.",
        "ref": "Program"
      },
      {
        "statement": "Agree a replacement reserve day — **Crew Scheduling must approve it**.",
        "ref": "Program"
      }
    ],
    "action": "**Pick the option and repeat it back** — “so that's my RAP moving to 1400 today.” Reserve rules in full: [Your Contract](Contract Hub.dc.html)."
  },
  {
    "badge": "DRESS",
    "title": "A gate agent questioned what I'm wearing",
    "note": "Any cabin, including premium",
    "rows": [
      {
        "statement": "Neat, clean and not distracting is the standard — good for any cabin you're seated in.",
        "ref": "Policy"
      },
      {
        "statement": "No swimwear, sleepwear, or torn or revealing attire.",
        "ref": "Policy"
      },
      {
        "statement": "Other carriers set their own bar — smart-casual travels everywhere.",
        "ref": "flyzed.info"
      }
    ],
    "action": "**Keep a layer in your bag.** A jacket or cardigan settles most of these conversations before they start."
  },
  {
    "badge": "TAX",
    "title": "My non-rev travel showed up on my paycheck",
    "note": "Imputed income, explained",
    "rows": [
      {
        "statement": "Some passes carry **imputed income** — a taxable value, not a charge.",
        "ref": "Tax",
        "detail": "If the imputed income is $100 and your bracket is 12%, you're taxed $12."
      },
      {
        "statement": "It shows on the check for the period the travel happened, so it can look like a deduction.",
        "ref": "Tax"
      }
    ],
    "action": "**It's usually small — don't let it stop you flying.** Sanity-check the rest of your check with the [Paycheck Estimator](Tools.dc.html)."
  }
];

/** Band openers — copy verbatim from Commuting Guide.dc.html. */
export const commutingCopy = {
  eyebrow: 'Non-Rev · List · Fly · Report',
  title: 'Getting To Base<br />Without Losing Sleep',
  sub:
    'Commuting sorted by the moment you need it — not by policy heading. Four deadlines that ' +
    'keep you inside the program, the situations that come up on the way to base, and the full ' +
    'guide when you want every word.',
  figuresKicker: 'Keep these in your head',
  figuresHeading: "Four deadlines. That's the program.",
  figuresLead:
    'Everything the Commuter Program asks of you is one of these four. Tap any row for what it ' +
    'actually means and what to do about it.',
  situationsKicker: 'When it happens on the way to base',
  situationsHeading: 'Find your situation. Open it.',
  situationsLead:
    'You don\'t think in policy headings standing at a full gate at 4am — you think ' +
    '\u201Cwhat do I do now?\u201D. Tap the one that\'s happening to you.',
  actionTitle: "Told the program doesn't cover you?",
  actionBody:
    'Call a rep before you agree to anything — before you accept a reassignment, a code, or a ' +
    "point. It's free and it's yours.",
  docsKicker: 'Want every word',
  docsHeading: 'Take the guide with you.',
  docsLead:
    'This page is the streamlined version — the parts you need in the moment. The complete text ' +
    'lives in the PDFs, sized for your bag. Download them once and they work with no signal.',
} as const;

/** The "it's going wrong right now" panel in the masthead's second column. */
export const commutingHelp = {
  flag: 'Commute going wrong right now',
  heading: "Don't stop trying.",
  headingAccent: 'Call, then document.',
  rows: [
    { k: 'Crew Scheduling', v: 'Call before you miss report' },
    // Union Rep sits between the two; the page renders its value from
    // UNION_REP_PHONE rather than a literal, so `phone` marks the slot.
    { k: 'Union Rep Assistance', v: '', phone: true },
    { k: 'Docs to Supervisor', v: 'Within 24 hrs' },
  ],
  ctaLabel: 'Commute-fail steps',
  ctaHref: '#failed',
} as const;
