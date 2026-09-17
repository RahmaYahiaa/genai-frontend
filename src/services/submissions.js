import { api } from "@/services/http";

export const SUBMISSION_STATUS_LABELS = {
  DRAFT: { en: "Draft", ar: "مسودة" },
  SUBMITTED: { en: "Submitted", ar: "تم التسليم" },
  GRADING: { en: "Grading", ar: "جاري التصحيح" },
  GRADED: { en: "Graded", ar: "تم التصحيح" },
  RESUBMISSION_REQUESTED: { en: "Resubmission requested", ar: "مطلوب إعادة تسليم" },
  FINALIZED: { en: "Finalized", ar: "معتمدة" },
};

export function saveAnswer(assignmentId, questionId, body) {
  return api(`/assignments/${assignmentId}/answers/${questionId}`, { method: "PUT", body });
}

export function submitAssignment(assignmentId) {
  return api(`/assignments/${assignmentId}/submit`, { method: "POST" });
}

export function getStudentResult(assignmentId) {
  return api(`/assignments/${assignmentId}/result`);
}
