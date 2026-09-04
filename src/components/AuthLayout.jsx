import { tk, headingFont, bodyFont } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import { IconSun, IconMoon, IconGlobe } from "./Icons";

const MONO = "'JetBrains Mono', monospace";

export default function AuthLayout({ dark, lang, title, subtitle, hero, form, dispatch }) {
  const isRtl = lang === "ar";
  const hFont = headingFont(lang);
  const bFont = bodyFont(lang);
  const tokens = tk(dark);
  const mobile = useMediaQuery("(max-width: 860px)");

  const gradient = dark
    ? "linear-gradient(160deg, #080C1D 0%, #101530 60%, #1A1639 100%)"
    : "linear-gradient(160deg, #163F8A 0%, #154685 55%, #0C6B8C 100%)";

  const ctlBtn = {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: `1px solid ${mobile ? "rgba(255,255,255,0.25)" : tokens.cardBorder}`,
    background: mobile ? "rgba(255,255,255,0.12)" : tokens.card,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: mobile ? "white" : tokens.textMuted,
    flexShrink: 0,
  };

  const controls = (
    <>
      <button
        aria-label="toggle-theme"
        title={dark ? (lang === "ar" ? "الوضع النهاري" : "Light Mode") : lang === "ar" ? "الوضع الليلي" : "Dark Mode"}
        onClick={() => dispatch?.({ type: "TOGGLE_THEME" })}
        style={ctlBtn}
      >
        {dark ? <IconSun size={15} color={mobile ? "white" : tokens.textMuted} /> : <IconMoon size={15} color={mobile ? "white" : tokens.textMuted} />}
      </button>
      <button
        aria-label="toggle-language"
        title={lang === "en" ? "العربية" : "English"}
        onClick={() => dispatch?.({ type: "SET_LANG", lang: lang === "en" ? "ar" : "en" })}
        style={ctlBtn}
      >
        <IconGlobe size={15} color={mobile ? "white" : tokens.textMuted} />
      </button>
    </>
  );

  const brand = (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: mobile ? "column" : "row",
        minHeight: "100vh",
        background: mobile ? gradient : tokens.bg,
        direction: isRtl ? "rtl" : "ltr",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 14,
          insetInlineEnd: 14,
          display: "flex",
          gap: 6,
          zIndex: 5,
        }}
      >
        {controls}
      </div>

      {!mobile && (
        <div
          className="hero-drift"
          style={{
            flex: "0 0 58%",
            background: gradient,
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
            <div className="rise-in" style={{ marginBottom: 52, animationDelay: "60ms" }}>
              {brand}
            </div>
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
      )}

      <div
        style={{
          flex: mobile ? "1" : "1",
          display: "flex",
          flexDirection: "column",
          alignItems: mobile ? "stretch" : "center",
          justifyContent: mobile ? "flex-start" : "center",
          padding: mobile ? "60px 18px 44px" : "48px 52px",
          overflowY: mobile ? "visible" : "auto",
          position: "relative",
        }}
      >
        {mobile && (
          <div style={{ width: "100%", maxWidth: 440, margin: "0 auto" }}>
            <div className="rise-in" style={{ animationDelay: "60ms" }}>{brand}</div>
            <h1
              className="rise-in"
              style={{
                fontFamily: hFont,
                fontWeight: 700,
                fontSize: 19,
                color: "white",
                letterSpacing: "-0.02em",
                lineHeight: 1.35,
                margin: "16px 0 0",
                animationDelay: "140ms",
              }}
            >
              {title}
            </h1>
          </div>
        )}

        <div
          className="rise-in"
          style={{
            background: mobile ? tokens.card : "transparent",
            border: mobile ? `1px solid ${tokens.cardBorder}` : "none",
            borderRadius: mobile ? 18 : 0,
            boxShadow: mobile ? "0 22px 60px rgba(5,10,30,0.38)" : "none",
            padding: mobile ? "20px 20px 22px" : 0,
            boxSizing: "border-box",
            width: "100%",
            maxWidth: mobile ? 440 : 400,
            margin: mobile ? "16px auto 0" : "0",
            position: "relative",
            zIndex: 1,
            animationDelay: "200ms",
          }}
        >
          {form}
        </div>
      </div>
    </div>
  );
}