/* ============================================================
   Long-form field guides — shared shape
   ------------------------------------------------------------
   The export shipped three multi-sheet reference documents
   (Reserve, Commuting, CBA Field Manual) as standalone HTML
   templates. This models their structure so the content lives as
   data and can render to both a web page and a printable sheet.

   **double asterisks** mark what were inline <b> tags.
   ============================================================ */

/** A bulleted reference block — the workhorse of every guide. */
export interface ListBlock {
  kind: 'list';
  title: string;
  /** CBA citation shown beside the title, e.g. "§9.D". */
  ref?: string;
  lead?: string;
  items: string[];
}

/** A highlighted warning or clarification. */
export interface NoteBlock {
  kind: 'note';
  text: string;
  tone?: 'info' | 'warn' | 'ok';
}

/** Numbered sequence, e.g. "what happens when they call you". */
export interface StepsBlock {
  kind: 'steps';
  title: string;
  ref?: string;
  lead?: string;
  steps: { label: string; body: string }[];
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
  | TableBlock
  | ProseBlock
  | StatBlock
  | ChecklistBlock;

export interface GuideSection {
  title: string;
  /** Section band citation, e.g. "§7". */
  ref?: string;
  /** Sub-line under the band ref. */
  refLabel?: string;
  lead?: string;
  blocks: GuideBlock[];
}

export interface Guide {
  /** URL segment under /print/ and /guides/. */
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
