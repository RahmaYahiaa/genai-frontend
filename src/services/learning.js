import { api } from "@/services/http";
// ── AI learning engine bridge: user-scoped AI state ───────────────────────
// These call our backend; no AI-service credentials ever reach the client.
export function getMyLearning() {
  return api("/students/me/learning");
}

export function recordConceptReview(concept, remembered) {
  return api("/students/me/learning/review", { method: "POST", body: { concept, remembered } });
}

export function getAiPreferences() {
  return api("/students/me/ai-preferences");
}

export function updateAiPreferences(body) {
  return api("/students/me/ai-preferences", { method: "PATCH", body });
}

export function getAiHealth() {
  return api("/students/me/ai-health");
}


export const TUTOR_MODE_LABELS = {
  explanation: { en: "Explanation", ar: "شرح" },
  worked_example: { en: "Worked example", ar: "مثال محلول" },
  summary: { en: "Summary", ar: "ملخص" },
  revision: { en: "Revision", ar: "مراجعة" },
  coding_help: { en: "Coding help", ar: "مساعدة برمجية" },
  guided_questioning: { en: "Guided questioning", ar: "أسئلة موجّهة" },
  practice: { en: "Practice", ar: "تمرين" },
};

export const CHANGE_LABELS = {
  improved: { en: "Improved", ar: "تحسّن" },
  declined: { en: "Declined", ar: "تراجع" },
  unchanged: { en: "Unchanged", ar: "ثابت" },
  no_reassessment_yet: { en: "No baseline yet", ar: "لسه مفيش خط أساس" },
};

export function getLearnerModel(courseId) {
  return api(`/courses/${courseId}/learner-model`);
}

export function getLearnerProfile(courseId) {
  return api(`/courses/${courseId}/learner-profile`);
}

export function startDiagnostic(courseId, body = {}) {
  return api(`/courses/${courseId}/diagnostics`, { method: "POST", body });
}

export function getDiagnostic(courseId, diagnosticId) {
  return api(`/courses/${courseId}/diagnostics/${diagnosticId}`);
}

export function submitDiagnosticAnswer(courseId, diagnosticId, body) {
  return api(`/courses/${courseId}/diagnostics/${diagnosticId}/answers`, { method: "POST", body });
}

export function getDiagnosticEvidence(courseId, diagnosticId) {
  return api(`/courses/${courseId}/diagnostics/${diagnosticId}/evidence`);
}

export function listTutorSessions(courseId) {
  return api(`/courses/${courseId}/tutor/sessions`);
}

export function createTutorSession(courseId, body) {
  return api(`/courses/${courseId}/tutor/sessions`, { method: "POST", body });
}

export function renameTutorSession(courseId, sessionId, title) {
  return api(`/courses/${courseId}/tutor/sessions/${sessionId}`, { method: "PATCH", body: { title } });
}

export function deleteTutorSession(courseId, sessionId) {
  return api(`/courses/${courseId}/tutor/sessions/${sessionId}`, { method: "DELETE" });
}

export function getTutorSession(courseId, sessionId) {
  return api(`/courses/${courseId}/tutor/sessions/${sessionId}`);
}

export function sendTutorMessage(courseId, sessionId, content, materialIds = null) {
  const body = { content };
  // EDUNation "Use materials" parity: an explicit student scoping choice.
  if (Array.isArray(materialIds) && materialIds.length > 0) body.materialIds = materialIds;
  return api(`/courses/${courseId}/tutor/sessions/${sessionId}/messages`, { method: "POST", body });
}

export function listPracticeSessions(courseId) {
  return api(`/courses/${courseId}/practice/sessions`);
}

export function listDiagnostics(courseId) {
  return api(`/courses/${courseId}/diagnostics`);
}

export function createPracticeSession(courseId, body) {
  return api(`/courses/${courseId}/practice/sessions`, { method: "POST", body });
}

export function getPracticeSession(courseId, sessionId) {
  return api(`/courses/${courseId}/practice/sessions/${sessionId}`);
}

export function submitPracticeAnswer(courseId, sessionId, body) {
  return api(`/courses/${courseId}/practice/sessions/${sessionId}/answers`, { method: "POST", body });
}

export function listReassessments(courseId) {
  return api(`/courses/${courseId}/reassessments`);
}

export function createReassessment(courseId, body) {
  return api(`/courses/${courseId}/reassessments`, { method: "POST", body });
}

export function getReassessment(courseId, sessionId) {
  return api(`/courses/${courseId}/reassessments/${sessionId}`);
}

export function submitReassessmentAnswer(courseId, sessionId, body) {
  return api(`/courses/${courseId}/reassessments/${sessionId}/answers`, { method: "POST", body });
}

export function getLearningGain(courseId) {
  return api(`/courses/${courseId}/learning-gain`);
}
