import { useCallback, useMemo, useRef, useState } from "react";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { AsyncGate, Chip, Btn } from "@/components/ui";
import { inputStyle, toast, bFontFor } from "@/components/ModuleUI";
import { stageImport, listImports, confirmImport, discardImport, listInvitations } from "@/services/admin";
import { demoMode } from "@/services/auth";

const SAMPLE_CSV = `firstName,lastName,email,role,courseCodes
Nour,Adel,nour.adel@menoufia.edu.eg,student,CS201
Karim,Saad,karim.saad@menoufia.edu.eg,instructor,CS301
Yara,Mostafa,,,
sarah,rashidi,sarah.rashidi@menoufia.edu.eg,student,CS201`;

function parseCsv(text) {
  return String(text ?? "")
    .split(/\r?\n/)
    .map((line, index) => ({ line: index + 1, raw: line }))
    .filter(({ raw }) => raw.trim().length > 0)
    .filter(({ raw }, idx) => !(idx === 0 && /^firstname\s*,/i.test(raw.trim())))
    .map(({ line, raw }) => {
      const cells = raw.split(",").map((cell) => cell.trim());
      return {
        line,
        firstName: cells[0] ?? "",
        lastName: cells[1] ?? "",
        email: cells[2] ?? "",
        role: cells[3] ?? "",
        courseCodes: (cells[4] ?? "")
          .split(/[;|]/)
          .map((code) => code.trim())
          .filter(Boolean),
      };
    });
}

function localNote(row, t) {
  if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    return { tone: "gap", label: t("invalid email", "إيميل مش صحيح") };
  }
  if (!["student", "instructor"].includes(row.role)) {
    return { tone: "gap", label: t("role must be student or instructor", "الدور لازم طالب أو دكتور") };
  }
  return { tone: "mastered", label: t("ready to send", "جاهز للإرسال") };
}

export default function AdminBulkImportPage({ state }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const bFont = bFontFor(lang);
  const hFont = headingFont(lang);
  const mobile = useMediaQuery("(max-width: 860px)");
  const fileRef = useRef(null);

  const fetchAll = useCallback(
    () => Promise.all([listImports(), listInvitations(null)]),
    [],
  );
  const { data, loading, error, reload } = useAsync(fetchAll);

  const [fileName, setFileName] = useState("");
  const [csv, setCsv] = useState("");
  const [staged, setStaged] = useState(null);
  const [invStatus, setInvStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const draftRows = useMemo(() => parseCsv(csv), [csv]);
  const batches = data?.[0] ?? [];
  const invitationsAll = data?.[1] ?? [];

  const invitations = useMemo(
    () => invitationsAll.filter((inv) => !invStatus || inv.status === invStatus),
    [invitationsAll, invStatus],
  );

  async function mutate(action, message, thenClear) {
    setBusy(true);
    try {
      const result = await action();
      if (message) toast(message);
      if (thenClear) {
        setCsv("");
        setFileName("");
        setStaged(null);
      }
      reload();
      return result;
    } catch (err) {
      toast(err.message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  function readFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setCsv(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  async function sendForVerdicts() {
    if (draftRows.length === 0) {
      toast(t("Paste a CSV or load a file first.", "الصقي ملف CSV أو حمّلي ملف أول."));
      return;
    }
    const result = await mutate(
      () =>
        stageImport(
          fileName.trim() || `import-${new Date().toISOString().slice(0, 10)}.csv`,
          draftRows.map(({ firstName, lastName, email, role, courseCodes }) => ({ firstName, lastName, email, role, courseCodes })),
        ),
      null,
      false,
    );
    if (result) setStaged(result);
  }

  const verdictChip = (verdict) =>
    verdict === "new" ? (
      <Chip tokens={tokens} tone="primary">{t("new invitation", "دعوة جديدة")}</Chip>
    ) : verdict === "existing" ? (
      <Chip tokens={tokens} tone="mastered">{t("existing — enroll directly", "حساب قائم — انضمام مباشر")}</Chip>
    ) : (
      <Chip tokens={tokens} tone="gap">{t("rejected row", "صف مرفوض")}</Chip>
    );

  const statusChip = (status) =>
    status === "staged" ? (
      <Chip tokens={tokens} tone="developing">{t("staged", "مستيدجة")}</Chip>
    ) : status === "confirmed" ? (
      <Chip tokens={tokens} tone="mastered">{t("confirmed", "منفَّذة")}</Chip>
    ) : (
      <Chip tokens={tokens}>{t("discarded", "ملغاة")}</Chip>
    );

  if (demoMode()) {
    return (
      <div style={{ padding: 28, maxWidth: 720, margin: "0 auto", fontFamily: bodyFont(lang) }}>
        <div style={{ fontFamily: hFont, fontWeight: 800, fontSize: 16, color: tokens.textPrimary }}>
          {t("Bulk invitations need the real backend — set VITE_API_URL.", "الإدخال الجماعي محتاج الباك إند الحقيقي — اضبطي VITE_API_URL.")}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: mobile ? 16 : "26px 32px", maxWidth: 1080, margin: "0 auto", fontFamily: bodyFont(lang) }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: "0 0 4px", fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, letterSpacing: "-0.025em", color: tokens.textPrimary }}>
          {t("Bulk invitations", "الإدخال الجماعي والدعوات")}
        </h1>
        <p style={{ margin: 0, fontFamily: bFont, fontSize: 13, color: tokens.textMuted, maxWidth: 720, lineHeight: 1.7 }}>
          {t(
            "Drop a CSV of first names, last names, emails, roles and course codes. It stages for review — nothing executes before confirmation, every row gets its own verdict, and fresh emails become self-activating invitations, never pre-built accounts.",
            "ارفعي CSV فيه الأسماء والإيميلات والأدوار وأكواد المقررات. بيتعرض للمراجعة أولًا — مفيش تنفيذ قبل التأكيد، وكل صف بياخد حكمه لوحده، والإيميلات الجديدة بتتحول لدعوات بتتفعّل ذاتيًا مش حسابات جاهزة.",
          )}
        </p>
      </div>

      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Loading imports…", "جاري تحميل الدفعات…")}>
        <div style={{ border: `1px solid ${tokens.cardBorder}`, borderRadius: 12, background: tokens.card, padding: "16px 18px", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <input
              value={fileName}
              onChange={(event) => setFileName(event.target.value)}
              placeholder={t("batch file name, e.g. cs201-fall.csv", "اسم دفعة الملف، مثال: cs201-fall.csv")}
              style={{ ...inputStyle(tokens, bFont), width: 260 }}
            />
            <Btn tokens={tokens} variant="ghost" onClick={() => fileRef.current?.click()}>
              {t("Open CSV file", "فتح ملف CSV")}
            </Btn>
            <Btn tokens={tokens} variant="ghost" onClick={() => { setCsv(SAMPLE_CSV); setFileName("sample-fall.csv"); }}>
              {t("Fill with the sample", "املي بالنموذج")}
            </Btn>
            <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" onChange={readFile} style={{ display: "none" }} />
          </div>
          <textarea
            value={csv}
            onChange={(event) => setCsv(event.target.value)}
            placeholder={t(
              "Paste CSV rows here — firstName,lastName,email,role,courseCodes (codes split with ; )",
              "الصقي صفوف الـ CSV هنا — firstName,lastName,email,role,courseCodes (الأكواد بـ ; )",
            )}
            rows={5}
            style={{ ...inputStyle(tokens, bFont), width: "100%", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.7, resize: "vertical", marginBottom: 10 }}
          />
          {draftRows.length > 0 && !staged && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: bFont, fontSize: 12, fontWeight: 700, color: tokens.textSecondary, marginBottom: 6 }}>
                {t(`Local preview — ${draftRows.length} rows`, `معاينة محلية — ${draftRows.length} صف`)}
              </div>
              <div style={{ border: `1px dashed ${tokens.cardBorder}`, borderRadius: 10, overflow: "hidden" }}>
                {draftRows.map((row, idx) => {
                  const note = localNote(row, t);
                  return (
                    <div
                      key={`${row.line}-${idx}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        background: idx % 2 ? tokens.inset : "transparent",
                        flexDirection: isRtl ? "row-reverse" : "row",
                      }}
                    >
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: tokens.textFaint, width: 28, flexShrink: 0 }}>#{row.line}</span>
                      <span style={{ flex: 1, fontFamily: bFont, fontSize: 12.5, color: tokens.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.firstName} {row.lastName} · {row.email || "—"} · {row.role || "—"} {row.courseCodes.length ? `· ${row.courseCodes.join(" ")}` : ""}
                      </span>
                      <Chip tokens={tokens} tone={note.tone === "gap" ? "gap" : "mastered"}>{note.label}</Chip>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {staged && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontFamily: bFont, fontSize: 12, fontWeight: 700, color: tokens.textSecondary }}>
                  {t("Server verdicts — every row judged individually", "أحكام السيرفر — كل صف انحكم عليه لوحده")}
                </span>
                <Chip tokens={tokens} tone="primary">{staged.counts.newCount} {t("new", "جديد")}</Chip>
                <Chip tokens={tokens} tone="mastered">{staged.counts.existingCount} {t("existing", "قائم")}</Chip>
                <Chip tokens={tokens} tone="gap">{staged.counts.errorCount} {t("errors", "مرفوض")}</Chip>
              </div>
              <div style={{ border: `1px dashed ${tokens.cardBorder}`, borderRadius: 10, overflow: "hidden" }}>
                {staged.rows.map((row, idx) => (
                  <div
                    key={`${row.row}-${idx}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      background: idx % 2 ? tokens.inset : "transparent",
                      flexDirection: isRtl ? "row-reverse" : "row",
                    }}
                  >
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: tokens.textFaint, width: 28, flexShrink: 0 }}>#{row.row}</span>
                    <span style={{ flex: 1, fontFamily: bFont, fontSize: 12.5, color: tokens.textSecondary }}>
                      {row.firstName} {row.lastName} · {row.email || "—"}
                      {row.verdict === "error" && (lang === "ar" ? row.errorReason?.ar : row.errorReason?.en) ? (
                        <span style={{ color: tokens.gap, display: "block", fontSize: 11.5 }}>
                          {lang === "ar" ? row.errorReason?.ar : row.errorReason?.en}
                        </span>
                      ) : null}
                      {row.unresolvableCourseCodes?.length ? (
                        <span style={{ color: tokens.developing, display: "block", fontSize: 11.5 }}>
                          {t("unresolvable codes skipped: ", "أكواد غير معروفة هتتخطّى: ")}
                          {row.unresolvableCourseCodes.join(", ")}
                        </span>
                      ) : null}
                    </span>
                    {verdictChip(row.verdict)}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {!staged ? (
              <Btn tokens={tokens} disabled={busy || draftRows.length === 0} onClick={sendForVerdicts}>
                {busy ? t("Staging…", "جاري الاستيداج…") : t("Stage for server verdicts", "وفّدي للأحكام (استيداج)")}
              </Btn>
            ) : (
              <>
                <Btn
                  tokens={tokens}
                  disabled={busy || staged.counts.newCount + staged.counts.existingCount === 0}
                  onClick={async () => {
                    const result = await mutate(() => confirmImport(staged.id), t("Import executed — invitations sent and accounts enrolled.", "اتنفّذ الإدخال — الدعوات اتبعتت والحسابات القائمة انضمت."), true);
                    if (result) {
                      toast(
                        t(
                          `${result.newCount} invitations sent · ${result.existingCount} enrolled directly · ${result.errorCount} skipped`,
                          `${result.newCount} دعوة اتبعتت · ${result.existingCount} انضموا مباشرة · ${result.errorCount} اتخطوا`,
                        ),
                      );
                    }
                  }}
                >
                  {busy ? t("Confirming…", "جاري التنفيذ…") : t("Confirm and execute", "تأكيد وتنفيذ")}
                </Btn>
                <Btn
                  tokens={tokens}
                  variant="ghost"
                  disabled={busy}
                  onClick={() => mutate(() => discardImport(staged.id), t("Staged batch discarded.", "اتلغّت الدفعة قبل التنفيذ."), true)}
                >
                  {t("Discard", "إلغاء")}
                </Btn>
              </>
            )}
          </div>
        </div>

        <div style={{ fontFamily: bFont, fontWeight: 700, fontSize: 13, color: tokens.textPrimary, marginBottom: 8 }}>
          {t("Import history", "سجل الدفعات")}
        </div>
        {batches.length === 0 ? (
          <div style={{ padding: 18, textAlign: "center", fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, border: `1px dashed ${tokens.cardBorder}`, borderRadius: 12, marginBottom: 16 }}>
            {t("Nothing imported yet.", "مفيش دفعات لسه.")}
          </div>
        ) : (
          <div style={{ border: `1px solid ${tokens.cardBorder}`, borderRadius: 12, background: tokens.card, overflow: "hidden", marginBottom: 18 }}>
            {batches.map((batch, index) => (
              <button
                key={batch.id}
                onClick={() => {
                  if (batch.status === "staged") setStaged(batch);
                }}
                title={batch.status === "staged" ? t("open staged batch", "افتحي الدفعة المستيدجة") : ""}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 16px",
                  background: "transparent",
                  border: "none",
                  borderTop: index === 0 ? "none" : `1px solid ${tokens.cardBorder}`,
                  cursor: batch.status === "staged" ? "pointer" : "default",
                  textAlign: isRtl ? "right" : "left",
                  flexDirection: isRtl ? "row-reverse" : "row",
                }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: tokens.textPrimary, display: "block" }}>{batch.fileName}</span>
                  <span style={{ fontFamily: bFont, fontSize: 11, color: tokens.textMuted }}>
                    {new Date(batch.createdAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB")}
                    {batch.createdByName ? ` · ${batch.createdByName}` : ""}
                  </span>
                </span>
                <Chip tokens={tokens} tone="primary">{batch.counts?.newCount ?? 0} {t("inv", "دعوة")}</Chip>
                <Chip tokens={tokens} tone="mastered">{batch.counts?.existingCount ?? 0} {t("join", "انضمام")}</Chip>
                <Chip tokens={tokens} tone="gap">{batch.counts?.errorCount ?? 0} {t("err", "رفض")}</Chip>
                {statusChip(batch.status)}
                {batch.status === "staged" ? (
                  <Btn
                    tokens={tokens}
                    variant="ghost"
                    disabled={busy}
                    onClick={(event) => {
                      event.stopPropagation();
                      mutate(() => discardImport(batch.id), t("Staged batch discarded.", "اتلغّت الدفعة قبل التنفيذ."), true);
                    }}
                  >
                    {t("discard", "إلغاء")}
                  </Btn>
                ) : null}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <div style={{ fontFamily: bFont, fontWeight: 700, fontSize: 13, color: tokens.textPrimary }}>
            {t("Invitation queue", "قايمة الدعوات")}
          </div>
          {[
            ["", t("all", "الكل")],
            ["pending", t("pending", "ناطرة")],
            ["accepted", t("accepted", "مقبولة")],
            ["revoked", t("revoked", "ملغية")],
          ].map(([id, label]) => (
            <button
              key={id || "all"}
              onClick={() => setInvStatus(id)}
              style={{
                padding: "5px 12px",
                borderRadius: 999,
                cursor: "pointer",
                fontFamily: bFont,
                fontSize: 11.5,
                fontWeight: invStatus === id ? 600 : 500,
                background: invStatus === id ? tokens.primaryLight : tokens.card,
                border: `1px solid ${invStatus === id ? tokens.primary : tokens.cardBorder}`,
                color: invStatus === id ? tokens.primary : tokens.textSecondary,
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {invitations.length === 0 ? (
          <div style={{ padding: 18, textAlign: "center", fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted, border: `1px dashed ${tokens.cardBorder}`, borderRadius: 12 }}>
            {t("No invitations in this state.", "مفيش دعوات بالحالة دي.")}
          </div>
        ) : (
          <div style={{ border: `1px solid ${tokens.cardBorder}`, borderRadius: 12, background: tokens.card, overflow: "hidden" }}>
            {invitations.map((inv, index) => (
              <div
                key={inv.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 16px",
                  borderTop: index === 0 ? "none" : `1px solid ${tokens.cardBorder}`,
                  flexDirection: isRtl ? "row-reverse" : "row",
                }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontFamily: bFont, fontWeight: 600, fontSize: 13, color: tokens.textPrimary, display: "block" }}>
                    {inv.firstName} {inv.lastName}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: tokens.textMuted }}>{inv.email}</span>
                </span>
                <Chip tokens={tokens}>{inv.role === "instructor" ? t("doctor", "دكتور") : t("student", "طالب")}</Chip>
                {inv.status === "pending" ? (
                  <Chip tokens={tokens} tone={inv.waitingDays > 3 ? "developing" : "default"}>
                    {t(`waiting ${inv.waitingDays}d`, `ناطرة من ${inv.waitingDays} يوم`)}
                  </Chip>
                ) : null}
                {inv.status === "accepted" ? (
                  <Chip tokens={tokens} tone="mastered">
                    {t(`accepted ${inv.acceptedAt ? new Date(inv.acceptedAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB") : ""}`, `اتقبلت ${inv.acceptedAt ? new Date(inv.acceptedAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB") : ""}`)}
                  </Chip>
                ) : null}
                {inv.status === "pending" ? <Chip tokens={tokens} tone="developing">{t("pending", "ناطرة")}</Chip> : null}
                {inv.status === "revoked" ? <Chip tokens={tokens}>{t("revoked", "ملغية")}</Chip> : null}
              </div>
            ))}
          </div>
        )}
      </AsyncGate>
    </div>
  );
}
