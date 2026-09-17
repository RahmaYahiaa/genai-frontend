import { tk, MONO } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useInstructorModule } from "@/store/InstructorProvider";
import { Card, Btn, Chip, ScoreValue, bFontFor, hFontFor } from "@/components/ModuleUI";
import { IconLock, IconClipboard } from "@/components/Icons";
import { SCREENS } from "@/constants/routes";
import { DEMO_STUDENT_ID, STUDENT_INSTITUTIONAL_IDS, STUDENT_PERSONAL_IDS, latestAttempt } from "@/data/instructorModule";

export default function StudentAssignmentsPage({ state, dispatch }) {
  const { state: mod } = useInstructorModule();
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);

  const enrolment = state.personalOnly ? STUDENT_PERSONAL_IDS : STUDENT_INSTITUTIONAL_IDS;
  const courses = mod.courses.filter((c) => enrolment.includes(c.id));

  const myUnits = (assignmentId) => mod.units.filter((u) => u.assignmentId === assignmentId && u.studentId === DEMO_STUDENT_ID);

  const myStatus = (assignmentId) => {
    const units = myUnits(assignmentId);
    const draft = Object.keys(mod.drafts).some((k) => k.startsWith(`${assignmentId}|`) && (mod.drafts[k].text || mod.drafts[k].image));
    if (units.some((u) => u.status === "resubmission_requested")) return { en: "Resubmission requested", ar: "طُلبت إعادة التسليم", tone: "violet" };
    if (units.length && units.every((u) => u.status === "final")) return { en: "Graded", ar: "مُقيّم", tone: "primary" };
    if (units.some((u) => u.status === "awaiting_review")) return { en: "Under review", ar: "قيد المراجعة", tone: "peri" };
    if (draft) return { en: "Draft saved", ar: "مسودة محفوظة", tone: "default" };
    return { en: "Not started", ar: "لم يبدأ", tone: "slate" };
  };

  return (
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

      {state.personalOnly ? (
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
          {courses.map((course) => {
            const assignments = mod.assignments.filter((a) => a.courseId === course.id && a.status !== "draft");
            if (assignments.length === 0) return null;
            return (
              <div key={course.id}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: tokens.primary, background: tokens.primaryLight, border: `1px solid ${tokens.citationBorder}`, borderRadius: 6, padding: "3px 9px" }}>
                    {course.id}
                  </span>
                  <span style={{ fontFamily: hFont, fontWeight: 600, fontSize: 14, color: tokens.textPrimary, letterSpacing: "-0.02em" }}>
                    {lang === "ar" ? course.title.ar : course.title.en}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {assignments.map((a) => {
                    const st = myStatus(a.id);
                    const units = myUnits(a.id);
                    const graded = units.length > 0 && units.every((u) => u.status === "final");
                    const openable = a.status === "open" || units.length > 0;
                    return (
                      <Card tokens={tokens} key={a.id} style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                          <div style={{ textAlign: isRtl ? "right" : "left", minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                              <span style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em" }}>
                                {lang === "ar" ? a.title.ar : a.title.en}
                              </span>
                              <Chip tokens={tokens} tone={a.status === "open" ? "primary" : "slate"}>
                                {a.status === "open" ? (lang === "ar" ? "مفتوح" : "Open") : (lang === "ar" ? "مغلق" : "Closed")}
                              </Chip>
                              <Chip tokens={tokens} tone={st.tone}>{lang === "ar" ? st.ar : st.en}</Chip>
                              {graded && a.showScoreToStudent && units[0] && (
                                <ScoreValue kind="final" score={latestAttempt(units[0]).decision?.finalScore ?? null} max={a.questions[0]?.maxScore ?? 10} tokens={tokens} lang={lang} />
                              )}
                            </div>
                            <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted }}>
                              {a.questions.length} {lang === "ar" ? "أسئلة" : "questions"} · {course.instructor}
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
          {courses.every((c) => mod.assignments.filter((a) => a.courseId === c.id).length === 0) && (
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
  );
}