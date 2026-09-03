import { useApp } from "@/store/useApp";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { SCREEN_TITLES, SCREEN_PARTS } from "@/data/screens";

const MONO = "'JetBrains Mono', monospace";

export default function ComingSoonPage({ screen }) {
  const { state } = useApp();
  const tokens = tk(state.dark);
  const lang = state.lang;
  const hFont = headingFont(lang);
  const bFont = bodyFont(lang);

  const title = SCREEN_TITLES[screen] ?? { en: screen, ar: screen };
  const part = SCREEN_PARTS[screen] ?? "Coming soon";

  return (
    <div
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 48,
        fontFamily: bFont,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 10,
          letterSpacing: "0.14em",
          color: tokens.primary,
          background: tokens.primaryLight,
          border: `1px solid ${tokens.citationBorder}`,
          borderRadius: 6,
          padding: "5px 10px",
          marginBottom: 18,
        }}
      >
        {part}
      </div>
      <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: 24, color: tokens.textPrimary, letterSpacing: "-0.02em", margin: "0 0 8px" }}>
        {lang === "ar" ? title.ar : title.en}
      </h1>
      <p style={{ fontSize: 13, color: tokens.textMuted, margin: "0 0 22px", textAlign: "center", maxWidth: 380, lineHeight: 1.6 }}>
        {lang === "ar"
          ? "هذه الشاشة جزء من الخطوة التالية — الهيكل والنظام جاهزان، والمحتوى قادم في الجزء المحدد."
          : "This screen ships in the next part — the shell, routing and design system are already in place."}
      </p>
      <div
        style={{
          padding: "16px 22px",
          background: tokens.card,
          border: `1px solid ${tokens.cardBorder}`,
          borderRadius: 12,
          maxWidth: 420,
          width: "100%",
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 9, color: tokens.textFaint, letterSpacing: "0.1em", marginBottom: 10, textAlign: lang === "ar" ? "right" : "left" }}>
          {lang === "ar" ? "جاهز بالفعل" : "ALREADY IN PLACE"}
        </div>
        {[
          lang === "ar" ? "التوجيه والتنقل عبر الـ Sidebar" : "Routing & sidebar navigation",
          lang === "ar" ? "الوضع الليلي/النهاري واللغة (عربي/EN)" : "Dark/light mode & language (EN/AR)",
          lang === "ar" ? "نظام التصميم بالتوكنز" : "Design tokens system",
          lang === "ar" ? "هيكل الشاشات والـ store" : "Screen/component architecture & store",
        ].map((item) => (
          <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: tokens.mastered }} />
            <span style={{ fontSize: 12, color: tokens.textSecondary }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}