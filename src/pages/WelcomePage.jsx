import { useEffect } from "react";
import { useApp } from "@/store/useApp";
import { headingFont, bodyFont } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import BrandMark from "@/components/BrandMark";

const SPLASH_MS = 1400;

const MONO = "'JetBrains Mono', monospace";

/**
 * Pure splash intro — shows the brand briefly, then opens
 * the Sign In screen (Register is reachable from there).
 * Skippable at any moment.
 */
export default function WelcomePage() {
  const { state, dispatch } = useApp();
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = headingFont(lang);
  const bFont = bodyFont(lang);

  const goToLogin = () => dispatch({ type: "NAVIGATE", screen: SCREENS.LOGIN });

  useEffect(() => {
    const t = setTimeout(goToLogin, SPLASH_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="splash-screen"
      style={{
        position: "fixed",
        inset: 0,
        background: state.dark
          ? "linear-gradient(160deg, #080C1D 0%, #101530 60%, #1A1639 100%)"
          : "linear-gradient(160deg, #163F8A 0%, #154685 55%, #0C6B8C 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div className="splash-logo" style={{ marginBottom: 18 }}>
        <BrandMark size={64} />
      </div>
      <div className="splash-word" style={{ fontFamily: hFont, fontWeight: 800, fontSize: 26, color: "#fff", letterSpacing: "-0.03em" }}>
        GenAI
      </div>
      <div className="splash-sub" style={{ fontFamily: bFont, fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.18em", marginTop: 6 }}>
        {lang === "ar" ? "الذكاء الأكاديمي" : "ACADEMIC INTELLIGENCE"}
      </div>

      <div style={{ width: 168, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.18)", marginTop: 36, overflow: "hidden" }}>
        <div className="splash-bar" style={{ height: "100%", width: "0%", background: "#8FB4FF", borderRadius: 2 }} />
      </div>

      <button
        aria-label="skip-intro"
        onClick={goToLogin}
        style={{
          position: "absolute",
          bottom: 30,
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: "0.08em",
          color: "rgba(255,255,255,0.55)",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        {isRtl ? "تخطّي ←" : "Skip intro →"}
      </button>
    </div>
  );
}