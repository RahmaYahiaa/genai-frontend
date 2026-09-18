import { demoMode } from "@/services/auth";
import { useCallback } from "react";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { fetchDashboard } from "@/services/api";
import { listCourses } from "@/services/courses";
import { listAssignmentsForCourse } from "@/services/assignments";
import { getLearnerModel } from "@/services/learning";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { TASK_KIND_LABELS } from "@/data/student";
import { Card, Btn, Chip, Bar, Stat, AsyncGate } from "@/components/ui";
import MasteryBar from "@/components/MasteryBar";

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
            {t("Here's your evidence-based learning snapshot.", "دي خلاصة تعلّمك القائمة على الأدلة.")}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Chip tokens={tokens} tone="primary">{course.id}</Chip>
          {course.week != null && <Chip tokens={tokens}>{t(`Week ${course.week}`, `الأسبوع ${course.week}`)}</Chip>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
        <Stat tokens={tokens} label={t("Avg mastery", "متوسط الإتقان")} value={`${stats.avgMastery}%`} accent={tokens.mastered} />
        <Stat tokens={tokens} label={t("Evidence items", "عناصر الأدلة")} value={stats.evidenceItems} hint={t(`${stats.topicsCovered}/${stats.topicsTotal} topics covered`, `${stats.topicsCovered}/${stats.topicsTotal} موضوعاً مغطى`)} />
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
              {weakest ? `${t("Weakest right now", "أضعف نقطة حالياً")}: ${weakest.label[lang]} (${weakest.pct}%)` : t("All topics have evidence", "كل المواضيع عندها أدلة")}
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
                : t("Session minutes are not tracked by the backend yet.", "دقائق الجلسات مش متسجلة في الباك إند لسه.")}
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

function RealDashboardPage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const mobile = useMediaQuery("(max-width: 760px)");

  const load = useCallback(async () => {
    const { items } = await listCourses();
    const enrolled = items ?? [];
    let modelCourse = null;
    let model = null;
    for (const course of enrolled) {
      try {
        const candidate = await getLearnerModel(course.id);
        if (!model || (candidate?.mastery ?? []).some((row) => row.evidenceCount > 0)) {
          modelCourse = course;
          model = candidate;
        }
        if ((candidate?.mastery ?? []).some((row) => row.evidenceCount > 0)) break;
      } catch {
        modelCourse = modelCourse ?? course;
      }
    }
    const mastery = model?.mastery ?? [];
    const overview = model?.overview ?? null;
    const topics = mastery.map((row) => ({
      id: row.topicId,
      label: { en: row.title ?? "", ar: row.title ?? "" },
      pct: pctOf(row.averageScore),
      evidence: row.evidenceCount ?? 0,
    }));
    const withEvidence = topics.filter((topic) => topic.evidence > 0);
    const stats = {
      avgMastery: overview?.overallAverageScore != null
        ? pctOf(overview.overallAverageScore)
        : withEvidence.length
          ? Math.round(withEvidence.reduce((sum, topic) => sum + topic.pct, 0) / withEvidence.length)
          : 0,
      evidenceItems: overview?.evidenceCount ?? topics.reduce((sum, topic) => sum + topic.evidence, 0),
      topicsCovered: overview?.assessedTopicsCount ?? withEvidence.length,
      topicsTotal: overview?.topicsCount ?? topics.length,
      streakDays: null,
      studyMinutes: null,
      goalMinutes: null,
    };
    const taskRows = await Promise.all(
      enrolled.slice(0, 6).map(async (course) => {
        try {
          const { items: assignments } = await listAssignmentsForCourse(course.id, {});
          return assignments
            .filter((assignment) => assignment.status === "OPEN")
            .map((assignment) => ({
              id: `${course.id}-${assignment.id}`,
              kind: "assignment",
              label: { en: assignment.title?.en ?? "", ar: assignment.title?.ar ?? "" },
              course: course.code ?? course.id,
              due: { en: "open now", ar: "مفتوح الآن" },
            }));
        } catch {
          return [];
        }
      }),
    );
    return {
      user: state.user ?? { name: { en: "learner", ar: "متعلم" } },
      stats,
      courses: [
        {
          id: modelCourse?.code ?? modelCourse?.title?.en ?? modelCourse?.id ?? "—",
          week: null,
          overall: stats.avgMastery,
          topics,
        },
      ],
      tasks: taskRows.flat().slice(0, 5),
    };
  }, [state.user]);
  const { data, loading, error, reload } = useAsync(load);

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 1080, margin: "0 auto", fontFamily: bodyFont(lang), direction: lang === "ar" ? "rtl" : "ltr" }}>
      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Loading your dashboard…", "جاري تحميل لوحتك…")}>
        {data && <DashboardInner data={data} tokens={tokens} lang={lang} t={t} dispatch={dispatch} />}
      </AsyncGate>
    </div>
  );
}

export default function DashboardPage(props) {
  if (demoMode()) return <DemoDashboardPage {...props} />;
  return <RealDashboardPage {...props} />;
}
