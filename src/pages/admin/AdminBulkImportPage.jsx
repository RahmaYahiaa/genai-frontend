import { useCallback, useRef, useState } from "react";
import useAsync from "@/hooks/useAsync";
import { tk, bodyFont } from "@/constants/tokens";
import { AsyncGate } from "@/components/ui";
import { AlertStrip, Btn, Card, Chip, ConfirmBtn, toast, bFontFor, hFontFor } from "@/components/ModuleUI";
import { IconUpload, IconDoc, IconCheck, IconWarning, IconBan, IconClock, IconShield } from "@/components/Icons";
import { stageImport, listImports, confirmImport, discardImport, listInvitations } from "@/services/admin";
import { demoMode } from "@/services/auth";
import { useAdmin } from "@/store/admin-context";

const MONO = "'JetBrains Mono', monospace";

const SAMPLE_ROWS = [
  { firstName: "Salma", lastName: "Farouk", email: "salma.farouk@menoufia.edu.eg", role: "student", courseCodes: ["CVL201", "ELE302"] },
  { firstName: "Rania", lastName: "Adel", email: "rania.adel@menoufia.edu.eg", role: "doctor", courseCodes: ["CVL201"] },
  { firstName: "Marwan", lastName: "Tarek", email: "marwan.tarek@menoufia.edu.eg", role: "student", courseCodes: [] },
  { firstName: "Omnia", lastName: "Saad", email: "omnia.saad@menoufia.edu.eg", role: "student", courseCodes: ["ELE302", "IT101"] },
  { firstName: "Sherif", lastName: "Hamad", email: "sherif.hamad@menoufia.edu.eg", role: "doctor", courseCodes: [] },
];

function parseCsv(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line, index) => !(index === 0 && /first|name|اسم/i.test(line)))
    .map((line) => {
      const parts = line.split(/[,\t;]/).map((p) => p.trim());
      const [firstName = "", lastName = "", email = "", roleRaw = "", coursesRaw = ""] = parts;
      const lowered = roleRaw.toLowerCase();
      const role = lowered === "doctor" || lowered === "instructor" ? "instructor" : lowered === "student" ? "student" : "";
      const courseCodes = coursesRaw ? coursesRaw.split(/[+|]/).map((c) => c.trim().toUpperCase()).filter(Boolean) : [];
      return { firstName, lastName, email, role, courseCodes };
    });
}

const VERDICT_TONE = { new: "primary", existing: "peri", error: "violet" };

function SectionHeading({ title, subtitle, action, tokens, hFont, bFont, isRtl }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10, marginBottom: 12, flexDirection: isRtl ? "row-reverse" : "row" }}>
      <div>
        <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em" }}>{title}</div>
        {subtitle ? <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textMuted, marginTop: 3 }}>{subtitle}</div> : null}
      </div>
      {action ?? null}
    </div>
  );
}

export default function AdminBulkImportPage({ state }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const admin = useAdmin();
  const canImport = admin.hasScope("bulk.import");
  const demo = demoMode();

  const fileRef = useRef(null);
  const [localBusy, setLocalBusy] = useState(false);

  const fetchAll = useCallback(async () => {
    if (demo || !canImport) return { imports: [], invitations: [] };
    const [imports, invitations] = await Promise.all([listImports(), listInvitations()]);
    return { imports: Array.isArray(imports) ? imports : [], invitations: Array.isArray(invitations) ? invitations : [] };
  }, [demo, canImport]);

  const { data, loading, error, reload } = useAsync(fetchAll);
  const imports = data?.imports ?? [];
  const invitations = data?.invitations ?? [];

  const openBatch = imports.find((b) => b.status === "staged") ?? null;
  const doneBatches = imports.filter((b) => b.status === "confirmed");
  const preview = openBatch ? (openBatch.counts ?? null) : null;

  const runMutation = async (fn, okMsg) => {
    setLocalBusy(true);
    try {
      await fn();
      await reload();
      if (okMsg) toast(okMsg);
    } catch (err) {
      toast(err?.message ?? t("Something went wrong.", "حصل خطأ ما."));
    } finally {
      setLocalBusy(false);
    }
  };

  const stageRows = (fileName, rows) =>
    runMutation(
      () => stageImport(fileName, rows),
      t("File analysed — review the summary below before confirming.", "تحلل الملف — راجع الملخص بالأسفل قبل التأكيد."),
    );

  const onPickFile = (file) => {
    if (!file) return;
    setLocalBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCsv(String(reader.result));
      setLocalBusy(false);
      stageRows(file.name, rows);
    };
    reader.onerror = () => setLocalBusy(false);
    reader.readAsText(file);
  };

  const verdictChip = (verdict) => (
    <Chip tokens={tokens} tone={VERDICT_TONE[verdict] ?? "default"}>
      {verdict === "new" ? t("Invitation", "دعوة") : verdict === "existing" ? t("Existing — direct enroll", "قائم — انضمام مباشر") : t("Rejected", "مرفوض")}
    </Chip>
  );

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
          {t("Bulk invitations", "الإدخال الجماعي")}
        </h1>
        <p style={{ fontFamily: bFont, fontSize: 13, color: tokens.textMuted, margin: 0 }}>
          {t("Invitations tied to courses — never instant accounts, never temporary passwords.", "دعوات مربوطة بمقررات — لا حسابات فورية أبدًا ولا كلمات مرور مؤقتة.")}
        </p>
      </div>

      <AsyncGate
        tokens={tokens}
        lang={lang}
        loading={admin.loading || loading}
        error={admin.error || error}
        reload={() => {
          admin.reload();
          reload();
        }}
        label={t("Loading import workspace…", "جاري تحميل مساحة الإدخال…")}
      >
        {!canImport ? (
          <AlertStrip
            tokens={tokens}
            lang={lang}
            tone="violet"
            icon={<IconShield size={14} color={tokens.gap} />}
            title={t("This page needs the bulk.import scope", "هذه الصفحة تحتاج نطاق bulk.import")}
            body={t("Ask your super admin to grant you the scope, or return to the health dashboard.", "اطلب من السوبر أدمن منحك النطاق، أو عُد إلى لوحة الصحة.")}
          />
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <AlertStrip
                tokens={tokens}
                lang={lang}
                tone="peri"
                icon={<IconCheck size={14} color={tokens.primary} />}
                title={t(
                  "Each row creates an invitation linked to a course — the real account activates the moment the person self-registers with the same email, and lands in the right course without typing any course code.",
                  "كل صف ينشئ دعوة مربوطة بمقرر — الحساب الحقيقي يتفعل لحظة تسجيل الشخص بنفس الإيميل، ويصل للمقرر المقصود دون كتابة أي كود.",
                )}
              />
            </div>

            <Card tokens={tokens} style={{ padding: "16px 18px", marginBottom: 18 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.09em", color: tokens.textMuted, marginBottom: 7 }}>
                    {t("FIXED COLUMNS", "الأعمدة الثابتة")}
                  </div>
                  <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textSecondary, lineHeight: 1.7 }}>
                    {t("first name · last name · email · role (student/doctor) · course code", "الاسم الأول · اسم العائلة · الإيميل · الدور (طالب/دكتور) · كود المقرر")}
                  </div>
                  <div style={{ fontFamily: bFont, fontSize: 11, color: tokens.textFaint, marginTop: 4 }}>
                    {t("CSV or Excel-exported text. Multiple courses separated by +.", "CSV أو نص مصدّر من Excel. أكثر من مقرر يفصل بينهم +.")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <Btn tokens={tokens} lang={lang} variant="soft" disabled={localBusy || Boolean(openBatch)} style={{ padding: "10px 16px", fontSize: 12.5 }} onClick={() => fileRef.current?.click()}>
                    <IconUpload size={14} color={tokens.primary} />
                    {t("Choose file", "اختر ملفًا")}
                  </Btn>
                  <Btn tokens={tokens} lang={lang} variant="ghost" disabled={localBusy || Boolean(openBatch)} style={{ padding: "10px 16px", fontSize: 12.5 }} onClick={() => stageRows("menoufia-students.csv", SAMPLE_ROWS)}>
                    <IconDoc size={14} color={tokens.textSecondary} />
                    {t("Try sample file", "جرّب ملفًا تجريبيًا")}
                  </Btn>
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.txt"
                style={{ display: "none" }}
                onChange={(e) => {
                  onPickFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </Card>

            {openBatch && preview && (
              <div style={{ marginBottom: 18 }}>
                <SectionHeading
                  title={t("Preview before executing", "معاينة قبل التنفيذ")}
                  subtitle={openBatch.fileName}
                  tokens={tokens}
                  hFont={hFont}
                  bFont={bFont}
                  isRtl={isRtl}
                  action={
                    <div style={{ display: "flex", gap: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
                      <Btn tokens={tokens} lang={lang} variant="ghost" disabled={localBusy} style={{ padding: "7px 12px", fontSize: 12 }} onClick={() => runMutation(() => discardImport(openBatch.id))}>
                        <IconBan size={13} color={tokens.textSecondary} />
                        {t("Discard", "إلغاء")}
                      </Btn>
                      <ConfirmBtn
                        tokens={tokens}
                        lang={lang}
                        variant="primary"
                        disabled={localBusy}
                        label={t(`Send ${preview.newCount} invitations · enroll ${preview.existingCount}`, `أرسل ${preview.newCount} دعوة · ضمّ ${preview.existingCount}`)}
                        confirmLabel={t("Click again to execute the import", "اضغط للتأكيد لتنفيذ الإدخال")}
                        onConfirm={() => runMutation(() => confirmImport(openBatch.id), t("Import executed and audit-logged.", "نُفّذ الإدخال وسُجّل في التدقيق."))}
                      />
                    </div>
                  }
                />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <Chip tokens={tokens} tone="slate">{t("Rows", "صفوف")}: {preview.total}</Chip>
                  <Chip tokens={tokens} tone="primary">{t("New invitations", "دعوات جديدة")}: {preview.newCount}</Chip>
                  <Chip tokens={tokens} tone="peri">{t("Existing accounts", "حسابات قائمة")}: {preview.existingCount}</Chip>
                  <Chip tokens={tokens} tone="violet">{t("Errors — rejected rows only", "أخطاء — صفوف مرفوضة فقط")}: {preview.errorCount}</Chip>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(openBatch.rows ?? []).map((row) => (
                    <Card tokens={tokens} key={row.row} style={{ padding: "10px 14px", opacity: row.verdict === "error" ? 0.72 : 1 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.textFaint, width: 28, flexShrink: 0 }}>#{row.row}</span>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <span style={{ fontFamily: bFont, fontWeight: 600, fontSize: 13, color: tokens.textPrimary }}>
                            {row.firstName || t("(missing first name)", "(اسم أول ناقص)")} {row.lastName}
                          </span>
                          <span style={{ fontFamily: MONO, fontSize: 11, color: tokens.textMuted, marginInlineStart: 8 }}>
                            {row.email || t("(missing email)", "(إيميل ناقص)")}
                          </span>
                        </div>
                        <span style={{ fontFamily: MONO, fontSize: 11, color: tokens.textSecondary, flexShrink: 0 }}>
                          {row.role ? (row.role === "student" ? t("student", "طالب") : t("doctor", "دكتور")) : t("invalid role", "دور غير صحيح")}
                        </span>
                        <span style={{ fontFamily: MONO, fontSize: 11, color: tokens.textSecondary, flexShrink: 0 }}>
                          {(row.courseCodes ?? []).length ? row.courseCodes.join(" + ") : "—"}
                        </span>
                        <span style={{ flexShrink: 0 }}>{verdictChip(row.verdict)}</span>
                      </div>
                      {row.verdict === "error" && row.errorReason && (
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6, flexDirection: isRtl ? "row-reverse" : "row" }}>
                          <IconWarning size={12} color={tokens.gap} />
                          <span style={{ fontFamily: bFont, fontSize: 11, color: tokens.gap }}>
                            {lang === "ar" ? row.errorReason.ar : row.errorReason.en}
                          </span>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {doneBatches.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <SectionHeading title={t("Import history", "سجل الإدخالات")} tokens={tokens} hFont={hFont} bFont={bFont} isRtl={isRtl} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {doneBatches.map((batch) => {
                    const n = batch.counts?.newCount ?? 0;
                    const e = batch.counts?.existingCount ?? 0;
                    const x = batch.counts?.errorCount ?? 0;
                    return (
                      <Card tokens={tokens} key={batch.id} style={{ padding: "11px 14px" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                          <IconDoc size={13} color={tokens.textFaint} />
                          <span style={{ fontFamily: MONO, fontSize: 11.5, color: tokens.textPrimary }}>{batch.fileName}</span>
                          <Chip tokens={tokens} tone="primary">{n} {t("invitations", "دعوات")}</Chip>
                          <Chip tokens={tokens} tone="peri">{e} {t("enrolled directly", "انضموا مباشرة")}</Chip>
                          {x > 0 && <Chip tokens={tokens} tone="violet">{x} {t("rejected", "مرفوض")}</Chip>}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <SectionHeading title={t("Invitations", "الدعوات")} subtitle={t("Every invitation activates the moment its person self-registers with the same email.", "كل دعوة تتفعل لحظة تسجيل الشخص بنفس الإيميل.")} tokens={tokens} hFont={hFont} bFont={bFont} isRtl={isRtl} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {invitations.map((inv) => {
                  const waitingDays = inv.status === "pending" ? (inv.waitingDays ?? Math.floor((Date.now() - new Date(inv.sentAt).getTime()) / 864e5)) : 0;
                  return (
                    <Card tokens={tokens} key={inv.id} style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                            <span style={{ fontFamily: bFont, fontWeight: 600, fontSize: 13, color: tokens.textPrimary }}>
                              {inv.firstName} {inv.lastName}
                            </span>
                            <Chip tokens={tokens}>{inv.role === "student" ? t("student", "طالب") : t("doctor", "دكتور")}</Chip>
                            {inv.status === "accepted"
                              ? <Chip tokens={tokens} tone="primary">{t("Accepted", "مقبولة")}</Chip>
                              : <Chip tokens={tokens} tone={waitingDays >= 7 ? "violet" : "default"}>{t("Pending", "بانتظار التفعيل")}</Chip>}
                          </div>
                          <div style={{ fontFamily: MONO, fontSize: 11, color: tokens.textMuted, marginTop: 4 }}>{inv.email}</div>
                        </div>
                        <span style={{ display: "inline-flex", gap: 5, alignItems: "center", fontFamily: MONO, fontSize: 10.5, color: inv.status === "pending" && waitingDays >= 7 ? tokens.gap : tokens.textFaint, flexShrink: 0 }}>
                          <IconClock size={11} color={inv.status === "pending" && waitingDays >= 7 ? tokens.gap : tokens.textFaint} />
                          {inv.status === "accepted"
                            ? t("activated", "اتفعلت")
                            : waitingDays > 0
                              ? t(`${waitingDays}d waiting`, `${waitingDays} يوم انتظار`)
                              : t("sent today", "أُرسلت اليوم")}
                        </span>
                      </div>
                    </Card>
                  );
                })}
                {invitations.length === 0 && (
                  <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textFaint }}>
                    {t("No invitations yet — run an import above.", "لا دعوات بعد — نفّذ إدخالًا بالأعلى.")}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </AsyncGate>
    </div>
  );
}