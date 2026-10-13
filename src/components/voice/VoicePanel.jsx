import { useEffect, useRef, useState } from "react";
import VoiceOrb from "@/components/voice/VoiceOrb";
import useVoiceSession from "@/components/voice/useVoiceSession";
import { IconMic, IconHand } from "@/components/Icons";
import { Notice } from "@/components/study/StudyKit";

function VoiceVisual({ tokens, visual, lang }) {
  const t = (en, ar) => (lang === "ar" ? ar : en);
  if (!visual) return null;
  const content = typeof visual.content === "string" ? visual.content : JSON.stringify(visual.content ?? "", null, 2);
  const isImage = visual.type === "image" && /^(https?:|data:image\/)/.test(content);
  return (
    <div style={{ border: `1px solid ${tokens.cardBorder}`, borderRadius: 14, background: tokens.card, padding: 14, marginTop: 12, direction: "ltr", textAlign: "left" }}>
      <div style={{ fontSize: 12, color: tokens.textMuted, marginBottom: 8 }}>
        {visual.type === "code" ? t("Code", "كود") : visual.type === "equation" ? t("Equation", "معادلة") : visual.type === "diagram" ? t("Diagram", "رسم") : t("Figure", "شكل")}
      </div>
      {isImage ? (
        <img src={content} alt={visual.caption || t("Figure from the lesson", "شكل من الدرس")} style={{ maxWidth: "100%", borderRadius: 8 }} />
      ) : (
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13.5, lineHeight: 1.6, color: tokens.textPrimary, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
          {content}
        </pre>
      )}
      {visual.caption && <div style={{ fontSize: 12.5, color: tokens.textMuted, marginTop: 8 }}>{visual.caption}</div>}
    </div>
  );
}

// Microphone icon. When the mic is off, a diagonal line crosses the icon.
function MicGlyph({ on, color }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26 }}>
      <IconMic size={22} color={color} />
      {!on && (
        <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
          <line x1="4" y1="4" x2="22" y2="22" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )}
    </span>
  );
}

/**
 * Talk mode inside the AI Tutor: the live voice lesson.
 *
 * Layout is fixed so controls never move: the hand and mic buttons always sit in the same
 * place (disabled before the lesson starts), and the start/end button sits below them.
 * The transcript card and the text box come after, so they never push the controls.
 */
export default function VoicePanel({ tokens, lang, mobile, courseId, topicId = null, topicLabel = null, voiceReady = false, resumeLesson = false, onExit, onSaved }) {
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const voice = useVoiceSession({ courseId, onSaved });
  const { status, errorCode, micOn, speaking, turns, visual, sources, levelRef, tutorUnavailable } = voice;
  const live = status === "live" || status === "reconnecting";
  const busy = status === "connecting";

  const [question, setQuestion] = useState("");
  const [hint, setHint] = useState(null); // control name shown under a button on hover or focus
  const transcriptRef = useRef(null);

  const orbState = live && micOn && !speaking ? "listening" : live ? "thinking" : "idle";

  // Keep the newest line in view while the tutor speaks or the student talks.
  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns]);

  const statusText = (() => {
    if (status === "connecting") return t("Connecting…", "جاري الاتصال…");
    if (status === "reconnecting") return t("Reconnecting. Same lesson…", "بعيد الاتصال. نفس الدرس…");
    if (status === "ended") return t("Lesson ended", "الدرس خلص");
    if (status === "error") return t("Something stopped the lesson", "حصلت مشكلة وقفت الدرس");
    if (!live) return voiceReady ? t("Press start and your tutor will explain", "اضغط ابدأ والمعلم هيشرحلك") : t("Voice is not available right now", "الصوت مش متاح دلوقتي");
    if (speaking) return t("Your tutor is speaking", "المعلم بيشرح");
    if (micOn) return t("Listening…", "بسمعك…");
    return t("Microphone is off", "الميكروفون مقفول");
  })();

  const errorText = {
    mic_denied: t("Allow the microphone in your browser settings to use your voice.", "اسمح للمتصفح يستخدم الميكروفون عشان صوتك يتسمع."),
    mic_unavailable: t("This browser can't use the microphone here.", "المتصفح ده مش بيقدر يستخدم الميكروفون."),
    unavailable: t("Voice is not available right now. Try again later, or keep learning by writing.", "الصوت مش متاح دلوقتي. جرّب بعد شوية، أو كمّل بالكتابة."),
    connection: t("The connection dropped and didn't come back. Try again.", "الاتصال وقع ومرجعش. جرّب تاني."),
    server: t("The voice lesson hit a problem. Try again.", "الدرس الصوتي وقع في مشكلة. جرّب تاني."),
  }[errorCode];

  const canStart = voiceReady && !live && !busy;
  const exit = () => {
    voice.stop();
    onExit?.();
  };

  const submitQuestion = (event) => {
    event.preventDefault();
    if (voice.ask(question)) setQuestion("");
  };

  const hintProps = (key) => ({
    onMouseEnter: () => setHint(key),
    onMouseLeave: () => setHint(null),
    onFocus: () => setHint(key),
    onBlur: () => setHint(null),
  });
  // Labels are not shown permanently; they appear under a control on hover or keyboard focus.
  const hintLine = (key, text) => (
    <div aria-hidden="true" style={{ height: 18, marginTop: 8, fontSize: 12.5, color: tokens.textMuted, textAlign: "center", whiteSpace: "nowrap" }}>
      {hint === key ? text : ""}
    </div>
  );

  const roundButton = (enabled, filled) => ({
    width: 72,
    height: 72,
    borderRadius: "50%",
    border: filled ? "none" : `1px solid ${tokens.cardBorder}`,
    background: enabled ? (filled ? tokens.primaryBtn : tokens.card) : tokens.inset,
    color: enabled ? (filled ? "#fff" : tokens.textPrimary) : tokens.textMuted,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: enabled ? "pointer" : "default",
    boxShadow: enabled && filled ? "0 8px 22px rgba(27,77,168,0.30)" : "none",
    opacity: enabled ? 1 : 0.6,
    flexShrink: 0,
    transition: "background 0.15s, opacity 0.15s",
  });

  const stopEnabled = live;
  const micEnabled = live;
  const slot = { width: 120, display: "flex", flexDirection: "column", alignItems: "center" };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", padding: mobile ? "8px 0 4px" : "14px 0 6px" }}>
      <VoiceOrb levelRef={levelRef} state={orbState} size={mobile ? 150 : 200} />
      <div role="status" aria-live="polite" style={{ marginTop: 12, fontSize: 14, color: tokens.textMuted, minHeight: 20, textAlign: "center" }}>
        {statusText}
      </div>
      {topicLabel && <div style={{ fontSize: 13, color: tokens.textMuted, marginTop: 4, textAlign: "center" }}>{t("Topic", "الموضوع")}: {topicLabel}</div>}

      {/* Fixed control row: the mic stays in the same place before, during, and after the lesson. */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 24, marginTop: 16 }}>
        <div style={slot}>
          <button
            type="button"
            {...hintProps("stop")}
            disabled={!stopEnabled}
            aria-label={t("Stop the tutor and let me speak", "وقّف وخليني أتكلم")}
            title={t("Stop the tutor and let me speak", "وقّف وخليني أتكلم")}
            onClick={voice.stopTutor}
            style={{ ...roundButton(stopEnabled, true), ...(stopEnabled ? { background: "#c2410c", boxShadow: "0 8px 22px rgba(194,65,12,0.28)" } : {}) }}
          >
            <IconHand size={26} color="currentColor" />
          </button>
          {hintLine("stop", t("Stop the tutor and let me speak", "وقّف وخليني أتكلم"))}
        </div>

        <div style={slot}>
          <button
            type="button"
            {...hintProps("mic")}
            disabled={!micEnabled}
            aria-label={micOn ? t("Mute microphone", "اقفل الميكروفون") : t("Unmute microphone", "شغّل الميكروفون")}
            aria-pressed={micOn}
            title={micOn ? t("Mute microphone", "اقفل الميكروفون") : t("Unmute microphone", "شغّل الميكروفون")}
            onClick={voice.toggleMic}
            style={roundButton(micEnabled, micOn)}
          >
            <MicGlyph on={micOn} color="currentColor" />
          </button>
          {hintLine("mic", micOn ? t("Mic is on", "الميكروفون شغّال") : t("Mic is off", "الميكروفون مقفول"))}
        </div>
      </div>

      {/* One slot below the controls: start before the lesson, end during it. */}
      <div style={{ marginTop: 10, minHeight: 38, display: "flex", justifyContent: "center" }}>
        {live ? (
          <button
            type="button"
            onClick={exit}
            title={t("End lesson and save it to your chat history", "إنهاء الدرس وحفظه في سجل المحادثة")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              height: 36,
              padding: "0 16px",
              borderRadius: 999,
              border: `1px solid ${tokens.cardBorder}`,
              background: tokens.card,
              color: tokens.textPrimary,
              fontSize: 13.5,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
              <rect x="0" y="0" width="12" height="12" rx="2.5" fill="currentColor" />
            </svg>
            {t("End lesson", "إنهاء الدرس")}
          </button>
        ) : (
          <button
            type="button"
            disabled={!canStart}
            onClick={() => void voice.start(topicId, { resume: resumeLesson })}
            style={{
              height: 38,
              padding: "0 22px",
              borderRadius: 999,
              border: "none",
              background: canStart ? tokens.primaryBtn : tokens.inset,
              color: canStart ? "#fff" : tokens.textMuted,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: canStart ? "pointer" : "default",
              boxShadow: canStart ? "0 8px 22px rgba(27,77,168,0.25)" : "none",
            }}
          >
            {resumeLesson ? t("Continue by voice", "كمّل بالصوت") : status === "error" || status === "ended" ? t("Start again", "ابدأ تاني") : t("Start the explanation", "ابدأ الشرح")}
          </button>
        )}
      </div>

      <div style={{ width: "100%", maxWidth: 620, marginTop: 10 }}>
        {errorText && (
          <Notice tokens={tokens} tone="warning">
            {errorText}
          </Notice>
        )}
        {live && tutorUnavailable && (
          <Notice
            tokens={tokens}
            tone="warning"
            action={
              <button
                type="button"
                onClick={voice.retryExplain}
                style={{ height: 32, padding: "0 14px", borderRadius: 999, border: "none", background: tokens.primaryBtn, color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                {t("Try again", "جرّب تاني")}
              </button>
            }
          >
            {t("The tutor couldn't reach a voice provider just now. Your lesson is still open: try again, or type a question below.", "المعلم معرفش يوصل لخدمة الصوت دلوقتي. الدرس لسه مفتوح: جرّب تاني، أو اكتب سؤالك تحت.")}
          </Notice>
        )}
        {!voiceReady && status === "idle" && (
          <Notice tokens={tokens} tone="info">
            {t("Voice lessons are not available right now. You can keep learning by writing.", "الدروس الصوتية مش متاحة دلوقتي. تقدر تكمّل بالكتابة.")}
          </Notice>
        )}

        {visual && <VoiceVisual tokens={tokens} visual={visual} lang={lang} />}

        <div
          style={{
            border: `1px solid ${tokens.cardBorder}`,
            borderRadius: 16,
            background: tokens.card,
            marginTop: 12,
            overflow: "hidden",
          }}
        >
          <div
            ref={transcriptRef}
            aria-live="polite"
            style={{ display: "flex", flexDirection: "column", gap: 10, padding: 14, height: mobile ? 260 : 320, overflowY: "auto" }}
          >
            {turns.length === 0 && (
              <div style={{ margin: "auto", fontSize: 13.5, color: tokens.textMuted, textAlign: "center" }}>
                {t("The lesson will appear here.", "الدرس هيظهر هنا.")}
              </div>
            )}
            {turns.map((turn) => (
              <div
                key={turn.id}
                style={{
                  alignSelf: turn.role === "student" ? "flex-end" : "flex-start",
                  maxWidth: "86%",
                  padding: "9px 13px",
                  borderRadius: 14,
                  fontSize: 14.5,
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  background: turn.role === "student" ? tokens.primaryBtn : tokens.inset,
                  color: turn.role === "student" ? "#fff" : tokens.textPrimary,
                  opacity: turn.final === false ? 0.7 : 1,
                }}
              >
                {turn.text || (turn.role === "tutor" ? "…" : "")}
                {turn.interrupted && <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>{t("(you stopped the tutor)", "(وقفت المعلم)")}</div>}
              </div>
            ))}
          </div>
        </div>

        {live && (
          <form
            onSubmit={submitQuestion}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 12,
              padding: 6,
              borderRadius: 999,
              border: `1px solid ${tokens.cardBorder}`,
              background: tokens.card,
            }}
          >
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={t("Type a question for the tutor…", "اكتب سؤال للمعلم…")}
              aria-label={t("Your question", "سؤالك")}
              maxLength={2000}
              style={{
                flex: 1,
                minWidth: 0,
                height: 36,
                borderRadius: 999,
                border: "none",
                background: "transparent",
                color: tokens.textPrimary,
                padding: "0 12px",
                fontSize: 15,
                fontFamily: "inherit",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={!question.trim()}
              aria-label={t("Send question", "ابعت السؤال")}
              style={{
                height: 36,
                padding: "0 16px",
                borderRadius: 999,
                border: "none",
                background: question.trim() ? tokens.primaryBtn : tokens.inset,
                color: question.trim() ? "#fff" : tokens.textMuted,
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: question.trim() ? "pointer" : "default",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block" }}>
                <path d="M22 2 11 13" />
                <path d="M22 2 15 22l-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>
        )}

        {sources.length > 0 && (
          <div style={{ fontSize: 12.5, color: tokens.textMuted, marginTop: 10, lineHeight: 1.6, textAlign: "center" }}>
            {t("From your course material:", "من مادة المقرر:")} {sources.join(" · ")}
          </div>
        )}
      </div>
    </div>
  );
}
