import { useEffect, useMemo, useState } from "react";
import { tk, MONO } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useInstructorModule } from "@/store/InstructorProvider";
import { Card, Btn, ConfirmBtn, inputStyle, bFontFor, hFontFor, toast } from "@/components/ModuleUI";
import { IconCheck, IconDownload, IconWarning, IconDoc, IconBookOpen, IconUpload } from "@/components/Icons";
import MaterialUploader from "@/components/MaterialUploader";
import { fmtBytes, fileKind } from "@/utils/fileMeta";
import { approvedMaterials, pendingMaterials, fmtWhen } from "@/data/instructorModule";

export default function CourseMaterialsTab({ state, courseId }) {
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
      fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.07em", fontWeight: 700, borderRadius: 6, padding: "2px 8px", whiteSpace: "nowrap",
      color: status === "approved" ? tokens.mastered : tokens.developing,
      background: status === "approved" ? `${tokens.mastered}1a` : `${tokens.developing}1a`,
      border: `1px solid ${status === "approved" ? tokens.mastered : tokens.developing}44`
    }}>
      {status === "approved" ? (lang === "ar" ? "معتمد" : "APPROVED") : (lang === "ar" ? "بانتظار الاعتماد" : "PENDING")}
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
          { l: lang === "ar" ? "معتمدة" : "APPROVED", v: totals.approved, c: tokens.mastered },
          { l: lang === "ar" ? "بانتظار الاعتماد" : "PENDING", v: totals.pending, c: tokens.developing },
          { l: lang === "ar" ? "مواضيع بلا مواد" : "TOPICS WITH NO MATERIALS", v: gaps.length, c: gaps.length ? tokens.gap : tokens.textMuted },
        ].map((t) => (
          <div key={t.l} style={{ display: "inline-flex", gap: 8, alignItems: "center", background: tokens.card, border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, padding: "8px 14px" }}>
            <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: t.c }}>{t.v}</span>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", color: tokens.textMuted }}>{t.l}</span>
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
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", color: tokens.textMuted }}>{lang === "ar" ? "الموضوع" : "TOPIC"}</span>
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
        <div style={{ fontFamily: MONO, fontSize: 10.5, color: tokens.textMuted, marginBottom: 12 }}>
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
                <span style={{ fontFamily: MONO, fontSize: 10.5, color: tokens.textMuted }}>
                  {approved} {lang === "ar" ? "معتمد" : "approved"} · {pending} {lang === "ar" ? "معلق" : "pending"}
                </span>
              </div>
              {t.materials.length === 0 ? (
                <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textFaint, paddingTop: 4 }}>
                  {lang === "ar" ? "لا مواد لهذا الموضوع بعد — ارفعي من الأعلى." : "No materials for this topic yet — upload above."}
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
                          <span style={{ fontFamily: MONO, fontSize: 9.5, color: kind.color, border: `1px solid ${kind.color}55`, borderRadius: 5, padding: "1px 6px" }}>{kind.tag}</span>
                          {m.file && (
                            <span style={{ fontFamily: MONO, fontSize: 10.5, color: tokens.textMuted }}>
                              {m.file.fileName} · {fmtBytes(m.file.size)}
                            </span>
                          )}
                          <span style={{ fontFamily: MONO, fontSize: 10.5, color: tokens.textFaint }}>{fmtWhen(m.addedAt, lang)}</span>
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