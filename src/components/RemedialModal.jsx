import { useEffect, useMemo, useState } from "react";
import { MONO } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import { COURSES, STUDENTS, misconceptionText, INSTRUCTOR_COURSE_IDS } from "@/data/instructorModule";
import { useInstructorModule } from "@/store/InstructorProvider";
import { Modal, Btn, Chip, ConfirmBtn, inputStyle, textareaStyle, bFontFor, toast } from "@/components/ModuleUI";

let draftSeq = 0;
const newDraftId = () => `rem-${++draftSeq}-${Date.now().toString(36)}`;

function draftBody(entry, type, lang) {
  const course = COURSES.find((c) => c.id === entry.courseId);
  const topic = course?.topics.find((t) => t.id === entry.topicId);
  const topicLabel = topic ? (lang === "ar" ? topic.label.ar : topic.label.en) : entry.topicId;
  const mis = entry.misconceptionId ? misconceptionText(entry.misconceptionId, lang) : null;
  if (type === "explanation") {
    return [
      lang === "ar" ? `شرح مركّز: ${topicLabel}` : `Focused explanation: ${topicLabel}`,
      "",
      mis
        ? (lang === "ar"
            ? `الفكرة الأساسية في أسطر قليلة، ثم مثال محلول يعالج مباشرة الالتباس الشائع: ${mis}.`
            : `The core idea in a few lines, then a worked example that directly addresses the common confusion: ${mis}.`)
        : (lang === "ar"
            ? `الفكرة الأساسية في أسطر قليلة، ثم مثال محلول يبدأ من أدنى فجوة إتقان مسجّلة في هذا الموضوع.`
            : `The core idea in a few lines, then a worked example starting from the lowest recorded mastery gap in this topic.`),
      "",
      lang === "ar" ? `ينتهي بملخص من 3 نقاط وسؤال تحقق سريع واحد.` : `Ends with a 3-point summary and one quick check question.`,
    ].join("\n");
  }
  return [
    lang === "ar" ? `تدريب إضافي: ${topicLabel}` : `Extra practice: ${topicLabel}`,
    "",
    lang === "ar"
      ? `ثلاثة أسئلة متدرّجة على نفس الموضوع، يبدأ كل سؤال منها من نقطة الالتباس المرصودة ويطلب تبريراً مكتوباً.`
      : `Three graduated questions on the same topic; each starts from the observed confusion and asks for a written justification.`,
    "",
    lang === "ar" ? `ينتهي بسلّم تقييم مختصر (3 مستويات) لكل سؤال.` : `Ends with a short 3-level rubric per question.`,
  ].join("\n");
}

function RadioRow({ on, title, sub, onClick, tokens, lang }) {
  const bFont = bFontFor(lang);
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: lang === "ar" ? "right" : "left",
        padding: "12px 14px", borderRadius: 10, cursor: "pointer",
        background: on ? tokens.primaryLight : tokens.card,
        border: `1px solid ${on ? tokens.primary : tokens.cardBorder}`,
        flexDirection: lang === "ar" ? "row-reverse" : "row",
      }}
    >
      <span style={{ width: 15, height: 15, borderRadius: "50%", border: `2px solid ${on ? tokens.primary : tokens.textFaint}`, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        {on && <span style={{ width: 7, height: 7, borderRadius: "50%", background: tokens.primary }} />}
      </span>
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", fontFamily: bFont, fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>{title}</span>
        {sub && <span style={{ display: "block", fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted, marginTop: 2 }}>{sub}</span>}
      </span>
    </button>
  );
}

export default function RemedialModal({ open, onClose, entry, tokens, lang }) {
  const { state: mod, saveRemedial, publishRemedial, discardRemedial } = useInstructorModule();
  const mobile = useMediaQuery("(max-width: 760px)");
  const bFont = bFontFor(lang);
  const isRtl = lang === "ar";

  const [courseId, setCourseId] = useState(entry?.courseId ?? "CS301");
  const [topicId, setTopicId] = useState(entry?.topicId ?? "");
  const [type, setType] = useState("explanation");
  const [draft, setDraft] = useState(null);
  const [audience, setAudience] = useState("affected");
  const [manualIds, setManualIds] = useState([]);

  useEffect(() => {
    if (!open || !entry) return;
    setCourseId(entry.courseId);
    setTopicId(entry.topicId);
    setType("explanation");
    setDraft(null);
    setAudience(entry.misconceptionId ? "affected" : "all");
    setManualIds([]);
  }, [open, entry]);

  const course = COURSES.find((c) => c.id === courseId) ?? COURSES[0];
  const topic = course.topics.find((t) => t.id === topicId);
  const misText = entry?.misconceptionId ? misconceptionText(entry.misconceptionId, lang) : null;

  const affectedCount = useMemo(() => {
    if (entry?.misconceptionId) {
      return new Set(
        mod.units
          .filter((u) => u.courseId === courseId && u.attempts.some((a) => a.eval.misconceptions.includes(entry.misconceptionId)))
          .map((u) => u.studentId)
      ).size;
    }
    return STUDENTS.filter((s) => s.gaps.includes(topicId)).length;
  }, [entry, courseId, topicId, mod.units]);

  const roster = useMemo(() => {
    const names = new Map();
    mod.units.filter((u) => u.courseId === courseId).forEach((u) => names.set(u.studentId, u.studentName));
    return [...names.entries()].map(([id, name]) => ({ id, name }));
  }, [mod.units, courseId]);

  const audienceCount = audience === "all" ? course.enrolled : audience === "affected" ? affectedCount : manualIds.length;

  const mono = (t) => (
    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.09em", color: tokens.textMuted, margin: "14px 0 7px" }}>{t}</div>
  );

  const generate = () => {
    if (!topic) return;
    const d = {
      id: newDraftId(), courseId, topicId, misconceptionId: entry?.misconceptionId,
      type, title: draftBody({ courseId, topicId, misconceptionId: entry?.misconceptionId }, type, lang).split("\n")[0],
      body: draftBody({ courseId, topicId, misconceptionId: entry?.misconceptionId }, type, lang),
      audience, manualIds, status: "draft", createdAt: new Date().toISOString(),
    };
    setDraft(d);
    saveRemedial(d);
  };

  const patchDraft = (patch) => {
    if (!draft) return;
    const next = { ...draft, ...patch };
    setDraft(next);
    saveRemedial(next);
  };

  const publish = () => {
    if (!draft || audienceCount === 0) return;
    patchDraft({ audience, manualIds });
    publishRemedial(draft.id);
    toast(lang === "ar" ? `نُشر المحتوى العلاجي إلى ${audienceCount} طالباً.` : `Remedial content published to ${audienceCount} student${audienceCount === 1 ? "" : "s"}.`);
    onClose();
  };

  const discard = () => {
    if (draft) discardRemedial(draft.id);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} tokens={tokens} lang={lang} width={620}
      title={lang === "ar" ? "توليد محتوى علاجي" : "Generate remedial content"}
      subtitle={
        entry
          ? (lang === "ar" ? `معّبأ مسبقاً من: ${misText ?? (topic ? topic.label.ar : "")}` : `Prefilled from: ${misText ?? (topic ? topic.label.en : "")}`)
          : undefined
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 14 }}>
        <div>
          {mono(lang === "ar" ? "المقرر" : "COURSE")}
          <select
            value={courseId}
            onChange={(e) => { setCourseId(e.target.value); setTopicId(""); setDraft(null); }}
            style={{ ...inputStyle(tokens, bFont), cursor: "pointer" }}
            className="genai-input"
          >
            {COURSES.filter((c) => INSTRUCTOR_COURSE_IDS.includes(c.id)).map((c) => (
              <option key={c.id} value={c.id}>{c.id} · {lang === "ar" ? c.title.ar : c.title.en}</option>
            ))}
          </select>
        </div>
        <div>
          {mono(lang === "ar" ? "الموضوع" : "TOPIC")}
          <select
            value={topicId}
            onChange={(e) => { setTopicId(e.target.value); setDraft(null); }}
            style={{ ...inputStyle(tokens, bFont), cursor: "pointer" }}
            className="genai-input"
          >
            <option value="">{lang === "ar" ? "اختر موضوعاً..." : "Choose a topic..."}</option>
            {course.topics.map((t) => (
              <option key={t.id} value={t.id}>{lang === "ar" ? t.label.ar : t.label.en}</option>
            ))}
          </select>
        </div>
      </div>

      {mono(lang === "ar" ? "نوع المحتوى" : "CONTENT TYPE")}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <RadioRow tokens={tokens} lang={lang} on={type === "explanation"} onClick={() => { setType("explanation"); if (draft) patchDraft({ type: "explanation", body: draftBody({ courseId, topicId, misconceptionId: entry?.misconceptionId }, "explanation", lang) }); }}
          title={lang === "ar" ? "شرح + مثال محلول" : "Explanation + worked example"} />
        <RadioRow tokens={tokens} lang={lang} on={type === "practice"} onClick={() => { setType("practice"); if (draft) patchDraft({ type: "practice", body: draftBody({ courseId, topicId, misconceptionId: entry?.misconceptionId }, "practice", lang) }); }}
          title={lang === "ar" ? "أسئلة تدريب إضافية" : "Extra practice questions"} />
      </div>

      <Btn tokens={tokens} lang={lang} variant="soft" disabled={!topicId} onClick={generate} style={{ width: "100%", padding: "10px 0", fontSize: 12.5, marginTop: 14 }}>
        {lang === "ar" ? "توليد مسودة" : "Generate draft"}
      </Btn>

      {draft && (
        <>
          <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "14px 0 7px", flexDirection: isRtl ? "row-reverse" : "row" }}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.09em", color: tokens.textMuted }}>
              {lang === "ar" ? "مسودة قابلة للتحرير (لا تظهر للطلاب تلقائياً أبداً)" : "EDITABLE DRAFT (NEVER VISIBLE TO STUDENTS AUTOMATICALLY)"}
            </div>
            <Chip tokens={tokens} tone="peri">{lang === "ar" ? "مسودة" : "Draft"}</Chip>
          </div>
          <textarea
            value={draft.body}
            onChange={(e) => patchDraft({ body: e.target.value })}
            rows={7}
            style={textareaStyle(tokens, bFont)}
            className="genai-input"
          />

          {mono(lang === "ar" ? "الجمهور" : "AUDIENCE")}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <RadioRow tokens={tokens} lang={lang} on={audience === "all"} onClick={() => setAudience("all")}
              title={lang === "ar" ? "كل طلاب المقرر" : "All students in course"}
              sub={`${course.enrolled} ${lang === "ar" ? "طالباً" : "students"}`} />
            <RadioRow tokens={tokens} lang={lang} on={audience === "affected"} onClick={() => setAudience("affected")}
              title={lang === "ar" ? "الطلاب المتأثرون فقط" : "Only affected students"}
              sub={`${affectedCount} ${lang === "ar" ? "طالباً من هذا المفهوم الخاطئ" : "students from the misconception"}`} />
            <RadioRow tokens={tokens} lang={lang} on={audience === "manual"} onClick={() => setAudience("manual")}
              title={lang === "ar" ? "طلاب محددون" : "Selected students"}
              sub={audience === "manual" ? `${manualIds.length} ${lang === "ar" ? "محدد" : "selected"}` : undefined} />
          </div>
          {audience === "manual" && (
            <div style={{ maxHeight: 150, overflow: "auto", marginTop: 8, border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, padding: 8 }}>
              {roster.map((s) => (
                <label key={s.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 8px", fontFamily: bFont, fontSize: 12.5, color: tokens.textSecondary, cursor: "pointer", flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <input
                    type="checkbox"
                    checked={manualIds.includes(s.id)}
                    onChange={() => setManualIds((ids) => (ids.includes(s.id) ? ids.filter((x) => x !== s.id) : [...ids, s.id]))}
                  />
                  {s.name}
                </label>
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-start", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
        <Btn tokens={tokens} lang={lang} variant="ghost" onClick={discard}>
          {lang === "ar" ? "تجاهل" : "Discard"}
        </Btn>
        <ConfirmBtn tokens={tokens} lang={lang} variant="solid"
          disabled={!draft || !draft.body.trim() || audienceCount === 0}
          label={lang === "ar" ? `نشر إلى ${audienceCount}` : `Publish to ${audienceCount}`}
          confirmLabel={lang === "ar" ? `اضغط للتأكيد — نشر إلى ${audienceCount}` : `Click again to confirm — publish to ${audienceCount}`}
          onConfirm={publish} />
      </div>
    </Modal>
  );
}