/*
 * assessment-charts.js — the ONE chart renderer for the vote guide.
 * window.AssessmentChart(spec, opts) -> SVG string, where spec is an entry from
 * ASSESSMENT.charts. House style: direct labeling at line ends (series name +
 * plain-language value), no detached legend, labels never sit on the lines.
 *
 * OWNED BY THE SKILL (ADR-034). This file is shipped in the deliverable and
 * loaded VERBATIM by Claude Design. Design writes NO chart code of its own.
 * Every styling decision is driven by the data's `render` block and axis flags,
 * never inferred — so a directive the skill emits (showAllTicks, numberFormat,
 * emphasis, seriesOrder) is actually honored here, closing the drift loop that
 * caused the recurring tick/format/bar-vs-line bugs.
 *
 * opts: { width, height, subjectColor, thick, highlightGroup }
 */
(function () {
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function isConst(s) { return s.values.every(function (v) { return v === s.values[0]; }); }

  // ---- number formatting is DATA-DRIVEN via render.numberFormat (ADR-033) ----
  // never inferred from axis-label regex. Falls back to a label sniff only when
  // no render block is present (legacy data), so old files still render.
  function makeFormatters(spec) {
    var render = spec.render || {};
    var yl = (spec.axes && spec.axes.y && spec.axes.y.label) || "";
    var fmt = render.numberFormat
      || (/index|% of .*start/i.test(yl) ? "index"
        : /percent-of-start/i.test(yl) ? "percent-of-start"
        : /\$/.test(yl) ? "dollars"
        : /%|starting rate/.test(yl) ? "percent" : "plain");
    function tick(v) {
      if (fmt === "index") { var d = Math.round(v - 100); return (d > 0 ? "+" : "") + d + "%"; }
      if (fmt === "percent-of-start") { return (v / 100).toFixed(2) + "x"; }
      if (fmt === "dollars") return "$" + v.toFixed(2);
      if (fmt === "percent") return Math.round(v) + "%";
      return String(Math.round(v));
    }
    function endVal(s) {
      var v = s.values[s.values.length - 1];
      if (fmt === "index") { var d = Math.round(v - 100); return (d >= 0 ? "+" : "") + d + "% since day one"; }
      if (fmt === "percent-of-start") { return (v / 100).toFixed(2) + "x starting rate"; }
      if (fmt === "dollars") {
        var d0 = s.values[0];
        var pc = d0 ? Math.round((v - d0) / d0 * 100) : 0;
        return "$" + v.toFixed(2) + (isConst(s) ? "" : "  (" + (pc >= 0 ? "+" : "") + pc + "%)");
      }
      if (fmt === "percent") return Math.round(v) + "%";
      return String(Math.round(v));
    }
    return { fmt: fmt, tick: tick, endVal: endVal };
  }

  // verdict polarity: red for costs, green for gains, gold for neutral.
  // Drives gap fill/text and lets the caller (hero badge etc.) match.
  function polarityOf(spec) {
    var v = spec.verdict || "";
    return /POSITIVE|WIN|GAIN|AHEAD|IMPROV/i.test(v) ? "pos"
         : /NEGATIVE|CUT|CONCESSION|LOSS|EROSION|DECLINE|BEHIND|FLATTEN/i.test(v) ? "neg" : "neu";
  }
  window.AssessmentChartPolarity = polarityOf; // exported so chrome (badges) stays in sync

  // whether to draw every x tick. showAllTicks:true means NEVER thin (ADR-032/
  // v1.25.14): thinning the rung axis misrepresents where step changes land.
  function tickEvery(spec, n, crowdedDefault) {
    if (spec.axes && spec.axes.x && spec.axes.x.showAllTicks) return 1;
    return crowdedDefault;
  }

  // reorder series per render.seriesOrder (first name drawn at the back).
  // emphasis names the series drawn boldest/brightest; the rest recede.
  function orderedSeries(spec) {
    var series = (spec.series || []).slice();
    var order = spec.render && spec.render.seriesOrder;
    if (order && order.length) {
      series.sort(function (a, b) {
        var ia = order.indexOf(a.name), ib = order.indexOf(b.name);
        if (ia < 0) ia = 1e9; if (ib < 0) ib = 1e9;
        return ia - ib;
      });
    }
    return series;
  }
  function isEmphasis(spec, s) {
    return !!(spec.render && spec.render.emphasis && s.name === spec.render.emphasis);
  }

  // grouped vertical bars (e.g. per-step raise %, old ladder vs new) — its own layout,
  // separate from the line/step path above.
  function renderGroupedBars(spec, opts) {
    var W = opts.width || 1000, H = opts.height || 430;
    var f = makeFormatters(spec);
    var isPct = f.fmt === "percent";
    var xs = (spec.axes && spec.axes.x && spec.axes.x.ticks) || [];
    var n = xs.length;
    var series = orderedSeries(spec);
    var ns = series.length;
    var hasHL = !!(spec.highlightRange && spec.highlightRange.xIndexes && spec.highlightRange.xIndexes.length);
    var ml = 60, mr = 22, mt = 56 + (hasHL && spec.highlightRange.label ? 24 : 0), mb = 66;
    var pw = W - ml - mr, ph = H - mt - mb;
    var vals = []; series.forEach(function (s) { vals = vals.concat(s.values); });
    var hasYMin = spec.axes && spec.axes.y && spec.axes.y.min != null;
    var hasYMax = spec.axes && spec.axes.y && spec.axes.y.max != null;
    var ymax = hasYMax ? spec.axes.y.max : Math.max.apply(null, vals.concat([0]));
    if (!hasYMax) { if (!isFinite(ymax) || ymax <= 0) ymax = 1; ymax = ymax * 1.14; }
    var ymin = hasYMin ? spec.axes.y.min : Math.min.apply(null, vals.concat([0]));
    if (!hasYMin && ymin > 0) ymin = 0;
    var yAt = function (v) { return mt + ph * (1 - (v - ymin) / (ymax - ymin)); };
    // emphasis series drawn in signature navy, the rest in gold; falls back to
    // role, then alternating, when no emphasis is named.
    function barColor(s, si) {
      if (spec.render && spec.render.emphasis) return isEmphasis(spec, s) ? "var(--navy-900)" : "var(--gold-500)";
      if (s.role === "reference") return "var(--gold-500)";
      if (s.role === "subject") return "var(--navy-900)";
      return si % 2 ? "var(--navy-900)" : "var(--gold-500)";
    }
    var o = [];
    var G = 4;
    for (var g = 0; g <= G; g++) {
      var yv = ymin + (ymax - ymin) * g / G, yy = yAt(yv);
      o.push('<line x1="' + ml + '" x2="' + (ml + pw) + '" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) + '" stroke="rgba(31,42,68,0.08)"></line>');
      o.push('<text x="' + (ml - 9) + '" y="' + (yy + 5).toFixed(1) + '" text-anchor="end" fill="var(--ink-300)" font-size="13">' + (isPct ? Math.round(yv) + "%" : Math.round(yv)) + '</text>');
    }
    var groupW = pw / n;
    var innerPad = groupW * 0.16;
    var bw = (groupW - innerPad * 2) / ns;
    var yBase = yAt(Math.max(0, ymin));
    if (hasHL) {
      var hIdx = spec.highlightRange.xIndexes;
      var hMin = Math.min.apply(null, hIdx), hMax = Math.max.apply(null, hIdx);
      var hx = ml + groupW * hMin, hw = groupW * (hMax - hMin + 1);
      o.push('<rect x="' + hx.toFixed(1) + '" y="' + mt + '" width="' + hw.toFixed(1) + '" height="' + ph + '" fill="rgba(196,52,45,0.10)"></rect>');
      if (spec.highlightRange.label) {
        o.push('<text x="' + (hx + hw / 2).toFixed(1) + '" y="' + (mt - 12) + '" text-anchor="middle" fill="var(--red-600)" font-size="12.5" font-weight="800">' + esc(spec.highlightRange.label) + '</text>');
      }
    }
    for (var i = 0; i < n; i++) {
      var gx = ml + groupW * i + innerPad;
      for (var si = 0; si < ns; si++) {
        var v = series[si].values[i] || 0;
        var yv2 = yAt(v);
        var top = Math.min(yv2, yBase), hgt = Math.abs(yBase - yv2);
        if (hgt < 0.5) continue;
        var rw = bw * 0.84, rx = gx + bw * si + (bw - rw) / 2;
        o.push('<rect x="' + rx.toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + rw.toFixed(1) + '" height="' + hgt.toFixed(1) + '" rx="2.5" fill="' + barColor(series[si], si) + '"></rect>');
      }
    }
    o.push('<line x1="' + ml + '" x2="' + (ml + pw) + '" y1="' + yBase.toFixed(1) + '" y2="' + yBase.toFixed(1) + '" stroke="rgba(31,42,68,0.28)"></line>');
    // x labels — honor showAllTicks; only thin when the data permits it
    var every = tickEvery(spec, n, n > 12 ? 2 : 1);
    for (var k = 0; k < n; k++) {
      if ((n - 1 - k) % every !== 0) continue;
      var cx = ml + groupW * k + groupW / 2;
      var rot = (every === 1 && n > 12);
      if (rot) {
        var rxp = cx.toFixed(1), ryp = (mt + ph + 16);
        o.push('<text x="' + rxp + '" y="' + ryp + '" text-anchor="end" fill="var(--ink-300)" font-size="11" transform="rotate(-45 ' + rxp + ' ' + ryp + ')">' + esc(String(xs[k])) + '</text>');
      } else {
        o.push('<text x="' + cx.toFixed(1) + '" y="' + (mt + ph + 20) + '" text-anchor="middle" fill="var(--ink-300)" font-size="11.5">' + esc(String(xs[k])) + '</text>');
      }
    }
    var xlab = (spec.axes && spec.axes.x && spec.axes.x.label) || "";
    if (xlab) o.push('<text x="' + (ml + pw / 2) + '" y="' + (mt + ph + 56) + '" text-anchor="middle" fill="var(--ink-500)" font-size="12.5" font-weight="700">' + esc(xlab) + '</text>');
    // legend placement honors render.legend corner (default top-left)
    var legCorner = (spec.render && spec.render.legend) || "top-left";
    var lx = /right/.test(legCorner) ? (ml + pw) : ml, ly = 26;
    var swatches = series.map(function (s, li) { return { col: barColor(s, li), nm: s.name || "" }; });
    if (/right/.test(legCorner)) {
      var totalW = swatches.reduce(function (a, s) { return a + 21 + s.nm.length * 7.7 + 26; }, 0);
      lx = ml + pw - totalW;
    }
    swatches.forEach(function (sw) {
      o.push('<rect x="' + lx + '" y="' + (ly - 11) + '" width="15" height="13" rx="3" fill="' + sw.col + '"></rect>');
      o.push('<text x="' + (lx + 21) + '" y="' + ly + '" fill="var(--ink-700)" font-size="14" font-weight="800">' + esc(sw.nm) + '</text>');
      lx += 21 + sw.nm.length * 7.7 + 26;
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block;" role="img" aria-label="' + esc(spec.headline || spec.id) + '">' + o.join("") + "</svg>";
  }

  window.AssessmentChart = function (spec, opts) {
    opts = opts || {};
    if (spec.kind === "bar_grouped") return renderGroupedBars(spec, opts);
    var W = opts.width || 1000, H = opts.height || 430;
    var f = makeFormatters(spec);
    var valueLabels = (spec.render && spec.render.valueLabels) || "endpoints";

    // reserve extra bottom space for a numbered annotation key when there are annotations
    var nAnn = (spec.annotations || []).length;
    var annExtra = nAnn ? (nAnn * 20 + 24) : 0;
    H = H + annExtra;

    var xs = (spec.axes && spec.axes.x && spec.axes.x.ticks) || [];
    var n = xs.length;
    // rotated (diagonal) tick labels need more vertical room below the plot so the
    // gap-label swatch and annotation key never crowd/overlap the axis text.
    var rotateAllPre = (tickEvery(spec, n, n > 8 ? Math.ceil(n / 7) : 1) === 1 && n > 10);
    // right-hand label band scales with the viewBox width (was a fixed 300, which
    // ate ~45% of a compact in-card chart and starved the plot). Proportional keeps
    // the plot filling the card while still leaving room for the end labels. The left
    // margin only holds short y-tick labels, so it stays tight.
    var ml = 56, mr = (valueLabels === "none" ? 34 : Math.round(W * 0.25)), mt = 24, mb = 76 + annExtra + (rotateAllPre ? 26 : 0);
    var pw = W - ml - mr, ph = H - mt - mb;
    var xAt = function (i) { return ml + (n <= 1 ? pw / 2 : pw * i / (n - 1)); };

    var seriesArr = orderedSeries(spec);
    var vals = [];
    seriesArr.forEach(function (s) { vals = vals.concat(s.values); });
    var hasYMin = spec.axes.y && spec.axes.y.min != null;
    var hasYMax = spec.axes.y && spec.axes.y.max != null;
    var ymin = hasYMin ? spec.axes.y.min : Math.min.apply(null, vals);
    var ymax = hasYMax ? spec.axes.y.max : Math.max.apply(null, vals);
    if (ymin === ymax) ymax = ymin + 1;
    // an EXPLICIT min/max in the data is a deliberate floor/ceiling (a real baseline
    // like $0 or 100%-of-start) and must sit flush at the plot edge — only an
    // INFERRED bound (no min/max given) gets breathing-room padding.
    var padv = (ymax - ymin) * 0.14;
    if (!hasYMin) ymin -= padv;
    if (!hasYMax) ymax += padv;
    var yAt = function (v) { return mt + ph * (1 - (v - ymin) / (ymax - ymin)); };
    function xAtVal(v) {
      var i = xs.indexOf(v);
      if (i >= 0) return xAt(i);
      for (var k = 0; k < n - 1; k++) {
        var a = xs[k], b = xs[k + 1];
        if (typeof a === "number" && typeof b === "number" && v >= Math.min(a, b) && v <= Math.max(a, b)) {
          var t = (v - a) / (b - a); return xAt(k) + (xAt(k + 1) - xAt(k)) * t;
        }
      }
      return null;
    }
    function yAtValOf(s, v) {
      var i = xs.indexOf(v);
      if (i >= 0) return yAt(s.values[i]);
      for (var k = 0; k < n - 1; k++) {
        var a = xs[k], b = xs[k + 1];
        if (typeof a === "number" && typeof b === "number" && v >= Math.min(a, b) && v <= Math.max(a, b)) {
          var t = (v - a) / (b - a); return yAt(s.values[k] + (s.values[k + 1] - s.values[k]) * t);
        }
      }
      return yAt(s.values[0]);
    }

    var pol = polarityOf(spec);
    var gapFill = pol === "pos" ? "rgba(31,138,82,0.12)" : pol === "neu" ? "rgba(232,163,61,0.13)" : "rgba(196,52,45,0.10)";
    var gapText = pol === "pos" ? "var(--success-600)" : pol === "neu" ? "var(--gold-600)" : "var(--red-600)";

    var o = [];

    // gridlines + y ticks
    var G = 4;
    for (var g = 0; g <= G; g++) {
      var yv = ymin + (ymax - ymin) * g / G, yy = yAt(yv);
      o.push('<line x1="' + ml + '" x2="' + (ml + pw) + '" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) + '" stroke="rgba(31,42,68,0.08)"></line>');
      o.push('<text x="' + (ml - 10) + '" y="' + (yy + 5).toFixed(1) + '" text-anchor="end" fill="var(--ink-300)" font-size="14">' + f.tick(yv) + '</text>');
    }

    // shaded gap between two named series, following each series' drawn path exactly.
    function edgePts(s) {
      var isStep = spec.kind === "step" && s.role !== "reference" && !isConst(s);
      var p = [];
      if (isStep) {
        p.push([xAt(0), yAt(s.values[0])]);
        for (var i = 1; i < n; i++) {
          p.push([xAt(i), yAt(s.values[i - 1])]);
          p.push([xAt(i), yAt(s.values[i])]);
        }
      } else {
        for (var i = 0; i < n; i++) p.push([xAt(i), yAt(s.values[i])]);
      }
      return p;
    }
    var gapA = null, gapB = null;
    if (spec.shadeGap && spec.shadeGap.between) {
      gapA = seriesArr.filter(function (s) { return s.name === spec.shadeGap.between[0]; })[0];
      gapB = seriesArr.filter(function (s) { return s.name === spec.shadeGap.between[1]; })[0];
      if (gapA && gapB && gapA !== gapB) {
        var top = edgePts(gapA), bot = edgePts(gapB), pts = [];
        top.forEach(function (pt) { pts.push(pt[0].toFixed(1) + "," + pt[1].toFixed(1)); });
        for (var k = bot.length - 1; k >= 0; k--) pts.push(bot[k][0].toFixed(1) + "," + bot[k][1].toFixed(1));
        o.push('<polygon points="' + pts.join(" ") + '" fill="' + gapFill + '"></polygon>');
      }
    }

    // series lines
    var colOf = [];
    // draw dimmed/other series first so the highlighted (group or emphasis) line sits on top
    var drawOrder = seriesArr.map(function (_, i) { return i; }).sort(function (a, b) {
      var sa = (seriesArr[a].role === "group" && opts.highlightGroup === seriesArr[a].group) || isEmphasis(spec, seriesArr[a]) ? 1 : 0;
      var sb = (seriesArr[b].role === "group" && opts.highlightGroup === seriesArr[b].group) || isEmphasis(spec, seriesArr[b]) ? 1 : 0;
      return sa - sb;
    });
    drawOrder.forEach(function (si) {
      var s = seriesArr[si];
      var col, dash = "", w = opts.thick ? 5 : 3.5, dim = false;
      if (s.role === "group") {
        if (opts.highlightGroup && s.group === opts.highlightGroup) { col = opts.subjectColor || "var(--navy-900)"; w = opts.thick ? 5.5 : 4; }
        else { col = "var(--ink-300)"; w = opts.thick ? 2.5 : 2; dim = true; }
      }
      else if (s.role === "defended") { col = "var(--ink-300)"; dash = "7 6"; }
      else if (isConst(s)) { col = "var(--ink-300)"; dash = "6 5"; w = opts.thick ? 3 : 2.5; }
      else if (s.role === "reference") { col = "var(--red-600)"; }
      else if (spec.render && spec.render.emphasis) {
        // emphasis-driven: named series bold navy, the rest muted
        if (isEmphasis(spec, s)) { col = opts.subjectColor || "var(--navy-900)"; w = opts.thick ? 5.5 : 4; }
        else { col = "var(--ink-300)"; w = opts.thick ? 3 : 2.5; dim = true; }
      }
      else { col = opts.subjectColor || "var(--navy-900)"; }
      colOf[si] = { col: col, dash: dash, dim: dim };
      var d = "", smooth = s.smooth === true, stepDraw = !smooth && spec.kind === "step" && s.role !== "reference" && !isConst(s);
      if (stepDraw) {
        d = "M " + xAt(0).toFixed(1) + " " + yAt(s.values[0]).toFixed(1);
        for (var i = 1; i < n; i++) {
          d += " L " + xAt(i).toFixed(1) + " " + yAt(s.values[i - 1]).toFixed(1);
          d += " L " + xAt(i).toFixed(1) + " " + yAt(s.values[i]).toFixed(1);
        }
      } else {
        for (var i = 0; i < n; i++) d += (i ? " L " : "M ") + xAt(i).toFixed(1) + " " + yAt(s.values[i]).toFixed(1);
      }
      o.push('<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + w + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : "") + ' stroke-linejoin="round" stroke-linecap="round"></path>');
      o.push('<circle cx="' + xAt(n - 1).toFixed(1) + '" cy="' + yAt(s.values[n - 1]).toFixed(1) + '" r="4.5" fill="' + col + '"></circle>');
      if (n <= 8 && s.role !== "reference" && s.role !== "defended" && !isConst(s) && !dim) {
        for (var vi = 0; vi < n - 1; vi++) {
          o.push('<circle cx="' + xAt(vi).toFixed(1) + '" cy="' + yAt(s.values[vi]).toFixed(1) + '" r="3.5" fill="' + col + '"></circle>');
        }
      }
    });

    // direct labels at line ends — suppressed entirely when valueLabels:"none"
    if (valueLabels !== "none") {
      var maxChars = Math.floor((mr - 24) / 7.6);
      var wrapName = function (name) {
        // a trailing parenthetical (e.g. "Prices (cost of living)") always starts
        // its own row; each segment is then word-wrapped to the label band width.
        var segs = String(name).split(/\s+(?=\()/);
        var lines = [];
        segs.forEach(function (seg) {
          var words = seg.split(" "), cur = "";
          words.forEach(function (wd) {
            if (cur && (cur + " " + wd).length > maxChars) { lines.push(cur); cur = wd; }
            else cur = cur ? cur + " " + wd : wd;
          });
          if (cur) lines.push(cur);
        });
        return lines;
      };
      var labels = seriesArr.map(function (s, si) {
        return { si: si, y: yAt(s.values[n - 1]), lines: wrapName(s.name), val: f.endVal(s) };
      }).sort(function (a, b) { return a.y - b.y; });
      labels.forEach(function (L) { L.h = L.lines.length * 18 + 22; });
      for (var li = 0; li < labels.length; li++) {
        if (li > 0 && labels[li].y - labels[li - 1].y < labels[li - 1].h) labels[li].y = labels[li - 1].y + labels[li - 1].h;
      }
      var lastL = labels[labels.length - 1];
      var overflow = lastL ? (lastL.y + lastL.h - 20) - (mt + ph + 20) : 0;
      if (overflow > 0) for (var li2 = 0; li2 < labels.length; li2++) labels[li2].y -= overflow;
      labels.forEach(function (L) {
        var c = colOf[L.si];
        var lx = ml + pw + 14;
        L.lines.forEach(function (ln, i2) {
          o.push('<text x="' + lx + '" y="' + (L.y - 2 + i2 * 18).toFixed(1) + '" fill="' + c.col + '" font-size="14.5" font-weight="800">' + esc(ln) + '</text>');
        });
        o.push('<text x="' + lx + '" y="' + (L.y - 2 + L.lines.length * 18).toFixed(1) + '" fill="var(--ink-500)" font-size="13.5" font-weight="700">' + esc(L.val) + '</text>');
      });
    }

    // gap label under the x axis
    if (spec.shadeGap && spec.shadeGap.label && gapA && gapB && gapA !== gapB) {
      var gy2 = mt + ph + (rotateAllPre ? 74 : 54);
      o.push('<rect x="' + ml + '" y="' + (gy2 - 11) + '" width="18" height="13" rx="3" fill="' + gapFill.replace(/0\.1[0-9]?/, "0.45") + '"></rect>');
      o.push('<text x="' + (ml + 26) + '" y="' + gy2 + '" fill="' + gapText + '" font-size="14" font-weight="800">' + esc(spec.shadeGap.label) + '</text>');
    }

    // annotations: numbered pins + numbered key below the plot
    var annList = (spec.annotations || []).map(function (an) {
      var s = seriesArr.filter(function (x) { return x.name === an.series; })[0] || seriesArr[0];
      var ax = xAtVal(an.at);
      if (ax == null) return null;
      return { x: ax, y: yAtValOf(s, an.at), text: an.text };
    }).filter(Boolean);
    annList.forEach(function (a, i) {
      o.push('<circle cx="' + a.x.toFixed(1) + '" cy="' + a.y.toFixed(1) + '" r="9" fill="var(--cream-100, #FBF7EF)" stroke="var(--navy-900)" stroke-width="2"></circle>');
      o.push('<text x="' + a.x.toFixed(1) + '" y="' + (a.y + 4).toFixed(1) + '" text-anchor="middle" fill="var(--navy-900)" font-size="11" font-weight="800">' + (i + 1) + '</text>');
    });
    if (annList.length) {
      var lyStart = mt + ph + (rotateAllPre ? 94 : 74);
      annList.forEach(function (a, i) {
        var yy = lyStart + i * 20;
        o.push('<circle cx="' + (ml + 8) + '" cy="' + (yy - 4).toFixed(1) + '" r="8.5" fill="var(--navy-900)"></circle>');
        o.push('<text x="' + (ml + 8) + '" y="' + (yy - 0.5).toFixed(1) + '" text-anchor="middle" fill="#fff" font-size="11" font-weight="800">' + (i + 1) + '</text>');
        o.push('<text x="' + (ml + 24) + '" y="' + yy.toFixed(1) + '" fill="var(--ink-500)" font-size="13" font-weight="600">' + esc(a.text) + '</text>');
      });
    }

    // x labels — honor showAllTicks (never thin the rung axis); rotate when crowded
    var every = tickEvery(spec, n, n > 8 ? Math.ceil(n / 7) : 1);
    var rotateAll = (every === 1 && n > 10);
    for (var k = 0; k < n; k++) {
      if ((n - 1 - k) % every !== 0) continue;
      if (rotateAll) {
        var rxp = xAt(k).toFixed(1), ryp = (mt + ph + 22);
        o.push('<text x="' + rxp + '" y="' + ryp + '" text-anchor="end" fill="var(--ink-300)" font-size="12" transform="rotate(-45 ' + rxp + ' ' + ryp + ')">' + esc(String(xs[k])) + '</text>');
      } else {
        o.push('<text x="' + xAt(k).toFixed(1) + '" y="' + (mt + ph + 28) + '" text-anchor="middle" fill="var(--ink-300)" font-size="14">' + esc(String(xs[k])) + '</text>');
      }
    }

    return '<svg viewBox="0 0 ' + W + " " + H + '" style="width:100%;height:auto;display:block;" role="img" aria-label="' + esc(spec.headline || spec.id) + '">' + o.join("") + "</svg>";
  };
})();
