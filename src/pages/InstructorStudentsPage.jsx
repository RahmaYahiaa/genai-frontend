import { demoMode } from "@/services/auth";
import { useCallback, useState } from "react";
import useAsync from "@/hooks/useAsync";
import { listCourses, listEnrollments } from "@/services/courses";
import { listAssignmentsForCourse } from "@/services/assignments";
import { getReview } from "@/services/review";
import { SUBMISSION_STATUS_LABELS } from "@/services/submissions";
import { AsyncGate } from "@/components/ui";
import { tk, MONO, masteryColor, masteryLevel } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useInstructorModule } from "@/store/InstructorProvider";
import { Card, Btn, Chip, ScoreValue, Modal, BackCircle, inputStyle, bFontFor, hFontFor, Th, toast } from "@/components/ModuleUI";
import { IconWarning, IconUsers, IconDownload, IconCheck } from "@/components/Icons";
import { SCREENS } from "@/constants/routes";
import StudentInterventionModal from "@/components/StudentInterventionModal";
import { STUDENTS, INSTRUCTOR_COURSE_IDS, studentTopicMastery, latestAttempt, fmtWhen } from "@/data/instructorModule";

function MasteryBar({ pct, evidence = 1, thin = false, tokens }) {
  const level = masteryLevel(pct, evidence > 0);
  const color = masteryColor(level, tokens);
  return (
    <div style={{ height: thin ? 5 : 8, background: tokens.inset, borderRadius: 4, overflow: "hidden", border: `1px solid ${tokens.insetBorder}` }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.8s ease-out" }} />
    </div>
  );
}

function DemoInstructorStudentsPage({ state, dispatch }) {
  const { state: mod } = useInstructorModule();
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);

  const courseId = INSTRUCTOR_COURSE_IDS.includes(state.courseId) ? state.courseId : "CS301";
  const course = mod.courses.find((c) => c.id === courseId) ?? mod.courses[0];
  const [query, setQuery] = useState("");
  const [fCohort, setFCohort] = useState("all");
  const [fBand, setFBand] = useState("all");
  const [fTrend, setFTrend] = useState("all");
  const [fWork, setFWork] = useState("all");
  const [interveneFor, setInterveneFor] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportText, setExportText] = useState("");

  const roster = STUDENTS;
  const openStudent = state.studentId ? STUDENTS.find((s) => s.id === state.studentId) ?? null : null;
  const unitsOf = (sid) => mod.units.filter((u) => u.studentId === sid && u.courseId === courseId);
  const openCount = (sid) => unitsOf(sid).filter((u) => u.status === "awaiting_review" || u.status === "resubmission_requested").length;

  const filtered = roster
    .filter((s) => !query || s.name.toLowerCase().includes(query.toLowerCase()) || s.studentNumber.includes(query))
    .filter((s) => fCohort === "all" || s.cohort === fCohort)
    .filter((s) => fBand === "all" || (fBand === "low" ? s.avg < 40 : fBand === "mid" ? s.avg >= 40 && s.avg < 60 : s.avg >= 60))
    .filter((s) => fTrend === "all" || s.trend === fTrend)
    .filter((s) => {
      if (fWork === "all") return true;
      const us = unitsOf(s.id);
      if (fWork === "pending") return us.some((u) => u.status === "awaiting_review");
      if (fWork === "resub") return us.some((u) => u.status === "resubmission_requested");
      if (fWork === "graded") return us.some((u) => u.status === "final");
      return us.length === 0;
    });

  const goCourse = (id) => dispatch({ type: "NAVIGATE", screen: SCREENS.INSTRUCTOR_STUDENTS, courseId: id, studentId: undefined });
  const openFile = (id) => dispatch({ type: "NAVIGATE", screen: SCREENS.INSTRUCTOR_STUDENTS, studentId: id, courseId });
  const closeFile = () => dispatch({ type: "NAVIGATE", screen: SCREENS.INSTRUCTOR_STUDENTS, studentId: undefined, courseId });

  const trendPill = (t) => {
    const map = {
      improving: { bg: tokens.primaryLight, fg: tokens.primary, en: "Improving", ar: "يتحسن" },
      stable: { bg: tokens.inset, fg: tokens.textMuted, en: "Stable", ar: "مستقر" },
      declining: { bg: tokens.gapBg, fg: tokens.gap, en: "Declining", ar: "متراجع" },
    };
    const m = map[t] ?? map.stable;
    return (
      <span style={{ fontFamily: MONO, fontSize: 10, color: m.fg, background: m.bg, border: `1px solid ${m.fg}44`, borderRadius: 5, padding: "2px 8px", whiteSpace: "nowrap" }}>
        {lang === "ar" ? m.ar : m.en}
      </span>
    );
  };

  const initials = (name) => name.split(" ").map((w) => w[0]).slice(0, 2).join("");

  const exportRoster = () => {
    const head = ["name", "student_number", "cohort", "avg_mastery_pct", "trend", "ai_sessions", "open_units"];
    const rows = filtered.map((s) => [s.name, s.studentNumber, s.cohort, s.avg, s.trend, s.sessions, openCount(s.id)]);
    setExportText([head.join(","), ...rows.map((r) => r.join(","))].join("\n"));
    setExportOpen(true);
  };

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      toast(lang === "ar" ? "تم نسخ السجل." : "Roster copied.");
    } catch {
      toast(lang === "ar" ? "انسخ النص المحدد يدوياً (Ctrl+C)." : "Select the text and copy manually (Ctrl+C).");
    }
  };

  const downloadExport = () => {
    try {
      const blob = new Blob([exportText], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${courseId}-roster.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast(lang === "ar" ? "بدء تنزيل السجل." : "Roster download started.");
    } catch {
      toast(lang === "ar" ? "التنزيل محجوب هنا — انسخ النص بدلاً منه." : "Download blocked here — copy the text instead.");
    }
  };

  if (openStudent) {
    const s = openStudent;
    const units = unitsOf(s.id);
    const finals = units.filter((u) => u.status === "final").map((u) => latestAttempt(u).decision?.finalScore ?? 0);
    const receivedRemedial = mod.remedial.filter((r) => {
      if (r.status !== "published" || r.courseId !== courseId) return false;
      if (r.audience === "all") return true;
      if (r.audience === "manual") return r.manualIds.includes(s.id);
      return units.some((u) => u.attempts.some((a) => r.misconceptionId !== undefined && a.eval.misconceptions.includes(r.misconceptionId)));
    });
    return (
      <div className="genai-pad" style={{ padding: "26px 32px", maxWidth: 1180, margin: "0 auto", direction: isRtl ? "rtl" : "ltr" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 20, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexDirection: isRtl ? "row-reverse" : "row" }}>
            <BackCircle tokens={tokens} rtl={isRtl} onClick={closeFile} />
            <div style={{ textAlign: isRtl ? "right" : "left" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: 0 }}>{s.name}</h1>
                <Chip tokens={tokens} tone="peri">{lang === "ar" ? `دفعة ${s.cohort}` : `cohort ${s.cohort}`}</Chip>
                {trendPill(s.trend)}
              </div>
              <p style={{ fontFamily: MONO, fontSize: 11.5, color: tokens.textMuted, margin: 0 }}>
                {s.studentNumber} · {course.id} · {lang === "ar" ? "ملف الطالب" : "student file"}
              </p>
            </div>
          </div>
          <Btn tokens={tokens} lang={lang} variant="soft" onClick={() => setInterveneFor(s.id)}>
            {lang === "ar" ? "تدخل" : "Intervene"}
          </Btn>
        </div>

        <div className="genai-tiles-4" style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
          {[
            { l: lang === "ar" ? "متوسط الإتقان" : "AVG MASTERY", v: `${s.avg}%`, c: masteryColor(masteryLevel(s.avg, true), tokens) },
            { l: lang === "ar" ? "جلسات الذكاء" : "AI SESSIONS", v: `${s.sessions}`, c: tokens.textPrimary },
            { l: lang === "ar" ? "معلّق الآن" : "OPEN NOW", v: `${openCount(s.id)}`, c: tokens.textPrimary },
            { l: lang === "ar" ? "متوسط النهايات" : "FINAL AVG", v: finals.length ? `${Math.round(finals.reduce((a, b) => a + b, 0) / finals.length)}/10` : "—", c: tokens.primary },
          ].map((t) => (
            <div key={t.l} style={{ background: tokens.card, border: `1px solid ${tokens.cardBorder}`, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.09em", color: tokens.textMuted, marginBottom: 6 }}>{t.l}</div>
              <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: 22, color: t.c, letterSpacing: "-0.03em" }}>{t.v}</div>
            </div>
          ))}
        </div>

        <div className="genai-grid-2" style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 18 }}>
          <Card tokens={tokens} style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em", marginBottom: 12 }}>
              {lang === "ar" ? "إتقان المواضيع" : "Topic mastery"}
            </div>
            {course.topics.map((t, i) => {
              const pct = studentTopicMastery(s, t);
              return (
                <div key={t.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderTop: i > 0 ? `1px solid ${tokens.cardBorder}` : "none", flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <span style={{ display: "inline-flex", gap: 6, alignItems: "center", fontFamily: bFont, fontSize: 12, color: tokens.textPrimary, flex: 1, minWidth: 0, flexDirection: isRtl ? "row-reverse" : "row" }}>
                    {pct < 40 && <IconWarning size={12} color={tokens.gap} />}
                    {lang === "ar" ? t.label.ar : t.label.en}
                  </span>
                  <div style={{ width: mobile ? 70 : 110, flexShrink: 0 }}><MasteryBar pct={pct} evidence={1} thin tokens={tokens} /></div>
                  <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: masteryColor(masteryLevel(pct, true), tokens), width: 34, textAlign: isRtl ? "left" : "right" }}>{pct}%</span>
                </div>
              );
            })}
          </Card>

          <Card tokens={tokens} style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em", marginBottom: 12 }}>
              {lang === "ar" ? "المحتوى العلاجي المستلم" : "Remedial content received"}
            </div>
            {receivedRemedial.length === 0 ? (
              <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textFaint }}>
                {lang === "ar" ? "لم يستلم محتوى علاجياً منشوراً في هذا المقرر." : "No published remedial content in this course yet."}
              </div>
            ) : (
              receivedRemedial.map((r) => (
                <div key={r.id} style={{ padding: "9px 0", borderTop: `1px solid ${tokens.cardBorder}` }}>
                  <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textPrimary }}>{r.title}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: tokens.textMuted, marginTop: 3 }}>
                    {r.type === "explanation" ? (lang === "ar" ? "شرح + مثال" : "explanation + worked example") : (lang === "ar" ? "تدريب إضافي" : "extra practice")} · {fmtWhen(r.createdAt, lang)}
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>

        <Card tokens={tokens} style={{ padding: "6px 20px" }}>
          <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em", padding: "14px 0 10px" }}>
            {lang === "ar" ? "سجل التسليمات في هذا المقرر" : "Submission history in this course"}
          </div>
          {units.length === 0 ? (
            <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textFaint, padding: "0 0 16px" }}>
              {lang === "ar" ? "لا تسليمات في هذا المقرر." : "No submissions in this course."}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: mobile ? 560 : undefined }}>
                <thead>
                  <tr>
                    <Th tokens={tokens}>{lang === "ar" ? "التكليف" : "ASSIGNMENT"}</Th>
                    <Th tokens={tokens}>{lang === "ar" ? "الحالة" : "STATUS"}</Th>
                    <Th tokens={tokens} align="right">{lang === "ar" ? "درجة الذكاء" : "AI SCORE"}</Th>
                    <Th tokens={tokens} align="right">{lang === "ar" ? "النهائية" : "FINAL"}</Th>
                    <Th tokens={tokens}>{lang === "ar" ? "التاريخ" : "DATE"}</Th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((u, i) => {
                    const at = latestAttempt(u);
                    const a = mod.assignments.find((x) => x.id === u.assignmentId);
                    return (
                      <tr key={u.id} style={{ borderBottom: i < units.length - 1 ? `1px solid ${tokens.cardBorder}` : "none" }}>
                        <td style={{ padding: "11px 10px", fontFamily: bFont, fontSize: 12.5, color: tokens.textPrimary }}>
                          {a ? (lang === "ar" ? a.title.ar : a.title.en) : u.assignmentId}
                        </td>
                        <td style={{ padding: "11px 10px" }}>
                          <Chip tokens={tokens} tone={u.status === "final" ? "primary" : u.status === "resubmission_requested" ? "violet" : "peri"}>
                            {u.status === "final" ? (lang === "ar" ? "نهائي" : "final") : u.status === "resubmission_requested" ? (lang === "ar" ? "إعادة تسليم" : "resubmit") : u.status === "awaiting_review" ? (lang === "ar" ? "قيد المراجعة" : "review") : (lang === "ar" ? "مسودة" : "draft")}
                          </Chip>
                        </td>
                        <td style={{ padding: "11px 10px", textAlign: "right" }}>
                          <ScoreValue kind="ai" score={at.eval.aiScore} max={10} tokens={tokens} lang={lang} />
                        </td>
                        <td style={{ padding: "11px 10px", textAlign: "right" }}>
                          {u.status === "final" ? <ScoreValue kind="final" score={at.decision?.finalScore ?? null} max={10} tokens={tokens} lang={lang} /> : <span style={{ fontFamily: MONO, fontSize: 11, color: tokens.textFaint }}>—</span>}
                        </td>
                        <td style={{ padding: "11px 10px", fontFamily: MONO, fontSize: 10.5, color: tokens.textMuted, whiteSpace: "nowrap" }}>{fmtWhen(at.submittedAt, lang)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <StudentInterventionModal open={interveneFor !== null} onClose={() => setInterveneFor(null)} studentId={interveneFor} courseId={courseId} tokens={tokens} lang={lang} />
      </div>
    );
  }

  return (
    <div className="genai-pad" style={{ padding: "26px 32px", maxWidth: 1180, margin: "0 auto", direction: isRtl ? "rtl" : "ltr" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 18, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
        <div style={{ textAlign: isRtl ? "right" : "left" }}>
          <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: "0 0 3px", display: "flex", gap: 10, alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
            <IconUsers size={18} color={tokens.primary} />
            {lang === "ar" ? "الطلاب" : "Students"}
          </h1>
          <p style={{ fontSize: 13, color: tokens.textMuted, margin: 0, fontFamily: bFont }}>
            {course.id} · {roster.length} {lang === "ar" ? "طالباً في السجل" : "students on record"} · {lang === "ar" ? "عرض للقراءة فقط — القيد والملفات الدراسية مسؤولية الإدارة" : "read-only — enrolment is registrar-owned"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
          <select value={courseId} onChange={(e) => goCourse(e.target.value)} style={{ ...inputStyle(tokens, bFont), cursor: "pointer", width: mobile ? "100%" : 240 }} className="genai-input">
            {mod.courses.filter((c) => INSTRUCTOR_COURSE_IDS.includes(c.id)).map((c) => (
              <option key={c.id} value={c.id}>{c.id} · {lang === "ar" ? c.title.ar : c.title.en}</option>
            ))}
          </select>
          <Btn tokens={tokens} lang={lang} variant="ghost" onClick={exportRoster}>
            <IconDownload size={13} color={tokens.textMuted} />
            {lang === "ar" ? "تصدير السجل" : "Export roster"}
          </Btn>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16, flexDirection: isRtl ? "row-reverse" : "row" }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={lang === "ar" ? "بحث بالاسم أو الرقم…" : "Search name or number…"} style={{ ...inputStyle(tokens, bFont), width: mobile ? "100%" : 220 }} className="genai-input" />
        <select value={fCohort} onChange={(e) => setFCohort(e.target.value)} style={{ ...inputStyle(tokens, bFont), cursor: "pointer", width: mobile ? "calc(50% - 5px)" : 150 }} className="genai-input">
          <option value="all">{lang === "ar" ? "كل الدفعات" : "All cohorts"}</option>
          {[...new Set(roster.map((s) => s.cohort))].sort().map((c) => (
            <option key={c} value={c}>{lang === "ar" ? `دفعة ${c}` : `cohort ${c}`}</option>
          ))}
        </select>
        <select value={fBand} onChange={(e) => setFBand(e.target.value)} style={{ ...inputStyle(tokens, bFont), cursor: "pointer", width: mobile ? "calc(50% - 5px)" : 160 }} className="genai-input">
          <option value="all">{lang === "ar" ? "كل المستويات" : "All mastery bands"}</option>
          <option value="low">{lang === "ar" ? "أقل من 40%" : "Below 40%"}</option>
          <option value="mid">{lang === "ar" ? "40–60%" : "40–60%"}</option>
          <option value="high">{lang === "ar" ? "فوق 60%" : "Above 60%"}</option>
        </select>
        <select value={fTrend} onChange={(e) => setFTrend(e.target.value)} style={{ ...inputStyle(tokens, bFont), cursor: "pointer", width: mobile ? "calc(50% - 5px)" : 140 }} className="genai-input">
          <option value="all">{lang === "ar" ? "كل الاتجاهات" : "All trends"}</option>
          <option value="improving">{lang === "ar" ? "يتحسن" : "Improving"}</option>
          <option value="stable">{lang === "ar" ? "مستقر" : "Stable"}</option>
          <option value="declining">{lang === "ar" ? "متراجع" : "Declining"}</option>
        </select>
        <select value={fWork} onChange={(e) => setFWork(e.target.value)} style={{ ...inputStyle(tokens, bFont), cursor: "pointer", width: mobile ? "calc(50% - 5px)" : 170 }} className="genai-input">
          <option value="all">{lang === "ar" ? "كل الحالات" : "Any open work"}</option>
          <option value="pending">{lang === "ar" ? "لديه تسليم معلّق" : "Has pending submission"}</option>
          <option value="resub">{lang === "ar" ? "مطلوب منه إعادة" : "Resubmission requested"}</option>
          <option value="graded">{lang === "ar" ? "له درجات نهائية" : "Has final grades"}</option>
          <option value="none">{lang === "ar" ? "لا تسليمات" : "No submissions"}</option>
        </select>
      </div>

      <Card tokens={tokens} style={{ padding: "6px 20px" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: mobile ? 760 : undefined }}>
            <thead>
              <tr>
                <Th tokens={tokens}>{lang === "ar" ? "الطالب" : "STUDENT"}</Th>
                <Th tokens={tokens}>{lang === "ar" ? "الدفعة" : "COHORT"}</Th>
                <Th tokens={tokens}>{lang === "ar" ? "متوسط الإتقان" : "AVG MASTERY"}</Th>
                <Th tokens={tokens}>{lang === "ar" ? "الاتجاه" : "TREND"}</Th>
                <Th tokens={tokens} align="right">{lang === "ar" ? "جلسات" : "SESSIONS"}</Th>
                <Th tokens={tokens} align="right">{lang === "ar" ? "معلّق" : "OPEN"}</Th>
                <Th tokens={tokens} align="right">{lang === "ar" ? "إجراء" : "ACTION"}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${tokens.cardBorder}` : "none" }}>
                  <td style={{ padding: "11px 10px" }}>
                    <div style={{ display: "flex", gap: 9, alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
                      <span style={{ width: 26, height: 26, borderRadius: "50%", background: tokens.primaryLight, border: `1px solid ${tokens.citationBorder}`, color: tokens.primary, fontFamily: MONO, fontSize: 9.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {initials(s.name)}
                      </span>
                      <span>
                        <span style={{ display: "block", fontFamily: bFont, fontSize: 12.5, fontWeight: 600, color: tokens.textPrimary }}>{s.name}</span>
                        <span style={{ display: "block", fontFamily: MONO, fontSize: 10, color: tokens.textMuted }}>{s.studentNumber}</span>
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "11px 10px" }}><Chip tokens={tokens} tone="peri">{s.cohort}</Chip></td>
                  <td style={{ padding: "11px 10px", minWidth: 130 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div style={{ flex: 1 }}><MasteryBar pct={s.avg} evidence={1} thin tokens={tokens} /></div>
                      <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700, color: masteryColor(masteryLevel(s.avg, true), tokens) }}>{s.avg}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "11px 10px" }}>{trendPill(s.trend)}</td>
                  <td style={{ padding: "11px 10px", textAlign: "right", fontFamily: MONO, fontSize: 12, color: tokens.textSecondary }}>{s.sessions}</td>
                  <td style={{ padding: "11px 10px", textAlign: "right" }}>
                    <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: openCount(s.id) > 0 ? tokens.primary : tokens.textFaint }}>{openCount(s.id)}</span>
                  </td>
                  <td style={{ padding: "11px 10px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <Btn tokens={tokens} lang={lang} variant="soft" style={{ padding: "6px 12px", fontSize: 11.5 }} onClick={() => openFile(s.id)}>
                        {lang === "ar" ? "فتح الملف" : "Open file"}
                      </Btn>
                      <Btn tokens={tokens} lang={lang} variant="ghost" style={{ padding: "6px 12px", fontSize: 11.5 }} onClick={() => setInterveneFor(s.id)}>
                        {lang === "ar" ? "تدخل" : "Intervene"}
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: "22px 10px", fontFamily: bFont, fontSize: 12.5, color: tokens.textFaint, textAlign: "center" }}>
                  {lang === "ar" ? "لا طلاب مطابقين للفلاتر الحالية." : "No students match the current filters."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={exportOpen} onClose={() => setExportOpen(false)} tokens={tokens} lang={lang} width={600}
        title={lang === "ar" ? "تصدير سجل الطلاب" : "Export student roster"}
        subtitle={lang === "ar" ? `CSV للفلاتر الحالية — ${filtered.length} طالباً` : `CSV of the current filters — ${filtered.length} students`}>
        <pre style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.65, color: tokens.textSecondary, background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, padding: "14px 16px", margin: 0, maxHeight: 300, overflow: "auto", whiteSpace: "pre-wrap", textAlign: "left", direction: "ltr", userSelect: "text" }}>{exportText}</pre>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14, flexWrap: "wrap" }}>
          <Btn tokens={tokens} lang={lang} variant="soft" onClick={copyExport}>
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><IconCheck size={13} />{lang === "ar" ? "نسخ" : "Copy"}</span>
          </Btn>
          <Btn tokens={tokens} lang={lang} variant="solid" onClick={downloadExport}>
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><IconDownload size={13} />{lang === "ar" ? "تنزيل .csv" : "Download .csv"}</span>
          </Btn>
        </div>
      </Modal>

      <StudentInterventionModal open={interveneFor !== null} onClose={() => setInterveneFor(null)} studentId={interveneFor} courseId={courseId} tokens={tokens} lang={lang}
        onOpenFile={(id) => openFile(id)} />
    </div>
  );
}

function StudentDrillModal({ courseId, student, tokens, lang, onClose }) {
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const isRtl = lang === "ar";
  const bFont = bFontFor(lang);
  const load = useCallback(async () => {
    const { items } = await listAssignmentsForCourse(courseId, {});
    const active = items.filter((assignment) => assignment.status !== "DRAFT");
    const reviews = await Promise.all(
      active.map((assignment) => getReview(assignment.id, { limit: 100 }).then((review) => ({ assignment, review }))),
    );
    return reviews
      .map(({ assignment, review }) => {
        const row = [...(review?.fastTrack ?? []), ...(review?.needsReview ?? [])].find((item) => item.studentId === student.id);
        if (!row) return null;
        return {
          assignmentId: assignment.id,
          title: assignment.title?.[lang] ?? assignment.title?.en ?? "",
          status: row.submission.status,
          aiTotalScore: row.aiTotalScore,
          maxTotalScore: row.maxTotalScore,
          decided: row.decided,
        };
      })
      .filter(Boolean);
  }, [courseId, student.id, lang]);
  const { data, loading, error, reload } = useAsync(load);

  return (
    <Modal open onClose={onClose} tokens={tokens} lang={lang} width={620} title={student.name} subtitle={student.email}>
      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Loading submissions…", "جاري تحميل التسليمات…")}>
        {(data ?? []).length === 0 ? (
          <p style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, margin: 0, textAlign: isRtl ? "right" : "left" }}>
            {t("This student has no submissions in this course yet.", "الطالب ده مفيش ليه تسليمات في المقرر ده لسه.")}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.map((row) => (
              <div key={row.assignmentId} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 8, padding: "8px 10px", flexDirection: isRtl ? "row-reverse" : "row" }}>
                <span style={{ fontFamily: bFont, fontSize: 12.5, fontWeight: 600, color: tokens.textPrimary, flex: 1, textAlign: isRtl ? "right" : "left" }}>{row.title}</span>
                <Chip tokens={tokens} tone={row.status === "FINALIZED" ? "slate" : "primary"}>
                  {lang === "ar" ? SUBMISSION_STATUS_LABELS[row.status]?.ar ?? row.status : SUBMISSION_STATUS_LABELS[row.status]?.en ?? row.status}
                </Chip>
                {row.decided && (
                  <span style={{ fontFamily: MONO, fontSize: 11, color: tokens.textSecondary, flexShrink: 0 }}>
                    {row.aiTotalScore}/{row.maxTotalScore}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </AsyncGate>
    </Modal>
  );
}

function RealInstructorStudents({ state }) {
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);
  const [courseId, setCourseId] = useState("");
  const [query, setQuery] = useState("");
  const [drill, setDrill] = useState(null);

  const loadCourses = useCallback(() => listCourses(), []);
  const coursesAsync = useAsync(loadCourses);
  const courses = coursesAsync.data?.items ?? [];
  const effectiveCourseId = courseId || courses[0]?.id || null;

  const loadRoster = useCallback(
    () => (effectiveCourseId ? listEnrollments(effectiveCourseId, { page: 1, limit: 100 }) : Promise.resolve(null)),
    [effectiveCourseId],
  );
  const rosterAsync = useAsync(loadRoster);

  const students = (rosterAsync.data?.items ?? []).map((enrollment) => ({
    id: enrollment.student?.id ?? enrollment.id,
    name: enrollment.student ? `${enrollment.student.firstName} ${enrollment.student.lastName}`.trim() : "—",
    email: enrollment.student?.email ?? "",
    enrolledAt: enrollment.enrolledAt ?? null,
  }));
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? students.filter((student) => `${student.name} ${student.email}`.toLowerCase().includes(needle))
    : students;

  function exportCsv() {
    const head = ["name", "email", "enrolledAt"].join(",");
    const lines = filtered.map((student) => [student.name, student.email, student.enrolledAt ?? ""]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(","));
    const blob = new Blob([[head, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "students.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="genai-pad" style={{ padding: mobile ? "20px 16px" : "26px 32px", direction: isRtl ? "rtl" : "ltr", maxWidth: 980, margin: "0 auto" }}>
      <div style={{ marginBottom: 14, textAlign: isRtl ? "right" : "left" }}>
        <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: "0 0 4px" }}>
          {t("Students", "الطلاب")}
        </h1>
        <p style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, margin: 0, lineHeight: 1.6 }}>
          {t("Real enrollment roster per course — search, drill in and export.", "كشف القيد الحقيقي لكل مقرر — دور، ادخل في تفاصيل الطالب، وصدّر.")}
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <select value={effectiveCourseId ?? ""} onChange={(event) => setCourseId(event.target.value)} style={{ ...inputStyle(tokens, bFont), minWidth: 180, flex: 1 }}>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>{course.title?.en ?? course.title}</option>
          ))}
        </select>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Search name or email…", "دور بالاسم أو الإيميل…")} style={{ ...inputStyle(tokens, bFont), flex: 1, minWidth: 160 }} />
        <Btn tokens={tokens} lang={lang} variant="ghost" onClick={exportCsv} disabled={filtered.length === 0}>
          {t("Export CSV", "تصدير CSV")}
        </Btn>
      </div>

      <AsyncGate
        tokens={tokens}
        lang={lang}
        loading={coursesAsync.loading || rosterAsync.loading}
        error={coursesAsync.error ?? rosterAsync.error}
        reload={() => {
          coursesAsync.reload();
          rosterAsync.reload();
        }}
        label={t("Loading roster…", "جاري تحميل الكشف…")}
      >
        {filtered.length === 0 ? (
          <Card tokens={tokens} style={{ padding: "16px 18px" }}>
            <p style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, margin: 0, lineHeight: 1.7, textAlign: isRtl ? "right" : "left" }}>
              {students.length === 0
                ? t("No enrolled students in this course yet.", "مفيش طلاب مقيدين في المقرر ده لسه.")
                : t("No student matches your search.", "مفيش طالب مطابق لبحثك.")}
            </p>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((student) => (
              <Card tokens={tokens} key={student.id} style={{ padding: "12px 14px" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <div style={{ flex: 1, minWidth: 0, textAlign: isRtl ? "right" : "left" }}>
                    <div style={{ fontFamily: bFont, fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>{student.name}</div>
                    <div style={{ fontFamily: MONO, fontSize: 10.5, color: tokens.textMuted }}>{student.email}</div>
                  </div>
                  {student.enrolledAt && (
                    <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.textFaint }}>
                      {new Date(student.enrolledAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB")}
                    </span>
                  )}
                  <Btn tokens={tokens} lang={lang} variant="ghost" onClick={() => setDrill(student)}>
                    {t("Submissions", "التسليمات")}
                  </Btn>
                </div>
              </Card>
            ))}
          </div>
        )}
      </AsyncGate>

      {drill && effectiveCourseId && (
        <StudentDrillModal courseId={effectiveCourseId} student={drill} tokens={tokens} lang={lang} onClose={() => setDrill(null)} />
      )}
    </div>
  );
}

export default function InstructorStudentsPage(props) {
  if (demoMode()) return <DemoInstructorStudentsPage {...props} />;
  return <RealInstructorStudents {...props} />;
}
