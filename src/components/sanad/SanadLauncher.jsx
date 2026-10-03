import { useEffect, useRef, useState } from "react";
import { tk, bodyFont, headingFont } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import useMediaQuery from "@/hooks/useMediaQuery";
import { apiErrorText } from "@/services/http";
import { sanadChat, createStudyPlan } from "@/services/sanad";
import { IconX, IconSend, IconSendRtl, IconArrowRight, IconArrowLeft } from "@/components/Icons";
import { SanadMark, SButton, AutoText, tr, SANAD_NAME } from "./SanadKit";
import { PlanBuilder } from "@/pages/SanadPage";

const SUGGESTIONS = {
  en: ["I have an exam next week, where do I start?", "What should I study today?", "How am I doing?"],
  ar: ["عندي امتحان الأسبوع الجاي، أبدأ منين؟", "أذاكر إيه النهارده؟", "أنا عامل إيه في المذاكرة؟"],
};

/** Floating Sanad button + chat panel, available on every student page. */
export default function SanadLauncher({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = tr(lang);
  const font = bodyFont(lang);
  const hFont = headingFont(lang);
  const mobile = useMediaQuery("(max-width: 640px)");
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [building, setBuilding] = useState(false);
  const endRef = useRef(null);
  const Send = lang === "ar" ? IconSendRtl : IconSend;
  const Arrow = lang === "ar" ? IconArrowLeft : IconArrowRight;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, open]);

  const courseId = [SCREENS.STUDENT_COURSE].includes(state.screen) ? state.courseId : undefined;

  async function send(message) {
    const msg = (message ?? text).trim();
    if (!msg || busy) return;
    setText("");
    const history = messages.map((m) => ({ role: m.role, text: m.text })).slice(-8);
    setMessages((list) => [...list, { role: "student", text: msg }]);
    setBusy(true);
    try {
      const r = await sanadChat({ message: msg, history, courseId, language: lang });
      setMessages((list) => [...list, { role: "sanad", text: r.reply, action: r.action, courses: r.courses }]);
    } catch (e) {
      setMessages((list) => [...list, { role: "sanad", text: apiErrorText(e, lang), error: true }]);
    } finally {
      setBusy(false);
    }
  }

  function go(screen, extra = {}) {
    setOpen(false);
    dispatch({ type: "NAVIGATE", screen, ...extra });
  }

  async function build(form) {
    setBuilding(true);
    try {
      const plan = await createStudyPlan({ ...form, language: lang });
      setMessages((list) => [...list, { role: "sanad", text: t("Your plan is ready. Let's start.", "خطتك جاهزة. يلا نبدأ.") }]);
      go(SCREENS.SANAD, { planId: plan.id, courseId: plan.courseId });
    } catch (e) {
      setMessages((list) => [...list, { role: "sanad", text: apiErrorText(e, lang), error: true }]);
    } finally {
      setBuilding(false);
    }
  }

  function Action({ m }) {
    const a = m.action;
    if (!a) return null;
    if (a.type === "propose_plan" && m.courses?.length) {
      return (
        <div style={{ marginTop: 10, background: tokens.card, border: `1px solid ${tokens.cardBorder}`, borderRadius: 14, padding: 14 }}>
          <PlanBuilder compact courses={m.courses} initial={{ courseId: a.courseId, examDate: a.examDate, dailyMinutes: a.dailyMinutes }} tokens={tokens} font={font} lang={lang} onBuild={build} busy={building} />
        </div>
      );
    }
    if (a.type === "open_plan") {
      return <div style={{ marginTop: 10 }}><SButton kind="soft" tokens={tokens} font={font} icon={<Arrow size={15} />} onClick={() => go(SCREENS.SANAD, { planId: a.planId, courseId: a.courseId })}>{t("Open my plan", "افتح خطتي")}</SButton></div>;
    }
    if (a.type === "open") {
      const toTutor = a.screen === "tutor";
      return <div style={{ marginTop: 10 }}><SButton kind="soft" tokens={tokens} font={font} icon={<Arrow size={15} />} onClick={() => go(toTutor ? SCREENS.TUTOR : SCREENS.MASTERY, { courseId: a.courseId || state.courseId })}>{toTutor ? t("Ask the AI Tutor", "اسأل المعلم الذكي") : t("Open My Progress", "افتح تقدّمي")}</SButton></div>;
    }
    return null;
  }

  if (state.screen === SCREENS.SANAD) return null;

  return (
    <>
      {open ? (
        <div role="dialog" aria-label={t("Sanad", "سند")} className="sanad-rise" style={{ position: "fixed", zIndex: 70, insetInlineEnd: mobile ? 0 : 24, bottom: mobile ? 0 : 96, width: mobile ? "100%" : 390, height: mobile ? "100%" : "min(620px, calc(100vh - 130px))", background: tokens.bg, borderRadius: mobile ? 0 : 20, border: `1px solid ${tokens.cardBorder}`, boxShadow: "0 24px 70px rgba(10,20,40,0.28)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: tokens.card, borderBottom: `1px solid ${tokens.cardBorder}` }}>
            <SanadMark size={36} dark={state.dark} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: hFont, fontSize: 15.5, fontWeight: 800, color: tokens.textPrimary }}>{lang === "ar" ? SANAD_NAME.ar : SANAD_NAME.en}</div>
              <div style={{ fontFamily: font, fontSize: 12, color: tokens.textMuted }}>{t("Your study coach", "مدرّب المذاكرة بتاعك")}</div>
            </div>
            <button type="button" title={t("Open Sanad page", "افتح صفحة سند")} aria-label={t("Open Sanad page", "افتح صفحة سند")} onClick={() => go(SCREENS.SANAD, { planId: undefined })} style={{ border: `1px solid ${tokens.cardBorder}`, background: tokens.card, color: tokens.textSecondary, borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Arrow size={15} /></button>
            <button type="button" aria-label={t("Close", "إغلاق")} onClick={() => setOpen(false)} style={{ border: `1px solid ${tokens.cardBorder}`, background: tokens.card, color: tokens.textSecondary, borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><IconX size={15} /></button>
          </header>

          <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.length === 0 ? (
              <div>
                <div style={{ background: tokens.card, border: `1px solid ${tokens.cardBorder}`, borderRadius: 16, padding: 16 }}>
                  <div style={{ fontFamily: hFont, fontSize: 16, fontWeight: 700, color: tokens.textPrimary, marginBottom: 6 }}>{t(`Hi ${state.user?.firstName ?? ""}, I'm Sanad.`, `أهلاً ${state.user?.firstName ?? ""}، أنا سند.`)}</div>
                  <div style={{ fontFamily: font, fontSize: 13.5, color: tokens.textSecondary, lineHeight: 1.65 }}>{t("Tell me about your next exam. I'll look at your results, plan your days, teach what's missing and change the plan when something isn't working.", "قولّي على امتحانك الجاي. هبص على نتايجك، وأرتّب أيامك، وأشرحلك الناقص، وأغيّر الخطة لما حاجة ما تمشيش.")}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                  {SUGGESTIONS[lang === "ar" ? "ar" : "en"].map((s) => (
                    <button key={s} type="button" onClick={() => send(s)} style={{ textAlign: "start", padding: "10px 14px", borderRadius: 12, border: `1px solid ${tokens.citationBorder}`, background: tokens.primaryLight, color: tokens.primary, fontFamily: font, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>{s}</button>
                  ))}
                </div>
              </div>
            ) : null}
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 8, justifyContent: m.role === "student" ? "flex-end" : "flex-start", alignItems: "flex-start" }}>
                {m.role === "sanad" ? <SanadMark size={26} radius={8} dark={state.dark} /> : null}
                <div style={{ maxWidth: "84%" }}>
                  <AutoText style={{ padding: "10px 13px", borderRadius: 14, fontFamily: font, fontSize: 14, lineHeight: 1.6, background: m.role === "student" ? tokens.primaryBtn : tokens.card, color: m.role === "student" ? "#fff" : m.error ? "#B42318" : tokens.textPrimary, border: m.role === "student" ? "none" : `1px solid ${tokens.cardBorder}` }}>{m.text}</AutoText>
                  {m.role === "sanad" ? <Action m={m} /> : null}
                </div>
              </div>
            ))}
            {busy ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <SanadMark size={26} radius={8} dark={state.dark} />
                <span className="sanad-dots" style={{ fontFamily: font, fontSize: 13, color: tokens.textMuted }}>{t("Sanad is thinking", "سند بيفكّر")}</span>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); void send(); }} style={{ display: "flex", gap: 8, padding: 12, background: tokens.card, borderTop: `1px solid ${tokens.cardBorder}` }}>
            <input value={text} onChange={(e) => setText(e.target.value)} dir="auto" placeholder={t("Message Sanad…", "اكتب لسند…")} maxLength={1000} style={{ flex: 1, minWidth: 0, padding: "11px 13px", borderRadius: 12, border: `1px solid ${tokens.cardBorder}`, background: tokens.bg, color: tokens.textPrimary, fontFamily: font, fontSize: 14, outline: "none" }} />
            <button type="submit" aria-label={t("Send", "إرسال")} disabled={busy || !text.trim()} style={{ width: 44, borderRadius: 12, border: "none", background: tokens.primaryBtn, color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", opacity: busy || !text.trim() ? 0.55 : 1 }}><Send size={17} color="#fff" /></button>
          </form>
        </div>
      ) : null}

      {!(open && mobile) ? (
        <button type="button" onClick={() => setOpen((o) => !o)} aria-label={open ? t("Close Sanad", "اقفل سند") : t("Ask Sanad", "اسأل سند")} className="sanad-fab"
          style={{ position: "fixed", zIndex: 71, insetInlineEnd: mobile ? 16 : 24, bottom: mobile ? 16 : 24, height: 56, padding: open ? 0 : "0 20px 0 8px", width: open ? 56 : undefined, borderRadius: 28, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #163F8A 0%, #1B4DA8 45%, #3D66D6 100%)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 12px 30px rgba(27,77,168,0.42)" }}>
          {open ? <IconX size={20} color="#fff" /> : (
            <>
              <span style={{ width: 40, height: 40, borderRadius: 20, background: "rgba(255,255,255,0.16)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><SanadMark size={34} flat={false} radius={17} /></span>
              <span style={{ fontFamily: hFont, fontSize: 14.5, fontWeight: 750 }}>{t("Ask Sanad", "اسأل سند")}</span>
            </>
          )}
        </button>
      ) : null}
    </>
  );
}
