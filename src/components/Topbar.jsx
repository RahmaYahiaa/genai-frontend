import { tk, MONO } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import { getCourse } from "@/data/courses";
import { IconBell, IconGlobe, IconSun, IconMoon, IconSignOut, IconMenu } from "./Icons";

const TOPBAR_H = 44;

export default function Topbar({ state, dispatch, role, onMenu }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const mobile = useMediaQuery("(max-width: 760px)");
  const course = getCourse("CS301");

  const contextLabel =
    role === "instructor"
      ? lang === "ar"
        ? `لوحة تحكم المدرّس — ${course.id}`
        : `Instructor Dashboard — ${course.id}`
      : lang === "ar"
        ? `${course.id} · الأسبوع ${course.week}`
        : `${course.id} · Week ${course.week}`;

  const iconBtn = {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: `1px solid ${tokens.cardBorder}`,
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: tokens.textMuted,
    flexShrink: 0,
  };

  return (
    <header
      style={{
        height: TOPBAR_H,
        background: state.dark ? "rgba(10,14,35,0.95)" : "rgba(244,246,249,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${tokens.cardBorder}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: mobile ? "0 10px" : "0 18px",
        gap: 4,
        flexShrink: 0,
        flexDirection: isRtl ? "row-reverse" : "row",
      }}
    >
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0, textAlign: isRtl ? "right" : "left" }}>
        {onMenu && (
          <button aria-label="open-menu" title={lang === "ar" ? "القائمة" : "Menu"} onClick={onMenu} style={iconBtn}>
            <IconMenu size={16} color={tokens.textMuted} />
          </button>
        )}
        <span style={{ fontFamily: MONO, fontSize: 11, color: tokens.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {contextLabel}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button title={lang === "ar" ? "الإشعارات" : "Notifications"} style={iconBtn}>
          <IconBell size={15} color={tokens.textMuted} />
        </button>
        <button
          onClick={() => dispatch({ type: "SET_LANG", lang: lang === "en" ? "ar" : "en" })}
          title={lang === "en" ? "العربية" : "English"}
          style={iconBtn}
        >
          <IconGlobe size={15} color={tokens.textMuted} />
        </button>
        <button
          onClick={() => dispatch({ type: "TOGGLE_THEME" })}
          title={state.dark ? (lang === "ar" ? "الوضع النهاري" : "Light Mode") : lang === "ar" ? "الوضع الليلي" : "Dark Mode"}
          style={iconBtn}
        >
          {state.dark ? <IconSun size={15} color={tokens.textMuted} /> : <IconMoon size={15} color={tokens.textMuted} />}
        </button>
        <button
          onClick={() => dispatch({ type: "RESET" })}
          title={lang === "ar" ? "تسجيل الخروج" : "Sign out"}
          aria-label={lang === "ar" ? "تسجيل الخروج" : "Sign out"}
          style={iconBtn}
        >
          <IconSignOut size={15} color={tokens.textMuted} />
        </button>
      </div>
    </header>
  );
}