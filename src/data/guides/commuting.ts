import type { Guide } from './types';

/**
 * Commuting Guide — ported in full from the export's commuting-guide template
 * (7 sheets, ~2,450 words). The site previously shipped only the ~420-word
 * summary that /commuting/ renders.
 *
 * Content carried verbatim with four source defects corrected:
 *  - "List early. Document everything. Arrive on time.**" had an unmatched bold
 *    marker that printed a literal "**".
 *  - "Confirm your **8 mandatory items and ** crew ID" — same, mid-sentence.
 *  - "keep keep hard copy" — duplicated word.
 *  - The union number printed as 1.844.433.2232 throughout. Confirmed correct
 *    value is 844-423-2232, which the site renders from site.ts, so it is not
 *    duplicated in this file at all.
 */
export const commutingGuide: Guide = {
  slug: 'commuting-guide',
  title: 'Commuting Guide',
  eyebrow: 'Field Reference · Non-Rev Commuting · List · Fly · Check In',
  subtitle: 'List early. Document everything. Arrive on time.',
  intro:
    'Everything you need to list, fly, and report on time, plus your protections when a ' +
    'commute falls apart. Straight from the Commuter Program and our CBA.',
  meta: {
    translates: 'Covers the Commuter Program & CBA §8.Q Rejoin Rights',
    revised: 'Master sheet · last revised June 30, 2026',
  },
  contents: [
    { label: 'The Commuter Program' },
    { label: 'If Your Commute Fails' },
    { label: 'Getting to Your Gate' },
    { label: 'Free Flying & Listing' },
    { label: 'Dress Guidelines' },
    { label: 'Day-Of Checklist' },
  ],

  sections: [
    {
      title: 'The Commuter Program',
      refLabel: 'Your responsibilities on a commuting day',
      lead:
        'Commuting to and from work, and any expenses incurred, are **your responsibility**. ' +
        'Follow these steps every commuting day so you stay covered under the program.',
      blocks: [
        {
          kind: 'steps',
          title: 'Your Responsibilities',
          steps: [
            {
              label: 'List 24 Hours Early',
              body:
                'List as a non-rev passenger with a **primary and secondary option** (both with ' +
                'available seats) no less than **24 hours in advance**.',
            },
            {
              label: 'Allow Enough Time',
              body:
                'Both flights must arrive with enough time — **1 hour is recommended** — to check ' +
                'in and begin your duties safely, without disrupting the operation.',
            },
            {
              label: 'Notify Crew Scheduling',
              body:
                'If your primary flight is delayed or unavailable, **immediately notify Crew ' +
                'Scheduling** with your back-up flight number and departure time.',
            },
            {
              label: 'Keep Trying',
              body:
                'Once your commute begins, continue trying to reach base unless directed otherwise ' +
                'by your supervisor and/or **Crew Scheduling** (must be on the recorded line).',
            },
            {
              label: 'Ground Transport Too',
              body:
                'Commuting by ground? The same rules apply. Ask your **Inflight Supervisor for a ' +
                'deviation** if driving applies to your commute, and document everything if asked.',
            },
          ],
        },
        {
          kind: 'table',
          title: 'Flight Listing Examples',
          ref: 'primary + secondary, both with seats',
          head: ['Scenario', 'How to list'],
          rows: [
            ['Two direct flights', 'Primary & Secondary: **MIA → DCA** (direct)'],
            ['Two via connection', 'Primary & Secondary: **MIA → CLT → DCA**'],
            ['One direct + one connection', 'Primary: **MIA → DCA** · Back-up: **MIA → CLT → DCA**'],
          ],
        },
        {
          kind: 'note',
          text:
            "**Two options, always.** Your back-up needs open seats too — a secondary with no " +
            "availability doesn't count as a listed option under the program.",
        },
      ],
    },

    {
      title: 'If Your Commute Fails',
      refLabel: 'Call Crew Scheduling — confirm one option, in order of preference',
      lead:
        "If you've followed the program and still can't reach base, you have contractual options. " +
        '**Call Crew Scheduling** and work through them in order. CS must approve where noted.',
      blocks: [
        {
          kind: 'list',
          title: 'Line Holder',
          ref: '§8.Q.2',
          items: [
            'Rejoin your scheduled trip once you arrive in base or at reporting base, per **§8.Q.2** (FA CBA). A 1 to 2 hour minimum is needed to rejoin.',
            'Be assigned other pairings up to **equal days**, within FAR limits.',
            'Contact your **Inflight Supervisor** for next steps.',
          ],
        },
        {
          kind: 'list',
          title: 'Reserve',
          ref: 'CS must approve',
          items: [
            'Move your reserve period to a later time if needed **(CS must approve)**.',
            'Be assigned to **Ready (Hot) Reserve** per the CBA.',
            'Be assigned another Reserve Day, mutually agreed with CS **(CS must approve)**.',
            'Contact your **Inflight Supervisor** for next steps.',
          ],
        },
        {
          kind: 'note',
          text:
            '**CS = Crew Scheduling.** Any change to your reserve period or day must be confirmed ' +
            'with Crew Scheduling on the recorded line.',
        },
        {
          kind: 'prose',
          title: 'Compensation & Documentation',
          text:
            "You'll be **compensated for trips actually flown** if reassigned. If you're unavailable " +
            'under this program, you will **not** be paid or credited for missed flights, and your ' +
            'minimum monthly guarantee may be prorated. Compensation does not apply to deadhead ' +
            'flights or trips lost due to unavailability.',
        },
        {
          kind: 'note',
          tone: 'warn',
          text:
            '**Within 24 hours of a failed commute:** advise your Inflight Supervisor and submit ' +
            'documentation showing you followed the Commuter Program. The CNC code converts to ' +
            '**COM**. Fail to document: 1st time the CNC code remains; 2nd time or more it becomes ' +
            'a **NSW**.',
        },
        {
          kind: 'prose',
          text:
            '**Delays reporting to work** due to commuting problems may be excused under certain ' +
            'circumstances. But crew members who **regularly** show up late due to failed commutes ' +
            'may be required to meet with their Inflight Supervisor and provide supporting ' +
            'documentation.',
        },
      ],
    },

    {
      title: 'Getting to Your Gate',
      refLabel: 'Tips for a smooth, well-documented commute',
      lead:
        'Small habits keep you at the top of the standby list and keep your paper trail clean. ' +
        'Build these into every commute.',
      blocks: [
        {
          kind: 'list',
          title: 'Tips for Success',
          items: [
            '**Check in early.** Use Travel Planner (if on American) 24 hours before departure to sit at the top of the standby list.',
            '**Allow 45 minutes.** Aim to get from employee parking to your gate at least 45 minutes before departure.',
            '**Large airports.** Build in extra time to move between terminals or concourses.',
            "**Check in at the gate.** Once there, let the gate agent know you're present as soon as possible.",
            '**Notify CS.** Tell Crew Scheduling as soon as you arrive at your reporting airport.',
            '**Keep documentation.** Save receipts, screenshots, and boarding passes in case the Company requests them.',
          ],
        },
        {
          kind: 'prose',
          title: 'Boarding-Pass Documentation',
          text:
            '**Photograph everything.** Email a picture of your first two boarding passes to your ' +
            "Inflight Supervisor if you don't make your first two flights. Hold on to the originals: " +
            '**2 hard copies of 2 different boarding passes**.',
        },
        {
          kind: 'note',
          text:
            '**Print outside security.** When you arrive, print your boarding pass at a kiosk or ' +
            'with a gate agent **outside of security** and take a picture immediately. When a seat ' +
            'is assigned, ask for a **printed boarding pass** for commuting documentation.',
        },
        {
          kind: 'prose',
          text:
            '**Flying United?** Take a screenshot of your reservation and show it with your crew ID ' +
            'at the gate. The **United** and **Hawaiian** apps also let you see the standby list.',
        },
      ],
    },

    {
      title: 'Free Flying & Listing',
      refLabel: 'Jumpseat · Cabin Seat · Commuter',
      lead:
        'Flight Attendants can fly **any domestic US carrier for free** by listing as a commuter, ' +
        'cabin seat, or jumpseat. This is separate from Zedding.',
      blocks: [
        {
          kind: 'note',
          tone: 'warn',
          text:
            '**Always use your AA info.** AA 6-digit number & first.last@aa.com. Even if you see a ' +
            "PSA option, don't use it — it won't work.",
        },
        {
          kind: 'table',
          title: 'How to List, by Airline',
          head: ['Method', 'Airlines'],
          rows: [
            ['List with ID90', 'Frontier · United'],
            ['At the Counter / Gate', 'Delta · Alaska / Hawaiian'],
            ['List with MyIDtravel', 'Allegiant · JetBlue · Sun Country · Southwest'],
          ],
        },
        {
          kind: 'prose',
          text:
            '**Once listed**, use your confirmation code to check in through the airline\'s app or ' +
            'website. Except United — see a Gate Agent with your confirmation code.',
        },
        {
          kind: 'note',
          text:
            '**MyIDtravel and ID90 are two separate things.** MyIDtravel is on the PSA website; ' +
            "ID90 is an app. Don't mix them up.",
        },
        {
          kind: 'list',
          title: 'Pro Tips',
          items: [
            '**Standby lists.** The AA and United apps let you see the standby list.',
            '**Check-in apps.** You can also use the JetBlue and Southwest apps to check in.',
            '**United check-in.** Screenshot your reservation and show it with your crew ID at the gate.',
            '**Load checking.** Download **StaffTraveler** or join the "Non-Rev Loads" Facebook group.',
            '**ID90 sign-up.** Signed up with your PSA number? Delete and re-signup with your AA info, or contact ID90 to change it.',
            '**Print boarding pass.** Print outside security when you arrive and take a picture immediately.',
          ],
        },
      ],
    },

    {
      title: 'Dress Guidelines',
      refLabel: 'What to wear when flying non-rev',
      lead:
        "American doesn't have a prescribed dress code for non-rev guests. As long as your clothing " +
        "is neat, clean, and doesn't offend or distract, you're good to fly in any class, including " +
        'premium cabins. The specifics:',
      blocks: [
        {
          kind: 'list',
          title: 'The Specifics',
          items: [
            "**No offensive or distracting attire.** Avoid super-short shorts, bare-midriff, provocative/revealing/see-through, or overly torn/dirty/frayed clothing, plus swimwear and sleepwear. (It's always fine to change into American-provided pajamas if you snag a First Class seat on a premium international flight.)",
            '**Nothing vulgar** or that violates community standards of decency.',
            '**When in doubt, ask:** "Do I blend in with customers, or do I appear better dressed than other customers?" If so, you\'re probably set.',
          ],
        },
        {
          kind: 'note',
          text:
            '**Reminder:** those flying under your travel privileges must adhere to the dress ' +
            'guidelines too — they represent both you and the Company. You or your travelers may ' +
            'be denied boarding if unsuitably dressed.',
        },
        {
          kind: 'prose',
          title: 'Company Travel & Other Carriers',
          text:
            'Traveling for the company? Business or business-casual clothing is encouraged. ' +
            'Jumpseat riders still abide by the non-rev dress guidelines above and should consult ' +
            'their operating department, Flight Manual, or leader for additional rules.',
        },
        {
          kind: 'prose',
          text:
            'On **other carriers**, dress to public standards of good taste — office-appropriate or ' +
            'smart-casual wear. This excludes jeans, t-shirts, sweatshirts, shorts, gym shoes, and ' +
            'similar. Verify each airline\'s dress requirements when traveling on a ZED ticket or ' +
            'company business pass; carrier-specific references are at **flyzed.info**.',
        },
      ],
    },

    {
      title: 'Commute Checklist',
      refLabel: 'Grab-and-go — run this on your commuting day',
      lead:
        'The rest of this guide explains the **why**. This page is the **what to do**. Work top to ' +
        'bottom and check each box as you go.',
      blocks: [
        {
          kind: 'checklist',
          groups: [
            {
              marker: '1',
              title: 'The Night Before · 24h Out',
              when: 'Before you leave',
              items: [
                '**List a primary AND secondary flight** — both with open seats — at least 24 hours ahead.',
                '**Check in 24h before** via Travel Planner (if on American) to top the standby list.',
                'Check the loads (Travel Planner, StaffTraveler or "Non-Rev Loads") and pack your bag.',
                'Confirm your **8 mandatory items** and crew ID are on hand and packed.',
              ],
            },
            {
              marker: '2',
              title: 'Heading to the Airport',
              when: 'In transit',
              items: [
                'Leave early — add time for large airports, terminals, and parking (**aim 45 mins** before departure-to-gate).',
                '**Print your boarding pass outside security** and photograph it immediately.',
                'Primary flight delayed or full? **Notify Crew Scheduling** with your back-up flight number & time.',
              ],
            },
            {
              marker: '3',
              title: 'At the Gate & On Arrival',
              when: 'Made it',
              items: [
                'Check in with the gate agent as soon as you arrive at the gate. If the flight looks full, ask if the JS is available.',
                'Seat assigned? Get a **printed boarding pass** and photograph it. Keep the hard copy.',
                '**Check in on Crew Mobile or notify CS via call** the moment you reach your reporting airport.',
              ],
            },
            {
              marker: '!',
              title: 'If the Commute Fails',
              when: 'Protect yourself',
              alert: true,
              items: [
                '**Call Crew Scheduling** and confirm an option in order: rejoin trip → reassign → reserve move (CS approves).',
                '**Email your first two boarding-pass photos** to your Inflight Supervisor.',
                '**Within 24 hours:** advise your Supervisor & submit documentation so the CNC code converts to **COM**.',
                'Save **every** receipt, screenshot, and boarding pass.',
              ],
            },
          ],
        },
      ],
    },
  ],
};
