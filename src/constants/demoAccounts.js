import { SCREENS } from "@/constants/routes";

/**
 * Ready-made accounts for presentations and reviewers.
 * They come from the backend seeders (`npm run seed -- --reset`, `npm run seed:admin`,
 * optionally `npm run seed:demo` for realistic progress data).
 * Hide the panel in production with VITE_SHOW_DEMO_ACCOUNTS=false.
 */
export const DEMO_PASSWORD = "Passw0rd1";

export const SHOW_DEMO_ACCOUNTS = String(import.meta.env.VITE_SHOW_DEMO_ACCOUNTS ?? "true").toLowerCase() !== "false";

export const DEMO_GUIDE_KEY = "lerna-demo-guide";

export const DEMO_ACCOUNTS = [
  {
    id: "personal",
    email: "sara.mitchell@gmail.com",
    name: "Sara Mitchell",
    en: "Independent learner",
    ar: "طالب مستقل",
    tagEn: "Personal account",
    tagAr: "حساب شخصي",
    descEn: "Studies on her own with her own files and the AI tutor.",
    descAr: "بيذاكر لوحده بملفاته ومع المعلم الذكي.",
    accent: "#0F8A6B",
    steps: [
      { screen: SCREENS.COURSES, en: "Open a course and its files", ar: "افتح مقرر وملفاته" },
      { screen: SCREENS.TUTOR, en: "Ask the AI tutor anything", ar: "اسأل المعلم الذكي أي سؤال" },
      { screen: SCREENS.STUDY_TOOLS, en: "Make a summary or flashcards", ar: "اعمل ملخص أو بطاقات مراجعة" },
      { screen: SCREENS.PRACTICE, en: "Practice, then see My Progress", ar: "اتدرب وبعدين شوف تقدّمي" },
    ],
  },
  {
    id: "university",
    email: "farida@menoufia.edu.eg",
    name: "Farida Mohamed",
    en: "University student",
    ar: "طالب جامعي",
    tagEn: "Menoufia University",
    tagAr: "جامعة المنوفية",
    descEn: "Joins her university's courses and hands in assignments.",
    descAr: "بيشترك في مقررات جامعته وبيسلّم التكليفات.",
    accent: "#1B4DA8",
    steps: [
      { screen: SCREENS.COURSES, en: "See university courses", ar: "شوف مقررات الجامعة" },
      { screen: SCREENS.BROWSE_COURSES, en: "Find and join a course", ar: "دوّر على مقرر واطلب الانضمام" },
      { screen: SCREENS.STUDENT_ASSIGNMENTS, en: "Open and submit an assignment", ar: "افتح تكليف وسلّمه" },
      { screen: SCREENS.DIAGNOSTIC, en: "Check your level", ar: "اعرف مستواك" },
    ],
  },
  {
    id: "instructor",
    email: "hassan.farid@menoufia.edu.eg",
    name: "Dr. Hassan Farid",
    en: "Instructor",
    ar: "عضو هيئة تدريس",
    tagEn: "Menoufia University",
    tagAr: "جامعة المنوفية",
    descEn: "Teaches two courses, builds content and reviews students.",
    descAr: "بيدرّس مقررين، بيعمل محتوى وبيتابع الطلاب.",
    accent: "#7A4BC2",
    steps: [
      { screen: SCREENS.INSTRUCTOR_COURSES, en: "Open a course, upload files", ar: "افتح مقرر وارفع ملفات" },
      { screen: SCREENS.INSTRUCTOR_COURSES, en: "Create an assignment with AI", ar: "اعمل تكليف بالذكاء الاصطناعي" },
      { screen: SCREENS.CONTENT_STUDIO, en: "Generate teaching content", ar: "اعمل محتوى تعليمي" },
      { screen: SCREENS.INSTRUCTOR_STUDENTS, en: "See who needs help", ar: "شوف مين محتاج مساعدة" },
    ],
  },
  {
    id: "admin",
    email: "admin@menoufia.edu.eg",
    name: "University admin",
    en: "Institution admin",
    ar: "إدارة المؤسسة",
    tagEn: "Menoufia University",
    tagAr: "جامعة المنوفية",
    descEn: "Manages courses, people, join requests and settings.",
    descAr: "بيدير المقررات والمستخدمين وطلبات الانضمام والإعدادات.",
    accent: "#B4540A",
    steps: [
      { screen: SCREENS.ADMIN, en: "Institution overview", ar: "نظرة عامة على المؤسسة" },
      { screen: SCREENS.ADMIN_COURSES, en: "Courses and staff", ar: "المقررات والمدرّسين" },
      { screen: SCREENS.ADMIN_REQUESTS, en: "Approve a join request", ar: "وافق على طلب انضمام" },
      { screen: SCREENS.ADMIN_USERS, en: "Users and roles", ar: "المستخدمين والأدوار" },
    ],
  },
];

export function demoAccountById(id) {
  return DEMO_ACCOUNTS.find((a) => a.id === id) ?? null;
}
