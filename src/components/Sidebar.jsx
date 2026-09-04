import { tk, headingFont } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import { navForRole, navBottomForRole } from "@/constants/nav";
import { DEMO_USER } from "@/data/user";
import BrandMark from "./BrandMark";

const MONO = "'JetBrains Mono', monospace";
const SIDEBAR_W = 220;

export default function Sidebar({ state, dispatch, role, onNavigate }) {
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = headingFont(lang);
  const nav = navForRole(role);
  const navBottom = navBottomForRole(role);
  const activeScreen = state.screen;

  const navItem = (item) => {
    const isActive = activeScreen === item.id;
    const label = lang === "ar" ? item.ar : item.en;
    return (
      <button
        key={item.id}
        onClick={() => {
          dispatch({ type: "NAVIGATE", screen: item.id });
          onNavigate?.();
        }}
        title={label}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          width: "100%",
          padding: "9px 12px",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          marginBottom: 2,
          background: isActive ? tokens.sidebarActive : "transparent",
          color: isActive ? tokens.primary : tokens.textMuted,
          fontWeight: isActive ? 600 : 500,
          fontSize: 13,
          textAlign: isRtl ? "right" : "left",
          fontFamily: "'Inter', sans-serif",
          flexDirection: isRtl ? "row-reverse" : "row",
        }}
      >
        <item.Icon size={17} color={isActive ? tokens.primary : tokens.textMuted} />
        <span style={{ flex: 1 }}>{label}</span>
        {isActive && (
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: tokens.primary }} />
        )}
      </button>
    );
  };

  return (
    <aside
      style={{
        width: mobile ? "min(78vw, 260px)" : SIDEBAR_W,
        flexShrink: 0,
        background: tokens.sidebar,
        borderRight: isRtl ? "none" : `1px solid ${tokens.sidebarBorder}`,
        borderLeft: isRtl ? `1px solid ${tokens.sidebarBorder}` : "none",
        display: "flex",
        flexDirection: "column",
      }}
    >

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "14px 16px 12px",
          borderBottom: `1px solid ${tokens.sidebarBorder}`,
        }}
      >
        <BrandMark size={26} />
        <div>
          <div style={{ fontFamily: hFont, fontWeight: 800, fontSize: 14, color: tokens.textPrimary, letterSpacing: "-0.03em" }}>GenAI</div>
          <div style={{ fontFamily: MONO, fontSize: 7.5, color: tokens.textFaint, letterSpacing: "0.12em" }}>ACADEMIC INTELLIGENCE</div>
        </div>
      </div>

      <div style={{ padding: "10px 16px 4px" }}>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: "0.14em",
            color: tokens.textFaint,
            textTransform: "uppercase",
          }}
        >
          {role === "instructor" ? "Instructor" : role === "admin" ? "Admin" : "Student"}
        </span>
      </div>

      <nav style={{ flex: 1, padding: "4px 8px", overflowY: "auto" }}>
        {nav.map((item) => navItem(item))}
      </nav>

      {navBottom.length > 0 && (
        <div style={{ padding: "4px 8px 10px" }}>{navBottom.map((item) => navItem(item))}</div>
      )}

      <div
        style={{
          margin: "0 8px 10px",
          padding: "10px 10px",
          borderRadius: 10,
          border: `1px solid ${tokens.sidebarBorder}`,
          background: tokens.card,
          display: "flex",
          alignItems: "center",
          gap: 9,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: tokens.primaryLight,
            border: `1.5px solid ${tokens.primary}44`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: hFont,
            fontWeight: 700,
            fontSize: 11,
            color: tokens.primary,
            flexShrink: 0,
          }}
        >
          {DEMO_USER.initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: tokens.textPrimary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {lang === "ar" ? DEMO_USER.name.ar : DEMO_USER.name.en}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: tokens.textMuted }}>
            {DEMO_USER.enrolled.join(" · ")}
          </div>
        </div>
      </div>
    </aside>
  );
}