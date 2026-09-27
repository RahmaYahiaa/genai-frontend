import { demoMode } from "@/services/auth";
import useStudyCourse from "@/hooks/useStudyCourse";
import { useCallback, useEffect, useState } from "react";
import { listCourses, listMaterials } from "@/services/courses";
import { createPracticeSession, getPracticeSession, submitPracticeAnswer, listPracticeSessions } from "@/services/learning";
import { apiErrorText } from "@/services/http";
import { QuestionFlow } from "@/components/SessionSolver";
import { StudyPage, StartPanel, Field, Select, Segmented, NumberStepper, PrimaryButton, SecondaryButton, TextButton, Notice, LoadingBlock, ErrorBlock, EmptyBlock, PastAttempts, ResultPanel, STATUS, summarize } from "@/components/study/StudyKit";
import { IconPractice } from "@/components/Icons";
import { AlertStrip, inputStyle } from "@/components/ModuleUI";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { fetchPracticeQuestions } from "@/services/api";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { getCourse } from "@/data/courses";
import { Card, Btn, Chip, Bar, AsyncGate } from "@/components/ui";
import { LearningHeader, GuidedIntro, SessionHistoryList, DonePanel, sessionStatusTone } from "@/components/learning";

function DemoPracticePage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const mobile = useMediaQuery("(max-width: 760px)");
  const { data: questions, loading, error, reload } = useAsync(fetchPracticeQuestions);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions?.[index];
  const course = getCourse("CS301");
  const topicLabel = (id) => {
    const tp = course.topics.find((x) => x.id === id);
    return tp ? tp.label[lang] : id;
  };

  const pick = (i) => {
    if (picked !== null || !q) return;
    setPicked(i);
    if (i === q.correct) setScore((s) => s + 1);
  };

  const next = () => {
    if (index + 1 >= questions.length) setDone(true);
    else {
      setIndex((n) => n + 1);
      setPicked(null);
    }
  };

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  const optionStyle = (i) => {
    if (picked === null) {
      return { background: tokens.inset, border: `1.5px solid ${tokens.cardBorder}`, color: tokens.textPrimary };
    }
    if (i === q.correct) return { background: tokens.masteredBg, border: `1.5px solid ${tokens.mastered}`, color: tokens.mastered };
    if (i === picked) return { background: tokens.gapBg, border: `1.5px solid ${tokens.gap}`, color: tokens.gap };
    return { background: tokens.inset, border: `1.5px solid ${tokens.cardBorder}`, color: tokens.textFaint };
  };

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 820, margin: "0 auto", fontFamily: bodyFont(lang) }}>
      <h1 style={{ margin: "0 0 4px", fontSize: mobile ? 19 : 22, fontWeight: 700, letterSpacing: "-0.02em", color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
        {t("Practice", "التدريب")}
      </h1>
      <p style={{ margin: "0 0 20px", fontSize: 12.5, color: tokens.textMuted }}>
        {t("Instant feedback on every answer.", "تصحيح فوري، وكل إجابة صحيحة بتضيف دليلاً.")}
      </p>
      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Preparing questions…", "جاري تجهيز الأسئلة…")}>
        {!done && q && (
          <>
            <Bar tokens={tokens} value={((index + 1) / questions.length) * 100} color={tokens.primary} height={5} />
            <div style={{ display: "flex", justifyContent: "space-between", margin: "8px 0 16px", fontSize: 11.5, color: tokens.textMuted, gap: 8 }}>
              <span>
                {t(`Question ${index + 1} of ${questions.length}`, `سؤال ${index + 1} من ${questions.length}`)} · {t("Score", "النتيجة")} {score}
              </span>
              <Chip tokens={tokens} tone="primary">{topicLabel(q.topicId)}</Chip>
            </div>
            <Card tokens={tokens}>
              <div style={{ fontSize: 15.5, fontWeight: 600, lineHeight: 1.55, color: tokens.textPrimary, marginBottom: 18 }}>{q.stem[lang]}</div>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 8 }}>
                {q.options.map((o, i) => (
                  <button key={i} onClick={() => pick(i)} style={{ padding: "11px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: picked !== null ? "default" : "pointer", textAlign: "left", ...optionStyle(i) }}>
                    {o[lang]}
                  </button>
                ))}
              </div>
              {picked !== null && (
                <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 10, background: tokens.citationBg, border: `1px solid ${tokens.citationBorder}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Chip tokens={tokens} tone={picked === q.correct ? "mastered" : "gap"}>
                      {picked === q.correct ? t("Correct", "صحيح") : t("Not yet", "لسه")}
                    </Chip>
                    {picked !== q.correct && (
                      <span style={{ fontSize: 11.5, color: tokens.textMuted }}>
                        {t("Correct answer shown in blue.", "الإجابة الصحيحة باللون الأزرق.")}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.6, color: tokens.textPrimary }}>{q.explanation[lang]}</div>
                </div>
              )}
              {picked !== null && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                  <Btn tokens={tokens} onClick={next}>
                    {index + 1 >= questions.length ? t("See results", "شوف النتيجة") : t("Next", "التالي")}
                  </Btn>
                </div>
              )}
            </Card>
          </>
        )}

        {done && (
          <Card tokens={tokens} style={{ marginTop: 12 }}>
            <Chip tokens={tokens} tone={score >= questions.length * 0.75 ? "mastered" : "primary"}>
              {t("Completed", "اكتمل التدريب")}
            </Chip>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, margin: "14px 0 8px" }}>
              <span style={{ fontSize: 34, fontWeight: 700, color: tokens.textPrimary, fontFamily: headingFont(lang), letterSpacing: "-0.03em" }}>
                {score}/{questions.length}
              </span>
              <span style={{ fontSize: 13, color: tokens.textMuted }}>{t("correct", "إجابات صحيحة")}</span>
            </div>
            <Bar tokens={tokens} value={(score / questions.length) * 100} color={tokens.mastered} height={8} />
            <p style={{ margin: "14px 0 18px", fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.6 }}>
              {t(
                "Well done. A progress check will show how much of this you've kept.",
                "شغل جامد. إعادة التقييم دلوقتي هتدي دليل قاطع إن المهارات دي ثابتة.",
              )}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Btn tokens={tokens} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.REASSESSMENT })}>
                {t("Prove it — Reassess", "أثبتها — أعد التقييم")}
              </Btn>
              <Btn tokens={tokens} variant="ghost" onClick={restart}>
                {t("Practice again", "تدرّب تاني")}
              </Btn>
            </div>
          </Card>
        )}
      </AsyncGate>
    </div>
  );
}
const readStore = (key) => (typeof sessionStorage === "undefined" ? null : sessionStorage.getItem(key));
const writeStore = (key, value) => {
  if (typeof sessionStorage !== "undefined") sessionStorage.setItem(key, value);
};
const clearStore = (key) => {
  if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(key);
};

function RealPracticePage({ state, dispatch }) {
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const isRtl = lang === "ar";
  const [courseId, setCourseId] = useStudyCourse();
  const loadCourses = useCallback(() => listCourses(), []);
  const coursesAsync = useAsync(loadCourses);
  const courses = coursesAsync.data?.items ?? [];
  const effectiveCourseId = courseId || courses[0]?.id || null;
  const course = courses.find((item) => item.id === effectiveCourseId);
  const topics = course?.topics ?? [];
  const storeKey = `genai-practice-${effectiveCourseId ?? "none"}`;
  const [sessionId, setSessionId] = useState("");
  // What to practise: "suggest" (AI picks your weakest topic), "subject"
  // (type anything), or "file" (one of the course files).
  const [mode, setMode] = useState("suggest");
  const [focus, setFocus] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [count, setCount] = useState(3);
  const [tab, setTab] = useState("new");
  const [busy, setBusy] = useState(false);
  const [busyQuestion, setBusyQuestion] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    setSessionId(readStore(`genai-practice-${effectiveCourseId ?? "none"}`) ?? "");
    setFocus("");
    setMaterialId("");
    setNotice(null);
  }, [effectiveCourseId]);

  const loadMaterials = useCallback(
    () => (effectiveCourseId ? listMaterials(effectiveCourseId).catch(() => []) : Promise.resolve([])),
    [effectiveCourseId],
  );
  const materialsAsync = useAsync(loadMaterials);
  const materials = (materialsAsync.data ?? []).filter((item) => item.status === "ready");

  const loadSession = useCallback(
    () =>
      effectiveCourseId && sessionId
        ? getPracticeSession(effectiveCourseId, sessionId).catch(() => {
            clearStore(`genai-practice-${effectiveCourseId ?? "none"}`);
            setSessionId(""); // stale or deleted session: back to the start screen
            return null;
          })
        : Promise.resolve(null),
    [effectiveCourseId, sessionId],
  );
  const sessionAsync = useAsync(loadSession);
  const loadList = useCallback(
    () => (effectiveCourseId ? listPracticeSessions(effectiveCourseId).catch(() => []) : Promise.resolve([])),
    [effectiveCourseId],
  );
  const listAsync = useAsync(loadList);
  const historyRows = listAsync.data ?? [];
  const topicLabel = (id) =>
    topics.find((topic) => topic.id === id)?.label?.[lang] ??
    topics.find((topic) => topic.id === id)?.label?.en ??
    null;
  const rowTitle = (row) => row.topicTitle || topicLabel(row.topicId) || row.focus || t("Practice", "تدريب");
  const session = sessionAsync.data;
  const answeredIds = (session?.answers ?? []).map((answer) => answer.questionId);
  const evaluations = {};
  for (const answer of session?.answers ?? []) evaluations[answer.questionId] = answer.evaluation;
  const complete = session?.status === "completed" || (Boolean(session) && answeredIds.length >= (session?.questionCount ?? 0) && (session?.questionCount ?? 0) > 0);

  async function start() {
    setBusy(true);
    setNotice(null);
    try {
      const body = { questionsCount: count };
      if (mode === "subject") body.focus = focus.trim();
      if (mode === "file") body.materialId = materialId;
      const created = await createPracticeSession(effectiveCourseId, body);
      writeStore(storeKey, created.id);
      setSessionId(created.id);
      setTab("new");
      listAsync.reload();
    } catch (err) {
      setNotice(apiErrorText(err, lang));
    } finally {
      setBusy(false);
    }
  }

  async function answer(questionId, content) {
    setBusyQuestion(questionId);
    setNotice(null);
    try {
      await submitPracticeAnswer(effectiveCourseId, sessionId, { questionId, content });
      sessionAsync.reload();
      listAsync.reload();
    } catch (err) {
      setNotice(apiErrorText(err, lang));
    } finally {
      setBusyQuestion(null);
    }
  }

  const courseProps = { courses, value: effectiveCourseId ?? "", onChange: setCourseId };
  const reset = () => { clearStore(storeKey); setSessionId(""); setTab("new"); listAsync.reload(); };
  const summary = summarize(evaluations);
  // Only the first load blocks the page; background reloads (after each answer)
  // must not unmount the question flow, or the student never sees feedback.
  const loading = (coursesAsync.loading && coursesAsync.data == null) || (sessionAsync.loading && sessionAsync.data == null) || (listAsync.loading && listAsync.data == null);
  const failed = coursesAsync.error ?? sessionAsync.error ?? listAsync.error;
  const canStart =
    Boolean(effectiveCourseId) &&
    (mode === "suggest" ? topics.length > 0 : mode === "subject" ? focus.trim().length >= 2 : Boolean(materialId));

  return (
    <StudyPage tokens={tokens} lang={lang} mobile={mobile} course={courseProps}
      title={t("Practice", "تدرّب")}
      subtitle={t("Answer a few questions and get feedback on every answer right away.", "جاوب على كام سؤال وخد تعليق على كل إجابة على طول.")}
      actions={sessionId && !complete ? <TextButton tokens={tokens} muted onClick={reset}>{t("Leave and start over", "اخرج وابدأ من الأول")}</TextButton> : null}
    >
      {notice && <Notice tokens={tokens} tone="danger" title={t("Something didn't work", "في حاجة ماشتغلتش")}>{notice || t("Please try again in a moment.", "جرّب تاني كمان شوية.")}</Notice>}
      {loading ? (
        <LoadingBlock tokens={tokens} label={t("Loading…", "جاري التحميل…")} />
      ) : failed ? (
        <ErrorBlock tokens={tokens} lang={lang} onRetry={() => { coursesAsync.reload(); sessionAsync.reload(); listAsync.reload(); }} />
      ) : courses.length === 0 ? (
        <EmptyBlock tokens={tokens} Icon={IconPractice} title={t("Join a course first", "اشترك في مقرر الأول")} body={t("Practice questions come from your courses.", "أسئلة التدريب جاية من مقرراتك.")}
          action={<PrimaryButton tokens={tokens} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.COURSES })}>{t("Go to my courses", "روح لمقرراتي")}</PrimaryButton>} />
      ) : !sessionId ? (
        <>
          <StartPanel tokens={tokens} mobile={mobile} Icon={IconPractice}
            title={t("What do you want to practise?", "عايز تتدرّب على إيه؟")}
            body={t("Let us pick what you need most, type any subject, or practise on one of the course files.", "سيبنا نختار اللي محتاجه أكتر، أو اكتب أي موضوع، أو اتدرّب على ملف من ملفات المقرر.")}
            primary={<PrimaryButton tokens={tokens} busy={busy} disabled={!canStart} onClick={() => void start()}>{busy ? t("Preparing your questions…", "بنجهّز أسئلتك…") : t("Start practice", "ابدأ التدريب")}</PrimaryButton>}
          >
            <Segmented tokens={tokens} value={mode} onChange={setMode} ariaLabel={t("What to practise", "تتدرّب على إيه")}
              options={[
                { value: "suggest", label: t("Suggest for me", "اقترح عليّا") },
                { value: "subject", label: t("A subject", "موضوع معيّن") },
                ...(materials.length ? [{ value: "file", label: t("A course file", "ملف من المقرر") }] : []),
              ]} />
            {mode === "suggest" && (
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: tokens.textMuted }}>
                {topics.length
                  ? t("We'll choose the part of the course you haven't practised yet or found hardest.", "هنختار الجزء من المقرر اللي لسه ما اتدرّبتش عليه أو كان أصعب عليك.")
                  : t("Your course files are still being read. Type a subject for now.", "لسه بنقرا ملفات المقرر. اكتب موضوع دلوقتي.")}
              </p>
            )}
            {mode === "subject" && (
              <Field tokens={tokens} label={t("Subject", "الموضوع")} hint={t("Anything from your course, in your own words.", "أي حاجة من المقرر، بكلامك.")}>
                <input dir="auto" value={focus} onChange={(e) => setFocus(e.target.value)} maxLength={200}
                  placeholder={t("e.g. Banker's algorithm", "مثلاً: Banker's algorithm")} aria-label={t("Subject", "الموضوع")}
                  onKeyDown={(e) => { if (e.key === "Enter" && canStart) void start(); }}
                  style={{ height: 46, padding: "0 14px", borderRadius: 10, border: `1px solid ${tokens.cardBorder}`, background: tokens.card, color: tokens.textPrimary, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
              </Field>
            )}
            {mode === "file" && (
              <Field tokens={tokens} label={t("Course file", "ملف المقرر")}>
                <Select tokens={tokens} value={materialId} onChange={setMaterialId} placeholder={t("Choose a file", "اختار ملف")} ariaLabel={t("Course file", "ملف المقرر")}
                  options={materials.map((m) => ({ value: m.id, label: m.title }))} />
              </Field>
            )}
            <Field tokens={tokens} label={t("Number of questions", "عدد الأسئلة")}>
              <NumberStepper tokens={tokens} value={count} onChange={setCount} min={1} max={10} ariaLabel={t("Number of questions", "عدد الأسئلة")} hint={t("Type a number from 1 to 10, or use the buttons.", "اكتب رقم من 1 لـ 10، أو استخدم الأزرار.")} />
            </Field>
          </StartPanel>
          <PastAttempts tokens={tokens} lang={lang} rows={historyRows}
            onOpen={(row) => { writeStore(storeKey, row.id); setSessionId(row.id); }}
            renderTitle={rowTitle}
            renderMeta={(row) => `${row.createdAt ? new Date(row.createdAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB") + " · " : ""}${(row.answers ?? []).length}/${(row.questions ?? []).length} ${t("answered", "اتجاوبت")}`}
            isDone={(row) => row.status === "completed"} />
        </>
      ) : (
        <QuestionFlow key={sessionId}
          questions={session?.questions ?? []}
          evaluations={evaluations}
          answeredIds={answeredIds}
          responses={Object.fromEntries((session?.answers ?? []).map((a) => [a.questionId, a.responseText ?? ""]))}
          busyId={busyQuestion}
          onSubmit={(questionId, content) => void answer(questionId, content)}
          tokens={tokens}
          lang={lang}
          mobile={mobile}
          doneNote={complete ? (
            <ResultPanel tokens={tokens} mobile={mobile}
              title={t("Practice complete", "خلّصت التدريب")}
              body={t("Nice work. When you feel ready, take a progress check to see how much you've improved.", "شغل حلو. لما تحس إنك جاهز، اعمل قياس تقدّم عشان تشوف اتحسّنت قد إيه.")}
              stats={[
                { label: t("Correct", "صح"), value: summary.correct, color: STATUS.success.fg },
                { label: t("Partly correct", "صح جزئياً"), value: summary.partial, color: STATUS.warning.fg },
                { label: t("To work on", "محتاج تذاكره"), value: summary.incorrect, color: STATUS.danger.fg },
              ]}
              primary={<PrimaryButton tokens={tokens} onClick={reset}>{t("Practise again", "اتدرّب تاني")}</PrimaryButton>}
              secondary={[
                <SecondaryButton key="r" tokens={tokens} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.REASSESSMENT })}>{t("Measure my progress", "قيس تقدّمي")}</SecondaryButton>,
                <SecondaryButton key="t" tokens={tokens} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.TUTOR })}>{t("Ask the tutor", "اسأل المعلم")}</SecondaryButton>,
              ]} />
          ) : null}
        />
      )}
    </StudyPage>
  );
}

export default function PracticePage(props) {
  if (demoMode()) return <DemoPracticePage {...props} />;
  return <RealPracticePage {...props} />;
}
