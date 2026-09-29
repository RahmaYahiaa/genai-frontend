import { SCREENS } from "@/constants/routes";

/**
 * Everything the institution can do, in plain words.
 * Used by the header menu, the home page "Services" section, the footer,
 * and the banner at the top of each page. `gate` = permission needed
 * ("super" = main admin only). `main` = shown directly in the header.
 */
export const ADMIN_SERVICES = [
  {
    id: SCREENS.ADMIN_COURSES,
    icon: "courses",
    main: true,
    nav: { en: "Courses", ar: "المقررات" },
    title: { en: "Courses and lecturers", ar: "المقررات والمحاضرين" },
    short: { en: "Create the university's courses and choose who teaches each one.", ar: "اعمل مقررات الجامعة واختار مين يدرّس كل مقرر." },
    steps: [
      { en: "Add a course with its code and year", ar: "ضيف مقرر بالكود والسنة" },
      { en: "Assign one or more lecturers", ar: "عيّن محاضر أو أكتر" },
      { en: "The lecturer gets an email and can start right away", ar: "المحاضر بيوصله إيميل ويبدأ على طول" },
    ],
  },
  {
    id: SCREENS.ADMIN_USERS,
    icon: "people",
    main: true,
    gate: "users.view",
    nav: { en: "People", ar: "الأشخاص" },
    title: { en: "Students and staff", ar: "الطلاب وأعضاء هيئة التدريس" },
    short: { en: "See everyone in the university, change roles, or pause an account.", ar: "شوف كل الناس في الجامعة، غيّر الأدوار، أو أوقف حساب." },
    steps: [
      { en: "Search by name, email or number", ar: "دوّر بالاسم أو الإيميل أو الرقم" },
      { en: "Open a person to see details", ar: "افتح الشخص وشوف بياناته" },
      { en: "Pausing or restoring an account sends them an email", ar: "إيقاف الحساب أو رجوعه بيبعت له إيميل" },
    ],
  },
  {
    id: SCREENS.ADMIN_IMPORT,
    icon: "invite",
    main: true,
    gate: "bulk.import",
    nav: { en: "Invitations", ar: "الدعوات" },
    title: { en: "Invite people from a file", ar: "دعوة الناس من ملف" },
    short: { en: "Upload a list of names and emails; each person gets an email invitation.", ar: "ارفع قائمة بالأسماء والإيميلات، وكل شخص بيوصله دعوة على إيميله." },
    steps: [
      { en: "Upload a CSV or Excel list", ar: "ارفع ملف CSV أو Excel" },
      { en: "Check the rows, then confirm", ar: "راجع الصفوف وأكّد" },
      { en: "Everyone gets a link, sets a password and finds their courses ready", ar: "كل واحد بيوصله رابط، يختار كلمة سر ويلاقي مقرراته جاهزة" },
    ],
  },
  {
    id: SCREENS.ADMIN_REQUESTS,
    icon: "requests",
    main: true,
    gate: "requests.review",
    nav: { en: "Requests", ar: "الطلبات" },
    title: { en: "Requests to join courses", ar: "طلبات الانضمام للمقررات" },
    short: { en: "Students ask to join a course outside their year; you approve or refuse.", ar: "الطلاب بيطلبوا مقرر خارج سنتهم، وإنت توافق أو ترفض." },
    steps: [
      { en: "Open a request and its attached proof", ar: "افتح الطلب والمرفق بتاعه" },
      { en: "Approve, or refuse with a short reason", ar: "وافق، أو ارفض مع سبب قصير" },
      { en: "The student gets the answer by email", ar: "الطالب بيوصله الرد على الإيميل" },
    ],
  },
  {
    id: SCREENS.ADMIN_ANALYTICS,
    icon: "reports",
    main: true,
    gate: "analytics.view",
    nav: { en: "Reports", ar: "التقارير" },
    title: { en: "Reports", ar: "التقارير" },
    short: { en: "How many students and lecturers are active, and which courses still lack material.", ar: "عدد الطلاب والمحاضرين النشطين، والمقررات اللي لسه ناقصها محتوى." },
    steps: [
      { en: "See numbers per faculty", ar: "شوف الأرقام لكل كلية" },
      { en: "Spot courses with no files", ar: "اعرف المقررات اللي مفيهاش ملفات" },
      { en: "Follow how much the AI is used", ar: "تابع استخدام الذكاء الاصطناعي" },
    ],
  },
  {
    id: SCREENS.ADMIN_LINK,
    icon: "link",
    gate: "accounts.link",
    nav: { en: "Link personal accounts", ar: "ربط الحسابات الشخصية" },
    title: { en: "Link personal accounts", ar: "ربط الحسابات الشخصية" },
    short: { en: "Students who signed up on their own can join the university, only if they agree.", ar: "الطلاب اللي سجّلوا لوحدهم يقدروا ينضموا للجامعة، بس بموافقتهم." },
    steps: [
      { en: "See personal accounts with a university email", ar: "شوف الحسابات الشخصية اللي بإيميل الجامعة" },
      { en: "Send a request", ar: "ابعت طلب" },
      { en: "The student gets an email and accepts in the app", ar: "الطالب بيوصله إيميل ويوافق من جوه الموقع" },
    ],
  },
  {
    id: SCREENS.ADMIN_OFFICERS,
    icon: "team",
    gate: "super",
    nav: { en: "Admin team", ar: "فريق الإدارة" },
    title: { en: "Admin team and permissions", ar: "فريق الإدارة والصلاحيات" },
    short: { en: "Add colleagues to help you, and choose exactly what each one can do.", ar: "ضيف زملاء يساعدوك، واختار كل واحد يقدر يعمل إيه بالظبط." },
    steps: [
      { en: "Add a colleague with a ready template", ar: "ضيف زميل بقالب جاهز" },
      { en: "They receive an email invitation", ar: "بيوصلهم دعوة على الإيميل" },
      { en: "Adjust permissions any time", ar: "عدّل الصلاحيات في أي وقت" },
    ],
  },
  {
    id: SCREENS.ADMIN_AUDIT,
    icon: "history",
    gate: "audit.view",
    nav: { en: "Activity log", ar: "سجل النشاط" },
    title: { en: "Activity log", ar: "سجل النشاط" },
    short: { en: "A permanent record of every change made by the admin team.", ar: "سجل دائم لكل تغيير عمله فريق الإدارة." },
    steps: [
      { en: "Filter by time or by type", ar: "فلتر بالوقت أو النوع" },
      { en: "Search for a person or a course", ar: "دوّر على شخص أو مقرر" },
    ],
  },
  {
    id: SCREENS.ADMIN_SETTINGS,
    icon: "settings",
    gate: "settings.manage",
    nav: { en: "Settings", ar: "الإعدادات" },
    title: { en: "Settings", ar: "الإعدادات" },
    short: { en: "Who can sign up, who can create courses, and which sources the AI may use.", ar: "مين يقدر يسجّل، مين يعمل مقررات، والذكاء الاصطناعي يستخدم أنهي مصادر." },
    steps: [
      { en: "University email domains", ar: "نطاقات إيميل الجامعة" },
      { en: "Sign-up and course creation rules", ar: "قواعد التسجيل وإنشاء المقررات" },
    ],
  },
  {
    id: SCREENS.ADMIN_PROFILE,
    icon: "building",
    gate: "settings.manage",
    nav: { en: "Institution profile", ar: "بيانات المؤسسة" },
    title: { en: "Institution profile", ar: "بيانات المؤسسة" },
    short: { en: "The name, description, faculties and contact details shown on this site.", ar: "الاسم والوصف والكليات وبيانات التواصل اللي ظاهرة في الموقع." },
    steps: [],
  },
  {
    id: SCREENS.ADMIN_STATUS,
    icon: "status",
    nav: { en: "Status and alerts", ar: "الحالة والتنبيهات" },
    title: { en: "Status and alerts", ar: "الحالة والتنبيهات" },
    short: { en: "Everything waiting for you in one place: requests, invitations, contract.", ar: "كل حاجة مستنياك في مكان واحد: الطلبات والدعوات والتعاقد." },
    steps: [],
  },
];

export function serviceAllowed(service, admin) {
  if (!service.gate) return true;
  if (service.gate === "super") return admin.isSuperAdmin;
  return admin.hasScope(service.gate);
}

export function serviceById(id) {
  return ADMIN_SERVICES.find((s) => s.id === id) ?? null;
}
