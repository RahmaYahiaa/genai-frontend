import { api } from "@/services/http";

// Live voice (AI Tutor, Talk mode). These calls go to our backend. The
// LernaVoice service key stays on the server; the browser only gets a
// short-lived session token.
export function getVoiceStatus() {
  return api("/voice/status");
}

export function startVoiceSession(courseId, topicId = null, { resume = false } = {}) {
  const body = { courseId, ...(topicId ? { topicId } : {}), ...(resume ? { resume: true } : {}) };
  return api("/voice/sessions", { method: "POST", body });
}

export function mintVoiceToken(sessionId) {
  return api(`/voice/sessions/${encodeURIComponent(sessionId)}/token`, { method: "POST" });
}

// Saves the lesson transcript into the student's chat history (replaces the
// messages of the same entry each time it is called).
export function saveVoiceTranscript(sessionId, turns) {
  return api(`/voice/sessions/${encodeURIComponent(sessionId)}/transcript`, { method: "POST", body: { turns } });
}
