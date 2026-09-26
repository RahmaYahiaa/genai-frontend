import { demoMode } from "@/services/auth";
import useStudyCourse from "@/hooks/useStudyCourse";
import { useCallback, useEffect, useState } from "react";
import { listCourses } from "@/services/courses";
import { createPracticeSession, getPracticeSession, submitPracticeAnswer, listPracticeSessions } from "@/services/learning";
import { apiErrorText } from "@/services/http";
import { QuestionFlow } from "@/components/SessionSolver";
import { StudyPage, StartPanel, Field, Select, Segmented, PrimaryButton, SecondaryButton, TextButton, Notice, LoadingBlock, ErrorBlock, EmptyBlock, PastAttempts, ResultPanel, STATUS, summarize } from "@/components/study/StudyKit";
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
  const [topicId, setTopicId] = useState("");
  const [count, setCount] = useState(3);
  const [tab, setTab] = useState("new");
  const [busy, setBusy] = useState(false);
  const [busyQuestion, setBusyQuestion] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    setSessionId(readStore(`genai-practice-${effectiveCourseId ?? "none"}`) ?? "");
    setTopicId("");
    setNotice(null);
  }, [effectiveCourseId]);

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
    id;
  const session = sessionAsync.data;
  const answeredIds = (session?.answers ?? []).map((answer) => answer.questionId);
  const evaluations = {};
  for (const answer of session?.answers ?? []) evaluations[answer.questionId] = answer.evaluation;
  const complete = session?.status === "completed" || (Boolean(session) && answeredIds.length >= (session?.questionCount ?? 0) && (session?.questionCount ?? 0) > 0);

  async function start() {
    setBusy(true);
    setNotice(null);
    try {
      const created = await createPracticeSession(effectiveCourseId, { topicId, questionsCount: count });
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
  const topicOptions = topics.map((topic) => ({ value: topic.id, label: topic.label?.[lang] ?? topic.label?.en ?? topic.id }));

  return (
    <StudyPage tokens={tokens} lang={lang} mobile={mobile} course={courseProps}
      title={t("Practice", "تدرّب")}
      subtitle={t("Pick a topic and answer a few questions. You'll get feedback on every answer right away.", "اختار موضوع وجاوب على كام سؤال. هتاخد تعليق على كل إجابة على طول.")}
      actions={sessionId && !complete ? <TextButton tokens={tokens} muted onClick={reset}>{t("Leave and start over", "اخرج وابدأ من الأول")}</TextButton> : null}
    >
      {notice && <Notice tokens={tokens} tone="danger" title={t("Something didn't work", "في حاجة ماشتغلتش")}>{t("Please try again in a moment.", "جرّب تاني كمان شوية.")}</Notice>}
      {loading ? (
        <LoadingBlock tokens={tokens} label={t("Loading…", "جاري التحميل…")} />
      ) : failed ? (
        <ErrorBlock tokens={tokens} lang={lang} onRetry={() => { coursesAsync.reload(); sessionAsync.reload(); listAsync.reload(); }} />
      ) : courses.length === 0 ? (
        <EmptyBlock tokens={tokens} Icon={IconPractice} title={t("Join a course first", "اشترك في مقرر الأول")} body={t("Practice questions come from your course topics.", "أسئلة التدريب جاية من مواضيع مقررك.")}
          action={<PrimaryButton tokens={tokens} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.COURSES })}>{t("Go to my courses", "روح لمقرراتي")}</PrimaryButton>} />
      ) : !sessionId ? (
        <>
          <StartPanel tokens={tokens} mobile={mobile} Icon={IconPractice}
            title={t("Set up your practice", "جهّز التدريب")}
            body={t("Choose what you want to work on. Tip: start with a topic you found hard in your level check.", "اختار عايز تشتغل على إيه. نصيحة: ابدأ بموضوع كان صعب عليك في اختبار المستوى.")}
            primary={<PrimaryButton tokens={tokens} busy={busy} disabled={!topicId} onClick={() => void start()}>{busy ? t("Preparing your questions…", "بنجهّز أسئلتك…") : t("Start practice", "ابدأ التدريب")}</PrimaryButton>}
          >
            {topicOptions.length === 0 ? (
              <Notice tokens={tokens} tone="info">{t("This course has no topics yet, so there's nothing to practise.", "المقرر ده لسه مفيهوش مواضيع، فمفيش حاجة تتدرّب عليها.")}</Notice>
            ) : (
              <Field tokens={tokens} label={t("Topic", "الموضوع")}>
                <Select tokens={tokens} value={topicId} onChange={setTopicId} options={topicOptions} placeholder={t("Choose a topic", "اختار موضوع")} ariaLabel={t("Topic", "الموضوع")} />
              </Field>
            )}
            <Field tokens={tokens} label={t("Number of questions", "عدد الأسئلة")}>
              <Segmented tokens={tokens} value={count} onChange={setCount} ariaLabel={t("Number of questions", "عدد الأسئلة")} options={[1, 2, 3, 4, 5].map((v) => ({ value: v, label: String(v) }))} />
            </Field>
          </StartPanel>
          <PastAttempts tokens={tokens} lang={lang} rows={historyRows}
            onOpen={(row) => { writeStore(storeKey, row.id); setSessionId(row.id); }}
            renderTitle={(row) => topicLabel(row.topicId)}
            renderMeta={(row) => `${row.createdAt ? new Date(row.createdAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB") + " · " : ""}${(row.answers ?? []).length}/${(row.questions ?? []).length} ${t("answered", "اتجاوبت")}`}
            isDone={(row) => row.status === "completed"} />
        </>
      ) : (
        <QuestionFlow key={sessionId}
          questions={session?.questions ?? []}
          evaluations={evaluations}
          answeredIds={answeredIds}
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
