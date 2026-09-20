import { demoMode } from "@/services/auth";
import { useCallback, useState } from "react";
import useAsync from "@/hooks/useAsync";
import { tk, MONO } from "@/constants/tokens";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useInstructorModule } from "@/store/InstructorProvider";
import { getInstructorHome, getCourseAnalytics, getCoverageGaps } from "@/services/analytics";
import { listEnrollments, getCreationPolicy, createCourse } from "@/services/courses";
import { AsyncGate } from "@/components/ui";
import { bFontFor, hFontFor } from "@/components/ModuleUI";
import { Modal, Field, inputStyle, textareaStyle, toast } from "@/components/ModuleUI";
import { SCREENS } from "@/constants/routes";
import { IconWarning, IconClipboard, IconPlus, IconCheck } from "@/components/Icons";
import { MISCONCEPTIONS, latestAttempt, approvedMaterials, INSTRUCTOR_COURSE_IDS } from "@/data/instructorModule";
function DemoInstructorHomePage({ state, dispatch }) {
  const { state: mod } = useInstructorModule();
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);
  const courses = mod.courses.filter((c) => INSTRUCTOR_COURSE_IDS.includes(c.id));
  const rows = courses.map((course) => {
    const units = mod.units.filter((u) => u.courseId === course.id);
    const pending = units.filter((u) => u.status === "awaiting_review");
    const quick = pending.filter((u) => {
      const ev = latestAttempt(u).eval;
      return ev.confidence === "high" && ev.aiScore !== null;
    });
    const pendingMisIds = new Set(pending.flatMap((u) => latestAttempt(u).eval.misconceptions));
    const publishedFor = new Set(mod.remedial.filter((r) => r.status === "published" && r.misconceptionId).map((r) => r.misconceptionId));
    const unaddressed = MISCONCEPTIONS.filter((m) => pendingMisIds.has(m.id) && !publishedFor.has(m.id));
    const coverage = course.topics.filter((t) => approvedMaterials(t) === 0);
    return { course, pending: pending.length, quick: quick.length, unaddressed: unaddressed.length, coverage: coverage.length };
  }).sort((a, b) => b.pending - a.pending || b.quick - a.quick);
  const totalPending = rows.reduce((s, r) => s + r.pending, 0);
  const totalQuick = rows.reduce((s, r) => s + r.quick, 0);
  const mostUrgent = rows[0];
  const openWorkspace = (courseId) => dispatch({ type: "NAVIGATE", screen: SCREENS.COURSE_WORKSPACE, courseId, tab: "assignments" });
  return <div style={{ padding: mobile ? 16 : "28px 32px", maxWidth: 1080, margin: "0 auto", direction: isRtl ? "rtl" : "ltr" }}>
      {
    /* Header */
  }
      <div style={{ marginBottom: 20, textAlign: isRtl ? "right" : "left" }}>
        <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: "0 0 3px" }}>
          {lang === "ar" ? "مساحة المدرّس" : "Instructor Workspace"}
        </h1>
        <p style={{ fontSize: 13, color: tokens.textMuted, margin: 0, fontFamily: bFont }}>
          {lang === "ar" ? "كل مقرراتك في عرض واحد، مرتّبة حسب الإلحاح." : "All your courses in one view, ordered by urgency."}
        </p>
      </div>

      {
    /* Attention banner — directs only, never approves (FR-HOME-02/03) */
  }
      {totalPending === 0 && <div
    style={{
      background: tokens.card,
      border: `1px solid ${tokens.cardBorder}`,
      borderRadius: 12,
      padding: "34px 24px",
      marginBottom: 20,
      textAlign: "center"
    }}
  >
          <div style={{ display: "inline-flex", width: 44, height: 44, borderRadius: "50%", background: tokens.primaryLight, border: `1px solid ${tokens.citationBorder}`, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <IconClipboard size={18} color={tokens.primary} />
          </div>
          <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 16, color: tokens.textPrimary, letterSpacing: "-0.02em", marginBottom: 4 }}>
            {lang === "ar" ? "لا تسليمات تحتاج مراجعة الآن" : "No submissions need review right now"}
          </div>
          <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted }}>
            {lang === "ar" ? "كل شيء معالَج — ستظهر التسليمات الجديدة هنا فور وصولها." : "Everything is handled — new submissions will surface here as they arrive."}
          </div>
        </div>}
      {totalPending > 0 && mostUrgent && <div
    style={{
      background: tokens.primaryLight,
      border: `1px solid ${tokens.primary}33`,
      borderRadius: 12,
      padding: "20px 24px",
      marginBottom: 20,
      display: "flex",
      alignItems: mobile ? "stretch" : "center",
      justifyContent: "space-between",
      gap: 18,
      flexWrap: "wrap",
      flexDirection: mobile ? "column" : isRtl ? "row-reverse" : "row"
    }}
  >
          <div style={{ textAlign: isRtl ? "right" : "left" }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: tokens.textMuted, letterSpacing: "0.1em", marginBottom: 8 }}>
              {lang === "ar" ? "يحتاج انتباهك" : "NEEDS YOUR ATTENTION"}
            </div>
            <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 20 : 24, color: tokens.textPrimary, letterSpacing: "-0.03em", marginBottom: 4 }}>
              {totalPending} {lang === "ar" ? "تسليماً بانتظار المراجعة" : "pending submissions"}
            </div>
            <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textSecondary }}>
              {totalQuick} {lang === "ar" ? "جاهز للاعتماد السريع" : "ready for quick approval"}
            </div>
          </div>
          <button
    onClick={() => openWorkspace(mostUrgent.course.id)}
    className="genai-cta"
    style={{
      padding: "11px 18px",
      borderRadius: 9,
      border: "none",
      background: tokens.primaryBtn,
      color: "#fff",
      fontFamily: hFont,
      fontWeight: 600,
      fontSize: 13,
      cursor: "pointer",
      boxShadow: tokens.primaryShadow,
      flexShrink: 0,
      ...(mobile ? { width: "100%" } : {})
    }}
  >
            {lang === "ar" ? `افتح مساحة ${mostUrgent.course.id}` : `Open ${mostUrgent.course.id} workspace`}
          </button>
        </div>}

      {
    /* Course cards — most urgent first */
  }
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: mobile ? 12 : 16 }}>
        {rows.map((row) => <div
    key={row.course.id}
    style={{
      background: tokens.card,
      border: `1px solid ${tokens.cardBorder}`,
      borderRadius: 12,
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 12
    }}
  >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexDirection: isRtl ? "row-reverse" : "row" }}>
              <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: tokens.primary, background: tokens.primaryLight, border: `1px solid ${tokens.citationBorder}`, borderRadius: 6, padding: "3px 9px" }}>
                {row.course.id}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: bFont, fontSize: 12, fontWeight: 600, color: tokens.primary }}>
                <IconClipboard size={13} color={tokens.primary} />
                {row.pending} {lang === "ar" ? "بانتظار المراجعة" : "pending"}
              </span>
            </div>

            <div style={{ textAlign: isRtl ? "right" : "left" }}>
              <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em", marginBottom: 3 }}>
                {lang === "ar" ? row.course.title.ar : row.course.title.en}
              </div>
              <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textMuted }}>
                {row.course.enrolled} {lang === "ar" ? "طالباً" : "students"} · {row.quick} {lang === "ar" ? "جاهز سريعاً" : "quick-ready"}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 7, textAlign: isRtl ? "right" : "left" }}>
              {row.unaddressed > 0 ? <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: bFont, fontSize: 12, color: tokens.gap, flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <IconWarning size={13} color={tokens.gap} />
                  {lang === "ar" ? "نمط خطأ شائع لم يُعالج بعد" : "Common error pattern not addressed yet"}
                </div> : <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textFaint }}>
                  {lang === "ar" ? "لا أنماط خطأ غير معالجة" : "No unaddressed error patterns"}
                </div>}
              {row.coverage > 0 ? <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: bFont, fontSize: 12, color: tokens.gap, flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <IconWarning size={13} color={tokens.gap} />
                  {row.coverage} {lang === "ar" ? "موضوع بلا مواد معتمدة" : "topic with zero approved materials"}
                </div> : <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textFaint }}>
                  {lang === "ar" ? "كل المواضيع لها مواد معتمدة" : "All topics have approved materials"}
                </div>}
            </div>

            <button
    onClick={() => openWorkspace(row.course.id)}
    style={{
      marginTop: "auto",
      width: "100%",
      padding: "9px 0",
      borderRadius: 8,
      border: `1px solid ${tokens.primary}44`,
      background: tokens.primaryLight,
      color: tokens.primary,
      fontFamily: bFont,
      fontWeight: 600,
      fontSize: 12.5,
      cursor: "pointer"
    }}
  >
              {lang === "ar" ? "افتح مساحة العمل" : "Open workspace"}
            </button>
          </div>)}
      </div>
    </div>;
}

function RealInstructorHome({ state, dispatch }) {
  const mobile = useMediaQuery("(max-width: 760px)");
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);

  const [createOpen, setCreateOpen] = useState(false);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const policy = await getCreationPolicy().catch(() => null);
    const home = await getInstructorHome();
    const list = home?.courses ?? [];
    const entries = await Promise.all(
      list.map(async (course) => {
        const [roster, gaps, analytics] = await Promise.all([
          listEnrollments(course.courseId, { page: 1, limit: 1 }).catch(() => ({ total: 0 })),
          getCoverageGaps(course.courseId).catch(() => null),
          getCourseAnalytics(course.courseId).catch(() => null),
        ]);
        const materials = analytics?.totals?.materials ?? {};
        return [
          course.courseId,
          {
            enrolled: roster?.total ?? 0,
            gaps: gaps?.items?.length ?? 0,
            processing: Math.max((materials.totalCount ?? 0) - (materials.readyCount ?? 0), 0),
          },
        ];
      }),
    );
    return { courses: list, byId: Object.fromEntries(entries), policy };
  }, []);
  const { data, loading, error, reload } = useAsync(load);

  const canCreate = data?.policy?.allowDoctorCourseCreation === true;
  const canSubmitCode = code.trim().length > 0 && title.trim().length > 0;

  const submitCreate = async () => {
    if (!canSubmitCode || creating) return;
    setCreating(true);
    try {
      await createCourse({
        code: code.trim().toUpperCase(),
        title: title.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      setCreateOpen(false);
      setCode("");
      setTitle("");
      setDescription("");
      toast(t("Course created — the institution already sees it, waiting for its first materials.", "أُنشئ المقرر — يظهر لدى الإدارة الآن بانتظار مواده الأولى."));
      reload();
    } catch (err) {
      toast(err?.message ?? t("Could not create the course.", "تعذّر إنشاء المقرر."));
    } finally {
      setCreating(false);
    }
  };

  const courses = [...(data?.courses ?? [])].sort(
    (a, b) => (b.pendingReviewCount - a.pendingReviewCount) || (b.fastTrackCount - a.fastTrackCount),
  );
  const byId = data?.byId ?? {};
  const pendingTotal = courses.reduce((sum, course) => sum + (course.pendingReviewCount ?? 0), 0);
  const quickTotal = courses.reduce((sum, course) => sum + (course.fastTrackCount ?? 0), 0);
  const mostUrgent = courses[0] ?? null;
  const openWorkspace = (courseId) => dispatch({ type: "NAVIGATE", screen: SCREENS.COURSE_WORKSPACE, courseId, tab: "assignments" });

  return (
    <div className="genai-pad" style={{ padding: mobile ? 16 : "28px 32px", maxWidth: 1080, margin: "0 auto", direction: isRtl ? "rtl" : "ltr" }}>
      <div style={{ marginBottom: 20, textAlign: isRtl ? "right" : "left" }}>
        <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: "0 0 3px" }}>
          {t("Instructor Workspace", "مساحة المدرّس")}
        </h1>
        <p style={{ fontSize: 13, color: tokens.textMuted, margin: 0, fontFamily: bFont }}>
          {t("All your courses in one view, ordered by urgency.", "كل مقرراتك في عرض واحد، مرتّبة حسب الإلحاح.")}
        </p>
      </div>

      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Loading your courses…", "جاري تحميل مقرراتك…")}>
        {data && pendingTotal === 0 && (
          <div style={{ background: tokens.card, border: `1px solid ${tokens.cardBorder}`, borderRadius: 12, padding: "34px 24px", marginBottom: 20, textAlign: "center" }}>
            <div style={{ display: "inline-flex", width: 44, height: 44, borderRadius: "50%", background: tokens.primaryLight, border: `1px solid ${tokens.citationBorder}`, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <IconClipboard size={18} color={tokens.primary} />
            </div>
            <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 16, color: tokens.textPrimary, letterSpacing: "-0.02em", marginBottom: 4 }}>
              {t("No submissions need review right now", "لا تسليمات تحتاج مراجعة الآن")}
            </div>
            <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted }}>
              {courses.length === 0
                ? t("You are not staffed on any course yet — create one from My Courses.", "لسه مش مشارك في أي مقرر — أنشئ واحد من «مقرراتي».")
                : t("Everything is handled — new submissions will surface here as they arrive.", "كل شيء معالَج — التسليمات الجديدة هتظهر هنا أول ما توصل.")}
            </div>
          </div>
        )}
        {data && pendingTotal > 0 && mostUrgent && (
          <div style={{ background: tokens.primaryLight, border: `1px solid ${tokens.primary}33`, borderRadius: 12, padding: "20px 24px", marginBottom: 20, display: "flex", alignItems: mobile ? "stretch" : "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap", flexDirection: mobile ? "column" : isRtl ? "row-reverse" : "row" }}>
            <div style={{ textAlign: isRtl ? "right" : "left" }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: tokens.textMuted, letterSpacing: "0.1em", marginBottom: 8 }}>
                {t("NEEDS YOUR ATTENTION", "يحتاج انتباهك")}
              </div>
              <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 20 : 24, color: tokens.textPrimary, letterSpacing: "-0.03em", marginBottom: 4 }}>
                {pendingTotal} {t("pending submissions", "تسليماً بانتظار المراجعة")}
              </div>
              <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textSecondary }}>
                {quickTotal} {t("ready for quick approval", "جاهز للاعتماد السريع")}
              </div>
            </div>
            <button
              onClick={() => openWorkspace(mostUrgent.courseId)}
              className="genai-cta"
              style={{ padding: "11px 18px", borderRadius: 9, border: "none", background: tokens.primaryBtn, color: "#fff", fontFamily: hFont, fontWeight: 600, fontSize: 13, cursor: "pointer", boxShadow: tokens.primaryShadow, flexShrink: 0, ...(mobile ? { width: "100%" } : {}) }}
            >
              {t(`Open ${mostUrgent.code ?? mostUrgent.courseId} workspace`, `افتح مساحة ${mostUrgent.code ?? mostUrgent.courseId}`)}
            </button>
          </div>
        )}

        {data && (
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: mobile ? 12 : 16 }}>
            {courses.map((course) => {
              const detail = byId[course.courseId] ?? { enrolled: 0, gaps: 0, processing: 0 };
              return (
                <div key={course.courseId} style={{ background: tokens.card, border: `1px solid ${tokens.cardBorder}`, borderRadius: 12, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexDirection: isRtl ? "row-reverse" : "row" }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: tokens.primary, background: tokens.primaryLight, border: `1px solid ${tokens.citationBorder}`, borderRadius: 6, padding: "3px 9px" }}>
                      {course.code ?? course.courseId}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: bFont, fontSize: 12, fontWeight: 600, color: tokens.primary }}>
                      <IconClipboard size={13} color={tokens.primary} />
                      {course.pendingReviewCount} {t("pending", "بانتظار المراجعة")}
                    </span>
                  </div>

                  <div style={{ textAlign: isRtl ? "right" : "left" }}>
                    <div style={{ fontFamily: hFont, fontWeight: 600, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em", marginBottom: 3 }}>
                      {course.title}
                    </div>
                    <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textMuted }}>
                      {detail.enrolled} {t("students", "طالباً")} · {course.fastTrackCount} {t("quick-ready", "جاهز سريعاً")}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 7, textAlign: isRtl ? "right" : "left" }}>
                    {detail.gaps > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: bFont, fontSize: 12, color: tokens.gap, flexDirection: isRtl ? "row-reverse" : "row" }}>
                        <IconWarning size={13} color={tokens.gap} />
                        {detail.gaps} {t("topics with no assignment coverage", "موضوع بلا تغطية في التكليفات")}
                      </div>
                    ) : (
                      <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textFaint }}>
                        {t("All topics covered by assignments", "كل المواضيع مغطاة بتكليفات")}
                      </div>
                    )}
                    {detail.processing > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: bFont, fontSize: 12, color: tokens.gap, flexDirection: isRtl ? "row-reverse" : "row" }}>
                        <IconWarning size={13} color={tokens.gap} />
                        {detail.processing} {t("materials still processing", "مواد لسه بتتم معالجتها")}
                      </div>
                    ) : (
                      <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textFaint }}>
                        {t("All materials ready", "كل المواد جاهزة")}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => openWorkspace(course.courseId)}
                    style={{ marginTop: "auto", width: "100%", padding: "9px 0", borderRadius: 8, border: `1px solid ${tokens.primary}44`, background: tokens.primaryLight, color: tokens.primary, fontFamily: bFont, fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}
                  >
                    {t("Open workspace", "افتح مساحة العمل")}
                  </button>
                </div>
              );
            })}
            {canCreate && (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                style={{ background: tokens.card, border: `1.5px dashed ${tokens.cardBorder}`, borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", flexDirection: isRtl ? "row-reverse" : "row", textAlign: isRtl ? "right" : "left" }}
              >
                <span style={{ display: "inline-flex", width: 34, height: 34, borderRadius: 9, background: tokens.primaryLight, border: `1px solid ${tokens.citationBorder}`, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <IconPlus size={16} color={tokens.primary} />
                </span>
                <span style={{ fontFamily: hFont, fontWeight: 600, fontSize: 14, color: tokens.textPrimary }}>
                  {t("New course", "مقرر جديد")}
                </span>
                <span style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textFaint, lineHeight: 1.6, maxWidth: 220 }}>
                  {t("Your institution lets doctors create course shells — the admin sees each one the moment it exists.", "مؤسستك تسمح لك بإنشاء مقررات داخل قسمك — تظهر للإدارة فور إنشائها.")}
                </span>
              </button>
            )}
          </div>
        )}
        {data && (
          <p style={{ fontFamily: bFont, fontSize: 11, color: tokens.textFaint, margin: "14px 0 0", textAlign: isRtl ? "right" : "left" }}>
            {t("Snapshots recompute automatically after every finalized submission.", "اللقطات بتتحسب من جديد تلقائياً بعد كل تسليم معتمد.")}
          </p>
        )}
      </AsyncGate>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        tokens={tokens}
        lang={lang}
        title={t("Create a new course", "إنشاء مقرر جديد")}
        subtitle={t("A course shell inside your department — materials are uploaded from Content Studio afterwards.", "هيكل مقرر داخل قسمك — المواد تُرفع لاحقًا من استوديو المحتوى.")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field
            tokens={tokens}
            lang={lang}
            label={t("Course code", "كود المقرر")}
            required
            hint={t("The first digit encodes the year — students see the year chip from the code (e.g. CS310 → year 3).", "أول رقم في الكود يحمل السنة — الطلاب يرون شريحة السنة من الكود (مثال: CS310 → سنة ٣).")}
          >
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} style={{ ...inputStyle(tokens, bFont), direction: "ltr", textAlign: "left" }} placeholder="CS310" />
          </Field>
          <Field tokens={tokens} lang={lang} label={t("Course title", "اسم المقرر")} required>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ ...inputStyle(tokens, bFont) }} placeholder={t("e.g. Mobile Application Development", "مثال: تطوير تطبيقات المحمول")} />
          </Field>
          <Field tokens={tokens} lang={lang} label={t("Description (optional)", "الوصف (اختياري)")}>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={{ ...textareaStyle(tokens, bFont) }} placeholder={t("One line shown to students in the institution catalog.", "سطر واحد يظهر للطلاب في كتالوج المؤسسة.")} />
          </Field>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
            <IconCheck size={12} color={tokens.textFaint} />
            <span style={{ fontFamily: bFont, fontSize: 11, color: tokens.textFaint, lineHeight: 1.6 }}>
              {t(
                "The new shell shows up in institution analytics as a course without materials until your first approved upload.",
                "المقرر الجديد يظهر في تحليلات المؤسسة كمقرر بلا مواد حتى ترفع أول محتوى معتمد.",
              )}
            </span>
          </div>
          <button
            type="button"
            disabled={!canSubmitCode || creating}
            onClick={submitCreate}
            style={{ width: "100%", padding: "11px 0", fontSize: 13.5, justifyContent: "center", borderRadius: 9, border: "none", background: tokens.primaryBtn, color: "#fff", fontFamily: hFont, fontWeight: 600, cursor: canSubmitCode && !creating ? "pointer" : "not-allowed", opacity: canSubmitCode && !creating ? 1 : 0.55 }}
          >
            {creating ? t("Creating…", "جاري الإنشاء…") : t("Create course", "إنشاء المقرر")}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default function InstructorHomePage(props) {
  if (demoMode()) return <DemoInstructorHomePage {...props} />;
  return <RealInstructorHome {...props} />;
}
