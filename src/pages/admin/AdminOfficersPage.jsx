import { useCallback, useEffect, useState } from "react";
import useAsync from "@/hooks/useAsync";
import { tk, bodyFont } from "@/constants/tokens";
import { AsyncGate } from "@/components/ui";
import { AlertStrip, Btn, Card, Chip, Drawer, Field, Modal, inputStyle, toast, bFontFor, hFontFor } from "@/components/ModuleUI";
import { IconShield, IconPlus, IconPencil, IconCheck } from "@/components/Icons";
import { listUsers, createOfficer, applyOfficerTemplate } from "@/services/admin";
import { demoMode } from "@/services/auth";
import { useAdmin } from "@/store/admin-context";
import { PERMISSION_LABELS } from "@/constants/admin";
import OfficerScopeCard from "@/components/admin/OfficerScopeCard";

const MONO = "'JetBrains Mono', monospace";

const monoLabel = (text, tokens) => (
  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.09em", color: tokens.textMuted, marginBottom: 7 }}>{text}</div>
);

export default function AdminOfficersPage({ state }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const admin = useAdmin();

  const [addOpen, setAddOpen] = useState(false);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [tplId, setTplId] = useState("");
  const [adding, setAdding] = useState(false);
  const [editUserId, setEditUserId] = useState(null);

  const templates = admin.me?.templates ?? [];
  const demo = demoMode();

  const fetchUsers = useCallback(() => (demo || !admin.isSuperAdmin ? Promise.resolve([]) : listUsers()), [demo, admin.isSuperAdmin]);
  const { data, loading, error, reload } = useAsync(fetchUsers);

  const officers = (Array.isArray(data) ? data : []).filter((u) => u.role === "institution_admin");
  const editUser = officers.find((u) => u.id === editUserId) ?? null;
  const pickedTpl = templates.find((tpl) => tpl.id === tplId) ?? templates[0] ?? null;
  const emailOk = /@/.test(email);
  const canAdd = Boolean(first.trim() && last.trim() && emailOk && pickedTpl);

  useEffect(() => {
    if (!addOpen) {
      setFirst("");
      setLast("");
      setEmail("");
      setTplId(admin.me?.templates?.[0]?.id ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addOpen]);

  const addOfficer = async () => {
    setAdding(true);
    try {
      const created = await createOfficer({ firstName: first.trim(), lastName: last.trim(), email: email.trim().toLowerCase() });
      const officerId = created?.id ?? created?.user?.id;
      if (officerId && pickedTpl) await applyOfficerTemplate(officerId, pickedTpl.id);
      setAddOpen(false);
      await reload();
      toast(t("Officer added and audit-logged.", "أُضيف المسؤول وسُجّل في التدقيق."));
    } catch (err) {
      toast(err?.message ?? t("Could not add the officer.", "تعذرت إضافة المسؤول."));
    } finally {
      setAdding(false);
    }
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

  if (!admin.isSuperAdmin) {
    return (
      <div style={{ padding: "26px 32px", maxWidth: 720, margin: "0 auto", fontFamily: bodyFont(lang) }}>
        <AlertStrip
          tokens={tokens}
          lang={lang}
          tone="violet"
          icon={<IconShield size={14} color={tokens.gap} />}
          title={t("Only the super admin manages permission sets", "السوبر أدمن وحده يدير مجموعات الصلاحيات")}
          body={t("Delegated officers see events and data strictly inside their own scope.", "كل مسؤول يرى الأحداث والبيانات داخل نطاقه فقط.")}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "26px 32px", maxWidth: 980, margin: "0 auto", direction: isRtl ? "rtl" : "ltr", textAlign: isRtl ? "right" : "left", fontFamily: bodyFont(lang) }}>
      <div style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: "0 0 4px" }}>
            {t("Officers & permissions", "المسؤولون والصلاحيات")}
          </h1>
          <p style={{ fontFamily: bFont, fontSize: 13, color: tokens.textMuted, margin: 0 }}>
            {t("Ready-made templates, manually tunable scopes — nobody outgrows them.", "قوالب جاهزة ونطاقات قابلة للضبط اليدوي — لا أحد يتخطى نطاقه.")}
          </p>
        </div>
        <Btn tokens={tokens} lang={lang} style={{ padding: "10px 16px", fontSize: 13 }} onClick={() => setAddOpen(true)}>
          <IconPlus size={14} color="#fff" />
          {t("Add officer", "إضافة مسؤول")}
        </Btn>
      </div>

      <div style={{ marginBottom: 16 }}>
        <AlertStrip
          tokens={tokens}
          lang={lang}
          tone="peri"
          icon={<IconShield size={14} color={tokens.primary} />}
          title={t(
            "Only the super admin manages permission sets — every officer sees events and data strictly inside his own scope.",
            "السوبر أدمن وحده يدير مجموعات الصلاحيات — وكل مسؤول يرى الأحداث والبيانات داخل نطاقه فقط.",
          )}
        />
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
        label={t("Loading officers…", "جاري تحميل المسؤولين…")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {officers.map((officer) => {
            const keys = officer.permissions ?? [];
            const isSuper = officer.isSuperAdmin === true || (admin.me?.user?.email === officer.email && admin.isSuperAdmin);
            const tpl = templates.find((candidate) => candidate.keys?.length === keys.length && keys.every((k) => candidate.keys.includes(k))) ?? null;
            const custom = keys.length > 0 && !tpl && !isSuper;
            return (
              <Card tokens={tokens} key={officer.id} style={{ padding: "13px 16px" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                      <span style={{ fontFamily: bFont, fontWeight: 600, fontSize: 13.5, color: tokens.textPrimary }}>
                        {officer.firstName} {officer.lastName}
                      </span>
                      {isSuper && <Chip tokens={tokens} tone="primary">{t("Super admin", "سوبر أدمن")}</Chip>}
                      {!isSuper && tpl && <Chip tokens={tokens}>{lang === "ar" ? tpl.label?.ar ?? tpl.id : tpl.label?.en ?? tpl.id}</Chip>}
                      {custom && <Chip tokens={tokens} tone="violet">{t("Custom permissions", "صلاحيات مخصصة")}</Chip>}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: tokens.textMuted, marginTop: 4 }}>{officer.email}</div>
                    {!isSuper && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6, flexDirection: isRtl ? "row-reverse" : "row" }}>
                        {keys.map((key) => (
                          <span key={key} style={{ fontFamily: MONO, fontSize: 10, color: tokens.textSecondary, background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 5, padding: "2px 7px" }}>
                            {(PERMISSION_LABELS[key] ?? { en: key, ar: key })[lang === "ar" ? "ar" : "en"]}
                          </span>
                        ))}
                        {keys.length === 0 && (
                          <span style={{ fontFamily: bFont, fontSize: 11, color: tokens.gap }}>
                            {t("No scopes assigned — this officer sees nothing until you assign one.", "لا نطاقات معينة — هذا المسؤول لا يرى شيئًا حتى تعيّن نطاقًا.")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {!isSuper && (
                    <Btn tokens={tokens} lang={lang} variant="ghost" style={{ padding: "7px 12px", fontSize: 12, flexShrink: 0 }} onClick={() => setEditUserId(officer.id)}>
                      <IconPencil size={13} color={tokens.textSecondary} />
                      {t("Edit scopes", "تعديل النطاقات")}
                    </Btn>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </AsyncGate>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        tokens={tokens}
        lang={lang}
        title={t("Add officer", "إضافة مسؤول")}
        subtitle={t("A delegated admin account scoped by a permission template.", "حساب مسؤول مفوض محدد بقالب صلاحيات.")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field tokens={tokens} lang={lang} label={t("First name", "الاسم الأول")} required>
              <input value={first} onChange={(e) => setFirst(e.target.value)} style={{ ...inputStyle(tokens, bFont) }} placeholder={t("e.g. Heba", "مثال: هبة")} />
            </Field>
            <Field tokens={tokens} lang={lang} label={t("Last name", "اسم العائلة")} required>
              <input value={last} onChange={(e) => setLast(e.target.value)} style={{ ...inputStyle(tokens, bFont) }} placeholder={t("e.g. Salah", "مثال: صلاح")} />
            </Field>
          </div>

          <Field
            tokens={tokens}
            lang={lang}
            label={t("Institutional email", "الإيميل الجامعي")}
            required
            hint={t("A login invitation activates once the person self-registers with this exact email.", "دعوة الدخول تتفعل فور تسجيل الشخص بنفس هذا الإيميل.")}
          >
            <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...inputStyle(tokens, bFont), direction: "ltr", textAlign: "left" }} placeholder="officer@menoufia.edu.eg" />
          </Field>

          <Field tokens={tokens} lang={lang} label={t("Permission template", "قالب الصلاحيات")} required>
            <select value={tplId} onChange={(e) => setTplId(e.target.value)} style={{ ...inputStyle(tokens, bFont), cursor: "pointer" }}>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {lang === "ar" ? tpl.label?.ar ?? tpl.id : tpl.label?.en ?? tpl.id}
                </option>
              ))}
            </select>
          </Field>

          {pickedTpl && (
            <div style={{ background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, padding: "10px 12px" }}>
              {monoLabel(t("TEMPLATE SCOPES", "نطاقات القالب"), tokens)}
              {(lang === "ar" ? pickedTpl.description?.ar : pickedTpl.description?.en) && (
                <p style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted, margin: "0 0 8px", lineHeight: 1.6 }}>
                  {lang === "ar" ? pickedTpl.description?.ar : pickedTpl.description?.en}
                </p>
              )}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                {(pickedTpl.keys ?? []).map((key) => (
                  <span key={key} style={{ fontFamily: MONO, fontSize: 10, color: tokens.textSecondary, background: tokens.card, border: `1px solid ${tokens.cardBorder}`, borderRadius: 5, padding: "2px 7px" }}>
                    {(PERMISSION_LABELS[key] ?? { en: key, ar: key })[lang === "ar" ? "ar" : "en"]}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
            <IconCheck size={13} color={tokens.textFaint} />
            <span style={{ fontFamily: bFont, fontSize: 11, color: tokens.textFaint, lineHeight: 1.55 }}>
              {t("You can retune any switch afterwards from the officers list or the users drawer.", "تقدر تعيد ضبط أي مفتاح لاحقًا من قائمة المسؤولين أو درج المستخدم.")}
            </span>
          </div>

          <Btn tokens={tokens} lang={lang} disabled={!canAdd || adding} style={{ width: "100%", padding: "11px 0", fontSize: 13.5, justifyContent: "center" }} onClick={addOfficer}>
            {t("Add officer", "إضافة المسؤول")}
          </Btn>
        </div>
      </Modal>

      <Drawer open={editUser !== null} onClose={() => setEditUserId(null)} tokens={tokens} lang={lang} title={editUser ? `${editUser.firstName} ${editUser.lastName}` : ""} subtitle={editUser?.email}>
        {editUser && <OfficerScopeCard officer={editUser} templates={templates} tokens={tokens} lang={lang} t={t} onChanged={reload} />}
      </Drawer>
    </div>
  );
}
