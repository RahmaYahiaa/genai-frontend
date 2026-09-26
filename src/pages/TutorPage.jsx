import { demoMode } from "@/services/auth";
import useStudyCourse from "@/hooks/useStudyCourse";
import { useCallback, useEffect, useRef, useState } from "react";
import { listCourses, listMaterials } from "@/services/courses";
import { listTutorSessions, renameTutorSession, deleteTutorSession, createTutorSession, getTutorSession, sendTutorMessage as sendLiveTutorMessage, getAiHealth, TUTOR_MODE_LABELS } from "@/services/learning";
import { apiErrorText } from "@/services/http";
import { CoursePicker, Panel, IconTile, PrimaryButton, SecondaryButton, TextButton, Notice, LoadingBlock, ErrorBlock, EmptyBlock, Spinner as KitSpinner } from "@/components/study/StudyKit";
import { IconTutor, IconHistory, IconPencil, IconTrash, IconCheck, IconX, IconArrowUpRight } from "@/components/Icons";
import IconAction from "@/components/IconAction";
import { SCREENS } from "@/constants/routes";
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
          {t("Answers use your course materials, with sources.", "الإجابات تستخدم مواد المقرر المعتمدة فقط — مع الإحالة للمصادر.")}
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
  const [courseId, setCourseId] = useStudyCourse();
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
  // Live AI-engine status (bridge health + LeRna capabilities); silently
  // degrades when the AI service is offline — the tutor keeps working via
  // the legacy path and refuses honestly instead of inventing answers.
  const loadHealth = useCallback(() => getAiHealth().catch(() => null), []);
  const healthAsync = useAsync(loadHealth);
  // The health call itself can succeed while the AI engine has no working model.
  const aiReady = Boolean(healthAsync.data) && !healthAsync.data?.fallback && healthAsync.data?.ai_status?.real_generation_ready !== false;
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
          setNotice(t("Choose a topic first so the tutor knows where to look.", "اختر موضوعًا أولًا حتى يعرف المعلم أين يبحث."));
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
        abstained && selectedMaterialIds.length > 0
          ? t("The file you chose doesn't cover this. Pick \"All course files\" or ask something else.", "الملف اللي اخترته مافيهوش ده. اختار \"كل ملفات المقرر\" أو اسأل حاجة تانية.")
          : abstained
          ? t(
              "I couldn't find a reliable answer to that, either in your course or in trusted academic sources. Try asking it a different way.",
              "مالقيتش إجابة موثوقة لده، لا في مقررك ولا في المصادر الأكاديمية الموثوقة. جرّب تسأل بطريقة تانية.",
            )
          : err?.status === 503 || err?.status >= 500 || !err?.status
            ? t("The tutor couldn't answer right now. Please try again in a moment.", "المعلم مقدرش يجاوب دلوقتي. جرّب تاني كمان شوية.")
            : apiErrorText(err, lang),
      );
      sessionAsync.reload();
    } finally {
      setTyping(false);
    }
  };

  
  // Suggested opening prompts (only on an empty chat) — they feed the exact
  // same ask() pipe as the composer, so nothing here is a mock.
  const suggestedPrompts = [
    topics[0] && { label: t(`Explain «${topics[0].label?.[lang] ?? topics[0].label?.en}» simply`, `اشرح «${topics[0].label?.[lang] ?? topics[0].label?.en}» ببساطة`), topicId: topics[0].id },
    topics[1] && { label: t(`Give me a worked example from «${topics[1].label?.[lang] ?? topics[1].label?.en}»`, `أعطني مثالًا محلولًا من «${topics[1].label?.[lang] ?? topics[1].label?.en}»`), topicId: topics[1].id },
    { label: t("Quiz me with one question on this topic", "اختبرني بسؤال واحد على هذا الموضوع"), topicId: null },
    { label: t("Summarize what matters for revision", "لخّص لي أهم ما في المراجعة"), topicId: null },
  ].filter(Boolean);

  const topicName = (id) => topics.find((topic) => topic.id === id)?.label?.[lang] ?? topics.find((topic) => topic.id === id)?.label?.en ?? "";
  const smallSelect = { height: 32, padding: "0 10px", borderRadius: 8, border: `1px solid ${tokens.cardBorder}`, background: tokens.card, color: tokens.textSecondary, fontSize: 12.5, fontFamily: "inherit", cursor: "pointer", maxWidth: 200 };
  const column = { maxWidth: 780, width: "100%", margin: "0 auto", padding: mobile ? "0 16px" : "0 32px", boxSizing: "border-box" };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: bodyFont(lang), direction: isRtl ? "rtl" : "ltr" }}>
      <div style={{ ...column, paddingTop: mobile ? 16 : 24, paddingBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: tokens.textPrimary, fontFamily: headingFont(lang) }}>{t("AI Tutor", "المعلم الذكي")}</h1>
            <CoursePicker tokens={tokens} lang={lang} courses={courses} value={effectiveCourseId ?? ""} onChange={setCourseId} />
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {historyRows.length > 0 && (
              <IconAction tokens={tokens} active={showHistory} label={showHistory ? t("Close chat history", "اقفل سجل المحادثات") : t("Chat history", "سجل المحادثات")} onClick={() => setShowHistory((v) => !v)}>
                <IconHistory size={18} />
              </IconAction>
            )}
            {sessionId && <SecondaryButton tokens={tokens} style={{ height: 36, padding: "0 14px", fontSize: 13 }} onClick={() => { setSessionId(""); setNotice(null); }}>{t("New chat", "محادثة جديدة")}</SecondaryButton>}
          </div>
        </div>
        {activeTopicLabel && <div style={{ fontSize: 13, color: tokens.textMuted, marginTop: 6 }}>{t("Topic", "الموضوع")}: {activeTopicLabel}</div>}
      </div>

      <div style={column}>
        {notice && <Notice tokens={tokens} tone="warning">{notice}</Notice>}
        {showHistory && (
          <ChatHistory
            tokens={tokens}
            t={t}
            lang={lang}
            rows={historyRows}
            activeId={sessionId}
            topicName={topicName}
            onOpen={(id) => { setSessionId(id); setShowHistory(false); }}
            onRename={async (id, title) => { await renameTutorSession(effectiveCourseId, id, title); listAsync.reload(); }}
            onDelete={async (id) => {
              await deleteTutorSession(effectiveCourseId, id);
              if (id === sessionId) setSessionId("");
              listAsync.reload();
            }}
          />
        )}
      </div>

      {coursesAsync.loading || sessionAsync.loading ? (
        <LoadingBlock tokens={tokens} label={t("Loading…", "جاري التحميل…")} />
      ) : coursesAsync.error ? (
        <div style={column}><ErrorBlock tokens={tokens} lang={lang} onRetry={coursesAsync.reload} /></div>
      ) : courses.length === 0 ? (
        <div style={column}>
          <EmptyBlock tokens={tokens} Icon={IconTutor} title={t("Join a course first", "اشترك في مقرر الأول")} body={t("The tutor answers questions about your course.", "المعلم بيجاوب على أسئلة عن مقررك.")}
            action={<PrimaryButton tokens={tokens} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.COURSES })}>{t("Go to my courses", "روح لمقرراتي")}</PrimaryButton>} />
        </div>
      ) : (
        <>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <div style={{ ...column, paddingBottom: 16 }}>
              {messages.length === 0 && !typing && (
                <div style={{ textAlign: "center", padding: mobile ? "24px 0" : "48px 0 24px" }}>
                  <IconTile tokens={tokens} Icon={IconTutor} size={56} />
                  <h2 style={{ margin: "16px 0 6px", fontSize: 20, fontWeight: 650, color: tokens.textPrimary }}>{t("What would you like to learn?", "عايز تتعلّم إيه؟")}</h2>
                  <p style={{ margin: "0 auto 24px", fontSize: 14, color: tokens.textMuted, maxWidth: 440, lineHeight: 1.6 }}>
                    {t("Ask a question about your course, or start with one of these.", "اسأل سؤال عن مقررك، أو ابدأ بواحد من دول.")}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 10, textAlign: "start" }}>
                    {suggestedPrompts.map((prompt) => (
                      <button key={prompt.label} type="button" className="genai-row" disabled={typing} onClick={() => void ask(prompt.label, prompt.topicId)}
                        style={{ padding: "14px 16px", borderRadius: 12, border: `1px solid ${tokens.cardBorder}`, background: tokens.card, color: tokens.textPrimary, fontSize: 13.5, lineHeight: 1.5, textAlign: "inherit", cursor: "pointer", fontFamily: "inherit" }}>
                        {prompt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => {
                const mine = m.role === "student";
                return (
                  <div key={m.id} style={{ display: "flex", gap: 10, justifyContent: mine ? "flex-end" : "flex-start", margin: "16px 0" }}>
                    {!mine && <IconTile tokens={tokens} Icon={IconTutor} size={32} />}
                    <div style={{ maxWidth: mobile ? "88%" : "78%" }}>
                      <div style={{ padding: mine ? "10px 14px" : "12px 16px", borderRadius: 14, background: mine ? tokens.primaryBtn : tokens.card, color: mine ? "#fff" : tokens.textPrimary, border: mine ? "none" : `1px solid ${tokens.cardBorder}`, fontSize: 14.5, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                        {m.content}
                      </div>
                      {!mine && m.evidenceLimitation && (
                        <div style={{ marginTop: 6, fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.6 }}>{t("Note", "ملحوظة")}: {m.evidenceLimitation}</div>
                      )}
                      {!mine && (m.citations ?? []).length > 0 && (
                        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: tokens.textMuted }}>{m.grounding === "external_trusted" ? t("Sources (outside your course):", "المصادر (من خارج المقرر):") : t("From your course:", "من مقررك:")}</span>
                          {m.citations.slice(0, 4).map((c, index) =>
                            c.sourceUrl ? (
                              <a key={`ext-${index}`} href={c.sourceUrl} target="_blank" rel="noopener noreferrer" title={c.sourceTitle ?? c.sourceUrl}
                                style={{ fontSize: 12, padding: "3px 10px", borderRadius: 999, background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, color: tokens.primary, textDecoration: "none" }}>
                                {(c.sourceTitle ?? c.sourceDomain ?? c.sourceUrl).slice(0, 40)}
                              </a>
                            ) : (
                              <span key={c.chunkId ?? `mat-${index}`} title={c.snippet ?? ""}
                                style={{ fontSize: 12, padding: "3px 10px", borderRadius: 999, background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, color: tokens.textSecondary }}>
                                {(c.snippet ?? "").slice(0, 36)}…
                              </span>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {typing && (
                <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "16px 0", color: tokens.textMuted, fontSize: 13.5 }}>
                  <IconTile tokens={tokens} Icon={IconTutor} size={32} />
                  <KitSpinner color={tokens.primary} /> {t("Writing an answer…", "بيكتب الإجابة…")}
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>

          <div style={{ ...column, paddingBottom: mobile ? 14 : 22, paddingTop: 8 }}>
            <div style={{ border: `1px solid ${tokens.cardBorder}`, borderRadius: 16, background: tokens.card, boxShadow: "0 4px 16px rgba(16,24,40,0.06)", padding: "10px 12px 10px 14px" }}>
              <textarea
                value={input}
                rows={2}
                aria-label={t("Your question", "سؤالك")}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void ask(input); } }}
                placeholder={t("Ask your question…", "اكتب سؤالك…")}
                style={{ width: "100%", boxSizing: "border-box", border: "none", outline: "none", resize: "none", background: "transparent", color: tokens.textPrimary, fontSize: 14.5, lineHeight: 1.6, fontFamily: "inherit", maxHeight: 160 }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {!sessionId && topics.length > 0 && (
                    <select aria-label={t("Topic", "الموضوع")} value={topicId} onChange={(e) => setTopicId(e.target.value)} style={smallSelect}>
                      <option value="">{t("Any topic", "أي موضوع")}</option>
                      {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.label?.[lang] ?? topic.label?.en}</option>)}
                    </select>
                  )}
                  {!sessionId && (
                    <select aria-label={t("Answer style", "أسلوب الإجابة")} value={mode} onChange={(e) => setMode(e.target.value)} style={smallSelect}>
                      {Object.entries(TUTOR_MODE_LABELS).map(([key, label]) => <option key={key} value={key}>{lang === "ar" ? label.ar : label.en}</option>)}
                    </select>
                  )}
                  {materials.length > 0 && (
                    <select aria-label={t("Answer from", "الإجابة من")} value={selectedMaterialIds[0] ?? ""} onChange={(e) => setSelectedMaterialIds(e.target.value ? [e.target.value] : [])} style={smallSelect}>
                      <option value="">{t("All course files", "كل ملفات المقرر")}</option>
                      {materials.map((material) => <option key={material.id} value={material.id}>{material.title}</option>)}
                    </select>
                  )}
                </div>
                <button type="button" aria-label={t("Send", "إرسال")} onClick={() => void ask(input)} disabled={typing || !input.trim()}
                  style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: tokens.primaryBtn, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: typing || !input.trim() ? "not-allowed" : "pointer", opacity: typing || !input.trim() ? 0.45 : 1 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" aria-hidden="true" style={{ transform: isRtl ? "scaleX(-1)" : "none" }}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </button>
              </div>
            </div>
            <div style={{ fontSize: 12, color: tokens.textFaint, textAlign: "center", marginTop: 8 }}>{t("Answers are based on your course materials. Always double-check important information.", "الإجابات مبنية على مواد مقررك. راجع المعلومات المهمة دايماً.")}</div>
          </div>
        </>
      )}
    </div>
  );
}

function chatTitle(row, topicName, t) {
  if (row.title) return row.title;
  const first = (row.messages ?? []).find((m) => m.role === "student")?.content;
  if (first) return first.length > 70 ? `${first.slice(0, 70)}…` : first;
  return topicName(row.topicId) || t("Chat", "محادثة");
}

function ChatHistory({ tokens, t, lang, rows, activeId, topicName, onOpen, onRename, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");
  const [confirming, setConfirming] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const run = async (id, fn) => {
    setBusy(id);
    setError(null);
    try { await fn(); } catch (err) { setError(apiErrorText(err, lang)); } finally { setBusy(null); }
  };
  const fmt = (d) => (d ? new Date(d).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "short" }) : "");
  return (
    <Panel tokens={tokens} padding={0} style={{ marginBottom: 16, overflow: "hidden" }}>
      <div style={{ padding: "12px 18px", fontSize: 13, fontWeight: 650, color: tokens.textSecondary, borderBottom: `1px solid ${tokens.cardBorder}` }}>
        {t("Chat history", "سجل المحادثات")}
      </div>
      {error && <div style={{ padding: "8px 18px" }}><Notice tokens={tokens} tone="warning">{error}</Notice></div>}
      <div style={{ maxHeight: 340, overflowY: "auto" }}>
        {rows.map((row, i) => {
          const count = row.messageCount ?? row.messages?.length ?? 0;
          const isEditing = editing === row.id;
          const isConfirming = confirming === row.id;
          const title = chatTitle(row, topicName, t);
          return (
            <div key={row.id} className="genai-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px 10px 18px", borderTop: i ? `1px solid ${tokens.cardBorder}` : "none", background: row.id === activeId ? tokens.primaryLight : undefined }}>
              {isEditing ? (
                <form style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }} onSubmit={(e) => { e.preventDefault(); run(row.id, async () => { await onRename(row.id, draft.trim() || null); setEditing(null); }); }}>
                  <input autoFocus value={draft} maxLength={120} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") setEditing(null); }}
                    aria-label={t("Chat name", "اسم المحادثة")}
                    style={{ flex: 1, height: 34, padding: "0 10px", borderRadius: 8, border: `1px solid ${tokens.primary}66`, background: tokens.card, color: tokens.textPrimary, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
                  <IconAction tokens={tokens} label={t("Save name", "احفظ الاسم")} disabled={busy === row.id} onClick={(e) => e.currentTarget.form.requestSubmit()}><IconCheck size={16} /></IconAction>
                  <IconAction tokens={tokens} label={t("Cancel", "إلغاء")} onClick={() => setEditing(null)}><IconX size={16} /></IconAction>
                </form>
              ) : (
                <>
                  <button type="button" onClick={() => onOpen(row.id)} style={{ flex: 1, minWidth: 0, textAlign: "start", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: tokens.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
                    <div style={{ fontSize: 12, color: tokens.textMuted, marginTop: 2 }}>
                      {[topicName(row.topicId), fmt(row.updatedAt ?? row.createdAt), `${count} ${t("messages", "رسالة")}`].filter(Boolean).join(" · ")}
                    </div>
                  </button>
                  {isConfirming ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12.5, color: tokens.textSecondary }}>{t("Delete this chat?", "تمسح المحادثة دي؟")}</span>
                      <IconAction tokens={tokens} danger label={t("Delete", "امسح")} disabled={busy === row.id} onClick={() => run(row.id, async () => { await onDelete(row.id); setConfirming(null); })}><IconCheck size={16} /></IconAction>
                      <IconAction tokens={tokens} label={t("Cancel", "إلغاء")} onClick={() => setConfirming(null)}><IconX size={16} /></IconAction>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 6 }}>
                      <IconAction tokens={tokens} label={t("Open chat", "افتح المحادثة")} onClick={() => onOpen(row.id)}><IconArrowUpRight size={16} /></IconAction>
                      <IconAction tokens={tokens} label={t("Rename", "غيّر الاسم")} onClick={() => { setConfirming(null); setEditing(row.id); setDraft(row.title ?? title); }}><IconPencil size={16} /></IconAction>
                      <IconAction tokens={tokens} danger label={t("Delete chat", "امسح المحادثة")} onClick={() => { setEditing(null); setConfirming(row.id); }}><IconTrash size={16} /></IconAction>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export default function TutorPage(props) {
  if (demoMode()) return <DemoTutorPage {...props} />;
  return <RealTutorPage {...props} />;
}
