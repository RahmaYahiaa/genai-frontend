import { SCREENS, ROLES } from "@/constants/routes";

export const ROLE_TABS = [
  { id: ROLES.STUDENT, en: "Student", ar: "طالب" },
  { id: ROLES.INSTRUCTOR, en: "Instructor", ar: "مدرّس" },
  { id: ROLES.ADMIN, en: "Admin", ar: "أدمن" },
];

export const REGISTER_ROLES = ROLE_TABS.filter((r) => r.id !== ROLES.ADMIN);

export const INSTITUTIONS = ["MIT", "Stanford", "Oxford", "KAUST", "AUB"];

export const PREVIEW_SCREENS = [
  { id: SCREENS.DASHBOARD, label: "Dashboard" },
  { id: SCREENS.TUTOR, label: "AI Tutor" },
  { id: SCREENS.DIAGNOSTIC, label: "Diagnostic" },
  { id: SCREENS.INSTRUCTOR, label: "Instructor" },
  { id: SCREENS.ADMIN, label: "Admin" },
];

export const REGISTER_FEATURES = [
  {
    en: "Knowledge Diagnostics",
    ar: "تشخيص المعرفة",
    enDesc: "Pinpoint exactly what you know and do not",
    arDesc: "حدّد بدقة ما تعرفه وما لا تعرفه",
  },
  {
    en: "Grounded AI Tutor",
    ar: "معلّم ذكي موثّق",
    enDesc: "Explanations tied to your actual course materials",
    arDesc: "شروحات مرتبطة بمقرراتك الفعلية",
  },
  {
    en: "Provable Growth",
    ar: "نمو قابل للإثبات",
    enDesc: "Before/after mastery scores with full evidence trail",
    arDesc: "درجات الإتقان قبل/بعد مع سجل أدلة كامل",
  },
];
