/* ============================================================
   Pay calendar — markup
   ------------------------------------------------------------
   One renderer, both passes. The page is static, so the server
   can only ever bake in the BUILD month; the client re-renders
   for the reader's actual today and again on every step. Having
   Astro and the client script each own a copy of this markup is
   how the two quietly drift apart, so neither does — the page
   hands this string to `set:html` and the script calls the same
   function.
   ============================================================ */

import {
  monthGrid,
  guaranteeCheckFor,
  settlementCheckFor,
  halfOfMonth,
  DAY_LABEL,
  MONTH_LONG,
  MONTH_NAME,
  PERIOD_LABEL,
  dayKey,
  sameDay,
  type PayCheck,
} from '../data/pay-calendar';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export interface CalendarState {
  /** Month on show. 0-based, may sit outside 0–11. */
  year: number;
  month: number;
  /** The reader's today, so the current day can be ringed. */
  today: Date;
  /** The day whose payout is being explained, if any. */
  selected: Date | null;
}

/**
 * The calendar grid and its month bar.
 *
 * Days carry no `disabled` state: a reader looking at next month's flying is
 * asking a legitimate question, and so is one looking back at last month's.
 */
export function renderCalendar(state: CalendarState): string {
  const { year, month, today, selected } = state;

  const head =
    `<div class="paycal-bar">` +
    `<button type="button" class="paycal-nav" data-cal-step="-1" aria-label="Previous month">` +
    `<i class="ph-fill ph-caret-left" aria-hidden="true"></i></button>` +
    `<div class="paycal-title">${MONTH_LONG(new Date(year, month, 1))}</div>` +
    `<button type="button" class="paycal-nav" data-cal-step="1" aria-label="Next month">` +
    `<i class="ph-fill ph-caret-right" aria-hidden="true"></i></button>` +
    `</div>`;

  const dow = WEEKDAYS.map((d) => `<span class="paycal-dow">${d}</span>`).join('');

  const cells = monthGrid(year, month)
    .flat()
    .map((cell) => {
      const isSelected = selected !== null && sameDay(cell.date, selected);
      const isToday = sameDay(cell.date, today);

      const classes = ['paycal-day', `half${cell.half}`];
      if (!cell.inMonth) classes.push('out');
      if (cell.check) classes.push('pay');
      if (isToday) classes.push('today');
      if (isSelected) classes.push('on');

      // The dot and the ring are visual; the label carries the same facts for
      // anyone who is not looking at the colours.
      const said = [DAY_LABEL(cell.date)];
      if (cell.check) said.push(`payday, ${cell.check.guaranteeHours} hour guarantee`);
      if (isToday) said.push('today');

      return (
        `<button type="button" class="${classes.join(' ')}" data-day="${dayKey(cell.date)}" ` +
        `aria-pressed="${isSelected}" aria-label="${said.join(', ')}">` +
        `<span class="paycal-num">${cell.date.getDate()}</span>` +
        (cell.check ? `<span class="paycal-dot" aria-hidden="true"></span>` : '') +
        `</button>`
      );
    })
    .join('');

  const key =
    `<div class="paycal-key">` +
    `<span class="paycal-keyitem"><span class="paycal-chip half1"></span>1st – 15th</span>` +
    `<span class="paycal-keyitem"><span class="paycal-chip half2"></span>16th – end</span>` +
    `<span class="paycal-keyitem"><span class="paycal-dot solo" aria-hidden="true"></span>Payday</span>` +
    `</div>`;

  return head + `<div class="paycal-grid">${dow}${cells}</div>` + key;
}

/**
 * The answer panel: pick a day, learn when that day's flying turns into money.
 *
 * Split deliberately into two dates. The single most common misuse of the
 * estimator is entering a month's overages against the check that carries the
 * guarantee alone, so the lag gets its own line rather than being buried in
 * prose.
 */
export function renderDayAnswer(day: Date | null): string {
  if (day === null) {
    return (
      `<div class="paycal-hint">` +
      `<i class="ph-fill ph-hand-tap" aria-hidden="true"></i>` +
      `<span>Tap a day you flew. The guarantee and the overages from that day do ` +
      `<strong>not</strong> land on the same check.</span>` +
      `</div>`
    );
  }

  const guarantee = guaranteeCheckFor(day);
  const settlement = settlementCheckFor(day);
  const first = halfOfMonth(day.getDate()) === 1;

  const rows = [
    {
      what: `Guarantee — ${guarantee.guaranteeHours} hrs`,
      note: `${first ? 'First' : 'Second'} half of ${MONTH_NAME(day)} · ${PERIOD_LABEL(guarantee)}`,
      when: DAY_LABEL(guarantee.payDate),
    },
    {
      what: 'Overages, per diem &amp; crew cash',
      note: `All of ${MONTH_NAME(day)}, settled a bid month behind`,
      when: DAY_LABEL(settlement.payDate),
    },
  ];

  const gap = Math.round(
    (settlement.payDate.getTime() - guarantee.payDate.getTime()) / 86_400_000
  );

  return (
    `<div class="paycal-answer">` +
    `<div class="paycal-answer-head">Flew <strong>${DAY_LABEL(day)}</strong>? Here's when it pays</div>` +
    rows
      .map(
        (r) =>
          `<div class="paycal-row">` +
          `<span class="paycal-what">${r.what}<small>${r.note}</small></span>` +
          `<span class="paycal-when">${r.when}</span>` +
          `</div>`
      )
      .join('') +
    `<p class="paycal-gap"><strong>${gap} days</strong> apart, for the same day's flying. ` +
    `${MONTH_NAME(day)}'s overages belong on the ${DAY_LABEL(settlement.payDate)} check — ` +
    `not the ${DAY_LABEL(guarantee.payDate)} one.</p>` +
    `</div>`
  );
}

/**
 * What the check currently being estimated actually contains. This is the line
 * that stops someone entering per diem against a check that never carries any.
 */
export function renderCheckSummary(check: PayCheck): string {
  const settles = check.settles ? MONTH_NAME(check.settles) : null;

  const lines = [
    `<strong>${check.guaranteeHours} hrs of guarantee</strong> for ${PERIOD_LABEL(check)} — the ` +
      `${check.half === 1 ? 'first' : 'second'} half of ${MONTH_NAME(check.bidMonth)}`,
    settles
      ? `<strong>${settles}'s overages, per diem and crew cash</strong>, settling a bid month behind`
      : `<strong>Nothing else.</strong> No overages, no per diem, no crew cash — the 5th is guarantee alone`,
  ];

  return (
    `<div class="paycal-summary">` +
    `<div class="paycal-summary-head">The ${DAY_LABEL(check.payDate)} check pays</div>` +
    `<ul>${lines.map((l) => `<li>${l}</li>`).join('')}</ul>` +
    `</div>`
  );
}
