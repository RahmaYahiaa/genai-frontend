import { useCallback, useState } from "react";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import useStudyCourse from "@/hooks/useStudyCourse";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { listCourses } from "@/services/courses";
import { getAiPreferences } from "@/services/learning";
import { demoMode } from "@/services/auth";
import { AsyncGate, Btn, Chip } from "@/components/ui";
import { StudyHubContext } from "@/components/studyHubContext";
import TutorPage from "@/pages/TutorPage";
import MasteryPage from "@/pages/MasteryPage";
import StudentCoursePage from "@/pages/StudentCoursePage";
import StudyToolsPage from "@/pages/StudyToolsPage";
import { AiPreferencesCard } from "@/pages/ProfilePage";

/**
 * AI Tutor hub — one place for everything the AI does for the student,
 * modelled on the AI team's reference app: a single header (course + preferences)
 * and four tabs: Tutor · My Learning · Course Materials · Study Tools.
 * Each tab is the existing, backend-wired page; the hub only provides the shared
 * course context and hides the per-page course pickers.
 */
const TABS = [
  { screen: SCREENS.TUTOR, en: "Tutor", ar: "المعلم" },
  { screen: SCREENS.MASTERY, en: "My Learning", ar: "تعلّمي" },
  { screen: SCREENS.STUDY_MATERIALS, en: "Course Materials", ar: "مواد المقرر" },
  { screen: SCREENS.STUDY_TOOLS, en: "Study Tools", ar: "أدوات المذاكرة" },
];

const STYLE_LABELS = {
  step_by_step: { en: "Step-by-step", ar: "خطوة بخطوة" },
};

export default function StudyHubPage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const mobile = useMediaQuery("(max-width: 760px)");
  const isRtl = lang === "ar";
  const real = !demoMode();
  const [courseId, setCourseId] = useStudyCourse();
  const [prefsOpen, setPrefsOpen] = useState(false);
  const loadCourses = useCallback(() => listCourses(), []);
  const coursesAsync = useAsync(loadCourses);
  const loadPrefs = useCallback(() => (real ? getAiPreferences().catch(() => null) : Promise.resolve(null)), [real]);
  const prefsAsync = useAsync(loadPrefs);
  const courses = coursesAsync.data?.items ?? [];
  const effectiveId = courseId || courses[0]?.id || "";
  const course = courses.find((c) => c.id === effectiveId);
  const active = TABS.some((tab) => tab.screen === state.screen) ? state.screen : SCREENS.TUTOR;
  const pref = prefsAsync.data;
  const styleLabel = pref?.learningPreference ? STYLE_LABELS[pref.learningPreference]?.[lang] ?? String(pref.learningPreference).replace(/_/g, " ") : null;

  // Pages keep their own contracts; they just see the hub's course.
  const pageState = { ...state, courseId: effectiveId, studyCourseId: effectiveId };
  const Page = { [SCREENS.TUTOR]: TutorPage, [SCREENS.MASTERY]: MasteryPage, [SCREENS.STUDY_MATERIALS]: StudentCoursePage, [SCREENS.STUDY_TOOLS]: StudyToolsPage }[active];

  return (
    <div style={{ fontFamily: bodyFont(lang), direction: isRtl ? "rtl" : "ltr" }}>
      <div style={{ padding: mobile ? "18px 16px 0" : "26px 28px 0", maxWidth: 1080, margin: "0 auto" }}>
        <h1 style={{ margin: 0, fontSize: mobile ? 22 : 28, fontWeight: 800, color: tokens.textPrimary, fontFamily: headingFont(lang), letterSpacing: "-0.02em" }}>{t("AI Tutor", "المعلم الذكي")}</h1>
        <div style={{ fontSize: 13.5, color: tokens.textMuted, margin: "4px 0 12px" }}>
          {t("Personalized help grounded in your course materials and learning progress.", "مساعدة شخصية مبنية على مواد مقررك وتقدّمك في التعلّم.")}
        </div>

        <AsyncGate tokens={tokens} lang={lang} loading={coursesAsync.loading} error={coursesAsync.error} reload={coursesAsync.reload} label={t("Loading your courses…", "جاري تحميل مقرراتك…")}>
          {courses.length === 0 ? (
            <div style={{ background: tokens.card, border: `1px solid ${tokens.cardBorder}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: tokens.textPrimary, marginBottom: 4 }}>{t("Add a course first", "ضيف مقرر الأول")}</div>
              <div style={{ fontSize: 13, color: tokens.textMuted, marginBottom: 12 }}>{t("The tutor answers from a course's materials, so it needs a course to work in.", "المعلم بيجاوب من مواد المقرر، فمحتاج مقرر يشتغل فيه.")}</div>
              <Btn tokens={tokens} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.COURSES })}>{t("Go to My Courses", "روح لمقرراتي")}</Btn>
            </div>
          ) : (
            <>
              {/* Context chips — what the tutor is using right now */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
                {course && <Chip tokens={tokens} tone="primary">{course.title[lang]}</Chip>}
                {pref?.preferredLanguage && <Chip tokens={tokens}>{pref.preferredLanguage}</Chip>}
                {styleLabel && <Chip tokens={tokens}>{styleLabel}</Chip>}
              </div>

              {/* Collapsible: course + AI preferences */}
              <div style={{ background: tokens.card, border: `1px solid ${tokens.cardBorder}`, borderRadius: 12, marginBottom: 16 }}>
                <button type="button" onClick={() => setPrefsOpen((v) => !v)} aria-expanded={prefsOpen} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, color: tokens.textPrimary, textAlign: "inherit" }}>
                  <span style={{ display: "inline-block", transform: prefsOpen ? "rotate(90deg)" : isRtl ? "rotate(180deg)" : "none", transition: "transform .15s" }}>›</span>
                  {t("Course & preferences", "المقرر والتفضيلات")}
                </button>
                {prefsOpen && (
                  <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${tokens.cardBorder}` }}>
                    <label style={{ display: "block", fontSize: 12.5, color: tokens.textSecondary, margin: "12px 0 6px" }}>{t("Course", "المقرر")}</label>
                    <select value={effectiveId} onChange={(e) => setCourseId(e.target.value)} className="genai-input" style={{ width: "100%", maxWidth: 360, padding: "10px 12px", borderRadius: 10, border: `1px solid ${tokens.cardBorder}`, background: tokens.inset, color: tokens.textPrimary, fontFamily: "inherit", fontSize: 13 }}>
                      {courses.map((c) => <option key={c.id} value={c.id}>{c.title[lang]}{c.code ? ` · ${c.code}` : ""}</option>)}
                    </select>
                    {real && (
                      <div style={{ marginTop: 14 }}>
                        <AiPreferencesCard tokens={tokens} lang={lang} t={t} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div role="tablist" style={{ display: "flex", gap: mobile ? 14 : 24, borderBottom: `1px solid ${tokens.cardBorder}`, overflowX: "auto" }}>
                {TABS.map((tab) => {
                  const on = tab.screen === active;
                  return (
                    <button key={tab.screen} role="tab" aria-selected={on} type="button" onClick={() => { dispatch({ type: "NAVIGATE", screen: tab.screen }); prefsAsync.reload(); }}
                      style={{ padding: "10px 0", background: "transparent", border: "none", borderBottom: `2px solid ${on ? tokens.primary : "transparent"}`, color: on ? tokens.primary : tokens.textSecondary, fontWeight: on ? 700 : 500, fontSize: 14, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", marginBottom: -1 }}>
                      {tab[lang]}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </AsyncGate>
      </div>

      {courses.length > 0 && (
        <StudyHubContext.Provider value={true}>
          <div key={`${active}-${effectiveId}`}>
            <Page state={pageState} dispatch={dispatch} />
          </div>
          {active === SCREENS.MASTERY && (
            <div style={{ maxWidth: 1080, margin: "0 auto", padding: mobile ? "0 16px 24px" : "0 28px 32px" }}>
              <div style={{ background: tokens.primaryLight, border: `1px solid ${tokens.primary}33`, borderRadius: 14, padding: 18, display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 700, color: tokens.textPrimary }}>{t("Start a knowledge check", "ابدأ اختبار مستوى")}</div>
                  <div style={{ fontSize: 12.5, color: tokens.textMuted }}>{t("A quick check adds evidence and updates your mastery and plan.", "اختبار سريع بيضيف أدلة ويحدّث إتقانك وخطتك.")}</div>
                </div>
                <Btn tokens={tokens} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.DIAGNOSTIC, studyCourseId: effectiveId })}>{t("Start knowledge check", "ابدأ الاختبار")}</Btn>
              </div>
            </div>
          )}
        </StudyHubContext.Provider>
      )}
    </div>
  );
}
