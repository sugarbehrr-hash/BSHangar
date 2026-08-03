/* ============================================================
   Peak Design Roller Pro — the jumpseat pick
   ------------------------------------------------------------
   The first item page. Copy lives here rather than in the page,
   so the markup stays structural.

   Everything the ladder already knows — name, price, the
   compromise sentence, the photo — is read from the jumpseat
   entry in src/data/bags.ts rather than restated here. A product
   that says $600 in its buy bar and $610 in its ladder column is
   exactly the failure this page is supposed to be above.

   NOT A STAMPED PICK. This page used to run as the First Class
   rolling bag, carrying the Flight Attendant Approved stamp and
   the line "Flown by 3 CLT crew". Both were overclaims: the bag
   is a year old, was built for photographers rather than crew,
   and exactly one flight attendant in this group flies one. The
   stamp requires "more than one of us said so", so it comes off
   and the jumpseat mark goes on — which is the honest version
   and, having a name attached, the more useful one.

   **bold** and [label](href) are the inline markers understood by
   src/lib/rich-text.ts.
   ============================================================ */

import type { LedgerFigure, LedgerIntro } from './figure-ledger';
import { checkedLabel } from './catalog';
import { spinners } from './bags';

/** The category this page belongs to, and this page's own pick. */
export const spinnerCategory = spinners;
export const rollerPro = spinners.jumpseat;

/** "August 2026" — when the price below was last verified. */
const CHECKED = checkedLabel(spinners.checked);

export const rollerProCopy = {
  eyebrow: 'Bags & packing · Peak Design',
  title: 'Roller Pro',
  titleLine2: 'Carry-On',
  sub:
    'The best-built roller I have flown with, and the one I actually fly — but one flight ' +
    'attendant is not a verdict, so it carries my name instead of the stamp.',
  meta: ['Jumpseat pick · Cole, CLT', 'One crew, not the group', '8.6 lb empty — feel it before you buy'],
  backLabel: 'All crew essentials',
  stampChip: 'Jumpseat pick',
  stampLink: 'What the stamp means →',

  figuresKicker: 'The 30-second read',
  figuresHeading: 'Six numbers, then decide.',
  figuresLead:
    'Everything a flight attendant actually asks before buying a bag. Tap any number for the ' +
    'part that matters on the line.',

  galleryCaption:
    'Press shots from Peak Design for now — crew photos replace them as they come in.',

  standardKicker: 'The standard',
  standardHeading: 'Why this one has no stamp',
  standardLead:
    'Flight Attendant Approved is not a sticker we hand out. A pick has to clear all five ' +
    'points below, and this bag clears four of them. The fifth is the one that matters most:',
  standardNote:
    'The full standard — including the jumpseat mark and how a pick loses the stamp — is on ' +
    '[the Flight Attendant Approved page](/fa-approved/).',
  standardFooter:
    'Nothing on this page is sponsored. Where we earn a small commission, it is the note at ' +
    'the bottom — and it has never decided what gets a stamp, or what gets withheld.',

  tiersKicker: 'Same bar, three prices',
  tiersHeading: 'Spinners — all three tiers',
  tiersLead:
    'Every pick below cleared the gate this one has not. The tiers are price levels, and each ' +
    "one tells you what you're giving up. [How the tiers work](/fa-approved/).",

  buyLabel: `Street price · ${CHECKED}`,
  buyMeta:
    '**Peak Design Roller Pro Carry-On.** Same price direct or on Amazon; direct gets you ' +
    'the spare wheel bundle. Lifetime warranty on defects.',
  buyDirect: 'https://www.peakdesign.com/products/roller-pro',
  buyAmazon: 'https://www.amazon.com/dp/B0FDJ56Y7V',
  affiliate:
    '**A quick note.** As an Amazon Associate, the Hangar earns from qualifying purchases — ' +
    'at no extra cost to you. It pays for the guides and nothing else. If a pick stops being ' +
    'worth it, the stamp comes off, commission or not.',

  relatedKicker: 'Goes with it',
  relatedHeading: 'The rest of the kit',
  actionTitle: 'Flown with this one? Say so.',
  actionBody:
    'This is the one page on the site waiting on you. Two more crew reporting a year on it, ' +
    'and it stops being a jumpseat pick.',
} as const;

/** The four frames. First is the main 4/3; the rest are 1/1 supports. */
export const rollerProGallery = [
  { src: '/essentials/roller-pro-hero.jpg', alt: 'Peak Design Roller Pro Carry-On, front view' },
  { src: '/essentials/roller-pro-packed.jpg', alt: 'Peak Design Roller Pro Carry-On, packed' },
  { src: '/essentials/roller-pro-side.jpg', alt: 'Peak Design Roller Pro Carry-On, side profile' },
  { src: '/essentials/roller-pro-handle.jpg', alt: 'Peak Design Roller Pro Carry-On, handle' },
] as const;

export const rollerProIntro: LedgerIntro = {
  icon: 'ph-suitcase-rolling',
  title: 'Why these six',
  sub: 'Weight · space · money',
  paras: [
    'Every bag review online is written by someone who flies twelve times a year. You fly ' +
      'twelve times a week — so the questions are different: what does it weigh empty, will ' +
      'it clear the sizer, and what happens to your month if it disappears.',
    'Those are the six. Nothing on this page is sponsored, and the downsides are listed as ' +
      'plainly as the wins.',
  ],
};

export const rollerProFigures: LedgerFigure[] = [
  {
    key: 'weight',
    icon: 'ph-scales',
    value: '8.6',
    unit: 'lb',
    label: 'Empty weight',
    caption: 'Before you pack a single thing',
    ref: 'Heavy',
    pane: {
      title: 'Empty weight',
      sub: '8.6 lb · about 2 lb over a soft-side 21"',
      paras: [
        "This is the complaint in nearly every review, and it's real. The Economy pick weighs " +
          '**5.4 lb**; this one starts at **8.6** because of the polycarbonate shell and ' +
          'carbon trolley. (For scale: the classic FlightCrew Rollaboard is 9.6.)',
        'You feel it lifting into a bin at the end of a four-leg day, not walking through the ' +
          'terminal — the wheels are so good the weight vanishes on the ground.',
      ],
      actionIcon: 'ph-barbell',
      action:
        '**If you already fight your bag into regional bins, skip this one.** Two extra pounds ' +
        'over your head, ten times a day, is a real cost.',
    },
  },
  {
    key: 'fits',
    icon: 'ph-package',
    value: '34',
    unit: 'L',
    label: 'What actually fits',
    caption: 'A four-day plus uniform · 39 L expanded',
    ref: 'Roomy',
    pane: {
      title: 'What actually fits',
      sub: '34 L standard · 39 L expanded',
      paras: [
        'Four days of clothes, a spare uniform and shoes, with the front pocket left for the ' +
          'things you grab at security. The lid opens like a drawbridge, so you can work out ' +
          'of it in a hotel room with no floor space.',
        'There is an external laptop sleeve — an iPad or 16" laptop comes out without ' +
          'unpacking anything.',
      ],
      actionIcon: 'ph-arrows-out-line-vertical',
      action:
        '**The 5 L expansion is for the hotel, not the airplane.** Expanded it is 11" deep and ' +
        'no longer sizer-legal.',
    },
  },
  {
    key: 'sizer',
    icon: 'ph-ruler',
    value: '0.2',
    unit: 'in spare',
    label: 'Clearance in the sizer',
    caption: '21.8 × 14 × 9 against a 22 × 14 × 9 frame',
    ref: 'Legal',
    pane: {
      title: 'Clearance in the sizer',
      sub: '21.8 × 14 × 9 in',
      paras: [
        'It clears a standard 22 × 14 × 9 frame with two tenths of an inch to spare — wheels ' +
          'and handle included, which is where most "carry-on sized" bags cheat.',
        'On a regional it behaves like any 22-inch bag: wheels-first up front, or the closet ' +
          'when the bins are full.',
      ],
      actionIcon: 'ph-seal-check',
      action:
        '**Never gate-check it expanded.** Zip the gusset closed before you leave the hotel ' +
        'and it is legal everywhere.',
    },
  },
  {
    key: 'wheels',
    icon: 'ph-wrench',
    value: '60',
    unit: 'mm',
    label: 'Wheels you replace yourself',
    caption: 'The first thing to die on any crew bag',
    ref: 'Fixable',
    pane: {
      title: 'Wheels you replace yourself',
      sub: '60 mm · user-serviceable',
      paras: [
        'Crew bags do not die, their wheels do — usually somewhere around month fourteen, on ' +
          'jetbridge grating. These unbolt and swap out at home for the cost of a crew meal.',
        'Everything else is covered by a lifetime warranty on defects, which on this kind of ' +
          'use is the only warranty worth reading.',
      ],
      actionIcon: 'ph-shopping-bag-open',
      action:
        '**Buy the spare wheel set with the bag.** You will want it before you want anything ' +
        'else.',
    },
  },
  {
    key: 'price',
    icon: 'ph-tag',
    value: '600',
    unit: 'USD',
    label: 'What you will pay',
    caption: `Direct or Amazon · checked ${CHECKED}`,
    ref: 'Steep',
    pane: {
      accent: 'var(--gold-600)',
      title: 'What you will pay',
      sub: `$600 USD · checked ${CHECKED}`,
      paras: [
        'There is no way to soften this: it costs roughly what a reserve line pays in a week, ' +
          'and it buys a bag the group has not vetted. Most crew should buy the Main Cabin ' +
          'pick instead and never think about it again.',
        'The case for it is time — five to seven years of daily use, with parts you can ' +
          'replace, against a $150 bag you buy again every eighteen months.',
      ],
      actionIcon: 'ph-calendar-check',
      action:
        '**If you are in your first year, wait.** Fly a cheap bag until you know your pattern, ' +
        'then buy once.',
    },
  },
  {
    key: 'lost',
    icon: 'ph-warning',
    value: '0',
    unit: 'covered',
    label: 'If it walks off a crew rack',
    caption: 'Lifetime warranty covers defects, not loss',
    ref: 'Tag it',
    pane: {
      accent: 'var(--red-600)',
      title: 'If it walks off a crew rack',
      sub: '$600 out of pocket',
      paras: [
        'The lifetime warranty covers defects. It does not cover theft, loss, or the ramp. At ' +
          'this price the bag becomes something you notice being away from — which for some ' +
          'crew is reason enough to buy something cheaper.',
        'It ships direct or from Amazon, so a replacement is days away, not hours. There is no ' +
          'walking into a store on a layover.',
      ],
      actionIcon: 'ph-tag-simple',
      action:
        '**Tag it inside and out, and photograph the serial.** Add it to your renters or ' +
        'homeowners policy — most cover it away from home.',
    },
  },
];

/** The wins and the downsides, side by side. Both lists are required. */
export const rollerProVerdictCards = {
  keep: {
    icon: 'ph-thumbs-up',
    accent: 'var(--success-600)',
    title: 'Why crew keep it',
    sub: 'Three things, not thirty',
    rows: [
      '**The flat carbon handle.** No trolley bumps inside, so a uniform jacket lies flat ' +
        'instead of folding over two rails.',
      '**The lid opens forward.** You can get into it in a hotel room the size of a galley, ' +
        'or on a jumpseat row, without laying it down.',
      '**The laptop pocket is on the outside.** Electronics out at security without unzipping ' +
        'the bag you just packed.',
    ],
  },
  headsUp: {
    icon: 'ph-warning-octagon',
    accent: 'var(--red-600)',
    title: 'Heads up before you buy',
    sub: 'The parts a sponsored review skips',
    rows: [
      '**8.6 lb empty is a lot.** Nearly two pounds more than the soft-side most of us fly.',
      '**Four spinner wheels are terminal wheels.** On jetbridge grating and carpeted aisles ' +
        'you will tow it on two anyway.',
      '**$600 is a lot to leave in a hotel lobby.** If you have lost a bag before, buy the ' +
        'cheaper pick and sleep better.',
    ],
  },
} as const;

/**
 * The standard, scored against this bag. The five points are the same gate as
 * /fa-approved/, and the flagged one is the point this pick FAILS — which is
 * the whole reason the page carries a jumpseat mark instead of a stamp.
 *
 * The flag is not decoration: four green checks and one amber warning is the
 * page saying out loud what it cannot claim.
 */
export const rollerProCriteria = [
  {
    text:
      '**Flown, not sampled.** Eighteen months in a real rotation, paid for out of pocket.',
  },
  {
    text:
      '**It fits our constraints.** The sizer, the bin, the hotel room, the uniform, the TSA ' +
      'line.',
  },
  {
    text:
      '**It survives the schedule.** Repairable, or replaceable in parts, when the miles ' +
      'catch up.',
  },
  {
    text:
      "**Its compromise is named.** Every pick says in one sentence what you're giving up. " +
      '**This one: the price, and two pounds of empty weight.**',
  },
  {
    flag: true,
    text:
      '**More than one of us said so — and here, nobody else has.** The bag is a year old and ' +
      'was built for photographers, not crew. One flight attendant flying one is a ' +
      'recommendation, not a verdict, so the stamp stays off until the group has flown it.',
  },
] as const;

/**
 * The one quote on the site with a name on it. That is the point of a jumpseat
 * pick — an attributed opinion beats an anonymous consensus of one.
 */
export const rollerProVerdict = {
  quote:
    '“I have carried this through two winters of CLT weather and one ramp that clearly hated ' +
    "it. It looks new. I still wince at what it cost — and I'd buy it again. I just can't " +
    'tell you the group agrees with me, because it hasn\'t flown one yet.”',
  byline: 'Cole · CLT · 9 years on the line',
} as const;

/**
 * Related picks. Named by title and looked up in `products`, so the tile's
 * icon and tag cannot drift from the same product's tile on the browse page.
 */
export const rollerProRelated = [
  {
    title: 'Packing Cubes',
    blurb: 'Four cubes is exactly one four-day. The drawbridge lid was built around them.',
  },
  {
    title: 'Luggage Tags',
    blurb: 'A $600 bag on a crew rack needs a name on it. Inside and out.',
  },
  {
    title: 'Layover Sleep Kit',
    blurb: 'Fits the front pocket, and does more for a four-day than the bag does.',
  },
] as const;
