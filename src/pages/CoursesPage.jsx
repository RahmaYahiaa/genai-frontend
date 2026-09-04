import useAsync from "@/hooks/useAsync";
import { fetchCourses } from "@/services/api";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { Card, Chip, Bar, AsyncGate, Btn } from "@/components/ui";

export default function CoursesPage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const { data, loading, error, reload } = useAsync(fetchCourses);

  return (
    <div style={{ padding: 28, maxWidth: 1080, margin: "0 auto", fontFamily: bodyFont(lang) }}>
      <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
        {t("My Courses", "مقرراتي")}
      </h1>
      <p style={{ margin: "0 0 22px", fontSize: 12.5, color: tokens.textMuted }}>
        {t("Everything you're enrolled in, with live mastery evidence.", "كل المقررات المسجلة فيها، مع أدلة الإتقان الحية.")}
      </p>
      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Loading courses…", "جاري تحميل المقررات…")}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {data?.map((course) => {
            const covered = course.topics.filter((x) => x.evidence > 0).length;
            return (
              <Card key={course.id} tokens={tokens}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8 }}>
                  <Chip tokens={tokens} tone="primary">{course.id}</Chip>
                  <Chip tokens={tokens}>{t(`Week ${course.week}`, `الأسبوع ${course.week}`)}</Chip>
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
                    {covered}/{course.topics.length} {t("topics with evidence", "مواضيع بأدلة")}
                  </span>
                  <Btn tokens={tokens} variant="soft" onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.MASTERY })}>
                    {t("View topics", "عرض المواضيع")}
                  </Btn>
                </div>
              </Card>
            );
          })}
        </div>
      </AsyncGate>
    </div>
  );
}