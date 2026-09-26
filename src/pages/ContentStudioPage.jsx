import { useCallback, useEffect, useState } from "react";
import { tk } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import useAsync from "@/hooks/useAsync";
import { Card, Btn, Chip, inputStyle, bFontFor, hFontFor, toast, Skeleton } from "@/components/ModuleUI";
import { AsyncGate } from "@/components/ui";
import {
  IconSparkle, IconDoc, IconPencil, IconClipboard, IconDoubleCheck, IconInbox, IconRefresh,
  IconDownload, IconCheck, IconTrash, IconUpload, IconBookOpen, IconDiagnostic, IconPractice, IconImageAttach, IconFilter,
} from "@/components/Icons";
import { getCourse, listCourses, uploadMaterialFile } from "@/services/courses";
import {
  RESOURCE_KINDS, KIND_LABELS, LANGUAGE_OPTIONS, generateResources, listResources, deleteResource,
  downloadAnyResource, resourceToMarkdown,
} from "@/services/studyTools";
import { apiErrorText, readSession } from "@/services/http";
import { ResourceBody } from "@/pages/StudyToolsPage";

// Content Builder — the instructor's AI content generator.
// Real backend: POST /courses/:courseId/learning-resources (grounded in the
// course's uploaded files), GET for the instructor's own library, DELETE, and
// "Add to course materials" uploads the result as a course file for a topic.

const KIND_ICONS = {
  summary: IconDoc, notes: IconBookOpen, flashcards: IconRefresh, quiz: IconDoubleCheck, code: IconClipboard,
  diagram: IconImageAttach, presentation: IconInbox, explanation: IconPencil, study_guide: IconBookOpen,
  coding_exercise: IconClipboard, analogy: IconSparkle, comparison: IconFilter, exam: IconDiagnostic,
  practice: IconPractice, question_bank: IconInbox,
};

const MAX_KINDS = 10;

function fmtWhen(iso, lang) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function ContentStudioPage({ state }) {
  const mobile = useMediaQuery("(max-width: 900px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);
  const t = (en, ar) => (lang === "ar" ? ar : en);

  const [courseId, setCourseId] = useState(state.courseId ?? "");
  const [topicId, setTopicId] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [kinds, setKinds] = useState(["summary"]);
  const [language, setLanguage] = useState(lang);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [runIds, setRunIds] = useState([]);
  const [removed, setRemoved] = useState([]);
  const [filing, setFiling] = useState(false);
  const [filed, setFiled] = useState([]);

  const coursesAsync = useAsync(useCallback(() => listCourses(), []));
  const courses = coursesAsync.data?.items ?? [];
  const effectiveCourseId = courseId || courses[0]?.id || "";

  const courseAsync = useAsync(
    useCallback(() => (effectiveCourseId ? getCourse(effectiveCourseId).catch(() => null) : Promise.resolve(null)), [effectiveCourseId]),
  );
  const topics = (courseAsync.data?.topics ?? [])
    .map((item) => ({ id: item.id, label: item.label?.[lang] ?? item.label?.en ?? (typeof item.title === "string" ? item.title : "") }))
    .filter((item) => item.label);

  const listAsync = useAsync(
    useCallback(
      () => (effectiveCourseId ? listResources(effectiveCourseId).catch(() => ({ items: [] })) : Promise.resolve({ items: [] })),
      [effectiveCourseId],
    ),
  );

  useEffect(() => {
    courseAsync.reload();
    listAsync.reload();
    setTopicId("");
    setActiveId(null);
    setRunIds([]);
    setNotice(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCourseId]);

  // Only the instructor's own content — never items students created in the same course.
  const myId = state.user?.id ?? readSession()?.user?.id ?? null;
  const library = (listAsync.data?.items ?? []).filter(
    (item) => item.status === "ready" && !removed.includes(item.id) && myId && item.userId && String(item.userId) === String(myId),
  );
  const active = library.find((item) => item.id === activeId) ?? null;
  const runItems = runIds.map((id) => library.find((item) => item.id === id)).filter(Boolean);
  const olderItems = library.filter((item) => !runIds.includes(item.id));

  const topicLabel = topicId === "__custom" ? customTopic.trim() : topics.find((item) => item.id === topicId)?.label ?? "";
  const canGenerate = !busy && effectiveCourseId && topicLabel.length >= 3 && kinds.length > 0;

  const toggleKind = (kind) =>
    setKinds((current) => (current.includes(kind) ? current.filter((k) => k !== kind) : current.length >= MAX_KINDS ? current : [...current, kind]));

  async function generate() {
    if (!canGenerate) return;
    setBusy(true);
    setNotice(null);
    setActiveId(null);
    try {
      const result = await generateResources(effectiveCourseId, { topic: topicLabel, kinds, language });
      const items = result?.items ?? [];
      const ready = items.filter((item) => item.status === "ready").map((item) => item.id);
      const failed = items.filter((item) => item.status !== "ready").map((item) => KIND_LABELS[item.kind]?.[lang] ?? item.kind);
      await listAsync.reload();
      setRunIds(ready);
      setActiveId(ready[0] ?? null);
      if (failed.length) {
        setNotice(t(`We couldn't create: ${failed.join(", ")}. Try those again in a moment.`, `مقدرناش نعمل: ${failed.join("، ")}. جرّبهم تاني كمان شوية.`));
      } else if (ready.length) {
        toast(t("Your content is ready. Review it before sharing it with students.", "المحتوى جاهز. راجعه قبل ما تشاركه مع الطلاب."));
      }
    } catch (err) {
      setNotice(apiErrorText(err, lang));
    } finally {
      setBusy(false);
    }
  }

  async function addToMaterials(resource) {
    const topic = topics.find((item) => item.label === resource.topic);
    if (!topic) {
      toast(t("Pick a course topic to add this to the course files.", "اختار موضوع من المقرر عشان تضيفه لملفات المقرر."));
      return;
    }
    setFiling(true);
    try {
      const label = KIND_LABELS[resource.kind]?.[lang] ?? resource.kind;
      const title = `${label} — ${resource.topic}`;
      const safe = String(resource.topic).replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 40);
      const file = new File([resourceToMarkdown(resource, lang)], `${resource.kind}-${safe}.md`, { type: "text/markdown" });
      await uploadMaterialFile(effectiveCourseId, file, title, topic.id);
      setFiled((f) => [...f, resource.id]);
      toast(t("Added to the course files. Students can use it once it is ready.", "اتضاف لملفات المقرر. الطلاب هيقدروا يستخدموه أول ما يجهز."));
    } catch (err) {
      toast(apiErrorText(err, lang));
    } finally {
      setFiling(false);
    }
  }

  async function download(resource) {
    try {
      await downloadAnyResource(resource, lang);
    } catch (err) {
      toast(apiErrorText(err, lang));
    }
  }

  async function copy(resource) {
    try {
      await navigator.clipboard.writeText(resourceToMarkdown(resource, lang));
      toast(t("Copied.", "اتنسخ."));
    } catch {
      toast(t("Select the text and copy it manually.", "حدد النص وانسخه يدويًا."));
    }
  }

  async function remove(resource) {
    try {
      await deleteResource(resource.id);
      setRemoved((r) => [...r, resource.id]);
      if (activeId === resource.id) setActiveId(null);
    } catch (err) {
      toast(apiErrorText(err, lang));
    }
  }

  const label = (text) => (
    <div style={{ fontFamily: bFont, fontSize: 12, fontWeight: 650, color: tokens.textSecondary, marginBottom: 7 }}>{text}</div>
  );
  const selectStyle = { ...inputStyle(tokens, bFont), cursor: "pointer", width: "100%" };

  const ItemRow = ({ item }) => {
    const on = item.id === activeId;
    const Icon = KIND_ICONS[item.kind] ?? IconDoc;
    return (
      <button
        type="button"
        onClick={() => setActiveId(on ? null : item.id)}
        style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 10, cursor: "pointer",
          background: on ? tokens.primaryLight : tokens.card, border: `1px solid ${on ? tokens.primary : tokens.cardBorder}`,
          textAlign: isRtl ? "right" : "left", fontFamily: bFont,
        }}
      >
        <Icon size={15} color={on ? tokens.primary : tokens.textMuted} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: tokens.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {KIND_LABELS[item.kind]?.[lang] ?? item.kind} · {item.topic}
          </span>
          <span style={{ display: "block", fontSize: 11.5, color: tokens.textFaint, marginTop: 2 }}>{fmtWhen(item.createdAt, lang)}</span>
        </span>
      </button>
    );
  };

  return (
    <div className="genai-pad" style={{ padding: mobile ? 16 : "26px 32px", maxWidth: 1180, margin: "0 auto", direction: isRtl ? "rtl" : "ltr" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: "0 0 3px", display: "flex", gap: 10, alignItems: "center" }}>
          <IconSparkle size={18} color={tokens.primary} />
          {t("Content Builder", "صانع المحتوى")}
        </h1>
        <p style={{ fontSize: 13, color: tokens.textMuted, margin: 0, fontFamily: bFont }}>
          {t(
            "Create teaching content for any topic, built from the files you uploaded to the course.",
            "اعمل محتوى تعليمي لأي موضوع، من الملفات اللي رفعتها على المقرر.",
          )}
        </p>
      </div>

      <AsyncGate tokens={tokens} lang={lang} loading={coursesAsync.loading} error={coursesAsync.error} reload={coursesAsync.reload} label={t("Loading…", "جارٍ التحميل…")}>
        {courses.length === 0 ? (
          <Card tokens={tokens} style={{ padding: "34px 24px", textAlign: "center" }}>
            <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary }}>{t("No courses yet", "لسه مفيش مقررات")}</div>
            <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, marginTop: 4 }}>{t("Once you teach a course, you can create content for it here.", "أول ما يبقى عندك مقرر، تقدر تعمل له محتوى من هنا.")}</div>
          </Card>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "minmax(0, 1fr)" : "minmax(0, 1fr) minmax(0, 1.15fr)", gap: 24, alignItems: "start" }}>
            {/* Left: what to make */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Card tokens={tokens} style={{ padding: "18px 20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 14 }}>
                  <div>
                    {label(t("Course", "المقرر"))}
                    <select value={effectiveCourseId} onChange={(e) => setCourseId(e.target.value)} style={selectStyle} className="genai-input">
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.code ? `${c.code} · ` : ""}{typeof c.title === "string" ? c.title : c.title?.[lang] ?? c.title?.en}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    {label(t("Topic", "الموضوع"))}
                    <select value={topicId} onChange={(e) => setTopicId(e.target.value)} style={selectStyle} className="genai-input">
                      <option value="">{courseAsync.loading ? t("Loading…", "جارٍ التحميل…") : t("Choose…", "اختار…")}</option>
                      {topics.map((item) => (
                        <option key={item.id} value={item.id}>{item.label}</option>
                      ))}
                      <option value="__custom">{t("Another topic…", "موضوع تاني…")}</option>
                    </select>
                  </div>
                </div>
                {topicId === "__custom" && (
                  <div style={{ marginTop: 12 }}>
                    {label(t("Write the topic", "اكتب الموضوع"))}
                    <input value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} placeholder={t("e.g. Banker's algorithm", "مثال: Banker's algorithm")} style={inputStyle(tokens, bFont)} className="genai-input" />
                  </div>
                )}
                <div style={{ marginTop: 12 }}>
                  {label(t("Language", "اللغة"))}
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} style={selectStyle} className="genai-input">
                    {LANGUAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option[lang] ?? option.en}</option>
                    ))}
                  </select>
                </div>
              </Card>

              <Card tokens={tokens} style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  {label(t("What should we make?", "عايز تعمل إيه؟"))}
                  <span style={{ fontFamily: bFont, fontSize: 11.5, color: kinds.length >= MAX_KINDS ? tokens.primary : tokens.textFaint }}>
                    {t(`${kinds.length} chosen · up to ${MAX_KINDS}`, `${kinds.length} مختار · لحد ${MAX_KINDS}`)}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {RESOURCE_KINDS.map((kind) => {
                    const on = kinds.includes(kind);
                    const blocked = !on && kinds.length >= MAX_KINDS;
                    const Icon = KIND_ICONS[kind] ?? IconDoc;
                    return (
                      <button key={kind} type="button" onClick={() => toggleKind(kind)} disabled={blocked} aria-pressed={on}
                        style={{
                          display: "flex", gap: 10, alignItems: "center", padding: "11px 12px", borderRadius: 10,
                          cursor: blocked ? "not-allowed" : "pointer", opacity: blocked ? 0.45 : 1,
                          background: on ? tokens.primaryLight : tokens.card,
                          border: `1px solid ${on ? tokens.primary : tokens.cardBorder}`,
                          color: on ? tokens.primary : tokens.textSecondary,
                          fontFamily: bFont, fontSize: 12.5, fontWeight: on ? 600 : 500, textAlign: isRtl ? "right" : "left",
                        }}>
                        <Icon size={15} color={on ? tokens.primary : tokens.textMuted} />
                        <span style={{ flex: 1 }}>{KIND_LABELS[kind]?.[lang] ?? kind}</span>
                        {on && <IconCheck size={13} color={tokens.primary} />}
                      </button>
                    );
                  })}
                </div>
                <Btn tokens={tokens} lang={lang} onClick={generate} disabled={!canGenerate} style={{ width: "100%", padding: "11px 0", fontSize: 13, marginTop: 14 }}>
                  <IconSparkle size={14} color="#fff" />
                  {busy ? t("Creating… this can take a minute", "بنجهّز… ممكن ياخد دقيقة") : t("Create content", "اعمل المحتوى")}
                </Btn>
                {notice && (
                  <div style={{ marginTop: 10, padding: "9px 12px", borderRadius: 9, background: tokens.gapBg, color: tokens.gap, fontFamily: bFont, fontSize: 12.5 }}>{notice}</div>
                )}
              </Card>
            </div>

            {/* Right: result + library */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {busy ? (
                <Card tokens={tokens} style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <Skeleton h={20} w="50%" tokens={tokens} />
                  <Skeleton h={12} tokens={tokens} />
                  <Skeleton h={12} w="90%" tokens={tokens} />
                  <Skeleton h={120} tokens={tokens} />
                  <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textFaint, textAlign: "center" }}>
                    {t(`Creating ${kinds.length} item${kinds.length > 1 ? "s" : ""} from your course files…`, `بنجهّز ${kinds.length} من ملفات المقرر…`)}
                  </div>
                </Card>
              ) : active ? (
                <Card tokens={tokens} style={{ padding: "18px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em", minWidth: 0 }}>
                      {KIND_LABELS[active.kind]?.[lang] ?? active.kind} · {active.topic}
                    </div>
                    <Chip tokens={tokens} tone={filed.includes(active.id) ? "mastered" : "primary"} style={{ fontFamily: bFont, fontSize: 11.5, letterSpacing: 0, whiteSpace: "nowrap" }}>
                      {filed.includes(active.id) ? t("In course files", "في ملفات المقرر") : t("Only you see this", "ظاهر ليك بس")}
                    </Chip>
                  </div>
                  <div style={{ background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, padding: "12px 14px", maxHeight: 460, overflowY: "auto", marginBottom: 14 }}>
                    <ResourceBody resource={active} tokens={tokens} lang={lang} t={t} mobile={mobile} />
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Btn tokens={tokens} lang={lang} variant="soft" disabled={filing || filed.includes(active.id) || !topics.some((item) => item.label === active.topic)} onClick={() => addToMaterials(active)}>
                      <IconUpload size={13} color={tokens.primary} />
                      {filing ? t("Adding…", "بنضيف…") : filed.includes(active.id) ? t("Added", "اتضاف") : t("Add to course files", "ضيفه لملفات المقرر")}
                    </Btn>
                    <Btn tokens={tokens} lang={lang} variant="soft" onClick={() => download(active)}>
                      <IconDownload size={13} color={tokens.primary} />
                      {t("Download", "تنزيل")}
                    </Btn>
                    {!active.hasArtifact && (
                      <Btn tokens={tokens} lang={lang} variant="ghost" onClick={() => copy(active)}>
                        <IconCheck size={13} />
                        {t("Copy", "نسخ")}
                      </Btn>
                    )}
                    <Btn tokens={tokens} lang={lang} variant="ghost" onClick={() => remove(active)}>
                      <IconTrash size={13} />
                      {t("Delete", "حذف")}
                    </Btn>
                  </div>
                </Card>
              ) : (
                <Card tokens={tokens} style={{ padding: "34px 24px", textAlign: "center" }}>
                  <div style={{ display: "inline-flex", width: 44, height: 44, borderRadius: "50%", background: tokens.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                    <IconSparkle size={18} color={tokens.primary} />
                  </div>
                  <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, marginBottom: 4 }}>
                    {library.length ? t("Pick an item to preview it", "اختار حاجة من تحت عشان تشوفها") : t("Pick a topic and what to make", "اختار موضوع وتعمل إيه")}
                  </div>
                  <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.6 }}>
                    {t(
                      "Everything you create stays private to you until you add it to the course files.",
                      "كل اللي بتعمله بيفضل ليك بس لحد ما تضيفه لملفات المقرر.",
                    )}
                  </div>
                </Card>
              )}

              {runItems.length > 1 && (
                <div>
                  {label(t("Just created", "اتعمل دلوقتي"))}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {runItems.map((item) => <ItemRow key={item.id} item={item} />)}
                  </div>
                </div>
              )}

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  {label(t("Your content for this course", "المحتوى بتاعك للمقرر ده"))}
                  {olderItems.length > 0 && <span style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textFaint }}>{olderItems.length}</span>}
                </div>
                {listAsync.loading && listAsync.data == null ? (
                  <Skeleton h={44} tokens={tokens} />
                ) : olderItems.length === 0 ? (
                  <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted }}>{t("Nothing saved yet.", "لسه مفيش حاجة محفوظة.")}</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {olderItems.map((item) => <ItemRow key={item.id} item={item} />)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AsyncGate>
    </div>
  );
}
