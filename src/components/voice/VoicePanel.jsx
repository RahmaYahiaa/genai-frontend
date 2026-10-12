import { useState } from "react";
import VoiceOrb from "@/components/voice/VoiceOrb";
import useMicLevel from "@/components/voice/useMicLevel";
import { IconMic, IconStop, IconHand } from "@/components/Icons";
import { Notice } from "@/components/study/StudyKit";

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

/**
 * Talk mode inside the AI Tutor. The orb, the start button and the raise-hand
 * button. Spoken answers are not connected yet (voiceReady comes from the AI
 * service health). Until then the orb still reacts to the student's voice, so
 * the microphone can be checked.
 */
export default function VoicePanel({ tokens, lang, mobile, voiceReady = false, busy = false, onInterrupt }) {
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const [listening, setListening] = useState(false);
  const { levelRef, error } = useMicLevel(listening);

  const state = listening ? "listening" : busy ? "thinking" : "idle";
  const status = listening
    ? t("Listening…", "بسمعك…")
    : busy
      ? t("Thinking…", "بفكّر…")
      : voiceReady
        ? t("Tap the blue button and talk", "اضغط الزرار الأزرق واتكلم")
        : t("Check your microphone", "اختبر الميكروفون");

  const raiseHand = () => {
    setListening(true);
    onInterrupt?.();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: mobile ? "8px 0 4px" : "14px 0 6px" }}>
      <VoiceOrb levelRef={levelRef} state={state} size={mobile ? 170 : 220} />
      <div role="status" aria-live="polite" style={{ marginTop: 14, fontSize: 14, color: tokens.textMuted, minHeight: 20 }}>
        {status}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 14 }}>
        <button
          type="button"
          aria-label={t("Raise your hand to ask", "ارفع إيدك واسأل")}
          title={t("Raise your hand to ask", "ارفع إيدك واسأل")}
          onClick={raiseHand}
          style={roundBtn(tokens)}
        >
          <IconHand size={20} />
        </button>
        <button
          type="button"
          aria-label={listening ? t("Stop", "وقّف") : t("Start talking", "ابدأ كلام")}
          title={listening ? t("Stop", "وقّف") : t("Start talking", "ابدأ كلام")}
          onClick={() => setListening((v) => !v)}
          style={{
            width: 68,
            height: 68,
            borderRadius: "50%",
            border: "none",
            background: tokens.primaryBtn,
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 8px 22px rgba(27,77,168,0.35)",
          }}
        >
          {listening ? <IconStop size={22} color="#fff" /> : <IconMic size={24} color="#fff" />}
        </button>
        <div style={{ width: 48, height: 48 }} aria-hidden="true" />
      </div>

      <div style={{ width: "100%", maxWidth: 520, marginTop: 16 }}>
        {error === "denied" && (
          <Notice tokens={tokens} tone="warning">
            {t("Allow the microphone in your browser settings to use your voice.", "اسمح للمتصفح يستخدم الميكروفون عشان صوتك يتسمع.")}
          </Notice>
        )}
        {error === "unavailable" && (
          <Notice tokens={tokens} tone="warning">
            {t("This browser can't use the microphone here.", "المتصفح ده مش بيقدر يستخدم الميكروفون.")}
          </Notice>
        )}
        {!voiceReady && (
          <Notice tokens={tokens} tone="info">
            {t(
              "Spoken answers are not connected yet. You can check your microphone here and keep learning by writing.",
              "الإجابات الصوتية لسه مش متوصلة. تقدر تختبر الميكروفون هنا، وتكمّل بالكتابة.",
            )}
          </Notice>
        )}
      </div>
    </div>
  );
}
