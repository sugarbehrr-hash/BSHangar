/* ============================================================
   Workday payslip parser
   ------------------------------------------------------------
   Reads a PSA "Payslip to Print" PDF entirely in the browser. The
   file is never uploaded: PDF.js is imported on demand, handed the
   bytes, and returns plain numbers. Nothing here touches the network.

   Interpretation works off text COORDINATES, not the flattened text,
   because payslip rows routinely omit a column — a check with no
   overage prints nothing under CURRENT AMOUNT — and reading left to
   right silently slides the YTD figure into the current column.

   Two details the layout forces, both learned from a real slip:

   1. Columns are RIGHT-ALIGNED, so values are matched on their right
      edge. Matching on centres puts the narrow PAY RATE "0" closer to
      the wide "CURRENT AMOUNT" header than the actual amount is.
   2. Every section has its OWN column positions (earnings, taxes, and
      the two deduction halves all differ), so they are captured per
      section from that section's header row.
   ============================================================ */

export interface PayslipLine {
  label: string;
  /** This check. 0 when the row printed no current amount. */
  current: number;
  ytd: number | null;
}

export interface Payslip {
  /** As printed, e.g. "07/06/2026". */
  checkDate: string | null;
  /** Day of month, used to tell the 5th check from the 20th. */
  checkDay: number | null;
  periodStart: string | null;
  periodEnd: string | null;
  earnings: PayslipLine[];
  taxes: PayslipLine[];
  preTax: PayslipLine[];
  postTax: PayslipLine[];
  netPay: number | null;
}

/**
 * One positioned piece of text from the PDF.
 *
 * Exported so the layout rules below can be exercised without PDF.js — they
 * are the part worth testing, and they are pure.
 */
export interface Item {
  str: string;
  x: number;
  y: number;
  w: number;
  /** Right edge. Columns are right-aligned, so this is what matching uses. */
  rx: number;
}

/** Right edges of the two value columns in a section. */
interface Columns {
  current: number;
  ytd: number;
}

type Row = Item[];

const MONEY = /^-?\$?[\d,]+\.\d{2}$/;
const BARE_INT = /^-?[\d,]*\d$/;

/** How far a value's right edge may sit from its column's, in points. */
const COLUMN_TOLERANCE = 20;

function toNumber(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, '');
  if (cleaned === '' || cleaned === '-') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function isNumeric(str: string): boolean {
  const s = str.trim();
  if (s === '-' || s === '') return false;
  return MONEY.test(s) || BARE_INT.test(s);
}

function toRows(items: Item[]): Row[] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: Row[] = [];
  let current: Row = [];
  let lastY: number | null = null;

  for (const item of sorted) {
    if (lastY !== null && Math.abs(item.y - lastY) > 3) {
      rows.push(current);
      current = [];
    }
    current.push(item);
    lastY = item.y;
  }
  if (current.length) rows.push(current);

  return rows.map((row) => [...row].sort((a, b) => a.x - b.x));
}

function rowText(row: Row): string {
  return row
    .map((i) => i.str.trim())
    .filter(Boolean)
    .join(' ')
    .toUpperCase();
}

/** Column header labels, per section. "AMOUNT" alone is the taxes column. */
function captureColumns(row: Row, from = -Infinity, to = Infinity): Columns | null {
  let current: number | null = null;
  let ytd: number | null = null;

  for (const item of row) {
    if (item.x < from || item.x > to) continue;
    const s = item.str.trim().toUpperCase();
    if (s === 'CURRENT AMOUNT' || s === 'CURRENT' || s === 'AMOUNT') current ??= item.rx;
    else if (s === 'YEAR TO DATE' || s === 'YTD') ytd ??= item.rx;
  }

  if (current === null && ytd === null) return null;
  return { current: current ?? (ytd as number) - 80, ytd: ytd ?? (current as number) + 80 };
}

/**
 * Read one statement line. Leading words form the label; each number is
 * assigned to whichever column its right edge lands on. Numbers belonging to
 * no column (HRS/UNIT, PAY RATE) are dropped rather than guessed at.
 *
 * Returns null when nothing landed in a column — that is a header fragment or
 * a wrapped label, not a data row.
 */
function readLine(row: Row, columns: Columns): PayslipLine | null {
  const labelParts: string[] = [];
  let current: number | null = null;
  let ytd: number | null = null;
  let sawNumber = false;

  for (const item of row) {
    const str = item.str.trim();
    if (!str || str === '-') continue;

    if (!isNumeric(str)) {
      if (!sawNumber) labelParts.push(str);
      continue;
    }

    sawNumber = true;
    const value = toNumber(str);
    if (value === null) continue;

    const toCurrent = Math.abs(item.rx - columns.current);
    const toYtd = Math.abs(item.rx - columns.ytd);
    if (Math.min(toCurrent, toYtd) > COLUMN_TOLERANCE) continue;

    if (toCurrent <= toYtd) current ??= value;
    else ytd ??= value;
  }

  const label = labelParts.join(' ').trim();
  if (!label) return null;
  if (current === null && ytd === null) return null;

  return { label, current: current ?? 0, ytd };
}

const HEADER_ROW =
  /HRS\/UNIT|CURRENT AMOUNT|YEAR TO DATE|PAY RATE|^DEDUCTIONS\b|^AMOUNT$|^EMPLOYEE TAXES\b/;

export async function parsePayslip(file: File): Promise<Payslip> {
  return interpretItems(await extractItems(file));
}

/**
 * Pull positioned text out of a PDF. PDF.js is imported dynamically so it is
 * fetched only when someone actually picks a file — it is larger than the rest
 * of this site put together.
 */
async function extractItems(file: File): Promise<Item[]> {
  const [pdfjs, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const doc = await loadingTask.promise;

  const items: Item[] = [];
  try {
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      for (const entry of content.items) {
        if (!('str' in entry)) continue;
        const t = entry.transform as number[];
        const x = t[4];
        const w = entry.width ?? 0;
        items.push({ str: entry.str, x, y: t[5], w, rx: x + w });
      }
    }
  } finally {
    // Release the worker even if a page fails, so a bad PDF cannot leak one.
    await loadingTask.destroy();
  }
  return items;
}

/** Turn positioned text into a payslip. Pure — no PDF.js, no DOM. */
export function interpretItems(items: Item[]): Payslip {
  const rows = toRows(items);

  const payslip: Payslip = {
    checkDate: null,
    checkDay: null,
    periodStart: null,
    periodEnd: null,
    earnings: [],
    taxes: [],
    preTax: [],
    postTax: [],
    netPay: null,
  };

  type Section = 'none' | 'earnings' | 'taxes' | 'deductions' | 'summary' | 'end';
  let section: Section = 'none';
  let cols: Columns | null = null;
  let colsRight: Columns | null = null;
  let divider = Infinity;

  for (const row of rows) {
    const text = rowText(row);

    // --- Section titles ---
    if (text === 'EARNINGS') {
      section = 'earnings';
      cols = null;
      continue;
    }
    if (text === 'EMPLOYEE TAXES') {
      section = 'taxes';
      cols = null;
      continue;
    }
    if (text.includes('PRE TAX DEDUCTIONS') || text.includes('POST TAX DEDUCTIONS')) {
      section = 'deductions';
      cols = null;
      colsRight = null;
      continue;
    }
    // The summary strip is headed by a wrapped two-line header; "NET PAY" only
    // appears there and marks the end of the deduction lists.
    if (section === 'deductions' && text.includes('NET PAY')) {
      section = 'summary';
      continue;
    }
    if (text.includes('TIME OFF') || text.includes('PAYMENT INFORMATION')) {
      section = 'end';
      continue;
    }
    if (section === 'end' || section === 'none') continue;

    // --- Column headers ---
    if (HEADER_ROW.test(text)) {
      if (section === 'deductions') {
        // Two "DEDUCTIONS" headers: the second one starts the post-tax half.
        const headers = row.filter((i) => i.str.trim().toUpperCase() === 'DEDUCTIONS');
        if (headers.length >= 2) divider = headers[1].x - 15;
        cols = captureColumns(row, -Infinity, divider) ?? cols;
        colsRight = captureColumns(row, divider, Infinity) ?? colsRight;
      } else {
        cols = captureColumns(row) ?? cols;
      }
      continue;
    }

    // --- Data rows ---
    if (section === 'earnings' && cols) {
      const line = readLine(row, cols);
      if (line) payslip.earnings.push(line);
    } else if (section === 'taxes' && cols) {
      const line = readLine(row, cols);
      if (line) payslip.taxes.push(line);
    } else if (section === 'deductions') {
      const left = row.filter((i) => i.x < divider);
      const right = row.filter((i) => i.x >= divider);
      if (cols && left.length) {
        const line = readLine(left, cols);
        if (line) payslip.preTax.push(line);
      }
      if (colsRight && right.length) {
        const line = readLine(right, colsRight);
        if (line) payslip.postTax.push(line);
      }
    } else if (section === 'summary' && payslip.netPay === null) {
      // One strip of totals: earnings, deductions, taxes, NET PAY, then YTD.
      const values = row
        .map((i) => (isNumeric(i.str.trim()) ? toNumber(i.str) : null))
        .filter((v): v is number => v !== null);
      if (values.length >= 4) payslip.netPay = values[3];
    }
  }

  const allText = rows.map((r) => r.map((i) => i.str.trim()).join(' ')).join('\n');
  const dates = allText.match(/\b\d{2}\/\d{2}\/\d{4}\b/g);
  if (dates?.length) {
    payslip.checkDate = dates[dates.length - 1];
    const day = Number(payslip.checkDate.split('/')[1]);
    payslip.checkDay = Number.isFinite(day) ? day : null;
    if (dates.length >= 2) {
      payslip.periodStart = dates[0];
      payslip.periodEnd = dates[1];
    }
  }

  return payslip;
}
