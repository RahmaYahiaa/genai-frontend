import { demoMode } from "@/services/auth";
import { useCallback, useEffect, useRef, useState } from "react";
import { listCourses, listMaterials } from "@/services/courses";
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
import { LearningHeader, AIWorking, SessionHistoryList, sessionStatusTone } from "@/components/learning";

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
function RealTutorPage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const mobile = useMediaQuery("(max-width: 760px)");
  const isRtl = lang === "ar";
  const [courseId, setCourseId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [mode, setMode] = useState("explanation");
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [notice, setNotice] = useState(null);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState([]);
  const endRef = useRef(null);

  const loadCourses = useCallback(() => listCourses(), []);
  const coursesAsync = useAsync(loadCourses);
  const courses = coursesAsync.data?.items ?? [];
  const effectiveCourseId = courseId || courses[0]?.id || null;
  const course = courses.find((item) => item.id === effectiveCourseId);
  const topics = course?.topics ?? [];

  // Course materials for the optional "answer from these files" scoping
  // (EDUNation "Use materials" parity). Indexed (embedded) materials only.
  const loadMaterials = useCallback(
    () => (effectiveCourseId ? listMaterials(effectiveCourseId).catch(() => []) : Promise.resolve([])),
    [effectiveCourseId],
  );
  const materialsAsync = useAsync(loadMaterials);
  // In AI-bridge mode indexing is lazy per student, so a ready file with
  // zero local chunks is still scopeable; otherwise keep chunk-backed items.
  const materials = (materialsAsync.data ?? []).filter(
    (item) => (item.chunkCount ?? 0) > 0 || item.status === "ready",
  );

  useEffect(() => {
    setSessionId("");
    setTopicId("");
    setShowHistory(false);
    setNotice(null);
    setSelectedMaterialIds([]);
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
  const activeTopicLabel = session?.topicId
    ? (topics.find((topic) => topic.id === session.topicId)?.label?.[lang] ?? null)
    : null;

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
          setNotice(t("Pick a topic first so the tutor knows where to look.", "اختر موضوعًا أولًا حتى يعرف المعلم أين يبحث."));
          return;
        }
        const created = await createTutorSession(effectiveCourseId, { topicId: chosen, mode });
        activeId = created.id;
        setSessionId(activeId);
        listAsync.reload();
      }
      await sendLiveTutorMessage(effectiveCourseId, activeId, clean, selectedMaterialIds);
      setNotice(null);
      sessionAsync.reload();
    } catch (err) {
      const message = String(err?.message ?? "");
      const abstained = err?.status === 422 || /insufficient|trusted material|trusted external/i.test(message);
      setNotice(
        abstained
          ? t(
              "No trusted source (course material or verified external academic source) is close enough to answer this safely. Try rephrasing, or ask about a topic covered by your materials.",
              "لا توجد مصادر موثوقة (من مواد المقرر أو من مصادر أكاديمية خارجية موثّقة) قريبة بما يكفي للإجابة بأمان. حاول إعادة الصياغة، أو اسأل عن موضوع تغطيه المواد.",
            )
          : apiErrorText(err, lang),
      );
      sessionAsync.reload();
    } finally {
      setTyping(false);
    }
  };

  const askTopic = (topic) => ask(`${t("Explain", "اشرح")} ${topic.label?.[lang] ?? topic.label?.en}`, topic.id);

  // Suggested opening prompts (only on an empty chat) — they feed the exact
  // same ask() pipe as the composer, so nothing here is a mock.
  const suggestedPrompts = [
    topics[0] && { label: t(`Explain «${topics[0].label?.[lang] ?? topics[0].label?.en}» simply`, `اشرح «${topics[0].label?.[lang] ?? topics[0].label?.en}» ببساطة`), topicId: topics[0].id },
    topics[1] && { label: t(`Give me a worked example from «${topics[1].label?.[lang] ?? topics[1].label?.en}»`, `أعطني مثالًا محلولًا من «${topics[1].label?.[lang] ?? topics[1].label?.en}»`), topicId: topics[1].id },
    { label: t("Quiz me with one question on this topic", "اختبرني بسؤال واحد على هذا الموضوع"), topicId: null },
    { label: t("Summarize what matters for revision", "لخّص لي أهم ما في المراجعة"), topicId: null },
  ].filter(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: bodyFont(lang), direction: isRtl ? "rtl" : "ltr" }}>
      <div style={{ padding: mobile ? "16px 16px 0" : "20px 28px 0", maxWidth: 860, width: "100%", margin: "0 auto" }}>
        <LearningHeader
          tokens={tokens}
          lang={lang}
          mobile={mobile}
          journeyCurrent="tutor"
          dispatch={dispatch}
          kicker={activeTopicLabel ?? t("Step 2 · Understand", "الخطوة 2 · افهم")}
          kickerTone={activeTopicLabel ? "primary" : "primary"}
          title={t("AI Tutor", "المعلم الذكي")}
          subtitle={t(
            "Ask anything about the current topic — answers come from approved course materials, and from verified external academic sources when materials are not enough.",
            "اسأل أي سؤال عن الموضوع الحالي — الإجابات مستمدة من مواد المقرر المعتمدة، ومن مصادر أكاديمية خارجية موثّقة عند عدم كفاية المواد.",
          )}
          actions={
            <>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: tokens.textMuted, display: "inline-flex", flexDirection: "column", gap: 4 }}>
                {t("Course", "المقرر")}
                <CourseSelect courses={courses} value={effectiveCourseId ?? ""} onChange={setCourseId} tokens={tokens} lang={lang} placeholder={t("Choose course…", "اختر مقررًا…")} />
              </label>
              <Btn tokens={tokens} lang={lang} variant="ghost" style={{ padding: "8px 14px", fontSize: 12, alignSelf: "flex-end" }} onClick={() => setShowHistory((v) => !v)}>
                {showHistory ? t("Hide sessions", "إخفاء الجلسات") : t("Sessions", "الجلسات")}
              </Btn>
              {sessionId && (
                <Btn tokens={tokens} lang={lang} variant="soft" style={{ padding: "8px 14px", fontSize: 12, alignSelf: "flex-end" }} onClick={() => { setSessionId(""); setNotice(null); }}>
                  {t("New chat", "محادثة جديدة")}
                </Btn>
              )}
            </>
          }
        />
        {notice && <div style={{ marginBottom: 10 }}><AlertStrip tokens={tokens} lang={lang} tone="violet" icon={<span style={{ fontSize: 12 }}>!</span>} title={notice} /></div>}
      </div>

      <AsyncGate
        tokens={tokens}
        lang={lang}
        loading={coursesAsync.loading || sessionAsync.loading}
        error={coursesAsync.error ?? sessionAsync.error}
        reload={() => { coursesAsync.reload(); sessionAsync.reload(); }}
        label={t("Opening your tutor…", "جاري فتح المعلم…")}
      >
        {showHistory && (
          <div style={{ padding: mobile ? "0 16px 12px" : "0 28px 12px", maxWidth: 860, width: "100%", margin: "0 auto" }}>
            <SessionHistoryList
              rows={historyRows}
              tokens={tokens}
              lang={lang}
              isRtl={isRtl}
              mobile={mobile}
              emptyLabel={t("No tutor sessions yet.", "لا توجد جلسات معلم بعد.")}
              emptyHint={t("Ask one of the suggested questions below to open your first session.", "اسأل أحد الأسئلة المقترحة أدناه لتفتح أول جلسة لك.")}
              onOpen={(row) => { setSessionId(row.id); setShowHistory(false); }}
              renderTitle={(row) => topics.find((topic) => topic.id === row.topicId)?.label?.[lang] ?? row.topicId}
              statusTone={() => "primary"}
              statusLabel={(row) => (lang === "ar" ? TUTOR_MODE_LABELS[row.mode]?.ar ?? row.mode : TUTOR_MODE_LABELS[row.mode]?.en ?? row.mode)}
              renderMeta={(row) => <span>{row.messageCount} {t("messages", "رسالة")}</span>}
            />
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto", padding: mobile ? "6px 16px 14px" : "6px 28px 14px", maxWidth: 860, width: "100%", margin: "0 auto" }}>
          {messages.length === 0 && !typing && (
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  maxWidth: "88%",
                  background: tokens.inset,
                  border: `1px solid ${tokens.cardBorder}`,
                  borderRadius: 14,
                  ...(isRtl ? { borderTopLeftRadius: 4 } : { borderTopLeftRadius: 14, borderTopRightRadius: 14, borderBottomRightRadius: 4 }),
                  padding: "12px 16px",
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: tokens.textFaint, marginBottom: 6 }}>
                  {t("AI Tutor", "المعلم الذكي")}
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.75, color: tokens.textPrimary, textAlign: isRtl ? "right" : "left" }}>
                  {t("Ask me anything about your course — answers come from approved materials, and from verified external academic sources when needed.", "اسألني أي سؤال عن مقررك — الإجابات مستمدة من مواده المعتمدة، ومن مصادر أكاديمية خارجية موثّقة عند الحاجة.")}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 560 }}>
                <div style={{ fontSize: 11, fontWeight: 650, color: tokens.textFaint, textAlign: isRtl ? "right" : "left" }}>
                  {t("Start with a suggestion:", "ابدأ بأحد الاقتراحات:")}
                </div>
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt.label}
                    type="button"
                    disabled={typing}
                    onClick={() => void ask(prompt.label, prompt.topicId)}
                    style={{
                      textAlign: isRtl ? "right" : "left",
                      padding: "9px 13px",
                      borderRadius: 10,
                      border: `1px solid ${tokens.cardBorder}`,
                      background: tokens.card,
                      color: tokens.textSecondary,
                      fontSize: 12.5,
                      fontWeight: 550,
                      cursor: typing ? "not-allowed" : "pointer",
                      fontFamily: bodyFont(lang),
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = tokens.primary; e.currentTarget.style.color = tokens.primary; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = tokens.cardBorder; e.currentTarget.style.color = tokens.textSecondary; }}
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} style={{ display: "flex", justifyContent: m.role === "student" ? "flex-end" : "flex-start", marginBottom: 12 }}>
              <div
                role={m.role === "tutor" ? "article" : undefined}
                aria-label={m.role === "student" ? t("You said", "أنت قلت") : t("The tutor answered", "أجاب المعلم")}
                style={{
                  maxWidth: mobile ? "90%" : "80%",
                  background: m.role === "student" ? tokens.primaryLight : tokens.inset,
                  border: `1px solid ${m.role === "student" ? `${tokens.primary}33` : tokens.cardBorder}`,
                  borderRadius: 14,
                  padding: "11px 15px",
                  ...(m.role === "student"
                    ? (isRtl ? { borderTopLeftRadius: 4 } : { borderTopRightRadius: 4 })
                    : (isRtl ? { borderTopRightRadius: 4 } : { borderTopLeftRadius: 4 })),
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: m.role === "student" ? tokens.primary : tokens.textFaint, marginBottom: 5, textAlign: isRtl ? "right" : "left" }}>
                  {m.role === "student" ? t("You", "أنت") : t("AI Tutor", "المعلم الذكي")}
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.7, color: tokens.textPrimary, whiteSpace: "pre-wrap", textAlign: isRtl ? "right" : "left" }}>{m.content}</div>
                {m.role === "tutor" && m.grounding === "external_trusted" && (
                  <div style={{ marginTop: 7 }}>
                    <Chip tokens={tokens} tone="gap">
                      {t("Grounded in verified external academic sources", "مستند إلى مصادر أكاديمية خارجية موثّقة")}
                    </Chip>
                  </div>
                )}
                {m.role === "tutor" && m.evidenceLimitation && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: "9px 11px",
                      borderRadius: 9,
                      background: tokens.inset,
                      border: `1px dashed ${tokens.cardBorder}`,
                      fontSize: 11.5,
                      lineHeight: 1.7,
                      color: tokens.textMuted,
                      textAlign: isRtl ? "right" : "left",
                    }}
                  >
                    {t("Evidence limitation:", "حدود الأدلة:")} {m.evidenceLimitation}
                  </div>
                )}
                {(m.citations ?? []).length > 0 && (
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {m.citations.slice(0, 4).map((c, index) =>
                      c.sourceUrl ? (
                        <a
                          key={`ext-${index}`}
                          href={c.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`${c.sourceTitle ?? ""} — ${c.sourceUrl}`}
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 10,
                            padding: "4px 9px",
                            borderRadius: 6,
                            background: tokens.citationBg,
                            border: `1px solid ${tokens.citationBorder}`,
                            color: tokens.citation,
                            textDecoration: "none",
                          }}
                        >
                          ↗ {(c.sourceDomain ?? c.sourceTitle ?? c.sourceUrl).slice(0, 42)}
                        </a>
                      ) : (
                        <span
                          key={c.chunkId ?? `mat-${index}`}
                          title={c.snippet ?? ""}
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 10,
                            padding: "4px 9px",
                            borderRadius: 6,
                            background: tokens.citationBg,
                            border: `1px solid ${tokens.citationBorder}`,
                            color: tokens.citation,
                          }}
                        >
                          {(c.snippet ?? "").slice(0, 40)}
                        </span>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {typing && (
            <div style={{ display: "flex", marginBottom: 12 }}>
              <AIWorking tokens={tokens} lang={lang} label={t("Grounded reasoning…", "تفكير مستند للمقرر…")} />
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div
          style={{
            padding: mobile ? "10px 16px 18px" : "10px 28px 18px",
            maxWidth: 860,
            width: "100%",
            margin: "0 auto",
            borderTop: `1px solid ${tokens.cardBorder}`,
            background: tokens.bg,
          }}
        >
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
          {materials.length > 0 && (
            <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap", alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
              <span style={{ fontSize: 11, color: tokens.textFaint }}>
                {t("Answer from:", "مصدر الإجابة:")}
              </span>
              {materials.slice(0, 6).map((material) => {
                const active = selectedMaterialIds.includes(material.id);
                return (
                  <button
                    key={material.id}
                    type="button"
                    onClick={() =>
                      setSelectedMaterialIds((ids) =>
                        active ? ids.filter((id) => id !== material.id) : [...ids, material.id],
                      )
                    }
                    title={t(
                      "Restrict the answer to this material",
                      "تقييد الإجابة بهذه المادة",
                    )}
                    style={{
                      padding: "5px 11px",
                      borderRadius: 8,
                      border: `1px solid ${active ? tokens.primary : tokens.cardBorder}`,
                      background: active ? tokens.primaryLight : tokens.card,
                      color: active ? tokens.primaryHover : tokens.textSecondary,
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {material.title}
                  </button>
                );
              })}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea
              value={input}
              rows={1}
              aria-label={t("Your question", "سؤالك")}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void ask(input);
                }
              }}
              placeholder={t(`Ask about a ${course?.code ?? "course"} topic…`, `اسأل عن موضوع من ${course?.code ?? "المقرر"}…`)}
              className="genai-input"
              style={{
                flex: 1,
                padding: "11px 14px",
                borderRadius: 12,
                border: `1.5px solid ${tokens.cardBorder}`,
                background: tokens.inset,
                color: tokens.textPrimary,
                fontSize: 13.5,
                lineHeight: 1.55,
                outline: "none",
                resize: "none",
                maxHeight: 132,
                overflowY: "auto",
                fontFamily: bodyFont(lang),
              }}
            />
            <Btn tokens={tokens} onClick={() => void ask(input)} disabled={typing || !input.trim()} style={{ borderRadius: 12, padding: "11px 18px", boxShadow: tokens.primaryShadow }}>
              {typing ? t("…", "…") : t("Send", "إرسال")}
            </Btn>
          </div>
          <div style={{ marginTop: 7, fontSize: 10.5, color: tokens.textFaint, display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <span>{t("Enter to send · Shift+Enter for a new line", "Enter للإرسال · Shift+Enter لسطر جديد")}</span>
            <span>{t("Answers are always cited to their sources.", "الإجابات مذيلة دائمًا بمصادرها.")}</span>
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
