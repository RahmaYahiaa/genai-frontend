import { IconBookOpen, IconDiagnostic, IconPractice, IconClipboard, IconRefresh, IconReassessment } from "@/components/Icons";

// Shared look of Sanad (the study agent): brand mark, colours, labels, small UI.

export const SANAD_NAME = { en: "Sanad", ar: "سند" };
export const SANAD_TAGLINE = { en: "Your study coach", ar: "مدرّب المذاكرة بتاعك" };

export const sanadGradient = (dark) =>
  dark ? "linear-gradient(135deg, #2A4E9E 0%, #3D5FC4 55%, #6A86E6 100%)" : "linear-gradient(135deg, #163F8A 0%, #1B4DA8 45%, #3D66D6 100%)";

/** The Sanad mark: a guiding star over a rising path. */
export function SanadMark({ size = 32, radius, dark = false, flat = false }) {
  const r = radius ?? Math.round(size * 0.3);
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: flat ? "transparent" : sanadGradient(dark),
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: flat ? "none" : "0 6px 16px rgba(27,77,168,0.28)",
      }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        <path d="M3.5 19.5C7 19.5 8.5 15.5 12 15.5S17 11.5 20.5 11.5" stroke={flat ? "#1B4DA8" : "#fff"} strokeWidth="2" strokeLinecap="round" />
        <path d="M15 2.5l1.1 3.1 3.1 1.1-3.1 1.1L15 10.9l-1.1-3.1-3.1-1.1 3.1-1.1L15 2.5z" fill={flat ? "#1B4DA8" : "#fff"} />
        <circle cx="3.5" cy="19.5" r="1.6" fill={flat ? "#1B4DA8" : "#fff"} />
      </svg>
    </span>
  );
}

export const TASK_META = {
  check: { en: "Quick check", ar: "اختبار سريع", Icon: IconDiagnostic, tone: "#7059C9" },
  learn: { en: "Lesson", ar: "درس", Icon: IconBookOpen, tone: "#1B4DA8" },
  practice: { en: "Practice", ar: "تدريب", Icon: IconPractice, tone: "#0F8A6B" },
  quiz: { en: "Quiz", ar: "كويز", Icon: IconClipboard, tone: "#B4540A" },
  review: { en: "Review", ar: "مراجعة", Icon: IconRefresh, tone: "#3A6FDB" },
  reassess: { en: "Progress check", ar: "قياس تقدّم", Icon: IconReassessment, tone: "#7A4BC2" },
};

export const LEVEL_META = {
  no_evidence: { en: "Not checked yet", ar: "لسه ما اتقاسش", rank: 0 },
  beginner: { en: "Getting started", ar: "بداية", rank: 1 },
  intermediate: { en: "Developing", ar: "بيتحسّن", rank: 2 },
  advanced: { en: "Strong", ar: "قوي", rank: 3 },
  mastered: { en: "Mastered", ar: "متمكّن", rank: 4 },
};

export const tr = (lang) => (en, ar) => (lang === "ar" ? ar : en);

export function formatDay(iso, lang, opts = { weekday: "short", day: "numeric", month: "short" }) {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", opts);
  } catch {
    return iso;
  }
}

/** Plain button in the Sanad style. kind: primary | soft | ghost | white */
export function SButton({ children, onClick, disabled, kind = "primary", tokens, font, icon, full, type = "button", title }) {
  const styles = {
    primary: { background: tokens.primaryBtn, color: "#fff", border: "1px solid transparent", boxShadow: tokens.primaryShadow },
    soft: { background: tokens.primaryLight, color: tokens.primary, border: `1px solid ${tokens.citationBorder}` },
    ghost: { background: "transparent", color: tokens.textSecondary, border: `1px solid ${tokens.cardBorder}` },
    white: { background: "#fff", color: "#163F8A", border: "1px solid transparent" },
  }[kind];
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles,
        fontFamily: font,
        fontSize: 13.5,
        fontWeight: 650,
        padding: "10px 16px",
        borderRadius: 11,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: full ? "100%" : undefined,
        transition: "transform 120ms ease, opacity 120ms ease",
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {children}
    </button>
  );
}

export function Panel({ children, tokens, style, padding = 22 }) {
  return (
    <section style={{ background: tokens.card, border: `1px solid ${tokens.cardBorder}`, borderRadius: 18, padding, ...style }}>
      {children}
    </section>
  );
}

export function SectionTitle({ children, tokens, font, aside }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
      <h2 style={{ margin: 0, fontFamily: font, fontSize: 16, fontWeight: 700, color: tokens.textPrimary, letterSpacing: "-0.01em" }}>{children}</h2>
      {aside}
    </div>
  );
}

/** Small round progress ring. */
export function Ring({ value, size = 64, stroke = 7, color = "#fff", track = "rgba(255,255,255,0.25)", children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value || 0));
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - v)} strokeLinecap="round" style={{ transition: "stroke-dashoffset 600ms ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
}

export function TaskIcon({ type, size = 36 }) {
  const meta = TASK_META[type] ?? TASK_META.practice;
  const { Icon } = meta;
  return (
    <span style={{ width: size, height: size, borderRadius: 11, background: `${meta.tone}14`, color: meta.tone, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon size={Math.round(size * 0.5)} color={meta.tone} />
    </span>
  );
}

/** Text that may be in another language: let the browser pick its direction. */
export function AutoText({ children, style, as: Tag = "div" }) {
  return (
    <Tag dir="auto" style={{ textAlign: "start", unicodeBidi: "plaintext", ...style }}>
      {children}
    </Tag>
  );
}
