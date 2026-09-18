import { useCallback } from "react";
import useAsync from "@/hooks/useAsync";
import { tk } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useInstructorModule } from "@/store/InstructorProvider";
import { PillTabs, BackCircle, bFontFor, hFontFor } from "@/components/ModuleUI";
import { IconWarning } from "@/components/Icons";
import { SCREENS } from "@/constants/routes";
import { demoMode } from "@/services/auth";
import { getCourse } from "@/services/courses";
import { approvedMaterials } from "@/data/instructorModule";
import { AsyncGate } from "@/components/ui";
import AssignmentsTab from "@/components/AssignmentsTab";
import CourseMaterialsTab from "@/components/CourseMaterialsTab";
import CourseAnalyticsTab from "@/components/CourseAnalyticsTab";
import AuditTrailTab from "@/components/AuditTrailTab";

const TAB_IDS = ["assignments", "materials", "analytics", "audit"];

export default function CourseWorkspacePage({ state, dispatch }) {
  const { state: mod } = useInstructorModule();
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);
  const real = !demoMode();

  const courseId = state.courseId ?? "CS301";
  const load = useCallback(() => (real ? getCourse(courseId) : Promise.resolve(null)), [real, courseId]);
  const { data: liveCourse, loading, error, reload } = useAsync(load);
  const course = real ? liveCourse : mod.courses.find((c) => c.id === courseId) ?? mod.courses[0];
  const tab = TAB_IDS.includes(state.tab) ? state.tab : "assignments";
  const coverageGaps = real ? 0 : course.topics.filter((t) => approvedMaterials(t) === 0).length;

  return (
    <div
      className="genai-pad"
      style={{ padding: mobile ? "20px 16px" : "26px 32px", maxWidth: 1180, margin: "0 auto", direction: isRtl ? "rtl" : "ltr" }}
    >
      <AsyncGate tokens={tokens} lang={lang} loading={real && loading} error={error} reload={reload} label={lang === "ar" ? "جاري تحميل المقرر…" : "Loading course…"}>
        {course && (
          <>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 20, flexDirection: isRtl ? "row-reverse" : "row" }}>
              <BackCircle tokens={tokens} rtl={isRtl} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.INSTRUCTOR_HOME, tab: undefined })} />
              <div style={{ textAlign: isRtl ? "right" : "left", minWidth: 0 }}>
                <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: "0 0 4px" }}>
                  {real ? course.title[lang] : `${course.id} · ${lang === "ar" ? course.title.ar : course.title.en}`}
                </h1>
                <p style={{ fontSize: 13, color: tokens.textMuted, margin: 0, fontFamily: bFont, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                  {real ? (
                    <span>{course.description ?? (lang === "ar" ? "مقرر مؤسسي — إدارة التكليفات والمواد من هنا." : "Institutional course — manage assignments and materials from here.")}</span>
                  ) : (
                    <span>
                      {course.instructor} · {course.enrolled} {lang === "ar" ? "طالباً" : "students"}
                    </span>
                  )}
                  {coverageGaps > 0 && (
                    <span style={{ display: "inline-flex", gap: 5, alignItems: "center", fontFamily: bFont, fontSize: 11, fontWeight: 600, color: tokens.gap, background: tokens.gapBg, border: `1px solid ${tokens.gap}44`, borderRadius: 6, padding: "2px 8px" }}>
                      <IconWarning size={11} color={tokens.gap} />
                      {coverageGaps} {lang === "ar" ? "فجوة تغطية" : `coverage gap${coverageGaps > 1 ? "s" : ""}`}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <PillTabs
              tokens={tokens}
              lang={lang}
              active={tab}
              onSelect={(id) => dispatch({ type: "NAVIGATE", screen: SCREENS.COURSE_WORKSPACE, courseId: course.id, tab: id })}
              tabs={[
                { id: "assignments", label: lang === "ar" ? "التكليفات" : "Assignments" },
                { id: "materials", label: lang === "ar" ? "المواد" : "Materials" },
                { id: "analytics", label: lang === "ar" ? "التحليلات" : "Analytics" },
                { id: "audit", label: lang === "ar" ? "سجل التدقيق" : "Audit Trail" },
              ]}
            />

            <div style={{ marginTop: 24 }}>
              {tab === "assignments" && <AssignmentsTab state={state} dispatch={dispatch} courseId={course.id} />}
              {tab === "materials" && <CourseMaterialsTab state={state} dispatch={dispatch} courseId={course.id} />}
              {tab === "analytics" && <CourseAnalyticsTab state={state} dispatch={dispatch} courseId={course.id} />}
              {tab === "audit" && <AuditTrailTab state={state} courseId={course.id} />}
            </div>
          </>
        )}
      </AsyncGate>
    </div>
  );
}
