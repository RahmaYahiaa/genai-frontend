import { useEffect, useState } from "react";
import { useApp } from "@/store/useApp";
import {
  tk,
  headingFont,
  bodyFont,
} from "@/constants/tokens";
import { ROLES } from "@/constants/routes";
import BrandMark from "@/components/BrandMark";

const SPLASH_MS = 1200;

const ROLES_META = [
  {
    id: ROLES.STUDENT,
    en: "Student",
    ar: "طالب",
    enDesc: "Track mastery, close learning gaps, learn with the AI tutor",
    arDesc: "تابِع إتقانك، سدّ فجوات التعلم، وتعلّم مع المعلّم الذكي",
  },
  {
    id: ROLES.INSTRUCTOR,
    en: "Instructor",
    ar: "مدرّس",
    enDesc: "Course analytics, gap severity and misconception insights",
    arDesc: "تحليلات المقررات، درجة خطورة الفجوات ورؤى المفاهيم الخاطئة",
  },
];

const MONO = "'JetBrains Mono', monospace";

export default function WelcomePage() {
  const { state, dispatch } = useApp();
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = headingFont(lang);
  const bFont = bodyFont(lang);
  const [phase, setPhase] = useState("splash");

  useEffect(() => {
    const t = setTimeout(() => setPhase("setup"), SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  /* ── Phase 1: quick branded splash (skippable) ───────────── */
  if (phase === "splash") {
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
        <div className="splash-sub" style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.18em", marginTop: 6 }}>
          ACADEMIC INTELLIGENCE
        </div>

        <div style={{ width: 168, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.18)", marginTop: 36, overflow: "hidden" }}>
          <div
            className="splash-bar"
            style={{ height: "100%", width: "0%", background: "#8FB4FF", borderRadius: 2 }}
          />
        </div>

        <button
          onClick={() => setPhase("setup")}
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

  /* ── Phase 2: functional setup — role + language ─────────── */
  if (phase === "setup") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: tokens.bg,
          color: tokens.textPrimary,
          fontFamily: bFont,
          padding: "36px 24px 64px",
        }}
      >
        {/* Top bar */}
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <BrandMark size={24} />
            <span style={{ fontFamily: hFont, fontWeight: 800, fontSize: 15, letterSpacing: "-0.03em" }}>
              GenAI
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => dispatch({ type: "TOGGLE_THEME" })}
              title={lang === "ar" ? "تبديل المظهر" : "Toggle theme"}
              style={{
                padding: "7px 13px",
                borderRadius: 8,
                border: `1px solid ${tokens.cardBorder}`,
                background: tokens.card,
                color: tokens.textMuted,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {state.dark ? (lang === "ar" ? "نهاري ☀" : "Light ☀") : lang === "ar" ? "ليلي ☾" : "Dark ☾"}
            </button>
            <button
              onClick={() => dispatch({ type: "SET_LANG", lang: lang === "en" ? "ar" : "en" })}
              title={lang === "en" ? "العربية" : "English"}
              style={{
                padding: "7px 13px",
                borderRadius: 8,
                border: `1px solid ${tokens.cardBorder}`,
                background: tokens.card,
                color: tokens.textMuted,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {lang === "en" ? "العربية" : "English"}
            </button>
          </div>
        </div>

        {/* Setup card */}
        <div
          className="setup-enter"
          style={{
            maxWidth: 680,
            margin: "52px auto 0",
            background: tokens.card,
            border: `1px solid ${tokens.cardBorder}`,
            borderRadius: 18,
            padding: "34px 36px",
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 10, color: tokens.primary, letterSpacing: "0.14em", marginBottom: 8 }}>
            {lang === "ar" ? "إعداد سريع" : "QUICK SETUP"}
          </div>
          <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: 24, letterSpacing: "-0.02em", margin: "0 0 6px", textAlign: isRtl ? "right" : "left" }}>
            {lang === "ar" ? "أهلاً بك في GenAI" : "Welcome to GenAI"}
          </h1>
          <p style={{ fontSize: 13, color: tokens.textMuted, lineHeight: 1.6, margin: "0 0 28px", textAlign: isRtl ? "right" : "left" }}>
            {lang === "ar"
              ? "جهّز مساحة عملك الأكاديمية في ثوانٍ — اختَر دورك ولغتك وابدأ."
              : "Set up your academic workspace in seconds — pick your role and language, then go."}
          </p>

          {/* 01 — Role */}
          <div style={{ fontFamily: MONO, fontSize: 10, color: tokens.textFaint, letterSpacing: "0.12em", marginBottom: 10, textAlign: isRtl ? "right" : "left" }}>
            01 · {lang === "ar" ? "اختر دورك" : "CHOOSE YOUR ROLE"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 26 }}>
            {ROLES_META.map((r) => {
              const selected = state.role === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => dispatch({ type: "SET_ROLE", role: r.id })}
                  style={{
                    textAlign: isRtl ? "right" : "left",
                    padding: "16px 18px",
                    borderRadius: 12,
                    border: `1.5px solid ${selected ? tokens.primary : tokens.cardBorder}`,
                    background: selected ? tokens.primaryLight : tokens.card,
                    cursor: "pointer",
                    color: tokens.textPrimary,
                  }}
                >
                  <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                    {lang === "ar" ? r.ar : r.en}
                  </div>
                  <div style={{ fontSize: 12, color: tokens.textMuted, lineHeight: 1.55 }}>
                    {lang === "ar" ? r.arDesc : r.enDesc}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 02 — Language */}
          <div style={{ fontFamily: MONO, fontSize: 10, color: tokens.textFaint, letterSpacing: "0.12em", marginBottom: 10, textAlign: isRtl ? "right" : "left" }}>
            02 · {lang === "ar" ? "لغة الواجهة" : "INTERFACE LANGUAGE"}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 4,
              padding: 4,
              background: tokens.inset,
              border: `1px solid ${tokens.cardBorder}`,
              borderRadius: 10,
              marginBottom: 30,
            }}
          >
            {[
              { id: "en", label: "English" },
              { id: "ar", label: "العربية" },
            ].map((l) => {
              const active = lang === l.id;
              return (
                <button
                  key={l.id}
                  onClick={() => dispatch({ type: "SET_LANG", lang: l.id })}
                  style={{
                    padding: "9px 0",
                    borderRadius: 7,
                    border: "none",
                    background: active ? tokens.card : "transparent",
                    boxShadow: active ? "0 1px 4px rgba(13,26,46,0.12)" : "none",
                    color: active ? tokens.primary : tokens.textMuted,
                    fontFamily: bFont,
                    fontWeight: active ? 600 : 500,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {l.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPhase("ready")}
            disabled={!state.role}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: 10,
              border: "none",
              background: tokens.primaryBtn,
              color: "#fff",
              fontFamily: hFont,
              fontWeight: 700,
              fontSize: 14,
              cursor: state.role ? "pointer" : "not-allowed",
              opacity: state.role ? 1 : 0.45,
            }}
          >
            {lang === "ar" ? "متابعة" : "Continue"}
          </button>
          {!state.role && (
            <p style={{ textAlign: "center", fontSize: 11, color: tokens.textFaint, margin: "10px 0 0" }}>
              {lang === "ar" ? "اختر دورك أولاً للمتابعة" : "Pick a role to continue"}
            </p>
          )}
        </div>
      </div>
    
  );
}
}