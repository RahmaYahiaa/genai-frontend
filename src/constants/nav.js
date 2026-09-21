import {
  IconDashboard,
  IconCourses,
  IconMastery,
  IconTutor,
  IconDiagnostic,
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

export const STUDENT_NAV = [
  { id: SCREENS.DASHBOARD, en: "Dashboard", ar: "لوحة التحكم", Icon: IconDashboard },
  { id: SCREENS.COURSES, en: "My Courses", ar: "مقرراتي", Icon: IconCourses },
  { id: SCREENS.BROWSE_COURSES, en: "Browse institution courses", ar: "استعرض مقررات المؤسسة", Icon: IconBookOpen },
  { id: SCREENS.STUDENT_ASSIGNMENTS, en: "Assignments", ar: "التكليفات", Icon: IconClipboard },
  { id: SCREENS.MASTERY, en: "Topics & Mastery", ar: "المواضيع والإتقان", Icon: IconMastery },
  { id: SCREENS.TUTOR, en: "AI Tutor", ar: "المعلم الذكي", Icon: IconTutor },
  { id: SCREENS.DIAGNOSTIC, en: "Diagnostic", ar: "التشخيص", Icon: IconDiagnostic },
  { id: SCREENS.PRACTICE, en: "Practice", ar: "التدريب", Icon: IconPractice },
  { id: SCREENS.REASSESSMENT, en: "Reassessment", ar: "إعادة التقييم", Icon: IconReassessment },
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