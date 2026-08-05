/* ============================================================
   Long-form field guides — shared shape
   ------------------------------------------------------------
   The export shipped three multi-sheet reference documents
   (Reserve, Commuting, CBA Field Manual) as standalone HTML
   templates. This models their structure so the content lives as
   data and can render to both a web page and a printable sheet.

   **double asterisks** mark what were inline <b> tags.
   ============================================================ */

/**
 * A section's identity colour. Each guide sheet in the export opened on a
 * coloured band, and the same colour carried through that section's bullets,
 * numerals and badges. The export picked band and badge colours per sheet by
 * hand — eleven distinct pairings across the four documents — so this collapses
 * them to six named accents that each fix band, badge, eyebrow and mark
 * together. The band colour a reader actually perceives is preserved; what's
 * dropped is the ad-hoc second colour.
 */
export type GuideAccent = 'navy' | 'slate' | 'red' | 'sky' | 'gold' | 'green';

/** A bulleted reference block — the workhorse of every guide. */
export interface ListBlock {
  kind: 'list';
  title: string;
  /** CBA citation shown beside the title, e.g. "§9.D". */
  ref?: string;
  lead?: string;
  items: string[];
}

/**
 * A highlighted warning or clarification.
 *
 * Tones are the export's four callout colours. `alert` is red — the export made
 * it the *unmodified* `.fm-note`, so a note carrying no tone in the source
 * document is an alert here, not an aside.
 */
export interface NoteBlock {
  kind: 'note';
  text: string;
  tone?: 'alert' | 'tip' | 'ok' | 'caution';
  /** Overrides the tone's default glyph, e.g. "ph-printer" on a print note. */
  icon?: string;
}

/**
 * Numbered sequence, e.g. "what happens when they call you".
 *
 * A step carrying an `icon` renders that in place of its numeral — the export
 * used icon rows for sequences that are a standing checklist rather than a
 * strict 1-2-3 (the Commuter Program's five responsibilities). The list stays
 * an <ol> either way: the order is still the order to work in.
 */
export interface StepsBlock {
  kind: 'steps';
  title: string;
  ref?: string;
  lead?: string;
  steps: { label: string; body: string; icon?: string }[];
}

/**
 * Icon-badge rows — the export's ListRow component: a circular icon badge, a
 * bold title, and one line of detail. Used where a table's grid would be noise
 * because there are only a handful of rows and the left column is a label
 * rather than a key to look up.
 */
export interface RowsBlock {
  kind: 'rows';
  title?: string;
  ref?: string;
  lead?: string;
  rows: { icon: string; accent: GuideAccent; title: string; body: string }[];
}

/** Two-column reference table, e.g. the quick cheat sheet. */
export interface TableBlock {
  kind: 'table';
  title: string;
  ref?: string;
  lead?: string;
  head: [string, string];
  rows: [string, string][];
}

/** A standalone paragraph. */
export interface ProseBlock {
  kind: 'prose';
  title?: string;
  ref?: string;
  text: string;
}

/** A single big number with a caption, e.g. "14 hours maximum". */
export interface StatBlock {
  kind: 'stat';
  value: string;
  unit: string;
  caption: string;
}

/** Grouped tick-boxes, e.g. the commuting day-of checklist. */
export interface ChecklistBlock {
  kind: 'checklist';
  groups: {
    /** Group number shown in the marker, e.g. "1" or "!". */
    marker: string;
    title: string;
    /** Right-aligned qualifier, e.g. "Before you leave". */
    when?: string;
    /** Set for the "if it goes wrong" group so it reads as a warning. */
    alert?: boolean;
    items: string[];
  }[];
}

export type GuideBlock =
  | ListBlock
  | NoteBlock
  | StepsBlock
  | RowsBlock
  | TableBlock
  | ProseBlock
  | StatBlock
  | ChecklistBlock;

export interface GuideSection {
  title: string;
  /**
   * Shown in the band's badge, e.g. "7" or "LOA 2022". The badge sizes itself
   * from the string's length, so anything up to a short two-word tag works.
   */
  ref?: string;
  /** Eyebrow line above the band title. */
  refLabel?: string;
  /** Band colour, and the accent for this section's bullets and numerals. */
  accent: GuideAccent;
  /** Badge glyph for sections with no `ref` number to show. */
  icon?: string;
  lead?: string;
  blocks: GuideBlock[];
}

export interface Guide {
  /** Print-artifact segment under /print/. Web routes live under their section. */
  slug: string;
  title: string;
  eyebrow: string;
  /** Sits under the title on the masthead. */
  subtitle: string;
  intro: string;
  /** Provenance the export printed on the cover. */
  meta: {
    translates?: string;
    revised?: string;
  };
  /** "What's Inside" contents list. */
  contents: { label: string; ref?: string }[];
  sections: GuideSection[];
}
