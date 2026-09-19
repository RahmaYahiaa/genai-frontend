import AppProvider from "@/store/AppProvider";
import { InstructorModuleProvider } from "@/store/InstructorProvider";
import AdminProvider from "@/store/AdminProvider";
import { useApp } from "@/store/useApp";
import { SCREENS, ROLES } from "@/constants/routes";
import WelcomePage from "@/pages/WelcomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import CoursesPage from "@/pages/CoursesPage";
import StudentBrowseCoursesPage from "@/pages/StudentBrowseCoursesPage";
import MasteryPage from "@/pages/MasteryPage";
import TutorPage from "@/pages/TutorPage";
import DiagnosticPage from "@/pages/DiagnosticPage";
import PracticePage from "@/pages/PracticePage";
import ReassessmentPage from "@/pages/ReassessmentPage";
import ProfilePage from "@/pages/ProfilePage";
import InstructorHomePage from "@/pages/InstructorHomePage";
import CourseWorkspacePage from "@/pages/CourseWorkspacePage";
import AssignmentBuilderPage from "@/pages/AssignmentBuilderLegacy";
import AssignmentReviewPage from "@/pages/AssignmentReviewPage";
import InstructorStudentsPage from "@/pages/InstructorStudentsPage";
import ContentStudioPage from "@/pages/ContentStudioPage";
import StudentAssignmentsPage from "@/pages/StudentAssignmentsLegacy";
import StudentAssignmentPage from "@/pages/StudentAssignmentLegacy";
import StudentCoursePage from "@/pages/StudentCoursePage";
import AdminHealthPage from "@/pages/admin/AdminHealthPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminOfficersPage from "@/pages/admin/AdminOfficersPage";
import AdminBulkImportPage from "@/pages/admin/AdminBulkImportPage";
import AdminRequestsPage from "@/pages/admin/AdminRequestsPage";
import AdminLinkAccountsPage from "@/pages/admin/AdminLinkAccountsPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import AdminAuditPage from "@/pages/admin/AdminAuditPage";
import AdminAnalyticsPage from "@/pages/admin/AdminAnalyticsPage";
import AppShell from "@/components/AppShell";
import "./App.css";

const PAGES = {
  [SCREENS.INSTRUCTOR_HOME]: InstructorHomePage,
  [SCREENS.COURSE_WORKSPACE]: CourseWorkspacePage,
  [SCREENS.ASSIGNMENT_CREATE]: AssignmentBuilderPage,
  [SCREENS.ASSIGNMENT_REVIEW]: AssignmentReviewPage,
  [SCREENS.INSTRUCTOR_STUDENTS]: InstructorStudentsPage,
  [SCREENS.CONTENT_STUDIO]: ContentStudioPage,
  [SCREENS.STUDENT_ASSIGNMENTS]: StudentAssignmentsPage,
  [SCREENS.STUDENT_ASSIGNMENT]: StudentAssignmentPage,
  [SCREENS.STUDENT_COURSE]: StudentCoursePage,
  [SCREENS.DASHBOARD]: DashboardPage,
  [SCREENS.COURSES]: CoursesPage,
  [SCREENS.BROWSE_COURSES]: StudentBrowseCoursesPage,
  [SCREENS.MASTERY]: MasteryPage,
  [SCREENS.TUTOR]: TutorPage,
  [SCREENS.DIAGNOSTIC]: DiagnosticPage,
  [SCREENS.PRACTICE]: PracticePage,
  [SCREENS.REASSESSMENT]: ReassessmentPage,
  [SCREENS.PROFILE]: ProfilePage,
  [SCREENS.ADMIN]: AdminHealthPage,
  [SCREENS.ADMIN_USERS]: AdminUsersPage,
  [SCREENS.ADMIN_OFFICERS]: AdminOfficersPage,
  [SCREENS.ADMIN_IMPORT]: AdminBulkImportPage,
  [SCREENS.ADMIN_REQUESTS]: AdminRequestsPage,
  [SCREENS.ADMIN_LINK]: AdminLinkAccountsPage,
  [SCREENS.ADMIN_SETTINGS]: AdminSettingsPage,
  [SCREENS.ADMIN_AUDIT]: AdminAuditPage,
  [SCREENS.ADMIN_ANALYTICS]: AdminAnalyticsPage,
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
      <AdminProvider>
        <InstructorModuleProvider>
          <AppContent />
        </InstructorModuleProvider>
      </AdminProvider>
    </AppProvider>
  );
}