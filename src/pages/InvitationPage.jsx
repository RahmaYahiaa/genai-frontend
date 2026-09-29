import { useEffect, useState } from "react";
import AuthLayout from "@/components/AuthLayout";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { IconEye, IconEyeOff, IconCheck, IconBookOpen } from "@/components/Icons";
import { previewInvitation, acceptInvitation, signOut } from "@/services/auth";
import { apiErrorText } from "@/services/http";
import { homeScreenFor } from "@/utils";

const ROLE = {
  student: { en: "Student", ar: "طالب" },
  instructor: { en: "Instructor", ar: "عضو هيئة تدريس" },
  officer: { en: "Administration team", ar: "فريق الإدارة" },
};

/**
 * Opened from the invitation email (/?invite=TOKEN).
 * Shows who invited you and to what, then you choose a password and you're in:
 * the account starts confirmed (the link proves the email) and courses are ready.
 */
export default function InvitationPage({ state, dispatch, token, onDone }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = headingFont(lang);
  const bFont = bodyFont(lang);
  const t = (en, ar) => (isRtl ? ar : en);

  const [invite, setInvite] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    previewInvitation(token)
      .then((data) => {
        if (!alive) return;
        setInvite(data);
        setFirstName(data.firstName ?? "");
        setLastName(data.lastName ?? "");
      })
      .catch((err) => alive && setLoadError(apiErrorText(err, lang)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const toLogin = () => {
    onDone();
    dispatch({ type: "NAVIGATE", screen: SCREENS.LOGIN });
  };

  const submit = async () => {
    if (busy) return;
    setError("");
    if (!firstName.trim() || !lastName.trim()) {
      setError(t("Enter your first and last name.", "اكتب اسمك الأول واسم العائلة."));
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError(t("Use at least 8 characters with a letter and a number.", "استخدم 8 أحرف على الأقل فيها حرف ورقم."));
      return;
    }
    if (password !== confirm) {
      setError(t("The two passwords don't match.", "كلمتين السر مش زي بعض."));
      return;
    }
    setBusy(true);
    try {
      if (state.user) signOut();
      const user = await acceptInvitation(token, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
        languagePreference: lang === "ar" ? "ar" : "en",
      });
      onDone();
      dispatch({ type: "SET_USER", user });
      dispatch({ type: "NAVIGATE", screen: homeScreenFor(user.role) });
    } catch (err) {
      setError(apiErrorText(err, lang));
    } finally {
      setBusy(false);
    }
  };

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
  const label = { display: "block", fontSize: 11, fontWeight: 600, color: tokens.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em", textAlign: isRtl ? "right" : "left" };
  const primary = { width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: tokens.primaryBtn, color: "white", fontFamily: hFont, fontWeight: 700, fontSize: 14, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1, marginTop: 4 };
  const link = { color: tokens.primary, background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12.5, fontFamily: bFont, padding: 0 };
  const align = isRtl ? "right" : "left";

  let form;
  if (loading) {
    form = <p style={{ color: tokens.textMuted, fontFamily: bFont, fontSize: 14 }}>{t("Opening your invitation…", "بنفتح الدعوة…")}</p>;
  } else if (loadError) {
    form = (
      <>
        <h2 style={{ fontFamily: hFont, fontWeight: 700, fontSize: 22, color: tokens.textPrimary, margin: "0 0 8px", textAlign: align }}>{t("This link can't be used", "الرابط ده مش شغال")}</h2>
        <p style={{ fontSize: 13.5, color: tokens.textMuted, lineHeight: 1.6, fontFamily: bFont, margin: "0 0 22px", textAlign: align }}>{loadError}</p>
        <button type="button" onClick={toLogin} style={{ ...primary, cursor: "pointer", opacity: 1 }}>{t("Go to sign in", "روح لتسجيل الدخول")}</button>
      </>
    );
  } else if (invite?.accountExists) {
    form = (
      <>
        <h2 style={{ fontFamily: hFont, fontWeight: 700, fontSize: 22, color: tokens.textPrimary, margin: "0 0 8px", textAlign: align }}>{t("You already have an account", "عندك حساب بالفعل")}</h2>
        <p style={{ fontSize: 13.5, color: tokens.textMuted, lineHeight: 1.6, fontFamily: bFont, margin: "0 0 22px", textAlign: align }}>
          {t(`Sign in with ${invite.email} and your ${invite.institutionName} courses will be added automatically.`, `ادخل بـ ${invite.email} ومقررات ${invite.institutionName} هتتضاف لك تلقائيًا.`)}
        </p>
        <button type="button" onClick={toLogin} style={{ ...primary, cursor: "pointer", opacity: 1 }}>{t("Sign in", "تسجيل الدخول")}</button>
      </>
    );
  } else {
    const role = ROLE[invite.role] ?? ROLE.student;
    form = (
      <>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, color: tokens.primary, background: tokens.primaryLight, padding: "4px 10px", borderRadius: 999, marginBottom: 12, fontFamily: bFont }}>
          <IconCheck size={12} /> {t("Invitation", "دعوة")} · {invite.institutionName}
        </div>
        <h2 style={{ fontFamily: hFont, fontWeight: 700, fontSize: 22, color: tokens.textPrimary, letterSpacing: "-0.02em", margin: "0 0 6px", textAlign: align }}>
          {t(`Welcome, ${invite.firstName}`, `أهلاً ${invite.firstName}`)}
        </h2>
        <p style={{ fontSize: 13, color: tokens.textMuted, margin: "0 0 16px", fontFamily: bFont, lineHeight: 1.6, textAlign: align }}>
          {invite.invitedByName
            ? t(`${invite.invitedByName} invited you to join ${invite.institutionName} as ${role.en.toLowerCase()}. Choose a password and you're in.`, `${invite.invitedByName} دعاك تنضم لـ ${invite.institutionName} كـ${role.ar}. اختار كلمة سر وهتدخل على طول.`)
            : t(`You're invited to join ${invite.institutionName} as ${role.en.toLowerCase()}.`, `إنت مدعو تنضم لـ ${invite.institutionName} كـ${role.ar}.`)}
        </p>

        {invite.courses?.length > 0 && (
          <div style={{ border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, padding: "10px 12px", marginBottom: 16, background: tokens.card }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6, fontFamily: bFont, textAlign: align }}>
              {t("Your courses", "مقرراتك")}
            </div>
            {invite.courses.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 13, color: tokens.textPrimary, fontFamily: bFont }}>
                <IconBookOpen size={13} color={tokens.primary} />
                {c.code && <b dir="ltr" style={{ fontWeight: 650 }}>{c.code}</b>} {c.title}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={label}>{t("Email", "البريد")}</label>
          <input style={{ ...input, color: tokens.textMuted }} value={invite.email} readOnly dir="ltr" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={label}>{t("First name", "الاسم الأول")}</label>
            <input style={input} value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
          </div>
          <div>
            <label style={label}>{t("Last name", "اسم العائلة")}</label>
            <input style={input} value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={label}>{t("Choose a password", "اختار كلمة سر")}</label>
          <div style={{ position: "relative" }}>
            <input style={{ ...input, paddingInlineEnd: 40 }} type={show ? "text" : "password"} dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="••••••••" />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? t("Hide password", "إخفاء كلمة السر") : t("Show password", "إظهار كلمة السر")}
              style={{ position: "absolute", insetInlineEnd: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: tokens.textMuted, padding: 0, display: "flex" }}>
              {show ? <IconEyeOff size={15} /> : <IconEye size={15} />}
            </button>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={label}>{t("Type it again", "اكتبها تاني")}</label>
          <input style={input} type={show ? "text" : "password"} dir="ltr" value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void submit(); }} autoComplete="new-password" placeholder="••••••••" />
          <div style={{ fontSize: 11.5, color: tokens.textFaint, marginTop: 6, fontFamily: bFont, textAlign: align }}>{t("At least 8 characters, with a letter and a number.", "8 أحرف على الأقل، فيها حرف ورقم.")}</div>
        </div>
        {error && (
          <div role="alert" style={{ marginBottom: 12, padding: "9px 12px", borderRadius: 8, fontSize: 12.5, fontFamily: bFont, lineHeight: 1.5, textAlign: align, border: `1px solid ${state.dark ? "rgba(255,120,120,0.35)" : "rgba(200,60,60,0.25)"}`, background: state.dark ? "rgba(255,90,90,0.12)" : "rgba(220,60,60,0.07)", color: state.dark ? "#FF9D9D" : "#B42318" }}>
            {error}
          </div>
        )}
        <button type="button" onClick={() => void submit()} disabled={busy} style={primary}>
          {busy ? t("Creating your account…", "بنعمل حسابك…") : t("Create my account", "اعمل حسابي")}
        </button>
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: tokens.textMuted, fontFamily: bFont }}>
          {t("Already have an account?", "عندك حساب؟")} <button type="button" onClick={toLogin} style={link}>{t("Sign in", "تسجيل الدخول")}</button>
        </p>
      </>
    );
  }

  return (
    <AuthLayout
      dark={state.dark}
      lang={lang}
      dispatch={dispatch}
      title={invite?.institutionName ? t(`${invite.institutionName} is waiting for you.`, `${invite.institutionName} مستنياك.`) : t("You're invited.", "إنت مدعو.")}
      subtitle={t("One password and you're in: your courses, the smart tutor and your progress in one place.", "كلمة سر واحدة وتدخل: مقرراتك والمعلم الذكي وتقدّمك في مكان واحد.")}
      hero={null}
      form={form}
    />
  );
}
