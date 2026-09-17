import { api } from "@/services/http";

export const CONFIDENCE_FILTER_LABELS = {
  HIGH: { en: "High confidence", ar: "ثقة عالية" },
  MEDIUM: { en: "Medium confidence", ar: "ثقة متوسطة" },
  LOW: { en: "Low confidence", ar: "ثقة منخفضة" },
  INSUFFICIENT_EVIDENCE: { en: "Insufficient evidence", ar: "أدلة غير كافية" },
};

export function getReview(assignmentId, params = {}) {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 100));
  if (params.studentName) query.set("studentName", params.studentName);
  if (params.confidence) query.set("confidence", params.confidence);
  if (params.approved !== undefined && params.approved !== null) query.set("approved", String(params.approved));
  return api(`/assignments/${assignmentId}/review?${query.toString()}`);
}

export function getCommonMistakes(assignmentId) {
  return api(`/assignments/${assignmentId}/common-mistakes`);
}

export function bulkApprove(assignmentId, submissionIds) {
  return api(`/assignments/${assignmentId}/bulk-approve`, { method: "POST", body: { submissionIds } });
}

export function approveSubmission(submissionId) {
  return api(`/submissions/${submissionId}/approve`, { method: "POST" });
}

export function editSubmission(submissionId, score, feedback) {
  const body = { score: Number(score) };
  if (feedback) body.feedback = feedback;
  return api(`/submissions/${submissionId}/edit`, { method: "POST", body });
}

export function rejectSubmission(submissionId, score, feedback) {
  const body = { score: Number(score) };
  if (feedback) body.feedback = feedback;
  return api(`/submissions/${submissionId}/reject`, { method: "POST", body });
}

export function requestResubmission(submissionId, reason) {
  return api(`/submissions/${submissionId}/request-resubmission`, { method: "POST", body: { reason } });
}

export function getSubmissionDetail(submissionId) {
  return api(`/submissions/${submissionId}`);
}

export function previewEvaluation(assignmentId, questionId, trialAnswer) {
  return api(`/assignments/${assignmentId}/questions/${questionId}/preview-evaluation`, {
    method: "POST",
    body: { trialAnswer },
  });
}
