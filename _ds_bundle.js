/* @ds-bundle: {"format":4,"namespace":"BlueStreakHangarDesignSystem_a233fe","components":[{"name":"Callout","sourcePath":"components/content/Callout.jsx"},{"name":"ListRow","sourcePath":"components/content/ListRow.jsx"},{"name":"QuestionsFooter","sourcePath":"components/content/QuestionsFooter.jsx"},{"name":"SectionHeader","sourcePath":"components/content/SectionHeader.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"IconBadge","sourcePath":"components/core/IconBadge.jsx"}],"sourceHashes":{"components/content/Callout.jsx":"9f865637158f","components/content/ListRow.jsx":"feec24bef35f","components/content/QuestionsFooter.jsx":"e14911e0ef91","components/content/SectionHeader.jsx":"079e07dc67bd","components/core/Badge.jsx":"6e33a7693a83","components/core/Button.jsx":"fa8fb4a226f0","components/core/Card.jsx":"cfe67b118b28","components/core/IconBadge.jsx":"e4cede0d55ec","ds-base.js":"efcf50a05f15"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.BlueStreakHangarDesignSystem_a233fe = window.BlueStreakHangarDesignSystem_a233fe || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

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

// ds-base.js — self-loader intentionally stripped for the standalone deploy.
// (The compiled bundle embeds a loader that re-injects _ds_bundle.js, which
//  recurses infinitely when the bundle is loaded directly. The page's own
//  ds-base.js already loads the CSS + this bundle exactly once.)

__ds_ns.Callout = __ds_scope.Callout;

__ds_ns.ListRow = __ds_scope.ListRow;

__ds_ns.QuestionsFooter = __ds_scope.QuestionsFooter;

__ds_ns.SectionHeader = __ds_scope.SectionHeader;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconBadge = __ds_scope.IconBadge;

})();
