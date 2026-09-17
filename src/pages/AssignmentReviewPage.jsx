import { demoMode } from "@/services/auth";
import BatchNote from "@/components/BatchNote";
import { useMemo, useState } from "react";
import { tk, MONO } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useInstructorModule } from "@/store/InstructorProvider";
import {
  Card, Btn, Chip, ConfidencePill, ScoreValue, Modal, BackCircle, ConfirmBtn,
  AlertStrip, inputStyle, textareaStyle, AIGradingResultCard, bFontFor, hFontFor, toast, Toggle,
} from "@/components/ModuleUI";
import { IconWarning, IconCheck, IconChevronDown } from "@/components/Icons";
import { SCREENS } from "@/constants/routes";
import RemedialModal from "@/components/RemedialModal";
import { latestAttempt, misconceptionText, fmtWhen, MISCONCEPTIONS } from "@/data/instructorModule";

function DemoAssignmentReviewPage({ state, dispatch }) {
  const { state: mod, decide, requestResubmission, reopenUnit, bulkApprove, setAssignmentStatus, setScoreVisibility } = useInstructorModule();
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);

  const courseId = state.courseId ?? "CS301";
  const assignment = mod.assignments.find((a) => a.id === state.assignmentId);
  const units = useMemo(() => mod.units.filter((u) => u.assignmentId === state.assignmentId), [mod.units, state.assignmentId]);

  const [openUnitId, setOpenUnitId] = useState(null);
  const [mode, setMode] = useState("view");
  const [editScore, setEditScore] = useState("");
  const [editFeedback, setEditFeedback] = useState("");
  const [resubmitReason, setResubmitReason] = useState("");
  const [remedialEntry, setRemedialEntry] = useState(null);
  const [attemptIdx, setAttemptIdx] = useState(null);
  const [refOpen, setRefOpen] = useState(false);
  const [zoom, setZoom] = useState(null);
  const [deselected, setDeselected] = useState({});
  const [query, setQuery] = useState("");
  const [confFilter, setConfFilter] = useState("all");
  const [showReviewed, setShowReviewed] = useState(true);

  const openUnit = units.find((u) => u.id === openUnitId) ?? null;

  const matches = (u) =>
    (!query || u.studentName.toLowerCase().includes(query.toLowerCase())) &&
    (confFilter === "all" || latestAttempt(u).eval.confidence === confFilter);

  const pending = units.filter((u) => u.status === "awaiting_review");
  const quickAll = pending.filter((u) => { const ev = latestAttempt(u).eval; return ev.confidence === "high" && ev.aiScore !== null; });
  const needsAll = pending.filter((u) => !quickAll.includes(u));
  const quick = quickAll.filter(matches);
  const needs = needsAll.filter(matches);
  const reviewed = units.filter((u) => u.status === "final" && showReviewed && matches(u));

  const misAgg = useMemo(() => {
    const counts = new Map();
    units.forEach((u) => latestAttempt(u).eval.misconceptions.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1)));
    const published = new Set(mod.remedial.filter((r) => r.status === "published" && r.misconceptionId).map((r) => r.misconceptionId));
    return [...counts.entries()]
      .map(([id, count]) => ({ id, count, pct: Math.round((count / Math.max(1, units.length)) * 100), addressed: published.has(id) }))
      .sort((a, b) => b.count - a.count);
  }, [units, mod.remedial]);

  if (!assignment) {
    return (
      <div className="genai-pad" style={{ padding: "26px 32px" }}>
        <Card tokens={tokens}><div style={{ fontFamily: bFont, fontSize: 13, color: tokens.textMuted, padding: 20 }}>
          {lang === "ar" ? "التكليف غير موجود." : "Assignment not found."}
        </div></Card>
      </div>
    );
  }

  const topicOf = (unitId) => {
    const u = units.find((x) => x.id === unitId);
    const q = assignment.questions.find((qq) => qq.id === u?.questionId);
    const course = mod.courses.find((c) => c.id === courseId);
    return course?.topics.find((t) => t.id === q?.topicId);
  };

  const openModal = (unitId, m = "view") => {
    const u = units.find((x) => x.id === unitId);
    const ev = latestAttempt(u).eval;
    setOpenUnitId(unitId); setMode(m); setAttemptIdx(null); setRefOpen(false);
    setEditScore(String(ev.aiScore ?? 0));
    setEditFeedback(ev.feedback);
    setResubmitReason("");
  };

  const afterDecision = (msg, unitId) => {
    toast(msg);
    const queue = needsAll.filter((u) => u.id !== unitId);
    const next = queue[0];
    if (next) { openModal(next.id); }
    else { setOpenUnitId(null); setMode("view"); }
  };

  const mono = (t) => (
    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.09em", color: tokens.textMuted, margin: "0 0 7px" }}>{t}</div>
  );
  const sectionHead = (title, sub, count) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
        <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em" }}>{title}</div>
        {count !== undefined && (
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: tokens.primary, background: tokens.primaryLight, border: `1px solid ${tokens.citationBorder}`, borderRadius: 6, padding: "2px 8px" }}>{count}</span>
        )}
      </div>
      <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, marginTop: 3 }}>{sub}</div>
    </div>
  );

  const lastOf = (u) => latestAttempt(u);

  return (
    <div className="genai-pad" style={{ padding: "26px 32px", maxWidth: 1180, margin: "0 auto", direction: isRtl ? "rtl" : "ltr" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 18, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", minWidth: 0, flexDirection: isRtl ? "row-reverse" : "row" }}>
          <BackCircle tokens={tokens} rtl={isRtl} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.COURSE_WORKSPACE, courseId, tab: "assignments" })} />
          <div style={{ textAlign: isRtl ? "right" : "left", minWidth: 0 }}>
            <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: "0 0 4px" }}>
              {lang === "ar" ? assignment.title.ar : assignment.title.en}
            </h1>
            <p style={{ fontFamily: bFont, fontSize: 13, color: tokens.textMuted, margin: 0 }}>
              {assignment.questions.length} {lang === "ar" ? "أسئلة" : "questions"} · {units.length} {lang === "ar" ? "تسليماً" : "submissions"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
          <button
            onClick={() => { const next = assignment.status === "open" ? "closed" : "open"; setAssignmentStatus(assignment.id, next); toast(next === "open" ? (lang === "ar" ? "أُعيد فتح التكليف." : "Assignment reopened.") : (lang === "ar" ? "أُغلق التكليف — التسليم معطّل." : "Assignment closed — submission disabled.")); }}
            title={lang === "ar" ? "تبديل حالة التكليف" : "Toggle assignment status"}
            style={{ padding: "5px 12px", borderRadius: 7, cursor: "pointer", fontFamily: bFont, fontSize: 11.5, fontWeight: 600, background: assignment.status === "open" ? tokens.primaryLight : tokens.inset, border: `1px solid ${assignment.status === "open" ? tokens.primary : tokens.cardBorder}`, color: assignment.status === "open" ? tokens.primary : tokens.textMuted }}
          >
            {assignment.status === "open" ? (lang === "ar" ? "مفتوح" : "Open") : (lang === "ar" ? "مغلق" : "Closed")}
          </button>
          <div
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 12px", borderRadius: 10, background: tokens.card, border: `1px solid ${tokens.cardBorder}`, flexDirection: isRtl ? "row-reverse" : "row" }}
            title={lang === "ar"
              ? "لن يرى الطالب الدرجة إلا إذا اعتمدتها أو عدّلتها وكان هذا الإعداد مفعّلاً لحظة فتحه الصفحة."
              : "The student will only see the grade if the submission has been approved/edited by you and this setting is on at the exact moment the student opens the page."}
          >
            <Toggle on={assignment.showScoreToStudent} onChange={() => { setScoreVisibility(assignment.id, !assignment.showScoreToStudent); toast(!assignment.showScoreToStudent ? (lang === "ar" ? "إظهار الدرجة للطالب: تشغيل." : "Score visibility ON.") : (lang === "ar" ? "إظهار الدرجة للطالب: إيقاف." : "Score visibility OFF.")); }} tokens={tokens} />
            <span style={{ fontFamily: bFont, fontSize: 12.5, fontWeight: 500, color: tokens.textSecondary }}>{lang === "ar" ? "إظهار الدرجة" : "Show score"}</span>
          </div>
        </div>
      </div>

      <Card tokens={tokens} style={{ marginBottom: 18, padding: "18px 20px" }}>
        {sectionHead(
          lang === "ar" ? "ملخص الأخطاء الشائعة" : "Common Errors Summary",
          lang === "ar" ? "مفاهيم خاطئة متكررة رُصدت عبر التسليمات." : "Detected recurring misconceptions across submissions.",
        )}
        {misAgg.length === 0 ? (
          <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textFaint }}>{lang === "ar" ? "لا أنماط خطأ متكررة في تسليمات هذا التكليف." : "No recurring error patterns in this assignment's submissions."}</div>
        ) : (
          misAgg.map((m, i) => (
            <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, padding: "12px 0", borderTop: i > 0 ? `1px solid ${tokens.cardBorder}` : "none", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
              <div style={{ textAlign: isRtl ? "right" : "left", flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", fontFamily: bFont, fontSize: 13, fontWeight: 500, color: tokens.textPrimary, flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <IconWarning size={14} color={tokens.gap} />
                  {misconceptionText(m.id, lang)}
                </div>
                <div style={{ height: 5, background: tokens.inset, borderRadius: 4, overflow: "hidden", border: `1px solid ${tokens.cardBorder}`, margin: "8px 0 6px", marginInlineStart: 22, maxWidth: 320 }}>
                  <div style={{ width: `${m.pct}%`, height: "100%", background: tokens.gap }} />
                </div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: tokens.textMuted, marginInlineStart: 22 }}>
                  {m.count} {lang === "ar" ? "تسلميات" : "submissions"} · {m.pct}%{m.addressed ? ` · ${lang === "ar" ? "عولج" : "addressed"}` : ""}
                </div>
              </div>
              <Btn tokens={tokens} lang={lang} variant="soft" style={{ padding: "8px 14px", fontSize: 12, flexShrink: 0 }}
                onClick={() => setRemedialEntry({ courseId, topicId: MISCONCEPTIONS.find((x) => x.id === m.id)?.topicId ?? "", misconceptionId: m.id })}>
                {lang === "ar" ? "توليد محتوى علاجي" : "Generate remedial content"}
              </Btn>
            </div>
          ))
        )}
      </Card>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={lang === "ar" ? "بحث باسم الطالب…" : "Search by student name…"}
          style={{ ...inputStyle(tokens, bFont), width: mobile ? "100%" : 220 }}
          className="genai-input"
        />
        <select value={confFilter} onChange={(e) => setConfFilter(e.target.value)} style={{ ...inputStyle(tokens, bFont), cursor: "pointer", width: mobile ? "100%" : 190 }} className="genai-input">
          <option value="all">{lang === "ar" ? "كل مستويات الثقة" : "All confidence levels"}</option>
          <option value="high">{lang === "ar" ? "ثقة عالية" : "High confidence"}</option>
          <option value="medium">{lang === "ar" ? "ثقة متوسطة" : "Medium confidence"}</option>
          <option value="low">{lang === "ar" ? "ثقة منخفضة" : "Low confidence"}</option>
          <option value="insufficient_evidence">{lang === "ar" ? "أدلة غير كافية" : "Insufficient evidence"}</option>
        </select>
        <label style={{ display: "inline-flex", gap: 7, alignItems: "center", cursor: "pointer", fontFamily: bFont, fontSize: 12, color: tokens.textMuted, flexDirection: isRtl ? "row-reverse" : "row" }}>
          <input type="checkbox" checked={showReviewed} onChange={() => setShowReviewed(!showReviewed)} />
          {lang === "ar" ? "إظهار المُراجَع بالفعل" : "Show already reviewed"}
        </label>
      </div>

      <Card tokens={tokens} style={{ marginBottom: 18, padding: "18px 20px" }}>
        {sectionHead(
          lang === "ar" ? "جاهز للاعتماد السريع" : "Ready for quick approval",
          lang === "ar" ? "كل التسليمات التي قيّمها الذكاء الاصطناعي بثقة عالية." : "Every submission the AI evaluated with high confidence.",
          quick.length,
        )}
        {quick.length === 0 ? (
          <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textFaint }}>{lang === "ar" ? "لا شيء في نطاق الثقة العالية الآن." : "Nothing waiting in the high-confidence band right now."}</div>
        ) : (
          <>
            {(() => {
              const selectedIds = quick.filter((u) => !deselected[u.id]).map((u) => u.id);
              const allSelected = selectedIds.length === quick.length;
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => setDeselected(allSelected ? Object.fromEntries(quick.map((u) => [u.id, true])) : {})}
                    style={{ cursor: "pointer" }}
                  />
                  <span style={{ fontFamily: bFont, fontSize: 12, color: tokens.textMuted }}>
                    {allSelected
                      ? (lang === "ar" ? "الكل محدد — أزل التحديد عما تريد استثناءه" : "All selected — untick any to exclude")
                      : (lang === "ar" ? `محدد ${selectedIds.length} من ${quick.length}` : `${selectedIds.length} of ${quick.length} selected`)}
                  </span>
                </div>
              );
            })()}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {quick.map((u) => {
                const ev = lastOf(u).eval;
                const q = assignment.questions.find((qq) => qq.id === u.questionId);
                return (
                  <div key={u.id} style={{ background: tokens.inset, border: `1px solid ${deselected[u.id] ? tokens.cardBorder : tokens.primary}55`, outline: deselected[u.id] ? "none" : `1px solid ${tokens.primary}33`, borderRadius: 10, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row", opacity: deselected[u.id] ? 0.55 : 1 }}>
                    <input
                      type="checkbox"
                      checked={!deselected[u.id]}
                      onChange={() => setDeselected((d) => { const n = { ...d }; if (n[u.id]) delete n[u.id]; else n[u.id] = true; return n; })}
                      onClick={(e) => e.stopPropagation()}
                      style={{ cursor: "pointer", flexShrink: 0 }}
                      title={lang === "ar" ? "ضمّ للاعتماد الجماعي" : "Include in bulk approve"}
                    />
                    <button onClick={() => openModal(u.id)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: isRtl ? "right" : "left", minWidth: 0, flex: 1 }}>
                      <div style={{ fontFamily: bFont, fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>
                        {u.studentName} · {lang === "ar" ? topicOf(u.id)?.label.ar : topicOf(u.id)?.label.en}
                      </div>
                      <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textMuted, marginTop: 3, lineHeight: 1.5 }}>{ev.feedback}</div>
                    </button>
                    <ScoreValue kind="ai" score={ev.aiScore} max={q?.maxScore ?? 10} tokens={tokens} lang={lang} />
                  </div>
                );
              })}
            </div>
            {(() => {
              const selectedIds = quick.filter((u) => !deselected[u.id]).map((u) => u.id);
              return (
                <ConfirmBtn
                  tokens={tokens} lang={lang} variant="solid"
                  disabled={selectedIds.length === 0}
                  label={<><IconCheck size={13} color="#fff" /> {lang === "ar" ? `اعتماد المحدد (${selectedIds.length})` : `Bulk approve selected ${selectedIds.length}`}</>}
                  confirmLabel={lang === "ar" ? `اضغط للتأكيد — اعتماد ${selectedIds.length}` : `Click again to confirm — approve ${selectedIds.length}`}
                  onConfirm={() => {
                    bulkApprove(selectedIds);
                    setDeselected({});
                    toast(lang === "ar" ? `اعتُمدت ${selectedIds.length} تسليمات بدرجات الذكاء الاصطناعي.` : `Approved ${selectedIds.length} submissions at their AI scores.`);
                  }}
                  style={{ width: "100%", padding: "11px 0", fontSize: 13, marginTop: 14 }}
                />
              );
            })()}
          </>
        )}
      </Card>

      <Card tokens={tokens} style={{ marginBottom: 18, padding: "18px 20px" }}>
        {sectionHead(
          lang === "ar" ? "يحتاج مراجعتك" : "Needs your review",
          lang === "ar" ? "ثقة متوسطة، ثقة منخفضة، أو أدلة غير كافية." : "Medium confidence, low confidence, or insufficient evidence.",
          needs.length,
        )}
        {needs.length === 0 ? (
          <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textFaint }}>{lang === "ar" ? "لا شيء بانتظار المراجعة اليدوية." : "Nothing waiting for manual review."}</div>
        ) : (
          needs.map((u, i) => {
            const ev = lastOf(u).eval;
            const q = assignment.questions.find((qq) => qq.id === u.questionId);
            return (
              <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, padding: "12px 0", borderTop: i > 0 ? `1px solid ${tokens.cardBorder}` : "none", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                <div style={{ textAlign: isRtl ? "right" : "left" }}>
                  <div style={{ fontFamily: bFont, fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>
                    {u.studentName} · {lang === "ar" ? topicOf(u.id)?.label.ar : topicOf(u.id)?.label.en}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                    <ConfidencePill confidence={ev.confidence} tokens={tokens} lang={lang} />
                    <ScoreValue kind="ai" score={ev.aiScore} max={q?.maxScore ?? 10} tokens={tokens} lang={lang} />
                  </div>
                </div>
                <Btn tokens={tokens} lang={lang} variant="soft" style={{ padding: "8px 16px", fontSize: 12 }} onClick={() => openModal(u.id)}>
                  {lang === "ar" ? "مراجعة" : "Review"}
                </Btn>
              </div>
            );
          })
        )}
      </Card>

      {reviewed.length > 0 && (
        <Card tokens={tokens} style={{ padding: "18px 20px" }}>
          {sectionHead(lang === "ar" ? "تمت مراجعتها" : "Reviewed", lang === "ar" ? "قرارات نهائية مسجلة في سجل التدقيق." : "Final decisions, recorded in the audit trail.", reviewed.length)}
          {reviewed.map((u, i) => {
            const at = lastOf(u);
            const q = assignment.questions.find((qq) => qq.id === u.questionId);
            const action = at.decision?.action ?? "approve";
            return (
              <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, padding: "12px 0", borderTop: i > 0 ? `1px solid ${tokens.cardBorder}` : "none", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                <div style={{ textAlign: isRtl ? "right" : "left" }}>
                  <div style={{ fontFamily: bFont, fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>
                    {u.studentName} · {lang === "ar" ? topicOf(u.id)?.label.ar : topicOf(u.id)?.label.en}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                    <Chip tokens={tokens} tone={action === "approve" ? "primary" : action === "reject" ? "violet" : "peri"}>
                      {action === "approve" ? (lang === "ar" ? "معتمد" : "Approved") : action === "edit" ? (lang === "ar" ? "معدّل" : "Edited") : (lang === "ar" ? "مرفوض" : "Rejected")}
                    </Chip>
                    <ScoreValue kind="final" score={at.decision?.finalScore ?? null} max={q?.maxScore ?? 10} tokens={tokens} lang={lang} />
                  </div>
                </div>
                <Btn tokens={tokens} lang={lang} variant="ghost" style={{ padding: "8px 16px", fontSize: 12 }} onClick={() => openModal(u.id)}>
                  {lang === "ar" ? "فتح" : "Open"}
                </Btn>
              </div>
            );
          })}
        </Card>
      )}

      <Modal
        open={openUnit !== null}
        onClose={() => { setOpenUnitId(null); setMode("view"); }}
        tokens={tokens} lang={lang} width={680}
        title={openUnit?.studentName ?? ""}
        subtitle={openUnit ? (lang === "ar" ? topicOf(openUnit.id)?.label.ar : topicOf(openUnit.id)?.label.en) : undefined}
      >
        {openUnit && (() => {
          const attempts = openUnit.attempts;
          const sel = attemptIdx === null ? attempts.length - 1 : Math.min(attemptIdx, attempts.length - 1);
          const shown = attempts[sel];
          const at = lastOf(openUnit);
          const ev = shown.eval;
          const q = assignment.questions.find((qq) => qq.id === openUnit.questionId);
          const max = q?.maxScore ?? 10;
          const isFinal = openUnit.status === "final";
          return (
            <>
              {attempts.length > 1 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                    {attempts.map((a, i) => (
                      <button key={a.n} onClick={() => setAttemptIdx(i)}
                        style={{
                          padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontFamily: MONO, fontSize: 10.5,
                          background: i === sel ? tokens.primaryLight : tokens.inset,
                          border: `1px solid ${i === sel ? tokens.primary : tokens.cardBorder}`,
                          color: i === sel ? tokens.primary : tokens.textMuted,
                        }}>
                        {lang === "ar" ? `محاولة ${i + 1}` : `Attempt ${i + 1}`}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontFamily: bFont, fontSize: 10.5, color: tokens.textFaint, marginTop: 6 }}>
                    {lang === "ar" ? "المحاولة الأحدث فقط هي المحتسبة في الدرجة النهائية." : "Only the latest attempt counts toward the final grade."}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 14, flexDirection: isRtl ? "row-reverse" : "row" }}>
                {openUnit.status === "awaiting_review" && <Chip tokens={tokens} tone="primary">{lang === "ar" ? "بانتظار المراجعة" : "Pending review"}</Chip>}
                {openUnit.status === "resubmission_requested" && <Chip tokens={tokens} tone="violet">{lang === "ar" ? "طُلب إعادة التسليم" : "Resubmission requested"}</Chip>}
                {isFinal && <Chip tokens={tokens} tone={at.decision?.action === "approve" ? "primary" : at.decision?.action === "reject" ? "violet" : "peri"}>{at.decision?.action === "approve" ? (lang === "ar" ? "معتمد" : "Approved") : at.decision?.action === "edit" ? (lang === "ar" ? "معدّل" : "Edited") : (lang === "ar" ? "مرفوض" : "Rejected")}</Chip>}
              </div>

              {openUnit.status === "resubmission_requested" && at.resubmitReason && (
                <AlertStrip tokens={tokens} lang={lang} tone="violet"
                  icon={<IconWarning size={15} color={tokens.gap} />}
                  title={lang === "ar" ? "سبب طلب إعادة التسليم" : "Resubmission reason"}
                  body={at.resubmitReason} />
              )}

              <div style={{ margin: "14px 0" }}>
                {mono(lang === "ar" ? "إجابة الطالب" : "STUDENT ANSWER")}
                <div style={{ background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, padding: "12px 14px", fontFamily: bFont, fontSize: 13, color: tokens.textPrimary, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                  {shown.text || (lang === "ar" ? "(لا نص)" : "(no text)")}
                </div>
                {shown.image && (
                  <img src={shown.image} alt="student upload" onClick={() => setZoom(shown.image)}
                    title={lang === "ar" ? "اضغط للتكبير" : "Click to zoom"}
                    style={{ maxWidth: "100%", borderRadius: 10, marginTop: 10, border: `1px solid ${tokens.cardBorder}`, cursor: "zoom-in" }} />
                )}
              </div>

              <AIGradingResultCard eval={ev} max={max} tokens={tokens} lang={lang} title={lang === "ar" ? "تقييم الذكاء الاصطناعي" : "AI GRADING RESULT"} />

              {(q?.referenceAnswer || q?.rubric) && (
                <div style={{ marginTop: 12, border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, overflow: "hidden" }}>
                  <button onClick={() => setRefOpen(!refOpen)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "10px 14px", background: tokens.inset, border: "none", cursor: "pointer", fontFamily: bFont, fontSize: 12, fontWeight: 600, color: tokens.textSecondary, flexDirection: isRtl ? "row-reverse" : "row" }}>
                    {lang === "ar" ? "الإجابة النموذجية / الروبرك (مرجع سريع)" : "Model answer / rubric (quick reference)"}
                    <IconChevronDown size={13} color={tokens.textMuted} />
                  </button>
                  {refOpen && (
                    <div style={{ padding: "12px 14px", fontFamily: bFont, fontSize: 12, color: tokens.textSecondary, lineHeight: 1.6, whiteSpace: "pre-wrap", textAlign: isRtl ? "right" : "left" }}>
                      {q.referenceAnswer && <><div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.08em", color: tokens.textMuted, marginBottom: 4 }}>{lang === "ar" ? "الإجابة المرجعية — لا يراها الطلاب" : "REFERENCE — never shown to students"}</div>{q.referenceAnswer}<br /><br /></>}
                      {q.rubric && <><div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.08em", color: tokens.textMuted, marginBottom: 4 }}>{lang === "ar" ? "الروبرك" : "RUBRIC"}</div>{q.rubric}</>}
                    </div>
                  )}
                </div>
              )}

              {isFinal && at.decision && (
                <div style={{ marginTop: 14, padding: "10px 14px", background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 10 }}>
                  {mono(lang === "ar" ? "قرار المدرّس" : "INSTRUCTOR DECISION")}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                    <ScoreValue kind="final" score={at.decision.finalScore} max={max} tokens={tokens} lang={lang} />
                    <span style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted }}>
                      {at.decision.decidedBy} · {fmtWhen(at.decision.decidedAt, lang)}
                    </span>
                  </div>
                  {at.decision.finalFeedback && (
                    <p style={{ fontFamily: bFont, fontSize: 12, color: tokens.textSecondary, margin: "8px 0 0", lineHeight: 1.6 }}>{at.decision.finalFeedback}</p>
                  )}
                </div>
              )}

              {!isFinal && mode === "view" && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18, flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <Btn tokens={tokens} lang={lang} onClick={() => { decide(openUnit.id, "approve", {}); afterDecision(lang === "ar" ? `اعتُمدت إجابة ${openUnit.studentName} بدرجة الذكاء الاصطناعي.` : `Approved ${openUnit.studentName}'s answer at the AI score.`, openUnit.id); }}>
                    <IconCheck size={13} color="#fff" /> {lang === "ar" ? "اعتماد" : "Approve"}
                  </Btn>
                  <Btn tokens={tokens} lang={lang} variant="soft" onClick={() => setMode("edit")}>{lang === "ar" ? "تعديل" : "Edit"}</Btn>
                  <Btn tokens={tokens} lang={lang} variant="soft" onClick={() => setMode("reject")}>{lang === "ar" ? "رفض" : "Reject"}</Btn>
                  <Btn tokens={tokens} lang={lang} variant="ghost" onClick={() => setMode("resubmit")}>{lang === "ar" ? "طلب إعادة التسليم" : "Request resubmission"}</Btn>
                </div>
              )}

              {!isFinal && mode === "edit" && (
                <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${tokens.cardBorder}` }}>
                  <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "120px 1fr", gap: 12 }}>
                    <div>
                      {mono(lang === "ar" ? "الدرجة النهائية" : "FINAL SCORE")}
                      <input type="number" min={0} max={max} value={editScore} onChange={(e) => setEditScore(e.target.value)} style={inputStyle(tokens, bFont)} className="genai-input" />
                    </div>
                    <div>
                      {mono(lang === "ar" ? "التغذية النهائية" : "FINAL FEEDBACK")}
                      <textarea rows={2} value={editFeedback} onChange={(e) => setEditFeedback(e.target.value)} style={textareaStyle(tokens, bFont)} className="genai-input" />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                    <Btn tokens={tokens} lang={lang} onClick={() => { decide(openUnit.id, "edit", { score: Math.max(0, Math.min(max, Number(editScore) || 0)), feedback: editFeedback }); afterDecision(lang === "ar" ? `حُفظت الدرجة المعدّلة لـ${openUnit.studentName}.` : `Saved edited grade for ${openUnit.studentName}.`, openUnit.id); }}>
                      {lang === "ar" ? "حفظ الدرجة النهائية" : "Save final grade"}
                    </Btn>
                    <Btn tokens={tokens} lang={lang} variant="ghost" onClick={() => setMode("view")}>{lang === "ar" ? "إلغاء" : "Cancel"}</Btn>
                  </div>
                </div>
              )}

              {!isFinal && mode === "reject" && (
                <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${tokens.cardBorder}` }}>
                  <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "120px 1fr", gap: 12 }}>
                    <div>
                      {mono(lang === "ar" ? "الدرجة النهائية" : "FINAL SCORE")}
                      <input type="number" min={0} max={max} value={editScore} onChange={(e) => setEditScore(e.target.value)} style={inputStyle(tokens, bFont)} className="genai-input" />
                    </div>
                    <div>
                      {mono(lang === "ar" ? "التقييم اليدوي (اختياري)" : "MANUAL EVALUATION NOTES (OPTIONAL)")}
                      <textarea rows={2} value={editFeedback} onChange={(e) => setEditFeedback(e.target.value)} style={textareaStyle(tokens, bFont)} className="genai-input" />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                    <ConfirmBtn tokens={tokens} lang={lang} variant="violet"
                      label={lang === "ar" ? "رفض وكتابة تقييم يدوي" : "Reject and write manual evaluation"}
                      confirmLabel={lang === "ar" ? "اضغط للتأكيد — رفض" : "Click again to confirm reject"}
                      onConfirm={() => { decide(openUnit.id, "reject", { score: Math.max(0, Math.min(max, Number(editScore) || 0)), feedback: editFeedback }); afterDecision(lang === "ar" ? `رُفضت إجابة ${openUnit.studentName} بدرجة نهائية يدوية.` : `Rejected ${openUnit.studentName}'s answer with a manual final score.`, openUnit.id); }}
                    />
                    <Btn tokens={tokens} lang={lang} variant="ghost" onClick={() => setMode("view")}>{lang === "ar" ? "إلغاء" : "Cancel"}</Btn>
                  </div>
                </div>
              )}

              {!isFinal && mode === "resubmit" && (
                <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${tokens.cardBorder}` }}>
                  {mono(lang === "ar" ? "السبب الذي سيراه الطالب (إجباري)" : "REASON THE STUDENT WILL SEE (REQUIRED)")}
                  <textarea rows={2} value={resubmitReason} onChange={(e) => setResubmitReason(e.target.value)} style={textareaStyle(tokens, bFont)} className="genai-input" placeholder={lang === "ar" ? "مثال: أظهر الحساب ووضّح هل إعادة التحجيم عاجلة." : "e.g. Show the computation and state whether a resize is urgent."} />
                  <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                    <Btn tokens={tokens} lang={lang} disabled={!resubmitReason.trim()} onClick={() => { requestResubmission(openUnit.id, resubmitReason.trim()); afterDecision(lang === "ar" ? `طُلبت إعادة التسليم من ${openUnit.studentName}.` : `Resubmission requested from ${openUnit.studentName}.`, openUnit.id); }}>
                      {lang === "ar" ? "طلب إعادة التسليم" : "Request resubmission"}
                    </Btn>
                    <Btn tokens={tokens} lang={lang} variant="ghost" onClick={() => setMode("view")}>{lang === "ar" ? "إلغاء" : "Cancel"}</Btn>
                  </div>
                </div>
              )}

              {isFinal && (
                <div style={{ marginTop: 18, flexDirection: isRtl ? "row-reverse" : "row", display: "flex" }}>
                  <ConfirmBtn tokens={tokens} lang={lang} variant="ghost"
                    label={lang === "ar" ? "إعادة فتح للمراجعة" : "Reopen for review"}
                    confirmLabel={lang === "ar" ? "اضغط للتأكيد — إعادة فتح" : "Click again to confirm reopen"}
                    onConfirm={() => { reopenUnit(openUnit.id); toast(lang === "ar" ? `أُعيد فتح إجابة ${openUnit.studentName} للمراجعة.` : `Reopened ${openUnit.studentName}'s answer for review.`); setOpenUnitId(null); setMode("view"); }}
                  />
                </div>
              )}
            </>
          );
        })()}
      </Modal>

      <Modal open={zoom !== null} onClose={() => setZoom(null)} tokens={tokens} lang={lang} width={860}
        title={lang === "ar" ? "المرفق — عرض مكبّر" : "Attachment — zoomed view"}>
        {zoom && <img src={zoom} alt="attachment zoom" style={{ width: "100%", borderRadius: 10, border: `1px solid ${tokens.cardBorder}` }} />}
      </Modal>

      <RemedialModal open={remedialEntry !== null} onClose={() => setRemedialEntry(null)} entry={remedialEntry} tokens={tokens} lang={lang} />
    </div>
  );
}

export default function AssignmentReviewPage(props) {
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(props.state.dark);
  const lang = props.state.lang;
  if (!demoMode()) {
    return (
      <BatchNote
        tokens={tokens}
        lang={lang}
        mobile={mobile}
        title={lang === "ar" ? "طابور المراجعة هيترابط في الدفعة الجاية (B4)" : "Review queue wiring arrives next (B4)"}
        body={lang === "ar" ? "الشاشة دي لسه بتتغذى من النموذج التجريبي بدون خادم. الربط الحي بيوصل مع دفعة المراجعة (B4)، عشان مفيش بيانات متفبركة توصلك هنا." : "This screen is still fed by the offline prototype. The live wiring lands with the review batch (B4), so no fabricated data reaches you here."}
      />
    );
  }
  return <DemoAssignmentReviewPage {...props} />;
}
