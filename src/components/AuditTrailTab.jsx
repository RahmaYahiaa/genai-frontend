import { useMemo, useState, useCallback } from "react";
import { tk, MONO } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import useAsync from "@/hooks/useAsync";
import { demoMode } from "@/services/auth";
import { listCourseAudit } from "@/services/analytics";
import { listAssignmentsForCourse } from "@/services/assignments";
import { AsyncGate } from "@/components/ui";
import { useInstructorModule } from "@/store/InstructorProvider";
import { Card, Chip, Th, bFontFor, hFontFor, inputStyle } from "@/components/ModuleUI";
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

function RealAuditTrailTab({ state, courseId }) {
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);

  const [fAssignment, setFAssignment] = useState("all");
  const [fAction, setFAction] = useState("all");
  const [fRange, setFRange] = useState("all");

  const load = useCallback(async () => {
    const [audit, assignments] = await Promise.all([
      listCourseAudit(courseId, { limit: 100 }),
      listAssignmentsForCourse(courseId, {}).catch(() => ({ items: [] })),
    ]);
    const titles = Object.fromEntries(
      (assignments.items ?? []).map((assignment) => [assignment.id, assignment.title?.[lang] ?? assignment.title?.en ?? ""]),
    );
    const mapAction = (action) => (
      {
        APPROVE: "approve",
        EDIT: "edit",
        REJECT: "reject",
        REQUEST_RESUBMISSION: "resubmit",
        TOGGLE_GRADE_VISIBILITY: "visibility",
        TOGGLE_FEEDBACK_VISIBILITY: "visibility",
      }[action] ?? "edit"
    );
    return (audit.items ?? []).map((row) => ({
      id: row.id,
      at: row.createdAt,
      action: mapAction(row.action),
      assignmentId: row.assignmentId ?? "all",
      assignmentTitle: titles[row.assignmentId] ?? "",
      aiScore: row.aiOriginalScore ?? null,
      finalScore: row.finalScore ?? null,
      instructor: row.actorName ?? "—",
      note: row.reasonText ?? null,
      visibilityBefore: row.metadata?.from ?? null,
      visibilityAfter: row.metadata?.to ?? null,
    }));
  }, [courseId, lang]);
  const { data, loading, error, reload } = useAsync(load);
  const courseEntries = useMemo(() => data ?? [], [data]);

  const rows = courseEntries
    .filter((e) => fAssignment === "all" || e.assignmentId === fAssignment)
    .filter((e) => fAction === "all" || e.action === fAction)
    .filter((e) => {
      if (fRange === "all") return true;
      const days = fRange === "7" ? 7 : fRange === "30" ? 30 : 120;
      return Date.now() - new Date(e.at).getTime() < days * 86400000;
    })
    .sort((a, b) => String(b.at).localeCompare(String(a.at)));

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

      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={lang === "ar" ? "جاري تحميل السجل…" : "Loading audit trail…"}>
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
      </AsyncGate>
    </div>
  );
}

export default function AuditTrailTab(props) {
  if (demoMode()) return <DemoAuditTrailTab {...props} />;
  return <RealAuditTrailTab {...props} />;
}
