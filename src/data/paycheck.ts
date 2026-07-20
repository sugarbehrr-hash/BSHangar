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
 * Semimonthly percentage-method federal withholding.
 *
 * 2026 Publication 15-T, Single / Standard withholding with the W-4 Step 2 box
 * unchecked, converted to per-semimonthly-check amounts.
 *
 * The IRS reissues these every year, which is why the page exposes the table as
 * editable inputs instead of burying it — the numbers are expected to go stale,
 * and married-filing-jointly crew need to override them regardless.
 */
export const BRACKETS: Bracket[] = [
  { lo: 0, hi: 312.5, add: 0, pct: 0, sub: 0 },
  { lo: 312.5, hi: 829.17, add: 0, pct: 10, sub: 312.5 },
  { lo: 829.17, hi: 2412.5, add: 51.67, pct: 12, sub: 829.17 },
  { lo: 2412.5, hi: 4716.67, add: 241.67, pct: 22, sub: 2412.5 },
  { lo: 4716.67, hi: 8719.79, add: 748.58, pct: 24, sub: 4716.67 },
  { lo: 8719.79, hi: 10988.54, add: 1709.33, pct: 32, sub: 8719.79 },
  { lo: 10988.54, hi: 27004.17, add: 2435.33, pct: 35, sub: 10988.54 },
  { lo: 27004.17, hi: Infinity, add: 8040.79, pct: 37, sub: 27004.17 },
];

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
  /** 2026 standard deduction per semimonthly check, Single. */
  allow: 358.33,
};

/** Combined Social Security + Medicare employee rate. */
export const FICA_RATE = 0.0765;
