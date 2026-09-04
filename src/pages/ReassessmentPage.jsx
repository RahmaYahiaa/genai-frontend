import { useState } from "react";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { fetchReassessmentQuestions } from "@/services/api";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { getCourse } from "@/data/courses";
import { Card, Btn, Chip, Bar, AsyncGate } from "@/components/ui";
import MasteryBar from "@/components/MasteryBar";

export default function ReassessmentPage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const mobile = useMediaQuery("(max-width: 760px)");
  const { data: questions, loading, error, reload } = useAsync(fetchReassessmentQuestions);
  const [phase, setPhase] = useState("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const q = questions?.[index];
  const course = getCourse("CS301");
  const topicLabel = (id) => {
    const tp = course.topics.find((x) => x.id === id);
    return tp ? tp.label[lang] : id;
  };

  const pick = (i) => q && setAnswers((a) => ({ ...a, [q.id]: i }));
  const next = () => (index + 1 >= questions.length ? setPhase("done") : setIndex((n) => n + 1));
  const restart = () => {
    setPhase("intro");
    setIndex(0);
    setAnswers({});
  };

  const before = course.topics.map((tp) => tp.pct);
  const avgBefore = Math.round(before.reduce((s, x) => s + x, 0) / before.length);
  const after = course.topics.map((tp) => {
    const qs = questions?.filter((qq) => qq.topicId === tp.id) ?? [];
    const correct = qs.filter((qq) => answers[qq.id] === qq.correct).length;
    const gain = qs.length > 0 ? Math.round((correct / qs.length) * 18) : 0;
    return { ...tp, after: Math.min(95, tp.pct + gain), gain, evidence: tp.evidence + correct };
  });
  const avgAfter = Math.round(after.reduce((s, x) => s + x.after, 0) / after.length);

  const optionStyle = (active) => ({
    padding: "11px 14px",
    borderRadius: 10,
    border: `1.5px solid ${active ? `${tokens.primary}55` : tokens.cardBorder}`,
    background: active ? tokens.primaryLight : tokens.inset,
    color: active ? tokens.primary : tokens.textPrimary,
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    cursor: "pointer",
    textAlign: "left",
  });

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 820, margin: "0 auto", fontFamily: bodyFont(lang) }}>
      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Preparing reassessment…", "جاري تجهيز إعادة التقييم…")}>
        {phase === "intro" && (
          <Card tokens={tokens} style={{ marginTop: 12 }}>
            <Chip tokens={tokens} tone="mastered">{t("Growth measurement", "قياس النمو")}</Chip>
            <h1 style={{ margin: "12px 0 6px", fontSize: 20, fontWeight: 700, color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
              {t("Reassessment", "إعادة التقييم")}
            </h1>
            <p style={{ margin: "0 0 18px", fontSize: 13, color: tokens.textMuted, lineHeight: 1.65 }}>
              {t(
                "Same evidence standard as the diagnostic — but now we can prove improvement, topic by topic.",
                "نفس معيار الأدلة كالتشخيص — لكن دلوقتي نقدر نثبت التحسن، موضوعاً بموضوع.",
              )}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              <Chip tokens={tokens} tone="mastered">{t("Diagnostic completed", "التشخيص مكتمل")}</Chip>
              <Chip tokens={tokens} tone="primary">{t("Practice logged", "التدريب مسجل")}</Chip>
              <Chip tokens={tokens}>{t("4 questions", "4 أسئلة")}</Chip>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Btn tokens={tokens} onClick={() => setPhase("run")}>{t("Start reassessment", "ابدأ إعادة التقييم")}</Btn>
            </div>
          </Card>
        )}

        {phase === "run" && q && (
          <>
            <Bar tokens={tokens} value={((index + 1) / questions.length) * 100} color={tokens.mastered} height={5} />
            <div style={{ display: "flex", justifyContent: "space-between", margin: "8px 0 16px", fontSize: 11.5, color: tokens.textMuted, gap: 8 }}>
              <span>{t(`Question ${index + 1} of ${questions.length}`, `سؤال ${index + 1} من ${questions.length}`)}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{topicLabel(q.topicId)}</span>
            </div>
            <Card tokens={tokens}>
              <div style={{ fontSize: 15.5, fontWeight: 600, lineHeight: 1.55, color: tokens.textPrimary, marginBottom: 18 }}>{q.stem[lang]}</div>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 8 }}>
                {q.options.map((o, i) => (
                  <button key={i} onClick={() => pick(i)} style={optionStyle(answers[q.id] === i)}>
                    {o[lang]}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
                <Btn tokens={tokens} disabled={answers[q.id] === undefined} onClick={next}>
                  {index + 1 >= questions.length ? t("Compare results", "قارن النتائج") : t("Next", "التالي")}
                </Btn>
              </div>
            </Card>
          </>
        )}

        {phase === "done" && (
          <Card tokens={tokens} style={{ marginTop: 12 }}>
            <Chip tokens={tokens} tone="mastered">{t("Before → After", "قبل ← بعد")}</Chip>
            <h2 style={{ margin: "12px 0 4px", fontSize: 18, fontWeight: 700, color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
              {t("Measurable growth", "نمو قابل للقياس")}
            </h2>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 18 }}>
              <span style={{ fontSize: 30, fontWeight: 700, color: tokens.mastered, fontFamily: headingFont(lang) }}>{avgAfter}%</span>
              <span style={{ fontSize: 12.5, color: tokens.textMuted }}>
                {t(`up from ${avgBefore}% baseline`, `من ${avgBefore}% كخط أساس`)}
              </span>
            </div>
            {after.map((tp) => (
              <div key={tp.id} style={{ padding: "10px 0", borderBottom: `1px solid ${tokens.cardBorder}`, ...(tp.id === after[after.length - 1].id ? { borderBottom: "none" } : {}) }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, gap: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: tokens.textPrimary }}>{tp.label[lang]}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: tokens.textFaint }}>{tp.pct}%</span>
                    <span style={{ color: tokens.textFaint, fontSize: 11 }}>→</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: tokens.mastered }}>{tp.after}%</span>
                    {tp.gain > 0 && <Chip tokens={tokens} tone="mastered">+{tp.gain}</Chip>}
                  </span>
                </div>
                <MasteryBar pct={tp.after} evidence={tp.evidence} tokens={tokens} height={6} />
              </div>
            ))}
            <p style={{ margin: "16px 0 18px", fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.6 }}>
              {t(
                "Evidence trail updated: every correct answer now carries proof on your mastery map.",
                "سجل الأدلة اتحدث: كل إجابة صحيحة بقت حاملة دليلاً على خريطة إتقانك.",
              )}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Btn tokens={tokens} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.DASHBOARD })}>
                {t("View updated map", "اعرض الخريطة المحدثة")}
              </Btn>
              <Btn tokens={tokens} variant="ghost" onClick={restart}>
                {t("Retake", "إعادة")}
              </Btn>
            </div>
          </Card>
        )}
      </AsyncGate>
    </div>
  );
}