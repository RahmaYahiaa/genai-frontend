import { useCallback } from "react";
import useAsync from "@/hooks/useAsync";
import { tk } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useInstructorModule } from "@/store/InstructorProvider";
import { SCREENS } from "@/constants/routes";
import { demoMode } from "@/services/auth";
import { getCourse, listEnrollments } from "@/services/courses";
import { getCourseAnalytics } from "@/services/analytics";
import { LoadingBlock, ErrorBlock } from "@/components/study/StudyKit";
import { InstructorPage, CodeBadge } from "@/components/instructor/InstructorKit";
import AssignmentsTab from "@/components/AssignmentsTab";
import CourseMaterialsTab from "@/components/CourseMaterialsTab";
import CourseAnalyticsTab from "@/components/CourseAnalyticsTab";
import AuditTrailTab from "@/components/AuditTrailTab";

const TAB_IDS = ["assignments", "materials", "analytics", "audit"];

/** One course, four clear areas: assignments, materials, class results, activity. */
export default function CourseWorkspacePage({ state, dispatch }) {
  const { state: mod } = useInstructorModule();
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const real = !demoMode();

  const courseId = state.courseId ?? "CS301";
  const load = useCallback(async () => {
    if (!real) return null;
    const [course, roster, analytics] = await Promise.all([
      getCourse(courseId),
      listEnrollments(courseId, { page: 1, limit: 1 }).catch(() => null),
      getCourseAnalytics(courseId).catch(() => null),
    ]);
    return { course, students: roster?.total ?? null, totals: analytics?.totals ?? null };
  }, [real, courseId]);
  const { data, loading, error, reload } = useAsync(load);
  const course = real ? data?.course : mod.courses.find((c) => c.id === courseId) ?? mod.courses[0];
  const tab = TAB_IDS.includes(state.tab) ? state.tab : "assignments";
  const L = (v) => (typeof v === "string" ? v : v?.[lang] ?? v?.en ?? "");

  const tabs = [
    { id: "assignments", label: t("Assignments", "التكليفات") },
    { id: "materials", label: t("Materials", "المواد") },
    { id: "analytics", label: t("Class results", "نتايج الطلاب") },
    { id: "audit", label: t("Activity", "النشاط") },
  ];
  const totals = data?.totals;
  const facts = real && course
    ? [
        data?.students != null && t(`${data.students} students`, `${data.students} طالب`),
        totals?.assignments && t(`${totals.assignments.openCount} open assignments`, `${totals.assignments.openCount} تكليف مفتوح`),
        totals?.materials && t(`${totals.materials.readyCount} files ready`, `${totals.materials.readyCount} ملف جاهز`),
        (course.topics ?? []).length > 0 && t(`${course.topics.length} topics`, `${course.topics.length} موضوع`),
      ].filter(Boolean)
    : [];

  return (
    <InstructorPage tokens={tokens} lang={lang} mobile={mobile} width={1120}
      back={{ label: t("My courses", "مقرراتي"), onClick: () => dispatch({ type: "NAVIGATE", screen: SCREENS.INSTRUCTOR_COURSES, tab: undefined }) }}
      title={course ? <span style={{ display: "inline-flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>{L(course.title)}<CodeBadge tokens={tokens}>{course.code ?? (real ? "" : course.id)}</CodeBadge></span> : t("Course", "المقرر")}
      subtitle={facts.length ? facts.join(" · ") : undefined}>
      {real && loading ? (
        <LoadingBlock tokens={tokens} label={t("Loading course…", "بنحمّل المقرر…")} />
      ) : error ? (
        <ErrorBlock tokens={tokens} lang={lang} onRetry={reload} />
      ) : course ? (
        <>
          <div role="tablist" style={{ display: "flex", gap: 4, borderBottom: `1px solid ${tokens.cardBorder}`, marginBottom: 24, overflowX: "auto" }}>
            {tabs.map((item) => {
              const active = item.id === tab;
              return (
                <button key={item.id} role="tab" aria-selected={active} type="button"
                  onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.COURSE_WORKSPACE, courseId: course.id, tab: item.id })}
                  style={{ padding: "10px 14px", background: "none", border: "none", borderBottom: `2px solid ${active ? tokens.primary : "transparent"}`, marginBottom: -1, color: active ? tokens.primary : tokens.textMuted, fontWeight: active ? 650 : 500, fontSize: 14, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                  {item.label}
                </button>
              );
            })}
          </div>
          {tab === "assignments" && <AssignmentsTab state={state} dispatch={dispatch} courseId={course.id} />}
          {tab === "materials" && <CourseMaterialsTab state={state} dispatch={dispatch} courseId={course.id} />}
          {tab === "analytics" && <CourseAnalyticsTab state={state} dispatch={dispatch} courseId={course.id} />}
          {tab === "audit" && <AuditTrailTab state={state} courseId={course.id} />}
        </>
      ) : null}
    </InstructorPage>
  );
}
