import { useEffect, useState } from "react";
import { tk, MONO } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useInstructorModule } from "@/store/InstructorProvider";
import {
  Card, Btn, inputStyle, textareaStyle, Toggle, StatusPill,
  AIGradingResultCard, Skeleton, BackCircle, bFontFor, hFontFor, toast,
} from "@/components/ModuleUI";
import { IconPlus, IconTrash, IconSparkle, IconEyeOff, IconWarning } from "@/components/Icons";
import { SCREENS } from "@/constants/routes";
import { evaluateAnswer, COURSE_BY_ID, QUESTION_KIND_LABELS, kindNeedsOptions } from "@/data/instructorModule";

let qSeq = 0;
const newQ = () => ({ key: ++qSeq, prompt: "", topicId: "", maxScore: "10", kind: "long_answer", options: ["", ""], referenceAnswer: "", rubric: "" });

const STOP = ["that", "with", "from", "this", "have", "will", "each", "when", "than", "into", "over", "such", "they", "their", "which", "because", "order", "vertices", "vertex"];

export default function AssignmentBuilderPage({ state, dispatch }) {
  const { state: mod, publishAssignment, updateAssignment } = useInstructorModule();
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);

  const courseId = state.courseId ?? "CS301";
  const course = COURSE_BY_ID(courseId);
  const editing = mod.assignments.find((a) => a.id === state.assignmentId && a.courseId === courseId) ?? null;

  const [title, setTitle] = useState(editing ? editing.title.en : "");
  const [showScore, setShowScore] = useState(editing?.showScoreToStudent ?? false);
  const [status, setStatus] = useState(editing?.status ?? "open");
  const [questions, setQuestions] = useState(
    editing
      ? editing.questions.map((q) => ({ key: ++qSeq, prompt: q.prompt.en, topicId: q.topicId, maxScore: String(q.maxScore), kind: q.kind ?? "long_answer", options: q.options?.length >= 2 ? [...q.options] : ["", ""], referenceAnswer: q.referenceAnswer ?? "", rubric: q.rubric ?? "" }))
      : [newQ()]
  );
  const [previewQ, setPreviewQ] = useState(0);
  const [previewText, setPreviewText] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setTitle(editing?.title.en ?? "");
    setShowScore(editing?.showScoreToStudent ?? false);
    setStatus(editing?.status ?? "open");
    setQuestions(
      editing
        ? editing.questions.map((q) => ({ key: ++qSeq, prompt: q.prompt.en, topicId: q.topicId, maxScore: String(q.maxScore), kind: q.kind ?? "long_answer", options: q.options?.length >= 2 ? [...q.options] : ["", ""], referenceAnswer: q.referenceAnswer ?? "", rubric: q.rubric ?? "" }))
        : [newQ()]
    );
    setPreviewResult(null);
    setPreviewText("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.id]);

  const patchQ = (key, patch) => setQuestions((qs) => qs.map((q) => (q.key === key ? { ...q, ...patch } : q)));

  const toQuestionDef = (q, index) => ({
    id: editing ? editing.questions[index]?.id ?? `q${index + 1}` : `q${index + 1}`,
    prompt: { en: q.prompt, ar: q.prompt },
    topicId: q.topicId,
    maxScore: Math.max(1, Number(q.maxScore) || 10),
    kind: q.kind,
    options: kindNeedsOptions(q.kind) ? q.options.map((o) => o.trim()).filter(Boolean) : undefined,
    referenceAnswer: q.referenceAnswer.trim() || undefined,
    rubric: q.rubric.trim() || undefined,
    keyTerms: [
      ...new Set(
        [...q.referenceAnswer.toLowerCase().matchAll(/[a-z][a-z-]{3,}/g)]
          .map((m) => m[0])
          .filter((w) => !STOP.includes(w))
          .slice(0, 6)
      ),
    ],
  });

  const titleValid = title.trim().length > 0;
  const questionsValid = questions.every((q) => q.prompt.trim().length > 0 && q.topicId && Number(q.maxScore) > 0 && (!kindNeedsOptions(q.kind) || q.options.filter((o) => o.trim()).length >= 2));
  const canSave = titleValid && questionsValid;
  const accuracyEmpty = questions.every((q) => !q.referenceAnswer.trim() && !q.rubric.trim());

  const backToWorkspace = () =>
    dispatch({ type: "NAVIGATE", screen: SCREENS.COURSE_WORKSPACE, courseId, tab: "assignments", assignmentId: undefined });

  const save = (as) => {
    setTouched(true);
    if (!canSave) return;
    const defs = questions.map(toQuestionDef);
    if (as === "changes" && editing) {
      updateAssignment(editing.id, { titleEn: title.trim(), showScore, status, questions: defs });
      toast(lang === "ar" ? "حُفظت تعديلات التكليف." : "Assignment changes saved.");
      backToWorkspace();
      return;
    }
    if (as === "draft") {
      publishAssignment(courseId, { titleEn: title.trim(), titleAr: title.trim(), showScore, questions: defs }, "draft");
      toast(lang === "ar" ? "حُفظ التكليف كمسودة — لن يراه الطلاب." : "Assignment saved as draft — students cannot see it.");
      backToWorkspace();
      return;
    }
    publishAssignment(courseId, { titleEn: title.trim(), titleAr: title.trim(), showScore, questions: defs }, "open");
    toast(lang === "ar" ? "نُشر التكليف — الحالة: مفتوح." : "Assignment published — status Open.");
    backToWorkspace();
  };

  const previewDefs = questions.map(toQuestionDef);
  const runPreview = () => {
    const def = previewDefs[previewQ];
    if (!def || !def.topicId || !previewText.trim()) return;
    setPreviewing(true);
    setPreviewResult(null);
    window.setTimeout(() => {
      setPreviewResult(evaluateAnswer(def, previewText, course));
      setPreviewing(false);
    }, 650);
  };

  const monoLabel = (text) => (
    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.09em", color: tokens.textMuted, marginBottom: 7 }}>{text}</div>
  );
  const caption = (text) => <div style={{ fontFamily: bFont, fontSize: 11, color: tokens.textFaint, marginTop: 6 }}>{text}</div>;

  return (
    <div className="genai-pad" style={{ padding: "26px 32px", maxWidth: 1280, margin: "0 auto", direction: isRtl ? "rtl" : "ltr" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 22, flexDirection: isRtl ? "row-reverse" : "row" }}>
        <BackCircle tokens={tokens} rtl={isRtl} onClick={backToWorkspace} />
        <div style={{ textAlign: isRtl ? "right" : "left", minWidth: 0 }}>
          <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: "0 0 4px" }}>
            {editing
              ? lang === "ar" ? `تعديل التكليف · ${course.id}` : `Edit assignment · ${course.id}`
              : lang === "ar" ? `تكليف جديد · ${course.id}` : `New assignment · ${course.id}`}
          </h1>
          <p style={{ fontSize: 13, color: tokens.textMuted, margin: 0, fontFamily: bFont }}>
            {lang === "ar"
              ? "التكليفات المنشورة تبدأ مفتوحة وتبقى مفتوحة حتى تغلقها."
              : "Published assignments start Open and stay open until you close them."}
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
                    ? "لن يرى الطالب الدرجة إلا إذا اعتمدتها أو عدّلتها بنفسك وكان هذا الإعداد مفعّلاً لحظة فتحه الصفحة."
                    : "The student will only see the grade if the submission has been approved/edited by you and this setting is on at the exact moment the student opens the page."}
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

              {kindNeedsOptions(q.kind) && (
                <div style={{ marginTop: 14 }}>
                  {monoLabel(q.kind === "multiple_select" ? (lang === "ar" ? "الخيارات (يُسمح بأكثر من إجابة)" : "OPTIONS (MORE THAN ONE ALLOWED)") : (lang === "ar" ? "الخيارات (إجابة واحدة صحيحة)" : "OPTIONS (ONE CORRECT ANSWER)"))}
                  {q.options.map((opt, oi) => (
                    <div key={oi} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: tokens.textFaint, width: 18, flexShrink: 0, textAlign: "center" }}>{String.fromCharCode(65 + oi)}</span>
                      <input
                        value={opt}
                        onChange={(e) => patchQ(q.key, { options: q.options.map((o, j) => (j === oi ? e.target.value : o)) })}
                        placeholder={lang === "ar" ? `نص الخيار ${oi + 1}` : `Option ${oi + 1} text`}
                        style={{ ...inputStyle(tokens, bFont), flex: 1, minWidth: 0 }}
                        className="genai-input"
                      />
                      {q.options.length > 2 && (
                        <button
                          onClick={() => patchQ(q.key, { options: q.options.filter((_, j) => j !== oi) })}
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
                  {touched && q.options.filter((o) => o.trim()).length < 2 && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center", fontFamily: bFont, fontSize: 11, color: tokens.gap, marginTop: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
                      <IconWarning size={12} color={tokens.gap} />
                      {lang === "ar" ? "خياران على الأقل مطلوبان." : "At least two options are required."}
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
                    {course.topics.map((t) => (
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
                      {lang === "ar" ? "لا يراها الطالب أبداً. تُستخدم فقط لتحسين دقة التقييم." : "Never visible to the student. Used only to improve AI grading accuracy."}
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
                  {caption(lang === "ar" ? "نص حر في هذه المرحلة — ليس جدول درجات." : "Free text in this phase — not a scored criteria table.")}
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
                ? "سيعمل النظام حتى بدون إجابة مرجعية أو روبرك، لكن بثقة أقل — وإن لم توجد مواد كافية للموضوع فستذهب الإجابات مباشرة إلى مراجعتك اليدوية."
                : "The system will still work, but with lower confidence — and if there's not enough course material, it will go straight to your manual review."}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
            {editing ? (
              <Btn tokens={tokens} lang={lang} onClick={() => save("changes")} style={{ flex: 1, padding: "12px 0", fontSize: 13.5 }}>
                {lang === "ar" ? "حفظ التعديلات" : "Save changes"}
              </Btn>
            ) : (
              <>
                <Btn tokens={tokens} lang={lang} variant="ghost" onClick={() => save("draft")} style={{ padding: "12px 18px", fontSize: 13, ...(mobile ? { flex: 1 } : {}) }}>
                  {lang === "ar" ? "حفظ كمسودة" : "Save as draft"}
                </Btn>
                <Btn tokens={tokens} lang={lang} onClick={() => save("publish")} style={{ flex: 1, padding: "12px 0", fontSize: 13.5 }}>
                  {lang === "ar" ? "نشر التكليف" : "Publish assignment"}
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
            disabled={!previewText.trim() || !previewDefs[previewQ]?.topicId || previewing}
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
                max={previewDefs[previewQ].maxScore}
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
  );
}