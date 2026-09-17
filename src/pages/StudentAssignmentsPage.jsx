import { useCallback } from "react";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { tk, MONO } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { demoMode } from "@/services/auth";
import { listCourses } from "@/services/courses";
import { listAssignmentsForCourse, STATUS_LABELS } from "@/services/assignments";
import { AsyncGate } from "@/components/ui";
import { Card, Btn, Chip, bFontFor, hFontFor } from "@/components/ModuleUI";
import { IconLock } from "@/components/Icons";
import StudentAssignmentsLegacy from "@/pages/StudentAssignmentsLegacy";

function RealStudentAssignments({ state, dispatch }) {
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);

  const load = useCallback(async () => {
    const { items } = await listCourses({ limit: 100 });
    const institutional = items.filter((course) => !course.isPersonal);
    const groups = await Promise.all(
      institutional.map(async (course) => {
        try {
          const result = await listAssignmentsForCourse(course.id);
          return { course, assignments: result.items };
        } catch {
          return { course, assignments: [] };
        }
      }),
    );
    return groups.filter((group) => group.assignments.length > 0);
  }, []);
  const { data, loading, error, reload } = useAsync(load);

  const groups = data ?? [];
  const individual = state.user?.accountType === "individual";

  if (individual) {
    return (
      <div className="genai-pad" style={{ padding: mobile ? "20px 16px" : "28px 32px", direction: isRtl ? "rtl" : "ltr", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 20, textAlign: isRtl ? "right" : "left" }}>
          <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: "0 0 3px" }}>
            {t("Assignments", "التكليفات")}
          </h1>
        </div>
        <Card tokens={tokens} style={{ padding: "34px 24px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", width: 44, height: 44, borderRadius: "50%", background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <IconLock size={22} color={tokens.textFaint} />
          </div>
          <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, marginBottom: 4 }}>
            {t("No assignments on personal courses", "لا تكليفات في المقررات الشخصية")}
          </div>
          <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.6 }}>
            {t(
              "The assignment and grading module is institution-only: a personal course has no instructor, so there is no approval gate. Your self-directed loop continues as usual.",
              "وحدة التكليفات والتصحيح مؤسسة فقط: المقرر الشخصي لا مدرّس له، فلا بوابة اعتماد. تعلّمك الذاتي يستمر كالمعتاد.",
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="genai-pad" style={{ padding: mobile ? "20px 16px" : "28px 32px", direction: isRtl ? "rtl" : "ltr", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 20, textAlign: isRtl ? "right" : "left" }}>
        <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: "0 0 3px" }}>
          {t("Assignments", "التكليفات")}
        </h1>
        <p style={{ fontSize: 12.5, color: tokens.textMuted, margin: 0, fontFamily: bFont }}>
          {t(
            "Your drafts auto-save continuously. Nothing is sent for grading until the single “Submit assignment” action.",
            "مسوداتك تُحفظ تلقائياً. لا يُرسَل شيء للتقييم إلا بزر «تسليم التكليف» الواحد.",
          )}
        </p>
      </div>

      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Loading assignments…", "جاري تحميل التكليفات…")}>
        {groups.length === 0 ? (
          <Card tokens={tokens} style={{ padding: "34px 24px", textAlign: "center" }}>
            <div style={{ display: "inline-flex", width: 44, height: 44, borderRadius: "50%", background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <IconLock size={22} color={tokens.textFaint} />
            </div>
            <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, marginBottom: 4 }}>
              {t("No open assignments yet", "مفيش تكليفات منشورة لسه")}
            </div>
            <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.6 }}>
              {t(
                "When your course staff publish an assignment it will appear here.",
                "لما مسؤولي مقرراتك ينشروا تكليف هيظهر هنا على طول.",
              )}
            </div>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {groups.map(({ course, assignments }) => (
              <div key={course.id}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: tokens.primary, background: tokens.primaryLight, border: `1px solid ${tokens.citationBorder}`, borderRadius: 6, padding: "3px 9px" }}>
                    {course.code ?? course.id.slice(0, 8)}
                  </span>
                  <span style={{ fontFamily: hFont, fontWeight: 600, fontSize: 14, color: tokens.textPrimary }}>
                    {course.title[lang]}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {assignments.map((assignment) => {
                    const statusLabel = STATUS_LABELS[assignment.status] ?? { en: assignment.status, ar: assignment.status };
                    return (
                      <Card tokens={tokens} key={assignment.id} style={{ padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                        <div style={{ minWidth: 0, flex: 1, textAlign: isRtl ? "right" : "left" }}>
                          <div style={{ fontFamily: bFont, fontWeight: 600, fontSize: 13.5, color: tokens.textPrimary, marginBottom: 4 }}>
                            {assignment.title[lang]}
                          </div>
                          <Chip tokens={tokens} tone={assignment.status === "OPEN" ? "primary" : "slate"}>
                            {lang === "ar" ? statusLabel.ar : statusLabel.en}
                          </Chip>
                        </div>
                        <Btn tokens={tokens} lang={lang} variant="soft" style={{ flexShrink: 0 }}
                          onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.STUDENT_ASSIGNMENT, courseId: course.id, assignmentId: assignment.id })}>
                          {assignment.status === "OPEN" ? t("Open assignment", "افتحي التكليف") : t("View", "عرض")}
                        </Btn>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </AsyncGate>
    </div>
  );
}

export default function StudentAssignmentsPage(props) {
  if (demoMode()) return <StudentAssignmentsLegacy {...props} />;
  return <RealStudentAssignments {...props} />;
}
