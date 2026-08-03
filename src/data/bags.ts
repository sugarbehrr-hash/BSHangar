/* ============================================================
   Rolling bags — the two categories worked all the way through
   ------------------------------------------------------------
   Source: Cole's spinner and rollaboard reviews (Aug 2026). He
   wrote them as five levels — My Pick, Flagship, Premium, Main
   Cabin Extra, Economy — and those are NOT the three tiers this
   site is built on, for a reason worth writing down:

   His levels grade build pedigree, not price, and the two come
   apart badly. The LuggageWorks Aurora sits in his "Premium"
   tier at $210 while the Travelpro FlightCrew5 22" sits in his
   "Economy" tier at $220. Ten dollars apart, two levels apart.
   Shipping that would have broken the one promise the ladder
   makes — that the tiers are price levels and never grades.

   So the picks are tiered by what they cost, his levels are kept
   as the research they are, and his personal pick moved to the
   jumpseat slot, which exists precisely because it isn't a price.

   PRICES BELONG TO THEIR LINK. A pick's price is the price at
   the URL it links to — not an MSRP, not a best-anywhere price.
   A ladder that says $220 next to a button landing on a $260
   listing is broken, and no reader will forgive it twice.

   Affiliate links are not wired yet, so today's figures are
   street prices from the sellers named per pick (Aug 2026). The
   moment referral links land, every price is re-checked against
   the listing it actually points at, and `checked` moves.

   Amazon is the preferred destination because it converts best,
   but it is not a requirement: some picks are direct-from-maker
   (LuggageWorks) and some may end up earning through a coupon
   code instead of a link. The buy button derives its own label
   from the URL — see sellerFor() in catalog.ts.
   ============================================================ */

import type { TierCategory } from './catalog';

/** When every price on this page was last verified, as YYYY-MM. */
const CHECKED = '2026-08';

/**
 * States the rule ONCE, under the ladder, instead of stamping every row.
 * Being listed here already means a pick cleared the standard, so the only
 * thing worth marking is where that is not true.
 */
const PROVISIONAL_NOTE =
  'Everything on this ladder cleared the standard — that is what being here means. Only the ' +
  'exceptions are marked: provisional picks are still inside their 90-day wear test, and the ' +
  'jumpseat pick is one crew member’s own, with no group verdict behind it.';

const PROVISIONAL_NOTICE =
  '**Some picks here are provisional.** They are the bags crew name most, but a pick only ' +
  'gets the stamp after 90 days in a real rotation, reported by more than one of us. Until ' +
  'then the review stands and the stamp does not.';

/* ------------------------------------------------------------
   Spinners — four wheels
   ------------------------------------------------------------ */

export const spinners: TierCategory = {
  key: 'spinners',
  label: 'Spinners',
  cat: 'bags',
  icon: 'ph-suitcase-rolling',
  blurb:
    'Six approved four-wheel picks, $160 to $1,050 — same quality bar, three price levels. ' +
    'Effortless in a terminal, consumable on a bad ramp.',
  checked: CHECKED,
  provisionalNote: PROVISIONAL_NOTE,
  provisionalNotice: PROVISIONAL_NOTICE,

  picks: [
    {
      tier: 'economy',
      name: 'Travelpro Maxlite 5 21"',
      price: 160,
      stat: '5.4 lb — the lightest bag on this page',
      compromise:
        'the handle wobbles fully extended and it tips if you let go in motion — plan on buying it again in a couple of years.',
      text:
        'The bag you actually see crew pulling through a terminal. Ultra-light, quiet wheels, a ' +
        'useful 2" expansion and a limited lifetime warranty, at a price that means losing it ' +
        'does not ruin your month.',
      url: 'https://www.amazon.com/Travelpro-Luggage-Lightweight-Expandable-Suitcase/dp/B07BL7JXHV',
      image: '/essentials/maxlite-5.jpg',
      imageAlt: 'Travelpro Maxlite 5 21-inch softside spinner, front view',
      provisional: true,
    },
    {
      tier: 'economy',
      name: 'Travelpro FlightCrew5 21"',
      price: 200,
      stat: '3-year commercial-use warranty',
      compromise:
        'four spinner wheels are consumables — on jetbridge grating and cobblestone layovers they go first.',
      text:
        'The flight-line standard, and the cheapest genuinely commercial-grade bag here. ' +
        '1682d ballistic nylon with a DuraGuard coating, reinforced frame, and a warranty ' +
        'written for daily working use — these routinely run 5 to 10 years on the line.',
      url: 'https://www.amazon.com/s?k=travelpro+flightcrew+5+21+spinner',
      image: '/essentials/flightcrew-5-21.jpg',
      imageAlt: 'Travelpro FlightCrew 5 21-inch spinner, front view',
    },
    {
      tier: 'main',
      name: 'Travelpro Crew Classic',
      price: 255,
      stat: 'Flown by crew at 90+ airlines',
      compromise:
        'it is function over form — the anonymous black crew-room look, with no USB port and no laptop pocket.',
      text:
        'Eight MagnaTrac self-aligning wheels, a PowerScope Lite handle, and a tapered ' +
        'expansion that adds 2" while keeping the centre of gravity low so it stops tipping. ' +
        'Comes with a removable compression packing organizer.',
      url: 'https://www.amazon.com/s?k=travelpro+crew+classic+carry+on+spinner',
      image: '/essentials/crew-classic.jpg',
      imageAlt: 'Travelpro Crew Classic carry-on spinner, front view',
    },
    {
      tier: 'main',
      name: 'Travelpro Platinum Elite 21"',
      price: 390,
      stat: '10/10 ease of transport — OutdoorGearLab',
      compromise:
        'it measures about 23.5" with wheels and handle, so a strict gate agent can call it at the sizer.',
      text:
        'The best-rolling bag on this page. Eight magnet-embedded self-aligning wheels track ' +
        'dead straight, and it survived being thrown down concrete stairs repeatedly in testing ' +
        'still looking essentially new. Nine compartments, including a detachable TSA liquids case.',
      url: 'https://www.amazon.com/Travelpro-Luggage-Platinum-Expandable-Spinner/dp/B07DL64SYP',
      image: '/essentials/platinum-elite-21.jpg',
      imageAlt: 'Travelpro Platinum Elite 21-inch spinner, front view',
    },
    {
      tier: 'first',
      name: 'Briggs & Riley Baseline Essential 22"',
      price: 729,
      stat: '~10 lb · lifetime warranty, no questions asked',
      compromise:
        'ten pounds empty and a steep price — and the push-button expansion can be set off by the contents themselves.',
      text:
        'The warranty pick. The handle hardware mounts on the outside, which leaves a flat, ' +
        'larger packing surface that keeps a uniform jacket from creasing. Pack it expanded in ' +
        'the hotel, then collapse it to compress everything back to legal carry-on size.',
      url: 'https://www.amazon.com/Briggs-Riley-Spinners-Baseline-Essential/dp/B09Y2DBZGS',
      image: '/essentials/briggs-riley-spinner.jpg',
      imageAlt: 'Briggs & Riley Baseline Essential 22-inch spinner, front view',
    },
    {
      tier: 'first',
      name: 'TUMI Alpha 3 International 4-Wheel',
      price: 1050,
      stat: '10.9 lb · 65 W USB-C port',
      compromise:
        'the price, and the weight — 10.9 lb is over 20% above the category average, and repair support thins out once the 5-year warranty ends.',
      text:
        'The status bag that earns it on materials. FXT ballistic nylon that shrugs off airport ' +
        'scuffs, an aircraft-grade aluminium handle, a 65 W USB-C port, and a built-in garment ' +
        'sleeve sized for exactly one uniform blazer.',
      url: 'https://www.amazon.com/TUMI-Expandable-International-Carry-Suitcase/dp/B07MGHP7SM',
      image: '/essentials/tumi-alpha3-4wheel.jpg',
      imageAlt: 'TUMI Alpha 3 International Expandable 4-wheel carry-on, front view',
    },
  ],

  alternates: [
    {
      tier: 'economy',
      name: 'Loomis 21" Softside Spinner',
      note: 'The affordability pick among pilots.',
      url: 'https://www.amazon.com/Softside-Expandable-Luggage-Lightweight-Suitcase/dp/B0BQ2362H7',
    },
    {
      tier: 'economy',
      name: 'SwissGear softside spinner',
      note: 'A low-cost crew favourite — 16k+ Amazon reviews at 4.5 stars.',
      url: 'https://www.amazon.com/s?k=swissgear+softside+carry+on+spinner',
    },
    {
      tier: 'economy',
      name: 'Samsonite softside spinner',
      note: 'Similar styling for anyone avoiding a $500+ spend.',
      url: 'https://www.amazon.com/s?k=samsonite+softside+carry+on+spinner',
    },
  ],

  jumpseat: {
    name: 'Peak Design Roller Pro',
    price: 600,
    stat: '8.6 lb · 34 L → 39 L · lifetime warranty',
    by: 'Cole · CLT',
    why:
      'It is barely a year old and it was built for photographers, not crew — so nobody in the ' +
      'group has flown one long enough to vouch for it but me.',
    compromise: 'the price, and two pounds of empty weight over the soft-side most of us fly.',
    text:
      'A flat carbon-fibre trolley that leaves no bumps inside the bag, a drawbridge lid that ' +
      'stays open on its own in a galley-sized hotel room, and 60 mm wheels you replace ' +
      'yourself. The best-driving roller I have owned, and I still wince at what it cost.',
    url: 'https://www.amazon.com/dp/B0FDJ56Y7V',
    image: '/essentials/roller-pro-hero.jpg',
    imageAlt: 'Peak Design Roller Pro Carry-On, front view',
    href: '/crew-essentials/roller-pro/',
  },
};

/* ------------------------------------------------------------
   Rollaboards — two wheels
   ------------------------------------------------------------ */

export const rollaboards: TierCategory = {
  key: 'rollaboards',
  label: 'Rollaboards',
  cat: 'bags',
  icon: 'ph-trolley-suitcase',
  blurb:
    'Seven approved two-wheel picks, $160 to $895 — same quality bar, three price levels. ' +
    'More clothes inside, and nothing to snap off on a bad ramp.',
  checked: CHECKED,
  provisionalNote: PROVISIONAL_NOTE,
  provisionalNotice: PROVISIONAL_NOTICE,

  picks: [
    {
      tier: 'economy',
      name: 'Travelpro Maxlite 5 22"',
      price: 160,
      stat: 'Lighter than the spinner version',
      compromise:
        'lighter-duty components than the crew lines — and expanded, it is over the limit on some airlines.',
      text:
        'One of the lightest softside bags you can buy, and lighter still than the Maxlite ' +
        'spinner because there is no wheel housing eating into it. Limited lifetime warranty ' +
        'and a useful 2" expansion.',
      url: 'https://www.amazon.com/Travelpro-Luggage-Expandable-Carry-On-Black/dp/B07BLCB6DS',
      image: '/essentials/maxlite-5-22.jpg',
      imageAlt: 'Travelpro Maxlite 5 22-inch rollaboard, front view',
      provisional: true,
    },
    {
      tier: 'economy',
      name: 'LuggageWorks Aurora New Generation 22"',
      price: 210,
      stat: '11.8 lb · 45 L · uniform suiter',
      compromise:
        'it weighs 11.8 lb empty — more than double a Maxlite — and the Aurora line has no long service record yet.',
      text:
        'The most bag per dollar here: 45 L for $210, on a honeycomb frame with a 2" expandable ' +
        'suiter compartment built to keep a uniform jacket flat. Metal J-hook, all-metal zipper ' +
        'pulls, and the LuggageWorks repair shop behind it.',
      url: 'https://luggageworks.com/products/aurora-new-generation-22-expandable-suiter-rolling-bag',
      image: '/essentials/luggageworks-aurora.jpg',
      imageAlt: 'LuggageWorks Aurora New Generation 22-inch suiter rolling bag, front view',
      provisional: true,
    },
    {
      tier: 'economy',
      name: 'Travelpro FlightCrew5 22"',
      price: 220,
      stat: 'Wheels, handles and pulls all swap out',
      compromise:
        'this generation runs about 5–7 years, short of the legendary older ones — and it is crew-outfitter stock, not mainstream retail.',
      text:
        'Professional-grade at crew-outfitter pricing, and the most repairable bag on this ' +
        'page — wheels, handles and zipper pulls all swap rather than replacing the bag. One ' +
        'pilot got about 25 years out of his first one on three or four sets of wheels.',
      url: 'https://www.amazon.com/s?k=travelpro+flightcrew+5+22+rollaboard',
      image: '/essentials/flightcrew-5-22.jpg',
      imageAlt: 'Travelpro FlightCrew 5 22-inch rollaboard, front view',
    },
    {
      tier: 'main',
      name: 'Travelpro Pilot Seven3',
      price: 360,
      stat: '9.9 lb · 46 L · 5-year commercial warranty',
      compromise:
        'fewer pockets than the FlightCrew — one slip pocket and one dump pocket where the 5 has a whole front face.',
      text:
        'Built around a flight deck and armoured like nothing else here: polypropylene ' +
        'honeycomb frame, crash-guard wheel housings, full-length armour, corner and skid ' +
        'guards — and screws instead of rivets, so it can actually be repaired.',
      url: 'https://www.amazon.com/s?k=travelpro+pilot+seven3+carry+on+rollaboard',
      image: '/essentials/pilot-seven3.jpg',
      imageAlt: 'Travelpro Pilot Seven3 carry-on rollaboard, front view',
    },
    {
      tier: 'main',
      name: 'Travelpro Pilot 22" Expandable',
      price: 385,
      stat: 'Just under 10 lb · 1682d ballistic nylon',
      compromise:
        'just under ten pounds is still hefty against a 7 kg international limit, and it is all function — no style points off the flight line.',
      text:
        'The dependability pick. Pockets front, side and rear, inside and out, plus shoe bags ' +
        'and a laundry bag, on the same ballistic-nylon platform as the FlightCrew 5.',
      url: 'https://www.amazon.com/s?k=travelpro+pilot+22+expandable+rollaboard',
      image: '/essentials/pilot-22.jpg',
      imageAlt: 'Travelpro Pilot 22-inch expandable rollaboard, front view',
    },
    {
      tier: 'first',
      name: 'Briggs & Riley Baseline Essential 2-Wheel',
      price: 679,
      stat: 'Nearly 10 lb · lifetime warranty',
      compromise:
        'nearly ten pounds against a 7 kg limit — and crew who own both say the compression is not $600-better than a Travelpro.',
      text:
        'The warranty pick in two-wheel form, which gains real packing depth over the spinner. ' +
        'Outside-mounted handle hardware leaves a flat surface that carries dress clothes with ' +
        'far fewer wrinkles, and it compresses back to legal after you pack it expanded.',
      url: 'https://www.amazon.com/Briggs-Riley-Uprights-Baseline-Essential/dp/B09Y282JQD',
      image: '/essentials/briggs-riley-2wheel.jpg',
      imageAlt: 'Briggs & Riley Baseline Essential 2-wheel carry-on, front view',
    },
    {
      tier: 'first',
      // PRICE NEEDS A MANUAL CHECK. TUMI does not publish the 2-wheel Alpha 3
      // price behind a fetchable URL; the 4-wheel lists at $1,050 and this one
      // is the Alpha 3 MSRP seen at Luggage Pros. Cole only says "often over
      // $800". Confirm on tumi.com before launch.
      name: 'TUMI Alpha 3 International 2-Wheel',
      price: 895,
      stat: 'DuraFold armour · TUMI Tracer',
      compromise:
        'the price, and an aluminium build that is not light — plus repair support thins out once the 5-year warranty ends.',
      text:
        'FXT ballistic nylon over DuraFold construction across the front, back and corners, ' +
        'and a telescoping handle with no flex or clanking that locks at several heights ' +
        'one-handed. The lid carries a built-in suiter for one uniform blazer.',
      url: 'https://www.amazon.com/s?k=tumi+alpha+3+international+expandable+2+wheeled+carry+on',
      image: '/essentials/tumi-alpha3-2wheel.jpg',
      imageAlt: 'TUMI Alpha 3 International Expandable 2-wheel carry-on, front view',
    },
  ],

  jumpseat: {
    name: 'Travelpro Platinum Elite 22"',
    price: 390,
    stat: '50+ L · roughly 40% more than a 21" spinner',
    by: 'Cole · CLT',
    why:
      'This one is a genuine crew standard, not an unknown — it is in the jumpseat because it ' +
      'is what I fly and why, not because the group has not weighed in.',
    compromise: 'the USB port is gimmicky added weight, and Travelpro support is email-only in practice.',
    text:
      'Maximum legal capacity: over 50 L, roughly 20% more than a 21" international rollaboard ' +
      'and almost 40% more than a 21" spinner. One owner checked his on ~40 round trips a year ' +
      'since 2018 with only corner wear — and Travelpro mailed replacement zipper pulls free.',
    url: 'https://www.amazon.com/s?k=travelpro+platinum+elite+22+expandable+rollaboard',
    image: '/essentials/platinum-elite-22.jpg',
    imageAlt: 'Travelpro Platinum Elite 22-inch rollaboard, front view',
  },
};

/** Both categories, in display order. */
export const bagCategories: TierCategory[] = [spinners, rollaboards];
