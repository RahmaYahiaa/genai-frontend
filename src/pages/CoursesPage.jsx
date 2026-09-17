import { useState } from "react";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { fetchCourses } from "@/services/api";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { Card, Chip, Bar, AsyncGate, Btn } from "@/components/ui";
import { Modal, inputStyle, toast, bFontFor } from "@/components/ModuleUI";
import { IconPlus } from "@/components/Icons";
import { useInstructorModule } from "@/store/InstructorProvider";

export default function CoursesPage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const mobile = useMediaQuery("(max-width: 760px)");
  const { data, loading, error, reload } = useAsync(fetchCourses);
  const { state: mod, addPersonalCourse } = useInstructorModule();
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const bFont = bFontFor(lang);

  const personal = mod.courses.filter((c) => c.isPersonal);
  const merged = [...(data ?? []).filter((c) => !personal.some((p) => p.id === c.id)), ...personal];

  const createCourse = () => {
    const title = newTitle.trim();
    if (!title) return;
    const id = addPersonalCourse(title);
    setCreateOpen(false);
    setNewTitle("");
    toast(t("Self-study course created — add your topics and materials.", "اتعمل مقرر الدراسة الذاتية — ضيف مواضيعك وموادك."));
    dispatch({ type: "NAVIGATE", screen: SCREENS.STUDENT_COURSE, courseId: id });
  };

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 1080, margin: "0 auto", fontFamily: bodyFont(lang) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: mobile ? 19 : 22, fontWeight: 700, letterSpacing: "-0.02em", color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
            {t("My Courses", "مقرراتي")}
          </h1>
          <p style={{ margin: 0, fontSize: 12.5, color: tokens.textMuted }}>
            {t("Everything you're enrolled in, with live mastery evidence.", "كل المقررات المسجلة فيها، مع أدلة الإتقان الحية.")}
          </p>
        </div>
        <Btn tokens={tokens} variant="soft" onClick={() => setCreateOpen(true)} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, flexShrink: 0 }}>
          <IconPlus size={13} color={tokens.primary} />
          {t("New self-study course", "مقرر دراسة ذاتية جديد")}
        </Btn>
      </div>

      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Loading courses…", "جاري تحميل المقررات…")}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: 14 }}>
          {merged.map((course) => {
            const covered = course.topics.filter((x) => x.evidence > 0).length;
            const isPersonal = Boolean(course.isPersonal);
            return (
              <Card key={course.id} tokens={tokens}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8 }}>
                  <Chip tokens={tokens} tone="primary">{course.id}</Chip>
                  {isPersonal ? (
                    <Chip tokens={tokens}>{t("Self-study", "دراسة ذاتية")}</Chip>
                  ) : (
                    <Chip tokens={tokens}>{t(`Week ${course.week}`, `الأسبوع ${course.week}`)}</Chip>
                  )}
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: tokens.textPrimary, marginBottom: 12 }}>
                  {course.title[lang]}
                </div>
                <Bar tokens={tokens} value={course.overall} color={tokens.mastered} height={8} />
                <div style={{ display: "flex", justifyContent: "space-between", margin: "8px 0 16px", fontSize: 11.5, color: tokens.textMuted }}>
                  <span>{t("Overall mastery", "الإتقان الكلي")}</span>
                  <span style={{ fontWeight: 700, color: tokens.mastered }}>{course.overall}%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11.5, color: tokens.textFaint }}>
                    {isPersonal
                      ? `${course.topics.length} ${t("topics · your materials", "مواضيع · موادك")}`
                      : `${covered}/${course.topics.length} ${t("topics with evidence", "مواضيع بأدلة")}`}
                  </span>
                  {isPersonal ? (
                    <Btn tokens={tokens} variant="soft" onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.STUDENT_COURSE, courseId: course.id })}>
                      {t("Manage", "إدارة")}
                    </Btn>
                  ) : (
                    <Btn tokens={tokens} variant="soft" onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.MASTERY })}>
                      {t("View topics", "عرض المواضيع")}
                    </Btn>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </AsyncGate>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} tokens={tokens} lang={lang} width={480}
        title={t("New self-study course", "مقرر دراسة ذاتية جديد")}>
        <p style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, margin: "0 0 14px", lineHeight: 1.6 }}>
          {t(
            "Your own course: you add the topics and upload the materials. Everything is active immediately — no approval gate, and only you can see it.",
            "مقررك الخاص: إنت بتضيف المواضيع وبترفع المواد. كل حاجة مفعّلة فوراً — من غير بوابة اعتماد، وإنت بس اللي تشوفها."
          )}
        </p>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder={t("e.g. Linear Algebra Foundations", "مثال: أساسات الجبر الخطي")}
          autoFocus
          style={inputStyle(tokens, bFont)}
          className="genai-input"
          onKeyDown={(e) => { if (e.key === "Enter") createCourse(); }}
        />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
          <Btn tokens={tokens} variant="ghost" onClick={() => setCreateOpen(false)}>
            {t("Cancel", "إلغاء")}
          </Btn>
          <Btn tokens={tokens} disabled={!newTitle.trim()} onClick={createCourse}>
            {t("Create course", "إنشاء المقرر")}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}