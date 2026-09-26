import { demoMode } from "@/services/auth";
import useStudyCourse from "@/hooks/useStudyCourse";
import { useCallback, useState } from "react";
import { listCourses } from "@/services/courses";
import { listReassessments, createReassessment, getReassessment, submitReassessmentAnswer, getLearningGain } from "@/services/learning";
import { apiErrorText } from "@/services/http";
import { QuestionFlow } from "@/components/SessionSolver";
import { StudyPage, StartPanel, Panel, Field, Select, Segmented, PrimaryButton, SecondaryButton, TextButton, Notice, LoadingBlock, ErrorBlock, EmptyBlock, PastAttempts, ResultPanel, StatusText, STATUS, summarize } from "@/components/study/StudyKit";
import { IconReassessment } from "@/components/Icons";
import { AlertStrip, inputStyle } from "@/components/ModuleUI";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { fetchReassessmentQuestions } from "@/services/api";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { getCourse } from "@/data/courses";
import { Card, Btn, Chip, Bar, AsyncGate } from "@/components/ui";
import MasteryBar from "@/components/MasteryBar";
import { LearningHeader, GuidedIntro, SessionHistoryList, DonePanel, GainTable, sessionStatusTone } from "@/components/learning";

function DemoReassessmentPage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const mobile = useMediaQuery("(max-width: 760px)");
  const { data: questions, loading, error, reload } = useAsync(fetchReassessmentQuestions);
  const [phase, setPhase] = useState("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const q = questions?.[index];
  const course = getCourse("CS301");
  const topicLabel = (id) => {
    const tp = course.topics.find((x) => x.id === id);
    return tp ? tp.label[lang] : id;
  };

  const pick = (i) => q && setAnswers((a) => ({ ...a, [q.id]: i }));
  const next = () => (index + 1 >= questions.length ? setPhase("done") : setIndex((n) => n + 1));
  const restart = () => {
    setPhase("intro");
    setIndex(0);
    setAnswers({});
  };

  const before = course.topics.map((tp) => tp.pct);
  const avgBefore = Math.round(before.reduce((s, x) => s + x, 0) / before.length);
  const after = course.topics.map((tp) => {
    const qs = questions?.filter((qq) => qq.topicId === tp.id) ?? [];
    const correct = qs.filter((qq) => answers[qq.id] === qq.correct).length;
    const gain = qs.length > 0 ? Math.round((correct / qs.length) * 18) : 0;
    return { ...tp, after: Math.min(95, tp.pct + gain), gain, evidence: tp.evidence + correct };
  });
  const avgAfter = Math.round(after.reduce((s, x) => s + x.after, 0) / after.length);

  const optionStyle = (active) => ({
    padding: "11px 14px",
    borderRadius: 10,
    border: `1.5px solid ${active ? `${tokens.primary}55` : tokens.cardBorder}`,
    background: active ? tokens.primaryLight : tokens.inset,
    color: active ? tokens.primary : tokens.textPrimary,
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    cursor: "pointer",
    textAlign: "left",
  });

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 820, margin: "0 auto", fontFamily: bodyFont(lang) }}>
      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Preparing your progress check…", "جاري تجهيز إعادة التقييم…")}>
        {phase === "intro" && (
          <Card tokens={tokens} style={{ marginTop: 12 }}>
            <Chip tokens={tokens} tone="mastered">{t("Growth measurement", "قياس النمو")}</Chip>
            <h1 style={{ margin: "12px 0 6px", fontSize: 20, fontWeight: 700, color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
              {t("Reassessment", "إعادة التقييم")}
            </h1>
            <p style={{ margin: "0 0 18px", fontSize: 13, color: tokens.textMuted, lineHeight: 1.65 }}>
              {t(
                "Works like the level check, and shows your improvement topic by topic.",
                "نفس معيار الأدلة كالتشخيص — لكن دلوقتي نقدر نثبت التحسن، موضوعاً بموضوع.",
              )}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              <Chip tokens={tokens} tone="mastered">{t("Level check completed", "التشخيص مكتمل")}</Chip>
              <Chip tokens={tokens} tone="primary">{t("Practice logged", "التدريب مسجل")}</Chip>
              <Chip tokens={tokens}>{t("4 questions", "4 أسئلة")}</Chip>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Btn tokens={tokens} onClick={() => setPhase("run")}>{t("Start progress check", "ابدأ إعادة التقييم")}</Btn>
            </div>
          </Card>
        )}

        {phase === "run" && q && (
          <>
            <Bar tokens={tokens} value={((index + 1) / questions.length) * 100} color={tokens.mastered} height={5} />
            <div style={{ display: "flex", justifyContent: "space-between", margin: "8px 0 16px", fontSize: 11.5, color: tokens.textMuted, gap: 8 }}>
              <span>{t(`Question ${index + 1} of ${questions.length}`, `سؤال ${index + 1} من ${questions.length}`)}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{topicLabel(q.topicId)}</span>
            </div>
            <Card tokens={tokens}>
              <div style={{ fontSize: 15.5, fontWeight: 600, lineHeight: 1.55, color: tokens.textPrimary, marginBottom: 18 }}>{q.stem[lang]}</div>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 8 }}>
                {q.options.map((o, i) => (
                  <button key={i} onClick={() => pick(i)} style={optionStyle(answers[q.id] === i)}>
                    {o[lang]}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
                <Btn tokens={tokens} disabled={answers[q.id] === undefined} onClick={next}>
                  {index + 1 >= questions.length ? t("Compare results", "قارن النتائج") : t("Next", "التالي")}
                </Btn>
              </div>
            </Card>
          </>
        )}

        {phase === "done" && (
          <Card tokens={tokens} style={{ marginTop: 12 }}>
            <Chip tokens={tokens} tone="mastered">{t("Before → After", "قبل ← بعد")}</Chip>
            <h2 style={{ margin: "12px 0 4px", fontSize: 18, fontWeight: 700, color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
              {t("Measurable growth", "نمو قابل للقياس")}
            </h2>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 18 }}>
              <span style={{ fontSize: 30, fontWeight: 700, color: tokens.mastered, fontFamily: headingFont(lang) }}>{avgAfter}%</span>
              <span style={{ fontSize: 12.5, color: tokens.textMuted }}>
                {t(`up from ${avgBefore}% baseline`, `من ${avgBefore}% كخط أساس`)}
              </span>
            </div>
            {after.map((tp) => (
              <div key={tp.id} style={{ padding: "10px 0", borderBottom: `1px solid ${tokens.cardBorder}`, ...(tp.id === after[after.length - 1].id ? { borderBottom: "none" } : {}) }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, gap: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: tokens.textPrimary }}>{tp.label[lang]}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: tokens.textFaint }}>{tp.pct}%</span>
                    <span style={{ color: tokens.textFaint, fontSize: 11 }}>→</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: tokens.mastered }}>{tp.after}%</span>
                    {tp.gain > 0 && <Chip tokens={tokens} tone="mastered">+{tp.gain}</Chip>}
                  </span>
                </div>
                <MasteryBar pct={tp.after} evidence={tp.evidence} tokens={tokens} height={6} />
              </div>
            ))}
            <p style={{ margin: "16px 0 18px", fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.6 }}>
              {t(
                "Your progress has been updated with these answers.",
                "سجل الأدلة اتحدث: كل إجابة صحيحة بقت حاملة دليلاً على خريطة إتقانك.",
              )}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Btn tokens={tokens} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.DASHBOARD })}>
                {t("View updated map", "اعرض الخريطة المحدثة")}
              </Btn>
              <Btn tokens={tokens} variant="ghost" onClick={restart}>
                {t("Retake", "إعادة")}
              </Btn>
            </div>
          </Card>
        )}
      </AsyncGate>
    </div>
  );
}
function RealReassessmentPage({ state, dispatch }) {
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
  const topicTitle = (id) => topics.find((topic) => topic.id === id)?.label?.[lang] ?? topics.find((topic) => topic.id === id)?.label?.en ?? id;
  const [sessionId, setSessionId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [count, setCount] = useState(2);
  const [tab, setTab] = useState("new");
  const [busy, setBusy] = useState(false);
  const [busyQuestion, setBusyQuestion] = useState(null);
  const [notice, setNotice] = useState(null);

  const loadList = useCallback(
    () => (effectiveCourseId ? listReassessments(effectiveCourseId) : Promise.resolve(null)),
    [effectiveCourseId],
  );
  const listAsync = useAsync(loadList);
  const sessions = listAsync.data ?? [];

  const loadGain = useCallback(
    () => (effectiveCourseId ? getLearningGain(effectiveCourseId) : Promise.resolve(null)),
    [effectiveCourseId],
  );
  const gainAsync = useAsync(loadGain);
  const gains = gainAsync.data?.topicGains ?? gainAsync.data?.items ?? (Array.isArray(gainAsync.data) ? gainAsync.data : []);

  const loadSession = useCallback(
    () => (effectiveCourseId && sessionId ? getReassessment(effectiveCourseId, sessionId).catch(() => null) : Promise.resolve(null)),
    [effectiveCourseId, sessionId],
  );
  const sessionAsync = useAsync(loadSession);
  const session = sessionAsync.data;
  const answeredIds = (session?.answers ?? []).map((answer) => answer.questionId);
  const evaluations = {};
  for (const answer of session?.answers ?? []) evaluations[answer.questionId] = answer.evaluation;
  const complete = session?.status === "completed" || (Boolean(session) && answeredIds.length >= (session?.questionCount ?? 0) && (session?.questionCount ?? 0) > 0);

  async function start() {
    setBusy(true);
    setNotice(null);
    try {
      const created = await createReassessment(effectiveCourseId, { topicId, questionsCount: count });
      setSessionId(created.id);
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
      await submitReassessmentAnswer(effectiveCourseId, sessionId, { questionId, content });
      sessionAsync.reload();
      listAsync.reload();
      gainAsync.reload();
    } catch (err) {
      setNotice(apiErrorText(err, lang));
    } finally {
      setBusyQuestion(null);
    }
  }

  const courseProps = { courses, value: effectiveCourseId ?? "", onChange: setCourseId };
  const reset = () => { setSessionId(""); setTab("new"); listAsync.reload(); gainAsync.reload(); };
  const summary = summarize(evaluations);
  // Only the first load blocks the page; background reloads (after each answer)
  // must not unmount the question flow, or the student never sees feedback.
  const loading = (coursesAsync.loading && coursesAsync.data == null) || (listAsync.loading && listAsync.data == null) || (sessionAsync.loading && sessionAsync.data == null) || (gainAsync.loading && gainAsync.data == null);
  const failed = coursesAsync.error ?? listAsync.error ?? sessionAsync.error ?? gainAsync.error;
  const topicOptions = topics.map((topic) => ({ value: topic.id, label: topic.label?.[lang] ?? topic.label?.en ?? topic.id }));
  const LEVELS = {
    no_evidence: t("Not checked", "لسه ماتقاسش"), beginner: t("Beginner", "مبتدئ"), intermediate: t("Intermediate", "متوسط"),
    advanced: t("Advanced", "متقدم"), mastered: t("Mastered", "متقن"),
  };
  const levelLabel = (v) => LEVELS[String(v ?? "no_evidence").replace("-", "_")] ?? String(v).replace(/_/g, " ");
  const CHANGE = {
    improved: { label: t("Improved", "اتحسّن"), tone: "success" },
    declined: { label: t("Dropped", "قلّ"), tone: "danger" },
    unchanged: { label: t("No change", "زي ما هو"), tone: "warning" },
  };

  return (
    <StudyPage tokens={tokens} lang={lang} mobile={mobile} course={courseProps}
      title={t("Measure progress", "قيس تقدّمك")}
      subtitle={t("Answer a few questions on a topic you've studied and see how your level has changed since you started.", "جاوب على كام سؤال في موضوع ذاكرته، وشوف مستواك اتغيّر قد إيه من ساعة ما بدأت.")}
      actions={sessionId && !complete ? <TextButton tokens={tokens} muted onClick={reset}>{t("Leave", "اخرج")}</TextButton> : null}
    >
      {notice && <Notice tokens={tokens} tone="danger" title={t("Something didn't work", "في حاجة ماشتغلتش")}>{t("Please try again in a moment.", "جرّب تاني كمان شوية.")}</Notice>}
      {loading ? (
        <LoadingBlock tokens={tokens} label={t("Loading…", "جاري التحميل…")} />
      ) : failed ? (
        <ErrorBlock tokens={tokens} lang={lang} onRetry={() => { coursesAsync.reload(); listAsync.reload(); sessionAsync.reload(); gainAsync.reload(); }} />
      ) : courses.length === 0 ? (
        <EmptyBlock tokens={tokens} Icon={IconReassessment} title={t("Join a course first", "اشترك في مقرر الأول")}
          action={<PrimaryButton tokens={tokens} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.COURSES })}>{t("Go to my courses", "روح لمقرراتي")}</PrimaryButton>} />
      ) : sessionId && session ? (
        <QuestionFlow key={sessionId}
          questions={session.questions ?? []}
          evaluations={evaluations}
          answeredIds={answeredIds}
          busyId={busyQuestion}
          onSubmit={(questionId, content) => void answer(questionId, content)}
          tokens={tokens}
          lang={lang}
          mobile={mobile}
          doneNote={complete ? (
            <ResultPanel tokens={tokens} mobile={mobile}
              title={t("Progress check complete", "خلّصت قياس التقدّم")}
              body={t("See how your level changed for each topic.", "شوف مستواك اتغيّر إزاي في كل موضوع.")}
              stats={[
                { label: t("Correct", "صح"), value: summary.correct, color: STATUS.success.fg },
                { label: t("Partly correct", "صح جزئياً"), value: summary.partial, color: STATUS.warning.fg },
                { label: t("To work on", "محتاج تذاكره"), value: summary.incorrect, color: STATUS.danger.fg },
              ]}
              primary={<PrimaryButton tokens={tokens} onClick={reset}>{t("See my improvement", "شوف تحسّني")}</PrimaryButton>}
              secondary={[<SecondaryButton key="m" tokens={tokens} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.MASTERY })}>{t("See my progress", "شوف تقدّمي")}</SecondaryButton>]} />
          ) : null}
        />
      ) : (
        <>
          <StartPanel tokens={tokens} mobile={mobile} Icon={IconReassessment}
            title={t("Check how far you've come", "شوف وصلت لفين")}
            body={t("Works best after you've practised a topic. Your results are compared with your first level check.", "بيبقى أحسن بعد ما تتدرّب على الموضوع. نتيجتك بتتقارن بأول اختبار مستوى عملته.")}
            primary={<PrimaryButton tokens={tokens} busy={busy} disabled={!topicId} onClick={() => void start()}>{busy ? t("Preparing your questions…", "بنجهّز أسئلتك…") : t("Start progress check", "ابدأ قياس التقدّم")}</PrimaryButton>}
          >
            <Field tokens={tokens} label={t("Topic", "الموضوع")}>
              <Select tokens={tokens} value={topicId} onChange={setTopicId} options={topicOptions} placeholder={t("Choose a topic", "اختار موضوع")} ariaLabel={t("Topic", "الموضوع")} />
            </Field>
            <Field tokens={tokens} label={t("Number of questions", "عدد الأسئلة")}>
              <Segmented tokens={tokens} value={count} onChange={setCount} ariaLabel={t("Number of questions", "عدد الأسئلة")} options={[1, 2, 3, 4, 5].map((v) => ({ value: v, label: String(v) }))} />
            </Field>
          </StartPanel>

          <h2 style={{ fontSize: 16, fontWeight: 650, color: tokens.textPrimary, margin: "32px 0 12px" }}>{t("Your improvement by topic", "تحسّنك في كل موضوع")}</h2>
          {gains.length === 0 ? (
            <Panel tokens={tokens} padding={22}><div style={{ fontSize: 14, color: tokens.textMuted }}>{t("Nothing to compare yet. Take a level check first, then practise and come back here.", "لسه مفيش حاجة نقارنها. اعمل اختبار مستوى الأول، واتدرّب، وارجع هنا.")}</div></Panel>
          ) : (
            <Panel tokens={tokens} padding={0} style={{ overflow: "hidden" }}>
              {gains.map((row, i) => {
                const change = CHANGE[row.change];
                return (
                  <div key={row.topicId} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderTop: i ? `1px solid ${tokens.cardBorder}` : "none", flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: tokens.textPrimary }}>{typeof row.title === "string" ? row.title : topicTitle(row.topicId)}</div>
                      <div style={{ fontSize: 13, color: tokens.textMuted, marginTop: 3 }}>
                        {levelLabel(row.baselineMasteryLevel)} <span aria-hidden="true">{isRtl ? "←" : "→"}</span> <span style={{ color: tokens.textPrimary, fontWeight: 600 }}>{levelLabel(row.currentMasteryLevel)}</span>
                      </div>
                    </div>
                    {change ? <StatusText tone={change.tone}>{change.label}</StatusText> : <span style={{ fontSize: 12.5, color: tokens.textMuted }}>{t("Not measured yet", "لسه ماتقاسش")}</span>}
                  </div>
                );
              })}
            </Panel>
          )}
          <PastAttempts tokens={tokens} lang={lang} rows={sessions}
            onOpen={(row) => setSessionId(row.id)}
            renderTitle={(row) => topicTitle(row.topicId)}
            renderMeta={(row) => `${row.answeredCount ?? 0}/${row.questionCount ?? 0} ${t("answered", "اتجاوبت")}`}
            isDone={(row) => row.status === "completed"} />
        </>
      )}
    </StudyPage>
  );
}

export default function ReassessmentPage(props) {
  if (demoMode()) return <DemoReassessmentPage {...props} />;
  return <RealReassessmentPage {...props} />;
}
