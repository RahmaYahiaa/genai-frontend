import { useCallback, useEffect, useState } from "react";
import { QuestionFlow } from "@/components/SessionSolver";
import { getPracticeSession, submitPracticeAnswer, getReassessment, submitReassessmentAnswer } from "@/services/learning";
import { startPlanTask, completePlanTask } from "@/services/sanad";
import { apiErrorText } from "@/services/http";
import { IconX, IconCheck, IconChevronLeft, IconChevronRight } from "@/components/Icons";
import { SanadMark, SButton, TaskIcon, TASK_META, AutoText, tr } from "./SanadKit";

const PREP_TEXT = {
  learn: ["Reading your course files", "Matching your level", "Writing your lesson"],
  other: ["Picking what to ask", "Writing your questions"],
};
const PREP_TEXT_AR = {
  learn: ["بقرا ملفات المادة", "بظبط الشرح على مستواك", "بكتب الدرس"],
  other: ["بختار هسألك في إيه", "بكتب الأسئلة"],
};

function Preparing({ type, tokens, font, lang }) {
  const steps = (lang === "ar" ? PREP_TEXT_AR : PREP_TEXT)[type === "learn" ? "learn" : "other"];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => Math.min(n + 1, steps.length - 1)), 2200);
    return () => clearInterval(id);
  }, [steps.length]);
  return (
    <div style={{ padding: "48px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <div className="sanad-pulse"><SanadMark size={54} /></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 240 }}>
        {steps.map((s, n) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: font, fontSize: 14, color: n <= i ? tokens.textPrimary : tokens.textFaint, transition: "color 300ms" }}>
            <span style={{ width: 18, height: 18, borderRadius: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", background: n < i ? tokens.primary : n === i ? tokens.primaryLight : tokens.inset, border: `1px solid ${n <= i ? tokens.primary : tokens.cardBorder}` }}>
              {n < i ? <IconCheck size={11} color="#fff" /> : null}
            </span>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

function Flashcards({ cards, tokens, font, lang }) {
  const t = tr(lang);
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  if (!cards?.length) return null;
  const card = cards[i];
  const Prev = lang === "ar" ? IconChevronRight : IconChevronLeft;
  const Next = lang === "ar" ? IconChevronLeft : IconChevronRight;
  const go = (d) => { setFlip(false); setI((n) => (n + d + cards.length) % cards.length); };
  return (
    <div>
      <button type="button" onClick={() => setFlip((f) => !f)} style={{ width: "100%", minHeight: 150, borderRadius: 16, border: `1px solid ${flip ? tokens.primary : tokens.cardBorder}`, background: flip ? tokens.primaryLight : tokens.inset, cursor: "pointer", padding: 22, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 200ms" }}>
        <span style={{ fontFamily: font, fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: tokens.textMuted }}>{flip ? t("Answer", "الإجابة") : t("Question", "السؤال")}</span>
        <AutoText style={{ fontFamily: font, fontSize: 16, fontWeight: 600, color: tokens.textPrimary, lineHeight: 1.55, textAlign: "center" }}>{flip ? card.back : card.front}</AutoText>
        <span style={{ fontFamily: font, fontSize: 12, color: tokens.textFaint }}>{t("Tap to flip", "دوس عشان تقلب")}</span>
      </button>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 10 }}>
        <button type="button" aria-label={t("Previous card", "الكارت اللي فات")} onClick={() => go(-1)} style={iconBtn(tokens)}><Prev size={16} /></button>
        <span style={{ fontFamily: font, fontSize: 13, color: tokens.textMuted }}>{i + 1} / {cards.length}</span>
        <button type="button" aria-label={t("Next card", "الكارت اللي بعده")} onClick={() => go(1)} style={iconBtn(tokens)}><Next size={16} /></button>
      </div>
    </div>
  );
}

const iconBtn = (tokens) => ({ width: 34, height: 34, borderRadius: 10, border: `1px solid ${tokens.cardBorder}`, background: tokens.card, color: tokens.textSecondary, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" });

function Lesson({ lesson, tokens, font, lang }) {
  const t = tr(lang);
  const [showSolution, setShowSolution] = useState(false);
  const [shown, setShown] = useState({});
  const label = (s) => <div style={{ fontFamily: font, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: tokens.textMuted, margin: "22px 0 10px" }}>{s}</div>;
  return (
    <div>
      {(lesson.explanation ?? "").split(/\n{2,}/).map((p, i) => (
        <AutoText key={i} as="p" style={{ fontFamily: font, fontSize: 15, lineHeight: 1.8, color: tokens.textPrimary, margin: "0 0 12px" }}>{p}</AutoText>
      ))}
      {lesson.keyPoints?.length ? (
        <>
          {label(t("Remember", "افتكر"))}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {lesson.keyPoints.map((k, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ marginTop: 7, width: 6, height: 6, borderRadius: 3, background: tokens.primary, flexShrink: 0 }} />
                <AutoText style={{ fontFamily: font, fontSize: 14.5, lineHeight: 1.65, color: tokens.textSecondary }}>{k}</AutoText>
              </div>
            ))}
          </div>
        </>
      ) : null}
      {lesson.example?.problem ? (
        <>
          {label(t("Worked example", "مثال محلول"))}
          <div style={{ border: `1px solid ${tokens.cardBorder}`, borderRadius: 14, padding: 16, background: tokens.inset }}>
            <AutoText style={{ fontFamily: font, fontSize: 14.5, fontWeight: 600, lineHeight: 1.65, color: tokens.textPrimary, whiteSpace: "pre-wrap" }}>{lesson.example.problem}</AutoText>
            {showSolution ? (
              <AutoText style={{ fontFamily: font, fontSize: 14.5, lineHeight: 1.7, color: tokens.textSecondary, marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${tokens.cardBorder}`, whiteSpace: "pre-wrap" }}>{lesson.example.solution}</AutoText>
            ) : (
              <div style={{ marginTop: 12 }}><SButton kind="soft" tokens={tokens} font={font} onClick={() => setShowSolution(true)}>{t("Show the solution", "وريني الحل")}</SButton></div>
            )}
          </div>
        </>
      ) : null}
      {lesson.flashcards?.length ? (<>{label(t("Flashcards", "فلاش كاردز"))}<Flashcards cards={lesson.flashcards} tokens={tokens} font={font} lang={lang} /></>) : null}
      {lesson.exercises?.length ? (
        <>
          {label(t("Try it yourself", "جرّب بنفسك"))}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {lesson.exercises.map((ex, i) => (
              <div key={i} style={{ border: `1px solid ${tokens.cardBorder}`, borderRadius: 12, padding: 14 }}>
                <AutoText style={{ fontFamily: font, fontSize: 14.5, fontWeight: 600, color: tokens.textPrimary, lineHeight: 1.6 }}>{ex.question}</AutoText>
                {shown[i] ? (
                  <AutoText style={{ fontFamily: font, fontSize: 14, color: tokens.textSecondary, marginTop: 8, lineHeight: 1.6 }}>{ex.answer}</AutoText>
                ) : (
                  <button type="button" onClick={() => setShown((s) => ({ ...s, [i]: true }))} style={{ marginTop: 8, background: "none", border: "none", padding: 0, color: tokens.primary, fontFamily: font, fontSize: 13, fontWeight: 650, cursor: "pointer" }}>{t("Check my answer", "شوف الإجابة")}</button>
                )}
              </div>
            ))}
          </div>
        </>
      ) : null}
      {!lesson.flashcards?.length && !lesson.example?.problem ? (
        <div style={{ marginTop: 18, fontFamily: font, fontSize: 13, color: tokens.textMuted }}>{t("This lesson is taken straight from your course files.", "الدرس ده مأخوذ من ملفات المادة مباشرة.")}</div>
      ) : null}
    </div>
  );
}

function Questions({ courseId, task, tokens, font, lang, mobile, onAnswered }) {
  const isRe = task.refKind === "reassessment";
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const load = useCallback(async () => {
    try {
      const s = await (isRe ? getReassessment(courseId, task.refId) : getPracticeSession(courseId, task.refId));
      setSession(s);
      if (s?.answers?.length) onAnswered?.();
    } catch (e) {
      setError(apiErrorText(e, lang));
    }
  }, [courseId, task.refId, isRe, lang, onAnswered]);
  useEffect(() => { void load(); }, [load]);

  async function answer(questionId, content) {
    setBusyId(questionId);
    setError(null);
    try {
      await (isRe ? submitReassessmentAnswer(courseId, task.refId, { questionId, content }) : submitPracticeAnswer(courseId, task.refId, { questionId, content }));
      await load();
      onAnswered?.();
    } catch (e) {
      setError(apiErrorText(e, lang));
    } finally {
      setBusyId(null);
    }
  }
  if (error && !session) return <div style={{ color: "#B42318", fontFamily: font, fontSize: 14 }}>{error}</div>;
  if (!session) return <Preparing type={task.type} tokens={tokens} font={font} lang={lang} />;
  const answeredIds = (session.answers ?? []).map((a) => a.questionId);
  const evaluations = Object.fromEntries((session.answers ?? []).map((a) => [a.questionId, a.evaluation]));
  return (
    <>
      {error ? <div style={{ color: "#B42318", fontFamily: font, fontSize: 13, marginBottom: 10 }}>{error}</div> : null}
      <QuestionFlow
        questions={session.questions ?? []}
        evaluations={evaluations}
        answeredIds={answeredIds}
        responses={Object.fromEntries((session.answers ?? []).map((a) => [a.questionId, a.responseText ?? ""]))}
        busyId={busyId}
        onSubmit={(qid, content) => void answer(qid, content)}
        tokens={tokens}
        lang={lang}
        mobile={mobile}
      />
    </>
  );
}

/** Full-screen task view: prepares the task, runs it, then reports back so Plany can adapt. */
export default function SanadTaskRunner({ plan, task: initial, tokens, font, hFont, lang, mobile, onClose, onPlan }) {
  const t = tr(lang);
  const [task, setTask] = useState(initial);
  const [error, setError] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [answeredOnce, setAnsweredOnce] = useState(false);
  const markAnswered = useCallback(() => setAnsweredOnce(true), []);
  const ready = task.type === "learn" ? Boolean(task.lesson?.explanation) : Boolean(task.refId) && task.status !== "done";

  useEffect(() => {
    let alive = true;
    if (initial.status === "done" && initial.type !== "learn") return undefined;
    (async () => {
      try {
        const res = await startPlanTask(plan.id, initial.id);
        if (!alive) return;
        setTask(res.task);
        onPlan?.(res.plan, null, false);
      } catch (e) {
        if (alive) setError(apiErrorText(e, lang));
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.id]);

  async function finish(feeling) {
    setFinishing(true);
    setError(null);
    try {
      const res = await completePlanTask(plan.id, task.id, feeling ? { feeling } : {});
      onPlan?.(res.plan, res.note, true);
    } catch (e) {
      setError(apiErrorText(e, lang));
      setFinishing(false);
    }
  }

  const meta = TASK_META[task.type] ?? TASK_META.practice;
  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(10,20,40,0.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: mobile ? "stretch" : "center", justifyContent: "center", padding: mobile ? 0 : 24 }}>
      <div style={{ width: "100%", maxWidth: 820, maxHeight: mobile ? "100%" : "92vh", background: tokens.card, borderRadius: mobile ? 0 : 22, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(10,20,40,0.35)" }}>
        <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: `1px solid ${tokens.cardBorder}` }}>
          <TaskIcon type={task.type} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: font, fontSize: 12, fontWeight: 650, color: meta.tone }}>{lang === "ar" ? meta.ar : meta.en} · {task.minutes} {t("min", "دقيقة")}</div>
            <AutoText style={{ fontFamily: hFont, fontSize: 16.5, fontWeight: 700, color: tokens.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</AutoText>
          </div>
          <button type="button" aria-label={t("Close", "إغلاق")} onClick={onClose} style={iconBtn(tokens)}><IconX size={16} /></button>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: mobile ? 18 : "24px 30px" }}>
          {task.why ? (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: tokens.primaryLight, border: `1px solid ${tokens.citationBorder}`, borderRadius: 12, padding: "10px 14px", marginBottom: 20 }}>
              <SanadMark size={22} radius={7} />
              <AutoText style={{ fontFamily: font, fontSize: 13.5, color: tokens.textSecondary, lineHeight: 1.6 }}>{task.why}</AutoText>
            </div>
          ) : null}
          {error ? <div style={{ color: "#B42318", fontFamily: font, fontSize: 14, marginBottom: 12 }}>{error}</div> : null}
          {initial.status === "done" && initial.type !== "learn" ? (
            <div style={{ fontFamily: font, fontSize: 15, color: tokens.textSecondary }}>
              {t("You finished this task", "خلّصت المهمة دي")}{task.result?.score != null ? ` · ${Math.round(task.result.score * 100)}%` : ""}
            </div>
          ) : !ready && !error ? (
            <Preparing type={task.type} tokens={tokens} font={font} lang={lang} />
          ) : task.type === "learn" && task.lesson ? (
            <Lesson lesson={task.lesson} tokens={tokens} font={font} lang={lang} />
          ) : ready ? (
            <Questions courseId={plan.courseId} task={task} tokens={tokens} font={font} lang={lang} mobile={mobile} onAnswered={markAnswered} />
          ) : null}
        </div>

        {ready && task.status !== "done" ? (
          <footer style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap", padding: "14px 20px", borderTop: `1px solid ${tokens.cardBorder}`, background: tokens.bg }}>
            {task.type === "learn" ? (
              <>
                <SButton kind="ghost" tokens={tokens} font={font} disabled={finishing} onClick={() => finish("confused")}>{t("Still confusing", "لسه مش واضح")}</SButton>
                <SButton tokens={tokens} font={font} disabled={finishing} icon={<IconCheck size={15} color="#fff" />} onClick={() => finish("clear")}>{finishing ? t("Updating your plan…", "بحدّث خطتك…") : t("Got it", "فهمت")}</SButton>
              </>
            ) : (
              <SButton tokens={tokens} font={font} disabled={finishing || !answeredOnce} title={!answeredOnce ? t("Answer at least one question", "جاوب سؤال واحد على الأقل") : undefined} onClick={() => finish()}>
                {finishing ? t("Plany is updating your plan…", "بلاني بيحدّث خطتك…") : t("Finish and update my plan", "خلّصت، حدّث خطتي")}
              </SButton>
            )}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
