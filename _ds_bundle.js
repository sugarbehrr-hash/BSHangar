/* @ds-bundle: {"format":4,"namespace":"BlueStreakHangarDesignSystem_a233fe","components":[{"name":"Callout","sourcePath":"components/content/Callout.jsx"},{"name":"ListRow","sourcePath":"components/content/ListRow.jsx"},{"name":"QuestionsFooter","sourcePath":"components/content/QuestionsFooter.jsx"},{"name":"SectionHeader","sourcePath":"components/content/SectionHeader.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"IconBadge","sourcePath":"components/core/IconBadge.jsx"}],"sourceHashes":{"blue-streak-vote-guide/assessment-charts.js":"14af50964089","blue-streak-vote-guide/assessment.data.js":"062a089d34b5","blue-streak-vote-guide/card-render.js":"90b7c99266b5","components/content/Callout.jsx":"9f865637158f","components/content/ListRow.jsx":"feec24bef35f","components/content/QuestionsFooter.jsx":"e14911e0ef91","components/content/SectionHeader.jsx":"079e07dc67bd","components/core/Badge.jsx":"6e33a7693a83","components/core/Button.jsx":"fa8fb4a226f0","components/core/Card.jsx":"cfe67b118b28","components/core/IconBadge.jsx":"e4cede0d55ec","ds-base.js":"efcf50a05f15"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.BlueStreakHangarDesignSystem_a233fe = window.BlueStreakHangarDesignSystem_a233fe || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// blue-streak-vote-guide/assessment-charts.js
try { (() => {
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
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function isConst(s) {
    return s.values.every(function (v) {
      return v === s.values[0];
    });
  }

  // ---- number formatting is DATA-DRIVEN via render.numberFormat (ADR-033) ----
  // never inferred from axis-label regex. Falls back to a label sniff only when
  // no render block is present (legacy data), so old files still render.
  function makeFormatters(spec) {
    var render = spec.render || {};
    var yl = spec.axes && spec.axes.y && spec.axes.y.label || "";
    var fmt = render.numberFormat || (/index|% of .*start/i.test(yl) ? "index" : /percent-of-start/i.test(yl) ? "percent-of-start" : /\$/.test(yl) ? "dollars" : /%|starting rate/.test(yl) ? "percent" : "plain");
    // Print the number the DATA holds. Math.round() once turned a 25.5% value into "26%"
    // beside a caption that said 25.5% - the chart contradicted its own words (ADR-041).
    // Show a decimal whenever the value actually has one.
    function pct(v) {
      return (Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1)) + "%";
    }
    function tick(v) {
      if (fmt === "index") {
        var d = v - 100;
        return (d > 0 ? "+" : "") + pct(d);
      }
      if (fmt === "percent-of-start") {
        return (v / 100).toFixed(2) + "x";
      }
      if (fmt === "dollars") return "$" + v.toFixed(2);
      if (fmt === "percent") return pct(v);
      return String(Math.round(v));
    }
    function endVal(s) {
      var v = s.values[s.values.length - 1];
      if (fmt === "index") {
        var d = v - 100;
        return (d >= 0 ? "+" : "") + pct(d) + " since day one";
      }
      if (fmt === "percent-of-start") {
        return (v / 100).toFixed(2) + "x your starting pay";
      }
      if (fmt === "dollars") {
        var d0 = s.values[0];
        var pc = d0 ? Math.round((v - d0) / d0 * 100) : 0;
        return "$" + v.toFixed(2) + (isConst(s) ? "" : "  (" + (pc >= 0 ? "+" : "") + pc + "%)");
      }
      if (fmt === "percent") return pct(v);
      return String(Math.round(v));
    }
    return {
      fmt: fmt,
      tick: tick,
      endVal: endVal
    };
  }

  // verdict polarity: red for costs, green for gains, gold for neutral.
  // Drives gap fill/text and lets the caller (hero badge etc.) match.
  // Polarity comes from the DATA (spec.polarity), never from the verdict's spelling (ADR-040).
  // Regexing the label meant renaming "Roughly a wash" -> "About even" silently turned neutral
  // cells red. The regex survives ONLY as a fallback for legacy data with no polarity field.
  function polarityOf(spec) {
    if (spec.polarity === "pos" || spec.polarity === "neu" || spec.polarity === "neg") return spec.polarity;
    var v = spec.verdict || "";
    return /POSITIVE|WIN|GAIN|AHEAD|IMPROV/i.test(v) ? "pos" : /NEGATIVE|CUT|CONCESSION|LOSS|EROSION|DECLINE|BEHIND|FLATTEN/i.test(v) ? "neg" : "neu";
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
        var ia = order.indexOf(a.name),
          ib = order.indexOf(b.name);
        if (ia < 0) ia = 1e9;
        if (ib < 0) ib = 1e9;
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
    var W = opts.width || 1000,
      H = opts.height || 430;
    var f = makeFormatters(spec);
    var isPct = f.fmt === "percent";
    var xs = spec.axes && spec.axes.x && spec.axes.x.ticks || [];
    var n = xs.length;
    var series = orderedSeries(spec);
    var ns = series.length;
    var hasHL = !!(spec.highlightRange && spec.highlightRange.xIndexes && spec.highlightRange.xIndexes.length);
    var ml = 60,
      mr = 22,
      mt = 56 + (hasHL && spec.highlightRange.label ? 24 : 0),
      mb = 66;
    var pw = W - ml - mr,
      ph = H - mt - mb;
    var vals = [];
    series.forEach(function (s) {
      vals = vals.concat(s.values);
    });
    var hasYMin = spec.axes && spec.axes.y && spec.axes.y.min != null;
    var hasYMax = spec.axes && spec.axes.y && spec.axes.y.max != null;
    var ymax = hasYMax ? spec.axes.y.max : Math.max.apply(null, vals.concat([0]));
    if (!hasYMax) {
      if (!isFinite(ymax) || ymax <= 0) ymax = 1;
      ymax = ymax * 1.14;
    }
    var ymin = hasYMin ? spec.axes.y.min : Math.min.apply(null, vals.concat([0]));
    if (!hasYMin && ymin > 0) ymin = 0;
    var yAt = function (v) {
      return mt + ph * (1 - (v - ymin) / (ymax - ymin));
    };
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
      var yv = ymin + (ymax - ymin) * g / G,
        yy = yAt(yv);
      o.push('<line x1="' + ml + '" x2="' + (ml + pw) + '" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) + '" stroke="rgba(31,42,68,0.08)"></line>');
      o.push('<text x="' + (ml - 9) + '" y="' + (yy + 5).toFixed(1) + '" text-anchor="end" fill="var(--ink-300)" font-size="13">' + (isPct ? Math.round(yv) + "%" : Math.round(yv)) + '</text>');
    }
    var groupW = pw / n;
    var innerPad = groupW * 0.16;
    var bw = (groupW - innerPad * 2) / ns;
    var yBase = yAt(Math.max(0, ymin));
    if (hasHL) {
      var hIdx = spec.highlightRange.xIndexes;
      var hMin = Math.min.apply(null, hIdx),
        hMax = Math.max.apply(null, hIdx);
      var hx = ml + groupW * hMin,
        hw = groupW * (hMax - hMin + 1);
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
        var top = Math.min(yv2, yBase),
          hgt = Math.abs(yBase - yv2);
        if (hgt < 0.5) continue;
        var rw = bw * 0.84,
          rx = gx + bw * si + (bw - rw) / 2;
        o.push('<rect x="' + rx.toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + rw.toFixed(1) + '" height="' + hgt.toFixed(1) + '" rx="2.5" fill="' + barColor(series[si], si) + '"></rect>');
      }
    }
    o.push('<line x1="' + ml + '" x2="' + (ml + pw) + '" y1="' + yBase.toFixed(1) + '" y2="' + yBase.toFixed(1) + '" stroke="rgba(31,42,68,0.28)"></line>');
    // x labels — honor showAllTicks; only thin when the data permits it
    var every = tickEvery(spec, n, n > 12 ? 2 : 1);
    for (var k = 0; k < n; k++) {
      if ((n - 1 - k) % every !== 0) continue;
      var cx = ml + groupW * k + groupW / 2;
      var rot = every === 1 && n > 12;
      if (rot) {
        var rxp = cx.toFixed(1),
          ryp = mt + ph + 16;
        o.push('<text x="' + rxp + '" y="' + ryp + '" text-anchor="end" fill="var(--ink-300)" font-size="11" transform="rotate(-45 ' + rxp + ' ' + ryp + ')">' + esc(String(xs[k])) + '</text>');
      } else {
        o.push('<text x="' + cx.toFixed(1) + '" y="' + (mt + ph + 20) + '" text-anchor="middle" fill="var(--ink-300)" font-size="11.5">' + esc(String(xs[k])) + '</text>');
      }
    }
    var xlab = spec.axes && spec.axes.x && spec.axes.x.label || "";
    if (xlab) o.push('<text x="' + (ml + pw / 2) + '" y="' + (mt + ph + 56) + '" text-anchor="middle" fill="var(--ink-500)" font-size="12.5" font-weight="700">' + esc(xlab) + '</text>');
    // legend placement honors render.legend corner (default top-left)
    var legCorner = spec.render && spec.render.legend || "top-left";
    var lx = /right/.test(legCorner) ? ml + pw : ml,
      ly = 26;
    var swatches = series.map(function (s, li) {
      return {
        col: barColor(s, li),
        nm: s.name || ""
      };
    });
    if (/right/.test(legCorner)) {
      var totalW = swatches.reduce(function (a, s) {
        return a + 21 + s.nm.length * 7.7 + 26;
      }, 0);
      lx = ml + pw - totalW;
    }
    swatches.forEach(function (sw) {
      o.push('<rect x="' + lx + '" y="' + (ly - 11) + '" width="15" height="13" rx="3" fill="' + sw.col + '"></rect>');
      o.push('<text x="' + (lx + 21) + '" y="' + ly + '" fill="var(--ink-700)" font-size="14" font-weight="800">' + esc(sw.nm) + '</text>');
      lx += 21 + sw.nm.length * 7.7 + 26;
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block;" role="img" aria-label="' + esc(spec.headline || spec.id) + '">' + o.join("") + "</svg>";
  }

  // ---- unit toggle (ADR-039) ----------------------------------------------------
  // spec.units declares alternate presentations of the SAME stored numbers. Design passes
  // opts.unit (a unit key); we transform a COPY of the spec, so one dataset serves both
  // views and they can never drift. indexTo:"first" => v / series[0] * 100.
  function applyUnit(spec, unitKey) {
    var units = spec.units;
    if (!units || !units.length) return spec;
    var u = null;
    for (var i = 0; i < units.length; i++) {
      if (units[i].key === unitKey) {
        u = units[i];
        break;
      }
    }
    if (!u) {
      for (var j = 0; j < units.length; j++) if (units[j]["default"]) u = units[j];
    }
    if (!u) u = units[0];
    var out = JSON.parse(JSON.stringify(spec));
    if (typeof u.scaleBy === "number") {
      out.series.forEach(function (s) {
        s.values = s.values.map(function (v) {
          return Math.round(v * u.scaleBy * 100) / 100;
        });
      });
      if (out.axes && out.axes.y) {
        delete out.axes.y.min;
        delete out.axes.y.max;
      }
    }
    if (u.indexTo === "first") {
      out.series.forEach(function (s) {
        var base = s.values[0];
        if (base) s.values = s.values.map(function (v) {
          return Math.round(v / base * 1000) / 10;
        });
      });
      // an indexed view has a TRUE baseline: every series starts at 100 (=1.00x). Pin the
      // floor there so the axis can't pad below 1.00x and print a meaningless "0.84x" tick.
      // (An explicit min sits flush at the plot edge - a real baseline, not inferred padding.)
      if (out.axes && out.axes.y) {
        out.axes.y.min = 100;
        delete out.axes.y.max;
      }
      if (out.shadeGap) {/* names unchanged, gap still valid */}
    }
    out.axes = out.axes || {};
    out.axes.y = out.axes.y || {};
    if (u.axisLabel) out.axes.y.label = u.axisLabel;
    out.render = out.render || {};
    if (u.numberFormat) out.render.numberFormat = u.numberFormat;
    out.activeUnit = u.key;
    return out;
  }
  window.AssessmentChartUnits = function (spec) {
    return spec.units || [];
  };
  window.AssessmentChart = function (spec, opts) {
    opts = opts || {};
    if (spec.units && spec.units.length) spec = applyUnit(spec, opts.unit);
    if (spec.kind === "bar_grouped") return renderGroupedBars(spec, opts);
    var W = opts.width || 1000,
      H = opts.height || 430;
    var f = makeFormatters(spec);
    var valueLabels = spec.render && spec.render.valueLabels || "endpoints";

    // reserve extra bottom space for a numbered annotation key when there are annotations
    var nAnn = (spec.annotations || []).length;
    var annExtra = nAnn ? nAnn * 20 + 24 : 0;
    H = H + annExtra;
    var xs = spec.axes && spec.axes.x && spec.axes.x.ticks || [];
    var n = xs.length;
    // rotated (diagonal) tick labels need more vertical room below the plot so the
    // gap-label swatch and annotation key never crowd/overlap the axis text.
    var rotateAllPre = tickEvery(spec, n, n > 8 ? Math.ceil(n / 7) : 1) === 1 && n > 10;
    var hasNames = valueLabels !== "none" && (spec.series || []).some(function (s) {
      return s.name;
    });
    var legRows = hasNames ? (spec.series || []).length : 0;
    var legendH = legRows ? legRows * 22 + 10 : 0;
    H = H + legendH;
    var ml = 78,
      mr = 22,
      mt = 22 + legendH,
      mb = 76 + annExtra + (rotateAllPre ? 26 : 0);
    var pw = W - ml - mr,
      ph = H - mt - mb;
    var xAt = function (i) {
      return ml + (n <= 1 ? pw / 2 : pw * i / (n - 1));
    };
    var seriesArr = orderedSeries(spec);
    var vals = [];
    seriesArr.forEach(function (s) {
      vals = vals.concat(s.values);
    });
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
    var yAt = function (v) {
      return mt + ph * (1 - (v - ymin) / (ymax - ymin));
    };
    function xAtVal(v) {
      var i = xs.indexOf(v);
      if (i >= 0) return xAt(i);
      for (var k = 0; k < n - 1; k++) {
        var a = xs[k],
          b = xs[k + 1];
        if (typeof a === "number" && typeof b === "number" && v >= Math.min(a, b) && v <= Math.max(a, b)) {
          var t = (v - a) / (b - a);
          return xAt(k) + (xAt(k + 1) - xAt(k)) * t;
        }
      }
      return null;
    }
    function yAtValOf(s, v) {
      var i = xs.indexOf(v);
      if (i >= 0) return yAt(s.values[i]);
      for (var k = 0; k < n - 1; k++) {
        var a = xs[k],
          b = xs[k + 1];
        if (typeof a === "number" && typeof b === "number" && v >= Math.min(a, b) && v <= Math.max(a, b)) {
          var t = (v - a) / (b - a);
          return yAt(s.values[k] + (s.values[k + 1] - s.values[k]) * t);
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
      var yv = ymin + (ymax - ymin) * g / G,
        yy = yAt(yv);
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
    var gapA = null,
      gapB = null;
    if (spec.shadeGap && spec.shadeGap.between) {
      gapA = seriesArr.filter(function (s) {
        return s.name === spec.shadeGap.between[0];
      })[0];
      gapB = seriesArr.filter(function (s) {
        return s.name === spec.shadeGap.between[1];
      })[0];
      if (gapA && gapB && gapA !== gapB) {
        var top = edgePts(gapA),
          bot = edgePts(gapB),
          pts = [];
        top.forEach(function (pt) {
          pts.push(pt[0].toFixed(1) + "," + pt[1].toFixed(1));
        });
        for (var k = bot.length - 1; k >= 0; k--) pts.push(bot[k][0].toFixed(1) + "," + bot[k][1].toFixed(1));
        o.push('<polygon points="' + pts.join(" ") + '" fill="' + gapFill + '"></polygon>');
      }
    }

    // series lines
    var colOf = [];
    // draw dimmed/other series first so the highlighted (group or emphasis) line sits on top
    var drawOrder = seriesArr.map(function (_, i) {
      return i;
    }).sort(function (a, b) {
      var sa = seriesArr[a].role === "group" && opts.highlightGroup === seriesArr[a].group || isEmphasis(spec, seriesArr[a]) ? 1 : 0;
      var sb = seriesArr[b].role === "group" && opts.highlightGroup === seriesArr[b].group || isEmphasis(spec, seriesArr[b]) ? 1 : 0;
      return sa - sb;
    });
    drawOrder.forEach(function (si) {
      var s = seriesArr[si];
      var col,
        dash = "",
        w = opts.thick ? 5 : 3.5,
        dim = false;
      if (s.role === "group") {
        if (opts.highlightGroup && s.group === opts.highlightGroup) {
          col = opts.subjectColor || "var(--navy-900)";
          w = opts.thick ? 5.5 : 4;
        } else {
          col = "var(--ink-300)";
          w = opts.thick ? 2.5 : 2;
          dim = true;
        }
      } else if (s.role === "defended") {
        col = "var(--ink-300)";
        dash = "7 6";
      } else if (isConst(s)) {
        col = "var(--ink-300)";
        dash = "6 5";
        w = opts.thick ? 3 : 2.5;
      } else if (s.role === "reference") {
        col = "var(--red-600)";
      } else if (spec.render && spec.render.emphasis) {
        // emphasis-driven: named series bold navy, the rest muted
        if (isEmphasis(spec, s)) {
          col = opts.subjectColor || "var(--navy-900)";
          w = opts.thick ? 5.5 : 4;
        } else {
          col = "var(--ink-300)";
          w = opts.thick ? 3 : 2.5;
          dim = true;
        }
      } else {
        col = opts.subjectColor || "var(--navy-900)";
      }
      colOf[si] = {
        col: col,
        dash: dash,
        dim: dim
      };
      var d = "",
        smooth = s.smooth === true,
        stepDraw = !smooth && spec.kind === "step" && s.role !== "reference" && !isConst(s);
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

    // legend above the plot (swatch + series name + end value), so the plot fills the width
    if (legendH) {
      var lgy = 18;
      seriesArr.forEach(function (s, si) {
        var c = colOf[si] || {
          col: "var(--navy-900)",
          dash: ""
        };
        var nm = (s.name || "") + (f.endVal(s) ? "   " + f.endVal(s) : "");
        if (c.dash) {
          o.push('<line x1="' + ml + '" x2="' + (ml + 17) + '" y1="' + (lgy - 4) + '" y2="' + (lgy - 4) + '" stroke="' + c.col + '" stroke-width="3.5" stroke-dasharray="5 4"></line>');
        } else {
          o.push('<rect x="' + ml + '" y="' + (lgy - 11) + '" width="17" height="13" rx="3" fill="' + c.col + '"></rect>');
        }
        o.push('<text x="' + (ml + 25) + '" y="' + lgy + '" fill="var(--ink-700)" font-size="14" font-weight="800">' + esc(nm) + '</text>');
        lgy += 22;
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
      var s = seriesArr.filter(function (x) {
        return x.name === an.series;
      })[0] || seriesArr[0];
      var ax = xAtVal(an.at);
      if (ax == null) return null;
      return {
        x: ax,
        y: yAtValOf(s, an.at),
        text: an.text
      };
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
    var rotateAll = every === 1 && n > 10;
    for (var k = 0; k < n; k++) {
      if ((n - 1 - k) % every !== 0) continue;
      if (rotateAll) {
        var rxp = xAt(k).toFixed(1),
          ryp = mt + ph + 22;
        o.push('<text x="' + rxp + '" y="' + ryp + '" text-anchor="end" fill="var(--ink-300)" font-size="12" transform="rotate(-45 ' + rxp + ' ' + ryp + ')">' + esc(String(xs[k])) + '</text>');
      } else {
        o.push('<text x="' + xAt(k).toFixed(1) + '" y="' + (mt + ph + 28) + '" text-anchor="middle" fill="var(--ink-300)" font-size="14">' + esc(String(xs[k])) + '</text>');
      }
    }
    return '<svg viewBox="0 0 ' + W + " " + H + '" style="width:100%;height:auto;display:block;" role="img" aria-label="' + esc(spec.headline || spec.id) + '">' + o.join("") + "</svg>";
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "blue-streak-vote-guide/assessment-charts.js", error: String((e && e.message) || e) }); }

// blue-streak-vote-guide/assessment.data.js
try { (() => {
/*
 * ============================================================================
 *  assessment.data.js — SINGLE SOURCE OF TRUTH for the contract vote guide.
 *  Produced by the contract-vote-analyzer skill. window.ASSESSMENT below.
 *
 *  CLAUDE DESIGN: YOU ARE THE DISPLAY LAYER ONLY.
 *  Read window.ASSESSMENT.renderContract FIRST. Render this file top to bottom
 *  in howToRead.page_order, using the text VERBATIM. Do NOT reorder, rewrite,
 *  summarize, re-analyze, re-rate, recompute, or invent ANY content or data.
 *  You own layout/typography/color/interaction. You do NOT own the WHAT.
 *  Two renders share this object: website (plain/plainCaption) + PDF
 *  (meaning/headline).
 *
 *  CHARTS: this file ships WITH assessment-charts.js. Load that file and call
 *  window.AssessmentChart(spec, opts) for each charts[] entry - it already
 *  honors showAllTicks / render / kind / emphasis. Do NOT hand-build charts.
 * ============================================================================
 */
window.ASSESSMENT = {
  "renderContract": {
    "READ_THIS_FIRST": "This file is the Single Source of Truth, produced by the contract-vote-analyzer skill. Claude Design is the DISPLAY LAYER ONLY. Render what is here; do not think for it.",
    "you_must": ["Render the charts by loading the renderer that ships beside this file, assessment-charts.js, and calling window.AssessmentChart(chartSpec, opts) for each entry in charts[]. Load it VERBATIM - do not rewrite, reimplement, or 'improve' the chart code. It already honors every field below (showAllTicks, render.numberFormat, kind, emphasis, seriesOrder, highlightRange, annotations); hand-building charts is what reintroduces the tick/format/bar-vs-line bugs. You own the frame around each chart (card, caption, spacing), not the chart's own drawing.", "Render every section in the EXACT order given by howToRead.page_order — top to bottom, none skipped, none reordered.", "Use the text VERBATIM from this file: item titles, today/proposed, plain (website) or meaning (PDF), verdicts, tags, legend, glossary, howToRead, meta.methodology (title/intro/anchorsIntro/anchors), topic notes, and every chart's leadIn. Copy it; do not rewrite, summarize, shorten, or 'improve' it.", "Place every chart in its chart.placement, ALWAYS preceded by its leadIn and shown with its verdict. The renderer produces the SVG from charts[].series; you position it and wrap it, nothing more.", "UNIT TOGGLE: if a chart has a units[] array, render a small toggle control above or beside it, one button per unit (use each unit label), with the entry marked default:true selected on load. On switch, re-call window.AssessmentChart(spec, {unit: <that unit key>}) and swap the SVG - the renderer applies the transform and relabels the axis itself. The stored numbers never change, so the two views cannot disagree. Do not compute the alternate view yourself.", "chart.render specifies EVERY styling decision and the shipped renderer already applies it - Design makes none of its own. numberFormat: how axis/tooltip numbers format ('dollars'=$X.XX, 'percent'=X%, 'index'=+/-N% vs a 100 baseline, 'percent-of-start'=Nx starting rate). valueLabels: 'endpoints'=label first+last point only, 'none'=no point labels. gridlines: 'horizontal-only'. legend: corner to place it. emphasis: the series name drawn boldest/brightest (the others muted). seriesOrder: draw/stack/legend order, first name at back. Never substitute your own styling; if you think a render value is wrong, that is a skill bug to report, not to override.", "If a chart's x-axis has showAllTicks:true, EVERY tick label from axes.x.ticks must appear - the shipped renderer already draws them all (rotating when crowded) and the build's render-contract gate fails if any is missing. Do not thin, skip, or sample them. Thinning the axis misrepresents where step changes occur (e.g. makes a raise at the 3-year rung look like it lands at year 2).", "Render each chart according to its chart.kind: 'bar_grouped' = grouped vertical BARS (one bar per series, side by side, for each x category) - NOT lines; 'step' = step lines (flat, then jump); 'line' = straight lines between points; 'multi_line' = multiple straight lines; 'dual_line' = two straight lines. A series with smooth=true always renders as a smooth line regardless of kind. NEVER substitute a line for a bar chart or vice versa - the kind is authoritative.", "If a chart has chart.highlightRange, shade the background across the x-categories at those indexes (a red-tinted band across those bars/points) and place its label as a callout pointing at that band - this marks the specific range where the story concentrates (e.g. 'these step raises were removed').", "For a chart with chart.highlightable (group keys), render group buttons that HIGHLIGHT the chosen group's line and dim the others - all lines stay visible, nothing is removed. The chart.breakeven series is the reference line: a pay line ABOVE it is gaining ground, BELOW it is losing.", "ONE PAGE, TWO LENSES (not two builds). There is a single page with a Short/Full toggle. SHORT is the default member view; FULL is the same page in the detail register. The toggle NEVER reorders or removes a section — it only changes depth. Print/PDF export renders the FULL lens.", "REGISTER FILTERING (collections): SHORT shows only entries whose register is 'web' or 'both'; FULL shows ALL. This governs marketCards[] (register 'web'|'pdf') and tables[] (register 'web'|'pdf'|'both'). Short must render only the ~4 web-tagged market cards, NOT all 11. Do not treat register as advisory.", "REGISTER PROSE: SHORT renders each item's `plain` and each chart's `plainCaption`; FULL renders `meaning`/`realterms` and `headline`. NEVER fall back from `plain` to `meaning` — if `plain` is missing that is a skill bug to report, not a reason to leak the technical register into the member view.", "COLOUR COMES FROM `polarity` ('pos'|'neu'|'neg'), which every chart, every scoreboard cell and every legend.verdicts entry carries. NEVER infer a colour by pattern-matching the verdict's words (e.g. testing for 'wash' or 'POSITIVE'). Reader-facing wording must be free to change without changing what a colour means; a verdict rename must never repaint a cell.", "TAG CONSISTENCY: the Key/legend tag list (legend.tags) and the tag chips shown on each item are the SAME tags — render them with the SAME visual component and the SAME words. They are derived from one source, so if a chip and its Key entry ever differ, that is a bug to report, not to reconcile by choosing one.", "Show ratings using ratingSystem.labels and the colors implied by sign (gains positive, costs negative, Depends neutral). Show every tag (type, delivery, market) exactly as provided.", "If a scoreboard cell (or a topic's verdictByGroup entry) carries a bandEdgeNote, show it next to that verdict (a small footnote/tooltip is fine). It means the score sits near a boundary between two verdicts and honesty requires flagging it — never drop it to keep the grid tidy.", "Preserve the meaning of every verdict word exactly — never soften 'Major cost' or 'NEGATIVE' or 'CLEAR LOSS'.", "Place EVERY section — including what_this_is, deal_in_one_paragraph, and how_to_use — inside the single page_order flow, in exactly the position page_order gives it. Do not lift any section out into fixed chrome above or below the ordered flow; if you do, a section page_order puts between them (e.g. preface) can never land in its declared spot. The ONLY things allowed outside the ordered flow are true chrome with no page_order key: the hero header and the sticky group selector.", "Render a link to the full technical report ONLY if meta.reportUrl is present, pointing at that exact URL. If meta.reportUrl is absent, render NO report link at all — never hardcode a filename. The deliverable is self-contained; a link to a file that wasn't produced is a dead link.", "Do NOT render any section whose key is not in page_order (e.g. a retired 'find your position' section). A section absent from page_order is retired; show nothing for it. Read the group-specific outlook from the scoreboard instead."],
    "you_must_not": ["Do NOT reorder, add, merge, split, or omit any topic, change, chart, or section.", "Do NOT re-analyze, re-rate, re-weight, recompute, or 'sanity-check' any number, verdict, or rating — the analysis is final and lives only here.", "Do NOT write new copy, headlines, summaries, or captions, or paraphrase existing ones. If a sentence is needed and not in this file, that is a skill bug — request it, do not invent it.", "Do NOT combine two items into one visual or draw a second item's series onto another item's chart (single-item rule). A card's chart field may be a single id or a list of ids - a list means multiple companion charts illustrating that SAME single item (e.g. a mechanism chart plus its resulting-gap chart); render each with its own verdict, in list order, still confined to that one card. Never attach a chart to a different item than the one whose finding it illustrates.", "Do NOT compute or infer data (totals, projections, comparisons) — every number you display already exists in this file."],
    "your_only_job": "Typography, layout, spacing, color, responsiveness, interaction (expanders, tabs, the 'which group am I' selector), and the framing around each chart (card, caption, placement). The chart drawing itself belongs to the shipped assessment-charts.js. Make it beautiful and legible. The WHAT is fixed; you own the LOOK around it.",
    "register": "Website build renders `plain`/`plainCaption`; PDF build renders `meaning`/`realterms`/`headline`. Same order, same legend, same lead-ins — only the prose depth differs (see designBrief).",
    "if_something_is_missing_or_unclear": "Leave it out and surface it as a gap for the skill to fix. Never fill a gap with generated content — invented data in a voting guide is the one unacceptable failure."
  },
  "meta": {
    "contract": "PSA AFA 2026 Tentative Agreement",
    "version": "1.25.26",
    "generator": "contract-vote-analyzer v1.25.26",
    "baseline": "Your real current contract = 2019 CBA + in-force side letters",
    "standpoint": "Every rating looks FORWARD from ratification day, across the contract's term plus the likely negotiation lag after it. Catching up on the past counts as your starting position, not a forward gain. Fixed-dollar benefits lose real value each year; percentage-based pay tracks the wage path; work RULES hold full value for the contract's whole life.",
    "mode": "pending_TA",
    "methodology": {
      "title": "Why we weigh instead of count",
      "intro": "Changes are weighed by how much they actually matter, not just counted — so a pile of tiny wins can't hide one real loss.",
      "anchorsIntro": "Six things keep every rating honest:",
      "anchors": [{
        "label": "The life of the contract",
        "text": "Judged forward from day one — catching up on the past is your starting point, not a win for the future."
      }, {
        "label": "Real terms",
        "text": "A raise smaller than inflation is a pay cut, and we score it that way."
      }, {
        "label": "Rules vs. promises",
        "text": "A rule applies automatically; a promise needs the company to build it — so we don't bank promises."
      }, {
        "label": "One item at a time",
        "text": "No item excuses another — items only combine in the category totals, where the math is shown."
      }, {
        "label": "Catch-up vs. genuine wins",
        "text": "Matching what the industry already pays is the market working, not the union winning."
      }, {
        "label": "Forward protection",
        "text": "Does the deal protect the negotiation gap — back-pay to the amendable date, or raises that beat inflation? Without it, every cycle loses ground."
      }]
    },
    "pageTitle": "Your Contract, Side by Side",
    "pageSubtitle": "An independent, plain-language look at what you have today, what would change, and what it means for you. It does not tell you how to vote.",
    "pdfCoverTitle": "PSA AFA 2026 Tentative Agreement: An Independent Assessment",
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
  "groups": [{
    "key": "nh",
    "label": "New Hire (first 3 years)",
    "definition": "Years 0-3 inclusive: flat starting rate with no step increase until the 3-year mark, and almost always on reserve. Off probation at 6 months."
  }, {
    "key": "mc",
    "label": "Mid-Career (3-12 years)",
    "definition": "From your first real pay step at year 3 up to ~12 years: climbing the scale each year, typically holding a line."
  }, {
    "key": "sr",
    "label": "Senior (12+ years)",
    "definition": "12+ years: at or near top of scale (top rung at 18 years), where the 401(k) match reaches 5% and no step increases remain."
  }],
  "topics": [{
    "title": "Your Paycheck",
    "anchor": "cat-pay",
    "topicNote": "Money first, because it's the first question everyone asks. Four things decide this category: the day-one catch-up, the small raises that follow it, boarding pay, and what happened to the pay ladder. Each is judged on its own - starting with the one picture that frames everything: your raises versus the cost of living.",
    "webTakeaway": "Bottom line: the 10% mostly just catches you back up to 2023, and the raises after it fall behind prices - so your pay slowly loses ground over the deal. Boarding pay is the one real chunk of new money, and even that's just catching up to what other airlines already pay. The big hidden cost is the flattened ladder, which quietly takes $10-15k a year off what senior FAs would've topped out at. Real gains here, but read the pay-vs-prices chart before you decide.",
    "netNote": "Two big forces dominate this category and they pull HARD in opposite directions: boarding pay (the largest single gain, ~$6-7k/yr, but industry-standard catch-up) and the flattened-ladder concession (the largest single structural cost, ~$10-15k/yr in forgone career earnings for everyone above the floor). Net verdicts stay positive but are now GENUINELY CLOSE - the deal's economics are essentially boarding pay + the +10% level-set on one side, the permanent structural concession on the other. Timing note the rollup can't show: boarding pay is real recurring money from 2027; the concession is forgone potential vs a defended structure (no current check shrinks). Weigh them as the two headline economic facts, not as a long list of small wins.",
    "changes": [{
      "id": "pay-levelset",
      "title": "Day-one pay level (the +10% and retro)",
      "type": "NEW",
      "starts": "2026",
      "delivery": "automatic",
      "cond": null,
      "market": {
        "position": "at_market",
        "note": "Restores rates that narrowly lead the current regional table - but PSA settled first (peers negotiate next off this floor) and remains ~20% under mainline entry."
      },
      "today": "Rates frozen since 2023 while prices rose ~8-9% - your paycheck buys noticeably less than it did.",
      "proposed": "+10% at ratification plus retro pay - restoring your rate to roughly its 2023 purchasing power.",
      "plain": "You get a 10% raise the day this signs, plus back-pay for what you're owed. Here's the catch: your pay's been frozen since 2023 while everything got more expensive, so this mostly just gets you back to even - not ahead.",
      "meaning": "This sets your STARTING position for the contract - it repairs the freeze years. Under this guide's standpoint (the life of the contract, looking forward), catch-up on the past counts as where you begin, not as a forward gain.",
      "realterms": null,
      "rating": {
        "nh": "sg",
        "mc": "sg",
        "sr": "sg"
      },
      "chart": null
    }, {
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
    }, {
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
      "meaning": "The genuine win for new hires: you start ~$10/hr above the old scale and the company can no longer cut junior rates. It was also market-forced: a regional cannot hire at $20 when mainline starts at $36.",
      "realterms": null,
      "rating": {
        "nh": "sg",
        "mc": "nc",
        "sr": "nc"
      },
      "chart": null
    }, {
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
      "realterms": "THE EXERCISE THAT SETTLES IT (see the structural-concession chart): apply the old ladder to the new $29.77 floor and every rung from the 2-year mark up sits EXACTLY 25.5% below it - a 5-yr FA short ~$12.00/hr (~$10.8k/yr at guarantee), top of scale ~$16.39/hr (~$14.8k/yr). The uniformity is the proof: the floor's entire cost was spread evenly across the structure. This measures the CONCESSION versus a defended structure, not a cut versus any existing contract - nobody's check shrinks. The forward harm for everyone above the floor: the floor is the market-disciplined rung and WILL be forced up again; under the old shape that lifted the whole scale, under this flat shape it only lifts the bottom and compresses you further. Honest caveat: full preservation ($64.25 top, ~40% above any regional) was likely unwinnable - but zero restoration was a choice, and this TA ratifies it permanently.",
      "rating": {
        "nh": "XC",
        "mc": "XC",
        "sr": "XC"
      },
      "chart": ["pay_progression_relative", "pay_raise_by_step"]
    }, {
      "id": "pay-boarding",
      "title": "Boarding pay",
      "type": "NEW",
      "starts": "2027 (1 yr out)",
      "delivery": "delayed",
      "cond": null,
      "market": {
        "position": "catch_up",
        "note": "Industry standard now (AA 2024, Alaska 2025, Air Canada 2025, United 2026); PSA matches it a year late."
      },
      "today": "You are not paid for boarding time — only from push-back.",
      "proposed": "50% of your hourly rate for all boarding time (including reboards), paid on top of your guarantee, for lineholders and reserves alike.",
      "plain": "Finally getting paid for boarding - 50% of your rate. Real money. But almost every airline already pays it, so this is PSA catching up, not doing us a favor - and it doesn't start for a year.",
      "meaning": "Real new money for time you already work: 50% of your hourly rate for all boarding time, above guarantee, reserves and lineholders alike. Assess it on its own terms: this is now the INDUSTRY STANDARD - American (2024), Alaska (2025), Air Canada (2025), and United (2026) all have boarding pay - so PSA is matching the norm, a year late (starts 2027), not leading it. A major gain for you versus today's contract; a catch-up versus the market.",
      "realterms": "Judged alone: the largest single new income item in the deal (~15-16% of comp on the union's estimate). It rides your hourly rate, so it inherits whatever your rate does - but that is the wage path's problem, assessed separately.",
      "rating": {
        "nh": "MG",
        "mc": "MG",
        "sr": "MG"
      },
      "chart": null
    }, {
      "id": "pay-minday",
      "title": "Minimum day pay",
      "type": "NEW",
      "starts": "Carve-outs at DOR; 3.75 hrs 2028",
      "delivery": "delayed",
      "cond": null,
      "market": null,
      "today": "3.5 hours per calendar day, and certain 'carve-outs' reduce it in some situations.",
      "proposed": "Carve-outs removed at ratification; the 3.5-hour minimum rises to 3.75 hours on 2028.",
      "plain": "A little more pay on short days, and the carve-outs that used to chip away at your min-day guarantee are gone right away.",
      "meaning": "You're guaranteed a bit more pay on short days, and the deductions that chipped away at it are gone right away.",
      "realterms": null,
      "rating": {
        "nh": "SG",
        "mc": "sg",
        "sr": "sg"
      },
      "chart": null
    }, {
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
    }, {
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
      "realterms": "~2.5% on ~$2.00/hr, below inflation - a token bump in real terms.",
      "rating": {
        "nh": "tk",
        "mc": "tk",
        "sr": "tk"
      },
      "chart": null
    }, {
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
    }, {
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
    }, {
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
    }, {
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
    }],
    "verdictByGroup": {
      "nh": {
        "verdict": "Net positive",
        "polarity": "pos",
        "score": 5.75,
        "tally": "10 gains, 2 costs",
        "depCount": 0,
        "addonNotes": []
      },
      "mc": {
        "verdict": "Modest positive",
        "polarity": "pos",
        "score": 3.75,
        "tally": "9 gains, 2 costs",
        "depCount": 0,
        "addonNotes": [],
        "bandEdgeNote": "This lands just under the line between two verdicts (score 3.8, boundary 4) - a small change in one item could tip it either way."
      },
      "sr": {
        "verdict": "Modest positive",
        "polarity": "pos",
        "score": 3.0,
        "tally": "9 gains, 2 costs",
        "depCount": 0,
        "addonNotes": []
      }
    }
  }, {
    "title": "Reserve Life",
    "anchor": "cat-reserve",
    "topicNote": "This is where the contract does the most for junior FAs - and note a forward-looking bonus: these are RULES, not dollars. A cap of 10 or a 13-hour RAP holds full value every year of the contract; it can't be eroded by inflation the way un-indexed money can.",
    "webTakeaway": "Bottom line: if you sit reserve, this is the best part of the deal for you. Hard caps on Ready Reserve, an hour less on your availability window, six permanent Golden Days, and a fairer way to spread the pain - these are real rules, not promises. A couple of the best ones (auto check-in, fair assignment) only pay off if the company builds the systems right, but the core wins are locked in.",
    "netNote": "Still the strongest part of the deal for junior FAs, but split it honestly: the BANKABLE wins are the hard rules - the HRV cap of 10, the 13-hour RAP, 6 Golden Days, trip pickups (+6 for a new hire). The rest (auto check-in, FOLO, the bucket system, worth ~+4 more) are PROMISES: new systems the Company must build and build well. The Implementation LOA's expedited arbitration protects against non-delivery, but a clunky system still 'complies.' The +6 is bankable under the contract; the +4 depends on systems the Company has yet to build.",
    "changes": [{
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
    }, {
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
    }, {
      "id": "res-golden",
      "title": "Golden Days (protected days off)",
      "type": "RESTORE",
      "starts": "First bid month after DOR",
      "delivery": "automatic",
      "cond": "reserve",
      "market": null,
      "today": "4 per bid period. (A 2022 side letter raised this to 6, but it expired in 2023.)",
      "proposed": "6 per bid period, permanently.",
      "plain": "Six protected days a bid period instead of four, and it's permanent this time. Days they can't junior-assign you on.",
      "meaning": "Two more immovable days off you can't be junior-assigned on. If you've been getting 6 in practice, this locks it in.",
      "realterms": null,
      "rating": {
        "nh": "sg",
        "mc": "sg",
        "sr": "sg"
      },
      "chart": null
    }, {
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
    }, {
      "id": "res-folo",
      "title": "Order you get called (FOLO)",
      "type": "NEW",
      "starts": "Within 6 months of DOR",
      "delivery": "promise",
      "cond": "reserve",
      "market": null,
      "today": "No visibility into whether you're first-out or last-out for trips.",
      "proposed": "You can set a first-out / last-out preference and see where you are on the list.",
      "plain": "You'll finally see whether you're first-out or last-out and set a preference, so you can actually plan your day. (Depends on them building the system.)",
      "meaning": "Predictability - you can plan your day around where you sit on the list. Depends on the Company delivering working software (due within 6 months of ratification).",
      "realterms": null,
      "rating": {
        "nh": "sg",
        "mc": "sg",
        "sr": "sg"
      },
      "chart": null
    }, {
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
    }, {
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
    }],
    "verdictByGroup": {
      "nh": {
        "verdict": "Net positive",
        "polarity": "pos",
        "score": 6.0,
        "tally": "4 gains, 0 costs",
        "depCount": 0,
        "addonNotes": ["+4 more if the new systems are built well"]
      },
      "mc": {
        "verdict": "About even",
        "polarity": "neu",
        "score": 0.0,
        "tally": "0 gains, 0 costs",
        "depCount": 0,
        "addonNotes": ["+6 more if reserve", "+4 more if reserve & the new systems are built well"]
      },
      "sr": {
        "verdict": "About even",
        "polarity": "neu",
        "score": 0.0,
        "tally": "0 gains, 0 costs",
        "depCount": 0,
        "addonNotes": ["+6 more if reserve", "+4 more if reserve & the new systems are built well"]
      }
    }
  }, {
    "title": "Your Schedule",
    "anchor": "cat-schedule",
    "topicNote": "How your month gets built: how many landings in a day, trading and dropping trips, and the new bidding system (PBS) that several of these improvements wait on.",
    "webTakeaway": "Bottom line: some genuinely nice fixes here - fewer landings, dropping trips, easier trades, earlier Golden Days. But most of the big ones wait on the new PBS bidding system, and our pilots' rocky rollout is the warning sign. Treat the PBS-dependent wins as 'maybe,' not 'yes.'",
    "netNote": "The banked wins are modest but real (fewer landings, earlier Golden Day awards). The headline items - trip drop and the 40-hour trade floor - are promises gated entirely on PBS, and PBS now carries an evidence-based warning: PSA's own pilots have run it since August 2024 and their union is still fine-tuning it two years later, with pilots reporting more headache than help. The AFA's oversight side letter is a genuine mitigation, but weigh the '+3 if delivered' with real skepticism, and note the timing squeeze: PBS may not be fully live for FAs until year 2 of this 3-year contract.",
    "changes": [{
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
    }, {
      "id": "sch-tripdrop",
      "title": "Dropping trips",
      "type": "NEW",
      "starts": "After PBS is live",
      "delivery": "promise",
      "cond": null,
      "market": null,
      "today": "You cannot drop a trip.",
      "proposed": "'Straight trip drop' — you can drop a trip (once the new PBS system is live).",
      "plain": "You'd finally be able to drop a trip you can't fly - but only once the new bidding system (PBS) is up and running.",
      "meaning": "Real schedule flexibility you've never had - but it's a PROMISE, not a rule: it only exists once PBS is built and live (possibly year 2 of this 3-year contract), and its usefulness depends on how well PBS is implemented.",
      "realterms": null,
      "rating": {
        "nh": "SG",
        "mc": "SG",
        "sr": "SG"
      },
      "chart": null
    }, {
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
      "meaning": "Easier to trade away trips and reshape your month - but like trip drop, it waits on PBS being built, and inherits PBS's delivery risk.",
      "realterms": null,
      "rating": {
        "nh": "sg",
        "mc": "sg",
        "sr": "sg"
      },
      "chart": null
    }, {
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
    }, {
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
    }, {
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
    }],
    "verdictByGroup": {
      "nh": {
        "verdict": "Modest positive",
        "polarity": "pos",
        "score": 3.25,
        "tally": "3 gains, 0 costs, 1 depends",
        "depCount": 1,
        "addonNotes": ["+3 more if the new systems are built well"]
      },
      "mc": {
        "verdict": "Modest positive",
        "polarity": "pos",
        "score": 2.25,
        "tally": "2 gains, 0 costs, 1 depends",
        "depCount": 1,
        "addonNotes": ["+3 more if the new systems are built well", "+1 more if reserve"]
      },
      "sr": {
        "verdict": "Modest positive",
        "polarity": "pos",
        "score": 2.25,
        "tally": "2 gains, 0 costs, 1 depends",
        "depCount": 1,
        "addonNotes": ["+3 more if the new systems are built well", "+1 more if reserve"]
      }
    }
  }, {
    "title": "Time Off, Leave & Health",
    "anchor": "cat-leave",
    "topicNote": "The rules for when life happens - injury, illness, fatigue, and coming back from a leave.",
    "webTakeaway": "Bottom line: small but genuinely good. Every change here helps you when life goes sideways - injured, fatigued, or coming back from leave - and none of it costs you anything. Nothing huge, nothing bad.",
    "netNote": "Modestly positive, but every item only matters when you're in that situation (injured, on leave, fatigued). If none apply to you, this category is effectively a wash.",
    "changes": [{
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
    }, {
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
    }, {
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
    }],
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
  }, {
    "title": "Uniforms & Commuting Costs",
    "anchor": "cat-uniforms",
    "topicNote": "The out-of-pocket stuff: uniform money, and help with the cost of getting to work.",
    "webTakeaway": "Bottom line: a bunch of small quality-of-life wins - allowance covers more, stolen uniforms replaced, a bit of commuter money - and your existing hotel benefit locked in for good. The one catch: new hires can have more taken out for that first uniform. Minor overall, mostly positive.",
    "netNote": "From the life-of-contract standpoint this category is weaker than it first looks: nearly everything here is FIXED DOLLARS ($550 allowance, $25 parking/transit) that erode every year, while the one cost - the $700-to-$1,000 first-uniform deduction - hits new hires up front at full value. For a non-commuting new hire this category is roughly a wash. Commuters still come out ahead. The durable parts are the rules: stolen-uniform replacement, maternity uniforms, alteration rights.",
    "changes": [{
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
    }, {
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
    }, {
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
    }, {
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
    }, {
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
    }, {
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
    }, {
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
    }, {
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
    }, {
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
    }, {
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
    }],
    "verdictByGroup": {
      "nh": {
        "verdict": "About even",
        "polarity": "neu",
        "score": 1.0,
        "tally": "6 gains, 1 cost",
        "depCount": 0,
        "addonNotes": ["+2 more if commuter"],
        "bandEdgeNote": "This lands just under the line between two verdicts (score 1, boundary 1.5) - a small change in one item could tip it either way."
      },
      "mc": {
        "verdict": "Modest positive",
        "polarity": "pos",
        "score": 3.0,
        "tally": "6 gains, 0 costs",
        "depCount": 0,
        "addonNotes": ["+2 more if commuter"]
      },
      "sr": {
        "verdict": "Modest positive",
        "polarity": "pos",
        "score": 2.25,
        "tally": "6 gains, 0 costs",
        "depCount": 0,
        "addonNotes": ["+2 more if commuter"]
      }
    }
  }, {
    "title": "Job Protection & Benefits",
    "anchor": "cat-job",
    "topicNote": "Your rights when something goes wrong - discipline, grievances, the board that decides disputes - plus insurance and retirement.",
    "webTakeaway": "Bottom line: the big one is a real fix - a neutral tie-breaker on the board that decides your grievances, so cases can't just deadlock into nothing. A little more 401(k) if you're senior. The only ding is slightly less notice before an investigatory meeting. Net positive, especially long-term.",
    "netNote": "Modestly positive - the stronger grievance board is the real gain, and seniors get more via the 401(k) bump. One swing factor not in the score: the shorter investigatory-meeting notice (7 to 5 days) could cut against you.",
    "changes": [{
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
    }, {
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
    }, {
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
    }, {
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
    }, {
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
    }],
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
  }, {
    "title": "Union & Contract Length",
    "anchor": "cat-union",
    "topicNote": "The machinery: how union work gets funded, and how long this deal runs (which matters more than it sounds - see the last negotiation's 2.6-year overtime).",
    "webTakeaway": "Bottom line: the company finally helps fund your reps' union work, and you're back at the table in 3 years instead of 5. Sooner is only better if the next round moves faster than the last one - which froze your pay for 2.6 extra years. Nothing here hits your paycheck directly; it's about the union's footing and how soon you get another shot.",
    "netNote": "No real change to your own paycheck - these fund union operations. The 3-year term is a genuine judgment call, now MORE defensible given market context: because PSA settled first and rivals will likely pass its rates, a shorter deal lets PSA catch back up sooner. The risk is re-bargaining quickly from a soon-to-be-middling position, in a softer labor market with less leverage.",
    "changes": [{
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
    }, {
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
    }, {
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
    }],
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
  }],
  "charts": [{
    "id": "pay_vs_prices",
    "kind": "step",
    "placement": "hero",
    "scope": "all",
    "verdict": "REAL-TERMS PAY CUT",
    "headline": "Prices climb every year; your pay freezes, leaps once to catch up, then freezes again - each leap starting from a deeper hole, so the gap compounds over a career (~11% less buying power by the next contract). Because pay stays frozen at the old rate until a new deal is ratified, a longer negotiation costs the Company nothing in wages. The provision that would offset that - guaranteed retro pay back to the amendable date - is not in this deal.",
    "plainCaption": "Your pay goes up a little; prices go up more, and the gap is money quietly leaving your pocket - about 11% less buying power by the time the next contract's due. Worse: your pay stays frozen at the old rate until a new deal is signed, so the company actually saves money by dragging out the next round - the gap gives them a reason to stall. There's no guaranteed back-pay here to take that reason away.",
    "axes": {
      "x": {
        "label": "Year",
        "ticks": [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032],
        "showAllTicks": true
      },
      "y": {
        "label": "Indexed to 100 = 2023 buying power",
        "min": 100,
        "max": 135
      }
    },
    "series": [{
      "name": "Your base pay",
      "role": "subject",
      "values": [100, 100, 100, 110.0, 111.65, 113.3, 113.3, 113.3, 113.3, 113.3]
    }, {
      "name": "Prices (cost of living)",
      "role": "reference",
      "values": [100.0, 103.0, 106.1, 109.3, 112.6, 115.9, 119.4, 123.0, 126.7, 130.5]
    }],
    "assumptions": "indexed to 100 = 2023 buying power (the last amendable date); prices ~3%/yr; pay frozen 2023-26, +10% at ratification, +1.5%/+1.5% (2027/28), frozen again after the 2029 amendable date (2.6-yr lag precedent); base rate only - boarding pay and longevity steps judged separately",
    "leadIn": "Start with the question everyone asks first: do the raises keep up with prices? Here is that answer in one picture (base pay only - boarding pay and your yearly seniority step are judged separately):",
    "shadeGap": {
      "between": ["Prices (cost of living)", "Your base pay"],
      "label": "THE GAP - buying power you never get back"
    },
    "annotations": [{
      "at": 2024.5,
      "series": "Your base pay",
      "text": "FROZEN 2023-26 - prices climb +8%, pay flat"
    }, {
      "at": 2026,
      "series": "Your base pay",
      "text": "+10% catch-up (this TA)"
    }, {
      "at": 2027,
      "series": "Your base pay",
      "text": "+1.5%"
    }, {
      "at": 2028,
      "series": "Your base pay",
      "text": "+1.5%, then frozen"
    }, {
      "at": 2029,
      "series": "Prices (cost of living)",
      "text": "amendable 2029 - freeze begins again"
    }],
    "polarity": "neg",
    "render": {
      "numberFormat": "index",
      "valueLabels": "endpoints",
      "gridlines": "horizontal-only",
      "legend": "top-right",
      "emphasis": "Prices (cost of living)",
      "seriesOrder": ["Your base pay", "Prices (cost of living)"]
    }
  }, {
    "id": "pay_structure_concession",
    "kind": "multi_line",
    "placement": "accountability",
    "scope": "all",
    "verdict": "THE STRUCTURAL CONCESSION",
    "headline": "Every FA from year 1 up sits exactly 25.5% below what a defended structure (old ladder re-anchored to the $29.77 floor) would pay - roughly $10-15k/yr at guarantee, seniors most in dollars. Measures the concession, NOT a cut to current checks; full preservation was likely unwinnable ($64.25 top exceeds every regional), but zero restoration was a choice this TA ratifies permanently.",
    "plainCaption": "Same starting pay, two ways to build the ladder. The dotted line is what every step would pay if they'd raised the floor AND kept the old ladder; the solid line is what you actually get. Every experienced FA sits about 25% below that dotted line - that gap is what funding the raise 'out of the ladder' cost you.",
    "axes": {
      "x": {
        "label": "Years of service",
        "ticks": ["0-6mo", "7-12mo", "1yr", "2yr", "3yr", "4yr", "5yr", "6yr", "7yr", "8yr", "9yr", "10yr", "11yr", "12yr", "13yr", "14yr", "15yr", "16yr", "17yr", "18yr"],
        "showAllTicks": true
      },
      "y": {
        "label": "$/hr",
        "max": 70
      }
    },
    "series": [{
      "name": "Defended structure: old ladder re-anchored to $29.77",
      "role": "defended",
      "values": [29.77, 31.34, 37.21, 39.96, 42.72, 45.39, 47.02, 49.37, 51.48, 53.31, 54.86, 56.39, 57.9, 58.88, 60.34, 61.12, 61.9, 62.69, 63.47, 64.25]
    }, {
      "name": "Actual new table (what the TA locks in)",
      "role": "subject",
      "values": [29.77, 29.77, 29.77, 29.77, 31.82, 33.81, 35.02, 36.77, 38.35, 39.71, 40.87, 42.01, 43.13, 43.86, 44.95, 45.53, 46.11, 46.7, 47.28, 47.86]
    }],
    "assumptions": "defended = old 2019 relative structure x (29.77/20.16); ~$/yr figures use a 75-hour monthly guarantee, illustrative",
    "leadIn": "And here's what raising the starting wage the way they did actually cost: compare the new table against what the same starting wage would pay if the old ladder had been kept:",
    "shadeGap": {
      "between": ["Defended structure: old ladder re-anchored to $29.77", "Actual new table (what the TA locks in)"],
      "label": "the gap"
    },
    "annotations": [{
      "series": "Actual new table (what the TA locks in)",
      "at": "2yr",
      "text": "from here up: exactly 25.5% below, every single rung"
    }, {
      "series": "Actual new table (what the TA locks in)",
      "at": "18yr",
      "text": "top of scale: $47.86 vs $64.25 - short $16.39/hr"
    }],
    "polarity": "neg",
    "placementNote": "Union accountability section; also linked from the flattened-ladder item",
    "render": {
      "numberFormat": "dollars",
      "valueLabels": "endpoints",
      "gridlines": "horizontal-only",
      "legend": "top-left",
      "emphasis": "Actual new table (what the TA locks in)",
      "seriesOrder": ["Defended structure: old ladder re-anchored to $29.77", "Actual new table (what the TA locks in)"]
    }
  }, {
    "id": "pay_progression_relative",
    "kind": "line",
    "placement": "cat-pay",
    "scope": "all",
    "verdict": "CAREER PAY LADDER ~25% FLATTER, LOCKED IN",
    "headline": "Relative pay growth over a career, each ladder indexed to its own starting rate. The old ladder multiplied your pay to 2.16x your start; the current/new flat-bottom ladder reaches only 1.61x - about 25% flatter. The gap was created by the 2022 hiring side letter (not this TA), but this TA applies a flat +10% on top and makes the flattened shape PERMANENT.",
    "plainCaption": "This shows how much your pay grows over a whole career, not the dollar amounts. The old ladder more than doubled your starting pay (2.16x). The new one only reaches 1.61x - a flatter climb. You still get raises, but the career grows about a quarter less than it used to. Only people hired into the flat bottom walk this flatter ladder; anyone already past year 3 kept their old early raises.",
    "axes": {
      "x": {
        "label": "Years of service",
        "ticks": ["0-6mo", "7-12mo", "1yr", "2yr", "3yr", "4yr", "5yr", "6yr", "7yr", "8yr", "9yr", "10yr", "11yr", "12yr", "13yr", "14yr", "15yr", "16yr", "17yr", "18yr"],
        "showAllTicks": true
      },
      "y": {
        "label": "Pay as % of your own starting rate",
        "max": 70
      }
    },
    "series": [{
      "name": "Old ladder (steeper)",
      "role": "reference",
      "values": [29.77, 31.34, 37.21, 39.96, 42.72, 45.39, 47.02, 49.37, 51.48, 53.31, 54.86, 56.39, 57.9, 58.88, 60.34, 61.12, 61.9, 62.69, 63.47, 64.25]
    }, {
      "name": "New ladder (flatter)",
      "role": "subject",
      "values": [29.77, 29.77, 29.77, 29.77, 31.82, 33.81, 35.02, 36.77, 38.35, 39.71, 40.87, 42.01, 43.13, 43.86, 44.95, 45.53, 46.11, 46.7, 47.28, 47.86]
    }],
    "assumptions": "each ladder indexed to its OWN starting rate = 100 (isolates career growth shape, removes the higher-floor effect); base rate; old = pre-2022 shape, new = flat-bottom scale",
    "leadIn": "How much your pay grows across a whole career - old ladder vs the new one.",
    "shadeGap": {
      "between": ["Old ladder (steeper)", "New ladder (flatter)"],
      "label": "the raise progression you lose"
    },
    "annotations": [{
      "at": "1yr",
      "series": "New ladder (only 1.61x)",
      "text": "flat years 0-2: no early raises"
    }, {
      "at": "9yr",
      "series": "Old ladder (grew to 2.16x)",
      "text": "gap created by 2022 side letter; this TA locks it in"
    }],
    "polarity": "neg",
    "units": [{
      "key": "multiple",
      "label": "Multiple of your starting pay",
      "axisLabel": "Pay as % of your own starting rate",
      "numberFormat": "percent-of-start",
      "indexTo": "first",
      "default": true
    }, {
      "key": "dollars",
      "label": "Dollars per hour",
      "axisLabel": "$/hr",
      "numberFormat": "dollars"
    }],
    "render": {
      "numberFormat": "percent-of-start",
      "valueLabels": "endpoints",
      "gridlines": "horizontal-only",
      "legend": "top-left",
      "emphasis": "New ladder (flatter)",
      "seriesOrder": ["Old ladder (steeper)", "New ladder (flatter)"]
    }
  }, {
    "id": "pay_raise_by_step",
    "kind": "bar_grouped",
    "placement": "cat-pay",
    "scope": "all",
    "verdict": "THE FLATTENING: EARLY RAISES ERASED",
    "headline": "The raise you get at each step up, old shape vs new. All the loss is in years 0-2: the old shape's +5.3%/+18.8%/+7.4% early raises became 0%/0%/0%. The first raise doesn't come until the 3-year mark, and every rung from year 3 on is identical between old and new.",
    "plainCaption": "Each pair of bars is the raise you get moving from one step to the next. The first few bars: the old shape gave real early raises; the new one gives zero there. That's where the flattening is - and it never comes back.",
    "axes": {
      "x": {
        "label": "Years of service",
        "ticks": ["0-6mo", "7-12mo", "1yr", "2yr", "3yr", "4yr", "5yr", "6yr", "7yr", "8yr", "9yr", "10yr", "11yr", "12yr", "13yr", "14yr", "15yr", "16yr", "17yr", "18yr"],
        "showAllTicks": true
      },
      "y": {
        "label": "% raise moving to this step",
        "min": 0,
        "max": 20
      }
    },
    "series": [{
      "name": "Old shape",
      "role": "reference",
      "values": [0.0, 5.3, 18.8, 7.4, 6.9, 6.3, 3.6, 5.0, 4.3, 3.6, 2.9, 2.8, 2.7, 1.7, 2.5, 1.3, 1.3, 1.3, 1.2, 1.2]
    }, {
      "name": "New shape",
      "role": "subject",
      "values": [0.0, 0.0, 0.0, 0.0, 6.9, 6.3, 3.6, 5.0, 4.3, 3.5, 2.9, 2.8, 2.7, 1.7, 2.5, 1.3, 1.3, 1.3, 1.2, 1.2]
    }],
    "assumptions": "step-to-step percentage raise; old = pre-2022 shape, new = flat-bottom scale (rungs 3-18 identical); base rate",
    "leadIn": "The raise you get at each step up (all the loss is in years 0-2; first raise at year 3; identical after).",
    "highlightRange": {
      "xIndexes": [1, 2, 3],
      "style": "shade",
      "label": "these step raises were removed"
    },
    "polarity": "neg",
    "render": {
      "numberFormat": "percent",
      "valueLabels": "none",
      "gridlines": "horizontal-only",
      "legend": "top-right",
      "emphasis": "New shape",
      "seriesOrder": ["Old shape", "New shape"]
    }
  }],
  "marketCards": [{
    "title": "Inflation",
    "body": "Your pay was frozen from mid-2023 to 2026 while prices rose roughly 8-9%. Unbundle the headline number: the +10% raise REPAIRS that hole (about 1-1.5% left over), and the +1.5% steps in 2027-28 will likely trail inflation (running ~4.2% in 2026) - so base rates end this contract with roughly the purchasing power they had in 2023, possibly slightly less. The PROGRESS in this deal is boarding pay: the only economically new income, and the reason total compensation genuinely beats inflation by year two. In plain terms: the raise makes you whole; boarding pay is what makes you better off. The deal's economic case therefore rests on boarding pay and the rule changes rather than on the headline raise.",
    "register": "web"
  }, {
    "title": "Vs. comparable contracts — today",
    "body": "PSA's proposed rates lead current regional peers - e.g., a PSA new hire at $29.77 beats Endeavor's $26.23 (2026). The union's table showing PSA #1 at most steps is broadly accurate TODAY.",
    "register": "pdf"
  }, {
    "title": "Junior pay: market-forced, not a gift",
    "body": "The junior pay increases are competitive necessity, not generosity. PSA's true 2019 entry rate was ~$20/hr; a 2022 side letter had to haul the floor to $27.06 just to keep hiring. By 2025-26 the market: Endeavor (Delta regional) $26.23 start, and mainline far above - American $36.81, Delta $35+, United $36.92. A regional hiring at $20 is a non-starter, so the floor moves are the company repricing labor to stay able to recruit. The flattened bottom four rungs (a cost-saver that erases early step progression) travel with it. Frame junior 'wins' accordingly: real money in pocket, but market-forced and structured to serve hiring costs.",
    "register": "web"
  }, {
    "title": "The pay raise in relative terms",
    "body": "The pay raise must be read in relative terms. Absolute: every rung up ~10%, career dollars ~+12%. Relative: the old scale multiplied your pay to 2.16x your start over a career; the new flat-bottom scale reaches only 1.61x - a permanent ~25% flattening of the progression curve, concentrated in years 0-3 (raises of +5.3%/+18.8%/+7.4% replaced by 0%/0%/0%) and never recovered. It is a career-ladder change, so it reaches every FA - what differs is WHEN you feel it. Future hires and current sub-3-year FAs walk the flat bottom itself. Everyone above the floor keeps their existing step raises (rungs 3-18 are unchanged), but the pay value of their seniority is permanently compressed, and because every future scale is built on this shape, later floor increases lift the bottom without lifting them.",
    "register": "pdf"
  }, {
    "title": "Your pay outlook, from your position",
    "body": "What the BASE RATE alone does to real buying power from each position, one item at a time (other pay items are assessed separately): NEW HIRE - real buying power falls below hire-day level for two years (flat rungs plus sub-inflation raises), recovers at the year-3 step, +4.5% by 2031. MID-CAREER - +6.6% by 2031, carried by longevity steps that were already owed under the old contract. SENIOR - declines every year after the catch-up, -11% by 2031, with nothing in the contract to stop it. All figures from the union's own published columns.",
    "register": "pdf"
  }, {
    "title": "Vs. comparable contracts — tomorrow",
    "body": "But PSA is the FIRST regional to settle this round. Envoy, Piedmont, Mesa/Republic, Horizon, and Endeavor all bargain next, using PSA as their floor - and later movers usually leapfrog. PSA's #1 ranking is real now but probably temporary. (This is also why the 3-year term cuts both ways: a shorter deal lets PSA get back to the table to catch up if peers pass them.)",
    "register": "pdf"
  }, {
    "title": "Bargaining leverage",
    "body": "The 2022 flight attendant shortage is over - major carriers have paused FA hiring and applicant supply is high. Bargaining leverage is weaker than in 2022, and American's finances are strained. Getting a leading regional deal in a soft market is a more respectable result than it looks in isolation - and it makes the permanent pay floor more valuable, since a loose market is when a company would most want the freedom to cut junior rates.",
    "register": "pdf"
  }, {
    "title": "Forward protection",
    "body": "A contract's rates must survive not just its term but its term PLUS the next negotiation lag - under the Railway Labor Act, old rates stay frozen after the amendable date until a new deal is ratified. PSA's own history sets the lag: the last contract went amendable July 2023 and the replacement wasn't voted until March 2026 - 2.6 years of freeze. If that repeats, these rates must live from March 2026 to roughly late 2031, protected by just two 1.5% bumps after the initial catch-up (~3% total) against a projected ~15-18% of inflation. That's roughly 11% of purchasing power eroded by the time the NEXT deal lands (the figure the pay-vs-prices chart shows) - a deeper hole than the 8-9% this deal repairs. The pattern is a cycle: freeze, catch-up raise, slow erosion, deeper freeze. Two things break it: back-year raises that match expected inflation (~3%+/yr, vs the 1.5% here), or guaranteed retroactivity to the amendable date - which removes the Company's financial incentive to stall negotiations. This TA has neither; the short 3-year term is the union's partial answer, but 'back to the table sooner' only helps if the table produces a deal promptly. Amendable is not the same as paid.",
    "register": "pdf"
  }, {
    "title": "Precedent check on new systems",
    "body": "New systems deserve a precedent check, and this TA's biggest one fails it so far: PSA's pilots implemented PBS (the same kind of system, likely the same AD OPT vendor) in August 2024 - and as of 2026 their union is still 'fine-tuning' procedures with the permanent parameters unratified, while pilot sentiment describes it as more headache than problem-solver. ALPA's own PBS materials concede the software is 'complicated and confusing' and that results 'vary greatly' by carrier. What this means for the vote: treat every benefit gated on PBS (trip drop, 40-hour trade floor) as carrying that precedent risk, and treat the AFA's PBS oversight side letter as the key safeguard to scrutinize.",
    "register": "web"
  }, {
    "title": "Rules vs. promises",
    "body": "Not all 'wins' are equally bankable. Pay rates, caps, and notice periods are self-executing: the date arrives, the rule applies, and a violation is an easy grievance. But several quality-of-life items (auto check-in, FOLO, the HRV bucket system, and everything gated on PBS - trip drop, the 40-hour trade floor) are construction projects: their value depends on the Company building them properly. The Implementation LOA provides expedited arbitration (heard in 15 days, decided in 30) against NON-delivery, but a poorly built system still 'complies.' Note the timing squeeze: PBS may not be fully live until year 2 of this 3-year contract, so its dependent benefits could exist for barely a year before everything is renegotiated.",
    "register": "pdf"
  }, {
    "title": "Union accountability: catch-up or genuine wins?",
    "body": "The market-position tags exist to answer one question: did the union win anything the market wasn't going to force anyway? On every benchmark researched for this deal, the answer is no - boarding pay and the pay floor are CATCH-UP (the company following the industry to stay staffed), and the +10% level restores AT-STANDARD rates as a temporary first-mover. Nothing researched here exceeds the prevailing standard (the 'brag test': meaningfully above the norm, not 2% over one regional for one bargaining cycle). Work rules (HRV cap, trade floor, etc.) have NOT yet been benchmarked against peer contracts - that comparison would complete the accountability picture. A net benefit to you can still be nothing to credit the union for; both things are true and this deal is mostly that. THE DEFINING STRUCTURAL ENTRY: run the old ladder at the new $29.77 floor and every FA from the 2-year rung up sits exactly 25.5% below it (~$10-15k/yr at guarantee) - the market-forced floor was funded 100% out of the pay structure, and future market-driven floor raises will no longer lift the scale, only compress it further. Fair context: full preservation ($64.25 top) exceeds every regional's top rate and was likely unwinnable - but even partial re-steepening would have returned dollars at every rung, and zero restoration is what this TA makes permanent.",
    "register": "web"
  }],
  "glossary": [["Continuous Duty Overnight", "A trip that flies late evening and early morning with a short overnight in between — you're on duty the whole time. Also called a 'standup' or CDO."], ["Ready Reserve", "A reserve day spent at or near the airport, ready to fly on very short notice. Also called HRV — the most disruptive kind of reserve day."], ["Golden Days", "Protected days off a reserve FA cannot be junior-assigned or contacted on."], ["System Board", "The System Board of Adjustment — the panel that decides grievances the union and company can't settle."], ["side letter", "A separate signed agreement outside the main contract. It can expire or be changed more easily than contract language."], ["Flight Pay Loss", "Pay covering a union rep's time away from flying to do union work. Abbreviated FPL."], ["retro pay", "Back pay covering the period since raises should have taken effect."], ["junior-assigned", "Forced to work on a day off because you're the least senior FA available."], ["top of scale", "The highest pay step — no more automatic longevity raises after this."], ["step-up", "Your automatic yearly raise for gaining another year of service. Also called a longevity step."], ["longevity step", "Your automatic yearly raise for gaining another year of service."], ["bid period", "The monthly scheduling window you bid for."], ["per diem", "Hourly expense money paid while you're away on a trip."], ["carve-out", "An exception written into a rule that reduces a paid minimum in certain situations."], ["lineholder", "An FA awarded a monthly schedule of trips (a 'line') — the opposite of being on reserve."], ["deadhead", "Riding a flight as a passenger while on duty, to get you where the company needs you — not working the flight."], ["grievance", "A formal complaint that the company violated the contract."], ["amendable", "Airline contracts don't expire — they become 'amendable,' the date renegotiation can begin while old terms stay in force."], ["guarantee", "The minimum number of hours you're paid each month regardless of how much you fly."], ["FlightPAC", "AFA's political action committee — funds candidates who support flight attendant issues."], ["domicile", "Your base airport — where your trips start and end."], ["selfing", "Arranging your own flights to or from a duty assignment instead of a scheduled deadhead."], ["pay and credit", "Counts toward both your paycheck AND your hour totals (guarantee, monthly caps)."], ["standup", "A trip that flies late evening and early morning with a short overnight in between — on duty throughout. Also called a CDO."], ["reserves", "On-call FAs with no fixed schedule who cover open flying."], ["ratification", "The membership vote that approves the tentative agreement and makes it the contract."], ["DOR", "Date of Ratification — the day the contract is voted in and takes effect."], ["PBS", "Preferential Bidding System — software that builds your monthly schedule from ranked preferences instead of picking whole lines."], ["HRV", "Ready Reserve — a reserve day spent at or near the airport, ready to fly on very short notice."], ["RAP", "Reserve Availability Period — the daily window a reserve must be reachable and ready to fly."], ["FOLO", "First Out / Last Out — the order in which reserves are called for trips."], ["CBA", "Collective Bargaining Agreement — your union contract."], ["AFA", "Association of Flight Attendants — your union."], ["NMB", "National Mediation Board — the federal agency that oversees airline labor relations."], ["DOT", "Department of Transportation — federal medical/qualification requirements."], ["TA", "Tentative Agreement — the proposed contract you're voting on."], ["FA", "Flight Attendant."], ["Implementation LOA", "A Letter of Agreement requiring the Company to actually build the promised systems — with expedited arbitration (heard in 15 days, decided in 30) if it doesn't deliver."], ["Railway Labor Act", "The federal law governing airline labor contracts — under it, contracts never expire; old terms stay frozen until a new deal is ratified."], ["LOA", "Letter of Agreement — a signed side deal attached to the contract."], ["ALPA", "Air Line Pilots Association — the pilots' union."], ["AD OPT", "The software vendor whose PBS product PSA's pilots already use."], ["arbitration", "A neutral third party hears the dispute and issues a binding decision."], ["MEC", "Master Executive Council — your union's top elected body at PSA."], ["LEC", "Local Executive Council — your union's elected body at each base."]],
  "execSummary": {
    "placement": "PDF exec page (up front); website shows the three one-liners under the scoreboard.",
    "matrixNote": "A contract-wide score isn't meaningful; what matters is the pattern across categories. Each cell is that category's weighted verdict for that group.",
    "perGroup": {
      "nh": "New hires: best-positioned overall — but their real base pay dips for two years and they inherit the flattened career ladder.",
      "mc": "Mid-career: gains ride on longevity steps already owed; the pay category is close once the structural concession is weighed.",
      "sr": "Senior: real base pay erodes every year and they carry the full structural concession — the most mixed picture of any group."
    }
  },
  "preface": {
    "cycle": "Before any number, understand the cycle every airline contract runs on. When a contract becomes 'amendable' (its renewal date), your pay doesn't rise — it FREEZES at the old rate until a brand-new deal is signed. Negotiations take years (the last one ran 2.6 years past due). So prices keep climbing while your pay sits still, and by the time a raise lands, it's mostly just catching you back up to the hole the freeze dug. Then the next contract becomes amendable, and it starts again. Freeze, catch up, freeze. The graph above is that cycle.",
    "forward_protection": "This is why one idea matters more than the headline raise: FORWARD PROTECTION. A contract protects you against the cycle if it has either (a) guaranteed back-pay to the amendable date — so the frozen years get paid, which also removes the company's reason to drag out talks — or (b) raises that beat inflation, so a catch-up actually gets ahead instead of just breaking even. Without forward protection, workers lose ground every cycle, and it compounds over a career. As you read, ask of every pay change: does this protect the gap, or not?",
    "incentives": "One honest thing about how to read any contract summary — including this one. Everyone at the table is arguing their own interest, and that's not a scandal, it's just how it works:\n• The COMPANY wants to keep costs down, so it highlights the big headline number and the shiny new items.\n• The UNION — which is your own coworkers doing hard work against a tough company — wants the deal to pass and gets credit for a 'good contract,' so it naturally frames things in the best light.\n• YOU just want to know, honestly, what it means for your paycheck and your life.\nNone of that implies bad faith — it's why this guide exists: to weigh each change on its own, from your side of the table, so you can decide for yourself. That's also why we WEIGH changes instead of counting them — a long list of small wins is the easiest way to make any deal look better than it is.",
    "fair_both_ways": "This stage cuts both ways. Once you see the cycle, some changes look better, not worse — boarding pay, for instance, is real new money that helps offset the erosion. The point isn't to make the deal look bad; it's to make every piece legible, good and bad, judged against how pay actually works over time."
  },
  "howToRead": {
    "page_order": ["what_this_is", "preface", "deal_in_one_paragraph", "how_to_use", "anchors", "scoreboard", "topics", "market_reality", "accountability", "key", "glossary"],
    "what_this_is": "An independent, plain-language look at the contract you're voting on - what you have today, what would change, and what it actually means for you. Built from the contract itself, not the union's summary or the company's talking points. It won't tell you how to vote; it makes sure you know what you're voting on.",
    "deal_in_one_paragraph": "The 10% raise mostly just catches you back up to 2023, and the small raises after it fall behind prices - so your pay slowly loses ground. Boarding pay is the real new money, though it's really PSA catching up to what other airlines already pay. Reserve life genuinely improves, with rules you can count on. Less visible: the pay ladder is flattened, which is worth $10-15k a year in forgone career earnings for FAs above the floor, and this deal makes it permanent. And most schedule wins wait on a new bidding system that's had a rough rollout.",
    "how_to_use": "Find your group - New Hire, Mid-Career, or Senior - and check your pay picture. Glance at the scoreboard for the whole deal at once. Then open whatever matters most to you. Every item shows today vs. proposed, a quick rating, and a plain bottom line. You don't need to study anything - it's built to just make sense as you read."
  },
  "legend": {
    "verdicts": [["CLEAR WIN", "the gains clearly dominate (weighted score 8+)", "pos"], ["Net positive", "more gain than cost (4 to 8)", "pos"], ["Modest positive", "a little ahead (1.5 to 4)", "pos"], ["About even", "the gains and the costs offset each other - not 'nothing changed'", "neu"], ["Net negative / CLEAR LOSS", "the costs dominate", "neg"]],
    "tags": [["NEW", "genuinely new - not in your current contract or side letters"], ["KEPT", "you already have this through a side deal; the contract just makes it permanent (worth something, but not new money)"], ["RESTORED", "you had it, it expired, this brings it back"], ["Automatic rule", "applies by itself on its date - enforceable by grievance"], ["Delayed rule", "automatic, but starts a year or two in"], ["Implementation promise", "only as good as the system the company builds - shown separately as 'if delivered'"], ["Market: CATCH-UP", "the company was forced to follow the industry to stay competitive - a benefit to you, not a favor"], ["Market: AT STANDARD", "matches what comparable airlines pay"], ["Market: ABOVE STANDARD", "genuinely beats the market - a real negotiated win"], ["if reserve / if commuter", "only counts for you if that's your situation - shown as a separate add-on, never assumed"]],
    "ratingPill": [{
      "label": "Major gain",
      "weight": 3,
      "blurb": "one of the biggest wins"
    }, {
      "label": "Solid gain",
      "weight": 2,
      "blurb": "a real, meaningful gain"
    }, {
      "label": "Small gain",
      "weight": 1,
      "blurb": "modest but genuine"
    }, {
      "label": "Token",
      "weight": 0.25,
      "blurb": "real but tiny"
    }, {
      "label": "No change",
      "weight": 0,
      "blurb": "doesn't move your life"
    }, {
      "label": "Small cost",
      "weight": -1,
      "blurb": "a modest downside"
    }, {
      "label": "Real cost",
      "weight": -2,
      "blurb": "a loss you'd feel"
    }, {
      "label": "Major cost",
      "weight": -3,
      "blurb": "one of the biggest downsides"
    }, {
      "label": "Depends",
      "weight": null,
      "blurb": "wildcard - left out of the math"
    }],
    "renderAs": "pills",
    "placement": "key",
    "details_pdf_only": {
      "small_vs_real": "A $50 once-a-year uniform bump is a Small item — real but tiny. A raise that trails inflation every year is a Real cost — it quietly takes meaningful money from everyone, over and over.",
      "same_yardstick": "Gains and costs use the same ruler, so a cost and a gain of equal size get equal weight with opposite signs — that's why a ~$15k/yr loss lands as a Major cost, the mirror of a Major gain."
    }
  },
  "designBrief": {
    "product": "Live website page presenting this assessment",
    "version": "1.13.1",
    "audience": "The whole membership - predominantly middle-aged women, busy, most have never read their contract. Plain, warm, direct language; short sentences; no jargon without an inline explanation.",
    "tone": "A knowledgeable coworker explaining it over coffee. Honest in both directions. Never tells anyone how to vote.",
    "non_negotiables": ["Verdict words must render exactly as written - never soften NEGATIVE/CLEAR WIN in design.", "Every item keeps its tags visible: NEW/KEPT/RESTORED, delivery (rule vs promise), and market tag where present.", "Charts never appear without their verdict + headline beside them.", "Keep the version stamp on the page.", "Do not merge items or their charts - one item, one card, one visual (single-item rule)."],
    "section_order": ["1. Scoreboard: the topic x group verdict matrix (the whole contract at a glance)", "2. 'Find your position': the three per-group pay outlook graphs, tabbed or side-by-side", "3. Topic-by-topic cards: Today vs Proposed table, 'what it means', tags, per-group ratings; details expandable/collapsible", "4. Market Reality Check sections", "5. Union accountability verdict", "6. Glossary + assumptions + version"],
    "item_rendering": "For each change use the `plain` field as the visible website text when present (it is written for the average non-technical reader); fall back to the first sentence of `meaning` only if `plain` is absent. Full `meaning`/`realterms` go behind an expander for those who want depth. Tags as small badges; per-group ratings as colored chips (greens for gains, grey for no change, reds for costs, amber for Depends).",
    "plain_language_rule": "This is a website for the average member, not a technical reader. Avoid or inline-explain jargon: 'amendable' -> 'when the contract is up for renewal', 'real-terms' -> 'what your pay actually buys', 'rung/step', 'back-pay' not 'retro'. Every chart shows its `plain_caption`, not its technical headline.",
    "visual_requirements": {
      "rebuild_natively": "Rebuild all charts from graphs[].data in the site's design language; the PNGs are reference renderings only.",
      "each_chart_in_its_section": "Place each chart in its graphs[].placement section - the chart must illustrate that section's subject (pay-vs-prices in the pay section, accountability chart in the accountability section). Never float a chart into an unrelated section.",
      "use_plain_caption": "Render each chart with its `plain_caption` (average-reader wording) plus its verdict - never without the verdict.",
      "flagship": "'Your raises vs. the cost of living' (the Treadmill): two lines from a shared day-one start - your pay vs prices - with the widening gap shaded and labeled as the real-terms pay cut. Hero placement at the top of the pay section. Label the pay line plainly (e.g. 'Your yearly raises after 2027 (+1.5%, then a freeze)'), never vague phrases.",
      "placement": "Each graphs[] entry names its placement section."
    },
    "glossary_terms": ["Continuous Duty Overnight (A trip that flies late evening and early morning with a short overnight in between — you're on duty the whole time. Also called a 'standup' or CDO.)", "Ready Reserve (A reserve day spent at or near the airport, ready to fly on very short notice. Also called HRV — the most disruptive kind of reserve day.)", "Golden Days (Protected days off a reserve FA cannot be junior-assigned or contacted on.)", "System Board (The System Board of Adjustment — the panel that decides grievances the union and company can't settle.)", "side letter (A separate signed agreement outside the main contract. It can expire or be changed more easily than contract language.)", "Flight Pay Loss (Pay covering a union rep's time away from flying to do union work. Abbreviated FPL.)", "retro pay (Back pay covering the period since raises should have taken effect.)", "junior-assigned (Forced to work on a day off because you're the least senior FA available.)", "top of scale (The highest pay step — no more automatic longevity raises after this.)", "step-up (Your automatic yearly raise for gaining another year of service. Also called a longevity step.)", "longevity step (Your automatic yearly raise for gaining another year of service.)", "bid period (The monthly scheduling window you bid for.)", "per diem (Hourly expense money paid while you're away on a trip.)", "carve-out (An exception written into a rule that reduces a paid minimum in certain situations.)", "lineholder (An FA awarded a monthly schedule of trips (a 'line') — the opposite of being on reserve.)", "deadhead (Riding a flight as a passenger while on duty, to get you where the company needs you — not working the flight.)", "grievance (A formal complaint that the company violated the contract.)", "amendable (Airline contracts don't expire — they become 'amendable,' the date renegotiation can begin while old terms stay in force.)", "guarantee (The minimum number of hours you're paid each month regardless of how much you fly.)", "FlightPAC (AFA's political action committee — funds candidates who support flight attendant issues.)", "domicile (Your base airport — where your trips start and end.)", "selfing (Arranging your own flights to or from a duty assignment instead of a scheduled deadhead.)", "pay and credit (Counts toward both your paycheck AND your hour totals (guarantee, monthly caps).)", "standup (A trip that flies late evening and early morning with a short overnight in between — on duty throughout. Also called a CDO.)", "reserves (On-call FAs with no fixed schedule who cover open flying.)", "ratification (The membership vote that approves the tentative agreement and makes it the contract.)", "DOR (Date of Ratification — the day the contract is voted in and takes effect.)", "PBS (Preferential Bidding System — software that builds your monthly schedule from ranked preferences instead of picking whole lines.)", "HRV (Ready Reserve — a reserve day spent at or near the airport, ready to fly on very short notice.)", "RAP (Reserve Availability Period — the daily window a reserve must be reachable and ready to fly.)", "FOLO (First Out / Last Out — the order in which reserves are called for trips.)", "CBA (Collective Bargaining Agreement — your union contract.)", "AFA (Association of Flight Attendants — your union.)", "NMB (National Mediation Board — the federal agency that oversees airline labor relations.)", "DOT (Department of Transportation — federal medical/qualification requirements.)", "TA (Tentative Agreement — the proposed contract you're voting on.)", "FA (Flight Attendant.)", "Implementation LOA (A Letter of Agreement requiring the Company to actually build the promised systems — with expedited arbitration (heard in 15 days, decided in 30) if it doesn't deliver.)", "Railway Labor Act (The federal law governing airline labor contracts — under it, contracts never expire; old terms stay frozen until a new deal is ratified.)", "LOA (Letter of Agreement — a signed side deal attached to the contract.)", "ALPA (Air Line Pilots Association — the pilots' union.)", "AD OPT (The software vendor whose PBS product PSA's pilots already use.)", "arbitration (A neutral third party hears the dispute and issues a binding decision.)", "MEC (Master Executive Council — your union's top elected body at PSA.)", "LEC (Local Executive Council — your union's elected body at each base.)"]
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
  "placements": ["hero", "scoreboard", "accountability", "cat-pay", "cat-reserve", "cat-schedule", "cat-leave", "cat-uniforms", "cat-job", "cat-union"],
  "scoreboard": {
    "intro": "The whole contract at a glance. Each cell is that category's weighted verdict for that group - not a count of changes. Wildcard ('Depends') items and reserve/commuter-only items are left OUT of these scores; where they'd matter, a small 'more if...' note is shown.",
    "note_on_dep": "Depends items are counted separately (shown as 'N depends') and never folded into the score.",
    "rows": [{
      "topic": "cat-pay",
      "topicTitle": "Your Paycheck",
      "nh": {
        "verdict": "Net positive",
        "polarity": "pos",
        "score": 5.75,
        "tally": "10 gains, 2 costs",
        "depCount": 0,
        "addonNotes": []
      },
      "mc": {
        "verdict": "Modest positive",
        "polarity": "pos",
        "score": 3.75,
        "tally": "9 gains, 2 costs",
        "depCount": 0,
        "addonNotes": [],
        "bandEdgeNote": "This lands just under the line between two verdicts (score 3.8, boundary 4) - a small change in one item could tip it either way."
      },
      "sr": {
        "verdict": "Modest positive",
        "polarity": "pos",
        "score": 3.0,
        "tally": "9 gains, 2 costs",
        "depCount": 0,
        "addonNotes": []
      }
    }, {
      "topic": "cat-reserve",
      "topicTitle": "Reserve Life",
      "nh": {
        "verdict": "Net positive",
        "polarity": "pos",
        "score": 6.0,
        "tally": "4 gains, 0 costs",
        "depCount": 0,
        "addonNotes": ["+4 more if the new systems are built well"]
      },
      "mc": {
        "verdict": "About even",
        "polarity": "neu",
        "score": 0.0,
        "tally": "0 gains, 0 costs",
        "depCount": 0,
        "addonNotes": ["+6 more if reserve", "+4 more if reserve & the new systems are built well"]
      },
      "sr": {
        "verdict": "About even",
        "polarity": "neu",
        "score": 0.0,
        "tally": "0 gains, 0 costs",
        "depCount": 0,
        "addonNotes": ["+6 more if reserve", "+4 more if reserve & the new systems are built well"]
      }
    }, {
      "topic": "cat-schedule",
      "topicTitle": "Your Schedule",
      "nh": {
        "verdict": "Modest positive",
        "polarity": "pos",
        "score": 3.25,
        "tally": "3 gains, 0 costs, 1 depends",
        "depCount": 1,
        "addonNotes": ["+3 more if the new systems are built well"]
      },
      "mc": {
        "verdict": "Modest positive",
        "polarity": "pos",
        "score": 2.25,
        "tally": "2 gains, 0 costs, 1 depends",
        "depCount": 1,
        "addonNotes": ["+3 more if the new systems are built well", "+1 more if reserve"]
      },
      "sr": {
        "verdict": "Modest positive",
        "polarity": "pos",
        "score": 2.25,
        "tally": "2 gains, 0 costs, 1 depends",
        "depCount": 1,
        "addonNotes": ["+3 more if the new systems are built well", "+1 more if reserve"]
      }
    }, {
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
    }, {
      "topic": "cat-uniforms",
      "topicTitle": "Uniforms & Commuting Costs",
      "nh": {
        "verdict": "About even",
        "polarity": "neu",
        "score": 1.0,
        "tally": "6 gains, 1 cost",
        "depCount": 0,
        "addonNotes": ["+2 more if commuter"],
        "bandEdgeNote": "This lands just under the line between two verdicts (score 1, boundary 1.5) - a small change in one item could tip it either way."
      },
      "mc": {
        "verdict": "Modest positive",
        "polarity": "pos",
        "score": 3.0,
        "tally": "6 gains, 0 costs",
        "depCount": 0,
        "addonNotes": ["+2 more if commuter"]
      },
      "sr": {
        "verdict": "Modest positive",
        "polarity": "pos",
        "score": 2.25,
        "tally": "6 gains, 0 costs",
        "depCount": 0,
        "addonNotes": ["+2 more if commuter"]
      }
    }, {
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
    }, {
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
    }]
  },
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
    "anchors": {
      "title": "How we judge every change",
      "intro": "Six principles behind every rating in this guide."
    },
    "key": {
      "title": "The key: ratings & tags",
      "intro": "Reference for the chips and tags used throughout — come back to it whenever you want the exact meaning."
    },
    "scoreboard": {
      "title": "The whole contract at a glance",
      "intro": "The whole contract at a glance. Each cell is that category's weighted verdict for that group - not a count of changes. Wildcard ('Depends') items and reserve/commuter-only items are left OUT of these scores; where they'd matter, a small 'more if...' note is shown."
    },
    "topics": {
      "title": "What changes, topic by topic"
    },
    "market_reality": {
      "title": "Market reality check",
      "intro": "How this deal looks against inflation, other airlines, and what was winnable."
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
  "tables": [{
    "id": "pay_scale_comparison",
    "register": "pdf",
    "placement": "cat-pay",
    "title": "The full pay scale: today, proposed, and the defended structure",
    "leadIn": "Every rung, three ways: what you earn today, what the TA proposes, and what the same $29.77 starting rate would pay if the old ladder's shape had been kept. The gap in the last column is the structural concession.",
    "columns": ["Years of service", "Today ($/hr)", "Proposed ($/hr)", "Defended structure ($/hr)"],
    "rows": [["0-6mo", "$27.06", "$29.77", "$29.77"], ["7-12mo", "$27.06", "$29.77", "$31.34"], ["1yr", "$27.06", "$29.77", "$37.21"], ["2yr", "$27.06", "$29.77", "$39.96"], ["3yr", "$28.93", "$31.82", "$42.72"], ["4yr", "$30.74", "$33.81", "$45.39"], ["5yr", "$31.84", "$35.02", "$47.02"], ["6yr", "$33.43", "$36.77", "$49.37"], ["7yr", "$34.86", "$38.35", "$51.48"], ["8yr", "$36.10", "$39.71", "$53.31"], ["9yr", "$37.15", "$40.87", "$54.86"], ["10yr", "$38.19", "$42.01", "$56.39"], ["11yr", "$39.21", "$43.13", "$57.90"], ["12yr", "$39.87", "$43.86", "$58.88"], ["13yr", "$40.86", "$44.95", "$60.34"], ["14yr", "$41.39", "$45.53", "$61.12"], ["15yr", "$41.92", "$46.11", "$61.90"], ["16yr", "$42.45", "$46.70", "$62.69"], ["17yr", "$42.98", "$47.28", "$63.47"], ["18yr", "$43.51", "$47.86", "$64.25"]],
    "footnote": "Defended structure = the pre-2022 relative ladder re-anchored to the new $29.77 floor. Every rung from the 2-year mark up sits 25.5% below it - the uniform gap is the sign the raised floor was funded entirely out of the scale's shape."
  }, {
    "id": "raise_timeline",
    "register": "both",
    "placement": "cat-pay",
    "title": "When the money actually arrives",
    "leadIn": "The headline number lands over several years - and some of it never catches up to prices.",
    "columns": ["Date", "What changes"],
    "rows": [["2026", "+10% on all rates, plus retro pay to the amendable date"], ["2027", "Boarding pay begins (50% of rate); +1.5% on scale"], ["2028", "+1.5% on scale; min-day rises to 3.75 hrs; deadhead to 75%"], ["2029", "Contract amendable - rates freeze until the next deal is ratified"]],
    "footnote": "The last negotiation ran 2.6 years past the amendable date with pay frozen the whole time."
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "blue-streak-vote-guide/assessment.data.js", error: String((e && e.message) || e) }); }

// blue-streak-vote-guide/card-render.js
try { (() => {
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
  const RLABELS = (A.ratingSystem || {}).labels || {};
  const TYPE_LABELS = A.typeLabels || {};
  const MKT_LABELS = A.marketLabels || {};
  const GROUP_SHORT = {
    nh: "New Hire",
    mc: "Mid-Career",
    sr: "Senior"
  };
  const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // ── rating code → pill colors (mirrors the .t-* tone classes) ──────────────
  const RATING = {
    MG: {
      bg: "var(--success-600)",
      fg: "#fff",
      bd: "var(--success-600)"
    },
    SG: {
      bg: "#8ed0ac",
      fg: "var(--navy-900)",
      bd: "#4fb183"
    },
    sg: {
      bg: "var(--success-100)",
      fg: "var(--navy-900)",
      bd: "#a6ddc1"
    },
    tk: {
      bg: "var(--cream-200)",
      fg: "var(--ink-700)",
      bd: "var(--cream-300)"
    },
    nc: {
      bg: "var(--cream-200)",
      fg: "var(--ink-300)",
      bd: "var(--cream-300)"
    },
    sc: {
      bg: "var(--red-100)",
      fg: "var(--navy-900)",
      bd: "#f4b8c0"
    },
    RC: {
      bg: "#f09aa4",
      fg: "var(--navy-900)",
      bd: "var(--red-500)"
    },
    XC: {
      bg: "var(--red-600)",
      fg: "#fff",
      bd: "var(--red-600)"
    },
    dep: {
      bg: "var(--cream-200)",
      fg: "var(--navy-900)",
      bd: "var(--gold-500)"
    }
  };
  const TYPE = {
    NEW: {
      bg: "var(--gold-500)",
      fg: "var(--navy-900)"
    },
    CODIFY: {
      bg: "var(--sky-700)",
      fg: "#fff"
    },
    RESTORE: {
      bg: "var(--red-600)",
      fg: "#fff"
    }
  };
  const DLV = {
    automatic: {
      label: "Automatic rule",
      icon: "ph-seal-check",
      bg: "var(--sky-100)",
      bd: "var(--sky-700)",
      fg: "var(--sky-700)"
    },
    delayed: {
      label: "Delayed rule",
      icon: "ph-hourglass-medium",
      bg: "var(--cream-300)",
      bd: "var(--ink-300)",
      fg: "var(--ink-700)"
    },
    promise: {
      label: "Implementation promise",
      icon: "ph-hammer",
      bg: "var(--gold-100)",
      bd: "var(--gold-500)",
      fg: "var(--gold-600)"
    }
  };
  // chart verdict → figure frame tint (cv-*), keyed off data `polarity`
  function chartVerdict(pol) {
    if (pol === "pos") return {
      bg: "var(--success-100)",
      bd: "var(--success-600)"
    };
    if (pol === "neu") return {
      bg: "var(--cream-200)",
      bd: "var(--gold-500)"
    };
    return {
      bg: "var(--red-100)",
      bd: "var(--red-600)"
    };
  }
  // category verdict → header pill colors (v-*), keyed off data `polarity`
  function verdictColors(v, pol) {
    if (pol === "neu") return {
      bg: "var(--cream-300)",
      fg: "var(--ink-700)"
    };
    if (pol === "neg") {
      if (/CLEAR LOSS|Major/i.test(v)) return {
        bg: "var(--red-600)",
        fg: "#fff"
      };
      if (/negative|loss/i.test(v)) return {
        bg: "#f09aa4",
        fg: "var(--navy-900)"
      };
      return {
        bg: "var(--red-100)",
        fg: "var(--navy-900)"
      };
    }
    if (pol === "pos") {
      if (/CLEAR WIN/i.test(v)) return {
        bg: "var(--success-600)",
        fg: "#fff"
      };
      if (/Net positive/i.test(v)) return {
        bg: "#8ed0ac",
        fg: "var(--navy-900)"
      };
      return {
        bg: "var(--success-100)",
        fg: "var(--navy-900)"
      };
    }
    return {
      bg: "var(--cream-300)",
      fg: "var(--ink-700)"
    };
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
    return window.AssessmentChart(spec, ctx && ctx.chartOpts || {
      thick: true,
      width: 660
    });
  }

  // ── $ / % unit toggle (ADR-039 wiring) ─────────────────────────────────────
  // spec.units (declared in the data) lists alternate presentations of the SAME
  // numbers — e.g. "Multiple of starting pay" vs "Dollars per hour". The chart
  // engine (assessment-charts.js) already supports re-rendering under a chosen
  // unit via AssessmentChart(spec, {unit:key}); this wires that to a visible
  // segmented control so the reader can flip between them. One global registry
  // + one delegated click handler serves every chart instance on the page.
  window.__vcCharts = window.__vcCharts || {};
  (A.charts || []).forEach(s => {
    window.__vcCharts[s.id] = s;
  });
  let vcInstanceSeq = 0;
  window.__vcSetUnit = function (wrapId, unitKey, btnEl) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    const spec = window.__vcCharts[wrap.getAttribute("data-chart-id")];
    if (!spec || !window.AssessmentChart) return;
    let opts = {};
    try {
      opts = JSON.parse(wrap.getAttribute("data-opts") || "{}");
    } catch (e) {}
    wrap.innerHTML = window.AssessmentChart(spec, Object.assign({}, opts, {
      unit: unitKey
    }));
    const bar = btnEl && btnEl.closest(".vc-unit-toggle");
    if (bar) {
      Array.prototype.forEach.call(bar.children, b => {
        const on = b === btnEl;
        b.style.background = on ? "var(--navy-900)" : "transparent";
        b.style.color = on ? "#fff" : "var(--ink-700)";
      });
    }
  };
  function unitToggleHTML(spec, wrapId) {
    const units = window.AssessmentChartUnits ? window.AssessmentChartUnits(spec) : spec.units || [];
    if (!units || units.length < 2) return "";
    const defaultKey = (units.filter(u => u.default)[0] || units[0]).key;
    // Keep buttons terse — a symbol/short word, not the full descriptive label
    // (that full text belongs on the axis, not a toggle button).
    const shortLabel = u => {
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
    if (!spec || !window.AssessmentChart) return {
      toggle: "",
      wrapHtml: ""
    };
    const opts = ctx && ctx.chartOpts || {
      thick: true,
      width: 660
    };
    const wrapId = "vc-chart-" + spec.id + "-" + ++vcInstanceSeq;
    const toggle = unitToggleHTML(spec, wrapId);
    const svg = window.AssessmentChart(spec, opts);
    const wrapHtml = '<div id="' + wrapId + '" data-chart-id="' + spec.id + '" data-opts=\'' + JSON.stringify(opts).replace(/'/g, "&#39;") + '\'>' + svg + '</div>';
    return {
      toggle,
      wrapHtml
    };
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
    return '<figure style="margin:0 0 12px; background:var(--cream-100); border:1.5px solid var(--cream-300); border-radius:12px; padding:14px; break-inside:avoid;">' + '<p style="font-size:13px; line-height:1.55; margin:0 0 8px; color:var(--ink-700);">' + (spec.leadIn || "") + '</p>' + '<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; margin:0 0 10px;">' + '<div style="display:inline-flex; align-items:center; padding:4px 11px; border-radius:999px; font-family:var(--font-heading); font-weight:800; font-size:10.5px; letter-spacing:0.03em; text-transform:uppercase; color:var(--navy-900); background:' + cv.bg + '; border:1.5px solid ' + cv.bd + ';">Verdict: ' + (spec.verdict || "") + '</div>' + cp.toggle + '</div>' + cp.wrapHtml + '<figcaption style="font-size:12.5px; line-height:1.55; color:var(--ink-700); margin:8px 0 0;">' + (spec.plainCaption || "") + '</figcaption>' + (spec.assumptions ? '<div style="font-size:10.5px; line-height:1.45; color:var(--ink-300); margin:6px 0 0;">Assumptions: ' + spec.assumptions + '</div>' : "") + '</figure>';
  }

  // A standalone / orphan chart figure (white frame, section level).
  function chartFigure(spec, ctx) {
    const cv = chartVerdict(spec.polarity);
    const cp = chartPieces(spec, ctx);
    return '<figure style="margin:0 0 16px; background:var(--white); border:1.5px solid var(--cream-300); border-radius:16px; padding:20px; break-inside:avoid;">' + '<p style="font-size:13.5px; line-height:1.6; margin:0 0 8px; color:var(--ink-700);">' + (spec.leadIn || "") + '</p>' + '<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; margin:0 0 10px;">' + '<div style="display:inline-flex; align-items:center; padding:4px 11px; border-radius:999px; font-family:var(--font-heading); font-weight:800; font-size:10.5px; letter-spacing:0.03em; text-transform:uppercase; color:var(--navy-900); background:' + cv.bg + '; border:1.5px solid ' + cv.bd + ';">Verdict: ' + (spec.verdict || "") + '</div>' + cp.toggle + '</div>' + cp.wrapHtml + '<figcaption style="font-size:13px; line-height:1.6; color:var(--ink-700); margin:10px 0 0;">' + (spec.plainCaption || "") + '</figcaption>' + (spec.assumptions ? '<div style="font-size:10.5px; line-height:1.45; color:var(--ink-300); margin:6px 0 0;">Assumptions: ' + spec.assumptions + '</div>' : "") + '</figure>';
  }

  // ── the change card ─────────────────────────────────────────────────────────
  // c = a raw change object from assessment.data topics[].changes[]
  function changeCard(c, ctx) {
    ctx = ctx || {};
    const detail = ctx.detail === "long" ? "long" : "short";
    const group = ctx.group || "nh";
    const chartIds = c.chart ? Array.isArray(c.chart) ? c.chart : [c.chart] : [];
    const CHARTS = {};
    (A.charts || []).forEach(s => {
      CHARTS[s.id] = s;
    });
    const prose = detail === "long" ? c.meaning || c.plain || "" : c.plain || c.meaning || "";
    const showRealterms = detail === "long" && !!c.realterms;

    // left column
    let left = '<div style="min-width:0;">';
    left += '<h3 style="font-family:var(--font-heading); font-weight:800; font-size:17.5px; color:var(--navy-900); margin:0 0 10px; line-height:1.3;">' + (c.title || "") + '</h3>';
    left += '<p style="font-size:14px; line-height:1.6; margin:0 0 12px;">' + prose + '</p>';
    // today → proposed
    left += '<div style="display:grid; grid-template-columns:1fr 40px 1fr; align-items:stretch; margin:0 0 12px;">' + '<div style="padding:13px 16px; border-radius:12px; background:var(--cream-200); border:1.5px dashed var(--cream-300);">' + '<div style="font-family:var(--font-heading); font-weight:800; font-size:10px; letter-spacing:0.14em; text-transform:uppercase; margin-bottom:6px; color:var(--ink-300);"><i class="ph-fill ph-clock-counter-clockwise"></i> Today</div>' + '<p style="margin:0; font-size:13.5px; line-height:1.55;">' + (c.today || "") + '</p></div>' + '<div style="display:flex; align-items:center; justify-content:center; color:var(--gold-600); font-size:20px;"><i class="ph-bold ph-arrow-right"></i></div>' + '<div style="padding:13px 16px; border-radius:12px; background:var(--sky-100); border:1.5px solid var(--sky-700);">' + '<div style="font-family:var(--font-heading); font-weight:800; font-size:10px; letter-spacing:0.14em; text-transform:uppercase; margin-bottom:6px; color:var(--sky-700);"><i class="ph-fill ph-arrow-fat-right"></i> Proposed</div>' + '<p style="margin:0; font-size:13.5px; line-height:1.55;">' + (c.proposed || "") + '</p></div></div>';
    // real-terms deep note (long only)
    if (showRealterms) {
      left += '<p style="font-size:13px; line-height:1.6; margin:0 0 12px; background:var(--cream-100); border:1.5px solid var(--cream-300); border-left:5px solid var(--gold-500); border-radius:0 12px 12px 0; padding:12px 16px;"><b style="color:var(--navy-900); font-family:var(--font-heading);">In real terms —</b> ' + c.realterms + '</p>';
    }
    // inline charts (suppressed in print, where charts flow as their own blocks)
    if (!ctx.noCharts) {
      chartIds.map(id => CHARTS[id]).filter(Boolean).forEach(spec => {
        left += inlineChartFigure(spec, ctx);
      });
    }
    left += '</div>';

    // right rail
    const metaBlock = (label, valueHTML, wrapStyle) => '<div style="' + (wrapStyle || '') + '"><div style="font-family:var(--font-heading); font-weight:800; font-size:10px; letter-spacing:0.1em; text-transform:uppercase; color:var(--navy-900); margin-bottom:3px;">' + label + '</div>' + valueHTML + '</div>';
    const coversHTML = c.cond ? '<span style="display:inline-block; padding:3px 9px; border-radius:6px; font-family:var(--font-heading); font-weight:800; font-size:9.5px; letter-spacing:0.05em; text-transform:uppercase; border:1.5px dashed var(--gold-500); color:var(--gold-600);">if ' + c.cond + '</span>' : '<div style="font-family:var(--font-heading); font-weight:700; font-size:13px; color:var(--navy-900); line-height:1.35;">Everyone</div>';
    const metaRows = [];
    metaRows.push(["What is this?", typeChip(c.type)]);
    metaRows.push(["Who it covers", coversHTML]);
    metaRows.push(["Starts", '<div style="font-family:var(--font-heading); font-weight:700; font-size:13px; color:var(--navy-900); line-height:1.35;">' + formatStarts(c.starts) + '</div>']);
    metaRows.push(["How sure is it?", dlvChip(c.delivery)]);
    if (c.market) {
      const mkt = '<span style="display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius:6px; border:1.5px solid var(--navy-900); background:var(--white); font-family:var(--font-heading); font-weight:800; font-size:9.5px; letter-spacing:0.04em; text-transform:uppercase; color:var(--navy-900);"><i class="ph-fill ph-chart-bar"></i> ' + (MKT_LABELS[c.market.position] || c.market.position) + '</span>' + '<div style="font-size:11px; line-height:1.5; color:var(--ink-500); margin-top:3px;">' + (c.market.note || "") + '</div>';
      metaRows.push(["Vs. other airlines", mkt]);
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
      const nameStyle = k === group ? 'font-family:var(--font-heading); font-weight:800; font-size:12px; color:#fff;' : 'font-size:11.5px; color:var(--sky-300);';
      chips += '<div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">' + '<span class="ink-onnavy" style="white-space:nowrap; ' + nameStyle + '">' + GROUP_SHORT[k] + '</span>' + ratingPill(code) + '</div>';
    });
    const worth = '<div class="ink-navy" style="background:var(--navy-900); border-radius:12px; padding:13px 14px;">' + '<div class="ink-gold" style="font-family:var(--font-heading); font-weight:800; font-size:9.5px; letter-spacing:0.1em; text-transform:uppercase; color:var(--gold-500); margin-bottom:8px;">Worth to each group</div>' + '<div style="display:flex; flex-direction:column; gap:7px;"' + (ctx.chipsAnchor ? ' data-comment-anchor="' + ctx.chipsAnchor + '"' : '') + '>' + chips + '</div></div>';
    const right = '<div style="display:flex; flex-direction:column; gap:10px; position:sticky; top:calc(var(--tb-h, 54px) + 12px); align-self:start;">' + meta + worth + '</div>';
    return '<div style="background:var(--white); border:1.5px solid var(--cream-300); border-radius:16px; padding:20px 16px 20px 22px; margin-bottom:16px; display:grid; grid-template-columns:1fr 224px; gap:14px; break-inside:avoid;">' + left + right + '</div>';
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
      addons = '<div style="padding:8px 14px; background:rgba(255,255,255,0.04); border-top:1.5px solid rgba(255,255,255,0.15); display:flex; flex-direction:column; gap:4px;">' + cat.addons.map(a => '<div class="ink-onnavy" style="font-size:11px; color:var(--gold-200); font-weight:700; line-height:1.4;">' + (a.text || a) + '</div>').join('') + '</div>';
    }
    let scoreBox;
    if (ctx.allGroups && cat.groups) {
      const rows = cat.groups.map(g => {
        const gv = verdictColors(g.verdict || "", g.polarity);
        return '<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:6px 14px;">' + '<span class="ink-onnavy" style="font-family:var(--font-heading); font-weight:800; font-size:10px; letter-spacing:0.05em; text-transform:uppercase; color:var(--sky-300);">' + (g.groupLabel || "") + '</span>' + '<span style="display:inline-flex; align-items:center; gap:6px; font-family:var(--font-heading); font-weight:800; font-size:10.5px; padding:3px 9px; border-radius:6px; white-space:nowrap; background:' + gv.bg + '; color:' + gv.fg + ';">' + (g.verdict || "") + ' <span style="opacity:0.75;">' + (g.score || "") + '</span></span>' + '</div>';
      }).join('<div style="height:1px; background:rgba(255,255,255,0.12);"></div>');
      scoreBox = '<div style="display:inline-flex; flex-direction:column; border:1.5px solid rgba(255,255,255,0.15); border-radius:13px; overflow:hidden; text-align:left; min-width:236px;">' + '<div class="ink-gold" style="padding:8px 14px; font-family:var(--font-heading); font-weight:800; font-size:9px; letter-spacing:0.11em; text-transform:uppercase; color:var(--gold-500); background:rgba(232,184,75,0.14); border-bottom:1.5px solid rgba(255,255,255,0.15);">Verdict by group</div>' + rows + addons + '</div>';
    } else {
      const vc = verdictColors(cat.verdict || "", cat.polarity);
      scoreBox = '<div style="display:inline-flex; flex-direction:column; border:1.5px solid rgba(255,255,255,0.15); border-radius:13px; overflow:hidden; text-align:left; min-width:212px;">' + '<div style="display:flex; align-items:center; justify-content:center; gap:6px; padding:9px 18px; font-family:var(--font-heading); font-weight:800; font-size:14px; text-transform:uppercase; letter-spacing:0.02em; background:' + vc.bg + '; color:' + vc.fg + ';">' + (cat.verdict || "") + edge + '</div>' + '<div style="display:flex; align-items:stretch;">' + '<div style="flex:1; padding:8px 14px; text-align:right;"><div class="ink-onnavy" style="font-family:var(--font-heading); font-size:9px; letter-spacing:0.11em; text-transform:uppercase; color:var(--sky-300); font-weight:800; margin-bottom:3px;">For ' + (cat.groupLabel || "") + '</div><div class="ink-onnavy" style="font-size:12.5px; color:var(--cream-100); font-weight:700; line-height:1.35;">' + (cat.tally || "") + '</div></div>' + '<div style="padding:6px 16px; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(232,184,75,0.16); border-left:1.5px solid rgba(255,255,255,0.15);"><div class="ink-gold" style="font-family:var(--font-heading); font-size:9px; letter-spacing:0.11em; text-transform:uppercase; color:var(--gold-500); font-weight:800; margin-bottom:2px;">Score</div><div class="ink-onnavy" style="font-family:var(--font-display); font-size:22px; line-height:0.9; color:#fff;">' + (cat.score || "") + '</div></div>' + '</div>' + addons + '</div>';
    }
    return '<div class="ink-navy" style="background:var(--navy-900); border-top:5px solid var(--gold-500); padding:26px 44px; display:flex; align-items:flex-start; justify-content:space-between; gap:18px; flex-wrap:wrap;">' + '<div style="flex:1; min-width:300px;">' + '<div class="ink-gold" style="font-family:var(--font-heading); font-weight:800; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:var(--gold-500); margin:0 0 9px;">Topic ' + cat.num + ' of ' + cat.total + '</div>' + '<h2 class="ink-onnavy" style="font-family:var(--font-display); text-transform:uppercase; font-size:31px; line-height:1; color:#fff; margin:0;">' + cat.title + '</h2>' + (cat.topicNote ? '<p class="ink-onnavy" style="font-size:12.5px; color:var(--sky-300); margin:9px 0 0; max-width:600px; line-height:1.5;">' + cat.topicNote + '</p>' : '') + '</div>' + '<div style="flex:none;">' + scoreBox + '</div></div>';
  }

  // ── data table ───────────────────────────────────────────────────────────────
  function dataTable(tb) {
    let head = tb.columns.map(col => '<span style="flex:1; min-width:0; font-family:var(--font-heading); font-weight:800; font-size:10.5px; letter-spacing:0.07em; text-transform:uppercase; color:var(--ink-300);">' + col + '</span>').join('');
    let rows = tb.rows.map(r => '<div style="display:flex; gap:14px; padding:8px 0; border-bottom:1px solid var(--cream-300); font-size:12.5px; line-height:1.5;">' + r.map(cell => '<span style="flex:1; min-width:0; color:var(--ink-700);">' + cell + '</span>').join('') + '</div>').join('');
    return '<div style="background:var(--white); border:1.5px solid var(--cream-300); border-radius:16px; padding:20px 24px; margin-bottom:16px; break-inside:avoid;">' + '<h3 style="font-family:var(--font-heading); font-weight:800; font-size:15px; color:var(--navy-900); margin:0 0 6px;">' + tb.title + '</h3>' + (tb.leadIn ? '<p style="font-size:13px; line-height:1.55; color:var(--ink-700); margin:0 0 12px;">' + tb.leadIn + '</p>' : '') + '<div style="display:flex; gap:14px; border-bottom:2px solid var(--cream-300); padding-bottom:8px;">' + head + '</div>' + rows + (tb.footnote ? '<p style="font-size:11px; line-height:1.5; color:var(--ink-300); margin:10px 0 0;">' + tb.footnote + '</p>' : '') + '</div>';
  }
  window.VoteCard = {
    changeCard,
    chartFigure,
    inlineChartFigure,
    dataTable,
    topicBand,
    normPlacement,
    formatStarts,
    chartHTML,
    chartHTMLWithToggle,
    chartPieces,
    unitToggleHTML,
    GROUP_SHORT,
    RATING,
    TYPE,
    DLV,
    verdictColors,
    chartVerdict
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "blue-streak-vote-guide/card-render.js", error: String((e && e.message) || e) }); }

// components/content/Callout.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Blue Streak Hangar — Callout
 * The "pro tip" / "important" box. Tinted panel, icon, optional title.
 */
function Callout({
  children,
  tone = 'info',
  // 'info' | 'tip' | 'warning' | 'danger'
  title = null,
  icon = null,
  // override Phosphor class
  ...rest
}) {
  const tones = {
    info: {
      bg: 'var(--info-100)',
      bar: 'var(--info-600)',
      ink: 'var(--info-600)',
      ic: 'ph-fill ph-info'
    },
    tip: {
      bg: 'var(--success-100)',
      bar: 'var(--success-600)',
      ink: 'var(--success-600)',
      ic: 'ph-fill ph-lightbulb'
    },
    warning: {
      bg: 'var(--warning-100)',
      bar: 'var(--warning-600)',
      ink: 'var(--warning-600)',
      ic: 'ph-fill ph-warning'
    },
    danger: {
      bg: 'var(--danger-100)',
      bar: 'var(--danger-600)',
      ink: 'var(--danger-600)',
      ic: 'ph-fill ph-warning-octagon'
    }
  };
  const t = tones[tone] || tones.info;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      gap: 14,
      background: t.bg,
      borderLeft: `6px solid ${t.bar}`,
      borderRadius: 'var(--radius-sm)',
      padding: '16px 18px'
    }
  }, rest), /*#__PURE__*/React.createElement("i", {
    className: icon || t.ic,
    style: {
      fontSize: 24,
      color: t.ink,
      lineHeight: 1.1,
      flex: 'none'
    },
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-heading)',
      fontWeight: 800,
      fontSize: 15,
      letterSpacing: '0.02em',
      color: t.ink,
      marginBottom: 4,
      textTransform: 'uppercase'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 16,
      lineHeight: 1.5,
      color: 'var(--ink-900)'
    }
  }, children)));
}
Object.assign(__ds_scope, { Callout });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/Callout.jsx", error: String((e && e.message) || e) }); }

// components/content/QuestionsFooter.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Blue Streak Hangar — QuestionsFooter
 * The standard sign-off on every document: warm prompt + "click here" action.
 * The user asked for this specifically — keep it on every flyer.
 */
function QuestionsFooter({
  message = 'Questions? Feel free to DM me — happy to help!',
  ctaLabel = 'Click here to ask',
  href = '#',
  tone = 'navy',
  // 'navy' | 'cream'
  brand = 'Blue Streak · Jr & Sr Hangar',
  ...rest
}) {
  const isNavy = tone === 'navy';
  return /*#__PURE__*/React.createElement("footer", _extends({
    style: {
      background: isNavy ? 'var(--navy-900)' : 'var(--cream-300)',
      color: isNavy ? 'var(--cream-100)' : 'var(--navy-900)',
      padding: '22px 26px',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 18,
      flexWrap: 'wrap'
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph-fill ph-chat-circle-dots",
    "aria-hidden": "true",
    style: {
      fontSize: 30,
      color: 'var(--gold-500)',
      flex: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-heading)',
      fontWeight: 700,
      fontSize: 17,
      lineHeight: 1.3
    }
  }, message), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-heading)',
      fontWeight: 700,
      fontSize: 11,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: isNavy ? 'var(--sky-300)' : 'var(--ink-500)',
      marginTop: 4
    }
  }, brand))), /*#__PURE__*/React.createElement("a", {
    href: href,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 9,
      background: 'var(--red-600)',
      color: '#fff',
      fontFamily: 'var(--font-heading)',
      fontWeight: 700,
      fontSize: 16,
      textDecoration: 'none',
      padding: '0 24px',
      height: 52,
      borderRadius: 'var(--radius-pill)',
      whiteSpace: 'nowrap',
      boxShadow: 'var(--shadow-sm)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph-fill ph-paper-plane-tilt",
    "aria-hidden": "true",
    style: {
      fontSize: 20
    }
  }), ctaLabel));
}
Object.assign(__ds_scope, { QuestionsFooter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/QuestionsFooter.jsx", error: String((e && e.message) || e) }); }

// components/content/SectionHeader.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Blue Streak Hangar — SectionHeader
 * The navy "ribbon" header from our posters: overline + big title.
 */
function SectionHeader({
  title,
  overline = null,
  align = 'left',
  // 'left' | 'center'
  tone = 'navy',
  // 'navy' | 'cream'
  display = false,
  // use Anton display face for the title
  ...rest
}) {
  const isCream = tone === 'cream';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      textAlign: align,
      background: isCream ? 'transparent' : 'var(--navy-700)',
      color: isCream ? 'var(--navy-900)' : 'var(--cream-100)',
      padding: isCream ? '0' : '16px 22px',
      borderRadius: isCream ? 0 : 'var(--radius-sm)',
      borderBottom: isCream ? '3px solid var(--red-600)' : 'none',
      paddingBottom: isCream ? 10 : undefined
    }
  }, rest), overline && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-heading)',
      fontWeight: 800,
      fontSize: 13,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: isCream ? 'var(--red-600)' : 'var(--gold-500)',
      marginBottom: 6
    }
  }, overline), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: display ? 'var(--font-display)' : 'var(--font-heading)',
      fontWeight: display ? 400 : 800,
      fontSize: display ? 38 : 27,
      lineHeight: display ? 1.0 : 1.15,
      textTransform: display ? 'uppercase' : 'none',
      letterSpacing: display ? '0.01em' : '0'
    }
  }, title));
}
Object.assign(__ds_scope, { SectionHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/SectionHeader.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Blue Streak Hangar — Badge
 * Small status / category pill. Soft tinted background + strong label.
 */
function Badge({
  children,
  tone = 'navy',
  // 'navy' | 'red' | 'sky' | 'gold' | 'success' | 'warning' | 'danger'
  solid = false,
  // solid fill vs soft tint
  icon = null,
  ...rest
}) {
  const tones = {
    navy: {
      tint: 'var(--sky-100)',
      ink: 'var(--navy-700)',
      solidBg: 'var(--navy-700)'
    },
    red: {
      tint: 'var(--red-100)',
      ink: 'var(--red-700)',
      solidBg: 'var(--red-600)'
    },
    sky: {
      tint: 'var(--sky-100)',
      ink: 'var(--sky-700)',
      solidBg: 'var(--sky-700)'
    },
    gold: {
      tint: 'var(--gold-100)',
      ink: 'var(--gold-600)',
      solidBg: 'var(--gold-500)'
    },
    success: {
      tint: 'var(--success-100)',
      ink: 'var(--success-600)',
      solidBg: 'var(--success-600)'
    },
    warning: {
      tint: 'var(--warning-100)',
      ink: 'var(--warning-600)',
      solidBg: 'var(--warning-600)'
    },
    danger: {
      tint: 'var(--danger-100)',
      ink: 'var(--danger-600)',
      solidBg: 'var(--danger-600)'
    }
  };
  const t = tones[tone] || tones.navy;
  const goldSolidInk = tone === 'gold' ? 'var(--navy-900)' : '#fff';
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '5px 12px',
      fontFamily: 'var(--font-heading)',
      fontWeight: 700,
      fontSize: 13,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      borderRadius: 'var(--radius-pill)',
      background: solid ? t.solidBg : t.tint,
      color: solid ? goldSolidInk : t.ink,
      whiteSpace: 'nowrap'
    }
  }, rest), icon && /*#__PURE__*/React.createElement("i", {
    className: icon,
    style: {
      fontSize: 14
    },
    "aria-hidden": "true"
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Blue Streak Hangar — Button
 * Friendly, high-contrast, generous tap target (min 44px).
 */
function Button({
  children,
  variant = 'primary',
  // 'primary' | 'secondary' | 'ghost' | 'gold'
  size = 'md',
  // 'sm' | 'md' | 'lg'
  icon = null,
  // Phosphor class string, e.g. 'ph-fill ph-airplane-tilt'
  iconRight = false,
  fullWidth = false,
  disabled = false,
  onClick,
  ...rest
}) {
  const sizes = {
    sm: {
      padding: '0 16px',
      height: 40,
      fontSize: 14
    },
    md: {
      padding: '0 22px',
      height: 48,
      fontSize: 16
    },
    lg: {
      padding: '0 30px',
      height: 56,
      fontSize: 18
    }
  };
  const variants = {
    primary: {
      background: 'var(--red-600)',
      color: '#fff',
      border: '2px solid var(--red-600)'
    },
    secondary: {
      background: 'var(--navy-700)',
      color: 'var(--cream-100)',
      border: '2px solid var(--navy-700)'
    },
    gold: {
      background: 'var(--gold-500)',
      color: 'var(--navy-900)',
      border: '2px solid var(--gold-500)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--navy-700)',
      border: '2px solid var(--navy-700)'
    }
  };
  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.primary;
  const icEl = icon ? /*#__PURE__*/React.createElement("i", {
    className: icon,
    style: {
      fontSize: s.fontSize * 1.25,
      lineHeight: 0
    },
    "aria-hidden": "true"
  }) : null;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: disabled ? undefined : onClick,
    disabled: disabled,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      height: s.height,
      minWidth: 44,
      padding: s.padding,
      width: fullWidth ? '100%' : 'auto',
      fontFamily: 'var(--font-heading)',
      fontWeight: 700,
      fontSize: s.fontSize,
      letterSpacing: '0.02em',
      borderRadius: 'var(--radius-pill)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      boxShadow: variant === 'ghost' ? 'none' : 'var(--shadow-sm)',
      transition: 'transform var(--dur-fast) var(--ease-standard), filter var(--dur-fast) var(--ease-standard)',
      ...v
    },
    onMouseDown: e => {
      if (!disabled) e.currentTarget.style.transform = 'scale(0.97)';
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = 'scale(1)';
    },
    onMouseEnter: e => {
      if (!disabled) e.currentTarget.style.filter = 'brightness(1.06)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.filter = 'none';
      e.currentTarget.style.transform = 'scale(1)';
    }
  }, rest), !iconRight && icEl, /*#__PURE__*/React.createElement("span", null, children), iconRight && icEl);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Blue Streak Hangar — Card
 * The printed-card surface: warm white, soft border, grounded shadow.
 */
function Card({
  children,
  tone = 'paper',
  // 'paper' | 'tint' | 'navy' | 'highlight'
  pad = 'md',
  // 'sm' | 'md' | 'lg'
  accentTop = false,
  // red ribbon along the top edge
  style = {},
  ...rest
}) {
  const tones = {
    paper: {
      background: 'var(--white)',
      color: 'var(--ink-900)',
      border: '1.5px solid var(--cream-300)'
    },
    tint: {
      background: 'var(--sky-100)',
      color: 'var(--ink-900)',
      border: '1.5px solid var(--sky-300)'
    },
    navy: {
      background: 'var(--navy-800)',
      color: 'var(--cream-100)',
      border: '1.5px solid var(--navy-700)'
    },
    highlight: {
      background: 'var(--gold-100)',
      color: 'var(--ink-900)',
      border: '1.5px solid var(--gold-200)'
    }
  };
  const pads = {
    sm: 16,
    md: 24,
    lg: 32
  };
  const t = tones[tone] || tones.paper;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      borderRadius: 'var(--radius-md)',
      padding: pads[pad] || pads.md,
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
      ...t,
      ...style
    }
  }, rest), accentTop && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 6,
      background: 'var(--red-600)'
    }
  }), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/IconBadge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Blue Streak Hangar — IconBadge
 * The signature circular icon badge from our posters & guides.
 */
function IconBadge({
  icon,
  // Phosphor class, e.g. 'ph-fill ph-bed'
  tone = 'navy',
  // 'navy' | 'red' | 'sky' | 'gold'
  size = 'md',
  // 'sm' | 'md' | 'lg'
  ...rest
}) {
  const tones = {
    navy: 'var(--navy-700)',
    red: 'var(--red-600)',
    sky: 'var(--sky-700)',
    gold: 'var(--gold-600)'
  };
  const sizes = {
    sm: 40,
    md: 56,
    lg: 72
  };
  const d = sizes[size] || sizes.md;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: d,
      height: d,
      borderRadius: '50%',
      background: tones[tone] || tones.navy,
      flex: 'none',
      boxShadow: 'var(--shadow-sm)'
    }
  }, rest), /*#__PURE__*/React.createElement("i", {
    className: icon,
    style: {
      fontSize: d * 0.5,
      color: '#fff',
      lineHeight: 0
    },
    "aria-hidden": "true"
  }));
}
Object.assign(__ds_scope, { IconBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconBadge.jsx", error: String((e && e.message) || e) }); }

// components/content/ListRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Blue Streak Hangar — ListRow
 * Icon-badge + title + description row. The backbone of every guide.
 */
function ListRow({
  icon,
  iconTone = 'navy',
  title,
  children,
  // description
  trailing = null,
  // optional right-side node (e.g. a Badge)
  divider = true,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 16,
      padding: '16px 0',
      borderBottom: divider ? '1.5px solid var(--cream-300)' : 'none'
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.IconBadge, {
    icon: icon,
    tone: iconTone,
    size: "md"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      paddingTop: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-heading)',
      fontWeight: 700,
      fontSize: 18,
      color: 'var(--navy-900)',
      lineHeight: 1.25
    }
  }, title), children && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 16,
      lineHeight: 1.5,
      color: 'var(--ink-700)',
      marginTop: 4
    }
  }, children)), trailing && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 'none',
      paddingTop: 2
    }
  }, trailing));
}
Object.assign(__ds_scope, { ListRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/ListRow.jsx", error: String((e && e.message) || e) }); }

// ds-base.js
try { (() => {
// Root-level DS loader — used by root .dc.html pages
(() => {
  const base = '.';
  for (const p of ['styles.css']) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = base + '/' + p;
    document.head.appendChild(l);
  }
  const s = document.createElement('script');
  s.src = base + '/_ds_bundle.js';
  s.onerror = () => console.error('ds-base.js: failed to load ' + s.src);
  document.head.appendChild(s);
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ds-base.js", error: String((e && e.message) || e) }); }

__ds_ns.Callout = __ds_scope.Callout;

__ds_ns.ListRow = __ds_scope.ListRow;

__ds_ns.QuestionsFooter = __ds_scope.QuestionsFooter;

__ds_ns.SectionHeader = __ds_scope.SectionHeader;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconBadge = __ds_scope.IconBadge;

})();
