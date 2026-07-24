/*
 * ============================================================================
 *  assessment.data.js — SINGLE SOURCE OF TRUTH for the contract vote guide.
 *  Produced by the ta-analyzer skill. window.ASSESSMENT below.
 *
 *  CLAUDE DESIGN: YOU ARE THE DISPLAY LAYER ONLY.
 *  Read window.ASSESSMENT.renderContract FIRST. Render this file top to bottom
 *  in howToRead.page_order, using the text VERBATIM. Do NOT reorder, rewrite,
 *  summarize, re-analyze, re-rate, recompute, or invent ANY content or data.
 *  You own layout/typography/color/interaction. You do NOT own the WHAT.
 *  One page, two lenses: short (plain/plainCaption) + full
 *  (meaning/realterms/headline).
 *
 *  CHARTS: this file ships WITH assessment-charts.js. Load that file and call
 *  window.AssessmentChart(spec, opts) for each charts[] entry - it already
 *  honors showAllTicks / render / kind / emphasis. Do NOT hand-build charts.
 * ============================================================================
 */
window.ASSESSMENT = {
  "renderContract": {
    "READ_THIS_FIRST": "This file is the Single Source of Truth, produced by the ta-analyzer skill. Claude Design is the DISPLAY LAYER ONLY. Render what is here; do not think for it.",
    "you_must": [
      "Render the charts by loading the renderer that ships beside this file, assessment-charts.js, and calling window.AssessmentChart(chartSpec, opts) for each entry in charts[]. Load it VERBATIM - do not rewrite, reimplement, or 'improve' the chart code. It already honors every field below (showAllTicks, render.numberFormat, kind, emphasis, seriesOrder, highlightRange, annotations); hand-building charts is what reintroduces the tick/format/bar-vs-line bugs. You own the frame around each chart (card, caption, spacing), not the chart's own drawing.",
      "Render every section in the EXACT order given by howToRead.page_order — top to bottom, none skipped, none reordered.",
      "Use the text VERBATIM from this file: item titles, today/proposed, plain (website) or meaning (PDF), verdicts, tags, legend, glossary, howToRead, meta.methodology (title/intro/anchorsIntro/anchors), topic notes, and every chart's leadIn. Copy it; do not rewrite, summarize, shorten, or 'improve' it.",
      "Place every chart in its chart.placement, ALWAYS preceded by its leadIn and shown with its verdict. The renderer produces the SVG from charts[].series; you position it and wrap it, nothing more.",
      "UNIT TOGGLE: if a chart has a units[] array, render a small toggle control above or beside it, one button per unit (use each unit label), with the entry marked default:true selected on load. On switch, re-call window.AssessmentChart(spec, {unit: <that unit key>}) and swap the SVG - the renderer applies the transform and relabels the axis itself. The stored numbers never change, so the two views cannot disagree. Do not compute the alternate view yourself.",
      "chart.render specifies EVERY styling decision and the shipped renderer already applies it - Design makes none of its own. numberFormat: how axis/tooltip numbers format ('dollars'=$X.XX, 'percent'=X%, 'index'=+/-N% vs a 100 baseline, 'percent-of-start'=Nx starting rate). valueLabels: 'endpoints'=label first+last point only, 'none'=no point labels. gridlines: 'horizontal-only'. legend: corner to place it. emphasis: the series name drawn boldest/brightest (the others muted). seriesOrder: draw/stack/legend order, first name at back. Never substitute your own styling; if you think a render value is wrong, that is a skill bug to report, not to override.",
      "If a chart's x-axis has showAllTicks:true, EVERY tick label from axes.x.ticks must appear - the shipped renderer already draws them all (rotating when crowded) and the build's render-contract gate fails if any is missing. Do not thin, skip, or sample them. Thinning the axis misrepresents where step changes occur.",
      "Render each chart according to its chart.kind: 'bar_grouped' = grouped vertical BARS (one bar per series, side by side, for each x category) - NOT lines; 'step' = step lines (flat, then jump); 'line' = straight lines between points; 'multi_line' = multiple straight lines; 'dual_line' = two straight lines. A series with smooth=true always renders as a smooth line regardless of kind. NEVER substitute a line for a bar chart or vice versa - the kind is authoritative.",
      "If a chart has chart.highlightRange, shade the background across the x-categories at those indexes (a red-tinted band across those bars/points) and place its label as a callout pointing at that band - this marks the specific range where the story concentrates.",
      "For a chart with chart.highlightable (group keys), render group buttons that HIGHLIGHT the chosen group's line and dim the others - all lines stay visible, nothing is removed. The chart.breakeven series is the reference line: a line ABOVE it is gaining ground, BELOW it is losing.",
      "CONTEXT CARDS carry a `placement`: render each in that section, not all in market_reality. A card placed on a section key renders among that section's content; a card placed on an item id renders right after that item. This is how cross-cutting context reaches the reader where it is relevant instead of piling up in one section.",
      "MARKET VERDICT: a context card with a `marketVerdict` shows it as a tag (label + tone colour) next to the card, exactly like an item verdict. It is our read of where the deal sits vs the market AND which way the market is moving. Always show it beside the evidence in the card. \"Undetermined\" is a real, honest value — render it, do not hide it.",
      "CONTEXT CALLOUT: a card with a `callout` shows that short string as a prominent stat/label (the one thing a skimmer remembers), above the bullets. Do not bury it in prose.",
      "CARD BULLETS + SHORT/LONG (this is the point of the Market Reality section): each market card is scannable, never a wall of text. Render, in order: the callout (big stat badge), the marketVerdict pill, then the `bullets` array AS A BULLET LIST. In the SHORT lens that is the ENTIRE card body — bullets only, no paragraph. In the FULL/PDF lens, render the `bodyLong` prose BENEATH the bullets as elaboration. A card that shows its prose paragraph in the short lens is a bug. The section exists so a member can glance and get each point's market read (position + momentum) without reading prose.",
      "ONE PAGE, TWO LENSES (not two builds). There is a single page with a Short/Full toggle. SHORT is the default member view; FULL is the same page in the detail register. The toggle NEVER reorders or removes a section — it only changes depth. Print/PDF export renders the FULL lens.",
      "TABLE PLACEMENT (card): a table with an afterCard field renders right after the market card whose `id` equals that value (every market card carries a stable `id`). Match on id; never fall back to the end of the section silently — if an afterCard doesn't resolve, that's a skill bug to report.",
      "JUMP-TO INDEX: if meta.showFullIndex is set, the \"jump to\" / table-of-contents lists EVERY section in page_order — not only the topics. Derive it from page_order so it can never drift.",
      "TABLE PLACEMENT: a table with an afterItem field renders immediately AFTER that item card, inside its section, not at the end of the section. Tables without afterItem render at the end of their placement section. Respect each table register (short shows web/both).",
      "REGISTER = VISIBILITY (which entries appear at all), a SEPARATE axis from the Short/Full DEPTH toggle below. An entry's `register` is 'web' (member-facing), 'pdf' (detail-only), or 'both'. Short lens shows register web/both; Full lens shows all. Governs marketCards[] and tables[]. The REGISTER ENUMERATION instruction below lists this build's actual per-card registers — render exactly that visibility. How deep a shown card renders is the DEPTH rule, not register.",
      "ITEM MARKET READ (ADR-045): an item's market comparison has two homes that already exist. The SHORT verdict renders in the item's DETAIL-CARD market-comparison sidebar block from `market.note`. The FULL market reasoning renders in the item's FULL LAYER as part of `realterms` (the 'In real terms' block), in the Full lens. Never trim either to fit, and never replace the full read with a pointer to another section - the reasoning is contained on the item.",
      "DEPTH = the Short/Full toggle (ONE rule, all content types). SHORT shows the scannable layer; FULL shows scannable + elaboration beneath it. By type: ITEMS — short = `plain`, full = `plain` then `meaning`/`realterms`. CHARTS — short = `plainCaption`, full = `plainCaption` then `headline`. MARKET CARDS — short = callout + verdict pill + `bullets` (a BULLET LIST, no paragraph), full = that PLUS `bodyLong` prose beneath. NEVER show a market card's prose paragraph in the short lens; never fall back from `plain` to `meaning`. If a short-layer field is missing, that is a skill bug to report, not a reason to leak the full layer into short.",
      "COLOUR COMES FROM `polarity` ('pos'|'neu'|'neg'), which every chart, every scoreboard cell and every legend.verdicts entry carries. NEVER infer a colour by pattern-matching the verdict's words. Reader-facing wording must be free to change without changing what a colour means; a verdict rename must never repaint a cell.",
      "CONDITIONAL CHIPS: an item's `cond` value maps to reader-facing chip text via `condLabels` — render condLabels[item.cond], never the raw enum and never invented text.",
      "TAG CONSISTENCY: the Key/legend tag list (legend.tags) and the tag chips shown on each item are the SAME tags — render them with the SAME visual component and the SAME words. They are derived from one source, so if a chip and its Key entry ever differ, that is a bug to report, not to reconcile by choosing one.",
      "Show ratings using ratingSystem.labels and the colors implied by sign (gains positive, costs negative, Depends neutral). Show every tag (type, delivery, market) exactly as provided.",
      "If a scoreboard cell (or a topic's verdictByGroup entry) carries a bandEdgeNote, show it next to that verdict (a small footnote/tooltip is fine). It means the score sits near a boundary between two verdicts and honesty requires flagging it — never drop it to keep the grid tidy.",
      "Preserve the meaning of every verdict word exactly — never soften 'Major cost' or 'NEGATIVE' or 'CLEAR LOSS'.",
      "Place EVERY section — including what_this_is, deal_in_one_paragraph, and how_to_use — inside the single page_order flow, in exactly the position page_order gives it. Do not lift any section out into fixed chrome above or below the ordered flow. The ONLY things allowed outside the ordered flow are true chrome with no page_order key: the hero header and the sticky group selector.",
      "Render a link to the full technical report ONLY if meta.reportUrl is present, pointing at that exact URL. If meta.reportUrl is absent, render NO report link at all — never hardcode a filename. The deliverable is self-contained; a link to a file that wasn't produced is a dead link.",
      "Do NOT render any section whose key is not in page_order. A section absent from page_order is retired; show nothing for it. Read the group-specific outlook from the scoreboard instead.",
      "MARKET CARD ROUTING (authoritative): every marketCards[] entry has a `placement`; render it ONLY in the matching place, never in whichever section happens to loop over marketCards, and never twice. The full set of placement values emitted THIS build is [anchors, cat-pay, market_reality, outlook, sch-pbs] — handle all of them and assert none is left unplaced: 'anchors' -> the How we judge every change section; 'cat-pay' -> that topic's section; 'market_reality' -> the Market Reality section; 'outlook' -> the The big picture: your pay vs. the cycle section; 'sch-pbs' -> the item/change with id 'sch-pbs', right after it.",
      "REGISTER ENUMERATION (this build): the per-card registers are exactly: inflation -> web; peer_benchmark -> web; bargaining_sequence -> web; labor_market -> web; enforcement -> pdf; precedent -> web; forward_protection -> pdf; entry_rate_forcing -> web; relative_progression -> pdf; personal_outlooks -> pdf; union_accountability -> web. Short lens shows web/both; Full lens shows all. Render exactly this visibility.",
      "SECTION COMPOSITION (this build): render each of these sections as exactly the pieces listed, in this order, and nothing else. The `outlook` section = sections.outlook (title/intro) + the chart(s) placed here [pay_vs_prices] with each one's leadIn/verdict/caption + the market card(s) placed here [Inflation, Forward protection, Your pay outlook, from your position]. The `anchors` section = sections.anchors (title/intro) + the market card(s) placed here [Rules vs. promises]. The `market_reality` section = sections.market_reality (title/intro) + the market card(s) placed here [Vs. comparable contracts — today, Vs. comparable contracts — tomorrow, Bargaining leverage, Junior pay: market-forced, not a gift, Union accountability: catch-up or genuine wins?] + the table(s) placed here [regional_entry_rates]. The `accountability` section = sections.accountability (title/intro) + the chart(s) placed here [pay_structure_concession] with each one's leadIn/verdict/caption.",
      "MARKET VERDICT / CALLOUT (closed set): a market card MAY carry marketVerdict {label, tone} and/or callout. Render label as a pill coloured by tone using the SAME polarity->colour rule as everywhere (tone is one of [mix, neu, pos]; never infer colour from the words), and callout as a small badge by the title. Absent -> render neither.",
      "NO HERO CHART THIS BUILD: no chart has placement 'hero'. Do NOT render an empty hero chart frame. The framing visual lives in its placement section (see SECTION COMPOSITION). If your template reserves a hero slot, leave it to the page header/title only."
    ],
    "you_must_not": [
      "Do NOT reorder, add, merge, split, or omit any topic, change, chart, or section.",
      "Do NOT re-analyze, re-rate, re-weight, recompute, or 'sanity-check' any number, verdict, or rating — the analysis is final and lives only here.",
      "Do NOT write new copy, headlines, summaries, or captions, or paraphrase existing ones. If a sentence is needed and not in this file, that is a skill bug — request it, do not invent it.",
      "Do NOT combine two items into one visual or draw a second item's series onto another item's chart (single-item rule). A card's chart field may be a single id or a list of ids - a list means multiple companion charts illustrating that SAME single item; render each with its own verdict, in list order, still confined to that one card. Never attach a chart to a different item than the one whose finding it illustrates.",
      "Do NOT compute or infer data (totals, projections, comparisons) — every number you display already exists in this file."
    ],
    "your_only_job": "Typography, layout, spacing, color, responsiveness, interaction (expanders, tabs, the 'which group am I' selector), and the framing around each chart (card, caption, placement). The chart drawing itself belongs to the shipped assessment-charts.js. Make it beautiful and legible. The WHAT is fixed; you own the LOOK around it.",
    "register": "Website/short lens renders `plain`/`plainCaption`; PDF/full lens renders `meaning`/`realterms`/`headline`. Same order, same legend, same lead-ins — only the prose depth differs (see designBrief).",
    "if_something_is_missing_or_unclear": "Leave it out and surface it as a gap for the skill to fix. Never fill a gap with generated content — invented data in a voting guide is the one unacceptable failure.",
    "renderContractChangelog": {
      "version": "2.1.1",
      "note": "Per-version list of shapes with a visual consequence. If a line here has no matching you_must instruction, that is a skill bug.",
      "renderable_placements": [
        "anchors",
        "cat-pay",
        "market_reality",
        "outlook",
        "sch-pbs"
      ],
      "sections_in_order": [
        "what_this_is",
        "deal_in_one_paragraph",
        "how_to_use",
        "preface",
        "outlook",
        "anchors",
        "scoreboard",
        "topics",
        "market_reality",
        "accountability",
        "key",
        "glossary"
      ],
      "marketVerdict_tones": [
        "mix",
        "neu",
        "pos"
      ],
      "has_hero_chart": false,
      "charts": [
        {
          "id": "pay_vs_prices",
          "placement": "outlook",
          "hasUnits": false
        },
        {
          "id": "pay_structure_concession",
          "placement": "accountability",
          "hasUnits": false
        },
        {
          "id": "pay_progression_relative",
          "placement": "cat-pay",
          "hasUnits": true
        },
        {
          "id": "pay_raise_by_step",
          "placement": "cat-pay",
          "hasUnits": false
        }
      ],
      "tables": [
        {
          "id": "pay_scale_comparison",
          "placement": "cat-pay",
          "afterItem": null,
          "afterCard": null
        },
        {
          "id": "raise_timeline",
          "placement": "cat-pay",
          "afterItem": null,
          "afterCard": null
        },
        {
          "id": "boarding_pay_monthly",
          "placement": "cat-pay",
          "afterItem": "pay-boarding",
          "afterCard": null
        },
        {
          "id": "boarding_rate_vs_market",
          "placement": "cat-pay",
          "afterItem": "pay-boarding",
          "afterCard": null
        },
        {
          "id": "regional_entry_rates",
          "placement": "market_reality",
          "afterItem": null,
          "afterCard": "peer_benchmark"
        }
      ]
    }
  },
  "meta": {
    "contract": "PSA AFA 2026 Tentative Agreement",
    "version": "2.1.1",
    "generator": "ta-analyzer v2.1.1",
    "baseline": "Your real current contract = 2019 CBA + in-force side letters",
    "standpoint": "Every rating looks FORWARD from ratification day, across the contract's term plus the likely negotiation lag after it. Catching up on the past counts as your starting position, not a forward gain. Fixed-dollar benefits lose real value each year; percentage-based pay tracks the wage path; work RULES hold full value for the contract's whole life.",
    "mode": "pending_TA",
    "methodology": {
      "title": "Why we weigh instead of count",
      "intro": "Changes are weighed by how much they actually matter, not just counted — so a pile of tiny wins can't hide one real loss.",
      "anchorsIntro": "Seven things keep every rating honest:",
      "anchors": [
        {
          "label": "The life of the contract",
          "text": "Judged forward from day one — catching up on the past is your starting point, not a win for the future."
        },
        {
          "label": "Real terms",
          "text": "A raise smaller than inflation is a pay cut, and we score it that way."
        },
        {
          "label": "Rules vs. promises",
          "text": "A rule applies automatically; a promise needs the company to build it — so we don't bank promises."
        },
        {
          "label": "One item at a time",
          "text": "No item excuses another — items only combine in the category totals, where the math is shown."
        },
        {
          "label": "Catch-up vs. genuine wins",
          "text": "Matching what the industry already pays is the market working, not the union winning."
        },
        {
          "label": "Forward protection",
          "text": "Does the deal protect the negotiation gap — back-pay to the amendable date, or raises that beat inflation? Without it, every cycle loses ground."
        },
        {
          "label": "Market momentum",
          "text": "Matching today's rate can still leave you behind if peers are already bargaining past it — so we name the direction, not just the rate."
        }
      ]
    },
    "pageTitle": "Your Contract, Side by Side",
    "pageSubtitle": "An independent, plain-language look at what you have today, what would change, and what it means for you. It does not tell you how to vote.",
    "pdfCoverTitle": "PSA AFA 2026 Tentative Agreement: An Independent Assessment",
    "showFullIndex": true,
    "reportUrl": "./CbaVoteReportV2.dc.html"
  },
  "ratingSystem": {
    "weights": {
      "MG": 3,
      "SG": 2,
      "sg": 1,
      "tk": 0.25,
      "nc": 0,
      "sc": -1,
      "RC": -2,
      "XC": -3,
      "dep": "excluded"
    },
    "labels": {
      "MG": "Major gain",
      "SG": "Solid gain",
      "sg": "Small gain",
      "tk": "Token",
      "nc": "No real change",
      "sc": "Small cost",
      "RC": "Real cost",
      "XC": "Major cost",
      "dep": "Depends (swing factor)"
    }
  },
  "groups": [
    {
      "key": "nh",
      "label": "New Hire (first 3 years)",
      "definition": "Years 0-3 inclusive: flat starting rate with no step increase until the 3-year mark, and almost always on reserve. Off probation at 6 months."
    },
    {
      "key": "mc",
      "label": "Mid-Career (3-12 years)",
      "definition": "From your first real pay step at year 3 up to ~12 years: climbing the scale each year, typically holding a line."
    },
    {
      "key": "sr",
      "label": "Senior (12+ years)",
      "definition": "12+ years: at or near top of scale (top rung at 18 years), where the 401(k) match reaches 5% and no step increases remain."
    }
  ],
  "preface": {
    "cycle": "Before any number, understand the cycle every airline contract runs on. When a contract becomes 'amendable' (its renewal date), your pay doesn't rise — it FREEZES at the old rate until a brand-new deal is signed. Negotiations take years (this last round ran 2.6 years past due; the contract before 2019 took about 3 years to ratify). So prices keep climbing while your pay sits still, and by the time a raise lands, it's mostly just catching you back up to the hole the freeze dug. Then the next contract becomes amendable, and it starts again. Freeze, catch up, freeze. This is why getting a good deal done quickly matters: a short contract gets you back to the table sooner — but only helps if the deal is actually good, because you live with it through the next freeze too. That is the whole reason to read this before you vote.",
    "forward_protection": "This is why one idea matters more than the headline raise: FORWARD PROTECTION. A contract protects you against the cycle if it has either (a) guaranteed back-pay to the amendable date — so the frozen years get paid, which also removes the company's reason to drag out talks — or (b) raises that beat inflation, so a catch-up actually gets ahead instead of just breaking even. Without forward protection, workers lose ground every cycle, and it compounds over a career. As you read, ask of every pay change: does this protect the gap, or not?",
    "incentives": "One honest thing about how to read any contract summary — including this one. Everyone at the table is arguing their own interest, and that's not a scandal, it's just how it works:\n• The COMPANY wants to keep costs down, so it highlights the big headline number and the shiny new items.\n• The UNION — which is your own coworkers doing hard work against a tough company — wants the deal to pass and gets credit for a 'good contract,' so it naturally frames things in the best light.\n• YOU just want to know, honestly, what it means for your paycheck and your life.\nNone of that implies bad faith — it's why this guide exists: to weigh each change on its own, from your side of the table, so you can decide for yourself. That's also why we WEIGH changes instead of counting them — a long list of small wins is the easiest way to make any deal look better than it is.",
    "fair_both_ways": "This stage cuts both ways. Once you see the cycle, some changes look better, not worse — boarding pay, for instance, is real new money that helps offset the erosion. The point isn't to make the deal look bad; it's to make every piece legible, good and bad, judged against how pay actually works over time."
  },
  "howToRead": {
    "page_order": [
      "what_this_is",
      "deal_in_one_paragraph",
      "how_to_use",
      "preface",
      "outlook",
      "anchors",
      "scoreboard",
      "topics",
      "market_reality",
      "accountability",
      "key",
      "glossary"
    ],
    "what_this_is": "An independent, plain-language look at the contract you're voting on - what you have today, what would change, and what it actually means for you. Built from the contract itself, not the union's summary or the company's talking points. It won't tell you how to vote; it makes sure you know what you're voting on.",
    "deal_in_one_paragraph": "The 10% raise mostly just catches you back up to 2023, and the small raises after it fall behind prices - so your pay slowly loses ground. Boarding pay is the real new money, though it's really PSA catching up to what other airlines already pay. Reserve life genuinely improves, with rules you can count on. Less visible: the pay ladder is flattened, which is worth $10-15k a year in forgone career earnings for FAs above the floor, and this deal makes it permanent. And most schedule wins wait on a new bidding system that's had a rough rollout.",
    "how_to_use": "Find your group - New Hire, Mid-Career, or Senior - and check your pay picture. Glance at the scoreboard for the whole deal at once. Then open whatever matters most to you. Every item shows today vs. proposed, a quick rating, and a plain bottom line. You don't need to study anything - it's built to just make sense as you read."
  },
  "legend": {
    "verdicts": [
      [
        "CLEAR WIN",
        "the gains clearly dominate (weighted score 8+)",
        "pos"
      ],
      [
        "Net positive",
        "more gain than cost (4 to 8)",
        "pos"
      ],
      [
        "Modest positive",
        "a little ahead (1.5 to 4)",
        "pos"
      ],
      [
        "About even",
        "the gains and the costs offset each other - not 'nothing changed'",
        "neu"
      ],
      [
        "Net negative / CLEAR LOSS",
        "the costs dominate",
        "neg"
      ]
    ],
    "tags": [
      [
        "NEW",
        "genuinely new - not in your current contract or side letters"
      ],
      [
        "KEPT",
        "you already have this through a side deal; the contract just makes it permanent (worth something, but not new money)"
      ],
      [
        "RESTORED",
        "you had it, it expired, this brings it back"
      ],
      [
        "Automatic rule",
        "applies by itself on its date - enforceable by grievance"
      ],
      [
        "Delayed rule",
        "automatic, but starts a year or two in"
      ],
      [
        "Implementation promise",
        "only as good as the system the company builds - shown separately as 'if delivered'"
      ],
      [
        "Market: CATCH-UP",
        "the company was forced to follow the industry to stay competitive - a benefit to you, not a favor"
      ],
      [
        "Market: AT STANDARD",
        "matches what comparable employers pay"
      ],
      [
        "Market: ABOVE STANDARD",
        "genuinely beats the market - a real negotiated win"
      ],
      [
        "status add-ons",
        "only counts for you if that's your situation - shown as a separate add-on, never assumed"
      ]
    ],
    "ratingPill": [
      {
        "label": "Major gain",
        "weight": 3,
        "blurb": "one of the biggest wins"
      },
      {
        "label": "Solid gain",
        "weight": 2,
        "blurb": "a real, meaningful gain"
      },
      {
        "label": "Small gain",
        "weight": 1,
        "blurb": "modest but genuine"
      },
      {
        "label": "Token",
        "weight": 0.25,
        "blurb": "real but tiny"
      },
      {
        "label": "No change",
        "weight": 0,
        "blurb": "doesn't move your life"
      },
      {
        "label": "Small cost",
        "weight": -1,
        "blurb": "a modest downside"
      },
      {
        "label": "Real cost",
        "weight": -2,
        "blurb": "a loss you'd feel"
      },
      {
        "label": "Major cost",
        "weight": -3,
        "blurb": "one of the biggest downsides"
      },
      {
        "label": "Depends",
        "weight": null,
        "blurb": "wildcard - left out of the math"
      }
    ],
    "renderAs": "pills",
    "placement": "key",
    "details_pdf_only": {
      "small_vs_real": "A small once-a-year bump is a Small item — real but tiny. A raise that trails inflation every year is a Real cost — it quietly takes meaningful money from everyone, over and over.",
      "same_yardstick": "Gains and costs use the same ruler, so a cost and a gain of equal size get equal weight with opposite signs — a large yearly loss lands as a Major cost, the mirror of a Major gain."
    }
  },
  "designBrief": {
    "product": "Live website page presenting this assessment",
    "version": "1.13.1",
    "audience": "The whole membership - predominantly middle-aged women, busy, most have never read their contract. Plain, warm, direct language; short sentences; no jargon without an inline explanation.",
    "tone": "A knowledgeable coworker explaining it over coffee. Honest in both directions. Never tells anyone how to vote.",
    "non_negotiables": [
      "Verdict words must render exactly as written - never soften NEGATIVE/CLEAR WIN in design.",
      "Every item keeps its tags visible: NEW/KEPT/RESTORED, delivery (rule vs promise), and market tag where present.",
      "Charts never appear without their verdict + headline beside them.",
      "Keep the version stamp on the page.",
      "Do not merge items or their charts - one item, one card, one visual (single-item rule)."
    ],
    "section_order": [
      "1. Scoreboard: the topic x group verdict matrix (the whole contract at a glance)",
      "2. 'Find your position': the three per-group pay outlook graphs, tabbed or side-by-side",
      "3. Topic-by-topic cards: Today vs Proposed table, 'what it means', tags, per-group ratings; details expandable/collapsible",
      "4. Market Reality Check sections",
      "5. Union accountability verdict",
      "6. Glossary + assumptions + version"
    ],
    "item_rendering": "For each change use the `plain` field as the visible website text when present (it is written for the average non-technical reader); fall back to the first sentence of `meaning` only if `plain` is absent. Full `meaning`/`realterms` go behind an expander for those who want depth. Tags as small badges; per-group ratings as colored chips (greens for gains, grey for no change, reds for costs, amber for Depends).",
    "plain_language_rule": "This is a website for the average member, not a technical reader. Avoid or inline-explain jargon: 'amendable' -> 'when the contract is up for renewal', 'real-terms' -> 'what your pay actually buys', 'rung/step', 'back-pay' not 'retro'. Every chart shows its `plain_caption`, not its technical headline.",
    "visual_requirements": {
      "rebuild_natively": "Rebuild all charts from graphs[].data in the site's design language; the PNGs are reference renderings only.",
      "each_chart_in_its_section": "Place each chart in its graphs[].placement section - the chart must illustrate that section's subject (pay-vs-prices in the pay section, accountability chart in the accountability section). Never float a chart into an unrelated section.",
      "use_plain_caption": "Render each chart with its `plain_caption` (average-reader wording) plus its verdict - never without the verdict.",
      "flagship": "'Your raises vs. the cost of living' (the Treadmill): two lines from a shared day-one start - your pay vs prices - with the widening gap shaded and labeled as the real-terms pay cut. Hero placement at the top of the pay section. Label the pay line plainly (e.g. 'Your yearly raises after 2027 (+1.5%, then a freeze)'), never vague phrases.",
      "placement": "Each graphs[] entry names its placement section."
    },
    "glossary_terms": [
      "Continuous Duty Overnight (A trip that flies late evening and early morning with a short overnight in between — you're on duty the whole time. Also called a 'standup' or CDO.)",
      "Ready Reserve (A reserve day spent at or near the airport, ready to fly on very short notice. Also called HRV — the most disruptive kind of reserve day.)",
      "Golden Days (Protected days off a reserve FA cannot be junior-assigned or contacted on.)",
      "System Board (The System Board of Adjustment — the panel that decides grievances the union and company can't settle.)",
      "side letter (A separate signed agreement outside the main contract. It can expire or be changed more easily than contract language.)",
      "Flight Pay Loss (Pay covering a union rep's time away from flying to do union work. Abbreviated FPL.)",
      "retro pay (Back pay covering the period since raises should have taken effect.)",
      "junior-assigned (Forced to work on a day off because you're the least senior FA available.)",
      "top of scale (The highest pay step — no more automatic longevity raises after this.)",
      "step-up (Your automatic yearly raise for gaining another year of service. Also called a longevity step.)",
      "longevity step (Your automatic yearly raise for gaining another year of service.)",
      "bid period (The monthly scheduling window you bid for.)",
      "per diem (Hourly expense money paid while you're away on a trip.)",
      "carve-out (An exception written into a rule that reduces a paid minimum in certain situations.)",
      "lineholder (An FA awarded a monthly schedule of trips (a 'line') — the opposite of being on reserve.)",
      "deadhead (Riding a flight as a passenger while on duty, to get you where the company needs you — not working the flight.)",
      "grievance (A formal complaint that the company violated the contract.)",
      "amendable (Airline contracts don't expire — they become 'amendable,' the date renegotiation can begin while old terms stay in force.)",
      "guarantee (The minimum number of hours you're paid each month regardless of how much you fly.)",
      "FlightPAC (AFA's political action committee — funds candidates who support flight attendant issues.)",
      "domicile (Your base airport — where your trips start and end.)",
      "selfing (Arranging your own flights to or from a duty assignment instead of a scheduled deadhead.)",
      "pay and credit (Counts toward both your paycheck AND your hour totals (guarantee, monthly caps).)",
      "standup (A trip that flies late evening and early morning with a short overnight in between — on duty throughout. Also called a CDO.)",
      "reserves (On-call FAs with no fixed schedule who cover open flying.)",
      "ratification (The membership vote that approves the tentative agreement and makes it the contract.)",
      "DOR (Date of Ratification — the day the contract is voted in and takes effect.)",
      "PBS (Preferential Bidding System — software that builds your monthly schedule from ranked preferences instead of picking whole lines.)",
      "HRV (Ready Reserve — a reserve day spent at or near the airport, ready to fly on very short notice.)",
      "RAP (Reserve Availability Period — the daily window a reserve must be reachable and ready to fly.)",
      "CBA (Collective Bargaining Agreement — your union contract.)",
      "AFA (Association of Flight Attendants — your union.)",
      "NMB (National Mediation Board — the federal agency that oversees airline labor relations.)",
      "DOT (Department of Transportation — federal medical/qualification requirements.)",
      "TA (Tentative Agreement — the proposed contract you're voting on.)",
      "FA (Flight Attendant.)",
      "Implementation LOA (A Letter of Agreement requiring the Company to actually build the promised systems — with expedited arbitration (heard in 15 days, decided in 30) if it doesn't deliver.)",
      "Railway Labor Act (The federal law governing airline labor contracts — under it, contracts never expire; old terms stay frozen until a new deal is ratified.)",
      "LOA (Letter of Agreement — a signed side deal attached to the contract.)",
      "ALPA (Air Line Pilots Association — the pilots' union.)",
      "AD OPT (The software vendor whose PBS product PSA's pilots already use.)",
      "arbitration (A neutral third party hears the dispute and issues a binding decision.)",
      "MEC (Master Executive Council — your union's top elected body at PSA.)",
      "LEC (Local Executive Council — your union's elected body at each base.)"
    ]
  },
  "topics": [
    {
      "title": "Your Paycheck",
      "anchor": "cat-pay",
      "topicNote": "Money first, because it's the first question everyone asks. Four things decide this category: the day-one catch-up, the small raises that follow it, boarding pay, and what happened to the pay ladder. Each is judged on its own - starting with the one picture that frames everything: your raises versus the cost of living.",
      "webTakeaway": "Bottom line: the 10% mostly just catches you back up to 2023, and the raises after it fall behind prices - so your pay slowly loses ground over the deal. Boarding pay is the one real chunk of new money, and even that's just catching up to what other airlines already pay. The big hidden cost is the flattened ladder, which quietly takes $10-15k a year off what senior FAs would've topped out at. Real gains here, but read the pay-vs-prices chart before you decide.",
      "netNote": "Two big forces dominate this category and they pull HARD in opposite directions: boarding pay (the largest genuinely NEW money, ~$3-4k/yr, permanent and percentage-based) and the flattened-ladder concession (the largest structural cost, ~$10-15k/yr in forgone career earnings for everyone above the floor). On boarding pay, keep the market read honest: it's a SOLID gain versus your current contract but a catch-up, not a win - Delta set the 50% standard in 2022, so PSA arriving at the same 50% in 2027 is matching a standard five years old. (Above 50% is a trajectory, not yet the ratified norm - Air Canada's 2025 deal escalates past 50% and some unions opened at full ground-duty pay - so it's context, not a rating driver.) PSA members also work more boardings at a lower rate to reach the same ~7-10% of comp mainline gets, not a bigger benefit. Net verdicts stay positive but are GENUINELY CLOSE: boarding pay + the +10% level-set on one side, the permanent concession on the other. Timing the rollup can't show: boarding pay is real recurring money only from 2027; the concession is forgone potential vs a defended structure (no current check shrinks). Weigh them as the two headline economic facts, not a long list of small wins.",
      "changes": [
        {
          "id": "pay-levelset",
          "title": "Day-one pay level (the +10%)",
          "type": "NEW",
          "starts": "2026",
          "delivery": "automatic",
          "cond": null,
          "market": {
            "position": "at_market",
            "note": "Restores rates that narrowly lead the current regional table - but PSA settled first (peers negotiate next off this floor) and remains ~20% under mainline entry."
          },
          "today": "Rates frozen since 2023 while prices rose ~8-9% - your paycheck buys noticeably less than it did.",
          "proposed": "+10% at ratification - restoring your rate to roughly its 2023 purchasing power.",
          "plain": "You get a 10% raise the day this signs. Here's the catch: your pay's been frozen since 2023 while everything got more expensive, so this mostly just gets you back to even - not ahead.",
          "meaning": "This sets your STARTING position for the contract - it repairs the freeze years. Under this guide's standpoint (the life of the contract, looking forward), catch-up on the past counts as where you begin, not as a forward gain.",
          "realterms": "In real terms (market): Restores rates that narrowly lead the current regional table - but PSA settled first (peers negotiate next off this floor) and remains ~20% under mainline entry.",
          "rating": {
            "nh": "sg",
            "mc": "sg",
            "sr": "sg"
          },
          "chart": null
        },
        {
          "id": "pay-retro",
          "title": "Back-pay for the freeze years (retro pay)",
          "type": "NEW",
          "starts": "At ratification",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "No back-pay - the raises you missed while pay sat frozen since 2023 are simply gone.",
          "proposed": "Back-pay for the freeze years, ramping from ~1.5%/month in July 2023 to ~5-6%/month by late 2025.",
          "plain": "You get some back-pay for the years your raise was frozen - but it starts small (1.5% a month back in 2023) and only builds up late, so it's thin, and thinnest of all if you're newer.",
          "meaning": "Back-pay repairs part of the freeze, but under this guide's standpoint it counts as catch-up on the past - where you begin, not a forward gain. It is also weak next to the majors and thinnest for the newest FAs (1-3 years), who have the least service for it to apply to.",
          "realterms": "PSA lags the majors badly on back-pay. United's runs about 4% a year from 2021 through 2024, then jumps to 22% in 2025 and 25% in early 2026; American mainline runs 3-4% through 2022, 10.8% in 2023, and about 20% into 2024. PSA's starts at just 1.5% a month in July 2023 and only ramps to 5-6% a month by late 2025 - and it is thinnest for the newest hires (1-3 years), who have the least service for it to apply to.",
          "rating": {
            "nh": "tk",
            "mc": "tk",
            "sr": "tk"
          },
          "chart": null
        },
        {
          "id": "pay-wagepath",
          "title": "Your yearly raises after 2027 (+1.5%, then a freeze)",
          "type": "NEW",
          "starts": "2027 onward",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "After the first-year 10%, raises are just 1.5% in 2027 and 1.5% in 2028, then nothing until the next contract.",
          "proposed": "+1.5% in 2027, +1.5% in 2028 - then rates freeze again at the amendable date until the next deal is ratified (2.6 years last time).",
          "plain": "After that first bump, the raises are tiny - 1.5% in 2027, 1.5% in 2028, then frozen until the next contract. Prices keep climbing the whole time, so your paycheck quietly buys less each year. (See the pay-vs-prices chart - this is the big one.)",
          "meaning": "Against ~3-4% inflation, 1.5%/yr then a freeze is a SCHEDULED real-terms pay cut for the life of the contract - roughly 8-13% of purchasing power gone by the time the next deal lands. This is one provision and it erodes everyone's hourly rate equally, so it's rated a real cost for all three groups. Mid-career paychecks still rise because of yearly longevity steps - but those steps were owed under the OLD contract; they mask the erosion, they don't undo it. No COLA clause and no guaranteed retro-to-amendable-date exists to stop it.",
          "realterms": "The single weakest economic feature of the deal: a scheduled real-terms decline every year of the contract's life. Judged alone, on its own line - no other pay item offsets or excuses it.",
          "rating": {
            "nh": "RC",
            "mc": "RC",
            "sr": "RC"
          },
          "chart": "pay_vs_prices"
        },
        {
          "id": "pay-floor",
          "title": "Higher, locked-in starting floor",
          "type": "NEW",
          "starts": "2026",
          "delivery": "automatic",
          "cond": null,
          "market": {
            "position": "catch_up",
            "note": "The 2022 LOA's own text says rates were 'not sufficiently competitive' to hire; mainline entry is $35-37. Forced repricing to stay staffed."
          },
          "today": "Junior floor sits at $27.06 - but only because a 2022 side letter hauled it up from the real 2019 rate of ~$20 to stay able to hire; the company can still lower it.",
          "proposed": "Bottom rungs repriced to $29.77 and locked permanently into the contract scale.",
          "plain": "New-hire starting pay gets locked in higher and they can't drop it anymore. Real win if you're junior. Just know why it happened: they couldn't hire anyone at the old rate, so their hand was forced.",
          "meaning": "A real protection for new hires - the floor is locked in and can no longer be cut - but barely a raise in market terms: Envoy ($29.73) and Piedmont ($28.08) already start at or above this, so PSA is matching peers, not leading them. The 2022 LOA's own text admits the old rates were 'not sufficiently competitive' to hire; this repricing was market-forced to stay staffed, not a gift - a regional cannot hire at $20 when mainline starts at $36.",
          "realterms": "In real terms (market): The 2022 LOA's own text says rates were 'not sufficiently competitive' to hire; mainline entry is $35-37. Forced repricing to stay staffed.",
          "rating": {
            "nh": "nc",
            "mc": "nc",
            "sr": "nc"
          },
          "chart": null
        },
        {
          "id": "pay-progression",
          "title": "A flatter pay ladder - seniority now earns you far less, locked in permanently",
          "type": "CODIFY",
          "starts": "2026 (permanent)",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "Since a 2022 side letter, the bottom four rungs sit at one flat rate. That did two things to the scale's SHAPE: a career now multiplies pay to ~1.61x its start (was ~2.16x pre-2022), and the seniority premium collapsed - top of scale earns +61% over entry, down from +116%. Rungs 3-18 kept their exact step structure (verified: every step % identical to the 2019 shape).",
          "proposed": "A clean, uniform +10% on every rung - which CEMENTS the compressed 2022 shape permanently instead of restoring the historic ladder. The structure-preserving alternative (raise the floor AND keep the old relative ladder) would have put 3yr at ~$42.72, 8yr at ~$53.31, and top of scale at ~$64.25 instead of $47.86.",
          "plain": "Here's the trade: they raised the starting rate (which they had to, to hire people), but in exchange the old pay-raise ladder got flattened. So you're not being robbed of a raise — you gained at the bottom and gave up structure higher up. The result over a full career: you top out about $10,000-$15,000 a year lower than the old ladder would've reached. It's a concession, and this deal locks it in permanently.",
          "meaning": "One provision, two distinct harms, differently distributed. (1) FAs who still climb the flat bottom - future hires and current sub-3-yr FAs - walk a ~25% flatter career climb; the erased early raises are never recovered. (2) EVERYONE above the floor takes the compression: your future step raises are unchanged (rungs 3-18 are the same shape, so this is NOT a paycheck cut), but the pay value of your seniority was nearly halved, permanently - and because raises are percentage-based, this compressed structure is the baseline every future scale will be built on. The company bought its market-forced hiring floor by paying for it out of the scale's shape rather than out of pocket - and this TA locks that trade in.",
          "realterms": "THE EXERCISE THAT SETTLES IT (see the structural-concession chart): apply the old ladder to the new $29.77 floor and every step from the 2-year mark on sits EXACTLY 25.5% below it - a 5-yr FA short ~$12.00/hr (~$10.8k/yr at guarantee), top of scale ~$16.39/hr (~$14.8k/yr). The uniformity is the proof: the floor's entire cost was spread evenly across the structure. This measures the CONCESSION versus a defended structure, not a cut versus any existing contract - nobody's check shrinks. The forward harm for everyone above the floor: the floor is the market-disciplined rung and WILL be forced up again; under the old shape that lifted the whole scale, under this flat shape it only lifts the bottom and compresses you further. Honest caveat: full preservation ($64.25 top, ~40% above any regional) was likely unwinnable - but zero restoration was a choice, and this TA ratifies it permanently.",
          "rating": {
            "nh": "XC",
            "mc": "XC",
            "sr": "XC"
          },
          "chart": [
            "pay_progression_relative",
            "pay_raise_by_step"
          ]
        },
        {
          "id": "pay-boarding",
          "title": "Boarding pay",
          "type": "NEW",
          "starts": "2027 (1 yr out)",
          "delivery": "delayed",
          "cond": null,
          "market": {
            "position": "catch_up",
            "note": "Catch-up, not a win: Delta set the 50% standard in 2022, so PSA's 50% in 2027 matches a five-year-old benchmark."
          },
          "today": "Today you get nothing for boarding time - your pay clock doesn't start until all doors are closed and the parking brake is released.",
          "proposed": "50% of your hourly rate for all boarding time (including reboards), paid on top of your guarantee, for lineholders and reserves alike.",
          "plain": "Finally getting paid for boarding - 50% of your rate. Real money. But almost every airline already pays it, so this is PSA catching up, not doing us a favor - and it doesn't start for a year.",
          "meaning": "Real new money for time you already work: 50% of your hourly rate for all boarding time, above guarantee, reserves and lineholders alike. A solid gain versus today's contract - permanent, percentage-based money that rides every future raise - but a catch-up versus the market. Starts 2027.",
          "realterms": "Judged alone: real, permanent, percentage-based new money - it rides your hourly rate, so it inherits whatever your rate does (the wage path's problem, assessed separately). Worth about 7-10% of pay - the largest genuinely new income stream in the deal against your current contract. On the market: catch-up, not a win. Delta introduced 50% boarding pay first (2022), American matched in 2024, United in 2026 - all at 50%. PSA arriving at the same 50% in 2027 is matching a standard that will be five years old. Above 50% is a trajectory, not yet the ratified norm (Air Canada's 2025 deal escalates past 50% over its term; some unions opened at full ground-duty pay) - context, not a rating driver. And PSA members don't come out ahead: 30-40 boardings at half a lower hourly rate lands in the same dollars-per-month as mainline's fewer boardings at higher pay - the same ~7-10% of comp, expressed as more, cheaper boardings, not a bigger benefit.",
          "rating": {
            "nh": "SG",
            "mc": "SG",
            "sr": "SG"
          },
          "chart": null
        },
        {
          "id": "pay-minday",
          "title": "Minimum day pay",
          "type": "NEW",
          "starts": "Carve-outs at DOR; 3.75 hrs 2028",
          "delivery": "delayed",
          "cond": null,
          "market": null,
          "today": "3.5 hours per calendar day, and certain 'carve-outs' reduce it in some situations.",
          "proposed": "Carve-outs removed at ratification; the 3.5-hour minimum rises to 3.75 hours on 2028.",
          "plain": "A little more pay on short days, and the carve-outs that used to chip away at your minimum paid hours on a short day are gone right away.",
          "meaning": "You're guaranteed a bit more pay on short days, and the deductions that chipped away at it are gone right away. One catch, and it is worse than the pilots' contract: under new TA section F.4 the minimum-day guarantee does not cover the unflown portion of a trip you miss through an absence or a partial trade - and a cancellation or reassignment the company causes does NOT count as one of those exceptions, so you can still lose the guarantee on time you never chose to give up.",
          "realterms": "The minimum-day floor rises, but TA section F.4 carves out the unflown part of a missed trip (absence or partial trade), and company-caused cancellations and reassignments are not treated as exceptions - a narrower guarantee than PSA pilots hold.",
          "rating": {
            "nh": "SG",
            "mc": "sg",
            "sr": "sg"
          },
          "chart": null
        },
        {
          "id": "pay-deadhead",
          "title": "Deadhead pay",
          "type": "NEW",
          "starts": "Some at DOR; 75% at 2028",
          "delivery": "delayed",
          "cond": null,
          "market": null,
          "today": "Deadhead pays 100% of the time flown; a deadhead on a day off carries only a 2.5-hour minimum.",
          "proposed": "A full deadhead day pays no less than minimum-day pay; deadhead on a day off also gets that floor; 'selfing' pay/per diem now covers deadheads TO duty, not just from; rate rises to 75% pay and credit on 2028.",
          "plain": "Deadheads pay better - a full deadhead day won't pay less than a min day, days-off deadheads are covered, and deadheading to a trip now counts too. Big help if you commute.",
          "meaning": "Especially helps commuters and anyone who deadheads often — you're no longer shorted for travel days.",
          "realterms": null,
          "rating": {
            "nh": "sg",
            "mc": "sg",
            "sr": "sg"
          },
          "chart": null
        },
        {
          "id": "pay-perdiem",
          "title": "Per diem (meal money)",
          "type": "NEW",
          "starts": "2026 onward",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "About $2.00/hour (started at $1.85 in 2019).",
          "proposed": "$2.05 (2026), $2.10 (2027), $2.15 (2028).",
          "plain": "Meal money goes up a nickel a year. It's something, but it doesn't keep up with what food actually costs now.",
          "meaning": "Nominal bumps of ~2.4%/yr against ~3-4% inflation: the real value of your meal money declines slightly over the contract's life. A token.",
          "realterms": "~2.5% on ~$2.00/hr, below inflation - and far below mainline: PSA's ~$2.05-2.15 domestic runs about 30% under American ($2.85 in 2024, rising to $3.05 by 2028) and United ($2.97) - even though a regional FA's meals cost the same. A token bump that also leaves a wide gap to the majors.",
          "rating": {
            "nh": "tk",
            "mc": "tk",
            "sr": "tk"
          },
          "chart": null
        },
        {
          "id": "pay-nyd",
          "title": "New Year's Day",
          "type": "NEW",
          "starts": "Immediate",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "Holiday pay (1.5x) covers Thanksgiving, Christmas, Memorial Day, July 4th.",
          "proposed": "New Year's Day added to that list.",
          "plain": "Time-and-a-half if you work New Year's Day now.",
          "meaning": "Time-and-a-half if you work New Year's Day.",
          "realterms": null,
          "rating": {
            "nh": "tk",
            "mc": "tk",
            "sr": "tk"
          },
          "chart": null
        },
        {
          "id": "pay-payroll",
          "title": "Payroll mistakes",
          "type": "NEW",
          "starts": "At ratification",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "No firm deadline to fix a paycheck error.",
          "proposed": "Errors of $50+ fixed within 5 business days of your form; under $50 in your next check.",
          "plain": "When they short your check, there's finally a deadline to fix it - five days for anything over $50.",
          "meaning": "When they underpay you, there's finally a clock on the fix.",
          "realterms": null,
          "rating": {
            "nh": "sg",
            "mc": "sg",
            "sr": "sg"
          },
          "chart": null
        },
        {
          "id": "pay-drugtest",
          "title": "Pay for drug/alcohol tests",
          "type": "NEW",
          "starts": "At ratification",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "Paid only if the test happens at the end of a trip.",
          "proposed": "$10 for a test taken at any point during a trip.",
          "plain": "You get $10 for a test anytime during a trip now, not just at the end.",
          "meaning": "You're compensated for the time whenever they pull you for testing.",
          "realterms": null,
          "rating": {
            "nh": "tk",
            "mc": "tk",
            "sr": "tk"
          },
          "chart": null
        },
        {
          "id": "pay-cdo-min",
          "title": "Continuous Duty Overnight (standup) minimum pay",
          "type": "NEW",
          "starts": "At ratification",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "A continuous duty overnight pays a minimum of 3.5 hours.",
          "proposed": "Minimum rises to 4.0 hours.",
          "plain": "Standups pay at least a half hour more than before.",
          "meaning": "Standups pay at least half an hour more. These trips are worked disproportionately by junior FAs, so this quietly favors newer people. (Not mentioned in the union's summary booklet - found in the contract language itself.)",
          "realterms": null,
          "rating": {
            "nh": "sg",
            "mc": "sg",
            "sr": "tk"
          },
          "chart": null
        }
      ],
      "verdictByGroup": {
        "nh": {
          "verdict": "Net positive",
          "polarity": "pos",
          "score": 4.0,
          "tally": "10 gains, 2 costs",
          "depCount": 0,
          "addonNotes": [],
          "bandEdgeNote": "This lands just over the line between two verdicts (score 4, boundary 4) - a small change in one item could tip it either way."
        },
        "mc": {
          "verdict": "Modest positive",
          "polarity": "pos",
          "score": 3.0,
          "tally": "10 gains, 2 costs",
          "depCount": 0,
          "addonNotes": []
        },
        "sr": {
          "verdict": "Modest positive",
          "polarity": "pos",
          "score": 2.25,
          "tally": "10 gains, 2 costs",
          "depCount": 0,
          "addonNotes": []
        }
      }
    },
    {
      "title": "Reserve Life",
      "anchor": "cat-reserve",
      "topicNote": "This is where the contract does the most for junior FAs - and note a forward-looking bonus: these are RULES, not dollars. A cap of 10 or a 13-hour RAP holds full value every year of the contract; it can't be eroded by inflation the way un-indexed money can.",
      "webTakeaway": "Bottom line: if you sit reserve, this is the best part of the deal for you. Hard caps on Ready Reserve, an hour less on your availability window, six permanent Golden Days, and a fairer way to spread the pain - these are real rules, not promises. A couple of the best ones (auto check-in, fair assignment) only pay off if the company builds the systems right, but the core wins are locked in.",
      "netNote": "Still the strongest part of the deal for junior FAs, but split it honestly: the BANKABLE wins are the hard rules - the HRV cap of 10, the 13-hour RAP, 6 Golden Days, trip pickups (+6 for a new hire). The rest (auto check-in, the bucket system, worth ~+3 more) are PROMISES: new systems the Company must build and build well. The Implementation LOA's expedited arbitration protects against non-delivery, but a clunky system still 'complies.' The +6 is bankable under the contract; the +3 depends on systems the Company has yet to build.",
      "changes": [
        {
          "id": "res-hrv",
          "title": "Ready Reserve (HRV) limit",
          "type": "NEW",
          "starts": "First bid month after DOR",
          "delivery": "automatic",
          "cond": "reserve",
          "market": null,
          "today": "No cap — you can be placed on Ready Reserve as often as the Company wants.",
          "proposed": "No more than 10 times per month.",
          "plain": "They can only put you on Ready Reserve 10 times a month now - there was no limit before. If you sit reserve, this is the big one.",
          "meaning": "A hard ceiling on the most disruptive kind of reserve day. Big relief for junior reserves.",
          "realterms": null,
          "rating": {
            "nh": "MG",
            "mc": "MG",
            "sr": "MG"
          },
          "chart": null
        },
        {
          "id": "res-rap",
          "title": "Reserve availability window",
          "type": "NEW",
          "starts": "First bid month after DOR",
          "delivery": "automatic",
          "cond": "reserve",
          "market": null,
          "today": "14-hour reserve availability period (RAP).",
          "proposed": "13 hours.",
          "plain": "Your reserve availability drops from 14 hours to 13 - an hour less each day chained to your phone.",
          "meaning": "One less hour a day tethered to your phone waiting for a call.",
          "realterms": null,
          "rating": {
            "nh": "sg",
            "mc": "sg",
            "sr": "sg"
          },
          "chart": null
        },
        {
          "id": "res-golden",
          "title": "Golden Days (protected days off)",
          "type": "CODIFY",
          "starts": "First bid month after DOR",
          "delivery": "automatic",
          "cond": "reserve",
          "market": null,
          "today": "6 per bid period today, via a 2022 side letter that raised it from 4 and remains in force.",
          "proposed": "6 per bid period, permanently.",
          "plain": "You already get six protected days a bid period through a 2022 side deal; this makes it permanent so you can't lose it. Days they can't junior-assign you on.",
          "meaning": "Two more immovable days off you can't be junior-assigned on. You already get 6 through the still-in-force 2022 side letter; this writes it permanently into the contract so it can't lapse.",
          "realterms": null,
          "rating": {
            "nh": "tk",
            "mc": "tk",
            "sr": "tk"
          },
          "chart": null
        },
        {
          "id": "res-autocheck",
          "title": "Checking in/out",
          "type": "NEW",
          "starts": "First bid month after DOR",
          "delivery": "promise",
          "cond": "reserve",
          "market": null,
          "today": "You must call scheduling to check in and out.",
          "proposed": "Automatic — if you have no more required flying, you're auto-released; no call needed.",
          "plain": "No more calling scheduling to check in and out - it's automatic once you're done flying. If they build it right.",
          "meaning": "No more chasing scheduling on the phone to end your day - IF the Company builds the system well. This is an implementation promise, not a self-executing rule.",
          "realterms": null,
          "rating": {
            "nh": "SG",
            "mc": "SG",
            "sr": "SG"
          },
          "chart": null
        },
        {
          "id": "res-bucket",
          "title": "How HRV is handed out",
          "type": "NEW",
          "starts": "First bid month after DOR",
          "delivery": "promise",
          "cond": "reserve",
          "market": null,
          "today": "The same people often get hit with Ready Reserve day after day.",
          "proposed": "A 'bucket' system spreads assignments by how many days you're available.",
          "plain": "Ready Reserve gets spread around fairly instead of hammering the same people over and over - if they set it up the way it's written.",
          "meaning": "The pain gets shared more evenly instead of landing on the same reserves repeatedly - if the new assignment process is implemented as designed.",
          "realterms": null,
          "rating": {
            "nh": "sg",
            "mc": "sg",
            "sr": "sg"
          },
          "chart": null
        },
        {
          "id": "res-pickup",
          "title": "Picking up trips",
          "type": "NEW",
          "starts": "First bid month after DOR",
          "delivery": "automatic",
          "cond": "reserve",
          "market": null,
          "today": "Reserves can't take trips from lineholders.",
          "proposed": "Reserves can pick up full or partial trips from lineholders.",
          "plain": "You can pick up trips off a lineholder now - a new way to grab hours and money you couldn't before.",
          "meaning": "A new way to build hours and money you didn't have before.",
          "realterms": null,
          "rating": {
            "nh": "sg",
            "mc": "sg",
            "sr": "sg"
          },
          "chart": null
        }
      ],
      "verdictByGroup": {
        "nh": {
          "verdict": "Net positive",
          "polarity": "pos",
          "score": 5.25,
          "tally": "4 gains, 0 costs",
          "depCount": 0,
          "addonNotes": [
            "+3 more if the new systems are built well"
          ]
        },
        "mc": {
          "verdict": "About even",
          "polarity": "neu",
          "score": 0.0,
          "tally": "0 gains, 0 costs",
          "depCount": 0,
          "addonNotes": [
            "+5.2 more if reserve",
            "+3 more if reserve & the new systems are built well"
          ]
        },
        "sr": {
          "verdict": "About even",
          "polarity": "neu",
          "score": 0.0,
          "tally": "0 gains, 0 costs",
          "depCount": 0,
          "addonNotes": [
            "+5.2 more if reserve",
            "+3 more if reserve & the new systems are built well"
          ]
        }
      }
    },
    {
      "title": "Your Schedule",
      "anchor": "cat-schedule",
      "topicNote": "How your month gets built: how many landings in a day, trading and dropping trips, and the new bidding system (PBS) that several of these improvements wait on.",
      "webTakeaway": "Bottom line: some genuinely nice fixes here - fewer landings, dropping trips, easier trades, earlier Golden Days. But most of the big ones wait on the new PBS bidding system, and our pilots' rocky rollout is the warning sign. Treat the PBS-dependent wins as 'maybe,' not 'yes.'",
      "netNote": "The banked wins are modest but real (fewer landings, earlier Golden Day awards). The headline items - trip drop and the 40-hour trade floor - are promises gated entirely on PBS, and PBS now carries an evidence-based warning: PSA's own pilots have run it since August 2024 and their union is still fine-tuning it two years later, with pilots reporting more headache than help. The AFA's oversight side letter is a genuine mitigation, but weigh the '+3 if delivered' with real skepticism, and note the timing squeeze: PBS may not be fully live for FAs until year 2 of this 3-year contract.",
      "changes": [
        {
          "id": "sch-landings",
          "title": "Landings per trip",
          "type": "NEW",
          "starts": "First bid month after DOR",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "Up to 7 scheduled landings in a section, up to 9 in actual operation.",
          "proposed": "6 scheduled, 7 in operation.",
          "plain": "Fewer landings packed into a trip - 6 scheduled instead of 7. Less wear on you for the same day.",
          "meaning": "Fewer takeoffs and landings crammed into a duty day — less grind.",
          "realterms": null,
          "rating": {
            "nh": "SG",
            "mc": "SG",
            "sr": "SG"
          },
          "chart": null
        },
        {
          "id": "sch-tripdrop",
          "title": "Dropping trips",
          "type": "NEW",
          "starts": "After PBS is live",
          "delivery": "promise",
          "cond": null,
          "market": null,
          "today": "You cannot drop a trip - the 'straight trip drop' button doesn't exist yet.",
          "proposed": "'Straight trip drop' - you can drop a trip into open time once the new PBS system is live, on the same footing as a trade: seniority bidding first, then first-come-first-served.",
          "plain": "You'd finally be able to drop a trip you can't fly - but only once the new bidding system (PBS) is up and running.",
          "meaning": "Real schedule flexibility you've never had - but it's a PROMISE, not a rule: it only exists once PBS is built and live (possibly year 2 of this 3-year contract), and its usefulness depends on how well PBS is implemented. The written rule (TA 8.5.e): a drop goes into open time first-come-first-served only if it is completed more than 48 hours before the trip departs, minimum reserves are still covered for every affected day, you do not fall below 40 hours of credit, and all other contract limits are met; inside 48 hours it is company discretion; and dropping a trip lowers your monthly guarantee accordingly. Read that language skeptically: pilots working comparable rules have found the trip-drop button close to unusable in practice - thin staffing leaves little open time to drop into, and the wide company discretion lets the system be built to the company's advantage. Value it as a promise, not a rule you can count on.",
          "realterms": null,
          "rating": {
            "nh": "SG",
            "mc": "SG",
            "sr": "SG"
          },
          "chart": null
        },
        {
          "id": "sch-tradefloor",
          "title": "Trade floor",
          "type": "NEW",
          "starts": "After PBS is live",
          "delivery": "promise",
          "cond": null,
          "market": null,
          "today": "You must keep at least 60 hours to trade trips.",
          "proposed": "Lowered to 40 hours (once PBS is live).",
          "plain": "Easier to trade trips: you'd only need to keep 40 hours instead of 60. Again, waits on PBS going live.",
          "meaning": "Easier to trade away trips and reshape your month - but like trip drop, it waits on PBS being built, and inherits PBS's delivery risk. And the paper number oversells the real flexibility: to straight-drop, the grid has to be green on every day of the trip, and who can actually reach it is seniority-split - above-average odds for seniors, below-average for mid-career, and effectively none for juniors, because senior trading and PBS-driven reserve consolidation eat up the open time.",
          "realterms": null,
          "rating": {
            "nh": "sg",
            "mc": "sg",
            "sr": "sg"
          },
          "chart": null
        },
        {
          "id": "sch-golden-timing",
          "title": "When Golden Days are awarded",
          "type": "NEW",
          "starts": "First bid month after DOR",
          "delivery": "automatic",
          "cond": "reserve",
          "market": null,
          "today": "By the 27th of the prior month.",
          "proposed": "By the 22nd.",
          "plain": "You find out your Golden Days five days earlier, so you can make plans sooner.",
          "meaning": "You learn your protected days off earlier, so you can plan sooner.",
          "realterms": null,
          "rating": {
            "nh": "sg",
            "mc": "sg",
            "sr": "sg"
          },
          "chart": null
        },
        {
          "id": "sch-mix",
          "title": "Variety of trips",
          "type": "NEW",
          "starts": "At ratification",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "Company 'will attempt to build a variety of trips.'",
          "proposed": "Company must 'build a mix of trip lengths' (1/2/3/4-day).",
          "plain": "The company would have to build a real mix of trip lengths, not just whatever's easiest for them.",
          "meaning": "Stronger wording, so a real mix is more likely — modest in practice.",
          "realterms": null,
          "rating": {
            "nh": "tk",
            "mc": "tk",
            "sr": "tk"
          },
          "chart": null
        },
        {
          "id": "sch-pbs",
          "title": "How you bid your schedule (PBS)",
          "type": "NEW",
          "starts": "Phased, ~12 months out",
          "delivery": "promise",
          "cond": null,
          "market": null,
          "today": "Current bidding system. Note: PSA's PILOTS already switched to PBS (August 2024) - and nearly two years later, their union is still 'fine-tuning' it, with the permanent rules still not ratified.",
          "proposed": "The same kind of system (likely the same vendor, AD OPT) comes to flight attendants, phased in under an AFA-oversight side letter covering pairing construction and the reserve buffer.",
          "plain": "A whole new way to bid your schedule is coming. Worth knowing: our own pilots switched to this system in 2024 and it's been rough - and a lot of the schedule wins above only kick in once it's working. So this one's a wildcard.",
          "meaning": "The closest real-world evidence we have - PSA's own pilots - points NEGATIVE: a rocky, multi-year implementation that pilots widely describe as more headache than help, with a loss of trading flexibility. ALPA's own materials concede PBS is 'complicated and confusing' and results 'vary greatly' by carrier. Counterweights: the AFA side letter gives the union real oversight (possibly BECAUSE of the pilot experience), the pilots' two years of pain may have worked out some kinks, and seniority tends to fare best under PBS. Rated a wildcard and kept out of the math. Trip drop and the 40-hour trade floor exist only inside this system.",
          "realterms": "Precedent check: same company, sister workgroup, same probable vendor - live since Aug 2024, permanent parameters still unratified as of 2026. The permanent parameters remain unratified nearly two years after go-live.",
          "rating": {
            "nh": "dep",
            "mc": "dep",
            "sr": "dep"
          },
          "chart": null
        }
      ],
      "verdictByGroup": {
        "nh": {
          "verdict": "Modest positive",
          "polarity": "pos",
          "score": 3.25,
          "tally": "3 gains, 0 costs, 1 depends",
          "depCount": 1,
          "addonNotes": [
            "+3 more if the new systems are built well"
          ]
        },
        "mc": {
          "verdict": "Modest positive",
          "polarity": "pos",
          "score": 2.25,
          "tally": "2 gains, 0 costs, 1 depends",
          "depCount": 1,
          "addonNotes": [
            "+3 more if the new systems are built well",
            "+1 more if reserve"
          ]
        },
        "sr": {
          "verdict": "Modest positive",
          "polarity": "pos",
          "score": 2.25,
          "tally": "2 gains, 0 costs, 1 depends",
          "depCount": 1,
          "addonNotes": [
            "+3 more if the new systems are built well",
            "+1 more if reserve"
          ]
        }
      }
    },
    {
      "title": "Time Off, Leave & Health",
      "anchor": "cat-leave",
      "topicNote": "The rules for when life happens - injury, illness, fatigue, and coming back from a leave.",
      "webTakeaway": "Bottom line: small but genuinely good. Every change here helps you when life goes sideways - injured, fatigued, or coming back from leave - and none of it costs you anything. Nothing huge, nothing bad.",
      "netNote": "Modestly positive, but every item only matters when you're in that situation (injured, on leave, fatigued). If none apply to you, this category is effectively a wash.",
      "changes": [
        {
          "id": "leave-wc",
          "title": "Injury (workers' comp) leave",
          "type": "NEW",
          "starts": "At ratification",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "Seniority and longevity keep accruing for up to 3 years while on workers' comp.",
          "proposed": "Up to 4 years.",
          "plain": "If you're hurt on the job, your seniority keeps building for 4 years on workers' comp instead of 3.",
          "meaning": "If you're hurt on the job, you keep building seniority a year longer.",
          "realterms": null,
          "rating": {
            "nh": "sg",
            "mc": "sg",
            "sr": "sg"
          },
          "chart": null
        },
        {
          "id": "leave-fatigue",
          "title": "Fatigue calls",
          "type": "NEW",
          "starts": "At ratification",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "No sick-time coverage tied to an accepted fatigue call.",
          "proposed": "You can use sick time to cover an accepted fatigue call.",
          "plain": "You can finally use your sick time to cover a fatigue call. Calling in fatigued no longer means eating the loss.",
          "meaning": "Calling in fatigued doesn't have to cost you unpaid time.",
          "realterms": null,
          "rating": {
            "nh": "sg",
            "mc": "sg",
            "sr": "sg"
          },
          "chart": null
        },
        {
          "id": "leave-return",
          "title": "Coming back from a leave",
          "type": "NEW",
          "starts": "DOR+2 months",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "Company has up to 30 days to return you to pay status.",
          "proposed": "Shortened to 7 days after your medical documentation and DOT requirements clear.",
          "plain": "Coming back from a leave, the company has 7 days to put you back on payroll instead of dragging it out to 30.",
          "meaning": "You get back on payroll much faster after a leave.",
          "realterms": null,
          "rating": {
            "nh": "sg",
            "mc": "sg",
            "sr": "sg"
          },
          "chart": null
        }
      ],
      "verdictByGroup": {
        "nh": {
          "verdict": "Modest positive",
          "polarity": "pos",
          "score": 3.0,
          "tally": "3 gains, 0 costs",
          "depCount": 0,
          "addonNotes": []
        },
        "mc": {
          "verdict": "Modest positive",
          "polarity": "pos",
          "score": 3.0,
          "tally": "3 gains, 0 costs",
          "depCount": 0,
          "addonNotes": []
        },
        "sr": {
          "verdict": "Modest positive",
          "polarity": "pos",
          "score": 3.0,
          "tally": "3 gains, 0 costs",
          "depCount": 0,
          "addonNotes": []
        }
      }
    },
    {
      "title": "Uniforms & Commuting Costs",
      "anchor": "cat-uniforms",
      "topicNote": "The out-of-pocket stuff: uniform money, and help with the cost of getting to work.",
      "webTakeaway": "Bottom line: a bunch of small quality-of-life wins - allowance covers more, stolen uniforms replaced, a bit of commuter money - and your existing hotel benefit locked in for good. The one catch: new hires can have more taken out for that first uniform. Minor overall, mostly positive.",
      "netNote": "From the life-of-contract standpoint this category is weaker than it first looks: nearly everything here is FIXED DOLLARS ($550 allowance, $25 parking/transit) that erode every year, while the one cost - the $700-to-$1,000 first-uniform deduction - hits new hires up front at full value. For a non-commuting new hire this category is roughly a wash. Commuters still come out ahead. The durable parts are the rules: stolen-uniform replacement, maternity uniforms, alteration rights.",
      "changes": [
        {
          "id": "uni-deduction",
          "title": "First uniform payroll deduction",
          "type": "NEW",
          "starts": "At ratification",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "Company can deduct up to $700 from your pay for your first uniform set.",
          "proposed": "Up to $1,000.",
          "plain": "Heads up if you're new: they can take more out of your first checks for your uniform - up to $1,000 instead of $700.",
          "meaning": "A bigger up-front bite out of a new hire's early paychecks. This is the one clear step backward, and it lands on new hires.",
          "realterms": null,
          "rating": {
            "nh": "RC",
            "mc": "nc",
            "sr": "nc"
          },
          "chart": null
        },
        {
          "id": "uni-allowance",
          "title": "Yearly uniform allowance",
          "type": "NEW",
          "starts": "At ratification",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "$500/year.",
          "proposed": "$550/year.",
          "plain": "Your yearly uniform money goes up $50, to $550. It hasn't kept up with what uniforms actually cost, but it's a bump.",
          "meaning": "A $50 bump - but the $550 is a fixed number for the contract's whole life, so inflation eats the increase back within a couple of years. Real value by 2029: roughly what $500 buys today.",
          "realterms": null,
          "rating": {
            "nh": "tk",
            "mc": "tk",
            "sr": "tk"
          },
          "chart": null
        },
        {
          "id": "uni-shoes",
          "title": "What the allowance covers",
          "type": "NEW",
          "starts": "At ratification",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "Uniform pieces only.",
          "proposed": "Also shoes, pantyhose, tights, and socks.",
          "plain": "Your uniform allowance now covers shoes, hose, tights, and socks too - not just the uniform pieces.",
          "meaning": "More of what you actually buy is covered.",
          "realterms": null,
          "rating": {
            "nh": "sg",
            "mc": "sg",
            "sr": "sg"
          },
          "chart": null
        },
        {
          "id": "uni-stolen",
          "title": "Stolen uniforms",
          "type": "NEW",
          "starts": "At ratification",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "No provision if uniforms are stolen from a crew room.",
          "proposed": "Company replaces pieces stolen from a Company-controlled area.",
          "plain": "If your uniform gets stolen from a crew room, they'll replace it now.",
          "meaning": "You're not out-of-pocket for theft in a crew room.",
          "realterms": null,
          "rating": {
            "nh": "tk",
            "mc": "tk",
            "sr": "tk"
          },
          "chart": null
        },
        {
          "id": "uni-balance",
          "title": "Uniform balance",
          "type": "NEW",
          "starts": "At ratification",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "No easy way to see your allowance balance.",
          "proposed": "Company posts your balance online monthly.",
          "plain": "You can finally check your uniform allowance balance online instead of guessing.",
          "meaning": "You can actually track what you have left to spend.",
          "realterms": null,
          "rating": {
            "nh": "tk",
            "mc": "tk",
            "sr": "tk"
          },
          "chart": null
        },
        {
          "id": "uni-maternity",
          "title": "Maternity uniforms",
          "type": "NEW",
          "starts": "~DOR+30 days",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "No maternity-uniform provision.",
          "proposed": "Borrow maternity uniforms at no charge.",
          "plain": "Maternity uniforms you can borrow, free.",
          "meaning": "No cost for uniforms during pregnancy.",
          "realterms": null,
          "rating": {
            "nh": "sg",
            "mc": "sg",
            "sr": "tk"
          },
          "chart": null
        },
        {
          "id": "uni-alter",
          "title": "Alterations",
          "type": "NEW",
          "starts": "At ratification",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "No reimbursement for alterations after the initial set.",
          "proposed": "Submit receipts for needed alterations if you have allowance credit.",
          "plain": "If you've got allowance left, you can get reimbursed for alterations.",
          "meaning": "Tailoring costs can come out of your allowance.",
          "realterms": null,
          "rating": {
            "nh": "tk",
            "mc": "tk",
            "sr": "tk"
          },
          "chart": null
        },
        {
          "id": "exp-parking",
          "title": "Commuter parking",
          "type": "NEW",
          "starts": "DOR+2 months",
          "delivery": "automatic",
          "cond": "commuter",
          "market": null,
          "today": "No parking reimbursement.",
          "proposed": "$25/month for commuting FAs.",
          "plain": "$25 a month toward parking if you commute.",
          "meaning": "A little help with airport parking - $300/yr, but a fixed dollar figure that loses real value each year of the contract.",
          "realterms": null,
          "rating": {
            "nh": "sg",
            "mc": "sg",
            "sr": "sg"
          },
          "chart": null
        },
        {
          "id": "exp-transit",
          "title": "Public transit",
          "type": "NEW",
          "starts": "At ratification",
          "delivery": "automatic",
          "cond": "commuter",
          "market": null,
          "today": "No transit reimbursement.",
          "proposed": "$25/month for FAs who use public transportation.",
          "plain": "$25 a month if you take public transit to work.",
          "meaning": "Help with transit costs - same caveat: a fixed $25 that inflation shaves every year.",
          "realterms": null,
          "rating": {
            "nh": "sg",
            "mc": "sg",
            "sr": "sg"
          },
          "chart": null
        },
        {
          "id": "exp-hotel",
          "title": "Commuter hotel",
          "type": "CODIFY",
          "starts": "At ratification",
          "delivery": "automatic",
          "cond": "commuter",
          "market": null,
          "today": "You already get up to $250/month for commuter hotels, and the commuter definition is 50 miles — both from a 2022 side letter.",
          "proposed": "Same $250/month and 50-mile rule, now written permanently into the contract.",
          "plain": "The $250/month commuter hotel money and the 50-mile rule you already have get written permanently into the contract - so it can't just disappear. Not new money, but now it's locked in.",
          "meaning": "Not new money — a benefit you already have becomes permanent.",
          "realterms": null,
          "rating": {
            "nh": "nc",
            "mc": "nc",
            "sr": "nc"
          },
          "chart": null
        }
      ],
      "verdictByGroup": {
        "nh": {
          "verdict": "About even",
          "polarity": "neu",
          "score": 1.0,
          "tally": "6 gains, 1 cost",
          "depCount": 0,
          "addonNotes": [
            "+2 more if commuter"
          ],
          "bandEdgeNote": "This lands just under the line between two verdicts (score 1, boundary 1.5) - a small change in one item could tip it either way."
        },
        "mc": {
          "verdict": "Modest positive",
          "polarity": "pos",
          "score": 3.0,
          "tally": "6 gains, 0 costs",
          "depCount": 0,
          "addonNotes": [
            "+2 more if commuter"
          ]
        },
        "sr": {
          "verdict": "Modest positive",
          "polarity": "pos",
          "score": 2.25,
          "tally": "6 gains, 0 costs",
          "depCount": 0,
          "addonNotes": [
            "+2 more if commuter"
          ]
        }
      }
    },
    {
      "title": "Job Protection & Benefits",
      "anchor": "cat-job",
      "topicNote": "Your rights when something goes wrong - discipline, grievances, the board that decides disputes - plus insurance and retirement.",
      "webTakeaway": "Bottom line: the big one is a real fix - a neutral tie-breaker on the board that decides your grievances, so cases can't just deadlock into nothing. A little more 401(k) if you're senior. The only ding is slightly less notice before an investigatory meeting. Net positive, especially long-term.",
      "netNote": "Modestly positive - the stronger grievance board is the real gain, and seniors get more via the 401(k) bump. One swing factor not in the score: the shorter investigatory-meeting notice (7 to 5 days) could cut against you.",
      "changes": [
        {
          "id": "job-grievance",
          "title": "Notice before an investigatory meeting",
          "type": "NEW",
          "starts": "At ratification",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "7 days' notice.",
          "proposed": "5 days' notice.",
          "plain": "You get a little less warning before an investigatory meeting - 5 days instead of 7. Small thing, but it's the one that cuts the wrong way here.",
          "meaning": "The union calls this 'quicker.' But fewer days also means less time to line up union representation before you're questioned — which can cut against you. Genuinely double-edged.",
          "realterms": null,
          "rating": {
            "nh": "dep",
            "mc": "dep",
            "sr": "dep"
          },
          "chart": null
        },
        {
          "id": "job-board",
          "title": "The board that decides disputes (System Board)",
          "type": "NEW",
          "starts": "At ratification",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "A 2-member board (one from each side) that can deadlock.",
          "proposed": "A 3-member board that adds a neutral chairperson, plus a standing panel of 13 named neutrals (with an NMB-supplied list as fallback) and firmer deadlines.",
          "plain": "When you grieve something and it goes to the board, there's finally a neutral third person to break a tie - instead of the two sides just deadlocking and nothing happening.",
          "meaning": "A neutral tiebreaker generally helps FAs win legitimate grievances instead of stalling in a tie. Bigger change than the summary's 'modified to reflect current practice.'",
          "realterms": null,
          "rating": {
            "nh": "SG",
            "mc": "SG",
            "sr": "SG"
          },
          "chart": null
        },
        {
          "id": "job-life",
          "title": "Life insurance",
          "type": "NEW",
          "starts": "DOR+1 month",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "Coverage rounded to the nearest $500.",
          "proposed": "Rounded to the nearest $1,000.",
          "plain": "Your life insurance rounds up to the nearest $1,000 now - a hair more coverage.",
          "meaning": "Slightly higher payout rounding.",
          "realterms": null,
          "rating": {
            "nh": "tk",
            "mc": "tk",
            "sr": "tk"
          },
          "chart": null
        },
        {
          "id": "job-health",
          "title": "Health insurance cost share",
          "type": "NEW",
          "starts": "Unchanged",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "Company/employee premium split by current formula.",
          "proposed": "Formula unchanged.",
          "plain": "Your health insurance costs don't change - same split as today.",
          "meaning": "Your share of premiums is not changing either way.",
          "realterms": null,
          "rating": {
            "nh": "nc",
            "mc": "nc",
            "sr": "nc"
          },
          "chart": null
        },
        {
          "id": "job-401k",
          "title": "401(k) company match",
          "type": "NEW",
          "starts": "First quarter after DOR",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "Match tops out at 4% (at 12+ years).",
          "proposed": "Rises to 5% for FAs with 12+ years.",
          "plain": "If you're at 12+ years, the company puts a bit more into your 401(k) - 5% instead of 4%. Nothing changes under 12 years.",
          "meaning": "More retirement money — but only if you have 12+ years. No change for everyone below that.",
          "realterms": null,
          "rating": {
            "nh": "nc",
            "mc": "nc",
            "sr": "SG"
          },
          "chart": null
        }
      ],
      "verdictByGroup": {
        "nh": {
          "verdict": "Modest positive",
          "polarity": "pos",
          "score": 2.25,
          "tally": "2 gains, 0 costs, 1 depends",
          "depCount": 1,
          "addonNotes": []
        },
        "mc": {
          "verdict": "Modest positive",
          "polarity": "pos",
          "score": 2.25,
          "tally": "2 gains, 0 costs, 1 depends",
          "depCount": 1,
          "addonNotes": []
        },
        "sr": {
          "verdict": "Net positive",
          "polarity": "pos",
          "score": 4.25,
          "tally": "3 gains, 0 costs, 1 depends",
          "depCount": 1,
          "addonNotes": [],
          "bandEdgeNote": "This lands just over the line between two verdicts (score 4.2, boundary 4) - a small change in one item could tip it either way."
        }
      }
    },
    {
      "title": "Union & Contract Length",
      "anchor": "cat-union",
      "topicNote": "The machinery: how union work gets funded, and how long this deal runs (which matters more than it sounds - see the last negotiation's 2.6-year overtime).",
      "webTakeaway": "Bottom line: the company finally helps fund your reps' union work, and you're back at the table in 3 years instead of 5. Sooner is only better if the next round moves faster than the last one - which froze your pay for 2.6 extra years. Nothing here hits your paycheck directly; it's about the union's footing and how soon you get another shot.",
      "netNote": "No real change to your own paycheck - these fund union operations. The 3-year term is a genuine judgment call, now MORE defensible given market context: because PSA settled first and rivals will likely pass its rates, a shorter deal lets PSA catch back up sooner. The risk is re-bargaining quickly from a soon-to-be-middling position, in a softer labor market with less leverage.",
      "changes": [
        {
          "id": "union-fpl",
          "title": "Union release time (Flight Pay Loss)",
          "type": "NEW",
          "starts": "DOR+2 months",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "Company pays 0 hours of union-business leave.",
          "proposed": "Company pays the first 50 hours/month.",
          "plain": "The company covers the first 50 hours a month for union reps to do union work - they paid none before. This funds the union's work, not your paycheck.",
          "meaning": "This funds union officers' paid time for union work. It can improve representation, but it doesn't touch your paycheck — the union frames it as a member benefit.",
          "realterms": null,
          "rating": {
            "nh": "nc",
            "mc": "nc",
            "sr": "nc"
          },
          "chart": null
        },
        {
          "id": "union-pac",
          "title": "FlightPAC deduction",
          "type": "NEW",
          "starts": "DOR+3 months",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "No FlightPAC payroll deduction option.",
          "proposed": "Optional deduction for AFA's political action committee.",
          "plain": "You can now choose to have a little taken from your check for AFA's political fund. Totally optional.",
          "meaning": "Voluntary — only if you opt in.",
          "realterms": null,
          "rating": {
            "nh": "nc",
            "mc": "nc",
            "sr": "nc"
          },
          "chart": null
        },
        {
          "id": "dur-term",
          "title": "Contract length",
          "type": "NEW",
          "starts": "2026",
          "delivery": "automatic",
          "cond": null,
          "market": null,
          "today": "Contracts have typically run ~5 years (and you just lived through a long amendable stretch).",
          "proposed": "A 3-year term (2026-2029).",
          "plain": "This deal runs 3 years instead of 5, so you're back at the table sooner. Good if pay's moved up by then - but only if the next round doesn't drag out like the last one, which froze your pay 2.6 years past due.",
          "meaning": "Back to the table sooner - which matters because peers will likely leapfrog these rates. But weigh it against PSA's own history: the last negotiation took 2.6 YEARS past the amendable date, during which rates stayed frozen. A short term only protects you if deals conclude promptly; 'amendable' is not 'paid.' The provision that would actually fix the delay problem - guaranteed retro pay to the amendable date, which removes the Company's incentive to stall - is not in this contract.",
          "realterms": null,
          "rating": {
            "nh": "dep",
            "mc": "dep",
            "sr": "dep"
          },
          "chart": null
        }
      ],
      "verdictByGroup": {
        "nh": {
          "verdict": "About even",
          "polarity": "neu",
          "score": 0.0,
          "tally": "0 gains, 0 costs, 1 depends",
          "depCount": 1,
          "addonNotes": []
        },
        "mc": {
          "verdict": "About even",
          "polarity": "neu",
          "score": 0.0,
          "tally": "0 gains, 0 costs, 1 depends",
          "depCount": 1,
          "addonNotes": []
        },
        "sr": {
          "verdict": "About even",
          "polarity": "neu",
          "score": 0.0,
          "tally": "0 gains, 0 costs, 1 depends",
          "depCount": 1,
          "addonNotes": []
        }
      }
    }
  ],
  "scoreboard": {
    "intro": "The whole contract at a glance. Each cell is that category's weighted verdict for that group - not a count of changes. Wildcard ('Depends') items and status-dependent items are left OUT of these scores; where they'd matter, a small 'more if...' note is shown.",
    "note_on_dep": "Depends items are counted separately (shown as 'N depends') and never folded into the score.",
    "rows": [
      {
        "topic": "cat-pay",
        "topicTitle": "Your Paycheck",
        "nh": {
          "verdict": "Net positive",
          "polarity": "pos",
          "score": 4.0,
          "tally": "10 gains, 2 costs",
          "depCount": 0,
          "addonNotes": [],
          "bandEdgeNote": "This lands just over the line between two verdicts (score 4, boundary 4) - a small change in one item could tip it either way."
        },
        "mc": {
          "verdict": "Modest positive",
          "polarity": "pos",
          "score": 3.0,
          "tally": "10 gains, 2 costs",
          "depCount": 0,
          "addonNotes": []
        },
        "sr": {
          "verdict": "Modest positive",
          "polarity": "pos",
          "score": 2.25,
          "tally": "10 gains, 2 costs",
          "depCount": 0,
          "addonNotes": []
        }
      },
      {
        "topic": "cat-reserve",
        "topicTitle": "Reserve Life",
        "nh": {
          "verdict": "Net positive",
          "polarity": "pos",
          "score": 5.25,
          "tally": "4 gains, 0 costs",
          "depCount": 0,
          "addonNotes": [
            "+3 more if the new systems are built well"
          ]
        },
        "mc": {
          "verdict": "About even",
          "polarity": "neu",
          "score": 0.0,
          "tally": "0 gains, 0 costs",
          "depCount": 0,
          "addonNotes": [
            "+5.2 more if reserve",
            "+3 more if reserve & the new systems are built well"
          ]
        },
        "sr": {
          "verdict": "About even",
          "polarity": "neu",
          "score": 0.0,
          "tally": "0 gains, 0 costs",
          "depCount": 0,
          "addonNotes": [
            "+5.2 more if reserve",
            "+3 more if reserve & the new systems are built well"
          ]
        }
      },
      {
        "topic": "cat-schedule",
        "topicTitle": "Your Schedule",
        "nh": {
          "verdict": "Modest positive",
          "polarity": "pos",
          "score": 3.25,
          "tally": "3 gains, 0 costs, 1 depends",
          "depCount": 1,
          "addonNotes": [
            "+3 more if the new systems are built well"
          ]
        },
        "mc": {
          "verdict": "Modest positive",
          "polarity": "pos",
          "score": 2.25,
          "tally": "2 gains, 0 costs, 1 depends",
          "depCount": 1,
          "addonNotes": [
            "+3 more if the new systems are built well",
            "+1 more if reserve"
          ]
        },
        "sr": {
          "verdict": "Modest positive",
          "polarity": "pos",
          "score": 2.25,
          "tally": "2 gains, 0 costs, 1 depends",
          "depCount": 1,
          "addonNotes": [
            "+3 more if the new systems are built well",
            "+1 more if reserve"
          ]
        }
      },
      {
        "topic": "cat-leave",
        "topicTitle": "Time Off, Leave & Health",
        "nh": {
          "verdict": "Modest positive",
          "polarity": "pos",
          "score": 3.0,
          "tally": "3 gains, 0 costs",
          "depCount": 0,
          "addonNotes": []
        },
        "mc": {
          "verdict": "Modest positive",
          "polarity": "pos",
          "score": 3.0,
          "tally": "3 gains, 0 costs",
          "depCount": 0,
          "addonNotes": []
        },
        "sr": {
          "verdict": "Modest positive",
          "polarity": "pos",
          "score": 3.0,
          "tally": "3 gains, 0 costs",
          "depCount": 0,
          "addonNotes": []
        }
      },
      {
        "topic": "cat-uniforms",
        "topicTitle": "Uniforms & Commuting Costs",
        "nh": {
          "verdict": "About even",
          "polarity": "neu",
          "score": 1.0,
          "tally": "6 gains, 1 cost",
          "depCount": 0,
          "addonNotes": [
            "+2 more if commuter"
          ],
          "bandEdgeNote": "This lands just under the line between two verdicts (score 1, boundary 1.5) - a small change in one item could tip it either way."
        },
        "mc": {
          "verdict": "Modest positive",
          "polarity": "pos",
          "score": 3.0,
          "tally": "6 gains, 0 costs",
          "depCount": 0,
          "addonNotes": [
            "+2 more if commuter"
          ]
        },
        "sr": {
          "verdict": "Modest positive",
          "polarity": "pos",
          "score": 2.25,
          "tally": "6 gains, 0 costs",
          "depCount": 0,
          "addonNotes": [
            "+2 more if commuter"
          ]
        }
      },
      {
        "topic": "cat-job",
        "topicTitle": "Job Protection & Benefits",
        "nh": {
          "verdict": "Modest positive",
          "polarity": "pos",
          "score": 2.25,
          "tally": "2 gains, 0 costs, 1 depends",
          "depCount": 1,
          "addonNotes": []
        },
        "mc": {
          "verdict": "Modest positive",
          "polarity": "pos",
          "score": 2.25,
          "tally": "2 gains, 0 costs, 1 depends",
          "depCount": 1,
          "addonNotes": []
        },
        "sr": {
          "verdict": "Net positive",
          "polarity": "pos",
          "score": 4.25,
          "tally": "3 gains, 0 costs, 1 depends",
          "depCount": 1,
          "addonNotes": [],
          "bandEdgeNote": "This lands just over the line between two verdicts (score 4.2, boundary 4) - a small change in one item could tip it either way."
        }
      },
      {
        "topic": "cat-union",
        "topicTitle": "Union & Contract Length",
        "nh": {
          "verdict": "About even",
          "polarity": "neu",
          "score": 0.0,
          "tally": "0 gains, 0 costs, 1 depends",
          "depCount": 1,
          "addonNotes": []
        },
        "mc": {
          "verdict": "About even",
          "polarity": "neu",
          "score": 0.0,
          "tally": "0 gains, 0 costs, 1 depends",
          "depCount": 1,
          "addonNotes": []
        },
        "sr": {
          "verdict": "About even",
          "polarity": "neu",
          "score": 0.0,
          "tally": "0 gains, 0 costs, 1 depends",
          "depCount": 1,
          "addonNotes": []
        }
      }
    ]
  },
  "typeLabels": {
    "NEW": "NEW",
    "CODIFY": "KEPT",
    "RESTORE": "RESTORED"
  },
  "marketLabels": {
    "at_market": "AT STANDARD",
    "catch_up": "CATCH-UP",
    "above_market": "ABOVE STANDARD"
  },
  "deliveryLabels": {
    "automatic": "Automatic rule",
    "delayed": "Delayed rule",
    "promise": "Implementation promise"
  },
  "condLabels": {
    "reserve": "if reserve",
    "commuter": "if commuter"
  },
  "placements": [
    "hero",
    "outlook",
    "scoreboard",
    "accountability",
    "cat-pay",
    "cat-reserve",
    "cat-schedule",
    "cat-leave",
    "cat-uniforms",
    "cat-job",
    "cat-union"
  ],
  "sections": {
    "what_this_is": {
      "title": "What this is"
    },
    "preface": {
      "title": "First, the pattern behind every contract",
      "intro": "Understand this before any headline number — it's the stage everything else plays out on."
    },
    "deal_in_one_paragraph": {
      "title": "The deal in one paragraph"
    },
    "how_to_use": {
      "title": "How to use this guide"
    },
    "outlook": {
      "title": "The big picture: your pay vs. the cycle",
      "intro": "Here is that freeze-and-catch-up cycle in your actual numbers — base pay against the cost of living over the life of the deal. Everything after this is the detail behind this one picture."
    },
    "anchors": {
      "title": "How we judge every change",
      "intro": "Seven principles behind every rating in this guide."
    },
    "key": {
      "title": "The key: ratings & tags",
      "intro": "Reference for the chips and tags used throughout — come back to it whenever you want the exact meaning."
    },
    "scoreboard": {
      "title": "The whole contract at a glance",
      "intro": "The whole contract at a glance. Each cell is that category's weighted verdict for that group - not a count of changes. Wildcard ('Depends') items and status-dependent items are left OUT of these scores; where they'd matter, a small 'more if...' note is shown."
    },
    "topics": {
      "title": "What changes, topic by topic"
    },
    "market_reality": {
      "title": "Market reality check",
      "intro": "How this deal looks against inflation, comparable employers, and what was winnable."
    },
    "accountability": {
      "title": "Union accountability",
      "intro": "Separating what the union won from what the market was going to force anyway - and what was left on the table."
    },
    "glossary": {
      "title": "Plain-language glossary",
      "intro": "Contract terms, in everyday words."
    }
  },
  "tables": [
    {
      "id": "pay_scale_comparison",
      "register": "pdf",
      "placement": "cat-pay",
      "title": "The full pay scale: today, proposed, and the defended structure",
      "leadIn": "Every rung, three ways: what you earn today, what the TA proposes, and what the same $29.77 starting rate would pay if the old ladder's shape had been kept. The gap in the last column is the structural concession.",
      "columns": [
        "Years of service",
        "Today ($/hr)",
        "Proposed ($/hr)",
        "Defended structure ($/hr)"
      ],
      "rows": [
        [
          "0-6mo",
          "$27.06",
          "$29.77",
          "$29.77"
        ],
        [
          "7-12mo",
          "$27.06",
          "$29.77",
          "$31.34"
        ],
        [
          "1yr",
          "$27.06",
          "$29.77",
          "$37.21"
        ],
        [
          "2yr",
          "$27.06",
          "$29.77",
          "$39.96"
        ],
        [
          "3yr",
          "$28.93",
          "$31.82",
          "$42.72"
        ],
        [
          "4yr",
          "$30.74",
          "$33.81",
          "$45.39"
        ],
        [
          "5yr",
          "$31.84",
          "$35.02",
          "$47.02"
        ],
        [
          "6yr",
          "$33.43",
          "$36.77",
          "$49.37"
        ],
        [
          "7yr",
          "$34.86",
          "$38.35",
          "$51.48"
        ],
        [
          "8yr",
          "$36.10",
          "$39.71",
          "$53.31"
        ],
        [
          "9yr",
          "$37.15",
          "$40.87",
          "$54.86"
        ],
        [
          "10yr",
          "$38.19",
          "$42.01",
          "$56.39"
        ],
        [
          "11yr",
          "$39.21",
          "$43.13",
          "$57.90"
        ],
        [
          "12yr",
          "$39.87",
          "$43.86",
          "$58.88"
        ],
        [
          "13yr",
          "$40.86",
          "$44.95",
          "$60.34"
        ],
        [
          "14yr",
          "$41.39",
          "$45.53",
          "$61.12"
        ],
        [
          "15yr",
          "$41.92",
          "$46.11",
          "$61.90"
        ],
        [
          "16yr",
          "$42.45",
          "$46.70",
          "$62.69"
        ],
        [
          "17yr",
          "$42.98",
          "$47.28",
          "$63.47"
        ],
        [
          "18yr",
          "$43.51",
          "$47.86",
          "$64.25"
        ]
      ],
      "footnote": "Defended structure = the pre-2022 relative ladder re-anchored to the new $29.77 floor. Every rung from the 2-year mark on sits 25.5% below it - the uniform gap is the sign the raised floor was funded entirely out of the scale's shape."
    },
    {
      "id": "raise_timeline",
      "register": "both",
      "placement": "cat-pay",
      "title": "When the money actually arrives",
      "leadIn": "The headline number lands over several years - and some of it never catches up to prices.",
      "columns": [
        "Date",
        "What changes"
      ],
      "rows": [
        [
          "2026",
          "+10% on all rates, plus retro pay to the amendable date"
        ],
        [
          "2027",
          "Boarding pay begins (50% of rate); +1.5% on scale"
        ],
        [
          "2028",
          "+1.5% on scale; min-day rises to 3.75 hrs; deadhead to 75%"
        ],
        [
          "2029",
          "Contract amendable - rates freeze until the next deal is ratified"
        ]
      ],
      "footnote": "The last negotiation ran 2.6 years past the date the contract could be reopened with pay frozen the whole time."
    },
    {
      "id": "boarding_pay_monthly",
      "register": "both",
      "placement": "cat-pay",
      "title": "Boarding pay: what it's actually worth per month",
      "leadIn": "Boarding pay in concrete dollars, by where you are on the scale.",
      "columns": [
        "Your group",
        "Boardings/mo",
        "Per boarding",
        "Per month",
        "Per year"
      ],
      "rows": [
        [
          "Junior",
          "35–40",
          "$7.44",
          "$260–298",
          "$3,126–3,572"
        ],
        [
          "Mid-career",
          "30–35",
          "$9.93",
          "$298–347",
          "$3,574–4,170"
        ],
        [
          "Senior",
          "30–35",
          "$11.96",
          "$359–419",
          "$4,307–5,025"
        ]
      ],
      "footnote": "50% of your hourly rate × the scheduled boarding time, per boarding. Assumes a 30-minute scheduled boarding — confirm against the final contract language, which we could not verify. Real recurring money, and the reason total compensation beats inflation by year two.",
      "afterItem": "pay-boarding"
    },
    {
      "id": "boarding_rate_vs_market",
      "register": "both",
      "placement": "cat-pay",
      "title": "The 50% rate, against the market",
      "leadIn": "Every US carrier's boarding pay is 50%. Where the rate is heading differs.",
      "columns": [
        "Airline",
        "Boarding rate",
        "Direction"
      ],
      "rows": [
        [
          "Delta (2022, first to add it)",
          "50%",
          "flat"
        ],
        [
          "American, Alaska, United",
          "50%",
          "flat"
        ],
        [
          "PSA (this TA)",
          "50%",
          "flat for the full 3-year term"
        ],
        [
          "Air Canada (2025)",
          "50% → 70%",
          "escalates by 2028"
        ],
        [
          "What FAs are bargaining for",
          "100%",
          "not won anywhere yet"
        ]
      ],
      "footnote": "PSA matches the industry-standard rate — but timing matters: Delta introduced boarding pay at 50% in 2022, so PSA arriving at the same 50% in 2027 is matching a standard that will be five years old, at a moment the frontier has already moved (Air Canada escalates to 70% by 2028; the open demand is 100%). Two more things the rate doesn't show: (1) it's 50% of a lower base — PSA's hourly is well below mainline, so PSA members work more boardings for fewer dollars each; that's also why boarding pay is a bigger share of a PSA paycheck than a mainline one — a smaller denominator, not a bigger benefit. (2) PSA's 50% is flat for the whole term, with no built-in yearly step-up.",
      "afterItem": "pay-boarding"
    },
    {
      "id": "regional_entry_rates",
      "register": "both",
      "placement": "market_reality",
      "afterCard": "peer_benchmark",
      "title": "Regional new-hire rates, what we can source",
      "leadIn": "Starting hourly pay at the regionals with public numbers.",
      "columns": [
        "Airline",
        "New-hire rate",
        "Status"
      ],
      "rows": [
        [
          "PSA (this TA)",
          "$29.77",
          "proposed"
        ],
        [
          "Endeavor (Delta regional)",
          "$26.23",
          "in effect Apr 2026"
        ],
        [
          "Envoy (AA sibling)",
          "$29.73",
          "current - bargains next"
        ],
        [
          "Piedmont (AA sibling)",
          "$28.08",
          "current - bargains next"
        ]
      ],
      "footnote": "Envoy already sits at $29.73 - just 4 CENTS under PSA's proposed $29.77 - and Piedmont at $28.08. So PSA's #1 spot is real today but nominal, and likely temporary: these American-owned siblings bargain next, off these numbers."
    }
  ],
  "charts": [
    {
      "id": "pay_vs_prices",
      "kind": "step",
      "placement": "outlook",
      "scope": "all",
      "verdict": "REAL-TERMS PAY CUT",
      "headline": "Prices climb every year; your pay freezes, leaps once to catch up, then freezes again - each leap starting from a deeper hole, so the gap compounds over a career (~11% less buying power by the next contract). Because pay stays frozen at the old rate until a new deal is ratified, a longer negotiation costs the Company nothing in wages. The provision that would offset that - guaranteed retro pay back to the amendable date - is not in this deal, and it was winnable: it simply removes the Company's reason to stall, since a longer fight already saves them wage money.",
      "plainCaption": "Your pay goes up a little; prices go up more, and the gap is money quietly leaving your pocket - about 11% less buying power by the time the next contract's due. Worse: your pay stays frozen at the old rate until a new deal is signed, so the company actually saves money by dragging out the next round - the gap gives them a reason to stall. There's no guaranteed back-pay here to take that reason away.",
      "polarity": "neg",
      "leadIn": "The cycle above, in your actual numbers. Base pay against the cost of living over the life of the deal (base pay only — boarding pay and your yearly seniority step are judged separately). Watch the gap: that's the ground the freeze takes, and what a raise has to climb back before it's a real gain.",
      "axes": {
        "x": {
          "label": "Year",
          "ticks": [
            2023,
            2024,
            2025,
            2026,
            2027,
            2028,
            2029,
            2030,
            2031,
            2032
          ],
          "showAllTicks": true
        },
        "y": {
          "label": "Indexed to 100 = 2023 buying power",
          "min": 100,
          "max": 135
        }
      },
      "series": [
        {
          "name": "Your base pay",
          "role": "subject",
          "values": [
            100,
            100,
            100,
            110.0,
            111.65,
            113.3,
            113.3,
            113.3,
            113.3,
            113.3
          ]
        },
        {
          "name": "Prices (cost of living)",
          "role": "reference",
          "values": [
            100.0,
            103.0,
            106.1,
            109.3,
            112.6,
            115.9,
            119.4,
            123.0,
            126.7,
            130.5
          ]
        }
      ],
      "render": {
        "numberFormat": "index",
        "valueLabels": "endpoints",
        "gridlines": "horizontal-only",
        "legend": "top-right",
        "emphasis": "Prices (cost of living)",
        "seriesOrder": [
          "Your base pay",
          "Prices (cost of living)"
        ]
      },
      "assumptions": "indexed to 100 = 2023 buying power (the last amendable date); prices ~3%/yr; pay frozen 2023-26, +10% at ratification, +1.5%/+1.5% (2027/28), frozen again after the 2029 amendable date (2.6-yr lag precedent); base rate only - boarding pay and longevity steps judged separately",
      "freezeStartYear": 2023,
      "shadeGap": {
        "between": [
          "Prices (cost of living)",
          "Your base pay"
        ],
        "label": "THE GAP - buying power you never get back"
      },
      "annotations": [
        {
          "at": 2024.5,
          "series": "Your base pay",
          "text": "FROZEN 2023-26 - prices climb +8%, pay flat"
        },
        {
          "at": 2026,
          "series": "Your base pay",
          "text": "+10% catch-up (this TA)"
        },
        {
          "at": 2027,
          "series": "Your base pay",
          "text": "+1.5%"
        },
        {
          "at": 2028,
          "series": "Your base pay",
          "text": "+1.5%, then frozen"
        },
        {
          "at": 2029,
          "series": "Prices (cost of living)",
          "text": "amendable 2029 - freeze begins again"
        }
      ]
    },
    {
      "id": "pay_structure_concession",
      "kind": "multi_line",
      "placement": "accountability",
      "scope": "all",
      "verdict": "THE STRUCTURAL CONCESSION",
      "headline": "Every FA from year 1 up sits exactly 25.5% below what a defended structure (old ladder re-anchored to the $29.77 floor) would pay - roughly $10-15k/yr at guarantee, seniors most in dollars. Measures the concession, NOT a cut to current checks; full preservation was likely unwinnable ($64.25 top exceeds every regional), but zero restoration was a choice this TA ratifies permanently.",
      "plainCaption": "Same starting pay, two ways to build the ladder. The dotted line is what every step would pay if they'd raised the floor AND kept the old ladder; the solid line is what you actually get. Every experienced FA sits about 25% below that dotted line - that gap is what funding the raise 'out of the ladder' cost you.",
      "polarity": "neg",
      "leadIn": "And here's what raising the starting wage the way they did actually cost: compare the new table against what the same starting wage would pay if the old ladder had been kept:",
      "axes": {
        "x": {
          "label": "Years of service",
          "ticks": [
            "0-6mo",
            "7-12mo",
            "1yr",
            "2yr",
            "3yr",
            "4yr",
            "5yr",
            "6yr",
            "7yr",
            "8yr",
            "9yr",
            "10yr",
            "11yr",
            "12yr",
            "13yr",
            "14yr",
            "15yr",
            "16yr",
            "17yr",
            "18yr"
          ],
          "showAllTicks": true
        },
        "y": {
          "label": "$/hr",
          "max": 70
        }
      },
      "series": [
        {
          "name": "Defended structure: old ladder re-anchored to $29.77",
          "role": "defended",
          "values": [
            29.77,
            31.34,
            37.21,
            39.96,
            42.72,
            45.39,
            47.02,
            49.37,
            51.48,
            53.31,
            54.86,
            56.39,
            57.9,
            58.88,
            60.34,
            61.12,
            61.9,
            62.69,
            63.47,
            64.25
          ]
        },
        {
          "name": "Actual new table (what the TA locks in)",
          "role": "subject",
          "values": [
            29.77,
            29.77,
            29.77,
            29.77,
            31.82,
            33.81,
            35.02,
            36.77,
            38.35,
            39.71,
            40.87,
            42.01,
            43.13,
            43.86,
            44.95,
            45.53,
            46.11,
            46.7,
            47.28,
            47.86
          ]
        }
      ],
      "render": {
        "numberFormat": "dollars",
        "valueLabels": "endpoints",
        "gridlines": "horizontal-only",
        "legend": "top-left",
        "emphasis": "Actual new table (what the TA locks in)",
        "seriesOrder": [
          "Defended structure: old ladder re-anchored to $29.77",
          "Actual new table (what the TA locks in)"
        ]
      },
      "assumptions": "defended = old 2019 relative structure x (29.77/20.16); ~$/yr figures use a 75-hour monthly guarantee, illustrative",
      "shadeGap": {
        "between": [
          "Defended structure: old ladder re-anchored to $29.77",
          "Actual new table (what the TA locks in)"
        ],
        "label": "the gap"
      },
      "annotations": [
        {
          "series": "Actual new table (what the TA locks in)",
          "at": "2yr",
          "text": "from here up: exactly 25.5% below, at every single step"
        },
        {
          "series": "Actual new table (what the TA locks in)",
          "at": "18yr",
          "text": "top of scale: $47.86 vs $64.25 - short $16.39/hr"
        }
      ],
      "placementNote": "Union accountability section; also linked from the flattened-ladder item"
    },
    {
      "id": "pay_progression_relative",
      "kind": "line",
      "placement": "cat-pay",
      "scope": "all",
      "verdict": "CAREER PAY LADDER ~25% FLATTER, LOCKED IN",
      "headline": "Relative pay growth over a career, each ladder indexed to its own starting rate. The old ladder multiplied your pay to 2.16x your start; the current/new flat-bottom ladder reaches only 1.61x - about 25% flatter. The gap was created by the 2022 hiring side letter (not this TA), but this TA applies a flat +10% on top and makes the flattened shape PERMANENT.",
      "plainCaption": "This shows how much your pay grows over a whole career, not the dollar amounts. The old ladder more than doubled your starting pay (2.16x). The new one only reaches 1.61x - a flatter climb. You still get raises, but the career grows about a quarter less than it used to. Only people hired into the flat bottom walk this flatter ladder; anyone already past year 3 kept their old early raises.",
      "polarity": "neg",
      "leadIn": "How much your pay grows across a whole career - old ladder vs the new one.",
      "axes": {
        "x": {
          "label": "Years of service",
          "ticks": [
            "0-6mo",
            "7-12mo",
            "1yr",
            "2yr",
            "3yr",
            "4yr",
            "5yr",
            "6yr",
            "7yr",
            "8yr",
            "9yr",
            "10yr",
            "11yr",
            "12yr",
            "13yr",
            "14yr",
            "15yr",
            "16yr",
            "17yr",
            "18yr"
          ],
          "showAllTicks": true
        },
        "y": {
          "label": "$/hr",
          "max": 70
        }
      },
      "series": [
        {
          "name": "Old ladder (steeper)",
          "role": "reference",
          "values": [
            29.77,
            31.34,
            37.21,
            39.96,
            42.72,
            45.39,
            47.02,
            49.37,
            51.48,
            53.31,
            54.86,
            56.39,
            57.9,
            58.88,
            60.34,
            61.12,
            61.9,
            62.69,
            63.47,
            64.25
          ]
        },
        {
          "name": "New ladder (flatter)",
          "role": "subject",
          "values": [
            29.77,
            29.77,
            29.77,
            29.77,
            31.82,
            33.81,
            35.02,
            36.77,
            38.35,
            39.71,
            40.87,
            42.01,
            43.13,
            43.86,
            44.95,
            45.53,
            46.11,
            46.7,
            47.28,
            47.86
          ]
        }
      ],
      "render": {
        "numberFormat": "dollars",
        "valueLabels": "endpoints",
        "gridlines": "horizontal-only",
        "legend": "top-left",
        "emphasis": "New ladder (flatter)",
        "seriesOrder": [
          "Old ladder (steeper)",
          "New ladder (flatter)"
        ]
      },
      "assumptions": "each ladder indexed to its OWN starting rate = 100 (isolates career growth shape, removes the higher-floor effect); base rate; old = pre-2022 shape, new = flat-bottom scale",
      "shadeGap": {
        "between": [
          "Old ladder (steeper)",
          "New ladder (flatter)"
        ],
        "label": "the raise progression you lose"
      },
      "annotations": [
        {
          "at": "1yr",
          "series": "New ladder (only 1.61x)",
          "text": "flat years 0-2: no early raises"
        },
        {
          "at": "9yr",
          "series": "Old ladder (grew to 2.16x)",
          "text": "gap created by 2022 side letter; this TA locks it in"
        }
      ],
      "units": [
        {
          "key": "multiple",
          "label": "Multiple of your starting pay",
          "axisLabel": "Pay as % of your own starting rate",
          "numberFormat": "percent-of-start",
          "indexTo": "first",
          "default": false
        },
        {
          "key": "dollars",
          "label": "Dollars per hour",
          "axisLabel": "$/hr",
          "numberFormat": "dollars",
          "default": true
        }
      ]
    },
    {
      "id": "pay_raise_by_step",
      "kind": "bar_grouped",
      "placement": "cat-pay",
      "scope": "all",
      "verdict": "THE FLATTENING: EARLY RAISES ERASED",
      "headline": "The raise you get at each step up, old shape vs new. All the loss is in years 0-2: the old shape's +5.3%/+18.8%/+7.4% early raises became 0%/0%/0%. The first raise doesn't come until the 3-year mark, and every rung from year 3 on is identical between old and new.",
      "plainCaption": "Each pair of bars is the raise you get moving from one step to the next. The first few bars: the old shape gave real early raises; the new one gives zero there. That's where the flattening is - and it never comes back.",
      "polarity": "neg",
      "leadIn": "The raise you get at each step up (all the loss is in years 0-2; first raise at year 3; identical after).",
      "axes": {
        "x": {
          "label": "Years of service",
          "ticks": [
            "0-6mo",
            "7-12mo",
            "1yr",
            "2yr",
            "3yr",
            "4yr",
            "5yr",
            "6yr",
            "7yr",
            "8yr",
            "9yr",
            "10yr",
            "11yr",
            "12yr",
            "13yr",
            "14yr",
            "15yr",
            "16yr",
            "17yr",
            "18yr"
          ],
          "showAllTicks": true
        },
        "y": {
          "label": "% raise moving to this step",
          "min": 0,
          "max": 20
        }
      },
      "series": [
        {
          "name": "Old shape",
          "role": "reference",
          "values": [
            0.0,
            5.3,
            18.8,
            7.4,
            6.9,
            6.3,
            3.6,
            5.0,
            4.3,
            3.6,
            2.9,
            2.8,
            2.7,
            1.7,
            2.5,
            1.3,
            1.3,
            1.3,
            1.2,
            1.2
          ]
        },
        {
          "name": "New shape",
          "role": "subject",
          "values": [
            0.0,
            0.0,
            0.0,
            0.0,
            6.9,
            6.3,
            3.6,
            5.0,
            4.3,
            3.5,
            2.9,
            2.8,
            2.7,
            1.7,
            2.5,
            1.3,
            1.3,
            1.3,
            1.2,
            1.2
          ]
        }
      ],
      "render": {
        "numberFormat": "percent",
        "valueLabels": "none",
        "gridlines": "horizontal-only",
        "legend": "top-right",
        "emphasis": "New shape",
        "seriesOrder": [
          "Old shape",
          "New shape"
        ]
      },
      "assumptions": "step-to-step percentage raise; old = pre-2022 shape, new = flat-bottom scale (rungs 3-18 identical); base rate",
      "highlightRange": {
        "xIndexes": [
          1,
          2,
          3
        ],
        "style": "shade",
        "label": "these step raises were removed"
      }
    }
  ],
  "marketCards": [
    {
      "id": "inflation",
      "title": "Inflation",
      "register": "web",
      "placement": "outlook",
      "body": "Your pay was frozen from mid-2023 to 2026 while prices rose roughly 8-9%. Unbundle the headline number: the +10% raise REPAIRS that hole (about 1-1.5% left over), and the +1.5% steps in 2027-28 will likely trail inflation (running ~4.2% in 2026) - so base rates end this contract with roughly the purchasing power they had in 2023, possibly slightly less. The PROGRESS in this deal is boarding pay: the only economically new income, and the reason total compensation genuinely beats inflation by year two. In plain terms: the raise makes you whole; boarding pay is what makes you better off. The deal's economic case therefore rests on boarding pay and the rule changes rather than on the headline raise."
    },
    {
      "id": "peer_benchmark",
      "title": "Vs. comparable contracts — today",
      "register": "web",
      "placement": "market_reality",
      "marketVerdict": {
        "label": "Ahead of market",
        "tone": "pos"
      },
      "callout": "#1 today",
      "bullets": [
        "PSA's $29.77 start leads regionals with public rates today",
        "Beats Endeavor ($26.23) and leads Envoy ($29.73) by 4 cents and Piedmont ($28.08) by $1.69",
        "The union's #1 table is accurate right now"
      ],
      "bodyLong": "PSA's proposed new-hire rate ($29.77) sits at the top of the regional pack — but only just, and the lead is narrow. Sourced regional entry rates: PSA $29.77 (this TA), Envoy $29.73 (American regional, 2026), Endeavor $26.23 (Delta regional, eff. April 2026). PSA edges Envoy by 4 cents and clears Endeavor by ~$3.50. So the union's \"#1 at most steps\" is accurate today, but the margin over the nearest American-family regional is essentially a rounding error — and these peers bargain next, off PSA's number as their floor."
    },
    {
      "id": "bargaining_sequence",
      "title": "Vs. comparable contracts — tomorrow",
      "register": "web",
      "placement": "market_reality",
      "marketVerdict": {
        "label": "Ahead · already behind",
        "tone": "mix"
      },
      "callout": "#1 now, likely temporary",
      "bullets": [
        "PSA is the FIRST regional to settle this round",
        "Envoy, Piedmont, Endeavor bargain next — off PSA's number",
        "Later movers usually leapfrog, so #1 is likely temporary",
        "The short 3-year term means PSA gets back to the table sooner"
      ],
      "bodyLong": "But PSA is the FIRST regional to settle this round. Envoy, Piedmont, Horizon, and Endeavor all bargain next, using PSA as their floor - and later movers usually leapfrog. PSA's #1 ranking is real now but probably temporary. (This is also why the 3-year term cuts both ways: a shorter deal lets PSA get back to the table to catch up if peers pass them.)"
    },
    {
      "id": "labor_market",
      "title": "Bargaining leverage",
      "register": "web",
      "placement": "market_reality",
      "marketVerdict": {
        "label": "Undetermined",
        "tone": "neu"
      },
      "callout": "soft market vs 2022",
      "bullets": [
        "The 2022 FA shortage is over; carriers paused hiring",
        "Bargaining leverage is weaker than in 2022",
        "A leading deal in a soft market reads better than in isolation"
      ],
      "bodyLong": "The 2022 flight attendant shortage is over - major carriers have paused FA hiring and applicant supply is high. Bargaining leverage is weaker than in 2022, and American's finances are strained. Getting a leading regional deal in a soft market is a more respectable result than it looks in isolation - and it makes the permanent pay floor more valuable, since a loose market is when a company would most want the freedom to cut junior rates."
    },
    {
      "id": "enforcement",
      "title": "Rules vs. promises",
      "register": "pdf",
      "placement": "anchors",
      "body": "Not all 'wins' are equally bankable. Pay rates, caps, and notice periods are self-executing: the date arrives, the rule applies, and a violation is an easy grievance. But several quality-of-life items (auto check-in, the HRV bucket system, and everything gated on PBS - trip drop, the 40-hour trade floor) are construction projects: their value depends on the Company building them properly. The Implementation LOA provides expedited arbitration (heard in 15 days, decided in 30) against NON-delivery, but a poorly built system still 'complies.' Note the timing squeeze: PBS may not be fully live until year 2 of this 3-year contract, so its dependent benefits could exist for barely a year before everything is renegotiated."
    },
    {
      "id": "precedent",
      "title": "Precedent check on new systems",
      "register": "web",
      "placement": "sch-pbs",
      "body": "New systems deserve a precedent check, and this TA's biggest one fails it so far: PSA's pilots implemented PBS (the same kind of system, likely the same AD OPT vendor) in August 2024 - and as of 2026 their union is still 'fine-tuning' procedures with the permanent parameters unratified, while pilot sentiment describes it as more headache than problem-solver. ALPA's own PBS materials concede the software is 'complicated and confusing' and that results 'vary greatly' by carrier. What this means for the vote: treat every benefit gated on PBS (trip drop, 40-hour trade floor) as carrying that precedent risk, and treat the AFA's PBS oversight side letter as the key safeguard to scrutinize."
    },
    {
      "id": "forward_protection",
      "title": "Forward protection",
      "register": "pdf",
      "placement": "outlook",
      "body": "A contract's rates must survive not just its term but its term PLUS the next negotiation lag - under the Railway Labor Act, old rates stay frozen after the amendable date until a new deal is ratified. PSA's own history sets the lag: the last contract went amendable July 2023 and the replacement wasn't voted until March 2026 - 2.6 years of freeze. If that repeats, these rates must live from March 2026 to roughly late 2031, protected by just two 1.5% bumps after the initial catch-up (~3% total) against a projected ~15-18% of inflation. That's roughly 11% of purchasing power eroded by the time the NEXT deal lands (the figure the pay-vs-prices chart shows) - a deeper hole than the 8-9% this deal repairs. The pattern is a cycle: freeze, catch-up raise, slow erosion, deeper freeze. Two things break it: back-year raises that match expected inflation (~3%+/yr, vs the 1.5% here), or guaranteed retroactivity to the amendable date - which removes the Company's financial incentive to stall negotiations. This TA has neither; the short 3-year term is the union's partial answer, but 'back to the table sooner' only helps if the table produces a deal promptly. Amendable is not the same as paid."
    },
    {
      "id": "entry_rate_forcing",
      "title": "Junior pay: market-forced, not a gift",
      "register": "web",
      "placement": "market_reality",
      "marketVerdict": {
        "label": "Catch-up · at market",
        "tone": "neu"
      },
      "callout": "$20 -> $29.77",
      "bullets": [
        "The floor moved because a regional can't hire at $20 when mainline starts $36",
        "2022 side letter already hauled it to $27.06 just to keep hiring (peers Envoy $29.73, Piedmont $28.08 are already higher)",
        "Market-forced repricing, not a discretionary gift"
      ],
      "bodyLong": "The junior pay increases are competitive necessity, not generosity. PSA's true 2019 entry rate was ~$20/hr; a 2022 side letter had to haul the floor to $27.06 just to keep hiring. By 2025-26 the market: Endeavor (Delta regional) $26.23 start, and mainline far above - American $36.81, Delta $35+, United $36.92. A regional hiring at $20 is a non-starter, so the floor moves are the company repricing labor to stay able to recruit. The flattened bottom four rungs (a cost-saver that erases early step progression) travel with it. Frame junior 'wins' accordingly: real money in pocket, but market-forced and structured to serve hiring costs."
    },
    {
      "id": "relative_progression",
      "title": "The pay raise in relative terms",
      "register": "pdf",
      "placement": "cat-pay",
      "body": "The pay raise must be read in relative terms. Absolute: every step up about 10%, career dollars ~+12%. Relative: the old scale multiplied your pay to 2.16x your start over a career; the new flat-bottom scale reaches only 1.61x - a permanent ~25% flattening of the progression curve, concentrated in years 0-3 (raises of +5.3%/+18.8%/+7.4% replaced by 0%/0%/0%) and never recovered. It is a career-ladder change, so it reaches every FA - what differs is WHEN you feel it. Future hires and current sub-3-year FAs walk the flat bottom itself. Everyone above the floor keeps their existing step raises (rungs 3-18 are unchanged), but the pay value of their seniority is permanently compressed, and because every future scale is built on this shape, later floor increases lift the bottom without lifting them."
    },
    {
      "id": "personal_outlooks",
      "title": "Your pay outlook, from your position",
      "register": "pdf",
      "placement": "outlook",
      "body": "What the BASE RATE alone does to real buying power from each position, one item at a time (other pay items are assessed separately): NEW HIRE - real buying power falls below hire-day level for two years (flat rungs plus sub-inflation raises), recovers at the year-3 step, +4.5% by 2031. MID-CAREER - +6.6% by 2031, carried by longevity steps that were already owed under the old contract. SENIOR - declines every year after the catch-up, -11% by 2031, with nothing in the contract to stop it. All figures from the union's own published columns."
    },
    {
      "id": "union_accountability",
      "title": "Union accountability: catch-up or genuine wins?",
      "register": "web",
      "placement": "market_reality",
      "marketVerdict": {
        "label": "Catch-up · at market",
        "tone": "neu"
      },
      "callout": "0 benchmarks beaten",
      "bullets": [
        "Boarding pay and the floor are catch-up — the company following the industry",
        "The +10% restores at-standard rates as a temporary first-mover",
        "Nothing researched here beats the prevailing standard",
        "See the structural-concession chart for what it cost"
      ],
      "bodyLong": "The market-position tags exist to answer one question: did the union win anything the market wasn't going to force anyway? On every benchmark researched for this deal, the answer is no - boarding pay and the pay floor are CATCH-UP (the company following the industry to stay staffed), and the +10% level restores AT-STANDARD rates as a temporary first-mover. Nothing researched here exceeds the prevailing standard (the 'brag test': meaningfully above the norm, not 2% over one regional for one bargaining cycle). Work rules (HRV cap, trade floor, etc.) have NOT yet been benchmarked against peer contracts - that comparison would complete the accountability picture. A net benefit to you can still be nothing to credit the union for; both things are true and this deal is mostly that. THE DEFINING STRUCTURAL ENTRY: run the old ladder at the new $29.77 floor and every FA from the 2-year step on sits exactly 25.5% below it (~$10-15k/yr at guarantee) - the market-forced floor was funded 100% out of the pay structure, and future market-driven floor raises will no longer lift the scale, only compress it further. Fair context: full preservation ($64.25 top) exceeds every regional's top rate and was likely unwinnable - but even partial re-steepening would have returned dollars at every rung, and zero restoration is what this TA makes permanent."
    }
  ],
  "glossary": [
    [
      "Continuous Duty Overnight",
      "A trip that flies late evening and early morning with a short overnight in between — you're on duty the whole time. Also called a 'standup' or CDO."
    ],
    [
      "Ready Reserve",
      "A reserve day spent at or near the airport, ready to fly on very short notice. Also called HRV — the most disruptive kind of reserve day."
    ],
    [
      "Golden Days",
      "Protected days off a reserve FA cannot be junior-assigned or contacted on."
    ],
    [
      "System Board",
      "The System Board of Adjustment — the panel that decides grievances the union and company can't settle."
    ],
    [
      "side letter",
      "A separate signed agreement outside the main contract. It can expire or be changed more easily than contract language."
    ],
    [
      "Flight Pay Loss",
      "Pay covering a union rep's time away from flying to do union work. Abbreviated FPL."
    ],
    [
      "retro pay",
      "Back pay covering the period since raises should have taken effect."
    ],
    [
      "junior-assigned",
      "Forced to work on a day off because you're the least senior FA available."
    ],
    [
      "top of scale",
      "The highest pay step — no more automatic longevity raises after this."
    ],
    [
      "step-up",
      "Your automatic yearly raise for gaining another year of service. Also called a longevity step."
    ],
    [
      "longevity step",
      "Your automatic yearly raise for gaining another year of service."
    ],
    [
      "bid period",
      "The monthly scheduling window you bid for."
    ],
    [
      "per diem",
      "Hourly expense money paid while you're away on a trip."
    ],
    [
      "carve-out",
      "An exception written into a rule that reduces a paid minimum in certain situations."
    ],
    [
      "lineholder",
      "An FA awarded a monthly schedule of trips (a 'line') — the opposite of being on reserve."
    ],
    [
      "deadhead",
      "Riding a flight as a passenger while on duty, to get you where the company needs you — not working the flight."
    ],
    [
      "grievance",
      "A formal complaint that the company violated the contract."
    ],
    [
      "amendable",
      "Airline contracts don't expire — they become 'amendable,' the date renegotiation can begin while old terms stay in force."
    ],
    [
      "guarantee",
      "The minimum number of hours you're paid each month regardless of how much you fly."
    ],
    [
      "FlightPAC",
      "AFA's political action committee — funds candidates who support flight attendant issues."
    ],
    [
      "domicile",
      "Your base airport — where your trips start and end."
    ],
    [
      "selfing",
      "Arranging your own flights to or from a duty assignment instead of a scheduled deadhead."
    ],
    [
      "pay and credit",
      "Counts toward both your paycheck AND your hour totals (guarantee, monthly caps)."
    ],
    [
      "standup",
      "A trip that flies late evening and early morning with a short overnight in between — on duty throughout. Also called a CDO."
    ],
    [
      "reserves",
      "On-call FAs with no fixed schedule who cover open flying."
    ],
    [
      "ratification",
      "The membership vote that approves the tentative agreement and makes it the contract."
    ],
    [
      "DOR",
      "Date of Ratification — the day the contract is voted in and takes effect."
    ],
    [
      "PBS",
      "Preferential Bidding System — software that builds your monthly schedule from ranked preferences instead of picking whole lines."
    ],
    [
      "HRV",
      "Ready Reserve — a reserve day spent at or near the airport, ready to fly on very short notice."
    ],
    [
      "RAP",
      "Reserve Availability Period — the daily window a reserve must be reachable and ready to fly."
    ],
    [
      "CBA",
      "Collective Bargaining Agreement — your union contract."
    ],
    [
      "AFA",
      "Association of Flight Attendants — your union."
    ],
    [
      "NMB",
      "National Mediation Board — the federal agency that oversees airline labor relations."
    ],
    [
      "DOT",
      "Department of Transportation — federal medical/qualification requirements."
    ],
    [
      "TA",
      "Tentative Agreement — the proposed contract you're voting on."
    ],
    [
      "FA",
      "Flight Attendant."
    ],
    [
      "Implementation LOA",
      "A Letter of Agreement requiring the Company to actually build the promised systems — with expedited arbitration (heard in 15 days, decided in 30) if it doesn't deliver."
    ],
    [
      "Railway Labor Act",
      "The federal law governing airline labor contracts — under it, contracts never expire; old terms stay frozen until a new deal is ratified."
    ],
    [
      "LOA",
      "Letter of Agreement — a signed side deal attached to the contract."
    ],
    [
      "ALPA",
      "Air Line Pilots Association — the pilots' union."
    ],
    [
      "AD OPT",
      "The software vendor whose PBS product PSA's pilots already use."
    ],
    [
      "arbitration",
      "A neutral third party hears the dispute and issues a binding decision."
    ],
    [
      "MEC",
      "Master Executive Council — your union's top elected body at PSA."
    ],
    [
      "LEC",
      "Local Executive Council — your union's elected body at each base."
    ]
  ],
  "execSummary": {
    "placement": "PDF exec page (up front); website shows the per-group one-liners under the scoreboard.",
    "matrixNote": "A contract-wide score isn't meaningful; what matters is the pattern across categories. Each cell is that category's weighted verdict for that group.",
    "perGroup": {
      "nh": "New hires: best-positioned overall — but their real base pay dips for two years and they inherit the flattened career ladder.",
      "mc": "Mid-career: gains ride on longevity steps already owed; the pay category is close once the structural concession is weighed.",
      "sr": "Senior: real base pay erodes every year and they carry the full structural concession — the most mixed picture of any group."
    }
  }
};
