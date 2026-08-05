import type { Guide } from './types';
import { LISTING_METHODS, ALLEGIANT_COUNTER_NOTE } from './how-to-list';

/**
 * How-To Guide — new field guide from the design handoff's how-to-guide
 * template ("Reposted by popular demand"). Previously this had no page of its
 * own: the /commuting/ resource card pointed an anchor into the middle of the
 * Commuting Guide's "Free Flying & Listing" section, flagged in resources.ts
 * as a placeholder until an artifact existed.
 *
 * The airline-listing table is shared with commuting.ts — see
 * ./how-to-list.ts for why, and for the two edits made against the source.
 */
export const howToGuide: Guide = {
  slug: 'how-to-guide',
  title: 'How to List, by Airline',
  eyebrow: 'Field Reference · Jumpseat · Cabin Seat · Commuter',
  subtitle: 'Jumpseat · Cabin Seat · Commuter',
  intro:
    'Flight Attendants and Pilots can fly any domestic US carrier for free by listing as a ' +
    'commuter, cabin seat, or jumpseat. This is separate from Zedding.',
  meta: {
    translates: 'Reposted by popular demand',
  },
  contents: [{ label: 'How to List, by Airline' }, { label: 'Who Can Use What' }],

  sections: [
    {
      title: 'How to List, by Airline',
      refLabel: 'Step by step',
      accent: 'navy',
      icon: 'ph-list-numbers',
      blocks: [
        {
          kind: 'note',
          tone: 'alert',
          icon: 'ph-identification-card',
          text:
            '**Always use your AA info.** Even if you see a PSA option, don\'t use it — it won\'t ' +
            "work. Once listed, use your confirmation code to check in through the airline's app " +
            'or website.',
        },
        {
          // Rows, not a table: three methods whose left column is a label to
          // read rather than a key to look up. The Commuting Guide's copy of
          // the same data stays a table — there it sits among other tables.
          kind: 'rows',
          title: 'Listing Methods',
          rows: LISTING_METHODS.map((m) => ({
            icon: m.icon,
            accent: m.accent,
            title: m.method,
            body: m.airlines,
          })),
        },
        {
          kind: 'note',
          icon: 'ph-phone-outgoing',
          text: ALLEGIANT_COUNTER_NOTE,
        },
        {
          kind: 'note',
          tone: 'caution',
          text: '**MyIDtravel and ID90 are two separate things.** MyIDtravel is on the PSA website; ID90 is an app.',
        },
      ],
    },
    {
      title: 'Who Can Use What',
      accent: 'red',
      icon: 'ph-users-three',
      blocks: [
        {
          kind: 'table',
          title: 'Free Travel Privileges',
          head: ['Privilege', 'Who can use it'],
          rows: [
            ['Jumpseat / Cabin Seat (Free)', 'You only'],
            ['Zed Tickets', 'You, parents, spouse / partner & dependent children'],
            ['Registered Companions', 'OneWorld partners only'],
          ],
        },
      ],
    },
  ],
};
