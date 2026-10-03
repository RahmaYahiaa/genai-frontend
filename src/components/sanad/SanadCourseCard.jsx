import { SCREENS } from "@/constants/routes";
import { headingFont, bodyFont } from "@/constants/tokens";
import { IconArrowLeft, IconArrowRight } from "@/components/Icons";
import { SanadMark, tr } from "./SanadKit";

/** Entry point to Plany from inside a course page. */
export default function SanadCourseCard({ courseId, dispatch, lang, mobile }) {
  const t = tr(lang);
  const Arrow = lang === "ar" ? IconArrowLeft : IconArrowRight;
  return (
    <button type="button" onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.SANAD, courseId, planId: undefined })}
      style={{ width: "100%", textAlign: "start", border: "none", cursor: "pointer", borderRadius: 18, padding: mobile ? 16 : "18px 22px", background: "linear-gradient(120deg, #163F8A 0%, #1B4DA8 55%, #3D66D6 100%)", color: "#fff", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 10px 28px rgba(27,77,168,0.28)" }}>
      <span style={{ background: "rgba(255,255,255,0.15)", borderRadius: 14, padding: 4, display: "inline-flex" }}><SanadMark size={40} /></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontFamily: headingFont(lang), fontSize: 16, fontWeight: 800 }}>{t("Exam coming up? Let Plany plan it.", "عندك امتحان؟ خلّي بلاني يرتّبهولك.")}</span>
        <span style={{ display: "block", fontFamily: bodyFont(lang), fontSize: 13, opacity: 0.88, marginTop: 3, lineHeight: 1.55 }}>{t("A day-by-day plan for this course that teaches, tests and adapts to you.", "خطة يوم بيوم للمقرر ده، بتشرح وتختبر وتتغيّر على حسب مستواك.")}</span>
      </span>
      <Arrow size={18} color="#fff" />
    </button>
  );
}
