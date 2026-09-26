import { SCREENS } from "@/constants/routes";
import { IconDiagnostic, IconTutor, IconSparkle, IconPractice, IconReassessment, IconMastery } from "@/components/Icons";

/**
 * "Study this course" — turns a course page into the entry point of the study loop.
 * Every action navigates to an existing, backend-driven screen and pre-selects
 * this course via state.studyCourseId (see hooks/useStudyCourse).
 * `readyMaterials` is the count of processed materials: the tutor and study
 * materials ground on them, so we tell the student when there is nothing to ground on.
 */
const STEPS = [
  { screen: SCREENS.DIAGNOSTIC, Icon: IconDiagnostic, en: ["Check my level", "A short quiz that finds what you already know."], ar: ["اعرف مستواك", "تشخيص قصير يحدّد اللي إنت عارفه."] },
  { screen: SCREENS.TUTOR, Icon: IconTutor, en: ["Ask the AI Tutor", "Explanations based on this course's materials."], ar: ["اسأل المعلم الذكي", "شرح مبني على مواد المقرر ده."] },
  { screen: SCREENS.STUDY_TOOLS, Icon: IconSparkle, en: ["Make study materials", "Summaries, flashcards, quizzes and more from a topic."], ar: ["اعمل مواد مذاكرة", "ملخصات وبطاقات واختبارات وغيرها من موضوع."] },
  { screen: SCREENS.PRACTICE, Icon: IconPractice, en: ["Practice", "Targeted questions with instant feedback."], ar: ["تدرّب", "أسئلة موجّهة مع تصحيح فوري."] },
  { screen: SCREENS.REASSESSMENT, Icon: IconReassessment, en: ["Re-check progress", "See how much you've improved since your level check."], ar: ["قيس تقدّمك", "شوف إيه اللي اتحسّن من بعد التشخيص."] },
  { screen: SCREENS.MASTERY, Icon: IconMastery, en: ["Mastery & plan", "Your concepts, next step and review queue."], ar: ["الإتقان والخطة", "مفاهيمك وخطوتك الجاية وقائمة المراجعة."] },
];

export default function StudyCoursePanel({ courseId, readyMaterials, dispatch, tokens, lang, mobile }) {
  const isRtl = lang === "ar";
  const go = (screen) => dispatch({ type: "NAVIGATE", screen, studyCourseId: courseId });
  return (
    <section
      aria-label={isRtl ? "ذاكر المقرر ده" : "Study this course"}
      style={{ background: tokens.card, border: `1px solid ${tokens.cardBorder}`, borderRadius: 14, padding: mobile ? 14 : 18, margin: "16px 0", textAlign: isRtl ? "right" : "left" }}
    >
      <div style={{ fontWeight: 700, fontSize: 15, color: tokens.textPrimary, marginBottom: 2 }}>{isRtl ? "ذاكر المقرر ده" : "Study this course"}</div>
      <div style={{ fontSize: 12.5, color: tokens.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
        {isRtl
          ? "ابدأ بتحديد مستواك، اتعلّم وتدرّب، وبعدين قيس تقدّمك. كل خطوة بتحدّث خطة الإتقان بتاعتك."
          : "Start by checking your level, learn and practice, then re-check. Every step updates your mastery plan."}
      </div>
      {readyMaterials === 0 && (
        <div role="note" style={{ fontSize: 12, color: tokens.gap, background: tokens.gapBg, border: `1px solid ${tokens.gapBorder}`, borderRadius: 10, padding: "8px 12px", marginBottom: 12 }}>
          {isRtl
            ? "لسه مفيش مواد جاهزة في المقرر — المعلم الذكي ومواد المذاكرة بيستندوا على المواد، فالإجابات هتكون محدودة لحد ما تترفع وتتجهّز."
            : "No processed materials yet — the AI Tutor and study materials ground on course materials, so answers will be limited until materials are uploaded and ready."}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: 10 }}>
        {STEPS.map((step) => {
          const [title, hint] = step[lang] ?? step.en;
          return (
            <button
              key={step.screen}
              type="button"
              onClick={() => go(step.screen)}
              style={{ display: "flex", gap: 10, alignItems: "flex-start", textAlign: "inherit", padding: "12px 12px", borderRadius: 12, border: `1px solid ${tokens.cardBorder}`, background: tokens.inset, cursor: "pointer", fontFamily: "inherit" }}
            >
              <step.Icon size={18} color={tokens.primary} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 650, fontSize: 13, color: tokens.textPrimary }}>{title}</span>
                <span style={{ display: "block", fontSize: 11.5, color: tokens.textMuted, lineHeight: 1.5, marginTop: 2 }}>{hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
