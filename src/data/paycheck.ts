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
 * Semimonthly percentage-method federal withholding, from the spreadsheet.
 *
 * The IRS reissues these every year in Publication 15-T, which is why the page
 * exposes the table as editable inputs instead of burying it — the numbers are
 * expected to go stale and crew are expected to correct them.
 */
export const BRACKETS: Bracket[] = [
  { lo: 0, hi: 404, add: 0, pct: 0, sub: 0 },
  { lo: 404, hi: 609, add: 0, pct: 10, sub: 404 },
  { lo: 609, hi: 1922, add: 42.8, pct: 12, sub: 609 },
  { lo: 1922, hi: 3893, add: 200.36, pct: 22, sub: 1922 },
  { lo: 3893, hi: 7267, add: 633.98, pct: 24, sub: 3893 },
  { lo: 7267, hi: 9179, add: 1443.74, pct: 32, sub: 7267 },
  { lo: 9179, hi: Infinity, add: 2055.58, pct: 35, sub: 9179 },
];

/** Bracket row label. Shared so the server and client passes agree. */
export function bracketRange(b: Bracket): string {
  return Number.isFinite(b.hi)
    ? `$${b.lo.toLocaleString()} – $${b.hi.toLocaleString()}`
    : `$${b.lo.toLocaleString()} and up`;
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
  allow: 179.38,
};

/** Combined Social Security + Medicare employee rate. */
export const FICA_RATE = 0.0765;
