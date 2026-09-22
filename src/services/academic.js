import { api } from "@/services/http";

export async function listInstitutionUnits(institutionId, { type } = {}) {
  return api(`/institutions/${institutionId}/units${type ? `?type=${type}` : ""}`);
}