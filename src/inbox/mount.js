/**
 * Wiring: auth state in, DOM out, one write in between.
 *
 * State is replaced, never mutated, and every render is a pure function of it.
 * That is what keeps "mark this done" from drifting out of sync with what is on
 * screen — the thing that made the old parallel-array approaches in this
 * codebase leak bugs.
 *
 * Responses are NOT removed from the list when they are marked done. They go
 * quiet and keep an Undo, and only disappear on the next fetch. A row that
 * vanishes under your thumb takes its own undo button with it.
 */

import { describe, fetchResponses, setStatus, signIn, signOutNow, watchAuth } from './net.js';
import { groupByBlock, splitByDrift, summarise } from './report.js';
import { renderDenied, renderError, renderInbox, renderLoading, renderSignedOut } from './render.js';

/** Nothing here is secret — it is the guide's own card list, baked in at build. */
function readConfig() {
  const tag = document.getElementById('ib-data');
  if (!tag) throw new Error('inbox: build-time card data is missing from the page');
  return JSON.parse(tag.textContent);
}

export function mountInbox(root) {
  const config = readConfig();

  let state = { phase: 'loading', user: null, filter: 'new', rows: [], error: '' };

  const set = (patch) => {
    state = { ...state, ...patch };
    draw();
  };

  // ------------------------------------------------------------------ render

  function draw() {
    const focusKey = keyOf(document.activeElement?.closest?.('[data-ib]'));
    root.replaceChildren(view());
    if (!focusKey) return;

    for (const control of root.querySelectorAll('[data-ib]')) {
      if (keyOf(control) === focusKey) {
        control.focus();
        return;
      }
    }
  }

  function view() {
    if (state.phase === 'loading') return renderLoading();
    if (state.phase === 'signedOut') return renderSignedOut(state.error);
    if (state.phase === 'denied') return renderDenied(state.user);
    if (state.phase === 'error') return renderError(state.error);

    const { live, drift } = splitByDrift(state.rows, new Map(Object.entries(config.titles)));
    const entries = groupByBlock(live);

    return renderInbox({
      docTitle: config.title,
      entries,
      drift,
      titles: config.titles,
      summary: summarise(entries, state.rows.length),
      askable: config.askable,
      version: config.version,
      filter: state.filter,
      waiting: state.rows.filter((row) => row.status === 'new').length,
    });
  }

  /**
   * A stable name for one control, so a full re-render does not dump a keyboard
   * user back at the top of the document after every Done.
   *
   * Done and Undo on the same response share a key on purpose: they are the
   * same control in two states, and focus should stay on it across the flip.
   */
  function keyOf(control) {
    if (!control) return '';
    const { ib, id, value, block } = control.dataset;
    return `${ib}:${id ?? value ?? block ?? ''}`;
  }

  // ------------------------------------------------------------------- loading

  async function load() {
    try {
      const rows = await fetchResponses(config.doc, { unreadOnly: state.filter === 'new' });
      set({ phase: 'ready', rows, error: '' });
    } catch (error) {
      // permission-denied here means the signed-in account is not on the
      // allowlist in firestore.rules — which is a state with its own screen,
      // not an error. Anything else genuinely went wrong.
      if (error?.code === 'permission-denied') set({ phase: 'denied' });
      else set({ phase: 'error', error: describe(error) });
    }
  }

  /** Applies a confirmed status change to local state without refetching. */
  function applyStatus(ids, status) {
    const changed = new Set(ids);
    set({
      rows: state.rows.map((row) => (changed.has(row.id) ? { ...row, status } : row)),
      error: '',
    });
  }

  // -------------------------------------------------------------------- events

  root.addEventListener('click', async (event) => {
    const control = event.target.closest('[data-ib]');
    if (!control || control.disabled) return;

    const action = control.dataset.ib;

    if (action === 'signin') {
      control.disabled = true;
      try {
        await signIn();
      } catch (error) {
        set({ error: describe(error) });
      } finally {
        control.disabled = false;
      }
      return;
    }

    if (action === 'signout') {
      await signOutNow();
      return;
    }

    if (action === 'copyid') {
      try {
        await navigator.clipboard.writeText(control.dataset.value);
        // The button is the receipt — this site has no toast, by design.
        control.replaceChildren(document.createTextNode('Copied'));
      } catch {
        control.replaceChildren(document.createTextNode('Press and hold to copy'));
      }
      return;
    }

    if (action === 'filter') {
      if (state.filter === control.dataset.value) return;
      set({ filter: control.dataset.value, phase: 'loading' });
      await load();
      return;
    }

    if (action === 'refresh') {
      set({ phase: 'loading' });
      await load();
      return;
    }

    if (action === 'status') {
      const { id, to } = control.dataset;
      control.disabled = true;
      try {
        await setStatus(id, to);
        applyStatus([id], to);
      } catch (error) {
        control.disabled = false;
        set({ error: describe(error) });
      }
      return;
    }

    if (action === 'alldone') {
      const ids = state.rows
        .filter((row) => row.block === control.dataset.block && row.status === 'new' && row.note)
        .map((row) => row.id);
      control.disabled = true;
      try {
        await Promise.all(ids.map((id) => setStatus(id, 'triaged')));
        applyStatus(ids, 'triaged');
      } catch (error) {
        control.disabled = false;
        // Some may have landed. Refetch rather than guess which.
        set({ error: describe(error) });
        await load();
      }
    }
  });

  // --------------------------------------------------------------------- boot

  watchAuth(async (user) => {
    if (!user) {
      set({ phase: 'signedOut', user: null, rows: [] });
      return;
    }
    set({ phase: 'loading', user });
    await load();
  });
}
