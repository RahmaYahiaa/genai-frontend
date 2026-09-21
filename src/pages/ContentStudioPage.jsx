import { useState } from "react";
import { tk, MONO } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useInstructorModule } from "@/store/InstructorProvider";
import { Card, Btn, Chip, inputStyle, textareaStyle, bFontFor, hFontFor, toast, Skeleton } from "@/components/ModuleUI";
import { IconSparkle, IconDoc, IconPencil, IconImageAttach, IconClipboard, IconSend, IconDoubleCheck, IconInbox, IconRefresh, IconDownload, IconCheck } from "@/components/Icons";
import { INSTRUCTOR_COURSE_IDS } from "@/data/instructorModule";

const TYPES = [
  { id: "text", en: "Text explanation", ar: "شرح نصي", Icon: IconDoc },
  { id: "examples", en: "Worked examples", ar: "أمثلة محلولة", Icon: IconPencil },
  { id: "images", en: "Diagrams & images", ar: "رسوم وصور", Icon: IconImageAttach },
  { id: "video", en: "Video script", ar: "سكريت فيديو", Icon: IconClipboard },
  { id: "audio", en: "Audio narration", ar: "سرد صوتي", Icon: IconSend },
  { id: "quiz", en: "Practice quiz", ar: "كويز تدريبي", Icon: IconDoubleCheck },
  { id: "slides", en: "Slide deck outline", ar: "هيكل سلايدز", Icon: IconInbox },
  { id: "flashcards", en: "Flashcards", ar: "بطاقات مراجعة", Icon: IconRefresh },
];

function videoScenes() {
  return [
    { time: "0:00–0:40", visual: "title card over the structure diagram", narration: "why this topic earns four minutes" },
    { time: "0:40–1:50", visual: "animated trace, one step per cut", narration: "the governing condition, spoken once, shown twice" },
    { time: "1:50–3:10", visual: "side-by-side failure case", narration: "the misconception, named plainly" },
    { time: "3:10–4:20", visual: "summary card + one check question", narration: "what to try next in the practice set" },
  ];
}

function generateDraft(type, topicLabel, courseId, length, tone, extra) {
  const deep = length === "deep" ? 3 : length === "short" ? 1 : 2;
  const head = `${topicLabel} — ${TYPES.find((t) => t.id === type)?.en}`;
  const toneLine = tone === "exam" ? "Every claim is tied to a past-paper style question." : tone === "friendly" ? "Conversational tone, one intuition before every definition." : "Formal textbook register.";
  const extraLine = extra.trim() ? `\nInstructor note folded in: ${extra.trim()}` : "";
  switch (type) {
    case "text":
      return [head, "", toneLine, ...Array.from({ length: deep }, (_, i) => `\n§${i + 1}. ${["The governing invariant of " + topicLabel, "Where students typically slip, and why", "Connecting " + topicLabel + " to the rest of " + courseId][i]}\n${"A tight paragraph grounded on the approved course material, stating the condition that governs behaviour before any application. ".repeat(i === 0 ? 2 : 1)}`), extraLine].join("\n");
    case "examples":
      return [head, "", toneLine, ...Array.from({ length: deep + 1 }, (_, i) => `\nExample ${i + 1} (${["trace by hand", "break the intuition", "compare two structures", "exam-style twist"][i]}):\nSetup → step-by-step state table → why the governing condition holds → bound check.`), extraLine].join("\n");
    case "images":
      return [head, "", "Three diagram slots, each with alt-text and a caption the layout engine can place:", "\n[DIAGRAM 1] Structure map of " + topicLabel + " — nodes, edges, and the invariant labelled on the edge that carries it.", "\n[DIAGRAM 2] Failure case: the input shape that breaks the naive intuition, annotated at the exact step where it breaks.", "\n[DIAGRAM 3] Cost/benefit quadrant for " + topicLabel + " against its neighbours in " + courseId + ".", extraLine].join("\n");
    case "video":
      return [head, "", "Storyboard — total runtime ~4:20", ...videoScenes().map((s, i) => `\nSCENE ${i + 1} · ${s.time}\nVISUAL: ${s.visual}\nNARRATION: ${s.narration}`), extraLine].join("\n");
    case "audio":
      return [head, "", "VOICEOVER READY · ~2:30 · single speaker, calm pace", "\n" + `Listen for the condition, not the example: in ${topicLabel}, what governs behaviour is the internal invariant, not the shape of the input. `.repeat(deep + 1) + "\n\n[pause 0.8s] Close with: one question to answer before the next lecture.", extraLine].join("\n");
    case "quiz":
      return [head, "", `${deep + 2} questions, answers folded at the end.`, ...Array.from({ length: deep + 2 }, (_, i) => `\nQ${i + 1}. ${["Trace", "Predict", "Explain", "Compare", "Debug"][i % 5]}: ${topicLabel} — ${["a minimal input, state after each step", "the outcome before computing it, then verify", "why the governing condition is necessary", "against its closest neighbour structure", "a worked solution containing a deliberate error"][i % 5]}.`), "\nANSWER KEY: graded on naming the governing condition first, arithmetic second.", extraLine].join("\n");
    case "slides":
      return [head, "", `${deep + 4} slides, one idea each.`, ...Array.from({ length: deep + 4 }, (_, i) => `\nSLIDE ${i + 1} — ${["Title + the one question this deck answers", "The structure, labelled", "The governing condition (one sentence, huge type)", "Worked trace", "The failure case", "Cost/benefit", "Where to practise"][i]}\n• bullet · bullet · bullet`), extraLine].join("\n");
    case "flashcards":
      return [head, "", `${(deep + 2) * 2} cards, front → back.`, ...Array.from({ length: deep + 2 }, (_, i) => [`\nCARD ${i * 2 + 1} (front): What condition governs ${topicLabel}?`, `\nCARD ${i * 2 + 2} (front): Give the canonical failure case for ${topicLabel}.`].map((f, j) => `${f}\n→ back: ${j === 0 ? "the internal invariant, stated in one sentence" : "the input shape that breaks the naive intuition, and the step where it breaks"}`).join("")), extraLine].join("\n");
  }
}

export default function ContentStudioPage({ state }) {
  const { state: mod, addMaterial } = useInstructorModule();
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);

  const [courseId, setCourseId] = useState(INSTRUCTOR_COURSE_IDS.includes(state.courseId) ? state.courseId : "CS301");
  const course = mod.courses.find((c) => c.id === courseId) ?? mod.courses[0];
  const [topicId, setTopicId] = useState(course.topics[0]?.id ?? "");
  const [customTopic, setCustomTopic] = useState("");
  const [type, setType] = useState("text");
  const [length, setLength] = useState("medium");
  const [tone, setTone] = useState("formal");
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(null);
  const [draftType, setDraftType] = useState("text");
  const [exporting, setExporting] = useState(false);

  const topicLabel = topicId === "__custom" ? (customTopic.trim() || "Untitled topic") : (course.topics.find((t) => t.id === topicId)?.label[lang === "ar" ? "ar" : "en"] ?? topicId);

  const mono = (t) => (
    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.09em", color: tokens.textMuted, marginBottom: 7 }}>{t}</div>
  );

  const generate = () => {
    setBusy(true);
    setDraft(null);
    window.setTimeout(() => {
      setDraft(generateDraft(type, topicLabel, course.id, length, tone, extra));
      setDraftType(type);
      setBusy(false);
      toast(lang === "ar" ? "أُنشئت المسودة — راجعها وعدّلها قبل أي نشر." : "Draft generated — review and edit it before publishing.");
    }, 900);
  };

  const triggerBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const fileBase = () => {
    const slug = (topicId === "__custom" ? "custom" : topicId).replace(/[^a-zA-Z0-9-]/g, "");
    return `${course.id}-${slug}-${draftType}`;
  };

  const drawDiagramPanel = (ctx, x, y, w, h, n) => {
    ctx.fillStyle = tokens.inset;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = tokens.cardBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    const px = (v) => x + (v / 220) * w;
    const py = (v) => y + (v / 90) * h;
    ctx.strokeStyle = tokens.primary;
    ctx.lineWidth = Math.max(2, w / 110);
    ctx.beginPath(); ctx.moveTo(px(44), py(55)); ctx.lineTo(px(96), py(34)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px(124), py(34)); ctx.lineTo(px(176), py(55)); ctx.stroke();
    for (const [cx, cy, label] of [[30, 60, "A"], [110, 30, "B"], [190, 60, "C"]]) {
      ctx.beginPath();
      ctx.arc(px(cx), py(cy), (14 / 220) * w, 0, Math.PI * 2);
      ctx.fillStyle = tokens.primaryLight;
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = tokens.primary;
      ctx.font = `700 ${Math.round(w / 22)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, px(cx), py(cy));
    }
    ctx.fillStyle = tokens.textMuted;
    ctx.font = `${Math.round(w / 44)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(`slot ${n} · invariant labelled on the carrying edge`, x + w / 2, y + h - 10);
  };

  const wrapText = (ctx, text, x, y, maxW, lh) => {
    const words = text.split(" ");
    let line = "";
    let yy = y;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, yy);
        line = w;
        yy += lh;
      } else line = test;
    }
    if (line) ctx.fillText(line, x, yy);
    return yy;
  };

  const downloadImages = () => {
    const s = 3;
    const pad = 24;
    const pw = 220 * s;
    const ph = 90 * s;
    const gap = 28;
    const canvas = document.createElement("canvas");
    canvas.width = pw + pad * 2;
    canvas.height = ph * 3 + gap * 2 + pad * 2;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = tokens.card;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let n = 1; n <= 3; n++) drawDiagramPanel(ctx, pad, pad + (n - 1) * (ph + gap), pw, ph, n);
    canvas.toBlob((b) => {
      if (!b) {
        toast(lang === "ar" ? "تعذر تصدير الصورة." : "Image export failed.");
        return;
      }
      triggerBlob(b, `${fileBase()}.png`);
      toast(lang === "ar" ? "بدأ تنزيل الصورة PNG." : "PNG download started.");
    }, "image/png");
  };

  const downloadText = () => {
    try {
      const blob = new Blob([draft], { type: "text/plain;charset=utf-8" });
      triggerBlob(blob, `${fileBase()}.txt`);
      toast(lang === "ar" ? "بدء تنزيل المسودة." : "Draft download started.");
    } catch {
      toast(lang === "ar" ? "التنزيل محجوب هنا — انسخي النص بدلاً منه." : "Download blocked here — copy the text instead.");
    }
  };

  const downloadVideo = async () => {
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
      toast(lang === "ar" ? "متصفحك لا يدعم تسجيل الفيديو — نزّلي الستوري بورد نصياً." : "Your browser cannot record video — downloading the storyboard as text instead.");
      downloadText();
      return;
    }
    setExporting(true);
    toast(lang === "ar" ? "جارٍ تسجيل الفيديو (~8 ثوانٍ)…" : "Recording video (~8 seconds)…");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 960;
      canvas.height = 540;
      const ctx = canvas.getContext("2d");
      const stream = canvas.captureStream(25);
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
      const rec = new MediaRecorder(stream, { mimeType });
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      const stopped = new Promise((res) => { rec.onstop = res; });
      const scenes = videoScenes();
      const drawScene = (sc, i) => {
        ctx.fillStyle = tokens.card;
        ctx.fillRect(0, 0, 960, 540);
        ctx.fillStyle = tokens.primary;
        ctx.fillRect(0, 0, 960, 84);
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 30px monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(`SCENE ${i + 1} · ${sc.time}`, 40, 44);
        ctx.fillStyle = tokens.textPrimary;
        ctx.font = "600 34px sans-serif";
        ctx.fillText(topicLabel, 40, 140);
        ctx.fillStyle = tokens.textSecondary;
        ctx.font = "400 26px sans-serif";
        wrapText(ctx, `VISUAL: ${sc.visual}`, 40, 210, 880, 36);
        ctx.fillStyle = tokens.textMuted;
        wrapText(ctx, `NARRATION: ${sc.narration}`, 40, 310, 880, 36);
        ctx.fillStyle = tokens.textFaint;
        ctx.font = "400 20px monospace";
        ctx.fillText(`${course.id} · generated storyboard preview`, 40, 500);
      };
      drawScene(scenes[0], 0);
      rec.start();
      for (let i = 0; i < scenes.length; i++) {
        drawScene(scenes[i], i);
        await new Promise((r) => setTimeout(r, 2000));
      }
      rec.stop();
      await stopped;
      stream.getTracks().forEach((t) => t.stop());
      triggerBlob(new Blob(chunks, { type: "video/webm" }), `${fileBase()}.webm`);
      toast(lang === "ar" ? "بدأ تنزيل الفيديو WebM." : "WebM video download started.");
    } catch {
      toast(lang === "ar" ? "فشل تسجيل الفيديو — جرّبي التنزيل النصي." : "Video recording failed — try the text download.");
    }
    setExporting(false);
  };

  const previewAudio = () => {
    if (!("speechSynthesis" in window)) {
      toast(lang === "ar" ? "المعاينة الصوتية غير مدعومة في هذا المتصفح." : "Audio preview is unsupported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(draft.replace(/\[.*?\]/g, " "));
    u.lang = lang === "ar" ? "ar-SA" : "en-US";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
    toast(lang === "ar" ? "جارٍ التشغيل بصوت المتصفح — السكريت نفسه قابل للتنزيل." : "Playing with the browser voice — the script itself stays downloadable.");
  };

  const downloadNative = () => {
    if (draftType === "images") downloadImages();
    else if (draftType === "video") downloadVideo();
    else downloadText();
  };

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      toast(lang === "ar" ? "تم نسخ المسودة." : "Draft copied.");
    } catch {
      toast(lang === "ar" ? "انسخي النص المحدد يدوياً (Ctrl+C)." : "Select the text and copy manually (Ctrl+C).");
    }
  };  const Diagram = ({ n }) => (
    <svg viewBox="0 0 220 90" width="100%" height="90" role="img" aria-label={`diagram ${n}`} style={{ borderRadius: 10, border: `1px solid ${tokens.cardBorder}`, background: tokens.inset }}>
      {[30, 110, 190].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy={i === 1 ? 30 : 60} r={14} fill={tokens.primaryLight} stroke={tokens.primary} strokeWidth="1.5" />
          <text x={x} y={(i === 1 ? 30 : 60) + 4} textAnchor="middle" fontSize="10" fill={tokens.primary} fontFamily="monospace">{["A", "B", "C"][i]}</text>
        </g>
      ))}
      <line x1={44} y1={55} x2={96} y2={34} stroke={tokens.primary} strokeWidth="1.5" />
      <line x1={124} y1={34} x2={176} y2={55} stroke={tokens.primary} strokeWidth="1.5" />
      <text x={110} y={84} textAnchor="middle" fontSize="8" fill={tokens.textMuted} fontFamily="monospace">{`slot ${n} · invariant labelled on the carrying edge`}</text>
    </svg>
  );

  return (
    <div className="genai-pad" style={{ padding: "26px 32px", maxWidth: 1180, margin: "0 auto", direction: isRtl ? "rtl" : "ltr" }}>
      <div style={{ marginBottom: 20, textAlign: isRtl ? "right" : "left" }}>
        <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: "0 0 3px", display: "flex", gap: 10, alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
          <IconSparkle size={18} color={tokens.primary} />
          {lang === "ar" ? "صانع المحتوى" : "Content Builder"}
        </h1>
        <p style={{ fontSize: 13, color: tokens.textMuted, margin: 0, fontFamily: bFont }}>
          {lang === "ar"
            ? "ولِّد محتوى تعليميًا بأي صيغة — لأي موضوع، من خريطة المقرر أو موضوع حرّ تكتبه بنفسك."
            : "Generate teaching content in any form — for any topic, course-mapped or free-form."}
        </p>
      </div>

      <div className="genai-grid-builder" style={{ display: "grid", gridTemplateColumns: mobile ? "minmax(0, 1fr)" : "minmax(0, 1fr) minmax(0, 1.15fr)", gap: 24, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card tokens={tokens} style={{ padding: "18px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 14 }}>
              <div>
                {mono(lang === "ar" ? "المقرر" : "COURSE")}
                <select value={courseId} onChange={(e) => { setCourseId(e.target.value); setTopicId(""); setDraft(null); }} style={{ ...inputStyle(tokens, bFont), cursor: "pointer" }} className="genai-input">
                  {mod.courses.filter((c) => INSTRUCTOR_COURSE_IDS.includes(c.id)).map((c) => (
                    <option key={c.id} value={c.id}>{c.id} · {lang === "ar" ? c.title.ar : c.title.en}</option>
                  ))}
                </select>
              </div>
              <div>
                {mono(lang === "ar" ? "الموضوع" : "TOPIC")}
                <select value={topicId} onChange={(e) => { setTopicId(e.target.value); setDraft(null); }} style={{ ...inputStyle(tokens, bFont), cursor: "pointer" }} className="genai-input">
                  <option value="">{lang === "ar" ? "اختر…" : "Choose…"}</option>
                  {course.topics.map((t) => (
                    <option key={t.id} value={t.id}>{lang === "ar" ? t.label.ar : t.label.en}</option>
                  ))}
                  <option value="__custom">{lang === "ar" ? "موضوع حر…" : "Free-form topic…"}</option>
                </select>
              </div>
            </div>
            {topicId === "__custom" && (
              <div style={{ marginTop: 12 }}>
                {mono(lang === "ar" ? "اكتبي الموضوع الحر" : "FREE-FORM TOPIC")}
                <input value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} placeholder={lang === "ar" ? "مثال: amortized analysis" : "e.g. amortized analysis"} style={inputStyle(tokens, bFont)} className="genai-input" />
              </div>
            )}
          </Card>

          <Card tokens={tokens} style={{ padding: "18px 20px" }}>
            {mono(lang === "ar" ? "نوع المحتوى" : "CONTENT TYPE")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {TYPES.map((t) => {
                const on = t.id === type;
                return (
                  <button key={t.id} onClick={() => setType(t.id)}
                    style={{
                      display: "flex", gap: 10, alignItems: "center", padding: "11px 12px", borderRadius: 10, cursor: "pointer",
                      background: on ? tokens.primaryLight : tokens.card,
                      border: `1px solid ${on ? tokens.primary : tokens.cardBorder}`,
                      color: on ? tokens.primary : tokens.textSecondary,
                      fontFamily: bFont, fontSize: 12.5, fontWeight: on ? 600 : 500,
                      flexDirection: isRtl ? "row-reverse" : "row", textAlign: isRtl ? "right" : "left",
                    }}>
                    <t.Icon size={15} color={on ? tokens.primary : tokens.textMuted} />
                    {lang === "ar" ? t.ar : t.en}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 14, marginTop: 14 }}>
              <div>
                {mono(lang === "ar" ? "الطول" : "LENGTH")}
                <select value={length} onChange={(e) => setLength(e.target.value)} style={{ ...inputStyle(tokens, bFont), cursor: "pointer" }} className="genai-input">
                  <option value="short">{lang === "ar" ? "قصير" : "Short"}</option>
                  <option value="medium">{lang === "ar" ? "متوسط" : "Medium"}</option>
                  <option value="deep">{lang === "ar" ? "معمّق" : "Deep"}</option>
                </select>
              </div>
              <div>
                {mono(lang === "ar" ? "النبرة" : "TONE")}
                <select value={tone} onChange={(e) => setTone(e.target.value)} style={{ ...inputStyle(tokens, bFont), cursor: "pointer" }} className="genai-input">
                  <option value="formal">{lang === "ar" ? "أكاديمية" : "Formal"}</option>
                  <option value="friendly">{lang === "ar" ? "ودودة" : "Friendly"}</option>
                  <option value="exam">{lang === "ar" ? "تركيز امتحاني" : "Exam-focused"}</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              {mono(lang === "ar" ? "تعليمات إضافية (اختياري)" : "EXTRA INSTRUCTIONS (OPTIONAL)")}
              <textarea value={extra} onChange={(e) => setExtra(e.target.value)} rows={2} placeholder={lang === "ar" ? "مثال: ركّزي على مقارنة التعقيدات." : "e.g. emphasise the complexity comparison."} style={textareaStyle(tokens, bFont)} className="genai-input" />
            </div>
            <Btn tokens={tokens} lang={lang} onClick={generate} disabled={busy || !topicId || (topicId === "__custom" && !customTopic.trim())} style={{ width: "100%", padding: "11px 0", fontSize: 13, marginTop: 14 }}>
              <IconSparkle size={14} color="#fff" />
              {busy ? (lang === "ar" ? "جارٍ التوليد…" : "Generating…") : (lang === "ar" ? "توليد المحتوى" : "Generate content")}
            </Btn>
          </Card>
        </div>

        <div>
          {busy ? (
            <Card tokens={tokens} style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              <Skeleton h={20} w="50%" tokens={tokens} />
              <Skeleton h={12} tokens={tokens} />
              <Skeleton h={12} w="90%" tokens={tokens} />
              <Skeleton h={120} tokens={tokens} />
              <div style={{ fontFamily: MONO, fontSize: 10, color: tokens.textFaint, textAlign: "center" }}>
                {lang === "ar" ? "استدعاء توليد حقيقي — ثوانٍ" : "real generation call — a few seconds"}
              </div>
            </Card>
          ) : draft ? (
            <Card tokens={tokens} style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10, flexDirection: isRtl ? "row-reverse" : "row" }}>
                <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em" }}>
                  <span style={{ display: "inline-flex", verticalAlign: "middle", marginInlineEnd: 8 }}><IconSparkle size={14} color={tokens.primary} /></span>
                  {topicLabel}
                </div>
                <Chip tokens={tokens} tone="peri">{lang === "ar" ? "مسودة" : "Draft"}</Chip>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.08em", color: tokens.textMuted, marginBottom: 12 }}>
                {lang === "ar" ? "مسودة مولّدة — لا تُنشر ولا تُرسل لأحد تلقائياً" : "GENERATED DRAFT — NEVER AUTO-PUBLISHED OR AUTO-SENT"}
              </div>

              {draftType === "images" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
                  <Diagram n={1} /><Diagram n={2} /><Diagram n={3} />
                </div>
              )}

              <div style={{ background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, padding: "12px 14px", maxHeight: 300, overflowY: "auto", fontFamily: MONO, fontSize: 11.5, lineHeight: 1.7, color: tokens.textSecondary, whiteSpace: "pre-wrap", marginBottom: 12 }}>
                {draft}
              </div>

              {mono(lang === "ar" ? "مسودة قابلة للتحرير" : "EDITABLE DRAFT")}
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={5} style={textareaStyle(tokens, bFont)} className="genai-input" />

              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                <Btn tokens={tokens} lang={lang} variant="soft"
                  onClick={() => { if (topicId !== "__custom") { addMaterial(course.id, topicId, `[AI draft] ${topicLabel} — ${TYPES.find((t) => t.id === draftType)?.en}`); toast(lang === "ar" ? "أُضيفت كمادة قيد الاعتماد في تغطية المقرر." : "Filed as pending material in the course coverage list."); } else { toast(lang === "ar" ? "الموضوع الحر لا يُضاف لتغطية المقرر — احفظه كمسودة." : "Free-form topics cannot join course coverage — kept as draft."); } }}
                  disabled={topicId === "__custom" || topicId === ""}>
                  {lang === "ar" ? "إضافة لمواد المقرر (قيد الاعتماد)" : "Add to course materials (pending)"}
                </Btn>
                <Btn tokens={tokens} lang={lang} variant="soft" disabled={exporting} onClick={downloadNative}>
                  <IconDownload size={13} color={tokens.primary} />
                  {exporting
                    ? (lang === "ar" ? "جارٍ التصدير…" : "Exporting…")
                    : draftType === "images"
                      ? (lang === "ar" ? "تنزيل الصور PNG" : "Download PNG")
                      : draftType === "video"
                        ? (lang === "ar" ? "تنزيل الفيديو WebM" : "Download WebM video")
                        : (lang === "ar" ? "تنزيل .txt" : "Download .txt")}
                </Btn>
                {draftType === "audio" && (
                  <Btn tokens={tokens} lang={lang} variant="ghost" onClick={previewAudio}>
                    <IconSend size={13} />
                    {lang === "ar" ? "معاينة صوتية" : "Audio preview"}
                  </Btn>
                )}
                <Btn tokens={tokens} lang={lang} variant="ghost" onClick={copyDraft}>
                  <IconCheck size={13} />
                  {lang === "ar" ? "نسخ" : "Copy"}
                </Btn>
                <Btn tokens={tokens} lang={lang} variant="ghost" onClick={() => toast(lang === "ar" ? "المسودة محفوظة في الجلسة." : "Draft kept in this session.")}>
                  {lang === "ar" ? "حفظ المسودة" : "Save draft"}
                </Btn>
                <Btn tokens={tokens} lang={lang} variant="ghost" onClick={() => setDraft(null)}>
                  {lang === "ar" ? "تجاهل" : "Discard"}
                </Btn>
              </div>
            </Card>
          ) : (
            <Card tokens={tokens} style={{ padding: "34px 24px", textAlign: "center" }}>
              <div style={{ display: "inline-flex", width: 44, height: 44, borderRadius: "50%", background: tokens.primaryLight, border: `1px solid ${tokens.citationBorder}`, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <IconSparkle size={18} color={tokens.primary} />
              </div>
              <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, marginBottom: 4 }}>
                {lang === "ar" ? "اختر موضوعًا وصيغة وابدأ التوليد" : "Pick a topic and a format to start"}
              </div>
              <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.6 }}>
                {lang === "ar"
                  ? "يصل كل ناتج كمسودة قابلة للتعديل — ولا يصل شيء إلى الطلاب إلا بعد نقرك نشر."
                  : "Everything is generated as an editable draft — nothing reaches students until you publish."}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}