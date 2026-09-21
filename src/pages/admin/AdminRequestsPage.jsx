import { useCallback, useEffect, useState } from "react";
import useAsync from "@/hooks/useAsync";
import { tk, bodyFont } from "@/constants/tokens";
import { AsyncGate } from "@/components/ui";
import { AlertStrip, Btn, Card, Chip, ConfirmBtn, Drawer, Field, PillTabs, textareaStyle, toast, bFontFor, hFontFor } from "@/components/ModuleUI";
import { IconInbox, IconDoc, IconImageAttach, IconCheck, IconBan, IconClock, IconEye, IconShield, IconDownload } from "@/components/Icons";
import { listRequests, getRequestProof, decideRequest } from "@/services/admin";
import { demoMode } from "@/services/auth";
import { useAdmin } from "@/store/admin-context";

const MONO = "'JetBrains Mono', monospace";
const FILTERS = [
  { id: "pending", status: "PENDING" },
  { id: "accepted", status: "APPROVED" },
  { id: "rejected", status: "REJECTED" },
];

const daysAgo = (iso) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 864e5));

export default function AdminRequestsPage({ state }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const admin = useAdmin();
  const canReview = admin.hasScope("requests.review");
  const demo = demoMode();

  const [filter, setFilter] = useState("pending");
  const [openId, setOpenId] = useState(null);
  const [note, setNote] = useState("");
  const [counts, setCounts] = useState({ pending: 0, accepted: 0, rejected: 0 });
  const [proofBusy, setProofBusy] = useState(false);
  const [proofView, setProofView] = useState(null);
  const [decisionBusy, setDecisionBusy] = useState(null);
  const [decisionError, setDecisionError] = useState("");

  const statusParam = FILTERS.find((f) => f.id === filter).status;
  const fetchList = useCallback(async () => {
    if (demo || !canReview) return { items: [] };
    const data = await listRequests({ status: statusParam, page: 1, limit: 20 });
    return { items: data?.items ?? [] };
  }, [demo, canReview, statusParam]);

  const { data, loading, error, reload } = useAsync(fetchList);
  const shown = data?.items ?? [];
  const open = shown.find((r) => r.id === openId) ?? null;
  const noteOk = note.trim().length > 0;

  useEffect(() => {
    if (demo || !canReview) return undefined;
    let alive = true;
    Promise.all(
      FILTERS.map(async (f) => {
        const res = await listRequests({ status: f.status, page: 1, limit: 1 });
        return [f.id, res?.total ?? 0];
      }),
    ).then((pairs) => {
      if (alive) setCounts(Object.fromEntries(pairs));
    }).catch(() => {});
    return () => {
      alive = false;
    };
  }, [demo, canReview, data]);

  const studentName = (r) => (r.student ? `${r.student.firstName} ${r.student.lastName}` : r.studentId);
  const courseLabel = (r) => (r.course?.code ? `${r.course.code} · ${r.course.title}` : (r.course?.title ?? r.courseId));

  const statusChip = (s) =>
    s === "PENDING"
      ? <Chip tokens={tokens} tone="peri">{t("Waiting for review", "بانتظار المراجعة")}</Chip>
      : s === "APPROVED"
        ? <Chip tokens={tokens} tone="primary">{t("Accepted", "مقبول")}</Chip>
        : <Chip tokens={tokens} tone="violet">{t("Rejected", "مرفوض")}</Chip>;

  const decodeProofBytes = (payload) => {
    const raw = payload?.data;
    if (raw?.type === "Buffer" && Array.isArray(raw.data)) return new Uint8Array(raw.data);
    if (typeof raw === "string" && raw.length > 0) {
      const binary = window.atob(raw.replace(/\s+/g, ""));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      return bytes;
    }
    return null;
  };

  const proofToView = (proof) => {
    const bytes = decodeProofBytes(proof);
    if (!bytes) return { kind: "unsupported", fileName: proof?.fileName ?? "" };
    const blob = new Blob([bytes], { type: proof.mimeType || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    return {
      kind: (proof.mimeType ?? "").startsWith("image/")
        ? "image"
        : proof.mimeType === "application/pdf"
          ? "pdf"
          : "download",
      url,
      fileName: proof.fileName,
      mimeType: proof.mimeType,
    };
  };

  useEffect(() => {
    let revokedUrl = null;
    if (!open || !open.hasProof) {
      setProofView(null);
      return undefined;
    }
    let alive = true;
    setProofBusy(true);
    getRequestProof(open.id)
      .then((proof) => {
        if (!alive) return;
        const view = proofToView(proof);
        if (view.url) revokedUrl = view.url;
        setProofView(view);
        setProofBusy(false);
      })
      .catch((err) => {
        if (alive) {
          setProofView({ kind: "error", message: err?.message ?? "" });
          setProofBusy(false);
        }
      });
    return () => {
      alive = false;
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open?.id]);

  const downloadProof = async () => {
    if (!open) return;
    setProofBusy(true);
    try {
      const proof = await getRequestProof(open.id);
      const bytes = decodeProofBytes(proof);
      if (!bytes) throw new Error(t("Proof payload was not readable.", "محتوى الإثبات غير قابل للقراءة."));
      const blob = new Blob([bytes], { type: proof.mimeType || "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = proof.fileName || "proof";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast(err?.message ?? t("Could not download the proof file.", "تعذر تنزيل ملف الإثبات."));
    } finally {
      setProofBusy(false);
    }
  };

  const decide = (decision) => {
    if (!open || decisionBusy) return;
    setDecisionBusy(decision);
    setDecisionError("");
    decideRequest(open.id, decision, note.trim() || undefined)
      .then(() => {
        toast(decision === "APPROVED"
          ? t("Request accepted — the student lands in the course immediately, and the decision is audit-logged.", "قُبل الطلب — يصل الطالب للمقرر فورًا والقرار مسجل في التدقيق.")
          : t("Request rejected with your reason — the student sees it in his notifications, and the decision is audit-logged.", "رُفض الطلب بسببك — يراه الطالب في إشعاراته والقرار مسجل في التدقيق."));
        setOpenId(null);
        reload();
      })
      .catch((err) => {
        setDecisionError(err?.message ?? t("Could not record the decision.", "تعذر تسجيل القرار."));
      })
      .finally(() => setDecisionBusy(null));
  };

  if (demo) {
    return (
      <div style={{ padding: "26px 32px", maxWidth: 720, margin: "0 auto", fontFamily: bodyFont(lang) }}>
        <AlertStrip
          tokens={tokens}
          lang={lang}
          tone="violet"
          icon={<IconShield size={14} color={tokens.gap} />}
          title={t("Admin module requires the real backend", "وحدة إدارة المؤسسة بتشتغل مع الباك إند الحقيقي بس")}
          body={t(
            "Set VITE_API_URL to your running backend (ending with /api/v1), restart the frontend, then sign in with your institution admin account.",
            "اضبطي VITE_API_URL على الباك إند الشغال (منتهيًا بـ /api/v1)، اعملي إعادة تشغيل للفرونت، وسجّلي دخولك بحساب مسؤول المؤسسة.",
          )}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "26px 32px", maxWidth: 980, margin: "0 auto", direction: isRtl ? "rtl" : "ltr", textAlign: isRtl ? "right" : "left", fontFamily: bodyFont(lang) }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: "0 0 4px" }}>
          {t("Out-of-year requests", "طلبات خارج السنة")}
        </h1>
        <p style={{ fontFamily: bFont, fontSize: 13, color: tokens.textMuted, margin: 0 }}>
          {t("Proof-backed exceptions — decided one by one, never by accident.", "استثناءات مدعومة بإثباتات — تُبت واحدًا واحدًا ولا تقع بالمصادفة.")}
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <AlertStrip
          tokens={tokens}
          lang={lang}
          tone="peri"
          icon={<IconInbox size={14} color={tokens.primary} />}
          title={t(
            "A student outside the course year can not enroll by code — he requests, attaches the official exception, and your decision both grants the seat and reaches his notifications.",
            "الطالب خارج سنة المقرر لا يسجل بالكود — يطلب ويرفق الاستثناء الرسمي، وقرارك يمنح المقعد ويصل لإشعاراته معًا.",
          )}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <PillTabs
          tokens={tokens}
          lang={lang}
          active={filter}
          onSelect={(id) => {
            setFilter(id);
            setOpenId(null);
          }}
          tabs={[
            { id: "pending", label: `${t("Pending", "معلقة")} · ${counts.pending}` },
            { id: "accepted", label: `${t("Accepted", "مقبولة")} · ${counts.accepted}` },
            { id: "rejected", label: `${t("Rejected", "مرفوضة")} · ${counts.rejected}` },
          ]}
        />
      </div>

      <AsyncGate
        tokens={tokens}
        lang={lang}
        loading={admin.loading || loading}
        error={admin.error || error}
        reload={async () => {
          await admin.reload();
          await reload();
        }}
        label={t("Loading requests…", "جاري تحميل الطلبات…")}
      >
        {!canReview ? (
          <AlertStrip
            tokens={tokens}
            lang={lang}
            tone="violet"
            icon={<IconShield size={14} color={tokens.gap} />}
            title={t("This page needs the requests.review scope", "هذه الصفحة تحتاج نطاق requests.review")}
            body={t("Ask your super admin to grant you the scope, or return to the health dashboard.", "اطلب من السوبر أدمن منحك النطاق، أو عُد إلى لوحة الصحة.")}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {shown.map((r) => {
              const waiting = daysAgo(r.createdAt);
              const isImage = (r.proofMimeType ?? "").startsWith("image/");
              return (
                <Card tokens={tokens} key={r.id} style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                        <span style={{ fontFamily: bFont, fontWeight: 600, fontSize: 13.5, color: tokens.textPrimary }}>{studentName(r)}</span>
                        {r.student?.email && <Chip tokens={tokens} tone="slate">{r.student.email}</Chip>}
                        {statusChip(r.status)}
                      </div>
                      <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textSecondary, marginTop: 6 }}>
                        <span style={{ fontFamily: MONO, fontSize: 11.5 }}>{r.course?.code}</span>
                        {r.course?.code ? "  ·  " : ""}
                        {r.course?.title}
                      </div>
                      {r.studentNote && (
                        <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textMuted, marginTop: 6, lineHeight: 1.65 }}>{r.studentNote}</div>
                      )}
                      {r.hasProof && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
                          <span style={{ display: "inline-flex", gap: 5, alignItems: "center", fontFamily: MONO, fontSize: 10, color: tokens.textSecondary, background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 5, padding: "3px 8px" }}>
                            {isImage ? <IconImageAttach size={11} color={tokens.textSecondary} /> : <IconDoc size={11} color={tokens.textSecondary} />}
                            {r.proofFileName}
                          </span>
                        </div>
                      )}
                      {r.status !== "PENDING" && (
                        <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textFaint, marginTop: 8 }}>
                          {t("Decided", "تم البت")}
                          {r.decisionNote ? ` — “${r.decisionNote}”` : ""}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: isRtl ? "flex-start" : "flex-end", flexShrink: 0 }}>
                      {r.status === "PENDING" ? (
                        <>
                          <Btn tokens={tokens} lang={lang} variant="soft" style={{ padding: "8px 14px", fontSize: 12.5 }} onClick={() => { setNote(""); setOpenId(r.id); }}>
                            <IconEye size={13} color={tokens.primary} />
                            {t("Review proofs & decide", "راجع الإثباتات وابت")}
                          </Btn>
                          <span style={{ display: "inline-flex", gap: 5, alignItems: "center", fontFamily: MONO, fontSize: 10.5, color: waiting >= 3 ? tokens.gap : tokens.textFaint }}>
                            <IconClock size={11} color={waiting >= 3 ? tokens.gap : tokens.textFaint} />
                            {waiting > 0 ? t(`waiting ${waiting}d`, `معلق منذ ${waiting} يوم`) : t("submitted today", "قُدم اليوم")}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontFamily: MONO, fontSize: 10.5, color: tokens.textFaint }}>
                          {r.decidedAt ? t(`${daysAgo(r.decidedAt)}d ago`, `منذ ${daysAgo(r.decidedAt)} يوم`) : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
            {shown.length === 0 && (
              <Card tokens={tokens} style={{ padding: "26px 18px", textAlign: "center" }}>
                <div style={{ fontFamily: bFont, fontSize: 13, color: tokens.textMuted }}>
                  {filter === "pending"
                    ? t("Nothing waiting — every request has been decided.", "لا شيء معلق — كل الطلبات تم البت فيها.")
                    : t("No requests under this filter yet.", "لا طلبات تحت هذا الفلتر بعد.")}
                </div>
              </Card>
            )}
          </div>
        )}
      </AsyncGate>

      <Drawer
        open={open !== null}
        onClose={() => setOpenId(null)}
        tokens={tokens}
        lang={lang}
        title={open ? `${studentName(open)} → ${courseLabel(open)}` : ""}
        subtitle={open?.student?.email}
      >
        {open && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
              {open.course?.code && <Chip tokens={tokens} tone="slate">{open.course.code}</Chip>}
              {statusChip(open.status)}
            </div>

            <div style={{ background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.09em", color: tokens.textMuted, marginBottom: 7 }}>
                {t("STUDENT STATEMENT", "بيان الطالب")}
              </div>
              <p style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textPrimary, margin: 0, lineHeight: 1.7 }}>{open.studentNote || t("(no written statement)", "(بدون بيان مكتوب)")}</p>
            </div>

            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", marginBottom: 7, flexDirection: isRtl ? "row-reverse" : "row" }}>
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.09em", color: tokens.textMuted }}>
                  {t("PROOF ATTACHMENTS", "مرفقات الإثبات")}
                </span>
                {open.hasProof && (
                  <button
                    type="button"
                    disabled={proofBusy}
                    onClick={downloadProof}
                    title={t("Download the proof file", "تنزيل ملف الإثبات")}
                    aria-label={t("Download the proof file", "تنزيل ملف الإثبات")}
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8, border: `1px solid ${tokens.cardBorder}`, background: tokens.card, cursor: proofBusy ? "not-allowed" : "pointer", opacity: proofBusy ? 0.5 : 1 }}
                  >
                    <IconDownload size={14} color={tokens.textSecondary} />
                  </button>
                )}
              </div>
              {open.hasProof ? (
                <div style={{ border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, overflow: "hidden" }}>
                  {proofBusy && !proofView ? (
                    <div style={{ padding: "22px 14px", textAlign: "center", fontFamily: bFont, fontSize: 12, color: tokens.textMuted, background: tokens.inset }}>
                      {t("Loading the proof preview…", "جاري تحميل معاينة الإثبات…")}
                    </div>
                  ) : proofView?.kind === "image" ? (
                    <div style={{ background: tokens.inset, borderBottom: `1px dashed ${tokens.cardBorder}`, padding: 10, textAlign: "center" }}>
                      <img src={proofView.url} alt={proofView.fileName} style={{ maxWidth: "100%", maxHeight: 320, borderRadius: 6, display: "inline-block" }} />
                    </div>
                  ) : proofView?.kind === "pdf" ? (
                    <div style={{ background: tokens.inset, borderBottom: `1px dashed ${tokens.cardBorder}` }}>
                      <iframe title={proofView.fileName} src={proofView.url} style={{ width: "100%", height: 380, border: "none", display: "block" }} />
                    </div>
                  ) : (
                    <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: tokens.inset, borderBottom: `1px dashed ${tokens.cardBorder}` }}>
                      {(open.proofMimeType ?? "").startsWith("image/") ? <IconImageAttach size={22} color={tokens.textFaint} /> : <IconDoc size={22} color={tokens.textFaint} />}
                      <span style={{ fontFamily: MONO, fontSize: 10.5, color: tokens.textFaint }}>
                        {proofView?.kind === "error"
                          ? (proofView.message || t("Preview failed — use the download button.", "فشلت المعاينة — استخدم زر التنزيل."))
                          : t("Preview not available for this type — download opens the original.", "المعاينة غير متاحة لهذا النوع — التنزيل يفتح الأصل.")}
                      </span>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "9px 12px", flexDirection: isRtl ? "row-reverse" : "row" }}>
                    {(open.proofMimeType ?? "").startsWith("image/") ? <IconImageAttach size={13} color={tokens.textSecondary} /> : <IconDoc size={13} color={tokens.textSecondary} />}
                    <span style={{ fontFamily: MONO, fontSize: 11.5, color: tokens.textPrimary, direction: "ltr", flex: 1 }}>{open.proofFileName}</span>
                  </div>
                </div>
              ) : (
                <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textFaint }}>{t("No proof attachment on this request.", "لا يوجد مرفق إثبات في هذا الطلب.")}</div>
              )}
              <p style={{ fontFamily: bFont, fontSize: 11, color: tokens.textFaint, margin: "8px 0 0", lineHeight: 1.6 }}>
                {t(
                  "Attachments come from the student-affairs exception flow — deciding without reviewing them is possible but discouraged.",
                  "المرفقات مصدرها مسار استثناءات شؤون الطلاب — يمكن البت دون مراجعتها لكنه غير مستحسن.",
                )}
              </p>
            </div>

            <Field tokens={tokens} lang={lang} label={t("Decision note", "ملاحظة القرار")} hint={t("Optional for acceptance — required for rejection so the student knows why.", "اختيارية للقبول — إلزامية للرفض حتى يعرف الطالب السبب.")}>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                style={{ ...textareaStyle(tokens, bFont) }}
                placeholder={t("e.g. Exception verified against student-affairs records.", "مثال: تم التحقق من الاستثناء من سجلات شؤون الطلاب.")}
              />
            </Field>

            {decisionError && (
              <AlertStrip
                tokens={tokens}
                lang={lang}
                tone="violet"
                icon={<IconShield size={14} color={tokens.gap} />}
                title={t("The decision was not recorded", "لم يُسجل القرار")}
                body={decisionError}
              />
            )}

            <div style={{ display: "flex", gap: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
              <ConfirmBtn
                tokens={tokens}
                lang={lang}
                variant="solid"
                disabled={decisionBusy !== null}
                label={decisionBusy === "APPROVED" ? t("Accepting…", "جاري القبول…") : t("Accept — enroll in course", "قبول — تسجيل في المقرر")}
                confirmLabel={t("Click again to accept", "اضغط للتأكيد للقبول")}
                onConfirm={() => decide("APPROVED")}
              />
              <ConfirmBtn
                tokens={tokens}
                lang={lang}
                variant="soft"
                disabled={!noteOk || decisionBusy !== null}
                label={decisionBusy === "REJECTED" ? t("Rejecting…", "جاري الرفض…") : t("Reject with reason", "رفض مع السبب")}
                confirmLabel={t("Click again to reject", "اضغط للتأكيد للرفض")}
                onConfirm={() => decide("REJECTED")}
              />
            </div>
            {!noteOk && (
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
                <IconBan size={12} color={tokens.textFaint} />
                <span style={{ fontFamily: bFont, fontSize: 11, color: tokens.textFaint }}>
                  {t("Write the note above to unlock rejection.", "اكتب الملاحظة بالأعلى لتفعيل زر الرفض.")}
                </span>
              </div>
            )}
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
              <IconCheck size={12} color={tokens.textFaint} />
              <span style={{ fontFamily: bFont, fontSize: 11, color: tokens.textFaint, lineHeight: 1.6 }}>
                {t("The decision records the proof reference in the audit log and notifies the student instantly.", "القرار يسجل مرجع الإثبات في التدقيق ويُشعر الطالب لحظيًا.")}
              </span>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}