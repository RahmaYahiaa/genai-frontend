import { api } from "@/services/http";

export function listRemedial(courseId) {
  return api(`/courses/${courseId}/remedial`);
}

export function generateRemedialDraft(courseId, body) {
  return api(`/courses/${courseId}/remedial`, { method: "POST", body });
}

export function publishRemedial(courseId, remedialId, body) {
  return api(`/courses/${courseId}/remedial/${remedialId}/publish`, { method: "POST", body });
}
