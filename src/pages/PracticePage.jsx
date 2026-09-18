import { demoMode } from "@/services/auth";
import { useCallback, useEffect, useState } from "react";
import { listCourses } from "@/services/courses";
import { createPracticeSession, getPracticeSession, submitPracticeAnswer, listPracticeSessions } from "@/services/learning";
import { apiErrorText } from "@/services/http";
import { CourseSelect, TopicSelect, QuestionFlow, LearnerSessionTabs } from "@/components/SessionSolver";
import { AlertStrip, inputStyle } from "@/components/ModuleUI";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { fetchPracticeQuestions } from "@/services/api";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { getCourse } from "@/data/courses";
import { Card, Btn, Chip, Bar, AsyncGate } from "@/components/ui";

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
        {t("Immediate feedback, and every correct answer adds evidence.", "تصحيح فوري، وكل إجابة صحيحة بتضيف دليلاً.")}
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
              {t("Session complete", "اكتمل التدريب")}
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
                "Solid work. Reassessment now gives you hard proof that these skills stuck.",
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
  const hFont = headingFont(lang);
  const bFont = bodyFont(lang);
  const [courseId, setCourseId] = useState("");
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
            return null;
          })
        : Promise.resolve(null),
    [effectiveCourseId, sessionId],
  );
  const sessionAsync = useAsync(loadSession);
  useEffect(() => {
    if (sessionId && !sessionAsync.loading && sessionAsync.data === null) {
      clearStore(storeKey);
      setSessionId("");
    }
  }, [sessionId, sessionAsync.loading, sessionAsync.data, storeKey]);
  const loadList = useCallback(
    () => (effectiveCourseId ? listPracticeSessions(effectiveCourseId).catch(() => []) : Promise.resolve([])),
    [effectiveCourseId],
  );
  const listAsync = useAsync(loadList);
  const historyRows = listAsync.data ?? [];
  const topicLabel = (id) => topics.find((topic) => topic.id === id)?.label?.[lang] ?? topics.find((topic) => topic.id === id)?.label?.en ?? id;
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

  return (
    <div className="genai-pad" style={{ padding: mobile ? "20px 16px" : "26px 32px", direction: isRtl ? "rtl" : "ltr", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 14, textAlign: isRtl ? "right" : "left" }}>
        <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: "0 0 4px" }}>{t("Practice", "التدريب")}</h1>
        <p style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, margin: 0, lineHeight: 1.6 }}>{t("Real AI-generated practice on a topic you choose — every answer is evaluated and written as evidence.", "تمرين حقيقي متولّد بالذكاء الاصطناعي على موضوع تختاره — كل إجابة بتتقيّم وتتبسط كدليل.")}</p>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12, alignItems: "flex-end", flexDirection: isRtl ? "row-reverse" : "row" }}>
        <CourseSelect courses={courses} value={effectiveCourseId ?? ""} onChange={setCourseId} tokens={tokens} lang={lang} placeholder={t("Choose course…", "اختار مقرر…")} />
        <label style={{ fontFamily: bFont, fontSize: 12, color: tokens.textSecondary, display: "inline-flex", flexDirection: "column", gap: 4 }}>
          {t("Questions", "عدد الأسئلة")}
          <select value={count} onChange={(event) => setCount(Number(event.target.value))} style={{ ...inputStyle(tokens, bFont), minWidth: 80, cursor: "pointer" }} className="genai-input">
            {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>
      {notice && <div style={{ marginBottom: 10 }}><AlertStrip tokens={tokens} lang={lang} tone="violet" icon={<span style={{ fontSize: 12 }}>!</span>} title={notice} /></div>}
      <AsyncGate
        tokens={tokens}
        lang={lang}
        loading={coursesAsync.loading || sessionAsync.loading || listAsync.loading}
        error={coursesAsync.error ?? sessionAsync.error ?? listAsync.error}
        reload={() => { coursesAsync.reload(); sessionAsync.reload(); listAsync.reload(); }}
        label={t("Loading practice…", "جاري تحميل التدريب…")}
      >
        {!sessionId && <LearnerSessionTabs tab={tab} onChange={setTab} tokens={tokens} lang={lang} />}
        {!sessionId && tab === "history" ? (
          <div>
            {historyRows.length === 0 ? (
              <p style={{ fontFamily: bFont, fontSize: 12, color: tokens.textFaint, margin: 0 }}>{t("No practice sessions yet.", "لسه مفيش جلسات تدريب.")}</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {historyRows.map((row) => (
                  <Card tokens={tokens} key={row.id} style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                      <span style={{ fontFamily: bFont, fontSize: 12.5, fontWeight: 600, color: tokens.textPrimary, flex: 1, textAlign: isRtl ? "right" : "left" }}>
                        {topicLabel(row.topicId)}
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
                      <Btn tokens={tokens} lang={lang} variant="ghost" onClick={() => { writeStore(storeKey, row.id); setSessionId(row.id); setTab("new"); }}>
                        {t("Open", "فتح")}
                      </Btn>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : !sessionId ? (
          <Card tokens={tokens} style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
              <TopicSelect topics={topics} value={topicId} onChange={setTopicId} tokens={tokens} lang={lang} placeholder={t("Choose topic…", "اختار موضوع…")} />
              <Btn tokens={tokens} lang={lang} disabled={busy || !topicId} onClick={() => void start()}>
                {busy ? t("Generating…", "جاري التوليد…") : t("Start practice", "ابدأ التدريب")}
              </Btn>
            </div>
          </Card>
        ) : (
          <QuestionFlow
            questions={session?.questions ?? []}
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
                  {t("Practice complete — evidence recorded.", "التدريب اكتمل — الأدلة اتسجلت.")}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Btn tokens={tokens} lang={lang} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.MASTERY })}>
                    {t("See mastery", "شوف الإتقان")}
                  </Btn>
                  <Btn tokens={tokens} lang={lang} variant="ghost" onClick={() => { clearStore(storeKey); setSessionId(""); setTab("new"); listAsync.reload(); }}>
                    {t("New practice session", "جلسة تدريب جديدة")}
                  </Btn>
                </div>
              </Card>
            ) : null}
          />
        )}
      </AsyncGate>
    </div>
  );
}

export default function PracticePage(props) {
  if (demoMode()) return <DemoPracticePage {...props} />;
  return <RealPracticePage {...props} />;
}
