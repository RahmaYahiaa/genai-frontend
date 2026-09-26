import { MONO, headingFont } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { Bar, Btn, Card, Chip } from "@/components/ui";
import { bFontFor } from "@/components/ModuleUI";
import MasteryBar, { MasteryLabel } from "@/components/MasteryBar";
import { CHANGE_LABELS } from "@/services/learning";

/**
 * Shared learning-experience system for the four study modules
 * (Diagnostic → AI Tutor → Practice → Reassessment). Visual only — every
 * component here is driven by props; the pages keep owning their service
 * calls, session storage and API contracts unchanged.
 */

const JOURNEY = [
  { id: "diagnostic", screen: SCREENS.DIAGNOSTIC, en: "1 · Check level", ar: "١ · اعرف مستواك" },
  { id: "tutor", screen: SCREENS.TUTOR, en: "2 · Learn", ar: "٢ · اتعلّم" },
  { id: "practice", screen: SCREENS.PRACTICE, en: "3 · Practice", ar: "٣ · تدرّب" },
  { id: "reassessment", screen: SCREENS.REASSESSMENT, en: "4 · Re-check", ar: "٤ · قيس تقدّمك" },
];

const stepIndex = (id) => Math.max(0, JOURNEY.findIndex((s) => s.id === id));

/** Where-am-I trail across the learning loop. Clicking a step navigates. */
export function JourneyTrail({ current, dispatch, tokens, lang, mobile }) {
  const isRtl = lang === "ar";
  const font = bFontFor(lang);
  const activeIndex = stepIndex(current);
  return (
    <nav
      aria-label={isRtl ? "مسار التعلّم" : "learning journey"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        flexWrap: "nowrap",
        overflowX: mobile ? "auto" : "visible",
        flexDirection: isRtl ? "row-reverse" : "row",
        paddingBottom: 2,
      }}
    >
      {JOURNEY.map((step, index) => {
        const active = step.id === current;
        const passed = index < activeIndex;
        return [
          <button
            key={step.id}
            type="button"
            onClick={() => dispatch && dispatch({ type: "NAVIGATE", screen: step.screen })}
            aria-current={active ? "page" : undefined}
            style={{
              fontFamily: font,
              fontSize: 11,
              fontWeight: active ? 750 : 600,
              padding: "4px 10px",
              borderRadius: 99,
              cursor: "pointer",
              border: `1px solid ${active ? tokens.primary : passed ? tokens.masteredBorder : tokens.cardBorder}`,
              background: active ? tokens.primaryLight : passed ? tokens.masteredBg : "transparent",
              color: active ? tokens.primary : passed ? tokens.mastered : tokens.textFaint,
              whiteSpace: "nowrap",
            }}
          >
            {step[lang]}
          </button>,
          ...(index < JOURNEY.length - 1
            ? [
                <span key={`sep-${step.id}`} aria-hidden="true" style={{ color: tokens.textFaint, fontSize: 11, flexShrink: 0 }}>
                  {isRtl ? "‹" : "›"}
                </span>,
              ]
            : []),
        ];
      })}
    </nav>
  );
}

/** Standard module header: journey trail + kicker + title + subtitle + actions. */
export function LearningHeader({ tokens, lang, mobile, kicker, kickerTone = "primary", title, subtitle, journeyCurrent, dispatch, actions }) {
  const isRtl = lang === "ar";
  return (
    <header style={{ marginBottom: mobile ? 14 : 20 }}>
      <JourneyTrail current={journeyCurrent} dispatch={dispatch} tokens={tokens} lang={lang} mobile={mobile} />
      <div
        style={{
          marginTop: 14,
          display: "flex",
          alignItems: mobile ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          flexDirection: isRtl ? "row-reverse" : "row",
        }}
      >
        <div style={{ minWidth: 0, flex: "1 1 340px", textAlign: isRtl ? "right" : "left" }}>
          <h1
            style={{
              margin: 0,
              fontFamily: headingFont(lang),
              fontSize: mobile ? 21 : 26,
              fontWeight: 750,
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
              color: tokens.textPrimary,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p style={{ margin: "7px 0 0", fontSize: 13, lineHeight: 1.7, color: tokens.textMuted, maxWidth: 640 }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>{actions}</div>
        )}
      </div>
    </header>
  );
}

/** Guided intro card: what it measures, why, facts, strong primary CTA. */
export function GuidedIntro({
  tokens, lang, mobile,
  badge, badgeTone = "primary",
  title, description,
  facts = [],
  primaryLabel, onPrimary, primaryBusy, primaryDisabled,
  note,
  children,
}) {
  const isRtl = lang === "ar";
  return (
    <Card tokens={tokens} style={{ padding: mobile ? "20px 18px" : "26px 28px", maxWidth: 720 }}>

      <h2
        style={{
          margin: "14px 0 8px",
          fontFamily: headingFont(lang),
          fontSize: mobile ? 19 : 22,
          fontWeight: 750,
          letterSpacing: "-0.02em",
          color: tokens.textPrimary,
          textAlign: isRtl ? "right" : "left",
        }}
      >
        {title}
      </h2>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.75, color: tokens.textMuted, textAlign: isRtl ? "right" : "left" }}>
        {description}
      </p>
      {children}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
        <Btn
          tokens={tokens}
          disabled={primaryBusy || primaryDisabled}
          onClick={onPrimary}
          style={{ padding: "12px 22px", fontSize: 13.5, borderRadius: 11, boxShadow: tokens.primaryShadow }}
        >
          {primaryBusy ? (lang === "ar" ? "جارٍ الإنشاء…" : "Generating…") : primaryLabel}
        </Btn>
        {note && (
          <span style={{ fontSize: 11.5, color: tokens.textFaint, lineHeight: 1.6, maxWidth: 340, textAlign: isRtl ? "right" : "left" }}>
            {note}
          </span>
        )}
      </div>
    </Card>
  );
}

/** Shared history list for diagnostic/practice/reassessment sessions. */
export function SessionHistoryList({ rows, emptyLabel, emptyHint, onOpen, renderTitle, renderMeta, statusTone, statusLabel, tokens, lang, isRtl, mobile }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: tokens.textFaint,
          marginBottom: 10,
          textAlign: isRtl ? "right" : "left",
        }}
      >
        {lang === "ar" ? "الجلسات السابقة" : "History"}
      </div>
      {rows.length === 0 ? (
        <EmptyPanel
          tokens={tokens}
          lang={lang}
          isRtl={isRtl}
          title={emptyLabel}
          body={emptyHint}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => onOpen(row)}
              aria-label={`${lang === "ar" ? "فتح الجلسة" : "Open"} ${renderTitle(row)}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${tokens.cardBorder}`,
                background: tokens.card,
                cursor: "pointer",
                textAlign: isRtl ? "right" : "left",
                flexDirection: isRtl ? "row-reverse" : "row",
                fontFamily: "inherit",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 650, color: tokens.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: mobile ? "nowrap" : "normal" }}>
                  {renderTitle(row)}
                </div>
                {renderMeta && (
                  <div style={{ fontSize: 11, color: tokens.textFaint, marginTop: 3, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {renderMeta(row)}
                  </div>
                )}
              </div>
              <Chip tokens={tokens} tone={statusTone(row)}>{statusLabel(row)}</Chip>
              <span aria-hidden="true" style={{ color: tokens.textFaint, fontSize: 13, flexShrink: 0 }}>{isRtl ? "‹" : "›"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Unified empty state: what is empty + next action. */
export function EmptyPanel({ tokens, lang, isRtl, title, body, actionLabel, onAction }) {
  return (
    <div
      style={{
        padding: "26px 20px",
        borderRadius: 12,
        border: `1.5px dashed ${tokens.cardBorder}`,
        background: tokens.inset,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 650, color: tokens.textSecondary, marginBottom: body ? 5 : 0 }}>{title}</div>
      {body && <div style={{ fontSize: 12, color: tokens.textFaint, lineHeight: 1.7, maxWidth: 420, margin: "0 auto" }}>{body}</div>}
      {actionLabel && (
        <Btn tokens={tokens} variant="soft" style={{ marginTop: 12 }} onClick={onAction}>
          {actionLabel}
        </Btn>
      )}
    </div>
  );
}

/** Completion panel with semantic success tone + next-step actions. */
export function DonePanel({ tokens, lang, isRtl, title, subtitle, actions }) {
  return (
    <Card
      tokens={tokens}
      style={{ padding: "18px 20px", borderLeft: `3px solid ${tokens.mastered}`, ...(isRtl ? { borderLeft: "none", borderRight: `3px solid ${tokens.mastered}` } : {}) }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexDirection: isRtl ? "row-reverse" : "row" }}>
        <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: tokens.mastered, flexShrink: 0 }} />
        <span style={{ fontSize: 13.5, fontWeight: 700, color: tokens.textPrimary }}>{title}</span>
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: tokens.textMuted, lineHeight: 1.7, marginBottom: 12, textAlign: isRtl ? "right" : "left" }}>{subtitle}</div>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        {(actions ?? []).map((action) => (
          <Btn key={action.label} tokens={tokens} lang={lang} variant={action.primary ? "solid" : "ghost"} onClick={action.onClick}>
            {action.label}
          </Btn>
        ))}
      </div>
    </Card>
  );
}

/** Subtle AI working dots (uses the genai-pulse keyframe from index.css). */
export function AIWorking({ tokens, lang, label }) {
  const isRtl = lang === "ar";
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 12,
        background: tokens.inset,
        border: `1px solid ${tokens.cardBorder}`,
      }}
    >
      <span aria-hidden="true" style={{ display: "inline-flex", gap: 3 }}>
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: tokens.primary,
              animation: `genai-pulse 1.2s ease-in-out ${dot * 0.18}s infinite`,
            }}
          />
        ))}
      </span>
      <span style={{ fontSize: 12, color: tokens.textMuted }}>{label ?? (isRtl ? "يعمل الذكاء على الإجابة…" : "The AI is working…")}</span>
    </div>
  );
}

/**
 * Reassessment learning-gain table: honest before→after mastery levels per
 * topic with the change label from the backend (no invented percentages).
 */
export function GainTable({ gains, topicTitle, tokens, lang, mobile }) {
  const isRtl = lang === "ar";
  const t = (en, ar) => (lang === "ar" ? ar : en);
  if (!gains.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {gains.map((row) => {
        const change = row.change ?? "no_reassessment_yet";
        const deltaTone = change === "improved" ? "mastered" : change === "declined" ? "gap" : "default";
        return (
          <Card key={row.topicId} tokens={tokens} style={{ padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
              <span style={{ flex: 1, minWidth: 140, fontSize: 13, fontWeight: 650, color: tokens.textPrimary, textAlign: isRtl ? "right" : "left" }}>
                {typeof row.title === "string" ? row.title : topicTitle(row.topicId)}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <MasteryLabel level={String(row.baselineMasteryLevel ?? "no_evidence").replace("_", "-")} lang={lang} tokens={tokens} />
                <span aria-hidden="true" style={{ color: tokens.textFaint, fontSize: 12, fontFamily: MONO }}>
                  {isRtl ? "‹" : "›"}
                </span>
                <MasteryLabel level={String(row.currentMasteryLevel ?? "no_evidence").replace("_", "-")} lang={lang} tokens={tokens} />
                <Chip tokens={tokens} tone={deltaTone}>
                  {CHANGE_LABELS[change]?.[lang] ?? change}
                </Chip>
              </div>
            </div>
            {row.masteryScore != null && (
              <div style={{ marginTop: 8 }}>
                <MasteryBar pct={Math.round(row.masteryScore * (row.masteryScore <= 1 ? 100 : 1))} evidence={1} tokens={tokens} height={6} />
              </div>
            )}
            {change === "no_reassessment_yet" && (
              <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 6, textAlign: isRtl ? "right" : "left" }}>
                {t("Complete a progress check to see how much you've improved.", "لا يوجد خط أساس موثوق بعد — أكمل إعادة تقييم ليفتح المقارن.")}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/** Accessible segmented progress for question flows. */
export function FlowProgress({ answered, total, tokens, lang, mobile }) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  const isRtl = lang === "ar";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
      <div style={{ flex: 1 }} role="progressbar" aria-valuenow={answered} aria-valuemin={0} aria-valuemax={total} aria-label={isRtl ? "تقدمك في هذه الجلسة" : "Progress"}>
        <Bar tokens={tokens} value={pct} color={tokens.primary} height={7} />
      </div>
      <span style={{ fontFamily: MONO, fontSize: 11, color: tokens.textMuted, whiteSpace: "nowrap" }}>
        {answered}/{total} · {pct}%
      </span>
    </div>
  );
}

/** Semantic status for session rows. */
export function sessionStatusTone(status) {
  return status === "completed" ? "mastered" : "developing";
}
