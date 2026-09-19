export const PERMISSION_LABELS = {
  "users.view": { en: "View institution users", ar: "عرض مستخدمي المؤسسة" },
  "users.manage": { en: "Activate, deactivate and edit users", ar: "تفعيل وتعطيل وتعديل المستخدمين" },
  "bulk.import": { en: "Run bulk invitations", ar: "تشغيل الإدخال الجماعي والدعوات" },
  "requests.review": { en: "Decide out-of-year requests", ar: "البت في طلبات خارج السنة" },
  "accounts.link": { en: "Send individual-account link invitations", ar: "إرسال دعوات ربط الحسابات الفردية" },
  "settings.manage": { en: "Edit institution settings", ar: "تعديل إعدادات المؤسسة" },
  "audit.view": { en: "View the institution audit log", ar: "عرض سجل تدقيق المؤسسة" },
  "analytics.view": { en: "View platform-wide analytics", ar: "عرض تحليلات المنصة" },
};

export const PERMISSION_KEYS = Object.keys(PERMISSION_LABELS);

export const TEMPLATE_LABELS = {
  "tpl-admissions": {
    en: "Admissions officer",
    ar: "مسؤول قبول",
    descEn: "Approves out-of-year enrollment requests, runs bulk invitations and links individual accounts.",
    descAr: "يوافق على طلبات التسجيل خارج السنة ويشغّل الإدخال الجماعي ويربط الحسابات الفردية.",
  },
  "tpl-content": {
    en: "Content officer",
    ar: "مسؤول محتوى",
    descEn: "Watches coverage gaps and AI-grounding policy across the whole academic structure.",
    descAr: "يراقب فجوات التغطية وسياسة محتوى الذكاء الاصطناعي عبر الهيكل الأكاديمي كله.",
  },
};

export const BACKEND_ROLE_TO_KIND = {
  student: "student",
  instructor: "doctor",
  institution_admin: "officer",
};

export const KIND_TO_BACKEND_ROLE = {
  student: "student",
  doctor: "instructor",
  officer: "institution_admin",
};

export const KIND_LABELS = {
  student: { en: "Student", ar: "طالب" },
  doctor: { en: "Doctor", ar: "دكتور" },
  officer: { en: "Officer", ar: "مسؤول" },
};

export const AUDIT_TYPE_LABELS = {
  "user.activated": { en: "Account activated", ar: "تفعيل حساب" },
  "user.deactivated": { en: "Account deactivated", ar: "تعطيل حساب" },
  "role.changed": { en: "Role changed", ar: "تغيير دور" },
  "permissions.changed": { en: "Officer permissions edited", ar: "تعديل صلاحيات مسؤول" },
  "officer.added": { en: "Officer added", ar: "إضافة مسؤول" },
  "bulk.imported": { en: "Bulk import executed", ar: "تنفيذ إدخال جماعي" },
  "request.decided": { en: "Join request decided", ar: "البت في طلب انضمام" },
  "settings.changed": { en: "Institution settings changed", ar: "تعديل إعدادات المؤسسة" },
  "account.linked": { en: "Individual account linked", ar: "ربط حساب فردي" },
};
