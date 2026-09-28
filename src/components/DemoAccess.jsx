import { useState } from "react";
import { tk, bodyFont, headingFont } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, DEMO_GUIDE_KEY, SHOW_DEMO_ACCOUNTS, demoAccountById } from "@/constants/demoAccounts";
import { login, signOut } from "@/services/auth";
import { apiErrorText } from "@/services/http";
import { homeScreenFor } from "@/utils";
import { IconProfile, IconClipboard, IconShield, IconChevronDown, IconX, IconArrowRight, IconArrowLeft } from "@/components/Icons";

function IconCap({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5Z" />
      <path d="M6 11.5V16c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5v-4.5" />
      <path d="M22 9.5V14" />
    </svg>
  );
}

const ICONS = {
  personal: (s) => <IconProfile size={s} />,
  university: (s) => <IconCap size={s} />,
  instructor: (s) => <IconClipboard size={s} />,
  admin: (s) => <IconShield size={s} />,
};

function tint(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/**
 * Sign-in page panel: one click signs in as a ready-made account.
 * Students are split into two clearly different cards (personal vs university).
 */
export function DemoAccessPanel({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const bFont = bodyFont(lang);
  const t = (en, ar) => (isRtl ? ar : en);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  if (!SHOW_DEMO_ACCOUNTS) return null;

  const enter = async (account) => {
    if (busyId) return;
    setBusyId(account.id);
    setError("");
    try {
      const user = await login(account.email, DEMO_PASSWORD, state.role);
      sessionStorage.setItem(DEMO_GUIDE_KEY, account.id);
      dispatch({ type: "SET_USER", user });
      dispatch({ type: "NAVIGATE", screen: homeScreenFor(user.role) });
    } catch (err) {
      setError(apiErrorText(err, lang));
    } finally {
      setBusyId(null);
    }
  };

  const students = DEMO_ACCOUNTS.filter((a) => a.id === "personal" || a.id === "university");
  const staff = DEMO_ACCOUNTS.filter((a) => a.id === "instructor" || a.id === "admin");

  const Card = ({ account, wide }) => {
    const busy = busyId === account.id;
    return (
      <button
        type="button"
        onClick={() => void enter(account)}
        disabled={Boolean(busyId)}
        title={account.email}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          width: "100%",
          padding: wide ? "10px 12px" : "9px 11px",
          borderRadius: 10,
          border: `1px solid ${tokens.cardBorder}`,
          borderInlineStart: `3px solid ${account.accent}`,
          background: tokens.card ?? tokens.inset,
          color: tokens.textPrimary,
          cursor: busyId ? "default" : "pointer",
          opacity: busyId && !busy ? 0.55 : 1,
          textAlign: isRtl ? "right" : "left",
          fontFamily: bFont,
          transition: "border-color 150ms ease, transform 150ms ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
      >
        <span style={{ flex: "0 0 auto", width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", background: tint(account.accent, state.dark ? 0.22 : 0.1), color: state.dark ? "#fff" : account.accent }}>
          {ICONS[account.id](15)}
        </span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: "block", fontSize: 12.5, fontWeight: 650, lineHeight: 1.3 }}>
            {busy ? t("Opening…", "بيفتح…") : t(account.en, account.ar)}
          </span>
          <span style={{ display: "block", fontSize: 10.5, color: tokens.textMuted, marginTop: 2, lineHeight: 1.35 }}>
            {t(account.tagEn, account.tagAr)}
          </span>
        </span>
      </button>
    );
  };

  const groupLabel = { fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: tokens.textFaint, margin: "0 0 6px", textAlign: isRtl ? "right" : "left" };

  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ flex: 1, height: 1, background: tokens.cardBorder }} />
        <span style={{ fontSize: 11.5, color: tokens.textMuted, fontFamily: bFont, whiteSpace: "nowrap" }}>{t("or explore with a demo account", "أو جرّب بحساب تجريبي")}</span>
        <span style={{ flex: 1, height: 1, background: tokens.cardBorder }} />
      </div>
      <div style={groupLabel}>{t("Students", "الطلاب")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        {students.map((a) => <Card key={a.id} account={a} />)}
      </div>
      <div style={groupLabel}>{t("University staff", "فريق الجامعة")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {staff.map((a) => <Card key={a.id} account={a} />)}
      </div>
      {error && <div role="alert" style={{ marginTop: 10, fontSize: 12, color: state.dark ? "#FF9D9D" : "#B42318", fontFamily: bFont, textAlign: isRtl ? "right" : "left" }}>{error}</div>}
    </div>
  );
}

/**
 * Small guide shown inside the app after a demo sign-in: who you are,
 * what this account is for, and 4 things to try (each one is a link).
 */
export function DemoGuide({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const t = (en, ar) => (isRtl ? ar : en);
  const [accountId, setAccountId] = useState(() => (typeof sessionStorage !== "undefined" ? sessionStorage.getItem(DEMO_GUIDE_KEY) : null));
  const [open, setOpen] = useState(true);
  const account = demoAccountById(accountId);
  if (!SHOW_DEMO_ACCOUNTS || !account || state.user?.email !== account.email) return null;

  const close = () => { sessionStorage.removeItem(DEMO_GUIDE_KEY); setAccountId(null); };
  const switchAccount = () => {
    sessionStorage.removeItem(DEMO_GUIDE_KEY);
    signOut();
    dispatch({ type: "RESET" });
    dispatch({ type: "NAVIGATE", screen: SCREENS.LOGIN });
  };
  const Arrow = isRtl ? IconArrowLeft : IconArrowRight;

  return (
    <div style={{ borderBottom: `1px solid ${tokens.cardBorder}`, background: tint(account.accent, state.dark ? 0.12 : 0.05), fontFamily: bodyFont(lang) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 20px", flexWrap: "wrap" }}>
        <span style={{ width: 24, height: 24, borderRadius: 7, display: "grid", placeItems: "center", background: tint(account.accent, state.dark ? 0.3 : 0.14), color: state.dark ? "#fff" : account.accent }}>
          {ICONS[account.id](13)}
        </span>
        <span style={{ fontSize: 13, color: tokens.textPrimary, fontWeight: 600, fontFamily: headingFont(lang) }}>
          {t("Demo", "تجربة")}: {t(account.en, account.ar)}
        </span>
        <span style={{ fontSize: 12.5, color: tokens.textMuted, flex: "1 1 220px" }}>{t(account.descEn, account.descAr)}</span>
        <button type="button" onClick={switchAccount} style={{ background: "none", border: `1px solid ${tokens.cardBorder}`, borderRadius: 8, padding: "5px 10px", fontSize: 12, color: tokens.textPrimary, cursor: "pointer", fontFamily: "inherit" }}>
          {t("Switch account", "بدّل الحساب")}
        </button>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-label={open ? t("Collapse", "تصغير") : t("Expand", "تكبير")} aria-expanded={open}
          style={{ background: "none", border: "none", cursor: "pointer", color: tokens.textMuted, padding: 4, display: "flex", transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms ease" }}>
          <IconChevronDown size={15} />
        </button>
        <button type="button" onClick={close} aria-label={t("Hide guide", "إخفاء الدليل")} style={{ background: "none", border: "none", cursor: "pointer", color: tokens.textMuted, padding: 4, display: "flex" }}>
          <IconX size={14} />
        </button>
      </div>
      {open && (
        <div style={{ display: "flex", gap: 8, padding: "0 20px 11px", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11.5, color: tokens.textMuted, alignSelf: "center", marginInlineEnd: 2 }}>{t("Try:", "جرّب:")}</span>
          {account.steps.map((step, i) => {
            const active = state.screen === step.screen;
            return (
              <button key={i} type="button" onClick={() => dispatch({ type: "NAVIGATE", screen: step.screen })}
                style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 10px", borderRadius: 999, border: `1px solid ${active ? account.accent : tokens.cardBorder}`, background: tokens.card ?? tokens.bg, color: tokens.textPrimary, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                <span style={{ width: 17, height: 17, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700, background: account.accent, color: "#fff" }}>{i + 1}</span>
                {t(step.en, step.ar)}
                <Arrow size={11} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
