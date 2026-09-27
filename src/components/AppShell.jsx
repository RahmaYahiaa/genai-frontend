import { useState } from "react";
import { tk } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Toaster } from "./ModuleUI";
import { SCREENS } from "@/constants/routes";

/** Quiet reminder for accounts that have not confirmed their email yet. */
function VerifyEmailBar({ state, dispatch, tokens }) {
  const [hidden, setHidden] = useState(() => typeof sessionStorage !== "undefined" && sessionStorage.getItem("genai-verify-bar") === "hidden");
  if (hidden || state.user?.emailVerified !== false) return null;
  const t = (en, ar) => (state.lang === "ar" ? ar : en);
  const hide = () => { sessionStorage.setItem("genai-verify-bar", "hidden"); setHidden(true); };
  return (
    <div role="status" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "10px 20px", background: tokens.primaryLight, borderBottom: `1px solid ${tokens.cardBorder}`, fontSize: 13, color: tokens.textPrimary }}>
      <span style={{ flex: "1 1 240px" }}>{t("Confirm your email to unlock everything, like joining university courses.", "أكّد بريدك عشان تفتح كل الخصائص، زي الاشتراك في مقررات الجامعة.")}</span>
      <button type="button" onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.VERIFY_EMAIL })} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: tokens.primaryBtn ?? tokens.primary, color: "white", fontWeight: 650, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>{t("Confirm now", "أكّد دلوقتي")}</button>
      <button type="button" onClick={hide} aria-label={t("Hide", "إخفاء")} style={{ background: "none", border: "none", cursor: "pointer", color: tokens.textMuted, fontSize: 18, lineHeight: 1, padding: 4 }}>×</button>
    </div>
  );
}

export default function AppShell({ state, dispatch, role = "student", children }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const mobile = useMediaQuery("(max-width: 760px)");
  const [drawer, setDrawer] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("genai-sidebar-collapsed") === "1"; } catch { return false; }
  });
  const toggleCollapsed = () => setCollapsed((v) => {
    try { localStorage.setItem("genai-sidebar-collapsed", v ? "0" : "1"); } catch { /* storage unavailable */ }
    return !v;
  });

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: isRtl ? "row-reverse" : "row",
        overflow: "hidden",
        direction: isRtl ? "rtl" : "ltr",
      }}
    >
      {mobile ? (
        drawer ? (
          <>
            <div
              onClick={() => setDrawer(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(10,14,35,0.55)",
                zIndex: 40,
              }}
            />
            <div style={{ position: "fixed", insetInlineStart: 0, top: 0, bottom: 0, zIndex: 50, display: "flex" }}>
              <Sidebar state={state} dispatch={dispatch} role={role} onNavigate={() => setDrawer(false)} />
            </div>
          </>
        ) : null
      ) : (
        <Sidebar state={state} dispatch={dispatch} role={role} collapsed={collapsed} onToggle={toggleCollapsed} />
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Topbar state={state} dispatch={dispatch} role={role} onMenu={mobile ? () => setDrawer((v) => !v) : undefined} />
        <VerifyEmailBar state={state} dispatch={dispatch} tokens={tokens} />
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            background: tokens.bg,
            transition: "background 200ms ease",
          }}
        >
                   {children}
        </main>
      </div>

      <Toaster tokens={tokens} lang={lang} />
    </div>
  );
}