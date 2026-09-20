import { useCallback, useMemo, useState } from "react";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { tk, bodyFont } from "@/constants/tokens";
import { AsyncGate } from "@/components/ui";
import { AlertStrip, Card, Chip, ConfirmBtn, Drawer, Field, Btn, inputStyle, toast, bFontFor, hFontFor } from "@/components/ModuleUI";
import { IconEye, IconShield, IconCheck, IconWarning } from "@/components/Icons";
import { listUsers, setUserActive, changeUserRole, setAcademicNumber } from "@/services/admin";
import { demoMode } from "@/services/auth";
import { useAdmin } from "@/store/admin-context";
import { KIND_LABELS, BACKEND_ROLE_TO_KIND } from "@/constants/admin";
import OfficerScopeCard from "@/components/admin/OfficerScopeCard";

const MONO = "'JetBrains Mono', monospace";
const KIND_KEYS = ["all", "student", "doctor", "officer"];
const kindOf = (role) => BACKEND_ROLE_TO_KIND[role] ?? "student";

export default function AdminUsersPage({ state }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const mobile = useMediaQuery("(max-width: 860px)");
  const admin = useAdmin();
  const canSee = admin.hasScope("users.view");
  const canManage = admin.hasScope("users.manage");

  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openUserId, setOpenUserId] = useState(null);
  const [numberDraft, setNumberDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const demo = demoMode();
  const fetchUsers = useCallback(() => (demo || !canSee ? Promise.resolve([]) : listUsers()), [demo, canSee]);
  const { data, loading, error, reload, setData } = useAsync(fetchUsers);
  const users = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const departments = useMemo(() => [...new Set(users.map((u) => u.department).filter(Boolean))], [users]);

  const shown = users.filter((u) => {
    if (kindFilter !== "all" && kindOf(u.role) !== kindFilter) return false;
    if (departmentFilter !== "all" && u.department !== departmentFilter) return false;
    if (statusFilter === "active" && !u.isActive) return false;
    if (statusFilter === "inactive" && u.isActive) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = `${u.firstName ?? ""} ${u.lastName ?? ""} ${u.email} ${u.academicNumber ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const openUser = users.find((u) => u.id === openUserId) ?? null;
  const openKind = openUser ? kindOf(openUser.role) : "student";

  const patchUser = (id, patch) => setData((prev) => (Array.isArray(prev) ? prev.map((u) => (u.id === id ? { ...u, ...patch } : u)) : prev));

  const saveNumber = async () => {
    setSaving(true);
    try {
      await setAcademicNumber(openUser.id, numberDraft);
      patchUser(openUser.id, { academicNumber: numberDraft.trim() || null });
      toast(t("Number saved.", "حُفظ الرقم."));
    } catch (err) {
      toast(err?.message ?? t("Could not save the number.", "تعذر حفظ الرقم."));
    } finally {
      setSaving(false);
    }
  };

  const applyRole = async (kind) => {
      try {
        await changeUserRole(openUser.id, kind);
        reload();
        toast(t("Role updated and audit-logged.", "حُدّث الدور وسُجّل في التدقيق."));
    } catch (err) {
      toast(err?.message ?? t("Could not update the role.", "تعذر تحديث الدور."));
    }
  };

  const toggleActive = async () => {
    const next = !openUser.isActive;
    try {
      await setUserActive(openUser.id, next ? "activate" : "deactivate");
      patchUser(openUser.id, { isActive: next });
      toast(next ? t("Account reactivated.", "أُعيد تفعيل الحساب.") : t("Account deactivated and audit-logged.", "عُطّل الحساب وسُجّل في التدقيق."));
    } catch (err) {
      toast(err?.message ?? t("Could not change account status.", "تعذر تغيير حالة الحساب."));
    }
  };

  const statusChip = (value, label) => (
    <Btn
      key={value}
      tokens={tokens}
      lang={lang}
      variant={statusFilter === value ? "primary" : "ghost"}
      style={{ fontSize: 12, padding: "6px 12px" }}
      onClick={() => setStatusFilter(value)}
    >
      {label}
    </Btn>
  );

  if (demo) {
    return (
      <div style={{ padding: mobile ? 16 : "26px 32px", maxWidth: 720, margin: "0 auto", fontFamily: bodyFont(lang) }}>
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
    <div style={{ padding: mobile ? 16 : "26px 32px", maxWidth: 1080, margin: "0 auto", direction: isRtl ? "rtl" : "ltr", textAlign: isRtl ? "right" : "left", fontFamily: bodyFont(lang) }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontFamily: hFont, fontWeight: 700, fontSize: 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: "0 0 4px" }}>
          {t("Users and roles", "المستخدمون والأدوار")}
        </h2>
        <p style={{ fontFamily: bFont, fontSize: 13, color: tokens.textMuted, margin: 0 }}>
          {t(
            "Manage every account inside your institution — academic numbers are for manual verification and never gate login.",
            "إدارة كل الحسابات داخل مؤسستك — الرقم الأكاديمي للتحقق اليدوي ولا يمنع الدخول أبدًا.",
          )}
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
        label={t("Loading users…", "جاري تحميل المستخدمين…")}
      >
        {!canSee ? (
          <AlertStrip
            tokens={tokens}
            lang={lang}
            tone="violet"
            icon={<IconShield size={14} color={tokens.gap} />}
            title={t("This page needs the users.view scope", "هذه الصفحة تحتاج نطاق users.view")}
            body={t("Ask your super admin to grant you the scope, or return to the health dashboard.", "اطلب من السوبر أدمن منحك النطاق، أو عُد إلى لوحة الصحة.")}
          />
        ) : (
          <>
            {!canManage && (
              <div style={{ marginBottom: 14 }}>
                <AlertStrip
                  tokens={tokens}
                  lang={lang}
                  tone="violet"
                  icon={<IconShield size={14} color={tokens.gap} />}
                  title={t("View-only mode", "وضع الاطلاع فقط")}
                  body={t(
                    "You have users.view but not users.manage — searching and reading is allowed; changes need a scope upgrade from your super admin.",
                    "عندك users.view دون users.manage — متاح لك البحث والاطلاع؛ التعديلات تحتاج صلاحية أعلى من السوبر أدمن.",
                  )}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Search name, email or academic number", "ابحث بالاسم أو البريد أو الرقم الأكاديمي")}
                style={{ ...inputStyle(tokens, bFont), flex: 1, minWidth: 220 }}
              />
              {departments.length > 0 && (
                <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} style={{ ...inputStyle(tokens, bFont), width: "auto", cursor: "pointer" }}>
                  <option value="all">{t("Any department", "أي قسم")}</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}
              <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value)} style={{ ...inputStyle(tokens, bFont), width: "auto", cursor: "pointer" }}>
                <option value="all">{t("Any kind", "أي نوع")}</option>
                {KIND_KEYS.slice(1).map((k) => (
                  <option key={k} value={k}>
                    {lang === "ar" ? KIND_LABELS[k].ar : KIND_LABELS[k].en}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
              {statusChip("all", t("Any status", "أي حالة"))}
              {statusChip("active", t("Active", "نشط"))}
              {statusChip("inactive", t("Deactivated", "معطّل"))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {shown.map((user) => {
                const kind = kindOf(user.role);
                const custom = Array.isArray(user.permissions) && user.permissions.length > 0;
                const isSuper = user.isSuperAdmin === true || (admin.me?.user?.email === user.email && admin.isSuperAdmin && kind === "officer");
                return (
                  <Card tokens={tokens} key={user.id} style={{ padding: "12px 16px", opacity: user.isActive ? 1 : 0.62 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                          <span style={{ fontFamily: bFont, fontWeight: 600, fontSize: 13.5, color: tokens.textPrimary }}>
                            {user.firstName} {user.lastName}
                          </span>
                          <Chip tokens={tokens} tone={kind === "officer" ? "primary" : kind === "doctor" ? "peri" : "default"}>
                            {lang === "ar" ? KIND_LABELS[kind].ar : KIND_LABELS[kind].en}
                          </Chip>
                          {isSuper && <Chip tokens={tokens} tone="primary">{t("Super", "سوبر")}</Chip>}
                          {custom && !isSuper && <Chip tokens={tokens} tone="violet">{t("Custom permissions", "صلاحيات مخصصة")}</Chip>}
                          {user.accountType === "individual" && <Chip tokens={tokens} tone="slate">{t("Individual", "فردي")}</Chip>}
                          {!user.isActive && <Chip tokens={tokens} tone="slate">{t("Deactivated", "معطّل")}</Chip>}
                        </div>
                        <div style={{ fontFamily: MONO, fontSize: 11, color: tokens.textMuted, marginTop: 4 }}>{user.email}</div>
                        <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textFaint, marginTop: 3 }}>
                          {kind === "student" && user.year ? `${t(`Year ${user.year}`, `سنة ${user.year}`)} · ` : ""}
                          {user.department ?? (user.accountType === "individual" ? t("Personal space", "مساحة شخصية") : "—")}
                          {kind === "officer" && custom ? ` · ${user.permissions.length} ${t("scopes", "نطاقات")}` : ""}
                        </div>
                      </div>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: user.academicNumber ? tokens.textSecondary : tokens.textFaint, flexShrink: 0 }}>
                        {user.academicNumber ?? t("no number yet", "بلا رقم بعد")}
                      </span>
                      <Btn
                        tokens={tokens}
                        lang={lang}
                        variant="ghost"
                        style={{ padding: "7px 12px", fontSize: 12, flexShrink: 0 }}
                        onClick={() => {
                          setOpenUserId(user.id);
                          setNumberDraft(user.academicNumber ?? "");
                        }}
                      >
                        <IconEye size={13} color={tokens.textSecondary} />
                        {t("Manage", "إدارة")}
                      </Btn>
                    </div>
                  </Card>
                );
              })}
              {shown.length === 0 && (
                <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textFaint, padding: "18px 4px" }}>
                  {t("No users match these filters.", "لا مستخدمون يطابقون عوامل التصفية.")}
                </div>
              )}
            </div>

            <Drawer
              open={openUser !== null}
              onClose={() => setOpenUserId(null)}
              tokens={tokens}
              lang={lang}
              title={openUser ? `${openUser.firstName} ${openUser.lastName}` : ""}
              subtitle={openUser?.email}
            >
              {openUser && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                    <Chip tokens={tokens}>
                      {lang === "ar" ? KIND_LABELS[openKind].ar : KIND_LABELS[openKind].en}
                    </Chip>
                    {(openUser.isSuperAdmin || (admin.me?.user?.email === openUser.email && admin.isSuperAdmin)) && (
                      <Chip tokens={tokens} tone="primary">{t("Super admin", "سوبر أدمن")}</Chip>
                    )}
                    <Chip tokens={tokens} tone={openUser.isActive ? "peri" : "slate"}>
                      {openUser.isActive ? t("Active", "نشط") : t("Deactivated", "معطّل")}
                    </Chip>
                    {openUser.accountType === "individual" && <Chip tokens={tokens} tone="slate">{t("Individual account", "حساب فردي")}</Chip>}
                  </div>

                  <Field
                    tokens={tokens}
                    lang={lang}
                    label={
                      openUser.role === "student"
                        ? t("Academic number (optional)", "الرقم الأكاديمي (اختياري)")
                        : openKind === "doctor" || openKind === "officer"
                          ? t("Employee number (optional)", "الرقم الوظيفي (اختياري)")
                          : t("Number", "الرقم")
                    }
                    hint={t("For manual verification only — never gates login or registration.", "للتحقق اليدوي فقط — لا يمنع الدخول أو التسجيل أبدًا.")}
                  >
                    <div style={{ display: "flex", gap: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
                      <input
                        value={numberDraft}
                        onChange={(e) => setNumberDraft(e.target.value)}
                        disabled={!canManage || saving}
                        style={{ ...inputStyle(tokens, bFont), width: "auto", flex: 1 }}
                        placeholder={openUser.role === "student" ? "20231701" : "EMP-0021"}
                      />
                      <Btn tokens={tokens} lang={lang} variant="soft" style={{ padding: "8px 14px", fontSize: 12 }} disabled={!canManage || saving} onClick={saveNumber}>
                        {t("Save", "حفظ")}
                      </Btn>
                    </div>
                  </Field>

                  {!openUser.isSuperAdmin && !(admin.me?.user?.email === openUser.email && admin.isSuperAdmin) && (
                    <Field tokens={tokens} lang={lang} label={t("Account role", "دور الحساب")}>
                      <select
                        value={openUser.role}
                        onChange={(e) => applyRole(e.target.value)}
                        disabled={!canManage}
                        style={{ ...inputStyle(tokens, bFont), cursor: "pointer" }}
                      >
                        <option value="student">{t("Student", "طالب")}</option>
                        <option value="instructor">{t("Doctor", "دكتور")}</option>
                        <option value="institution_admin">{t("Officer", "مسؤول")}</option>
                      </select>
                    </Field>
                  )}

                  {openUser.role === "institution_admin" && !(admin.me?.user?.email === openUser.email && admin.isSuperAdmin) && !openUser.isSuperAdmin && (
                    <OfficerScopeCard officer={openUser} templates={admin.me?.templates ?? []} tokens={tokens} lang={lang} t={t} onChanged={reload} />
                  )}

                  {(openUser.isSuperAdmin || (admin.me?.user?.email === openUser.email && admin.isSuperAdmin)) ? (
                    <AlertStrip
                      tokens={tokens}
                      lang={lang}
                      tone="peri"
                      icon={<IconCheck size={14} color={tokens.primary} />}
                      title={t("The super admin account can never be deactivated or demoted.", "لا يمكن تعطيل حساب السوبر أدمن أو تخفيض دوره أبدًا.")}
                    />
                  ) : (
                    <div style={{ border: `1px solid ${tokens.gapBorder}`, borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexDirection: isRtl ? "row-reverse" : "row" }}>
                        <IconWarning size={13} color={tokens.gap} />
                        <span style={{ fontFamily: bFont, fontWeight: 600, fontSize: 12.5, color: tokens.textPrimary }}>
                          {openUser.isActive ? t("Deactivate account", "تعطيل الحساب") : t("Reactivate account", "إعادة تفعيل الحساب")}
                        </span>
                      </div>
                      <p style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted, margin: "0 0 10px", lineHeight: 1.6 }}>
                        {openUser.isActive
                          ? t(
                              "Deactivating blocks login immediately — the platform already enforces this at sign-in. Data and enrollments stay untouched.",
                              "التعطيل يمنع الدخول فورًا — المنصة تفرض ذلك عند تسجيل الدخول بالفعل. البيانات والتسجيلات تبقى كما هي.",
                            )
                          : t("Reactivating restores login instantly.", "إعادة التفعيل تعيد الدخول فورًا.")}
                      </p>
                      <ConfirmBtn
                        tokens={tokens}
                        lang={lang}
                        variant={openUser.isActive ? "violet" : "soft"}
                        disabled={!canManage}
                        label={openUser.isActive ? t("Deactivate this account", "تعطيل هذا الحساب") : t("Reactivate this account", "إعادة تفعيل هذا الحساب")}
                        confirmLabel={openUser.isActive ? t("Click again — login gets blocked now", "اضغط للتأكيد — سيُمنع الدخول الآن") : t("Click again to restore login", "اضغط للتأكيد لاستعادة الدخول")}
                        onConfirm={toggleActive}
                      />
                    </div>
                  )}
                </div>
              )}
            </Drawer>
          </>
        )}
      </AsyncGate>
    </div>
  );
}
