import { useCallback, useEffect, useState } from "react";
import useStudyCourse from "@/hooks/useStudyCourse";
import { getCourse, listCourses } from "@/services/courses";
import {
  KIND_LABELS,
  LANGUAGE_OPTIONS,
  RESOURCE_KINDS,
  deleteResource,
  downloadAnyResource,
  downloadResourceFile,
  fetchArtifactDataUri,
  generateResources,
  listResources,
} from "@/services/studyTools";
import { apiErrorText } from "@/services/http";
import { CourseSelect } from "@/components/SessionSolver";
import { AlertStrip, inputStyle } from "@/components/ModuleUI";
import { Card, Chip, Btn, AsyncGate } from "@/components/ui";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { IconDownload, IconEye, IconEyeOff, IconTrash } from "@/components/Icons";
import IconAction from "@/components/IconAction";

// Study Tools (EDUNation parity): turn any topic into grounded study
// resources — text kinds render inline, diagram previews as SVG, the deck
// downloads as a real PPTX, and unsupported kinds state honestly why.

function ResourceBody({ resource, tokens, lang, t, mobile }) {
  const isRtl = lang === "ar";
  const align = isRtl ? "right" : "left";
  const [svgUri, setSvgUri] = useState(null);
  const [revealed, setRevealed] = useState({});
  const [downError, setDownError] = useState(null);

  useEffect(() => {
    let active = true;
    if (resource.kind === "diagram" && resource.hasArtifact) {
      fetchArtifactDataUri(resource.id)
        .then((uri) => active && setSvgUri(uri))
        .catch(() => active && setSvgUri(null));
    }
    return () => {
      active = false;
    };
  }, [resource.id, resource.kind, resource.hasArtifact]);

  if (resource.status === "unavailable") {
    return (
      <div style={{ fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.7, textAlign: align }}>
        {t(
          "We couldn't create this one right now. Please try again in a moment.",
          "مقدرناش نعمل ده دلوقتي. جرّب تاني كمان شوية.",
        )}
      </div>
    );
  }

  const c = resource.content ?? {};

  // AI text resources come back as a single authored text block; render
  // it verbatim (markdown-ish) instead of the legacy structured shapes.
  if (typeof c.text === "string" && c.text.trim()) {
    return (
      <div
        style={{
          textAlign: align,
          fontSize: 12.7,
          lineHeight: 1.85,
          color: tokens.textPrimary,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
        }}
      >
        {c.text}
      </div>
    );
  }

  if (resource.kind === "summary") {
    return (
      <div style={{ textAlign: align }}>
        <ul style={{ margin: "6px 0", paddingInlineStart: 18, color: tokens.textPrimary, fontSize: 13, lineHeight: 1.8 }}>
          {(c.points ?? []).map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
        {c.takeaway && (
          <div style={{ marginTop: 6, fontSize: 12.5, color: tokens.primaryHover, fontWeight: 600 }}>
            {t("Key takeaway:", "الخلاصة الأساسية:")} {c.takeaway}
          </div>
        )}
      </div>
    );
  }

  if (resource.kind === "notes") {
    return (
      <div style={{ textAlign: align, display: "flex", flexDirection: "column", gap: 10 }}>
        {(c.sections ?? []).map((section, index) => (
          <div key={index}>
            <div style={{ fontSize: 13, fontWeight: 700, color: tokens.textPrimary }}>{section.heading}</div>
            <ul style={{ margin: "4px 0", paddingInlineStart: 18, color: tokens.textSecondary, fontSize: 12.5, lineHeight: 1.8 }}>
              {(section.bullets ?? []).map((bullet, bIndex) => (
                <li key={bIndex}>{bullet}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  if (resource.kind === "flashcards") {
    return <FlashcardDeck cards={c.cards ?? []} tokens={tokens} lang={lang} t={t} />;
  }

  if (resource.kind === "quiz") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: align }}>
        {(c.questions ?? []).map((q, index) => {
          const open = revealed[index];
          return (
            <div key={index} style={{ borderBottom: `1px solid ${tokens.cardBorder}`, paddingBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: tokens.textPrimary, marginBottom: 6 }}>
                {index + 1}. {q.question}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(q.options ?? []).map((option, oIndex) => (
                  <Chip
                    key={oIndex}
                    tokens={tokens}
                    tone={open && oIndex === q.answerIndex ? "mastered" : "slate"}
                  >
                    {option}
                  </Chip>
                ))}
              </div>
              <Btn
                tokens={tokens}
                lang={lang}
                variant="ghost"
                style={{ marginTop: 6, padding: "4px 10px", fontSize: 11 }}
                onClick={() => setRevealed((r) => ({ ...r, [index]: !r[index] }))}
              >
                {open ? t("Hide answer", "إخفاء الإجابة") : t("Show answer", "إظهار الإجابة")}
              </Btn>
              {open && q.why && (
                <div style={{ marginTop: 4, fontSize: 11.5, color: tokens.textMuted, lineHeight: 1.7 }}>{q.why}</div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (resource.kind === "code") {
    return (
      <div style={{ textAlign: "left", direction: "ltr" }}>
        <div style={{ fontSize: 11, color: tokens.textFaint, marginBottom: 4 }}>{c.language}</div>
        <pre
          style={{
            margin: 0,
            padding: "12px 14px",
            borderRadius: 10,
            background: tokens.inset,
            border: `1px solid ${tokens.cardBorder}`,
            color: tokens.textPrimary,
            fontSize: 11.5,
            lineHeight: 1.65,
            overflowX: "auto",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <code>{c.code}</code>
        </pre>
        {c.explanation && (
          <div style={{ marginTop: 8, fontSize: 12.5, color: tokens.textSecondary, lineHeight: 1.8, textAlign: align, direction: isRtl ? "rtl" : "ltr" }}>
            {c.explanation}
          </div>
        )}
      </div>
    );
  }

  if (resource.kind === "diagram") {
    return (
      <div>
        <div
          style={{
            background: "#ffffff",
            border: `1px solid ${tokens.cardBorder}`,
            borderRadius: 12,
            padding: 10,
            overflowX: "auto",
          }}
        >
          {svgUri ? (
            <img src={svgUri} alt={resource.topic} style={{ display: "block", minWidth: 760, width: "100%", height: "auto" }} />
          ) : (
            <div style={{ fontSize: 12, color: tokens.textMuted }}>{t("Loading diagram preview…", "جارٍ تحميل معاينة المخطط…")}</div>
          )}
        </div>
        <ArtifactActions resource={resource} tokens={tokens} lang={lang} t={t} onError={setDownError} error={downError} />
      </div>
    );
  }

  if (resource.kind === "presentation") {
    return (
      <div style={{ textAlign: align }}>
        <div style={{ fontSize: 12.5, color: tokens.textSecondary }}>
          {t("A real slide deck, ready to open and present.", "عرض تقديمي حقيقي، جاهز للفتح والعرض.")}
          {c.deckTitle ? ` — ${c.deckTitle}` : ""}
          {c.slideCount ? ` · ${c.slideCount} ${t("slides", "شريحة")}` : ""}
        </div>
        <ArtifactActions resource={resource} tokens={tokens} lang={lang} t={t} onError={setDownError} error={downError} />
      </div>
    );
  }

  return null;
}

function ArtifactActions({ resource, tokens, lang, t, onError, error }) {
  const [busy, setBusy] = useState(false);
  return (
    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
      <Btn
        tokens={tokens}
        lang={lang}
        variant="soft"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          onError(null);
          try {
            await downloadResourceFile(resource.id);
          } catch (e2) {
            onError(e2?.message ?? "download failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? t("Downloading…", "جارٍ التنزيل…") : t("Download file", "تنزيل الملف")}
      </Btn>
      {error && <span style={{ fontSize: 11, color: tokens.danger ?? "#b33" }}>{error}</span>}
    </div>
  );
}

// One card at a time: tap to flip between question and answer, then move on.
function FlashcardDeck({ cards, tokens, lang, t }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const isRtl = lang === "ar";
  if (cards.length === 0) return null;
  const card = cards[Math.min(index, cards.length - 1)];
  const go = (step) => {
    setFlipped(false);
    setIndex((i) => (i + step + cards.length) % cards.length);
  };
  const face = {
    position: "absolute",
    inset: 0,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    borderRadius: 16,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "22px 26px",
    textAlign: "center",
    boxSizing: "border-box",
  };
  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div
        role="button"
        tabIndex={0}
        aria-label={flipped ? t("Show question", "اعرض السؤال") : t("Show answer", "اعرض الإجابة")}
        onClick={() => setFlipped((f) => !f)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setFlipped((f) => !f);
          }
        }}
        style={{ perspective: 1200, cursor: "pointer", height: 230, outline: "none" }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transition: "transform 0.45s ease",
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "none",
          }}
        >
          <div style={{ ...face, background: tokens.card, border: `1.5px solid ${tokens.cardBorder}`, boxShadow: "0 6px 20px rgba(15,23,42,0.07)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: tokens.textFaint, marginBottom: 12 }}>
              {t("QUESTION", "سؤال")}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.6, color: tokens.textPrimary }}>{card.front}</div>
            <div style={{ marginTop: 16, fontSize: 11.5, color: tokens.textMuted }}>{t("Tap to see the answer", "اضغط لعرض الإجابة")}</div>
          </div>
          <div style={{ ...face, transform: "rotateY(180deg)", background: tokens.primaryLight, border: `1.5px solid ${tokens.primary}55` }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: tokens.primary, marginBottom: 12 }}>
              {t("ANSWER", "الإجابة")}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.75, color: tokens.textPrimary, overflowY: "auto" }}>{card.back}</div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, direction: isRtl ? "rtl" : "ltr" }}>
        <Btn tokens={tokens} lang={lang} variant="ghost" onClick={() => go(-1)} style={{ padding: "7px 14px", fontSize: 12.5 }}>
          {t("Previous", "السابق")}
        </Btn>
        <span style={{ fontSize: 12.5, fontWeight: 650, color: tokens.textSecondary }}>
          {index + 1} / {cards.length}
        </span>
        <Btn tokens={tokens} lang={lang} variant="soft" onClick={() => go(1)} style={{ padding: "7px 14px", fontSize: 12.5 }}>
          {t("Next", "التالي")}
        </Btn>
      </div>
    </div>
  );
}

function formatDate(value, lang) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

// Square icon button with a tooltip and an accessible label.

// One saved resource: name, date, and open / download / delete actions.
function ResourceItem({ resource, tokens, lang, t, mobile, defaultOpen, onDeleted }) {
  const isRtl = lang === "ar";
  const [open, setOpen] = useState(defaultOpen);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const name = `${KIND_LABELS[resource.kind]?.[lang] ?? resource.kind} — ${resource.topic}`;

  const download = async () => {
    setBusy("download");
    setError(null);
    try {
      await downloadAnyResource(resource, lang);
    } catch {
      setError(t("Download failed. Try again.", "التنزيل فشل. جرّب تاني."));
    } finally {
      setBusy(null);
    }
  };
  const remove = async () => {
    setBusy("delete");
    setError(null);
    try {
      await deleteResource(resource.id);
      onDeleted(resource.id);
    } catch {
      setError(t("Couldn't delete it. Try again.", "مقدرناش نحذفه. جرّب تاني."));
      setBusy(null);
    }
  };

  const small = { padding: "6px 12px", fontSize: 12 };
  return (
    <Card tokens={tokens} style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{ flex: "1 1 220px", minWidth: 0, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: isRtl ? "right" : "left", fontFamily: bodyFont(lang) }}
        >
          <div style={{ fontSize: 13.5, fontWeight: 700, color: tokens.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
          <div style={{ fontSize: 11.5, color: tokens.textFaint, marginTop: 2 }}>
            {formatDate(resource.createdAt, lang)}
            {resource.knowledgeSource === "uploaded_material" ? ` · ${t("From your course files", "من ملفات المقرر")}` : ""}
          </div>
        </button>
        <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
          {confirming ? (
            <>
              <span style={{ fontSize: 12, color: tokens.textMuted }}>{t("Delete this?", "تحذفه؟")}</span>
              <Btn tokens={tokens} lang={lang} variant="ghost" style={{ ...small, color: "#dc2626" }} disabled={busy !== null} onClick={remove}>
                {busy === "delete" ? t("Deleting…", "جارٍ الحذف…") : t("Delete", "حذف")}
              </Btn>
              <Btn tokens={tokens} lang={lang} variant="ghost" style={small} disabled={busy !== null} onClick={() => setConfirming(false)}>
                {t("Cancel", "إلغاء")}
              </Btn>
            </>
          ) : (
            <>
              <IconAction tokens={tokens} label={open ? t("Hide", "إخفاء") : t("Open", "فتح")} active={open} onClick={() => setOpen((o) => !o)}>
                {open ? <IconEyeOff size={16} /> : <IconEye size={16} />}
              </IconAction>
              <IconAction tokens={tokens} label={t("Download", "تنزيل")} disabled={busy !== null} onClick={download}>
                <IconDownload size={16} />
              </IconAction>
              <IconAction tokens={tokens} label={t("Delete", "حذف")} danger onClick={() => setConfirming(true)}>
                <IconTrash size={16} />
              </IconAction>
            </>
          )}
        </div>
      </div>
      {error && <div style={{ padding: "0 16px 10px", fontSize: 12, color: tokens.danger ?? "#b42318" }}>{error}</div>}
      {open && (
        <div style={{ borderTop: `1px solid ${tokens.cardBorder}`, padding: 16 }}>
          <ResourceBody resource={resource} tokens={tokens} lang={lang} t={t} mobile={mobile} />
        </div>
      )}
    </Card>
  );
}

export default function StudyToolsPage({ state }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const isRtl = lang === "ar";
  const mobile = useMediaQuery("(max-width: 760px)");
  const [courseId, setCourseId] = useStudyCourse();
  const [topic, setTopic] = useState("");
  const [kinds, setKinds] = useState(["summary", "flashcards", "quiz"]);
  const [resourceLanguage, setResourceLanguage] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [freshIds, setFreshIds] = useState([]);
  const [removed, setRemoved] = useState([]);

  const loadCourses = useCallback(() => listCourses(), []);
  const coursesAsync = useAsync(loadCourses);
  const courses = coursesAsync.data?.items ?? [];
  const effectiveCourseId = courseId || courses[0]?.id || null;

  // Course topics feed the topic picker; the student can still type freely.
  const loadCourse = useCallback(
    () => (effectiveCourseId ? getCourse(effectiveCourseId).catch(() => null) : Promise.resolve(null)),
    [effectiveCourseId],
  );
  const courseAsync = useAsync(loadCourse);
  const topics = (courseAsync.data?.topics ?? [])
    .map((item) => item.label?.[lang] ?? item.label?.en ?? (typeof item.title === "string" ? item.title : ""))
    .filter(Boolean);

  const loadList = useCallback(
    () => (effectiveCourseId ? listResources(effectiveCourseId).catch(() => ({ items: [] })) : Promise.resolve({ items: [] })),
    [effectiveCourseId],
  );
  const listAsync = useAsync(loadList);
  useEffect(() => {
    listAsync.reload();
    courseAsync.reload();
    setNotice(null);
    setFreshIds([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCourseId]);

  const library = (listAsync.data?.items ?? []).filter((item) => item.status === "ready" && !removed.includes(item.id));

  const toggleKind = (kind) =>
    // The API accepts at most 10 kinds per request.
    setKinds((current) =>
      current.includes(kind) ? current.filter((k) => k !== kind) : current.length >= 10 ? current : [...current, kind],
    );

  async function generate() {
    const clean = topic.trim();
    if (!clean || kinds.length === 0 || !effectiveCourseId || busy) return;
    setBusy(true);
    setNotice(null);
    try {
      const result = await generateResources(effectiveCourseId, { topic: clean, kinds, language: resourceLanguage || lang });
      const items = result?.items ?? [];
      setFreshIds(items.filter((item) => item.status === "ready").map((item) => item.id));
      const failed = items.filter((item) => item.status !== "ready").map((item) => KIND_LABELS[item.kind]?.[lang] ?? item.kind);
      if (failed.length) {
        setNotice(
          t(
            `We couldn't create: ${failed.join(", ")}. Try those again in a moment.`,
            `مقدرناش نعمل: ${failed.join("، ")}. جرّبهم تاني كمان شوية.`,
          ),
        );
      }
      listAsync.reload();
    } catch (err) {
      setNotice(apiErrorText(err, lang));
    } finally {
      setBusy(false);
    }
  }

  const field = {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 14px",
    borderRadius: 10,
    border: `1.5px solid ${tokens.cardBorder}`,
    background: tokens.inset,
    color: tokens.textPrimary,
    fontSize: 13,
    outline: "none",
    fontFamily: bodyFont(lang),
    textAlign: isRtl ? "right" : "left",
  };
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 650, color: tokens.textSecondary, marginBottom: 6 };

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 920, margin: "0 auto", fontFamily: bodyFont(lang), direction: isRtl ? "rtl" : "ltr" }}>
      <h1 style={{ margin: "0 0 4px", fontSize: mobile ? 19 : 22, fontWeight: 700, letterSpacing: "-0.02em", color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
        {t("Study Tools", "أدوات المذاكرة")}
      </h1>
      <p style={{ margin: "0 0 18px", fontSize: 12.5, color: tokens.textMuted }}>
        {t(
          "Turn any topic into summaries, flashcards, quizzes and more, based on your course.",
          "حوّل أي موضوع لملخص وبطاقات مراجعة واختبارات وأكتر، من محتوى مقررك.",
        )}
      </p>

      <AsyncGate
        tokens={tokens}
        lang={lang}
        loading={coursesAsync.loading}
        error={coursesAsync.error}
        reload={coursesAsync.reload}
        label={t("Loading study tools…", "جارٍ تحميل أدوات المذاكرة…")}
      >
        <Card tokens={tokens} style={{ marginBottom: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <span style={labelStyle}>{t("Course", "المقرر")}</span>
              <CourseSelect courses={courses} value={effectiveCourseId ?? ""} onChange={setCourseId} tokens={tokens} lang={lang} placeholder={t("Choose course…", "اختر مقررًا…")} />
            </div>
            <div>
              <label htmlFor="resource-language" style={labelStyle}>{t("Language", "اللغة")}</label>
              <select
                id="resource-language"
                value={resourceLanguage || lang}
                onChange={(event) => setResourceLanguage(event.target.value)}
                style={{ ...inputStyle(tokens, bodyFont(lang)), width: "100%", cursor: "pointer" }}
                className="genai-input"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option[lang]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label htmlFor="study-topic" style={labelStyle}>{t("Topic", "الموضوع")}</label>
          <input
            id="study-topic"
            list="study-topic-options"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={topics.length ? t("Choose a topic or type your own", "اختار موضوع أو اكتب موضوعك") : t("Type a topic, e.g. Deadlocks", "اكتب موضوع، مثلاً Deadlocks")}
            style={field}
            autoComplete="off"
          />
          <datalist id="study-topic-options">
            {topics.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          {topics.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {topics.slice(0, 8).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setTopic(name)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: `1px solid ${topic === name ? tokens.primary : tokens.cardBorder}`,
                    background: topic === name ? tokens.primaryLight : "transparent",
                    color: topic === name ? tokens.primaryHover : tokens.textSecondary,
                    fontSize: 11.5,
                    cursor: "pointer",
                    fontFamily: bodyFont(lang),
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "16px 0 8px" }}>
            <span style={{ ...labelStyle, marginBottom: 0 }}>{t("What should we make?", "عايز نعملك إيه؟")}</span>
            <span style={{ fontSize: 11.5, color: kinds.length >= 10 ? tokens.primary : tokens.textFaint }}>
              {t(`${kinds.length} of 10 max`, `${kinds.length} من 10 كحد أقصى`)}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {RESOURCE_KINDS.map((kind) => {
              const active = kinds.includes(kind);
              const blocked = !active && kinds.length >= 10;
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => toggleKind(kind)}
                  disabled={blocked}
                  aria-pressed={active}
                  style={{
                    padding: "7px 13px",
                    borderRadius: 9,
                    border: `1px solid ${active ? tokens.primary : tokens.cardBorder}`,
                    background: active ? tokens.primaryLight : tokens.card,
                    color: active ? tokens.primaryHover : tokens.textSecondary,
                    opacity: blocked ? 0.45 : 1,
                    fontSize: 12,
                    fontWeight: 650,
                    cursor: blocked ? "not-allowed" : "pointer",
                    fontFamily: bodyFont(lang),
                  }}
                >
                  {KIND_LABELS[kind]?.[lang] ?? kind}
                </button>
              );
            })}
          </div>
          <Btn tokens={tokens} lang={lang} onClick={generate} disabled={busy || !topic.trim() || kinds.length === 0 || !effectiveCourseId}>
            {busy
              ? t(`Creating ${kinds.length}… this can take a minute`, `بنعمل ${kinds.length}… ممكن ياخد دقيقة`)
              : t("Create", "إنشاء")}
          </Btn>
          {notice && (
            <div style={{ marginTop: 10 }}>
              <AlertStrip tokens={tokens} lang={lang} tone="violet" icon={<span style={{ fontSize: 12 }}>!</span>} title={notice} />
            </div>
          )}
        </Card>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: tokens.textPrimary }}>{t("My resources", "مواردي")}</div>
          {library.length > 0 && <span style={{ fontSize: 12, color: tokens.textFaint }}>{library.length}</span>}
        </div>
        {listAsync.loading && listAsync.data == null ? (
          <p style={{ fontSize: 12.5, color: tokens.textMuted }}>{t("Loading…", "جارٍ التحميل…")}</p>
        ) : library.length === 0 ? (
          <Card tokens={tokens} style={{ textAlign: "center", padding: "26px 18px" }}>
            <div style={{ fontSize: 13.5, fontWeight: 650, color: tokens.textPrimary }}>{t("Nothing here yet", "لسه مفيش حاجة")}</div>
            <div style={{ fontSize: 12.5, color: tokens.textMuted, marginTop: 4 }}>
              {t("Pick a topic above and choose what to create.", "اختار موضوع فوق وحدد عايز تعمل إيه.")}
            </div>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {library.map((resource) => (
              <ResourceItem
                key={resource.id}
                resource={resource}
                tokens={tokens}
                lang={lang}
                t={t}
                mobile={mobile}
                defaultOpen={freshIds[0] === resource.id}
                onDeleted={(id) => setRemoved((r) => [...r, id])}
              />
            ))}
          </div>
        )}
      </AsyncGate>
    </div>
  );
}
