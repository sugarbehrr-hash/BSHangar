import { NAV } from '../data/site';

/* ============================================================
   Breadcrumb derivation — for structured data only
   ------------------------------------------------------------
   The visible trail was removed in the hub redesign: the site is
   flat enough that the header nav's aria-current already answers
   "where am I", and on Discounts the trail sat between the base
   tabs and the filter pills, splitting two controls that belong
   together. StructuredData still emits BreadcrumbList from this,
   so search engines keep the hierarchy.
   ============================================================ */

export interface Crumb {
  label: string;
  href: string;
}

/** Labels for segments that are not nav sections. */
const SEGMENT_LABELS: Record<string, string> = {
  print: 'Printable Guides',
};

/** Every label the nav tree already knows, keyed by full path. */
const NAV_LABELS: Record<string, string> = Object.fromEntries(
  NAV.map((item) => [item.href, item.label])
);

/**
 * Build the crumb trail for a path, ending with the current page.
 *
 * Labels resolve in order: the nav tree, the
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
