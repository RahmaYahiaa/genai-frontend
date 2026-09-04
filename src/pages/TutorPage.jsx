import { useEffect, useState } from "react";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { fetchTutor, sendTutorMessage } from "@/services/api";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { TUTOR_TOPICS } from "@/data/student";
import { Chip, Btn, Loading, Spinner } from "@/components/ui";

export default function TutorPage({ state }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const mobile = useMediaQuery("(max-width: 760px)");
  const { data: seed, loading } = useAsync(fetchTutor);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [turn, setTurn] = useState(0);

  useEffect(() => {
    if (seed) setMessages(seed);
  }, [seed]);

  const ask = async (text) => {
    const clean = String(text || "").trim();
    if (!clean || typing) return;
    setInput("");
    setMessages((m) => [...m, { id: `u-${Date.now()}`, from: "user", text: { en: clean, ar: clean }, sources: [] }]);
    setTyping(true);
    try {
      const reply = await sendTutorMessage(clean, turn);
      setTurn((n) => n + 1);
      setMessages((m) => [...m, { id: `a-${Date.now()}`, from: "ai", ...reply }]);
    } finally {
      setTyping(false);
    }
  };

  const askTopic = (topic) => ask(`${t("Explain", "اشرح")} ${topic.label[lang]}`);

  if (loading) {
    return (
      <div style={{ padding: 28 }}>
        <Loading tokens={tokens} label={t("Opening your tutor…", "جاري فتح المعلّم…")} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: bodyFont(lang) }}>
      <div style={{ padding: mobile ? "18px 16px 0" : "22px 28px 0", maxWidth: 820, width: "100%", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <h1 style={{ margin: 0, fontSize: mobile ? 17 : 20, fontWeight: 700, letterSpacing: "-0.02em", color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
            {t("AI Tutor", "المعلّم الذكي")}
          </h1>
          <Chip tokens={tokens} tone="primary">
            {t("Grounded in CS301 materials", "مستند لمواد CS301")}
          </Chip>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {TUTOR_TOPICS.map((topic) => (
            <button
              key={topic.id}
              onClick={() => askTopic(topic)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: `1px solid ${tokens.cardBorder}`,
                background: tokens.card,
                color: tokens.textSecondary,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {topic.label[lang]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: mobile ? "6px 16px 18px" : "6px 28px 18px", maxWidth: 820, width: "100%", margin: "0 auto" }}>
        {messages.map((m) => (
          <div key={m.id} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
            <div
              style={{
                maxWidth: "78%",
                background: m.from === "user" ? tokens.primaryLight : tokens.inset,
                border: `1px solid ${m.from === "user" ? `${tokens.primary}33` : tokens.cardBorder}`,
                borderRadius: 12,
                padding: "10px 14px",
                ...(m.from === "user" ? { borderTopRightRadius: 4 } : { borderTopLeftRadius: 4 }),
              }}
            >
              <div style={{ fontSize: 13.5, lineHeight: 1.6, color: tokens.textPrimary }}>{m.text[lang] ?? m.text.en}</div>
              {m.sources?.length > 0 && (
                <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {m.sources.map((s) => (
                    <span
                      key={s.ref}
                      title={s.ref}
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9.5,
                        padding: "3px 8px",
                        borderRadius: 5,
                        background: tokens.citationBg,
                        border: `1px solid ${tokens.citationBorder}`,
                        color: tokens.citation,
                      }}
                    >
                      {s.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, color: tokens.textMuted, fontSize: 12 }}>
            <Spinner tokens={tokens} size={14} />
            {t("Grounded reasoning…", "تفكير مستند للمقرر…")}
          </div>
        )}
      </div>

      <div style={{ padding: mobile ? "12px 16px 22px" : "12px 28px 22px", maxWidth: 820, width: "100%", margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask(input)}
            placeholder={t("Ask about a CS301 topic…", "اسأل عن موضوع من CS301…")}
            style={{
              flex: 1,
              padding: "11px 14px",
              borderRadius: 10,
              border: `1.5px solid ${tokens.cardBorder}`,
              background: tokens.inset,
              color: tokens.textPrimary,
              fontSize: 13,
              outline: "none",
            }}
          />
          <Btn tokens={tokens} onClick={() => ask(input)} disabled={typing || !input.trim()}>
            {t("Send", "إرسال")}
          </Btn>
        </div>
        <div style={{ marginTop: 8, fontSize: 10.5, color: tokens.textFaint, textAlign: "center" }}>
          {t("Answers use approved course materials only — with citing sources.", "الإجابات تستخدم مواد المقرر المعتمدة فقط — مع الإحالة للمصادر.")}
        </div>
      </div>
    </div>
  );
}