/* ============================================================
   Payslip -> estimator field mapping
   ------------------------------------------------------------
   Deliberately an ALLOWLIST. Anything the payslip prints that is
   not recognised here is reported back to the user as unmapped
   rather than swept into Misc — a wrong number in a pay calculator
   is worse than a missing one, and the crew comparing this against
   a real paystub would have no way to tell which had happened.

   Two lines exist in more than one place on the payslip and must
   NOT be summed twice:
     • 401K PLAN sits under PRE TAX DEDUCTIONS, but the estimator
       has its own 401(k) field.
     • F/A DUES sits under POST TAX DEDUCTIONS, but the estimator
       has its own Union Dues field.
   Both are excluded from their section totals below.
   ============================================================ */

import type { Payslip, PayslipLine } from './payslip';

export interface MappedPayslip {
  /** Estimator field keys -> values, ready to write into the form. */
  values: Record<string, number>;
  /** Which check this payslip is, derived from the check date. */
  check: 5 | 20 | null;
  /** Actual figures, for reconciliation against the estimate. */
  actual: {
    federal: number | null;
    fica: number | null;
    net: number | null;
  };
  /** Printed lines carrying money that no rule claimed. */
  unmapped: string[];
  /** Things the user should know about how their slip was read. */
  notes: string[];
}

const norm = (s: string) => s.trim().toUpperCase().replace(/\s+/g, ' ');

/** Earnings rules, in order. First match wins. */
const EARNINGS_RULES: Array<{ test: (l: string) => boolean; key: string }> = [
  { test: (l) => l.startsWith('REGULAR'), key: 'REGULAR' },
  { test: (l) => l.includes('OVER GUARANTEE'), key: 'over' },
  { test: (l) => l.includes('CREW CASH'), key: 'crew' },
  { test: (l) => l.includes('PER DIEM') && l.includes('NON-TAX'), key: 'pdno' },
  { test: (l) => l.includes('PER DIEM'), key: 'pdtax' },
  { test: (l) => l.includes('PROFIT SHARING'), key: 'misc' },
];

/**
 * Imputed-income lines. Taxable, but not cash in the check, so adding them to
 * Misc — which the estimator treats as money you receive — would overstate
 * net pay. Flagged for the user instead of guessed at.
 */
const IMPUTED = [/NRSA/, /TAX VAL/, /IMPUTED/, /GTL/];

export function mapPayslip(slip: Payslip): MappedPayslip {
  const values: Record<string, number> = {};
  const unmapped: string[] = [];
  const notes: string[] = [];

  // 5th check or 20th. PSA pays the 1st-half guarantee early the following
  // month and the 2nd half mid-month, so the day of the check date decides it.
  const check: 5 | 20 | null =
    slip.checkDay === null ? null : slip.checkDay <= 12 ? 5 : 20;

  const claimed = new Set<PayslipLine>();

  for (const line of slip.earnings) {
    const label = norm(line.label);
    if (IMPUTED.some((re) => re.test(label))) {
      if (line.current > 0) {
        unmapped.push(`${line.label} (imputed income — not added, it isn't cash in the check)`);
      }
      claimed.add(line);
      continue;
    }

    const rule = EARNINGS_RULES.find((r) => r.test(label));
    if (!rule) {
      if (line.current > 0) unmapped.push(line.label);
      continue;
    }
    claimed.add(line);

    if (rule.key === 'REGULAR') {
      // The guarantee. The 20th pays 1 Half GTD, the 5th pays 2 Half GTD.
      if (check === 20) values.gtd1 = line.current;
      else values.gtd2 = line.current;
    } else {
      values[rule.key] = (values[rule.key] ?? 0) + line.current;
    }
  }

  // --- Pre-tax: everything except the 401(k), which has its own field ---
  let preTaxTotal = 0;
  let k401Dollars = 0;
  for (const line of slip.preTax) {
    const label = norm(line.label);
    if (label.includes('401K')) k401Dollars += line.current;
    else preTaxTotal += line.current;
  }
  values.pretax = round2(preTaxTotal);

  // --- Post-tax: everything except union dues, which has its own field ---
  let postTaxTotal = 0;
  let duesTotal = 0;
  for (const line of slip.postTax) {
    const label = norm(line.label);
    if (label.includes('DUES')) duesTotal += line.current;
    else postTaxTotal += line.current;
  }
  values.posttax = round2(postTaxTotal);
  if (duesTotal > 0) values.dues = round2(duesTotal);

  /**
   * The estimator takes 401(k) as a percentage of GTD + overages + taxable per
   * diem; the payslip states dollars. Invert it against the same base the
   * estimator uses, so re-running the calculation reproduces the dollar figure.
   */
  const k401Base = (values.gtd1 ?? 0) + (values.gtd2 ?? 0) + (values.over ?? 0) + (values.pdtax ?? 0);
  if (k401Dollars > 0 && k401Base > 0) {
    values.k401 = round2((k401Dollars / k401Base) * 100);
    notes.push(
      `401(k) read as $${k401Dollars.toFixed(2)}, entered as ${values.k401}% of this check's eligible pay.`
    );
  } else if (k401Dollars > 0) {
    notes.push(`401(k) of $${k401Dollars.toFixed(2)} found, but no eligible earnings to derive a rate from.`);
  }

  // --- Actuals, for reconcile ---
  let federal: number | null = null;
  let fica = 0;
  let sawFica = false;
  for (const line of slip.taxes) {
    const label = norm(line.label);
    if (label.includes('FEDERAL')) federal = line.current;
    else if (label.includes('OASDI') || label.includes('MEDICARE')) {
      fica += line.current;
      sawFica = true;
    } else if (line.current > 0) {
      unmapped.push(`${line.label} (tax line — the estimator has no field for it)`);
    }
  }

  if (check === null) notes.push('No check date found, so the 5th/20th selection was left as-is.');
  if (values.pdtax === undefined) {
    notes.push('No taxable per-diem line on this slip; that field was left at zero.');
  }

  return {
    values,
    check,
    actual: { federal, fica: sawFica ? round2(fica) : null, net: slip.netPay },
    unmapped,
    notes,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
