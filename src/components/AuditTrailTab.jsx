import { useMemo, useState, useCallback } from "react";
import { tk, MONO } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import useAsync from "@/hooks/useAsync";
import { demoMode } from "@/services/auth";
import { listCourseAudit, AUDIT_ACTION_LABELS } from "@/services/analytics";
import { AsyncGate } from "@/components/ui";
import { useInstructorModule } from "@/store/InstructorProvider";
import { Card, Chip, Th, bFontFor, hFontFor, inputStyle, Btn, AlertStrip } from "@/components/ModuleUI";
import { fmtWhen } from "@/data/instructorModule";

function DemoAuditTrailTab({ state, courseId }) {
  const { state: mod } = useInstructorModule();
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);

  const [fAssignment, setFAssignment] = useState("all");
  const [fAction, setFAction] = useState("all");
  const [fRange, setFRange] = useState("all");

  const courseEntries = useMemo(() => mod.audit.filter((e) => e.courseId === courseId), [mod.audit, courseId]);

  const rows = courseEntries
    .filter((e) => fAssignment === "all" || e.assignmentId === fAssignment)
    .filter((e) => fAction === "all" || e.action === fAction)
    .filter((e) => {
      if (fRange === "all") return true;
      const days = fRange === "7" ? 7 : fRange === "30" ? 30 : 120;
      return Date.now() - new Date(e.at).getTime() < days * 86400000;
    })
    .sort((a, b) => b.at.localeCompare(a.at));

  const mix = useMemo(() => {
    const m = { approve: 0, edit: 0, reject: 0, resubmit: 0 };
    courseEntries.forEach((e) => { m[e.action] = (m[e.action] ?? 0) + 1; });
    return m;
  }, [courseEntries]);
  const ratified = mix.approve;
  const changed = mix.edit + mix.reject + mix.resubmit;
  const total = Math.max(1, ratified + changed);

  const actionChip = (action) => {
    const map = {
      approve: { tone: "primary", en: "Approve", ar: "اعتماد" },
      edit: { tone: "primary", en: "Edit", ar: "تعديل" },
      resubmit: { tone: "primary", en: "Request resubmission", ar: "طلب إعادة التسليم" },
      visibility: { tone: "slate", en: "Score visibility", ar: "إظهار الدرجة" },
      reject: { tone: "violet", en: "Reject", ar: "رفض" },
      reopen: { tone: "slate", en: "Reopen", ar: "إعادة فتح" },
    };
    const m = map[action] ?? map.edit;
    return <Chip tokens={tokens} tone={m.tone}>{lang === "ar" ? m.ar : m.en}</Chip>;
  };

  return (
    <div style={{ direction: isRtl ? "rtl" : "ltr" }}>
      <div style={{ marginBottom: 18, textAlign: isRtl ? "right" : "left" }}>
        <h2 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 17 : 20, color: tokens.textPrimary, letterSpacing: "-0.02em", margin: "0 0 4px" }}>
          {lang === "ar" ? "سجل التدقيق" : "Audit Trail"}
        </h2>
        <p style={{ fontFamily: bFont, fontSize: 13, color: tokens.textMuted, margin: 0 }}>
          {lang === "ar"
            ? "كل قرار غيّر أو أقرّ تقييم الذكاء الاصطناعي. للمدرّسين فقط."
            : "Every decision that changed or ratified an AI evaluation. Instructors only."}
        </p>
      </div>

      <Card tokens={tokens} style={{ padding: "14px 18px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
          <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textMuted }}>
            {lang === "ar"
              ? `دليل دقة الذكاء الاصطناعي: ${ratified} قراراً أُقرّ كما هو مقابل ${changed} غيّرته يد المدرّس.`
              : `AI accuracy evidence: ${ratified} decision${ratified === 1 ? "" : "s"} ratified as-is vs ${changed} changed by the instructor.`}
          </div>
          <div style={{ display: "flex", gap: 3, height: 10, width: 180, borderRadius: 5, overflow: "hidden", border: `1px solid ${tokens.cardBorder}`, flexShrink: 0 }}>
            <div style={{ width: `${(ratified / total) * 100}%`, background: tokens.mastered }} title={`approve ${ratified}`} />
            <div style={{ width: `${(mix.edit / total) * 100}%`, background: tokens.developing }} title={`edit ${mix.edit}`} />
            <div style={{ width: `${(mix.resubmit / total) * 100}%`, background: tokens.gap }} title={`resubmit ${mix.resubmit}`} />
            <div style={{ width: `${(mix.reject / total) * 100}%`, background: tokens.noEvidence }} title={`reject ${mix.reject}`} />
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
        <select value={fAssignment} onChange={(e) => setFAssignment(e.target.value)} style={{ ...inputStyle(tokens, bFont), cursor: "pointer", width: mobile ? "100%" : 230 }} className="genai-input">
          <option value="all">{lang === "ar" ? "كل التكليفات" : "All assignments"}</option>
          {[...new Set(courseEntries.map((e) => e.assignmentId))].map((id) => (
            <option key={id} value={id}>{courseEntries.find((e) => e.assignmentId === id)?.assignmentTitle}</option>
          ))}
        </select>
        <select value={fAction} onChange={(e) => setFAction(e.target.value)} style={{ ...inputStyle(tokens, bFont), cursor: "pointer", width: mobile ? "100%" : 190 }} className="genai-input">
          <option value="all">{lang === "ar" ? "كل أنواع القرارات" : "All decision types"}</option>
          <option value="approve">{lang === "ar" ? "اعتماد" : "Approve"}</option>
          <option value="edit">{lang === "ar" ? "تعديل" : "Edit"}</option>
          <option value="reject">{lang === "ar" ? "رفض" : "Reject"}</option>
          <option value="resubmit">{lang === "ar" ? "طلب إعادة التسليم" : "Request resubmission"}</option>
          <option value="visibility">{lang === "ar" ? "إظهار الدرجة" : "Score visibility"}</option>
        </select>
        <select value={fRange} onChange={(e) => setFRange(e.target.value)} style={{ ...inputStyle(tokens, bFont), cursor: "pointer", width: mobile ? "100%" : 170 }} className="genai-input">
          <option value="all">{lang === "ar" ? "كل الفترات" : "Any date"}</option>
          <option value="7">{lang === "ar" ? "آخر 7 أيام" : "Last 7 days"}</option>
          <option value="30">{lang === "ar" ? "آخر 30 يوماً" : "Last 30 days"}</option>
          <option value="120">{lang === "ar" ? "هذا الفصل" : "This semester"}</option>
        </select>
      </div>

      <Card tokens={tokens} style={{ padding: "6px 20px" }}>
        {rows.length === 0 ? (
          <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textFaint, padding: "22px 0" }}>
            {lang === "ar" ? "لا قرارات مسجلة في هذا المقرر بعد." : "No recorded decisions in this course yet."}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: mobile ? 620 : undefined }}>
              <thead>
                <tr>
                  <Th tokens={tokens}>{lang === "ar" ? "التاريخ / الوقت" : "DATE / TIME"}</Th>
                  <Th tokens={tokens}>{lang === "ar" ? "الإجراء" : "ACTION"}</Th>
                  <Th tokens={tokens} align="right">{lang === "ar" ? "درجة الذكاء" : "AI SCORE"}</Th>
                  <Th tokens={tokens} align="right">{lang === "ar" ? "الدرجة النهائية" : "FINAL SCORE"}</Th>
                  <Th tokens={tokens}>{lang === "ar" ? "المدرّس" : "INSTRUCTOR"}</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e, i) => (
                  <tr key={e.id} style={{ borderBottom: i < rows.length - 1 ? `1px solid ${tokens.cardBorder}` : "none" }}>
                    <td style={{ padding: "15px 10px", fontFamily: bFont, fontSize: 12.5, color: tokens.textSecondary, whiteSpace: "nowrap" }}>
                      {fmtWhen(e.at, lang)}
                    </td>
                    <td style={{ padding: "15px 10px" }}>
                      <div style={{ marginBottom: 5 }}>{actionChip(e.action)}</div>
                      <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted }}>{e.assignmentTitle}</div>
                      {e.action === "visibility" ? (
                        <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textSecondary, marginTop: 4 }}>
                          {lang === "ar"
                            ? `إظهار الدرجة ${e.visibilityBefore ? "تشغيل" : "إيقاف"} → ${e.visibilityAfter ? "تشغيل" : "إيقاف"}`
                            : `Score visibility ${e.visibilityBefore ? "ON" : "OFF"} → ${e.visibilityAfter ? "ON" : "OFF"}`}
                        </div>
                      ) : e.note ? (
                        <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textSecondary, marginTop: 4 }}>{e.note}</div>
                      ) : null}
                    </td>
                    <td style={{ padding: "15px 10px", textAlign: "right", fontFamily: MONO, fontSize: 13, fontWeight: 700, color: e.aiScore === null ? tokens.textFaint : tokens.textPrimary }}>
                      {e.aiScore === null ? "—" : e.aiScore}
                    </td>
                    <td style={{ padding: "15px 10px", textAlign: "right", fontFamily: MONO, fontSize: 13, fontWeight: 700, color: e.finalScore === null ? tokens.textFaint : tokens.primary }}>
                      {e.finalScore === null ? "—" : e.finalScore}
                    </td>
                    <td style={{ padding: "15px 10px", fontFamily: bFont, fontSize: 12.5, color: tokens.textSecondary, whiteSpace: "nowrap" }}>{e.instructor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

const ACTION_TONE = {
  APPROVE: "primary",
  EDIT: "slate",
  REJECT: "violet",
  REQUEST_RESUBMISSION: "violet",
  TOGGLE_GRADE_VISIBILITY: "slate",
  TOGGLE_FEEDBACK_VISIBILITY: "slate",
};

function RealAuditTrailTab({ state, courseId }) {
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const isRtl = lang === "ar";
  const bFont = bFontFor(lang);
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);

  const load = useCallback(
    () => (courseId
      ? listCourseAudit(courseId, {
        page,
        limit: 20,
        action: actionFilter === "all" ? undefined : actionFilter,
      })
      : Promise.resolve(null)),
    [courseId, page, actionFilter],
  );
  const { data, loading, error, reload } = useAsync(load);
  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <AlertStrip
        tokens={tokens}
        lang={lang}
        tone="slate"
        icon={<span style={{ fontFamily: MONO, fontSize: 11, color: tokens.textMuted }}>▣</span>}
        title={t("Governance log — staff only, never shown to students.", "سجل حوكمة — للطاقم بس، مش بيظهر للطلاب أبداً.")}
      />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <select
          value={actionFilter}
          onChange={(event) => {
            setActionFilter(event.target.value);
            setPage(1);
          }}
          style={{ ...inputStyle(tokens, bFont), minWidth: 170 }}
        >
          <option value="all">{t("All actions", "كل الإجراءات")}</option>
          {Object.entries(AUDIT_ACTION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{lang === "ar" ? label.ar : label.en}</option>
          ))}
        </select>
        <span style={{ fontFamily: MONO, fontSize: 10.5, color: tokens.textMuted }}>
          {t("page", "صفحة")} {page}/{pages} · {total} {t("entries", "سجل")}
        </span>
        <span style={{ flex: 1 }} />
        <Btn tokens={tokens} lang={lang} variant="ghost" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
          {t("Previous", "السابق")}
        </Btn>
        <Btn tokens={tokens} lang={lang} variant="ghost" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>
          {t("Next", "التالي")}
        </Btn>
      </div>
      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Loading audit log…", "جاري تحميل السجل…")}>
        {rows.length === 0 ? (
          <Card tokens={tokens} style={{ padding: "16px 18px" }}>
            <p style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, margin: 0, lineHeight: 1.7, textAlign: isRtl ? "right" : "left" }}>
              {t("No audit entries for this filter yet.", "مفيش مدخلات سجل للفلتر ده لسه.")}
            </p>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rows.map((row) => (
              <Card tokens={tokens} key={row.id} style={{ padding: mobile ? "10px 12px" : "12px 14px" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4, flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <span style={{ fontFamily: bFont, fontSize: 12.5, fontWeight: 600, color: tokens.textPrimary }}>{row.actorName}</span>
                  <Chip tokens={tokens} tone={ACTION_TONE[row.action] ?? "slate"}>
                    {lang === "ar" ? AUDIT_ACTION_LABELS[row.action]?.ar ?? row.action : AUDIT_ACTION_LABELS[row.action]?.en ?? row.action}
                  </Chip>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.textFaint }}>
                    {new Date(row.createdAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB")}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <span style={{ fontFamily: MONO, fontSize: 10.5, color: tokens.textSecondary }}>
                    {t("AI", "ذكاء")}: {row.aiOriginalScore ?? "—"} → {t("final", "نهائي")}: {row.finalScore ?? "—"}
                  </span>
                  {row.reasonText && (
                    <span style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.gap, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: mobile ? "100%" : 420, textAlign: isRtl ? "right" : "left" }}>
                      {row.reasonText}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </AsyncGate>
    </div>
  );
}

export default function AuditTrailTab(props) {
  if (demoMode()) return <DemoAuditTrailTab {...props} />;
  return <RealAuditTrailTab {...props} />;
}
