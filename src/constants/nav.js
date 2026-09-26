import {
  IconDashboard,
  IconCourses,
  IconTutor,
  IconDiagnostic,
  IconMastery,
  IconPractice,
  IconReassessment,
  IconProfile,
  IconUsers,
  IconSparkle,
  IconClipboard,
  IconGlobe,
  IconBookOpen,
  IconAnchor,
  IconGear,
  IconHistory,
  IconTrendUp,
} from "@/components/Icons";
import { SCREENS } from "./routes";

// Student navigation is grouped around the learning journey:
// Home → my courses/work → the study loop (check level → learn → practice → re-check) → progress.
// Student nav in plain language, grouped by what the student wants to do.
export const STUDENT_NAV = [
  { id: SCREENS.DASHBOARD, en: "Home", ar: "الرئيسية", Icon: IconDashboard },
  { section: { en: "My studies", ar: "دراستي" } },
  { id: SCREENS.COURSES, en: "My Courses", ar: "مقرراتي", Icon: IconCourses, match: [SCREENS.STUDENT_COURSE, SCREENS.BROWSE_COURSES] },
  { id: SCREENS.STUDENT_ASSIGNMENTS, en: "Assignments", ar: "التكليفات", Icon: IconClipboard, match: [SCREENS.STUDENT_ASSIGNMENT] },
  { section: { en: "Learn", ar: "اتعلّم" } },
  { id: SCREENS.TUTOR, en: "AI Tutor", ar: "المعلم الذكي", Icon: IconTutor },
  { id: SCREENS.STUDY_TOOLS, en: "Study Tools", ar: "أدوات المذاكرة", Icon: IconSparkle },
  { id: SCREENS.MASTERY, en: "My Progress", ar: "تقدّمي", Icon: IconMastery },
  { section: { en: "Test yourself", ar: "اختبر نفسك" } },
  { id: SCREENS.DIAGNOSTIC, en: "Check my level", ar: "اعرف مستواك", Icon: IconDiagnostic },
  { id: SCREENS.PRACTICE, en: "Practice", ar: "تدرّب", Icon: IconPractice },
  { id: SCREENS.REASSESSMENT, en: "Measure progress", ar: "قيس تقدّمك", Icon: IconReassessment },
];

export const STUDENT_NAV_BOTTOM = [
  { id: SCREENS.PROFILE, en: "Profile", ar: "الملف الشخصي", Icon: IconProfile },
];

export const INSTRUCTOR_NAV = [
  { id: SCREENS.INSTRUCTOR_HOME, en: "My Courses", ar: "مقرراتي", Icon: IconCourses },
  { id: SCREENS.INSTRUCTOR_STUDENTS, en: "Students", ar: "الطلاب", Icon: IconUsers },
  { id: SCREENS.CONTENT_STUDIO, en: "Content Builder", ar: "صانع المحتوى", Icon: IconSparkle },
];

export const ADMIN_NAV = [
  { id: SCREENS.ADMIN, en: "Institution Health", ar: "صحة المؤسسة", Icon: IconGlobe },
  { id: SCREENS.ADMIN_COURSES, en: "Courses", ar: "المقررات", Icon: IconBookOpen },
  { id: SCREENS.ADMIN_USERS, en: "Users", ar: "المستخدمون", Icon: IconUsers, gate: "users.view" },
  { id: SCREENS.ADMIN_OFFICERS, en: "Officers & Permissions", ar: "المسؤولون والصلاحيات", Icon: IconSparkle, gate: "super" },
  { id: SCREENS.ADMIN_IMPORT, en: "Bulk Invitations", ar: "الإدخال الجماعي", Icon: IconClipboard, gate: "bulk.import" },
  { id: SCREENS.ADMIN_REQUESTS, en: "Out-of-Year Requests", ar: "طلبات خارج السنة", Icon: IconProfile, gate: "requests.review" },
  { id: SCREENS.ADMIN_LINK, en: "Account Linking", ar: "ربط الحسابات", Icon: IconAnchor, gate: "accounts.link" },
  { id: SCREENS.ADMIN_SETTINGS, en: "Settings", ar: "الإعدادات", Icon: IconGear, gate: "settings.manage" },
  { id: SCREENS.ADMIN_AUDIT, en: "Audit Log", ar: "سجل التدقيق", Icon: IconHistory, gate: "audit.view" },
  { id: SCREENS.ADMIN_ANALYTICS, en: "Analytics", ar: "التحليلات", Icon: IconTrendUp, gate: "analytics.view" },
];

export function navForRole(role, accountType) {
  if (role === "instructor") return INSTRUCTOR_NAV;
  if (role === "admin") return ADMIN_NAV;
  if (accountType === "individual") {
    // Individual accounts have no institution catalog and no institutional assignments —
    // both entries appear only after linking flips accountType to "institutional".
    return STUDENT_NAV.filter((item) => item.id !== SCREENS.STUDENT_ASSIGNMENTS && item.id !== SCREENS.BROWSE_COURSES);
  }
  return STUDENT_NAV;
}

export function navBottomForRole(role) {
  return role === "student" ? STUDENT_NAV_BOTTOM : [];
}