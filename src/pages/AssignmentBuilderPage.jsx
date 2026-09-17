import { useCallback, useState } from "react";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { tk, MONO } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { demoMode } from "@/services/auth";
import { apiErrorText } from "@/services/http";
import { getCourse } from "@/services/courses";
import {
  QUESTION_TYPES,
  OBJECTIVE_TYPES,
  QUESTION_TYPE_LABELS,
  STATUS_LABELS,
  correctIndexes,
  trueFalseCorrect,
  getAssignment,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  publishAssignment,
  closeAssignment,
  reopenAssignment,
  setGradeVisibility,
  renameAssignment,
} from "@/services/assignments";
import { AsyncGate } from "@/components/ui";
import { Card, Btn, Chip, BackCircle, inputStyle, textareaStyle, bFontFor, hFontFor, toast, Toggle } from "@/components/ModuleUI";
import { IconPlus, IconTrash, IconPencil, IconCheck } from "@/components/Icons";
import AssignmentBuilderLegacy from "@/pages/AssignmentBuilderLegacy";

const TYPE_KEYS = Object.keys(QUESTION_TYPE_LABELS);

function emptyDraft(topicId) {
  return {
    type: QUESTION_TYPES.ESSAY,
    topicId: topicId ?? "",
    text: "",
    maxScore: 10,
    options: ["", ""],
    correctIndexes: [],
    correctAnswer: true,
    modelAnswer: "",
    rubricText: "",
  };
}

function draftFromQuestion(question) {
  return {
    type: question.type,
    topicId: question.topicId,
    text: question.text,
    maxScore: question.maxScore,
    options: question.options.length ? question.options.map((option) => option.text) : ["", ""],
    correctIndexes: correctIndexes(question),
    correctAnswer: trueFalseCorrect(question) ?? true,
    modelAnswer: question.modelAnswer ?? "",
    rubricText: question.rubricText ?? "",
  };
}

function RealBuilderView({ state, dispatch }) {
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);
  const courseId = state.courseId;
  const assignmentId = state.assignmentId;

  const load = useCallback(
    () =>
      assignmentId
        ? Promise.all([getCourse(courseId), getAssignment(assignmentId)]).then(([course, assignment]) => ({ course, assignment }))
        : Promise.resolve(null),
    [courseId, assignmentId],
  );
  const { data, loading, error, reload } = useAsync(load);
  const [editor, setEditor] = useState(null);
  const [busyAction, setBusyAction] = useState(null);
  const [titleEdit, setTitleEdit] = useState(null);

  const run = async (action, fn, okMessage) => {
    if (busyAction) return;
    setBusyAction(action);
    try {
      await fn();
      if (okMessage) toast(okMessage);
      reload();
    } catch (err) {
      toast(apiErrorText(err, lang));
    } finally {
      setBusyAction(null);
    }
  };

  const validateDraft = (draft) => {
    if (!draft.text.trim()) return t("Write the question text first.", "اكتبي نص السؤال الأول.");
    if (!draft.topicId) return t("Pick a topic for this question.", "اختاري موضوع للسؤال ده.");
    if (!(Number(draft.maxScore) > 0)) return t("Max score must be greater than zero.", "الدرجة اللازم تكون أكبر من صفر.");
    if (draft.type === QUESTION_TYPES.MULTIPLE_CHOICE || draft.type === QUESTION_TYPES.MULTIPLE_SELECT) {
      const filled = draft.options.map((option) => option.trim()).filter(Boolean);
      if (filled.length < 2) return t("Add at least two options.", "ضيفي خيارين على الأقل.");
      if (draft.type === QUESTION_TYPES.MULTIPLE_CHOICE && draft.correctIndexes.length !== 1) {
        return t("Multiple choice needs exactly one correct option.", "اختيار من متعدد محتاج إجابة صحيحة واحدة بالظبط.");
      }
      if (draft.type === QUESTION_TYPES.MULTIPLE_SELECT && draft.correctIndexes.length < 1) {
        return t("Mark at least one correct option.", "علمي إجابة صحيحة واحدة على الأقل.");
      }
    }
    return null;
  };

  const saveDraft = async () => {
    if (!editor || busyAction) return;
    const problem = validateDraft(editor.draft);
    if (problem) {
      toast(problem);
      return;
    }
    const payload = { ...editor.draft, maxScore: Number(editor.draft.maxScore) };
    await run(
      "save",
      () => (editor.mode === "add" ? addQuestion(assignmentId, payload) : updateQuestion(assignmentId, editor.id, payload)),
      editor.mode === "add" ? t("Question saved.", "السؤال اتحفظ.") : t("Question updated.", "السؤال اتحدّث."),
    );
    setEditor(null);
  };

  return (
    <div style={{ padding: mobile ? "20px 16px" : "26px 32px", direction: isRtl ? "rtl" : "ltr", maxWidth: 900, margin: "0 auto", fontFamily: bFont }}>
      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Loading assignment…", "جاري تحميل الواجب…")}>
        {!assignmentId || !data ? (
          <Card tokens={tokens} style={{ padding: 30, textAlign: "center" }}>
            <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, marginBottom: 6 }}>
              {t("No assignment selected", "مفيش واجب متحدد")}
            </div>
            <div style={{ fontSize: 12.5, color: tokens.textMuted, marginBottom: 14 }}>
              {t("Create the assignment from the course workspace first.", "اعملي الواجب من مساحة المقرر الأول.")}
            </div>
            <Btn tokens={tokens} variant="soft" onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.COURSE_WORKSPACE, courseId, tab: "assignments" })}>
              {t("Back to course", "الرجوع للمقرر")}
            </Btn>
          </Card>
        ) : (
          (() => {
            const { course, assignment } = data;
            const questions = [...(assignment.questions ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
            const topicLabel = (topicId) => course.topics.find((topic) => topic.id === topicId)?.label[lang] ?? t("Unknown topic", "موضوع غير معروف");
            const statusLabel = STATUS_LABELS[assignment.status] ?? { en: assignment.status, ar: assignment.status };
            return (
              <>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14, flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <BackCircle tokens={tokens} rtl={isRtl} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.COURSE_WORKSPACE, courseId, tab: "assignments" })} />
                  <div style={{ flex: 1, minWidth: 0, textAlign: isRtl ? "right" : "left" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                      {titleEdit ? (
                        <>
                          <input
                            value={titleEdit}
                            onChange={(e) => setTitleEdit(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") run("rename", () => renameAssignment(assignment.id, titleEdit.trim()), t("Title updated.", "العنوان اتحدّث."));
                              if (e.key === "Escape") setTitleEdit(null);
                            }}
                            style={{ ...inputStyle(tokens, bFont), fontSize: 15, padding: "6px 10px", maxWidth: 320 }}
                            className="genai-input"
                          />
                          <Btn tokens={tokens} variant="ghost" onClick={() => run("rename", () => renameAssignment(assignment.id, titleEdit.trim()), t("Title updated.", "العنوان اتحدّث."))}>
                            <IconCheck size={14} color={tokens.mastered} />
                          </Btn>
                        </>
                      ) : (
                        <>
                          <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: 0 }}>
                            {assignment.title[lang]}
                          </h1>
                          <Btn tokens={tokens} variant="ghost" onClick={() => setTitleEdit(assignment.title[lang])}>
                            <IconPencil size={13} color={tokens.textMuted} />
                          </Btn>
                        </>
                      )}
                      <Chip tokens={tokens} tone={assignment.status === "OPEN" ? "primary" : assignment.status === "CLOSED" ? "slate" : "violet"}>
                        {lang === "ar" ? statusLabel.ar : statusLabel.en}
                      </Chip>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                      <span style={{ fontSize: 12, color: tokens.textMuted }}>{t("Show grade to student", "إظهار الدرجة للطالب")}</span>
                      <Toggle
                        tokens={tokens}
                        on={assignment.showGradeToStudent}
                        disabled={busyAction === "visibility"}
                        onChange={() => run("visibility", () => setGradeVisibility(assignment.id, !assignment.showGradeToStudent))}
                      />
                      <span style={{ fontFamily: MONO, fontSize: 10.5, color: tokens.textFaint }}>
                        {questions.length} {t("questions", "أسئلة")} · {questions.reduce((sum, q) => sum + q.maxScore, 0)} {t("pts", "درجة")}
                      </span>
                    </div>
                  </div>
                </div>

                <Card tokens={tokens} style={{ padding: "12px 14px", marginBottom: 14, display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <span style={{ fontSize: 12, color: tokens.textMuted }}>
                    {assignment.status === "DRAFT"
                      ? t("Draft: students cannot see it until you publish.", "مسودة: الطلاب مش هيشوفوها لحد ما تنشري.")
                      : assignment.status === "OPEN"
                        ? t("Open: students can submit now.", "مفتوح: الطلاب يقدروا يحلّوا دلوقتي.")
                        : t("Closed: submissions stopped.", "مغلق: التسليم اتوقف.")}
                  </span>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                    {assignment.status === "DRAFT" && (
                      <Btn tokens={tokens} variant="solid" disabled={!questions.length || busyAction === "publish"} onClick={() => run("publish", () => publishAssignment(assignment.id), t("Published — students can now see and submit.", "اتنشر — الطلاب يقدروا يشوفوا ويسلّموا."))}>
                        {t("Publish", "نشر")}
                      </Btn>
                    )}
                    {assignment.status === "OPEN" && (
                      <Btn tokens={tokens} variant="soft" disabled={busyAction === "close"} onClick={() => run("close", () => closeAssignment(assignment.id), t("Closed for submissions.", "اتقفل للتسليم."))}>
                        {t("Close", "إغلاق")}
                      </Btn>
                    )}
                    {assignment.status === "CLOSED" && (
                      <Btn tokens={tokens} variant="soft" disabled={busyAction === "reopen"} onClick={() => run("reopen", () => reopenAssignment(assignment.id), t("Reopened.", "اتفتح تاني."))}>
                        {t("Reopen", "إعادة فتح")}
                      </Btn>
                    )}
                  </div>
                </Card>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {questions.length === 0 && (
                    <Card tokens={tokens} style={{ padding: "26px 18px", textAlign: "center" }}>
                      <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, marginBottom: 4 }}>
                        {t("No questions yet", "مفيش أسئلة لسه")}
                      </div>
                      <div style={{ fontSize: 12.5, color: tokens.textMuted }}>
                        {t("Add at least one question before publishing.", "ضيفي سؤال واحد على الأقل قبل النشر.")}
                      </div>
                    </Card>
                  )}
                  {questions.map((question) => (
                    <Card tokens={tokens} key={question.id} style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.textFaint }}>Q{question.orderIndex}</span>
                        <Chip tokens={tokens} tone="primary">{lang === "ar" ? QUESTION_TYPE_LABELS[question.type]?.ar : QUESTION_TYPE_LABELS[question.type]?.en}</Chip>
                        <Chip tokens={tokens}>{topicLabel(question.topicId)}</Chip>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.textMuted }}>{question.maxScore} {t("pts", "درجة")}</span>
                        <div style={{ marginInlineStart: "auto", display: "flex", gap: 4, flexDirection: isRtl ? "row-reverse" : "row" }}>
                          <Btn tokens={tokens} variant="ghost" style={{ padding: "4px 7px" }} onClick={() => setEditor({ mode: "edit", id: question.id, draft: draftFromQuestion(question) })}>
                            <IconPencil size={13} color={tokens.textMuted} />
                          </Btn>
                          <Btn tokens={tokens} variant="ghost" style={{ padding: "4px 7px" }} onClick={() => run("delete", () => deleteQuestion(assignment.id, question.id), t("Question deleted.", "السؤال اتحذف."))}>
                            <IconTrash size={13} color={tokens.gap} />
                          </Btn>
                        </div>
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: tokens.textPrimary, lineHeight: 1.6, marginBottom: 8, textAlign: isRtl ? "right" : "left" }}>
                        {question.text}
                      </div>
                      {(question.type === QUESTION_TYPES.MULTIPLE_CHOICE || question.type === QUESTION_TYPES.MULTIPLE_SELECT) && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {question.options.map((option, index) => {
                            const isCorrect = question.correctOptionIds.includes(option.id);
                            return (
                              <div key={option.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "7px 10px", borderRadius: 8, border: `1px solid ${isCorrect ? tokens.mastered : tokens.cardBorder}`, background: isCorrect ? `${tokens.mastered}12` : tokens.inset, flexDirection: isRtl ? "row-reverse" : "row" }}>
                                <span style={{ fontFamily: MONO, fontSize: 10, color: isCorrect ? tokens.mastered : tokens.textFaint }}>{String.fromCharCode(65 + index)}</span>
                                <span style={{ fontSize: 12.5, color: tokens.textPrimary, flex: 1, textAlign: isRtl ? "right" : "left" }}>{option.text}</span>
                                {isCorrect && <IconCheck size={13} color={tokens.mastered} />}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {question.type === QUESTION_TYPES.TRUE_FALSE && (
                        <Chip tokens={tokens} tone="primary">
                          {trueFalseCorrect(question) ? t("Correct: True", "الصحيح: صح") : t("Correct: False", "الصحيح: خطأ")}
                        </Chip>
                      )}
                      {question.modelAnswer && (
                        <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 8, background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, textAlign: isRtl ? "right" : "left" }}>
                          <div style={{ fontFamily: MONO, fontSize: 9.5, color: tokens.textFaint, marginBottom: 3 }}>{t("MODEL ANSWER — INSTRUCTOR ONLY", "الإجابة النموذجية — للمدرّس فقط")}</div>
                          <div style={{ fontSize: 12, color: tokens.textSecondary, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{question.modelAnswer}</div>
                        </div>
                      )}
                      {question.rubricText && (
                        <div style={{ marginTop: 6, padding: "8px 10px", borderRadius: 8, background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, textAlign: isRtl ? "right" : "left" }}>
                          <div style={{ fontFamily: MONO, fontSize: 9.5, color: tokens.textFaint, marginBottom: 3 }}>{t("RUBRIC — FREE TEXT", "روبريك حر")}</div>
                          <div style={{ fontSize: 12, color: tokens.textSecondary, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{question.rubricText}</div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
                                {editor ? (
                  <Card tokens={tokens} style={{ padding: "16px 18px", marginTop: 14 }}>
                    <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 14, color: tokens.textPrimary, marginBottom: 12 }}>
                      {editor.mode === "add" ? t("New question", "سؤال جديد") : t("Edit question", "تعديل سؤال")}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10, flexDirection: isRtl ? "row-reverse" : "row" }}>
                      {TYPE_KEYS.map((key) => (
                        <Btn
                          key={key}
                          tokens={tokens}
                          variant={editor.draft.type === key ? "soft" : "ghost"}
                          style={{ padding: "6px 10px", fontSize: 11.5 }}
                          onClick={() => setEditor((ed) => ({ ...ed, draft: { ...ed.draft, type: key, options: ["", ""], correctIndexes: [], correctAnswer: true } }))}
                        >
                          {lang === "ar" ? QUESTION_TYPE_LABELS[key].ar : QUESTION_TYPE_LABELS[key].en}
                        </Btn>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "2fr 1fr", gap: 10, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted, marginBottom: 5 }}>{t("Topic", "الموضوع")}</div>
                        <select
                          value={editor.draft.topicId}
                          onChange={(e) => setEditor((ed) => ({ ...ed, draft: { ...ed.draft, topicId: e.target.value } }))}
                          style={{ ...inputStyle(tokens, bFont), fontSize: 12.5 }}
                          className="genai-input"
                        >
                          <option value="">{t("Choose a topic…", "اختاري موضوع…")}</option>
                          {course.topics.map((topic) => (
                            <option key={topic.id} value={topic.id}>{topic.label[lang]}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted, marginBottom: 5 }}>{t("Max score", "الدرجة القصوى")}</div>
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={editor.draft.maxScore}
                          onChange={(e) => setEditor((ed) => ({ ...ed, draft: { ...ed.draft, maxScore: e.target.value } }))}
                          style={{ ...inputStyle(tokens, bFont), fontSize: 12.5 }}
                          className="genai-input"
                        />
                      </div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted, marginBottom: 5 }}>{t("Question text", "نص السؤال")}</div>
                    <textarea
                      value={editor.draft.text}
                      onChange={(e) => setEditor((ed) => ({ ...ed, draft: { ...ed.draft, text: e.target.value } }))}
                      style={{ ...textareaStyle(tokens, bFont), fontSize: 12.5, marginBottom: 10 }}
                      className="genai-input"
                    />
                    {(editor.draft.type === QUESTION_TYPES.MULTIPLE_CHOICE || editor.draft.type === QUESTION_TYPES.MULTIPLE_SELECT) && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted }}>
                          {editor.draft.type === QUESTION_TYPES.MULTIPLE_CHOICE ? t("Options — mark exactly one correct", "الخيارات — علمي إجابة صحيحة واحدة") : t("Options — mark every correct answer", "الخيارات — علمي كل الإجابات الصحيحة")}
                        </div>
                        {editor.draft.options.map((option, index) => {
                          const marked = editor.draft.correctIndexes.includes(index);
                          return (
                            <div key={index} style={{ display: "flex", gap: 8, alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
                              <button
                                onClick={() => setEditor((ed) => {
                                  const next = ed.draft.type === QUESTION_TYPES.MULTIPLE_CHOICE ? [index] : marked ? ed.draft.correctIndexes.filter((i) => i !== index) : [...ed.draft.correctIndexes, index];
                                  return { ...ed, draft: { ...ed.draft, correctIndexes: next } };
                                })}
                                aria-label={t("mark correct", "تعليم كإجابة صحيحة")}
                                style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${marked ? tokens.mastered : tokens.cardBorder}`, background: marked ? tokens.mastered : "transparent", color: "#fff", fontSize: 11, cursor: "pointer", flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                              >
                                {marked ? "✓" : ""}
                              </button>
                              <input
                                value={option}
                                onChange={(e) => setEditor((ed) => {
                                  const options = [...ed.draft.options];
                                  options[index] = e.target.value;
                                  return { ...ed, draft: { ...ed.draft, options } };
                                })}
                                placeholder={`${t("Option", "خيار")} ${index + 1}`}
                                style={{ ...inputStyle(tokens, bFont), fontSize: 12.5, flex: 1, minWidth: 0 }}
                                className="genai-input"
                              />
                              <Btn tokens={tokens} variant="ghost" style={{ padding: "5px 7px", flexShrink: 0 }} onClick={() => setEditor((ed) => {
                                const options = ed.draft.options.filter((_, i) => i !== index);
                                const correctIndexes = ed.draft.correctIndexes.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i));
                                return { ...ed, draft: { ...ed.draft, options: options.length ? options : [""], correctIndexes } };
                              })}>
                                <IconTrash size={12} color={tokens.textFaint} />
                              </Btn>
                            </div>
                          );
                        })}
                        {editor.draft.options.length < 8 && (
                          <Btn tokens={tokens} variant="ghost" style={{ alignSelf: isRtl ? "flex-end" : "flex-start", padding: "5px 9px", fontSize: 11.5 }} onClick={() => setEditor((ed) => ({ ...ed, draft: { ...ed.draft, options: [...ed.draft.options, ""] } }))}>
                            <IconPlus size={12} color={tokens.primary} />
                            {t("Add option", "ضيفي خيار")}
                          </Btn>
                        )}
                      </div>
                    )}
                    {editor.draft.type === QUESTION_TYPES.TRUE_FALSE && (
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexDirection: isRtl ? "row-reverse" : "row" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted }}>{t("Correct answer", "الإجابة الصحيحة")}</span>
                        <Btn tokens={tokens} variant={editor.draft.correctAnswer === true ? "soft" : "ghost"} style={{ padding: "6px 12px", fontSize: 11.5 }} onClick={() => setEditor((ed) => ({ ...ed, draft: { ...ed.draft, correctAnswer: true } }))}>
                          {t("True", "صح")}
                        </Btn>
                        <Btn tokens={tokens} variant={editor.draft.correctAnswer === false ? "soft" : "ghost"} style={{ padding: "6px 12px", fontSize: 11.5 }} onClick={() => setEditor((ed) => ({ ...ed, draft: { ...ed.draft, correctAnswer: false } }))}>
                          {t("False", "خطأ")}
                        </Btn>
                      </div>
                    )}
                    {!OBJECTIVE_TYPES.includes(editor.draft.type) && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted, marginBottom: 5 }}>{t("Model answer — instructor only, never shown to students", "الإجابة النموذجية — للمدرّس فقط، عمرها ما تظهر للطلاب")}</div>
                          <textarea
                            value={editor.draft.modelAnswer}
                            onChange={(e) => setEditor((ed) => ({ ...ed, draft: { ...ed.draft, modelAnswer: e.target.value } }))}
                            style={{ ...textareaStyle(tokens, bFont), fontSize: 12.5 }}
                            className="genai-input"
                          />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted, marginBottom: 5 }}>{t("Rubric — free text", "روبريك — نص حر")}</div>
                          <textarea
                            value={editor.draft.rubricText}
                            onChange={(e) => setEditor((ed) => ({ ...ed, draft: { ...ed.draft, rubricText: e.target.value } }))}
                            style={{ ...textareaStyle(tokens, bFont), fontSize: 12.5 }}
                            className="genai-input"
                          />
                        </div>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexDirection: isRtl ? "row-reverse" : "row" }}>
                      <Btn tokens={tokens} variant="ghost" onClick={() => setEditor(null)}>
                        {t("Cancel", "إلغاء")}
                      </Btn>
                      <Btn tokens={tokens} variant="solid" disabled={busyAction === "save"} onClick={saveDraft}>
                        {editor.mode === "add" ? t("Save question", "حفظ السؤال") : t("Update question", "تحديث السؤال")}
                      </Btn>
                    </div>
                  </Card>
                ) : (
                  <Btn tokens={tokens} variant="soft" style={{ marginTop: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }} onClick={() => setEditor({ mode: "add", draft: emptyDraft(course.topics[0]?.id) })}>
                    <IconPlus size={13} color={tokens.primary} />
                    {t("Add question", "ضيفي سؤال")}
                  </Btn>
                )}
              </>
            );
          })()
        )}
      </AsyncGate>
    </div>
  );
}

export default function AssignmentBuilderPage(props) {
  if (demoMode()) return <AssignmentBuilderLegacy {...props} />;
  return <RealBuilderView {...props} />;
}