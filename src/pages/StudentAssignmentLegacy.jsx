import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { tk, MONO } from "@/constants/tokens";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { Card, Chip, ScoreValue, AlertStrip, BackCircle, ConfirmBtn, bFontFor, hFontFor, textareaStyle, toast } from "@/components/ModuleUI";
import { IconCheck, IconReply, IconBan } from "@/components/Icons";
import { SCREENS } from "@/constants/routes";
import { AsyncGate } from "@/components/ui";
import { apiErrorText } from "@/services/http";
import { getCourse } from "@/services/courses";
import { ASSIGNMENT_STATUSES, getAssignment } from "@/services/assignments";
import { getStudentResult, saveAnswer, submitAssignment } from "@/services/submissions";

const QUESTION_KIND_LABELS = {
  multiple_choice: { en: "Multiple choice", ar: "اختيار من متعدد" },
  multiple_select: { en: "Multiple select", ar: "اختيار متعدد الإجابات" },
  true_false: { en: "True / False", ar: "صح / خطأ" },
  short_answer: { en: "Short answer", ar: "إجابة قصيرة" },
  long_answer: { en: "Long answer", ar: "إجابة طويلة" },
  essay: { en: "Essay", ar: "مقال" },
  problem_solving: { en: "Problem-solving", ar: "حل مسألة" },
};
const kindOf = (q) => q?.type ?? "long_answer";
const kindNeedsOptions = (kind) => kind === "multiple_choice" || kind === "multiple_select";
const isChoiceKind = (kind) => kindNeedsOptions(kind) || kind === "true_false";
const kindRows = (kind) => (kind === "short_answer" ? 2 : kind === "essay" ? 9 : kind === "problem_solving" ? 7 : 5);
const kindLabel = (kind, lang) => (QUESTION_KIND_LABELS[kind] ? QUESTION_KIND_LABELS[kind][lang] : kind);

function fmtAgo(iso, lang) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 6e4));
  if (mins < 60) return lang === "ar" ? `منذ ${mins} د` : `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return lang === "ar" ? `منذ ${h} س` : `${h}h ago`;
  const d = Math.round(h / 24);
  return lang === "ar" ? `منذ ${d} يوم` : `${d}d ago`;
}

export default function StudentAssignmentPage({ state, dispatch }) {
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);

  const assignmentId = state.assignmentId ?? null;

  const load = useCallback(async () => {
    if (!assignmentId) return { assignment: null, course: null };
    const assignment = await getAssignment(assignmentId);
    const course = assignment?.courseId ? await getCourse(assignment.courseId) : null;
    return { assignment, course };
  }, [assignmentId]);
  const { data, loading, error, reload } = useAsync(load);

  const assignment = useMemo(() => {
    const a = data?.assignment ?? null;
    if (!a) return null;
    return { ...a, questions: [...(a.questions ?? [])].sort((x, y) => x.orderIndex - y.orderIndex) };
  }, [data]);
  const course = data?.course ?? null;

  const submission = assignment?.submission ?? null;
  const submitted = submission && submission.status !== "DRAFT";
  const allFinal = submission?.status === "FINALIZED";
  const anyResub = submission?.status === "RESUBMISSION_REQUESTED";
  const allSubmitted = submitted && !anyResub && !allFinal;
  const resubReason = anyResub ? assignment?.resubmissionRequest?.reason ?? undefined : undefined;
  const anyEditable = Boolean(assignment?.canSubmit) && (!submitted || anyResub);
  const closedBlocked = assignment?.status !== ASSIGNMENT_STATUSES.OPEN && !submission;
  const attemptLabel = Math.max(1, Number(submission?.currentAttemptNo) || 1);

  const initial = useMemo(() => {
    const map = {};
    if (!assignment) return map;
    const work = new Map((assignment.workingAnswers ?? []).map((w) => [w.questionId, w]));
    const prefill = new Map((assignment.resubmissionRequest?.prefilledAnswers ?? []).map((p) => [p.questionId, p]));
    for (const q of assignment.questions) {
      const src = anyResub ? (prefill.get(q.id) ?? work.get(q.id)) : (work.get(q.id) ?? prefill.get(q.id));
      map[q.id] = { text: src?.answerText ?? "", selected: [...(src?.selectedOptionIds ?? [])] };
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment?.id, submission?.currentAttemptNo, anyResub]);

  const [answers, setAnswers] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  useEffect(() => {
    setAnswers(initial);
    setLastSaved(null);
  }, [initial]);

  const first = useRef(true);
  useEffect(() => {
    if (!assignment || !anyEditable) return;
    if (first.current) { first.current = false; return; }
    setSaving(true);
    const t = window.setTimeout(async () => {
      try {
        for (const q of assignment.questions) {
          const a = answers[q.id] ?? { text: "", selected: [] };
          if (isChoiceKind(kindOf(q))) {
            await saveAnswer(assignment.id, q.id, { answerText: "", selectedOptionIds: a.selected ?? [] });
          } else {
            await saveAnswer(assignment.id, q.id, { answerText: a.text ?? "" });
          }
        }
        setLastSaved(new Date().toISOString());
      } catch (err) {
        toast(apiErrorText(err, lang));
      } finally {
        setSaving(false);
      }
    }, 600);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  const resultLoad = useCallback(() => {
    if (!assignment || !allFinal || !assignment.showGradeToStudent) return Promise.resolve(null);
    return getStudentResult(assignment.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment?.id, allFinal, assignment?.showGradeToStudent]);
  const { data: resultData } = useAsync(resultLoad);

  if (!assignmentId) {
    return <div style={{ padding: 40, fontFamily: bFont, color: tokens.textMuted }}>{lang === "ar" ? "التكليف غير موجود." : "Assignment not found."}</div>;
  }

  const doSubmit = async () => {
    if (!assignment) return;
    try {
      for (const q of assignment.questions) {
        const a = answers[q.id] ?? { text: "", selected: [] };
        if (isChoiceKind(kindOf(q))) {
          await saveAnswer(assignment.id, q.id, { answerText: "", selectedOptionIds: a.selected ?? [] });
        } else {
          await saveAnswer(assignment.id, q.id, { answerText: a.text ?? "" });
        }
      }
      await submitAssignment(assignment.id);
      toast(lang === "ar" ? "أُرسل التكليف — إجاباتك قيد المراجعة." : "Assignment submitted — your answers are under review.");
      reload();
    } catch (err) {
      toast(apiErrorText(err, lang));
    }
  };

  const pick = (qid, value, multi) => {
    setAnswers((xs) => {
      const cur = xs[qid] ?? { text: "", selected: [] };
      const selected = multi
        ? cur.selected?.includes(value)
          ? cur.selected.filter((x) => x !== value)
          : [...(cur.selected ?? []), value]
        : [value];
      return { ...xs, [qid]: { ...cur, selected } };
    });
  };

  const tfLabel = (v) => (v === "True" ? (lang === "ar" ? "صح" : "True") : v === "False" ? (lang === "ar" ? "خطأ" : "False") : v);

  const mono = (t) => (
    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.09em", color: tokens.textMuted, margin: "0 0 7px" }}>{t}</div>
  );

  return (
    <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={lang === "ar" ? "جارٍ تحميل التكليف…" : "Loading assignment…"}>
    {!assignment ? (
      <div style={{ padding: 40, fontFamily: bFont, color: tokens.textMuted }}>{lang === "ar" ? "التكليف غير موجود." : "Assignment not found."}</div>
    ) : (
    <div className="genai-pad" style={{ padding: mobile ? "20px 16px" : "26px 32px", direction: isRtl ? "rtl" : "ltr", maxWidth: 880, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 18, flexDirection: isRtl ? "row-reverse" : "row" }}>
        <BackCircle tokens={tokens} rtl={isRtl} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.STUDENT_ASSIGNMENTS, assignmentId: undefined })} />
        <div style={{ textAlign: isRtl ? "right" : "left" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4, flexDirection: isRtl ? "row-reverse" : "row" }}>
            <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: 0 }}>
              {lang === "ar" ? assignment.title.ar : assignment.title.en}
            </h1>
            <Chip tokens={tokens} tone={assignment.status === ASSIGNMENT_STATUSES.OPEN ? "primary" : "slate"}>
              {assignment.status === ASSIGNMENT_STATUSES.OPEN ? (lang === "ar" ? "مفتوح" : "Open") : (lang === "ar" ? "مغلق" : "Closed")}
            </Chip>
          </div>
          <p style={{ fontFamily: bFont, fontSize: 13, color: tokens.textMuted, margin: 0 }}>
            {course ? `${course.code ?? course.id} · ` : ""}{assignment.questions.length} {lang === "ar" ? "أسئلة" : "questions"} · {lang === "ar" ? `محاولة ${attemptLabel}` : `Attempt ${attemptLabel}`}
          </p>
        </div>
      </div>

      {closedBlocked && (
        <div style={{ marginBottom: 16 }}>
          <AlertStrip tokens={tokens} lang={lang} tone="slate" icon={<IconBan size={14} color={tokens.noEvidence} />}
            title={lang === "ar" ? "أُغلق التكليف — التسليم معطّل." : "Assignment closed — submission disabled."}
            body={lang === "ar" ? "لم تسلّم قبل الإغلاق، لذا لا يمكن التسليم الآن." : "You had not submitted before it was closed, so submitting is no longer possible."} />
        </div>
      )}
      {anyResub && (
        <div style={{ marginBottom: 16 }}>
          <AlertStrip tokens={tokens} lang={lang} tone="violet" icon={<IconReply size={14} color={tokens.gap} />}
            title={lang === "ar" ? "طلب مدرّسك إعادة التسليم." : "Your instructor requested a resubmission."}
            body={resubReason} />
        </div>
      )}
      {allSubmitted && (
        <div style={{ marginBottom: 16 }}>
          <AlertStrip tokens={tokens} lang={lang} tone="peri" icon={<IconCheck size={14} color={tokens.primary} />}
            title={lang === "ar"
              ? "تم التسليم. إجاباتك قيد المراجعة — لا تُعرض أي درجة حتى يقيّمها مدرّسك."
              : "Submitted. Your answers are under review — no score is shown until your instructor grades them."} />
        </div>
      )}
      {allFinal && (
        <div style={{ marginBottom: 16 }}>
          <AlertStrip tokens={tokens} lang={lang} tone={assignment.showGradeToStudent ? "peri" : "slate"} icon={<IconCheck size={14} color={assignment.showGradeToStudent ? tokens.primary : tokens.noEvidence} />}
            title={assignment.showGradeToStudent
              ? (lang === "ar" ? "قُيّم تكليفك — درجاتك النهائية معروضة أسفل كل سؤال." : "Graded — your final scores are shown under each question.")
              : (lang === "ar" ? "قُيّم تكليفك — الدرجات مخفية في إعداد هذا التكليف." : "Graded — scores are hidden in this assignment's setting.")} />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {assignment.questions.map((q, i) => {
          const editable = anyEditable;
          const topic = course?.topics.find((t) => t.id === q.topicId);
          const a = answers[q.id] ?? { text: "", selected: [] };
          const kind = kindOf(q);
          const choice = isChoiceKind(kind);
          const resultAnswer = (resultData?.result?.answers ?? []).find((x) => x.questionId === q.id) ?? null;
          return (
            <Card tokens={tokens} key={q.id} style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
                <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em" }}>
                  {lang === "ar" ? `السؤال ${i + 1} · ${topic?.label.ar ?? ""}` : `Question ${i + 1} · ${topic?.label.en ?? ""}`}
                </div>
                <span style={{ fontFamily: MONO, fontSize: 11, color: tokens.textMuted, flexShrink: 0 }}>
                  {kindLabel(kind, lang)} · {lang === "ar" ? `الحد ${q.maxScore}` : `max ${q.maxScore}`}
                </span>
              </div>
              <p style={{ fontFamily: bFont, fontSize: 13.5, color: tokens.textSecondary, lineHeight: 1.7, margin: "0 0 14px" }}>
                {q.text}
              </p>

              {mono(choice ? (lang === "ar" ? "اختر إجابتك" : "Your selection") : (lang === "ar" ? "إجابتك" : "Your answer"))}
              {editable ? (
                choice ? (
                  kindNeedsOptions(kind) ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {(q.options ?? []).map((opt, oi) => {
                        const sel = (a.selected ?? []).includes(opt.id);
                        return (
                          <button key={opt.id ?? oi} onClick={() => pick(q.id, opt.id, kind === "multiple_select")}
                            style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 13px", borderRadius: 10, cursor: "pointer", textAlign: "start", background: sel ? tokens.primaryLight : tokens.card, border: `1px solid ${sel ? tokens.primary : tokens.cardBorder}`, fontFamily: bFont, fontSize: 13, color: sel ? tokens.primary : tokens.textPrimary }}>
                            <span style={{ width: 18, height: 18, borderRadius: kind === "multiple_select" ? 5 : "50%", border: `1.5px solid ${sel ? tokens.primary : tokens.cardBorder}`, background: sel ? tokens.primary : "transparent", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {sel ? <span style={{ width: 8, height: 8, borderRadius: kind === "multiple_select" ? 2 : "50%", background: "#fff" }} /> : null}
                            </span>
                            <span style={{ fontFamily: MONO, fontSize: 11, color: tokens.textFaint, flexShrink: 0 }}>{String.fromCharCode(65 + oi)}</span>
                            {opt.text}
                          </button>
                        );
                      })}
                      {!(q.options ?? []).length && (
                        <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textMuted }}>
                          {lang === "ar" ? "لم يضف المدرس خيارات لهذا السؤال بعد." : "Your instructor has not added options for this question yet."}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 10 }}>
                      {["True", "False"].map((v) => {
                        const btns = (q.options ?? []).filter((o) => o.text === "True" || o.text === "False");
                        const opt = btns.find((o) => o.text === v);
                        const sel = opt ? (a.selected ?? []).includes(opt.id) : (a.selected ?? []).includes(v);
                        return (
                          <button key={v} onClick={() => pick(q.id, opt ? opt.id : v, false)}
                            style={{ flex: 1, padding: "12px 0", borderRadius: 10, cursor: "pointer", fontFamily: bFont, fontSize: 13.5, fontWeight: 600, background: sel ? tokens.primaryLight : tokens.card, border: `1px solid ${sel ? tokens.primary : tokens.cardBorder}`, color: sel ? tokens.primary : tokens.textSecondary }}>
                            {tfLabel(v)}
                          </button>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <textarea
                    value={a.text}
                    onChange={(e) => setAnswers((xs) => ({ ...xs, [q.id]: { ...a, text: e.target.value } }))}
                    rows={kindRows(kind)}
                    placeholder={lang === "ar" ? "اكتب إجابتك هنا — تُحفظ مسودة تلقائياً." : "Write your answer here — drafts save automatically."}
                    style={textareaStyle(tokens, bFont)}
                    className="genai-input"
                  />
                )
              ) : (
                <>
                  {(a.selected ?? []).length ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                      {(a.selected ?? []).map((vid) => {
                        const opt = (q.options ?? []).find((o) => o.id === vid);
                        const label = kind === "true_false" ? tfLabel(opt?.text ?? vid) : (opt?.text ?? vid);
                        return <Chip tokens={tokens} tone="primary" key={vid}>{label}</Chip>;
                      })}
                    </div>
                  ) : (
                    <div style={{ background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, padding: "12px 14px", fontFamily: bFont, fontSize: 13, color: tokens.textPrimary, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                      {a.text || (lang === "ar" ? "(لا نص)" : "(no text)")}
                    </div>
                  )}
                  {allFinal && assignment.showGradeToStudent && resultAnswer && (
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                      <ScoreValue kind="final" score={resultAnswer.finalScore} max={q.maxScore} tokens={tokens} lang={lang} />
                      {resultAnswer.finalFeedback && (
                        <span style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted, lineHeight: 1.5 }}>{resultAnswer.finalFeedback}</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </Card>
          );
        })}
      </div>

      {anyEditable && !closedBlocked && (
        <Card tokens={tokens} style={{ marginTop: 16, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: MONO, fontSize: 10.5, color: saving ? tokens.developing : tokens.textFaint }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: saving ? tokens.developing : tokens.mastered }} />
            {saving
              ? (lang === "ar" ? "جارٍ حفظ المسودة…" : "saving draft…")
              : lastSaved
              ? `${lang === "ar" ? "محفوظ" : "saved"} ${fmtAgo(lastSaved, lang)}`
              : (lang === "ar" ? "الحفظ التلقائي مفعّل" : "auto-save on")}
          </div>
          <ConfirmBtn
            tokens={tokens} lang={lang} variant="solid"
            label={anyResub ? (lang === "ar" ? "إعادة التسليم" : "Resubmit assignment") : (lang === "ar" ? "تسليم التكليف" : "Submit assignment")}
            confirmLabel={lang === "ar" ? "اضغط للتأكيد — إرسال للمراجعة" : "Click again to confirm — send for review"}
            onConfirm={doSubmit}
            style={{ padding: "10px 20px", fontSize: 13 }}
          />
        </Card>
      )}
    </div>
    )}
    </AsyncGate>
  );
}
