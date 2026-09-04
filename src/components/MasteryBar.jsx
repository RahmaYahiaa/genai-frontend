import { masteryLevel, masteryLevelLabel } from "@/constants/tokens";

const LEVELS = ["no-evidence", "beginner", "intermediate", "advanced", "mastered"];
const THRESHOLDS = [0, 0, 30, 60, 85];
const COLOR_KEY = {
  "no-evidence": "noEvidence",
  beginner: "gap",
  intermediate: "developing",
  advanced: "advanced",
  mastered: "mastered",
};
const BG_KEY = {
  "no-evidence": "noEvidenceBg",
  beginner: "gapBg",
  intermediate: "developingBg",
  advanced: "advancedBg",
  mastered: "masteredBg",
};

export default function MasteryBar({ pct, evidence, tokens, height = 6 }) {
  const level = masteryLevel(pct, evidence > 0);
  return (
    <div style={{ display: "flex", gap: 3, height }}>
      {LEVELS.map((lvl, i) => {
        const filled = evidence > 0 && pct > THRESHOLDS[i];
        const active = level === lvl;
        return (
          <div
            key={lvl}
            style={{
              flex: 1,
              height: "100%",
              borderRadius: 3,
              background: filled || (evidence === 0 && i === 0) ? tokens[COLOR_KEY[lvl]] : tokens.insetBorder,
              opacity: active ? 1 : filled ? 0.65 : 0.3,
            }}
          />
        );
      })}
    </div>
  );
}

export function MasteryLabel({ level, lang, tokens, style }) {
  return (
    <span
      style={{
        padding: "4px 9px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
        background: tokens[BG_KEY[level]],
        color: tokens[COLOR_KEY[level]],
        ...style,
      }}
    >
      {masteryLevelLabel(level, lang)}
    </span>
  );
}