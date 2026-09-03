import { useState } from "react";
import AuthLayout from "@/components/AuthLayout";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { SCREENS, ROLES } from "@/constants/routes";
import { REGISTER_ROLES, REGISTER_FEATURES } from "@/data/auth";

export default function RegisterPage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = headingFont(lang);
  const bFont = bodyFont(lang);
  const [role, setRole] = useState(ROLES.STUDENT);
  const [step, setStep] = useState(1);

  const inp = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    border: `1.5px solid ${tokens.cardBorder}`,
    background: tokens.inset,
    color: tokens.textPrimary,
    fontFamily: bFont,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };

  const label = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: tokens.textMuted,
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
  };

  const hero = (
    <div className="rise-in" style={{ animationDelay: "360ms" }}>
      {REGISTER_FEATURES.map((f, fi) => (
        <div
          key={f.en}
          className="rise-in"
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 12,
            padding: "12px 14px",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 9,
            animationDelay: `${380 + fi * 110}ms`,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7FB2FF", marginTop: 6, flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 13, color: "white", marginBottom: 1 }}>
              {lang === "ar" ? f.ar : f.en}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: bFont }}>
              {lang === "ar" ? f.arDesc : f.enDesc}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const form = (
    <>
      {/* Step indicator */}
      <div style={{ display: "flex", gap: 5, marginBottom: 24 }}>
        {[1, 2].map((s) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: s <= step ? tokens.primary : tokens.cardBorder,
              transition: "background 250ms ease",
            }}
          />
        ))}
      </div>

      <h2 style={{ fontFamily: hFont, fontWeight: 700, fontSize: 20, color: tokens.textPrimary, letterSpacing: "-0.03em", margin: "0 0 4px", textAlign: isRtl ? "right" : "left" }}>
        {step === 1 ? (lang === "ar" ? "أنشئ حسابك" : "Create your account") : lang === "ar" ? "السياق الأكاديمي" : "Academic context"}
      </h2>
      <p style={{ fontSize: 12, color: tokens.textMuted, margin: "0 0 22px", fontFamily: bFont }}>
        {step === 1 ? (lang === "ar" ? "الخطوة 1 من 2 — بياناتك" : "Step 1 of 2 — Your details") : lang === "ar" ? "الخطوة 2 من 2 — المؤسسة والمقرر" : "Step 2 of 2 — Institution and course"}
      </p>

      {step === 1 && (
        <>
          <div style={{ marginBottom: 14 }}>
            <label style={label}>{lang === "ar" ? "أنا" : "I am a"}</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 4,
                padding: 4,
                background: tokens.inset,
                border: `1px solid ${tokens.cardBorder}`,
                borderRadius: 10,
              }}
            >
              {REGISTER_ROLES.map((r) => {
                const active = role === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setRole(r.id)}
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
                    {lang === "ar" ? r.ar : r.en}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={label}>{lang === "ar" ? "الاسم الأول" : "First name"}</label>
              <input style={inp} placeholder={lang === "ar" ? "سارة" : "Sarah"} />
            </div>
            <div>
              <label style={label}>{lang === "ar" ? "اسم العائلة" : "Last name"}</label>
              <input style={inp} placeholder={lang === "ar" ? "الراشدي" : "Al-Rashidi"} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={label}>{lang === "ar" ? "البريد الجامعي" : "Institutional email"}</label>
            <input style={inp} type="email" placeholder="s.alrashidi@university.edu" dir="ltr" />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={label}>{lang === "ar" ? "كلمة المرور" : "Password"}</label>
            <input style={inp} type="password" placeholder={lang === "ar" ? "12 حرفاً على الأقل" : "Min. 12 characters"} />
          </div>

          <button
            onClick={() => setStep(2)}
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
            }}
          >
            {lang === "ar" ? "متابعة" : "Continue"}
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ marginBottom: 14 }}>
            <label style={label}>{lang === "ar" ? "المؤسسة" : "Institution"}</label>
            <input style={inp} defaultValue="KAUST" dir="ltr" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={label}>{lang === "ar" ? "المعرف الجامعي" : "Student / Staff ID"}</label>
            <input style={inp} defaultValue={role === ROLES.INSTRUCTOR ? "FAC-2024-0087" : "202341872"} dir="ltr" />
          </div>
          {role === ROLES.STUDENT && (
            <div style={{ marginBottom: 14 }}>
              <label style={label}>{lang === "ar" ? "رمز التسجيل" : "Enrollment code"}</label>
              <input style={inp} placeholder={lang === "ar" ? "يقدّمه مدرّسك" : "Provided by your instructor"} dir="ltr" />
            </div>
          )}
          <div
            style={{
              padding: "10px 12px",
              background: tokens.inset,
              border: `1px solid ${tokens.cardBorder}`,
              borderRadius: 8,
              marginBottom: 18,
            }}
          >
            <p style={{ fontSize: 11, color: tokens.textMuted, margin: 0, lineHeight: 1.55, fontFamily: bFont }}>
              {lang === "ar"
                ? "بياناتك الأكاديمية محمية بموجب FERPA ومخزّنة وفق سياسة حوكمة البيانات لمؤسستك."
                : "Your academic data is protected under FERPA and stored in compliance with your institution data governance policy."}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setStep(1)}
              style={{
                padding: "11px 16px",
                borderRadius: 10,
                border: `1.5px solid ${tokens.cardBorder}`,
                background: tokens.card,
                color: tokens.textMuted,
                fontFamily: bFont,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {lang === "ar" ? "رجوع" : "Back"}
            </button>
            <button
              onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.DASHBOARD })}
              style={{
                flex: 1,
                padding: "11px 0",
                borderRadius: 10,
                border: "none",
                background: tokens.primaryBtn,
                color: "white",
                fontFamily: hFont,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {lang === "ar" ? "طلب الوصول" : "Request Access"}
            </button>
          </div>
        </>
      )}

      <p style={{ textAlign: "center", fontSize: 12, color: tokens.textMuted, marginTop: 20, fontFamily: bFont }}>
        {lang === "ar" ? "عندك حساب بالفعل؟" : "Already have an account?"}{" "}
        <button
          onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.LOGIN })}
          style={{ color: tokens.primary, background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, fontFamily: bFont, padding: 0 }}
        >
          {lang === "ar" ? "تسجيل الدخول" : "Sign in"}
        </button>
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
          {lang === "ar" ? "انضم إلى شبكة" : "Join your institution's"}
          <br />
          <span style={{ color: "rgba(255,255,255,0.65)" }}>
            {lang === "ar" ? "الذكاء الأكاديمي." : "learning intelligence network."}
          </span>
        </>
      }
      subtitle={
        lang === "ar"
          ? "يُمنح الوصول من خلال مؤسستك الأكاديمية. بعد التحقق، تحصل على تشخيص شخصي، ومعلم ذكي مستند إلى مقرراتك، وإثبات لنموك التعليمي."
          : "Access is granted through your academic institution. Once verified, you receive personalised diagnostics, AI tutoring grounded in approved course materials, and proof of measurable learning growth."
      }
      hero={hero}
      form={form}
    />
  );
}