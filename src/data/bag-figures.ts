/* ============================================================
   The six figures, derived from a bag's specs
   ------------------------------------------------------------
   The luggage rating logic on this site is six questions a
   flight attendant asks before buying a bag — the shape the
   Roller Pro page has always used. This builds those six for
   any bag from its published specs, so the ledger cannot drift
   from the spec table and every bag is measured on the same
   axes.

   WHERE THE NUMBERS COME FROM. Every value here is the maker's
   published figure, checked Aug 2026. None of it comes from
   Cole's reviews: he was asked for names and sent opinions, so
   his prose is the judgement and never the measurement. Where
   he and the maker disagreed the maker won — his "just under
   ten pounds" for the Pilot 22" is 10.8 lb published.

   WHAT COLE IS FOR. The `notes` on a spec are his: what the
   number means at 5 a.m. on a jetbridge, which no spec sheet
   has. A figure with no note still renders — it just states the
   fact and how it compares.
   ============================================================ */

import type { LedgerFigure } from './figure-ledger';

/** The frame a US domestic sizer actually is, in inches. */
export const SIZER = { h: 22, w: 14, d: 9 } as const;

export interface BagSpec {
  /** Empty weight in pounds. Null when the maker does not publish it. */
  weight: number | null;
  /** Usable capacity in litres, expanded where the bag expands. */
  capacity: number | null;
  /** H × W × D in inches, INCLUDING wheels and handle — the way a gate agent measures. */
  dims: [number, number, number] | null;
  /** Wheels, in the maker's words. */
  wheels: string;
  /** Whether the wheels are user-replaceable — the thing that decides a crew bag's life. */
  wheelsSwappable: boolean;
  /** Warranty, in a few words. */
  warranty: string;
  /** Does the warranty cover damage from any cause, or defects only? */
  warrantyCoversDamage: boolean;
  /** Cole's read on any figure, keyed by figure. Judgement only — never numbers. */
  notes?: Partial<Record<'weight' | 'fits' | 'sizer' | 'wheels' | 'price' | 'lost', string>>;
}

/** Tightest clearance against the sizer, in inches. Negative means it is over. */
export function sizerClearance(dims: [number, number, number]): number {
  const [h, w, d] = dims;
  return Math.min(SIZER.h - h, SIZER.w - w, SIZER.d - d);
}

/** "23 × 14.5 × 9 in" */
const dimsLabel = (dims: [number, number, number]) => `${dims.join(' × ')} in`;

/** The one-word verdict per axis. This IS the rating — there are no scores. */
const weightRef = (lb: number) => (lb <= 6 ? 'Light' : lb <= 8.5 ? 'Fair' : lb <= 10 ? 'Heavy' : 'Very heavy');
const fitsRef = (l: number) => (l >= 52 ? 'Cavernous' : l >= 46 ? 'Roomy' : 'Tight');
const sizerRef = (spare: number) => (spare < 0 ? 'Over' : spare === 0 ? 'Exact' : 'Legal');
const priceRef = (usd: number) => (usd < 250 ? 'Cheap' : usd < 400 ? 'Fair' : usd < 750 ? 'Steep' : 'Eye-watering');

/**
 * Build the six figures for one bag.
 *
 * An unpublished figure renders as an explicit "Not published" row rather than
 * a blank: a ladder where some bags show a number and others show nothing
 * reads as a broken table, and the absence is itself worth knowing.
 */
export function bagFigures(name: string, price: number, spec: BagSpec): LedgerFigure[] {
  const n = spec.notes ?? {};
  const spare = spec.dims ? sizerClearance(spec.dims) : null;

  return [
    {
      key: 'weight',
      icon: 'ph-scales',
      value: spec.weight === null ? '—' : String(spec.weight),
      unit: spec.weight === null ? 'not published' : 'lb',
      label: 'Empty weight',
      caption: 'Before you pack a single thing',
      ref: spec.weight === null ? 'Unknown' : weightRef(spec.weight),
      pane: {
        title: 'Empty weight',
        sub: spec.weight === null ? 'The maker does not publish it' : `${spec.weight} lb empty`,
        paras: [
          spec.weight === null
            ? `${name} has no published empty weight. Treat any figure you see quoted elsewhere as somebody's bathroom scale.`
            : `Every pound here is a pound you do not get to pack. You feel it lifting into a bin at the end of a four-leg day, not walking through the terminal.`,
          n.weight ?? 'Weight is the figure crew regret ignoring — it is the one you cannot fix later.',
        ],
        actionIcon: 'ph-barbell',
        action:
          spec.weight !== null && spec.weight >= 10
            ? '**Lift it before you buy it.** Ten pounds empty is a real cost on a regional bin, ten times a day.'
            : '**Weigh it against your airline\'s limit,** not against the bag next to it in the shop.',
      },
    },
    {
      key: 'fits',
      icon: 'ph-package',
      value: spec.capacity === null ? '—' : String(spec.capacity),
      unit: spec.capacity === null ? 'not published' : 'L',
      label: 'What actually fits',
      caption: spec.capacity === null ? 'Capacity is not published' : 'Expanded, where it expands',
      ref: spec.capacity === null ? 'Unknown' : fitsRef(spec.capacity),
      pane: {
        title: 'What actually fits',
        sub: spec.capacity === null ? 'Not published' : `${spec.capacity} L`,
        paras: [
          spec.capacity === null
            ? `${name} has no published capacity, so it can only be compared on outside dimensions.`
            : `Roughly a four-day trip with a spare uniform, at ${spec.capacity} litres. Litres compare across brands in a way "22-inch" does not.`,
          n.fits ?? 'Capacity and sizer clearance pull against each other: the roomiest bag on a page is usually the one most likely to be called at the gate.',
        ],
        actionIcon: 'ph-arrows-out-line-vertical',
        action: '**Pack it expanded for the hotel, not the airplane.** Expansion is what puts a bag over the frame.',
      },
    },
    {
      key: 'sizer',
      icon: 'ph-ruler',
      value: spare === null ? '—' : spare === 0 ? '0' : Math.abs(spare).toFixed(1),
      unit: spare === null ? 'not published' : spare === 0 ? 'exact fit' : spare > 0 ? 'in spare' : 'in over',
      label: 'Clearance in the sizer',
      caption: spec.dims ? `${dimsLabel(spec.dims)} against ${SIZER.h} × ${SIZER.w} × ${SIZER.d}` : 'Dimensions not published',
      ref: spare === null ? 'Unknown' : sizerRef(spare),
      pane: {
        accent: spare !== null && spare < 0 ? 'var(--red-600)' : undefined,
        title: 'Clearance in the sizer',
        sub: spec.dims ? dimsLabel(spec.dims) : 'Not published',
        paras: [
          spare === null
            ? 'Without published outside dimensions there is no honest way to say whether this clears a frame.'
            : spare < 0
              ? `Measured with wheels and handle — the way a gate agent measures — this is ${Math.abs(spare).toFixed(1)} in over a ${SIZER.h} × ${SIZER.w} × ${SIZER.d} frame. Most crew bags are, and most of the time nobody checks.`
              : spare === 0
                ? `Exactly ${SIZER.h} × ${SIZER.w} × ${SIZER.d} with wheels and handle. Built to the frame with nothing to spare.`
                : `It clears a ${SIZER.h} × ${SIZER.w} × ${SIZER.d} frame with ${spare.toFixed(1)} in to spare, wheels and handle included — which is where most "carry-on sized" bags cheat.`,
          n.sizer ?? 'The number that matters is the one including wheels and handle. Makers often quote the case alone, which is smaller and irrelevant at a gate.',
        ],
        actionIcon: 'ph-seal-check',
        action:
          spare !== null && spare < 0
            ? '**Know that it is over before you fly it.** On a strict carrier or a full flight this is the bag that gets called.'
            : '**Zip the expansion closed before you leave the hotel** and it stays legal everywhere.',
      },
    },
    {
      key: 'wheels',
      icon: 'ph-wrench',
      value: spec.wheelsSwappable ? 'Yes' : 'No',
      unit: 'user-swappable',
      label: 'Wheels you replace yourself',
      caption: spec.wheels,
      ref: spec.wheelsSwappable ? 'Fixable' : 'Sealed',
      pane: {
        title: 'Wheels you replace yourself',
        sub: spec.wheels,
        paras: [
          'Crew bags do not die, their wheels do — usually somewhere around month fourteen, on jetbridge grating.',
          n.wheels ??
            (spec.wheelsSwappable
              ? 'These come off and swap at home for the cost of a crew meal, which is the difference between a bag that lasts five years and one that lasts two.'
              : 'These are not a user-serviceable part, so a dead wheel means a warranty claim or a new bag.'),
        ],
        actionIcon: 'ph-shopping-bag-open',
        action: spec.wheelsSwappable
          ? '**Buy the spare wheel set with the bag.** You will want it before you want anything else.'
          : '**Check what a wheel repair costs** before you commit — on a bag flown daily it is a when, not an if.',
      },
    },
    {
      key: 'price',
      icon: 'ph-tag',
      value: String(price.toLocaleString('en-US')),
      unit: 'USD',
      label: 'What you will pay',
      caption: 'Street price, checked August 2026',
      ref: priceRef(price),
      pane: {
        accent: price >= 750 ? 'var(--gold-600)' : undefined,
        title: 'What you will pay',
        sub: `$${price.toLocaleString('en-US')} USD`,
        paras: [
          `$${price.toLocaleString('en-US')} is the price at the link on this page, not a list price somebody hopes you will pay.`,
          n.price ?? 'The case for spending more is years, not features — a bag you replace every eighteen months costs more than one you keep.',
        ],
        actionIcon: 'ph-calendar-check',
        action: '**If you are in your first year, buy cheap.** Fly a pattern before you buy for it.',
      },
    },
    {
      key: 'lost',
      icon: 'ph-warning',
      value: spec.warrantyCoversDamage ? 'Any' : 'Defects',
      unit: 'damage covered',
      label: 'If it walks off a crew rack',
      caption: spec.warranty,
      ref: spec.warrantyCoversDamage ? 'Covered' : 'Tag it',
      pane: {
        accent: spec.warrantyCoversDamage ? undefined : 'var(--red-600)',
        title: 'If it walks off a crew rack',
        sub: spec.warranty,
        paras: [
          spec.warrantyCoversDamage
            ? 'Damage is repaired whatever caused it, including the ramp — which on a bag that lives on a belt is the coverage that actually pays out.'
            : 'The warranty covers defects. It does not cover theft, loss, or what the ramp does to it.',
          n.lost ?? `No warranty covers a bag walking off a crew rack. At $${price.toLocaleString('en-US')} that is money, not an inconvenience.`,
        ],
        actionIcon: 'ph-tag-simple',
        action:
          '**Tag it inside and out, and photograph the serial.** Add it to your renters or homeowners policy — most cover it away from home.',
      },
    },
  ];
}
