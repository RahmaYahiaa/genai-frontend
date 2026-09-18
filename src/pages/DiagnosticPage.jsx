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
  const hFont = headingFont(lang);
  const bFont = bodyFont(lang);
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
  const complete = Boolean(diag) && answeredIds.length >= (diag?.questionCount ?? diag?.questions?.length ?? 0);

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

  return (
    <div className="genai-pad" style={{ padding: mobile ? "20px 16px" : "26px 32px", direction: isRtl ? "rtl" : "ltr", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 14, textAlign: isRtl ? "right" : "left" }}>
        <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: "0 0 4px" }}>{t("Diagnostic", "التشخيص")}</h1>
        <p style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, margin: 0, lineHeight: 1.6 }}>{t("A real diagnostic generated from your course topics — answers write real learning evidence.", "تشخيص حقيقي متولّد من مواضيع مقررك — إجاباتك بتكتب أدلة تعلّم حقيقية.")}</p>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12, alignItems: "flex-end", flexDirection: isRtl ? "row-reverse" : "row" }}>
        <CourseSelect courses={courses} value={effectiveCourseId ?? ""} onChange={setCourseId} tokens={tokens} lang={lang} placeholder={t("Choose course…", "اختار مقرر…")} />
        <label style={{ fontFamily: bFont, fontSize: 12, color: tokens.textSecondary, display: "inline-flex", flexDirection: "column", gap: 4 }}>
          {t("Questions per topic", "أسئلة لكل موضوع")}
          <select value={perTopic} onChange={(event) => setPerTopic(Number(event.target.value))} style={{ ...inputStyle(tokens, bFont), minWidth: 90, cursor: "pointer" }} className="genai-input">
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
          <div>
            {historyRows.length === 0 ? (
              <p style={{ fontFamily: bFont, fontSize: 12, color: tokens.textFaint, margin: 0 }}>{t("No diagnostics yet.", "لسه مفيش تشخيصات.")}</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {historyRows.map((row) => (
                  <Card tokens={tokens} key={row.id} style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                      <span style={{ fontFamily: bFont, fontSize: 12.5, fontWeight: 600, color: tokens.textPrimary, flex: 1, textAlign: isRtl ? "right" : "left" }}>
                        {t("Diagnostic", "تشخيص")}
                      </span>
                      <Chip tokens={tokens} tone={row.status === "completed" ? "mastered" : "developing"}>{row.status}</Chip>
                      <span style={{ fontFamily: bFont, fontSize: 11, color: tokens.textMuted }}>
                        {(row.answers ?? []).length}/{(row.questions ?? []).length}
                      </span>
                      {row.createdAt && (
                        <span style={{ fontFamily: bFont, fontSize: 10.5, color: tokens.textFaint }}>
                          {new Date(row.createdAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB")}
                        </span>
                      )}
                      <Btn tokens={tokens} lang={lang} variant="ghost" onClick={() => { writeStore(storeKey, row.id); setDiagId(row.id); setTab("new"); }}>
                        {t("Open", "فتح")}
                      </Btn>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : !diagId ? (
          <Card tokens={tokens} style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10, flexDirection: isRtl ? "row-reverse" : "row" }}>
              <Btn tokens={tokens} lang={lang} disabled={busy || !effectiveCourseId} onClick={() => void start()}>
                {busy ? t("Generating…", "جاري التوليد…") : t("Start diagnostic", "ابدأ التشخيص")}
              </Btn>
            </div>
            <p style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted, margin: 0, lineHeight: 1.7, textAlign: isRtl ? "right" : "left" }}>
              {t("The diagnostic stays open on this device until you finish it, even if you refresh.", "التشخيص بيفضل مفتوح على الجهاز ده لحد ما تخلصه، حتى لو عملت refresh.")}
            </p>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {diag && (
              <QuestionFlow
                questions={diag.questions ?? []}
                evaluations={evaluations}
                answeredIds={answeredIds}
                busyId={busyQuestion}
                onSubmit={(questionId, content) => void answer(questionId, content)}
                tokens={tokens}
                lang={lang}
                mobile={mobile}
                doneNote={complete ? (
                  <Card tokens={tokens} style={{ padding: "14px 16px" }}>
                    <div style={{ fontFamily: bFont, fontSize: 12.5, fontWeight: 600, color: tokens.textPrimary, marginBottom: 8, textAlign: isRtl ? "right" : "left" }}>
                      {t("Diagnostic complete — your mastery now reflects this evidence.", "التشخيص اكتمل — إتقانك بقى يعكس الأدلة دي.")}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Btn tokens={tokens} lang={lang} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.MASTERY })}>
                        {t("See mastery", "شوف الإتقان")}
                      </Btn>
                      <Btn tokens={tokens} lang={lang} variant="ghost" onClick={() => { clearStore(storeKey); setDiagId(""); setTab("new"); listAsync.reload(); }}>
                        {t("Start a new diagnostic", "ابدأ تشخيص جديد")}
                      </Btn>
                    </div>
                  </Card>
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
