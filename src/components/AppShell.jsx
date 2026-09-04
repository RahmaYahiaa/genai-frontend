import { useState } from "react";
import { tk } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ state, dispatch, role = "student", children }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const mobile = useMediaQuery("(max-width: 760px)");
  const [drawer, setDrawer] = useState(false);

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
            <div style={{ position: "fixed", insetInlineStart: 0, top: 0, bottom: 0, zIndex: 50 }}>
              <Sidebar state={state} dispatch={dispatch} role={role} onNavigate={() => setDrawer(false)} />
            </div>
          </>
        ) : null
      ) : (
        <Sidebar state={state} dispatch={dispatch} role={role} />
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Topbar state={state} dispatch={dispatch} role={role} onMenu={mobile ? () => setDrawer((v) => !v) : undefined} />
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