import { demoMode } from "@/services/auth";
import { useCallback } from "react";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { fetchDashboard } from "@/services/api";
import { listCourses } from "@/services/courses";
import { listAssignmentsForCourse } from "@/services/assignments";
import { getLearnerModel, getMyLearning } from "@/services/learning";
import { Panel, PrimaryButton, TextButton } from "@/components/study/StudyKit";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { TASK_KIND_LABELS } from "@/data/student";
import { Card, Btn, Chip, Bar, Stat, AsyncGate } from "@/components/ui";
import MasteryBar from "@/components/MasteryBar";
import LinkInvitationBanner from "@/components/LinkInvitationBanner";
import { IconTutor, IconSparkle, IconPractice, IconMastery, IconCheck } from "@/components/Icons";

const TASK_TONE = { diagnostic: "primary", practice: "default", reassessment: "mastered", assignment: "primary" };

function DemoDashboardPage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const mobile = useMediaQuery("(max-width: 760px)");
  const { data, loading, error, reload } = useAsync(fetchDashboard);

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 1080, margin: "0 auto", fontFamily: bodyFont(lang) }}>
      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Loading your dashboard…", "جاري تحميل لوحتك…")}>
        {data && <DashboardInner data={data} tokens={tokens} lang={lang} t={t} dispatch={dispatch} />}
      </AsyncGate>
    </div>
  );
}

function DashboardInner({ data, tokens, lang, t, dispatch }) {
  const mobile = useMediaQuery("(max-width: 760px)");
  const { user, stats, courses, tasks } = data;
  const course = courses[0];
  const withEvidence = course.topics.filter((x) => x.evidence > 0);
  const weakest = [...withEvidence].sort((a, b) => a.pct - b.pct)[0];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: mobile ? 19 : 22, fontWeight: 700, letterSpacing: "-0.02em", color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
            {t("Welcome back", "أهلاً بعودتك")}, {lang === "ar" ? user.name.ar.split(" ")[0] : user.name.en.split(" ")[0]}
          </h1>
          <div style={{ fontSize: 12.5, color: tokens.textMuted, marginTop: 4 }}>
            {t("Here's an overview of your learning.", "دي خلاصة تعلّمك القائمة على الأدلة.")}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Chip tokens={tokens} tone="primary">{course.id}</Chip>
          {course.week != null && <Chip tokens={tokens}>{t(`Week ${course.week}`, `الأسبوع ${course.week}`)}</Chip>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
        <Stat tokens={tokens} label={t("Avg mastery", "متوسط الإتقان")} value={`${stats.avgMastery}%`} accent={tokens.mastered} />
        <Stat tokens={tokens} label={t("Answers checked", "عناصر الأدلة")} value={stats.evidenceItems} hint={t(`${stats.topicsCovered}/${stats.topicsTotal} topics covered`, `${stats.topicsCovered}/${stats.topicsTotal} موضوعاً مغطى`)} />
        <Stat tokens={tokens} label={t("Streak", "سلسلة الأيام")} value={stats.streakDays == null ? "—" : `${stats.streakDays} ${t("days", "أيام")}`} hint={stats.streakDays == null ? t("not tracked yet", "مش متتبعة لسه") : undefined} />
        <Stat tokens={tokens} label={t("Study time", "وقت الدراسة")} value={stats.studyMinutes == null ? "—" : `${stats.studyMinutes}m`} hint={stats.studyMinutes == null ? t("not tracked yet", "مش متتبع لسه") : t(`Goal ${stats.goalMinutes}m`, `الهدف ${stats.goalMinutes} د`)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1.7fr 1fr", gap: 14, marginBottom: 14, alignItems: "start" }}>
        <Card tokens={tokens}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: tokens.textPrimary }}>{t("Course mastery", "إتقان المقرر")}</div>
            <Chip tokens={tokens} tone="primary">{course.overall}%</Chip>
          </div>
          {course.topics.map((topic) => (
            <div key={topic.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5, gap: 8 }}>
                <span style={{ fontSize: 12.5, color: tokens.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {topic.label[lang]}
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: topic.evidence > 0 ? tokens.mastered : tokens.textFaint, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                  {topic.evidence > 0 ? `${topic.pct}%` : t("no data", "لا بيانات")}
                </span>
              </div>
              <MasteryBar pct={topic.pct} evidence={topic.evidence} tokens={tokens} />
            </div>
          ))}
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card tokens={tokens}>
            <div style={{ fontWeight: 700, fontSize: 14, color: tokens.textPrimary, marginBottom: 12 }}>{t("Up next", "التالي")}</div>
            {tasks.length === 0 && (
              <div style={{ fontSize: 12.5, color: tokens.textFaint }}>{t("Nothing open right now.", "مفيش حاجة مفتوحة دلوقتي.")}</div>
            )}
            {tasks.map((task) => (
              <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${tokens.cardBorder}`, ...(task.id === tasks[tasks.length - 1].id ? { borderBottom: "none" } : {}) }}>
                <Chip tokens={tokens} tone={TASK_TONE[task.kind] ?? "default"}>{TASK_KIND_LABELS[task.kind]?.[lang] ?? (lang === "ar" ? "تكليف" : "assignment")}</Chip>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: tokens.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.label[lang]}</div>
                  <div style={{ fontSize: 11, color: tokens.textFaint }}>{task.course} · {task.due[lang]}</div>
                </div>
              </div>
            ))}
          </Card>

          <Card tokens={tokens} style={{ background: tokens.primaryLight, borderColor: `${tokens.primary}33` }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: tokens.textPrimary, marginBottom: 4 }}>{t("Focus topic", "موضوع التركيز")}</div>
            <div style={{ fontSize: 12, color: tokens.textMuted, marginBottom: 12 }}>
              {weakest ? `${t("Weakest right now", "أضعف نقطة حالياً")}: ${weakest.label[lang]} (${weakest.pct}%)` : t("Every topic has been checked", "كل المواضيع عندها أدلة")}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Btn tokens={tokens} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.TUTOR })}>{t("Ask AI Tutor", "اسأل المعلّم الذكي")}</Btn>
              <Btn tokens={tokens} variant="soft" onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.PRACTICE })}>{t("Practice", "تدرّب")}</Btn>
            </div>
          </Card>
        </div>
      </div>

      <Card tokens={tokens}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: tokens.textPrimary }}>{t("Study goal", "هدف الدراسة")}</div>
            <div style={{ fontSize: 12, color: tokens.textMuted, marginTop: 2 }}>
              {stats.goalMinutes
                ? t(`${stats.studyMinutes} of ${stats.goalMinutes} minutes this week`, `${stats.studyMinutes} من ${stats.goalMinutes} دقيقة هذا الأسبوع`)
                : t("", "دقائق الجلسات مش متسجلة في الباك إند لسه.")}
            </div>
          </div>
          <div style={{ width: mobile ? "100%" : 220 }}>
            {stats.goalMinutes ? (
              <Bar tokens={tokens} value={(stats.studyMinutes / stats.goalMinutes) * 100} color={tokens.primary} height={8} />
            ) : (
              <Bar tokens={tokens} value={0} color={tokens.primary} height={8} />
            )}
          </div>
        </div>
      </Card>
    </>
  );
}
const pctOf = (value) => (value == null ? 0 : value <= 1 ? Math.round(value * 100) : Math.round(value));

// AI learning engine next_action → the existing screen where the student can act on it.
const ACTION_SCREEN = {
  build_foundation: SCREENS.TUTOR,
  fill_prerequisites: SCREENS.TUTOR,
  resolve_misconceptions: SCREENS.TUTOR,
  reinforce: SCREENS.PRACTICE,
  progress: SCREENS.PRACTICE,
};
const ACTION_LABELS = {
  build_foundation: { en: "Build the foundations first", ar: "ابنِ الأساسات أولًا" },
  reinforce: { en: "Reinforce weak concepts", ar: "عزّز المفاهيم الضعيفة" },
  resolve_misconceptions: { en: "Resolve misconceptions", ar: "صحّح المفاهيم الخاطئة" },
  fill_prerequisites: { en: "Fill prerequisite gaps", ar: "سدّ الفجوات التأسيسية" },
  progress: { en: "Keep progressing", ar: "واصل التقدّم" },
};
const SCREEN_CTA = {
  [SCREENS.TUTOR]: { en: "Learn with the AI Tutor", ar: "اتعلّم مع المعلم الذكي" },
  [SCREENS.PRACTICE]: { en: "Start practice", ar: "ابدأ التدريب" },
  [SCREENS.DIAGNOSTIC]: { en: "Check my level", ar: "اعرف مستواك" },
  [SCREENS.BROWSE_COURSES]: { en: "Find courses", ar: "ابحث عن مقررات" },
  [SCREENS.COURSES]: { en: "Go to My Courses", ar: "روح لمقرراتي" },
};


function RealDashboardPage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const mobile = useMediaQuery("(max-width: 760px)");
  const institutional = state.user?.accountType !== "individual";

  const load = useCallback(async () => {
    const { items } = await listCourses();
    const courses = items ?? [];
    const [models, learning, assignmentRows] = await Promise.all([
      Promise.all(courses.slice(0, 8).map((course) => getLearnerModel(course.id).catch(() => null))),
      // AI engine can be unavailable — the dashboard degrades to evidence-based guidance.
      getMyLearning().catch(() => null),
      institutional
        ? Promise.all(
            courses.slice(0, 8).map(async (course) => {
              try {
                const { items: assignments } = await listAssignmentsForCourse(course.id, {});
                return assignments.filter((a) => a.status === "OPEN").map((a) => ({ ...a, course }));
              } catch {
                return [];
              }
            }),
          )
        : Promise.resolve([]),
    ]);
    const courseRows = courses.map((course, index) => {
      const mastery = models[index]?.mastery ?? [];
      const overview = models[index]?.overview ?? null;
      const withEvidence = mastery.filter((row) => (row.evidenceCount ?? 0) > 0);
      const weakest = [...withEvidence].sort((a, b) => pctOf(a.averageScore) - pctOf(b.averageScore))[0] ?? null;
      return {
        course,
        modelLoaded: Boolean(models[index]),
        evidence: overview?.evidenceCount ?? withEvidence.reduce((sum, row) => sum + (row.evidenceCount ?? 0), 0),
        assessed: overview?.assessedTopicsCount ?? withEvidence.length,
        total: overview?.topicsCount ?? mastery.length,
        avg: withEvidence.length === 0 ? null : overview?.overallAverageScore != null
          ? pctOf(overview.overallAverageScore)
          : withEvidence.length
            ? Math.round(withEvidence.reduce((sum, row) => sum + pctOf(row.averageScore), 0) / withEvidence.length)
            : null,
        weakest: weakest ? { title: weakest.title, pct: pctOf(weakest.averageScore) } : null,
      };
    });
    return { courseRows, learning, assignments: assignmentRows.flat() };
  }, [institutional]);
  const { data, loading, error, reload } = useAsync(load);
  const firstName = (state.user?.name?.[lang] || state.user?.email || "").split(" ")[0];

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 1080, margin: "0 auto", fontFamily: bodyFont(lang), direction: lang === "ar" ? "rtl" : "ltr" }}>
      <LinkInvitationBanner state={state} />
      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Loading your home…", "جاري تحميل الرئيسية…")}>
        {data && <HomeInner data={data} tokens={tokens} lang={lang} t={t} dispatch={dispatch} mobile={mobile} institutional={institutional} firstName={firstName} />}
      </AsyncGate>
    </div>
  );
}

function pickNextStep({ courseRows, learning }, institutional) {
  if (courseRows.length === 0) {
    return institutional
      ? { screen: SCREENS.BROWSE_COURSES, title: { en: "Enroll in your first course", ar: "اشترك في أول مقرر" }, reason: { en: "The tutor, practice and your progress all work inside a course. Find your university's courses to begin.", ar: "المعلم والتدريب وتقدّمك كلهم بيشتغلوا جوه مقرر. دوّر على مقررات جامعتك عشان تبدأ." } }
      : { screen: SCREENS.COURSES, title: { en: "Create your first course", ar: "اعمل أول مقرر ليك" }, reason: { en: "Create a course and upload your notes. The tutor and practice questions will be based on them.", ar: "اعمل مقرر دراسة ذاتية وارفع موادك — المعلم الذكي والتدريب هيستخدموها." } };
  }
  const hasMastery = Object.keys(learning?.profile?.concept_mastery ?? {}).length > 0;
  const next = hasMastery ? learning?.next_action : null;
  if (next?.action) {
    const screen = ACTION_SCREEN[next.action] ?? SCREENS.PRACTICE;
    return {
      screen,
      ai: true,
      priority: next.priority,
      title: ACTION_LABELS[next.action] ?? { en: next.action, ar: next.action },
      reasonText: next.reason ?? null,
      concepts: next.target_concepts ?? [],
    };
  }
  const noEvidence = courseRows.find((row) => row.evidence === 0);
  if (noEvidence) {
    return { screen: SCREENS.DIAGNOSTIC, courseId: noEvidence.course.id, title: { en: `Check your level in ${noEvidence.course.title.en}`, ar: `اعرف مستواك في ${noEvidence.course.title.ar}` }, reason: { en: "Take a short level check so we know where to start.", ar: "لسه مفيش أدلة على مستواك هنا. تشخيص قصير بيحدد نقطة البداية." } };
  }
  const weakestRow = [...courseRows].filter((row) => row.weakest).sort((a, b) => a.weakest.pct - b.weakest.pct)[0];
  if (weakestRow) {
    return { screen: SCREENS.PRACTICE, courseId: weakestRow.course.id, title: { en: `Practice ${weakestRow.weakest.title}`, ar: `تدرّب على ${weakestRow.weakest.title}` }, reason: { en: `Your weakest topic right now (${weakestRow.weakest.pct}%).`, ar: `أضعف موضوع عندك دلوقتي (${weakestRow.weakest.pct}%).` } };
  }
  return { screen: SCREENS.PRACTICE, title: { en: "Keep practicing", ar: "كمّل تدريب" }, reason: { en: "Practice keeps your progress up to date.", ar: "التدريب بيضيف أدلة ويحدّث إتقانك." } };
}

function HomeInner({ data, tokens, lang, t, dispatch, mobile, firstName, institutional }) {
  const { courseRows, learning, assignments } = data;
  const step = pickNextStep(data, institutional);
  const reviewDue = (learning?.review_queue ?? []).length;
  const go = (screen, extra = {}) => dispatch({ type: "NAVIGATE", screen, ...extra });
  const L = (obj) => obj?.[lang] ?? obj?.en ?? "";
  const hour = new Date().getHours();
  const greet = hour < 12 ? t("Good morning", "صباح الخير") : t("Good evening", "مساء الخير");
  const sectionTitle = { fontSize: 15, fontWeight: 650, color: tokens.textPrimary, margin: "32px 0 12px" };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <h1 style={{ margin: "8px 0 4px", fontSize: mobile ? 22 : 26, fontWeight: 700, letterSpacing: "-0.02em", color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
        {greet}{firstName ? `, ${firstName}` : ""}
      </h1>
      <p style={{ margin: "0 0 24px", fontSize: 14.5, color: tokens.textMuted }}>{t("Here's what to do next.", "دي خطوتك الجاية.")}</p>

      <Panel tokens={tokens} padding={mobile ? 20 : 28} style={{ borderInlineStart: `4px solid ${tokens.primary}` }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: tokens.primary, marginBottom: 8 }}>{t("Your next step", "خطوتك الجاية")}</div>
        <div style={{ fontSize: mobile ? 18 : 20, fontWeight: 650, color: tokens.textPrimary, marginBottom: 8, lineHeight: 1.4 }}>{L(step.title)}</div>
        <p style={{ margin: "0 0 18px", fontSize: 14, color: tokens.textMuted, lineHeight: 1.65 }}>
          {step.reasonText ?? L(step.reason)}
          {step.concepts?.length ? <><br /><span style={{ color: tokens.textPrimary }}>{t("Focus on: ", "ركّز على: ")}{step.concepts.join(lang === "ar" ? "، " : ", ")}</span></> : null}
        </p>
        <PrimaryButton tokens={tokens} onClick={() => go(step.screen, step.courseId ? { studyCourseId: step.courseId } : {})}>{L(SCREEN_CTA[step.screen]) || t("Continue", "كمّل")}</PrimaryButton>
        {reviewDue > 0 && (
          <div style={{ marginTop: 16, fontSize: 13.5, color: tokens.textMuted }}>
            {t(`You also have ${reviewDue} topics to review. `, `وعندك كمان ${reviewDue} مواضيع للمراجعة. `)}
            <TextButton tokens={tokens} onClick={() => go(SCREENS.MASTERY)}>{t("Review now", "راجع دلوقتي")}</TextButton>
          </div>
        )}
      </Panel>

      {assignments.length > 0 && (
        <>
          <h2 style={sectionTitle}>{t("Open assignments", "واجبات مفتوحة")}</h2>
          <Panel tokens={tokens} padding={0} style={{ overflow: "hidden" }}>
            {assignments.slice(0, 4).map((a, i) => (
              <button key={a.id} type="button" className="genai-row" onClick={() => go(SCREENS.ASSIGNMENTS)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, width: "100%", textAlign: "inherit", padding: "14px 20px", background: "none", border: "none", borderTop: i ? `1px solid ${tokens.cardBorder}` : "none", cursor: "pointer", fontFamily: "inherit" }}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: tokens.textPrimary }}>{L(a.title) || a.title}</span>
                  <span style={{ fontSize: 12.5, color: tokens.textMuted }}>{L(a.course.title)}</span>
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: tokens.primary, whiteSpace: "nowrap" }}>{t("Open", "افتح")}</span>
              </button>
            ))}
          </Panel>
        </>
      )}

      {courseRows.length > 0 && (
        <>
          <h2 style={sectionTitle}>{t("Your courses", "مقرراتك")}</h2>
          <Panel tokens={tokens} padding={0} style={{ overflow: "hidden" }}>
            {courseRows.map((row, i) => (
              <button key={row.course.id} type="button" className="genai-row" onClick={() => go(SCREENS.STUDENT_COURSE, { courseId: row.course.id })}
                style={{ display: "flex", alignItems: "center", gap: 16, width: "100%", textAlign: "inherit", padding: "14px 20px", background: "none", border: "none", borderTop: i ? `1px solid ${tokens.cardBorder}` : "none", cursor: "pointer", fontFamily: "inherit" }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: tokens.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{L(row.course.title)}</span>
                  <span style={{ fontSize: 12.5, color: tokens.textMuted }}>
                    {row.avg == null ? t("Level not checked yet", "لسه ماعملتش اختبار مستوى") : t(`${row.assessed} of ${row.total} topics checked`, `${row.assessed} من ${row.total} مواضيع اتقاست`)}
                  </span>
                </span>
                {row.avg != null && (
                  <span style={{ width: mobile ? 70 : 120, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ flex: 1, height: 6, borderRadius: 99, background: tokens.inset, overflow: "hidden" }}><span style={{ display: "block", width: `${row.avg}%`, height: "100%", background: tokens.primary }} /></span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: tokens.textSecondary }}>{row.avg}%</span>
                  </span>
                )}
              </button>
            ))}
          </Panel>
        </>
      )}
    </div>
  );
}

export default function DashboardPage(props) {
  if (demoMode()) return <DemoDashboardPage {...props} />;
  return <RealDashboardPage {...props} />;
}
