import { useState } from "react";
import { tk, MONO } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useInstructorModule } from "@/store/InstructorProvider";
import { Card, Btn, Chip, BackCircle, inputStyle, bFontFor, hFontFor, toast } from "@/components/ModuleUI";
import { IconPlus, IconDoc, IconDownload, IconPencil, IconTrash, IconCheck, IconX, IconBookOpen } from "@/components/Icons";
import MaterialUploader from "@/components/MaterialUploader";
import { fmtBytes, fileKind } from "@/utils/fileMeta";
import { SCREENS } from "@/constants/routes";

export default function StudentCoursePage({ state, dispatch }) {
  const { state: mod, addPersonalTopic, renameMaterial, removeMaterial } = useInstructorModule();
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);
  const [topicDraft, setTopicDraft] = useState("");
  const [editing, setEditing] = useState(null);

  const course = mod.courses.find((c) => c.id === state.courseId && c.isPersonal);

  if (!course) {
    return (
      <div style={{ padding: 40, fontFamily: bFont, color: tokens.textMuted, textAlign: "center" }}>
        {lang === "ar" ? "المقرر الشخصي غير موجود." : "Self-study course not found."}
      </div>
    );
  }

  const addTopic = () => {
    const label = topicDraft.trim();
    if (!label) return;
    addPersonalTopic(course.id, label);
    setTopicDraft("");
    toast(lang === "ar" ? `أُضيف الموضوع «${label}» — ارفع مواده الآن.` : `Topic "${label}" added — upload its materials now.`);
  };

  const commitRename = () => {
    if (!editing) return;
    const title = editing.text.trim();
    if (title) renameMaterial(course.id, editing.topicId, editing.id, title);
    setEditing(null);
  };

  const remove = (topicId, m) => {
    removeMaterial(course.id, topicId, m.id);
    toast(lang === "ar" ? `حُذفت «${m.title}».` : `"${m.title}" removed.`);
  };

  return (
    <div className="genai-pad" style={{ padding: mobile ? "20px 16px" : "26px 32px", direction: isRtl ? "rtl" : "ltr", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
        <BackCircle tokens={tokens} rtl={isRtl} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.COURSES, courseId: undefined })} />
        <div style={{ textAlign: isRtl ? "right" : "left", minWidth: 0 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
            <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: 0 }}>
              {lang === "ar" ? course.title.ar : course.title.en}
            </h1>
            <Chip tokens={tokens} tone="violet">{lang === "ar" ? "دراسة ذاتية" : "Self-study"}</Chip>
          </div>
          <p style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, margin: 0, lineHeight: 1.6 }}>
            {lang === "ar"
              ? "مقررك إنت — بترفع مواده بنفسك ومفعّلة فوراً من غير اعتماد، ومعلمك الذكي بيستند عليها."
              : "Your own course — you upload its materials yourself, active immediately with no approval gate, and your AI tutor grounds on them."}
          </p>
        </div>
      </div>

      <Card tokens={tokens} style={{ padding: "14px 16px", margin: "16px 0", display: "flex", gap: 10, alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
        <input
          value={topicDraft}
          onChange={(e) => setTopicDraft(e.target.value)}
          placeholder={lang === "ar" ? "اسم موضوع جديد — مثال: المتجهات" : "New topic name — e.g. Vectors"}
          onKeyDown={(e) => { if (e.key === "Enter") addTopic(); }}
          style={{ ...inputStyle(tokens, bFont), flex: 1, minWidth: 0 }}
          className="genai-input"
        />
        <Btn tokens={tokens} lang={lang} variant="soft" disabled={!topicDraft.trim()} onClick={addTopic} style={{ padding: "9px 16px", fontSize: 12.5, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <IconPlus size={13} color={tokens.primary} />
          {lang === "ar" ? "إضافة موضوع" : "Add topic"}
        </Btn>
      </Card>

      {course.topics.length === 0 && (
        <Card tokens={tokens} style={{ padding: "34px 24px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", width: 44, height: 44, borderRadius: "50%", background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <IconBookOpen size={22} color={tokens.textFaint} />
          </div>
          <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, marginBottom: 4 }}>
            {lang === "ar" ? "مفيش مواضيع لسه" : "No topics yet"}
          </div>
          <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.6 }}>
            {lang === "ar" ? "ضيف أول موضوع فوق، وبعدها ارفع مواده (PDF، ملاحظات، شرائح)." : "Add your first topic above, then upload its materials (PDFs, notes, slides)."}
          </div>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {course.topics.map((topic) => (
          <Card tokens={tokens} key={topic.id} style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12, flexDirection: isRtl ? "row-reverse" : "row" }}>
              <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em" }}>
                {lang === "ar" ? topic.label.ar : topic.label.en}
              </div>
              <Chip tokens={tokens} tone={topic.materials.length ? "primary" : "slate"}>
                {topic.materials.length} {lang === "ar" ? "مواد" : "materials"}
              </Chip>
            </div>

            {topic.materials.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                {topic.materials.map((m) => {
                  const kind = fileKind(m.file?.fileName ?? m.title, m.file?.mime);
                  const isEditing = editing?.id === m.id && editing?.topicId === topic.id;
                  return (
                    <div key={m.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                      <IconDoc size={16} color={kind.color} />
                      <div style={{ minWidth: 0, flex: "1 1 160px", textAlign: isRtl ? "right" : "left" }}>
                        {isEditing ? (
                          <input
                            value={editing.text}
                            onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                            autoFocus
                            onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setEditing(null); }}
                            style={{ ...inputStyle(tokens, bFont), fontSize: 12, padding: "6px 10px" }}
                            className="genai-input"
                          />
                        ) : (
                          <div style={{ fontFamily: bFont, fontSize: 13, fontWeight: 600, color: tokens.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {m.title}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 3, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                          <span style={{ fontFamily: MONO, fontSize: 9.5, color: kind.color, border: `1px solid ${kind.color}55`, borderRadius: 5, padding: "1px 6px" }}>{kind.tag}</span>
                          {m.file?.size ? <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.textMuted }}>{fmtBytes(m.file.size)}</span> : null}
                          <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.mastered }}>{lang === "ar" ? "مفعّلة" : "active"}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0, flexDirection: isRtl ? "row-reverse" : "row" }}>
                        {isEditing ? (
                          <>
                            <button onClick={commitRename} aria-label={lang === "ar" ? "حفظ" : "Save"} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6 }}>
                              <IconCheck size={14} color={tokens.mastered} />
                            </button>
                            <button onClick={() => setEditing(null)} aria-label={lang === "ar" ? "إلغاء" : "Cancel"} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6 }}>
                              <IconX size={14} color={tokens.textMuted} />
                            </button>
                          </>
                        ) : (
                          <>
                            {m.file?.url && (
                              <a href={m.file.url} download={m.file.fileName ?? m.title} aria-label={lang === "ar" ? "تحميل" : "Download"} style={{ padding: 6, borderRadius: 6, display: "inline-flex" }}>
                                <IconDownload size={14} color={tokens.textMuted} />
                              </a>
                            )}
                            <button onClick={() => setEditing({ topicId: topic.id, id: m.id, text: m.title })} aria-label={lang === "ar" ? "إعادة تسمية" : "Rename"} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6 }}>
                              <IconPencil size={14} color={tokens.textMuted} />
                            </button>
                            <button onClick={() => remove(topic.id, m)} aria-label={lang === "ar" ? "حذف" : "Delete"} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6 }}>
                              <IconTrash size={14} color={tokens.gap} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <MaterialUploader courseId={course.id} topicId={topic.id} tokens={tokens} lang={lang} autoApprove />
          </Card>
        ))}
      </div>
    </div>
  );
}