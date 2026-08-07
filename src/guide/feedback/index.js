/**
 * Boot for the reader-feedback layer.
 *
 * SURVIVING THE HOST DOCUMENT
 * The vote guide renders its cards by writing an HTML string into a React
 * `dangerouslySetInnerHTML` wrapper (index.html:1138 -> :1143, bound at :379).
 * Every "Viewing as" and "Short / Full" toggle calls setState, which rebuilds
 * that string and replaces the entire card DOM — destroying anything injected
 * into a card. The document's only extension point is a global it calls after
 * mount and after every update (index.html:774, :779):
 *
 *     try { window.__applyReview && window.__applyReview(); } catch (e) {}
 *
 * So this file claims that name. The name is a leftover from the beta review
 * layer and reads oddly now, but it is the vendored document's contract: the
 * document is a design-system export that gets regenerated, and renaming the
 * hook would mean editing a file that the next export overwrites. Everything
 * here is therefore written to be re-run at any moment and to be idempotent.
 *
 * Transient UI state (is the note form open, what is half-typed in it) is held
 * in memory keyed by card, NOT in the DOM — because the DOM is not ours to keep
 * — and re-applied after each rebuild. Delivered answers live in store.js.
 */

import { documentIdFromLocation, isEmulated, isUnconfigured } from './config.js';
import * as store from './store.js';
import { STRIP, hydrate, injectCss, paintCount, stripHtml, viewState } from './ui.js';

// Gold when we're asking, calm when we're not — see hydrate()'s is-asking
// toggle below and .bsf-strip.is-asking in ui.js.

// The lab harness renders strips outside any card, so it needs the stylesheet
// even though no card ever triggers apply().

const INTRO_KEY = 'bsh-feedback-intro-dismissed';

/** Per-card UI state that must not survive a reload. */
const transient = new Map();

let documentId = null;
let blocks = new Set();

const ui = (block) => transient.get(block) ?? { open: false, editing: false, draft: '' };
const setUi = (block, patch) => transient.set(block, { ...ui(block), ...patch });

/**
 * The cards this layer is allowed to attach to.
 *
 * Guarding on the data rather than on the selector alone matters: the document
 * also renders `data-card-id` elements for content that is not a reviewable
 * claim, and attaching a "was this clear?" prompt to those would be asking
 * about something we are not tracking.
 */
function knownBlocks() {
  // A statically rendered page can state the eligible ids directly, which is
  // the same guarantee for a fraction of the payload: the full assessment is
  // ~167KB of prose and numbers, and this needs a list of ids. A page that
  // does not declare them falls back to reading the global, so the documents
  // that ship the whole object keep working unchanged.
  const declared = document.getElementById('bsf-blocks');
  if (declared) {
    try {
      const ids = JSON.parse(declared.textContent || '[]');
      if (Array.isArray(ids)) return new Set(ids.filter((id) => typeof id === 'string' && id));
    } catch {
      // Fall through to the global rather than leaving every card unanswerable.
    }
  }

  const assessment = window.ASSESSMENT;
  if (!assessment) return new Set();
  const ids = [];
  for (const topic of assessment.topics ?? []) {
    for (const change of topic.changes ?? []) if (change.id) ids.push(change.id);
  }
  for (const card of assessment.marketCards ?? []) if (card.id) ids.push(card.id);
  return new Set(ids);
}

/**
 * Attaches a strip to every eligible card that lacks one, and repaints the rest.
 * Called on boot, after every host re-render, and on every store change.
 */
function apply() {
  if (!documentId) return;
  injectCss();

  for (const card of document.querySelectorAll('[data-card-id]')) {
    const block = card.getAttribute('data-card-id');
    if (!blocks.has(block)) continue;

    // Isolated per card. This loop decorates 46 cards, and an exception part
    // way through used to leave every card after it with no strip at all —
    // a whole-feature outage caused by one card's data. Fail one, keep 45.
    try {
      let strip = card.querySelector(`:scope > .${STRIP}`);
      if (!strip) {
        strip = document.createElement('div');
        strip.className = STRIP;
        strip.setAttribute('data-bsf-for', block);
        card.appendChild(strip);
      }
      paint(strip, block);
    } catch (error) {
      console.error('[feedback] could not attach to card', block, error);
    }
  }
}

function paint(strip, block) {
  const answer = store.answerFor(block);
  const { open, editing, draft, verdict, base } = ui(block);

  // The in-progress choice wins over the stored one: while the form is open,
  // the strip shows what the reader is about to send, not what they sent last
  // time. A draft being typed outlives the host's re-render even though its DOM
  // does not — without that, changing the lens mid-sentence eats the note.
  strip.innerHTML = stripHtml({
    answer,
    open,
    editing,
    verdict: verdict ?? answer?.verdict ?? null,
    draft: draft || (editing ? (answer?.note ?? '') : ''),
    // A base typed but not yet sent is transient state like the draft. Reading
    // only the remembered value meant a lens toggle wiped what was in the box.
    base: base ?? store.rememberedBase(),
    durable: store.isDurable(),
    block,
  });

  const state = viewState(answer);
  hydrate(strip, { open, asking: state === 'idle' || editing });
}

function repaintOne(block) {
  const strip = document.querySelector(`.${STRIP}[data-bsf-for="${CSS.escape(block)}"]`);
  if (strip) paint(strip, block);
}

// ---------------------------------------------------------------- interactions

const onClick = (event) => {
  const control = event.target.closest('[data-bsf]');
  if (!control) return;
  const strip = control.closest(`.${STRIP}`);
  if (!strip) return;

  const block = strip.getAttribute('data-bsf-for');
  const action = control.getAttribute('data-bsf');

  switch (action) {
    case 'clear': {
      if (ui(block).editing) {
        // The form is already open — the reader is switching their answer, not
        // finishing. Record the choice and let them still write a note.
        setUi(block, { verdict: 'clear' });
        repaintOne(block);
        break;
      }
      // One tap, done. The note field stays available behind "Change" for the
      // minority who want to add something, but the common case costs nothing.
      setUi(block, { open: false, editing: false, verdict: null, draft: '', base: undefined });
      store.submit(block, { verdict: 'clear', base: store.rememberedBase() });
      break;
    }
    case 'unclear': {
      // "Not really" is a question, not an answer — open the form and wait for
      // Send, so the reader gets to say what was wrong before we record it.
      setUi(block, { open: true, editing: true, verdict: 'unclear' });
      repaintOne(block);
      strip.querySelector('[data-bsf="note"]')?.focus();
      break;
    }
    case 'send': {
      const note = strip.querySelector('[data-bsf="note"]')?.value ?? '';
      const base = strip.querySelector('[data-bsf="base"]')?.value ?? '';
      const chosen = ui(block).verdict ?? store.answerFor(block)?.verdict ?? 'unclear';
      setUi(block, { open: false, editing: false, verdict: null, draft: '', base: undefined });
      store.submit(block, { verdict: chosen, note, base });
      break;
    }
    case 'change': {
      const answer = store.answerFor(block);
      setUi(block, {
        open: true,
        editing: true,
        verdict: answer?.verdict ?? null,
        draft: answer?.note ?? '',
      });
      repaintOne(block);
      strip.querySelector('[data-bsf="note"]')?.focus();
      break;
    }
    case 'cancel': {
      setUi(block, { open: false, editing: false, verdict: null, draft: '', base: undefined });
      repaintOne(block);
      break;
    }
    case 'undo': {
      // Deletes are closed to the public, so a retraction is a state on the
      // record rather than its absence — see firestore.rules. The strip goes
      // back to asking, and triage stops counting it.
      setUi(block, { open: false, editing: false, verdict: null, draft: '', base: undefined });
      store.submit(block, { verdict: 'withdrawn', base: store.rememberedBase() });
      break;
    }
    case 'retry': {
      // store.retry(), not store.flush(). A given-up record is not in the
      // outbox — flush() would find an empty queue and return without doing
      // anything at all, which is what this control used to do.
      store.retry(block);
      break;
    }
    default:
      break;
  }
};

const onInput = (event) => {
  const strip = event.target.closest(`.${STRIP}`);
  if (!strip) return;
  const block = strip.getAttribute('data-bsf-for');

  if (event.target.closest('[data-bsf="note"]')) {
    setUi(block, { draft: event.target.value });
    paintCount(strip);
    return;
  }
  if (event.target.closest('[data-bsf="base"]')) {
    setUi(block, { base: event.target.value });
  }
};

// Enter submits from the base field; the note is multi-line so it must not.
const onKeydown = (event) => {
  if (event.key !== 'Enter') return;
  const field = event.target.closest('[data-bsf="base"]');
  if (!field) return;
  event.preventDefault();
  field.closest(`.${STRIP}`)?.querySelector('[data-bsf="send"]')?.click();
};

// ------------------------------------------------------------------- page intro

/**
 * One quiet line telling readers the strips exist. Replaces the beta layer's
 * fixed bottom bar, which cost 66px of every mobile viewport permanently to
 * show a progress counter that only mattered to a handful of fact-checkers.
 */
function mountIntro() {
  if (document.getElementById('bsf-intro')) return;
  try {
    if (localStorage.getItem(INTRO_KEY)) return;
  } catch {
    /* storage unavailable — show it, it is only a line of text */
  }

  const topics = document.querySelector('[data-sec="topics"]');
  if (!topics) return;

  const bar = document.createElement('div');
  bar.id = 'bsf-intro';
  bar.style.cssText =
    'display:flex;align-items:center;gap:12px;margin:0 0 16px;padding:11px 16px;' +
    'background:var(--cream-100,#faf6ef);border:1.5px solid var(--cream-300,#e3dccb);' +
    'border-radius:12px;font-family:var(--font-body,sans-serif);font-size:13px;' +
    'color:var(--ink-700,#3a4256)';
  bar.innerHTML =
    `<span>Spot something wrong or unclear? Tell us at the bottom of any card.</span>` +
    `<button type="button" id="bsf-intro-x" aria-label="Dismiss" ` +
    `style="margin-left:auto;background:none;border:0;cursor:pointer;font-size:16px;` +
    `line-height:1;color:var(--ink-500,#7c8398)">&times;</button>`;

  topics.prepend(bar);
  document.getElementById('bsf-intro-x').addEventListener('click', () => {
    bar.remove();
    try {
      localStorage.setItem(INTRO_KEY, '1');
    } catch {
      /* dismissal simply will not persist */
    }
  });
}

// -------------------------------------------------------------------- boot

function boot() {
  documentId = documentIdFromLocation();
  if (!documentId) return;

  // An unconfigured production build renders nothing at all. A prompt that
  // accepts a note it can never deliver is worse than no prompt.
  if (isUnconfigured() && !isEmulated()) {
    console.error(
      '[feedback] Firebase is not configured — see src/guide/feedback/config.js. Feedback UI disabled.'
    );
    return;
  }

  blocks = knownBlocks();
  if (blocks.size === 0) return;

  store.init(documentId);
  store.subscribe(apply);

  apply();
  mountIntro();
}

/**
 * THIS FILE RUNS TWICE. Everything with a side effect is behind this guard.
 *
 * The vendored document declares its scripts inside a `<helmet>` block that
 * sits in the BODY (index.html:12-18), and the DC runtime in support.js hoists
 * that block into `<head>` while booting. The browser has already executed the
 * tag once by then, and the hoist executes it again — one network fetch, two
 * evaluations, two complete module closures.
 *
 * Unguarded, the two instances each get their own transient Map. The first
 * one's listeners win every click, while the second one owns
 * `window.__applyReview` — so opening a note form worked, and the very next
 * repaint reverted it, because the instance doing the painting had never heard
 * about the click. The note text appeared to survive while the open form did
 * not, which is a maddening thing to debug from the outside.
 *
 * The rest of this document defends against the same behaviour in its own way:
 * card-render.js:532 pins its globals with defineProperty so a second pass
 * cannot clobber them, and ds-base.js carries a `dsBaseLoaded` datalist guard.
 * This is that pattern, for this file.
 */
const GUARD = '__bsfStarted';

function start() {
  document.addEventListener('click', onClick);
  document.addEventListener('input', onInput);
  document.addEventListener('keydown', onKeydown);

  // The host calls this after mount and after every re-render. It is also our
  // own repaint path, so the two can never disagree about what a card shows.
  window.__applyReview = () => {
    apply();
    mountIntro();
  };

  // Local-only hooks, gated on the same hostname check the emulator wiring
  // uses — a production bundle exposes nothing beyond __applyReview.
  if (isEmulated()) {
    window.__bsfDebug = () => ({
      documentId,
      blocks: blocks.size,
      duplicateLoadsBlocked: window.__bsfDuplicates ?? 0,
      transientSize: transient.size,
      transient: Object.fromEntries(transient),
    });

    /**
     * Renders one strip in an arbitrary state, for /_feedback-lab.html.
     *
     * Deliberately routed through the same stripHtml + hydrate the live code
     * uses, rather than letting the harness hand-write markup. A harness that
     * draws its own approximation of the component stops catching the bugs it
     * was built to catch the first time the real one changes.
     */
    window.__bsfRenderCase = (strip, { answer = null, open = false, editing = false, verdict = null, draft = '', base = '' } = {}) => {
      injectCss();
      strip.innerHTML = stripHtml({ answer, open, editing, verdict, draft, base });
      const state = viewState(answer);
      hydrate(strip, { open, asking: state === 'idle' || editing });
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
}

if (window[GUARD]) {
  // Counted rather than ignored: if a future export stops double-executing,
  // this drops to 0 and the guard becomes dead weight worth removing.
  window.__bsfDuplicates = (window.__bsfDuplicates ?? 0) + 1;
} else {
  window[GUARD] = true;
  start();
}

export { viewState };
