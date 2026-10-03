import { useEffect, useState } from "react";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { stopRemindersFromLink } from "@/services/sanad";
import { SanadMark } from "./SanadKit";

/** Opened from the "Stop reminders" link in a Plany email. No sign-in needed. */
export default function StopRemindersPage({ state, token, onDone }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const [status, setStatus] = useState("working");

  useEffect(() => {
    let alive = true;
    stopRemindersFromLink(token).then(() => alive && setStatus("done")).catch(() => alive && setStatus("invalid"));
    return () => { alive = false; };
  }, [token]);

  const title = status === "working" ? t("One moment…", "لحظة واحدة…") : status === "done" ? t("Study reminders are off", "تم إيقاف تذكير المذاكرة") : t("This link is not valid", "الرابط ده مش صالح");
  const text = status === "done"
    ? t("You won't get study reminder emails anymore. You can turn them back on any time from Profile > Preferences.", "مش هتوصلك إيميلات تذكير المذاكرة تاني. تقدر ترجّعها في أي وقت من البروفايل ← التفضيلات.")
    : status === "invalid" ? t("Sign in and change reminders from Profile > Preferences.", "سجّل دخول وغيّر التذكير من البروفايل ← التفضيلات.") : "";

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: tokens.bg, padding: 20 }}>
      <div className="sanad-rise" style={{ maxWidth: 440, width: "100%", background: tokens.card, border: `1px solid ${tokens.cardBorder}`, borderRadius: 20, padding: 30, textAlign: "center", boxShadow: "0 18px 50px rgba(15,30,60,0.10)" }}>
        <div className={status === "working" ? "sanad-pulse" : undefined} style={{ display: "inline-flex", marginBottom: 16 }}><SanadMark size={52} dark={state.dark} /></div>
        <h1 style={{ fontFamily: headingFont(lang), fontSize: 21, fontWeight: 800, color: tokens.textPrimary, margin: "0 0 10px" }}>{title}</h1>
        {text ? <p style={{ fontFamily: bodyFont(lang), fontSize: 14, color: tokens.textSecondary, lineHeight: 1.7, margin: "0 0 22px" }}>{text}</p> : null}
        {status !== "working" ? (
          <button type="button" onClick={onDone} style={{ border: "none", cursor: "pointer", background: tokens.primaryBtn, color: "#fff", fontFamily: bodyFont(lang), fontWeight: 700, fontSize: 14, padding: "11px 22px", borderRadius: 12 }}>
            {t("Open Lerna", "افتح Lerna")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
