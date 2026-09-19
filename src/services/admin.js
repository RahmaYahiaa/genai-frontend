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
