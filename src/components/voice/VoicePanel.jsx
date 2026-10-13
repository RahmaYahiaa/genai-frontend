import VoiceOrb from "@/components/voice/VoiceOrb";
import useVoiceSession from "@/components/voice/useVoiceSession";
import { IconMic, IconHand, IconStop } from "@/components/Icons";
import { Notice, SecondaryButton, PrimaryButton } from "@/components/study/StudyKit";

const roundBtn = (tokens, extra = {}) => ({
  width: 48,
  height: 48,
  borderRadius: "50%",
  border: `1px solid ${tokens.cardBorder}`,
  background: tokens.card,
  color: tokens.textSecondary,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  ...extra,
});

function VoiceVisual({ tokens, visual, lang }) {
  const t = (en, ar) => (lang === "ar" ? ar : en);
  if (!visual) return null;
  const content = typeof visual.content === "string" ? visual.content : JSON.stringify(visual.content ?? "", null, 2);
  const isImage = visual.type === "image" && /^(https?:|data:image\/)/.test(content);
  return (
    <div
      style={{
        border: `1px solid ${tokens.cardBorder}`,
        borderRadius: 12,
        background: tokens.card,
        padding: 14,
        marginBottom: 12,
        direction: "ltr",
        textAlign: "left",
      }}
    >
      <div style={{ fontSize: 12, color: tokens.textMuted, marginBottom: 8 }}>
        {visual.type === "code" ? t("Code", "كود") : visual.type === "equation" ? t("Equation", "معادلة") : visual.type === "diagram" ? t("Diagram", "رسم") : t("Figure", "شكل")}
      </div>
      {isImage ? (
        <img src={content} alt={visual.caption || t("Figure from the lesson", "شكل من الدرس")} style={{ maxWidth: "100%", borderRadius: 8 }} />
      ) : (
        <pre
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: 13.5,
            lineHeight: 1.6,
            color: tokens.textPrimary,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
        >
          {content}
        </pre>
      )}
      {visual.caption && <div style={{ fontSize: 12.5, color: tokens.textMuted, marginTop: 8 }}>{visual.caption}</div>}
    </div>
  );
}

/**
 * Talk mode inside the AI Tutor: the live voice lesson. Shows the orb, the
 * controls, the running transcript, visuals from the lesson, and clear errors.
 * No IDs or developer details are shown to the student.
 */
export default function VoicePanel({ tokens, lang, mobile, courseId, topicId = null, topicLabel = null, voiceReady = false, onExit }) {
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const voice = useVoiceSession({ courseId });
  const { status, errorCode, micOn, speaking, turns, visual, sources, levelRef } = voice;
  const live = status === "live" || status === "reconnecting";
  const busy = status === "connecting";

  const orbState = live && micOn && !speaking ? "listening" : live ? "thinking" : "idle";

  const statusText = (() => {
    if (status === "connecting") return t("Connecting…", "جاري الاتصال…");
    if (status === "reconnecting") return t("Reconnecting. Same lesson…", "بعيد الاتصال. نفس الدرس…");
    if (status === "ended") return t("Lesson ended", "الدرس خلص");
    if (status === "error") return t("Something stopped the lesson", "حصلت مشكلة وقفت الدرس");
    if (!live) return voiceReady ? t("Tap start and talk to your tutor", "اضغط ابدأ واتكلم مع المعلم") : t("Voice is not available right now", "الصوت مش متاح دلوقتي");
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

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: mobile ? "8px 0 4px" : "14px 0 6px" }}>
      <VoiceOrb levelRef={levelRef} state={orbState} size={mobile ? 170 : 220} />
      <div role="status" aria-live="polite" style={{ marginTop: 14, fontSize: 14, color: tokens.textMuted, minHeight: 20 }}>
        {statusText}
      </div>
      {topicLabel && <div style={{ fontSize: 13, color: tokens.textMuted, marginTop: 4 }}>{t("Topic", "الموضوع")}: {topicLabel}</div>}

      <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 14 }}>
        {live ? (
          <button
            type="button"
            aria-label={t("Raise your hand to ask", "ارفع إيدك واسأل")}
            title={t("Raise your hand to ask", "ارفع إيدك واسأل")}
            onClick={voice.interrupt}
            style={roundBtn(tokens)}
          >
            <IconHand size={20} />
          </button>
        ) : (
          <div style={{ width: 48, height: 48 }} aria-hidden="true" />
        )}

        {live ? (
          <button
            type="button"
            aria-label={micOn ? t("Mute microphone", "اقفل الميكروفون") : t("Unmute microphone", "شغّل الميكروفون")}
            title={micOn ? t("Mute microphone", "اقفل الميكروفون") : t("Unmute microphone", "شغّل الميكروفون")}
            onClick={voice.toggleMic}
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              border: micOn ? "none" : `1px solid ${tokens.cardBorder}`,
              background: micOn ? tokens.primaryBtn : tokens.card,
              color: micOn ? "#fff" : tokens.textSecondary,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: micOn ? "0 8px 22px rgba(27,77,168,0.35)" : "none",
            }}
          >
            {micOn ? <IconMic size={24} color="#fff" /> : <IconStop size={22} />}
          </button>
        ) : (
          <button
            type="button"
            disabled={!canStart}
            aria-label={t("Start the lesson", "ابدأ الدرس")}
            title={t("Start the lesson", "ابدأ الدرس")}
            onClick={() => void voice.start(topicId)}
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              border: "none",
              background: canStart ? tokens.primaryBtn : tokens.inset,
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: canStart ? "pointer" : "default",
              boxShadow: canStart ? "0 8px 22px rgba(27,77,168,0.35)" : "none",
            }}
          >
            <IconMic size={24} color="#fff" />
          </button>
        )}

        <div style={{ width: 48, height: 48 }} aria-hidden="true" />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", justifyContent: "center" }}>
        {(live || status === "error") && (
          <SecondaryButton tokens={tokens} onClick={exit} style={{ height: 34, padding: "0 14px", fontSize: 13 }}>
            {t("End lesson", "إنهاء الدرس")}
          </SecondaryButton>
        )}
        {!live && !busy && (status === "error" || status === "ended") && voiceReady && (
          <PrimaryButton tokens={tokens} onClick={() => void voice.start(topicId)} style={{ height: 34, padding: "0 14px", fontSize: 13 }}>
            {t("Start again", "ابدأ تاني")}
          </PrimaryButton>
        )}
      </div>

      <div style={{ width: "100%", maxWidth: 560, marginTop: 16 }}>
        {errorText && (
          <Notice tokens={tokens} tone="warning">
            {errorText}
          </Notice>
        )}
        {!voiceReady && status === "idle" && (
          <Notice tokens={tokens} tone="info">
            {t("Voice lessons are not available right now. You can keep learning by writing.", "الدروس الصوتية مش متاحة دلوقتي. تقدر تكمّل بالكتابة.")}
          </Notice>
        )}

        {visual && <VoiceVisual tokens={tokens} visual={visual} lang={lang} />}

        {turns.length > 0 && (
          <div
            aria-live="polite"
            style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}
          >
            {turns.map((turn) => (
              <div
                key={turn.id}
                style={{
                  alignSelf: turn.role === "student" ? "flex-end" : "flex-start",
                  maxWidth: "88%",
                  padding: "10px 14px",
                  borderRadius: 14,
                  fontSize: 14.5,
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  background: turn.role === "student" ? tokens.primaryBtn : tokens.card,
                  color: turn.role === "student" ? "#fff" : tokens.textPrimary,
                  border: turn.role === "student" ? "none" : `1px solid ${tokens.cardBorder}`,
                  opacity: turn.final === false ? 0.7 : 1,
                }}
              >
                {turn.text || (turn.role === "tutor" ? "…" : "")}
                {turn.interrupted && (
                  <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>{t("(you interrupted)", "(قاطعت المعلم)")}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {sources.length > 0 && (
          <div style={{ fontSize: 12.5, color: tokens.textMuted, marginTop: 12, lineHeight: 1.6 }}>
            {t("From your course material:", "من مادة المقرر:")} {sources.join(" · ")}
          </div>
        )}
      </div>
    </div>
  );
}
