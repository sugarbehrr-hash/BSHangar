/* ============================================================================
 * card-render.js — SHARED card design language for the TA Vote Guide.
 *
 * Single source of truth for the change-card, topic header band, chart figure
 * and data table. Both the web guide (CbaVoteGuideV2) and the print report
 * (CbaVoteReportV2) render through window.VoteCard so the two can never drift:
 * restyle a card here and BOTH views update.
 *
 * All markup is returned as HTML strings (embedded via dangerouslySetInnerHTML)
 * with colors inlined from the design-system CSS variables — no dependency on
 * either DC's local <style> tone classes.
 *
 * Context object (ctx):
 *   detail : "short" | "long"   — short = `plain` prose (web default);
 *                                 long  = `meaning` + `realterms` (PDF depth)
 *   group  : "nh" | "mc" | "sr" — which group's chip is highlighted
 *   chartOpts : passed to window.AssessmentChart (e.g. { thick:true })
 *
 * Navy fills carry class hooks so a print/ink-saver mode can lighten them:
 *   .ink-navy (navy background)  .ink-gold (gold text)  .ink-onnavy (light text)
 * ==========================================================================*/
(function () {
  const A = window.ASSESSMENT || {};

  // Mobile (quick fix): stack a card's boxes instead of squishing them.
  (function(){
    if (typeof document === "undefined" || document.getElementById("vc-mobile-css")) return;
    var st = document.createElement("style"); st.id = "vc-mobile-css";
    st.textContent = "@media(max-width:640px){.vc-card{grid-template-columns:1fr!important}.vc-tp{grid-template-columns:1fr!important}.vc-tp-arrow{transform:rotate(90deg);margin:2px auto}.vc-rail{position:static!important}}";
    (document.head || document.documentElement).appendChild(st);
  })();
  const RLABELS = (A.ratingSystem || {}).labels || {};
  const TYPE_LABELS = A.typeLabels || {};
  const MKT_LABELS = A.marketLabels || {};
  const GROUP_SHORT = { nh: "New Hire", mc: "Mid-Career", sr: "Senior" };

  // ── reference popover (ADR-048): a claim's source, shown at the point of claim ──
  function escHtml(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
  function escAttr(s){return escHtml(s).replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
  function refLabel(refs){
    if (refs.some(function(r){return r.quote;})) return "In the contract";
    if (refs.some(function(r){return r.source;})) return "Source";
    return "Basis";
  }
  function refChip(refs, cardTitle){
    if (refs.length === 1 && refs[0].basis)
      return '<div style="font-size:11.5px; line-height:1.5; color:var(--ink-500);">' + escHtml(refs[0].basis) + '</div>';
    var secs = refs.filter(function(r){return r.section;}).map(function(r){return "§" + r.section;});
    var face = secs.length === 0 ? (refs[0].source ? "Source" : "Details")
             : secs.length <= 2 ? secs.join(" · ")
             : secs[0] + " +" + (secs.length - 1);
    var tag = refs.some(function(r){return r.quote;}) ? "TA" : (refs.some(function(r){return r.source;}) ? "Source" : "");
    var payload = escAttr(JSON.stringify({ t: cardTitle || "", r: refs }));
    return '<button type="button" class="vc-refchip" data-ref="' + payload + '" onclick="window.__vcRefOpen(this)" '
      + 'style="display:inline-flex; align-items:center; justify-content:space-between; gap:8px; width:100%; cursor:pointer; '
      + 'font-family:var(--font-heading); font-weight:800; font-size:12.5px; color:#fff; background:var(--navy-900); '
      + 'border:1.5px solid var(--navy-900); border-radius:9px; padding:7px 11px; text-align:left;">'
      + '<span style="display:inline-flex; align-items:center; gap:7px; min-width:0;"><span style="font-size:9px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:var(--gold-500); flex-shrink:0;">' + tag + '</span> <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + escHtml(face) + '</span></span>'
      + '<span style="opacity:0.7; font-size:12px; flex-shrink:0;">&#9656;</span></button>';
  }
  var REFPOP_CSS = '.vc-refov{position:fixed;inset:0;background:rgba(31,42,68,.44);display:none;align-items:center;justify-content:center;padding:24px;z-index:9999}'
    + '.vc-refov.open{display:flex}'
    + '.vc-refcard{background:var(--cream-100,#faf6ef);border:1.5px solid var(--cream-300,#e3dccb);border-radius:16px;width:100%;max-width:468px;max-height:82vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px rgba(31,42,68,.32)}'
    + '.vc-refhead{background:var(--navy-900,#1f2a44);color:#fff;padding:16px 18px 15px;position:relative}'
    + '.vc-refeye{font-family:var(--font-heading);font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--gold-500,#e8a33d);margin-bottom:7px}'
    + '.vc-refloc{font-family:Georgia,"Times New Roman",serif;font-size:19px;line-height:1.2}'
    + '.vc-refsub{font-size:12.5px;color:#c9d1e2;margin-top:3px}'
    + '.vc-refx{position:absolute;top:12px;right:12px;width:30px;height:30px;border:0;border-radius:8px;background:rgba(255,255,255,.12);color:#fff;font-size:18px;line-height:1;cursor:pointer}'
    + '.vc-refx:hover{background:rgba(255,255,255,.22)}'
    + '.vc-refbody{padding:18px;overflow-y:auto}'
    + '.vc-refquote{font-family:Georgia,"Times New Roman",serif;font-size:15px;line-height:1.7;color:#2c3345;background:#fff;border:1.5px solid var(--cream-300,#e3dccb);border-radius:12px;padding:15px 17px;margin:0}'
    + '.vc-refquote mark{background:#f7e3b6;color:var(--navy-900,#1f2a44);font-weight:700;padding:1px 2px;border-radius:3px}'
    + '.vc-refcite{font-size:14px;line-height:1.65}.vc-refcite a{color:var(--sky-700,#5b7fa6);font-weight:700;text-decoration:none}'
    + '.vc-refdef{font-size:14.5px;line-height:1.65;color:#2c3345}'
    + '.vc-refclause{margin-bottom:16px}.vc-refclause:last-child{margin-bottom:0}'
    + '.vc-refsec{font-family:var(--font-heading);font-size:11px;font-weight:800;letter-spacing:.03em;color:var(--gold-600,#b07d1e);margin:0 0 6px}'
    + '.vc-reffoot{padding:11px 18px;border-top:1px solid var(--cream-300,#e3dccb);display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--ink-500,#7c8398);background:var(--cream-200,#f1ead9)}'
    + '.vc-refdraft{font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#a9741a;background:#f7e9cd;border:1px solid #ecd6a3;border-radius:5px;padding:2px 6px}'
    + '.vc-refchip:hover{background:#2b3a5c!important}'
    + '@media(max-width:560px){.vc-refov{align-items:flex-end;padding:0}.vc-refcard{max-width:100%;border-radius:18px 18px 0 0;max-height:80vh}}';
  function ensureRefPop(){
    if (document.getElementById("vc-refov")) return;
    var st=document.createElement("style"); st.textContent=REFPOP_CSS; document.head.appendChild(st);
    var ov=document.createElement("div"); ov.id="vc-refov"; ov.className="vc-refov";
    ov.innerHTML='<div class="vc-refcard" role="dialog" aria-modal="true" aria-labelledby="vc-refloc">'
      +'<div class="vc-refhead"><div class="vc-refeye" id="vc-refeye"></div><div class="vc-refloc" id="vc-refloc"></div><div class="vc-refsub" id="vc-refsub"></div><button class="vc-refx" id="vc-refx" aria-label="Close">&times;</button></div>'
      +'<div class="vc-refbody" id="vc-refbody"></div><div class="vc-reffoot" id="vc-reffoot"></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener("click",function(e){if(e.target===ov)ov.classList.remove("open");});
    document.getElementById("vc-refx").addEventListener("click",function(){ov.classList.remove("open");});
    document.addEventListener("keydown",function(e){if(e.key==="Escape")ov.classList.remove("open");});
  }
  window.__vcRefOpen=function(btn){
    ensureRefPop();
    var data; try{data=JSON.parse(btn.getAttribute("data-ref"));}catch(e){return;}
    var refs=(data && data.r) || [], title=(data && data.t) || "";
    if(!refs.length) return;
    var hasQuote=refs.some(function(r){return r.quote;});
    var hasSrc=refs.some(function(r){return r.source;});
    document.getElementById("vc-refeye").textContent=hasQuote?"In the contract":(hasSrc?"Source · external":"Basis");
    document.getElementById("vc-refloc").innerHTML=escHtml(title||(hasQuote?"Contract language":"Source"));
    document.getElementById("vc-refsub").textContent=refs.length>1?(refs.length+" citations"):"";
    var body="", anyDraft=false;
    refs.forEach(function(r){
      if(r.basis){ body+='<div class="vc-refclause"><div class="vc-refdef">'+escHtml(r.basis)+'</div></div>'; return; }
      if(r.source){
        body+='<div class="vc-refclause"><div class="vc-refsec">'+escHtml(r.source)+'</div><div class="vc-refcite">'+escHtml(r.detail||"")
          +(r.url?' <a href="'+escAttr(r.url)+'" target="_blank" rel="noopener">View &#8599;</a>':'')+'</div></div>';
        return;
      }
      if(r.status==="draft") anyDraft=true;
      var q=r.quote||"", i=r.bold?q.indexOf(r.bold):-1, h;
      if(i>=0){h=escHtml(q.slice(0,i))+'<mark>'+escHtml(r.bold)+'</mark>'+escHtml(q.slice(i+r.bold.length));}
      else{h=escHtml(q);}
      var sec=(r.doc==="Tentative Agreement"?"TA ":(r.doc?escHtml(r.doc)+" ":""))+"§"+escHtml(r.section||"")+(r.title?" · "+escHtml(r.title):"");
      body+='<div class="vc-refclause"><div class="vc-refsec">'+sec+'</div><p class="vc-refquote">'+h+'</p></div>';
    });
    document.getElementById("vc-refbody").innerHTML=body;
    document.getElementById("vc-reffoot").innerHTML=(anyDraft?'<span class="vc-refdraft">Draft &ndash; pending verify</span>':'')
      +'<span>'+(hasQuote?"Verbatim from the TA":"Cited for comparison")+'</span>';
    document.getElementById("vc-refbody").scrollTop=0;
    document.getElementById("vc-refov").classList.add("open");
  };
  // glossary variant — same shell, a term + its plain-language definition
  window.__vcGlossShow=function(el){
    ensureRefPop();
    var term=el.getAttribute("data-term")||"", def=el.getAttribute("data-def")||"";
    document.getElementById("vc-refeye").textContent="Term";
    document.getElementById("vc-refloc").innerHTML=escHtml(term);
    document.getElementById("vc-refsub").textContent="";
    document.getElementById("vc-refbody").innerHTML='<div class="vc-refdef">'+escHtml(def)+'</div>';
    document.getElementById("vc-reffoot").innerHTML='<span>Plain-language glossary</span>';
    document.getElementById("vc-refbody").scrollTop=0;
    document.getElementById("vc-refov").classList.add("open");
  };
  const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // ── rating code → pill colors (mirrors the .t-* tone classes) ──────────────
  const RATING = {
    MG:  { bg: "var(--success-600)", fg: "#fff",          bd: "var(--success-600)" },
    SG:  { bg: "#8ed0ac",            fg: "var(--navy-900)", bd: "#4fb183" },
    sg:  { bg: "var(--success-100)", fg: "var(--navy-900)", bd: "#a6ddc1" },
    tk:  { bg: "var(--cream-200)",   fg: "var(--ink-700)",  bd: "var(--cream-300)" },
    nc:  { bg: "var(--cream-200)",   fg: "var(--ink-300)",  bd: "var(--cream-300)" },
    sc:  { bg: "var(--red-100)",     fg: "var(--navy-900)", bd: "#f4b8c0" },
    RC:  { bg: "#f09aa4",            fg: "var(--navy-900)", bd: "var(--red-500)" },
    XC:  { bg: "var(--red-600)",     fg: "#fff",           bd: "var(--red-600)" },
    dep: { bg: "var(--cream-200)",   fg: "var(--navy-900)", bd: "var(--gold-500)" }
  };
  const TYPE = {
    NEW:     { bg: "var(--gold-500)", fg: "var(--navy-900)" },
    CODIFY:  { bg: "var(--sky-700)",  fg: "#fff" },
    RESTORE: { bg: "var(--red-600)",  fg: "#fff" }
  };
  const DLV = {
    automatic: { label: "Automatic rule",          icon: "ph-seal-check",        bg: "var(--sky-100)",   bd: "var(--sky-700)",   fg: "var(--sky-700)" },
    delayed:   { label: "Delayed rule",            icon: "ph-hourglass-medium",  bg: "var(--cream-300)", bd: "var(--ink-300)",   fg: "var(--ink-700)" },
    promise:   { label: "Implementation promise",  icon: "ph-hammer",            bg: "var(--gold-100)",  bd: "var(--gold-500)",  fg: "var(--gold-600)" }
  };
  // chart verdict → figure frame tint (cv-*), keyed off data `polarity`
  function chartVerdict(pol) {
    if (pol === "pos") return { bg: "var(--success-100)", bd: "var(--success-600)" };
    if (pol === "neu") return { bg: "var(--cream-200)",   bd: "var(--gold-500)" };
    return { bg: "var(--red-100)", bd: "var(--red-600)" };
  }
  // category verdict → header pill colors (v-*), keyed off data `polarity`
  function verdictColors(v, pol) {
    if (pol === "neu") return { bg: "var(--cream-300)", fg: "var(--ink-700)" };
    if (pol === "neg") {
      if (/CLEAR LOSS|Major/i.test(v)) return { bg: "var(--red-600)", fg: "#fff" };
      if (/negative|loss/i.test(v))    return { bg: "#f09aa4",        fg: "var(--navy-900)" };
      return { bg: "var(--red-100)", fg: "var(--navy-900)" };
    }
    if (pol === "pos") {
      if (/CLEAR WIN/i.test(v))    return { bg: "var(--success-600)", fg: "#fff" };
      if (/Net positive/i.test(v)) return { bg: "#8ed0ac",            fg: "var(--navy-900)" };
      return { bg: "var(--success-100)", fg: "var(--navy-900)" };
    }
    return { bg: "var(--cream-300)", fg: "var(--ink-700)" };
  }

  function normPlacement(p) {
    p = String(p || "").toLowerCase();
    if (p.indexOf("hero") === 0) return "hero";
    if (/find[_ ]your[_ ]position/.test(p)) return "find_your_position";
    if (/accountability/.test(p)) return "accountability";
    if (/scoreboard/.test(p)) return "scoreboard";
    const m = p.match(/cat-[a-z]+/);
    return m ? m[0] : p;
  }
  function formatStarts(s) {
    if (!s) return s || "";
    return String(s).replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, function (_, mm, dd, yyyy) {
      var mi = parseInt(mm, 10) - 1;
      return (MONTHS_SHORT[mi] || mm) + " " + yyyy;
    });
  }
  function chartHTML(spec, ctx) {
    if (!spec || !window.AssessmentChart) return "";
    // In-card charts live in the narrow ~520px text column, so a 1000-wide viewBox
    // downscaled everything to ~half size. A compact viewBox renders near 1:1 there,
    // so text and the plot fill the card. Section-level figures (chartFigure) sit in
    // wide containers and pass their own opts, so they keep the default width.
    return window.AssessmentChart(spec, (ctx && ctx.chartOpts) || { thick: true, width: 660 });
  }

  // ── $ / % unit toggle (ADR-039 wiring) ─────────────────────────────────────
  // spec.units (declared in the data) lists alternate presentations of the SAME
  // numbers — e.g. "Multiple of starting pay" vs "Dollars per hour". The chart
  // engine (assessment-charts.js) already supports re-rendering under a chosen
  // unit via AssessmentChart(spec, {unit:key}); this wires that to a visible
  // segmented control so the reader can flip between them. One global registry
  // + one delegated click handler serves every chart instance on the page.
  window.__vcCharts = window.__vcCharts || {};
  (A.charts || []).forEach(s => { window.__vcCharts[s.id] = s; });
  let vcInstanceSeq = 0;
  window.__vcSetUnit = function (wrapId, unitKey, btnEl) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    const spec = window.__vcCharts[wrap.getAttribute("data-chart-id")];
    if (!spec || !window.AssessmentChart) return;
    let opts = {};
    try { opts = JSON.parse(wrap.getAttribute("data-opts") || "{}"); } catch (e) {}
    wrap.innerHTML = window.AssessmentChart(spec, Object.assign({}, opts, { unit: unitKey }));
    const bar = btnEl && btnEl.closest(".vc-unit-toggle");
    if (bar) {
      Array.prototype.forEach.call(bar.children, (b) => {
        const on = b === btnEl;
        b.style.background = on ? "var(--navy-900)" : "transparent";
        b.style.color = on ? "#fff" : "var(--ink-700)";
      });
    }
  };
  function unitToggleHTML(spec, wrapId) {
    const units = (window.AssessmentChartUnits ? window.AssessmentChartUnits(spec) : (spec.units || []));
    if (!units || units.length < 2) return "";
    const defaultKey = (units.filter(u => u.default)[0] || units[0]).key;
    // Keep buttons terse — a symbol/short word, not the full descriptive label
    // (that full text belongs on the axis, not a toggle button).
    const shortLabel = (u) => {
      if (/dollar/i.test(u.numberFormat || "") || /\$/.test(u.axisLabel || "")) return "$";
      if (/percent/i.test(u.numberFormat || "") || /%/.test(u.axisLabel || "")) return "%";
      return (u.label || u.key || "").split(" ")[0];
    };
    const btns = units.map(u => {
      const on = u.key === defaultKey;
      return '<button type="button" title="' + (u.label || u.key) + '" onclick="window.__vcSetUnit(\'' + wrapId + '\',\'' + u.key + '\',this)" style="border:none; cursor:pointer; padding:4px 12px; border-radius:999px; font-family:var(--font-heading); font-weight:800; font-size:12px; min-width:30px; background:' + (on ? "var(--navy-900)" : "transparent") + '; color:' + (on ? "#fff" : "var(--ink-700)") + ';">' + shortLabel(u) + '</button>';
    }).join("");
    return '<div class="vc-unit-toggle" style="display:inline-flex; align-items:center; gap:2px; flex-shrink:0; background:var(--cream-200); border:1.5px solid var(--cream-300); border-radius:999px; padding:2px;">' + btns + '</div>';
  }
  // wraps the chart SVG in an id'd, data-tagged div so the toggle can target it.
  // Returns the toggle control and the chart wrap SEPARATELY (rather than one
  // concatenated string) so callers can place the toggle beside the verdict pill
  // — sharing that header row — instead of stacking it as its own row above the
  // legend, which read as a floating, disconnected control.
  function chartPieces(spec, ctx) {
    if (!spec || !window.AssessmentChart) return { toggle: "", wrapHtml: "" };
    const opts = (ctx && ctx.chartOpts) || { thick: true, width: 660 };
    const wrapId = "vc-chart-" + spec.id + "-" + (++vcInstanceSeq);
    const toggle = unitToggleHTML(spec, wrapId);
    const svg = window.AssessmentChart(spec, opts);
    const wrapHtml = '<div id="' + wrapId + '" data-chart-id="' + spec.id + '" data-opts=\'' + JSON.stringify(opts).replace(/'/g, "&#39;") + '\'>' + svg + '</div>';
    return { toggle, wrapHtml };
  }
  // back-compat single-string version (toggle stacked above the chart wrap)
  function chartHTMLWithToggle(spec, ctx) {
    const p = chartPieces(spec, ctx);
    return p.toggle + p.wrapHtml;
  }

  // ── small builders ─────────────────────────────────────────────────────────
  function ratingPill(code, extra) {
    const c = RATING[code] || RATING.nc;
    // pills must stay a 1–2 word summary — collapse any long label (e.g.
    // "Depends — swing factor") to its lead phrase before an em-dash/parenthetical.
    const label = String(RLABELS[code] || code).split(/\s+—\s+| \(/)[0];
    return '<span style="display:inline-flex; align-items:center; padding:2px 9px; border-radius:6px; font-family:var(--font-heading); font-weight:800; font-size:10.5px; white-space:nowrap; background:' + c.bg + '; color:' + c.fg + '; border:1.5px solid ' + c.bd + '; ' + (extra || "") + '">' + label + '</span>';
  }
  function typeChip(type) {
    const t = TYPE[type] || TYPE.CODIFY;
    return '<span style="display:inline-block; padding:3px 9px; border-radius:6px; font-size:9.5px; font-weight:800; letter-spacing:0.07em; font-family:var(--font-heading); text-transform:uppercase; background:' + t.bg + '; color:' + t.fg + ';">' + (TYPE_LABELS[type] || type) + '</span>';
  }
  function dlvChip(delivery) {
    const d = DLV[delivery] || DLV.automatic;
    return '<span style="display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius:6px; font-family:var(--font-heading); font-weight:800; font-size:9.5px; letter-spacing:0.05em; text-transform:uppercase; background:' + d.bg + '; color:' + d.fg + '; border:1.5px solid ' + d.bd + ';"><i class="ph-fill ' + d.icon + '"></i> ' + d.label + '</span>';
  }

  // A chart figure sitting INSIDE a change card (compact, cream frame).
  function inlineChartFigure(spec, ctx) {
    const cv = chartVerdict(spec.polarity);
    const cp = chartPieces(spec, ctx);
    return '<figure style="margin:0 0 12px; background:var(--cream-100); border:1.5px solid var(--cream-300); border-radius:12px; padding:14px; break-inside:avoid;">'
      + '<p style="font-size:13px; line-height:1.55; margin:0 0 8px; color:var(--ink-700);">' + (spec.leadIn || "") + '</p>'
      + '<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; margin:0 0 10px;">'
      + '<div style="display:inline-flex; align-items:center; padding:4px 11px; border-radius:999px; font-family:var(--font-heading); font-weight:800; font-size:10.5px; letter-spacing:0.03em; text-transform:uppercase; color:var(--navy-900); background:' + cv.bg + '; border:1.5px solid ' + cv.bd + ';">Verdict: ' + (spec.verdict || "") + '</div>'
      + cp.toggle
      + '</div>'
      + cp.wrapHtml
      + '<figcaption style="font-size:12.5px; line-height:1.55; color:var(--ink-700); margin:8px 0 0;">' + (spec.plainCaption || "") + '</figcaption>'
      + (spec.assumptions ? '<div style="font-size:10.5px; line-height:1.45; color:var(--ink-300); margin:6px 0 0;">Assumptions: ' + spec.assumptions + '</div>' : "")
      + '</figure>';
  }

  // A standalone / orphan chart figure (white frame, section level).
  function chartFigure(spec, ctx) {
    const cv = chartVerdict(spec.polarity);
    const cp = chartPieces(spec, ctx);
    return '<figure style="margin:0 0 16px; background:var(--white); border:1.5px solid var(--cream-300); border-radius:16px; padding:20px; break-inside:avoid;">'
      + '<p style="font-size:13.5px; line-height:1.6; margin:0 0 8px; color:var(--ink-700);">' + (spec.leadIn || "") + '</p>'
      + '<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; margin:0 0 10px;">'
      + '<div style="display:inline-flex; align-items:center; padding:4px 11px; border-radius:999px; font-family:var(--font-heading); font-weight:800; font-size:10.5px; letter-spacing:0.03em; text-transform:uppercase; color:var(--navy-900); background:' + cv.bg + '; border:1.5px solid ' + cv.bd + ';">Verdict: ' + (spec.verdict || "") + '</div>'
      + cp.toggle
      + '</div>'
      + cp.wrapHtml
      + '<figcaption style="font-size:13px; line-height:1.6; color:var(--ink-700); margin:10px 0 0;">' + (spec.plainCaption || "") + '</figcaption>'
      + (spec.assumptions ? '<div style="font-size:10.5px; line-height:1.45; color:var(--ink-300); margin:6px 0 0;">Assumptions: ' + spec.assumptions + '</div>' : "")
      + '</figure>';
  }

  // ── the change card ─────────────────────────────────────────────────────────
  // c = a raw change object from assessment.data topics[].changes[]
  function changeCard(c, ctx) {
    ctx = ctx || {};
    const detail = ctx.detail === "long" ? "long" : "short";
    const group = ctx.group || "nh";
    const chartIds = c.chart ? (Array.isArray(c.chart) ? c.chart : [c.chart]) : [];
    const CHARTS = {}; (A.charts || []).forEach(s => { CHARTS[s.id] = s; });

    const prose = detail === "long" ? (c.meaning || c.plain || "") : (c.plain || c.meaning || "");
    const showRealterms = detail === "long" && !!c.realterms;

    // left column
    let left = '<div style="min-width:0;">';
    left += '<h3 style="font-family:var(--font-heading); font-weight:800; font-size:17.5px; color:var(--navy-900); margin:0 0 10px; line-height:1.3;">' + (c.title || "") + '</h3>';
    left += '<p style="font-size:14px; line-height:1.6; margin:0 0 12px;">' + prose + '</p>';
    // today → proposed
    left += '<div class="vc-tp" style="display:grid; grid-template-columns:1fr 40px 1fr; align-items:stretch; margin:0 0 12px;">'
      + '<div style="padding:13px 16px; border-radius:12px; background:var(--cream-200); border:1.5px dashed var(--cream-300);">'
      + '<div style="font-family:var(--font-heading); font-weight:800; font-size:10px; letter-spacing:0.14em; text-transform:uppercase; margin-bottom:6px; color:var(--ink-300);"><i class="ph-fill ph-clock-counter-clockwise"></i> Today</div>'
      + '<p style="margin:0; font-size:13.5px; line-height:1.55;">' + (c.today || "") + '</p></div>'
      + '<div class="vc-tp-arrow" style="display:flex; align-items:center; justify-content:center; color:var(--gold-600); font-size:20px;"><i class="ph-bold ph-arrow-right"></i></div>'
      + '<div style="padding:13px 16px; border-radius:12px; background:var(--sky-100); border:1.5px solid var(--sky-700);">'
      + '<div style="font-family:var(--font-heading); font-weight:800; font-size:10px; letter-spacing:0.14em; text-transform:uppercase; margin-bottom:6px; color:var(--sky-700);"><i class="ph-fill ph-arrow-fat-right"></i> Proposed</div>'
      + '<p style="margin:0; font-size:13.5px; line-height:1.55;">' + (c.proposed || "") + '</p></div></div>';
    // real-terms deep note (long only)
    if (showRealterms) {
      left += '<p style="font-size:13px; line-height:1.6; margin:0 0 12px; background:var(--cream-100); border:1.5px solid var(--cream-300); border-left:5px solid var(--gold-500); border-radius:0 12px 12px 0; padding:12px 16px;"><b style="color:var(--navy-900); font-family:var(--font-heading);">In real terms —</b> ' + c.realterms + '</p>';
    }
    // inline charts (suppressed in print, where charts flow as their own blocks)
    if (!ctx.noCharts) {
      chartIds.map(id => CHARTS[id]).filter(Boolean).forEach(spec => { left += inlineChartFigure(spec, ctx); });
    }
    left += '</div>';

    // right rail
    const metaBlock = (label, valueHTML, wrapStyle) =>
      '<div style="' + (wrapStyle || '') + '"><div style="font-family:var(--font-heading); font-weight:800; font-size:10px; letter-spacing:0.1em; text-transform:uppercase; color:var(--navy-900); margin-bottom:3px;">' + label + '</div>' + valueHTML + '</div>';
    const coversHTML = c.cond
      ? '<span style="display:inline-block; padding:3px 9px; border-radius:6px; font-family:var(--font-heading); font-weight:800; font-size:9.5px; letter-spacing:0.05em; text-transform:uppercase; border:1.5px dashed var(--gold-500); color:var(--gold-600);">if ' + c.cond + '</span>'
      : '<div style="font-family:var(--font-heading); font-weight:700; font-size:13px; color:var(--navy-900); line-height:1.35;">Everyone</div>';
    const metaRows = [];
    metaRows.push(["What is this?", typeChip(c.type)]);
    metaRows.push(["Who it covers", coversHTML]);
    metaRows.push(["Starts", '<div style="font-family:var(--font-heading); font-weight:700; font-size:13px; color:var(--navy-900); line-height:1.35;">' + formatStarts(c.starts) + '</div>']);
    metaRows.push(["How sure is it?", dlvChip(c.delivery)]);
    if (c.market) {
      const mkt = '<span style="display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius:6px; border:1.5px solid var(--navy-900); background:var(--white); font-family:var(--font-heading); font-weight:800; font-size:9.5px; letter-spacing:0.04em; text-transform:uppercase; color:var(--navy-900);"><i class="ph-fill ph-chart-bar"></i> ' + (MKT_LABELS[c.market.position] || c.market.position) + '</span>'
        + '<div style="font-size:11px; line-height:1.5; color:var(--ink-500); margin-top:3px;">' + (c.market.note || "") + '</div>';
      metaRows.push(["Vs. other airlines", mkt]);
    }
    if (c.reference && c.reference.length) {
      metaRows.push([refLabel(c.reference), refChip(c.reference, c.title)]);
    }
    let meta = '<div style="background:var(--cream-100); border-radius:12px; padding:13px 14px; display:flex; flex-direction:column;">';
    meta += metaRows.map((r, i) => {
      const sep = i === 0 ? '' : 'border-top:1px solid var(--cream-300); ';
      const pad = 'padding:' + (i === 0 ? '0' : '9px') + ' 0 ' + (i === metaRows.length - 1 ? '0' : '9px') + ';';
      return metaBlock(r[0], r[1], sep + pad);
    }).join('');
    meta += '</div>';

    // "Worth to each group" navy panel
    let chips = '';
    ["nh", "mc", "sr"].forEach(k => {
      const code = (c.rating || {})[k];
      const nameStyle = k === group
        ? 'font-family:var(--font-heading); font-weight:800; font-size:12px; color:#fff;'
        : 'font-size:11.5px; color:var(--sky-300);';
      chips += '<div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">'
        + '<span class="ink-onnavy" style="white-space:nowrap; ' + nameStyle + '">' + GROUP_SHORT[k] + '</span>'
        + ratingPill(code) + '</div>';
    });
    const worth = '<div class="ink-navy" style="background:var(--navy-900); border-radius:12px; padding:13px 14px;">'
      + '<div class="ink-gold" style="font-family:var(--font-heading); font-weight:800; font-size:9.5px; letter-spacing:0.1em; text-transform:uppercase; color:var(--gold-500); margin-bottom:8px;">Worth to each group</div>'
      + '<div style="display:flex; flex-direction:column; gap:7px;"' + (ctx.chipsAnchor ? ' data-comment-anchor="' + ctx.chipsAnchor + '"' : '') + '>' + chips + '</div></div>';

    const right = '<div class="vc-rail" style="display:flex; flex-direction:column; gap:10px; position:sticky; top:calc(var(--tb-h, 54px) + 12px); align-self:start;">' + meta + worth + '</div>';

    return '<div data-card-id="' + (c.id || '') + '" class="vc-card" style="background:var(--white); border:1.5px solid var(--cream-300); border-radius:16px; padding:20px 16px 20px 22px; margin-bottom:16px; display:grid; grid-template-columns:1fr 224px; gap:14px; break-inside:avoid;">'
      + left + right + '</div>';
  }

  // ── navy topic header band ───────────────────────────────────────────────────
  // cat = { num, total, title, topicNote, verdict, groupLabel, tally, score,
  //         addons:[{text}], bandEdgeNote,
  //         groups:[{groupLabel, verdict, score}]  (used when ctx.allGroups) }
  // ctx.allGroups=true → the print variant, showing all three groups' verdicts.
  function topicBand(cat, ctx) {
    ctx = ctx || {};
    const edge = cat.bandEdgeNote ? ' <i class="ph-fill ph-warning-circle" title="' + cat.bandEdgeNote + '" style="cursor:help;"></i>' : '';
    let addons = '';
    if (cat.addons && cat.addons.length) {
      addons = '<div style="padding:8px 14px; background:rgba(255,255,255,0.04); border-top:1.5px solid rgba(255,255,255,0.15); display:flex; flex-direction:column; gap:4px;">'
        + cat.addons.map(a => '<div class="ink-onnavy" style="font-size:11px; color:var(--gold-200); font-weight:700; line-height:1.4;">' + (a.text || a) + '</div>').join('') + '</div>';
    }

    let scoreBox;
    if (ctx.allGroups && cat.groups) {
      const rows = cat.groups.map(g => {
        const gv = verdictColors(g.verdict || "", g.polarity);
        return '<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:6px 14px;">'
          + '<span class="ink-onnavy" style="font-family:var(--font-heading); font-weight:800; font-size:10px; letter-spacing:0.05em; text-transform:uppercase; color:var(--sky-300);">' + (g.groupLabel || "") + '</span>'
          + '<span style="display:inline-flex; align-items:center; gap:6px; font-family:var(--font-heading); font-weight:800; font-size:10.5px; padding:3px 9px; border-radius:6px; white-space:nowrap; background:' + gv.bg + '; color:' + gv.fg + ';">' + (g.verdict || "") + ' <span style="opacity:0.75;">' + (g.score || "") + '</span></span>'
          + '</div>';
      }).join('<div style="height:1px; background:rgba(255,255,255,0.12);"></div>');
      scoreBox = '<div style="display:inline-flex; flex-direction:column; border:1.5px solid rgba(255,255,255,0.15); border-radius:13px; overflow:hidden; text-align:left; min-width:236px;">'
        + '<div class="ink-gold" style="padding:8px 14px; font-family:var(--font-heading); font-weight:800; font-size:9px; letter-spacing:0.11em; text-transform:uppercase; color:var(--gold-500); background:rgba(232,184,75,0.14); border-bottom:1.5px solid rgba(255,255,255,0.15);">Verdict by group</div>'
        + rows + addons + '</div>';
    } else {
      const vc = verdictColors(cat.verdict || "", cat.polarity);
      scoreBox = '<div style="display:inline-flex; flex-direction:column; border:1.5px solid rgba(255,255,255,0.15); border-radius:13px; overflow:hidden; text-align:left; min-width:212px;">'
        + '<div style="display:flex; align-items:center; justify-content:center; gap:6px; padding:9px 18px; font-family:var(--font-heading); font-weight:800; font-size:14px; text-transform:uppercase; letter-spacing:0.02em; background:' + vc.bg + '; color:' + vc.fg + ';">' + (cat.verdict || "") + edge + '</div>'
        + '<div style="display:flex; align-items:stretch;">'
        + '<div style="flex:1; padding:8px 14px; text-align:right;"><div class="ink-onnavy" style="font-family:var(--font-heading); font-size:9px; letter-spacing:0.11em; text-transform:uppercase; color:var(--sky-300); font-weight:800; margin-bottom:3px;">For ' + (cat.groupLabel || "") + '</div><div class="ink-onnavy" style="font-size:12.5px; color:var(--cream-100); font-weight:700; line-height:1.35;">' + (cat.tally || "") + '</div></div>'
        + '<div style="padding:6px 16px; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(232,184,75,0.16); border-left:1.5px solid rgba(255,255,255,0.15);"><div class="ink-gold" style="font-family:var(--font-heading); font-size:9px; letter-spacing:0.11em; text-transform:uppercase; color:var(--gold-500); font-weight:800; margin-bottom:2px;">Score</div><div class="ink-onnavy" style="font-family:var(--font-display); font-size:22px; line-height:0.9; color:#fff;">' + (cat.score || "") + '</div></div>'
        + '</div>' + addons + '</div>';
    }

    return '<div class="ink-navy" style="background:var(--navy-900); border-top:5px solid var(--gold-500); padding:26px 44px; display:flex; align-items:flex-start; justify-content:space-between; gap:18px; flex-wrap:wrap;">'
      + '<div style="flex:1; min-width:300px;">'
      + '<div class="ink-gold" style="font-family:var(--font-heading); font-weight:800; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:var(--gold-500); margin:0 0 9px;">Topic ' + cat.num + ' of ' + cat.total + '</div>'
      + '<h2 class="ink-onnavy" style="font-family:var(--font-display); text-transform:uppercase; font-size:31px; line-height:1; color:#fff; margin:0;">' + cat.title + '</h2>'
      + (cat.topicNote ? '<p class="ink-onnavy" style="font-size:12.5px; color:var(--sky-300); margin:9px 0 0; max-width:600px; line-height:1.5;">' + cat.topicNote + '</p>' : '')
      + '</div>'
      + '<div style="flex:none;">' + scoreBox + '</div></div>';
  }

  // ── data table ───────────────────────────────────────────────────────────────
  function dataTable(tb) {
    let head = tb.columns.map(col => '<span style="flex:1; min-width:0; font-family:var(--font-heading); font-weight:800; font-size:10.5px; letter-spacing:0.07em; text-transform:uppercase; color:var(--ink-300);">' + col + '</span>').join('');
    let rows = tb.rows.map(r =>
      '<div style="display:flex; gap:14px; padding:8px 0; border-bottom:1px solid var(--cream-300); font-size:12.5px; line-height:1.5;">'
      + r.map(cell => '<span style="flex:1; min-width:0; color:var(--ink-700);">' + cell + '</span>').join('') + '</div>').join('');
    return '<div style="background:var(--white); border:1.5px solid var(--cream-300); border-radius:16px; padding:20px 24px; margin-bottom:16px; break-inside:avoid;">'
      + '<h3 style="font-family:var(--font-heading); font-weight:800; font-size:15px; color:var(--navy-900); margin:0 0 6px;">' + tb.title + '</h3>'
      + (tb.leadIn ? '<p style="font-size:13px; line-height:1.55; color:var(--ink-700); margin:0 0 12px;">' + tb.leadIn + '</p>' : '')
      + '<div style="display:flex; gap:14px; border-bottom:2px solid var(--cream-300); padding-bottom:8px;">' + head + '</div>'
      + rows
      + (tb.footnote ? '<p style="font-size:11px; line-height:1.5; color:var(--ink-300); margin:10px 0 0;">' + tb.footnote + '</p>' : '')
      + '</div>';
  }

  // ── market-reality context card (same detail-card shell as changeCard) ───────
  // Left column carries the scannable bullets (+ prose in the full lens); the right
  // rail compiles the badges: the marketVerdict tag and the callout stat.
  const MV_HEX = { pos: "#8ed0ac", neu: "var(--gold-500)", mix: "var(--gold-100)", neg: "#f09aa4" };
  // A marketVerdict.label packs two facets joined by "·": market POSITION and MOMENTUM.
  // Order isn't fixed, so classify each part rather than trust its position.
  function splitVerdict(mv) {
    if (!mv) return null;
    if (mv.market || mv.momentum) return { market: mv.market || "", momentum: mv.momentum || "", tone: mv.tone };
    if (!mv.label) return null;
    const parts = mv.label.split("·").map(s => s.trim()).filter(Boolean);
    const isMomentum = (s) => /catch-?up|already behind|falling|trend|momentum|undetermined|slipping|holding/i.test(s);
    let market = "", momentum = "";
    parts.forEach(p => {
      if (isMomentum(p)) { if (!momentum) momentum = p; else if (!market) market = p; }
      else { if (!market) market = p; else if (!momentum) momentum = p; }
    });
    return { market: market, momentum: momentum, tone: mv.tone };
  }
  function marketDetailCard(m, ctx) {
    ctx = ctx || {};
    const detail = ctx.detail === "long" ? "long" : "short";
    const hasBullets = !!(m.bullets && m.bullets.length);
    const showBody = detail === "long" || !hasBullets;
    let left = '<div style="min-width:0;">';
    left += '<h3 style="font-family:var(--font-heading); font-weight:800; font-size:17.5px; color:var(--navy-900); margin:0 0 12px; line-height:1.3;">' + (m.title || "") + '</h3>';
    if (hasBullets) {
      left += '<ul style="margin:0; padding-left:20px; display:flex; flex-direction:column; gap:8px;">'
        + m.bullets.map(b => '<li style="font-size:14px; line-height:1.55; color:var(--ink-700);">' + b + '</li>').join('') + '</ul>';
    }
    if (showBody && (m.bodyLong || m.body)) {
      left += '<p style="font-size:13px; line-height:1.6; margin:' + (hasBullets ? '13px' : '0') + ' 0 0; color:var(--ink-500);">' + (m.bodyLong || m.body) + '</p>';
    }
    left += '</div>';
    const mv = m.marketVerdict;
    const sv = splitVerdict(mv);
    let mvBlock = '';
    if (sv) {
      const chip = (icon, txt) => '<span style="display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius:6px; background:' + (MV_HEX[mv.tone] || 'var(--gold-500)') + '; color:var(--navy-900); font-family:var(--font-heading); font-weight:800; font-size:9.5px; letter-spacing:0.06em; text-transform:uppercase;"><i class="ph-fill ' + icon + '"></i> ' + txt + '</span>';
      const panel = (title, icon, txt) => '<div style="background:var(--cream-100); border-radius:12px; padding:12px 14px;"><div style="font-family:var(--font-heading); font-weight:800; font-size:9.5px; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-500); margin-bottom:6px;">' + title + '</div>' + chip(icon, txt) + '</div>';
      if (sv.market) mvBlock += panel('Vs. the market', 'ph-chart-bar', sv.market);
      if (sv.momentum) mvBlock += panel('Where it\'s headed', 'ph-trend-up', sv.momentum);
    }
    let calloutBlock = '';
    if (m.callout) {
      calloutBlock = '<div class="ink-navy" style="background:var(--navy-900); border-radius:12px; padding:13px 15px;">'
        + '<div class="ink-gold" style="font-family:var(--font-heading); font-weight:800; font-size:9.5px; letter-spacing:0.1em; text-transform:uppercase; color:var(--gold-500); margin-bottom:6px;">The takeaway</div>'
        + '<div class="ink-onnavy" style="font-family:var(--font-heading); font-weight:800; font-size:15.5px; line-height:1.2; color:#fff;">' + m.callout + '</div></div>';
    }
    const right = '<div style="display:flex; flex-direction:column; gap:10px;">' + mvBlock + calloutBlock + '</div>';
    return '<div data-card-id="' + (m.id || '') + '" class="vc-card" style="background:var(--white); border:1.5px solid var(--cream-300); border-radius:16px; padding:20px 16px 20px 22px; margin-bottom:16px; display:grid; grid-template-columns:1fr 224px; gap:14px; break-inside:avoid;">'
      + left + right + '</div>';
  }

  window.VoteCard = {
    changeCard, chartFigure, inlineChartFigure, dataTable, topicBand, marketDetailCard,
    normPlacement, formatStarts, chartHTML, chartHTMLWithToggle, chartPieces, unitToggleHTML,
    GROUP_SHORT, RATING, TYPE, DLV, verdictColors, chartVerdict
  };
})();

// ── pin fresh data/renderer against a late, stale bundle ─────────────────────
// ds-base.js loads the design-system bundle ASYNC, and that bundle bakes in an
// OLDER copy of window.ASSESSMENT. If it finishes after the data/renderer/card
// scripts (a race), it clobbers the fresh 1.26.0 data and drops the card ids the
// Short/Full lock depends on. This file is the last of the pinnable scripts, so
// by here ASSESSMENT/VoteCard/AssessmentChart are all the fresh copies — pin
// them and ignore any late write from the bundle. (Lives here, not as an inline
// helmet <script>, which this runtime mishandles.)
(function () {
  var goodA = window.ASSESSMENT, goodVC = window.VoteCard, goodAC = window.AssessmentChart;
  try {
    Object.defineProperty(window, "ASSESSMENT", { configurable: true, get: function () { return goodA; }, set: function () {} });
    Object.defineProperty(window, "VoteCard", { configurable: true, get: function () { return goodVC; }, set: function () {} });
    Object.defineProperty(window, "AssessmentChart", { configurable: true, get: function () { return goodAC; }, set: function () {} });
  } catch (e) {}
})();
