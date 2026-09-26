import { useCallback, useEffect, useState } from "react";
import useStudyCourse from "@/hooks/useStudyCourse";
import { listCourses } from "@/services/courses";
import {
  KIND_LABELS,
  LANGUAGE_OPTIONS,
  RESOURCE_KINDS,
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
    return (
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        {(c.cards ?? []).map((card, index) => {
          const open = revealed[index];
          return (
            <button
              key={index}
              type="button"
              onClick={() => setRevealed((r) => ({ ...r, [index]: !r[index] }))}
              style={{
                textAlign: align,
                background: open ? tokens.primaryLight : tokens.inset,
                border: `1px solid ${open ? `${tokens.primary}55` : tokens.cardBorder}`,
                borderRadius: 10,
                padding: "10px 12px",
                cursor: "pointer",
                minHeight: 64,
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 700, color: tokens.textPrimary }}>{card.front}</div>
              {open && (
                <div style={{ marginTop: 6, fontSize: 12, color: tokens.textSecondary, lineHeight: 1.7 }}>{card.back}</div>
              )}
            </button>
          );
        })}
      </div>
    );
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

export default function StudyToolsPage({ state }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const isRtl = lang === "ar";
  const mobile = useMediaQuery("(max-width: 760px)");
  const [courseId, setCourseId] = useStudyCourse();
  const [topic, setTopic] = useState("");
  const [kinds, setKinds] = useState(["summary", "quiz"]);
  const [resourceLanguage, setResourceLanguage] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const loadCourses = useCallback(() => listCourses(), []);
  const coursesAsync = useAsync(loadCourses);
  const courses = coursesAsync.data?.items ?? [];
  const effectiveCourseId = courseId || courses[0]?.id || null;
  const course = courses.find((item) => item.id === effectiveCourseId);

  const loadList = useCallback(
    () => (effectiveCourseId ? listResources(effectiveCourseId).catch(() => ({ items: [] })) : Promise.resolve({ items: [] })),
    [effectiveCourseId],
  );
  const listAsync = useAsync(loadList);
  useEffect(() => {
    listAsync.reload();
    setNotice(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCourseId]);

  const history = (listAsync.data?.items ?? []).filter((item) => item.status === "ready");

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
      // One call per batch returns per-kind results; a newly generated batch
      // is prepended to history via reload.
      await generateResources(effectiveCourseId, { topic: clean, kinds, language: resourceLanguage || lang });
      listAsync.reload();
    } catch (err) {
      setNotice(apiErrorText(err, lang));
    } finally {
      setBusy(false);
    }
  }

  const newBatch = listAsync.data?.items ?? [];
  const latestBatchId = newBatch[0]?.batchId ?? null;
  const latest = latestBatchId ? newBatch.filter((item) => item.batchId === latestBatchId) : [];

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 1080, margin: "0 auto", fontFamily: bodyFont(lang), direction: isRtl ? "rtl" : "ltr" }}>
      <h1 style={{ margin: "0 0 4px", fontSize: mobile ? 19 : 22, fontWeight: 700, letterSpacing: "-0.02em", color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
        {t("Study Tools", "أدوات المذاكرة")}
      </h1>
      <p style={{ margin: "0 0 18px", fontSize: 12.5, color: tokens.textMuted }}>
        {t(
          "Turn any topic into summaries, flashcards, quizzes and more, based on your course.",
          "حوّل أي موضوع إلى مادة مذاكرة مركّزة، مستندة إلى أدلة مقررك وفجوات تعلّمك الحالية.",
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
        <Card tokens={tokens} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12, flexDirection: isRtl ? "row-reverse" : "row" }}>
            <CourseSelect courses={courses} value={effectiveCourseId ?? ""} onChange={setCourseId} tokens={tokens} lang={lang} placeholder={t("Choose course…", "اختر مقررًا…")} />
            <Chip tokens={tokens} tone="primary">{course?.code ?? course?.title?.en ?? ""}</Chip>
          </div>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t("Topic — e.g. CNN, recursion, SQL joins", "الموضوع — مثال: الشبكات العصبية، العودية، ربط الجداول")}
            style={{
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
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 4px", flexDirection: isRtl ? "row-reverse" : "row" }}>
            <label htmlFor="resource-language" style={{ fontSize: 12, color: tokens.textSecondary, fontWeight: 600 }}>
              {t("Resource language", "لغة المورد")}
            </label>
            <select
              id="resource-language"
              value={resourceLanguage || lang}
              onChange={(event) => setResourceLanguage(event.target.value)}
              style={{ ...inputStyle(tokens, bodyFont(lang)), minWidth: 150, cursor: "pointer" }}
              className="genai-input"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option[lang]}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0", flexDirection: isRtl ? "row-reverse" : "row" }}>
            {RESOURCE_KINDS.map((kind) => {
              const active = kinds.includes(kind);
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => toggleKind(kind)}
                  style={{
                    padding: "7px 13px",
                    borderRadius: 9,
                    border: `1px solid ${active ? tokens.primary : tokens.cardBorder}`,
                    background: active ? tokens.primaryLight : tokens.card,
                    color: active ? tokens.primaryHover : tokens.textSecondary,
                    fontSize: 12,
                    fontWeight: 650,
                    cursor: "pointer",
                    fontFamily: bodyFont(lang),
                  }}
                >
                  {KIND_LABELS[kind]?.[lang] ?? kind}
                </button>
              );
            })}
          </div>
          <Btn tokens={tokens} lang={lang} onClick={generate} disabled={busy || !topic.trim() || kinds.length === 0 || !effectiveCourseId}>
            {busy ? t(`Creating ${kinds.length} resource${kinds.length > 1 ? "s" : ""}… this can take a minute`, `بنعمل ${kinds.length} … ممكن ياخد دقيقة`) : t("Generate resources", "إنشاء الموارد")}
          </Btn>
          {notice && (
            <div style={{ marginTop: 10 }}>
              <AlertStrip tokens={tokens} lang={lang} tone="violet" icon={<span style={{ fontSize: 12 }}>!</span>} title={notice} />
            </div>
          )}
        </Card>

        {busy && (
          <div style={{ fontSize: 12.5, color: tokens.textMuted, marginBottom: 14 }}>
            {t("Creating your study resources…", "جارٍ إنشاء موارد المذاكرة…")}
          </div>
        )}

        {latest.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: tokens.textPrimary, marginBottom: 10 }}>
              {t("Latest batch", "أحدث دفعة")} · {latest[0].topic}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {latest.map((resource) => (
                <Card key={resource.id} tokens={tokens}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: tokens.textPrimary }}>
                      {KIND_LABELS[resource.kind]?.[lang] ?? resource.kind}
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      {resource.knowledgeSource === "uploaded_material" && (
                        <Chip tokens={tokens} tone="primary">{t("Grounded in course materials", "مستند إلى مواد المقرر")}</Chip>
                      )}
                      {resource.knowledgeSource === "trusted_external" && (
                        <Chip tokens={tokens} tone="gap">{t("Grounded in verified external sources", "مستند إلى مصادر خارجية موثّقة")}</Chip>
                      )}
                      <Chip tokens={tokens} tone={resource.status === "ready" ? "mastered" : "slate"}>
                        {resource.status === "ready" ? t("Ready", "جاهز") : t("Unavailable", "غير متاح")}
                      </Chip>
                    </div>
                  </div>
                  <ResourceBody resource={resource} tokens={tokens} lang={lang} t={t} mobile={mobile} />
                </Card>
              ))}
            </div>
          </div>
        )}

        <div style={{ fontSize: 14, fontWeight: 700, color: tokens.textPrimary, marginBottom: 10 }}>
          {t("Earlier resources", "موارد سابقة")}
        </div>
        {history.filter((item) => item.batchId !== latestBatchId).length === 0 ? (
          <p style={{ fontSize: 12.5, color: tokens.textFaint }}>
            {t("Nothing generated yet — pick a topic above.", "لم يُنشأ شيء بعد — اختر موضوعًا بالأعلى.")}
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 10 }}>
            {history
              .filter((item) => item.batchId !== latestBatchId)
              .map((item) => (
                <Card key={item.id} tokens={tokens} style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: tokens.textPrimary }}>{item.topic}</div>
                      <div style={{ fontSize: 11, color: tokens.textFaint }}>{KIND_LABELS[item.kind]?.[lang] ?? item.kind}</div>
                    </div>
                    {item.hasArtifact && (
                      <Btn tokens={tokens} lang={lang} variant="ghost" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => downloadResourceFile(item.id).catch(() => {})}>
                        {t("Download", "تنزيل")}
                      </Btn>
                    )}
                  </div>
                </Card>
              ))}
          </div>
        )}
      </AsyncGate>
    </div>
  );
}
