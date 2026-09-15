import { tk } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useInstructorModule } from "@/store/InstructorProvider";
import { PillTabs, BackCircle, bFontFor, hFontFor } from "@/components/ModuleUI";
import { IconWarning } from "@/components/Icons";
import { SCREENS } from "@/constants/routes";
import { approvedMaterials } from "@/data/instructorModule";
import AssignmentsTab from "@/components/AssignmentsTab";

// ─────────────────────────────────────────────────────────────────────────────
// Course Workspace shell — reference d3/d6/d7: circular back button, course
// title header, and segmented pill tabs. Part 2 ships the Assignments tab;
// Analytics + Audit Trail tabs join in Part 4.
// ─────────────────────────────────────────────────────────────────────────────
export default function CourseWorkspacePage({ state, dispatch }) {
  const { state: mod } = useInstructorModule();
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);

  const courseId = state.courseId ?? "CS301";
  const course = mod.courses.find((c) => c.id === courseId) ?? mod.courses[0];
  const tab = "assignments";
  const coverageGaps = course.topics.filter((t) => approvedMaterials(t) === 0).length;

  return (
    <div
      className="genai-pad"
      style={{ padding: "26px 32px", maxWidth: 1180, margin: "0 auto", direction: isRtl ? "rtl" : "ltr" }}
    >
      {/* Header */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 20, flexDirection: isRtl ? "row-reverse" : "row" }}>
        <BackCircle tokens={tokens} rtl={isRtl} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.INSTRUCTOR_HOME, tab: undefined })} />
        <div style={{ textAlign: isRtl ? "right" : "left", minWidth: 0 }}>
          <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: "0 0 4px" }}>
            {course.id} · {lang === "ar" ? course.title.ar : course.title.en}
          </h1>
          <p style={{ fontSize: 13, color: tokens.textMuted, margin: 0, fontFamily: bFont, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
            <span>
              {course.instructor} · {course.enrolled} {lang === "ar" ? "طالباً" : "students"}
            </span>
            {coverageGaps > 0 && (
              <span style={{ display: "inline-flex", gap: 5, alignItems: "center", fontFamily: bFont, fontSize: 11, fontWeight: 600, color: tokens.gap, background: tokens.gapBg, border: `1px solid ${tokens.gap}44`, borderRadius: 6, padding: "2px 8px" }}>
                <IconWarning size={11} color={tokens.gap} />
                {coverageGaps} {lang === "ar" ? "فجوة تغطية" : `coverage gap${coverageGaps > 1 ? "s" : ""}`}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Pill tabs — Analytics & Audit Trail arrive in Part 4 */}
      <PillTabs
        tokens={tokens}
        lang={lang}
        active={tab}
        onSelect={() => {}}
        tabs={[{ id: "assignments", label: lang === "ar" ? "التكليفات" : "Assignments" }]}
      />

      <div style={{ marginTop: 24 }}>
        <AssignmentsTab state={state} dispatch={dispatch} courseId={course.id} />
      </div>
    </div>
  );
}