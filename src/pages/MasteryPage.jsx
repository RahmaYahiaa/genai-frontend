import { demoMode } from "@/services/auth";
import { useCallback, useState } from "react";
import { listCourses } from "@/services/courses";
import { getLearnerModel } from "@/services/learning";
import { CourseSelect } from "@/components/SessionSolver";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { fetchMastery } from "@/services/api";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { masteryLevel } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { Card, Chip, Stat, AsyncGate, Btn } from "@/components/ui";
import MasteryBar, { MasteryLabel } from "@/components/MasteryBar";

const LEGEND = ["no-evidence", "beginner", "intermediate", "advanced", "mastered"];

function DemoMasteryPage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const mobile = useMediaQuery("(max-width: 760px)");
  const { data, loading, error, reload } = useAsync(fetchMastery);

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 1080, margin: "0 auto", fontFamily: bodyFont(lang) }}>
      <h1 style={{ margin: "0 0 4px", fontSize: mobile ? 19 : 22, fontWeight: 700, letterSpacing: "-0.02em", color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
        {t("Topics & Mastery", "المواضيع والإتقان")}
      </h1>
      <p style={{ margin: "0 0 20px", fontSize: 12.5, color: tokens.textMuted }}>
        {t("Every level is backed by evidence — no guesses.", "كل مستوى مدعوم بأدلة — لا تخمين.")}
      </p>
      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Loading mastery map…", "جاري تحميل خريطة الإتقان…")}>
        {data && <MasteryInner courses={data} tokens={tokens} lang={lang} t={t} dispatch={dispatch} />}
      </AsyncGate>
    </div>
  );
}

function MasteryInner({ courses, tokens, lang, t, dispatch }) {
  const mobile = useMediaQuery("(max-width: 760px)");
  const course = courses[0];
  const withEvidence = course.topics.filter((x) => x.evidence > 0);
  const totalEvidence = course.topics.reduce((s, x) => s + x.evidence, 0);
  const focus = [...withEvidence].sort((a, b) => a.pct - b.pct)[0];

  return (
    <>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        {LEGEND.map((lvl) => (
          <MasteryLabel key={lvl} level={lvl} lang={lang} tokens={tokens} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: 12, marginBottom: 14 }}>
        <Stat tokens={tokens} label={t("Course mastery", "إتقان المقرر")} value={`${course.overall}%`} accent={tokens.mastered} />
        <Stat tokens={tokens} label={t("Evidence items", "عناصر الأدلة")} value={totalEvidence} hint={t(`${withEvidence.length}/${course.topics.length} topics`, `${withEvidence.length}/${course.topics.length} مواضيع`)} />
        <Stat tokens={tokens} label={t("Next focus", "التركيز التالي")} value={focus ? focus.label[lang] : t("—", "—")} accent={tokens.gap} />
      </div>

      <Card tokens={tokens}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: tokens.textPrimary }}>
            {course.id} · {course.title[lang]}
          </div>
          <Chip tokens={tokens} tone="primary">{course.topics.length} {t("topics", "مواضيع")}</Chip>
        </div>
        {course.topics.map((topic) => {
          const level = masteryLevel(topic.pct, topic.evidence > 0);
          const isFocus = focus?.id === topic.id;
          return (
            <div key={topic.id} style={{ padding: "12px 0", borderBottom: `1px solid ${tokens.cardBorder}`, ...(topic.id === course.topics[course.topics.length - 1].id ? { borderBottom: "none" } : {}) }}>
              {mobile ? (
                <>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: tokens.textPrimary }}>{topic.label[lang]}</span>
                        {isFocus && <Chip tokens={tokens} tone="gap">{t("Focus", "تركيز")}</Chip>}
                      </div>
                      <div style={{ fontSize: 11, color: tokens.textFaint, marginTop: 2 }}>
                        {topic.evidence > 0 ? `${topic.evidence} ${t("evidence items", "عناصر أدلة")}` : t("No evidence yet", "لا توجد أدلة بعد")}
                      </div>
                    </div>
                    <MasteryLabel level={level} lang={lang} tokens={tokens} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: topic.evidence > 0 ? tokens.textPrimary : tokens.textFaint, fontFamily: "'JetBrains Mono', monospace" }}>
                      {topic.evidence > 0 ? `${topic.pct}%` : "—"}
                    </span>
                    <Btn tokens={tokens} variant="soft" onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.PRACTICE })}>
                      {t("Train", "تدرّب")}
                    </Btn>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: tokens.textPrimary }}>{topic.label[lang]}</span>
                      {isFocus && <Chip tokens={tokens} tone="gap">{t("Focus", "تركيز")}</Chip>}
                    </div>
                    <div style={{ fontSize: 11, color: tokens.textFaint, marginTop: 2 }}>
                      {topic.evidence > 0 ? `${topic.evidence} ${t("evidence items", "عناصر أدلة")}` : t("No evidence yet", "لا توجد أدلة بعد")}
                    </div>
                  </div>
                  <MasteryLabel level={level} lang={lang} tokens={tokens} />
                  <span style={{ width: 56, textAlign: "right", fontSize: 13, fontWeight: 700, color: topic.evidence > 0 ? tokens.textPrimary : tokens.textFaint, fontFamily: "'JetBrains Mono', monospace" }}>
                    {topic.evidence > 0 ? `${topic.pct}%` : "—"}
                  </span>
                  <Btn tokens={tokens} variant="soft" onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.PRACTICE })}>
                    {t("Train", "تدرّب")}
                  </Btn>
                </div>
              )}
              <div style={{ marginTop: mobile ? 12 : 8 }}>
                <MasteryBar pct={topic.pct} evidence={topic.evidence} tokens={tokens} height={7} />
              </div>
            </div>
          );
        })}
      </Card>
    </>
  );
}
const pctOf = (value) => (value == null ? 0 : value <= 1 ? Math.round(value * 100) : Math.round(value));

function RealMasteryPage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const mobile = useMediaQuery("(max-width: 760px)");
  const [courseId, setCourseId] = useState("");
  const loadCourses = useCallback(() => listCourses(), []);
  const coursesAsync = useAsync(loadCourses);
  const courses = coursesAsync.data?.items ?? [];
  const effectiveCourseId = courseId || courses[0]?.id || null;
  const loadModel = useCallback(
    () => (effectiveCourseId ? getLearnerModel(effectiveCourseId).catch(() => null) : Promise.resolve(null)),
    [effectiveCourseId],
  );
  const modelAsync = useAsync(loadModel);
  const selected = courses.find((course) => course.id === effectiveCourseId) ?? null;
  const mastery = modelAsync.data?.mastery ?? [];
  const overview = modelAsync.data?.overview ?? null;
  const mapped = selected
    ? [
        {
          id: selected.code ?? selected.title?.en ?? selected.id,
          title: { en: selected.title?.en ?? selected.title ?? "", ar: selected.title?.ar ?? selected.title ?? "" },
          overall: pctOf(overview?.overallAverageScore),
          topics: mastery.map((row) => ({
            id: row.topicId,
            label: { en: row.title ?? "", ar: row.title ?? "" },
            pct: pctOf(row.averageScore),
            evidence: row.evidenceCount ?? 0,
          })),
        },
      ]
    : [];

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 1080, margin: "0 auto", fontFamily: bodyFont(lang), direction: lang === "ar" ? "rtl" : "ltr" }}>
      <h1 style={{ margin: "0 0 4px", fontSize: mobile ? 19 : 22, fontWeight: 700, letterSpacing: "-0.02em", color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
        {t("Topics & Mastery", "المواضيع والإتقان")}
      </h1>
      <p style={{ margin: "0 0 20px", fontSize: 12.5, color: tokens.textMuted }}>
        {t("Every level is backed by evidence — no guesses.", "كل مستوى مدعوم بأدلة — لا تخمين.")}
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <CourseSelect courses={courses} value={effectiveCourseId ?? ""} onChange={setCourseId} tokens={tokens} lang={lang} placeholder={t("Choose course…", "اختار مقرر…")} />
      </div>
      <AsyncGate
        tokens={tokens}
        lang={lang}
        loading={coursesAsync.loading || modelAsync.loading}
        error={coursesAsync.error ?? modelAsync.error}
        reload={() => {
          coursesAsync.reload();
          modelAsync.reload();
        }}
        label={t("Loading mastery map…", "جاري تحميل خريطة الإتقان…")}
      >
        {mapped.length === 0 ? (
          <Card tokens={tokens} style={{ padding: "16px 18px" }}>
            <p style={{ fontFamily: bodyFont(lang), fontSize: 12.5, color: tokens.textMuted, margin: 0, lineHeight: 1.7 }}>
              {t("No institutional courses yet — mastery appears once you are enrolled.", "لسه مفيش مقررات مؤسسية — الإتقان بيظهر أول ما تتقيد.")}
            </p>
          </Card>
        ) : (
          <MasteryInner courses={mapped} tokens={tokens} lang={lang} t={t} dispatch={dispatch} />
        )}
      </AsyncGate>
    </div>
  );
}

export default function MasteryPage(props) {
  if (demoMode()) return <DemoMasteryPage {...props} />;
  return <RealMasteryPage {...props} />;
}
