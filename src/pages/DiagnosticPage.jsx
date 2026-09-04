import { useState } from "react";
import useAsync from "@/hooks/useAsync";
import { fetchDiagnosticQuestions } from "@/services/api";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { getCourse } from "@/data/courses";
import { RECOMMENDED_NEXT } from "@/data/student";
import { Card, Btn, Chip, Bar, AsyncGate } from "@/components/ui";

export default function DiagnosticPage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const { data: questions, loading, error, reload } = useAsync(fetchDiagnosticQuestions);
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

  const results = questions?.reduce((acc, qq) => {
    acc[qq.topicId] = acc[qq.topicId] || { total: 0, correct: 0 };
    acc[qq.topicId].total += 1;
    if (answers[qq.id] === qq.correct) acc[qq.topicId].correct += 1;
    return acc;
  }, {});

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
    <div style={{ padding: 28, maxWidth: 820, margin: "0 auto", fontFamily: bodyFont(lang) }}>
      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Preparing diagnostic…", "جاري تجهيز التشخيص…")}>
        {phase === "intro" && (
          <Card tokens={tokens} style={{ marginTop: 12 }}>
            <Chip tokens={tokens} tone="primary">{t("Evidence-based", "قائم على الأدلة")}</Chip>
            <h1 style={{ margin: "12px 0 6px", fontSize: 20, fontWeight: 700, color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
              {t("Knowledge Diagnostic", "تشخيص المعرفة")}
            </h1>
            <p style={{ margin: "0 0 18px", fontSize: 13, color: tokens.textMuted, lineHeight: 1.65 }}>
              {t(
                "No grades, no pressure. We map exactly what you already know, so your study time goes where it actually matters.",
                "لا درجات ولا ضغط. بنحدد بالظبط اللي عارفاه، عشان وقت مذاكرتك يروح حيث يهم فعلاً.",
              )}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              <Chip tokens={tokens}>{questions?.length ?? 0} {t("questions", "أسئلة")}</Chip>
              <Chip tokens={tokens}>{t("~3 minutes", "~3 دقائق")}</Chip>
              <Chip tokens={tokens}>{t("Instant evidence", "أدلة فورية")}</Chip>
            </div>
            <Btn tokens={tokens} onClick={() => setPhase("run")}>{t("Start diagnostic", "ابدأ التشخيص")}</Btn>
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
              <div style={{ display: "grid", gap: 8 }}>
                {q.options.map((o, i) => (
                  <button key={i} onClick={() => pick(i)} style={optionStyle(answers[q.id] === i)}>
                    {o[lang]}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 18 }}>
                <span style={{ fontSize: 11, color: tokens.textFaint, alignSelf: "center" }}>
                  {t("You can change your answer before continuing.", "تقدر تغير إجابتك قبل المتابعة.")}
                </span>
                <Btn tokens={tokens} disabled={answers[q.id] === undefined} onClick={next}>
                  {index + 1 >= questions.length ? t("Finish", "إنهاء") : t("Next", "التالي")}
                </Btn>
              </div>
            </Card>
          </>
        )}

        {phase === "done" && (
          <Card tokens={tokens} style={{ marginTop: 12 }}>
            <Chip tokens={tokens} tone="mastered">{t("Evidence recorded", "تم تسجيل الأدلة")}</Chip>
            <h2 style={{ margin: "12px 0 4px", fontSize: 18, fontWeight: 700, color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
              {t("Your knowledge map just got sharper", "خريطة معرفتك بقت أدق")}
            </h2>
            <p style={{ margin: "0 0 16px", fontSize: 12.5, color: tokens.textMuted }}>
              {t("Results per topic — ready to act on.", "النتائج لكل موضوع — جاهزة للفعل.")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {Object.entries(results).map(([topicId, r]) => (
                <div key={topicId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: tokens.inset, borderRadius: 10, border: `1px solid ${tokens.cardBorder}` }}>
                  <span style={{ flex: 1, fontSize: 12.5, color: tokens.textPrimary }}>{topicLabel(topicId)}</span>
                  <Chip tokens={tokens} tone={r.correct === r.total ? "mastered" : r.correct > 0 ? "primary" : "gap"}>
                    {r.correct}/{r.total} {t("correct", "صحيحة")}
                  </Chip>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 12.5, color: tokens.textPrimary, marginBottom: 8 }}>{t("Recommended next", "المُوصى به تالياً")}</div>
              {RECOMMENDED_NEXT.map((item) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: tokens.primary, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: tokens.textSecondary }}>{item[lang]}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Btn tokens={tokens} onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.PRACTICE })}>
                {t("Practice the gaps", "تدرّب على الفجوات")}
              </Btn>
              <Btn tokens={tokens} variant="ghost" onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.DASHBOARD })}>
                {t("Back to dashboard", "رجوع للوحة")}
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