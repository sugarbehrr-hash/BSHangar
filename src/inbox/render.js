/**
 * The inbox, as DOM.
 *
 * Every builder here returns a detached element and reads nothing but its
 * arguments, so what is on screen is always a function of the state object in
 * mount.js and never of some earlier render that half-updated itself.
 *
 * Reader text goes in through textContent, never innerHTML. That is not
 * belt-and-braces: every note, base and version string in this file was typed
 * by an anonymous member of the public into a box on a public page. The old
 * Markdown report needed a whole escaping layer for exactly this reason
 * (mdText, mdCode, flatten) — rendering to DOM instead means the escaping layer
 * is the platform's, and notes can finally be shown exactly as written.
 */

import { BURST_ALERT, rank, share } from './report.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Takes the full class pair as a LITERAL string, never assembled from parts.
 *
 * scripts/gen-icons.mjs builds the icon subset by scanning source for literal
 * `ph-<weight> ph-<name>` pairs. A template literal is invisible to it, the
 * mask never gets emitted, and the element falls back to the base rule —
 * `background-color: currentColor` with nothing masking it, which paints a
 * solid coloured square. Keep these spelled out.
 */
function icon(classes) {
  const i = document.createElement('i');
  i.className = classes;
  i.setAttribute('aria-hidden', 'true');
  return i;
}

function button(label, action, { className = 'btn quiet sm', data = {} } = {}) {
  const b = el('button', className, label);
  b.type = 'button';
  b.dataset.ib = action;
  for (const [key, value] of Object.entries(data)) b.dataset[key] = value;
  return b;
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// ----------------------------------------------------------------- the gates

function gate(titleText) {
  const section = el('section', 'ib-gate');
  section.append(el('p', 'ib-kicker', 'Blue Streak Hangar'), el('h1', 'ib-gate-title', titleText));
  return section;
}

export function renderLoading() {
  const section = gate('Reader feedback');
  section.append(el('p', 'ib-gate-note', 'Checking your sign-in…'));
  return section;
}

export function renderSignedOut(error) {
  const section = gate('Reader feedback');
  section.append(
    el('p', 'ib-gate-note', 'What people told us about the vote guide. Private — maintainers only.'),
    button('Continue with Google', 'signin', { className: 'btn navy' })
  );
  if (error) section.append(el('p', 'ib-gate-error', error));
  return section;
}

/**
 * Signed in, but not on the allowlist in firestore.rules.
 *
 * Without this state a wrong Google account is indistinguishable from a broken
 * page. The sign-in ID is here because it is the one thing that cannot be
 * guessed from outside: it is what lets a maintainer whose email should stay
 * out of a public repo be allowlisted by uid instead.
 */
export function renderDenied(user) {
  const section = gate('Not this account');

  const note = el('p', 'ib-gate-note');
  note.append(document.createTextNode("You're signed in as "), el('strong', null, user.email ?? 'an unknown account'));
  note.append(document.createTextNode(", which isn't on the list."));
  section.append(note);

  const idbox = el('div', 'ib-idbox');
  idbox.append(el('span', 'ib-idlabel', 'Sign-in ID'), el('code', 'ib-id', user.uid));
  const copy = button('Copy', 'copyid', { data: { value: user.uid } });
  copy.prepend(icon('ph-fill ph-copy'));
  idbox.append(copy);

  section.append(idbox, button('Use a different account', 'signout', { className: 'btn navy' }));
  return section;
}

export function renderError(message) {
  const section = gate('Something went wrong');
  section.append(el('p', 'ib-gate-note', message), button('Try again', 'refresh', { className: 'btn navy' }));
  return section;
}

// ------------------------------------------------------------------ the list

/**
 * The headline number, in words rather than a percentage.
 *
 * "9 of 14 said this wasn't clear" is a fact Cole can act on. "64% unclear" is
 * the same fact wearing a lab coat, and it hides the sample size — which is the
 * part that decides whether it is worth a rewrite.
 */
function verdictLine(entry) {
  const answered = entry.clear + entry.unclear;
  const line = el('p', 'ib-verdict');

  if (answered === 0) {
    line.append(el('span', 'ib-quiet', `${plural(entry.withdrawn, 'answer')} withdrawn, nothing kept`));
    return line;
  }

  if (entry.unclear === 0) {
    line.append(
      el('strong', null, answered === 1 ? 'The one person who answered' : `All ${answered}`),
      document.createTextNode(' said this was clear')
    );
    return line;
  }

  line.append(
    el('strong', null, `${entry.unclear} of ${answered}`),
    document.createTextNode(" said this wasn't clear"),
    el('span', 'ib-quiet', ` · ${Math.round(share(entry) * 100)}%`)
  );
  return line;
}

function burstWarning(entry) {
  const box = el('div', 'notice warn');
  box.append(
    icon('ph-fill ph-warning'),
    el(
      'p',
      'nt',
      'These all arrived within ten minutes of each other. That may be one person ' +
        'answering over and over, so treat the ranking on this card as unverified.'
    )
  );
  return box;
}

/**
 * One response with a note on it.
 *
 * Done and Undo are the same one-field write in two directions, so the row does
 * not disappear when it is handled — it goes quiet and keeps its way back. That
 * also means the site needs no toast for this: the row itself is the receipt,
 * which is the pattern MobileNav and the guide's feedback strip already use.
 */
function noteRow(note, currentVersion) {
  const done = note.status === 'triaged';
  const row = el('li', done ? 'ib-note is-done' : 'ib-note');

  row.append(el('p', 'ib-note-text', note.note));

  const tags = [];
  if (note.base) tags.push(note.base);
  if (note.version && note.version !== currentVersion) tags.push('written about an older version of this card');
  if (tags.length) row.append(el('p', 'ib-note-meta', tags.join(' · ')));

  const actions = el('div', 'ib-note-act');
  if (done) {
    const said = el('span', 'ib-said');
    said.append(icon('ph-fill ph-check'), document.createTextNode('Done'));
    actions.append(said, button('Undo', 'status', { className: 'ib-link', data: { id: note.id, to: 'new' } }));
  } else {
    actions.append(button('Done', 'status', { className: 'btn quiet sm', data: { id: note.id, to: 'triaged' } }));
  }
  row.append(actions);

  return row;
}

function cardItem(entry, titles, currentVersion) {
  const meta = titles[entry.block];
  // The site's card shell, not a new one — only the inbox-specific bits are ib-.
  const item = el('li', 'card ib-card');

  item.append(el('h2', 'ib-card-title', meta?.title ?? entry.block));
  if (meta?.topic) item.append(el('p', 'ib-card-topic', meta.topic));
  item.append(verdictLine(entry));

  if (entry.burst >= BURST_ALERT) item.append(burstWarning(entry));

  if (entry.notes.length) {
    const list = el('ul', 'ib-notes');
    for (const note of entry.notes) list.append(noteRow(note, currentVersion));
    item.append(list);

    const outstanding = entry.notes.filter((n) => n.status !== 'triaged');
    if (outstanding.length > 1) {
      item.append(
        button(`Mark all ${outstanding.length} done`, 'alldone', {
          className: 'ib-link ib-alldone',
          data: { block: entry.block },
        })
      );
    }
  }

  return item;
}

/**
 * Feedback about cards the analyzer has since regenerated away.
 *
 * Kept rather than dropped, and kept apart rather than folded in: a note about
 * text that no longer exists may be answering a question that no longer exists,
 * and counting it toward a live card's tally would be a lie.
 */
function driftSection(rows) {
  const section = el('section', 'ib-drift');
  section.append(
    el('h2', 'ib-drift-title', 'About text we have since rewritten'),
    el(
      'p',
      'ib-drift-note',
      `${plural(rows.length, 'response')} about cards that are no longer in the guide. ` +
        'Read them against the old wording, not the current one.'
    )
  );

  const list = el('ul', 'ib-notes');
  for (const row of rows) {
    const item = el('li', 'ib-note');
    item.append(el('p', 'ib-note-text', row.note || `${row.verdict}, no note`));
    item.append(el('p', 'ib-note-meta', row.block));
    list.append(item);
  }
  section.append(list);
  return section;
}

export function renderInbox({ docTitle, entries, drift, titles, summary, askable, version, filter, waiting }) {
  const frag = document.createDocumentFragment();

  const top = el('header', 'ib-top');
  const headings = el('div');
  headings.append(el('p', 'ib-kicker', 'Reader feedback'), el('h1', 'ib-title', docTitle));
  top.append(headings, button('Sign out', 'signout'));
  frag.append(top);

  // The two filters get the full width of a phone between them. Refresh is a
  // secondary action, so it rides on the scope line below rather than competing
  // for room with the control Cole actually uses.
  const bar = el('div', 'ib-bar pillbar');
  for (const [value, label] of [['new', 'Needs attention'], ['all', 'Everything']]) {
    const pill = button(label, 'filter', { className: 'pill', data: { value } });
    pill.setAttribute('aria-pressed', String(filter === value));
    if (value === 'new' && waiting > 0) pill.append(el('span', 'count', String(waiting)));
    bar.append(pill);
  }
  frag.append(bar);

  const scope = el('div', 'ib-scope');
  scope.append(
    el(
      'p',
      'ib-scope-text',
      [
        plural(summary.total, 'response'),
        `${summary.cards} of ${askable} cards`,
        plural(summary.notes, 'note'),
      ].join(' · ')
    )
  );
  const refresh = button('Refresh', 'refresh', { className: 'ib-link' });
  refresh.prepend(icon('ph-fill ph-arrows-clockwise'));
  scope.append(refresh);
  frag.append(scope);

  if (entries.length === 0 && drift.length === 0) {
    const empty = el('div', 'ib-empty');
    empty.append(
      el('p', 'ib-empty-title', filter === 'new' ? 'Nothing waiting.' : 'No feedback yet.'),
      el(
        'p',
        'ib-empty-note',
        filter === 'new'
          ? 'Everything that has come in has been handled. Switch to Everything to read it again.'
          : 'Nobody has answered a card on this guide yet.'
      )
    );
    frag.append(empty);
    return frag;
  }

  const list = el('ol', 'ib-list');
  for (const entry of rank(entries)) list.append(cardItem(entry, titles, version));
  frag.append(list);

  if (drift.length) frag.append(driftSection(drift));

  return frag;
}
