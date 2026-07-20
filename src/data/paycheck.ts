/* ============================================================
   Paycheck Estimator — field definitions & withholding table
   ------------------------------------------------------------
   Ported from the Blue Streak pay-tracking spreadsheet. Lives here
   rather than inside the page so the server can render the initial
   fields (visible without JS, and indexable by Pagefind) while the
   client script re-renders the same set on toggle — one definition,
   both passes.
   ============================================================ */

/** Which check a field applies to. 'both' shows on the 5th and the 20th. */
export type CheckDay = 5 | 20 | 'both';

export interface EarnField {
  key: string;
  label: string;
  note?: string;
  on: CheckDay;
}

export const EARNINGS: EarnField[] = [
  { key: 'gtd1', label: '1 Half GTD', note: 'Guarantee paid on the 5th', on: 5 },
  { key: 'gtd2', label: '2 Half GTD', note: 'Guarantee paid on the 20th', on: 20 },
  {
    key: 'over',
    label: 'Balance Paid at Overages',
    note: 'From Time Summary, paid on the 20th',
    on: 20,
  },
  { key: 'pdtax', label: 'Per Diem — taxable (PD $ Tax)', on: 'both' },
  { key: 'pdno', label: 'Per Diem — non-taxable (PD $ No Tax)', on: 'both' },
  {
    key: 'crew',
    label: 'Crew Cash',
    note: 'Accrued the previous month, only paid on the 20th',
    on: 20,
  },
  {
    key: 'misc',
    label: 'Misc',
    note: 'PSA bonuses, uniform reimbursement, Crew Pay corrections, etc.',
    on: 'both',
  },
];

export interface DeductionField {
  key: string;
  label: string;
  note?: string;
  /** Percent fields render a % affix and are treated as a rate, not an amount. */
  percent?: boolean;
}

export const DEDUCTIONS: DeductionField[] = [
  {
    key: 'pretax',
    label: 'Pre-Tax Deductions',
    note: 'Total per check — medical, dental, vision, etc. Same every check unless benefits change.',
  },
  {
    key: 'k401',
    label: '401(k) contribution',
    note: '% of GTD + overages + taxable per diem',
    percent: true,
  },
  { key: 'posttax', label: 'Post-Tax Deductions', note: 'Total per check from your paystub' },
  { key: 'dues', label: 'Union Dues', note: 'AFA dues per check' },
];

export interface Bracket {
  lo: number;
  hi: number;
  add: number;
  pct: number;
  sub: number;
}

/**
 * 2026 Publication 15-T, ANNUAL Percentage Method, STANDARD Withholding Rate
 * Schedules — for W-4 forms from 2020 or later with the Step 2 box unchecked.
 *
 * Held as the IRS publishes them (annual) and divided down, rather than
 * transcribed as per-check figures. The annual numbers are the ones you can
 * check against the publication, and deriving removes a whole class of
 * transcription error. Rows are [at least, tentative amount, percentage].
 *
 * Source: https://www.irs.gov/publications/p15t
 */
const ANNUAL_SCHEDULES: Record<FilingStatus, Array<[number, number, number]>> = {
  single: [
    [0, 0, 0],
    [7_500, 0, 10],
    [19_900, 1_240, 12],
    [57_900, 5_800, 22],
    [113_200, 17_966, 24],
    [209_275, 41_024, 32],
    [263_725, 58_448, 35],
    [648_100, 192_979.25, 37],
  ],
  mfj: [
    [0, 0, 0],
    [19_300, 0, 10],
    [44_100, 2_480, 12],
    [120_100, 11_600, 22],
    [230_700, 35_932, 24],
    [422_850, 82_048, 32],
    [531_750, 116_896, 35],
    [788_000, 206_583.5, 37],
  ],
};

/** Semimonthly: two checks a month. */
const PAY_PERIODS = 24;

/** Annual schedule -> per-check brackets. Thresholds keep full precision. */
function perCheck(rows: Array<[number, number, number]>): Bracket[] {
  return rows.map(([atLeast, tentative, pct], i) => {
    const next = rows[i + 1];
    return {
      lo: atLeast / PAY_PERIODS,
      hi: next ? next[0] / PAY_PERIODS : Infinity,
      add: tentative / PAY_PERIODS,
      pct,
      sub: atLeast / PAY_PERIODS,
    };
  });
}

export type FilingStatus = 'single' | 'mfj';

export interface FilingProfile {
  /** Full name, for the callout and the accessible label. */
  label: string;
  /** Button text. */
  short: string;
  /**
   * Per-check standard deduction — the Pub 15-T Step 1 adjustment ($8,600
   * single / $12,900 married filing jointly) spread across the pay periods.
   */
  allowance: number;
  brackets: Bracket[];
}

export const FILING: Record<FilingStatus, FilingProfile> = {
  single: {
    label: 'Single or Married filing separately',
    short: 'Single',
    allowance: 8_600 / PAY_PERIODS,
    brackets: perCheck(ANNUAL_SCHEDULES.single),
  },
  mfj: {
    label: 'Married filing jointly',
    short: 'Married filing jointly',
    allowance: 12_900 / PAY_PERIODS,
    brackets: perCheck(ANNUAL_SCHEDULES.mfj),
  },
};

export const DEFAULT_FILING: FilingStatus = 'single';

/**
 * Bracket row label. Shared so the server and client passes agree.
 *
 * Whole dollars print bare; the 2026 bounds land on cents, and a bracket
 * edge shown as "$312.5" reads like a typo next to a paystub.
 */
export function bracketRange(b: Bracket): string {
  const dollars = (n: number) =>
    '$' +
    n.toLocaleString('en-US', {
      minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
      maximumFractionDigits: 2,
    });

  return Number.isFinite(b.hi)
    ? `${dollars(b.lo)} – ${dollars(b.hi)}`
    : `${dollars(b.lo)} and up`;
}

/** Starting values. The non-zero ones are the figures that rarely change. */
export const DEFAULTS: Record<string, number> = {
  gtd1: 0,
  gtd2: 0,
  over: 0,
  pdtax: 0,
  pdno: 0,
  crew: 0,
  misc: 0,
  pretax: 179.38,
  k401: 0,
  posttax: 0,
  dues: 25.0,
  /** Overwritten whenever filing status changes. */
  allow: FILING[DEFAULT_FILING].allowance,
};

/** Combined Social Security + Medicare employee rate. */
export const FICA_RATE = 0.0765;
