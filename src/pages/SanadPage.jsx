import { useCallback, useEffect, useMemo, useState } from "react";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import useMediaQuery from "@/hooks/useMediaQuery";
import { apiErrorText } from "@/services/http";
import { getReminderSettings, getSanadOverview, getStudyPlan, createStudyPlan, replanStudyPlan, stopStudyPlan, sanadChat, localToday, addDays, daysUntil } from "@/services/sanad";
import { IconCheck, IconClock, IconPlus, IconArrowRight, IconArrowLeft, IconRefresh, IconSend, IconSendRtl, IconWarning } from "@/components/Icons";
import { DurationInput, formatTime12 } from "@/components/sanad/TimeInputs";
import SanadTaskRunner from "@/components/sanad/SanadTaskRunner";
import { SanadMark, SButton, Panel, SectionTitle, Ring, TaskIcon, TASK_META, LEVEL_META, formatDay, sanadGradient, AutoText, tr } from "@/components/sanad/SanadKit";

const STEPS = [
  { en: "Understand", ar: "يفهم", den: "Your exam, your time.", dar: "امتحانك ووقتك." },
  { en: "Diagnose", ar: "يشخّص", den: "Reads your real answers.", dar: "بيقرا إجاباتك الحقيقية." },
  { en: "Plan", ar: "يخطّط", den: "Builds your days.", dar: "بيرتّب أيامك." },
  { en: "Teach", ar: "يشرح", den: "Lessons at your level.", dar: "شرح على قد مستواك." },
  { en: "Test", ar: "يختبر", den: "Questions on weak points.", dar: "أسئلة على نقط ضعفك." },
  { en: "Adapt", ar: "يعدّل", den: "Changes when you struggle.", dar: "بيغيّر لما تتعثّر." },
  { en: "Re-check", ar: "يتأكد", den: "Proves the gap is closed.", dar: "بيتأكد إن الفجوة اتقفلت." },
];

const BUILD_STEPS = {
  en: ["Reading your answers in every topic", "Finding your weak points", "Ordering topics so each one builds on the last", "Fitting it into your days"],
  ar: ["بقرا إجاباتك في كل موضوع", "بحدد نقط ضعفك", "برتّب المواضيع كل واحد يبني على اللي قبله", "بوزّعها على أيامك"],
};


function Building({ tokens, font, hFont, lang }) {
  const steps = BUILD_STEPS[lang === "ar" ? "ar" : "en"];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => Math.min(n + 1, steps.length - 1)), 2600);
    return () => clearInterval(id);
  }, [steps.length]);
  return (
    <Panel tokens={tokens} padding={36} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 20 }}>
      <div className="sanad-pulse"><SanadMark size={64} /></div>
      <h2 style={{ margin: 0, fontFamily: hFont, fontSize: 20, color: tokens.textPrimary }}>{lang === "ar" ? "بلاني بيجهّز خطتك" : "Plany is building your plan"}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "start" }}>
        {steps.map((s, n) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: font, fontSize: 14.5, color: n <= i ? tokens.textPrimary : tokens.textFaint, transition: "color 300ms" }}>
            <span style={{ width: 20, height: 20, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", background: n < i ? tokens.primary : n === i ? tokens.primaryLight : tokens.inset, border: `1px solid ${n <= i ? tokens.primary : tokens.cardBorder}` }}>
              {n < i ? <IconCheck size={12} color="#fff" /> : null}
            </span>
            {s}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function fieldStyle(tokens, font) {
  return { width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: 11, border: `1px solid ${tokens.cardBorder}`, background: tokens.card, color: tokens.textPrimary, fontFamily: font, fontSize: 14, outline: "none" };
}

/** The plan form: course, exam date, daily time, optional goal. */
export function PlanBuilder({ courses, initial = {}, tokens, font, lang, onBuild, busy, compact = false }) {
  const t = tr(lang);
  const [courseId, setCourseId] = useState(initial.courseId || courses[0]?.id || "");
  const [examDate, setExamDate] = useState(initial.examDate || addDays(localToday(), 7));
  const [minutes, setMinutes] = useState(initial.dailyMinutes || 60);
  const [goal, setGoal] = useState("");
  useEffect(() => { if (!courseId && courses[0]) setCourseId(courses[0].id); }, [courses, courseId]);
  const days = daysUntil(examDate);
  const label = (s) => <label style={{ display: "block", fontFamily: font, fontSize: 12.5, fontWeight: 650, color: tokens.textSecondary, marginBottom: 6 }}>{s}</label>;
  if (!courses.length) {
    return <div style={{ fontFamily: font, fontSize: 14, color: tokens.textMuted, lineHeight: 1.6 }}>{t("Join or add a course first, then Plany can plan for its exam.", "انضم لمادة أو ضيف مادة الأول، وبعدها بلاني يقدر يخطط لامتحانها.")}</div>;
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (minutes) onBuild({ courseId, examDate, dailyMinutes: minutes, goal }); }} style={{ display: "flex", flexDirection: "column", gap: compact ? 12 : 16 }}>
      <div>
        {label(t("Course", "المادة"))}
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)} style={fieldStyle(tokens, font)}>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.code ? `${c.code} · ${c.title}` : c.title}</option>)}
        </select>
      </div>
      <div>
        {label(t("Exam date", "ميعاد الامتحان"))}
        <input type="date" value={examDate} min={localToday()} onChange={(e) => setExamDate(e.target.value)} style={fieldStyle(tokens, font)} />
        <div style={{ fontFamily: font, fontSize: 12, color: tokens.textMuted, marginTop: 5 }}>
          {days <= 0 ? t("Today: Plany will make a one-day plan.", "النهارده: بلاني هيعمل خطة يوم واحد.") : t(`${days} day${days === 1 ? "" : "s"} from today`, `بعد ${days} يوم`)}
        </div>
      </div>
      <div>
        {label(t("Time each day", "وقتك كل يوم"))}
        <DurationInput value={minutes} onChange={setMinutes} tokens={tokens} font={font} lang={lang} />
      </div>
      {!compact ? (
        <div>
          {label(t("Anything Plany should know? (optional)", "حاجة عايز بلاني يعرفها؟ (اختياري)"))}
          <input value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={300} placeholder={t("e.g. the exam is mostly problem solving", "مثلاً: الامتحان أغلبه مسائل")} style={fieldStyle(tokens, font)} dir="auto" />
        </div>
      ) : null}
      <SButton type="submit" tokens={tokens} font={font} disabled={busy || !courseId || !examDate || !minutes} full>{busy ? t("Building…", "بجهّز…") : t("Build my plan", "اعمل خطتي")}</SButton>
    </form>
  );
}

function Intro({ dark, courses, initialCourseId, tokens, font, hFont, lang, mobile, onBuild, busy, error, onAsk }) {
  const t = tr(lang);
  const [text, setText] = useState("");
  const [reply, setReply] = useState(null);
  const [asking, setAsking] = useState(false);
  const [prefill, setPrefill] = useState({ courseId: initialCourseId });
  const [formKey, setFormKey] = useState(0);
  const Send = lang === "ar" ? IconSendRtl : IconSend;

  async function ask(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setAsking(true);
    try {
      const r = await sanadChat({ message: text.trim(), courseId: initialCourseId, language: lang });
      setReply(r.reply);
      if (r.action?.type === "propose_plan") {
        setPrefill({ courseId: r.action.courseId || initialCourseId, examDate: r.action.examDate, dailyMinutes: r.action.dailyMinutes });
        setFormKey((k) => k + 1);
      } else onAsk?.(r.action);
    } catch (err) {
      setReply(apiErrorText(err, lang));
    } finally {
      setAsking(false);
    }
  }

  return (
    <>
      <section style={{ position: "relative", overflow: "hidden", borderRadius: 24, background: sanadGradient(dark), color: "#fff", padding: mobile ? "28px 22px" : "44px 44px", display: "grid", gridTemplateColumns: mobile ? "1fr" : "1.15fr 0.85fr", gap: mobile ? 24 : 40, alignItems: "center" }}>
        <svg aria-hidden="true" width="520" height="520" viewBox="0 0 520 520" style={{ position: "absolute", insetInlineEnd: -140, top: -160, opacity: 0.12, pointerEvents: "none" }}>
          <circle cx="260" cy="260" r="250" stroke="#fff" strokeWidth="1.5" fill="none" />
          <circle cx="260" cy="260" r="180" stroke="#fff" strokeWidth="1.5" fill="none" />
          <circle cx="260" cy="260" r="110" stroke="#fff" strokeWidth="1.5" fill="none" />
        </svg>
        <div style={{ position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.14)", borderRadius: 999, padding: "6px 14px 6px 6px", marginBottom: 18 }}>
            <SanadMark size={28} radius={14} flat={false} />
            <span style={{ fontFamily: font, fontSize: 13, fontWeight: 650 }}>{t("Plany · your study coach", "بلاني · مدرّب المذاكرة بتاعك")}</span>
          </div>
          <h1 style={{ margin: 0, fontFamily: hFont, fontSize: mobile ? 28 : 38, lineHeight: 1.15, fontWeight: 800, letterSpacing: "-0.02em" }}>
            {t("Tell Plany about your exam. Get a plan that changes with you.", "قول لبلاني على امتحانك. وخد خطة بتتغيّر معاك.")}
          </h1>
          <p style={{ fontFamily: font, fontSize: 15.5, lineHeight: 1.7, opacity: 0.92, margin: "16px 0 22px", maxWidth: 560 }}>
            {t(
              "Plany looks at how you actually answered in every topic, builds your days to the exam, teaches what you are missing, tests you, and changes the plan the moment something is not working.",
              "بلاني بيبص على إجاباتك الفعلية في كل موضوع، ويرتّب أيامك لحد الامتحان، ويشرحلك اللي ناقصك، ويختبرك، ويغيّر الخطة أول ما حاجة ما تمشيش.",
            )}
          </p>
          <form onSubmit={ask} style={{ display: "flex", gap: 8, background: "#fff", borderRadius: 14, padding: 6, maxWidth: 560 }}>
            <input value={text} onChange={(e) => setText(e.target.value)} dir="auto" placeholder={t("e.g. My Algorithms exam is in a week and I don't know where to start", "مثلاً: عندي امتحان بعد أسبوع ومش عارف أبدأ منين")} style={{ flex: 1, border: "none", outline: "none", fontFamily: font, fontSize: 14, padding: "8px 10px", color: "#0D1A2E", background: "transparent", minWidth: 0 }} />
            <button type="submit" aria-label={t("Send", "إرسال")} disabled={asking} style={{ width: 40, height: 40, borderRadius: 10, border: "none", background: "#1B4DA8", color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", opacity: asking ? 0.6 : 1 }}><Send size={17} color="#fff" /></button>
          </form>
          {reply ? (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 12, maxWidth: 560, background: "rgba(255,255,255,0.14)", borderRadius: 12, padding: "10px 12px" }}>
              <SanadMark size={22} radius={7} flat={false} />
              <AutoText style={{ fontFamily: font, fontSize: 14, lineHeight: 1.6 }}>{reply}</AutoText>
            </div>
          ) : null}
        </div>
        <div style={{ position: "relative", background: tokens.card, color: tokens.textPrimary, borderRadius: 18, padding: 22, boxShadow: "0 20px 50px rgba(8,20,50,0.25)" }}>
          <div style={{ fontFamily: hFont, fontSize: 16, fontWeight: 700, marginBottom: 14 }}>{t("Plan my exam", "خطّط لامتحاني")}</div>
          {error ? <div style={{ display: "flex", gap: 8, color: "#B42318", fontFamily: font, fontSize: 13, marginBottom: 12 }}><IconWarning size={16} color="#B42318" />{error}</div> : null}
          <PlanBuilder key={formKey} courses={courses} initial={prefill} tokens={tokens} font={font} lang={lang} onBuild={onBuild} busy={busy} />
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <SectionTitle tokens={tokens} font={hFont}>{t("How Plany works", "بلاني بيشتغل إزاي")}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(7, 1fr)", gap: 10 }}>
          {STEPS.map((s, i) => (
            <div key={s.en} style={{ background: tokens.card, border: `1px solid ${tokens.cardBorder}`, borderRadius: 14, padding: "14px 14px 16px", position: "relative" }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: tokens.primaryLight, color: tokens.primary, fontFamily: hFont, fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>{i + 1}</div>
              <div style={{ fontFamily: hFont, fontSize: 14.5, fontWeight: 700, color: tokens.textPrimary }}>{lang === "ar" ? s.ar : s.en}</div>
              <div style={{ fontFamily: font, fontSize: 12.5, color: tokens.textMuted, marginTop: 4, lineHeight: 1.5 }}>{lang === "ar" ? s.dar : s.den}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 22, display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: 14 }}>
        {[
          [t("Built on your real answers", "مبني على إجاباتك الحقيقية"), t("Not a generic timetable. Every day comes from how you did in each topic.", "مش جدول عام. كل يوم جاي من أداءك في كل موضوع.")],
          [t("Changes when you struggle", "بيتغيّر لما تتعثّر"), t("Miss a question on one topic and Plany finds the cause, goes back if needed, and rearranges the next days.", "لو غلطت في موضوع، بلاني بيدوّر على السبب ويرجع لو محتاج ويرتّب الأيام الجاية من جديد.")],
          [t("Proves the gap is closed", "بيتأكد إن الفجوة اتقفلت"), t("Before the exam it asks new questions on the same topics, so you know you are ready.", "قبل الامتحان بيسألك أسئلة جديدة على نفس المواضيع عشان تتأكد إنك جاهز.")],
        ].map(([h, d]) => (
          <Panel key={h} tokens={tokens} padding={20}>
            <div style={{ fontFamily: hFont, fontSize: 15, fontWeight: 700, color: tokens.textPrimary, marginBottom: 6 }}>{h}</div>
            <div style={{ fontFamily: font, fontSize: 13.5, color: tokens.textMuted, lineHeight: 1.65 }}>{d}</div>
          </Panel>
        ))}
      </section>
    </>
  );
}

function TaskRow({ task, tokens, font, lang, onOpen, highlight }) {
  const t = tr(lang);
  const meta = TASK_META[task.type] ?? TASK_META.practice;
  const done = task.status === "done";
  const skipped = task.status === "skipped";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, border: `1px solid ${highlight ? tokens.citationBorder : tokens.cardBorder}`, background: highlight ? tokens.primaryLight : tokens.card, opacity: skipped ? 0.55 : 1 }}>
      {done ? (
        <span style={{ width: 36, height: 36, borderRadius: 11, background: "#0F8A6B", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><IconCheck size={17} color="#fff" /></span>
      ) : <TaskIcon type={task.type} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: font, fontSize: 11.5, fontWeight: 700, color: meta.tone }}>{lang === "ar" ? meta.ar : meta.en}</span>
          <span style={{ fontFamily: font, fontSize: 11.5, color: tokens.textFaint, display: "inline-flex", alignItems: "center", gap: 4 }}><IconClock size={12} />{task.minutes} {t("min", "د")}</span>
          {done && task.result?.score != null ? <span style={{ fontFamily: font, fontSize: 11.5, fontWeight: 700, color: task.result.score >= 0.7 ? "#0F8A6B" : task.result.score >= 0.4 ? "#B4540A" : "#B42318" }}>{Math.round(task.result.score * 100)}%</span> : null}
        </div>
        <AutoText style={{ fontFamily: font, fontSize: 14.5, fontWeight: 650, color: tokens.textPrimary, marginTop: 2, textDecoration: skipped ? "line-through" : "none" }}>{task.title}</AutoText>
        {task.why && !done ? <AutoText style={{ fontFamily: font, fontSize: 12.5, color: tokens.textMuted, marginTop: 3, lineHeight: 1.5 }}>{task.why}</AutoText> : null}
      </div>
      {!skipped ? (
        <SButton kind={done ? "ghost" : highlight ? "primary" : "soft"} tokens={tokens} font={font} onClick={() => onOpen(task)}>
          {done ? t("Open", "افتح") : task.status === "in_progress" ? t("Continue", "كمّل") : t("Start", "ابدأ")}
        </SButton>
      ) : null}
    </div>
  );
}

/** "Email reminders: on, every morning · Change" -> Profile > Preferences. */
function ReminderLine({ tokens, font, lang, onChange }) {
  const t = tr(lang);
  const [s, setS] = useState(null);
  useEffect(() => {
    let alive = true;
    getReminderSettings().then((v) => alive && setS(v)).catch(() => {});
    return () => { alive = false; };
  }, []);
  if (!s) return null;
  const when = t(`every day at ${formatTime12(s.time, lang)}`, `كل يوم الساعة ${formatTime12(s.time, lang)}`);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 14, border: `1px solid ${tokens.cardBorder}`, background: tokens.card }}>
      <span style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: s.enabled ? tokens.primaryLight : tokens.inset, color: s.enabled ? tokens.primary : tokens.textMuted, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><IconClock size={15} /></span>
      <span style={{ flex: 1, fontFamily: font, fontSize: 13, color: tokens.textSecondary, lineHeight: 1.5 }}>
        {s.enabled ? t(`Email reminders are on, ${when}.`, `تذكير الإيميل شغّال، ${when}.`) : t("Email reminders are off.", "تذكير الإيميل مقفول.")}
      </span>
      <button type="button" onClick={onChange} style={{ border: "none", background: "none", cursor: "pointer", color: tokens.primary, fontFamily: font, fontSize: 13, fontWeight: 700, padding: 4 }}>{t("Change", "تغيير")}</button>
    </div>
  );
}

function PlanView({ dark, plan, plans, tokens, font, hFont, lang, mobile, onOpenTask, onSwitch, onNew, onReplan, onStop, busy, lastNote, onReminders }) {
  const t = tr(lang);
  const today = localToday();
  const left = daysUntil(plan.examDate);
  const progress = plan.stats?.total ? plan.stats.done / plan.stats.total : 0;
  const todayDay = plan.days.find((d) => d.date === today) ?? plan.days.find((d) => d.date > today && d.tasks.some((x) => x.status === "pending"));
  const behind = plan.days.filter((d) => d.date < today).flatMap((d) => d.tasks).filter((x) => x.status === "pending" || x.status === "in_progress").length;
  const nextTask = (todayDay?.tasks ?? []).find((x) => x.status === "pending" || x.status === "in_progress");
  const [openDay, setOpenDay] = useState(null);
  const Arrow = lang === "ar" ? IconArrowLeft : IconArrowRight;
  const notes = [...(plan.notes ?? [])].reverse().filter((n) => n.kind !== "created").slice(0, 6);
  const progressRows = (plan.progress ?? []).sort((a, b) => Number(b.focus) - Number(a.focus));

  return (
    <>
      {plans.length > 1 ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {plans.map((p) => (
            <button key={p.id} type="button" onClick={() => onSwitch(p.id)} style={{ padding: "7px 14px", borderRadius: 999, cursor: "pointer", fontFamily: font, fontSize: 13, fontWeight: 650, border: `1px solid ${p.id === plan.id ? tokens.primary : tokens.cardBorder}`, background: p.id === plan.id ? tokens.primaryLight : tokens.card, color: p.id === plan.id ? tokens.primary : tokens.textSecondary }}>{p.courseTitle}</button>
          ))}
        </div>
      ) : null}

      <section style={{ borderRadius: 22, background: sanadGradient(dark), color: "#fff", padding: mobile ? 20 : "26px 30px", display: "flex", gap: 22, alignItems: mobile ? "flex-start" : "center", flexDirection: mobile ? "column" : "row" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <SanadMark size={30} radius={10} />
            <span style={{ fontFamily: font, fontSize: 13, fontWeight: 650, opacity: 0.9 }}>{t("Your plan with Plany", "خطتك مع بلاني")}</span>
            {plan.status === "completed" ? <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 999, padding: "2px 10px", fontFamily: font, fontSize: 12, fontWeight: 700 }}>{t("Completed", "خلصت")}</span> : null}
          </div>
          <h1 style={{ margin: 0, fontFamily: hFont, fontSize: mobile ? 22 : 27, fontWeight: 800, letterSpacing: "-0.02em" }}>{plan.courseTitle}</h1>
          <div style={{ fontFamily: font, fontSize: 14, opacity: 0.9, marginTop: 6 }}>
            {left > 0 ? t(`Exam in ${left} day${left === 1 ? "" : "s"}`, `الامتحان بعد ${left} يوم`) : left === 0 ? t("Exam today", "الامتحان النهارده") : t("Exam date passed", "ميعاد الامتحان عدّى")} · {formatDay(plan.examDate, lang, { weekday: "long", day: "numeric", month: "long" })} · {plan.dailyMinutes} {t("min a day", "دقيقة في اليوم")}
          </div>
          {plan.summary ? <AutoText style={{ fontFamily: font, fontSize: 14.5, lineHeight: 1.7, marginTop: 14, background: "rgba(255,255,255,0.12)", borderRadius: 14, padding: "12px 14px", maxWidth: 720 }}>{plan.summary}</AutoText> : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Ring value={progress} size={92} stroke={8}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: hFont, fontSize: 22, fontWeight: 800 }}>{Math.round(progress * 100)}%</div>
              <div style={{ fontFamily: font, fontSize: 10.5, opacity: 0.85 }}>{plan.stats?.done}/{plan.stats?.total}</div>
            </div>
          </Ring>
        </div>
      </section>

      {lastNote ? (
        <div className="sanad-rise" style={{ display: "flex", gap: 12, alignItems: "flex-start", marginTop: 14, background: tokens.card, border: `1px solid ${tokens.citationBorder}`, borderInlineStart: `4px solid ${tokens.primary}`, borderRadius: 14, padding: "14px 16px" }}>
          <SanadMark size={28} radius={9} />
          <div>
            <div style={{ fontFamily: font, fontSize: 12, fontWeight: 700, color: tokens.primary, marginBottom: 3 }}>{t("Plany updated your plan", "بلاني حدّث خطتك")}</div>
            <AutoText style={{ fontFamily: font, fontSize: 14.5, color: tokens.textPrimary, lineHeight: 1.6 }}>{lastNote.message}</AutoText>
          </div>
        </div>
      ) : null}

      {behind > 0 && plan.status === "active" ? (
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 14, background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 14, padding: "12px 16px" }}>
          <IconWarning size={18} color="#B4540A" />
          <span style={{ flex: 1, fontFamily: font, fontSize: 14, color: "#7C2D12" }}>{t(`${behind} task${behind === 1 ? "" : "s"} from earlier days are not done.`, `${behind} مهمة من الأيام اللي فاتت لسه ما خلصتش.`)}</span>
          <SButton tokens={tokens} font={font} disabled={busy} icon={<IconRefresh size={15} color="#fff" />} onClick={onReplan}>{busy ? t("Rearranging…", "بيترتّب…") : t("Let Plany rearrange", "خلّي بلاني يرتّب")}</SButton>
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "minmax(0, 1.6fr) minmax(0, 1fr)", gap: 18, marginTop: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          <Panel tokens={tokens}>
            <SectionTitle tokens={tokens} font={hFont} aside={todayDay ? <span style={{ fontFamily: font, fontSize: 12.5, color: tokens.textMuted }}>{formatDay(todayDay.date, lang)}</span> : null}>
              {todayDay?.date === today ? t("Today", "النهارده") : t("Next up", "اللي جاي")}
            </SectionTitle>
            {todayDay ? (
              <>
                {todayDay.focus ? <AutoText style={{ fontFamily: font, fontSize: 13.5, color: tokens.textMuted, marginBottom: 12 }}>{todayDay.focus}</AutoText> : null}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {todayDay.tasks.map((x) => <TaskRow key={x.id} task={x} tokens={tokens} font={font} lang={lang} onOpen={onOpenTask} highlight={nextTask?.id === x.id} />)}
                </div>
              </>
            ) : (
              <div style={{ fontFamily: font, fontSize: 14, color: tokens.textMuted, lineHeight: 1.6 }}>{plan.status === "completed" ? t("You finished every task. Good luck in your exam!", "خلّصت كل المهام. بالتوفيق في امتحانك!") : t("Nothing planned for today.", "مفيش حاجة متخططة النهارده.")}</div>
            )}
          </Panel>

          <Panel tokens={tokens}>
            <SectionTitle tokens={tokens} font={hFont}>{t("Your days", "أيامك")}</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {plan.days.map((d, i) => {
                const doneCount = d.tasks.filter((x) => x.status === "done").length;
                const isToday = d.date === today;
                const past = d.date < today;
                const open = openDay === d.id;
                const complete = doneCount === d.tasks.length;
                return (
                  <div key={d.id} style={{ display: "flex", gap: 14 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <span style={{ width: 28, height: 28, borderRadius: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: hFont, fontSize: 12, fontWeight: 800, background: complete ? "#0F8A6B" : isToday ? tokens.primary : tokens.inset, color: complete || isToday ? "#fff" : tokens.textMuted, border: `1px solid ${complete ? "#0F8A6B" : isToday ? tokens.primary : tokens.cardBorder}` }}>
                        {complete ? <IconCheck size={13} color="#fff" /> : i + 1}
                      </span>
                      {i < plan.days.length - 1 ? <span style={{ flex: 1, width: 2, background: tokens.cardBorder, minHeight: 16 }} /> : null}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, paddingBottom: 16 }}>
                      <button type="button" onClick={() => setOpenDay(open ? null : d.id)} style={{ width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "start" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                          <span style={{ fontFamily: font, fontSize: 12, fontWeight: 650, color: isToday ? tokens.primary : tokens.textMuted }}>{isToday ? t("Today", "النهارده") : formatDay(d.date, lang)}</span>
                          <span style={{ fontFamily: font, fontSize: 12, color: tokens.textFaint }}>{doneCount}/{d.tasks.length}</span>
                        </div>
                        <AutoText style={{ fontFamily: hFont, fontSize: 14.5, fontWeight: 700, color: past && !complete ? tokens.textMuted : tokens.textPrimary, marginTop: 2 }}>{d.title || t(`Day ${i + 1}`, `اليوم ${i + 1}`)}</AutoText>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                          {d.tasks.map((x) => {
                            const m = TASK_META[x.type] ?? TASK_META.practice;
                            return <span key={x.id} title={x.title} style={{ fontFamily: font, fontSize: 11.5, fontWeight: 600, padding: "3px 9px", borderRadius: 999, background: x.status === "done" ? "#E7F6F1" : `${m.tone}12`, color: x.status === "done" ? "#0F8A6B" : m.tone, textDecoration: x.status === "skipped" ? "line-through" : "none" }}>{lang === "ar" ? m.ar : m.en} · {x.topicTitle}</span>;
                          })}
                        </div>
                      </button>
                      {open ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                          {d.tasks.map((x) => <TaskRow key={x.id} task={x} tokens={tokens} font={font} lang={lang} onOpen={onOpenTask} />)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          <Panel tokens={tokens}>
            <SectionTitle tokens={tokens} font={hFont}>{t("Closing your gaps", "بنقفل الفجوات")}</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {progressRows.length ? progressRows.map((p) => {
                const now = Math.round((p.score ?? 0) * 100);
                const start = p.scoreAtStart != null ? Math.round(p.scoreAtStart * 100) : null;
                const lm = LEVEL_META[p.level] ?? LEVEL_META.no_evidence;
                const closed = (LEVEL_META[p.level]?.rank ?? 0) >= 3;
                return (
                  <div key={p.topicId}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                      <AutoText style={{ fontFamily: font, fontSize: 13.5, fontWeight: 650, color: tokens.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</AutoText>
                      <span style={{ fontFamily: font, fontSize: 12, fontWeight: 700, color: closed ? "#0F8A6B" : tokens.textMuted, whiteSpace: "nowrap" }}>{lang === "ar" ? lm.ar : lm.en}</span>
                    </div>
                    <div style={{ position: "relative", height: 8, borderRadius: 4, background: tokens.inset }}>
                      {start != null ? <span title={t("Where you started", "بدايتك")} style={{ position: "absolute", insetInlineStart: `${start}%`, top: -3, width: 2, height: 14, background: tokens.textFaint, borderRadius: 1 }} /> : null}
                      <span style={{ position: "absolute", insetInlineStart: 0, top: 0, bottom: 0, width: `${Math.max(now, 2)}%`, borderRadius: 4, background: closed ? "#0F8A6B" : tokens.primary, transition: "width 600ms ease" }} />
                    </div>
                    <div style={{ fontFamily: font, fontSize: 11.5, color: tokens.textFaint, marginTop: 4 }}>
                      {start != null && start !== now ? t(`From ${start}% to ${now}%`, `من ${start}% لـ ${now}%`) : t(`${now}% right so far`, `${now}% صح لحد دلوقتي`)}
                    </div>
                  </div>
                );
              }) : <div style={{ fontFamily: font, fontSize: 13.5, color: tokens.textMuted }}>{t("Your progress shows here as you answer.", "تقدّمك هيظهر هنا وإنت بتجاوب.")}</div>}
            </div>
          </Panel>

          <Panel tokens={tokens}>
            <SectionTitle tokens={tokens} font={hFont}>{t("What Plany changed", "بلاني غيّر إيه")}</SectionTitle>
            {notes.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {notes.map((n, i) => (
                  <div key={i} style={{ display: "flex", gap: 10 }}>
                    <span style={{ marginTop: 6, width: 8, height: 8, borderRadius: 4, background: tokens.primary, flexShrink: 0 }} />
                    <div>
                      <AutoText style={{ fontFamily: font, fontSize: 13.5, color: tokens.textSecondary, lineHeight: 1.6 }}>{n.message}</AutoText>
                      <div style={{ fontFamily: font, fontSize: 11.5, color: tokens.textFaint, marginTop: 2 }}>{new Date(n.at).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div style={{ fontFamily: font, fontSize: 13.5, color: tokens.textMuted, lineHeight: 1.6 }}>{t("After each task, Plany checks your result and adjusts the next days. You will see why here.", "بعد كل مهمة بلاني بيشوف نتيجتك ويظبط الأيام الجاية. هتشوف السبب هنا.")}</div>}
          </Panel>

          {plan.status === "active" ? <ReminderLine tokens={tokens} font={font} lang={lang} onChange={onReminders} /> : null}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <SButton kind="soft" tokens={tokens} font={font} icon={<IconPlus size={15} />} onClick={onNew}>{t("New plan", "خطة جديدة")}</SButton>
            {plan.status === "active" ? <SButton kind="ghost" tokens={tokens} font={font} onClick={onStop}>{t("Stop this plan", "وقّف الخطة دي")}</SButton> : null}
          </div>
          {nextTask ? (
            <button type="button" onClick={() => onOpenTask(nextTask)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, border: "none", cursor: "pointer", background: tokens.primaryBtn, color: "#fff", textAlign: "start", boxShadow: tokens.primaryShadow }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: font, fontSize: 12, opacity: 0.85 }}>{t("Your next step", "خطوتك الجاية")}</div>
                <AutoText style={{ fontFamily: font, fontSize: 14.5, fontWeight: 700 }}>{nextTask.title}</AutoText>
              </div>
              <Arrow size={18} color="#fff" />
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}

export default function SanadPage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = tr(lang);
  const font = bodyFont(lang);
  const hFont = headingFont(lang);
  const mobile = useMediaQuery("(max-width: 860px)");

  const [overview, setOverview] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [runner, setRunner] = useState(null);
  const [lastNote, setLastNote] = useState(null);
  const [busy, setBusy] = useState(false);

  const wantedPlanId = state.planId;
  const wantedCourseId = state.courseId;

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const ov = await getSanadOverview();
      setOverview(ov);
      const active = ov.plans.filter((p) => p.status !== "archived");
      const pick = (wantedPlanId && active.find((p) => p.id === wantedPlanId)) || (wantedCourseId && active.find((p) => p.courseId === wantedCourseId && p.status === "active")) || (!wantedCourseId && active.find((p) => p.status === "active")) || null;
      setPlan(pick ? await getStudyPlan(pick.id) : null);
      if (!pick) setCreating(true);
    } catch (e) {
      setLoadError(apiErrorText(e, lang));
    }
  }, [wantedPlanId, wantedCourseId, lang]);
  useEffect(() => { void load(); }, [load]);

  const plans = useMemo(() => (overview?.plans ?? []).filter((p) => p.status !== "archived"), [overview]);

  async function build(form) {
    setBuilding(true);
    setBuildError(null);
    try {
      const created = await createStudyPlan({ ...form, language: lang });
      setPlan(created);
      setCreating(false);
      setLastNote(null);
      setOverview(await getSanadOverview());
    } catch (e) {
      setBuildError(apiErrorText(e, lang));
    } finally {
      setBuilding(false);
    }
  }

  function onPlanUpdate(next, note, close) {
    setPlan(next);
    if (note) setLastNote(note);
    if (close) setRunner(null);
  }

  async function switchPlan(id) {
    setLastNote(null);
    setPlan(await getStudyPlan(id));
  }

  async function replan() {
    setBusy(true);
    try {
      const r = await replanStudyPlan(plan.id);
      setPlan(r.plan);
      setLastNote(r.note);
    } finally {
      setBusy(false);
    }
  }

  async function stop() {
    if (!window.confirm(t("Stop this plan? You can make a new one any time.", "توقّف الخطة دي؟ تقدر تعمل واحدة جديدة في أي وقت."))) return;
    await stopStudyPlan(plan.id);
    setPlan(null);
    setCreating(true);
    setOverview(await getSanadOverview());
  }

  function onChatAction(action) {
    if (!action) return;
    if (action.type === "open_plan") void switchPlan(action.planId).then(() => setCreating(false));
    if (action.type === "open") dispatch({ type: "NAVIGATE", screen: action.screen === "tutor" ? SCREENS.TUTOR : SCREENS.MASTERY, courseId: action.courseId || undefined });
  }

  const pad = mobile ? "18px 14px 90px" : "28px 32px 90px";
  return (
    <div style={{ padding: pad, maxWidth: 1240, margin: "0 auto" }}>
      {loadError ? (
        <Panel tokens={tokens}><div style={{ fontFamily: font, color: "#B42318", marginBottom: 12 }}>{loadError}</div><SButton tokens={tokens} font={font} onClick={load}>{t("Try again", "حاول تاني")}</SButton></Panel>
      ) : !overview ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><div className="sanad-pulse"><SanadMark size={56} /></div></div>
      ) : building ? (
        <Building tokens={tokens} font={font} hFont={hFont} lang={lang} />
      ) : plan && !creating ? (
        <PlanView dark={state.dark} plan={plan} plans={plans} tokens={tokens} font={font} hFont={hFont} lang={lang} mobile={mobile} busy={busy} lastNote={lastNote}
          onOpenTask={(task) => setRunner(task)} onSwitch={switchPlan} onNew={() => { setCreating(true); setBuildError(null); }} onReplan={replan} onStop={stop}
          onReminders={() => dispatch({ type: "NAVIGATE", screen: SCREENS.PROFILE, profileFocus: "reminders" })} />
      ) : (
        <>
          {plan ? <div style={{ marginBottom: 14 }}><SButton kind="ghost" tokens={tokens} font={font} onClick={() => setCreating(false)}>{t("Back to my plan", "رجوع لخطتي")}</SButton></div> : null}
          <Intro dark={state.dark} courses={overview.courses} initialCourseId={wantedCourseId} tokens={tokens} font={font} hFont={hFont} lang={lang} mobile={mobile} onBuild={build} busy={building} error={buildError} onAsk={onChatAction} />
        </>
      )}
      {runner && plan ? <SanadTaskRunner plan={plan} task={runner} tokens={tokens} font={font} hFont={hFont} lang={lang} mobile={mobile} onClose={() => { setRunner(null); void getStudyPlan(plan.id).then(setPlan); }} onPlan={onPlanUpdate} /> : null}
    </div>
  );
}
