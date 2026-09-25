import { demoMode } from "@/services/auth";
import { useCallback, useState } from "react";
import { listCourses } from "@/services/courses";
import { listReassessments, createReassessment, getReassessment, submitReassessmentAnswer, getLearningGain } from "@/services/learning";
import { apiErrorText } from "@/services/http";
import { CourseSelect, TopicSelect, QuestionFlow, LearnerSessionTabs } from "@/components/SessionSolver";
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
      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Preparing reassessment…", "جاري تجهيز إعادة التقييم…")}>
        {phase === "intro" && (
          <Card tokens={tokens} style={{ marginTop: 12 }}>
            <Chip tokens={tokens} tone="mastered">{t("Growth measurement", "قياس النمو")}</Chip>
            <h1 style={{ margin: "12px 0 6px", fontSize: 20, fontWeight: 700, color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
              {t("Reassessment", "إعادة التقييم")}
            </h1>
            <p style={{ margin: "0 0 18px", fontSize: 13, color: tokens.textMuted, lineHeight: 1.65 }}>
              {t(
                "Same evidence standard as the diagnostic — but now we can prove improvement, topic by topic.",
                "نفس معيار الأدلة كالتشخيص — لكن دلوقتي نقدر نثبت التحسن، موضوعاً بموضوع.",
              )}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              <Chip tokens={tokens} tone="mastered">{t("Diagnostic completed", "التشخيص مكتمل")}</Chip>
              <Chip tokens={tokens} tone="primary">{t("Practice logged", "التدريب مسجل")}</Chip>
              <Chip tokens={tokens}>{t("4 questions", "4 أسئلة")}</Chip>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Btn tokens={tokens} onClick={() => setPhase("run")}>{t("Start reassessment", "ابدأ إعادة التقييم")}</Btn>
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
                "Evidence trail updated: every correct answer now carries proof on your mastery map.",
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
  const [courseId, setCourseId] = useState("");
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

  return (
    <div className="genai-pad" style={{ padding: mobile ? "20px 16px" : "26px 32px", direction: isRtl ? "rtl" : "ltr", maxWidth: 820, margin: "0 auto" }}>
      <LearningHeader
        tokens={tokens}
        lang={lang}
        mobile={mobile}
        journeyCurrent="reassessment"
        dispatch={dispatch}
        kicker={t("Step 4 · Prove the growth", "الخطوة 4 · أثبِت النمو")}
        kickerTone="mastered"
        title={t("Reassessment", "إعادة التقييم")}
        subtitle={t(
          "Answer again on a topic after learning and practicing — the before→after comparison below measures your real gain.",
          "أجب مجددًا على أحد الموضوعات بعد التعلم والتدريب — المقارنة قبل←بعد أدناه تقيس مكسبك الحقيقي.",
        )}
      />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14, alignItems: "flex-end", flexDirection: isRtl ? "row-reverse" : "row" }}>
        <label style={{ fontSize: 11.5, fontWeight: 600, color: tokens.textMuted, display: "inline-flex", flexDirection: "column", gap: 4, flex: "1 1 220px", maxWidth: 340 }}>
          {t("Course", "المقرر")}
          <CourseSelect courses={courses} value={effectiveCourseId ?? ""} onChange={setCourseId} tokens={tokens} lang={lang} placeholder={t("Choose course…", "اختر مقررًا…")} />
        </label>
        <label style={{ fontSize: 11.5, fontWeight: 600, color: tokens.textMuted, display: "inline-flex", flexDirection: "column", gap: 4 }}>
          {t("Questions", "عدد الأسئلة")}
          <select value={count} onChange={(event) => setCount(Number(event.target.value))} style={{ ...inputStyle(tokens, bodyFont(lang)), minWidth: 80, cursor: "pointer" }} className="genai-input">
            {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>
      {notice && <div style={{ marginBottom: 10 }}><AlertStrip tokens={tokens} lang={lang} tone="violet" icon={<span style={{ fontSize: 12 }}>!</span>} title={notice} /></div>}
      <AsyncGate
        tokens={tokens}
        lang={lang}
        loading={coursesAsync.loading || listAsync.loading || sessionAsync.loading || gainAsync.loading}
        error={coursesAsync.error ?? listAsync.error ?? sessionAsync.error ?? gainAsync.error}
        reload={() => { coursesAsync.reload(); listAsync.reload(); sessionAsync.reload(); gainAsync.reload(); }}
        label={t("Loading reassessments…", "جاري تحميل إعادة التقييم…")}
      >
        {!sessionId && <LearnerSessionTabs tab={tab} onChange={setTab} tokens={tokens} lang={lang} />}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {!sessionId && tab === "new" && (
            <GuidedIntro
              tokens={tokens}
              lang={lang}
              mobile={mobile}
              badge={t("Growth measurement", "قياس النمو")}
              badgeTone="mastered"
              title={t("Same standard, new proof", "نفس المعيار، دليل جديد")}
              description={t(
                "Reassessment uses the same evidence standard as the diagnostic — but now every topic shows an honest before→after change, so your growth is measured, not assumed.",
                "تستخدم إعادة التقييم معيار الأدلة نفسه الذي يعتمده التشخيص — لكن كل موضوع يعرض الآن تغيّرًا صادقًا قبل←بعد، فتُقاس نموّك قياسًا لا افتراضًا.",
              )}
              facts={[
                { label: t("Baseline vs current mastery", "خط الأساس مقابل الإتقان الحالي"), tone: "mastered" },
                { label: t("Computed from real evidence", "محسوب من أدلة فعلية"), tone: "primary" },
              ]}
              primaryLabel={t("Start reassessment", "ابدأ إعادة التقييم")}
              primaryBusy={busy}
              primaryDisabled={!topicId}
              onPrimary={() => void start()}
              note={topicId ? undefined : t("Choose a topic above to unlock start.", "اختر موضوعًا بالأعلى ليتفعّل بدء إعادة التقييم.")}
            >
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 16, flexDirection: isRtl ? "row-reverse" : "row" }}>
                <TopicSelect topics={topics} value={topicId} onChange={setTopicId} tokens={tokens} lang={lang} placeholder={t("Choose the topic to measure…", "اختر الموضوع الذي تريد قياسه…")} />
              </div>
            </GuidedIntro>
          )}

          {sessionId && session && (
            <QuestionFlow
              questions={session.questions ?? []}
              evaluations={evaluations}
              answeredIds={answeredIds}
              busyId={busyQuestion}
              onSubmit={(questionId, content) => void answer(questionId, content)}
              tokens={tokens}
              lang={lang}
              mobile={mobile}
              doneNote={complete ? (
                <DonePanel
                  tokens={tokens}
                  lang={lang}
                  isRtl={isRtl}
                  title={t("Reassessment complete — the gain table below now reflects it.", "اكتملت إعادة التقييم — جدول مكسب التعلم أدناه يعكسها الآن.")}
                  actions={[
                    { label: t("See the comparison", "اعرض المقارنة"), primary: true, onClick: () => setSessionId("") },
                    { label: t("See mastery", "اعرض الإتقان"), onClick: () => dispatch({ type: "NAVIGATE", screen: SCREENS.MASTERY }) },
                  ]}
                />
              ) : null}
            />
          )}

          {!sessionId && tab === "history" && (
            <SessionHistoryList
              rows={sessions}
              tokens={tokens}
              lang={lang}
              isRtl={isRtl}
              mobile={mobile}
              emptyLabel={t("No reassessments yet.", "لا توجد إعادات تقييم بعد.")}
              emptyHint={t("Reassess after practice — it unlocks the honest before→after comparison.", "أعِد التقييم بعد التدريب — يفتح ذلك المقارنة الصادقة قبل←بعد.")}
              onOpen={(row) => { setSessionId(row.id); setTab("new"); }}
              renderTitle={(row) => topicTitle(row.topicId)}
              statusTone={(row) => sessionStatusTone(row.status)}
              statusLabel={(row) => (row.status === "completed" ? t("Completed", "مكتمل") : t("In progress", "قيد التقدم"))}
              renderMeta={(row) => <span>{row.answeredCount}/{row.questionCount} {t("answered", "مُجاب")}</span>}
            />
          )}

          {!sessionId && tab === "history" ? null : (
            <section aria-label={t("Learning gain", "مكسب التعلم")}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10, flexDirection: isRtl ? "row-reverse" : "row" }}>
                <h3 style={{ fontFamily: headingFont(lang), fontSize: 14, fontWeight: 700, color: tokens.textPrimary, margin: 0 }}>
                  {t("Learning gain — before → after", "مكسب التعلم — قبل ← بعد")}
                </h3>
              </div>
              {gains.length === 0 ? (
                <p style={{ fontSize: 12, color: tokens.textFaint, margin: 0 }}>{t("No topics to report yet.", "لا توجد موضوعات للتقرير بعد.")}</p>
              ) : (
                <GainTable gains={gains} topicTitle={topicTitle} tokens={tokens} lang={lang} mobile={mobile} />
              )}
            </section>
          )}
        </div>
      </AsyncGate>
    </div>
  );
}

export default function ReassessmentPage(props) {
  if (demoMode()) return <DemoReassessmentPage {...props} />;
  return <RealReassessmentPage {...props} />;
}
