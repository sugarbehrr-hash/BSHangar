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
      blocks: [
        {
          kind: 'note',
          tone: 'warn',
          text:
            '**Always use your AA info.** Even if you see a PSA option, don\'t use it — it won\'t ' +
            "work. Once listed, use your confirmation code to check in through the airline's app " +
            'or website.',
        },
        {
          kind: 'table',
          title: 'Listing Methods',
          head: ['Method', 'Airlines'],
          rows: LISTING_METHODS.map((m): [string, string] => [m.method, m.airlines]),
        },
        {
          kind: 'note',
          text: ALLEGIANT_COUNTER_NOTE,
        },
        {
          kind: 'note',
          text: '**MyIDtravel and ID90 are two separate things.** MyIDtravel is on the PSA website; ID90 is an app.',
        },
      ],
    },
    {
      title: 'Who Can Use What',
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
