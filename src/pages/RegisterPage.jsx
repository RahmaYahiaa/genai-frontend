import { useState } from "react";
import AuthLayout from "@/components/AuthLayout";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import { SCREENS, ROLES } from "@/constants/routes";
import { REGISTER_ROLES, REGISTER_FEATURES } from "@/data/auth";
import { register, registrationGuidance } from "@/services/auth";
import { apiErrorText } from "@/services/http";
import { homeScreenFor } from "@/utils";

export default function RegisterPage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = headingFont(lang);
  const bFont = bodyFont(lang);
  const mobile = useMediaQuery("(max-width: 760px)");
  const [role, setRole] = useState(ROLES.STUDENT);
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [guidance, setGuidance] = useState(null);

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

  const goStep2 = async () => {
    if (busy) return;
    setError("");
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !pass) {
      setError(lang === "ar" ? "أكمل كل الحقول للمتابعة." : "Fill in all fields to continue.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(lang === "ar" ? "أدخل بريداً إلكترونياً صحيحاً." : "Enter a valid email address.");
      return;
    }
    if (pass.length < 8 || !/[A-Za-z]/.test(pass) || !/\d/.test(pass)) {
      setError(
        lang === "ar"
          ? "كلمة المرور 8 أحرف على الأقل وتحتوي حرفاً ورقماً على الأقل."
          : "Password must be at least 8 characters and include a letter and a number.",
      );
      return;
    }
    setBusy(true);
    try {
      const g = await registrationGuidance(email.trim());
      setGuidance(g);
    } catch {
      setGuidance(null);
    } finally {
      setBusy(false);
    }
    setStep(2);
  };

  const submit = async () => {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const payload = {
        email: email.trim(),
        password: pass,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
        languagePreference: lang === "ar" ? "ar" : "en",
      };
      if (guidance?.institution?.id) payload.institutionId = guidance.institution.id;
      const user = await register(payload, role);
      dispatch({ type: "SET_USER", user });
      dispatch({ type: "NAVIGATE", screen: homeScreenFor(user.role) });
    } catch (err) {
      setError(apiErrorText(err, lang));
      setStep(1);
    } finally {
      setBusy(false);
    }
  };

  const institution = guidance?.institution ?? null;

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

      {error !== "" && (
        <div
          style={{
            marginBottom: 14,
            padding: "9px 12px",
            borderRadius: 8,
            border: `1px solid ${state.dark ? "rgba(255,120,120,0.35)" : "rgba(200,60,60,0.25)"}`,
            background: state.dark ? "rgba(255,90,90,0.12)" : "rgba(220,60,60,0.07)",
            color: state.dark ? "#FF9D9D" : "#B42318",
            fontSize: 12,
            fontFamily: bFont,
            lineHeight: 1.5,
            textAlign: isRtl ? "right" : "left",
          }}
        >
          {error}
        </div>
      )}

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

          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={label}>{lang === "ar" ? "الاسم الأول" : "First name"}</label>
              <input
                style={inp}
                placeholder={lang === "ar" ? "سارة" : "Sarah"}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label style={label}>{lang === "ar" ? "اسم العائلة" : "Last name"}</label>
              <input
                style={inp}
                placeholder={lang === "ar" ? "الراشدي" : "Al-Rashidi"}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={label}>{lang === "ar" ? "البريد الجامعي" : "Institutional email"}</label>
            <input
              style={inp}
              type="email"
              placeholder="s.alrashidi@university.edu"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") goStep2();
              }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={label}>{lang === "ar" ? "كلمة المرور" : "Password"}</label>
            <input
              style={inp}
              type="password"
              placeholder={lang === "ar" ? "8 أحرف على الأقل" : "Min. 8 characters"}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") goStep2();
              }}
            />
          </div>

          <button
            onClick={goStep2}
            disabled={busy}
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
              cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {lang === "ar" ? "متابعة" : "Continue"}
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div
            style={{
              marginBottom: 14,
              padding: "12px 14px",
              borderRadius: 10,
              border: `1.5px solid ${institution ? tokens.primary : tokens.cardBorder}`,
              background: institution ? (state.dark ? "rgba(110,155,255,0.10)" : "#EBF2FD") : tokens.inset,
            }}
          >
            <div style={{ ...label, marginBottom: 4 }}>{lang === "ar" ? "مسار التسجيل" : "Registration track"}</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: institution ? tokens.primary : tokens.textPrimary, fontFamily: bFont }}>
              {institution
                ? lang === "ar"
                  ? `المسار الجامعي — ${institution.name}`
                  : `University track — ${institution.name}`
                : lang === "ar"
                  ? "المسار الفردي — حساب شخصي"
                  : "Individual track — personal account"}
            </div>
            <div style={{ fontSize: 11.5, color: tokens.textMuted, marginTop: 4, lineHeight: 1.55, fontFamily: bFont }}>
              {institution
                ? lang === "ar"
                  ? "هتتسجل تابع ليها، ومقرراتك الجامعية هتتربط بحسابك تلقائياً."
                  : "You will register under it, and your university courses will link to your account automatically."
                : lang === "ar"
                  ? "حساب مستقل عن أي جامعة — تقدر تبني مقرراتك الذاتية وترفع موادك بنفسك."
                  : "Independent of any university — you can build self-study courses and upload your own materials."}
            </div>
            {role === ROLES.INSTRUCTOR && !institution && (
              <div style={{ fontSize: 11.5, color: "#B42318", marginTop: 6, lineHeight: 1.55, fontFamily: bFont }}>
                {lang === "ar"
                  ? "حساب المدرّس يتطلب جامعة مسجلة — الإيميل ده مش مرتبط بمؤسسة على المنصة."
                  : "Instructor accounts require a registered institution — this email is not linked to one."}
              </div>
            )}
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
              onClick={submit}
              disabled={busy}
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
                cursor: busy ? "default" : "pointer",
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy
                ? lang === "ar"
                  ? "جارٍ إنشاء الحساب…"
                  : "Creating account…"
                : lang === "ar"
                  ? "طلب الوصول"
                  : "Request Access"}
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