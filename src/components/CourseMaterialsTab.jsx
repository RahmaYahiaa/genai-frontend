import { useCallback, useEffect, useMemo, useState } from "react";
import useAsync from "@/hooks/useAsync";
import { demoMode } from "@/services/auth";
import { apiErrorText } from "@/services/http";
import { getCourse, listMaterials, uploadMaterialFile, renameMaterial, deleteMaterial, downloadMaterial, renameTopic, deleteTopic, mergeTopics, detectTopics } from "@/services/courses";
import { AsyncGate } from "@/components/ui";
import { tk, MONO } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useInstructorModule } from "@/store/InstructorProvider";
import { Card, Btn, ConfirmBtn, inputStyle, bFontFor, hFontFor, toast, Chip } from "@/components/ModuleUI";
import { IconCheck, IconDownload, IconWarning, IconRefresh, IconDoc, IconBookOpen, IconUpload, IconPencil, IconTrash, IconX } from "@/components/Icons";
import MaterialUploader from "@/components/MaterialUploader";
import { fmtBytes, fileKind } from "@/utils/fileMeta";
import { approvedMaterials, pendingMaterials, fmtWhen } from "@/data/instructorModule";

function DemoMaterialsTab({ state, courseId }) {
  const { state: mod, approveMaterial, removeMaterial } = useInstructorModule();
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);

  const course = mod.courses.find((c) => c.id === courseId) ?? mod.courses[0];
  const gaps = course.topics.filter((t) => approvedMaterials(t) === 0);
  const [topic, setTopic] = useState(state.materialsTopic ?? gaps[0]?.id ?? course.topics[0]?.id ?? "");
  useEffect(() => {
    if (state.materialsTopic) setTopic(state.materialsTopic);
  }, [state.materialsTopic]);
  const [fQuery, setFQuery] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [fKind, setFKind] = useState("all");
  const [fTopicView, setFTopicView] = useState("all");

  const kindOf = (m) => (m.file ? fileKind(m.file.fileName, m.file.mime).tag : "NOFILE");
  const matches = (m) =>
    (fStatus === "all" || m.status === fStatus) &&
    (fKind === "all" || kindOf(m) === fKind) &&
    (!fQuery || m.title.toLowerCase().includes(fQuery.toLowerCase()) || (m.file?.fileName ?? "").toLowerCase().includes(fQuery.toLowerCase()));
  const filtersActive = fQuery !== "" || fStatus !== "all" || fKind !== "all" || fTopicView !== "all";
  const visibleTopics = course.topics.filter((t) => fTopicView === "all" || t.id === fTopicView);
  const shownCount = visibleTopics.reduce((n, t) => n + t.materials.filter(matches).length, 0);

  const totals = useMemo(
    () => course.topics.reduce((acc, t) => { acc.approved += approvedMaterials(t); acc.pending += pendingMaterials(t); return acc; }, { approved: 0, pending: 0 }),
    [course],
  );

  const statusChip = (status) => (
    <span style={{
      fontFamily: "inherit", fontSize: 12, letterSpacing: 0, fontWeight: 700, borderRadius: 6, padding: "2px 8px", whiteSpace: "nowrap",
      color: status === "approved" ? tokens.mastered : tokens.developing,
      background: status === "approved" ? `${tokens.mastered}1a` : `${tokens.developing}1a`,
      border: `1px solid ${status === "approved" ? tokens.mastered : tokens.developing}44`
    }}>
      {status === "approved" ? (lang === "ar" ? "معتمد" : "Approved") : (lang === "ar" ? "بانتظار الاعتماد" : "Pending")}
    </span>
  );

  return (
    <div style={{ direction: isRtl ? "rtl" : "ltr" }}>
      <div style={{ marginBottom: 18, textAlign: isRtl ? "right" : "left" }}>
        <h2 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 17 : 20, color: tokens.textPrimary, letterSpacing: "-0.02em", margin: "0 0 4px" }}>
          {lang === "ar" ? "مواد المقرر" : "Course Materials"}
        </h2>
        <p style={{ fontFamily: bFont, fontSize: 13, color: tokens.textMuted, margin: 0 }}>
          {lang === "ar"
            ? "ارفعي المحاضرات والمراجع لكل موضوع، ثم اعتمديها لتصبح مرئية للطلاب ولتحليلات التغطية."
            : "Upload lectures and references per topic, then approve them to make them student-visible and count toward coverage."}
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16, flexDirection: isRtl ? "row-reverse" : "row" }}>
        {[
          { l: lang === "ar" ? "معتمدة" : "Approved", v: totals.approved, c: tokens.mastered },
          { l: lang === "ar" ? "بانتظار الاعتماد" : "Pending", v: totals.pending, c: tokens.developing },
          { l: lang === "ar" ? "مواضيع بلا مواد" : "Topics with no materials", v: gaps.length, c: gaps.length ? tokens.gap : tokens.textMuted },
        ].map((t) => (
          <div key={t.l} style={{ display: "inline-flex", gap: 8, alignItems: "center", background: tokens.card, border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, padding: "8px 14px" }}>
            <span style={{ fontFamily: "inherit", fontSize: 14, fontWeight: 700, color: t.c }}>{t.v}</span>
            <span style={{ fontFamily: "inherit", fontSize: 12, letterSpacing: 0, color: tokens.textMuted }}>{t.l}</span>
          </div>
        ))}
      </div>

      {gaps.length > 0 && (
        <Card tokens={tokens} style={{ padding: "14px 18px", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexDirection: isRtl ? "row-reverse" : "row" }}>
            <IconWarning size={14} color={tokens.gap} />
            <span style={{ fontFamily: bFont, fontSize: 12.5, fontWeight: 600, color: tokens.textPrimary }}>
              {lang === "ar" ? "تنبيهات التغطية — مواضيع بلا أي مادة معتمدة:" : "Coverage alerts — topics with zero approved materials:"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
            {gaps.map((t) => (
              <button key={t.id} onClick={() => setTopic(t.id)} style={{
                fontFamily: bFont, fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                color: topic === t.id ? tokens.primary : tokens.textSecondary,
                background: topic === t.id ? tokens.primaryLight : tokens.inset,
                border: `1px solid ${topic === t.id ? tokens.primary : tokens.cardBorder}`,
                borderRadius: 8, padding: "6px 12px"
              }}>
                {lang === "ar" ? t.label.ar : t.label.en}
              </button>
            ))}
          </div>
        </Card>
      )}

      <Card tokens={tokens} style={{ padding: "18px 20px", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
          <div style={{ display: "inline-flex", gap: 8, alignItems: "center", fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em", flexDirection: isRtl ? "row-reverse" : "row" }}>
            <IconUpload size={14} color={tokens.primary} />
            {lang === "ar" ? "رفع مواد جديدة" : "Upload new materials"}
          </div>
          <label style={{ display: "inline-flex", gap: 8, alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
            <span style={{ fontFamily: "inherit", fontSize: 12, letterSpacing: 0, color: tokens.textMuted }}>{lang === "ar" ? "الموضوع" : "Topic"}</span>
            <select value={topic} onChange={(e) => setTopic(e.target.value)} style={{ ...inputStyle(tokens, bFont), cursor: "pointer", width: mobile ? 170 : 240 }} className="genai-input">
              {course.topics.map((t) => (
                <option key={t.id} value={t.id}>{lang === "ar" ? t.label.ar : t.label.en}</option>
              ))}
            </select>
          </label>
        </div>
        <MaterialUploader courseId={course.id} topicId={topic} tokens={tokens} lang={lang} />
      </Card>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14, alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
        <input value={fQuery} onChange={(e) => setFQuery(e.target.value)} placeholder={lang === "ar" ? "بحث بالعنوان أو اسم الملف…" : "Search title or file name…"} style={{ ...inputStyle(tokens, bFont), width: mobile ? "100%" : 220 }} className="genai-input" />
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} style={{ ...inputStyle(tokens, bFont), cursor: "pointer", width: mobile ? "calc(50% - 5px)" : 150 }} className="genai-input">
          <option value="all">{lang === "ar" ? "كل الحالات" : "All statuses"}</option>
          <option value="approved">{lang === "ar" ? "معتمد" : "Approved"}</option>
          <option value="pending">{lang === "ar" ? "بانتظار الاعتماد" : "Pending"}</option>
        </select>
        <select value={fKind} onChange={(e) => setFKind(e.target.value)} style={{ ...inputStyle(tokens, bFont), cursor: "pointer", width: mobile ? "calc(50% - 5px)" : 150 }} className="genai-input">
          <option value="all">{lang === "ar" ? "كل الأنواع" : "All types"}</option>
          <option value="PDF">PDF</option>
          <option value="DOC">DOC</option>
          <option value="SLIDES">SLIDES</option>
          <option value="SHEET">SHEET</option>
          <option value="VIDEO">VIDEO</option>
          <option value="IMG">IMG</option>
          <option value="ARCHIVE">ARCHIVE</option>
          <option value="TEXT">TEXT</option>
          <option value="NOFILE">{lang === "ar" ? "بدون ملف مرفوع" : "No uploaded file"}</option>
        </select>
        <select value={fTopicView} onChange={(e) => setFTopicView(e.target.value)} style={{ ...inputStyle(tokens, bFont), cursor: "pointer", width: mobile ? "100%" : 190 }} className="genai-input">
          <option value="all">{lang === "ar" ? "كل المواضيع" : "All topics"}</option>
          {course.topics.map((t) => (
            <option key={t.id} value={t.id}>{lang === "ar" ? t.label.ar : t.label.en}</option>
          ))}
        </select>
        {filtersActive && (
          <Btn tokens={tokens} lang={lang} variant="ghost" style={{ padding: "7px 12px", fontSize: 11.5 }}
            onClick={() => { setFQuery(""); setFStatus("all"); setFKind("all"); setFTopicView("all"); }}>
            {lang === "ar" ? "مسح الفلاتر" : "Clear filters"}
          </Btn>
        )}
      </div>
      {filtersActive && (
        <div style={{ fontFamily: "inherit", fontSize: 12.5, color: tokens.textMuted, marginBottom: 12 }}>
          {lang === "ar" ? `معروض ${shownCount} مادة مطابقة` : `${shownCount} matching material${shownCount === 1 ? "" : "s"} shown`}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {visibleTopics.map((t) => {
          const approved = approvedMaterials(t);
          const pending = pendingMaterials(t);
          const mats = t.materials.filter(matches);
          return (
            <Card key={t.id} tokens={tokens} style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: t.materials.length ? 10 : 0, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                <div style={{ display: "inline-flex", gap: 9, alignItems: "center", minWidth: 0, flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <IconBookOpen size={15} color={approved ? tokens.primary : tokens.gap} />
                  <span style={{ fontFamily: hFont, fontWeight: 600, fontSize: 14, color: tokens.textPrimary, letterSpacing: "-0.01em" }}>
                    {lang === "ar" ? t.label.ar : t.label.en}
                  </span>
                  {approved === 0 && <IconWarning size={13} color={tokens.gap} />}
                </div>
                <span style={{ fontFamily: "inherit", fontSize: 12.5, color: tokens.textMuted }}>
                  {approved} {lang === "ar" ? "معتمد" : "approved"} · {pending} {lang === "ar" ? "معلق" : "pending"}
                </span>
              </div>
              {t.materials.length === 0 ? (
                <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textFaint, paddingTop: 4 }}>
                  {lang === "ar" ? "لا توجد مواد هنا بعد." : "No materials here yet."}
                </div>
              ) : mats.length === 0 ? (
                <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textFaint, paddingTop: 4 }}>
                  {lang === "ar" ? "لا مواد مطابقة للفلاتر الحالية في هذا الموضوع." : "No materials match the current filters in this topic."}
                </div>
              ) : (
                mats.map((m, i) => {
                  const kind = fileKind(m.file?.fileName ?? m.title, m.file?.mime);
                  return (
                    <div key={m.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 0", borderTop: i > 0 ? `1px solid ${tokens.cardBorder}` : "none", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                      <IconDoc size={16} color={kind.color} />
                      <div style={{ flex: "1 1 200px", minWidth: 0, textAlign: isRtl ? "right" : "left" }}>
                        <div style={{ fontFamily: bFont, fontSize: 12.5, fontWeight: 600, color: tokens.textPrimary, marginBottom: 3 }}>{m.title}</div>
                        <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                          <span style={{ fontFamily: "inherit", fontSize: 12, color: kind.color, border: `1px solid ${kind.color}55`, borderRadius: 5, padding: "1px 6px" }}>{kind.tag}</span>
                          {m.file && (
                            <span style={{ fontFamily: "inherit", fontSize: 12.5, color: tokens.textMuted }}>
                              {m.file.fileName} · {fmtBytes(m.file.size)}
                            </span>
                          )}
                          <span style={{ fontFamily: "inherit", fontSize: 12.5, color: tokens.textFaint }}>{fmtWhen(m.addedAt, lang)}</span>
                        </div>
                      </div>
                      {statusChip(m.status)}
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, flexDirection: isRtl ? "row-reverse" : "row" }}>
                        {m.file?.url && (
                          <a href={m.file.url} download={m.file.fileName} style={{
                            display: "inline-flex", gap: 6, alignItems: "center", fontFamily: bFont, fontSize: 11.5, fontWeight: 600,
                            color: tokens.primary, background: tokens.primaryLight, border: `1px solid ${tokens.citationBorder}`,
                            borderRadius: 8, padding: "6px 12px", textDecoration: "none", whiteSpace: "nowrap"
                          }}>
                            <IconDownload size={12} color={tokens.primary} />
                            {lang === "ar" ? "تنزيل" : "Download"}
                          </a>
                        )}
                        {m.status === "pending" && (
                          <Btn tokens={tokens} lang={lang} variant="soft" style={{ padding: "6px 12px", fontSize: 11.5 }}
                            onClick={() => { approveMaterial(course.id, t.id, m.id); toast(lang === "ar" ? `اعتُمدت المادة: ${m.title}` : `Material approved: ${m.title}`); }}>
                            <IconCheck size={12} color={tokens.mastered} />
                            {lang === "ar" ? "اعتماد" : "Approve"}
                          </Btn>
                        )}
                        <ConfirmBtn
                          tokens={tokens}
                          lang={lang}
                          label={lang === "ar" ? "حذف" : "Delete"}
                          confirmLabel={lang === "ar" ? "تأكيد الحذف" : "Confirm delete"}
                          style={{ padding: "6px 12px", fontSize: 11.5 }}
                          onConfirm={() => { if (m.file?.url) URL.revokeObjectURL(m.file.url); removeMaterial(course.id, t.id, m.id); toast(lang === "ar" ? `حُذفت المادة: ${m.title}` : `Material deleted: ${m.title}`); }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

const REAL_STATUS_COLORS = {
  ready: "#1A7F4E",
  processing: "#B7791F",
  pending: "#B7791F",
  failed: "#C0392B",
  stored_only: "#6B7280",
};

const REAL_STATUS_LABELS = {
  ready: { en: "ready", ar: "جاهزة" },
  processing: { en: "processing", ar: "جارٍ التجهيز" },
  pending: { en: "pending", ar: "بالانتظار" },
  failed: { en: "failed", ar: "فشلت" },
  stored_only: { en: "stored", ar: "مخزّنة" },
};

function RealMaterialsTab({ state, courseId }) {
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);

  const load = useCallback(async () => {
    const [course, materials] = await Promise.all([getCourse(courseId), listMaterials(courseId)]);
    return { course, materials };
  }, [courseId]);
  const { data, loading, error, reload } = useAsync(load);
  const [editing, setEditing] = useState(null);
  const [fQuery, setFQuery] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [fKind, setFKind] = useState("all");
  const [fTopicView, setFTopicView] = useState("all");
  const [topicEdit, setTopicEdit] = useState(null); // { id, text }
  const [mergeFrom, setMergeFrom] = useState(null); // topic id being merged
  const [detecting, setDetecting] = useState(false);

  const course = data?.course ?? null;
  const materials = useMemo(() => data?.materials ?? [], [data]);
  const topics = useMemo(() => course?.topics ?? [], [course]);
  const topicName = (id) => {
    const topic = topics.find((x) => x.id === id);
    return topic ? topic.label?.[lang] ?? topic.label?.en : null;
  };
  const reading = materials.some((m) => m.status === "processing" || (m.status === "ready" && m.topicDetection === "pending"));
  const needsDetect = materials.some((m) => m.status === "ready" && (m.topicDetection === "failed" || m.topicDetection === "pending"));

  // While files are still being read, refresh quietly so topics appear.
  useEffect(() => {
    if (!reading) return undefined;
    const id = setTimeout(reload, 6000);
    return () => clearTimeout(id);
  }, [reading, data, reload]);

  const findAgain = async () => {
    setDetecting(true);
    try {
      await detectTopics(courseId);
      toast(t("Topics updated from your files.", "اتحدّثت المواضيع من ملفاتك."));
      reload();
    } catch (err) {
      toast(apiErrorText(err, lang));
    } finally {
      setDetecting(false);
    }
  };

  const saveTopicName = async () => {
    if (!topicEdit) return;
    const title = topicEdit.text.trim();
    const id = topicEdit.id;
    setTopicEdit(null);
    if (!title || title === topicName(id)) return;
    try {
      await renameTopic(courseId, id, title);
      reload();
    } catch (err) {
      toast(apiErrorText(err, lang));
    }
  };

  const removeTopic = async (topic) => {
    try {
      await deleteTopic(courseId, topic.id);
      toast(t("Topic removed.", "اتشال الموضوع."));
      reload();
    } catch (err) {
      toast(apiErrorText(err, lang));
    }
  };

  const mergeInto = async (intoId) => {
    const fromId = mergeFrom;
    setMergeFrom(null);
    if (!fromId || !intoId) return;
    try {
      await mergeTopics(courseId, fromId, intoId);
      toast(t("Topics combined.", "اتدمج الموضوعين."));
      reload();
    } catch (err) {
      toast(apiErrorText(err, lang));
    }
  };

  const kindOf = (m) => (m.file ? fileKind(m.file.fileName, m.file.mime).tag : "NOFILE");
  const matches = (m) =>
    (fStatus === "all" || m.status === fStatus) &&
    (fKind === "all" || kindOf(m) === fKind) &&
    (!fQuery ||
      m.title.toLowerCase().includes(fQuery.toLowerCase()) ||
      (m.originalName ?? "").toLowerCase().includes(fQuery.toLowerCase()));
  const filtersActive = fQuery !== "" || fStatus !== "all" || fKind !== "all" || fTopicView !== "all";
  const fileTopics = (m) => (m.topicIds?.length ? m.topicIds : m.topicId ? [m.topicId] : []);
  const shown = materials.filter(matches).filter((m) => fTopicView === "all" || fileTopics(m).includes(fTopicView));
  const shownCount = shown.length;
  const readyTotal = materials.filter((m) => m.status === "ready").length;

  const commitRename = async () => {
    if (!editing) return;
    const title = editing.text.trim();
    setEditing(null);
    if (!title) return;
    try {
      await renameMaterial(courseId, editing.id, title);
      reload();
    } catch (err) {
      toast(apiErrorText(err, lang));
    }
  };

  const remove = async (m) => {
    try {
      await deleteMaterial(courseId, m.id);
      toast(t(`"${m.title}" removed.`, `حُذفت «${m.title}».`));
      reload();
    } catch (err) {
      toast(apiErrorText(err, lang));
    }
  };

  const download = async (m) => {
    try {
      await downloadMaterial(courseId, m.id, m.originalName ?? m.title);
    } catch (err) {
      toast(apiErrorText(err, lang));
    }
  };

  const handleUpload = async (queue) => {
    for (const item of queue) {
      await uploadMaterialFile(courseId, item.file, item.title.trim() || item.file.name);
    }
    reload();
  };

  return (
    <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Loading materials…", "جارٍ تحميل المواد…")}>
      <div style={{ direction: isRtl ? "rtl" : "ltr" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
          <div style={{ textAlign: isRtl ? "right" : "left" }}>
            <h2 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 17 : 20, color: tokens.textPrimary, letterSpacing: "-0.02em", margin: "0 0 4px" }}>
              {t("Course Materials", "مواد المقرر")}
            </h2>
            <p style={{ fontFamily: bFont, fontSize: 13, color: tokens.textMuted, margin: 0 }}>
              {t("Upload your course files. Topics are found from them automatically, and students' tutor and study tools use them.", "ارفع ملفات المقرر. المواضيع بتطلع منها لوحدها، والمعلم الذكي وأدوات المذاكرة بتستخدمها.")}
            </p>
          </div>
          <Chip tokens={tokens} tone={readyTotal ? "primary" : "slate"}>
            {readyTotal} {t("ready", "جاهزة")} / {materials.length}
          </Chip>
        </div>

        <Card tokens={tokens} style={{ padding: "18px 20px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
            <div style={{ textAlign: isRtl ? "right" : "left" }}>
              <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em" }}>{t("Course topics", "مواضيع المقرر")}</div>
              <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, marginTop: 2 }}>
                {reading ? t("Reading your files…", "بنقرا ملفاتك…") : t("Found from your files. Rename, combine or remove any of them.", "طالعة من ملفاتك. تقدر تغيّر اسم أي موضوع أو تدمجه أو تشيله.")}
              </div>
            </div>
            <button type="button" onClick={() => void findAgain()} disabled={detecting} aria-label={t("Find topics again", "دوّر على المواضيع تاني")} title={t("Find topics again", "دوّر على المواضيع تاني")}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: `1px solid ${needsDetect ? tokens.primary : tokens.cardBorder}`, background: needsDetect ? tokens.primaryLight : tokens.inset, cursor: detecting ? "wait" : "pointer", opacity: detecting ? 0.6 : 1 }}>
              <IconRefresh size={15} color={needsDetect ? tokens.primary : tokens.textMuted} />
            </button>
          </div>
          {topics.length === 0 ? (
            <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, padding: "8px 0" }}>
              {materials.length === 0 ? t("Upload a file and its topics will show up here.", "ارفع ملف ومواضيعه هتظهر هنا.") : reading ? t("This usually takes under a minute.", "ده عادةً بياخد أقل من دقيقة.") : t("No topics found yet. Try finding them again.", "لسه مالقيناش مواضيع. جرّب تدوّر تاني.")}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {topics.map((topic, i) => {
                const count = materials.filter((m) => fileTopics(m).includes(topic.id)).length;
                const editingThis = topicEdit?.id === topic.id;
                const mergingThis = mergeFrom === topic.id;
                return (
                  <div key={topic.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: i ? `1px solid ${tokens.cardBorder}` : "none", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                    <div style={{ flex: "1 1 200px", minWidth: 0, textAlign: isRtl ? "right" : "left" }}>
                      {editingThis ? (
                        <input dir="auto" value={topicEdit.text} autoFocus onChange={(e) => setTopicEdit({ ...topicEdit, text: e.target.value })}
                          onKeyDown={(e) => { if (e.key === "Enter") void saveTopicName(); if (e.key === "Escape") setTopicEdit(null); }}
                          style={{ ...inputStyle(tokens, bFont), fontSize: 12.5, padding: "6px 10px" }} className="genai-input" aria-label={t("Topic name", "اسم الموضوع")} />
                      ) : (
                        <span dir="auto" style={{ fontFamily: bFont, fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>{topic.label?.[lang] ?? topic.label?.en}</span>
                      )}
                      {!editingThis && <span style={{ fontFamily: bFont, fontSize: 12, color: tokens.textFaint, marginInlineStart: 8 }}>{count} {t(count === 1 ? "file" : "files", "ملف")}</span>}
                    </div>
                    {mergingThis ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <select autoFocus defaultValue="" onChange={(e) => void mergeInto(e.target.value)} aria-label={t("Combine with", "ادمج مع")}
                          style={{ ...inputStyle(tokens, bFont), cursor: "pointer", width: mobile ? 160 : 220, fontSize: 12.5, padding: "6px 10px" }} className="genai-input">
                          <option value="" disabled>{t("Combine with…", "ادمج مع…")}</option>
                          {topics.filter((x) => x.id !== topic.id).map((x) => <option key={x.id} value={x.id}>{x.label?.[lang] ?? x.label?.en}</option>)}
                        </select>
                        <button onClick={() => setMergeFrom(null)} aria-label={t("Cancel", "إلغاء")} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, display: "inline-flex" }}><IconX size={14} color={tokens.textMuted} /></button>
                      </div>
                    ) : editingThis ? (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => void saveTopicName()} aria-label={t("Save", "حفظ")} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, display: "inline-flex" }}><IconCheck size={14} color="#1A7F4E" /></button>
                        <button onClick={() => setTopicEdit(null)} aria-label={t("Cancel", "إلغاء")} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, display: "inline-flex" }}><IconX size={14} color={tokens.textMuted} /></button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 4, alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
                        <button onClick={() => setTopicEdit({ id: topic.id, text: topic.label?.en ?? "" })} aria-label={t("Rename", "تغيير الاسم")} title={t("Rename", "تغيير الاسم")} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, display: "inline-flex" }}><IconPencil size={14} color={tokens.textMuted} /></button>
                        {topics.length > 1 && (
                          <button onClick={() => setMergeFrom(topic.id)} aria-label={t("Combine with another topic", "ادمجه مع موضوع تاني")} title={t("Combine with another topic", "ادمجه مع موضوع تاني")} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, display: "inline-flex" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tokens.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3v6a6 6 0 0 0 6 6h6" /><path d="M6 21v-6" /><path d="M15 12l3 3-3 3" /></svg>
                          </button>
                        )}
                        <ConfirmBtn tokens={tokens} lang={lang} label={<IconTrash size={14} color={tokens.gap} />} confirmLabel={t("Remove?", "تشيله؟")} onConfirm={() => void removeTopic(topic)} style={{ padding: "5px 8px" }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card tokens={tokens} style={{ padding: "18px 20px", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
            <div style={{ display: "inline-flex", gap: 8, alignItems: "center", fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em", flexDirection: isRtl ? "row-reverse" : "row" }}>
              <IconUpload size={14} color={tokens.primary} />
              {t("Upload new materials", "رفع مواد جديدة")}
            </div>
          </div>
          <MaterialUploader courseId={courseId} tokens={tokens} lang={lang} onUpload={handleUpload} onDone={reload} />
        </Card>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14, alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
          <input value={fQuery} onChange={(e) => setFQuery(e.target.value)} placeholder={t("Search title or file name…", "بحث بالعنوان أو اسم الملف…")} style={{ ...inputStyle(tokens, bFont), width: mobile ? "100%" : 220 }} className="genai-input" />
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} style={{ ...inputStyle(tokens, bFont), cursor: "pointer", width: mobile ? "calc(50% - 5px)" : 150 }} className="genai-input">
            <option value="all">{t("All statuses", "كل الحالات")}</option>
            <option value="ready">{t("Ready", "جاهزة")}</option>
            <option value="processing">{t("Processing", "جارٍ التجهيز")}</option>
            <option value="stored_only">{t("Stored only", "مخزّنة فقط")}</option>
            <option value="failed">{t("Failed", "فشلت")}</option>
          </select>
          <select value={fKind} onChange={(e) => setFKind(e.target.value)} style={{ ...inputStyle(tokens, bFont), cursor: "pointer", width: mobile ? "calc(50% - 5px)" : 150 }} className="genai-input">
            <option value="all">{t("All types", "كل الأنواع")}</option>
            <option value="PDF">PDF</option>
            <option value="DOC">DOC</option>
            <option value="SLIDES">SLIDES</option>
            <option value="SHEET">SHEET</option>
            <option value="VIDEO">VIDEO</option>
            <option value="IMG">IMG</option>
            <option value="ARCHIVE">ARCHIVE</option>
            <option value="TEXT">TEXT</option>
            <option value="NOFILE">{t("No uploaded file", "بدون ملف مرفوع")}</option>
          </select>
          <select value={fTopicView} onChange={(e) => setFTopicView(e.target.value)} style={{ ...inputStyle(tokens, bFont), cursor: "pointer", width: mobile ? "100%" : 190 }} className="genai-input">
            <option value="all">{t("All topics", "كل المواضيع")}</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>{topic.label?.[lang] ?? topic.label?.en}</option>
            ))}
          </select>
          {filtersActive && (
            <Btn tokens={tokens} lang={lang} variant="ghost" style={{ padding: "7px 12px", fontSize: 11.5 }}
              onClick={() => { setFQuery(""); setFStatus("all"); setFKind("all"); setFTopicView("all"); }}>
              {t("Clear filters", "مسح الفلاتر")}
            </Btn>
          )}
        </div>
        {filtersActive && (
          <div style={{ fontFamily: "inherit", fontSize: 12.5, color: tokens.textMuted, marginBottom: 12 }}>
            {t(`${shownCount} matching material${shownCount === 1 ? "" : "s"} shown`, `معروض ${shownCount} مادة مطابقة`)}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card tokens={tokens} style={{ padding: "8px 20px" }}>
                {materials.length === 0 ? (
                  <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textFaint, padding: "14px 0" }}>
                    {t("Nothing uploaded yet.", "لسه مفيش ملفات.")}
                  </div>
                ) : shown.length === 0 ? (
                  <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textFaint, padding: "14px 0" }}>
                    {t("No files match these filters.", "مفيش ملفات مطابقة.")}
                  </div>
                ) : (
                  shown.map((m, i) => {
                    const kind = fileKind(m.originalName ?? m.title, m.mimeType);
                    const isEditing = editing?.id === m.id;
                    const statusColor = REAL_STATUS_COLORS[m.status] ?? "#6B7280";
                    const statusLabel = REAL_STATUS_LABELS[m.status] ?? { en: m.status, ar: m.status };
                    return (
                      <div key={m.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 0", borderTop: i > 0 ? `1px solid ${tokens.cardBorder}` : "none", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                        <IconDoc size={16} color={kind.color} />
                        <div style={{ flex: "1 1 200px", minWidth: 0, textAlign: isRtl ? "right" : "left" }}>
                          {isEditing ? (
                            <input
                              value={editing.text}
                              onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") commitRename();
                                if (e.key === "Escape") setEditing(null);
                              }}
                              style={{ ...inputStyle(tokens, bFont), fontSize: 12, padding: "6px 10px", marginBottom: 3 }}
                              className="genai-input"
                            />
                          ) : (
                            <div style={{ fontFamily: bFont, fontSize: 12.5, fontWeight: 600, color: tokens.textPrimary, marginBottom: 3 }}>{m.title}</div>
                          )}
                          <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                            <span style={{ fontFamily: "inherit", fontSize: 12, color: kind.color, border: `1px solid ${kind.color}55`, borderRadius: 5, padding: "1px 6px" }}>{kind.tag}</span>
                            {m.file && (
                              <span style={{ fontFamily: "inherit", fontSize: 12.5, color: tokens.textMuted }}>
                                {m.file.fileName} · {fmtBytes(m.file.size)}
                              </span>
                            )}
                            {m.createdAt && <span style={{ fontFamily: "inherit", fontSize: 12.5, color: tokens.textFaint }}>{fmtWhen(m.createdAt, lang)}</span>}
                          </div>
                          {m.status === "ready" && (
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6, flexDirection: isRtl ? "row-reverse" : "row" }}>
                              {fileTopics(m).map(topicName).filter(Boolean).map((name) => (
                                <span key={name} dir="auto" style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.primary, background: tokens.primaryLight, borderRadius: 6, padding: "2px 8px" }}>{name}</span>
                              ))}
                              {m.topicDetection === "pending" && <span style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted }}>{t("Finding topics…", "بندوّر على المواضيع…")}</span>}
                              {m.topicDetection === "failed" && <span style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.gap }}>{t("Topics not found yet", "لسه مالقيناش مواضيع")}</span>}
                            </div>
                          )}
                        </div>
                        <span style={{ fontFamily: "inherit", fontSize: 12, letterSpacing: 0, fontWeight: 700, borderRadius: 6, padding: "2px 8px", whiteSpace: "nowrap", color: statusColor, background: `${statusColor}1a`, border: `1px solid ${statusColor}44` }}>
                          {lang === "ar" ? statusLabel.ar : statusLabel.en.toUpperCase()}
                        </span>
                        <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0, flexDirection: isRtl ? "row-reverse" : "row" }}>
                          {isEditing ? (
                            <>
                              <button onClick={commitRename} aria-label={t("Save", "حفظ")} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6 }}>
                                <IconCheck size={14} color="#1A7F4E" />
                              </button>
                              <button onClick={() => setEditing(null)} aria-label={t("Cancel", "إلغاء")} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6 }}>
                                <IconX size={14} color={tokens.textMuted} />
                              </button>
                            </>
                          ) : (
                            <>
                              {m.hasFile && (
                                <button onClick={() => download(m)} aria-label={t("Download", "تحميل")} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, display: "inline-flex" }}>
                                  <IconDownload size={14} color={tokens.textMuted} />
                                </button>
                              )}
                              <button onClick={() => setEditing({ id: m.id, text: m.title })} aria-label={t("Rename", "إعادة تسمية")} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6 }}>
                                <IconPencil size={14} color={tokens.textMuted} />
                              </button>
                              <button onClick={() => remove(m)} aria-label={t("Delete", "حذف")} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6 }}>
                                <IconTrash size={14} color={tokens.gap} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
          </Card>
        </div>
      </div>
    </AsyncGate>
  );
}

export default function CourseMaterialsTab(props) {
  if (!demoMode()) return <RealMaterialsTab {...props} />;
  return <DemoMaterialsTab {...props} />;
}