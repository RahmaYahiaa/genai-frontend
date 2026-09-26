import { useCallback, useState } from "react";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { tk } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { demoMode } from "@/services/auth";
import { apiErrorText } from "@/services/http";
import {
  listAssignmentsForCourse,
  publishAssignment,
  closeAssignment,
  reopenAssignment,
} from "@/services/assignments";
import { getReview, pendingCounts } from "@/services/review";
import { toast } from "@/components/ModuleUI";
import { LoadingBlock, ErrorBlock, EmptyBlock, PrimaryButton } from "@/components/study/StudyKit";
import { Card as KitCard, Pill } from "@/components/instructor/InstructorKit";
import IconAction from "@/components/IconAction";
import { IconPlus, IconClipboard, IconPencil, IconLock, IconRefresh } from "@/components/Icons";
import AssignmentsTabLegacy from "@/components/AssignmentsTabLegacy";

function RealAssignmentsTab({ state, dispatch, courseId }) {
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);

  // Assignments plus the live review counts of every published one.
  const load = useCallback(async () => {
    const { items } = await listAssignmentsForCourse(courseId);
    const stats = await Promise.all(
      items.map((a) => (a.status === "DRAFT" ? null : getReview(a.id, { limit: 1 }).then(pendingCounts).catch(() => null))),
    );
    return items.map((a, i) => ({ ...a, stats: stats[i] }));
  }, [courseId]);
  const { data, loading, error, reload } = useAsync(load);
  const [busy, setBusy] = useState(null);
  const [filter, setFilter] = useState("all");

  const openBuilder = (assignmentId) =>
    dispatch({ type: "NAVIGATE", screen: SCREENS.ASSIGNMENT_CREATE, courseId, assignmentId, tab: "assignments" });
  const openReview = (assignmentId) =>
    dispatch({ type: "NAVIGATE", screen: SCREENS.ASSIGNMENT_REVIEW, courseId, assignmentId, tab: "assignments" });

  const run = async (action, fn, okMessage) => {
    if (busy) return;
    setBusy(action);
    try {
      await fn();
      if (okMessage) toast(okMessage);
      reload();
    } catch (err) {
      toast(apiErrorText(err, lang));
    } finally {
      setBusy(null);
    }
  };

  const all = data ?? [];
  const counts = { all: all.length, OPEN: 0, DRAFT: 0, CLOSED: 0 };
  all.forEach((a) => { counts[a.status] = (counts[a.status] ?? 0) + 1; });
  const assignments = filter === "all" ? all : all.filter((a) => a.status === filter);
  const STATUS = {
    DRAFT: { tone: "neutral", label: t("Draft", "مسودة"), note: t("Only you can see it", "إنت بس اللي شايفه") },
    OPEN: { tone: "primary", label: t("Open", "مفتوح"), note: t("Students can answer now", "الطلاب يقدروا يجاوبوا دلوقتي") },
    CLOSED: { tone: "neutral", label: t("Closed", "مقفول"), note: t("No new answers", "مش بيستقبل إجابات جديدة") },
  };
  const filters = [
    { id: "all", label: t("All", "الكل") },
    { id: "OPEN", label: t("Open", "مفتوحة") },
    { id: "DRAFT", label: t("Drafts", "مسودات") },
    { id: "CLOSED", label: t("Closed", "مقفولة") },
  ];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {filters.map((f) => {
            const active = f.id === filter;
            return (
              <button key={f.id} type="button" onClick={() => setFilter(f.id)}
                style={{ padding: "6px 14px", borderRadius: 999, border: `1px solid ${active ? tokens.primary : tokens.cardBorder}`, background: active ? tokens.primaryLight : tokens.card, color: active ? tokens.primary : tokens.textSecondary, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                {f.label} <span style={{ opacity: 0.7 }}>{counts[f.id] ?? 0}</span>
              </button>
            );
          })}
        </div>
        <PrimaryButton tokens={tokens} onClick={() => openBuilder(undefined)} style={{ height: 38, fontSize: 13.5, ...(mobile ? { width: "100%" } : {}) }}>
          <IconPlus size={14} color="#fff" />{t("New assignment", "تكليف جديد")}
        </PrimaryButton>
      </div>

      {loading ? (
        <LoadingBlock tokens={tokens} label={t("Loading assignments…", "بنحمّل التكليفات…")} />
      ) : error ? (
        <ErrorBlock tokens={tokens} lang={lang} onRetry={reload} />
      ) : all.length === 0 ? (
        <EmptyBlock tokens={tokens} Icon={IconClipboard} title={t("No assignments yet", "مفيش تكليفات لسه")}
          body={t("Create an assignment, add questions and publish it. Answers are graded automatically and you approve the final grade.", "اعمل تكليف، ضيف أسئلة وانشره. الإجابات بتتصحح تلقائي وإنت اللي بتعتمد الدرجة النهائية.")}
          action={<PrimaryButton tokens={tokens} onClick={() => openBuilder(undefined)}><IconPlus size={14} color="#fff" />{t("New assignment", "تكليف جديد")}</PrimaryButton>} />
      ) : assignments.length === 0 ? (
        <div style={{ padding: "28px 0", textAlign: "center", color: tokens.textMuted, fontSize: 14 }}>{t("Nothing here.", "مفيش حاجة هنا.")}</div>
      ) : (
        <KitCard tokens={tokens} padding={0} style={{ overflow: "hidden" }}>
          {assignments.map((a, i) => {
            const st = STATUS[a.status] ?? STATUS.CLOSED;
            const s = a.stats;
            const toReview = s?.toReview ?? 0;
            const toApprove = s?.readyToApprove ?? 0;
            return (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderTop: i ? `1px solid ${tokens.cardBorder}` : "none", flexWrap: mobile ? "wrap" : "nowrap" }}>
                <button type="button" onClick={() => (a.status === "DRAFT" ? openBuilder(a.id) : openReview(a.id))}
                  style={{ flex: 1, minWidth: 0, textAlign: "start", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 650, color: tokens.textPrimary }}>{a.title[lang] ?? a.title.en}</span>
                    <Pill tokens={tokens} tone={st.tone}>{st.label}</Pill>
                    {toReview > 0 && <Pill tokens={tokens} tone="attention">{toReview} {t("to review", "للمراجعة")}</Pill>}
                    {toApprove > 0 && <Pill tokens={tokens} tone="good">{toApprove} {t("ready to approve", "جاهز للاعتماد")}</Pill>}
                  </div>
                  <div style={{ fontSize: 13, color: tokens.textMuted, marginTop: 4 }}>
                    {[
                      st.note,
                      s && t(`${s.total} submitted · ${s.decided} graded`, `${s.total} سلّموا · ${s.decided} اتصحّح`),
                      a.showGradeToStudent && a.showFeedbackToStudent ? t("Students see grade and feedback", "الطلاب بيشوفوا الدرجة والملاحظات")
                        : a.showGradeToStudent ? t("Students see the grade", "الطلاب بيشوفوا الدرجة")
                        : a.showFeedbackToStudent ? t("Students see feedback", "الطلاب بيشوفوا الملاحظات")
                        : t("Results hidden from students", "النتايج مخفية عن الطلاب"),
                    ].filter(Boolean).join(" · ")}
                  </div>
                </button>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                  {a.status === "DRAFT" && (
                    <PrimaryButton tokens={tokens} busy={busy === a.id} style={{ height: 34, padding: "0 14px", fontSize: 13 }}
                      onClick={() => run(a.id, () => publishAssignment(a.id), t("Published. Students can see it now.", "اتنشر. الطلاب يقدروا يشوفوه دلوقتي."))}>
                      {t("Publish", "انشر")}
                    </PrimaryButton>
                  )}
                  {a.status !== "DRAFT" && (
                    <IconAction tokens={tokens} label={t("Review answers", "راجع الإجابات")} onClick={() => openReview(a.id)}><IconClipboard size={16} /></IconAction>
                  )}
                  <IconAction tokens={tokens} label={t("Edit questions", "عدّل الأسئلة")} onClick={() => openBuilder(a.id)}><IconPencil size={16} /></IconAction>
                  {a.status === "OPEN" && (
                    <IconAction tokens={tokens} label={t("Stop accepting answers", "اقفل استقبال الإجابات")} disabled={busy === a.id}
                      onClick={() => run(a.id, () => closeAssignment(a.id), t("Closed. No new answers will be accepted.", "اتقفل. مفيش إجابات جديدة هتتقبل."))}><IconLock size={16} /></IconAction>
                  )}
                  {a.status === "CLOSED" && (
                    <IconAction tokens={tokens} label={t("Reopen for answers", "افتحه تاني للإجابات")} disabled={busy === a.id}
                      onClick={() => run(a.id, () => reopenAssignment(a.id), t("Reopened.", "اتفتح تاني."))}><IconRefresh size={16} /></IconAction>
                  )}
                </div>
              </div>
            );
          })}
        </KitCard>
      )}
    </>
  );
}

export default function AssignmentsTab(props) {
  if (demoMode()) return <AssignmentsTabLegacy {...props} />;
  return <RealAssignmentsTab {...props} />;
}