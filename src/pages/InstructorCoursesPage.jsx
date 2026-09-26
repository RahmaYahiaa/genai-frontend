import { useState } from "react";
import { tk } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import useInstructorOverview from "@/hooks/useInstructorOverview";
import { createCourse } from "@/services/courses";
import { SCREENS } from "@/constants/routes";
import { Modal, Field, inputStyle, textareaStyle, toast, bFontFor } from "@/components/ModuleUI";
import { LoadingBlock, ErrorBlock, EmptyBlock, PrimaryButton, SecondaryButton } from "@/components/study/StudyKit";
import { InstructorPage, Card, Pill, CodeBadge } from "@/components/instructor/InstructorKit";
import { IconCourses, IconPlus, IconUsers, IconClipboard, IconDoc } from "@/components/Icons";

/** Instructor course list: one card per course with its real numbers. */
export default function InstructorCoursesPage({ state, dispatch }) {
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const bFont = bFontFor(lang);
  const { data, loading, error, reload } = useInstructorOverview();
  const [createOpen, setCreateOpen] = useState(Boolean(state.create));
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const courses = data?.courses ?? [];
  const canCreate = data?.canCreateCourse === true;
  const open = (c, tab = "assignments") => dispatch({ type: "NAVIGATE", screen: SCREENS.COURSE_WORKSPACE, courseId: c.id, tab });

  const submitCreate = async () => {
    if (!code.trim() || !title.trim() || creating) return;
    setCreating(true);
    try {
      await createCourse({ code: code.trim().toUpperCase(), title: title.trim(), ...(description.trim() ? { description: description.trim() } : {}) });
      setCreateOpen(false);
      setCode(""); setTitle(""); setDescription("");
      toast(t("Course created. Add its first materials next.", "المقرر اتعمل. ضيف أول مواد ليه."));
      reload();
    } catch (err) {
      toast(err?.message ?? t("Could not create the course.", "مقدرناش نعمل المقرر."));
    } finally {
      setCreating(false);
    }
  };

  const stat = (Icon, text) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: tokens.textSecondary }}>
      <Icon size={14} color={tokens.textMuted} />{text}
    </span>
  );

  return (
    <InstructorPage tokens={tokens} lang={lang} mobile={mobile}
      title={t("My courses", "مقرراتي")}
      subtitle={t("Open a course to manage its assignments, materials and class results.", "افتح المقرر عشان تدير تكليفاته وموادّه ونتايج الطلاب.")}
      actions={canCreate && <PrimaryButton tokens={tokens} onClick={() => setCreateOpen(true)}><IconPlus size={15} color="#fff" />{t("New course", "مقرر جديد")}</PrimaryButton>}>
      {loading ? (
        <LoadingBlock tokens={tokens} label={t("Loading your courses…", "بنحمّل مقرراتك…")} />
      ) : error ? (
        <ErrorBlock tokens={tokens} lang={lang} onRetry={reload} />
      ) : courses.length === 0 ? (
        <EmptyBlock tokens={tokens} Icon={IconCourses} title={t("No courses yet", "مفيش مقررات لسه")}
          body={canCreate ? t("Create your first course to get started.", "اعمل أول مقرر عشان تبدأ.") : t("Your institution will add you to your courses.", "المؤسسة هتضيفك لمقرراتك.")} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {courses.map((c) => {
            const topicsCovered = c.topicsTotal != null ? c.topicsTotal - c.topicsWithoutQuestions.length : null;
            return (
              <Card key={c.id} tokens={tokens} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <CodeBadge tokens={tokens}>{c.code}</CodeBadge>
                  {c.toReview > 0 ? <Pill tokens={tokens} tone="attention">{c.toReview} {t("to review", "للمراجعة")}</Pill>
                    : c.readyToApprove > 0 ? <Pill tokens={tokens} tone="good">{c.readyToApprove} {t("to approve", "للاعتماد")}</Pill>
                    : <Pill tokens={tokens}>{t("Up to date", "مفيش متأخر")}</Pill>}
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 650, color: tokens.textPrimary }}>{c.title}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 10 }}>
                    {stat(IconUsers, t(`${c.students} student${c.students === 1 ? "" : "s"}`, `${c.students} طالب`))}
                    {stat(IconClipboard, t(`${c.assignments.length} assignment${c.assignments.length === 1 ? "" : "s"}`, `${c.assignments.length} تكليف`))}
                    {stat(IconDoc, t(`${c.materialsReady} files ready`, `${c.materialsReady} ملف جاهز`))}
                  </div>
                </div>
                {topicsCovered != null && c.topicsTotal > 0 && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: tokens.textMuted, marginBottom: 6 }}>
                      <span>{t("Topics with assignment questions", "مواضيع ليها أسئلة تكليفات")}</span>
                      <span style={{ fontWeight: 600, color: tokens.textSecondary }}>{topicsCovered}/{c.topicsTotal}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: tokens.cardBorder }}>
                      <div style={{ width: `${Math.round((topicsCovered / c.topicsTotal) * 100)}%`, height: "100%", borderRadius: 99, background: tokens.primary }} />
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                  <PrimaryButton tokens={tokens} style={{ flex: 1, height: 38, fontSize: 13.5 }} onClick={() => open(c)}>{t("Open course", "افتح المقرر")}</PrimaryButton>
                  <SecondaryButton tokens={tokens} style={{ height: 38, fontSize: 13.5 }} onClick={() => open(c, "materials")}>{t("Materials", "المواد")}</SecondaryButton>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} tokens={tokens} lang={lang}
        title={t("Create a new course", "اعمل مقرر جديد")}
        subtitle={t("You can add materials and assignments right after.", "تقدر تضيف المواد والتكليفات بعدها على طول.")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field tokens={tokens} lang={lang} label={t("Course code", "كود المقرر")} required hint={t("The first digit is the study year, e.g. CS310 is year 3.", "أول رقم هو السنة الدراسية، مثلًا CS310 يعني سنة تالتة.")}>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} style={{ ...inputStyle(tokens, bFont), direction: "ltr", textAlign: "left" }} placeholder="CS310" />
          </Field>
          <Field tokens={tokens} lang={lang} label={t("Course title", "اسم المقرر")} required>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle(tokens, bFont)} placeholder={t("e.g. Mobile Application Development", "مثال: تطوير تطبيقات المحمول")} />
          </Field>
          <Field tokens={tokens} lang={lang} label={t("Description (optional)", "الوصف (اختياري)")}>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={textareaStyle(tokens, bFont)} />
          </Field>
          <PrimaryButton tokens={tokens} full busy={creating} disabled={!code.trim() || !title.trim()} onClick={submitCreate}>{t("Create course", "اعمل المقرر")}</PrimaryButton>
        </div>
      </Modal>
    </InstructorPage>
  );
}
