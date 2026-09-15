import { tk } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useInstructorModule } from "@/store/InstructorProvider";
import {
  Card,
  Btn,
  Chip,
  bFontFor,
  hFontFor,
  toast,
} from "@/components/ModuleUI";
import { IconPlus, IconClipboard, IconPencil } from "@/components/Icons";
import { SCREENS } from "@/constants/routes";

// ─────────────────────────────────────────────────────────────────────────────
// Assignments tab — reference d3: a stacked list of assignment cards (not a
// table). Each card shows its status chip, a one-line meta summary with the
// pending-review count emphasised, and Publish / Close / Edit controls.
// The review "Open" action arrives with the Review screen in Part 3.
// ─────────────────────────────────────────────────────────────────────────────
export default function AssignmentsTab({ state, dispatch, courseId }) {
  const { state: mod, setAssignmentStatus } = useInstructorModule();
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);

  const assignments = mod.assignments.filter((a) => a.courseId === courseId);
  const openBuilder = (assignmentId) =>
    dispatch({
      type: "NAVIGATE",
      screen: SCREENS.ASSIGNMENT_CREATE,
      courseId,
      assignmentId,
      tab: "assignments",
    });

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 18,
          gap: 14,
          flexWrap: "wrap",
          flexDirection: isRtl ? "row-reverse" : "row",
        }}
      >
        <div style={{ textAlign: isRtl ? "right" : "left", minWidth: 0 }}>
          <h2
            style={{
              fontFamily: hFont,
              fontWeight: 700,
              fontSize: mobile ? 17 : 20,
              color: tokens.textPrimary,
              letterSpacing: "-0.02em",
              margin: "0 0 4px",
            }}
          >
            {lang === "ar" ? "التكليفات" : "Assignments"}
          </h2>
          <p
            style={{
              fontFamily: bFont,
              fontSize: 13,
              color: tokens.textMuted,
              margin: 0,
            }}
          >
            {lang === "ar"
              ? "كل تكليف في هذا المقرر. المفتوح يبقى مفتوحاً حتى تغلقه بنفسك."
              : "Every assignment in this course. Open stays open until you close it."}
          </p>
        </div>
        <Btn
          tokens={tokens}
          lang={lang}
          onClick={() => openBuilder(undefined)}
          style={mobile ? { width: "100%" } : undefined}
        >
          <IconPlus size={13} color="#fff" />
          {lang === "ar" ? "تكليف جديد" : "New assignment"}
        </Btn>
      </div>

      {assignments.length === 0 ? (
        <Card tokens={tokens}>
          <div style={{ textAlign: "center", padding: "30px 16px" }}>
            <div
              style={{
                width: 46,
                height: 46,
                margin: "0 auto 12px",
                borderRadius: 12,
                background: tokens.inset,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconClipboard size={22} color={tokens.textFaint} />
            </div>
            <div
              style={{
                fontFamily: hFont,
                fontWeight: 600,
                fontSize: 14.5,
                color: tokens.textPrimary,
                marginBottom: 5,
              }}
            >
              {lang === "ar"
                ? "لا تكليفات في هذا المقرر بعد"
                : "No assignments in this course yet"}
            </div>
            <div
              style={{
                fontFamily: bFont,
                fontSize: 12.5,
                color: tokens.textMuted,
                lineHeight: 1.6,
                maxWidth: 380,
                margin: "0 auto 16px",
              }}
            >
              {lang === "ar"
                ? "أنشئ أول تكليف ليبدأ التسليم والتقييم المساعد بالذكاء الاصطناعي."
                : "Create the first assignment to open submission and AI-assisted evaluation."}
            </div>
            <Btn
              tokens={tokens}
              lang={lang}
              onClick={() => openBuilder(undefined)}
            >
              <IconPlus size={13} color="#fff" />
              {lang === "ar" ? "تكليف جديد" : "New assignment"}
            </Btn>
          </div>
        </Card>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: mobile ? 12 : 16,
          }}
        >
          {assignments.map((a) => {
            const units = mod.units.filter((u) => u.assignmentId === a.id);
            const received = units.length;
            const pending = units.filter(
              (u) => u.status === "awaiting_review",
            ).length;
            const topics = new Set(a.questions.map((q) => q.topicId)).size;
            const open = a.status === "open";
            return (
              <Card
                tokens={tokens}
                key={a.id}
                style={{ padding: mobile ? "14px 16px" : "16px 20px" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 14,
                    flexWrap: "wrap",
                    flexDirection: isRtl ? "row-reverse" : "row",
                  }}
                >
                  <div
                    style={{
                      textAlign: isRtl ? "right" : "left",
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 6,
                        flexWrap: "wrap",
                        flexDirection: isRtl ? "row-reverse" : "row",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: hFont,
                          fontWeight: 600,
                          fontSize: 15,
                          color: tokens.textPrimary,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {lang === "ar" ? a.title.ar : a.title.en}
                      </span>
                      <Chip
                        tokens={tokens}
                        tone={
                          a.status === "open"
                            ? "primary"
                            : a.status === "draft"
                              ? "peri"
                              : "slate"
                        }
                      >
                        {a.status === "open"
                          ? lang === "ar"
                            ? "مفتوح"
                            : "Open"
                          : a.status === "draft"
                            ? lang === "ar"
                              ? "مسودة"
                              : "Draft"
                            : lang === "ar"
                              ? "مغلق"
                              : "Closed"}
                      </Chip>
                      <button
                        onClick={() => openBuilder(a.id)}
                        title={
                          lang === "ar" ? "تعديل التكليف" : "Edit assignment"
                        }
                        aria-label={
                          lang === "ar" ? "تعديل التكليف" : "Edit assignment"
                        }
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 3,
                          borderRadius: 6,
                          display: "inline-flex",
                        }}
                      >
                        <IconPencil size={13} color={tokens.textFaint} />
                      </button>
                    </div>
                    <div
                      style={{
                        fontFamily: bFont,
                        fontSize: 12.5,
                        color: tokens.textMuted,
                        display: "flex",
                        gap: 6,
                        alignItems: "center",
                        flexWrap: "wrap",
                        flexDirection: isRtl ? "row-reverse" : "row",
                      }}
                    >
                      <span>
                        {received} {lang === "ar" ? "تسلّم" : "received"}
                      </span>
                      <span>·</span>
                      <span
                        style={{
                          fontWeight: pending > 0 ? 700 : 500,
                          color:
                            pending > 0 ? tokens.primary : tokens.textMuted,
                        }}
                      >
                        {pending}{" "}
                        {lang === "ar" ? "بانتظار المراجعة" : "pending review"}
                      </span>
                      <span>·</span>
                      <span>
                        {topics}{" "}
                        {lang === "ar"
                          ? topics === 1
                            ? "موضوع"
                            : "مواضيع"
                          : topics === 1
                            ? "topic"
                            : "topics"}
                      </span>
                      <span>·</span>
                      <span>
                        {a.questions.length}{" "}
                        {lang === "ar"
                          ? a.questions.length === 1
                            ? "سؤال"
                            : "أسئلة"
                          : a.questions.length === 1
                            ? "question"
                            : "questions"}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexShrink: 0,
                      flexWrap: "wrap",
                      flexDirection: isRtl ? "row-reverse" : "row",
                      ...(mobile ? { width: "100%" } : {}),
                    }}
                  >
                    {a.status === "draft" && (
                      <Btn
                        tokens={tokens}
                        lang={lang}
                        style={{
                          padding: "8px 16px",
                          fontSize: 12.5,
                          ...(mobile ? { flex: 1 } : {}),
                        }}
                        onClick={() => {
                          setAssignmentStatus(a.id, "open");
                          toast(
                            lang === "ar"
                              ? `نُشر «${a.title.ar}» — الحالة: مفتوح.`
                              : `Published "${a.title.en}" — status Open.`,
                          );
                        }}
                      >
                        {lang === "ar" ? "نشر" : "Publish"}
                      </Btn>
                    )}
                    {open && (
                      <Btn
                        tokens={tokens}
                        lang={lang}
                        variant="ghost"
                        title={
                          lang === "ar"
                            ? "إغلاق يدوي — يعطّل التسليم ويبقي سجل المراجعة"
                            : "Manual close — disables submission, keeps review history"
                        }
                        style={{
                          padding: "8px 16px",
                          fontSize: 12.5,
                          ...(mobile ? { flex: 1 } : {}),
                        }}
                        onClick={() => {
                          setAssignmentStatus(a.id, "closed");
                          toast(
                            lang === "ar"
                              ? `أُغلق «${a.title.ar}» — التسليم معطّل وسجل المراجعة باقٍ.`
                              : `Closed "${a.title.en}" — submission disabled, review history kept.`,
                          );
                        }}
                      >
                        {lang === "ar" ? "إغلاق" : "Close"}
                      </Btn>
                    )}
                    <Btn
                      tokens={tokens}
                      lang={lang}
                      variant="soft"
                      style={{
                        padding: "8px 16px",
                        fontSize: 12.5,
                        ...(mobile ? { flex: 1 } : {}),
                      }}
                      onClick={() =>
                        dispatch({
                          type: "NAVIGATE",
                          screen: SCREENS.ASSIGNMENT_REVIEW,
                          courseId,
                          assignmentId: a.id,
                          tab: "assignments",
                        })
                      }
                    >
                      {lang === "ar" ? "فتح" : "Open"}
                    </Btn>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
