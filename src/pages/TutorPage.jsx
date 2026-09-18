import { demoMode } from "@/services/auth";
import { useCallback, useEffect, useRef, useState } from "react";
import { listCourses } from "@/services/courses";
import { listTutorSessions, createTutorSession, getTutorSession, sendTutorMessage as sendLiveTutorMessage, TUTOR_MODE_LABELS } from "@/services/learning";
import { apiErrorText } from "@/services/http";
import { CourseSelect, TopicSelect } from "@/components/SessionSolver";
import { AlertStrip, inputStyle } from "@/components/ModuleUI";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { fetchTutor, sendTutorMessage } from "@/services/api";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { TUTOR_TOPICS } from "@/data/student";
import { Chip, Btn, Loading, Spinner, Card, AsyncGate } from "@/components/ui";

function DemoTutorPage({ state }) {
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
function RealTutorPage({ state }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const mobile = useMediaQuery("(max-width: 760px)");
  const isRtl = lang === "ar";
  const [courseId, setCourseId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [mode, setMode] = useState("EXPLANATION");
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [notice, setNotice] = useState(null);
  const endRef = useRef(null);

  const loadCourses = useCallback(() => listCourses(), []);
  const coursesAsync = useAsync(loadCourses);
  const courses = coursesAsync.data?.items ?? [];
  const effectiveCourseId = courseId || courses[0]?.id || null;
  const course = courses.find((item) => item.id === effectiveCourseId);
  const topics = course?.topics ?? [];

  useEffect(() => {
    setSessionId("");
    setTopicId("");
    setShowHistory(false);
    setNotice(null);
  }, [effectiveCourseId]);

  const loadSession = useCallback(
    () => (effectiveCourseId && sessionId ? getTutorSession(effectiveCourseId, sessionId).catch(() => null) : Promise.resolve(null)),
    [effectiveCourseId, sessionId],
  );
  const sessionAsync = useAsync(loadSession);
  const loadList = useCallback(
    () => (effectiveCourseId ? listTutorSessions(effectiveCourseId).catch(() => []) : Promise.resolve([])),
    [effectiveCourseId],
  );
  const listAsync = useAsync(loadList);
  const historyRows = listAsync.data ?? [];
  const session = sessionAsync.data;
  const messages = session?.messages ?? [];
  const topicLabel = (id) => topics.find((topic) => topic.id === id)?.label?.[lang] ?? topics.find((topic) => topic.id === id)?.label?.en ?? id;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, typing, showHistory]);

  const ask = async (text, preferredTopicId) => {
    const clean = String(text || "").trim();
    if (!clean || typing || !effectiveCourseId) return;
    setInput("");
    setNotice(null);
    setTyping(true);
    try {
      let activeId = sessionId;
      if (!activeId) {
        const chosen = preferredTopicId || topicId || topics[0]?.id;
        if (!chosen) {
          setNotice(t("Pick a topic first so the tutor knows where to look.", "اختار موضوع الأول عشان المعلّم يعرف يدور فين."));
          return;
        }
        const created = await createTutorSession(effectiveCourseId, { topicId: chosen, mode });
        activeId = created.id;
        setSessionId(activeId);
        listAsync.reload();
      }
      await sendLiveTutorMessage(effectiveCourseId, activeId, clean);
      sessionAsync.reload();
    } catch (err) {
      setNotice(apiErrorText(err, lang));
      sessionAsync.reload();
    } finally {
      setTyping(false);
    }
  };

  const askTopic = (topic) => ask(`${t("Explain", "اشرح")} ${topic.label?.[lang] ?? topic.label?.en}`, topic.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: bodyFont(lang), direction: isRtl ? "rtl" : "ltr" }}>
      <div style={{ padding: mobile ? "18px 16px 0" : "22px 28px 0", maxWidth: 820, width: "100%", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12, flexDirection: isRtl ? "row-reverse" : "row" }}>
          <h1 style={{ margin: 0, fontSize: mobile ? 17 : 20, fontWeight: 700, letterSpacing: "-0.02em", color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
            {t("AI Tutor", "المعلّم الذكي")}
          </h1>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
            <CourseSelect courses={courses} value={effectiveCourseId ?? ""} onChange={setCourseId} tokens={tokens} lang={lang} placeholder={t("Choose course…", "اختار مقرر…")} />
            <Chip tokens={tokens} tone="primary">
              {t(`Grounded in ${course?.code ?? course?.title?.en ?? "course"} materials`, `مستند لمواد ${course?.code ?? course?.title?.en ?? "المقرر"}`)}
            </Chip>
            <Btn tokens={tokens} lang={lang} variant="ghost" style={{ padding: "6px 12px", fontSize: 11.5 }} onClick={() => setShowHistory((v) => !v)}>
              {t("Sessions", "الجلسات")}
            </Btn>
            {sessionId && (
              <Btn tokens={tokens} lang={lang} variant="ghost" style={{ padding: "6px 12px", fontSize: 11.5 }} onClick={() => { setSessionId(""); setNotice(null); }}>
                {t("New chat", "محادثة جديدة")}
              </Btn>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14, flexDirection: isRtl ? "row-reverse" : "row" }}>
          {topics.slice(0, 8).map((topic) => (
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
              {topic.label?.[lang] ?? topic.label?.en}
            </button>
          ))}
        </div>
        {notice && <div style={{ marginBottom: 10 }}><AlertStrip tokens={tokens} lang={lang} tone="violet" icon={<span style={{ fontSize: 12 }}>!</span>} title={notice} /></div>}
      </div>

      <AsyncGate
        tokens={tokens}
        lang={lang}
        loading={coursesAsync.loading || sessionAsync.loading}
        error={coursesAsync.error ?? sessionAsync.error}
        reload={() => { coursesAsync.reload(); sessionAsync.reload(); }}
        label={t("Opening your tutor…", "جاري فتح المعلّم…")}
      >
        {showHistory && (
          <div style={{ padding: mobile ? "0 16px 12px" : "0 28px 12px", maxWidth: 820, width: "100%", margin: "0 auto" }}>
            <Card tokens={tokens} style={{ padding: "12px 14px" }}>
              <div style={{ fontFamily: headingFont(lang), fontWeight: 700, fontSize: 13, color: tokens.textPrimary, marginBottom: 8 }}>
                {t("Your sessions", "جلساتك")}
              </div>
              {historyRows.length === 0 ? (
                <p style={{ fontFamily: bodyFont(lang), fontSize: 12, color: tokens.textFaint, margin: 0 }}>{t("No tutor sessions yet.", "لسه مفيش جلسات معلّم.")}</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {historyRows.map((row) => (
                    <div key={row.id} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                      <span style={{ fontFamily: bodyFont(lang), fontSize: 12.5, fontWeight: 600, color: tokens.textPrimary, flex: 1, textAlign: isRtl ? "right" : "left" }}>
                        {topicLabel(row.topicId)}
                      </span>
                      <Chip tokens={tokens} tone="developing">{lang === "ar" ? TUTOR_MODE_LABELS[row.mode]?.ar ?? row.mode : TUTOR_MODE_LABELS[row.mode]?.en ?? row.mode}</Chip>
                      <span style={{ fontFamily: bodyFont(lang), fontSize: 11, color: tokens.textMuted }}>{row.messageCount} {t("messages", "رسالة")}</span>
                      <Btn tokens={tokens} lang={lang} variant="ghost" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => { setSessionId(row.id); setShowHistory(false); }}>
                        {t("Open", "فتح")}
                      </Btn>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto", padding: mobile ? "6px 16px 18px" : "6px 28px 18px", maxWidth: 820, width: "100%", margin: "0 auto" }}>
          {messages.length === 0 && !typing && (
            <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
              <div style={{ maxWidth: "78%", background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 12, borderTopLeftRadius: 4, padding: "10px 14px" }}>
                <div style={{ fontSize: 13.5, lineHeight: 1.6, color: tokens.textPrimary }}>
                  {t("Ask me anything about your course — answers come from its approved materials.", "اسألني أي حاجة عن مقررك — الإجابات جايه من مواده المعتمدة.")}
                </div>
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} style={{ display: "flex", justifyContent: m.role === "student" ? "flex-end" : "flex-start", marginBottom: 12 }}>
              <div
                style={{
                  maxWidth: "78%",
                  background: m.role === "student" ? tokens.primaryLight : tokens.inset,
                  border: `1px solid ${m.role === "student" ? `${tokens.primary}33` : tokens.cardBorder}`,
                  borderRadius: 12,
                  padding: "10px 14px",
                  ...(m.role === "student" ? { borderTopRightRadius: 4 } : { borderTopLeftRadius: 4 }),
                }}
              >
                <div style={{ fontSize: 13.5, lineHeight: 1.6, color: tokens.textPrimary, whiteSpace: "pre-wrap", textAlign: isRtl ? "right" : "left" }}>{m.content}</div>
                {(m.citations ?? []).length > 0 && (
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {m.citations.slice(0, 3).map((c) => (
                      <span
                        key={c.chunkId}
                        title={c.chunkId}
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
                        {(c.snippet ?? c.chunkId).slice(0, 40)}
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
          <div ref={endRef} />
        </div>

        <div style={{ padding: mobile ? "12px 16px 22px" : "12px 28px 22px", maxWidth: 820, width: "100%", margin: "0 auto" }}>
          {!sessionId && topics.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
              <TopicSelect topics={topics} value={topicId} onChange={setTopicId} tokens={tokens} lang={lang} placeholder={t("Topic for a new chat…", "موضوع المحادثة الجديدة…")} />
              <select value={mode} onChange={(event) => setMode(event.target.value)} style={{ ...inputStyle(tokens, bodyFont(lang)), minWidth: 150, cursor: "pointer" }} className="genai-input">
                {Object.entries(TUTOR_MODE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{lang === "ar" ? label.ar : label.en}</option>
                ))}
              </select>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask(input)}
              placeholder={t(`Ask about a ${course?.code ?? "course"} topic…`, `اسأل عن موضوع من ${course?.code ?? "المقرر"}…`)}
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
      </AsyncGate>
    </div>
  );
}

export default function TutorPage(props) {
  if (demoMode()) return <DemoTutorPage {...props} />;
  return <RealTutorPage {...props} />;
}
