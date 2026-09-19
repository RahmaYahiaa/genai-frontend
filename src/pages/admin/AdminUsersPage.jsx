import { useCallback, useEffect, useMemo, useState } from "react";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { AsyncGate, Chip, Btn } from "@/components/ui";
import { Drawer, Toggle, Field, inputStyle, toast, bFontFor } from "@/components/ModuleUI";
import { listUsers, setUserActive, changeUserRole, setAcademicNumber } from "@/services/admin";
import { demoMode } from "@/services/auth";
import { useAdmin } from "@/store/admin-context";
import { BACKEND_ROLE_TO_KIND, KIND_TO_BACKEND_ROLE, KIND_LABELS } from "@/constants/admin";
import OfficerScopeCard from "@/components/admin/OfficerScopeCard";

function kindOf(user) {
  return BACKEND_ROLE_TO_KIND[user.role] ?? "student";
}

export default function AdminUsersPage({ state }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const bFont = bFontFor(lang);
  const hFont = headingFont(lang);
  const mobile = useMediaQuery("(max-width: 860px)");
  const admin = useAdmin();
  const canManage = admin.hasScope("users.manage");
  const fetchUsers = useCallback(() => listUsers(), []);
  const { data, loading, error, reload } = useAsync(fetchUsers);

  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openUserId, setOpenUserId] = useState(null);
  const [numberDraft, setNumberDraft] = useState("");
  const [kindDraft, setKindDraft] = useState("student");
  const [busy, setBusy] = useState(false);

  const all = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const users = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return all.filter((user) => {
      const kind = kindOf(user);
      if (kindFilter !== "all" && kind !== kindFilter) return false;
      if (statusFilter === "active" && !user.isActive) return false;
      if (statusFilter === "inactive" && user.isActive) return false;
      if (!needle) return true;
      return (
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(needle) ||
        String(user.email).toLowerCase().includes(needle) ||
        String(user.academicNumber ?? "").toLowerCase().includes(needle)
      );
    });
  }, [all, query, kindFilter, statusFilter]);

  const openUser = all.find((user) => user.id === openUserId) ?? null;
  const openKind = openUser ? kindOf(openUser) : null;

  useEffect(() => {
    if (openUser) {
      setNumberDraft(openUser.academicNumber ?? "");
      setKindDraft(kindOf(openUser));
    }
  }, [openUserId, openUser?.role]);

  const counts = {
    all: all.length,
    student: all.filter((u) => kindOf(u) === "student").length,
    doctor: all.filter((u) => kindOf(u) === "doctor").length,
    officer: all.filter((u) => kindOf(u) === "officer").length,
  };

  async function mutate(action, message) {
    setBusy(true);
    try {
      await action();
      toast(message);
      reload();
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  const chip = (id, active, label, count) => (
    <button
      key={id}
      onClick={() => (active === "kind" ? setKindFilter(id) : setStatusFilter(id))}
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        cursor: "pointer",
        fontFamily: bFont,
        fontSize: 12,
        fontWeight: (active === "kind" ? kindFilter : statusFilter) === id ? 600 : 500,
        background: (active === "kind" ? kindFilter : statusFilter) === id ? tokens.primaryLight : tokens.card,
        border: `1px solid ${(active === "kind" ? kindFilter : statusFilter) === id ? tokens.primary : tokens.cardBorder}`,
        color: (active === "kind" ? kindFilter : statusFilter) === id ? tokens.primary : tokens.textSecondary,
      }}
    >
      {label}
      {count !== undefined ? ` · ${count}` : ""}
    </button>
  );

  if (demoMode()) {
    return (
      <div style={{ padding: 28, maxWidth: 720, margin: "0 auto", fontFamily: bodyFont(lang) }}>
        <div style={{ fontFamily: hFont, fontWeight: 800, fontSize: 16, color: tokens.textPrimary }}>
          {t("User management needs the real backend — set VITE_API_URL.", "إدارة المستخدمين محتاجة الباك إند الحقيقي — اضبطي VITE_API_URL.")}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: mobile ? 16 : "26px 32px", maxWidth: 1080, margin: "0 auto", fontFamily: bodyFont(lang) }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: "0 0 4px", fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, letterSpacing: "-0.025em", color: tokens.textPrimary }}>
          {t("User management", "إدارة المستخدمين")}
        </h1>
        <p style={{ margin: 0, fontFamily: bFont, fontSize: 13, color: tokens.textMuted }}>
          {t(
            "Every student, doctor and officer of the institution — status, roles and verification numbers, straight from the database.",
            "كل طالب ودكتور ومسؤول في المؤسسة — الحالة والأدوار وأرقام التحقق، من قاعدة البيانات مباشرة.",
          )}
        </p>
      </div>

      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Loading users…", "جاري تحميل المستخدمين…")}>
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("Search name, email or number…", "دور بالاسم أو الإيميل أو الرقم…")}
              style={{ ...inputStyle(tokens, bFont), flex: 1, minWidth: 200 }}
            />
            {chip("all", "kind", t("All", "الكل"), counts.all)}
            {chip("student", "kind", t("Students", "طلاب"), counts.student)}
            {chip("doctor", "kind", t("Doctors", "دكاترة"), counts.doctor)}
            {chip("officer", "kind", t("Officers", "مسؤولون"), counts.officer)}
            <span style={{ width: 1, background: tokens.cardBorder, alignSelf: "stretch" }} />
            {chip("all", "status", t("Any status", "أي حالة"))}
            {chip("active", "status", t("Active", "نشِط"))}
            {chip("inactive", "status", t("Inactive", "معطّل"))}
          </div>

          {!canManage && (
            <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.developing, background: tokens.developingBg, border: `1px solid ${tokens.developingBorder}`, borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
              {t(
                "Read-only view — your scope lacks users.manage, so actions are hidden.",
                "عرض للقراءة فقط — نطاقك لا يشمل users.manage فالإجراءات مخفية.",
              )}
            </div>
          )}

          <div style={{ border: `1px solid ${tokens.cardBorder}`, borderRadius: 12, background: tokens.card, overflow: "hidden" }}>
            {users.length === 0 ? (
              <div style={{ padding: 26, textAlign: "center", fontFamily: bFont, fontSize: 13, color: tokens.textMuted }}>
                {t("No users match this filter.", "لا يوجد مستخدمون بهذا الفلتر.")}
              </div>
            ) : (
              users.map((user, index) => {
                const kind = kindOf(user);
                const label = KIND_LABELS[kind];
                return (
                  <button
                    key={user.id}
                    onClick={() => setOpenUserId(user.id)}
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
                    <span
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 9,
                        flexShrink: 0,
                        background: user.isActive ? tokens.primaryLight : tokens.inset,
                        color: user.isActive ? tokens.primary : tokens.textFaint,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: hFont,
                        fontWeight: 800,
                        fontSize: 12,
                      }}
                    >
                      {`${user.firstName?.charAt(0) ?? ""}${user.lastName?.charAt(0) ?? ""}`.toUpperCase()}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: bFont, fontWeight: 600, fontSize: 13.5, color: tokens.textPrimary }}>
                          {user.firstName} {user.lastName}
                        </span>
                        {user.invited ? (
                          <Chip tokens={tokens} tone="developing">{t("invited — awaiting first registration", "مدعو — في انتظار أول تسجيل")}</Chip>
                        ) : null}
                      </span>
                      <span style={{ display: "block", fontFamily: bFont, fontSize: 12, color: tokens.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user.email}
                      </span>
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: user.academicNumber ? tokens.textSecondary : tokens.textFaint, flexShrink: 0 }}>
                      {user.academicNumber ?? t("no number yet", "بلا رقم بعد")}
                    </span>
                    <Chip tokens={tokens} tone={kind === "officer" ? "primary" : "default"}>
                      {lang === "ar" ? label.ar : label.en}
                    </Chip>
                    <span
                      title={user.isActive ? t("active", "نشِط") : t("deactivated", "معطّل")}
                      style={{ width: 9, height: 9, borderRadius: "50%", flexShrink: 0, background: user.isActive ? tokens.mastered : tokens.gap ?? "#d64545" }}
                    />
                  </button>
                );
              })
            )}
          </div>
        </>
      </AsyncGate>

      <Drawer
        open={Boolean(openUser)}
        onClose={() => setOpenUserId(null)}
        title={openUser ? `${openUser.firstName} ${openUser.lastName}` : ""}
        subtitle={openUser?.email ?? ""}
        tokens={tokens}
        lang={lang}
      >
        {openUser && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textMuted, lineHeight: 1.7 }}>
              {openUser.lastLoginAt
                ? t(`Last login ${new Date(openUser.lastLoginAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB")}`, `آخر دخول ${new Date(openUser.lastLoginAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB")}`)
                : t("Never logged in.", "لم يسجل الدخول بعد.")}
            </div>

            <Field
              tokens={tokens}
              lang={lang}
              label={t("Academic / employee number (manual verification)", "الرقم الأكاديمي / الوظيفي (تحقق يدوي)")}
            >
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={numberDraft}
                  onChange={(event) => setNumberDraft(event.target.value)}
                  disabled={!canManage || busy}
                  placeholder={t("e.g. 202341872 or EMP-0117", "مثال: 202341872 أو EMP-0117")}
                  style={{ ...inputStyle(tokens, bFont), flex: 1, fontFamily: "'JetBrains Mono', monospace" }}
                />
                <Btn
                  tokens={tokens}
                  disabled={!canManage || busy || String(numberDraft ?? "") === String(openUser.academicNumber ?? "")}
                  onClick={() =>
                    mutate(
                      () => setAcademicNumber(openUser.id, numberDraft),
                      t("Number saved.", "حُفظ الرقم."),
                    )
                  }
                >
                  {t("Save", "حفظ")}
                </Btn>
              </div>
            </Field>

            <Field tokens={tokens} lang={lang} label={t("Role", "الدور")}>
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  value={kindDraft}
                  onChange={(event) => setKindDraft(event.target.value)}
                  disabled={!canManage || busy}
                  style={{ ...inputStyle(tokens, bFont), flex: 1 }}
                >
                  {Object.entries(KIND_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>{lang === "ar" ? label.ar : label.en}</option>
                  ))}
                </select>
                <Btn
                  tokens={tokens}
                  disabled={!canManage || busy || kindDraft === openKind}
                  onClick={() =>
                    mutate(
                      () => changeUserRole(openUser.id, KIND_TO_BACKEND_ROLE[kindDraft]),
                      t("Role changed.", "تغيّر الدور."),
                    )
                  }
                >
                  {t("Apply", "تطبيق")}
                </Btn>
              </div>
            </Field>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                border: `1px solid ${tokens.cardBorder}`,
                borderRadius: 10,
                padding: "12px 14px",
                background: tokens.card,
                flexDirection: isRtl ? "row-reverse" : "row",
              }}
            >
              <Toggle
                on={Boolean(openUser.isActive)}
                disabled={!canManage || busy || admin.me?.user?.id === openUser.id}
                tokens={tokens}
                onChange={() =>
                  mutate(
                    () => setUserActive(openUser.id, !openUser.isActive),
                    openUser.isActive ? t("Account deactivated — login blocked instantly.", "عُطّل الحساب — الدخول محظور فورًا.") : t("Account activated — login restored.", "فُعّل الحساب — عاد الدخول."),
                  )
                }
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: bFont, fontWeight: 600, fontSize: 13, color: tokens.textPrimary }}>
                  {openUser.isActive ? t("Account is active", "الحساب نشِط") : t("Account is deactivated", "الحساب معطّل")}
                </div>
                <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted }}>
                  {admin.me?.user?.id === openUser.id
                    ? t("You cannot deactivate yourself.", "لا يمكنك تعطيل حسابك بنفسك.")
                    : t("Deactivated users are blocked at login immediately.", "المستخدمون المعطّلون يُمنعون من الدخول فورًا.")}
                </div>
              </div>
            </div>

            {openKind === "officer" && admin.isSuperAdmin ? (
              <OfficerScopeCard officer={openUser} templates={admin.me?.templates} tokens={tokens} lang={lang} t={t} onChanged={reload} />
            ) : openKind === "officer" ? (
              <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textFaint }}>
                {t("Permission scopes are edited by the super admin from the officers screen.", "نطاقات الصلاحيات يعدلها السوبر أدمن من شاشة المسؤولين.")}
              </div>
            ) : null}
          </div>
        )}
      </Drawer>
    </div>
  );
}
