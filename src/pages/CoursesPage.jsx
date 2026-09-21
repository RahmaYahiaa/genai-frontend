import { useCallback, useEffect, useState } from "react";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { fetchCourses } from "@/services/api";
import { listCourses, createPersonalCourse, getCreationPolicy } from "@/services/courses";
import { demoMode } from "@/services/auth";
import { apiErrorText } from "@/services/http";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { Card, Chip, Bar, AsyncGate, Btn } from "@/components/ui";
import { AlertStrip, Modal, inputStyle, toast, bFontFor } from "@/components/ModuleUI";
import { IconPlus, IconGlobe } from "@/components/Icons";
import { useInstructorModule } from "@/store/InstructorProvider";

export default function CoursesPage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const mobile = useMediaQuery("(max-width: 760px)");
  const real = !demoMode();
  const load = useCallback(
    () => (real ? listCourses() : fetchCourses().then((items) => ({ items, meta: null }))),
    [real],
  );
  const { data, loading, error, reload } = useAsync(load);
  const { state: mod, addPersonalCourse } = useInstructorModule();
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const bFont = bFontFor(lang);

  const personal = mod.courses.filter((c) => c.isPersonal);
  const merged = real
    ? data?.items ?? []
    : [...(data?.items ?? []).filter((c) => !personal.some((p) => p.id === c.id)), ...personal];

  const [policy, setPolicy] = useState(null);
  useEffect(() => {
    if (!real || state.user?.accountType !== "individual") return undefined;
    let alive = true;
    getCreationPolicy()
      .then((p) => { if (alive) setPolicy(p); })
      .catch(() => null);
    return () => { alive = false; };
  }, [real, state.user?.accountType]);

  const canCreate = !real || (state.user?.accountType === "individual" && policy?.canCreatePersonal !== false);
  const personalPaused = real && state.user?.accountType === "individual" && policy?.canCreatePersonal === false;

  const createCourse = async () => {
    const title = newTitle.trim();
    if (!title || busy) return;
    if (!real) {
      const id = addPersonalCourse(title);
      setCreateOpen(false);
      setNewTitle("");
      toast(t("Self-study course created — add your topics and materials.", "اتعمل مقرر الدراسة الذاتية — ضيف مواضيعك وموادك."));
      dispatch({ type: "NAVIGATE", screen: SCREENS.STUDENT_COURSE, courseId: id });
      return;
    }
    setBusy(true);
    try {
      const course = await createPersonalCourse(title);
      setCreateOpen(false);
      setNewTitle("");
      toast(t("Self-study course created — add your topics and materials.", "اتعمل مقرر الدراسة الذاتية — ضيف مواضيعك وموادك."));
      dispatch({ type: "NAVIGATE", screen: SCREENS.STUDENT_COURSE, courseId: course.id });
    } catch (err) {
      toast(apiErrorText(err, lang));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 1080, margin: "0 auto", fontFamily: bodyFont(lang) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: mobile ? 19 : 22, fontWeight: 700, letterSpacing: "-0.02em", color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
            {t("My Courses", "مقرراتي")}
          </h1>
          <p style={{ margin: 0, fontSize: 12.5, color: tokens.textMuted }}>
            {state.role === "student"
              ? t("Everything you're enrolled in, with live mastery evidence.", "كل المقررات المسجلة فيها، مع أدلة الإتقان الحية.")
              : t("Courses you teach or staff — open the workspace to manage them.", "المقررات اللي بتدرّسها أو مشارك فيها — افتح مساحة العمل لإدارتها.")}
          </p>
        </div>
        {canCreate && (
          <Btn tokens={tokens} variant="soft" onClick={() => setCreateOpen(true)} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, flexShrink: 0 }}>
            <IconPlus size={13} color={tokens.primary} />
            {t("New self-study course", "مقرر دراسة ذاتية جديد")}
          </Btn>
        )}
      </div>

      {personalPaused && (
        <AlertStrip
          tokens={tokens}
          lang={lang}
          tone="slate"
          icon={<IconGlobe size={15} color={tokens.noEvidence} />}
          title={t("Self-study courses are for independent accounts", "مقررات الدراسة الذاتية متاحة للحسابات المستقلة")}
          body={t(
              "Your email belongs to a registered institution, so personal course creation is paused. When your university sends a linking invitation it lands at the top of your Dashboard — accept it and the institution catalog opens for your account.",
               "بريدك الإلكتروني تابع لمؤسسة مسجّلة، لذا توقّف إنشاء المقررات الذاتية. حين ترسل جامعتك دعوة ربط، تظهر أعلى لوحة التحكم — اقبليها وينفتح كتالوج المؤسسة لحسابك."
           )}
        />
      )}

      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Loading courses…", "جاري تحميل المقررات…")}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: 14 }}>
          {merged.map((course) => {
            const covered = course.topics.filter((x) => x.evidence > 0).length;
            const isPersonal = Boolean(course.isPersonal);
            const hasMastery = typeof course.overall === "number";
            return (
              <Card key={course.id} tokens={tokens}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8 }}>
                  <Chip tokens={tokens} tone="primary">{course.code ?? course.id.slice(0, 8)}</Chip>
                  {isPersonal ? (
                    <Chip tokens={tokens}>{t("Self-study", "دراسة ذاتية")}</Chip>
                  ) : hasMastery ? (
                    <Chip tokens={tokens}>{t(`Week ${course.week}`, `الأسبوع ${course.week}`)}</Chip>
                  ) : (
                    <Chip tokens={tokens}>{t("University", "جامعي")}</Chip>
                  )}
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: tokens.textPrimary, marginBottom: 12 }}>
                  {course.title[lang]}
                </div>
                {hasMastery && <Bar tokens={tokens} value={course.overall} color={tokens.mastered} height={8} />}
                <div style={{ display: "flex", justifyContent: "space-between", margin: hasMastery ? "8px 0 16px" : "0 0 16px", fontSize: 11.5, color: tokens.textMuted }}>
                  {hasMastery ? (
                    <>
                      <span>{t("Overall mastery", "الإتقان الكلي")}</span>
                      <span style={{ fontWeight: 700, color: tokens.mastered }}>{course.overall}%</span>
                    </>
                  ) : (
                    <span>{course.description ?? t("No description yet.", "مفيش وصف لسه.")}</span>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11.5, color: tokens.textFaint }}>
                    {isPersonal
                      ? `${course.topics.length} ${t("topics · your materials", "مواضيع · موادك")}`
                      : hasMastery
                        ? `${covered}/${course.topics.length} ${t("topics with evidence", "مواضيع بأدلة")}`
                        : `${course.topics.length} ${t("topics", "مواضيع")}`}
                  </span>
                  {isPersonal ? (
                    <Btn tokens={tokens} variant="soft" onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.STUDENT_COURSE, courseId: course.id })}>
                      {t("Manage", "إدارة")}
                    </Btn>
                  ) : (
                    <Btn tokens={tokens} variant="soft" onClick={() => dispatch({
                      type: "NAVIGATE",
                      screen: real && state.role !== "student" ? SCREENS.COURSE_WORKSPACE : real ? SCREENS.STUDENT_COURSE : SCREENS.MASTERY,
                      courseId: real ? course.id : undefined,
                      tab: "assignments",
                    })}>
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
          <Btn tokens={tokens} disabled={!newTitle.trim() || busy} onClick={createCourse}>
            {busy ? t("Creating…", "جارٍ الإنشاء…") : t("Create course", "إنشاء المقرر")}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}