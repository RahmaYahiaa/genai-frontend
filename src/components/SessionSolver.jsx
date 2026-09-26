import { useRef, useState } from "react";
import { bFontFor, inputStyle } from "@/components/ModuleUI";
import { Panel, PrimaryButton, TextButton, STATUS, normCorrectness } from "@/components/study/StudyKit";
import { IconChevronLeft, IconChevronRight } from "@/components/Icons";

/**
 * Voice answers (diagnostic): records with MediaRecorder and submits as
 * base64 to the backend, which transcribes it with the configured
 * transcription provider before evaluation — no mocks involved. Rendered
 * only when the page passes onVoice and the browser supports capture.
 */
function useVoiceRecorder() {
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recordingId, setRecordingId] = useState(null);
  const [error, setError] = useState(null);

  const start = async (questionId) => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) chunksRef.current.push(event.data);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecordingId(questionId);
    } catch (err) {
      setError(err);
      recorderRef.current?.stream?.getTracks()?.forEach((track) => track.stop());
    }
  };

  const stop = (questionId) =>
    new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder) return resolve(null);
      recorder.onstop = () => {
        recorder.stream?.getTracks()?.forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        chunksRef.current = [];
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = String(reader.result ?? "");
          resolve({
            questionId,
            audioBase64: dataUrl.split(",")[1] ?? "",
            audioMimeType: blob.type || "audio/webm",
          });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      };
      recorder.stop();
      setRecordingId(null);
    });

  return { recordingId, error, start, stop };
}

const RESULT_COPY = {
  correct: { en: "Correct", ar: "إجابة صحيحة", tone: "success" },
  partial: { en: "Partly correct", ar: "صحيحة جزئياً", tone: "warning" },
  incorrect: { en: "Not quite", ar: "مش مظبوطة", tone: "danger" },
  unknown: { en: "Marked as not known yet", ar: "اتسجّلت إنك لسه مش عارفها", tone: "warning" },
};

export function EvaluationCard({ evaluation, tokens, lang }) {
  if (!evaluation) return null;
  const key = normCorrectness(evaluation.correctness);
  const copy = RESULT_COPY[key];
  const c = STATUS[copy?.tone ?? "warning"];
  // Only human-written descriptions are shown; raw codes are internal.
  const misconceptions = (evaluation.misconceptions ?? []).filter((m) => typeof m === "object" && m?.description);
  return (
    <div aria-live="polite" style={{ marginTop: 16, padding: "14px 16px", borderRadius: 12, background: c.bg, border: `1px solid ${c.border}` }}>
      {copy && <div style={{ fontSize: 14, fontWeight: 650, color: c.fg, marginBottom: evaluation.feedback ? 6 : 0 }}>{lang === "ar" ? copy.ar : copy.en}</div>}
      {evaluation.feedback && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: tokens.textPrimary }}>{evaluation.feedback}</p>}
      {misconceptions.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 13, color: tokens.textSecondary }}>
          <span style={{ fontWeight: 600 }}>{lang === "ar" ? "راجع: " : "Review: "}</span>
          {misconceptions.map((m) => m.description).join(" ")}
        </div>
      )}
    </div>
  );
}

// One question at a time. Props are unchanged from the previous list-based
// flow, so every page keeps its exact submit / "I don't know" / voice calls.
export function QuestionFlow({ questions, evaluations, answeredIds, responses = {}, busyId, onSubmit, onIdk = null, onVoice = null, tokens, lang, mobile, doneNote }) {
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const [texts, setTexts] = useState({});
  const [viewIndex, setViewIndex] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const voice = useVoiceRecorder();
  const voiceSupported = Boolean(onVoice) && typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== "undefined";
  const total = questions.length;
  const answeredCount = questions.filter((q) => answeredIds.includes(q.id)).length;
  const firstOpen = questions.findIndex((q) => !answeredIds.includes(q.id));
  const allDone = total > 0 && firstOpen === -1;
  const index = viewIndex ?? (allDone ? total - 1 : Math.max(0, firstOpen));
  const question = questions[index];

  const answerOf = (q) => responses[q.id] ?? texts[q.id] ?? "";
  const isRtl = lang === "ar";
  const PrevIcon = isRtl ? IconChevronRight : IconChevronLeft;
  const NextIcon = isRtl ? IconChevronLeft : IconChevronRight;

  if (reviewing) {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 650, color: tokens.textPrimary }}>{t("Your answers", "إجاباتك")}</span>
          <TextButton tokens={tokens} onClick={() => setReviewing(false)}>{doneNote ? t("Back to results", "رجوع للنتيجة") : t("Back", "رجوع")}</TextButton>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {questions.map((q, i) => {
            const done = answeredIds.includes(q.id);
            const ans = answerOf(q);
            return (
              <Panel key={q.id} tokens={tokens} padding={mobile ? 18 : 24}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: tokens.textMuted, marginBottom: 6 }}>{t(`Question ${i + 1} of ${total}`, `سؤال ${i + 1} من ${total}`)}</div>
                <div style={{ fontSize: 15.5, fontWeight: 600, lineHeight: 1.6, color: tokens.textPrimary, marginBottom: 12 }}>{q.prompt}</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: tokens.textSecondary, marginBottom: 6 }}>{t("Your answer", "إجابتك")}</div>
                <div style={{ padding: "12px 14px", borderRadius: 10, background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, fontSize: 14.5, lineHeight: 1.6, color: ans ? tokens.textPrimary : tokens.textMuted, whiteSpace: "pre-wrap" }}>
                  {ans || (done ? t("Marked as not known yet", "اتسجّلت إنك لسه مش عارفها") : t("Not answered", "ما اتجاوبش"))}
                </div>
                <EvaluationCard evaluation={evaluations[q.id] ?? null} tokens={tokens} lang={lang} />
              </Panel>
            );
          })}
        </div>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <TextButton tokens={tokens} onClick={() => { setReviewing(false); window.scrollTo?.({ top: 0, behavior: "smooth" }); }}>{doneNote ? t("Back to results", "رجوع للنتيجة") : t("Back", "رجوع")}</TextButton>
        </div>
      </div>
    );
  }

  if (allDone && viewIndex == null && doneNote) {
    return (
      <div>
        {doneNote}
        <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 14, flexWrap: "wrap" }}>
          <TextButton tokens={tokens} onClick={() => setReviewing(true)}>{t("Review your answers", "راجع إجاباتك")}</TextButton>
          <TextButton tokens={tokens} muted onClick={() => setViewIndex(0)}>{t("Go through them one by one", "راجعهم واحد واحد")}</TextButton>
        </div>
      </div>
    );
  }
  if (!question) return null;
  const answered = answeredIds.includes(question.id);
  const busy = busyId === question.id;
  const recording = voice.recordingId === question.id;
  const text = texts[question.id] ?? "";
  const nextOpen = questions.findIndex((q, i) => i > index && !answeredIds.includes(q.id));
  const navBtn = (off) => ({
    width: 32, height: 32, borderRadius: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0,
    border: `1px solid ${tokens.cardBorder}`, background: tokens.card, cursor: off ? "default" : "pointer", opacity: off ? 0.5 : 1,
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" aria-label={t("Previous question", "السؤال اللي قبله")} title={t("Previous question", "السؤال اللي قبله")} disabled={index === 0} onClick={() => setViewIndex(index - 1)} style={navBtn(index === 0)}>
            <PrevIcon size={16} color={index === 0 ? tokens.textFaint : tokens.textPrimary} />
          </button>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: tokens.textPrimary, minWidth: 96, textAlign: "center" }}>{t(`Question ${index + 1} of ${total}`, `سؤال ${index + 1} من ${total}`)}</span>
          <button type="button" aria-label={t("Next question", "السؤال اللي بعده")} title={t("Next question", "السؤال اللي بعده")} disabled={index >= total - 1} onClick={() => setViewIndex(index + 1)} style={navBtn(index >= total - 1)}>
            <NextIcon size={16} color={index >= total - 1 ? tokens.textFaint : tokens.textPrimary} />
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 13, color: tokens.textMuted }}>{t(`${answeredCount} answered`, `${answeredCount} اتجاوبت`)}</span>
          {answeredCount > 0 && <TextButton tokens={tokens} onClick={() => setReviewing(true)}>{t("All answers", "كل الإجابات")}</TextButton>}
        </div>
      </div>
      <div role="tablist" aria-label={t("Questions", "الأسئلة")} style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {questions.map((q, i) => {
          const done = answeredIds.includes(q.id);
          return (
            <button key={q.id} type="button" role="tab" aria-selected={i === index} aria-label={t(`Question ${i + 1}`, `سؤال ${i + 1}`)} onClick={() => setViewIndex(i)}
              style={{ flex: 1, height: 6, borderRadius: 99, border: "none", padding: 0, cursor: "pointer", background: i === index ? tokens.primary : done ? `${tokens.primary}66` : tokens.cardBorder }} />
          );
        })}
      </div>

      <Panel tokens={tokens} padding={mobile ? 20 : 28}>
        <div style={{ fontSize: mobile ? 16 : 17, fontWeight: 600, lineHeight: 1.6, color: tokens.textPrimary, marginBottom: 16 }}>{question.prompt}</div>
        {answered ? (
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: tokens.textSecondary, marginBottom: 6 }}>{t("Your answer", "إجابتك")}</div>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, fontSize: 14.5, lineHeight: 1.6, color: answerOf(question) ? tokens.textPrimary : tokens.textMuted, whiteSpace: "pre-wrap" }}>
              {answerOf(question) || t("Marked as not known yet", "اتسجّلت إنك لسه مش عارفها")}
            </div>
          </div>
        ) : (
        <textarea
          value={text}
          disabled={answered || busy}
          aria-label={t("Your answer", "إجابتك")}
          onChange={(e) => setTexts((prev) => ({ ...prev, [question.id]: e.target.value }))}
          rows={5}
          placeholder={answered ? t("Your answer was saved.", "إجابتك اتحفظت.") : t("Type your answer here…", "اكتب إجابتك هنا…")}
          style={{ width: "100%", boxSizing: "border-box", minHeight: 120, padding: "12px 14px", borderRadius: 10, border: `1px solid ${tokens.cardBorder}`, background: answered ? tokens.inset : tokens.card, color: tokens.textPrimary, fontSize: 14.5, lineHeight: 1.6, fontFamily: "inherit", resize: "vertical", outline: "none" }}
        />
        )}

        {!answered && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              {onIdk && <TextButton tokens={tokens} muted disabled={busy || recording} onClick={() => { setViewIndex(index); onIdk(question.id); }}>{t("I don't know", "مش عارف")}</TextButton>}
              {voiceSupported && (
                <TextButton tokens={tokens} muted={!recording} disabled={busy || (voice.recordingId !== null && !recording)}
                  onClick={() => (recording ? void voice.stop(question.id).then((audio) => audio && (setViewIndex(index), onVoice(question.id, audio))) : void voice.start(question.id))}>
                  {recording ? t("Stop and send recording", "وقّف وابعت التسجيل") : t("Answer by voice", "جاوب بصوتك")}
                </TextButton>
              )}
            </div>
            <PrimaryButton tokens={tokens} busy={busy} disabled={!text.trim() || recording} onClick={() => { setViewIndex(index); onSubmit(question.id, text); }}>
              {busy ? t("Checking…", "بنصحح…") : t("Submit answer", "ابعت الإجابة")}
            </PrimaryButton>
          </div>
        )}
        {voice.error && <div style={{ marginTop: 10, fontSize: 13, color: STATUS.danger.fg }}>{t("We couldn't use your microphone. Please type your answer.", "مقدرناش نستخدم المايك. اكتب إجابتك.")}</div>}

        <EvaluationCard evaluation={evaluations[question.id] ?? null} tokens={tokens} lang={lang} />

        {answered && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
            {nextOpen !== -1 ? (
              <PrimaryButton tokens={tokens} onClick={() => setViewIndex(nextOpen)}>{t("Next question", "السؤال اللي بعده")}</PrimaryButton>
            ) : firstOpen !== -1 ? (
              <PrimaryButton tokens={tokens} onClick={() => setViewIndex(firstOpen)}>{t("Go to unanswered question", "روح للسؤال اللي لسه")}</PrimaryButton>
            ) : (
              doneNote && <PrimaryButton tokens={tokens} onClick={() => setViewIndex(null)}>{t("See results", "شوف النتيجة")}</PrimaryButton>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}

export function TopicSelect({ topics, value, onChange, tokens, lang, placeholder }) {
  const bFont = bFontFor(lang);
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="genai-input"
      style={{ ...inputStyle(tokens, bFont), minWidth: 180, flex: 1, cursor: "pointer" }}
    >
      <option value="">{placeholder}</option>
      {topics.map((topic) => (
        <option key={topic.id} value={topic.id}>{topic.label?.[lang] ?? topic.label?.en ?? topic.title ?? topic.id}</option>
      ))}
    </select>
  );
}

export function CourseSelect({ courses, value, onChange, tokens, lang, placeholder }) {
  const bFont = bFontFor(lang);
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="genai-input"
      style={{ ...inputStyle(tokens, bFont), minWidth: 180, flex: 1, cursor: "pointer" }}
    >
      <option value="">{placeholder}</option>
      {courses.map((course) => (
        <option key={course.id} value={course.id}>{course.title?.[lang] ?? course.title?.en ?? course.title}</option>
      ))}
    </select>
  );
}

export function LearnerSessionTabs({ tab, onChange, tokens, lang }) {
  const bFont = bFontFor(lang);
  const items = [
    ["new", lang === "ar" ? "ابدأ جديد" : "Start new"],
    ["history", lang === "ar" ? "الجلسات السابقة" : "History"],
  ];
  return (
    <div
      role="tablist"
      aria-label={lang === "ar" ? "أقسام الجلسات" : "History"}
      style={{
        display: "inline-flex",
        gap: 4,
        marginBottom: 16,
        padding: 4,
        borderRadius: 11,
        background: tokens.inset,
        border: `1px solid ${tokens.cardBorder}`,
        flexDirection: lang === "ar" ? "row-reverse" : "row",
      }}
    >
      {items.map(([key, label]) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={tab === key}
          onClick={() => onChange(key)}
          style={{
            fontFamily: bFont,
            fontSize: 12,
            fontWeight: 650,
            cursor: "pointer",
            padding: "7px 16px",
            borderRadius: 8,
            border: tab === key ? `1px solid ${tokens.cardBorder}` : "1px solid transparent",
            color: tab === key ? tokens.primary : tokens.textMuted,
            background: tab === key ? tokens.card : "transparent",
            boxShadow: tab === key ? "0 1px 3px rgba(16,26,54,0.10)" : "none",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
