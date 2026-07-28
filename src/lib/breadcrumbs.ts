import { NAV } from '../data/site';

/* ============================================================
   Breadcrumb derivation — one trail, two consumers
   ------------------------------------------------------------
   The visible Breadcrumbs component and the BreadcrumbList
   JSON-LD in StructuredData both render exactly this, so what
   Google shows and what a person sees can never disagree.
   ============================================================ */

export interface Crumb {
  label: string;
  href: string;
}

/** Labels for segments that are not nav sections or nav children. */
const SEGMENT_LABELS: Record<string, string> = {
  print: 'Printable Guides',
};

/** Every label the nav tree already knows, keyed by full path. */
const NAV_LABELS: Record<string, string> = Object.fromEntries(
  NAV.flatMap((item) => [
    [item.href, item.label],
    ...(item.children ?? []).map((child) => [child.href, child.label] as const),
  ])
);

/**
 * Build the crumb trail for a path, ending with the current page.
 *
 * Labels resolve in order: the nav tree (sections and their children), the
 * static segment table, an uppercased short code (base codes like "clt"),
 * and finally — for the last crumb only — the page's own title, which
 * already names deep pages like a discount category.
 */
export function breadcrumbsFor(path: string, pageTitle: string): Crumb[] {
  const segments = path.split('/').filter(Boolean);

  const crumbs: Crumb[] = [{ label: 'Home', href: '/' }];

  segments.forEach((segment, i) => {
    const href = `/${segments.slice(0, i + 1).join('/')}/`;
    const isLast = i === segments.length - 1;

    const label =
      NAV_LABELS[href] ??
      SEGMENT_LABELS[segment] ??
      (segment.length <= 4 ? segment.toUpperCase() : isLast ? pageTitle : segment);

    crumbs.push({ label, href });
  });

  return crumbs;
}
