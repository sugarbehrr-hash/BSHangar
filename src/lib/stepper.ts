/* ============================================================
   Accordion stepper
   ------------------------------------------------------------
   One step open at a time. Finishing a step opens the next one;
   a finished step collapses to a one-line summary of what it
   decided, and any header reopens it.

   The estimator's five cards stacked to 2,840px on a phone —
   three and a half screens of scrolling to fill in a form whose
   answer sits at the bottom. Collapsed, the same five steps are
   under 400px, so the whole tool is visible at once.

   This owns ONLY which step is open and what each one summarises.
   It never touches the figures: the page remains the single owner
   of the numbers, and hands this a string when a step is done.
   ============================================================ */

export interface Step {
  index: number;
  root: HTMLElement;
  head: HTMLButtonElement;
  body: HTMLElement;
  resume: HTMLElement | null;
  badge: HTMLElement | null;
}

export interface Stepper {
  steps: Step[];
  /** Open one step and collapse the rest. */
  open(index: number): void;
  /** Collapse everything — used when the last step finishes. */
  closeAll(): void;
  /** Mark done, write its summary, and advance to the next unfinished step. */
  complete(index: number, resume: string): void;
  /** Re-write a finished step's summary without changing what is open. */
  setResume(index: number, resume: string): void;
  isDone(index: number): boolean;
}

/**
 * Wire up every `[data-step]` inside `root`.
 *
 * Opening a step ALWAYS brings it to the top, however it was opened. Tapping a
 * header near the bottom of the screen otherwise expands a tall body — the
 * calendar especially — entirely below the fold, so the reader is looking at
 * the step they just left. `.step` carries a scroll-margin-top for the sticky
 * topbar, so "the top" means under the header rather than behind it.
 */
export function createStepper(root: HTMLElement): Stepper {
  const steps: Step[] = [...root.querySelectorAll<HTMLElement>('[data-step]')]
    .map((el) => {
      const head = el.querySelector<HTMLButtonElement>('.step-head');
      const body = el.querySelector<HTMLElement>('.step-body');
      if (!head || !body) return null;
      return {
        index: Number(el.dataset.step),
        root: el,
        head,
        body,
        resume: el.querySelector<HTMLElement>('[data-resume]'),
        badge: el.querySelector<HTMLElement>('.step-badge'),
      };
    })
    .filter((s): s is Step => s !== null)
    .sort((a, b) => a.index - b.index);

  const find = (index: number) => steps.find((s) => s.index === index) ?? null;

  function paint(openIndex: number | null) {
    for (const step of steps) {
      const isOpen = step.index === openIndex;
      step.root.classList.toggle('open', isOpen);
      step.head.setAttribute('aria-expanded', String(isOpen));
    }
  }

  function open(index: number) {
    paint(index);
    const step = find(index);
    if (!step) return;

    // paint() has just changed which bodies are displayed, so the step's final
    // position is not known until the browser has laid out again. Scrolling in
    // the same frame aims at where the step WAS — which, with the step above
    // it collapsing, is further down the page than where it ends up.
    requestAnimationFrame(() => {
      step.root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function closeAll() {
    paint(null);
  }

  function setResume(index: number, resume: string) {
    const step = find(index);
    if (step?.resume) step.resume.textContent = resume;
  }

  function complete(index: number, resume: string) {
    const step = find(index);
    if (!step) return;

    step.root.classList.add('done');
    setResume(index, resume);
    // The number has served its purpose once the step is answered.
    if (step.badge) step.badge.innerHTML = '<i class="ph-fill ph-check" aria-hidden="true"></i>';

    const next = steps.find((s) => s.index > index && !s.root.classList.contains('done'));
    if (next) open(next.index);
    else closeAll();
  }

  for (const step of steps) {
    step.head.addEventListener('click', () => {
      const isOpen = step.root.classList.contains('open');
      if (isOpen) closeAll();
      else open(step.index);
    });
  }

  return {
    steps,
    open,
    closeAll,
    complete,
    setResume,
    isDone: (index) => find(index)?.root.classList.contains('done') ?? false,
  };
}
