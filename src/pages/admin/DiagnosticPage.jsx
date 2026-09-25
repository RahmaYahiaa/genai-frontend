import { demoMode } from "@/services/auth";
import { useCallback, useEffect, useState } from "react";
import { listCourses } from "@/services/courses";
import { startDiagnostic, getDiagnostic, submitDiagnosticAnswer, listDiagnostics } from "@/services/learning";
import { apiErrorText } from "@/services/http";
import { CourseSelect, QuestionFlow, LearnerSessionTabs } from "@/components/SessionSolver";
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
      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Preparing diagnostic…", "جاري تجهيز التشخيص…")}>
        {phase === "intro" && (
          <Card tokens={tokens} style={{ marginTop: 12 }}>
            <Chip tokens={tokens} tone="primary">{t("Evidence-based", "قائم على الأدلة")}</Chip>
            <h1 style={{ margin: "12px 0 6px", fontSize: 20, fontWeight: 700, color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
              {t("Knowledge Diagnostic", "تشخيص المعرفة")}
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
              <Chip tokens={tokens}>{t("Instant evidence", "أدلة فورية")}</Chip>
            </div>
            <Btn tokens={tokens} onClick={() => setPhase("run")}>{t("Start diagnostic", "ابدأ التشخيص")}</Btn>
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
            <Chip tokens={tokens} tone="mastered">{t("Evidence recorded", "تم تسجيل الأدلة")}</Chip>
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
  const [courseId, setCourseId] = useState("");
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
            return null;
          })
        : Promise.resolve(null),
    [effectiveCourseId, diagId],
  );
  const diagAsync = useAsync(loadDiag);
  useEffect(() => {
    if (diagId && !diagAsync.loading && diagAsync.data === null) {
      clearStore(storeKey);
      setDiagId("");
    }
  }, [diagId, diagAsync.loading, diagAsync.data, storeKey]);
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

  return (
    <div className="genai-pad" style={{ padding: mobile ? "20px 16px" : "26px 32px", direction: isRtl ? "rtl" : "ltr", maxWidth: 820, margin: "0 auto" }}>
      <LearningHeader
        tokens={tokens}
        lang={lang}
        mobile={mobile}
        journeyCurrent="diagnostic"
        dispatch={dispatch}
        kicker={t("Step 1 · Map your gaps", "الخطوة 1 · حدّد الفجوات")}
        kickerTone="primary"
        title={t("Knowledge Diagnostic", "تشخيص المعرفة")}
        subtitle={t(
          "An AI-generated diagnostic from your course topics. Your answers become honest learning evidence that decides what comes next.",
          "تشخيص مولَّد بالذكاء الاصطناعي من موضوعات مقررك. إجاباتك تصبح دليلَ تعلّمٍ صادقًا يحدّد ما يليه.",
        )}
      />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14, alignItems: "flex-end", flexDirection: isRtl ? "row-reverse" : "row" }}>
        <label style={{ fontSize: 11.5, fontWeight: 600, color: tokens.textMuted, display: "inline-flex", flexDirection: "column", gap: 4, flex: "1 1 220px", maxWidth: 340 }}>
          {t("Course", "المقرر")}
          <CourseSelect courses={courses} value={effectiveCourseId ?? ""} onChange={setCourseId} tokens={tokens} lang={lang} placeholder={t("Choose course…", "اختر مقررًا…")} />
        </label>
        <label style={{ fontSize: 11.5, fontWeight: 600, color: tokens.textMuted, display: "inline-flex", flexDirection: "column", gap: 4 }}>
          {t("Questions per topic", "أسئلة لكل موضوع")}
          <select value={perTopic} onChange={(event) => setPerTopic(Number(event.target.value))} style={{ ...inputStyle(tokens, bodyFont(lang)), minWidth: 90, cursor: "pointer" }} className="genai-input">
            {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>
      {notice && <div style={{ marginBottom: 10 }}><AlertStrip tokens={tokens} lang={lang} tone="violet" icon={<span style={{ fontSize: 12 }}>!</span>} title={notice} /></div>}
      <AsyncGate
        tokens={tokens}
        lang={lang}
        loading={coursesAsync.loading || diagAsync.loading || listAsync.loading}
        error={coursesAsync.error ?? diagAsync.error ?? listAsync.error}
        reload={() => { coursesAsync.reload(); diagAsync.reload(); listAsync.reload(); }}
        label={t("Loading diagnostic…", "جاري تحميل التشخيص…")}
      >
        {!diagId && <LearnerSessionTabs tab={tab} onChange={setTab} tokens={tokens} lang={lang} />}
        {!diagId && tab === "history" ? (
          <SessionHistoryList
            rows={historyRows}
            tokens={tokens}
            lang={lang}
            isRtl={isRtl}
            mobile={mobile}
            emptyLabel={t("No diagnostics yet.", "لا توجد تشخيصات بعد.")}
            emptyHint={t("Start your first diagnostic — it is the first step of your learning loop.", "ابدأ أول تشخيص لك — إنها الخطوة الأولى في حلقة تعلّمك.")}
            onOpen={(row) => { writeStore(storeKey, row.id); setDiagId(row.id); setTab("new"); }}
            renderTitle={() => t("Diagnostic", "تشخيص")}
            statusTone={(row) => sessionStatusTone(row.status)}
            statusLabel={(row) => (row.status === "completed" ? t("Completed", "مكتمل") : t("In progress", "قيد التقدم"))}
            renderMeta={(row) => (
              <>
                <span>{(row.answers ?? []).length}/{(row.questions ?? []).length}</span>
                {row.createdAt && <span>{new Date(row.createdAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB")}</span>}
              </>
            )}
          />
        ) : !diagId ? (
          <GuidedIntro
            tokens={tokens}
            lang={lang}
            mobile={mobile}
            badge={t("Evidence-based", "قائم على الأدلة")}
            badgeTone="primary"
            title={t("What does this diagnostic do?", "ماذا يفعل هذا التشخيص؟")}
            description={t(
              "It asks open questions per topic and evaluates your answers honestly — including an explicit «I don't know», which counts as missing knowledge, never as a misconception. The result is a trustworthy baseline for your mastery map.",
              "يطرح أسئلة مفتوحة لكل موضوع ويقيّم إجاباتك بصدق — ومنها خيار «لا أعرف» الصريح، الذي يُحتسب معرفةً ناقصة لا مفهومًا خاطئًا. والنتيجة خط أساس موثوق لخريطة إتقانك.",
            )}
            facts={[
              { label: t(`${perTopic} questions per topic`, `${perTopic} أسئلة لكل موضوع`) },
              { label: t("Honest «I don't know»", "خيار «لا أعرف» الصادق"), tone: "developing" },
              { label: t("Feeds your mastery map", "يغذي خريطة إتقانك"), tone: "mastered" },
            ]}
            primaryLabel={t("Start diagnostic", "ابدأ التشخيص")}
            primaryBusy={busy}
            primaryDisabled={!effectiveCourseId}
            onPrimary={() => void start()}
            note={t("The diagnostic stays open on this device until you finish it, even if you refresh.", "يبقى التشخيص مفتوحًا على هذا الجهاز حتى تُنهيه، ولو حدّثت الصفحة.")}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {diag && (
              <QuestionFlow
                questions={diag.questions ?? []}
                evaluations={evaluations}
                answeredIds={answeredIds}
                busyId={busyQuestion}
                onSubmit={(questionId, content) => void answer(questionId, content)}
                onIdk={(questionId) => void answerIdk(questionId)}
                tokens={tokens}
                lang={lang}
                mobile={mobile}
                doneNote={complete ? (
                  <DonePanel
                    tokens={tokens}
                    lang={lang}
                    isRtl={isRtl}
                    title={t("Diagnostic complete — your mastery now reflects this evidence.", "اكتمل التشخيص — أصبح إتقانك يعكس هذا الدليل.")}
                    subtitle={t("Choose your next step:", "اختر خطوتك التالية:")}
                    actions={[
                      { label: t("Practice the gaps", "تدرّب على الفجوات"), primary: true, onClick: () => dispatch({ type: "NAVIGATE", screen: SCREENS.PRACTICE }) },
                      { label: t("Ask the tutor", "اسأل المعلم"), onClick: () => dispatch({ type: "NAVIGATE", screen: SCREENS.TUTOR }) },
                      { label: t("See mastery", "اعرض الإتقان"), onClick: () => dispatch({ type: "NAVIGATE", screen: SCREENS.MASTERY }) },
                      { label: t("New diagnostic", "تشخيص جديد"), onClick: () => { clearStore(storeKey); setDiagId(""); setTab("new"); listAsync.reload(); } },
                    ]}
                  />
                ) : null}
              />
            )}
          </div>
        )}
      </AsyncGate>
    </div>
  );
}

export default function DiagnosticPage(props) {
  if (demoMode()) return <DemoDiagnosticPage {...props} />;
  return <RealDiagnosticPage {...props} />;
}
