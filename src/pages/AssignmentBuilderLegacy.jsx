import { useCallback, useEffect, useRef, useState } from "react";
import useAsync from "@/hooks/useAsync";
import { tk, MONO } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import {
  Card, Btn, inputStyle, textareaStyle, Toggle, StatusPill,
  AIGradingResultCard, Skeleton, BackCircle, bFontFor, hFontFor, toast,
} from "@/components/ModuleUI";
import { IconPlus, IconTrash, IconSparkle, IconEyeOff, IconWarning } from "@/components/Icons";
import { SCREENS } from "@/constants/routes";
import { AsyncGate } from "@/components/ui";
import { apiErrorText } from "@/services/http";
import { getCourse } from "@/services/courses";
import {
  ASSIGNMENT_STATUSES,
  addQuestion,
  closeAssignment,
  correctIndexes,
  createAssignment,
  deleteQuestion,
  getAssignment,
  publishAssignment,
  renameAssignment,
  reopenAssignment,
  setGradeVisibility,
  trueFalseCorrect,
  updateQuestion,
} from "@/services/assignments";
import { previewEvaluation } from "@/services/review";

const QUESTION_KIND_LABELS = {
  multiple_choice: { en: "Multiple choice", ar: "اختيار من متعدد" },
  multiple_select: { en: "Multiple select", ar: "اختيار متعدد الإجابات" },
  true_false: { en: "True / False", ar: "صح / خطأ" },
  short_answer: { en: "Short answer", ar: "إجابة قصيرة" },
  long_answer: { en: "Long answer", ar: "إجابة طويلة" },
  essay: { en: "Essay", ar: "مقال" },
  problem_solving: { en: "Problem-solving", ar: "حل مسألة" },
};
const kindNeedsOptions = (kind) => kind === "multiple_choice" || kind === "multiple_select";

let qSeq = 0;
const newQ = () => ({ key: ++qSeq, prompt: "", topicId: "", maxScore: "10", kind: "long_answer", options: ["", ""], correct: [], tfCorrect: true, referenceAnswer: "", rubric: "" });

export default function AssignmentBuilderPage({ state, dispatch }) {
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);

  const courseId = state.courseId ?? null;
  const assignmentId = state.assignmentId ?? null;

  const load = useCallback(() => {
    if (!courseId) return Promise.resolve({ course: null, assignment: null });
    if (assignmentId) {
      return Promise.all([getCourse(courseId), getAssignment(assignmentId)]).then(([course, assignment]) => ({ course, assignment }));
    }
    return getCourse(courseId).then((course) => ({ course, assignment: null }));
  }, [courseId, assignmentId]);
  const { data, loading, error, reload } = useAsync(load);

  const editing = data?.assignment ?? null;
  const course = data?.course ?? null;

  const [title, setTitle] = useState("");
  const [showScore, setShowScore] = useState(false);
  const [status, setStatus] = useState("open");
  const [questions, setQuestions] = useState([newQ()]);
  const [previewQ, setPreviewQ] = useState(0);
  const [previewText, setPreviewText] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [touched, setTouched] = useState(false);
  const [savingAs, setSavingAs] = useState(null);

  const idsRef = useRef({ assignmentId: null, questionIds: {} });
  const hydratedRef = useRef(null);

  useEffect(() => {
    if (!data) return;
    const key = `${data.course?.id ?? "none"}|${data.assignment?.id ?? "new"}`;
    if (hydratedRef.current === key) return;
    hydratedRef.current = key;
    idsRef.current = { assignmentId: data.assignment?.id ?? null, questionIds: {} };
    setTitle(data.assignment?.title.en ?? "");
    setShowScore(data.assignment?.showGradeToStudent ?? false);
    setStatus(
      data.assignment?.status === ASSIGNMENT_STATUSES.OPEN
        ? "open"
        : data.assignment?.status === ASSIGNMENT_STATUSES.DRAFT
          ? "draft"
          : data.assignment
            ? "closed"
            : "open"
    );
    setQuestions(
      data.assignment
        ? data.assignment.questions.map((q) => ({
            key: ++qSeq,
            id: q.id,
            prompt: q.text,
            topicId: q.topicId ?? "",
            maxScore: String(q.maxScore),
            kind: q.type ?? "long_answer",
            options: kindNeedsOptions(q.type) && q.options?.length >= 2 ? q.options.map((o) => o.text) : ["", ""],
            correct: q.type === "multiple_choice" || q.type === "multiple_select" ? correctIndexes(q) : [],
            tfCorrect: q.type === "true_false" ? (trueFalseCorrect(q) ?? true) : undefined,
            referenceAnswer: q.modelAnswer ?? "",
            rubric: q.rubricText ?? "",
          }))
        : [newQ()]
    );
    setPreviewResult(null);
    setPreviewText("");
    setPreviewQ(0);
  }, [data]);

  const patchQ = (key, patch) => setQuestions((qs) => qs.map((q) => (q.key === key ? { ...q, ...patch } : q)));

  const toggleCorrect = (key, index, multi) =>
    setQuestions((qs) =>
      qs.map((q) => {
        if (q.key !== key) return q;
        const cur = q.correct ?? [];
        const correct = multi ? (cur.includes(index) ? cur.filter((x) => x !== index) : [...cur, index]) : [index];
        return { ...q, correct };
      })
    );

  const toDraft = (q) => {
    const draft = {
      text: q.prompt.trim(),
      topicId: q.topicId,
      maxScore: Math.max(1, Number(q.maxScore) || 10),
      type: q.kind,
      modelAnswer: q.referenceAnswer.trim() || undefined,
      rubricText: q.rubric.trim() || undefined,
    };
    if (kindNeedsOptions(q.kind)) {
      const filled = q.options.map((o, i) => (o.trim() ? i : -1)).filter((i) => i >= 0);
      draft.options = filled.map((i) => q.options[i].trim());
      draft.correctIndexes = (q.correct ?? []).filter((i) => q.options[i]?.trim()).map((i) => filled.indexOf(i)).filter((i) => i >= 0);
    }
    if (q.kind === "true_false") draft.correctAnswer = q.tfCorrect !== false;
    return draft;
  };

  const titleValid = title.trim().length > 0;
  const objectiveValid = (q) =>
    q.kind === "multiple_choice"
      ? (q.correct ?? []).filter((i) => q.options[i]?.trim()).length === 1
      : q.kind === "multiple_select"
        ? (q.correct ?? []).filter((i) => q.options[i]?.trim()).length >= 1
        : true;
  const questionsValid = questions.every(
    (q) =>
      q.prompt.trim().length > 0 &&
      q.topicId &&
      Number(q.maxScore) > 0 &&
      (!kindNeedsOptions(q.kind) || (q.options.filter((o) => o.trim()).length >= 2 && objectiveValid(q)))
  );
  const canSave = titleValid && questionsValid;
  const accuracyEmpty = questions.every((q) => !q.referenceAnswer.trim() && !q.rubric.trim());

  const backToWorkspace = () =>
    dispatch({ type: "NAVIGATE", screen: SCREENS.COURSE_WORKSPACE, courseId, tab: "assignments", assignmentId: undefined });

  const ensureIds = async (index) => {
    const q = questions[index];
    let aid = idsRef.current.assignmentId;
    if (!aid) {
      const created = await createAssignment(courseId, title.trim() || (lang === "ar" ? "مسودة بدون عنوان" : "Untitled draft"));
      aid = created.id;
      idsRef.current.assignmentId = aid;
      if (showScore) await setGradeVisibility(aid, true);
    }
    let qid = idsRef.current.questionIds[q.key] ?? q.id ?? null;
    const draft = toDraft(q);
    if (qid) {
      await updateQuestion(aid, qid, draft);
    } else {
      const created = await addQuestion(aid, draft);
      qid = created.id;
    }
    idsRef.current.questionIds[q.key] = qid;
    if (!q.id) patchQ(q.key, { id: qid });
    return { aid, qid };
  };

  const save = async (as) => {
    setTouched(true);
    if (!canSave || savingAs) return;
    setSavingAs(as);
    try {
      if (as === "changes" && editing) {
        const aid = editing.id;
        if (title.trim() !== editing.title.en) await renameAssignment(aid, title.trim());
        if (showScore !== Boolean(editing.showGradeToStudent)) await setGradeVisibility(aid, showScore);
        for (const prevQ of editing.questions) {
          if (!questions.some((q) => q.id === prevQ.id)) await deleteQuestion(aid, prevQ.id);
        }
        for (const q of questions) {
          if (q.id) await updateQuestion(aid, q.id, toDraft(q));
          else await addQuestion(aid, toDraft(q));
        }
        const wasOpen = editing.status === ASSIGNMENT_STATUSES.OPEN;
        const targetOpen = status === "open";
        if (targetOpen && editing.status === ASSIGNMENT_STATUSES.DRAFT) await publishAssignment(aid);
        else if (targetOpen && !wasOpen) await reopenAssignment(aid);
        else if (!targetOpen && wasOpen) await closeAssignment(aid);
        toast(lang === "ar" ? "حُفظت تعديلات التكليف." : "Assignment changes saved.");
        backToWorkspace();
        return;
      }
      const assignment = await createAssignment(courseId, title.trim());
      if (showScore) await setGradeVisibility(assignment.id, true);
      for (const q of questions) await addQuestion(assignment.id, toDraft(q));
      if (as === "draft") {
        toast(lang === "ar" ? "حُفظ التكليف كمسودة — لن يراه الطلاب." : "Assignment saved as draft — students cannot see it.");
        backToWorkspace();
        return;
      }
      await publishAssignment(assignment.id);
      toast(lang === "ar" ? "نُشر التكليف — الحالة: مفتوح." : "Assignment published — status Open.");
      backToWorkspace();
    } catch (err) {
      toast(apiErrorText(err, lang));
    } finally {
      setSavingAs(null);
    }
  };

  const runPreview = async () => {
    const q = questions[previewQ];
    if (!q || !q.topicId || !previewText.trim() || previewing) return;
    setPreviewing(true);
    setPreviewResult(null);
    try {
      const { aid, qid } = await ensureIds(previewQ);
      const evaluation = await previewEvaluation(aid, qid, previewText);
      const confKey = String(evaluation.confidence ?? "").toLowerCase();
      setPreviewResult({
        aiScore: evaluation.score,
        confidence: ["high", "medium", "low", "insufficient_evidence"].includes(confKey) ? confKey : "insufficient_evidence",
        feedback: evaluation.feedbackText,
        criteria: Array.isArray(evaluation.rubricBreakdown)
          ? evaluation.rubricBreakdown.map((c) => ({
              label: c.criterion ?? c.label ?? "",
              earned: c.earned ?? c.points ?? c.score ?? 0,
              max: c.max_points ?? c.max ?? c.weight ?? 0,
            }))
          : undefined,
        misconceptions: (evaluation.misconceptions ?? [])
          .map((m) => (typeof m === "string" ? m : (m.code ?? m.description ?? "")))
          .filter(Boolean),
        sources: Array.isArray(evaluation.sourcesUsed?.chunkIds) ? evaluation.sourcesUsed.chunkIds : [],
      });
    } catch (err) {
      toast(apiErrorText(err, lang));
    } finally {
      setPreviewing(false);
    }
  };

  const monoLabel = (text) => (
    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.09em", color: tokens.textMuted, marginBottom: 7 }}>{text}</div>
  );
  const caption = (text) => <div style={{ fontFamily: bFont, fontSize: 11, color: tokens.textFaint, marginTop: 6 }}>{text}</div>;

  return (
    <AsyncGate
      tokens={tokens}
      lang={lang}
      loading={loading}
      error={error}
      reload={reload}
      label={lang === "ar" ? "جارٍ تحميل المُنشئ…" : "Loading builder…"}
    >
      {course && (
    <div className="genai-pad" style={{ padding: "26px 32px", maxWidth: 1280, margin: "0 auto", direction: isRtl ? "rtl" : "ltr" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 22, flexDirection: isRtl ? "row-reverse" : "row" }}>
        <BackCircle tokens={tokens} rtl={isRtl} onClick={backToWorkspace} />
        <div style={{ textAlign: isRtl ? "right" : "left", minWidth: 0 }}>
          <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: "0 0 4px" }}>
            {editing
              ? lang === "ar" ? `تعديل التكليف · ${course.code ?? course.id}` : `Edit assignment · ${course.code ?? course.id}`
              : lang === "ar" ? `تكليف جديد · ${course.code ?? course.id}` : `New assignment · ${course.code ?? course.id}`}
          </h1>
          <p style={{ fontSize: 13, color: tokens.textMuted, margin: 0, fontFamily: bFont }}>
            {lang === "ar"
              ? "بعد النشر يبقى التسليم مفتوحًا حتى تغلقه بنفسك."
              : "Once published, submissions stay open until you close them."}
          </p>
        </div>
      </div>

      <div
        className="genai-grid-builder"
        style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "minmax(0, 1fr) 440px", gap: mobile ? 16 : 24, alignItems: "start" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Card tokens={tokens} style={{ padding: "18px 20px" }}>
            {monoLabel(lang === "ar" ? "عنوان التكليف" : "ASSIGNMENT TITLE")}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={lang === "ar" ? "مثال: ثوابت الشجرة الثنائية والاجتياز" : "e.g. BST Invariants & Traversal"}
              style={inputStyle(tokens, bFont)}
              className="genai-input"
            />
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14, padding: "12px 14px", background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, flexDirection: isRtl ? "row-reverse" : "row" }}>
              <Toggle on={showScore} onChange={() => setShowScore(!showScore)} tokens={tokens} />
              <div style={{ textAlign: isRtl ? "right" : "left", flex: 1 }}>
                <div style={{ fontFamily: bFont, fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>
                  {lang === "ar" ? "إظهار الدرجة للطالب" : "Show score to student"}
                </div>
                <div style={{ fontFamily: bFont, fontSize: 11, color: tokens.textMuted, marginTop: 2, lineHeight: 1.55 }}>
                  {lang === "ar"
                    ? "يرى الطالب الدرجة بعد اعتمادك لها أو تعديلها فقط، وطالما كان هذا الإعداد مفعَّلًا."
                    : "Students see a grade only after you approve or edit it — and only while this is on."}
                </div>
              </div>
            </div>
            {editing && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, padding: "10px 14px", background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, flexDirection: isRtl ? "row-reverse" : "row" }}>
                <Toggle on={status === "open"} onChange={() => setStatus(status === "open" ? "closed" : "open")} tokens={tokens} />
                <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textSecondary, flex: 1 }}>
                  {lang === "ar" ? "حالة التكليف: مفتوح / مغلق — بلا مواعيد نهائية إطلاقاً." : "Assignment status: Open / Closed — there is no deadline concept here."}
                </div>
                <StatusPill status={status} tokens={tokens} lang={lang} />
              </div>
            )}
          </Card>

          {questions.map((q, i) => (
            <Card tokens={tokens} key={q.key} style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexDirection: isRtl ? "row-reverse" : "row" }}>
                <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em" }}>
                  {lang === "ar" ? `السؤال ${i + 1}` : `Question ${i + 1}`}
                </div>
                {questions.length > 1 && (
                  <button
                    onClick={() => {
                      setQuestions((qs) => qs.filter((x) => x.key !== q.key));
                      setPreviewResult(null);
                    }}
                    title={lang === "ar" ? "حذف السؤال" : "Remove question"}
                    aria-label={lang === "ar" ? "حذف السؤال" : "Remove question"}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: tokens.textFaint }}
                  >
                    <IconTrash size={14} color={tokens.textFaint} />
                  </button>
                )}
              </div>

              {monoLabel(lang === "ar" ? "نوع السؤال" : "QUESTION TYPE")}
              <select
                value={q.kind}
                onChange={(e) => patchQ(q.key, { kind: e.target.value })}
                style={{ ...inputStyle(tokens, bFont), cursor: "pointer", marginBottom: 14 }}
                className="genai-input"
              >
                {Object.entries(QUESTION_KIND_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>
                    {lang === "ar" ? l.ar : l.en}
                  </option>
                ))}
              </select>

              {monoLabel(lang === "ar" ? "نص السؤال" : "PROMPT")}
              <textarea
                value={q.prompt}
                onChange={(e) => patchQ(q.key, { prompt: e.target.value })}
                rows={3}
                style={textareaStyle(tokens, bFont)}
                className="genai-input"
              />

              {q.kind === "true_false" && (
                <div style={{ marginTop: 14 }}>
                  {monoLabel(lang === "ar" ? "الإجابة الصحيحة" : "CORRECT ANSWER")}
                  <div style={{ display: "flex", gap: 10 }}>
                    {[true, false].map((v) => {
                      const sel = (q.tfCorrect ?? true) === v;
                      return (
                        <button
                          key={String(v)}
                          type="button"
                          onClick={() => patchQ(q.key, { tfCorrect: v })}
                          style={{
                            flex: 1, padding: "10px 0", borderRadius: 10, cursor: "pointer",
                            fontFamily: bFont, fontSize: 13, fontWeight: 600,
                            background: sel ? tokens.primaryLight : tokens.card,
                            border: `1px solid ${sel ? tokens.primary : tokens.cardBorder}`,
                            color: sel ? tokens.primary : tokens.textSecondary,
                          }}
                        >
                          {v ? (lang === "ar" ? "صح" : "True") : (lang === "ar" ? "خطأ" : "False")}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {kindNeedsOptions(q.kind) && (
                <div style={{ marginTop: 14 }}>
                  {monoLabel(q.kind === "multiple_select" ? (lang === "ar" ? "الخيارات (يُسمح بأكثر من إجابة)" : "OPTIONS (MORE THAN ONE ALLOWED)") : (lang === "ar" ? "الخيارات (إجابة واحدة صحيحة)" : "OPTIONS (ONE CORRECT ANSWER)"))}
                  {q.options.map((opt, oi) => (
                    <div key={oi} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
                      <button
                        type="button"
                        onClick={() => toggleCorrect(q.key, oi, q.kind === "multiple_select")}
                        title={lang === "ar" ? "اضغط لتحديد هذا الخيار كإجابة صحيحة" : "Click to mark this option as correct"}
                        aria-label={lang === "ar" ? "تحديد كإجابة صحيحة" : "Mark as correct"}
                        style={{
                          fontFamily: MONO, fontSize: 11, width: 18, height: 18, flexShrink: 0, display: "inline-flex",
                          alignItems: "center", justifyContent: "center", borderRadius: q.kind === "multiple_select" ? 5 : "50%",
                          cursor: "pointer", padding: 0,
                          border: `1.5px solid ${(q.correct ?? []).includes(oi) ? tokens.primary : tokens.cardBorder}`,
                          background: (q.correct ?? []).includes(oi) ? tokens.primary : "transparent",
                          color: (q.correct ?? []).includes(oi) ? "#fff" : tokens.textFaint,
                        }}
                      >
                        {String.fromCharCode(65 + oi)}
                      </button>
                      <input
                        value={opt}
                        onChange={(e) => patchQ(q.key, { options: q.options.map((o, j) => (j === oi ? e.target.value : o)) })}
                        placeholder={lang === "ar" ? `نص الخيار ${oi + 1}` : `Option ${oi + 1} text`}
                        style={{ ...inputStyle(tokens, bFont), flex: 1, minWidth: 0 }}
                        className="genai-input"
                      />
                      {q.options.length > 2 && (
                        <button
                          onClick={() => {
                            patchQ(q.key, {
                              options: q.options.filter((_, j) => j !== oi),
                              correct: (q.correct ?? []).filter((j) => j !== oi).map((j) => (j > oi ? j - 1 : j)),
                            });
                          }}
                          title={lang === "ar" ? "حذف الخيار" : "Remove option"}
                          aria-label={lang === "ar" ? "حذف الخيار" : "Remove option"}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, flexShrink: 0 }}
                        >
                          <IconTrash size={13} color={tokens.textFaint} />
                        </button>
                      )}
                    </div>
                  ))}
                  <Btn tokens={tokens} lang={lang} variant="ghost" onClick={() => patchQ(q.key, { options: [...q.options, ""] })} style={{ padding: "7px 14px", fontSize: 12 }}>
                    {lang === "ar" ? "إضافة خيار" : "Add option"}
                  </Btn>
                  {touched && kindNeedsOptions(q.kind) && q.options.filter((o) => o.trim()).length < 2 && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center", fontFamily: bFont, fontSize: 11, color: tokens.gap, marginTop: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
                      <IconWarning size={12} color={tokens.gap} />
                      {lang === "ar" ? "خياران على الأقل مطلوبان." : "At least two options are required."}
                    </div>
                  )}
                  {touched && kindNeedsOptions(q.kind) && q.options.filter((o) => o.trim()).length >= 2 && !objectiveValid(q) && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center", fontFamily: bFont, fontSize: 11, color: tokens.gap, marginTop: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
                      <IconWarning size={12} color={tokens.gap} />
                      {q.kind === "multiple_choice"
                        ? lang === "ar" ? "حدد إجابة صحيحة واحدة بالضغط على حرف الخيار." : "Mark exactly one correct option by clicking its letter."
                        : lang === "ar" ? "حدد إجابة صحيحة واحدة على الأقل بالضغط على حرف الخيار." : "Mark at least one correct option by clicking its letter."}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "minmax(0, 2fr) minmax(0, 1fr)", gap: 14, marginTop: 14 }}>
                <div>
                  {monoLabel(lang === "ar" ? "الموضوع (إجباري)" : "TOPIC (REQUIRED) *")}
                  <select
                    value={q.topicId}
                    onChange={(e) => patchQ(q.key, { topicId: e.target.value })}
                    style={{ ...inputStyle(tokens, bFont), cursor: "pointer", borderColor: touched && !q.topicId ? tokens.gap : undefined }}
                    className="genai-input"
                  >
                    <option value="">{lang === "ar" ? "اختر موضوعاً..." : "Choose a topic..."}</option>
                    {(course.topics ?? []).map((t) => (
                      <option key={t.id} value={t.id}>
                        {lang === "ar" ? t.label.ar : t.label.en}
                      </option>
                    ))}
                  </select>
                  {touched && !q.topicId && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center", fontFamily: bFont, fontSize: 11, color: tokens.gap, marginTop: 6, flexDirection: isRtl ? "row-reverse" : "row" }}>
                      <IconWarning size={12} color={tokens.gap} />
                      {lang === "ar" ? "الموضوع إجباري — التقييم يستند إلى مواد الموضوع." : "Topic is required — grading grounds on the topic's materials."}
                    </div>
                  )}
                </div>
                <div>
                  {monoLabel(lang === "ar" ? "الدرجة العظمى" : "MAX SCORE")}
                  <input
                    type="number"
                    min={1}
                    value={q.maxScore}
                    onChange={(e) => patchQ(q.key, { maxScore: e.target.value })}
                    style={inputStyle(tokens, bFont)}
                    className="genai-input"
                  />
                </div>
              </div>

              <div style={{ marginTop: 16, padding: "14px 14px", background: tokens.inset, border: `1px dashed ${tokens.cardBorder}`, borderRadius: 10 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <IconSparkle size={13} color={tokens.primary} />
                  <span style={{ fontFamily: bFont, fontSize: 12, fontWeight: 600, color: tokens.textPrimary }}>
                    {lang === "ar" ? "حسّن دقة تقييم الذكاء الاصطناعي" : "Improve AI grading accuracy"}
                  </span>
                  <span style={{ fontFamily: bFont, fontSize: 10.5, color: tokens.textMuted }}>
                    · {lang === "ar" ? "اختياري" : "optional"}
                  </span>
                </div>

                <div style={{ marginTop: 8 }}>
                  {monoLabel(lang === "ar" ? "الإجابة المرجعية (اختياري)" : "REFERENCE ANSWER (OPTIONAL)")}
                  <textarea
                    value={q.referenceAnswer}
                    onChange={(e) => patchQ(q.key, { referenceAnswer: e.target.value })}
                    rows={2}
                    style={textareaStyle(tokens, bFont)}
                    className="genai-input"
                  />
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6, flexDirection: isRtl ? "row-reverse" : "row" }}>
                    <IconEyeOff size={12} color={tokens.textFaint} />
                    <span style={{ fontFamily: bFont, fontSize: 11, color: tokens.textFaint }}>
                      {lang === "ar" ? "لا يراها الطالب — تساعد فقط في تحسين دقة التصحيح الذكي." : "Only you see this — it just makes AI grading more accurate."}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  {monoLabel(lang === "ar" ? "معايير التصحيح / روبرك (اختياري)" : "GRADING CRITERIA / RUBRIC (OPTIONAL)")}
                  <textarea
                    value={q.rubric}
                    onChange={(e) => patchQ(q.key, { rubric: e.target.value })}
                    rows={2}
                    placeholder={lang === "ar" ? "سطر لكل معيار — سيُعرض تفصيل الدرجة لكل سطر." : "One line per criterion — the grade breakdown follows these lines."}
                    style={textareaStyle(tokens, bFont)}
                    className="genai-input"
                  />
                  {caption(lang === "ar" ? "سطر واحد لكل معيار — كنص عادي." : "One line per criterion, as plain text.")}
                </div>
              </div>
            </Card>
          ))}

          <button
            onClick={() => setQuestions((qs) => [...qs, newQ()])}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "12px 0", borderRadius: 12, cursor: "pointer",
              background: tokens.card, border: `1px solid ${tokens.cardBorder}`,
              color: tokens.textSecondary, fontFamily: bFont, fontWeight: 500, fontSize: 13,
            }}
          >
            <IconPlus size={14} color={tokens.textSecondary} />
            {lang === "ar" ? "إضافة سؤال" : "Add question"}
          </button>

          {accuracyEmpty && (
            <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted, lineHeight: 1.6, padding: "10px 14px", background: tokens.inset, borderRadius: 10, border: `1px solid ${tokens.cardBorder}`, textAlign: isRtl ? "right" : "left" }}>
              {lang === "ar"
                ? "سيستمر التصحيح الذكي لكن بثقة أقل — وإذا قلّت مواد الموضوع فستُحال الإجابات مباشرة إلى مراجعتك اليدوية."
                : "AI still grades, but with less confidence — thin course material goes straight to your manual review."}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
            {editing ? (
              <Btn tokens={tokens} lang={lang} disabled={Boolean(savingAs)} onClick={() => save("changes")} style={{ flex: 1, padding: "12px 0", fontSize: 13.5 }}>
                {savingAs ? (lang === "ar" ? "جارٍ الحفظ…" : "Saving…") : lang === "ar" ? "حفظ التعديلات" : "Save changes"}
              </Btn>
            ) : (
              <>
                <Btn tokens={tokens} lang={lang} variant="ghost" disabled={Boolean(savingAs)} onClick={() => save("draft")} style={{ padding: "12px 18px", fontSize: 13, ...(mobile ? { flex: 1 } : {}) }}>
                  {savingAs === "draft" ? (lang === "ar" ? "جارٍ الحفظ…" : "Saving…") : lang === "ar" ? "حفظ كمسودة" : "Save as draft"}
                </Btn>
                <Btn tokens={tokens} lang={lang} disabled={Boolean(savingAs)} onClick={() => save("publish")} style={{ flex: 1, padding: "12px 0", fontSize: 13.5 }}>
                  {savingAs === "publish" ? (lang === "ar" ? "جارٍ النشر…" : "Publishing…") : lang === "ar" ? "نشر التكليف" : "Publish assignment"}
                </Btn>
              </>
            )}
          </div>
          {touched && !canSave && (
            <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.gap, textAlign: isRtl ? "right" : "left" }}>
              {lang === "ar"
                ? "العنوان إجباري، وكل سؤال يحتاج نصاً وموضوعاً ودرجة عظمى صالحة."
                : "A title is required, and every question needs a prompt, a topic, and a valid max score."}
            </div>
          )}
        </div>

        <Card tokens={tokens} style={{ padding: "18px 20px", ...(mobile ? {} : { position: "sticky", top: 20 }) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexDirection: isRtl ? "row-reverse" : "row" }}>
            <IconSparkle size={15} color={tokens.primary} />
            <span style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em" }}>
              {lang === "ar" ? "معاينة التقييم" : "Preview grading"}
            </span>
          </div>
          <p style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, margin: "0 0 16px", lineHeight: 1.55 }}>
            {lang === "ar"
              ? "اكتب إجابة تجريبية وشاهد بالضبط ما سيفعله الذكاء الاصطناعي للطلاب الحقيقيين."
              : "Type a trial answer and see exactly what the AI will do for real students."}
          </p>

          {monoLabel(lang === "ar" ? "السؤال للمعاينة" : "QUESTION TO PREVIEW")}
          <select
            value={previewQ}
            onChange={(e) => {
              setPreviewQ(Number(e.target.value));
              setPreviewResult(null);
            }}
            style={{ ...inputStyle(tokens, bFont), cursor: "pointer", marginBottom: 14 }}
            className="genai-input"
          >
            {questions.map((q, i) => (
              <option key={q.key} value={i}>
                {lang === "ar" ? `السؤال ${i + 1}` : `Question ${i + 1}`}
              </option>
            ))}
          </select>

          {monoLabel(lang === "ar" ? "الإجابة التجريبية" : "TRIAL ANSWER")}
          <textarea
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            rows={5}
            style={textareaStyle(tokens, bFont)}
            className="genai-input"
          />

          <Btn
            tokens={tokens}
            lang={lang}
            variant="soft"
            disabled={!previewText.trim() || !questions[previewQ]?.topicId || previewing}
            onClick={runPreview}
            style={{ width: "100%", padding: "10px 0", fontSize: 12.5, marginTop: 12 }}
          >
            {previewing ? (lang === "ar" ? "جارٍ التقييم…" : "Grading…") : lang === "ar" ? "تقييم الإجابة التجريبية" : "Grade trial answer"}
          </Btn>

          <div style={{ marginTop: 16 }}>
            {previewing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Skeleton h={22} w="60%" tokens={tokens} />
                <Skeleton h={12} tokens={tokens} />
                <Skeleton h={12} w="85%" tokens={tokens} />
                <Skeleton h={12} w="70%" tokens={tokens} />
                <div style={{ fontFamily: MONO, fontSize: 10, color: tokens.textFaint, textAlign: "center" }}>
                  {lang === "ar" ? "استدعاء حقيقي للتقييم — ثوانٍ قليلة" : "real evaluation call — a few seconds"}
                </div>
              </div>
            ) : previewResult ? (
              <AIGradingResultCard
                eval={previewResult}
                max={Math.max(1, Number(questions[previewQ]?.maxScore) || 10)}
                tokens={tokens}
                lang={lang}
                title={lang === "ar" ? "نتيجة المعاينة" : "PREVIEW RESULT"}
              />
            ) : null}
            {previewResult && (
              <div style={{ fontFamily: bFont, fontSize: 10.5, color: tokens.textFaint, marginTop: 8 }}>
                {lang === "ar" ? "معاينة فقط — لا يُحفظ شيء." : "Preview only — nothing is saved."}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
      )}
    </AsyncGate>
  );
}