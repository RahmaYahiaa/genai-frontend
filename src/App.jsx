import AppProvider from "@/store/AppProvider";
import { useApp } from "@/store/useApp";
import { SCREENS, ROLES } from "@/constants/routes";
import WelcomePage from "@/pages/WelcomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import CoursesPage from "@/pages/CoursesPage";
import MasteryPage from "@/pages/MasteryPage";
import TutorPage from "@/pages/TutorPage";
import DiagnosticPage from "@/pages/DiagnosticPage";
import PracticePage from "@/pages/PracticePage";
import ReassessmentPage from "@/pages/ReassessmentPage";
import ProfilePage from "@/pages/ProfilePage";
import AppShell from "@/components/AppShell";
import "./App.css";

const PAGES = {
  [SCREENS.DASHBOARD]: DashboardPage,
  [SCREENS.COURSES]: CoursesPage,
  [SCREENS.MASTERY]: MasteryPage,
  [SCREENS.TUTOR]: TutorPage,
  [SCREENS.DIAGNOSTIC]: DiagnosticPage,
  [SCREENS.PRACTICE]: PracticePage,
  [SCREENS.REASSESSMENT]: ReassessmentPage,
  [SCREENS.PROFILE]: ProfilePage,
};

function AppContent() {
  const { state, dispatch } = useApp();

  if (state.screen === SCREENS.WELCOME) return <WelcomePage />;
  if (state.screen === SCREENS.LOGIN) return <LoginPage state={state} dispatch={dispatch} />;
  if (state.screen === SCREENS.REGISTER) return <RegisterPage state={state} dispatch={dispatch} />;

  const role = state.role === ROLES.INSTRUCTOR || state.role === ROLES.ADMIN ? state.role : ROLES.STUDENT;
  const ActivePage = PAGES[state.screen] ?? DashboardPage;

  return (
    <AppShell state={state} dispatch={dispatch} role={role}>
      <ActivePage state={state} dispatch={dispatch} />
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