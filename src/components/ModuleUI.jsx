/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from "react";
import { MONO } from "@/constants/tokens";
import {
  IconWarning,
  IconCheck,
  IconSparkle,
  IconEye,
  IconEyeOff,
  IconChevronLeft,
  IconX,
} from "@/components/Icons";
const bFontFor = (lang) =>
  lang === "ar" ? "'Cairo', sans-serif" : "'Inter', sans-serif";
const hFontFor = (lang) =>
  lang === "ar" ? "'Cairo', sans-serif" : "'Plus Jakarta Sans', sans-serif";
function Card({ tokens, children, style, onClick }) {
  return (
    <div
      onClick={onClick}
      className={onClick ? "card-interactive" : void 0}
      style={{
        background: tokens.card,
        border: `1px solid ${tokens.cardBorder}`,
        borderRadius: 12,
        padding: "18px 20px",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
function Btn({
  tokens,
  children,
  onClick,
  variant = "solid",
  disabled,
  style,
  lang = "en",
  title,
}) {
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);
  const variants = {
    solid: {
      background: tokens.primaryBtn,
      color: "#fff",
      border: "none",
      fontFamily: hFont,
      fontWeight: 600,
    },
    soft: {
      background: tokens.primaryLight,
      color: tokens.primary,
      border: `1px solid ${tokens.primary}44`,
      fontFamily: bFont,
      fontWeight: 600,
    },
    ghost: {
      background: tokens.card,
      color: tokens.textSecondary,
      border: `1.5px solid ${tokens.cardBorder}`,
      fontFamily: bFont,
      fontWeight: 500,
    },
    violet: {
      background: tokens.gapBg,
      color: tokens.gap,
      border: `1px solid ${tokens.gapBorder}`,
      fontFamily: bFont,
      fontWeight: 600,
    },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={variant === "solid" ? "genai-cta" : void 0}
      style={{
        padding: "8px 14px",
        borderRadius: 8,
        fontSize: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        letterSpacing: variant === "solid" ? "-0.01em" : 0,
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}
function Chip({ tokens, children, tone = "default", style }) {
  const map = {
    default: {
      bg: tokens.inset,
      c: tokens.textSecondary,
      b: tokens.cardBorder,
    },
    primary: {
      bg: tokens.primaryLight,
      c: tokens.primary,
      b: tokens.citationBorder,
    },
    violet: { bg: tokens.gapBg, c: tokens.gap, b: tokens.gapBorder },
    peri: {
      bg: tokens.developingBg,
      c: tokens.developing,
      b: tokens.developingBorder,
    },
    slate: {
      bg: tokens.noEvidenceBg,
      c: tokens.noEvidence,
      b: tokens.cardBorder,
    },
  }[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 9px",
        borderRadius: 6,
        fontFamily: MONO,
        fontSize: 10,
        fontWeight: 600,
        whiteSpace: "nowrap",
        background: map.bg,
        color: map.c,
        border: `1px solid ${map.b}`,
        letterSpacing: "0.04em",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
const CONF = {
  high: { en: "High confidence", ar: "ثقة عالية", key: "mastered" },
  medium: { en: "Medium confidence", ar: "ثقة متوسطة", key: "developing" },
  low: { en: "Low confidence", ar: "ثقة منخفضة", key: "gap" },
  insufficient_evidence: {
    en: "Insufficient evidence",
    ar: "أدلة غير كافية",
    key: "noEvidence",
  },
};
function ConfidencePill({ confidence, tokens, lang, short }) {
  const c = CONF[confidence];
  const color = tokens[c.key];
  const bg =
    c.key === "mastered"
      ? tokens.masteredBg
      : c.key === "developing"
        ? tokens.developingBg
        : c.key === "gap"
          ? tokens.gapBg
          : tokens.noEvidenceBg;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 8px",
        background: bg,
        border: `1px solid ${color}44`,
        borderRadius: 5,
      }}
    >
      {confidence === "insufficient_evidence" ? (
        <IconWarning size={11} color={color} />
      ) : (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: color,
          }}
        />
      )}
      <span
        style={{
          fontFamily: MONO,
          fontSize: 9,
          color,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {short
          ? confidence === "insufficient_evidence"
            ? lang === "ar"
              ? "أدلة غير كافية"
              : "Insufficient"
            : confidence.toUpperCase()
          : lang === "ar"
            ? c.ar
            : c.en}
      </span>
    </span>
  );
}
function ScoreValue({ kind, score, max, tokens, lang }) {
  if (kind === "ai") {
    return (
      <span
        title={
          lang === "ar"
            ? "درجة مقترحة من الذكاء الاصطناعي — غير نهائية"
            : "AI-suggested score — provisional, not final"
        }
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "3px 9px",
          borderRadius: 6,
          border: `1px dashed ${tokens.developing}88`,
          background: "transparent",
          fontFamily: MONO,
          fontSize: 12,
          fontWeight: 700,
          color: tokens.developing,
        }}
      >
        <IconSparkle size={11} color={tokens.developing} />
        {score === null
          ? lang === "ar"
            ? "لا درجة"
            : "no score"
          : `${score}/${max}`}
        <span
          style={{
            fontSize: 8.5,
            fontWeight: 600,
            letterSpacing: "0.06em",
            opacity: 0.85,
          }}
        >
          {lang === "ar" ? "مقترحة" : "AI SUGGESTED"}
        </span>
      </span>
    );
  }
  return (
    <span
      title={
        lang === "ar"
          ? "درجة نهائية معتمدة من المدرّس"
          : "Final score — ratified by the instructor"
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 9px",
        borderRadius: 6,
        border: `1px solid ${tokens.mastered}55`,
        background: tokens.masteredBg,
        fontFamily: MONO,
        fontSize: 12,
        fontWeight: 700,
        color: tokens.mastered,
      }}
    >
      <IconCheck size={11} color={tokens.mastered} />
      {score === null ? "—" : `${score}/${max}`}
      <span
        style={{
          fontSize: 8.5,
          fontWeight: 600,
          letterSpacing: "0.06em",
          opacity: 0.85,
        }}
      >
        {lang === "ar" ? "نهائية" : "FINAL"}
      </span>
    </span>
  );
}
function Toggle({ on, onChange, tokens, disabled }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      role="switch"
      aria-checked={on}
      style={{
        width: 38,
        height: 21,
        borderRadius: 20,
        border: `1px solid ${on ? tokens.primary : tokens.cardBorder}`,
        background: on ? tokens.primary : tokens.inset,
        position: "relative",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 160ms ease, border-color 160ms ease",
        flexShrink: 0,
        padding: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: on ? 18 : 2,
          width: 15,
          height: 15,
          borderRadius: "50%",
          background: on ? "#fff" : tokens.textFaint,
          transition: "left 160ms ease, background 160ms ease",
        }}
      />
    </button>
  );
}
function VisibilityControl({ on, onChange, tokens, lang, compact }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {on ? (
        <IconEye size={14} color={tokens.primary} />
      ) : (
        <IconEyeOff size={14} color={tokens.textFaint} />
      )}
      {!compact && (
        <span
          style={{
            fontFamily: bFontFor(lang),
            fontSize: 11.5,
            color: tokens.textSecondary,
            fontWeight: 500,
          }}
        >
          {lang === "ar" ? "إظهار الدرجة للطالب" : "Show score to student"}
        </span>
      )}
      <Toggle on={on} onChange={onChange} tokens={tokens} />
    </div>
  );
}
function StatusPill({ status, tokens, lang }) {
  const tone =
    status === "open" ? "primary" : status === "draft" ? "peri" : "slate";
  const label =
    status === "open"
      ? lang === "ar"
        ? "مفتوح"
        : "OPEN"
      : status === "draft"
        ? lang === "ar"
          ? "مسودة"
          : "DRAFT"
        : lang === "ar"
          ? "مغلق"
          : "CLOSED";
  return (
    <Chip tokens={tokens} tone={tone}>
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background:
            status === "open"
              ? tokens.primary
              : status === "draft"
                ? tokens.developing
                : tokens.noEvidence,
        }}
      />
      {label}
    </Chip>
  );
}
function Tabs({ tabs, active, onSelect, tokens, lang }) {
  const bFont = bFontFor(lang);
  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        borderBottom: `1px solid ${tokens.cardBorder}`,
        marginBottom: 22,
        overflowX: "auto",
      }}
    >
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            style={{
              padding: "10px 16px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontFamily: bFont,
              fontSize: 13,
              fontWeight: on ? 600 : 500,
              color: on ? tokens.primary : tokens.textMuted,
              borderBottom: `2px solid ${on ? tokens.primary : "transparent"}`,
              marginBottom: -1,
              display: "flex",
              alignItems: "center",
              gap: 7,
              whiteSpace: "nowrap",
            }}
          >
            {t.label}
            {t.badge !== void 0 && t.badge > 0 && (
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 9.5,
                  fontWeight: 700,
                  background: on ? tokens.primaryLight : tokens.inset,
                  color: on ? tokens.primary : tokens.textFaint,
                  border: `1px solid ${on ? `${tokens.primary}44` : tokens.cardBorder}`,
                  borderRadius: 10,
                  padding: "1px 7px",
                }}
              >
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  tokens,
  lang,
  width = 460,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  const hFont = hFontFor(lang);
  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,14,35,0.55)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        className="rise-in genai-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: width,
          maxHeight: "88vh",
          overflowY: "auto",
          background: tokens.card,
          border: `1px solid ${tokens.cardBorder}`,
          borderRadius: 14,
          padding: "22px 24px",
          boxShadow: "0 24px 60px rgba(10,14,35,0.35)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: subtitle ? 4 : 14,
            flexDirection: lang === "ar" ? "row-reverse" : "row",
          }}
        >
          <div
            style={{
              fontFamily: hFont,
              fontWeight: 700,
              fontSize: 16,
              color: tokens.textPrimary,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </div>
          <button
            onClick={onClose}
            aria-label={lang === "ar" ? "إغلاق" : "Close"}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              borderRadius: 6,
              color: tokens.textFaint,
              flexShrink: 0,
            }}
          >
            <IconX size={15} color={tokens.textFaint} />
          </button>
        </div>
        {subtitle && (
          <div
            style={{
              fontFamily: bFontFor(lang),
              fontSize: 12.5,
              color: tokens.textMuted,
              lineHeight: 1.6,
              marginBottom: 16,
            }}
          >
            {subtitle}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  tokens,
  lang,
  width = 560,
}) {
  if (!open) return null;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 250 }}>
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(10,14,35,0.45)",
        }}
      />
      <div
        className="genai-drawer"
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          [isRtl ? "left" : "right"]: 0,
          width: `min(${width}px, 94vw)`,
          background: tokens.bg,
          borderInlineStart: `1px solid ${tokens.cardBorder}`,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-18px 0 50px rgba(10,14,35,0.25)",
          ["--drawer-from"]: isRtl ? "-28px" : "28px",
        }}
      >
        <div
          style={{
            padding: "16px 22px",
            borderBottom: `1px solid ${tokens.cardBorder}`,
            background: tokens.card,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: hFont,
                fontWeight: 700,
                fontSize: 15,
                color: tokens.textPrimary,
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div
                style={{
                  fontFamily: bFontFor(lang),
                  fontSize: 11.5,
                  color: tokens.textMuted,
                  marginTop: 3,
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="close"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: `1px solid ${tokens.cardBorder}`,
              background: "transparent",
              cursor: "pointer",
              color: tokens.textMuted,
              fontFamily: MONO,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
function Field({ label, tokens, lang, children, hint, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 600,
          color: tokens.textMuted,
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          fontFamily: bFontFor(lang),
        }}
      >
        {label}
        {required && <span style={{ color: tokens.gap }}> *</span>}
      </label>
      {children}
      {hint && (
        <div
          style={{
            fontSize: 11,
            color: tokens.textFaint,
            marginTop: 5,
            fontFamily: bFontFor(lang),
            lineHeight: 1.5,
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}
const inputStyle = (tokens, bFont) => ({
  width: "100%",
  padding: "10px 13px",
  borderRadius: 9,
  border: `1.5px solid ${tokens.cardBorder}`,
  background: tokens.inset,
  color: tokens.textPrimary,
  fontFamily: bFont,
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
});
const textareaStyle = (tokens, bFont) => ({
  ...inputStyle(tokens, bFont),
  minHeight: 74,
  resize: "vertical",
  lineHeight: 1.6,
});
function AlertStrip({
  icon,
  title,
  body,
  action,
  tokens,
  lang,
  tone = "violet",
}) {
  const map = {
    violet: { c: tokens.gap, bg: tokens.gapBg, b: tokens.gapBorder },
    peri: {
      c: tokens.developing,
      bg: tokens.developingBg,
      b: tokens.developingBorder,
    },
    slate: {
      c: tokens.noEvidence,
      bg: tokens.noEvidenceBg,
      b: tokens.cardBorder,
    },
  }[tone];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 12px",
        background: map.bg,
        border: `1px solid ${map.b}`,
        borderRadius: 8,
        flexDirection: lang === "ar" ? "row-reverse" : "row",
      }}
    >
      <span style={{ marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: bFontFor(lang),
            fontSize: 12,
            fontWeight: 600,
            color: map.c,
          }}
        >
          {title}
        </div>
        {body && (
          <div
            style={{
              fontFamily: bFontFor(lang),
              fontSize: 11.5,
              color: tokens.textSecondary,
              marginTop: 2,
              lineHeight: 1.5,
            }}
          >
            {body}
          </div>
        )}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}
function Th({ children, tokens, align = "left" }) {
  return (
    <th
      style={{
        textAlign: align,
        padding: "7px 10px",
        fontSize: 10,
        fontFamily: MONO,
        fontWeight: 600,
        color: tokens.textFaint,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        borderBottom: `1px solid ${tokens.cardBorder}`,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}
function PillTabs({ tabs, active, onSelect, tokens, lang }) {
  const bFont = bFontFor(lang);
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        flexDirection: lang === "ar" ? "row-reverse" : "row",
      }}
    >
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              cursor: "pointer",
              background: on ? tokens.card : tokens.inset,
              border: `1px solid ${on ? tokens.primary : "transparent"}`,
              color: on ? tokens.primary : tokens.textMuted,
              fontFamily: bFont,
              fontWeight: on ? 600 : 500,
              fontSize: 13,
              transition: "background .15s, color .15s, border-color .15s",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
function BackCircle({ onClick, tokens, rtl }) {
  return (
    <button
      onClick={onClick}
      aria-label="back"
      style={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        flexShrink: 0,
        cursor: "pointer",
        background: tokens.inset,
        border: "none",
        color: tokens.textSecondary,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 2,
        transform: rtl ? "rotate(180deg)" : void 0,
      }}
    >
      <IconChevronLeft size={14} color={tokens.textSecondary} />
    </button>
  );
}
function toast(message) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("genai-toast", { detail: message }));
}
function Toaster({ tokens, lang }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    let seq = 0;
    const on = (e) => {
      const id = ++seq;
      setItems((xs) => [...xs, { id, msg: e.detail }]);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3600);
    };
    window.addEventListener("genai-toast", on);
    return () => window.removeEventListener("genai-toast", on);
  }, []);
  if (items.length === 0) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        insetInlineEnd: 20,
        zIndex: 80,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 360,
      }}
    >
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          style={{
            background: tokens.card,
            border: `1px solid ${tokens.primary}55`,
            borderInlineStart: `3px solid ${tokens.primary}`,
            borderRadius: 10,
            padding: "10px 14px",
            boxShadow: tokens.primaryShadow,
            fontFamily: bFontFor(lang),
            fontSize: 12.5,
            color: tokens.textPrimary,
            lineHeight: 1.5,
            animation: "genai-fade-in .18s ease-out",
          }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
function ConfirmBtn({
  label,
  confirmLabel,
  onConfirm,
  tokens,
  lang,
  variant = "ghost",
  disabled,
  style,
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4e3);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <Btn
      tokens={tokens}
      lang={lang}
      variant={armed ? "violet" : variant}
      disabled={disabled}
      style={style}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
    >
      {armed ? confirmLabel : label}
    </Btn>
  );
}
function CorrectnessBadge({ score, max, tokens, lang }) {
  const ratio = score === null ? 0 : score / Math.max(1, max);
  const level =
    score === null
      ? "none"
      : ratio >= 0.8
        ? "correct"
        : ratio >= 0.5
          ? "partial"
          : "incorrect";
  const map = {
    correct: {
      fg: tokens.mastered,
      bg: tokens.masteredBg,
      en: "Correct",
      ar: "صحيح",
    },
    partial: {
      fg: tokens.developing,
      bg: tokens.developingBg,
      en: "Partial",
      ar: "جزئي",
    },
    incorrect: {
      fg: tokens.gap,
      bg: tokens.gapBg,
      en: "Incorrect",
      ar: "غير صحيح",
    },
    none: {
      fg: tokens.noEvidence,
      bg: tokens.noEvidenceBg,
      en: "Unscored",
      ar: "بدون درجة",
    },
  };
  const m = map[level];
  return (
    <span
      style={{
        fontFamily: MONO,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.06em",
        color: m.fg,
        background: m.bg,
        border: `1px solid ${m.fg}44`,
        borderRadius: 5,
        padding: "2px 8px",
        textTransform: "uppercase",
      }}
    >
      {lang === "ar" ? m.ar : m.en}
    </span>
  );
}
function AIGradingResultCard({ eval: ev, max, tokens, lang, title }) {
  const bFont = bFontFor(lang);
  const isRtl = lang === "ar";
  return (
    <div
      style={{
        background: tokens.inset,
        border: `1px solid ${tokens.cardBorder}`,
        borderRadius: 10,
        padding: "12px 14px",
        textAlign: isRtl ? "right" : "left",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 9,
          flexDirection: isRtl ? "row-reverse" : "row",
        }}
      >
        {title && (
          <span
            style={{
              fontFamily: MONO,
              fontSize: 9.5,
              letterSpacing: "0.09em",
              color: tokens.textMuted,
            }}
          >
            {title}
          </span>
        )}
        <ScoreValue
          kind="ai"
          score={ev.aiScore}
          max={max}
          tokens={tokens}
          lang={lang}
        />
        <CorrectnessBadge
          score={ev.aiScore}
          max={max}
          tokens={tokens}
          lang={lang}
        />
        <ConfidencePill
          confidence={ev.confidence}
          tokens={tokens}
          lang={lang}
        />
      </div>
      <p
        style={{
          fontFamily: bFont,
          fontSize: 12.5,
          color: tokens.textSecondary,
          lineHeight: 1.65,
          margin: "0 0 10px",
        }}
      >
        {ev.feedback}
      </p>
      {ev.criteria && ev.criteria.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 7,
            marginBottom: 10,
          }}
        >
          {ev.criteria.map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexDirection: isRtl ? "row-reverse" : "row",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: bFont,
                    fontSize: 11,
                    color: tokens.textSecondary,
                    marginBottom: 4,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.label}
                </div>
                <div
                  style={{
                    height: 4,
                    background: tokens.card,
                    borderRadius: 3,
                    overflow: "hidden",
                    border: `1px solid ${tokens.cardBorder}`,
                  }}
                >
                  <div
                    style={{
                      width: `${Math.round((c.earned / Math.max(1, c.max)) * 100)}%`,
                      height: "100%",
                      background:
                        c.earned === c.max
                          ? tokens.mastered
                          : c.earned > 0
                            ? tokens.developing
                            : tokens.noEvidence,
                    }}
                  />
                </div>
              </div>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: tokens.textSecondary,
                  flexShrink: 0,
                }}
              >
                {c.earned}/{c.max}
              </span>
            </div>
          ))}
        </div>
      )}
      {ev.misconceptions.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 8,
            flexDirection: isRtl ? "row-reverse" : "row",
          }}
        >
          {ev.misconceptions.map((id) => (
            <Chip key={id} tokens={tokens} tone="violet">
              {id.replace("mc-", "").replace(/-/g, " ")}
            </Chip>
          ))}
        </div>
      )}
      {ev.sources.length > 0 && (
        <div
          style={{ fontFamily: MONO, fontSize: 10, color: tokens.textFaint }}
        >
          {isRtl ? "المصادر: " : "sources: "}
          {ev.sources.join(" · ")}
        </div>
      )}
    </div>
  );
}
function Skeleton({ h = 14, w = "100%", tokens, style }) {
  return (
    <div
      style={{
        height: h,
        width: w,
        borderRadius: 6,
        background: tokens.inset,
        border: `1px solid ${tokens.cardBorder}`,
        animation: "genai-pulse 1.1s ease-in-out infinite",
        ...style,
      }}
    />
  );
}
export {
  AIGradingResultCard,
  AlertStrip,
  BackCircle,
  Btn,
  Card,
  Chip,
  ConfidencePill,
  ConfirmBtn,
  CorrectnessBadge,
  Drawer,
  Field,
  Modal,
  PillTabs,
  ScoreValue,
  Skeleton,
  StatusPill,
  Tabs,
  Th,
  Toaster,
  Toggle,
  VisibilityControl,
  bFontFor,
  hFontFor,
  inputStyle,
  textareaStyle,
  toast,
};
