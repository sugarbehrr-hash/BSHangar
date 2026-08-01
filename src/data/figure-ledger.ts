/* ============================================================
   Figure ledger — the shape behind FigureLedger.astro
   ------------------------------------------------------------
   Three sections now drive the same component with their own
   content: the contract hub (§ citations), the commuting hub (a
   before/after timeline) and the Roller Pro page (six numbers a
   flight attendant asks before buying a bag). The shape lives
   here rather than in any one of them, so a fourth consumer does
   not have to import another section's vocabulary to use it.

   **bold** and [label](href) are the inline markers understood by
   src/lib/rich-text.ts.
   ============================================================ */

/** One row of the ledger, plus the pane it loads. */
export interface LedgerFigure {
  /** Stable key; ties a row to its detail pane. */
  key: string;
  /** Badge glyph on this figure's detail pane. */
  icon: string;
  value: string;
  unit: string;
  label: string;
  caption: string;
  /** Chip closing the row — a citation, a timing, or a one-word flag. */
  ref: string;
  pane: {
    title: string;
    sub: string;
    paras: string[];
    /** The single "do this" line closing the pane. */
    action: string;
    /** Glyph on that line. Each pane has its own. */
    actionIcon: string;
    /** Badge colour, when this figure is the one that needs flagging. */
    accent?: string;
  };
}

/** The pane shown before any figure is chosen. */
export interface LedgerIntro {
  icon: string;
  title: string;
  sub: string;
  paras: string[];
  /**
   * The closing "do this" line and its glyph — both or neither. Optional
   * because an intro can end on the tap hint instead, which is what the
   * Roller Pro ledger does.
   */
  action?: string;
  actionIcon?: string;
}
