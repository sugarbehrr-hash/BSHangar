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
 * Markdown report needed a whole escaping layer for exactly this reason — DOM
 * text nodes make notes safe to show exactly as written.
 *
 * The one exception is the card body itself: it comes from
 * cardData.renderCardHtml(), which is window.VoteCard.changeCard() /
 * marketDetailCard() — the guide's OWN renderer, injected verbatim via
 * innerHTML. That HTML is ours (assessment.data.js), not reader-supplied, and
 * re-implementing it here would be a second copy that silently drifts from
 * what the guide actually shows.
 *
 * Left to right, matching the workflow: pick a card in the nav (column 1),
 * read what it actually says (column 2), see how many people struggled and
 * read why (column 3). Each column scrolls independently.
 */

import { BURST_ALERT, groupByBlock, rank, share, splitByDrift } from './report.js';
import { renderCardHtml } from './cardData.js';

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

/** A card needs Cole's attention if the ratio says so, even with every note handled. */
function outstanding(entry) {
  return entry.unclear > 0 || entry.notes.some((n) => n.status !== 'triaged');
}

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

// --------------------------------------------------------------- the navigator

function renderNavHead({ filter, section, sectionCounts, waiting }) {
  const head = el('div', 'nav-head');

  const seg = el('div', 'seg');
  for (const [value, label] of [['attention', 'Needs attention'], ['all', 'All']]) {
    const suffix = value === 'attention' ? (waiting ? ` (${waiting})` : '') : '';
    const b = button(`${label}${suffix}`, 'filter', { className: '', data: { value } });
    b.setAttribute('aria-pressed', String(filter === value));
    seg.append(b);
  }
  head.append(seg);

  const pick = el('div', 'sectionpick');
  const select = el('select');
  select.dataset.ib = 'section';
  for (const { key, label, count } of sectionCounts) {
    const opt = el('option', null, count ? `${label} (${count})` : label);
    opt.value = key;
    if (section === key) opt.selected = true;
    select.append(opt);
  }
  pick.append(select);
  head.append(pick);

  return head;
}

function statPill(text, tone) {
  return el('span', `stat-pill ${tone}`, text);
}

function rowBadges(entry) {
  const badges = [];
  if (entry.unclear > 0) badges.push(statPill(`${entry.unclear} unclear`, 'warn'));
  const open = entry.notes.filter((n) => n.status !== 'triaged').length;
  if (open) badges.push(statPill(plural(open, 'note'), 'warn'));
  if (entry.clear > 0) badges.push(statPill(`${entry.clear} clear`, entry.unclear === 0 ? 'good' : 'quiet'));
  return badges;
}

function navRow(entry, selected) {
  const settled = !outstanding(entry);
  const row = button(null, 'select', { className: settled ? 'row settled' : 'row', data: { block: entry.block } });
  row.setAttribute('aria-current', String(selected === entry.block));
  row.append(el('div', 'row-title', entry.title));
  const badges = el('div', 'row-badges');
  badges.append(...rowBadges(entry));
  row.append(badges);
  return row;
}

function driftRow(driftCount, selected) {
  const row = button(null, 'select', { className: 'row settled', data: { block: 'drift' } });
  row.setAttribute('aria-current', String(selected === 'drift'));
  row.append(
    el('div', 'row-title', "About text we've since rewritten"),
    (() => {
      const badges = el('div', 'row-badges');
      badges.append(statPill(plural(driftCount, 'response'), 'quiet'));
      return badges;
    })()
  );
  return row;
}

/**
 * Groups already-scoped entries under their real topic headings, in the same
 * order the guide's own topics appear — "the document," not an arbitrary
 * sort. Skipped when a single section is already selected: the heading would
 * just repeat what the dropdown already says.
 */
function groupedByTopic(entries, topics) {
  const buckets = new Map(topics.map((t) => [t, []]));
  for (const entry of entries) {
    if (!buckets.has(entry.topic)) buckets.set(entry.topic, []);
    buckets.get(entry.topic).push(entry);
  }
  return [...buckets.entries()].filter(([, list]) => list.length);
}

function renderList({ entries, topics, section, filter, selected, drift }) {
  const scroll = el('div', 'nav-scroll');
  const shown = filter === 'attention' ? entries.filter(outstanding) : entries;

  if (!shown.length && filter === 'attention') {
    scroll.append(el('div', 'empty-list', 'Nothing needs attention here. Switch to "All" to browse every card.'));
    return scroll;
  }

  if (section === 'all') {
    for (const [topic, list] of groupedByTopic(shown, topics)) {
      scroll.append(el('p', 'group-head', topic));
      for (const entry of rank(list)) scroll.append(navRow(entry, selected));
    }
  } else {
    for (const entry of rank(shown)) scroll.append(navRow(entry, selected));
  }

  if (section === 'all' && filter === 'all' && drift.length) {
    scroll.append(el('p', 'group-head', 'Older content'));
    scroll.append(driftRow(drift.length, selected));
  }

  return scroll;
}

// ---------------------------------------------------------------- the workspace

/**
 * The headline, made obvious rather than buried in a sentence: a big colored
 * number paired with a text label (status color is never used alone), plus a
 * compact part-to-whole bar. The bar always renders, even at 100% one way, so
 * a card's shape does not shift depending on which state it happens to be in.
 */
function statBlock(entry) {
  const answered = entry.clear + entry.unclear;

  if (answered === 0) {
    const p = el('p', 'ib-quiet');
    p.textContent = entry.withdrawn ? `${plural(entry.withdrawn, 'answer')} withdrawn, nothing kept` : 'No responses yet.';
    return p;
  }

  const allClear = entry.unclear === 0;
  const frag = document.createDocumentFragment();

  const block = el('div', 'statblock');
  block.append(el('div', `stat-num ${allClear ? 'good' : 'warn'}`, String(allClear ? entry.clear : entry.unclear)));
  const label = el('div', 'stat-label');
  label.append(
    el('strong', null, allClear ? 'said this was clear' : `of ${answered} said this wasn't clear`),
    document.createTextNode(
      allClear
        ? (answered === 1 ? 'the one person who answered' : `all ${answered} responses`)
        : `${Math.round((entry.unclear / answered) * 100)}% of responses`
    )
  );
  block.append(label);
  frag.append(block);

  const wrap = el('div', 'statbar-wrap');
  const bar = el('div', 'statbar');
  if (entry.unclear > 0) {
    const seg = el('div', 'seg-warn');
    seg.style.flex = String(entry.unclear);
    bar.append(seg);
  }
  if (entry.clear > 0) {
    const seg = el('div', 'seg-good');
    seg.style.flex = String(entry.clear);
    bar.append(seg);
  }
  wrap.append(bar);
  const scale = el('div', 'statbar-scale');
  scale.append(el('span', null, `${entry.unclear} unclear`), el('span', null, `${entry.clear} clear`));
  wrap.append(scale);
  frag.append(wrap);

  return frag;
}

function burstWarning() {
  const box = el('div', 'notice warn');
  box.append(
    icon('ph-fill ph-warning'),
    el(
      'p',
      'nt',
      'These all arrived within ten minutes of each other. That may be one person ' +
        'answering over and over, so treat this ranking as unverified.'
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
  const row = el('li', done ? 'd-note done' : 'd-note');

  row.append(el('p', 'd-note-text', note.note));

  const tags = [];
  if (note.base) tags.push(note.base);
  if (note.version && note.version !== currentVersion) tags.push('written about an older version of this card');
  if (tags.length) row.append(el('p', 'd-note-meta', tags.join(' · ')));

  const actions = el('div', 'd-note-act');
  if (done) {
    const said = el('span', 'said');
    said.append(icon('ph-fill ph-check'), document.createTextNode('Done'));
    actions.append(said, button('Undo', 'status', { className: 'link', data: { id: note.id, to: 'new' } }));
  } else {
    actions.append(button('Done', 'status', { className: 'btn quiet sm', data: { id: note.id, to: 'triaged' } }));
  }
  row.append(actions);

  return row;
}

function reviewPane(entry, currentVersion) {
  const pane = el('div', 'review-pane');
  const inner = el('div', 'review-inner');

  inner.append(statBlock(entry));
  if (entry.burst >= BURST_ALERT) inner.append(burstWarning());

  if (entry.notes.length) {
    inner.append(el('p', 'd-notes-head', 'Notes'));
    const list = el('ul', 'd-notes');
    for (const note of entry.notes) list.append(noteRow(note, currentVersion));
    inner.append(list);

    const open = entry.notes.filter((n) => n.status !== 'triaged');
    if (open.length > 1) {
      inner.append(button(`Mark all ${open.length} done`, 'alldone', { className: 'link', data: { block: entry.block } }));
    }
  } else {
    inner.append(el('p', 'no-notes', 'No notes — nothing else to review here.'));
  }

  pane.append(inner);
  return pane;
}

function backButton() {
  return button('← Back', 'back', { className: 'btn quiet sm back-btn' });
}

function docPane(entry) {
  const pane = el('div', 'doc-pane');
  const inner = el('div', 'doc-inner');
  inner.append(backButton());
  if (entry.topic) inner.append(el('p', 'd-topic', entry.topic));

  // The guide's own renderer, injected verbatim — see cardData.renderCardHtml.
  const embed = el('div', 'vc-embed');
  embed.innerHTML = renderCardHtml(entry);
  inner.append(embed);

  pane.append(inner);
  return pane;
}

/**
 * Feedback about cards the analyzer has since regenerated away.
 *
 * Kept rather than dropped: a note about text that no longer exists may be
 * answering a question that no longer exists, and folding it into a live
 * card's tally would be a lie. Kept apart, in its own workspace view, for the
 * same reason.
 */
function driftWorkspace(rows) {
  const frag = document.createDocumentFragment();

  const doc = el('div', 'doc-pane');
  const docInner = el('div', 'doc-inner');
  docInner.append(
    backButton(),
    el('h2', 'd-title', "About text we've since rewritten"),
    el('p', 'd-topic', 'Feedback about cards no longer in the guide'),
    el('p', 'ib-gate-note', 'Read these against the old wording, not the current one.')
  );
  doc.append(docInner);
  frag.append(doc);

  const review = el('div', 'review-pane');
  const reviewInner = el('div', 'review-inner');
  reviewInner.append(el('p', 'd-notes-head', 'Notes'));
  const list = el('ul', 'd-notes');
  for (const row of rows) {
    const item = el('li', 'd-note');
    item.append(el('p', 'd-note-text', row.note || `${row.verdict}, no note`), el('p', 'd-note-meta', row.block));
    list.append(item);
  }
  reviewInner.append(list);
  review.append(reviewInner);
  frag.append(review);

  return frag;
}

// -------------------------------------------------------------------- the shell

export function renderShell({ docTitle, cardIndex, topics, askable, version, rows, filter, section, selected }) {
  const shell = el('div', 'shell');

  const top = el('header', 'topbar');
  const headings = el('div');
  headings.append(el('p', 'ib-kicker', 'Reader feedback'), el('h1', 'topbar-title', docTitle));
  top.append(headings, button('Sign out', 'signout'));
  shell.append(top);

  const { live, drift } = splitByDrift(rows, cardIndex);
  const entries = groupByBlock(live).map((entry) => ({ ...entry, ...cardIndex.get(entry.block) }));
  const waiting = entries.filter(outstanding).length;

  const sectionCounts = [
    { key: 'all', label: 'All sections', count: waiting },
    ...topics.map((t) => ({
      key: t,
      label: t,
      count: entries.filter((e) => e.topic === t && outstanding(e)).length,
    })),
  ];

  const panes = el('div', 'panes');
  const nav = el('nav', 'nav-pane');
  nav.append(renderNavHead({ filter, section, sectionCounts, waiting }));

  const scoped = section === 'all' ? entries : entries.filter((e) => e.topic === section);
  nav.append(renderList({ entries: scoped, topics, section, filter, selected, drift }));
  panes.append(nav);

  const workspace = el('div', 'workspace');
  if (selected === 'drift') {
    workspace.append(driftWorkspace(drift));
  } else {
    const entry = entries.find((e) => e.block === selected);
    if (entry) {
      workspace.append(docPane(entry), reviewPane(entry, version));
    } else {
      workspace.append(el('div', 'workspace-empty', 'Select a card on the left to read it and see what people said.'));
    }
  }
  panes.append(workspace);
  shell.append(panes);

  return shell;
}
