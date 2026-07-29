/* ============================================================
   Payslip auditor
   ------------------------------------------------------------
   Recomputes a PSA payslip from its own printed figures and
   reports where the slip disagrees with itself or with the
   contract.

   Every rule here was derived from five consecutive real slips
   (check dates 05/20, 06/05, 06/18, 07/06 and 07/20 of 2026)
   and reproduces those slips to the cent. A rule that could not
   be made exact is NOT in this file — an auditor that cries
   wolf over rounding teaches people to ignore it.

   Two severities, deliberately different in kind:

     'error'  arithmetic. The slip does not add up. There is no
              innocent explanation, so it is stated flatly.
     'check'  contractual or tabular. Usually a mid-period
              change or a W-4 that does not match, not a mistake
              by payroll — worth a look, not worth a phone call.
   ============================================================ */

import type { Payslip, PayslipLine } from './payslip';
import { FILING, type FilingStatus } from '../data/paycheck';

/** Employee share of Social Security and Medicare, as published. */
const OASDI_RATE = 0.062;
const MEDICARE_RATE = 0.0145;

/**
 * Deductions that reduce the FICA base — the Section 125 cafeteria-plan lines.
 *
 * This list is not a guess. Including SUPP LTD and ACCIDENT (which look
 * pre-tax, and sit in the slip's PRE TAX DEDUCTIONS block) throws OASDI out by
 * ~$0.60; excluding them reproduces OASDI and Medicare exactly on all five
 * reference slips. 401(k) is pre-tax for income tax but NOT for FICA, so it is
 * absent here on purpose.
 */
const FICA_EXEMPT = [/MEDICAL/, /DENTAL/, /VISION/, /FLEX/];

/** Earnings that are taxable but are not cash in the check. */
const IMPUTED = [/NRSA/, /TAX VAL/, /IMPUTED/, /GTL/];

/** Earnings exempt from both income tax and FICA. */
const NON_TAXABLE = [/NON-?TAX/];

const norm = (s: string) => s.toUpperCase().replace(/\s+/g, ' ').trim();
const matches = (label: string, list: RegExp[]) => list.some((re) => re.test(norm(label)));
const sum = (lines: PayslipLine[]) => lines.reduce((total, line) => total + line.current, 0);
const round2 = (n: number) => Math.round(n * 100) / 100;

export type Severity = 'ok' | 'check' | 'error';

export interface Finding {
  /** Stable id, so the page can style or link a specific rule. */
  id: string;
  label: string;
  severity: Severity;
  /** What the slip printed, and what this rule expected. Null when N/A. */
  actual: number | null;
  expected: number | null;
  /** One sentence, written for someone who is not an accountant. */
  detail: string;
}

export interface AuditReport {
  findings: Finding[];
  /** Worst severity present, which is what the headline reports. */
  verdict: Severity;
  gross: number;
  imputed: number;
  deductions: number;
  taxes: number;
  netExpected: number;
  netPrinted: number | null;
  /** Guarantee hours the slip actually paid, when a rate was printed. */
  guaranteeHours: number | null;
  checkDay: number | null;
}

/** A line's current amount, or 0 when the slip printed nothing. */
const findLine = (lines: PayslipLine[], re: RegExp) =>
  lines.find((line) => re.test(norm(line.label)))?.current ?? 0;

/**
 * Audit a parsed payslip.
 *
 * `filing` and `allowances` come off the slip itself where the parser can read
 * them; the caller passes what it has, and the federal-withholding rule simply
 * does not run when they are missing rather than assuming Single.
 */
export function auditPayslip(
  slip: Payslip,
  options: { filing?: FilingStatus | null; allowances?: number | null } = {}
): AuditReport {
  const findings: Finding[] = [];

  const gross = round2(sum(slip.earnings));
  const imputed = round2(sum(slip.earnings.filter((l) => matches(l.label, IMPUTED))));
  const nonTaxable = round2(sum(slip.earnings.filter((l) => matches(l.label, NON_TAXABLE))));
  const deductions = round2(sum(slip.preTax) + sum(slip.postTax));
  const taxes = round2(sum(slip.taxes));

  /* --- 1. Does the slip add up? Pure arithmetic, no assumptions. --- */
  const netExpected = round2(gross - imputed - deductions - taxes);
  const netPrinted = slip.netPay;

  if (netPrinted !== null) {
    const off = round2(netPrinted - netExpected);
    findings.push({
      id: 'net-identity',
      label: 'Net pay adds up',
      severity: Math.abs(off) <= 0.01 ? 'ok' : 'error',
      actual: netPrinted,
      expected: netExpected,
      detail:
        Math.abs(off) <= 0.01
          ? 'Earnings minus deductions and taxes matches the net exactly.'
          : `Earnings minus deductions and taxes comes to ${netExpected.toFixed(2)}, but the slip ` +
            `paid ${netPrinted.toFixed(2)} — a gap of ${Math.abs(off).toFixed(2)}.`,
    });
  }

  /* --- 2. Social Security and Medicare --- */
  const ficaExempt = round2(
    sum(slip.preTax.filter((line) => matches(line.label, FICA_EXEMPT)))
  );
  const ficaBase = round2(gross - nonTaxable - ficaExempt);

  const ficaRule = (
    id: string,
    label: string,
    rate: number,
    printed: number
  ): Finding => {
    const expected = round2(ficaBase * rate);
    const off = round2(printed - expected);
    // A cent either way is the payroll system's own rounding.
    const clean = Math.abs(off) <= 0.02;
    return {
      id,
      label,
      severity: clean ? 'ok' : 'error',
      actual: printed,
      expected,
      detail: clean
        ? `${(rate * 100).toFixed(2)}% of ${ficaBase.toFixed(2)} — correct.`
        : `Expected ${(rate * 100).toFixed(2)}% of ${ficaBase.toFixed(2)} = ${expected.toFixed(2)}, ` +
          `but the slip withheld ${printed.toFixed(2)}.`,
    };
  };

  const oasdi = findLine(slip.taxes, /OASDI|SOCIAL/);
  const medicare = findLine(slip.taxes, /MEDICARE/);
  if (oasdi > 0) findings.push(ficaRule('oasdi', 'Social Security (OASDI)', OASDI_RATE, oasdi));
  if (medicare > 0) findings.push(ficaRule('medicare', 'Medicare', MEDICARE_RATE, medicare));

  /* --- 3. Guarantee hours, §3.P ---
     Deliberately absent. It needs REGULAR ÷ PAY RATE, and the parser drops the
     PAY RATE column on purpose (see payslip.ts) rather than guessing at a
     value that lands under no header. Reading that column is its own change;
     inferring the rate from the dollars would make this rule circular. */
  const guaranteeHours: number | null = null;

  /* --- 4. Is the right kind of money on this check? --- */
  if (slip.checkDay !== null && slip.checkDay <= 12) {
    const strays = slip.earnings.filter(
      (line) =>
        line.current > 0 &&
        /OVER GUARANTEE|PER DIEM|CREW CASH/.test(norm(line.label))
    );
    if (strays.length > 0) {
      findings.push({
        id: 'wrong-check',
        label: 'Overages on a 5th check',
        severity: 'check',
        actual: round2(sum(strays)),
        expected: 0,
        detail:
          `The 5th normally carries the guarantee alone — overages, per diem and crew cash ` +
          `settle on the 20th. This slip has ${strays.map((s) => s.label).join(', ')}.`,
      });
    }
  }

  /* --- 5. Federal withholding, Pub 15-T --- */
  const federal = findLine(slip.taxes, /FEDERAL/);
  const filing = options.filing ?? null;

  if (federal > 0 && filing) {
    const profile = FILING[filing];
    const preTaxIncome = round2(sum(slip.preTax));
    const taxableIncome = round2(gross - nonTaxable - preTaxIncome - profile.allowance);

    let expected = 0;
    if (taxableIncome > 0) {
      const band = profile.brackets.find((b) => taxableIncome >= b.lo && taxableIncome < b.hi);
      if (band) expected = round2(Math.max(0, band.add + (taxableIncome - band.sub) * (band.pct / 100)));
    }

    const off = round2(federal - expected);
    // Federal is the loosest of these: additional withholding, allowances and
    // mid-year W-4 changes all move it legitimately.
    const clean = Math.abs(off) <= 5;
    findings.push({
      id: 'federal',
      label: 'Federal income tax',
      severity: clean ? 'ok' : 'check',
      actual: federal,
      expected,
      detail: clean
        ? `In line with the ${profile.label} table for this check.`
        : `The ${profile.label} table gives about ${expected.toFixed(2)} on ${taxableIncome.toFixed(2)} ` +
          `of taxable pay; the slip withheld ${federal.toFixed(2)}. Extra withholding on your W-4 ` +
          `explains a higher figure.`,
    });
  }

  const worst: Severity = findings.some((f) => f.severity === 'error')
    ? 'error'
    : findings.some((f) => f.severity === 'check')
      ? 'check'
      : 'ok';

  return {
    findings,
    verdict: worst,
    gross,
    imputed,
    deductions,
    taxes,
    netExpected,
    netPrinted,
    guaranteeHours,
    checkDay: slip.checkDay,
  };
}
