import { api } from "@/services/http";

export function getAdminMe() {
  return api("/admin/me");
}

export function getInstitutionHealth() {
  return api("/admin/health");
}
