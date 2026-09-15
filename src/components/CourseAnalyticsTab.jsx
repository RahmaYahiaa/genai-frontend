import { useEffect, useMemo, useState } from "react";
import { tk, MONO, masteryColor, masteryLevel, masteryBg } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useInstructorModule } from "@/store/InstructorProvider";
import { Card, Btn, Chip, Modal, bFontFor, hFontFor, toast, Th, Skeleton } from "@/components/ModuleUI";
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

export default function CourseAnalyticsTab({ state, courseId, dispatch }) {
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
        courseId={courseId} tokens={tokens} lang={lang} />

      <RemedialModal open={remedialEntry !== null} onClose={() => setRemedialEntry(null)} entry={remedialEntry} tokens={tokens} lang={lang} />
    </div>
  );
}