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
} from "@/components/Icons";

import { SCREENS } from "./routes";

export const STUDENT_NAV = [
  { id: SCREENS.DASHBOARD, en: "Dashboard", ar: "لوحة التحكم", Icon: IconDashboard },
  { id: SCREENS.COURSES, en: "My Courses", ar: "مقرراتي", Icon: IconCourses },
  { id: SCREENS.STUDENT_ASSIGNMENTS, en: "Assignments", ar: "التكليفات", Icon: IconClipboard },
  { id: SCREENS.MASTERY, en: "Topics & Mastery", ar: "المواضيع والإتقان", Icon: IconMastery },
  { id: SCREENS.TUTOR, en: "AI Tutor", ar: "المعلم الذكي", Icon: IconTutor },
  { id: SCREENS.DIAGNOSTIC, en: "Diagnostic", ar: "التشخيص", Icon: IconDiagnostic },
  { id: SCREENS.PRACTICE, en: "Practice", ar: "التدريب", Icon: IconPractice },
];

export const STUDENT_NAV_BOTTOM = [
  { id: SCREENS.PROFILE, en: "Profile", ar: "الملف الشخصي", Icon: IconProfile },
];

export const INSTRUCTOR_NAV = [
  { id: SCREENS.INSTRUCTOR_HOME, en: "My Courses", ar: "مقرراتي", Icon: IconCourses },
  { id: SCREENS.INSTRUCTOR_STUDENTS, en: "Students", ar: "الطلاب", Icon: IconUsers },
  { id: SCREENS.CONTENT_STUDIO, en: "Content Studio", ar: "استوديو المحتوى", Icon: IconSparkle },
];

export const ADMIN_NAV = [
  { id: SCREENS.ADMIN, en: "Platform Overview", ar: "نظرة عامة", Icon: IconDashboard },
  { id: SCREENS.COURSES, en: "Courses", ar: "المقررات", Icon: IconCourses },
  { id: SCREENS.PROFILE, en: "Settings", ar: "الإعدادات", Icon: IconProfile },
];

export function navForRole(role) {
  if (role === "instructor") return INSTRUCTOR_NAV;
  if (role === "admin") return ADMIN_NAV;
  return STUDENT_NAV;
}

export function navBottomForRole(role) {
  return role === "student" ? STUDENT_NAV_BOTTOM : [];
}