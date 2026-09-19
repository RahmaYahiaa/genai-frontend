import { useCallback } from "react";
import { tk, MONO } from "@/constants/tokens";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { Card, Btn, Chip, ScoreValue, bFontFor, hFontFor } from "@/components/ModuleUI";
import { IconLock, IconClipboard } from "@/components/Icons";
import { SCREENS } from "@/constants/routes";
import { AsyncGate } from "@/components/ui";
import { listCourses } from "@/services/courses";
import { ASSIGNMENT_STATUSES, listAssignmentsForCourse } from "@/services/assignments";
import { getStudentResult } from "@/services/submissions";

function FinalScore({ assignment, tokens, lang }) {
  const load = useCallback(() => getStudentResult(assignment.id), [assignment.id]);
  const { data } = useAsync(load);
  if (!data?.available || !data.result) return null;
  const max = (assignment.questions ?? []).reduce((sum, q) => sum + (q.maxScore ?? 0), 0);
  if (!max) return null;
  return <ScoreValue kind="final" score={data.result.finalScoreTotal} max={max} tokens={tokens} lang={lang} />;
}

export default function StudentAssignmentsPage({ state, dispatch }) {
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);

  const load = useCallback(async () => {
    const { items: allCourses } = await listCourses();
    const courses = (allCourses ?? []).filter((c) => (state.personalOnly ? c.isPersonal : !c.isPersonal));
    if (state.personalOnly) return { personal: true, rows: [] };
    const rows = await Promise.all(
      courses.map(async (course) => {
        const { items } = await listAssignmentsForCourse(course.id, {});
        return { course, assignments: (items ?? []).filter((a) => a.status !== ASSIGNMENT_STATUSES.DRAFT) };
      })
    );
    return { personal: false, rows };
  }, [state.personalOnly]);
  const { data, loading, error, reload } = useAsync(load);

  const myStatus = (a) => {
    const s = a.submission?.status ?? null;
    if (s === "RESUBMISSION_REQUESTED") return { en: "Resubmission requested", ar: "طُلبت إعادة التسليم", tone: "violet" };
    if (s === "FINALIZED") return { en: "Graded", ar: "مُقيّم", tone: "primary" };
    if (s === "SUBMITTED" || s === "GRADING" || s === "GRADED") return { en: "Under review", ar: "قيد المراجعة", tone: "peri" };
    if (s === "DRAFT" && (a.workingAnswers ?? []).some((w) => (w.answerText ?? "").trim() || (w.selectedOptionIds ?? []).length))
      return { en: "Draft saved", ar: "مسودة محفوظة", tone: "default" };
    return { en: "Not started", ar: "لم يبدأ", tone: "slate" };
  };

  const rows = data?.rows ?? [];
  const empty = !data?.personal && rows.every((r) => r.assignments.length === 0);

  return (
    <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={lang === "ar" ? "جارٍ تحميل التكليفات…" : "Loading assignments…"}>
    <div className="genai-pad" style={{ padding: mobile ? "20px 16px" : "28px 32px", direction: isRtl ? "rtl" : "ltr", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 20, textAlign: isRtl ? "right" : "left" }}>
        <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: "0 0 3px" }}>
          {lang === "ar" ? "التكليفات" : "Assignments"}
        </h1>
        <p style={{ fontSize: 12.5, color: tokens.textMuted, margin: 0, fontFamily: bFont }}>
          {lang === "ar"
            ? "مسوداتك تُحفظ تلقائياً. لا يُرسَل شيء للتقييم إلا بزر «تسليم التكليف» الواحد."
            : "Your drafts auto-save continuously. Nothing is sent for grading until the single “Submit assignment” action."}
        </p>
      </div>

      {data?.personal ? (
        <Card tokens={tokens} style={{ padding: "34px 24px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", width: 44, height: 44, borderRadius: "50%", background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <IconLock size={22} color={tokens.textFaint} />
          </div>
          <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, marginBottom: 4 }}>
            {lang === "ar" ? "لا تكليفات في المقررات الشخصية" : "No assignments on personal courses"}
          </div>
          <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.6 }}>
            {lang === "ar"
              ? "وحدة التكليفات والتصحيح مؤسسة فقط: المقرر الشخصي لا مدرّس له، فلا بوابة اعتماد. تعلّمك الذاتي يستمر كالمعتاد."
              : "The assignment and grading module is institution-only: a personal course has no instructor, so there is no approval gate. Your self-directed loop continues as usual."}
          </div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {rows.map(({ course, assignments }) => {
            if (assignments.length === 0) return null;
            const instructor = course.staff?.[0]?.name ?? course.instructor ?? "";
            return (
              <div key={course.id}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: tokens.primary, background: tokens.primaryLight, border: `1px solid ${tokens.citationBorder}`, borderRadius: 6, padding: "3px 9px" }}>
                    {course.code ?? course.id}
                  </span>
                  <span style={{ fontFamily: hFont, fontWeight: 600, fontSize: 14, color: tokens.textPrimary, letterSpacing: "-0.02em" }}>
                    {lang === "ar" ? course.title.ar : course.title.en}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {assignments.map((a) => {
                    const st = myStatus(a);
                    const graded = st.tone === "primary";
                    const openable = a.status === ASSIGNMENT_STATUSES.OPEN || Boolean(a.submission);
                    return (
                      <Card tokens={tokens} key={a.id} style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                          <div style={{ textAlign: isRtl ? "right" : "left", minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                              <span style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em" }}>
                                {lang === "ar" ? a.title.ar : a.title.en}
                              </span>
                              <Chip tokens={tokens} tone={a.status === ASSIGNMENT_STATUSES.OPEN ? "primary" : "slate"}>
                                {a.status === ASSIGNMENT_STATUSES.OPEN ? (lang === "ar" ? "مفتوح" : "Open") : (lang === "ar" ? "مغلق" : "Closed")}
                              </Chip>
                              <Chip tokens={tokens} tone={st.tone}>{lang === "ar" ? st.ar : st.en}</Chip>
                              {graded && a.showGradeToStudent && (
                                <FinalScore assignment={a} tokens={tokens} lang={lang} />
                              )}
                            </div>
                            <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted }}>
                              {(a.questions ?? []).length} {lang === "ar" ? "أسئلة" : "questions"}{instructor ? ` · ${instructor}` : ""}
                            </div>
                          </div>
                          {openable ? (
                            <Btn tokens={tokens} lang={lang} variant="soft" style={{ padding: "8px 16px", fontSize: 12.5, flexShrink: 0 }}
                              onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.STUDENT_ASSIGNMENT, courseId: course.id, assignmentId: a.id })}>
                              {lang === "ar" ? "فتح" : "Open"}
                            </Btn>
                          ) : (
                            <span style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textFaint, flexShrink: 0 }}>
                              {lang === "ar" ? "أُغلق قبل أن تسلّم" : "Closed before you submitted"}
                            </span>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {empty && (
            <Card tokens={tokens} style={{ padding: "34px 24px", textAlign: "center" }}>
              <div style={{ display: "inline-flex", width: 44, height: 44, borderRadius: "50%", background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <IconClipboard size={22} color={tokens.textFaint} />
              </div>
              <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, marginBottom: 4 }}>
                {lang === "ar" ? "لا تكليفات بعد" : "No assignments yet"}
              </div>
              <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.6 }}>
                {lang === "ar" ? "سينشر مدرّسك التكليفات هنا فور إنشائها." : "Your instructor's published assignments will appear here."}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
    </AsyncGate>
  );
}
