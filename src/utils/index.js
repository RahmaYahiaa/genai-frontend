export function cn(...args) {
  return args.filter(Boolean).join(" ");
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function formatPercent(value) {
  return `${Math.round(value)}%`;
}
