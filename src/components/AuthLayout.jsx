import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { IconSun, IconMoon, IconGlobe } from "./Icons";

const MONO = "'JetBrains Mono', monospace";

/**
 * Shared split layout for Login / Register.
 * Left: animated cobalt hero panel (brand + title + renderable hero).
 * Right: the form column (pass the form as the `form` prop).
 */
export default function AuthLayout({ dark, lang, title, subtitle, hero, form, dispatch }) {
  const isRtl = lang === "ar";
  const hFont = headingFont(lang);
  const bFont = bodyFont(lang);
  const tokens = tk(dark);

  const ctlBtn = {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: `1px solid ${tokens.cardBorder}`,
    background: tokens.card,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: tokens.textMuted,
    flexShrink: 0,
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: tokens.bg,
        direction: isRtl ? "rtl" : "ltr",
      }}
    >
      {/* ── Hero panel ─────────────────────────────────────── */}
      <div
        className="hero-drift"
        style={{
          flex: "0 0 58%",
          background: dark
            ? "linear-gradient(160deg, #080C1D 0%, #101530 60%, #1A1639 100%)"
            : "linear-gradient(160deg, #163F8A 0%, #154685 55%, #0C6B8C 100%)",
          padding: "52px 60px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: dark
              ? "radial-gradient(circle at 1px 1px, rgba(75,140,245,0.07) 1px, transparent 0)"
              : "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)",
            backgroundSize: "28px 28px",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 500 }}>
          {/* Brand */}
          <div className="rise-in" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 52, animationDelay: "60ms" }}>
            <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: 8, border: "1px solid rgba(255,255,255,0.18)" }}>
              <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                <path d="M14 3L23 8.5V19.5L14 25L5 19.5V8.5L14 3Z" stroke="white" strokeWidth="2" fill="none" strokeLinejoin="round" />
                <circle cx="14" cy="14" r="3.5" fill="white" fillOpacity="0.9" />
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: hFont, fontWeight: 800, fontSize: 18, color: "white", letterSpacing: "-0.03em" }}>GenAI</div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em" }}>ACADEMIC INTELLIGENCE</div>
            </div>
          </div>

          {/* Title block */}
          <h1
            className="rise-in"
            style={{
              fontFamily: hFont,
              fontWeight: 700,
              fontSize: 30,
              color: "white",
              letterSpacing: "-0.03em",
              lineHeight: 1.25,
              margin: "0 0 10px",
              animationDelay: "160ms",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="rise-in"
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.65,
                margin: "0 0 40px",
                maxWidth: 440,
                fontFamily: bFont,
                animationDelay: "260ms",
              }}
            >
              {subtitle}
            </p>
          )}

          {hero}
        </div>
      </div>

      {/* ── Form column ────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 52px",
          overflowY: "auto",
          position: "relative",
        }}
      >
        {/* Quick controls: theme + language (auth pages are standalone) */}
        <div
          style={{
            position: "absolute",
            top: 16,
            insetInlineEnd: 24,
            display: "flex",
            gap: 6,
          }}
        >
          <button
            aria-label="toggle-theme"
            title={dark ? (lang === "ar" ? "الوضع النهاري" : "Light Mode") : lang === "ar" ? "الوضع الليلي" : "Dark Mode"}
            onClick={() => dispatch?.({ type: "TOGGLE_THEME" })}
            style={ctlBtn}
          >
            {dark ? <IconSun size={15} color={tokens.textMuted} /> : <IconMoon size={15} color={tokens.textMuted} />}
          </button>
          <button
            aria-label="toggle-language"
            title={lang === "en" ? "العربية" : "English"}
            onClick={() => dispatch?.({ type: "SET_LANG", lang: lang === "en" ? "ar" : "en" })}
            style={ctlBtn}
          >
            <IconGlobe size={15} color={tokens.textMuted} />
          </button>
        </div>

        <div className="rise-in" style={{ width: "100%", maxWidth: 380, animationDelay: "200ms" }}>
          {form}
        </div>
      </div>
    </div>
  );
}