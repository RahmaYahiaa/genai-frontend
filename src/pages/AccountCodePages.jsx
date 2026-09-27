import { useEffect, useState } from "react";
import AuthLayout from "@/components/AuthLayout";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { IconEye, IconEyeOff } from "@/components/Icons";
import { verifyEmail, resendVerification, forgotPassword, resetPassword, signOut } from "@/services/auth";
import { apiErrorText } from "@/services/http";
import { homeScreenFor } from "@/utils";

const RESEND_SECONDS = 60;

/** Shared look for both screens (same fields and buttons as the sign-in page). */
function useAuthStyles(state) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = headingFont(lang);
  const bFont = bodyFont(lang);
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const input = {
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
  const label = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: tokens.textMuted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    textAlign: isRtl ? "right" : "left",
  };
  const primary = (busy) => ({
    width: "100%",
    padding: "12px 0",
    borderRadius: 10,
    border: "none",
    background: tokens.primaryBtn,
    color: "white",
    fontFamily: hFont,
    fontWeight: 700,
    fontSize: 14,
    cursor: busy ? "default" : "pointer",
    opacity: busy ? 0.7 : 1,
    marginBottom: 14,
  });
  const link = { color: tokens.primary, background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12.5, fontFamily: bFont, padding: 0 };
  return { tokens, lang, isRtl, hFont, bFont, t, input, label, primary, link };
}

function Heading({ s, title, body }) {
  return (
    <>
      <h2 style={{ fontFamily: s.hFont, fontWeight: 700, fontSize: 22, color: s.tokens.textPrimary, letterSpacing: "-0.02em", margin: "0 0 6px", textAlign: s.isRtl ? "right" : "left" }}>{title}</h2>
      <p style={{ fontSize: 13, color: s.tokens.textMuted, margin: "0 0 22px", fontFamily: s.bFont, lineHeight: 1.6, textAlign: s.isRtl ? "right" : "left" }}>{body}</p>
    </>
  );
}

function Message({ s, dark, tone, children }) {
  if (!children) return null;
  const danger = tone === "danger";
  return (
    <div role={danger ? "alert" : "status"} style={{
      marginBottom: 12, padding: "9px 12px", borderRadius: 8, fontSize: 12.5, fontFamily: s.bFont, lineHeight: 1.5, textAlign: s.isRtl ? "right" : "left",
      border: `1px solid ${danger ? (dark ? "rgba(255,120,120,0.35)" : "rgba(200,60,60,0.25)") : (dark ? "rgba(90,200,140,0.35)" : "rgba(26,127,78,0.25)")}`,
      background: danger ? (dark ? "rgba(255,90,90,0.12)" : "rgba(220,60,60,0.07)") : (dark ? "rgba(90,200,140,0.12)" : "rgba(26,127,78,0.07)"),
      color: danger ? (dark ? "#FF9D9D" : "#B42318") : (dark ? "#8FE0B5" : "#1A7F4E"),
    }}>{children}</div>
  );
}

/** 6-digit code field: digits only, big and spaced, autofills from SMS/email on phones. */
function CodeInput({ s, value, onChange, onEnter }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      onKeyDown={(e) => { if (e.key === "Enter") onEnter?.(); }}
      inputMode="numeric"
      autoComplete="one-time-code"
      dir="ltr"
      aria-label={s.t("6-digit code", "الكود المكوّن من 6 أرقام")}
      placeholder="••••••"
      style={{ ...s.input, fontSize: 24, letterSpacing: "0.5em", textAlign: "center", fontWeight: 700, padding: "12px 14px", fontFamily: "Consolas, Menlo, monospace" }}
    />
  );
}

function useCountdown(initial) {
  const [left, setLeft] = useState(initial);
  useEffect(() => {
    if (left <= 0) return undefined;
    const id = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  return [left, setLeft];
}

function Layout({ state, dispatch, s, form }) {
  return (
    <AuthLayout
      dark={state.dark}
      lang={s.lang}
      dispatch={dispatch}
      title={s.t("Your account, kept safe.", "حسابك في أمان.")}
      subtitle={s.t("We send a short code to your email to make sure it is really you.", "بنبعت كود قصير على بريدك عشان نتأكد إنه إنت.")}
      hero={null}
      form={form}
    />
  );
}

/** Shown right after sign-up, and from the reminder bar inside the app. */
export function VerifyEmailPage({ state, dispatch }) {
  const s = useAuthStyles(state);
  const email = state.user?.email ?? "";
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [left, setLeft] = useCountdown(RESEND_SECONDS);

  const goHome = () => dispatch({ type: "NAVIGATE", screen: homeScreenFor(state.user?.role ?? state.role) });

  useEffect(() => {
    // Already confirmed (or signed out): nothing to do here.
    if (!state.user) dispatch({ type: "NAVIGATE", screen: SCREENS.LOGIN });
    else if (state.user.emailVerified !== false) goHome();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.user]);

  const submit = async () => {
    if (busy) return;
    setError("");
    setInfo("");
    if (code.length !== 6) {
      setError(s.t("Enter the 6-digit code from the email.", "دخّل الكود المكوّن من 6 أرقام اللي في الإيميل."));
      return;
    }
    setBusy(true);
    try {
      const user = await verifyEmail(code);
      dispatch({ type: "SET_USER", user });
      dispatch({ type: "NAVIGATE", screen: homeScreenFor(user.role) });
    } catch (err) {
      setError(apiErrorText(err, s.lang));
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError("");
    setInfo("");
    try {
      await resendVerification();
      setInfo(s.t("A new code is on its way. Check your inbox and spam folder.", "كود جديد في الطريق. شوف الوارد والـSpam."));
      setLeft(RESEND_SECONDS);
    } catch (err) {
      setError(apiErrorText(err, s.lang));
    }
  };

  const useOtherEmail = () => {
    signOut();
    dispatch({ type: "RESET" });
    dispatch({ type: "NAVIGATE", screen: SCREENS.REGISTER });
  };

  const form = (
    <>
      <Heading s={s} title={s.t("Check your email", "شوف بريدك")}
        body={<>{s.t("We sent a 6-digit code to", "بعتنا كود من 6 أرقام على")} <b dir="ltr" style={{ color: s.tokens.textPrimary }}>{email}</b>. {s.t("It expires in 15 minutes.", "صالح لمدة 15 دقيقة.")}</>} />
      <div style={{ marginBottom: 14 }}>
        <label style={s.label}>{s.t("Code", "الكود")}</label>
        <CodeInput s={s} value={code} onChange={setCode} onEnter={submit} />
      </div>
      <Message s={s} dark={state.dark} tone="danger">{error}</Message>
      <Message s={s} dark={state.dark} tone="success">{info}</Message>
      <button type="button" onClick={submit} disabled={busy} style={s.primary(busy)}>
        {busy ? s.t("Checking…", "بنتأكد…") : s.t("Confirm email", "أكّد البريد")}
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", fontSize: 12.5, fontFamily: s.bFont, color: s.tokens.textMuted }}>
        {left > 0 ? (
          <span>{s.t(`Send a new code in ${left}s`, `تقدر تطلب كود جديد بعد ${left} ثانية`)}</span>
        ) : (
          <button type="button" onClick={() => void resend()} style={s.link}>{s.t("Send a new code", "ابعت كود جديد")}</button>
        )}
        <button type="button" onClick={useOtherEmail} style={{ ...s.link, color: s.tokens.textMuted, fontWeight: 500 }}>{s.t("Use a different email", "استخدم بريد تاني")}</button>
      </div>
      <p style={{ textAlign: "center", marginTop: 22 }}>
        <button type="button" onClick={goHome} style={{ ...s.link, color: s.tokens.textMuted, fontWeight: 500 }}>{s.t("I'll do this later", "هعملها بعدين")}</button>
      </p>
    </>
  );
  return <Layout state={state} dispatch={dispatch} s={s} form={form} />;
}

/** Two steps: email -> code + new password. */
export function ForgotPasswordPage({ state, dispatch }) {
  const s = useAuthStyles(state);
  const [stage, setStage] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [left, setLeft] = useCountdown(0);

  const toLogin = () => dispatch({ type: "NAVIGATE", screen: SCREENS.LOGIN });

  const sendCode = async () => {
    if (busy) return;
    setError("");
    setInfo("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError(s.t("Enter a valid email address.", "دخّل بريد إلكتروني صحيح."));
      return;
    }
    setBusy(true);
    try {
      await forgotPassword(email.trim());
      setStage("code");
      setLeft(RESEND_SECONDS);
      setInfo(s.t("If an account uses this email, a code is on its way.", "لو فيه حساب بالبريد ده، الكود في الطريق."));
    } catch (err) {
      setError(apiErrorText(err, s.lang));
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (busy) return;
    setError("");
    setInfo("");
    if (code.length !== 6) {
      setError(s.t("Enter the 6-digit code from the email.", "دخّل الكود المكوّن من 6 أرقام اللي في الإيميل."));
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError(s.t("Use at least 8 characters with a letter and a number.", "استخدم 8 أحرف على الأقل فيها حرف ورقم."));
      return;
    }
    setBusy(true);
    try {
      await resetPassword({ email: email.trim(), code, password });
      setStage("done");
    } catch (err) {
      setError(apiErrorText(err, s.lang));
    } finally {
      setBusy(false);
    }
  };

  const form = stage === "done" ? (
    <>
      <Heading s={s} title={s.t("Password changed", "اتغيّرت كلمة السر")}
        body={s.t("You can sign in with your new password now. For your safety, other devices were signed out.", "تقدر تدخل بكلمة السر الجديدة دلوقتي. وللأمان، اتعمل خروج من الأجهزة التانية.")} />
      <button type="button" onClick={toLogin} style={s.primary(false)}>{s.t("Go to sign in", "روح لتسجيل الدخول")}</button>
    </>
  ) : (
    <>
      <Heading s={s} title={s.t("Reset your password", "غيّر كلمة السر")}
        body={stage === "email"
          ? s.t("Enter your account email and we'll send you a code.", "دخّل بريد حسابك وهنبعتلك كود.")
          : <>{s.t("Enter the code we sent to", "دخّل الكود اللي بعتناه على")} <b dir="ltr" style={{ color: s.tokens.textPrimary }}>{email.trim()}</b> {s.t("and choose a new password.", "واختار كلمة سر جديدة.")}</>} />
      {stage === "email" ? (
        <div style={{ marginBottom: 14 }}>
          <label style={s.label}>{s.t("Email address", "البريد الإلكتروني")}</label>
          <input style={s.input} type="email" dir="ltr" placeholder="name@email.com" value={email} autoComplete="email"
            onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void sendCode(); }} />
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 14 }}>
            <label style={s.label}>{s.t("Code", "الكود")}</label>
            <CodeInput s={s} value={code} onChange={setCode} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={s.label}>{s.t("New password", "كلمة السر الجديدة")}</label>
            <div style={{ position: "relative" }}>
              <input style={{ ...s.input, paddingInlineEnd: 40 }} type={show ? "text" : "password"} dir="ltr" value={password} autoComplete="new-password"
                placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void save(); }} />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? s.t("Hide password", "إخفاء كلمة السر") : s.t("Show password", "إظهار كلمة السر")}
                style={{ position: "absolute", insetInlineEnd: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: s.tokens.textMuted, padding: 0, display: "flex" }}>
                {show ? <IconEyeOff size={15} /> : <IconEye size={15} />}
              </button>
            </div>
            <div style={{ fontSize: 11.5, color: s.tokens.textFaint, marginTop: 6, fontFamily: s.bFont, textAlign: s.isRtl ? "right" : "left" }}>
              {s.t("At least 8 characters, with a letter and a number.", "8 أحرف على الأقل، فيها حرف ورقم.")}
            </div>
          </div>
        </>
      )}
      <Message s={s} dark={state.dark} tone="danger">{error}</Message>
      <Message s={s} dark={state.dark} tone="success">{info}</Message>
      <button type="button" onClick={() => void (stage === "email" ? sendCode() : save())} disabled={busy} style={s.primary(busy)}>
        {busy ? s.t("Please wait…", "لحظة…") : stage === "email" ? s.t("Send code", "ابعت الكود") : s.t("Save new password", "احفظ كلمة السر")}
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", fontSize: 12.5, fontFamily: s.bFont, color: s.tokens.textMuted }}>
        <button type="button" onClick={toLogin} style={{ ...s.link, color: s.tokens.textMuted, fontWeight: 500 }}>{s.t("Back to sign in", "رجوع لتسجيل الدخول")}</button>
        {stage === "code" && (left > 0
          ? <span>{s.t(`New code in ${left}s`, `كود جديد بعد ${left} ثانية`)}</span>
          : <button type="button" onClick={() => void sendCode()} style={s.link}>{s.t("Send a new code", "ابعت كود جديد")}</button>)}
      </div>
    </>
  );
  return <Layout state={state} dispatch={dispatch} s={s} form={form} />;
}
