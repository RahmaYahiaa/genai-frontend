import { useState } from "react";
import { demoMode } from "@/services/auth";
import { tk } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import useInstructorOverview from "@/hooks/useInstructorOverview";
import { SCREENS } from "@/constants/routes";
import { LoadingBlock, ErrorBlock, EmptyBlock, PrimaryButton } from "@/components/study/StudyKit";
import { InstructorPage, Card, SectionTitle, StatTile, Row, Pill, CodeBadge } from "@/components/instructor/InstructorKit";
import { IconClipboard, IconCheck, IconPencil, IconUpload, IconClock, IconUsers, IconSparkle, IconPlus, IconCourses, IconWarning } from "@/components/Icons";
import InstructorHomePage from "@/pages/InstructorHomePage";

/**
 * Instructor home: what needs the doctor today, the four numbers that matter,
 * quick actions and the course list. Every figure comes from live endpoints
 * (see useInstructorOverview).
 */
function buildTasks(courses, t) {
  const tasks = [];
  for (const c of courses) {
    for (const q of c.queues) {
      const name = q.assignment.title?.en ?? "";
      if (q.toReview > 0) {
        tasks.push({ key: `r-${q.assignment.id}`, rank: 0, Icon: IconClipboard, tone: "attention",
          title: t(`Review ${q.toReview} submission${q.toReview > 1 ? "s" : ""}`, `راجع ${q.toReview} تسليم`),
          meta: `${name} · ${c.title}`, go: { screen: SCREENS.ASSIGNMENT_REVIEW, courseId: c.id, assignmentId: q.assignment.id, tab: "assignments" } });
      }
      if (q.readyToApprove > 0) {
        tasks.push({ key: `a-${q.assignment.id}`, rank: 1, Icon: IconCheck, tone: "good",
          title: t(`Approve ${q.readyToApprove} graded submission${q.readyToApprove > 1 ? "s" : ""}`, `اعتمد ${q.readyToApprove} تسليم متصحّح`),
          meta: t(`${name} · ${c.title} · the suggested grades look reliable`, `${name} · ${c.title} · الدرجات المقترحة موثوقة`),
          go: { screen: SCREENS.ASSIGNMENT_REVIEW, courseId: c.id, assignmentId: q.assignment.id, tab: "assignments" } });
      }
    }
    for (const d of c.drafts) {
      tasks.push({ key: `d-${d.id}`, rank: 2, Icon: IconPencil, tone: "primary",
        title: t(`Finish and publish “${d.title?.en ?? ""}”`, `كمّل وانشر «${d.title?.en ?? ""}»`),
        meta: t(`${c.title} · students can't see it yet`, `${c.title} · الطلاب مش شايفينه لسه`),
        go: { screen: SCREENS.ASSIGNMENT_CREATE, courseId: c.id, assignmentId: d.id, tab: "assignments" } });
    }
    if (c.materialsTotal === 0) {
      tasks.push({ key: `m-${c.id}`, rank: 3, Icon: IconUpload, tone: "primary",
        title: t(`Upload the first materials for ${c.title}`, `ارفع أول مواد لمقرر ${c.title}`),
        meta: t("The AI tutor and study tools answer from these files", "المعلم الذكي وأدوات المذاكرة بيجاوبوا من الملفات دي"),
        go: { screen: SCREENS.COURSE_WORKSPACE, courseId: c.id, tab: "materials" } });
    } else if (c.materialsTotal > c.materialsReady) {
      const n = c.materialsTotal - c.materialsReady;
      tasks.push({ key: `p-${c.id}`, rank: 4, Icon: IconClock, tone: "primary",
        title: t(`${n} file${n > 1 ? "s are" : " is"} still being prepared`, `${n} ملف لسه بيتجهّز`),
        meta: c.title, go: { screen: SCREENS.COURSE_WORKSPACE, courseId: c.id, tab: "materials" } });
    }
    if (c.topicsWithoutQuestions.length > 0) {
      const n = c.topicsWithoutQuestions.length;
      tasks.push({ key: `g-${c.id}`, rank: 5, Icon: IconWarning, tone: "attention",
        title: t(`${n} topic${n > 1 ? "s have" : " has"} no assignment questions yet`, `${n} موضوع مالوش أسئلة تكليفات لسه`),
        meta: `${c.title} · ${c.topicsWithoutQuestions.slice(0, 3).map((x) => x.title).join("، ")}`,
        go: { screen: SCREENS.COURSE_WORKSPACE, courseId: c.id, tab: "assignments" } });
    }
  }
  return tasks.sort((a, b) => a.rank - b.rank);
}

function RealInstructorDashboard({ state, dispatch }) {
  const mobile = useMediaQuery("(max-width: 860px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const { data, loading, error, reload } = useInstructorOverview();
  const [showAll, setShowAll] = useState(false);
  const [picking, setPicking] = useState(null);
  const go = (target) => dispatch({ type: "NAVIGATE", ...target });

  const firstName = (state.user?.name?.[lang] || state.user?.name?.en || "").split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? t("Good morning", "صباح الخير") : t("Good evening", "مساء الخير");
  const courses = data?.courses ?? [];
  const tasks = buildTasks(courses, t);
  const shown = showAll ? tasks : tasks.slice(0, 6);
  const totals = {
    toReview: courses.reduce((s, c) => s + c.toReview, 0),
    ready: courses.reduce((s, c) => s + c.readyToApprove, 0),
    open: courses.reduce((s, c) => s + c.openCount, 0),
    students: courses.reduce((s, c) => s + c.students, 0),
  };
  const firstWith = (key) => courses.find((c) => c[key] > 0);

  // Quick actions that need a course: go straight there when there is only one.
  const actionTargets = {
    assignment: (c) => ({ screen: SCREENS.ASSIGNMENT_CREATE, courseId: c.id, assignmentId: undefined, tab: "assignments" }),
    upload: (c) => ({ screen: SCREENS.COURSE_WORKSPACE, courseId: c.id, tab: "materials" }),
  };
  const runAction = (kind) => {
    if (courses.length === 1) go(actionTargets[kind](courses[0]));
    else setPicking((p) => (p === kind ? null : kind));
  };

  const quick = [
    { id: "assignment", Icon: IconPlus, label: t("New assignment", "تكليف جديد"), hint: t("Write questions, the AI suggests grades", "اكتب الأسئلة والذكاء الاصطناعي يقترح الدرجات"), onClick: () => runAction("assignment") },
    { id: "upload", Icon: IconUpload, label: t("Upload materials", "ارفع مواد"), hint: t("Lectures and notes students learn from", "المحاضرات والملاحظات اللي الطلاب بيذاكروا منها"), onClick: () => runAction("upload") },
    { id: "content", Icon: IconSparkle, label: t("Create teaching content", "اعمل محتوى تعليمي"), hint: t("Summaries, quizzes and slides from your files", "ملخصات واختبارات وشرائح من ملفاتك"), onClick: () => go({ screen: SCREENS.CONTENT_STUDIO }) },
    { id: "students", Icon: IconUsers, label: t("See my students", "شوف طلابي"), hint: t("Progress and results per student", "التقدم والنتائج لكل طالب"), onClick: () => go({ screen: SCREENS.INSTRUCTOR_STUDENTS }) },
  ];

  return (
    <InstructorPage tokens={tokens} lang={lang} mobile={mobile}
      title={`${greet}${firstName ? `, ${firstName}` : ""}`}
      subtitle={t("Here is what needs you today.", "ده اللي محتاجك النهارده.")}>
      {loading ? (
        <LoadingBlock tokens={tokens} label={t("Loading your courses…", "بنحمّل مقرراتك…")} />
      ) : error ? (
        <ErrorBlock tokens={tokens} lang={lang} onRetry={reload} />
      ) : courses.length === 0 ? (
        <EmptyBlock tokens={tokens} Icon={IconCourses} title={t("No courses yet", "مفيش مقررات لسه")}
          body={data?.canCreateCourse ? t("Create your first course to start adding materials and assignments.", "اعمل أول مقرر عشان تبدأ تضيف مواد وتكليفات.") : t("Your institution will add you to your courses. They will appear here.", "المؤسسة هتضيفك لمقرراتك وهتظهر هنا.")}
          action={data?.canCreateCourse && <PrimaryButton tokens={tokens} onClick={() => go({ screen: SCREENS.INSTRUCTOR_COURSES, create: true })}>{t("Create a course", "اعمل مقرر")}</PrimaryButton>} />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12 }}>
            <StatTile tokens={tokens} Icon={IconClipboard} label={t("To review", "محتاج مراجعة")} value={totals.toReview} tone={totals.toReview ? "attention" : undefined}
              hint={t("submissions waiting for you", "تسليمات مستنياك")}
              onClick={firstWith("toReview") ? () => { const c = firstWith("toReview"); const q = c.queues.find((x) => x.toReview > 0); go({ screen: SCREENS.ASSIGNMENT_REVIEW, courseId: c.id, assignmentId: q.assignment.id, tab: "assignments" }); } : undefined} />
            <StatTile tokens={tokens} Icon={IconCheck} label={t("Ready to approve", "جاهز للاعتماد")} value={totals.ready} tone={totals.ready ? "good" : undefined}
              hint={t("graded, just confirm", "متصحّح، أكّد بس")}
              onClick={firstWith("readyToApprove") ? () => { const c = firstWith("readyToApprove"); const q = c.queues.find((x) => x.readyToApprove > 0); go({ screen: SCREENS.ASSIGNMENT_REVIEW, courseId: c.id, assignmentId: q.assignment.id, tab: "assignments" }); } : undefined} />
            <StatTile tokens={tokens} Icon={IconPencil} label={t("Open assignments", "تكليفات مفتوحة")} value={totals.open} hint={t("accepting answers now", "بتستقبل إجابات دلوقتي")} onClick={() => go({ screen: SCREENS.INSTRUCTOR_COURSES })} />
            <StatTile tokens={tokens} Icon={IconUsers} label={t("Students", "الطلاب")} value={totals.students} hint={t(`across ${courses.length} course${courses.length > 1 ? "s" : ""}`, `في ${courses.length} مقرر`)} onClick={() => go({ screen: SCREENS.INSTRUCTOR_STUDENTS })} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "minmax(0, 1.6fr) minmax(0, 1fr)", gap: 20, alignItems: "start" }}>
            <div>
              <SectionTitle tokens={tokens}>{t("To do", "المطلوب منك")}</SectionTitle>
              <Card tokens={tokens} padding={0} style={{ overflow: "hidden" }}>
                {tasks.length === 0 ? (
                  <div style={{ padding: "32px 24px", textAlign: "center" }}>
                    <div style={{ fontSize: 15.5, fontWeight: 650, color: tokens.textPrimary }}>{t("You're all caught up", "مفيش حاجة متأخرة")}</div>
                    <div style={{ fontSize: 13.5, color: tokens.textMuted, marginTop: 4 }}>{t("New submissions and anything that needs you will show up here.", "أي تسليمات جديدة أو حاجة محتاجاك هتظهر هنا.")}</div>
                  </div>
                ) : (
                  shown.map((task, i) => <Row key={task.key} tokens={tokens} lang={lang} first={i === 0} Icon={task.Icon} iconTone={task.tone} title={task.title} meta={task.meta} onClick={() => go(task.go)} />)
                )}
                {tasks.length > 6 && (
                  <button type="button" onClick={() => setShowAll((v) => !v)} style={{ width: "100%", padding: "12px", background: "none", border: "none", borderTop: `1px solid ${tokens.cardBorder}`, color: tokens.primary, fontWeight: 600, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit" }}>
                    {showAll ? t("Show less", "اعرض أقل") : t(`Show all ${tasks.length}`, `اعرض الكل (${tasks.length})`)}
                  </button>
                )}
              </Card>
            </div>

            <div>
              <SectionTitle tokens={tokens}>{t("Quick actions", "اختصارات")}</SectionTitle>
              <Card tokens={tokens} padding={0} style={{ overflow: "hidden" }}>
                {quick.map((a, i) => (
                  <div key={a.id}>
                    <Row tokens={tokens} lang={lang} first={i === 0} Icon={a.Icon} title={a.label} meta={a.hint} onClick={a.onClick} />
                    {picking === a.id && (
                      <div style={{ padding: "4px 18px 14px 68px", display: "flex", flexWrap: "wrap", gap: 8 }}>
                        <span style={{ width: "100%", fontSize: 12.5, color: tokens.textMuted, marginBottom: 2 }}>{t("Which course?", "أنهي مقرر؟")}</span>
                        {courses.map((c) => (
                          <button key={c.id} type="button" onClick={() => go(actionTargets[a.id](c))}
                            style={{ padding: "6px 12px", borderRadius: 999, border: `1px solid ${tokens.cardBorder}`, background: tokens.card, color: tokens.textPrimary, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                            {c.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </Card>
            </div>
          </div>

          <SectionTitle tokens={tokens} action={<button type="button" onClick={() => go({ screen: SCREENS.INSTRUCTOR_COURSES })} style={{ background: "none", border: "none", color: tokens.primary, fontWeight: 600, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit" }}>{t("All courses", "كل المقررات")}</button>}>
            {t("Your courses", "مقرراتك")}
          </SectionTitle>
          <Card tokens={tokens} padding={0} style={{ overflow: "hidden" }}>
            {courses.map((c, i) => (
              <Row key={c.id} tokens={tokens} lang={lang} first={i === 0} Icon={IconCourses}
                title={<span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>{c.title}<CodeBadge tokens={tokens}>{c.code}</CodeBadge></span>}
                meta={t(`${c.students} students · ${c.openCount} open assignments · ${c.materialsReady} files ready`, `${c.students} طالب · ${c.openCount} تكليف مفتوح · ${c.materialsReady} ملف جاهز`)}
                trailing={c.toReview > 0 ? <Pill tokens={tokens} tone="attention">{c.toReview} {t("to review", "للمراجعة")}</Pill> : c.readyToApprove > 0 ? <Pill tokens={tokens} tone="good">{c.readyToApprove} {t("to approve", "للاعتماد")}</Pill> : null}
                onClick={() => go({ screen: SCREENS.COURSE_WORKSPACE, courseId: c.id, tab: "assignments" })} />
            ))}
          </Card>
        </>
      )}
    </InstructorPage>
  );
}

export default function InstructorDashboardPage(props) {
  if (demoMode()) return <InstructorHomePage {...props} />;
  return <RealInstructorDashboard {...props} />;
}
