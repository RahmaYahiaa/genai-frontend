import { SCREENS, ROLES } from "@/constants/routes";

export function cn(...args) {
  return args.filter(Boolean).join(" ");
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function formatPercent(value) {
  return `${Math.round(value)}%`;
}

export function homeScreenFor(role) {
  if (role === ROLES.INSTRUCTOR) return SCREENS.INSTRUCTOR_HOME;
  if (role === ROLES.ADMIN) return SCREENS.ADMIN;
  return SCREENS.DASHBOARD;
}