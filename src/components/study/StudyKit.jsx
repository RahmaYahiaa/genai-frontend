import { useEffect, useState } from "react";
import { headingFont, bodyFont } from "@/constants/tokens";

/**
 * Student design kit — one calm, consistent visual language for every
 * student study screen (level check, practice, progress check, tutor, progress).
 * Purely presentational: pages keep all of their data loading and API calls.
 *
 * Principles: one column, one primary action per screen, plain language,
 * no decorative chips, clear feedback after every action.
 */

export const STATUS = {
  success: { fg: "#15803D", bg: "rgba(22, 163, 74, 0.08)", border: "rgba(22, 163, 74, 0.25)" },
  warning: { fg: "#B45309", bg: "rgba(217, 119, 6, 0.08)", border: "rgba(217, 119, 6, 0.25)" },
  danger: { fg: "#B91C1C", bg: "rgba(220, 38, 38, 0.07)", border: "rgba(220, 38, 38, 0.22)" },
};

const shadow = "0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.04)";

/** Page frame: course switcher, title, subtitle, content column. */
export function StudyPage({ tokens, lang, mobile, title, subtitle, course, actions, width = 760, children }) {
  const isRtl = lang === "ar";
  return (
    <div style={{ direction: isRtl ? "rtl" : "ltr", fontFamily: bodyFont(lang), padding: mobile ? "20px 16px 40px" : "32px 32px 56px" }}>
      <div style={{ maxWidth: width, margin: "0 auto" }}>
        <header style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
            {course ? <CoursePicker tokens={tokens} lang={lang} {...course} /> : <span />}
            {actions && <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{actions}</div>}
          </div>
          <h1 style={{ margin: 0, fontSize: mobile ? 24 : 28, fontWeight: 700, letterSpacing: "-0.02em", color: tokens.textPrimary, fontFamily: headingFont(lang) }}>{title}</h1>
          {subtitle && <p style={{ margin: "6px 0 0", fontSize: 14.5, lineHeight: 1.6, color: tokens.textMuted, maxWidth: 620 }}>{subtitle}</p>}
        </header>
        {children}
      </div>
    </div>
  );
}

/** Compact course switcher shown above the page title. */
export function CoursePicker({ tokens, lang, courses = [], value, onChange }) {
  if (!courses.length) return <span />;
  const current = courses.find((c) => c.id === value);
  const label = (c) => c?.title?.[lang] ?? c?.title?.en ?? c?.title ?? "";
  return (
    <label style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: `1px solid ${tokens.cardBorder}`, background: tokens.card, cursor: "pointer", maxWidth: "100%" }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: tokens.primary, flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {label(current) || (lang === "ar" ? "اختار مقرر" : "Choose a course")}
      </span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={tokens.textMuted} strokeWidth="2.2" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
      <select
        aria-label={lang === "ar" ? "المقرر" : "Course"}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }}
      >
        {courses.map((c) => <option key={c.id} value={c.id}>{label(c)}</option>)}
      </select>
    </label>
  );
}

export function Panel({ tokens, children, style, padding = 28 }) {
  return (
    <section style={{ background: tokens.card, border: `1px solid ${tokens.cardBorder}`, borderRadius: 16, padding, boxShadow: shadow, ...style }}>
      {children}
    </section>
  );
}

export function IconTile({ tokens, Icon, size = 48 }) {
  return (
    <span style={{ width: size, height: size, borderRadius: 14, background: tokens.primaryLight, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon size={Math.round(size * 0.46)} color={tokens.primary} />
    </span>
  );
}

const baseBtn = { height: 44, padding: "0 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: "inherit", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background .15s, border-color .15s", whiteSpace: "nowrap" };

export function PrimaryButton({ tokens, children, onClick, disabled, busy, full, type = "button", style }) {
  const off = disabled || busy;
  return (
    <button type={type} onClick={onClick} disabled={off} style={{ ...baseBtn, border: "none", background: tokens.primaryBtn, color: "#fff", cursor: off ? "not-allowed" : "pointer", opacity: off ? 0.55 : 1, width: full ? "100%" : undefined, ...style }}>
      {busy && <Spinner color="#fff" />}
      {children}
    </button>
  );
}

export function SecondaryButton({ tokens, children, onClick, disabled, full, style }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{ ...baseBtn, border: `1px solid ${tokens.cardBorder}`, background: tokens.card, color: tokens.textPrimary, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1, width: full ? "100%" : undefined, ...style }}>
      {children}
    </button>
  );
}

export function TextButton({ tokens, children, onClick, disabled, muted, style }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{ background: "none", border: "none", padding: "6px 2px", fontSize: 13.5, fontWeight: 600, fontFamily: "inherit", color: muted ? tokens.textMuted : tokens.primary, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, ...style }}>
      {children}
    </button>
  );
}

export function Spinner({ color = "currentColor", size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ animation: "genai-spin 0.8s linear infinite" }}>
      <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Field({ tokens, label, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: tokens.textPrimary }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: 12.5, color: tokens.textMuted }}>{hint}</span>}
    </div>
  );
}

export function Select({ tokens, value, onChange, options, placeholder, ariaLabel }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", height: 46, padding: "0 40px 0 14px", paddingInlineStart: 14, paddingInlineEnd: 40, borderRadius: 10, border: `1px solid ${tokens.cardBorder}`, background: tokens.card, color: value ? tokens.textPrimary : tokens.textMuted, fontSize: 14, fontFamily: "inherit", appearance: "none", cursor: "pointer", outline: "none" }}
      >
        {placeholder != null && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tokens.textMuted} strokeWidth="2.2" aria-hidden="true" style={{ position: "absolute", insetInlineEnd: 14, top: 16, pointerEvents: "none" }}><path d="M6 9l6 6 6-6" /></svg>
    </div>
  );
}

export function Segmented({ tokens, value, onChange, options, ariaLabel }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} style={{ display: "inline-flex", padding: 4, gap: 4, borderRadius: 12, background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, flexWrap: "wrap" }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)}
            style={{ minWidth: 44, height: 36, padding: "0 14px", borderRadius: 9, border: "none", background: on ? tokens.card : "transparent", boxShadow: on ? shadow : "none", color: on ? tokens.textPrimary : tokens.textMuted, fontWeight: on ? 650 : 500, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit" }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Number picker: type a value or use the - / + buttons. Clamped to [min, max].
export function NumberStepper({ tokens, value, onChange, min = 1, max = 10, ariaLabel, hint }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const clamp = (n) => Math.min(max, Math.max(min, n));
  const commit = (raw) => {
    const n = parseInt(String(raw).replace(/[^0-9]/g, ""), 10);
    const next = Number.isFinite(n) ? clamp(n) : value;
    setDraft(String(next));
    if (next !== value) onChange(next);
  };
  const btn = (disabled) => ({
    width: 40,
    height: 40,
    border: "none",
    background: "transparent",
    color: disabled ? tokens.textFaint : tokens.textPrimary,
    fontSize: 20,
    lineHeight: 1,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
  });
  return (
    <div>
      <div style={{ display: "inline-flex", alignItems: "center", borderRadius: 12, background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, direction: "ltr" }}>
        <button type="button" aria-label="-" disabled={value <= min} onClick={() => onChange(clamp(value - 1))} style={btn(value <= min)}>−</button>
        <input
          type="text"
          inputMode="numeric"
          aria-label={ariaLabel}
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(e.currentTarget.value);
            if (e.key === "ArrowUp") { e.preventDefault(); onChange(clamp(value + 1)); }
            if (e.key === "ArrowDown") { e.preventDefault(); onChange(clamp(value - 1)); }
          }}
          style={{ width: 52, height: 40, border: "none", borderInline: `1px solid ${tokens.cardBorder}`, background: tokens.card, color: tokens.textPrimary, textAlign: "center", fontSize: 15, fontWeight: 650, outline: "none", fontFamily: "inherit" }}
        />
        <button type="button" aria-label="+" disabled={value >= max} onClick={() => onChange(clamp(value + 1))} style={btn(value >= max)}>+</button>
      </div>
      {hint && <div style={{ fontSize: 12, color: tokens.textMuted, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

export function Notice({ tokens, tone = "warning", title, children, action }) {
  const c = tone === "info" ? { fg: tokens.primary, bg: tokens.primaryLight, border: `${tokens.primary}33` } : STATUS[tone];
  return (
    <div role="status" style={{ display: "flex", gap: 12, alignItems: "flex-start", justifyContent: "space-between", padding: "12px 16px", borderRadius: 12, background: c.bg, border: `1px solid ${c.border}`, marginBottom: 16 }}>
      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: tokens.textPrimary }}>
        {title && <div style={{ fontWeight: 650, color: c.fg, marginBottom: children ? 2 : 0 }}>{title}</div>}
        {children}
      </div>
      {action}
    </div>
  );
}

export function LoadingBlock({ tokens, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "48px 0", color: tokens.textMuted, fontSize: 14 }}>
      <Spinner color={tokens.primary} size={18} />
      {label}
    </div>
  );
}

/** Friendly error — never shows server/technical messages to the student. */
export function ErrorBlock({ tokens, lang, onRetry }) {
  const t = (en, ar) => (lang === "ar" ? ar : en);
  return (
    <Panel tokens={tokens} style={{ textAlign: "center" }} padding={32}>
      <div style={{ fontSize: 16, fontWeight: 650, color: tokens.textPrimary, marginBottom: 6 }}>{t("We couldn't load this page", "مقدرناش نحمّل الصفحة دي")}</div>
      <div style={{ fontSize: 14, color: tokens.textMuted, marginBottom: 18 }}>{t("Check your connection and try again.", "اتأكد من الاتصال وجرّب تاني.")}</div>
      {onRetry && <SecondaryButton tokens={tokens} onClick={onRetry}>{t("Try again", "حاول تاني")}</SecondaryButton>}
    </Panel>
  );
}

export function EmptyBlock({ tokens, Icon, title, body, action }) {
  return (
    <Panel tokens={tokens} style={{ textAlign: "center" }} padding={36}>
      {Icon && <div style={{ marginBottom: 14 }}><IconTile tokens={tokens} Icon={Icon} /></div>}
      <div style={{ fontSize: 17, fontWeight: 650, color: tokens.textPrimary, marginBottom: 6 }}>{title}</div>
      {body && <div style={{ fontSize: 14, color: tokens.textMuted, lineHeight: 1.6, maxWidth: 440, margin: "0 auto 18px" }}>{body}</div>}
      {action}
    </Panel>
  );
}

/** Start screen for a study activity: icon, heading, explanation, options, one button. */
export function StartPanel({ tokens, mobile, Icon, title, body, children, primary }) {
  return (
    <Panel tokens={tokens} padding={mobile ? 22 : 32}>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: children ? 24 : 20 }}>
        <IconTile tokens={tokens} Icon={Icon} />
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 650, color: tokens.textPrimary }}>{title}</h2>
          <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.65, color: tokens.textMuted }}>{body}</p>
        </div>
      </div>
      {children && <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 24 }}>{children}</div>}
      {primary}
    </Panel>
  );
}

/** Collapsible "Past attempts" list under the start panel. */
export function PastAttempts({ tokens, lang, rows, title, onOpen, renderTitle, renderMeta, isDone }) {
  const [open, setOpen] = useState(false);
  const t = (en, ar) => (lang === "ar" ? ar : en);
  if (!rows?.length) return null;
  return (
    <div style={{ marginTop: 20 }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", padding: "4px 0", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600, color: tokens.textPrimary }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tokens.textMuted} strokeWidth="2.2" aria-hidden="true" style={{ transform: open ? "rotate(90deg)" : lang === "ar" ? "rotate(180deg)" : "none", transition: "transform .15s" }}><path d="M9 6l6 6-6 6" /></svg>
        {title ?? t("Past attempts", "المحاولات السابقة")}
        <span style={{ fontSize: 12.5, fontWeight: 500, color: tokens.textMuted }}>({rows.length})</span>
      </button>
      {open && (
        <Panel tokens={tokens} padding={0} style={{ marginTop: 10, overflow: "hidden" }}>
          {rows.map((row, i) => {
            const done = isDone(row);
            return (
              <button key={row.id} type="button" className="genai-row" onClick={() => onOpen(row)}
                style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "inherit", padding: "14px 18px", background: "none", border: "none", borderTop: i ? `1px solid ${tokens.cardBorder}` : "none", cursor: "pointer", fontFamily: "inherit" }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: tokens.textPrimary }}>{renderTitle(row)}</span>
                  <span style={{ display: "block", fontSize: 12.5, color: tokens.textMuted, marginTop: 2 }}>{renderMeta(row)}</span>
                </span>
                <StatusText tokens={tokens} tone={done ? "success" : "warning"}>{done ? t("Completed", "مكتمل") : t("Continue", "كمّل")}</StatusText>
              </button>
            );
          })}
        </Panel>
      )}
    </div>
  );
}

export function StatusText({ tone = "success", children }) {
  const c = STATUS[tone];
  return <span style={{ fontSize: 12.5, fontWeight: 600, color: c.fg, background: c.bg, padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>{children}</span>;
}

/** Shown when an activity is finished: summary numbers + next steps. */
export function ResultPanel({ tokens, mobile, title, body, stats = [], primary, secondary = [] }) {
  return (
    <Panel tokens={tokens} padding={mobile ? 22 : 32} style={{ textAlign: "center" }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%", background: STATUS.success.bg, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={STATUS.success.fg} strokeWidth="2.5" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      </div>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: tokens.textPrimary }}>{title}</h2>
      {body && <p style={{ margin: "8px auto 0", fontSize: 14, color: tokens.textMuted, lineHeight: 1.6, maxWidth: 460 }}>{body}</p>}
      {stats.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", gap: mobile ? 20 : 40, margin: "22px 0 4px", flexWrap: "wrap" }}>
          {stats.map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color ?? tokens.textPrimary }}>{s.value}</div>
              <div style={{ fontSize: 12.5, color: tokens.textMuted }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
        {primary}
        {secondary}
      </div>
    </Panel>
  );
}

/** Correctness helpers shared by question flow + result summaries. */
export const normCorrectness = (value) => String(value ?? "").toLowerCase();
export function summarize(evaluations) {
  const list = Object.values(evaluations ?? {}).filter(Boolean);
  const count = (k) => list.filter((e) => normCorrectness(e.correctness) === k).length;
  return { correct: count("correct"), partial: count("partial"), incorrect: count("incorrect"), unknown: count("unknown"), total: list.length };
}
