/* ============================================================
   Detail-panel height lock
   ------------------------------------------------------------
   The figure ledger swaps one pane for another in a fixed panel.
   Panes have different natural heights, so without this the whole
   layout jumps under the reader every time they tap a number.

   The lock measures every pane, takes the tallest, and pins that
   as a floor. Two things make it fiddly enough to deserve a file:

   1. GROW ONLY. Each pass seeds its max from the current floor, so
      a later measurement can raise it but never drop it. A pass
      that runs while a webfont is still swapping would otherwise
      shrink the panel and reintroduce the jump.
   2. THE ICON FONT LANDS LATE. Phosphor is injected by a third-
      party script and arrives AFTER document.fonts.ready resolves,
      growing any pane with a .zdo icon by ~25px. Hence the extra
      passes on load and on a timer, plus a ResizeObserver.
   ============================================================ */

/** Re-measure passes after first paint, in ms. */
const LATE_PASSES = [900];

/** Window-resize debounce. */
const RESIZE_DEBOUNCE = 160;

/**
 * Pin `panel` to the height of its tallest pane. No-ops when the panel or its
 * panes are absent, so callers don't need to guard.
 */
export function lockPanelHeight(panel: HTMLElement | null, panes: HTMLElement[]): void {
  if (!panel || panes.length === 0) return;

  /**
   * The panel is border-box, so `min-height` covers padding AND border, while
   * `scrollHeight` covers padding only. Measuring with scrollHeight therefore
   * sets a floor ~2 × border-width short and the panel still shifts a pixel or
   * two on the tallest pane. getBoundingClientRect matches what min-height
   * means, and is fractional so nothing is lost to rounding before the ceil.
   */
  const naturalHeight = (el: HTMLElement) => el.getBoundingClientRect().height;

  /** Measure every pane by showing each in turn, then restore what was open. */
  function measure(): void {
    if (!panel) return;
    const open = panes.find((pane) => !pane.hidden) ?? panes[0]!;
    const previous = panel.style.minHeight;

    // Release the floor while measuring, else every pane reads as the floor
    // and a pane that shrank could never be distinguished from one that fits.
    panel.style.minHeight = '';

    // Seed from the previous floor: grow only, never shrink.
    let tallest = parseFloat(previous) || 0;

    for (const pane of panes) {
      for (const other of panes) other.hidden = other !== pane;
      tallest = Math.max(tallest, naturalHeight(panel));
    }

    for (const pane of panes) pane.hidden = pane !== open;
    panel.style.minHeight = `${Math.ceil(tallest)}px`;
  }

  measure();

  // Webfonts change metrics; the icon font lands after this resolves.
  document.fonts?.ready.then(measure).catch(() => {});
  window.addEventListener('load', measure);
  for (const delay of LATE_PASSES) window.setTimeout(measure, delay);

  // Anything that grows a pane past the floor raises the floor.
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => {
      const floor = parseFloat(panel.style.minHeight) || 0;
      if (naturalHeight(panel) > floor + 0.5) measure();
    }).observe(panel);
  }

  // A width change invalidates every measurement — clear and start over.
  let timer: number | undefined;
  window.addEventListener('resize', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      panel.style.minHeight = '';
      measure();
    }, RESIZE_DEBOUNCE);
  });
}
