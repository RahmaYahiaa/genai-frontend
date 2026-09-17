import { useCallback } from "react";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { tk, MONO } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { demoMode } from "@/services/auth";
import { getAssignment, STATUS_LABELS, QUESTION_TYPE_LABELS } from "@/services/assignments";
import { AsyncGate } from "@/components/ui";
import { Card, Chip, BackCircle, bFontFor, hFontFor } from "@/components/ModuleUI";
import StudentAssignmentLegacy from "@/pages/StudentAssignmentLegacy";

function RealStudentAssignmentView({ state, dispatch }) {
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);
  const assignmentId = state.assignmentId;

  const load = useCallback(
    () => (assignmentId ? getAssignment(assignmentId) : Promise.resolve(null)),
    [assignmentId],
  );
  const { data, loading, error, reload } = useAsync(load);

  return (
    <div className="genai-pad" style={{ padding: mobile ? "20px 16px" : "26px 32px", direction: isRtl ? "rtl" : "ltr", maxWidth: 860, margin: "0 auto" }}>
      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Loading assignment…", "جاري تحميل التكليف…")}>
        {data && (
          <>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14, flexDirection: isRtl ? "row-reverse" : "row" }}>
              <BackCircle tokens={tokens} rtl={isRtl} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.STUDENT_ASSIGNMENTS })} />
              <div style={{ textAlign: isRtl ? "right" : "left", minWidth: 0 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 4, flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: 0 }}>
                    {data.title[lang]}
                  </h1>
                  <Chip tokens={tokens} tone={data.status === "OPEN" ? "primary" : "slate"}>
                    {lang === "ar" ? (STATUS_LABELS[data.status]?.ar ?? data.status) : (STATUS_LABELS[data.status]?.en ?? data.status)}
                  </Chip>
                </div>
                <p style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, margin: 0, lineHeight: 1.6 }}>
                  {data.canSubmit
                    ? t(
                      "Read-only preview for now: answering, auto-save and the single submit button arrive with the submissions batch.",
                      "معاينة قراءة فقط دلوقتي: الحل والحفظ التلقائي وزر التسليم الواحد هيصلوا مع دفعة التسليمات.",
                    )
                    : t("This assignment is not open for submission right now.", "التكليف ده مش مفتوح للتسليم دلوقتي.")}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[...(data.questions ?? [])].sort((a, b) => a.orderIndex - b.orderIndex).map((question) => (
                <Card tokens={tokens} key={question.id} style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.textFaint }}>Q{question.orderIndex}</span>
                    <Chip tokens={tokens} tone="primary">
                      {lang === "ar" ? QUESTION_TYPE_LABELS[question.type]?.ar : QUESTION_TYPE_LABELS[question.type]?.en}
                    </Chip>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.textMuted }}>{question.maxScore} {t("pts", "درجة")}</span>
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: tokens.textPrimary, lineHeight: 1.6, marginBottom: question.options.length ? 8 : 0, textAlign: isRtl ? "right" : "left" }}>
                    {question.text}
                  </div>
                  {question.options.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {question.options.map((option, index) => (
                        <div key={option.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "7px 10px", borderRadius: 8, border: `1px solid ${tokens.cardBorder}`, background: tokens.inset, flexDirection: isRtl ? "row-reverse" : "row" }}>
                          <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.textFaint }}>{String.fromCharCode(65 + index)}</span>
                          <span style={{ fontSize: 12.5, color: tokens.textPrimary, flex: 1, textAlign: isRtl ? "right" : "left" }}>{option.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </>
        )}
      </AsyncGate>
    </div>
  );
}

export default function StudentAssignmentPage(props) {
  if (demoMode()) return <StudentAssignmentLegacy {...props} />;
  return <RealStudentAssignmentView {...props} />;
}