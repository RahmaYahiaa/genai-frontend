import { tk, headingFont } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import { navForRole, navBottomForRole } from "@/constants/nav";
import { demoMode } from "@/services/auth";
import { DEMO_USER } from "@/data/user";
import { INSTRUCTOR_NAME } from "@/data/instructorModule";
import { useAdmin } from "@/store/admin-context";
import BrandMark from "./BrandMark";

const MONO = "'JetBrains Mono', monospace";
const SIDEBAR_W = 220;

function PanelIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="3" /><path d="M9 4v16" />
    </svg>
  );
}

export default function Sidebar({ state, dispatch, role, onNavigate, collapsed = false, onToggle = null }) {
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = headingFont(lang);
  const admin = useAdmin();
  let nav = navForRole(role, state.user?.accountType);
  if (role === "admin") {
    nav = nav.filter((item) => !item.gate || (item.gate === "super" ? admin.isSuperAdmin : admin.hasScope(item.gate)));
  }
  const navBottom = navBottomForRole(role);
  const activeScreen = state.screen;

  const navItem = (item, index) => {
    if (item.section) {
      if (collapsed) return <div key={`section-${index}`} style={{ height: 1, background: tokens.sidebarBorder, margin: "10px 8px" }} />;
      return (
        <div key={`section-${index}`} style={{ padding: "16px 12px 6px", fontSize: 11, fontWeight: 600, color: tokens.textFaint, textAlign: isRtl ? "right" : "left" }}>
          {lang === "ar" ? item.section.ar : item.section.en}
        </div>
      );
    }
    const isActive = activeScreen === item.id || (item.match ?? []).includes(activeScreen);
    const label = lang === "ar" ? item.ar : item.en;
    return (
      <button
        key={item.id}
        onClick={() => {
          dispatch({ type: "NAVIGATE", screen: item.id });
          onNavigate?.();
        }}
        title={label}
        aria-label={label}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          width: "100%",
          padding: collapsed ? "9px 0" : "9px 12px",
          justifyContent: collapsed ? "center" : "flex-start",
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
        {!collapsed && <span style={{ flex: 1 }}>{label}</span>}

      </button>
    );
  };

  return (
    <aside
      style={{
        width: mobile ? "min(78vw, 260px)" : collapsed ? 64 : SIDEBAR_W,
        transition: "width 180ms ease",
        overflow: "hidden",
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
          padding: collapsed ? "14px 0 12px" : "14px 12px 12px 16px",
          borderBottom: `1px solid ${tokens.sidebarBorder}`,
        }}
      >
        {!collapsed && <BrandMark size={28} />}
        {!collapsed && (
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: 18, lineHeight: 1, color: tokens.textPrimary, letterSpacing: "-0.01em" }}>Lerna</div>
            {role !== "student" && <div style={{ fontFamily: MONO, fontSize: 7.5, color: tokens.textFaint, letterSpacing: "0.12em" }}>LEARN SMARTER</div>}
          </div>
        )}
        {onToggle && (
          <button type="button" onClick={onToggle}
            title={collapsed ? (lang === "ar" ? "افتح القائمة" : "Open sidebar") : (lang === "ar" ? "اقفل القائمة" : "Close sidebar")}
            aria-label={collapsed ? (lang === "ar" ? "افتح القائمة" : "Open sidebar") : (lang === "ar" ? "اقفل القائمة" : "Close sidebar")}
            aria-expanded={!collapsed}
            style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", margin: collapsed ? "0 auto" : 0 }}>
            <PanelIcon color={tokens.textMuted} />
          </button>
        )}
      </div>

      <div style={{ padding: "10px 16px 4px", display: role === "student" || collapsed ? "none" : "block" }}>
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
        {nav.map((item, index) => navItem(item, index))}
      </nav>

      {navBottom.length > 0 && (
        <div style={{ padding: "4px 8px 10px" }}>{navBottom.map((item) => navItem(item))}</div>
      )}

      <div
        style={{
          margin: "0 8px 10px",
          padding: collapsed ? "8px 0" : "10px 10px",
          justifyContent: "center",
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
          {!demoMode() && state.user?.initials
            ? state.user.initials
            : role === "instructor"
              ? "NM"
              : DEMO_USER.initials}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: collapsed ? "none" : "block" }}>
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
            {!demoMode() && state.user
              ? state.user.name?.[lang] || state.user.email
              : role === "instructor"
                ? INSTRUCTOR_NAME
                : lang === "ar"
                  ? DEMO_USER.name.ar
                  : DEMO_USER.name.en}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: tokens.textMuted }}>
            {!demoMode() && state.user?.email
              ? state.user.email
              : role === "instructor"
                ? "CS301 · CS401 · CS303"
                : DEMO_USER.enrolled.join(" · ")}
          </div>
        </div>
      </div>
    </aside>
  );
}