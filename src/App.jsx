import AppProvider from "@/store/AppProvider";
import { useApp } from "@/store/useApp";
import { SCREENS, ROLES } from "@/constants/routes";
import WelcomePage from "@/pages/WelcomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ComingSoonPage from "@/pages/ComingSoonPage";
import AppShell from "@/components/AppShell";
import "./App.css";

function AppContent() {
  const { state, dispatch } = useApp();

  // Auth-free screens
  if (state.screen === SCREENS.WELCOME) return <WelcomePage />;
  if (state.screen === SCREENS.LOGIN) return <LoginPage state={state} dispatch={dispatch} />;
  if (state.screen === SCREENS.REGISTER) return <RegisterPage state={state} dispatch={dispatch} />;

  // Authenticated screens — inside the shell
  const role = state.role === ROLES.INSTRUCTOR ? ROLES.INSTRUCTOR : state.role === ROLES.ADMIN ? ROLES.ADMIN : ROLES.STUDENT;

  return (
    <AppShell state={state} dispatch={dispatch} role={role}>
      <ComingSoonPage screen={state.screen} />
    </AppShell>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}