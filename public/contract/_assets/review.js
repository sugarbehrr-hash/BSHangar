/* Beta review layer (display-only, ADR-048 companion).
   Gated behind ?review in the URL, so members see a clean document.
   Feedback lives in localStorage and exports to a JSON file the reviewer sends back -
   content stays single-sourced in the skill; this never writes to it. */
(function () {
  if (!/[?&]review\b/.test(location.search)) return;

  var KEY = "rv2-review";
  var S = (function () { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })();
  S.cards = S.cards || {}; S.refs = S.refs || {};
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function escA(s) { return esc(s).replace(/"/g, "&quot;"); }
  function $(id) { return document.getElementById(id); }

  // claim ids (the 46 change cards) - only these get a review strip / count toward progress
  var CLAIMS = {};
  (function () { var A = window.ASSESSMENT || {}; (A.topics || []).forEach(function (t) { (t.changes || []).forEach(function (c) { CLAIMS[c.id] = c.title || c.id; }); }); })();
  function claimCount() { return Object.keys(CLAIMS).length; }

  function injectCss() {
    if ($("rv-css")) return;
    var st = document.createElement("style"); st.id = "rv-css";
    st.textContent =
      "body.rv-on{padding-bottom:66px}" +
      ".rv-bar{position:fixed;left:0;right:0;bottom:0;z-index:1000;background:var(--navy-900,#1f2a44);color:#fff;display:flex;align-items:center;gap:14px;padding:10px 18px;box-shadow:0 -6px 24px rgba(31,42,68,.22);flex-wrap:wrap;font-family:var(--font-body,sans-serif)}" +
      ".rv-brand{font-family:var(--font-heading,inherit);font-weight:800;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold-500,#e8a33d);white-space:nowrap}" +
      ".rv-who{font-size:13px;color:#dbe0ec}.rv-who b{color:#fff;font-weight:700}.rv-who button{background:none;border:0;color:var(--gold-500,#e8a33d);font-size:11.5px;cursor:pointer;text-decoration:underline;padding:0}" +
      ".rv-stats{display:flex;align-items:center;gap:12px;margin-left:auto;font-size:12.5px;color:#cdd3e0;flex-wrap:wrap}" +
      ".rv-stat{display:inline-flex;align-items:center;gap:5px;white-space:nowrap}.rv-stat b{color:#fff}" +
      ".rv-dot{width:9px;height:9px;border-radius:50%;display:inline-block}.rv-dot.g{background:#4bbd82}.rv-dot.a{background:var(--gold-500,#e8a33d)}" +
      ".rv-prog{width:110px;height:6px;border-radius:99px;background:rgba(255,255,255,.16);overflow:hidden}.rv-prog i{display:block;height:100%;background:#4bbd82;width:0;transition:width .25s}" +
      ".rv-btn{font-family:var(--font-heading,inherit);font-weight:800;font-size:12.5px;border-radius:8px;padding:8px 14px;cursor:pointer;border:1.5px solid transparent}" +
      ".rv-btn.gold{background:var(--gold-500,#e8a33d);color:#3a2a08}.rv-btn.gold:hover{background:#f0b256}" +
      ".rv-btn.ghost{background:transparent;color:#fff;border-color:rgba(255,255,255,.3)}.rv-btn.ghost:hover{background:rgba(255,255,255,.1)}" +
      // per-card strip
      ".rv-strip{grid-column:1/-1;border-top:1px solid var(--cream-300,#e3dccb);margin:14px -16px -20px -22px;padding:11px 20px;background:var(--cream-100,#faf6ef);border-radius:0 0 15px 15px;display:flex;align-items:center;gap:9px;flex-wrap:wrap}" +
      ".rv-rl{font-family:var(--font-heading,inherit);font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-500,#7c8398);margin-right:2px}" +
      ".rv-rbtn{display:inline-flex;align-items:center;gap:6px;font-family:var(--font-heading,inherit);font-weight:800;font-size:12px;border-radius:8px;padding:6px 12px;cursor:pointer;background:#fff;border:1.5px solid var(--cream-300,#d8cfb8);color:var(--ink-700,#3a4256)}" +
      ".rv-rbtn:hover{border-color:var(--navy-900,#1f2a44)}.rv-rbtn.on-c{background:#1f8a52;border-color:#1f8a52;color:#fff}.rv-rbtn.on-f{background:var(--gold-500,#e8a33d);border-color:var(--gold-500,#e8a33d);color:#3a2a08}" +
      ".rv-notebtn{margin-left:auto;background:none;border:0;color:var(--sky-700,#5b7fa6);font-weight:700;font-size:11.5px;cursor:pointer}" +
      ".rv-note{width:100%;margin-top:2px;display:none}.rv-note.open{display:block}" +
      ".rv-note textarea{width:100%;min-height:52px;resize:vertical;font-family:inherit;font-size:13px;color:var(--ink-700,#3a4256);border:1.5px solid var(--cream-300,#d8cfb8);border-radius:9px;padding:9px 11px;background:#fff}" +
      ".rv-note textarea:focus{outline:none;border-color:var(--sky-700,#5b7fa6)}" +
      "[data-card-id].rv-c{border-color:#bfe0cd!important}[data-card-id].rv-f{border-color:#ecd6a3!important}" +
      // per-citation controls in the popover
      ".rv-cite{display:flex;align-items:center;gap:7px;margin-top:8px}.rv-cite .rv-rl{margin:0}" +
      ".rv-cbtn{font-family:var(--font-heading,inherit);font-weight:800;font-size:11px;border-radius:7px;padding:4px 10px;cursor:pointer;background:#fff;border:1.5px solid var(--cream-300,#d8cfb8);color:var(--ink-700,#3a4256)}" +
      ".rv-cbtn.on-c{background:#1f8a52;border-color:#1f8a52;color:#fff}.rv-cbtn.on-f{background:var(--gold-500,#e8a33d);border-color:var(--gold-500,#e8a33d);color:#3a2a08}" +
      // overlays
      ".rv-ov{position:fixed;inset:0;background:rgba(31,42,68,.5);display:none;align-items:center;justify-content:center;padding:22px;z-index:1100}.rv-ov.open{display:flex}" +
      ".rv-sheet{background:var(--cream-100,#faf6ef);border:1.5px solid var(--cream-300,#d8cfb8);border-radius:16px;width:100%;max-width:440px;overflow:hidden;box-shadow:0 24px 60px rgba(31,42,68,.34);font-family:var(--font-body,sans-serif)}" +
      ".rv-sh{background:var(--navy-900,#1f2a44);color:#fff;padding:16px 20px}.rv-sh .k{font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--gold-500,#e8a33d);margin-bottom:5px}.rv-sh h2{font-family:var(--font-display,serif);font-size:20px;margin:0}" +
      ".rv-sb{padding:18px 20px}.rv-field{display:block;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-500,#7c8398);margin:0 0 6px}" +
      ".rv-sb input[type=text]{width:100%;font-size:15px;padding:11px 13px;border:1.5px solid var(--cream-300,#d8cfb8);border-radius:10px;background:#fff;color:var(--ink-700,#3a4256)}.rv-sb input[type=text]:focus{outline:none;border-color:var(--gold-500,#e8a33d)}" +
      ".rv-sumrow{display:flex;gap:10px;margin:2px 0 14px}.rv-sumcard{flex:1;background:#fff;border:1.5px solid var(--cream-300,#e3dccb);border-radius:11px;padding:11px 6px;text-align:center}.rv-sumcard .n{font-family:var(--font-display,serif);font-size:24px;color:var(--navy-900,#1f2a44);line-height:1}.rv-sumcard .t{font-size:10px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:var(--ink-500,#7c8398);margin-top:4px}" +
      ".rv-signoff{display:flex;gap:9px;align-items:flex-start;background:#fff;border:1.5px solid var(--cream-300,#e3dccb);border-radius:11px;padding:12px 14px;margin:0 0 14px;cursor:pointer}.rv-signoff input{margin-top:2px;width:17px;height:17px;flex-shrink:0}.rv-signoff .t{font-size:13px}.rv-signoff .t b{color:var(--navy-900,#1f2a44)}.rv-signoff .t span{display:block;font-size:11.5px;color:var(--ink-500,#7c8398);margin-top:2px}" +
      ".rv-actions{display:flex;gap:9px}.rv-actions .rv-btn{flex:1;text-align:center;padding:11px}.rv-btn.dark{background:transparent;color:var(--navy-900,#1f2a44);border-color:var(--cream-300,#d8cfb8)}" +
      ".rv-toast{position:fixed;left:50%;bottom:78px;transform:translateX(-50%);background:var(--navy-900,#1f2a44);color:#fff;font-weight:700;font-size:13px;padding:11px 18px;border-radius:99px;box-shadow:0 10px 30px rgba(31,42,68,.3);display:none;z-index:1200}.rv-toast.show{display:block}" +
      "@media(max-width:560px){.rv-strip{margin:14px -16px -20px -16px}.rv-stats{width:100%;margin-left:0;justify-content:space-between}}";
    document.head.appendChild(st);
  }

  // ---------- chrome ----------
  function buildChrome() {
    if ($("rv-bar")) return;
    document.body.classList.add("rv-on");
    var bar = document.createElement("div"); bar.className = "rv-bar"; bar.id = "rv-bar";
    bar.innerHTML =
      '<span class="rv-brand">Beta review</span>' +
      '<span class="rv-who">Reviewing as <b id="rv-name">-</b> <button id="rv-edit">change</button></span>' +
      '<div class="rv-stats">' +
      '<span class="rv-stat"><span class="rv-dot g"></span><b id="rv-c">0</b>&nbsp;confirmed</span>' +
      '<span class="rv-stat"><span class="rv-dot a"></span><b id="rv-f">0</b>&nbsp;flagged</span>' +
      '<span class="rv-stat"><span class="rv-prog"><i id="rv-progbar"></i></span> <span id="rv-progtxt"></span></span>' +
      '<button class="rv-btn gold" id="rv-submit">Submit review</button></div>';
    document.body.appendChild(bar);

    var ov = document.createElement("div"); ov.innerHTML =
      '<div class="rv-ov" id="rv-nameov"><div class="rv-sheet"><div class="rv-sh"><div class="k">Beta review</div><h2>Who’s reviewing?</h2></div>' +
      '<div class="rv-sb"><label class="rv-field" for="rv-nameinput">Your name</label><input type="text" id="rv-nameinput" placeholder="e.g. Cole" autocomplete="off">' +
      '<div style="height:14px"></div><div class="rv-actions"><button class="rv-btn gold" id="rv-start" style="flex:1;padding:11px">Start reviewing</button></div></div></div></div>' +
      '<div class="rv-ov" id="rv-subov"><div class="rv-sheet"><div class="rv-sh"><div class="k">Submit review</div><h2 id="rv-subtitle">Your review</h2></div>' +
      '<div class="rv-sb"><div class="rv-sumrow"><div class="rv-sumcard"><div class="n" id="rv-sc">0</div><div class="t">Confirmed</div></div>' +
      '<div class="rv-sumcard"><div class="n" id="rv-sf">0</div><div class="t">Flagged</div></div><div class="rv-sumcard"><div class="n" id="rv-sn">0</div><div class="t">Notes</div></div></div>' +
      '<label class="rv-signoff"><input type="checkbox" id="rv-signoff"><span class="t"><b>Sign off — I’ve reviewed the whole document.</b><span>Marks your review complete before it goes to the wider group.</span></span></label>' +
      '<div class="rv-actions"><button class="rv-btn dark" id="rv-subcancel">Keep reviewing</button><button class="rv-btn gold" id="rv-subdownload">Download &amp; send</button></div></div></div></div>' +
      '<div class="rv-toast" id="rv-toast"></div>';
    document.body.appendChild(ov);

    $("rv-edit").onclick = askName;
    $("rv-start").onclick = function () { var v = $("rv-nameinput").value.trim(); if (!v) { $("rv-nameinput").focus(); return; } S.reviewer = v; save(); $("rv-name").textContent = v; $("rv-nameov").classList.remove("open"); };
    $("rv-nameinput").addEventListener("keydown", function (e) { if (e.key === "Enter") $("rv-start").click(); });
    $("rv-submit").onclick = openSubmit;
    $("rv-subcancel").onclick = function () { $("rv-subov").classList.remove("open"); };
    $("rv-subdownload").onclick = doDownload;

    $("rv-name").textContent = S.reviewer || "-";
    if (!S.reviewer) askName();
  }
  function askName() { $("rv-nameov").classList.add("open"); $("rv-nameinput").value = S.reviewer || ""; setTimeout(function () { $("rv-nameinput").focus(); }, 40); }
  function toast(m) { var t = $("rv-toast"); t.innerHTML = m; t.classList.add("show"); setTimeout(function () { t.classList.remove("show"); }, 3400); }

  // ---------- per-card strips ----------
  function stripInner(id) {
    var st = S.cards[id] || {};
    return '<span class="rv-rl">Your call</span>' +
      '<button class="rv-rbtn' + (st.status === "confirmed" ? " on-c" : "") + '" data-rv="confirm"><span>✓</span> Confirm</button>' +
      '<button class="rv-rbtn' + (st.status === "flagged" ? " on-f" : "") + '" data-rv="flag"><span>⚑</span> Flag</button>' +
      '<button class="rv-notebtn" data-rv="note">' + (st.note ? "Edit note" : "Add note") + '</button>' +
      '<div class="rv-note' + (st.note ? " open" : "") + '"><textarea placeholder="What should change? (optional)">' + esc(st.note || "") + '</textarea></div>';
  }
  function paintCard(card, id) {
    var st = S.cards[id] || {};
    card.classList.toggle("rv-c", st.status === "confirmed");
    card.classList.toggle("rv-f", st.status === "flagged");
    var strip = card.querySelector(":scope > .rv-strip"); if (!strip) return;
    var cb = strip.querySelector('[data-rv="confirm"]'), fb = strip.querySelector('[data-rv="flag"]');
    cb.classList.toggle("on-c", st.status === "confirmed");
    fb.classList.toggle("on-f", st.status === "flagged");
  }
  function applyReview() {
    injectCss(); buildChrome();
    document.querySelectorAll("[data-card-id]").forEach(function (card) {
      var id = card.getAttribute("data-card-id");
      if (!CLAIMS[id]) return;                       // only the 46 claim cards
      if (card.querySelector(":scope > .rv-strip")) return; // survives if not re-rendered
      var strip = document.createElement("div"); strip.className = "rv-strip"; strip.setAttribute("data-rv-for", id);
      strip.innerHTML = stripInner(id);
      card.appendChild(strip);
      paintCard(card, id);
    });
    updateBar();
  }
  window.__applyReview = applyReview;

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-rv]"); if (!b) return;
    var strip = b.closest(".rv-strip"); if (!strip) return;
    var id = strip.getAttribute("data-rv-for"), act = b.getAttribute("data-rv");
    if (act === "note") { var n = strip.querySelector(".rv-note"); n.classList.toggle("open"); if (n.classList.contains("open")) n.querySelector("textarea").focus(); return; }
    var st = S.cards[id] || {}; var want = act === "confirm" ? "confirmed" : "flagged";
    st.status = st.status === want ? null : want; S.cards[id] = st; save();
    paintCard(strip.closest("[data-card-id]"), id); updateBar();
  });
  document.addEventListener("input", function (e) {
    if (e.target.tagName !== "TEXTAREA") return;
    var strip = e.target.closest(".rv-strip"); if (!strip) return;
    var id = strip.getAttribute("data-rv-for"); var st = S.cards[id] || {}; st.note = e.target.value; S.cards[id] = st; save(); updateBar();
  });

  // ---------- per-citation controls (inside the reference popover) ----------
  var origOpen = window.__vcRefOpen;
  window.__vcRefOpen = function (btn) {
    var cardEl = btn.closest && btn.closest("[data-card-id]");
    var cid = cardEl ? cardEl.getAttribute("data-card-id") : "";
    if (origOpen) origOpen(btn);
    if (!CLAIMS[cid]) return;
    var body = $("vc-refbody"); if (!body) return;
    var clauses = body.querySelectorAll(".vc-refclause");
    clauses.forEach(function (cl, i) {
      if (cl.querySelector(".rv-cite")) return;
      var rk = cid + "::" + i, st = S.refs[rk] || {};
      var row = document.createElement("div"); row.className = "rv-cite"; row.setAttribute("data-rk", rk);
      row.innerHTML = '<span class="rv-rl">Citation</span>' +
        '<button class="rv-cbtn' + (st.status === "confirmed" ? " on-c" : "") + '" data-rvc="confirm">✓ Verbatim</button>' +
        '<button class="rv-cbtn' + (st.status === "flagged" ? " on-f" : "") + '" data-rvc="flag">⚑ Needs fix</button>';
      cl.appendChild(row);
    });
  };
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-rvc]"); if (!b) return;
    var row = b.closest(".rv-cite"); var rk = row.getAttribute("data-rk"), act = b.getAttribute("data-rvc");
    var st = S.refs[rk] || {}; var want = act === "confirm" ? "confirmed" : "flagged";
    st.status = st.status === want ? null : want; S.refs[rk] = st; save();
    row.querySelector('[data-rvc="confirm"]').classList.toggle("on-c", st.status === "confirmed");
    row.querySelector('[data-rvc="flag"]').classList.toggle("on-f", st.status === "flagged");
  });

  // ---------- stats + submit ----------
  function counts() {
    var c = 0, f = 0, n = 0;
    Object.keys(S.cards).forEach(function (k) { if (!CLAIMS[k]) return; var s = S.cards[k]; if (s.status === "confirmed") c++; if (s.status === "flagged") f++; if (s.note) n++; });
    Object.keys(S.refs).forEach(function (k) { var s = S.refs[k]; if (s.status === "flagged") f++; });
    return { c: c, f: f, n: n };
  }
  function updateBar() {
    if (!$("rv-bar")) return;
    var s = counts(), tot = claimCount(), done = 0;
    Object.keys(S.cards).forEach(function (k) { if (CLAIMS[k] && S.cards[k].status) done++; });
    $("rv-c").textContent = s.c; $("rv-f").textContent = s.f;
    $("rv-progtxt").textContent = done + " / " + tot;
    $("rv-progbar").style.width = tot ? Math.round(done / tot * 100) + "%" : "0%";
  }
  function openSubmit() {
    var s = counts();
    $("rv-subtitle").textContent = (S.reviewer || "Your") + (S.reviewer ? "’s" : "") + " review";
    $("rv-sc").textContent = s.c; $("rv-sf").textContent = s.f; $("rv-sn").textContent = s.n;
    $("rv-signoff").checked = !!S.signedOff;
    $("rv-subov").classList.add("open");
  }
  function doDownload() {
    S.signedOff = $("rv-signoff").checked; save();
    var d = new Date(), iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    var cards = {}; Object.keys(S.cards).forEach(function (k) { var it = S.cards[k]; if (it.status || it.note) cards[k] = { status: it.status || null, note: it.note || "" }; });
    var refs = {}; Object.keys(S.refs).forEach(function (k) { var it = S.refs[k]; if (it.status || it.note) refs[k] = { status: it.status || null, note: it.note || "" }; });
    var out = { reviewer: S.reviewer || null, date: iso, signedOff: !!S.signedOff, guide: "2026-ta-vote-guide", cards: cards, refs: refs };
    var name = "review-" + String(S.reviewer || "you").toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + iso + ".json";
    var blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 120);
    $("rv-subov").classList.remove("open");
    toast("Saved " + name + " — send it back to compile.");
  }

  // first paint (in case data is already present); the app also calls window.__applyReview on render
  if (window.ASSESSMENT && Object.keys(CLAIMS).length) applyReview();
})();
