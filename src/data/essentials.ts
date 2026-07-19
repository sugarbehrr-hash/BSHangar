/* ============================================================
   Crew essentials — vetted gear
   ------------------------------------------------------------
   Ported verbatim from the export's essentials page. Links are
   Amazon search URLs, not tagged affiliate links; if associate
   tags are added later they go here and nowhere else.
   ============================================================ */

export interface Product {
  title: string;
  blurb: string;
  /** Phosphor icon rendered in the product tile. */
  icon: string;
  /** Small uppercase chip on the tile, e.g. "Bag". */
  tag: string;
  url: string;
}

export const products: Product[] = [
  {
    title: 'Crew Rolling Bag',
    blurb:
      'A sturdy, TSA-friendly roller that fits the bin and takes a beating layover after layover. The bag that outlasts the schedule.',
    icon: 'ph-suitcase-rolling',
    tag: 'Bag',
    url: 'https://www.amazon.com/s?k=flight+crew+rolling+luggage',
  },
  {
    title: 'Compression Socks',
    blurb:
      'Non-negotiable for long duty days and red-eyes. Keeps the swelling down and your legs fresh from block-out to block-in.',
    icon: 'ph-heartbeat',
    tag: 'Comfort',
    url: 'https://www.amazon.com/s?k=compression+socks',
  },
  {
    title: 'Luggage Tags',
    blurb:
      'Bright, durable tags so your bag is unmistakable on a crowded crew rack. Grab a two-pack and never guess again.',
    icon: 'ph-tag',
    tag: 'Bag',
    url: 'https://www.amazon.com/s?k=luggage+tags',
  },
  {
    title: 'Portable Charger',
    blurb:
      'A slim power bank that keeps your phone alive through delays, standby lists, and the whole trip. Charge once, fly all day.',
    icon: 'ph-battery-charging',
    tag: 'Tech',
    url: 'https://www.amazon.com/s?k=portable+charger+power+bank',
  },
  {
    title: 'Uniform Care Kit',
    blurb:
      "Wrinkle-release spray, a mini lint roller, and a stain pen — the trio that keeps you sharp when there's no time to iron.",
    icon: 'ph-t-shirt',
    tag: 'Uniform',
    url: 'https://www.amazon.com/s?k=wrinkle+release+spray+travel',
  },
  {
    title: 'Packing Cubes',
    blurb:
      'Turn a chaotic rollaboard into an organized carry-on. Separate clean, dirty, and layover-ready in seconds.',
    icon: 'ph-package',
    tag: 'Bag',
    url: 'https://www.amazon.com/s?k=packing+cubes',
  },
  {
    title: 'Insulated Water Bottle',
    blurb:
      'Cabin air is brutal. A leak-proof, bin-friendly bottle keeps you hydrated across every leg — refill past security.',
    icon: 'ph-drop',
    tag: 'Health',
    url: 'https://www.amazon.com/s?k=insulated+water+bottle',
  },
  {
    title: 'Layover Sleep Kit',
    blurb:
      'Eye mask, earplugs, and a compact travel pillow — the difference between a rough overnight and real rest.',
    icon: 'ph-moon-stars',
    tag: 'Rest',
    url: 'https://www.amazon.com/s?k=travel+sleep+kit+eye+mask+earplugs',
  },
  {
    title: 'Comfort Insoles',
    blurb:
      'Hours on hard galley floors add up. A cushioned insole saves your feet and your back on a four-leg day.',
    icon: 'ph-sneaker',
    tag: 'Comfort',
    url: 'https://www.amazon.com/s?k=comfort+insoles+standing',
  },
];
