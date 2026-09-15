import { useState } from "react";
import { MONO } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import { STUDENTS, studentTopicMastery } from "@/data/instructorModule";
import { useInstructorModule } from "@/store/InstructorProvider";
import { Modal, Btn, textareaStyle, bFontFor, toast } from "@/components/ModuleUI";
import { IconWarning, IconSparkle } from "@/components/Icons";
import RemedialModal from "@/components/RemedialModal";

export default function StudentInterventionModal({ open, onClose, studentId, courseId, tokens, lang, onOpenFile }) {
  const { state: mod } = useInstructorModule();
  const mobile = useMediaQuery("(max-width: 760px)");
  const bFont = bFontFor(lang);
  const isRtl = lang === "ar";
  const [note, setNote] = useState("");
  const [remedialFor, setRemedialFor] = useState(null);

  const student = STUDENTS.find((s) => s.id === studentId) ?? null;
  const course = mod.courses.find((c) => c.id === courseId);
  if (!student || !course) return <RemedialModal open={false} onClose={() => setRemedialFor(null)} entry={null} tokens={tokens} lang={lang} />;

  const units = mod.units.filter((u) => u.studentId === student.id && u.courseId === courseId);
  const pending = units.filter((u) => u.status === "awaiting_review" || u.status === "resubmission_requested");
  const gapTopics = student.gaps.map((g) => course.topics.find((t) => t.id === g)).filter(Boolean);
  const primary = gapTopics.sort((a, b) => studentTopicMastery(student, a) - studentTopicMastery(student, b))[0];

  const mono = (t) => (
    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.09em", color: tokens.textMuted, margin: "0 0 7px" }}>{t}</div>
  );

  return (
    <>
      <Modal open={open} onClose={onClose} tokens={tokens} lang={lang} width={560}
        title={lang === "ar" ? `خطة تدخل — ${student.name}` : `Intervention — ${student.name}`}
        subtitle={`${course.id} · ${lang === "ar" ? "دفعة" : "cohort"} ${student.cohort} · ID ${student.studentNumber}`}>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
          {[
            { l: lang === "ar" ? "متوسط الإتقان" : "AVG MASTERY", v: `${student.avg}%` },
            { l: lang === "ar" ? "جلسات الذكاء" : "AI SESSIONS", v: `${student.sessions}` },
            { l: lang === "ar" ? "معلّق الآن" : "OPEN NOW", v: `${pending.length}` },
            { l: lang === "ar" ? "الاتجاه" : "TREND", v: student.trend },
          ].map((t) => (
            <div key={t.l} style={{ background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.08em", color: tokens.textMuted, marginBottom: 4 }}>{t.l}</div>
              <div style={{ fontFamily: bFont, fontSize: 14, fontWeight: 700, color: tokens.textPrimary }}>{t.v}</div>
            </div>
          ))}
        </div>

        {mono(lang === "ar" ? "الفجوات الأساسية" : "PRIMARY GAPS")}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {gapTopics.map((t) => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "9px 12px", background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, flexDirection: isRtl ? "row-reverse" : "row" }}>
              <span style={{ display: "inline-flex", gap: 7, alignItems: "center", fontFamily: bFont, fontSize: 12.5, color: tokens.textPrimary, flexDirection: isRtl ? "row-reverse" : "row" }}>
                <IconWarning size={13} color={tokens.gap} />
                {lang === "ar" ? t.label.ar : t.label.en}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700, color: tokens.gap }}>
                {studentTopicMastery(student, t)}%
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14, flexDirection: isRtl ? "row-reverse" : "row" }}>
          <Btn tokens={tokens} lang={lang} variant="soft" disabled={!primary}
            onClick={() => setRemedialFor({ courseId, topicId: primary.id })}>
            <IconSparkle size={13} color={tokens.primary} />
            {lang === "ar" ? `توليد علاج لأهم فجوة (${primary?.short ?? "—"})` : `Generate remedial for primary gap (${primary?.short ?? "—"})`}
          </Btn>
          {onOpenFile && (
            <Btn tokens={tokens} lang={lang} variant="ghost" onClick={() => { onClose(); onOpenFile(student.id); }}>
              {lang === "ar" ? "فتح ملف الطالب" : "Open student file"}
            </Btn>
          )}
        </div>

        {mono(lang === "ar" ? "ملاحظة تواصل (تُحفظ محلياً في هذه النسخة)" : "OUTREACH NOTE (kept locally in this prototype)")}
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
          placeholder={lang === "ar" ? "مثال: مكتب ساعات المكتب يوم الأحد…" : "e.g. office-hours slot on Sunday…"}
          style={textareaStyle(tokens, bFont)} className="genai-input" />
        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
          <Btn tokens={tokens} lang={lang} disabled={!note.trim()}
            onClick={() => { toast(lang === "ar" ? `صُفّت مذكرة تواصل لـ${student.name}.` : `Outreach note queued for ${student.name}.`); setNote(""); onClose(); }}>
            {lang === "ar" ? "جدولة المذكرة" : "Queue note"}
          </Btn>
          <Btn tokens={tokens} lang={lang} variant="ghost" onClick={onClose}>{lang === "ar" ? "إغلاق" : "Close"}</Btn>
        </div>
      </Modal>
      <RemedialModal open={remedialFor !== null} onClose={() => setRemedialFor(null)} entry={remedialFor} tokens={tokens} lang={lang} />
    </>
  );
}