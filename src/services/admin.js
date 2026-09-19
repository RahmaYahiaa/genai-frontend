import { api } from "@/services/http";

export function getAdminMe() {
  return api("/admin/me");
}

export function getInstitutionHealth() {
  return api("/admin/health");
}

export function listUsers() {
  return api("/admin/users");
}

export function setUserActive(userId, isActive) {
  return api(`/admin/users/${userId}/active`, { method: "PATCH", body: { isActive } });
}

export function changeUserRole(userId, role) {
  return api(`/admin/users/${userId}/role`, { method: "PATCH", body: { role } });
}

export function setAcademicNumber(userId, academicNumber) {
  return api(`/admin/users/${userId}/academic-number`, {
    method: "PATCH",
    body: { academicNumber: academicNumber?.trim() ? academicNumber.trim() : null },
  });
}

export function listOfficers() {
  return api("/admin/officers");
}

export function createOfficer(payload) {
  return api("/admin/officers", { method: "POST", body: payload });
}

export function applyOfficerTemplate(userId, templateId) {
  return api(`/admin/officers/${userId}/template`, { method: "PATCH", body: { templateId } });
}

export function setOfficerScopes(userId, keys) {
  return api(`/admin/officers/${userId}/scopes`, { method: "PATCH", body: { keys } });
}

export function stageImport(fileName, rows) {
  return api("/admin/imports", { method: "POST", body: { fileName, rows } });
}

export function listImports() {
  return api("/admin/imports");
}

export function confirmImport(batchId) {
  return api(`/admin/imports/${batchId}/confirm`, { method: "POST" });
}

export function discardImport(batchId) {
  return api(`/admin/imports/${batchId}`, { method: "DELETE" });
}

export function listInvitations(status) {
  return api(status ? `/admin/invitations?status=${status}` : "/admin/invitations");
}

export function listRequests({ status, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("limit", String(limit));
  return api(`/admin/requests?${params.toString()}`);
}

export function getRequestProof(requestId) {
  return api(`/admin/requests/${requestId}/proof`);
}

export function decideRequest(requestId, decision, note) {
  return api(`/admin/requests/${requestId}/decision`, {
    method: "POST",
    body: { decision, ...(note?.trim() ? { note: note.trim() } : {}) },
  });
}

export function listAuditEvents({ scope, search, period = "7d", page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (scope) params.set("scope", scope);
  if (search?.trim()) params.set("search", search.trim());
  params.set("period", period);
  params.set("page", String(page));
  params.set("limit", String(limit));
  return api(`/admin/audit?${params.toString()}`);
}
