import { useCallback, useEffect, useMemo, useState } from "react";
import { tk, MONO, masteryColor, masteryLevel, masteryBg } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import useAsync from "@/hooks/useAsync";
import { demoMode } from "@/services/auth";
import { getCourseAnalytics } from "@/services/analytics";
import { getCourse, listEnrollments } from "@/services/courses";
import { listAssignmentsForCourse } from "@/services/assignments";
import { getReview } from "@/services/review";
import { listRemedial, generateRemedialDraft, publishRemedial } from "@/services/remedial";
import { apiErrorText } from "@/services/http";
import { AsyncGate } from "@/components/ui";
import { useInstructorModule } from "@/store/InstructorProvider";
import { Card, Btn, Chip, Modal, bFontFor, hFontFor, toast, Th, Skeleton, inputStyle, AlertStrip } from "@/components/ModuleUI";
import { IconWarning, IconCheck, IconDownload, IconSparkle } from "@/components/Icons";
import MaterialUploader from "@/components/MaterialUploader";
import { SCREENS } from "@/constants/routes";
import RemedialModal from "@/components/RemedialModal";
import StudentInterventionModal from "@/components/StudentInterventionModal";
import { MISCONCEPTIONS, STUDENTS, COURSE_SESSIONS, approvedMaterials, fmtWhen } from "@/data/instructorModule";

function MasteryBar({ pct, evidence = 1, thin = false, tokens }) {
  const level = masteryLevel(pct, evidence > 0);
  const color = masteryColor(level, tokens);
  return (
    <div style={{ height: thin ? 5 : 8, background: tokens.inset, borderRadius: 4, overflow: "hidden", border: `1px solid ${tokens.insetBorder}` }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.8s ease-out" }} />
    </div>
  );
}

function CitationChip({ label, tokens }) {
  return (
    <span style={{ fontFamily: MONO, fontSize: 11, background: tokens.citationBg, color: tokens.citation, border: `1px solid ${tokens.citationBorder}`, borderRadius: 6, padding: "2px 8px", display: "inline-flex", alignItems: "center" }}>
      {label}
    </span>
  );
}

function DemoCourseAnalyticsTab({ state, courseId, dispatch }) {
  const { state: mod, approveMaterial } = useInstructorModule();
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);

  const course = mod.courses.find((c) => c.id === courseId) ?? mod.courses[0];
  const [remedialEntry, setRemedialEntry] = useState(null);
  const [materialsFor, setMaterialsFor] = useState(null);
  const [loading, setLoading] = useState(typeof window !== "undefined");
  useEffect(() => { const t = window.setTimeout(() => setLoading(false), 420); return () => window.clearTimeout(t); }, []);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportText, setExportText] = useState("");
  const [interveneFor, setInterveneFor] = useState(null);

  const gaps = useMemo(() => course.topics.filter((t) => t.pct < 65).sort((a, b) => a.pct - b.pct), [course]);
  const flagged = (pct) => Math.round((course.enrolled * (100 - pct)) / 100);

  const misList = useMemo(
    () => MISCONCEPTIONS.filter((m) => course.topics.some((t) => t.id === m.topicId)).sort((a, b) => b.prevalence - a.prevalence),
    [course],
  );
  const addressed = useMemo(
    () => new Set(mod.remedial.filter((r) => r.status === "published" && r.misconceptionId).map((r) => r.misconceptionId)),
    [mod.remedial],
  );

  const attention = useMemo(
    () => STUDENTS.filter((s) => s.avg < 40 && s.gaps.some((g) => course.topics.some((t) => t.id === g))).sort((a, b) => a.avg - b.avg),
    [course],
  );
  const needAttention = useMemo(
    () => STUDENTS.reduce((sum, s) => sum + s.gaps.filter((g) => { const t = course.topics.find((x) => x.id === g); return t && t.pct < 40; }).length, 0),
    [course],
  );

  const coverage = course.topics.filter((t) => approvedMaterials(t) === 0);
  const sessions = COURSE_SESSIONS[course.id] ?? 0;
  const materialsTopic = course.topics.find((t) => t.id === materialsFor);

  const mono = (t, extra) => (
    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.09em", color: tokens.textMuted, ...extra }}>{t}</div>
  );

  const exportReport = () => {
    const lines = [
      `Course analytics snapshot — ${course.id} (${course.title.en})`,
      `Precomputed as of ${fmtWhen(mod.analyticsAsOf, "en")} — instructor: ${course.instructor}`,
      ``,
      `Students enrolled: ${course.enrolled}`,
      `Average mastery (all topics): ${course.overall}%`,
      `Topic-level gaps below 40%: ${needAttention}`,
      `AI tutor sessions this semester: ${sessions}`,
      `Distinct diagnosed misconceptions: ${misList.length}`,
      ``,
      `Class-wide topic gaps (ranked by severity):`,
      ...gaps.map((t) => `  - ${t.label.en}: ${t.pct}% mastery, ${flagged(t.pct)} students flagged${t.pct < 40 ? " [critical]" : ""}`),
      ``,
      `Common misconceptions (by prevalence):`,
      ...misList.map((m) => `  - ${m.text}: ${m.prevalence} students (${m.citation})${addressed.has(m.id) ? " [addressed]" : ""}`),
      ``,
      `Students requiring attention (avg mastery < 40%):`,
      ...attention.map((s) => `  - ${s.name} (${s.studentNumber}): ${s.avg}% — gaps: ${s.gaps.join(", ") || "—"} — ${s.sessions} AI sessions`),
      ``,
      `Material coverage alerts:`,
      ...(coverage.length ? coverage.map((t) => `  - ${t.label.en}: 0 approved materials`) : ["  - none"]),
    ].join("\n");
    setExportText(lines);
    setExportOpen(true);
  };

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      toast(lang === "ar" ? "تم نسخ التقرير." : "Report copied.");
    } catch {
      toast(lang === "ar" ? "انسخ النص المحدد يدوياً (Ctrl+C)." : "Select the text and copy manually (Ctrl+C).");
    }
  };

  const downloadExport = () => {
    try {
      const blob = new Blob([exportText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${course.id}-analytics-snapshot.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast(lang === "ar" ? "بدء تنزيل التقرير." : "Report download started.");
    } catch {
      toast(lang === "ar" ? "التنزيل محجوب هنا — انسخ النص بدلاً منه." : "Download blocked here — copy the text instead.");
    }
  };

  const trendPill = (t) => {
    const map = {
      improving: { bg: tokens.primaryLight, fg: tokens.primary, label: "Improving", labelAr: "يتحسن" },
      stable: { bg: tokens.inset, fg: tokens.textMuted, label: "Stable", labelAr: "مستقر" },
      declining: { bg: tokens.gapBg, fg: tokens.gap, label: "Declining", labelAr: "متراجع" },
    };
    const m = map[t] ?? map.stable;
    return (
      <span style={{ fontFamily: MONO, fontSize: 10, color: m.fg, background: m.bg, border: `1px solid ${m.fg}44`, borderRadius: 5, padding: "2px 8px", whiteSpace: "nowrap" }}>
        {lang === "ar" ? m.labelAr : m.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ direction: isRtl ? "rtl" : "ltr" }}>
        <Skeleton h={26} w={220} tokens={tokens} style={{ marginBottom: 10 }} />
        <Skeleton h={12} w={340} tokens={tokens} style={{ marginBottom: 20 }} />
        <div className="genai-tiles-5" style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: 14, marginBottom: 18 }}>
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} h={96} tokens={tokens} />)}
        </div>
        <div className="genai-grid-2" style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 16 }}>
          <Skeleton h={280} tokens={tokens} />
          <Skeleton h={280} tokens={tokens} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ direction: isRtl ? "rtl" : "ltr" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 18, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
        <div style={{ textAlign: isRtl ? "right" : "left", minWidth: 0 }}>
          <h2 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 17 : 20, color: tokens.textPrimary, letterSpacing: "-0.02em", margin: "0 0 4px" }}>
            {lang === "ar" ? "تحليلات المقرر" : "Course Analytics"}
          </h2>
          <div style={{ fontFamily: bFont, fontSize: 13, color: tokens.textSecondary }}>
            {course.id} · {lang === "ar" ? course.title.ar : course.title.en} · {course.instructor} · {lang === "ar" ? `الأسبوع ${course.week} من ${course.weeksTotal}` : `Week ${course.week} of ${course.weeksTotal}`}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: tokens.textMuted, marginTop: 5 }}>
            {lang === "ar" ? `لقطة محسوبة مسبقاً · بتاريخ ${fmtWhen(mod.analyticsAsOf, lang)}` : `Precomputed snapshot · as of ${fmtWhen(mod.analyticsAsOf, lang)}`}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
          <Btn tokens={tokens} lang={lang} variant="ghost" onClick={exportReport}>
            <IconDownload size={13} color={tokens.textMuted} />
            {lang === "ar" ? "تصدير التقرير" : "Export Report"}
          </Btn>
          <Btn tokens={tokens} lang={lang} variant="soft" onClick={() => setRemedialEntry({ courseId: course.id, topicId: gaps[0]?.id ?? course.topics[0]?.id ?? "" })}>
            <IconSparkle size={13} color={tokens.primary} />
            {lang === "ar" ? "توليد محتوى" : "Generate Content"}
          </Btn>
        </div>
      </div>

      <div className="genai-tiles-5" style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: 14, marginBottom: 18 }}>
        {[
          { label: lang === "ar" ? "الطلاب" : "STUDENTS", value: `${course.enrolled}`, sub: lang === "ar" ? "مسجلون" : "Enrolled", color: tokens.textPrimary },
          { label: lang === "ar" ? "متوسط الإتقان" : "AVG. MASTERY", value: `${course.overall}%`, sub: lang === "ar" ? "كل المواضيع" : "All topics", color: tokens.primary },
          { label: lang === "ar" ? "يحتاج انتباهاً" : "NEED ATTENTION", value: `${needAttention}`, sub: lang === "ar" ? "إتقان < 40%" : "< 40% mastery", color: tokens.gap },
          { label: lang === "ar" ? "جلسات الذكاء" : "AI SESSIONS", value: `${sessions}`, sub: lang === "ar" ? "هذا الفصل" : "This semester", color: tokens.textPrimary },
          { label: lang === "ar" ? "مفاهيم خاطئة" : "MISCONCEPTIONS", value: `${misList.length}`, sub: lang === "ar" ? "مميزة ومشخّصة" : "Distinct, diagnosed", color: tokens.gap },
        ].map((t) => (
          <div key={t.label} style={{ background: tokens.card, border: `1px solid ${tokens.cardBorder}`, borderRadius: 12, padding: "16px 18px" }}>
            {mono(t.label, { marginBottom: 8 })}
            <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 21 : 26, color: t.color, letterSpacing: "-0.03em", marginBottom: 3 }}>{t.value}</div>
            <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted }}>{t.sub}</div>
          </div>
        ))}
      </div>

      <div className="genai-grid-2" style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 18 }}>
        <Card tokens={tokens} style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexDirection: isRtl ? "row-reverse" : "row" }}>
            <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em" }}>
              {lang === "ar" ? "فجوات المواضيع على مستوى الدفعة" : "Class-Wide Topic Gaps"}
            </div>
            <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.textFaint }}>{lang === "ar" ? "مرتبة بالخطورة" : "ranked by severity"}</span>
          </div>
          {gaps.length === 0 ? (
            <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textFaint }}>{lang === "ar" ? "لا فجوات مواضيع تحت 65%." : "No topic gaps below 65%."}</div>
          ) : (
            gaps.map((t, i) => (
              <div key={t.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 0", borderTop: i > 0 ? `1px solid ${tokens.cardBorder}` : "none", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 7, alignItems: "center", fontFamily: bFont, fontSize: 12.5, fontWeight: 500, color: tokens.textPrimary, marginBottom: 6, flexDirection: isRtl ? "row-reverse" : "row" }}>
                    {t.pct < 40 && <IconWarning size={13} color={tokens.gap} />}
                    {lang === "ar" ? t.label.ar : t.label.en}
                  </div>
                  <MasteryBar pct={t.pct} evidence={t.evidence} thin tokens={tokens} />
                </div>
                <div style={{ textAlign: isRtl ? "left" : "right", flexShrink: 0, width: 74 }}>
                  <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: masteryColor(masteryLevel(t.pct, t.evidence > 0), tokens) }}>{t.pct}%</div>
                  <div style={{ fontFamily: bFont, fontSize: 10.5, color: tokens.textMuted }}>{flagged(t.pct)} {lang === "ar" ? "طالباً" : "students"}</div>
                </div>
                <Btn tokens={tokens} lang={lang} variant="soft" style={{ padding: "6px 12px", fontSize: 11.5, flexShrink: 0 }}
                  onClick={() => setRemedialEntry({ courseId: course.id, topicId: t.id })}>
                  {lang === "ar" ? "توليد" : "Generate"}
                </Btn>
              </div>
            ))
          )}
        </Card>

        <Card tokens={tokens} style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexDirection: isRtl ? "row-reverse" : "row" }}>
            <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em" }}>
              {lang === "ar" ? "المفاهيم الخاطئة الشائعة" : "Common Misconceptions"}
            </div>
            <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.textFaint }}>{lang === "ar" ? "بالانتشار" : "by prevalence"}</span>
          </div>
          {misList.length === 0 ? (
            <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textFaint }}>{lang === "ar" ? "لا مفاهيم خاطئة مشخّصة في هذا المقرر." : "No diagnosed misconceptions in this course."}</div>
          ) : (
            misList.map((m, i) => (
              <div key={m.id} style={{ padding: "11px 0", borderTop: i > 0 ? `1px solid ${tokens.cardBorder}` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <div style={{ minWidth: 0, flex: 1, textAlign: isRtl ? "right" : "left" }}>
                    <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 5, flexDirection: isRtl ? "row-reverse" : "row" }}>
                      <Chip tokens={tokens} tone="peri">{m.tag}</Chip>
                      {addressed.has(m.id) && <span style={{ fontFamily: bFont, fontSize: 10.5, color: tokens.textFaint }}>{lang === "ar" ? "عولج" : "addressed"}</span>}
                    </div>
                    <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textPrimary, lineHeight: 1.5, marginBottom: 6 }}>{m.text}</div>
                    <CitationChip label={m.citation} tokens={tokens} />
                  </div>
                  <div style={{ textAlign: isRtl ? "left" : "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: isRtl ? "flex-start" : "flex-end", gap: 6 }}>
                    <div>
                      <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: 18, color: tokens.gap, letterSpacing: "-0.02em" }}>{m.prevalence}</div>
                      <div style={{ fontFamily: bFont, fontSize: 10, color: tokens.textMuted }}>{lang === "ar" ? "طالباً" : "students"}</div>
                    </div>
                    <Btn tokens={tokens} lang={lang} variant="soft" style={{ padding: "6px 12px", fontSize: 11.5 }}
                      onClick={() => setRemedialEntry({ courseId: course.id, topicId: m.topicId, misconceptionId: m.id })}>
                      {lang === "ar" ? "توليد" : "Generate"}
                    </Btn>
                  </div>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>

      <Card tokens={tokens} style={{ padding: "18px 20px", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
          <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em" }}>
            {lang === "ar" ? "طلاب يحتاجون انتباهاً" : "Students Requiring Attention"}
          </div>
          <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.gap, background: tokens.gapBg, border: `1px solid ${tokens.gap}44`, borderRadius: 6, padding: "3px 9px" }}>
            {lang === "ar" ? `متوسط إتقان < 40% · ${attention.length} طلاب` : `avg. mastery < 40% · ${attention.length} students`}
          </span>
        </div>
        {attention.length === 0 ? (
          <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textFaint }}>{lang === "ar" ? "لا طلاب تحت متوسط 40% حالياً." : "No students below 40% average mastery right now."}</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: mobile ? 640 : undefined }}>
              <thead>
                <tr>
                  <Th tokens={tokens}>{lang === "ar" ? "الطالب" : "STUDENT"}</Th>
                  <Th tokens={tokens}>{lang === "ar" ? "الرقم" : "ID"}</Th>
                  <Th tokens={tokens}>{lang === "ar" ? "متوسط الإتقان" : "AVG. MASTERY"}</Th>
                  <Th tokens={tokens}>{lang === "ar" ? "الفجوات الأساسية" : "PRIMARY GAPS"}</Th>
                  <Th tokens={tokens}>{lang === "ar" ? "الاتجاه" : "TREND"}</Th>
                  <Th tokens={tokens} align="right">{lang === "ar" ? "جلسات الذكاء" : "AI SESSIONS"}</Th>
                  <Th tokens={tokens} align="right">{lang === "ar" ? "إجراء" : "ACTION"}</Th>
                </tr>
              </thead>
              <tbody>
                {attention.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: i < attention.length - 1 ? `1px solid ${tokens.cardBorder}` : "none" }}>
                    <td style={{ padding: "11px 10px" }}>
                      <div style={{ display: "flex", gap: 9, alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
                        <span style={{ width: 26, height: 26, borderRadius: "50%", background: tokens.primaryLight, border: `1px solid ${tokens.citationBorder}`, color: tokens.primary, fontFamily: MONO, fontSize: 9.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {s.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                        </span>
                        <span style={{ fontFamily: bFont, fontSize: 12.5, fontWeight: 600, color: tokens.textPrimary, whiteSpace: "nowrap" }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 10px", fontFamily: MONO, fontSize: 11, color: tokens.textMuted, whiteSpace: "nowrap" }}>{s.studentNumber}</td>
                    <td style={{ padding: "11px 10px", minWidth: 130 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ flex: 1 }}><MasteryBar pct={s.avg} evidence={1} thin tokens={tokens} /></div>
                        <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700, color: masteryColor(masteryLevel(s.avg, true), tokens) }}>{s.avg}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 10px", fontFamily: bFont, fontSize: 12, color: tokens.textSecondary }}>
                      {s.gaps.map((g) => course.topics.find((t) => t.id === g)?.short ?? g).join(", ") || "—"}
                    </td>
                    <td style={{ padding: "11px 10px" }}>{trendPill(s.trend)}</td>
                    <td style={{ padding: "11px 10px", textAlign: "right", fontFamily: MONO, fontSize: 12, color: tokens.textSecondary }}>{s.sessions}</td>
                    <td style={{ padding: "11px 10px", textAlign: "right" }}>
                      <Btn tokens={tokens} lang={lang} variant="soft" style={{ padding: "6px 12px", fontSize: 11.5 }}
                        onClick={() => setInterveneFor(s.id)}>
                        {lang === "ar" ? "تدخل" : "Intervene"}
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card tokens={tokens} style={{ padding: "18px 20px", marginBottom: 18 }}>
        <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em", marginBottom: 12 }}>
          {lang === "ar" ? "تنبيهات تغطية المواد" : "Material Coverage Alerts"}
        </div>
        {coverage.length === 0 ? (
          <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textFaint }}>
            {lang === "ar" ? "كل المواضيع لها مادة معتمدة واحدة على الأقل." : "Every topic has at least one approved material."}
          </div>
        ) : (
          coverage.map((t, i) => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, padding: "11px 0", borderTop: i > 0 ? `1px solid ${tokens.cardBorder}` : "none", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", fontFamily: bFont, fontSize: 12.5, fontWeight: 500, color: tokens.textPrimary, flexDirection: isRtl ? "row-reverse" : "row" }}>
                <IconWarning size={14} color={tokens.gap} />
                {lang === "ar" ? t.label.ar : t.label.en}
                <span style={{ fontFamily: MONO, fontSize: 11, color: tokens.textMuted }}>· 0 {lang === "ar" ? "معتمد" : "approved"}</span>
              </div>
              <Btn tokens={tokens} lang={lang} variant="soft" style={{ padding: "7px 14px", fontSize: 11.5 }} onClick={() => setMaterialsFor(t.id)}>
                {lang === "ar" ? "فتح المواد" : "Open materials"}
              </Btn>
            </div>
          ))
        )}
      </Card>

      <Card tokens={tokens} style={{ padding: "18px 20px" }}>
        <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em", marginBottom: 14 }}>
          {lang === "ar" ? "توزيع الإتقان على مستوى المقرر" : "Course-Wide Mastery Distribution"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
          {gaps.map((t) => {
            const level = masteryLevel(t.pct, t.evidence > 0);
            return (
              <div key={t.id} style={{ background: masteryBg(level, tokens), border: `1px solid ${masteryColor(level, tokens)}33`, borderRadius: 10, padding: "14px 12px", textAlign: "center" }}>
                <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: 20, color: masteryColor(level, tokens), letterSpacing: "-0.02em", marginBottom: 4 }}>{t.pct}%</div>
                <div style={{ fontFamily: bFont, fontSize: 11, color: tokens.textPrimary, marginBottom: 3 }}>{lang === "ar" ? t.label.ar : t.label.en}</div>
                <div style={{ fontFamily: bFont, fontSize: 10, color: tokens.textMuted }}>{flagged(t.pct)} {lang === "ar" ? "مُعلَّم" : "flagged"}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <Modal open={materialsFor !== null} onClose={() => setMaterialsFor(null)} tokens={tokens} lang={lang} width={520}
        title={lang === "ar" ? `مواد الموضوع — ${materialsTopic?.label.ar ?? ""}` : `Topic materials — ${materialsTopic?.label.en ?? ""}`}
        subtitle={lang === "ar" ? "المسودات غير مرئية للطلاب حتى الاعتماد." : "Uploads stay pending until you approve them."}>
        {materialsTopic && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {materialsTopic.materials.length === 0 && (
                <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textFaint }}>{lang === "ar" ? "لا مواد مرفوعة بعد." : "No materials uploaded yet."}</div>
              )}
              {materialsTopic.materials.map((m) => (
                <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 12px", background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <span style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textPrimary }}>{m.title}</span>
                  {m.status === "approved" ? (
                    <span style={{ display: "inline-flex", gap: 6, alignItems: "center", fontFamily: MONO, fontSize: 10, color: tokens.mastered }}>
                      <IconCheck size={12} color={tokens.mastered} /> {lang === "ar" ? "معتمد" : "APPROVED"}
                    </span>
                  ) : (
                    <Btn tokens={tokens} lang={lang} variant="soft" style={{ padding: "5px 12px", fontSize: 11 }}
                      onClick={() => { approveMaterial(course.id, materialsTopic.id, m.id); toast(lang === "ar" ? `اعتُمدت المادة: ${m.title}` : `Material approved: ${m.title}`); }}>
                      {lang === "ar" ? "اعتماد" : "Approve"}
                    </Btn>
                  )}
                </div>
              ))}
            </div>
            <MaterialUploader courseId={course.id} topicId={materialsTopic.id} tokens={tokens} lang={lang} />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <Btn tokens={tokens} lang={lang} variant="ghost"
                onClick={() => { const focused = materialsFor; setMaterialsFor(null); dispatch({ type: "NAVIGATE", screen: SCREENS.COURSE_WORKSPACE, courseId: course.id, tab: "materials", materialsTopic: focused }); }}>
                {lang === "ar" ? "إدارة كل المواد في تاب المواد" : "Manage everything in the Materials tab"}
              </Btn>
            </div>
          </>
        )}
      </Modal>

      <Modal open={exportOpen} onClose={() => setExportOpen(false)} tokens={tokens} lang={lang} width={640}
        title={lang === "ar" ? "تقرير اللقطة التحليلية" : "Analytics snapshot report"}>
        <p style={{ fontFamily: bFont, fontSize: 12, color: tokens.textMuted, marginBottom: 10 }}>
          {lang === "ar"
            ? "تقرير نصي جاهز — انسخه أو نزّله. يعكس نفس اللقطة المحسوبة مسبقاً المعروضة بالأعلى."
            : "Plain-text report — copy it or download. Mirrors the same precomputed snapshot shown above."}
        </p>
        <pre style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.65, color: tokens.textSecondary, background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, padding: "14px 16px", margin: 0, maxHeight: 340, overflow: "auto", whiteSpace: "pre-wrap", textAlign: "left", direction: "ltr", userSelect: "text" }}>{exportText}</pre>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14, flexWrap: "wrap" }}>
          <Btn tokens={tokens} lang={lang} variant="soft" onClick={copyExport}>
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><IconCheck size={13} />{lang === "ar" ? "نسخ التقرير" : "Copy report"}</span>
          </Btn>
          <Btn tokens={tokens} lang={lang} variant="solid" onClick={downloadExport}>
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><IconDownload size={13} />{lang === "ar" ? "تنزيل .txt" : "Download .txt"}</span>
          </Btn>
        </div>
      </Modal>

      <StudentInterventionModal open={interveneFor !== null} onClose={() => setInterveneFor(null)} studentId={interveneFor}
        courseId={courseId} tokens={tokens} lang={lang}
        onOpenFile={(id) => dispatch({ type: "NAVIGATE", screen: SCREENS.INSTRUCTOR_STUDENTS, studentId: id, courseId })} />

      <RemedialModal open={remedialEntry !== null} onClose={() => setRemedialEntry(null)} entry={remedialEntry} tokens={tokens} lang={lang} />
    </div>
  );
}

function RealRemedialModal({ open, onClose, entry, courseId, tokens, lang, onPublished }) {
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const bFont = bFontFor(lang);
  const hFont = hFontFor(lang);
  const isRtl = lang === "ar";
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState("");
  const [contentType, setContentType] = useState("FOCUSED_EXPLANATION_WITH_EXAMPLE");
  const [instructions, setInstructions] = useState("");
  const [audience, setAudience] = useState("ALL_STUDENTS");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) {
      setDraft(null);
      setError(null);
      setBusy("");
      setInstructions("");
      setAudience("ALL_STUDENTS");
      setContentType("FOCUSED_EXPLANATION_WITH_EXAMPLE");
    }
  }, [open]);

  const generate = async () => {
    setBusy("generate");
    setError(null);
    try {
      const body = entry?.misconceptionCode
        ? {
            origin: "FROM_MISCONCEPTION",
            assignmentId: entry.assignmentId,
            misconceptionCode: entry.misconceptionCode,
            contentType,
          }
        : {
            origin: "STANDALONE",
            topicId: entry?.topicId,
            contentType,
            instructions: instructions.trim() || undefined,
          };
      const created = await generateRemedialDraft(courseId, body);
      setDraft(created);
      if (entry?.misconceptionCode) setAudience("AFFECTED_STUDENTS");
    } catch (err) {
      setError(apiErrorText(err, lang));
    } finally {
      setBusy("");
    }
  };

  const publish = async () => {
    setBusy("publish");
    setError(null);
    try {
      await publishRemedial(courseId, draft.id, { audienceType: audience });
      toast(t("Remedial content published.", "تم نشر المحتوى العلاجي."));
      onPublished?.();
      onClose();
    } catch (err) {
      setError(apiErrorText(err, lang));
    } finally {
      setBusy("");
    }
  };

  return (
    <Modal open={open} onClose={onClose} tokens={tokens} lang={lang} width={640}
      title={t("Generate remedial content", "توليد محتوى علاجي")}
      subtitle={t("AI drafts it — nothing reaches students until you publish.", "الذكاء الاصطناعي يجهز مسودة — مفيش حاجة توصل للطلاب قبل ما تنشر.")}>
      <div style={{ direction: isRtl ? "rtl" : "ltr" }}>
        {entry?.misconceptionCode && (
          <div style={{ marginBottom: 12 }}>
            <Chip tokens={tokens} tone="peri">{entry.misconceptionCode}</Chip>
          </div>
        )}
        {!draft && (
          <>
            <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, marginBottom: 8 }}>
              {t("Content type", "نوع المحتوى")}
            </div>
            <select value={contentType} onChange={(e) => setContentType(e.target.value)} style={{ ...inputStyle(tokens, bFont), cursor: "pointer", width: "100%", marginBottom: 12 }} className="genai-input">
              <option value="FOCUSED_EXPLANATION_WITH_EXAMPLE">{t("Focused explanation with example", "شرح مركز مع مثال")}</option>
              <option value="EXTRA_PRACTICE_QUESTIONS">{t("Extra practice questions", "أسئلة تدريب إضافية")}</option>
            </select>
            {!entry?.misconceptionCode && (
              <>
                <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, marginBottom: 8 }}>
                  {t("Instructions (optional)", "تعليمات (اختياري)")}
                </div>
                <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3}
                  style={{ ...inputStyle(tokens, bFont), width: "100%", marginBottom: 12, resize: "vertical" }} className="genai-input"
                  placeholder={t("What should this cover?", "المفروض يغطي إيه؟")} />
              </>
            )}
          </>
        )}
        {draft && (
          <>
            <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: 15, color: tokens.textPrimary, marginBottom: 8 }}>{draft.title}</div>
            <pre style={{ fontFamily: bFont, fontSize: 12, lineHeight: 1.7, color: tokens.textSecondary, background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, padding: "12px 14px", margin: "0 0 12px", maxHeight: 260, overflow: "auto", whiteSpace: "pre-wrap", textAlign: isRtl ? "right" : "left" }}>{draft.body}</pre>
            <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, marginBottom: 8 }}>
              {t("Audience", "الجمهور")}
            </div>
            <select value={audience} onChange={(e) => setAudience(e.target.value)} style={{ ...inputStyle(tokens, bFont), cursor: "pointer", width: "100%", marginBottom: 12 }} className="genai-input">
              <option value="ALL_STUDENTS">{t("All students in the course", "كل طلاب المقرر")}</option>
              <option value="AFFECTED_STUDENTS">{t("Affected students only", "الطلاب المتأثرين فقط")}</option>
            </select>
          </>
        )}
        {error && (
          <AlertStrip tokens={tokens} lang={lang} tone="violet" title={t("Something went wrong", "حصل خطأ")} body={error} />
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6, flexDirection: isRtl ? "row-reverse" : "row" }}>
          {!draft ? (
            <Btn tokens={tokens} lang={lang} variant="solid" onClick={generate} disabled={busy === "generate"}>
              <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                <IconSparkle size={13} color="#fff" />
                {busy === "generate" ? t("Generating…", "جاري التوليد…") : t("Generate draft", "توليد المسودة")}
              </span>
            </Btn>
          ) : (
            <>
              <Btn tokens={tokens} lang={lang} variant="ghost" onClick={() => setDraft(null)}>{t("Regenerate", "إعادة التوليد")}</Btn>
              <Btn tokens={tokens} lang={lang} variant="solid" onClick={publish} disabled={busy === "publish"}>
                {busy === "publish" ? t("Publishing…", "جاري النشر…") : t("Publish to students", "نشر للطلاب")}
              </Btn>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

function RealCourseAnalyticsTab({ state, courseId, dispatch }) {
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);

  const [remedialEntry, setRemedialEntry] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportText, setExportText] = useState("");

  const load = useCallback(async () => {
    const [course, analytics, enrollment, assignmentList, remedialList] = await Promise.all([
      getCourse(courseId).catch(() => null),
      getCourseAnalytics(courseId),
      listEnrollments(courseId, { page: 1, limit: 1 }).catch(() => ({ total: 0 })),
      listAssignmentsForCourse(courseId, {}).catch(() => ({ items: [] })),
      listRemedial(courseId).catch(() => ({ items: [] })),
    ]);
    const active = (assignmentList.items ?? []).filter((assignment) => ["OPEN", "CLOSED"].includes(assignment.status));
    const reviews = await Promise.all(
      active.slice(0, 6).map((assignment) => getReview(assignment.id, { limit: 200 }).catch(() => null)),
    );
    const studentAgg = new Map();
    const misAgg = new Map();
    reviews.forEach((review, index) => {
      const assignment = active[index];
      (review?.items ?? []).forEach((row) => {
        const studentId = row.submission?.studentId ?? row.studentId ?? row.studentName;
        const max = row.maxTotalScore ?? 0;
        const score = row.submission?.finalScoreTotal ?? row.aiTotalScore ?? 0;
        const pct = max > 0 ? Math.round((score / max) * 100) : 0;
        const current = studentAgg.get(studentId) ?? {
          id: studentId,
          name: row.studentName ?? "—",
          email: row.studentEmail ?? row.submission?.studentEmail ?? "",
          submissions: 0,
          pctSum: 0,
          pctCount: 0,
          codes: new Set(),
        };
        current.submissions += 1;
        current.pctSum += pct;
        current.pctCount += 1;
        (row.answers ?? []).forEach((answer) => {
          (answer.evaluation?.misconceptions ?? []).forEach((item) => {
            if (!item?.code) return;
            current.codes.add(item.code);
            const existing = misAgg.get(item.code) ?? {
              code: item.code,
              text: item.description ?? item.code,
              students: new Set(),
              assignmentId: assignment?.id ?? "",
              assignmentTitle: assignment?.title?.[lang] ?? assignment?.title?.en ?? "",
            };
            existing.students.add(studentId);
            misAgg.set(item.code, existing);
          });
        });
        studentAgg.set(studentId, current);
      });
    });
    const students = [...studentAgg.values()].map((student) => ({
      ...student,
      avg: student.pctCount ? Math.round(student.pctSum / student.pctCount) : 0,
    }));
    return {
      course,
      analytics,
      enrolled: enrollment?.total ?? 0,
      students,
      misconceptions: [...misAgg.values()]
        .map((item) => ({ ...item, prevalence: item.students.size }))
        .sort((a, b) => b.prevalence - a.prevalence),
      addressed: new Set(
        (remedialList?.items ?? []).filter((item) => item.status === "PUBLISHED" && item.misconceptionCode).map((item) => item.misconceptionCode),
      ),
    };
  }, [courseId, lang]);
  const { data, loading, error, reload } = useAsync(load);

  const course = data?.course ?? null;
  const analytics = data?.analytics ?? null;
  const totals = analytics?.totals ?? null;
  const enrolled = data?.enrolled ?? 0;
  const topicTitle = (title) => (typeof title === "string" ? title : (title?.[lang] ?? title?.en ?? ""));
  const topics = (analytics?.topics ?? []).map((topic) => ({
    id: topic.topicId,
    label: { en: topicTitle(topic.title), ar: topicTitle(topic.title) },
    pct: Math.round(topic.avgScorePercentage ?? 0),
    evidence: topic.evidenceCount ?? 0,
    students: topic.studentsGradedCount ?? 0,
  }));
  const gaps = useMemo(() => topics.filter((topic) => topic.pct < 65).sort((a, b) => a.pct - b.pct), [topics]);
  const flagged = (pct) => Math.max(0, Math.round((enrolled * (100 - pct)) / 100));
  const misList = data?.misconceptions ?? [];
  const addressed = data?.addressed ?? new Set();
  const attention = useMemo(() => (data?.students ?? []).filter((student) => student.avg < 40).sort((a, b) => a.avg - b.avg), [data]);
  const coverage = (analytics?.coverage ?? []).map((item) => ({
    id: item.topicId,
    label: { en: topicTitle(item.title), ar: topicTitle(item.title) },
    isGap: item.isGap,
  }));
  const coverageGaps = coverage.filter((item) => item.isGap);
  const sessions = null;

  const mono = (label, extra) => (
    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.09em", color: tokens.textMuted, ...extra }}>{label}</div>
  );

  const exportReport = () => {
    const lines = [
      `Course analytics snapshot — ${course?.code ?? courseId} (${course?.title?.en ?? ""})`,
      `Precomputed as of ${analytics?.computedAt ?? "n/a"}`,
      ``,
      `Students enrolled: ${enrolled}`,
      `Average score (graded work): ${totals?.avgCoursePercentage ?? 0}%`,
      `Finalized submissions: ${totals?.finalizedCount ?? 0} · Pending review: ${totals?.pendingReviewCount ?? 0} · Fast-track: ${totals?.fastTrackCount ?? 0}`,
      `Students below 40% average: ${attention.length}`,
      `AI tutor sessions: not tracked by the backend yet`,
      `Distinct diagnosed misconceptions: ${misList.length}`,
      ``,
      `Class-wide topic gaps (ranked by severity):`,
      ...(gaps.length ? gaps.map((topic) => `  - ${topic.label.en}: ${topic.pct}% average, ${topic.students} graded${topic.pct < 40 ? " [critical]" : ""}`) : ["  - none"]),
      ``,
      `Common misconceptions (by prevalence):`,
      ...(misList.length ? misList.map((item) => `  - ${item.code}: ${item.prevalence} students — ${item.text}${addressed.has(item.code) ? " [addressed]" : ""}`) : ["  - none"]),
      ``,
      `Students requiring attention (avg < 40%):`,
      ...(attention.length ? attention.map((student) => `  - ${student.name}${student.email ? ` (${student.email})` : ""}: ${student.avg}% — misconceptions: ${[...student.codes].join(", ") || "—"}`) : ["  - none"]),
      ``,
      `Material coverage alerts:`,
      ...(coverageGaps.length ? coverageGaps.map((item) => `  - ${item.label.en}: no assignment questions reference this topic`) : ["  - none"]),
    ].join("\n");
    setExportText(lines);
    setExportOpen(true);
  };

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      toast(t("Report copied.", "تم نسخ التقرير."));
    } catch {
      toast(t("Select the text and copy manually (Ctrl+C).", "انسخ النص المحدد يدوياً (Ctrl+C)."));
    }
  };

  const downloadExport = () => {
    try {
      const blob = new Blob([exportText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${course?.code ?? "course"}-analytics-snapshot.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast(t("Report download started.", "بدء تنزيل التقرير."));
    } catch {
      toast(t("Download blocked here — copy the text instead.", "التنزيل محجوب هنا — انسخ النص بدلاً منه."));
    }
  };

  if (loading) {
    return (
      <div style={{ direction: isRtl ? "rtl" : "ltr" }}>
        <Skeleton h={26} w={220} tokens={tokens} style={{ marginBottom: 10 }} />
        <Skeleton h={12} w={340} tokens={tokens} style={{ marginBottom: 20 }} />
        <div className="genai-tiles-5" style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: 14, marginBottom: 18 }}>
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} h={96} tokens={tokens} />)}
        </div>
        <div className="genai-grid-2" style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 16 }}>
          <Skeleton h={280} tokens={tokens} />
          <Skeleton h={280} tokens={tokens} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ direction: isRtl ? "rtl" : "ltr" }}>
      <AsyncGate tokens={tokens} lang={lang} loading={false} error={error} reload={reload} label={t("Loading analytics…", "جاري تحميل التحليلات…")}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 18, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
          <div style={{ textAlign: isRtl ? "right" : "left", minWidth: 0 }}>
            <h2 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 17 : 20, color: tokens.textPrimary, letterSpacing: "-0.02em", margin: "0 0 4px" }}>
              {t("Course Analytics", "تحليلات المقرر")}
            </h2>
            <div style={{ fontFamily: bFont, fontSize: 13, color: tokens.textSecondary }}>
              {course?.code ?? courseId} · {topicTitle(course?.title)}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: tokens.textMuted, marginTop: 5 }}>
              {analytics?.computedAt
                ? t(`Precomputed snapshot · as of ${fmtWhen(analytics.computedAt, lang)}`, `لقطة محسوبة مسبقاً · بتاريخ ${fmtWhen(analytics.computedAt, lang)}`)
                : t("Precomputed snapshot · not computed yet", "لقطة محسوبة مسبقاً · لسه محسوبة")}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
            <Btn tokens={tokens} lang={lang} variant="ghost" onClick={exportReport}>
              <IconDownload size={13} color={tokens.textMuted} />
              {t("Export Report", "تصدير التقرير")}
            </Btn>
            <Btn tokens={tokens} lang={lang} variant="soft" onClick={() => setRemedialEntry({ topicId: gaps[0]?.id ?? topics[0]?.id ?? null })} disabled={!gaps[0]?.id && !topics[0]?.id}>
              <IconSparkle size={13} color={tokens.primary} />
              {t("Generate Content", "توليد محتوى")}
            </Btn>
          </div>
        </div>

        <div className="genai-tiles-5" style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: 14, marginBottom: 18 }}>
          {[
            { label: t("STUDENTS", "الطلاب"), value: `${enrolled}`, sub: t("Enrolled", "مسجلون"), color: tokens.textPrimary },
            { label: t("AVG. MASTERY", "متوسط الإتقان"), value: `${Math.round(totals?.avgCoursePercentage ?? 0)}%`, sub: t("All topics", "كل المواضيع"), color: tokens.primary },
            { label: t("NEED ATTENTION", "يحتاج انتباهاً"), value: `${attention.length}`, sub: t("< 40% mastery", "إتقان < 40%"), color: tokens.gap },
            { label: t("AI SESSIONS", "جلسات الذكاء"), value: sessions === null ? "—" : `${sessions}`, sub: t("not tracked yet", "مش متتبعة لسه"), color: tokens.textPrimary },
            { label: t("MISCONCEPTIONS", "مفاهيم خاطئة"), value: `${misList.length}`, sub: t("Distinct, diagnosed", "مميزة ومشخّصة"), color: tokens.gap },
          ].map((tile) => (
            <div key={tile.label} style={{ background: tokens.card, border: `1px solid ${tokens.cardBorder}`, borderRadius: 12, padding: "16px 18px" }}>
              {mono(tile.label, { marginBottom: 8 })}
              <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 21 : 26, color: tile.color, letterSpacing: "-0.03em", marginBottom: 3 }}>{tile.value}</div>
              <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted }}>{tile.sub}</div>
            </div>
          ))}
        </div>

        <div className="genai-grid-2" style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 18 }}>
          <Card tokens={tokens} style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexDirection: isRtl ? "row-reverse" : "row" }}>
              <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em" }}>
                {t("Class-Wide Topic Gaps", "فجوات المواضيع على مستوى الدفعة")}
              </div>
              <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.textFaint }}>{t("ranked by severity", "مرتبة بالخطورة")}</span>
            </div>
            {gaps.length === 0 ? (
              <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textFaint }}>{t("No topic gaps below 65%.", "لا فجوات مواضيع تحت 65%.")}</div>
            ) : (
              gaps.map((topic, i) => (
                <div key={topic.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 0", borderTop: i > 0 ? `1px solid ${tokens.cardBorder}` : "none", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 7, alignItems: "center", fontFamily: bFont, fontSize: 12.5, fontWeight: 500, color: tokens.textPrimary, marginBottom: 6, flexDirection: isRtl ? "row-reverse" : "row" }}>
                      {topic.pct < 40 && <IconWarning size={13} color={tokens.gap} />}
                      {topic.label.en}
                    </div>
                    <MasteryBar pct={topic.pct} evidence={topic.evidence} thin tokens={tokens} />
                  </div>
                  <div style={{ textAlign: isRtl ? "left" : "right", flexShrink: 0, width: 74 }}>
                    <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: masteryColor(masteryLevel(topic.pct, topic.evidence > 0), tokens) }}>{topic.pct}%</div>
                    <div style={{ fontFamily: bFont, fontSize: 10.5, color: tokens.textMuted }}>{topic.students} {t("graded", "مُصحح")}</div>
                  </div>
                  <Btn tokens={tokens} lang={lang} variant="soft" style={{ padding: "6px 12px", fontSize: 11.5, flexShrink: 0 }}
                    onClick={() => setRemedialEntry({ topicId: topic.id })}>
                    {t("Generate", "توليد")}
                  </Btn>
                </div>
              ))
            )}
          </Card>

          <Card tokens={tokens} style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexDirection: isRtl ? "row-reverse" : "row" }}>
              <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em" }}>
                {t("Common Misconceptions", "المفاهيم الخاطئة الشائعة")}
              </div>
              <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.textFaint }}>{t("by prevalence", "بالانتشار")}</span>
            </div>
            {misList.length === 0 ? (
              <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textFaint }}>{t("No diagnosed misconceptions in this course.", "لا مفاهيم خاطئة مشخّصة في هذا المقرر.")}</div>
            ) : (
              misList.map((item, i) => (
                <div key={item.code} style={{ padding: "11px 0", borderTop: i > 0 ? `1px solid ${tokens.cardBorder}` : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexDirection: isRtl ? "row-reverse" : "row" }}>
                    <div style={{ minWidth: 0, flex: 1, textAlign: isRtl ? "right" : "left" }}>
                      <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 5, flexDirection: isRtl ? "row-reverse" : "row" }}>
                        <Chip tokens={tokens} tone="peri">{item.code}</Chip>
                        {addressed.has(item.code) && <span style={{ fontFamily: bFont, fontSize: 10.5, color: tokens.textFaint }}>{t("addressed", "عولج")}</span>}
                      </div>
                      <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textPrimary, lineHeight: 1.5, marginBottom: 6 }}>{item.text}</div>
                      <CitationChip label={item.assignmentTitle || t("from graded answers", "من تصحيح الإجابات")} tokens={tokens} />
                    </div>
                    <div style={{ textAlign: isRtl ? "left" : "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: isRtl ? "flex-start" : "flex-end", gap: 6 }}>
                      <div>
                        <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: 18, color: tokens.gap, letterSpacing: "-0.02em" }}>{item.prevalence}</div>
                        <div style={{ fontFamily: bFont, fontSize: 10, color: tokens.textMuted }}>{t("students", "طالباً")}</div>
                      </div>
                      <Btn tokens={tokens} lang={lang} variant="soft" style={{ padding: "6px 12px", fontSize: 11.5 }}
                        onClick={() => setRemedialEntry({ assignmentId: item.assignmentId, misconceptionCode: item.code })}>
                        {t("Generate", "توليد")}
                      </Btn>
                    </div>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>

        <Card tokens={tokens} style={{ padding: "18px 20px", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
            <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em" }}>
              {t("Students Requiring Attention", "طلاب يحتاجون انتباهاً")}
            </div>
            <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.gap, background: tokens.gapBg, border: `1px solid ${tokens.gap}44`, borderRadius: 6, padding: "3px 9px" }}>
              {t(`avg. mastery < 40% · ${attention.length} students`, `متوسط إتقان < 40% · ${attention.length} طلاب`)}
            </span>
          </div>
          {attention.length === 0 ? (
            <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textFaint }}>{t("No students below 40% average mastery right now.", "لا طلاب تحت متوسط 40% حالياً.")}</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: mobile ? 640 : undefined }}>
                <thead>
                  <tr>
                    <Th tokens={tokens}>{t("STUDENT", "الطالب")}</Th>
                    <Th tokens={tokens}>{t("EMAIL", "البريد")}</Th>
                    <Th tokens={tokens}>{t("AVG. MASTERY", "متوسط الإتقان")}</Th>
                    <Th tokens={tokens}>{t("PRIMARY GAPS", "الفجوات الأساسية")}</Th>
                    <Th tokens={tokens} align="right">{t("SUBMISSIONS", "التسليمات")}</Th>
                    <Th tokens={tokens} align="right">{t("ACTION", "إجراء")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {attention.map((student, i) => (
                    <tr key={student.id} style={{ borderBottom: i < attention.length - 1 ? `1px solid ${tokens.cardBorder}` : "none" }}>
                      <td style={{ padding: "11px 10px" }}>
                        <div style={{ display: "flex", gap: 9, alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
                          <span style={{ width: 26, height: 26, borderRadius: "50%", background: tokens.primaryLight, border: `1px solid ${tokens.citationBorder}`, color: tokens.primary, fontFamily: MONO, fontSize: 9.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {String(student.name).split(" ").map((w) => w[0]).slice(0, 2).join("")}
                          </span>
                          <span style={{ fontFamily: bFont, fontSize: 12.5, fontWeight: 600, color: tokens.textPrimary, whiteSpace: "nowrap" }}>{student.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "11px 10px", fontFamily: MONO, fontSize: 11, color: tokens.textMuted, whiteSpace: "nowrap" }}>{student.email || "—"}</td>
                      <td style={{ padding: "11px 10px", minWidth: 130 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <div style={{ flex: 1 }}><MasteryBar pct={student.avg} evidence={1} thin tokens={tokens} /></div>
                          <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700, color: masteryColor(masteryLevel(student.avg, true), tokens) }}>{student.avg}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "11px 10px", fontFamily: bFont, fontSize: 12, color: tokens.textSecondary }}>
                        {[...student.codes].join(", ") || "—"}
                      </td>
                      <td style={{ padding: "11px 10px", textAlign: "right", fontFamily: MONO, fontSize: 12, color: tokens.textSecondary }}>{student.submissions}</td>
                      <td style={{ padding: "11px 10px", textAlign: "right" }}>
                        <Btn tokens={tokens} lang={lang} variant="soft" style={{ padding: "6px 12px", fontSize: 11.5 }}
                          onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.INSTRUCTOR_STUDENTS, studentId: student.id, courseId })}>
                          {t("Intervene", "تدخل")}
                        </Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card tokens={tokens} style={{ padding: "18px 20px", marginBottom: 18 }}>
          <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em", marginBottom: 12 }}>
            {t("Material Coverage Alerts", "تنبيهات تغطية المواد")}
          </div>
          {coverageGaps.length === 0 ? (
            <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textFaint }}>
              {t("Every topic is referenced by at least one assignment question.", "كل موضوع مرتبط بسؤال تكليف واحد على الأقل.")}
            </div>
          ) : (
            coverageGaps.map((item, i) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, padding: "11px 0", borderTop: i > 0 ? `1px solid ${tokens.cardBorder}` : "none", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", fontFamily: bFont, fontSize: 12.5, fontWeight: 500, color: tokens.textPrimary, flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <IconWarning size={14} color={tokens.gap} />
                  {item.label.en}
                  <span style={{ fontFamily: MONO, fontSize: 11, color: tokens.textMuted }}>· 0 {t("questions", "أسئلة")}</span>
                </div>
                <Btn tokens={tokens} lang={lang} variant="soft" style={{ padding: "7px 14px", fontSize: 11.5 }}
                  onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.COURSE_WORKSPACE, courseId, tab: "materials" })}>
                  {t("Open materials", "فتح المواد")}
                </Btn>
              </div>
            ))
          )}
        </Card>

        <Card tokens={tokens} style={{ padding: "18px 20px" }}>
          <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em", marginBottom: 14 }}>
            {t("Course-Wide Mastery Distribution", "توزيع الإتقان على مستوى المقرر")}
          </div>
          {gaps.length === 0 ? (
            <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textFaint }}>{t("No topics below 65% — nothing to flag.", "مفيش مواضيع تحت 65% — مفيش حاجة تتعلم.")}</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
              {gaps.map((topic) => {
                const level = masteryLevel(topic.pct, topic.evidence > 0);
                return (
                  <div key={topic.id} style={{ background: masteryBg(level, tokens), border: `1px solid ${masteryColor(level, tokens)}33`, borderRadius: 10, padding: "14px 12px", textAlign: "center" }}>
                    <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: 20, color: masteryColor(level, tokens), letterSpacing: "-0.02em", marginBottom: 4 }}>{topic.pct}%</div>
                    <div style={{ fontFamily: bFont, fontSize: 11, color: tokens.textPrimary, marginBottom: 3 }}>{topic.label.en}</div>
                    <div style={{ fontFamily: bFont, fontSize: 10, color: tokens.textMuted }}>{flagged(topic.pct)} {t("flagged", "مُعلَّم")}</div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </AsyncGate>

      <Modal open={exportOpen} onClose={() => setExportOpen(false)} tokens={tokens} lang={lang} width={640}
        title={t("Analytics snapshot report", "تقرير اللقطة التحليلية")}>
        <p style={{ fontFamily: bFont, fontSize: 12, color: tokens.textMuted, marginBottom: 10 }}>
          {t(
            "Plain-text report — copy it or download. Mirrors the same precomputed snapshot shown above.",
            "تقرير نصي جاهز — انسخه أو نزّله. يعكس نفس اللقطة المحسوبة مسبقاً المعروضة بالأعلى.",
          )}
        </p>
        <pre style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.65, color: tokens.textSecondary, background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, padding: "14px 16px", margin: 0, maxHeight: 340, overflow: "auto", whiteSpace: "pre-wrap", textAlign: "left", direction: "ltr", userSelect: "text" }}>{exportText}</pre>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14, flexWrap: "wrap" }}>
          <Btn tokens={tokens} lang={lang} variant="soft" onClick={copyExport}>
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><IconCheck size={13} />{t("Copy report", "نسخ التقرير")}</span>
          </Btn>
          <Btn tokens={tokens} lang={lang} variant="solid" onClick={downloadExport}>
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><IconDownload size={13} />{t("Download .txt", "تنزيل .txt")}</span>
          </Btn>
        </div>
      </Modal>

      <RealRemedialModal open={remedialEntry !== null} onClose={() => setRemedialEntry(null)} entry={remedialEntry}
        courseId={courseId} tokens={tokens} lang={lang} onPublished={reload} />
    </div>
  );
}

export default function CourseAnalyticsTab(props) {
  if (demoMode()) return <DemoCourseAnalyticsTab {...props} />;
  return <RealCourseAnalyticsTab {...props} />;
}
