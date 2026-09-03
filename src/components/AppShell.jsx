import { tk } from "@/constants/tokens";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ state, dispatch, role = "student", children }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";

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
      <Sidebar state={state} dispatch={dispatch} role={role} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Topbar state={state} dispatch={dispatch} role={role} />
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
    </div>
  );
}