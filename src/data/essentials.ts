/* ============================================================
   Crew essentials — vetted gear
   ------------------------------------------------------------
   Two kinds of entry live here, and they are different shapes on
   purpose:

     · `products` — a single pick, one grid tile, one buy link.
     · `tierCategories` — a category the group has worked all the
       way through, which offers exactly THREE approved picks at
       three price levels. The tiers are prices, not grades:
       everything on the site already cleared the same gate, so
       what a tier tells you is which compromise you are taking.

   Every pick names that compromise in one sentence. That sentence
   IS the rating — there are no stars or scores anywhere on this
   site, and nothing here is sponsored. The standard behind it all
   is written out at /fa-approved/.

   Links are Amazon search URLs, not tagged affiliate links; if
   associate tags are added later they go here and nowhere else.
   ============================================================ */

export interface Product {
  title: string;
  blurb: string;
  /** Phosphor icon rendered in the product tile. */
  icon: string;
  /** Small uppercase chip on the tile, e.g. "Bag". */
  tag: string;
  /** Filter group. The pill bar and its counts derive from these. */
  cat: 'bags' | 'body' | 'kit';
  url: string;
}

/** Pill-bar groups, in display order. Counts derive from the entries below. */
export const productCategories = [
  { key: 'all', label: 'Everything', icon: 'ph-squares-four' },
  { key: 'bags', label: 'Bags & packing', icon: 'ph-suitcase-rolling' },
  { key: 'body', label: 'Body & rest', icon: 'ph-heartbeat' },
  { key: 'kit', label: 'Power & uniform', icon: 'ph-battery-charging' },
] as const;

export const products: Product[] = [
  {
    title: 'Compression Socks',
    blurb:
      'Non-negotiable for long duty days and red-eyes. Keeps the swelling down and your legs fresh from block-out to block-in.',
    icon: 'ph-heartbeat',
    tag: 'Legs',
    cat: 'body',
    url: 'https://www.amazon.com/s?k=compression+socks',
  },
  {
    title: 'Luggage Tags',
    blurb:
      'Bright, durable tags so your bag is unmistakable on a crowded crew rack. Grab a two-pack and never guess again.',
    icon: 'ph-tag',
    tag: 'Tags',
    cat: 'bags',
    url: 'https://www.amazon.com/s?k=luggage+tags',
  },
  {
    title: 'Portable Charger',
    blurb:
      'A slim power bank that keeps your phone alive through delays, standby lists, and the whole trip. Charge once, fly all day.',
    icon: 'ph-battery-charging',
    tag: 'Power',
    cat: 'kit',
    url: 'https://www.amazon.com/s?k=portable+charger+power+bank',
  },
  {
    title: 'Uniform Care Kit',
    blurb:
      "Wrinkle-release spray, a mini lint roller, and a stain pen — the trio that keeps you sharp when there's no time to iron.",
    icon: 'ph-t-shirt',
    tag: 'Uniform',
    cat: 'kit',
    url: 'https://www.amazon.com/s?k=wrinkle+release+spray+travel',
  },
  {
    title: 'Packing Cubes',
    blurb:
      'Turn a chaotic rollaboard into an organized carry-on. Separate clean, dirty, and layover-ready in seconds.',
    icon: 'ph-package',
    tag: 'Packing',
    cat: 'bags',
    url: 'https://www.amazon.com/s?k=packing+cubes',
  },
  {
    title: 'Insulated Water Bottle',
    blurb:
      'Cabin air is brutal. A leak-proof, bin-friendly bottle keeps you hydrated across every leg — refill past security.',
    icon: 'ph-drop',
    tag: 'Hydrate',
    cat: 'body',
    url: 'https://www.amazon.com/s?k=insulated+water+bottle',
  },
  {
    title: 'Layover Sleep Kit',
    blurb:
      'Eye mask, earplugs, and a compact travel pillow — the difference between a rough overnight and real rest.',
    icon: 'ph-moon-stars',
    tag: 'Rest',
    cat: 'body',
    url: 'https://www.amazon.com/s?k=travel+sleep+kit+eye+mask+earplugs',
  },
  {
    title: 'Comfort Insoles',
    blurb:
      'Hours on hard galley floors add up. A cushioned insole saves your feet and your back on a four-leg day.',
    icon: 'ph-sneaker',
    tag: 'Shoes',
    cat: 'body',
    url: 'https://www.amazon.com/s?k=comfort+insoles+standing',
  },
];

/* ------------------------------------------------------------
   The three tiers
   ------------------------------------------------------------ */

export type TierKey = 'economy' | 'main' | 'first';

/**
 * The tier vocabulary: what each level is called, how it is drawn, and how the
 * standard page explains it. Ladders read this rather than hardcoding a colour
 * or a chip, so a tier cannot look like Economy in one place and Main Cabin in
 * another. Order is the display order and the price order — both ascending.
 */
export const TIERS = {
  economy: {
    label: 'Economy',
    icon: 'ph-coins',
    /** Column rule, price bars and the scales glyph, via the --tc custom property. */
    color: 'var(--sky-700)',
    /** Chip variant class, and the number of price bars lit. */
    chip: 'eco',
    bars: 1,
    explain: {
      headline: 'The least money that clears the bar',
      text: 'It does the job on the line, today. Also the right pick if your gear tends to walk away from you.',
      compromise:
        '**The usual compromise:** lifespan and refinement — plan to buy it again sooner.',
    },
  },
  main: {
    label: 'Main Cabin',
    icon: 'ph-seal-check',
    color: 'var(--gold-500)',
    chip: 'main',
    bars: 2,
    explain: {
      headline: 'The default. Start here.',
      text: "If you ask in the galley, this is the answer — chosen for what most crew earn, lift and fly, not for anyone's taste.",
      compromise: '**The usual compromise:** a little of everything, a lot of nothing.',
    },
  },
  first: {
    label: 'First Class',
    icon: 'ph-crown-simple',
    color: 'var(--navy-700)',
    chip: 'first',
    bars: 3,
    explain: {
      headline: 'The best experience money buys',
      text: 'Worth it when the price is worth it to you — and everything else it costs you is named plainly on the page.',
      compromise:
        '**The compromise is always price** — plus whatever else. ' +
        "The Roller Pro's: price, and two pounds.",
    },
  },
} as const;

/** Display order for the ladder. */
export const TIER_ORDER: TierKey[] = ['economy', 'main', 'first'];

export interface TierPick {
  tier: TierKey;
  name: string;
  /** USD, whole dollars. Drives the ladder price and the ordering claim. */
  price: number;
  /** Small-caps line under the name — the one spec that decides it. */
  stat: string;
  /** REQUIRED. The one sentence that is the rating; it follows "Your compromise:". */
  compromise: string;
  /** The longer read. Shown on the full ladder, dropped from the browse card. */
  text: string;
  image: string;
  imageAlt: string;
  /** Set when this pick has a page of its own. */
  href?: string;
  /** No stamp yet — still inside its 90-day wear test. */
  provisional?: boolean;
}

export interface TierCategory {
  key: string;
  label: string;
  /** Filter group, the same vocabulary the single picks use. */
  cat: Product['cat'];
  /** Blurb on the collapsed browse card. */
  blurb: string;
  /** When these prices were last verified, as YYYY-MM. */
  checked: string;
  /** Footnote under the browse ladder. */
  provisionalNote: string;
  /** The same reservation, said at length on a pick's own page. */
  provisionalNotice: string;
  picks: TierPick[];
}

/**
 * Rolling bags — the first category worked all the way through.
 *
 * Two deliberate corrections to the handoff copy:
 *
 *   · The prototype's expanded header read "$130 – $599" while the card face
 *     two lines above it read "$160 to $599". Economy is $160, so the range is
 *     derived from the picks here and the stale number is gone.
 *   · Economy's compromise line appeared in two lengths, one per screen. It is
 *     one sentence about one bag, so it is stored once, in the longer form.
 */
export const tierCategories: TierCategory[] = [
  {
    key: 'rolling-bags',
    label: 'Rolling Bags',
    cat: 'bags',
    blurb:
      'Three approved picks, $160 to $599 — same quality bar, three compromises. Featherweight, crew standard, or buy-once.',
    checked: '2026-07',
    provisionalNote:
      "Economy and Main Cabin are still in their 90-day wear test — the stamp goes on when they've earned it. Only the First Class pick has its full review so far.",
    provisionalNotice:
      "**Economy and Main Cabin are provisional.** Both are the bags crew name most — but they're still in their 90-day wear test. The stamp goes on when they've earned it, not before.",
    picks: [
      {
        tier: 'economy',
        name: 'Travelpro Maxlite 5 22"',
        price: 160,
        stat: '5.4 lb — lightest here by 3 pounds',
        compromise:
          'consumer-grade — flying the line, plan on buying it again in a couple of years.',
        text: 'The famous ultralight. Half the weight of a crew bag, sizer-tested, and cheap enough to replace without grief if it disappears.',
        image: '/essentials/maxlite-5.jpg',
        imageAlt: 'Travelpro Maxlite 5 22-inch Rollaboard, front view',
        provisional: true,
      },
      {
        tier: 'main',
        name: 'Travelpro FlightCrew 5 22"',
        price: 210,
        stat: '9.6 lb · sold to airline crew only',
        compromise:
          "it's a tool — the heaviest of the three, and it looks like everyone else's.",
        text: 'The industry-standard crew Rollaboard — commercial-grade build, 3-year commercial-use warranty, wheels you swap with a screwdriver.',
        image: '/essentials/flightcrew-5.jpg',
        imageAlt: 'Travelpro FlightCrew 5 22-inch Rollaboard, front view',
        provisional: true,
      },
      {
        tier: 'first',
        name: 'Peak Design Roller Pro',
        price: 599,
        stat: '8.6 lb · lifetime warranty',
        compromise: 'the price — almost three times the Main Cabin pick.',
        text: "The best-built, best-driving roller we've flown with. Buy once, repair forever — if the price is worth it to you.",
        image: '/essentials/roller-pro-hero.jpg',
        imageAlt: 'Peak Design Roller Pro Carry-On, front view',
        href: '/crew-essentials/roller-pro/',
      },
    ],
  },
];

/** "2026-07" -> "July 2026". The only place a checked date becomes words. */
export function checkedLabel(checked: string): string {
  const [year, month] = checked.split('-');
  const name = new Date(Number(year), Number(month) - 1, 1).toLocaleString('en-US', {
    month: 'long',
  });
  return `${name} ${year}`;
}

/** "$160 – $599" from the picks themselves, so it cannot contradict them. */
export function priceRange(category: TierCategory): string {
  const prices = category.picks.map((pick) => pick.price);
  return `$${Math.min(...prices)} – $${Math.max(...prices)}`;
}

/** Pill counts, over both kinds of entry. A tier category counts as one pick. */
export function countFor(key: string): number {
  const inCat = (cat: string) => key === 'all' || cat === key;
  return (
    products.filter((product) => inCat(product.cat)).length +
    tierCategories.filter((category) => inCat(category.cat)).length
  );
}
