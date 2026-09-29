import { api, API_BASE, readSession, writeSession, clearSession } from "@/services/http";
import { ROLES } from "@/constants/routes";
import { DEMO_USER } from "@/data/user";

const APP_ROLES = {
  student: ROLES.STUDENT,
  instructor: ROLES.INSTRUCTOR,
  institution_admin: ROLES.ADMIN,
};

export function demoMode() {
  return !API_BASE;
}

function toAppUser(publicUser) {
  const firstName = publicUser.firstName ?? "";
  const lastName = publicUser.lastName ?? "";
  const fullName = `${firstName} ${lastName}`.trim();
  return {
    id: publicUser.id,
    email: publicUser.email,
    firstName,
    lastName,
    role: APP_ROLES[publicUser.role] ?? ROLES.STUDENT,
    backendRole: publicUser.role,
    accountType: publicUser.accountType ?? null,
    institutionId: publicUser.institutionId ?? null,
    languagePreference: publicUser.languagePreference ?? "en",
    // false only for self-registered accounts that have not entered the emailed code yet
    emailVerified: publicUser.emailVerified !== false,
    initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase(),
    name: { en: fullName, ar: fullName },
  };
}

function persistAuth(data) {
  const user = toAppUser(data.user);
  writeSession({
    accessToken: data.tokens?.accessToken ?? null,
    refreshToken: data.tokens?.refreshToken ?? null,
    user,
  });
  return user;
}

function demoUser(role) {
  const user = { ...DEMO_USER, id: "demo-user", role: role ?? ROLES.STUDENT };
  writeSession({ accessToken: null, refreshToken: null, user });
  return user;
}

export async function login(email, password, fallbackRole) {
  if (demoMode()) return demoUser(fallbackRole);
  const data = await api("/auth/login", { method: "POST", body: { email, password } });
  return persistAuth(data);
}

export async function register(payload, fallbackRole) {
  if (demoMode()) return demoUser(fallbackRole ?? payload.role);
  const data = await api("/auth/register", { method: "POST", body: payload });
  return persistAuth(data);
}

export async function registrationGuidance(email) {
  if (demoMode()) {
    return { emailDomain: email.split("@")[1] ?? "", institution: null, recommendedTrack: "personal", message: "" };
  }
  return api(`/auth/registration-guidance?email=${encodeURIComponent(email)}`);
}

export async function restoreSession() {
  const session = readSession();
  if (!session) return null;
  if (demoMode()) return session.user ?? null;
  if (!session.accessToken) {
    clearSession();
    return null;
  }
  try {
    const me = await api("/auth/me");
    const user = toAppUser(me);
    writeSession({ ...session, user });
    return user;
  } catch {
    clearSession();
    return null;
  }
}

/** Confirms the email with the 6-digit code; returns the updated user. */
export async function verifyEmail(code) {
  const me = await api("/auth/verify-email", { method: "POST", body: { code } });
  const session = readSession();
  const user = toAppUser(me);
  if (session) writeSession({ ...session, user });
  return user;
}

export function resendVerification() {
  return api("/auth/verify-email/resend", { method: "POST" });
}

export function forgotPassword(email) {
  return api("/auth/forgot-password", { method: "POST", body: { email } });
}

export function resetPassword({ email, code, password }) {
  return api("/auth/reset-password", { method: "POST", body: { email, code, password } });
}

export function applyAuthData(data) {
  return persistAuth(data);
}

export function signOut() {
  const session = readSession();
  clearSession();
  if (API_BASE && session?.accessToken) {
    api("/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
      retry: false,
    }).catch(() => null);
  }
}
/** Emailed invitation link (/?invite=TOKEN): what the invitation is about. */
export function previewInvitation(token) {
  return api(`/invitations/${encodeURIComponent(token)}`, { retry: false });
}

/** Creates the account from the invitation and signs in. */
export async function acceptInvitation(token, body) {
  const data = await api(`/invitations/${encodeURIComponent(token)}/accept`, { method: "POST", body, retry: false });
  return persistAuth(data);
}
