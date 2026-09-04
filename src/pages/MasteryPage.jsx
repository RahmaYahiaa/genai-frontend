import useAsync from "@/hooks/useAsync";
import { fetchMastery } from "@/services/api";
import { tk, headingFont, bodyFont, masteryLevel } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { Card, Chip, Stat, AsyncGate, Btn } from "@/components/ui";
import MasteryBar, { MasteryLabel } from "@/components/MasteryBar";

const LEGEND = ["no-evidence", "beginner", "intermediate", "advanced", "mastered"];

export default function MasteryPage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const { data, loading, error, reload } = useAsync(fetchMastery);

  return (
    <div style={{ padding: 28, maxWidth: 1080, margin: "0 auto", fontFamily: bodyFont(lang) }}>
      <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 14 }}>
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
              <div style={{ marginTop: 8 }}>
                <MasteryBar pct={topic.pct} evidence={topic.evidence} tokens={tokens} height={7} />
              </div>
            </div>
          );
        })}
      </Card>
    </>
  );
}