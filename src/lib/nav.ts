/**
 * Shared primary-nav "current page" rule.
 *
 * Used by both the desktop nav (SiteHeader) and the mobile tab bar / More
 * sheet (MobileNav) so the two chrome layers can never disagree about which
 * section a page belongs to.
 */

/** A nav item is current if it matches exactly, or owns the section. */
export function isCurrentSection(path: string, href: string): boolean {
  if (href === '/') return path === '/';
  // Discounts points at a base, so match the section it belongs to rather
  // than that one page — otherwise DCA/DFW/PHL leave the nav unlit.
  const section = href.startsWith('/crew-discounts/') ? '/crew-discounts/' : href;
  return path === href || path.startsWith(section);
}
