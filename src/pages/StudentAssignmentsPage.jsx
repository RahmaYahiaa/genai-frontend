import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { tk, MONO } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { demoMode } from "@/services/auth";
import { apiErrorText } from "@/services/http";
import {
  getAssignment,
  STATUS_LABELS,
  QUESTION_TYPE_LABELS,
  OBJECTIVE_TYPES,
  QUESTION_TYPES,
} from "@/services/assignments";
import { saveAnswer, submitAssignment, getStudentResult, SUBMISSION_STATUS_LABELS } from "@/services/submissions";
import { AsyncGate } from "@/components/ui";
import { AlertStrip, BackCircle, Btn, Card, Chip, bFontFor, hFontFor, textareaStyle } from "@/components/ModuleUI";
import StudentAssignmentLegacy from "@/pages/StudentAssignmentLegacy";

function isEmptyValue(question, value) {
  if (OBJECTIVE_TYPES.includes(question.type)) return (value?.selectedIds ?? []).length === 0;
  return !(value?.text ?? "").trim();
}

function optionLabel(option, lang) {
  if (option.text === "True") return lang === "ar" ? "صح" : "True";
  if (option.text === "False") return lang === "ar" ? "خطأ" : "False";
  return option.text;
}

function formatDate(value, lang) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function submitErrorText(err, lang) {
  const ar = lang === "ar";
  if (err?.status === 409) {
    return ar
      ? "التسليم اتقفل أو اتسلّم بالفعل — حدّث الصفحة عشان تشوف حالتك الحالية."
      : "Submission is closed or already submitted — reload the page to see your current state.";
  }
  if (err?.status === 422 || String(err?.message ?? "").includes("at least one")) {
    return ar ? "اكتب إجابة واحدة على الأقل قبل ما تسلّم." : "Answer at least one question before submitting.";
  }
  return apiErrorText(err, lang);
}

function SaveHint({ status, tokens, lang }) {
  if (!status) return null;
  const map = {
    saving: { text: lang === "ar" ? "جاري الحفظ…" : "Saving…", color: tokens.textFaint },
    saved: { text: lang === "ar" ? "محفوظ" : "Saved", color: tokens.mastered },
    error: { text: lang === "ar" ? "مش محفوظ" : "Not saved", color: tokens.gap },
  }[status];
  return <span style={{ fontFamily: MONO, fontSize: 10, color: map.color, flexShrink: 0 }}>{map.text}</span>;
}

function QuestionCard({ question, value, saveStatus, tokens, lang, mobile, onChange }) {
  const isRtl = lang === "ar";
  const objective = OBJECTIVE_TYPES.includes(question.type);
  const multi = question.type === QUESTION_TYPES.MULTIPLE_SELECT;
  const selected = value?.selectedIds ?? [];

  function pick(optionId) {
    if (multi) {
      const next = selected.includes(optionId)
        ? selected.filter((id) => id !== optionId)
        : [...selected, optionId];
      onChange({ text: value?.text ?? "", selectedIds: next });
      return;
    }
    onChange({ text: value?.text ?? "", selectedIds: [optionId] });
  }

  return (
    <Card tokens={tokens} style={{ padding: mobile ? "12px 14px" : "14px 16px" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
        <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.textFaint }}>Q{question.orderIndex}</span>
        <Chip tokens={tokens} tone="primary">
          {lang === "ar" ? QUESTION_TYPE_LABELS[question.type]?.ar : QUESTION_TYPE_LABELS[question.type]?.en}
        </Chip>
        <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.textMuted }}>
          {question.maxScore} {lang === "ar" ? "درجة" : "pts"}
        </span>
        <span style={{ flex: 1 }} />
        <SaveHint status={saveStatus} tokens={tokens} lang={lang} />
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: tokens.textPrimary, lineHeight: 1.6, marginBottom: 8, textAlign: isRtl ? "right" : "left" }}>
        {question.text}
      </div>
      {objective ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {question.options.map((option, optionIndex) => {
            const active = selected.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => pick(option.id)}
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: `1.5px solid ${active ? tokens.primary : tokens.cardBorder}`,
                  background: active ? tokens.primaryLight : tokens.inset,
                  cursor: "pointer",
                  flexDirection: isRtl ? "row-reverse" : "row",
                  width: "100%",
                }}
              >
                {multi ? (
                  <span style={{ width: 13, height: 13, borderRadius: 4, border: `1.5px solid ${active ? tokens.primary : tokens.textFaint}`, background: active ? tokens.primary : "transparent", flexShrink: 0 }} />
                ) : (
                  <span style={{ fontFamily: MONO, fontSize: 10, color: active ? tokens.primary : tokens.textFaint, flexShrink: 0 }}>
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                )}
                <span style={{ fontSize: 12.5, color: tokens.textPrimary, flex: 1, textAlign: isRtl ? "right" : "left" }}>
                  {optionLabel(option, lang)}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <textarea
          value={value?.text ?? ""}
          onChange={(event) => onChange({ text: event.target.value, selectedIds: [] })}
          rows={question.type === QUESTION_TYPES.SHORT_ANSWER ? 2 : 5}
          placeholder={lang === "ar" ? "اكتب إجابتك هنا…" : "Write your answer here…"}
          style={{
            ...textareaStyle(tokens, bFontFor(lang)),
            width: "100%",
            minHeight: question.type === QUESTION_TYPES.SHORT_ANSWER ? 44 : 96,
            resize: "vertical",
          }}
        />
      )}
    </Card>
  );
}

function ResultPanel({ assignment, tokens, lang }) {
  const isRtl = lang === "ar";
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const bFont = bFontFor(lang);
  const hFont = hFontFor(lang);
  const load = useCallback(() => getStudentResult(assignment.id), [assignment.id]);
  const { data, loading, error, reload } = useAsync(load);
  const totalMax = (assignment.questions ?? []).reduce((sum, question) => sum + question.maxScore, 0);
  const submittedAt = assignment.submission?.submittedAt ?? null;
  const statusLabel = SUBMISSION_STATUS_LABELS[assignment.submission?.status];
  let view = null;
  if (data) {
    if (!data.available && data.reason === "NOT_SUBMITTED") view = "none";
    else if (!data.available && data.reason === "RESUBMISSION_REQUESTED") view = "resub";
    else if (!data.available && data.reason === "NOT_FINALIZED" && assignment.submission?.status === "DRAFT") view = "none";
    else if (!data.available && data.reason === "NOT_FINALIZED") view = "review";
    else if (!data.available && data.reason === "GRADES_HIDDEN") view = "hidden";
    else if (data.available) view = "score";
  }

  return (
    <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Loading your result…", "جاري تحميل نتيجتك…")}>
      {view === "none" && (
        <Card tokens={tokens} style={{ padding: "18px 20px", textAlign: isRtl ? "right" : "left" }}>
          <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: 15, color: tokens.textPrimary, marginBottom: 6 }}>
            {t("Nothing submitted yet", "لسه مفيش تسليم")}
          </div>
          <p style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.7, margin: 0 }}>
            {assignment.status === "CLOSED"
              ? t("This assignment closed before you submitted anything, so there is no result to show.", "التكليف ده اتقفل قبل ما تسلّم أي حاجة، فمفيش نتيجة تتعرض.")
              : t("You have not submitted this assignment yet.", "لسه ما سلّمتش التكليف ده.")}
          </p>
        </Card>
      )}
      {view === "resub" && (
        <Card tokens={tokens} style={{ padding: "18px 20px", textAlign: isRtl ? "right" : "left" }}>
          <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: 15, color: tokens.gap, marginBottom: 6 }}>
            {t("Resubmission requested", "مطلوب إعادة تسليم")}
          </div>
          <p style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textSecondary, lineHeight: 1.7, margin: 0 }}>
            {data.resubmissionRequest?.reason ||
              t("Your instructor asked you to rework this assignment.", "الدكتور طلب إنك تعيد شغل التكليف ده.")}
          </p>
          <p style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted, lineHeight: 1.7, margin: "8px 0 0" }}>
            {t("No grade is shown for a returned attempt until your instructor finalizes the new one.", "مفيش درجة هتظهر للمحاولة المرجعة قبل ما الدكتور يعتمد المحاولة الجديدة.")}
          </p>
        </Card>
      )}
      {view === "review" && (
        <Card tokens={tokens} style={{ padding: "18px 20px", textAlign: isRtl ? "right" : "left" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6, flexDirection: isRtl ? "row-reverse" : "row" }}>
            <span style={{ fontFamily: hFont, fontWeight: 700, fontSize: 15, color: tokens.textPrimary }}>
              {t("Under review", "تحت المراجعة")}
            </span>
            {statusLabel && <Chip tokens={tokens} tone="primary">{lang === "ar" ? statusLabel.ar : statusLabel.en}</Chip>}
          </div>
          <p style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.7, margin: 0 }}>
            {submittedAt
              ? t(`Your answers were submitted on ${formatDate(submittedAt, lang)}. Grading and instructor review are in progress — the final result appears here once your instructor finalizes it.`, `إجاباتك اتسلّمت يوم ${formatDate(submittedAt, lang)}. التصحيح ومراجعة الدكتور شغالين — النتيجة النهائية هتظهر هنا أول ما الدكتور يعتمدها.`)
              : t("Grading and instructor review are in progress — the final result appears here once your instructor finalizes it.", "التصحيح ومراجعة الدكتور شغالين — النتيجة النهائية هتظهر هنا أول ما الدكتور يعتمدها.")}
          </p>
        </Card>
      )}
      {view === "hidden" && (
        <Card tokens={tokens} style={{ padding: "18px 20px", textAlign: isRtl ? "right" : "left" }}>
          <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: 15, color: tokens.textPrimary, marginBottom: 6 }}>
            {t("Result not released yet", "النتيجة لسه مش منشورة")}
          </div>
          <p style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.7, margin: 0 }}>
            {t("Your instructor finalized the grade but has not released it to students yet. Check back later.", "الدكتور اعتماد الدرجة بس لسه ما نشرهاش للطلاب — رجّع هنا بعد شوية.")}
          </p>
        </Card>
      )}
      {view === "score" && (
        <Card tokens={tokens} style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
            <div style={{ textAlign: isRtl ? "right" : "left" }}>
              <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: 15, color: tokens.textPrimary, marginBottom: 4 }}>
                {t("Final result", "النتيجة النهائية")}
              </div>
              <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted }}>
                {t("Finalized on", "اعتمدت في")} {formatDate(data.result.decidedAt, lang)}
              </div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 700, color: tokens.primary, lineHeight: 1.1 }}>
              {data.result.finalScoreTotal ?? 0}
              <span style={{ fontSize: 13, color: tokens.textMuted }}> / {totalMax}</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
            {(assignment.questions ?? []).map((question) => {
              const grade = (data.result.answers ?? []).find((item) => item.questionId === question.id);
              return (
                <div key={question.id} style={{ borderTop: `1px solid ${tokens.cardBorder}`, paddingTop: 10 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", flexDirection: isRtl ? "row-reverse" : "row" }}>
                    <span style={{ fontFamily: bFont, fontSize: 12.5, fontWeight: 600, color: tokens.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%", textAlign: isRtl ? "right" : "left" }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.textFaint }}>Q{question.orderIndex}</span> {question.text}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: tokens.textSecondary, flexShrink: 0 }}>
                      {grade ? `${grade.finalScore} / ${question.maxScore}` : `— / ${question.maxScore}`}
                    </span>
                  </div>
                  {grade?.finalFeedback && (
                    <p style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted, lineHeight: 1.6, margin: "4px 0 0", textAlign: isRtl ? "right" : "left" }}>
                      {grade.finalFeedback}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {data.result.finalFeedback && (
            <div style={{ marginTop: 14, borderTop: `1px solid ${tokens.cardBorder}`, paddingTop: 12 }}>
              <div style={{ fontFamily: bFont, fontSize: 12, fontWeight: 700, color: tokens.textPrimary, marginBottom: 4 }}>
                {t("Instructor feedback", "ملاحظات الدكتور")}
              </div>
              <p style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textSecondary, lineHeight: 1.7, margin: 0, textAlign: isRtl ? "right" : "left" }}>
                {data.result.finalFeedback}
              </p>
            </div>
          )}
        </Card>
      )}
    </AsyncGate>
  );
}

function RealStudentAssignmentView({ state, dispatch }) {
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);
  const assignmentId = state.assignmentId;

  const load = useCallback(
    () => (assignmentId ? getAssignment(assignmentId) : Promise.resolve(null)),
    [assignmentId],
  );
  const { data, loading, error, reload } = useAsync(load);

  const [answers, setAnswers] = useState({});
  const [saveState, setSaveState] = useState({});
  const [submitPhase, setSubmitPhase] = useState("idle");
  const [submitError, setSubmitError] = useState(null);
  const answersRef = useRef({});
  const dirtyRef = useRef(new Set());
  const timersRef = useRef({});
  const dataRef = useRef(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!data) return;
    answersRef.current = {};
    dirtyRef.current = new Set();
    setAnswers({});
    setSaveState({});
    setSubmitPhase("idle");
    setSubmitError(null);
  }, [data]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

  const questions = useMemo(
    () => [...(data?.questions ?? [])].sort((a, b) => a.orderIndex - b.orderIndex),
    [data],
  );
  const workingMap = useMemo(() => {
    const map = {};
    for (const working of data?.workingAnswers ?? []) {
      map[working.questionId] = { text: working.answerText ?? "", selectedIds: working.selectedOptionIds ?? [] };
    }
    return map;
  }, [data]);
  const workingMapRef = useRef({});
  useEffect(() => {
    workingMapRef.current = workingMap;
  }, [workingMap]);
  const valueFor = (questionId) => answers[questionId] ?? workingMap[questionId];
  const canSolve = Boolean(data?.canSubmit);
  const answeredCount = questions.filter((question) => !isEmptyValue(question, valueFor(question.id))).length;

  async function flushQuestion(questionId) {
    clearTimeout(timersRef.current[questionId]);
    if (!dirtyRef.current.has(questionId)) return true;
    const question = (dataRef.current?.questions ?? []).find((item) => item.id === questionId);
    if (!question) return true;
    const value = answersRef.current[questionId] ?? workingMapRef.current[questionId] ?? { text: "", selectedIds: [] };
    const body = OBJECTIVE_TYPES.includes(question.type)
      ? { selectedOptionIds: value.selectedIds }
      : { answerText: value.text };
    try {
      await saveAnswer(assignmentId, questionId, body);
      dirtyRef.current.delete(questionId);
      setSaveState((prev) => ({ ...prev, [questionId]: "saved" }));
      return true;
    } catch (saveError) {
      setSaveState((prev) => ({ ...prev, [questionId]: "error" }));
      if (saveError?.status === 409) reload();
      return false;
    }
  }

  function handleChange(question, next) {
    answersRef.current = { ...answersRef.current, [question.id]: next };
    setAnswers(answersRef.current);
    dirtyRef.current.add(question.id);
    setSaveState((prev) => ({ ...prev, [question.id]: "saving" }));
    clearTimeout(timersRef.current[question.id]);
    timersRef.current[question.id] = setTimeout(() => {
      void flushQuestion(question.id);
    }, 900);
  }

  async function handleSubmit() {
    setSubmitError(null);
    setSubmitPhase("sending");
    const pending = [...dirtyRef.current];
    const results = await Promise.all(pending.map((id) => flushQuestion(id)));
    if (results.some((ok) => !ok)) {
      setSubmitPhase("idle");
      setSubmitError(t("Some answers are not saved yet — check your connection and try again.", "فيه إجابات لسه مش محفوظة — اتأكد من اتصالك وحاول تاني."));
      return;
    }
    try {
      await submitAssignment(assignmentId);
      setSubmitPhase("idle");
      reload();
    } catch (submitError) {
      setSubmitPhase("idle");
      setSubmitError(submitErrorText(submitError, lang));
    }
  }

  return (
    <div className="genai-pad" style={{ padding: mobile ? "20px 16px" : "26px 32px", direction: isRtl ? "rtl" : "ltr", maxWidth: 860, margin: "0 auto" }}>
      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Loading assignment…", "جاري تحميل التكليف…")}>
        {data && (
          <>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14, flexDirection: isRtl ? "row-reverse" : "row" }}>
              <BackCircle tokens={tokens} rtl={isRtl} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.STUDENT_ASSIGNMENTS })} />
              <div style={{ textAlign: isRtl ? "right" : "left", minWidth: 0 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 4, flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: 0 }}>
                    {data.title[lang]}
                  </h1>
                  <Chip tokens={tokens} tone={data.status === "OPEN" ? "primary" : "slate"}>
                    {lang === "ar" ? (STATUS_LABELS[data.status]?.ar ?? data.status) : (STATUS_LABELS[data.status]?.en ?? data.status)}
                  </Chip>
                  {canSolve && data.submission && SUBMISSION_STATUS_LABELS[data.submission.status] && (
                    <Chip tokens={tokens} tone="slate">
                      {lang === "ar" ? SUBMISSION_STATUS_LABELS[data.submission.status].ar : SUBMISSION_STATUS_LABELS[data.submission.status].en}
                    </Chip>
                  )}
                </div>
                <p style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, margin: 0, lineHeight: 1.6 }}>
                  {canSolve
                    ? data.submission
                      ? t("You have a saved draft — pick up where you left off. Answers keep saving automatically.", "عندك مسودة محفوظة — كمّل من حيث ما وقفت. الإجابات بتفضل تتحفظ تلقائياً.")
                      : t("Answers save automatically while you type. Submit once when you are done.", "إجاباتك بتتحفظ تلقائياً وانت بتكتب — وسلّم مرة واحدة لما تخلص.")
                    : t("This assignment is closed for editing — your result status is below.", "التكليف ده مقفول للتعديل — حالة نتيجتك تحت.")}
                </p>
              </div>
            </div>

            {canSolve && data.resubmissionRequest && (
              <div style={{ marginBottom: 12 }}>
                <AlertStrip
                  tokens={tokens}
                  lang={lang}
                  tone="violet"
                  icon={<span style={{ fontSize: 13 }}>↻</span>}
                  title={t("Resubmission requested", "مطلوب إعادة تسليم")}
                  body={data.resubmissionRequest.reason ||
                    t("Your instructor asked for a new attempt. Rework your answers below and submit again.", "الدكتور طلب محاولة جديدة — عدّل إجاباتك تحت وسلّم تاني.")}
                />
                {data.resubmissionRequest.reason && (
                  <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted, marginTop: 6, textAlign: isRtl ? "right" : "left" }}>
                    {t("No grade is shown for a returned attempt until your instructor finalizes the new one.", "مفيش درجة هتظهر للمحاولة المرجعة قبل ما الدكتور يعتمد المحاولة الجديدة.")}
                  </div>
                )}
              </div>
            )}

            {canSolve ? (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {questions.map((question) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      value={valueFor(question.id)}
                      saveStatus={saveState[question.id]}
                      tokens={tokens}
                      lang={lang}
                      mobile={mobile}
                      onChange={(next) => handleChange(question, next)}
                    />
                  ))}
                </div>
                <Card tokens={tokens} style={{ padding: "14px 16px", marginTop: 14 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                    <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textMuted }}>
                      {t(`Answered ${answeredCount} of ${questions.length}`, `جاوبت ${answeredCount} من ${questions.length}`)}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      {submitPhase === "idle" && (
                        <Btn tokens={tokens} lang={lang} disabled={answeredCount === 0} onClick={() => setSubmitPhase("confirm")}>
                          {t("Submit answers", "تسليم الإجابات")}
                        </Btn>
                      )}
                      {submitPhase === "confirm" && (
                        <>
                          <Btn tokens={tokens} lang={lang} onClick={() => void handleSubmit()}>
                            {t("Yes, submit", "أيوه، سلّم")}
                          </Btn>
                          <Btn tokens={tokens} lang={lang} variant="ghost" onClick={() => setSubmitPhase("idle")}>
                            {t("Cancel", "إلغاء")}
                          </Btn>
                        </>
                      )}
                      {submitPhase === "sending" && (
                        <Btn tokens={tokens} lang={lang} disabled>
                          {t("Submitting…", "جاري التسليم…")}
                        </Btn>
                      )}
                    </div>
                  </div>
                  {submitPhase === "confirm" && (
                    <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textSecondary, marginTop: 8, textAlign: isRtl ? "right" : "left" }}>
                      {t("After submitting, changes are possible only if your instructor returns the submission to you.", "بعد التسليم، التعديل ممكن بس لو الدكتور رجّعلك التسليم.")}
                    </div>
                  )}
                  {submitError && (
                    <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.gap, marginTop: 8, textAlign: isRtl ? "right" : "left" }}>
                      {submitError}
                    </div>
                  )}
                </Card>
              </>
            ) : (
              <ResultPanel assignment={data} tokens={tokens} lang={lang} />
            )}
          </>
        )}
      </AsyncGate>
    </div>
  );
}

export default function StudentAssignmentPage(props) {
  if (demoMode()) return <StudentAssignmentLegacy {...props} />;
  return <RealStudentAssignmentView {...props} />;
}
