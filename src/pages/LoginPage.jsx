import { useState } from "react";
import AuthLayout from "@/components/AuthLayout";
import MasteryLadder from "@/components/MasteryLadder";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { SCREENS, ROLES } from "@/constants/routes";
import { ROLE_TABS, INSTITUTIONS, PREVIEW_SCREENS } from "@/data/auth";
import { IconEye, IconEyeOff, IconLock } from "@/components/Icons";

const MONO = "'JetBrains Mono', monospace";

export default function LoginPage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = headingFont(lang);
  const bFont = bodyFont(lang);
  const [showPass, setShowPass] = useState(false);

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    border: `1.5px solid ${tokens.cardBorder}`,
    background: tokens.inset,
    color: tokens.textPrimary,
    fontFamily: bFont,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: tokens.textMuted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    textAlign: isRtl ? "right" : "left",
  };

  const goAfterSignIn = () => {
    const target = state.role === ROLES.INSTRUCTOR ? SCREENS.INSTRUCTOR : state.role === ROLES.ADMIN ? SCREENS.ADMIN : SCREENS.DASHBOARD;
    dispatch({ type: "NAVIGATE", screen: target });
  };

  const form = (
    <>
      <h2 style={{ fontFamily: hFont, fontWeight: 700, fontSize: 22, color: tokens.textPrimary, letterSpacing: "-0.02em", margin: "0 0 4px", textAlign: isRtl ? "right" : "left" }}>
        {lang === "ar" ? "تسجيل الدخول" : "Sign in"}
      </h2>
      <p style={{ fontSize: 13, color: tokens.textMuted, margin: "0 0 24px", fontFamily: bFont, textAlign: isRtl ? "right" : "left" }}>
        {lang === "ar" ? "ادخل إلى منصتك الأكاديمية الذكية." : "Access your academic intelligence platform."}
      </p>

      {/* Role segmented */}
      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle}>{lang === "ar" ? "الدور" : "Role"}</label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 4,
            padding: 4,
            background: tokens.inset,
            border: `1px solid ${tokens.cardBorder}`,
            borderRadius: 10,
          }}
        >
          {ROLE_TABS.map((r) => {
            const active = state.role === r.id;
            return (
              <button
                key={r.id}
                onClick={() => dispatch({ type: "SET_ROLE", role: r.id })}
                style={{
                  padding: "8px 0",
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
                {lang === "ar" ? r.ar : r.en}
              </button>
            );
          })}
        </div>
      </div>

      {/* Email */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>{lang === "ar" ? "البريد الجامعي" : "Institutional email"}</label>
        <input style={inputStyle} type="email" placeholder="you@university.edu" dir="ltr" />
      </div>

      {/* Password */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>{lang === "ar" ? "كلمة المرور" : "Password"}</label>
          <span style={{ fontSize: 11, color: tokens.primary, fontWeight: 600, cursor: "pointer", fontFamily: bFont }}>
            {lang === "ar" ? "نسيت؟" : "Forgot?"}
          </span>
        </div>
        <div style={{ position: "relative" }}>
          <input style={{ ...inputStyle, paddingRight: isRtl ? 14 : 40, paddingLeft: isRtl ? 40 : 14 }} type={showPass ? "text" : "password"} placeholder="••••••••••" dir="ltr" />
          <button
            onClick={() => setShowPass((v) => !v)}
            aria-label={showPass ? "Hide password" : "Show password"}
            style={{
              position: "absolute",
              insetInlineEnd: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: tokens.textMuted,
              padding: 0,
              display: "flex",
            }}
          >
            {showPass ? <IconEyeOff size={15} /> : <IconEye size={15} />}
          </button>
        </div>
      </div>

      {/* Sign in */}
      <button
        onClick={goAfterSignIn}
        style={{
          width: "100%",
          padding: "12px 0",
          borderRadius: 10,
          border: "none",
          background: tokens.primaryBtn,
          color: "white",
          fontFamily: hFont,
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: "-0.01em",
          cursor: "pointer",
          marginBottom: 16,
        }}
      >
        {lang === "ar" ? "دخول" : "Sign In"}
      </button>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 1, background: tokens.cardBorder }} />
        <span style={{ fontSize: 12, color: tokens.textFaint }}>{lang === "ar" ? "أو" : "or"}</span>
        <div style={{ flex: 1, height: 1, background: tokens.cardBorder }} />
      </div>

      {/* SSO */}
      <button
        style={{
          width: "100%",
          padding: "10px 0",
          borderRadius: 10,
          border: `1.5px solid ${tokens.cardBorder}`,
          background: tokens.card,
          color: tokens.textPrimary,
          fontFamily: bFont,
          fontWeight: 500,
          fontSize: 13,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <IconLock size={14} color={tokens.textMuted} />
        {lang === "ar" ? "دخول عبر الجامعة (SSO)" : "Continue with University SSO"}
      </button>

      {/* Register link */}
      <p style={{ textAlign: "center", fontSize: 12, color: tokens.textMuted, margin: "18px 0 0", fontFamily: bFont }}>
        {lang === "ar" ? "جديد على GenAI؟" : "New to GenAI?"}{" "}
        <button
          onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.REGISTER })}
          style={{ color: tokens.primary, background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, fontFamily: bFont, padding: 0 }}
        >
          {lang === "ar" ? "اطلب الوصول" : "Request access"}
        </button>
      </p>

      {/* Preview screens */}
      <div
        style={{
          marginTop: 22,
          padding: "14px 16px",
          background: tokens.inset,
          border: `1px solid ${tokens.cardBorder}`,
          borderRadius: 10,
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 9, color: tokens.textFaint, letterSpacing: "0.12em", marginBottom: 8, textAlign: isRtl ? "right" : "left" }}>
          {lang === "ar" ? "معاينة الشاشات" : "Preview screens"}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PREVIEW_SCREENS.map((p) => (
            <button
              key={p.id}
              onClick={() => dispatch({ type: "NAVIGATE", screen: p.id })}
              style={{
                padding: "5px 10px",
                borderRadius: 6,
                border: `1px solid ${tokens.cardBorder}`,
                background: tokens.card,
                color: tokens.textMuted,
                fontFamily: MONO,
                fontSize: 10,
                cursor: "pointer",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <p style={{ textAlign: "center", fontSize: 10.5, color: tokens.textFaint, marginTop: 18, lineHeight: 1.6, fontFamily: bFont }}>
        {lang === "ar" ? "متوافق مع FERPA · حوكمة بيانات مؤسسية" : "FERPA-compliant · Institutional data governance"}
        <br />© 2026 GenAI Academic Intelligence
      </p>
    </>
  );

  return (
    <AuthLayout
      dark={state.dark}
      lang={lang}
      dispatch={dispatch}
      title={
        <>
          {lang === "ar" ? "الإتقان يُبنى على" : "Mastery is built on"}
          <br />
          <span style={{ color: "rgba(255,255,255,0.65)" }}>
            {lang === "ar" ? "أدلة حقيقية، لا تخمين AI." : "real evidence, not AI guesses."}
          </span>
        </>
      }
      subtitle={
        lang === "ar"
          ? "تتتبع GenAI ما تعرفه بالضبط عبر أدلة التشخيص — ثم تخصص ما تدرسه بعدها وتثبت التحسن عبر إعادة تقييم صارمة."
          : "GenAI tracks exactly what you know through diagnostic evidence — then personalises what you study next and proves improvement through rigorous reassessment."
      }
      hero={
        <div className="rise-in" style={{ animationDelay: "360ms" }}>
          <MasteryLadder dark={state.dark} />
          <div style={{ display: "flex", gap: 24, marginTop: 36, alignItems: "center", opacity: 0.35 }}>
            {INSTITUTIONS.map((uni) => (
              <span key={uni} style={{ fontFamily: MONO, fontSize: 11, color: "white", letterSpacing: "0.06em" }}>
                {uni}
              </span>
            ))}
          </div>
        </div>
      }
      form={form}
    />
  );
}