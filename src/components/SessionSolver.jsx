import { useRef, useState } from "react";
import { MONO } from "@/constants/tokens";
import { Btn, Card, Chip, ConfidencePill, bFontFor, textareaStyle, inputStyle } from "@/components/ModuleUI";
import { FlowProgress } from "@/components/learning";

const CORRECTNESS_LABELS = {
  CORRECT: { en: "Correct", ar: "صحيح" },
  PARTIAL: { en: "Partial", ar: "جزئي" },
  INCORRECT: { en: "Incorrect", ar: "غير صحيح" },
  // lowercase variants emitted by the live API
  correct: { en: "Correct", ar: "صحيح" },
  partial: { en: "Partial", ar: "جزئي" },
  incorrect: { en: "Incorrect", ar: "غير صحيح" },
  // "I don't know" (EDUNation parity): missing knowledge, not a misconception.
  unknown: { en: "Not known yet", ar: "لم يُعرَف بعد" },
};

const correctnessTone = (correctness) => {
  const key = String(correctness ?? "").toUpperCase();
  if (key === "CORRECT") return "mastered";
  if (key === "PARTIAL") return "primary";
  if (key === "INCORRECT") return "gap";
  return "default";
};

const correctnessColor = (correctness, tokens) => {
  const key = String(correctness ?? "").toUpperCase();
  if (key === "CORRECT") return tokens.mastered;
  if (key === "PARTIAL") return tokens.primary;
  if (key === "INCORRECT") return tokens.gap;
  return tokens.cardBorder;
};

export function EvaluationCard({ evaluation, tokens, lang }) {
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const isRtl = lang === "ar";
  if (!evaluation) return null;
  const correctness = evaluation.correctness ?? null;
  const accent = correctnessColor(correctness, tokens);
  return (
    <div
      aria-live="polite"
      style={{
        background: tokens.inset,
        border: `1px solid ${tokens.cardBorder}`,
        borderRadius: 10,
        padding: "12px 14px",
        marginTop: 10,
        ...(isRtl ? { borderRight: `3px solid ${accent}` } : { borderLeft: `3px solid ${accent}` }),
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6, flexDirection: isRtl ? "row-reverse" : "row" }}>
        {correctness && (
          <Chip tokens={tokens} tone={correctnessTone(correctness)}>
            {lang === "ar" ? CORRECTNESS_LABELS[correctness]?.ar ?? correctness : CORRECTNESS_LABELS[correctness]?.en ?? correctness}
          </Chip>
        )}
        {evaluation.confidence && (
          <ConfidencePill confidence={String(evaluation.confidence).toLowerCase()} tokens={tokens} lang={lang} short />
        )}
        <span style={{ fontFamily: MONO, fontSize: 10.5, color: tokens.textSecondary }}>
          {t("score", "الدرجة")}: {evaluation.score}
        </span>
      </div>
      {evaluation.feedback && (
        <p style={{ fontFamily: bFontFor(lang), fontSize: 12.5, color: tokens.textSecondary, lineHeight: 1.7, margin: 0, textAlign: isRtl ? "right" : "left" }}>
          {evaluation.feedback}
        </p>
      )}
      {(evaluation.misconceptions ?? []).length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          <span style={{ fontSize: 11, color: tokens.textFaint, alignSelf: "center" }}>
            {t("Misconception detected:", "مفهوم خاطئ رُصد:")}
          </span>
          {evaluation.misconceptions.map((item) => (
            <Chip key={item.code ?? item} tokens={tokens} tone="gap">{item.code ?? item}</Chip>
          ))}
        </div>
      )}
    </div>
  );
}

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

// onIdk is optional (diagnostic only — EDUNation "I don't know" parity):
// an explicit "don't know / skip" that the backend records as missing
// knowledge, never as a misconception.
// onVoice is optional (diagnostic only): records an audio answer and submits
// it for server-side transcription + evaluation.
export function QuestionFlow({ questions, evaluations, answeredIds, busyId, onSubmit, onIdk = null, onVoice = null, tokens, lang, mobile, doneNote }) {
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const isRtl = lang === "ar";
  const bFont = bFontFor(lang);
  const [texts, setTexts] = useState({});
  const voice = useVoiceRecorder();
  const voiceSupported =
    Boolean(onVoice) &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== "undefined";
  const total = questions.length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <FlowProgress answered={answeredIds.length} total={total} tokens={tokens} lang={lang} mobile={mobile} />
      {questions.map((question, index) => {
        const answered = answeredIds.includes(question.id);
        return (
          <Card tokens={tokens} key={question.id} style={{ padding: mobile ? "14px 16px" : "16px 18px" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10, flexDirection: isRtl ? "row-reverse" : "row" }}>
              <span
                aria-hidden="true"
                style={{
                  minWidth: 26,
                  height: 20,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 6px",
                  borderRadius: 6,
                  background: answered ? tokens.masteredBg : tokens.inset,
                  border: `1px solid ${answered ? tokens.masteredBorder : tokens.cardBorder}`,
                  color: answered ? tokens.mastered : tokens.textMuted,
                  fontFamily: MONO,
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {index + 1}
              </span>
              {question.difficulty && <Chip tokens={tokens} tone="slate">{question.difficulty}</Chip>}
              {answered && (
                <Chip tokens={tokens} tone="mastered" style={{ ...(isRtl ? { marginRight: "auto" } : { marginLeft: "auto" }) }}>
                  {t("Answered", "تمت الإجابة")}
                </Chip>
              )}
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 650, color: tokens.textPrimary, lineHeight: 1.65, marginBottom: 10, textAlign: isRtl ? "right" : "left" }}>
              {question.prompt}
            </div>
            <textarea
              value={texts[question.id] ?? ""}
              disabled={answered}
              aria-label={t(`Your answer to question ${index + 1}`, `إجابتك على السؤال ${index + 1}`)}
              onChange={(event) => setTexts((prev) => ({ ...prev, [question.id]: event.target.value }))}
              rows={4}
              placeholder={answered ? t("Answer submitted — evidence recorded.", "سُلِّمت الإجابة — سُجِّل الدليل.") : t("Write your answer…", "اكتب إجابتك…")}
              className="genai-input"
              style={{
                ...textareaStyle(tokens, bFont),
                width: "100%",
                minHeight: 84,
                resize: "vertical",
                opacity: answered ? 0.65 : 1,
              }}
            />
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
              <Btn
                tokens={tokens}
                lang={lang}
                disabled={answered || busyId === question.id || !(texts[question.id] ?? "").trim()}
                onClick={() => onSubmit(question.id, texts[question.id])}
              >
                {busyId === question.id
                  ? t("Evaluating…", "جاري التقييم…")
                  : answered
                    ? t("Answered", "تمت الإجابة")
                    : t("Submit answer", "تسليم الإجابة")}
              </Btn>
              {onIdk && !answered && (
                <Btn
                  tokens={tokens}
                  lang={lang}
                  variant="ghost"
                  disabled={busyId === question.id || voice.recordingId === question.id}
                  title={t(
                    "Choose this instead of guessing — it counts as missing knowledge, not as a misconception.",
                    "اخترها بدل التخمين — تُحتسب معرفةً ناقصة لا مفهومًا خاطئًا.",
                  )}
                  onClick={() => onIdk(question.id)}
                >
                  {t("I don't know", "لا أعرف")}
                </Btn>
              )}
              {voiceSupported && !answered && (
                <Btn
                  tokens={tokens}
                  lang={lang}
                  variant={voice.recordingId === question.id ? "soft" : "ghost"}
                  disabled={busyId === question.id || (voice.recordingId !== null && voice.recordingId !== question.id)}
                  onClick={() => {
                    if (voice.recordingId === question.id) {
                      void voice.stop(question.id).then((audio) => audio && onVoice(question.id, audio));
                    } else {
                      void voice.start(question.id);
                    }
                  }}
                >
                  {voice.recordingId === question.id
                    ? t("Stop & submit ⏺", "إيقاف وتسليم ⏺")
                    : t("Record answer", "إجابة صوتية")}
                </Btn>
              )}
              {voice.error && (
                <span style={{ fontSize: 11, color: tokens.gap }}>
                  {t("Microphone unavailable — type your answer instead.", "الميكروفون غير متاح — اكتب إجابتك بدلًا منها.")}
                </span>
              )}
            </div>
            <EvaluationCard evaluation={evaluations[question.id] ?? null} tokens={tokens} lang={lang} />
          </Card>
        );
      })}
      {doneNote}
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
    ["new", lang === "ar" ? "جلسة جديدة" : "New session"],
    ["history", lang === "ar" ? "الجلسات السابقة" : "History"],
  ];
  return (
    <div
      role="tablist"
      aria-label={lang === "ar" ? "أقسام الجلسات" : "Session views"}
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
