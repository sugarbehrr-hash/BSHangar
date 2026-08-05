/**
 * The per-card feedback strip.
 *
 * GEOMETRY — inherited, not invented. The card is a CSS grid built in
 * card-render.js:399 (`1fr 224px`, padding `20px 16px 20px 22px`, radius 16px).
 * A footer that spans it has to be a direct child at `grid-column:1/-1` whose
 * negative margins cancel the card's own padding. That trick is already proven
 * by the beta layer this replaces (review.js:46) and is reused verbatim — with
 * one correction: the left margin stays -22px at every width. The old layer
 * dropped to -16px below 560px while the card's padding-left stayed 22px,
 * leaving a 6px shelf down the left edge of the strip.
 *
 * COLOUR — the guide's document has no shared component CSS, only design
 * tokens, so these classes are defined here. Selection is expressed one way and
 * one way only: the chosen button takes a solid fill, everything else stays
 * outlined. The design brief's loudest complaint was five different "this one
 * is selected" treatments across the site; this adds a sixth only if it
 * invents its own, so it does not.
 */

import { PRIVACY_URL, LIMITS } from './config.js';
import { FAILED, PENDING, SYNCED } from './state.js';

const STRIP = 'bsf-strip';

export function injectCss() {
  if (document.getElementById('bsf-css')) return;
  const style = document.createElement('style');
  style.id = 'bsf-css';
  style.textContent = [
    // Injected UI sets its own box model so a width:100% field can never
    // overflow the card that contains it.
    `.${STRIP},.${STRIP} *{box-sizing:border-box}`,

    `.${STRIP}{grid-column:1/-1;margin:14px -16px -20px -22px;`,
    `border-top:1px solid var(--cream-300,#e3dccb);border-radius:0 0 15px 15px;`,
    `background:var(--cream-100,#faf6ef);overflow:hidden;`,
    `font-family:var(--font-body,sans-serif)}`,

    // Prompt row.
    `.bsf-row{display:flex;align-items:center;gap:9px;flex-wrap:wrap;padding:11px 20px;`,
    `transition:background .15s ease}`,
    `.bsf-label{font-family:var(--font-heading,inherit);font-size:10px;font-weight:800;`,
    `letter-spacing:.09em;text-transform:uppercase;color:var(--ink-500,#7c8398);margin-right:2px}`,

    // Open state. Per the site-wide rule, the header of an expanded thing
    // inverts to navy — it never becomes a cream tint.
    //
    // Every inverted rule is scoped to `.bsf-row`, NOT to the whole strip. The
    // form body below the header stays on cream, so an unscoped inversion put
    // white text and a transparent fill on the Send button sitting on a cream
    // background — the primary action, invisible — and turned the note label
    // gold-on-cream. Descendant selectors that cross a background change are
    // exactly where this goes wrong; keep the boundary explicit.
    `.${STRIP}.is-open .bsf-row{background:var(--navy-900,#1f2a44)}`,
    `.${STRIP}.is-open .bsf-row .bsf-label{color:var(--gold-500,#e8a33d)}`,

    // One button, two weights. Nothing about the shape changes between states.
    `.bsf-btn{display:inline-flex;align-items:center;gap:6px;`,
    `font-family:var(--font-heading,inherit);font-weight:800;font-size:12px;`,
    `border-radius:8px;padding:6px 12px;cursor:pointer;`,
    `background:var(--white,#fff);border:1.5px solid var(--cream-300,#d8cfb8);`,
    `color:var(--ink-700,#3a4256);min-height:var(--tap-min,34px)}`,
    `.bsf-btn:hover{border-color:var(--navy-900,#1f2a44)}`,
    `.bsf-btn[aria-pressed="true"]{background:var(--navy-900,#1f2a44);`,
    `border-color:var(--navy-900,#1f2a44);color:#fff}`,
    // On the inverted row the fills swap, so the selected item stays the
    // highest-contrast thing in the row rather than disappearing into it.
    `.${STRIP}.is-open .bsf-row .bsf-btn{background:transparent;border-color:rgba(255,255,255,.34);color:#fff}`,
    `.${STRIP}.is-open .bsf-row .bsf-btn:hover{border-color:#fff}`,
    `.${STRIP}.is-open .bsf-row .bsf-btn[aria-pressed="true"]{background:var(--gold-500,#e8a33d);`,
    `border-color:var(--gold-500,#e8a33d);color:#3a2a08}`,
    `.${STRIP}.is-open .bsf-row .bsf-link{color:var(--sky-300,#9db6d4)}`,
    `.${STRIP}.is-open .bsf-row .bsf-link:hover{color:#fff}`,

    // Quiet inline actions (Change / Undo / Try again).
    `.bsf-link{background:none;border:0;padding:4px 2px;cursor:pointer;`,
    `font-family:var(--font-body,sans-serif);font-size:11.5px;font-weight:700;`,
    `color:var(--sky-700,#5b7fa6);text-decoration:underline}`,
    `.bsf-link:hover{color:var(--navy-900,#1f2a44)}`,
    `.bsf-actions{margin-left:auto;display:flex;align-items:center;gap:4px}`,
    `.bsf-sep{color:var(--ink-500,#7c8398);font-size:11px}`,

    // Resolved state line.
    `.bsf-said{font-size:13px;color:var(--ink-700,#3a4256)}`,
    `.bsf-said b{color:var(--navy-900,#1f2a44);font-weight:700}`,
    `.bsf-said.is-warn{color:var(--ink-700,#3a4256)}`,

    // Note form.
    `.bsf-form{padding:12px 20px 14px;display:none}`,
    `.${STRIP}.is-open .bsf-form{display:block}`,
    `.bsf-form textarea{width:100%;min-height:56px;resize:vertical;`,
    `font-family:inherit;font-size:13px;line-height:1.45;color:var(--ink-700,#3a4256);`,
    `border:1.5px solid var(--cream-300,#d8cfb8);border-radius:9px;padding:9px 11px;`,
    `background:var(--white,#fff)}`,
    `.bsf-form textarea:focus{outline:none;border-color:var(--sky-700,#5b7fa6)}`,
    `.bsf-foot{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:9px}`,
    `.bsf-base{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;`,
    `color:var(--ink-500,#7c8398)}`,
    `.bsf-base input{width:72px;font-family:inherit;font-size:13px;padding:6px 9px;`,
    `border:1.5px solid var(--cream-300,#d8cfb8);border-radius:8px;`,
    `background:var(--white,#fff);color:var(--ink-700,#3a4256);text-transform:uppercase}`,
    `.bsf-base input:focus{outline:none;border-color:var(--sky-700,#5b7fa6)}`,
    `.bsf-fine{font-size:11px;color:var(--ink-500,#7c8398);line-height:1.45;margin:9px 0 0;max-width:60ch}`,
    `.bsf-fine a{color:var(--sky-700,#5b7fa6)}`,
    `.bsf-send{margin-left:auto;background:var(--gold-500,#e8a33d);`,
    `border-color:var(--gold-500,#e8a33d);color:#3a2a08}`,
    `.bsf-send:hover{background:#f0b256;border-color:#f0b256}`,
    `.bsf-count{font-size:11px;color:var(--ink-500,#7c8398);font-variant-numeric:tabular-nums}`,
    `.bsf-count.is-over{color:#a6402f;font-weight:700}`,

    // The card grid collapses to one column at 640px (card-render.js:29) but
    // its padding does not change, so the strip's margins must not either.
    `@media(max-width:640px){`,
    `.bsf-row{padding:10px 16px 10px 22px}`,
    `.bsf-form{padding:12px 16px 14px 22px}`,
    `.bsf-actions{margin-left:0;width:100%}`,
    `.bsf-send{margin-left:auto}`,
    `}`,
  ].join('');
  document.head.appendChild(style);
}

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Which of the six states a card is in, derived purely from the stored answer.
 *
 * A just-submitted answer is shown as delivered even though it is still in
 * flight — that is deliberate optimism, and it is honest because a failure to
 * deliver is recoverable and will surface on the next attempt. Only an answer
 * that has already failed at least once is described to the reader as queued.
 */
export function viewState(answer) {
  if (!answer || answer.verdict === 'withdrawn') return 'idle';
  if (answer.status === FAILED) return 'failed';
  if (answer.status === PENDING && answer.attempts > 0) return 'queued';
  if (answer.status === SYNCED || answer.status === PENDING) return 'done';
  return 'idle';
}

/**
 * Builds the strip's inner HTML for a card.
 *
 * `open` is transient UI state held by the caller rather than persisted: a
 * half-typed note that survives a page reload is a nasty surprise, and the
 * React re-render this layer has to tolerate is frequent enough that we repaint
 * from scratch constantly.
 */
export function stripHtml({ answer, open, base, editing, verdict, draft }) {
  const state = viewState(answer);
  const showChooser = state === 'idle' || editing;

  return showChooser
    ? chooser({ verdict, draft, base, canCancel: editing && state !== 'idle' })
    : resolved(answer, state);
}

/**
 * `verdict` is the in-progress choice, which is NOT the same as the stored
 * answer: tapping "Not really" selects it and opens the form, but nothing is
 * recorded until Send. Reading the selection off the saved answer instead would
 * leave the button the reader just pressed looking unpressed.
 */
function chooser({ verdict, draft, base, canCancel }) {
  const noteValue = draft ?? '';

  return (
    `<div class="bsf-row">` +
    `<span class="bsf-label" id="bsf-q">Was this clear?</span>` +
    `<button type="button" class="bsf-btn" data-bsf="clear" ` +
    `aria-pressed="${verdict === 'clear'}" aria-describedby="bsf-q">Yes</button>` +
    `<button type="button" class="bsf-btn" data-bsf="unclear" ` +
    `aria-pressed="${verdict === 'unclear'}" aria-describedby="bsf-q">Not really</button>` +
    // Only offered when there is a saved answer to fall back to. On a card
    // that has never been answered, "Cancel" would just be a second name for
    // leaving it alone.
    (canCancel
      ? `<span class="bsf-actions"><button type="button" class="bsf-link" data-bsf="cancel">Cancel</button></span>`
      : '') +
    `</div>` +
    `<div class="bsf-form">` +
    `<label class="bsf-label" for="bsf-note" style="display:block;margin-bottom:6px">` +
    `What tripped you up?</label>` +
    `<textarea id="bsf-note" data-bsf="note" maxlength="${LIMITS.note}" ` +
    `placeholder="Optional — what's wrong, unclear, or missing?"></textarea>` +
    `<div class="bsf-foot">` +
    `<label class="bsf-base">Base <input type="text" data-bsf="base" maxlength="${LIMITS.base}" ` +
    `value="${esc(base)}" placeholder="CLT" autocomplete="off" aria-label="Your base (optional)"></label>` +
    `<span class="bsf-count" data-bsf="count"></span>` +
    `<button type="button" class="bsf-btn bsf-send" data-bsf="send">Send</button>` +
    `</div>` +
    // On its own line rather than wedged between the base field and Send. At
    // 34ch between two controls it wrapped mid-link, which made the one piece
    // of text a reader most needs to trust look like an afterthought.
    `<p class="bsf-fine">Anonymous — we don't collect your name. ` +
    `<a href="${PRIVACY_URL}">What we store</a></p>` +
    `</div>` +
    `<span data-bsf="draft" hidden>${esc(noteValue)}</span>`
  );
}

function resolved(answer, state) {
  const line = {
    done:
      answer.verdict === 'clear'
        ? `Thanks — noted.`
        : `Thanks — we'll read this.`,
    queued: `Saved — we'll send it when you're back online.`,
    failed: `Couldn't send that.`,
  }[state];

  // A retry arrow rather than a clock or a bare circle: the queued state is not
  // "waiting for a while", it is "we will send this again by ourselves". The
  // reader has nothing to do, and the glyph should not imply otherwise.
  const mark = { done: '&#10003;', queued: '&#8635;', failed: '&#9888;' }[state];

  return (
    `<div class="bsf-row">` +
    `<span class="bsf-said" role="status">${mark} ${line}</span>` +
    `<span class="bsf-actions">` +
    (state === 'failed'
      ? `<button type="button" class="bsf-link" data-bsf="retry">Try again</button>` +
        `<span class="bsf-sep">&middot;</span>`
      : '') +
    `<button type="button" class="bsf-link" data-bsf="change">Change</button>` +
    `<span class="bsf-sep">&middot;</span>` +
    `<button type="button" class="bsf-link" data-bsf="undo">Undo</button>` +
    `</span></div>`
  );
}

/** Applies the transient bits the HTML string cannot carry safely. */
export function hydrate(strip, { open }) {
  strip.classList.toggle('is-open', !!open);

  const textarea = strip.querySelector('[data-bsf="note"]');
  const draft = strip.querySelector('[data-bsf="draft"]');
  if (textarea && draft) {
    // Set as a property, never as markup — a note is arbitrary reader text.
    textarea.value = draft.textContent ?? '';
    paintCount(strip);
  }
}

export function paintCount(strip) {
  const textarea = strip.querySelector('[data-bsf="note"]');
  const count = strip.querySelector('[data-bsf="count"]');
  if (!textarea || !count) return;
  const left = LIMITS.note - textarea.value.length;
  // Silent until it matters — a character counter on an optional field is
  // noise right up until you are about to lose a sentence.
  count.textContent = left <= 120 ? `${left} left` : '';
  count.classList.toggle('is-over', left <= 0);
}

export { STRIP };
