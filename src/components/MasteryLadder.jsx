import { masteryLevel } from "@/constants/tokens";
import { getCourse } from "@/data/courses";

const MONO = "'JetBrains Mono', monospace";

const COURSE_ID = "CS301";

const LEVEL_STEPS = [
  { level: "no-evidence", en: "No Evidence" },
  { level: "beginner", en: "Beginner" },
  { level: "intermediate", en: "Intermediate" },
  { level: "advanced", en: "Advanced" },
  { level: "mastered", en: "Mastered" },
];

// Luminous blue/violet variants tuned for contrast on the cobalt gradient.
const HERO_LEVEL_COLORS = {
  "no-evidence": "#93A0B8",
  beginner: "#B9A6F5",
  intermediate: "#A9BAF1",
  advanced: "#90A9F2",
  mastered: "#7FB2FF",
};

export default function MasteryLadder({ dark }) {
  const course = getCourse(COURSE_ID);

  return (
    <div
      style={{
        background: dark ? "rgba(14,20,48,0.85)" : "rgba(0,0,0,0.2)",
        border: dark ? "1px solid #242E5C" : "1px solid rgba(255,255,255,0.18)",
        borderRadius: 16,
        padding: "22px 24px",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Card header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.55)", letterSpacing: "0.08em" }}>
          {course.id} · TOPIC MASTERY LADDER
        </span>
        <span style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{course.topics.length} topics</span>
      </div>

      {/* Level legend */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {LEVEL_STEPS.map((step) => (
          <div key={step.level} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: HERO_LEVEL_COLORS[step.level] }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {step.en}
            </span>
          </div>
        ))}
      </div>

      {/* Topic rows */}
      {course.topics.map((topic) => {
        const level = masteryLevel(topic.pct, topic.evidence > 0);
        const color = HERO_LEVEL_COLORS[level];
        return (
          <div key={topic.id} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.8)", fontFamily: "'Inter', sans-serif" }}>
                {topic.label.en}
              </span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                  {topic.evidence > 0 ? `${topic.evidence} evidence` : "no data"}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color }}>
                  {topic.evidence > 0 ? `${topic.pct}%` : "—"}
                </span>
              </div>
            </div>
            {/* 5-segment level bar */}
            <div style={{ display: "flex", gap: 3, height: 5 }}>
              {LEVEL_STEPS.map((step, si) => {
                const thresholds = [0, 0, 30, 60, 85, 100];
                const isFilled = topic.evidence === 0 ? false : topic.pct > thresholds[si];
                const isActive = masteryLevel(topic.pct, topic.evidence > 0) === step.level;
                const c = HERO_LEVEL_COLORS[step.level];
                return (
                  <div
                    key={step.level}
                    style={{
                      flex: 1,
                      height: "100%",
                      borderRadius: 3,
                      background: isFilled || (topic.evidence === 0 && si === 0) ? c : "rgba(255,255,255,0.1)",
                      opacity: isActive ? 1 : isFilled ? 0.7 : 0.25,
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Overall mastery */}
      <div
        style={{
          marginTop: 14,
          padding: "10px 12px",
          background: "rgba(255,255,255,0.06)",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.45)" }}>Overall course mastery</span>
        <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: "#8FB4FF" }}>{course.overall}%</span>
      </div>
    </div>
  );
}