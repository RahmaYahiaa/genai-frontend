import { useState } from "react";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { fetchPracticeQuestions } from "@/services/api";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { getCourse } from "@/data/courses";
import { Card, Btn, Chip, Bar, AsyncGate } from "@/components/ui";

export default function PracticePage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const mobile = useMediaQuery("(max-width: 760px)");
  const { data: questions, loading, error, reload } = useAsync(fetchPracticeQuestions);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions?.[index];
  const course = getCourse("CS301");
  const topicLabel = (id) => {
    const tp = course.topics.find((x) => x.id === id);
    return tp ? tp.label[lang] : id;
  };

  const pick = (i) => {
    if (picked !== null || !q) return;
    setPicked(i);
    if (i === q.correct) setScore((s) => s + 1);
  };

  const next = () => {
    if (index + 1 >= questions.length) setDone(true);
    else {
      setIndex((n) => n + 1);
      setPicked(null);
    }
  };

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  const optionStyle = (i) => {
    if (picked === null) {
      return { background: tokens.inset, border: `1.5px solid ${tokens.cardBorder}`, color: tokens.textPrimary };
    }
    if (i === q.correct) return { background: tokens.masteredBg, border: `1.5px solid ${tokens.mastered}`, color: tokens.mastered };
    if (i === picked) return { background: tokens.gapBg, border: `1.5px solid ${tokens.gap}`, color: tokens.gap };
    return { background: tokens.inset, border: `1.5px solid ${tokens.cardBorder}`, color: tokens.textFaint };
  };

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 820, margin: "0 auto", fontFamily: bodyFont(lang) }}>
      <h1 style={{ margin: "0 0 4px", fontSize: mobile ? 19 : 22, fontWeight: 700, letterSpacing: "-0.02em", color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
        {t("Practice", "التدريب")}
      </h1>
      <p style={{ margin: "0 0 20px", fontSize: 12.5, color: tokens.textMuted }}>
        {t("Immediate feedback, and every correct answer adds evidence.", "تصحيح فوري، وكل إجابة صحيحة بتضيف دليلاً.")}
      </p>
      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Preparing questions…", "جاري تجهيز الأسئلة…")}>
        {!done && q && (
          <>
            <Bar tokens={tokens} value={((index + 1) / questions.length) * 100} color={tokens.primary} height={5} />
            <div style={{ display: "flex", justifyContent: "space-between", margin: "8px 0 16px", fontSize: 11.5, color: tokens.textMuted, gap: 8 }}>
              <span>
                {t(`Question ${index + 1} of ${questions.length}`, `سؤال ${index + 1} من ${questions.length}`)} · {t("Score", "النتيجة")} {score}
              </span>
              <Chip tokens={tokens} tone="primary">{topicLabel(q.topicId)}</Chip>
            </div>
            <Card tokens={tokens}>
              <div style={{ fontSize: 15.5, fontWeight: 600, lineHeight: 1.55, color: tokens.textPrimary, marginBottom: 18 }}>{q.stem[lang]}</div>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 8 }}>
                {q.options.map((o, i) => (
                  <button key={i} onClick={() => pick(i)} style={{ padding: "11px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: picked !== null ? "default" : "pointer", textAlign: "left", ...optionStyle(i) }}>
                    {o[lang]}
                  </button>
                ))}
              </div>
              {picked !== null && (
                <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 10, background: tokens.citationBg, border: `1px solid ${tokens.citationBorder}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Chip tokens={tokens} tone={picked === q.correct ? "mastered" : "gap"}>
                      {picked === q.correct ? t("Correct", "صحيح") : t("Not yet", "لسه")}
                    </Chip>
                    {picked !== q.correct && (
                      <span style={{ fontSize: 11.5, color: tokens.textMuted }}>
                        {t("Correct answer shown in blue.", "الإجابة الصحيحة باللون الأزرق.")}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.6, color: tokens.textPrimary }}>{q.explanation[lang]}</div>
                </div>
              )}
              {picked !== null && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                  <Btn tokens={tokens} onClick={next}>
                    {index + 1 >= questions.length ? t("See results", "شوف النتيجة") : t("Next", "التالي")}
                  </Btn>
                </div>
              )}
            </Card>
          </>
        )}

        {done && (
          <Card tokens={tokens} style={{ marginTop: 12 }}>
            <Chip tokens={tokens} tone={score >= questions.length * 0.75 ? "mastered" : "primary"}>
              {t("Session complete", "اكتمل التدريب")}
            </Chip>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, margin: "14px 0 8px" }}>
              <span style={{ fontSize: 34, fontWeight: 700, color: tokens.textPrimary, fontFamily: headingFont(lang), letterSpacing: "-0.03em" }}>
                {score}/{questions.length}
              </span>
              <span style={{ fontSize: 13, color: tokens.textMuted }}>{t("correct", "إجابات صحيحة")}</span>
            </div>
            <Bar tokens={tokens} value={(score / questions.length) * 100} color={tokens.mastered} height={8} />
            <p style={{ margin: "14px 0 18px", fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.6 }}>
              {t(
                "Solid work. Reassessment now gives you hard proof that these skills stuck.",
                "شغل جامد. إعادة التقييم دلوقتي هتدي دليل قاطع إن المهارات دي ثابتة.",
              )}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Btn tokens={tokens} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.REASSESSMENT })}>
                {t("Prove it — Reassess", "أثبتها — أعد التقييم")}
              </Btn>
              <Btn tokens={tokens} variant="ghost" onClick={restart}>
                {t("Practice again", "تدرّب تاني")}
              </Btn>
            </div>
          </Card>
        )}
      </AsyncGate>
    </div>
  );
}