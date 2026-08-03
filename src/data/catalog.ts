/* ============================================================
   Catalog vocabulary — tiers, the jumpseat, and the shared types
   ------------------------------------------------------------
   The words the gear pages are built from, defined once. Three
   things live here and nothing else:

     · the filter groups a pick can belong to,
     · the THREE price tiers and what each one means,
     · the JUMPSEAT — which is not a tier, and the comment below
       explains why that distinction is load-bearing.

   Products themselves are in src/data/essentials.ts (single
   picks) and src/data/bags.ts (categories worked all the way
   through). This file imports neither, so the dependency runs
   one way: catalog -> bags -> essentials.
   ============================================================ */

/** Filter group a pick belongs to. Kept for grouping, not for a pill bar. */
export type CatalogCat = 'bags' | 'body' | 'kit';

/* ------------------------------------------------------------
   The three tiers
   ------------------------------------------------------------ */

export type TierKey = 'economy' | 'main' | 'first';

/**
 * The tier vocabulary: what each level is called, how it is drawn, and how the
 * standard page explains it. Ladders read this rather than hardcoding a colour
 * or a chip, so a tier cannot look like Economy in one place and Main Cabin in
 * another. Order is the display order and the price order — both ascending.
 *
 * The tiers are FARE CLASSES: things a passenger buys, sorted by what they
 * cost. That is the whole metaphor, and it is why the jumpseat below is not
 * one of them.
 */
export const TIERS = {
  economy: {
    label: 'Economy',
    icon: 'ph-coins',
    /** Upper bound, exclusive. A pick's tier is DERIVED from this — see tierForPrice. */
    max: 250,
    /** The bracket, as printed on the ladder. Standard across every category. */
    bracket: 'Under $250',
    /** The tier's colour, via the --tc custom property. */
    color: 'var(--sky-700)',
    /** Text/bars ON that colour, via --tfg. Checked for contrast against it. */
    fg: '#fff',
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
    max: 400,
    bracket: '$250 – $400',
    color: 'var(--gold-500)',
    fg: 'var(--navy-900)',
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
    max: Infinity,
    bracket: '$400 +',
    color: 'var(--navy-700)',
    fg: 'var(--gold-500)',
    chip: 'first',
    bars: 3,
    explain: {
      headline: 'The best experience money buys',
      text: 'Worth it when the price is worth it to you — and everything else it costs you is named plainly on the page.',
      compromise:
        '**The compromise is always price** — plus whatever else, named on every pick.',
    },
  },
} as const;

/** Display order for the ladder. */
export const TIER_ORDER: TierKey[] = ['economy', 'main', 'first'];

/* ------------------------------------------------------------
   The jumpseat
   ------------------------------------------------------------ */

/**
 * The crew's own pick — and deliberately NOT a fourth tier.
 *
 * The three tiers are fare classes, sorted by price, and every pick in them
 * cleared the same gate including "more than one of us said so". A jumpseat
 * pick clears neither test: it is one named flight attendant saying what they
 * personally fly, which may cost less than the First Class pick and may never
 * reach group consensus at all.
 *
 * Putting that on the ladder would break both of the ladder's promises at
 * once — that the tiers are prices, and that no column is a grade. So it sits
 * beside the ladder in its own slot, in the one colour no tier uses, and it
 * always names the person behind it.
 *
 * The metaphor holds it together: the jumpseat is the only seat on the
 * airplane that isn't for sale, and it's the one we actually sit in.
 */
export const JUMPSEAT = {
  label: 'Jumpseat',
  // A front-facing chair, chosen over Phosphor's airplane-seat glyph: that one
  // is a thin diagonal side view that reads as a telephone handset at the 14px
  // a chip renders it. The word sits right beside the icon, so legibility wins
  // over literalism. (Naming the rejected icon here would ship it — the icon
  // generator scrapes these files for class names, comments included.)
  icon: 'ph-armchair',
  color: 'var(--red-600)',
  chip: 'jump',
  explain: {
    headline: "The seat that isn't for sale",
    text: 'What one of us actually flies, with their name on it. Not a price level and not a group verdict — one flight attendant, one bag, and the reason they chose it.',
    compromise:
      '**The compromise is the evidence.** One person flew it, not the group — so it carries a name instead of the stamp.',
  },
} as const;

/* ------------------------------------------------------------
   Shapes
   ------------------------------------------------------------ */

export interface TierPick {
  name: string;
  /** USD, whole dollars. Drives the ladder price and the ordering claim. */
  price: number;
  /** Small-caps line under the name — the one spec that decides it. */
  stat: string;
  /** REQUIRED. The one sentence that is the rating; it follows "Your compromise:". */
  compromise: string;
  /** The longer read. Shown on the full ladder, dropped from the browse card. */
  text: string;
  /** Where to buy it. Every pick has one — it is the reason the page exists. */
  url: string;
  image?: string;
  imageAlt?: string;
  /** Set when this pick has a page of its own. */
  href?: string;
}

/**
 * A cheaper bag crew name in the same breath as the Economy pick, without a
 * review behind it. A line and a link, never a priced column — quoting a price
 * we have not checked is the one thing the ladder must never do.
 */
export interface Alternate {
  tier: TierKey;
  name: string;
  note: string;
  url: string;
}

/**
 * The named personal pick. `by` and `why` are both required: the slot's entire
 * justification is that it says who, and says plainly why the stamp is absent.
 */
export interface JumpseatPick {
  name: string;
  price: number;
  stat: string;
  /** Who flies it. "Cole · CLT". */
  by: string;
  /** Why it has no stamp. Required — the slot makes no consensus claim. */
  why: string;
  compromise: string;
  text: string;
  url: string;
  /** Optional: most bags here have no crew photo yet. */
  image?: string;
  imageAlt?: string;
  /** Set when this pick has a page of its own. */
  href?: string;
}

export interface TierCategory {
  key: string;
  label: string;
  cat: CatalogCat;
  /** Phosphor icon. Stands in for the photo on the browse tile when none exists. */
  icon: string;
  /** Blurb on the collapsed browse card. */
  blurb: string;
  /** When these prices were last verified, as YYYY-MM. */
  checked: string;
  /** Footnote under the browse ladder. */
  note: string;
  picks: TierPick[];
  /** Unreviewed budget names, shown as links at the foot of their column. */
  alternates?: Alternate[];
  jumpseat: JumpseatPick;
}

/* ------------------------------------------------------------
   Helpers
   ------------------------------------------------------------ */

/** "2026-08" -> "August 2026". The only place a checked date becomes words. */
export function checkedLabel(checked: string): string {
  const [year, month] = checked.split('-');
  const name = new Date(Number(year), Number(month) - 1, 1).toLocaleString('en-US', {
    month: 'long',
  });
  return `${name} ${year}`;
}

/** "$160 – $1,050" from the picks themselves, so it cannot contradict them. */
export function priceRange(category: TierCategory): string {
  const prices = category.picks.map((pick) => pick.price);
  const usd = (n: number) => `$${n.toLocaleString('en-US')}`;
  return `${usd(Math.min(...prices))} – ${usd(Math.max(...prices))}`;
}

/** Every pick that can be bought, across the tiers and the jumpseat. */
export function pickCount(category: TierCategory): number {
  return category.picks.length + 1;
}


/**
 * Which tier a price falls in. THE tier assignment — nothing stores a tier.
 *
 * Hand-setting a pick's tier let it contradict the bracket printed above it: a
 * $200 bag sat under a header reading "Under $200". Deriving it makes that
 * impossible, and moving a boundary re-files every pick on the site at once.
 */
export function tierForPrice(price: number): TierKey {
  if (price < TIERS.economy.max) return 'economy';
  if (price < TIERS.main.max) return 'main';
  return 'first';
}

/** The picks in one column, cheapest first. The ladder IS the order. */
export function picksFor(category: TierCategory, tier: TierKey): TierPick[] {
  return category.picks
    .filter((pick) => tierForPrice(pick.price) === tier)
    .sort((a, b) => a.price - b.price);
}

/** The unreviewed names that belong at the foot of one column. */
export function alternatesFor(category: TierCategory, tier: TierKey): Alternate[] {
  return (category.alternates ?? []).filter((entry) => entry.tier === tier);
}

/**
 * What to call the buy link, from the link itself.
 *
 * Several crew bags here are not sold on Amazon at all — the LuggageWorks
 * Aurora is direct-only — so a hardcoded "View on Amazon" would be a lie on
 * some rows. Deriving it from the href means the label cannot drift from where
 * the button actually goes.
 */
export function sellerFor(url: string): { label: string; icon: string; affiliate: boolean } {
  const amazon = /(^|\.)amazon\.com/i.test(new URL(url).hostname);
  if (amazon) return { label: 'View on Amazon', icon: 'ph-amazon-logo', affiliate: true };
  return { label: 'View at the maker', icon: 'ph-arrow-up-right', affiliate: false };
}

/** "$160 – $200", or "$160" when a column holds one pick. */
export function columnRange(picks: TierPick[]): string {
  if (!picks.length) return '';
  const usd = (n: number) => `$${n.toLocaleString('en-US')}`;
  const low = picks[0].price;
  const high = picks[picks.length - 1].price;
  return low === high ? usd(low) : `${usd(low)} – ${usd(high)}`;
}
