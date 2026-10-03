import { api } from "@/services/http";

// Sanad, the study agent. All AI runs on the server (LeRna first, with a
// built-in backup), so these calls are plain requests.

/** Today's date on the student's device (YYYY-MM-DD), so days match their calendar. */
export function localToday() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(iso, n) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  const pad = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function daysUntil(iso) {
  return Math.round((new Date(`${iso}T12:00:00`) - new Date(`${localToday()}T12:00:00`)) / 86400000);
}

export function sanadChat({ message, history, courseId, language }) {
  return api("/sanad/chat", { method: "POST", body: { message, history, courseId: courseId || undefined, today: localToday(), language } });
}

export function getSanadOverview() {
  return api("/sanad/overview");
}

export function localTimezone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined; } catch { return undefined; }
}

export function createStudyPlan({ courseId, examDate, dailyMinutes, goal, language }) {
  return api("/sanad/plans", { method: "POST", body: { courseId, examDate, dailyMinutes, goal: goal || undefined, today: localToday(), language, timezone: localTimezone() } });
}

// Study reminder emails (Profile > Preferences).
export function getReminderSettings() {
  return api("/sanad/reminders");
}

export function updateReminderSettings(body) {
  return api("/sanad/reminders", { method: "PATCH", body: { ...body, timezone: localTimezone() } });
}

export function sendTestReminder() {
  return api("/sanad/reminders/test", { method: "POST" });
}

/** The "Stop reminders" link from the email (works without signing in). */
export function stopRemindersFromLink(token) {
  return api("/sanad/reminders/unsubscribe", { method: "POST", body: { token } });
}

export function listStudyPlans(params = {}) {
  const q = new URLSearchParams();
  if (params.courseId) q.set("courseId", params.courseId);
  if (params.status) q.set("status", params.status);
  const qs = q.toString();
  return api(`/sanad/plans${qs ? `?${qs}` : ""}`);
}

export function getStudyPlan(planId) {
  return api(`/sanad/plans/${planId}`);
}

export function stopStudyPlan(planId) {
  return api(`/sanad/plans/${planId}`, { method: "DELETE" });
}

export function replanStudyPlan(planId) {
  return api(`/sanad/plans/${planId}/replan`, { method: "POST", body: { today: localToday() } });
}

export function startPlanTask(planId, taskId) {
  return api(`/sanad/plans/${planId}/tasks/${taskId}/start`, { method: "POST" });
}

export function completePlanTask(planId, taskId, body = {}) {
  return api(`/sanad/plans/${planId}/tasks/${taskId}/complete`, { method: "POST", body: { ...body, today: localToday() } });
}

export function skipPlanTask(planId, taskId) {
  return api(`/sanad/plans/${planId}/tasks/${taskId}/skip`, { method: "POST" });
}
