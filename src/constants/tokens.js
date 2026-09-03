export const MONO = "'JetBrains Mono', monospace";
export const HEAD_EN = "'Plus Jakarta Sans', sans-serif";
export const HEAD_AR = "'Cairo', sans-serif";
export const BODY_EN = "'Inter', sans-serif";
export const BODY_AR = "'Cairo', sans-serif";

export const LIGHT = {
  bg: "#F4F6F9",
  bgAlt: "#EEF1F6",
  card: "#FFFFFF",
  cardBorder: "#DDE3ED",
  inset: "#EEF1F7",
  insetBorder: "#D8DFEC",

  primary: "#1B4DA8",
  primaryMid: "#1E5BB5",
  primaryBtn: "#1B4DA8",
  primaryDeep: "#163F8A",
  primaryLight: "#EBF1FB",
  accent: "#3057CC",

  textPrimary: "#0D1A2E",
  textSecondary: "#374151",
  textMuted: "#5C697E",
  textFaint: "#8A96A8",

  mastered: "#1A56C4",
  masteredMid: "#1F63D0",
  masteredBg: "#EBF2FD",
  masteredBorder: "#C7D9F9",

  advanced: "#3A6FDB",
  advancedBg: "#EEF4FE",

  developing: "#7398E4",
  developingBg: "#F3F7FE",
  developingBorder: "#D8E4FB",

  gap: "#7059C9",
  gapBg: "#F3F1FC",
  gapBorder: "#DDD6F7",

  noEvidence: "#8A96A8",
  noEvidenceBg: "#F1F3F7",

  citation: "#1B4DA8",
  citationBg: "#EBF1FB",
  citationBorder: "#C3D4F5",

  grounded: "#1A56C4",
  groundedBg: "#EBF2FD",
  insufficient: "#7398E4",
  insufficientBg: "#F3F7FE",

  sidebar: "#FFFFFF",
  sidebarBorder: "#DDE3ED",
  sidebarActive: "#EBF1FB",
  sidebarHover: "#F4F6F9",
};

export const DARK = {
  bg: "#0A0E23",
  bgAlt: "#0E1430",
  card: "#131A38",
  cardBorder: "#242E5C",
  inset: "#161E42",
  insetBorder: "#2B3666",

  primary: "#7D9BF6",
  primaryMid: "#8FA9F8",
  primaryBtn: "#6C8EF2",
  primaryDeep: "#6687EE",
  primaryLight: "#1A2248",
  accent: "#A18CFF",

  textPrimary: "#EDF0F5",
  textSecondary: "#B8C4D6",
  textMuted: "#7A8DA8",
  textFaint: "#4A5A72",

  mastered: "#6E9BFF",
  masteredMid: "#7FA9FF",
  masteredBg: "#101A3C",
  masteredBorder: "#24356E",

  advanced: "#90A9F2",
  advancedBg: "#131D42",

  developing: "#A9BAF1",
  developingBg: "#1A2148",
  developingBorder: "#2F3B74",

  gap: "#A79AEF",
  gapBg: "#1F1A45",
  gapBorder: "#382E74",

  noEvidence: "#5A6683",
  noEvidenceBg: "#131A38",

  citation: "#7D9BF6",
  citationBg: "#1A2248",
  citationBorder: "#2B3B78",

  grounded: "#6E9BFF",
  groundedBg: "#101A3C",
  insufficient: "#A9BAF1",
  insufficientBg: "#1A2148",

  sidebar: "#0E1430",
  sidebarBorder: "#242E5C",
  sidebarActive: "#1A2248",
  sidebarHover: "#131A38",
};

export function tk(dark) {
  return dark ? DARK : LIGHT;
}

export const MASTERY_LEVELS = Object.freeze([
  "no-evidence",
  "beginner",
  "intermediate",
  "advanced",
  "mastered",
]);

const MASTERY_LABELS = {
  "no-evidence": { en: "No Evidence", ar: "لا توجد أدلة" },
  beginner: { en: "Beginner", ar: "مبتدئ" },
  intermediate: { en: "Intermediate", ar: "متوسط" },
  advanced: { en: "Advanced", ar: "متقدم" },
  mastered: { en: "Mastered", ar: "متقن" },
};

export function masteryLevel(pct, hasEvidence) {
  if (!hasEvidence || pct === 0) return "no-evidence";
  if (pct <= 30) return "beginner";
  if (pct <= 60) return "intermediate";
  if (pct <= 85) return "advanced";
  return "mastered";
}

export function masteryLevelLabel(level, lang) {
  return MASTERY_LABELS[level]?.[lang] ?? MASTERY_LABELS[level].en;
}

export function masteryColor(level, tokens) {
  switch (level) {
    case "no-evidence":
      return tokens.noEvidence;
    case "beginner":
      return tokens.gap;
    case "intermediate":
      return tokens.developing;
    case "advanced":
      return tokens.advanced;
    case "mastered":
      return tokens.mastered;
    default:
      return tokens.textMuted;
  }
}

export function masteryBg(level, tokens) {
  switch (level) {
    case "no-evidence":
      return tokens.noEvidenceBg;
    case "beginner":
      return tokens.gapBg;
    case "intermediate":
      return tokens.developingBg;
    case "advanced":
      return tokens.advancedBg;
    case "mastered":
      return tokens.masteredBg;
    default:
      return tokens.inset;
  }
}

export function headingFont(lang) {
  return lang === "ar" ? HEAD_AR : HEAD_EN;
}

export function bodyFont(lang) {
  return lang === "ar" ? BODY_AR : BODY_EN;
}
