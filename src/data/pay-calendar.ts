/* ============================================================
   Pay calendar — which flying lands on which check
   ------------------------------------------------------------
   The estimator's most common misuse is entering a bid month's
   figures against the wrong check. The dates are not intuitive:
   the guarantee is nearly current, but overages, per diem and
   crew cash settle a full bid month behind.

   Proven against a real PSA "Payslip to Print", check 07/20/2026:

     START PERIOD 07/01/2026 · END PERIOD 07/15/2026
     REGULAR  $1,220.10 @ $34.86  =  exactly 35.00 hrs

   35 hrs is the §3.P split (½ × 75 − 2.5), which fixes both ends:

     1st – 15th   ->  paid the 20th of the SAME month,  35 hrs
     16th – EOM   ->  paid the 5th of the NEXT month,   40 hrs

   Everything else here derives from those two rules, so there is
   one place to correct if PSA moves a date.
   ============================================================ */

/** Monthly guarantee for a flight attendant available the full month. §3.B */
export const MONTHLY_GUARANTEE = 75;

/**
 * §3.P does not split the guarantee down the middle. It moves 2.5 hrs from
 * the 20th to the 5th: "the 20th (½ guarantee − 2.5 hrs …) and the 5th
 * (½ guarantee + 2.5 hrs)". The payslip above confirms the 35.
 */
const HALF_GUARANTEE = MONTHLY_GUARANTEE / 2;
const HALF_SHIFT = 2.5;

export const GUARANTEE_ON_20 = HALF_GUARANTEE - HALF_SHIFT; // 35
export const GUARANTEE_ON_5 = HALF_GUARANTEE + HALF_SHIFT; // 40

/**
 * The day of the month a check lands. PSA pays semi-monthly, on the 5th and
 * the 20th.
 *
 * Around weekends and bank holidays a check can land a day or two EARLY —
 * June 2026's 20th paid on the 18th, the Thursday before Juneteenth. It is
 * never modelled as landing late: pay is deliberately stated as the earliest
 * date crew can count on, so nobody plans a bill against a date that slips.
 */
export type PayDay = 5 | 20;

/** Last day of a calendar month. Day 0 of the next month is the last of this. */
const lastDayOf = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

/**
 * Stable key for a date, free of timezone drift.
 *
 * Everything here is built with `new Date(y, m, d)` — local midnight — and
 * compared through this. Nothing parses a date string, which is where the
 * UTC-vs-local off-by-one bugs come from.
 */
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Inverse of `dayKey`, built local-midnight so it round-trips exactly. */
export const fromKey = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const sameDay = (a: Date, b: Date) => dayKey(a) === dayKey(b);

/** Which half of the bid month a date falls in. The split is the 15th/16th. */
export const halfOfMonth = (day: number): 1 | 2 => (day <= 15 ? 1 : 2);

export interface PayCheck {
  /** The date the money lands — may be a day or two early around holidays. */
  payDate: Date;
  payDay: PayDay;
  /** The flying period this check's guarantee covers, inclusive. */
  periodStart: Date;
  periodEnd: Date;
  /** Bid month the period belongs to, as that month's 1st. */
  bidMonth: Date;
  /** Which half of `bidMonth` the period is. */
  half: 1 | 2;
  /** Guarantee hours paid on this check. */
  guaranteeHours: number;
  /**
   * Bid month whose overages, per diem and crew cash settle on this check,
   * as that month's 1st — or null when nothing settles.
   *
   * §3.P puts the "prior overage/per diem" on the 20th only, and the 20th
   * check above carries an overage far too large for a single half-month
   * (72 hrs above a 75-hr monthly guarantee), which is the prior bid month
   * closing out. The 5th is guarantee alone.
   */
  settles: Date | null;
}

/**
 * The check landing on `payDay` of the given month.
 *
 * `month` is 0-based and may sit outside 0–11; Date normalises it, so callers
 * can step months without guarding the year boundary.
 */
export function checkOn(year: number, month: number, payDay: PayDay): PayCheck {
  const payDate = new Date(year, month, payDay);

  if (payDay === 20) {
    // Pays the first half of its own month, and settles the month before.
    return {
      payDate,
      payDay,
      periodStart: new Date(year, month, 1),
      periodEnd: new Date(year, month, 15),
      bidMonth: new Date(year, month, 1),
      half: 1,
      guaranteeHours: GUARANTEE_ON_20,
      settles: new Date(year, month - 1, 1),
    };
  }

  // The 5th pays the second half of the PREVIOUS month.
  const bidMonth = new Date(year, month - 1, 1);
  return {
    payDate,
    payDay,
    periodStart: new Date(bidMonth.getFullYear(), bidMonth.getMonth(), 16),
    periodEnd: new Date(
      bidMonth.getFullYear(),
      bidMonth.getMonth(),
      lastDayOf(bidMonth.getFullYear(), bidMonth.getMonth())
    ),
    bidMonth,
    half: 2,
    guaranteeHours: GUARANTEE_ON_5,
    settles: null,
  };
}

/** Both checks landing in the given calendar month, in the order they land. */
export function checksInMonth(year: number, month: number): PayCheck[] {
  return [checkOn(year, month, 5), checkOn(year, month, 20)];
}

/**
 * The soonest check of this type landing on or after `from`.
 *
 * "Your 20th" is not a date someone can plan around; "Thu, Aug 20" is. This
 * turns the estimator's abstract 5th/20th choice into the actual next payday.
 */
export function nextCheckOfType(from: Date, payDay: PayDay): PayCheck {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (let ahead = 0; ahead <= 2; ahead++) {
    const candidate = checkOn(from.getFullYear(), from.getMonth() + ahead, payDay);
    if (candidate.payDate >= start) return candidate;
  }
  // Unreachable: two months always contain a later check of either type.
  return checkOn(from.getFullYear(), from.getMonth() + 2, payDay);
}

/**
 * The check that pays the GUARANTEE for a day of flying.
 *
 * This is the near-term half. It is not the whole story for that day, which
 * is the misunderstanding the calendar exists to correct — see `settlementFor`.
 */
export function guaranteeCheckFor(day: Date): PayCheck {
  const year = day.getFullYear();
  const month = day.getMonth();

  return halfOfMonth(day.getDate()) === 1
    ? checkOn(year, month, 20)
    : checkOn(year, month + 1, 5);
}

/**
 * The check that settles OVERAGES, PER DIEM and CREW CASH for a day of flying
 * — the 20th of the month after the bid month, a full month behind the
 * guarantee. This lag is what catches people out.
 */
export function settlementCheckFor(day: Date): PayCheck {
  return checkOn(day.getFullYear(), day.getMonth() + 1, 20);
}

export interface CalendarDay {
  date: Date;
  /** False for the leading and trailing days borrowed from adjacent months. */
  inMonth: boolean;
  half: 1 | 2;
  /** The check landing on this date, when one does. */
  check: PayCheck | null;
}

/**
 * A Sunday-first month grid, padded with the neighbouring months' days so
 * every row holds seven cells.
 */
export function monthGrid(year: number, month: number): CalendarDay[][] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const total = lastDayOf(year, month);

  /**
   * Paydays are matched on the date a check ACTUALLY lands, which is not
   * always the 5th or the 20th — June 2026's landed on the 18th. Neighbouring
   * months are included because a shift can cross a month boundary.
   */
  const landing = new Map<string, PayCheck>();
  for (let m = month - 1; m <= month + 1; m++) {
    for (const check of checksInMonth(year, m)) landing.set(dayKey(check.payDate), check);
  }

  const cell = (date: Date, inMonth: boolean): CalendarDay => ({
    date,
    inMonth,
    half: halfOfMonth(date.getDate()),
    check: landing.get(dayKey(date)) ?? null,
  });

  const cells: CalendarDay[] = [];
  for (let i = firstWeekday; i > 0; i--) cells.push(cell(new Date(year, month, 1 - i), false));
  for (let d = 1; d <= total; d++) cells.push(cell(new Date(year, month, d), true));
  for (let trailing = 1; cells.length % 7 !== 0; trailing++) {
    cells.push(cell(new Date(year, month, total + trailing), false));
  }

  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/* ---------- Labels ---------- */

export const MONTH_LONG = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

export const MONTH_NAME = (d: Date) => d.toLocaleDateString('en-US', { month: 'long' });

/** "Mon, Jul 20" — short enough for a status line on a phone. */
export const DAY_LABEL = (d: Date) =>
  d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

/** "Jul 1 – Jul 15" */
export const PERIOD_LABEL = (check: PayCheck) =>
  `${check.periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ` +
  `${check.periodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
