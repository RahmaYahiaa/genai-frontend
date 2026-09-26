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
import { StudyPage, Panel, PrimaryButton, SecondaryButton, Notice, LoadingBlock, EmptyBlock, StatusText, STATUS } from "@/components/study/StudyKit";
import { IconMastery } from "@/components/Icons";

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
        {t("My Progress", "تقدّمي")}
      </h1>
      <p style={{ margin: "0 0 20px", fontSize: 12.5, color: tokens.textMuted }}>
        {t("Every level is based on your actual answers.", "كل مستوى مدعوم بأدلة — لا تخمين.")}
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
        <Stat tokens={tokens} label={t("Answers checked", "عناصر الأدلة")} value={totalEvidence} hint={t(`${withEvidence.length}/${course.topics.length} topics`, `${withEvidence.length}/${course.topics.length} مواضيع`)} />
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
                        {topic.evidence > 0 ? `${topic.evidence} ${t("answers checked", "عناصر أدلة")}` : t("Not checked yet", "لا توجد أدلة بعد")}
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
                      {topic.evidence > 0 ? `${topic.evidence} ${t("answers checked", "عناصر أدلة")}` : t("Not checked yet", "لا توجد أدلة بعد")}
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

const ACTION_SCREEN = {
  build_foundation: SCREENS.TUTOR, fill_prerequisites: SCREENS.TUTOR, resolve_misconceptions: SCREENS.TUTOR,
  reinforce: SCREENS.PRACTICE, progress: SCREENS.PRACTICE,
};

function ReviewQueue({ queue, tokens, lang, t, onReviewed }) {
  const [busyConcept, setBusyConcept] = useState(null);
  const [failed, setFailed] = useState(false);
  if (!queue.length) return null;
  async function review(item, remembered) {
    if (busyConcept) return;
    setBusyConcept(item.concept);
    setFailed(false);
    try {
      await recordConceptReview(item.concept, remembered);
      onReviewed();
    } catch {
      setFailed(true);
    } finally {
      setBusyConcept(null);
    }
  }
  return (
    <section style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 650, color: tokens.textPrimary, margin: "0 0 4px" }}>{t("Quick review", "مراجعة سريعة")}</h2>
      <p style={{ margin: "0 0 12px", fontSize: 13.5, color: tokens.textMuted }}>{t("Do you still remember these? Be honest — it decides when you'll see them again.", "لسه فاكر دول؟ خليك صريح — ده بيحدد إمتى هيرجعولك تاني.")}</p>
      {failed && <Notice tokens={tokens} tone="danger">{t("That didn't save. Please try again.", "ماتحفظش. جرّب تاني.")}</Notice>}
      <Panel tokens={tokens} padding={0} style={{ overflow: "hidden" }}>
        {queue.map((item, i) => (
          <div key={item.concept} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 20px", borderTop: i ? `1px solid ${tokens.cardBorder}` : "none", flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: tokens.textPrimary }}>{item.concept}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <SecondaryButton tokens={tokens} disabled={busyConcept === item.concept} style={{ height: 36, fontSize: 13 }} onClick={() => review(item, false)}>{t("Forgot", "نسيت")}</SecondaryButton>
              <PrimaryButton tokens={tokens} busy={busyConcept === item.concept} style={{ height: 36, fontSize: 13 }} onClick={() => review(item, true)}>{t("I remember", "فاكر")}</PrimaryButton>
            </div>
          </div>
        ))}
      </Panel>
    </section>
  );
}

function RealMasteryPage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const mobile = useMediaQuery("(max-width: 760px)");
  const learningAsync = useAsync(getMyLearning);
  const data = learningAsync.data;
  const profile = data?.profile ?? {};
  const concepts = Object.entries(profile.concept_mastery ?? {}).map(([concept, mastery]) => ({ concept, pct: pctOf(mastery) })).sort((a, b) => a.pct - b.pct);
  // With no mastery evidence yet the engine still returns a generic "progress" action; hide it.
  const nextAction = Object.keys(profile.concept_mastery ?? {}).length > 0 ? data?.next_action ?? null : null;
  const studyPlan = data?.study_plan ?? [];
  const reviewQueue = data?.review_queue ?? [];
  const strong = concepts.filter((c) => c.pct >= 70);
  const weak = concepts.filter((c) => c.pct < 70);
  const go = (screen) => dispatch({ type: "NAVIGATE", screen });
  const levelWord = (pct) => (pct >= 70 ? t("Strong", "قوي") : pct >= 40 ? t("Getting there", "في الطريق") : t("Needs work", "محتاج شغل"));
  const levelTone = (pct) => (pct >= 70 ? STATUS.success.fg : pct >= 40 ? STATUS.warning.fg : STATUS.danger.fg);

  return (
    <StudyPage tokens={tokens} lang={lang} mobile={mobile} title={t("My Progress", "تقدّمي")}
      subtitle={t("What you've mastered, what to focus on next, and what's due for a quick review.", "اللي أتقنته، واللي تركّز عليه بعد كده، واللي محتاج مراجعة سريعة.")}>
      {learningAsync.loading ? (
        <LoadingBlock tokens={tokens} label={t("Loading your progress…", "جاري تحميل تقدّمك…")} />
      ) : learningAsync.error ? (
        <EmptyBlock tokens={tokens} Icon={IconMastery} title={t("Your progress isn't available right now", "تقدّمك مش متاح دلوقتي")}
          body={t("Please try again in a few minutes. You can still practise in the meantime.", "جرّب تاني بعد كام دقيقة. وتقدر تتدرّب في الوقت ده.")}
          action={<div style={{ display: "flex", gap: 10, justifyContent: "center" }}><PrimaryButton tokens={tokens} onClick={learningAsync.reload}>{t("Try again", "حاول تاني")}</PrimaryButton><SecondaryButton tokens={tokens} onClick={() => go(SCREENS.PRACTICE)}>{t("Go to practice", "روح للتدريب")}</SecondaryButton></div>} />
      ) : concepts.length === 0 && !nextAction && reviewQueue.length === 0 ? (
        <EmptyBlock tokens={tokens} Icon={IconMastery} title={t("Your progress will show up here", "تقدّمك هيظهر هنا")}
          body={t("Take a short level check and we'll show what you know, what to work on, and a study plan made for you.", "اعمل اختبار مستوى قصير، وهنوريك إنت عارف إيه، ومحتاج تشتغل على إيه، وخطة مذاكرة معمولة ليك.")}
          action={<PrimaryButton tokens={tokens} onClick={() => go(SCREENS.DIAGNOSTIC)}>{t("Check my level", "اعرف مستواك")}</PrimaryButton>} />
      ) : (
        <>
          {nextAction && (
            <Panel tokens={tokens} style={{ borderInlineStart: `4px solid ${tokens.primary}` }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: tokens.primary, marginBottom: 6 }}>{t("Recommended next", "الخطوة المقترحة")}</div>
              <div style={{ fontSize: 18, fontWeight: 650, color: tokens.textPrimary, marginBottom: 6 }}>{NEXT_ACTION_LABELS[nextAction.action]?.[lang] ?? t("Keep going", "كمّل")}</div>
              {nextAction.reason && <p style={{ margin: "0 0 12px", fontSize: 14, color: tokens.textMuted, lineHeight: 1.65 }}>{nextAction.reason}</p>}
              {(nextAction.target_concepts ?? []).length > 0 && (
                <p style={{ margin: "0 0 16px", fontSize: 14, color: tokens.textPrimary }}>
                  <span style={{ color: tokens.textMuted }}>{t("Focus on: ", "ركّز على: ")}</span>{nextAction.target_concepts.join(lang === "ar" ? "، " : ", ")}
                </p>
              )}
              <PrimaryButton tokens={tokens} onClick={() => go(ACTION_SCREEN[nextAction.action] ?? SCREENS.PRACTICE)}>
                {(ACTION_SCREEN[nextAction.action] ?? SCREENS.PRACTICE) === SCREENS.TUTOR ? t("Learn it with the tutor", "اتعلّمه مع المعلم") : t("Practise now", "اتدرّب دلوقتي")}
              </PrimaryButton>
            </Panel>
          )}

          {concepts.length > 0 && (
            <section style={{ marginTop: 32 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                <h2 style={{ fontSize: 16, fontWeight: 650, color: tokens.textPrimary, margin: 0 }}>{t("Your topics", "مواضيعك")}</h2>
                <span style={{ fontSize: 13, color: tokens.textMuted }}>{t(`${strong.length} strong · ${weak.length} to work on`, `${strong.length} قوي · ${weak.length} محتاج شغل`)}</span>
              </div>
              <Panel tokens={tokens} padding={0} style={{ overflow: "hidden" }}>
                {concepts.map((row, i) => (
                  <div key={row.concept} style={{ padding: "14px 20px", borderTop: i ? `1px solid ${tokens.cardBorder}` : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: tokens.textPrimary }}>{row.concept}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: levelTone(row.pct), whiteSpace: "nowrap" }}>{levelWord(row.pct)} · {row.pct}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: tokens.inset, overflow: "hidden" }}>
                      <div style={{ width: `${row.pct}%`, height: "100%", borderRadius: 99, background: levelTone(row.pct) }} />
                    </div>
                  </div>
                ))}
              </Panel>
            </section>
          )}

          <ReviewQueue queue={reviewQueue} tokens={tokens} lang={lang} t={t} onReviewed={learningAsync.reload} />

          {studyPlan.length > 0 && (
            <section style={{ marginTop: 32 }}>
              <h2 style={{ fontSize: 16, fontWeight: 650, color: tokens.textPrimary, margin: "0 0 12px" }}>{t("Your study plan", "خطة مذاكرتك")}</h2>
              <Panel tokens={tokens} padding={0} style={{ overflow: "hidden" }}>
                {studyPlan.map((step, i) => (
                  <div key={step.title ?? i} style={{ display: "flex", gap: 14, padding: "16px 20px", borderTop: i ? `1px solid ${tokens.cardBorder}` : "none" }}>
                    <span style={{ width: 28, height: 28, borderRadius: "50%", background: tokens.primaryLight, color: tokens.primary, fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: tokens.textPrimary }}>{step.title}</span>
                        {step.priority === "high" && <StatusText tone="danger">{t("Do this first", "ابدأ بده")}</StatusText>}
                      </div>
                      {step.reason && <div style={{ fontSize: 13.5, color: tokens.textMuted, lineHeight: 1.6, marginTop: 4 }}>{step.reason}</div>}
                      {(step.recommended_actions ?? []).length > 0 && (
                        <ul style={{ margin: "8px 0 0", paddingInlineStart: 18, color: tokens.textSecondary, fontSize: 13.5, lineHeight: 1.8 }}>
                          {step.recommended_actions.map((action) => <li key={action}>{action}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </Panel>
            </section>
          )}
        </>
      )}
    </StudyPage>
  );
}

export default function MasteryPage(props) {
  if (demoMode()) return <DemoMasteryPage {...props} />;
  return <RealMasteryPage {...props} />;
}
