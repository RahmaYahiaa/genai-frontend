import { useCallback, useEffect, useState } from "react";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { AsyncGate, Chip, Btn } from "@/components/ui";
import { Drawer, Field, textareaStyle, toast, bFontFor } from "@/components/ModuleUI";
import { listRequests, getRequestProof, decideRequest } from "@/services/admin";
import { demoMode } from "@/services/auth";

const STATUS_TABS = ["PENDING", "APPROVED", "REJECTED"];

export default function AdminRequestsPage({ state }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const bFont = bFontFor(lang);
  const hFont = headingFont(lang);
  const mobile = useMediaQuery("(max-width: 860px)");

  const [tab, setTab] = useState("PENDING");
  const [page, setPage] = useState(1);
  const fetchRequests = useCallback(() => listRequests({ status: tab, page }), [tab, page]);
  const { data, loading, error, reload } = useAsync(fetchRequests);

  const [openRequest, setOpenRequest] = useState(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [proof, setProof] = useState(null);
  const [proofError, setProofError] = useState(null);
  const [busy, setBusy] = useState(false);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 20));

  useEffect(() => {
    setDecisionNote("");
    setProof(null);
    setProofError(null);
    if (openRequest?.hasProof) {
      getRequestProof(openRequest.id)
        .then(setProof)
        .catch((err) => setProofError(err.message));
    }
  }, [openRequest?.id]);

  async function decide(decision) {
    if (decision === "REJECTED" && !decisionNote.trim()) {
      toast(t("A written reason is required when rejecting a request.", "سبب الرفض مطلوب عند رفض الطلب."));
      return;
    }
    setBusy(true);
    try {
      const result = await decideRequest(openRequest.id, decision, decisionNote);
      if (decision === "APPROVED") {
        toast(
          result.enrollmentCreated
            ? t("Approved — the student is enrolled in the course right now.", "اتقبل — الطالب اتسجّل في المقرر لحظيًا.")
            : t("Approved — request closed (student was already enrolled).", "اتقبل — الطلب اتقفل (الطالب كان مسجلًا بالفعل)."),
        );
      } else {
        toast(t("Rejected with your written reason.", "اترفض بالسبب المكتوب."));
      }
      setOpenRequest(null);
      reload();
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  const tabChip = (id) => (
    <button
      key={id}
      onClick={() => {
        setTab(id);
        setPage(1);
      }}
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        cursor: "pointer",
        fontFamily: bFont,
        fontSize: 12,
        fontWeight: tab === id ? 600 : 500,
        background: tab === id ? tokens.primaryLight : tokens.card,
        border: `1px solid ${tab === id ? tokens.primary : tokens.cardBorder}`,
        color: tab === id ? tokens.primary : tokens.textSecondary,
      }}
    >
      {id === "PENDING" ? t("pending", "معلقة") : id === "APPROVED" ? t("approved", "مقبولة") : t("rejected", "مرفوضة")}
    </button>
  );

  if (demoMode()) {
    return (
      <div style={{ padding: 28, maxWidth: 720, margin: "0 auto", fontFamily: bodyFont(lang) }}>
        <div style={{ fontFamily: hFont, fontWeight: 800, fontSize: 16, color: tokens.textPrimary }}>
          {t("Request review needs the real backend — set VITE_API_URL.", "مراجعة الطلبات محتاجة الباك إند الحقيقي — اضبطي VITE_API_URL.")}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: mobile ? 16 : "26px 32px", maxWidth: 1080, margin: "0 auto", fontFamily: bodyFont(lang) }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: "0 0 4px", fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, letterSpacing: "-0.025em", color: tokens.textPrimary }}>
          {t("Join requests", "طلبات الانضمام")}
        </h1>
        <p style={{ margin: 0, fontFamily: bFont, fontSize: 13, color: tokens.textMuted, maxWidth: 720, lineHeight: 1.7 }}>
          {t(
            "Students asking to join institution courses, with their notes and proof files. Approval enrolls the student instantly; rejection always carries your written reason to the record.",
            "طلاب بيطلبوا الانضمام لمقررات المؤسسة بملاحظاتهم وملفات الإثبات. القبول بيسجّل الطالب لحظيًا؛ والرفض بيتسجّل بالسبب المكتوب.",
          )}
        </p>
      </div>

      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Loading requests…", "جاري تحميل الطلبات…")}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
          {STATUS_TABS.map(tabChip)}
          <span style={{ fontFamily: bFont, fontSize: 12, color: tokens.textFaint, marginInlineStart: "auto" }}>
            {t(`${total} total`, `${total} إجمالي`)}
          </span>
        </div>

        {items.length === 0 ? (
          <div style={{ padding: 26, textAlign: "center", fontFamily: bFont, fontSize: 13, color: tokens.textMuted, border: `1px dashed ${tokens.cardBorder}`, borderRadius: 12 }}>
            {tab === "PENDING" ? t("The queue is clear — nothing waits for a decision.", "الطابور فاضي — مفيش حاجة ناطرة قرار.") : t("Nothing in this state yet.", "مفيش طلبات بالحالة دي لسه.")}
          </div>
        ) : (
          <div style={{ border: `1px solid ${tokens.cardBorder}`, borderRadius: 12, background: tokens.card, overflow: "hidden" }}>
            {items.map((request, index) => {
              const studentLabel = request.student ? `${request.student.firstName} ${request.student.lastName}` : t("a student", "طالب");
              const courseLabel = request.course ? `${request.course.code ?? ""} ${request.course.title}`.trim() : t("a course", "مقرر");
              return (
                <button
                  key={request.id}
                  onClick={() => setOpenRequest(request)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    background: "transparent",
                    border: "none",
                    borderTop: index === 0 ? "none" : `1px solid ${tokens.cardBorder}`,
                    cursor: "pointer",
                    textAlign: isRtl ? "right" : "left",
                    flexDirection: isRtl ? "row-reverse" : "row",
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontFamily: bFont, fontWeight: 600, fontSize: 13.5, color: tokens.textPrimary, display: "block" }}>
                      {studentLabel}
                      <span style={{ fontWeight: 400, color: tokens.textMuted }}> → {courseLabel}</span>
                    </span>
                    <span style={{ display: "block", fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted }}>
                      {request.student?.email}
                    </span>
                    {request.studentNote ? (
                      <span style={{ display: "block", fontFamily: bFont, fontSize: 12, color: tokens.textSecondary, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        “{request.studentNote}”
                      </span>
                    ) : null}
                  </span>
                  {request.hasProof ? <Chip tokens={tokens} tone="primary">{t("proof attached", "إثبات مرفق")}</Chip> : null}
                  <span style={{ fontFamily: bFont, fontSize: 11, color: tokens.textFaint, flexShrink: 0 }}>
                    {new Date(request.createdAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB")}
                  </span>
                  {request.status !== "PENDING" ? (
                    <Chip tokens={tokens} tone={request.status === "APPROVED" ? "mastered" : "gap"}>
                      {request.status === "APPROVED" ? t("approved", "مقبول") : t("rejected", "مرفوض")}
                    </Chip>
                  ) : (
                    <Chip tokens={tokens} tone="developing">{t("needs decision", "محتاج قرار")}</Chip>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {pages > 1 && (
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}>
            <Btn tokens={tokens} variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              {t("Previous", "السابق")}
            </Btn>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: tokens.textMuted, alignSelf: "center" }}>
              {page} / {pages}
            </span>
            <Btn tokens={tokens} variant="ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              {t("Next", "التالي")}
            </Btn>
          </div>
        )}
      </AsyncGate>

      <Drawer
        open={Boolean(openRequest)}
        onClose={() => setOpenRequest(null)}
        title={openRequest?.student ? `${openRequest.student.firstName} ${openRequest.student.lastName}` : ""}
        subtitle={openRequest?.student?.email ?? ""}
        tokens={tokens}
        lang={lang}
      >
        {openRequest && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, background: tokens.card, padding: "12px 14px" }}>
              <div style={{ fontFamily: bFont, fontWeight: 700, fontSize: 12.5, color: tokens.textPrimary, marginBottom: 6 }}>
                {t("Course", "المقرر")}
              </div>
              <div style={{ fontFamily: bFont, fontSize: 13, color: tokens.textSecondary }}>
                {openRequest.course ? `${openRequest.course.code ?? ""} — ${openRequest.course.title}` : "—"}
              </div>
              <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textFaint, marginTop: 4 }}>
                {new Date(openRequest.createdAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB")}
              </div>
              {openRequest.studentNote ? (
                <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textSecondary, marginTop: 8, lineHeight: 1.7, borderTop: `1px dashed ${tokens.cardBorder}`, paddingTop: 8 }}>
                  {t("Student's note:", "ملاحظة الطالب:")} “{openRequest.studentNote}”
                </div>
              ) : null}
            </div>

            {openRequest.hasProof ? (
              <div style={{ border: `1px dashed ${tokens.cardBorder}`, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ fontFamily: bFont, fontWeight: 700, fontSize: 12.5, color: tokens.textPrimary }}>
                    {t("Proof attachment", "الإثبات المرفق")}
                  </div>
                  <Chip tokens={tokens}>{openRequest.proofFileName}</Chip>
                </div>
                {!proof && !proofError ? (
                  <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textMuted }}>{t("Loading proof…", "جاري تحميل الإثبات…")}</div>
                ) : null}
                {proofError ? (
                  <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.gap }}>{proofError}</div>
                ) : null}
                {proof?.mimeType === "application/pdf" ? (
                  <Btn
                    tokens={tokens}
                    variant="ghost"
                    onClick={() => {
                      const bytes = Uint8Array.from(atob(proof.data), (c) => c.charCodeAt(0));
                      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
                      window.open(url, "_blank", "noopener");
                    }}
                  >
                    {t("Open PDF in a new tab", "افتحي الـ PDF في تاب جديد")}
                  </Btn>
                ) : proof?.data ? (
                  <img
                    src={`data:${proof.mimeType};base64,${proof.data}`}
                    alt={proof.fileName}
                    style={{ maxWidth: "100%", borderRadius: 8, border: `1px solid ${tokens.cardBorder}`, display: "block" }}
                  />
                ) : null}
                {proof?.size ? (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: tokens.textFaint, marginTop: 6 }}>
                    {proof.mimeType} · {Math.round(proof.size / 1024)} KB
                  </div>
                ) : null}
              </div>
            ) : (
              <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textFaint }}>
                {t("No proof attached to this request.", "مفيش إثبات مرفق بالطلب ده.")}
              </div>
            )}

            {openRequest.status === "PENDING" ? (
              <>
                <Field tokens={tokens} lang={lang} label={t("Decision note — required when rejecting, optional when approving", "ملاحظة القرار — إجبارية عند الرفض، اختيارية عند القبول")}>
                  <textarea
                    value={decisionNote}
                    onChange={(event) => setDecisionNote(event.target.value)}
                    placeholder={t("e.g. section capacity is full this term", "مثال: السعة مكتملة هذا الفصل")}
                    rows={3}
                    style={{ ...textareaStyle(tokens, bFont), width: "100%", lineHeight: 1.7 }}
                  />
                </Field>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn tokens={tokens} disabled={busy} full onClick={() => decide("APPROVED")}>
                    {busy ? t("Deciding…", "جاري البت…") : t("Approve — enroll now", "قبول — سجّل الآن")}
                  </Btn>
                  <Btn
                    tokens={tokens}
                    variant="ghost"
                    disabled={busy}
                    full
                    onClick={() => decide("REJECTED")}
                  >
                    {t("Reject (reason required)", "رفض (السبب إجباري)")}
                  </Btn>
                </div>
              </>
            ) : (
              <div style={{ border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, background: tokens.card, padding: "12px 14px" }}>
                <Chip tokens={tokens} tone={openRequest.status === "APPROVED" ? "mastered" : "gap"} style={{ marginBottom: 8 }}>
                  {openRequest.status === "APPROVED" ? t("approved", "اتقبل") : t("rejected", "اترفض")}
                </Chip>
                <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textSecondary, marginTop: 6, lineHeight: 1.7 }}>
                  {openRequest.decisionNote ? `“${openRequest.decisionNote}”` : t("No note recorded.", "بلا ملاحظة مسجلة.")}
                </div>
                <div style={{ fontFamily: bFont, fontSize: 11, color: tokens.textFaint, marginTop: 6 }}>
                  {openRequest.decidedAt ? new Date(openRequest.decidedAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB") : ""}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
