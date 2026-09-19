import { api } from "@/services/http";

export async function listMyLinkInvitations() {
  return api("/link-invitations");
}

export async function respondToLinkInvitation(invitationId, decision) {
  return api(`/link-invitations/${invitationId}/respond`, { method: "POST", body: { decision } });
}
