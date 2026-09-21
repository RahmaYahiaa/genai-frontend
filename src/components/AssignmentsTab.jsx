import { useCallback, useState } from "react";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { tk } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { demoMode } from "@/services/auth";
import { apiErrorText } from "@/services/http";
import {
  STATUS_LABELS,
  listAssignmentsForCourse,
  publishAssignment,
  closeAssignment,
  reopenAssignment,
} from "@/services/assignments";
import { AsyncGate } from "@/components/ui";
import { Card, Btn, Chip, bFontFor, hFontFor, toast } from "@/components/ModuleUI";
import { IconPlus, IconClipboard, IconPencil } from "@/components/Icons";
import AssignmentsTabLegacy from "@/components/AssignmentsTabLegacy";

function RealAssignmentsTab({ state, dispatch, courseId }) {
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);

  const load = useCallback(() => listAssignmentsForCourse(courseId), [courseId]);
  const { data, loading, error, reload } = useAsync(load);
  const [busy, setBusy] = useState(null);

  const openBuilder = (assignmentId) =>
    dispatch({ type: "NAVIGATE", screen: SCREENS.ASSIGNMENT_CREATE, courseId, assignmentId, tab: "assignments" });

  const run = async (action, fn, okMessage) => {
    if (busy) return;
    setBusy(action);
    try {
      await fn();
      if (okMessage) toast(okMessage);
      reload();
    } catch (err) {
      toast(apiErrorText(err, lang));
    } finally {
      setBusy(null);
    }
  };

  const assignments = data?.items ?? [];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, gap: 14, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
        <div style={{ textAlign: isRtl ? "right" : "left", minWidth: 0 }}>
          <h2 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 17 : 20, color: tokens.textPrimary, letterSpacing: "-0.02em", margin: "0 0 4px" }}>
            {t("Assignments", "التكليفات")}
          </h2>
          <p style={{ fontFamily: bFont, fontSize: 13, color: tokens.textMuted, margin: 0 }}>
            {t("All course assignments — you control when submissions open and close.", "جميع تكليفات المقرر — وأنت المتحكم في فتح التسليم وإغلاقه.")}
          </p>
        </div>
        <Btn tokens={tokens} lang={lang} onClick={() => openBuilder(undefined)} style={mobile ? { width: "100%" } : undefined}>
          <IconPlus size={13} color="#fff" />
          {t("New assignment", "تكليف جديد")}
        </Btn>
      </div>

      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Loading assignments…", "جاري تحميل التكليفات…")}>
        {assignments.length === 0 ? (
          <Card tokens={tokens}>
            <div style={{ textAlign: "center", padding: "30px 16px" }}>
              <div style={{ width: 46, height: 46, margin: "0 auto 12px", borderRadius: 12, background: tokens.inset, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconClipboard size={22} color={tokens.textFaint} />
              </div>
              <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 14.5, color: tokens.textPrimary, marginBottom: 5 }}>
                {t("No assignments in this course yet", "لا تكليفات في هذا المقرر بعد")}
              </div>
              <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.6, maxWidth: 380, margin: "0 auto 16px" }}>
                {t("Create the first assignment to open submission and AI-assisted evaluation.", "أنشئ أول تكليف ليبدأ التسليم والتقييم المساعد بالذكاء الاصطناعي.")}
              </div>
              <Btn tokens={tokens} lang={lang} onClick={() => openBuilder(undefined)}>
                <IconPlus size={13} color="#fff" />
                {t("New assignment", "تكليف جديد")}
              </Btn>
            </div>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: mobile ? 12 : 16 }}>
            {assignments.map((assignment) => {
              const statusLabel = STATUS_LABELS[assignment.status] ?? { en: assignment.status, ar: assignment.status };
              return (
                <Card tokens={tokens} key={assignment.id} style={{ padding: mobile ? "14px 16px" : "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                    <div style={{ textAlign: isRtl ? "right" : "left", minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                        <span style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em" }}>
                          {assignment.title[lang]}
                        </span>
                        <Chip tokens={tokens} tone={assignment.status === "OPEN" ? "primary" : assignment.status === "DRAFT" ? "peri" : "slate"}>
                          {lang === "ar" ? statusLabel.ar : statusLabel.en}
                        </Chip>
                        <button
                          onClick={() => openBuilder(assignment.id)}
                          title={t("Edit assignment", "تعديل التكليف")}
                          aria-label={t("Edit assignment", "تعديل التكليف")}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 3, borderRadius: 6, display: "inline-flex" }}
                        >
                          <IconPencil size={13} color={tokens.textFaint} />
                        </button>
                      </div>
                      <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                        <span>
                          {assignment.showGradeToStudent && assignment.showFeedbackToStudent
                            ? t("Students see grade + feedback", "يرى الطلاب الدرجة والملاحظات")
                            : assignment.showGradeToStudent
                              ? t("Students see the grade only", "يرى الطلاب الدرجة فقط")
                              : assignment.showFeedbackToStudent
                                ? t("Students see feedback only", "يرى الطلاب الملاحظات فقط")
                                : t("Students see nothing yet", "لا يظهر للطلاب أي شيء بعد")}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row", ...(mobile ? { width: "100%" } : {}) }}>
                      {assignment.status === "DRAFT" && (
                        <Btn tokens={tokens} lang={lang} disabled={busy === assignment.id} style={{ padding: "8px 16px", fontSize: 12.5, ...(mobile ? { flex: 1 } : {}) }}
                          onClick={() => run(assignment.id, () => publishAssignment(assignment.id), t("Published — students can now see and submit.", "اتنشر — الطلاب يقدروا يشوفوا ويسلّموا."))}>
                          {t("Publish", "نشر")}
                        </Btn>
                      )}
                      {assignment.status === "OPEN" && (
                        <Btn tokens={tokens} lang={lang} variant="ghost" disabled={busy === assignment.id} style={{ padding: "8px 16px", fontSize: 12.5, ...(mobile ? { flex: 1 } : {}) }}
                          onClick={() => run(assignment.id, () => closeAssignment(assignment.id), t("Closed for submissions.", "اتقفل للتسليم."))}>
                          {t("Close", "إغلاق")}
                        </Btn>
                      )}
                      {assignment.status === "CLOSED" && (
                        <Btn tokens={tokens} lang={lang} variant="ghost" disabled={busy === assignment.id} style={{ padding: "8px 16px", fontSize: 12.5, ...(mobile ? { flex: 1 } : {}) }}
                          onClick={() => run(assignment.id, () => reopenAssignment(assignment.id), t("Reopened.", "اتفتح تاني."))}>
                          {t("Reopen", "إعادة فتح")}
                        </Btn>
                      )}
                      <Btn tokens={tokens} lang={lang} variant="soft" style={{ padding: "8px 16px", fontSize: 12.5, ...(mobile ? { flex: 1 } : {}) }}
                        onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.ASSIGNMENT_REVIEW, courseId, assignmentId: assignment.id, tab: "assignments" })}>
                        {t("Open", "فتح")}
                      </Btn>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </AsyncGate>
    </>
  );
}

export default function AssignmentsTab(props) {
  if (demoMode()) return <AssignmentsTabLegacy {...props} />;
  return <RealAssignmentsTab {...props} />;
}