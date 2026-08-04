/**
 * "How to list, by airline" — one fact block that shipped in three different
 * states across the design handoff: the Commuting Guide's own copy of it, a
 * standalone reposted How-To Guide, and this site's own commuting-hub
 * situation card. The reposted document is the newest ("Reposted by popular
 * demand") and is treated as authoritative here; the older copies are
 * REPLACED rather than reproduced; otherwise the site shows two different
 * answers to "which app do I use" on two pages a few taps apart.
 *
 * Single definition, consumed by src/data/guides/commuting.ts,
 * src/data/guides/how-to.ts, and src/data/commuting-hub.ts.
 *
 * Two edits made against the handoff copy, both worth re-confirming with
 * whoever compiled it:
 *   - MyIDtravel's JetBlue entry carried "(need input)" in the source — an
 *     editorial note-to-self, not copy meant to ship. Dropped rather than
 *     published to end users; JetBlue's MyIDtravel process itself is only as
 *     confirmed as that note suggests it was.
 *   - Allegiant is listed under BOTH "Counter / Gate" and "MyIDtravel" in the
 *     source. Reproduced as given rather than guessed away — it may mean
 *     Allegiant supports both paths, or it may be a leftover from the older
 *     table that was never trimmed.
 */

export interface ListingMethod {
  method: string;
  airlines: string;
}

export const LISTING_METHODS: ListingMethod[] = [
  { method: 'List with ID90', airlines: 'Frontier · Sun Country · United · Hawaiian' },
  { method: 'At the Counter / Gate', airlines: 'Delta · Alaska · Hawaiian · Allegiant' },
  { method: 'List with MyIDtravel', airlines: 'Allegiant · JetBlue · Southwest' },
];

/** Allegiant's counter/gate row needs this caveat; it doesn't fit in the airline list itself. */
export const ALLEGIANT_COUNTER_NOTE =
  'Allegiant must call a travel number to list at the counter — or list through MyIDtravel instead.';
