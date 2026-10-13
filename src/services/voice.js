import { api } from "@/services/http";

// Live voice (AI Tutor, Talk mode). These calls go to our backend. The
// LernaVoice service key stays on the server; the browser only gets a
// short-lived session token.
export function getVoiceStatus() {
  return api("/voice/status");
}

export function startVoiceSession(courseId, topicId = null) {
  return api("/voice/sessions", { method: "POST", body: topicId ? { courseId, topicId } : { courseId } });
}

export function mintVoiceToken(sessionId) {
  return api(`/voice/sessions/${encodeURIComponent(sessionId)}/token`, { method: "POST" });
}
