# Blue Streak Hangar — Design Brief

*A prompt for a design pass. Copy everything below the line.*

---

I need help designing a coherent navigation and layout system for an information-first website. The site works, but it was built one page at a time and then assembled, and it shows. I need it to feel like one product.

## What the site is

**Blue Streak Hangar** — a reference site for PSA Airlines flight attendants, run by flight attendants. It's the web companion to a Facebook group.

**The audience and how they read.** Flight attendants, usually on a phone, often mid-commute or between legs, looking up one specific fact fast: *"How long can they schedule me?" "Do I get paid if my commute fails?" "What's open in CLT Concourse E?"* They are not browsing. They are answering a question under time pressure. The site's whole job is letting someone process information at a glance.

**What's on it:**

| Section | Content |
|---|---|
| Home | Entry point — cards into each section, plus a "new here" orientation band |
| Commuting | One long guide (~2,450 words, 7 sections) on non-rev commuting |
| Contract | A hub, plus two long guides: the CBA Field Manual (~3,450 words, 10 sections) and a Reserve Field Guide |
| Discounts | Four bases (CLT, DCA, DFW, PHL), each with categories and dozens of venues grouped by terminal |
| Essentials | ~9 recommended products |
| Tools | A paycheck estimator (a real multi-step calculator), with more tools planned |

There are also printable versions of every guide, and a separate contract-vote assessment that isn't integrated yet.

**Stack:** Astro, static, hand-written CSS with a design-token file. No framework, no CSS-in-JS. The site is currently behind a pre-launch curtain — nothing is public yet, so **nothing needs to stay backward compatible.** Breaking changes are fine and preferred over shims.

## Problem 1: There is no in-page navigation system

This is the big one. Once you're inside a page, every page answers *"where am I, what else is here, where do I go next"* differently — or doesn't answer it at all. Concretely:

**There are three separate pill/tab components that look almost the same but aren't:**

| Component | Where | Padding | Active state |
|---|---|---|---|
| `.tab` | Base switcher on discount pages | 12px 20px | navy |
| `.cattab` | Category switcher on discount pages, *and* section tabs on contract pages | 10px 16px | **red** |
| `.tooltabs button` | Tool switcher on the Tools page | 11px 18px | navy |

**And five different "this one is selected" treatments** across the site, split between red and navy with no rule behind which is which.

The worst case: on a discount base page, two of these stack directly on top of each other — base pills (active = navy) sitting immediately above category pills (active = red). Same visual language, two different meanings for color, six inches apart. A user cannot learn what "selected" looks like here because it isn't one thing.

**Long pages are inconsistent too.** The three long guides have a sticky "On this page" table of contents. No other long page has one — including the discounts pages, which are the longest and most scan-heavy content on the site. There's no rule for when a page gets in-page navigation.

**Section headers are inconsistent.** A "kicker + headline + intro paragraph" pattern exists and is used on 3 of 8 pages. The others just start.

**What I want:** one navigation system, defined once, that scales across all of it — a single answer for switching between siblings (bases, categories, tools, guides), a single answer for navigating within a long page, and a single rule for what "current" looks like. If two things behave the same, they should look the same. If they look the same, they must behave the same.

## Problem 2: It still feels like patchwork

Even where nothing is broken, the pieces don't feel designed together.

**Eight separate card components,** each with its own spec, invented per page rather than derived from a system:

- Padding runs 22px, 24px, 26px, 28px — four values, no logic
- Corner radius alternates between two tokens with no discernible rule
- Some have icon badges, some have big numerals, some have neither

**Every section invents its own page shape.** Contract is a hub that links to guides. Commuting *is* a guide, sitting directly at nav level. Discounts is a three-level drill-down. Tools is a single interactive app. Essentials is a flat grid. A user can't build a mental model of "what a section looks like here" because there isn't one.

**What I want:** a small set of page templates (I'd guess: *hub*, *article*, *browse/drill-down*, *tool*) and a card system where variants differ only in visual weight, not in shape or structure. Every section should be recognizably built from the same kit.

## Constraints and preferences

- **Information density over decoration.** This is a reference site read under time pressure. Every visual element should earn its place by helping someone find something faster.
- **Mobile is the primary case.** Most readers are on a phone.
- **No decorative single-side colored borders** (no `border-left: 4px solid`, no colored strips across card tops). I find the pattern overused. Use background tints, typography, spacing, and icons instead.
- **Existing brand:** navy (`#0F1E3D` / `#1B3461`), red (`#C8102E`), gold (`#E8A33D`), sky blue (`#3B8BD6`), cream backgrounds. Display font Anton (uppercase headlines), Archivo for subheads/UI, Libre Franklin for body. These work — keep them.
- I'd rather have a bigger, correct restructure than a minimal patch. Implementation time isn't a constraint.

## Already done — please don't redo these

A previous pass fixed the structural layer. Build on it, don't repeat it:

- Removed a scroll-reveal animation that hid all content until it scrolled into view
- Added visible breadcrumbs (shared with the JSON-LD so they can't disagree)
- Gave every guide section an anchor id; added the sticky "On this page" TOC to guide pages
- Moved the contract guides under `/contract/` so they're inside their section (they were orphaned at `/guides/`)
- Added a section tab strip to contract pages — *this is the component that reuses `.cattab` and is part of Problem 1*
- Merged a redundant "New Here" page into the homepage
- Cut the hero roughly 30% so content is visible on load
- Consolidated the three guide pages onto one shared Article template

**The honest summary:** the *structure* is now right — URLs, hierarchy, breadcrumbs, anchors. What's missing is the *system* — one consistent visual and interaction language expressing that structure. That's what I need from this pass.

## What I'm asking for

1. **A navigation system spec** — sibling switching, in-page navigation, current-state rules, and when each applies. One component per job.
2. **A card system** — one base, variants by visual weight only.
3. **Page templates** — a small set covering every section, so no page invents its own shape again.
4. **Applied to the real pages**, not just shown in the abstract — I need to see Home, a guide, the contract hub, a discount base page, and Tools built from the system.

Start by telling me what the system should be and why, before building it.
