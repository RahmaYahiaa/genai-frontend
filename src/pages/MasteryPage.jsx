import { demoMode } from "@/services/auth";
import { useState } from "react";
import { getMyLearning, recordConceptReview } from "@/services/learning";
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

const NEXT_ACTION_LABELS = {
  build_foundation: { en: "Build the foundations first", ar: "ابنِ الأساسات أولًا" },
  reinforce: { en: "Reinforce weak concepts", ar: "عزّز المفاهيم الضعيفة" },
  resolve_misconceptions: { en: "Resolve misconceptions", ar: "صحّح المفاهيم الخاطئة" },
  fill_prerequisites: { en: "Fill prerequisite gaps", ar: "سدّ الفجوات التأسيسية" },
  progress: { en: "Keep progressing", ar: "واصل التقدّم" },
};

const PRIORITY_LABELS = {
  low: { en: "Low", ar: "منخفضة" },
  medium: { en: "Medium", ar: "متوسطة" },
  high: { en: "High", ar: "مرتفعة" },
};

function ReviewQueue({ queue, tokens, lang, t, onReviewed }) {
  const [busyConcept, setBusyConcept] = useState(null);
  const [error, setError] = useState(null);
  if (!queue.length) return null;
  async function review(item, remembered) {
    if (busyConcept) return;
    setBusyConcept(item.concept);
    setError(null);
    try {
      await recordConceptReview(item.concept, remembered);
      onReviewed();
    } catch (e) {
      setError(e?.message ?? "review failed");
    } finally {
      setBusyConcept(null);
    }
  }
  return (
    <Card tokens={tokens} style={{ marginBottom: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: tokens.textPrimary, marginBottom: 10 }}>
        {t("Spaced review queue (SM-2)", "جدول المراجعة المتباعدة (SM-2)")}
      </div>
      {error && (
        <div style={{ fontSize: 12, color: tokens.danger ?? "#b33", marginBottom: 8 }}>{error}</div>
      )}
      {queue.map((item) => (
        <div
          key={item.concept}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            padding: "10px 0",
            borderTop: `1px solid ${tokens.cardBorder}`,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>{item.concept}</div>
            <div style={{ fontSize: 11, color: tokens.textFaint, marginTop: 2 }}>
              {t("Due", "مستحقة")}: {item.due_date ? new Date(item.due_date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB") : "—"}
              {" · "}
              {t("Interval", "الفاصل")}: {item.interval_days ?? "—"} {t("days", "يوم")}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Btn tokens={tokens} variant="soft" disabled={busyConcept === item.concept} onClick={() => review(item, true)}>
              {busyConcept === item.concept ? t("Saving…", "جارٍ الحفظ…") : t("Remembered", "تذكرت")}
            </Btn>
            <Btn tokens={tokens} variant="ghost" disabled={busyConcept === item.concept} onClick={() => review(item, false)}>
              {t("Forgot", "لم أتذكر")}
            </Btn>
          </div>
        </div>
      ))}
    </Card>
  );
}

function RealMasteryPage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const mobile = useMediaQuery("(max-width: 760px)");
  // The AI learning engine is the single source of truth for concept mastery,
  // next actions, study plans and the spaced-repetition queue.
  const learningAsync = useAsync(getMyLearning);
  const data = learningAsync.data;

  const profile = data?.profile ?? {};
  const conceptMastery = profile.concept_mastery ?? {};
  const concepts = Object.entries(conceptMastery).map(([concept, mastery]) => ({
    concept,
    pct: pctOf(mastery),
  })).sort((a, b) => a.pct - b.pct);
  const nextAction = data?.next_action ?? null;
  const studyPlan = data?.study_plan ?? [];
  const reviewQueue = data?.review_queue ?? [];
  const emptyMastery = concepts.length === 0;

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 1080, margin: "0 auto", fontFamily: bodyFont(lang), direction: lang === "ar" ? "rtl" : "ltr" }}>
      <h1 style={{ margin: "0 0 4px", fontSize: mobile ? 19 : 22, fontWeight: 700, letterSpacing: "-0.02em", color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
        {t("Topics & Mastery", "المواضيع والإتقان")}
      </h1>
      <p style={{ margin: "0 0 20px", fontSize: 12.5, color: tokens.textMuted }}>
        {t(
          "Mastery, next actions and reviews come from the AI learning engine — evidence-backed, never guessed.",
          "الإتقان والخطوات التالية والمراجعات مصدرها محرك التعلّم الذكي — مبني على الأدلة وليس التخمين.",
        )}
      </p>
      <AsyncGate
        tokens={tokens}
        lang={lang}
        loading={learningAsync.loading}
        error={learningAsync.error}
        reload={learningAsync.reload}
        label={t("Loading your learning state…", "جارٍ تحميل حالة تعلّمك…")}
      >
        {data && (
          <>
            {nextAction && (
              <Card tokens={tokens} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: tokens.textPrimary }}>
                    {NEXT_ACTION_LABELS[nextAction.action]?.[lang] ?? nextAction.action}
                  </div>
                  {nextAction.priority && (
                    <Chip tokens={tokens} tone={nextAction.priority === "high" ? "gap" : "slate"}>
                      {PRIORITY_LABELS[nextAction.priority]?.[lang] ?? nextAction.priority}
                    </Chip>
                  )}
                </div>
                {nextAction.reason && (
                  <div style={{ fontSize: 12.5, color: tokens.textSecondary, lineHeight: 1.7, marginBottom: 8 }}>{nextAction.reason}</div>
                )}
                {(nextAction.target_concepts ?? []).length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {nextAction.target_concepts.map((concept) => (
                      <Chip key={concept} tokens={tokens} tone="primary">{concept}</Chip>
                    ))}
                  </div>
                )}
              </Card>
            )}

            <ReviewQueue queue={reviewQueue} tokens={tokens} lang={lang} t={t} onReviewed={learningAsync.reload} />

            <Card tokens={tokens} style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: tokens.textPrimary, marginBottom: 10 }}>
                {t("Concept mastery", "إتقان المفاهيم")}
              </div>
              {emptyMastery ? (
                <p style={{ fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.8, margin: 0 }}>
                  {t(
                    "No mastery evidence yet. It fills in automatically as the AI engine observes your assessed answers — nothing is assumed without evidence.",
                    "لا توجد أدلة إتقان بعد. تُملأ تلقائيًا مع ملاحظة محرك الذكاء لإجاباتك التقييمية — لا يُفترض شيء بلا دليل.",
                  )}
                </p>
              ) : (
                concepts.map((row) => (
                  <div key={row.concept} style={{ padding: "8px 0", borderTop: `1px solid ${tokens.cardBorder}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>{row.concept}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: tokens.textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>{row.pct}%</span>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <MasteryBar pct={row.pct} evidence={1} tokens={tokens} height={7} />
                    </div>
                  </div>
                ))
              )}
            </Card>

            {studyPlan.length > 0 && (
              <Card tokens={tokens}>
                <div style={{ fontWeight: 700, fontSize: 14, color: tokens.textPrimary, marginBottom: 10 }}>
                  {t("Personal study plan", "خطة المذاكرة الشخصية")}
                </div>
                {studyPlan.map((step) => (
                  <div key={step.title} style={{ padding: "10px 0", borderTop: `1px solid ${tokens.cardBorder}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>{step.title}</span>
                      {step.priority && (
                        <Chip tokens={tokens} tone="slate">{PRIORITY_LABELS[step.priority]?.[lang] ?? step.priority}</Chip>
                      )}
                    </div>
                    {step.reason && <div style={{ fontSize: 12, color: tokens.textMuted, lineHeight: 1.7, marginTop: 4 }}>{step.reason}</div>}
                    {(step.recommended_actions ?? []).length > 0 && (
                      <ul style={{ margin: "6px 0 0", paddingInlineStart: 18, color: tokens.textSecondary, fontSize: 12, lineHeight: 1.8 }}>
                        {step.recommended_actions.map((action) => (
                          <li key={action}>{action}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </Card>
            )}
          </>
        )}
      </AsyncGate>
    </div>
  );
}

export default function MasteryPage(props) {
  if (demoMode()) return <DemoMasteryPage {...props} />;
  return <RealMasteryPage {...props} />;
}
