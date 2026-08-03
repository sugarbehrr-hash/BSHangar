/* ============================================================
   Crew essentials — vetted gear
   ------------------------------------------------------------
   Two kinds of entry appear on the browse page, and they are
   different shapes on purpose:

     · `products` (here) — a single pick, one grid tile, one buy
       link.
     · `bagCategories` (src/data/bags.ts) — a category the group
       has worked all the way through, which offers approved
       picks across three price levels plus a jumpseat pick.

   Every pick names its compromise in one sentence. That sentence
   IS the rating — there are no stars or scores anywhere on this
   site, and nothing here is sponsored. The standard behind it
   all is written out at /fa-approved/.

   The tier vocabulary and the shared types live in
   src/data/catalog.ts, so the dependency runs one way:
   catalog -> bags -> essentials.
   ============================================================ */

import type { CatalogCat } from './catalog';

export interface Product {
  title: string;
  blurb: string;
  /** Phosphor icon rendered in the product tile. */
  icon: string;
  /** Small uppercase chip on the tile, e.g. "Bag". */
  tag: string;
  /** Filter group. The pill bar and its counts derive from these. */
  cat: CatalogCat;
  url: string;
}

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

