import { api } from "@/services/http";

export const AUDIT_ACTION_LABELS = {
  APPROVE: { en: "Approve", ar: "اعتماد" },
  EDIT: { en: "Edit", ar: "تعديل" },
  REJECT: { en: "Reject", ar: "رفض" },
  REQUEST_RESUBMISSION: { en: "Request resubmission", ar: "طلب إعادة تسليم" },
  TOGGLE_GRADE_VISIBILITY: { en: "Grade visibility", ar: "إظهار الدرجة" },
  TOGGLE_FEEDBACK_VISIBILITY: { en: "Feedback visibility", ar: "إظهار الفيدباك" },
};

export function getInstructorHome() {
  return api("/instructor/home");
}

export function getCourseAnalytics(courseId) {
  return api(`/courses/${courseId}/analytics`);
}

export function getCoverageGaps(courseId) {
  return api(`/courses/${courseId}/coverage-gaps`);
}

export function listCourseAudit(courseId, params = {}) {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 20));
  if (params.action) query.set("action", params.action);
  return api(`/courses/${courseId}/audit-log?${query.toString()}`);
}
