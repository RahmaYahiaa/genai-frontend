import { useState } from "react";
import { headingFont, bodyFont } from "@/constants/tokens";
import { IconChevronRight, IconChevronLeft } from "@/components/Icons";

/**
 * Instructor design kit — the same calm language as the student side:
 * one clear page title, plain words, soft cards, one primary action per block.
 * Presentational only; pages keep their own data loading.
 */

export const shadow = "0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.04)";

export function InstructorPage({ tokens, lang, mobile, title, subtitle, actions, back, width = 1080, children }) {
  const isRtl = lang === "ar";
  const Chevron = isRtl ? IconChevronRight : IconChevronLeft;
  return (
    <div style={{ direction: isRtl ? "rtl" : "ltr", fontFamily: bodyFont(lang), padding: mobile ? "20px 16px 40px" : "32px 32px 56px" }}>
      <div style={{ maxWidth: width, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: mobile ? "flex-start" : "flex-end", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            {back && (
              <button type="button" onClick={back.onClick} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", padding: 0, marginBottom: 10, color: tokens.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                <Chevron size={14} /> {back.label}
              </button>
            )}
            <h1 style={{ margin: 0, fontSize: mobile ? 23 : 27, fontWeight: 700, letterSpacing: "-0.02em", color: tokens.textPrimary, fontFamily: headingFont(lang) }}>{title}</h1>
            {subtitle && <p style={{ margin: "6px 0 0", fontSize: 14.5, lineHeight: 1.6, color: tokens.textMuted, maxWidth: 640 }}>{subtitle}</p>}
          </div>
          {actions && <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>{actions}</div>}
        </header>
        {children}
      </div>
    </div>
  );
}

export function Card({ tokens, children, style, padding = 22 }) {
  return <section style={{ background: tokens.card, border: `1px solid ${tokens.cardBorder}`, borderRadius: 16, padding, boxShadow: shadow, ...style }}>{children}</section>;
}

export function SectionTitle({ tokens, children, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, margin: "32px 0 12px" }}>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 650, color: tokens.textPrimary }}>{children}</h2>
      {action}
    </div>
  );
}

/** Big number tile. `tone` colours the number; `onClick` makes it a shortcut. */
export function StatTile({ tokens, label, value, hint, tone, onClick, Icon }) {
  const [hover, setHover] = useState(false);
  const color = tone === "attention" ? "#B45309" : tone === "good" ? "#15803D" : tokens.textPrimary;
  const Tag = onClick ? "button" : "div";
  return (
    <Tag type={onClick ? "button" : undefined} onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ textAlign: "start", background: tokens.card, border: `1px solid ${hover && onClick ? `${tokens.primary}55` : tokens.cardBorder}`, borderRadius: 14, padding: "16px 18px", boxShadow: shadow, cursor: onClick ? "pointer" : "default", fontFamily: "inherit", transition: "border-color .15s", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: tokens.textMuted, fontWeight: 500 }}>
        {Icon && <Icon size={15} color={tokens.textMuted} />}
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, marginTop: 6, letterSpacing: "-0.02em" }}>{value}</div>
      {hint && <div style={{ fontSize: 12.5, color: tokens.textMuted, marginTop: 2 }}>{hint}</div>}
    </Tag>
  );
}

/** Rounded count / state label. */
export function Pill({ tokens, tone = "neutral", children }) {
  const map = {
    neutral: { fg: tokens.textSecondary, bg: tokens.cardBorder + "66" },
    primary: { fg: tokens.primary, bg: tokens.primaryLight },
    attention: { fg: "#B45309", bg: "rgba(217,119,6,0.10)" },
    good: { fg: "#15803D", bg: "rgba(22,163,74,0.10)" },
    danger: { fg: "#B91C1C", bg: "rgba(220,38,38,0.08)" },
  };
  const c = map[tone] ?? map.neutral;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: c.fg, background: c.bg, whiteSpace: "nowrap" }}>{children}</span>;
}

/** Clickable list row with an icon, title, meta line and trailing slot. */
export function Row({ tokens, lang, Icon, iconTone, title, meta, trailing, onClick, first }) {
  const Chevron = lang === "ar" ? IconChevronLeft : IconChevronRight;
  const tones = { attention: ["#B45309", "rgba(217,119,6,0.10)"], good: ["#15803D", "rgba(22,163,74,0.10)"], primary: [tokens.primary, tokens.primaryLight] };
  const [fg, bg] = tones[iconTone] ?? tones.primary;
  const Tag = onClick ? "button" : "div";
  return (
    <Tag type={onClick ? "button" : undefined} className={onClick ? "genai-row" : undefined} onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "start", padding: "14px 18px", background: "none", border: "none", borderTop: first ? "none" : `1px solid ${tokens.cardBorder}`, cursor: onClick ? "pointer" : "default", fontFamily: "inherit" }}>
      {Icon && (
        <span style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={17} color={fg} />
        </span>
      )}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: tokens.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
        {meta && <span style={{ display: "block", fontSize: 12.5, color: tokens.textMuted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta}</span>}
      </span>
      {trailing}
      {onClick && <Chevron size={16} color={tokens.textFaint} />}
    </Tag>
  );
}

export function CodeBadge({ tokens, children }) {
  if (!children) return null;
  return <span style={{ fontSize: 12, fontWeight: 700, color: tokens.primary, background: tokens.primaryLight, borderRadius: 8, padding: "3px 9px", letterSpacing: "0.02em" }}>{children}</span>;
}
