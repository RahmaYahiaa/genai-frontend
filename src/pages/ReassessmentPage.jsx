import { demoMode } from "@/services/auth";
import { useCallback, useState } from "react";
import { listCourses } from "@/services/courses";
import { listReassessments, createReassessment, getReassessment, submitReassessmentAnswer, getLearningGain, CHANGE_LABELS } from "@/services/learning";
import { apiErrorText } from "@/services/http";
import { CourseSelect, TopicSelect, QuestionFlow, LearnerSessionTabs } from "@/components/SessionSolver";
import { AlertStrip, inputStyle } from "@/components/ModuleUI";
import { MasteryLabel } from "@/components/MasteryBar";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { fetchReassessmentQuestions } from "@/services/api";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { getCourse } from "@/data/courses";
import { Card, Btn, Chip, Bar, AsyncGate } from "@/components/ui";
import MasteryBar from "@/components/MasteryBar";

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
function RealReassessmentPage({ state }) {
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
  const topicTitle = (id) => topics.find((topic) => topic.id === id)?.label?.en ?? id;
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
    <div className="genai-pad" style={{ padding: mobile ? "20px 16px" : "26px 32px", direction: isRtl ? "rtl" : "ltr", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 14, textAlign: isRtl ? "right" : "left" }}>
        <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: "0 0 4px" }}>{t("Reassessment", "إعادة التقييم")}</h1>
        <p style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, margin: 0, lineHeight: 1.6 }}>{t("Prove your growth on a topic — before/after learning gain is computed from real evidence.", "أثبت نموّك في موضوع — مكسب التعلّم قبل/بعد محسوب من أدلة حقيقية.")}</p>
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
        loading={coursesAsync.loading || listAsync.loading || sessionAsync.loading || gainAsync.loading}
        error={coursesAsync.error ?? listAsync.error ?? sessionAsync.error ?? gainAsync.error}
        reload={() => { coursesAsync.reload(); listAsync.reload(); sessionAsync.reload(); gainAsync.reload(); }}
        label={t("Loading reassessments…", "جاري تحميل إعادة التقييم…")}
      >
        {!sessionId && <LearnerSessionTabs tab={tab} onChange={setTab} tokens={tokens} lang={lang} />}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {!sessionId && tab === "new" && (
            <Card tokens={tokens} style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                <TopicSelect topics={topics} value={topicId} onChange={setTopicId} tokens={tokens} lang={lang} placeholder={t("Choose topic…", "اختار موضوع…")} />
                <Btn tokens={tokens} lang={lang} disabled={busy || !topicId} onClick={() => void start()}>
                  {busy ? t("Generating…", "جاري التوليد…") : t("Start reassessment", "ابدأ إعادة التقييم")}
                </Btn>
              </div>
            </Card>
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
                <Card tokens={tokens} style={{ padding: "14px 16px" }}>
                  <div style={{ fontFamily: bFont, fontSize: 12.5, fontWeight: 600, color: tokens.textPrimary, marginBottom: 8, textAlign: isRtl ? "right" : "left" }}>
                    {t("Reassessment complete — the gain table below now reflects it.", "إعادة التقييم اكتملت — جدول المكسب تحت بقى يعكسها.")}
                  </div>
                  <Btn tokens={tokens} lang={lang} variant="ghost" onClick={() => setSessionId("")}>
                    {t("Back to list", "ارجع للقايمة")}
                  </Btn>
                </Card>
              ) : null}
            />
          )}

          {!sessionId && tab === "history" && (
            <div>
              <h3 style={{ fontFamily: hFont, fontSize: 13.5, fontWeight: 700, color: tokens.textPrimary, margin: "0 0 8px", textAlign: isRtl ? "right" : "left" }}>
                {t("Your reassessments", "إعادات التقييم بتاعتك")}
              </h3>
              {sessions.length === 0 ? (
                <p style={{ fontFamily: bFont, fontSize: 12, color: tokens.textFaint, margin: 0 }}>{t("No reassessments yet.", "لسه مفيش إعادات تقييم.")}</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {sessions.map((row) => (
                    <Card tokens={tokens} key={row.id} style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                        <span style={{ fontFamily: bFont, fontSize: 12.5, fontWeight: 600, color: tokens.textPrimary, flex: 1, textAlign: isRtl ? "right" : "left" }}>
                          {topicTitle(row.topicId)}
                        </span>
                        <Chip tokens={tokens} tone={row.status === "completed" ? "mastered" : "developing"}>{row.status}</Chip>
                        <span style={{ fontFamily: bFont, fontSize: 11, color: tokens.textMuted }}>
                          {row.answeredCount}/{row.questionCount}
                        </span>
                        <Btn tokens={tokens} lang={lang} variant="ghost" onClick={() => { setSessionId(row.id); setTab("new"); }}>
                          {t("Open", "فتح")}
                        </Btn>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {(!sessionId && tab === "history") ? null : (
          <div>
            <h3 style={{ fontFamily: hFont, fontSize: 13.5, fontWeight: 700, color: tokens.textPrimary, margin: "0 0 8px", textAlign: isRtl ? "right" : "left" }}>
              {t("Learning gain", "مكسب التعلّم")}
            </h3>
            {gains.length === 0 ? (
              <p style={{ fontFamily: bFont, fontSize: 12, color: tokens.textFaint, margin: 0 }}>{t("No topics to report yet.", "مفيش مواضيع للتقرير لسه.")}</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {gains.map((row) => (
                  <Card tokens={tokens} key={row.topicId} style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6, flexDirection: isRtl ? "row-reverse" : "row" }}>
                      <span style={{ fontFamily: bFont, fontSize: 12.5, fontWeight: 600, color: tokens.textPrimary, flex: 1, textAlign: isRtl ? "right" : "left" }}>
                        {typeof row.title === "string" ? row.title : topicTitle(row.topicId)}
                      </span>
                      <Chip tokens={tokens} tone={row.change === "improved" ? "mastered" : row.change === "declined" ? "gap" : "default"}>
                        {lang === "ar" ? CHANGE_LABELS[row.change]?.ar ?? row.change : CHANGE_LABELS[row.change]?.en ?? row.change}
                      </Chip>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <MasteryLabel level={String(row.baselineMasteryLevel ?? "no_evidence").replace("_", "-")} lang={lang} tokens={tokens} />
                      <span style={{ fontFamily: bFont, fontSize: 11, color: tokens.textFaint }}>→</span>
                      <MasteryLabel level={String(row.currentMasteryLevel ?? "no_evidence").replace("_", "-")} lang={lang} tokens={tokens} />
                      {row.change === "no_reassessment_yet" && (
                        <span style={{ fontFamily: bFont, fontSize: 10.5, color: tokens.textMuted, textAlign: isRtl ? "right" : "left" }}>
                          {t("no honest baseline yet — finish a reassessment", "لسه مفيش خط أساس صادق — خلّص إعادة تقييم")}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
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
