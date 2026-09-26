import { demoMode } from "@/services/auth";
import useStudyCourse from "@/hooks/useStudyCourse";
import { useCallback, useEffect, useState } from "react";
import { listCourses } from "@/services/courses";
import { startDiagnostic, getDiagnostic, submitDiagnosticAnswer, listDiagnostics } from "@/services/learning";
import { apiErrorText } from "@/services/http";
import { QuestionFlow } from "@/components/SessionSolver";
import { StudyPage, StartPanel, Field, NumberStepper, PrimaryButton, SecondaryButton, TextButton, Notice, LoadingBlock, ErrorBlock, EmptyBlock, PastAttempts, ResultPanel, STATUS, summarize } from "@/components/study/StudyKit";
import { IconDiagnostic } from "@/components/Icons";
import { AlertStrip, inputStyle } from "@/components/ModuleUI";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { fetchDiagnosticQuestions } from "@/services/api";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { getCourse } from "@/data/courses";
import { RECOMMENDED_NEXT } from "@/data/student";
import { Card, Btn, Chip, Bar, AsyncGate } from "@/components/ui";
import { LearningHeader, GuidedIntro, SessionHistoryList, DonePanel, sessionStatusTone } from "@/components/learning";

function DemoDiagnosticPage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const mobile = useMediaQuery("(max-width: 760px)");
  const { data: questions, loading, error, reload } = useAsync(fetchDiagnosticQuestions);
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

  const results = questions?.reduce((acc, qq) => {
    acc[qq.topicId] = acc[qq.topicId] || { total: 0, correct: 0 };
    acc[qq.topicId].total += 1;
    if (answers[qq.id] === qq.correct) acc[qq.topicId].correct += 1;
    return acc;
  }, {});

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
      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Preparing your level check…", "جاري تجهيز التشخيص…")}>
        {phase === "intro" && (
          <Card tokens={tokens} style={{ marginTop: 12 }}>
            <Chip tokens={tokens} tone="primary">{t("Evidence-based", "قائم على الأدلة")}</Chip>
            <h1 style={{ margin: "12px 0 6px", fontSize: 20, fontWeight: 700, color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
              {t("Level check", "تشخيص المعرفة")}
            </h1>
            <p style={{ margin: "0 0 18px", fontSize: 13, color: tokens.textMuted, lineHeight: 1.65 }}>
              {t(
                "No grades, no pressure. We map exactly what you already know, so your study time goes where it actually matters.",
                "لا درجات ولا ضغط. بنحدد بالظبط اللي عارفاه، عشان وقت مذاكرتك يروح حيث يهم فعلاً.",
              )}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              <Chip tokens={tokens}>{questions?.length ?? 0} {t("questions", "أسئلة")}</Chip>
              <Chip tokens={tokens}>{t("~3 minutes", "~3 دقائق")}</Chip>
              <Chip tokens={tokens}>{t("Instant feedback", "أدلة فورية")}</Chip>
            </div>
            <Btn tokens={tokens} onClick={() => setPhase("run")}>{t("Start level check", "ابدأ التشخيص")}</Btn>
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
              <div style={{ display: "grid", gap: 8 }}>
                {q.options.map((o, i) => (
                  <button key={i} onClick={() => pick(i)} style={optionStyle(answers[q.id] === i)}>
                    {o[lang]}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 18 }}>
                <span style={{ fontSize: 11, color: tokens.textFaint, alignSelf: "center" }}>
                  {t("You can change your answer before continuing.", "تقدر تغير إجابتك قبل المتابعة.")}
                </span>
                <Btn tokens={tokens} disabled={answers[q.id] === undefined} onClick={next}>
                  {index + 1 >= questions.length ? t("Finish", "إنهاء") : t("Next", "التالي")}
                </Btn>
              </div>
            </Card>
          </>
        )}

        {phase === "done" && (
          <Card tokens={tokens} style={{ marginTop: 12 }}>
            <Chip tokens={tokens} tone="mastered">{t("Progress saved", "تم تسجيل الأدلة")}</Chip>
            <h2 style={{ margin: "12px 0 4px", fontSize: 18, fontWeight: 700, color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
              {t("Your knowledge map just got sharper", "خريطة معرفتك بقت أدق")}
            </h2>
            <p style={{ margin: "0 0 16px", fontSize: 12.5, color: tokens.textMuted }}>
              {t("Results per topic — ready to act on.", "النتائج لكل موضوع — جاهزة للفعل.")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {Object.entries(results).map(([topicId, r]) => (
                <div key={topicId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: tokens.inset, borderRadius: 10, border: `1px solid ${tokens.cardBorder}` }}>
                  <span style={{ flex: 1, fontSize: 12.5, color: tokens.textPrimary }}>{topicLabel(topicId)}</span>
                  <Chip tokens={tokens} tone={r.correct === r.total ? "mastered" : r.correct > 0 ? "primary" : "gap"}>
                    {r.correct}/{r.total} {t("correct", "صحيحة")}
                  </Chip>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 12.5, color: tokens.textPrimary, marginBottom: 8 }}>{t("Recommended next", "المُوصى به تالياً")}</div>
              {RECOMMENDED_NEXT.map((item) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: tokens.primary, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: tokens.textSecondary }}>{item[lang]}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Btn tokens={tokens} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.PRACTICE })}>
                {t("Practice the gaps", "تدرّب على الفجوات")}
              </Btn>
              <Btn tokens={tokens} variant="ghost" onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.DASHBOARD })}>
                {t("Back to dashboard", "رجوع للوحة")}
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
const readStore = (key) => (typeof sessionStorage === "undefined" ? null : sessionStorage.getItem(key));
const writeStore = (key, value) => {
  if (typeof sessionStorage !== "undefined") sessionStorage.setItem(key, value);
};
const clearStore = (key) => {
  if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(key);
};

function RealDiagnosticPage({ state, dispatch }) {
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
  const storeKey = `genai-diag-${effectiveCourseId ?? "none"}`;
  const [diagId, setDiagId] = useState("");
  const [perTopic, setPerTopic] = useState(2);
  const [tab, setTab] = useState("new");
  const [busy, setBusy] = useState(false);
  const [busyQuestion, setBusyQuestion] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    setDiagId(readStore(`genai-diag-${effectiveCourseId ?? "none"}`) ?? "");
    setNotice(null);
  }, [effectiveCourseId]);

  const loadDiag = useCallback(
    () =>
      effectiveCourseId && diagId
        ? getDiagnostic(effectiveCourseId, diagId).catch(() => {
            clearStore(`genai-diag-${effectiveCourseId ?? "none"}`);
            setDiagId(""); // stale or deleted session: back to the start screen
            return null;
          })
        : Promise.resolve(null),
    [effectiveCourseId, diagId],
  );
  const diagAsync = useAsync(loadDiag);
  const loadList = useCallback(
    () => (effectiveCourseId ? listDiagnostics(effectiveCourseId).catch(() => []) : Promise.resolve([])),
    [effectiveCourseId],
  );
  const listAsync = useAsync(loadList);
  const historyRows = listAsync.data ?? [];
  const diag = diagAsync.data;
  const answeredIds = (diag?.answers ?? []).map((answer) => answer.questionId);
  const evaluations = {};
  for (const answer of diag?.answers ?? []) evaluations[answer.questionId] = answer.evaluation;
  const questionTotal = diag?.questionCount ?? diag?.questions?.length ?? 0;
  const complete = Boolean(diag) && answeredIds.length >= questionTotal;

  async function start() {
    setBusy(true);
    setNotice(null);
    try {
      const created = await startDiagnostic(effectiveCourseId, { questionsPerTopic: perTopic });
      writeStore(storeKey, created.id);
      setDiagId(created.id);
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
      await submitDiagnosticAnswer(effectiveCourseId, diagId, { questionId, content, responseMode: "text" });
      diagAsync.reload();
      listAsync.reload();
    } catch (err) {
      setNotice(apiErrorText(err, lang));
    } finally {
      setBusyQuestion(null);
    }
  }

  // Voice answers: server-side transcription (configured transcription
  // provider) then the same evaluation pipeline as a text answer.
  async function answerVoice(questionId, audio) {
    setBusyQuestion(questionId);
    setNotice(null);
    try {
      await submitDiagnosticAnswer(effectiveCourseId, diagId, {
        questionId,
        content: "",
        responseMode: "voice",
        audioBase64: audio.audioBase64,
        audioMimeType: audio.audioMimeType,
      });
      diagAsync.reload();
      listAsync.reload();
    } catch (err) {
      setNotice(apiErrorText(err, lang));
    } finally {
      setBusyQuestion(null);
    }
  }

  // "I don't know" (EDUNation parity): missing-knowledge evidence, never a
  // misconception — better data than a lucky guess.
  async function answerIdk(questionId) {
    setBusyQuestion(questionId);
    setNotice(null);
    try {
      await submitDiagnosticAnswer(effectiveCourseId, diagId, { questionId, content: "", responseMode: "idk" });
      diagAsync.reload();
      listAsync.reload();
    } catch (err) {
      setNotice(apiErrorText(err, lang));
    } finally {
      setBusyQuestion(null);
    }
  }

  const courseProps = { courses, value: effectiveCourseId ?? "", onChange: setCourseId };
  const reset = () => { clearStore(storeKey); setDiagId(""); setTab("new"); listAsync.reload(); };
  const summary = summarize(evaluations);
  // Only the first load blocks the page; background reloads (after each answer)
  // must not unmount the question flow, or the student never sees feedback.
  const loading = (coursesAsync.loading && coursesAsync.data == null) || (diagAsync.loading && diagAsync.data == null) || (listAsync.loading && listAsync.data == null);
  const failed = coursesAsync.error ?? diagAsync.error ?? listAsync.error;

  return (
    <StudyPage tokens={tokens} lang={lang} mobile={mobile} course={courseProps}
      title={t("Check my level", "اعرف مستواك")}
      subtitle={t("Answer a few short questions so we know what you already understand and where to focus.", "جاوب على كام سؤال قصير عشان نعرف إنت فاهم إيه ولازم تركّز على إيه.")}
      actions={diagId && !complete ? <TextButton tokens={tokens} muted onClick={reset}>{t("Leave and start over", "اخرج وابدأ من الأول")}</TextButton> : null}
    >
      {notice && <Notice tokens={tokens} tone="danger" title={t("Something didn't work", "في حاجة ماشتغلتش")}>{t("Please try again in a moment.", "جرّب تاني كمان شوية.")}</Notice>}
      {loading ? (
        <LoadingBlock tokens={tokens} label={t("Loading…", "جاري التحميل…")} />
      ) : failed ? (
        <ErrorBlock tokens={tokens} lang={lang} onRetry={() => { coursesAsync.reload(); diagAsync.reload(); listAsync.reload(); }} />
      ) : courses.length === 0 ? (
        <EmptyBlock tokens={tokens} Icon={IconDiagnostic} title={t("Join a course first", "اشترك في مقرر الأول")} body={t("The level check uses your course topics.", "اختبار المستوى بيعتمد على مواضيع مقررك.")}
          action={<PrimaryButton tokens={tokens} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.COURSES })}>{t("Go to my courses", "روح لمقرراتي")}</PrimaryButton>} />
      ) : !diagId ? (
        <>
          <StartPanel tokens={tokens} mobile={mobile} Icon={IconDiagnostic}
            title={t("How it works", "بيشتغل إزاي")}
            body={t("You'll get questions from each topic in this course. Answer in your own words — if you don't know, just say so. It takes about 10 minutes.", "هتجيلك أسئلة من كل موضوع في المقرر. جاوب بأسلوبك، ولو مش عارف قول كده عادي. بياخد حوالي ١٠ دقايق.")}
            primary={<PrimaryButton tokens={tokens} busy={busy} disabled={!effectiveCourseId} onClick={() => void start()}>{busy ? t("Preparing your questions…", "بنجهّز أسئلتك…") : t("Start level check", "ابدأ اختبار المستوى")}</PrimaryButton>}
          >
            <Field tokens={tokens} label={t("Questions per topic", "عدد الأسئلة لكل موضوع")}>
              <NumberStepper tokens={tokens} value={perTopic} onChange={setPerTopic} min={1} max={10} ariaLabel={t("Questions per topic", "عدد الأسئلة لكل موضوع")} hint={t("Type a number from 1 to 10, or use the buttons.", "اكتب رقم من 1 لـ 10، أو استخدم الأزرار.")} />
            </Field>
          </StartPanel>
          <PastAttempts tokens={tokens} lang={lang} rows={historyRows}
            onOpen={(row) => { writeStore(storeKey, row.id); setDiagId(row.id); }}
            renderTitle={() => t("Level check", "اختبار مستوى")}
            renderMeta={(row) => `${row.createdAt ? new Date(row.createdAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB") + " · " : ""}${(row.answers ?? []).length}/${(row.questions ?? []).length} ${t("answered", "اتجاوبت")}`}
            isDone={(row) => row.status === "completed"} />
        </>
      ) : diag ? (
        <QuestionFlow key={diagId}
          questions={diag.questions ?? []}
          evaluations={evaluations}
          answeredIds={answeredIds}
          busyId={busyQuestion}
          onSubmit={(questionId, content) => void answer(questionId, content)}
          onIdk={(questionId) => void answerIdk(questionId)}
          onVoice={(questionId, audio) => void answerVoice(questionId, audio)}
          tokens={tokens}
          lang={lang}
          mobile={mobile}
          doneNote={complete ? (
            <ResultPanel tokens={tokens} mobile={mobile}
              title={t("Level check complete", "خلّصت اختبار المستوى")}
              body={t("Your progress has been updated. The best next step is to practise the topics you found hard.", "تقدّمك اتحدّث. أحسن خطوة جاية إنك تتدرّب على المواضيع اللي كانت صعبة عليك.")}
              stats={[
                { label: t("Correct", "صح"), value: summary.correct, color: STATUS.success.fg },
                { label: t("Partly correct", "صح جزئياً"), value: summary.partial, color: STATUS.warning.fg },
                { label: t("To work on", "محتاج تذاكره"), value: summary.incorrect + summary.unknown, color: STATUS.danger.fg },
              ]}
              primary={<PrimaryButton tokens={tokens} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.PRACTICE })}>{t("Start practising", "ابدأ التدريب")}</PrimaryButton>}
              secondary={[
                <SecondaryButton key="p" tokens={tokens} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.MASTERY })}>{t("See my progress", "شوف تقدّمي")}</SecondaryButton>,
                <SecondaryButton key="n" tokens={tokens} onClick={reset}>{t("New level check", "اختبار جديد")}</SecondaryButton>,
              ]} />
          ) : null}
        />
      ) : null}
    </StudyPage>
  );
}

export default function DiagnosticPage(props) {
  if (demoMode()) return <DemoDiagnosticPage {...props} />;
  return <RealDiagnosticPage {...props} />;
}
