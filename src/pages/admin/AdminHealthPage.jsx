import { useCallback, useMemo } from "react";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { tk, bodyFont } from "@/constants/tokens";
import { AsyncGate } from "@/components/ui";
import { AlertStrip, Card as MCard, Chip as MChip, bFontFor, hFontFor } from "@/components/ModuleUI";
import { IconShield, IconInbox, IconUpload, IconBookOpen, IconTrendUp, IconCheck } from "@/components/Icons";
import { getInstitutionHealth, listUsers, listAuditEvents } from "@/services/admin";
import { demoMode } from "@/services/auth";
import { useAdmin } from "@/store/admin-context";
import { AUDIT_TYPE_LABELS, PERMISSION_LABELS, TEMPLATE_LABELS } from "@/constants/admin";
import { SCREENS } from "@/constants/routes";

const MONO = "'JetBrains Mono', monospace";

function fmtWhen(iso, lang) {
  if (!iso) return lang === "ar" ? "لم يسجل بعد" : "never";
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 6e4));
  if (mins < 60) return lang === "ar" ? `منذ ${mins} دقيقة` : `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return lang === "ar" ? `منذ ${h} ساعة` : `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return lang === "ar" ? `منذ ${d} يوم` : `${d}d ago`;
  const mo = Math.round(d / 30);
  return lang === "ar" ? `منذ ${mo} شهر` : `${mo}mo ago`;
}

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

export default function AdminHealthPage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const mobile = useMediaQuery("(max-width: 860px)");
  const admin = useAdmin();
  const canSeeUsers = admin.hasScope("users.view");
  const canSeeAudit = admin.hasScope("audit.view");

  const fetchAll = useCallback(async () => {
    const health = await getInstitutionHealth();
    const [users, audit] = await Promise.all([
      canSeeUsers ? listUsers() : Promise.resolve(null),
      canSeeAudit ? listAuditEvents({ period: "7d", limit: 4 }).catch(() => null) : Promise.resolve(null),
    ]);
    return { health, users, audit };
  }, [canSeeUsers, canSeeAudit]);

  const { data, loading, error, reload } = useAsync(fetchAll);

  if (demoMode()) {
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

  const booting = admin.loading || loading;
  const bootError = admin.error || error;

  return (
    <div style={{ padding: mobile ? 16 : "26px 32px", maxWidth: 1080, margin: "0 auto", direction: isRtl ? "rtl" : "ltr", textAlign: isRtl ? "right" : "left", fontFamily: bodyFont(lang) }}>
      <AsyncGate
        tokens={tokens}
        lang={lang}
        loading={booting}
        error={bootError}
        reload={() => {
          admin.reload();
          reload();
        }}
        label={t("Loading institution health…", "جاري تحميل صحة المؤسسة…")}
      >
        {data && <HealthInner data={data} admin={admin} canSeeAudit={canSeeAudit} tokens={tokens} lang={lang} t={t} mobile={mobile} hFont={hFont} bFont={bFont} dispatch={dispatch} />}
      </AsyncGate>
    </div>
  );
}

function HealthInner({ data, admin, canSeeAudit, tokens, lang, t, mobile, hFont, bFont, dispatch }) {
  const isRtl = lang === "ar";
  const { health, users, audit } = data;
  const pendingRequests = health.pendingRequests ?? 0;
  const unacceptedInvitations = health.invitations?.pending ?? 0;
  const oldestInvitationDays = health.invitations?.oldestWaitingDays ?? 0;
  const coursesWithoutMaterials = health.courses?.withoutMaterials ?? 0;
  const totalCourses = health.courses?.total ?? 0;
  const contractActive = health.contract?.expired !== true;
  const contractEndsAt = health.contract?.endsAt ? new Date(health.contract.endsAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB") : null;
  const allHealthy = pendingRequests === 0 && oldestInvitationDays < 7 && coursesWithoutMaterials === 0 && contractActive;

  const officers = useMemo(
    () => (Array.isArray(users) ? users.filter((u) => u.role === "institution_admin") : []),
    [users],
  );
  const auditItems = audit?.items ?? [];

  const go = (screen) => () => dispatch?.({ type: "NAVIGATE", screen });

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: "0 0 4px" }}>
          {t("Institution health", "صحة المؤسسة")}
        </h1>
        <p style={{ fontFamily: bFont, fontSize: 13, color: tokens.textMuted, margin: 0 }}>
          {t(
            "One question for a rare visit: is everything sound, or does something need my intervention?",
            "سؤال واحد لزيارة نادرة: هل كل شيء سليم أم يوجد ما يحتاج تدخلي؟",
          )}
        </p>
      </div>

      <div style={{ marginBottom: 18 }}>
        {contractActive ? (
          allHealthy ? (
            <AlertStrip
              tokens={tokens}
              lang={lang}
              tone="peri"
              icon={<IconCheck size={14} color={tokens.primary} />}
              title={t("Everything is sound — nothing needs your intervention.", "كل شيء سليم — لا يوجد ما يحتاج تدخلك.")}
              body={t(
                `Contract runs until ${contractEndsAt ?? "—"}. This page tells you the moment that changes.`,
                `العقد سارٍ حتى ${contractEndsAt ?? "—"}. هذه الصفحة تنبهك فور اختلاف ذلك.`,
              )}
            />
          ) : (
            <AlertStrip
              tokens={tokens}
              lang={lang}
              tone="violet"
              icon={<IconShield size={14} color={tokens.gap} />}
              title={t("A few items need your attention below.", "بعض العناصر تحتاج انتباهك بالأسفل.")}
            />
          )
        ) : (
          <AlertStrip
            tokens={tokens}
            lang={lang}
            tone="violet"
            icon={<IconShield size={14} color={tokens.gap} />}
            title={t("Contract inactive — every institutional account is blocked from login.", "العقد غير نشط — كل الحسابات المؤسسية ممنوعة من الدخول.")}
          />
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 22 }}>
        <MCard tokens={tokens} style={{ padding: "16px 18px", cursor: "pointer" }} onClick={go(SCREENS.ADMIN_REQUESTS)}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
            <IconInbox size={14} color={pendingRequests ? tokens.gap : tokens.textFaint} />
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.09em", color: tokens.textMuted }}>{t("PENDING REQUESTS", "طلبات معلقة")}</span>
          </div>
          <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: 26, color: pendingRequests ? tokens.gap : tokens.textPrimary }}>{pendingRequests}</div>
          <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted, marginTop: 3 }}>
            {t("Join requests awaiting a decision", "طلبات انضمام بانتظار البت")}
          </div>
        </MCard>

        <MCard tokens={tokens} style={{ padding: "16px 18px", cursor: "pointer" }} onClick={go(SCREENS.ADMIN_IMPORT)}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
            <IconUpload size={14} color={oldestInvitationDays >= 7 ? tokens.gap : tokens.textFaint} />
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.09em", color: tokens.textMuted }}>{t("UNACCEPTED INVITATIONS", "دعوات لم تُقبل")}</span>
          </div>
          <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: 26, color: oldestInvitationDays >= 7 ? tokens.gap : tokens.textPrimary }}>{unacceptedInvitations}</div>
          <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted, marginTop: 3 }}>
            {unacceptedInvitations
              ? t(
                  `Oldest waiting ${oldestInvitationDays} days — a contact-problem signal, not a system fault`,
                  `أقدمها منتظرة ${oldestInvitationDays} يوم — مؤشر مشكلة تواصل لا مشكلة نظام`,
                )
              : t("Every bulk invitation has been accepted", "كل دعوات الإدخال الجماعي قُبلت")}
          </div>
        </MCard>

        <MCard tokens={tokens} style={{ padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
            <IconBookOpen size={14} color={coursesWithoutMaterials ? tokens.gap : tokens.textFaint} />
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.09em", color: tokens.textMuted }}>{t("COVERAGE GAPS", "فجوات التغطية")}</span>
          </div>
          <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: 26, color: coursesWithoutMaterials ? tokens.gap : tokens.textPrimary }}>
            {coursesWithoutMaterials}
            <span style={{ fontSize: 13, color: tokens.textFaint, fontWeight: 500 }}> / {totalCourses}</span>
          </div>
          <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted, marginTop: 3 }}>
            {t("Courses with zero material, institution-wide", "مقررات بلا أي محتوى على مستوى المؤسسة")}
          </div>
        </MCard>

        <MCard tokens={tokens} style={{ padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
            <IconShield size={14} color={contractActive ? tokens.primary : tokens.gap} />
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.09em", color: tokens.textMuted }}>{t("CONTRACT", "العقد")}</span>
          </div>
          <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: 16, color: contractActive ? tokens.primary : tokens.gap }}>
            {contractActive ? t("Active", "سارٍ") : t("Inactive", "غير نشط")}
          </div>
          <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted, marginTop: 3 }}>
            {contractActive
              ? t(
                  `Runs until ${contractEndsAt ?? "—"}${health.contract?.daysRemaining != null ? ` · ${health.contract.daysRemaining}d left` : ""}`,
                  `سارٍ حتى ${contractEndsAt ?? "—"}${health.contract?.daysRemaining != null ? ` · متبقي ${health.contract.daysRemaining} يوم` : ""}`,
                )
              : t("Login blocked for the whole institution", "الدخول محظور على المؤسسة كلها")}
          </div>
        </MCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
        <div>
          <SectionHeading
            title={t("Delegation activity", "نشاط التفويض")}
            subtitle={t(
              `${health.officers?.activeLast30d ?? 0} of ${health.officers?.total ?? 0} officers active in the last 30 days`,
              `${health.officers?.activeLast30d ?? 0} من ${health.officers?.total ?? 0} مسؤولين نشطون خلال ٣٠ يوم`,
            )}
            tokens={tokens}
            hFont={hFont}
            bFont={bFont}
            isRtl={isRtl}
          />
          {officers.length === 0 ? (
            <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textFaint }}>
              {t("Officer list needs the users.view scope.", "قائمة المسؤولين تحتاج نطاق users.view.")}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {officers.map((officer) => {
                const keys = officer.permissions ?? [];
                const labels = TEMPLATE_LABELS;
                const isSuper = officer.isSuperAdmin === true || (admin.me?.user?.email === officer.email && admin.isSuperAdmin);
                const templateId = Object.keys(labels).find((id) => {
                  const tplKeys = (admin.me?.templates ?? []).find((tpl) => tpl.id === id)?.keys ?? null;
                  return tplKeys && tplKeys.length === keys.length && keys.every((k) => tplKeys.includes(k));
                }) ?? null;
                const activeNow = officer.lastLoginAt && Date.now() - new Date(officer.lastLoginAt).getTime() < 30 * 864e5;
                return (
                  <MCard tokens={tokens} key={officer.id} style={{ padding: "12px 16px", cursor: admin.isSuperAdmin ? "pointer" : "default" }} onClickCapture={admin.isSuperAdmin ? go(SCREENS.ADMIN_OFFICERS) : undefined}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                          <span style={{ fontFamily: bFont, fontWeight: 600, fontSize: 13, color: tokens.textPrimary }}>
                            {officer.firstName} {officer.lastName}
                          </span>
                          {isSuper ? <MChip tokens={tokens} tone="primary">{t("Super admin", "سوبر أدمن")}</MChip> : null}
                          {!isSuper && !templateId && keys.length > 0 ? <MChip tokens={tokens}>{t("Custom", "مخصص")}</MChip> : null}
                        </div>
                        <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textMuted, marginTop: 3 }}>
                          {isSuper
                            ? t("Full permissions", "صلاحيات كاملة")
                            : templateId
                              ? (lang === "ar" ? labels[templateId].ar : labels[templateId].en)
                              : keys.length > 0
                                ? t("Custom scope set", "مجموعة مخصصة")
                                : t("No scopes assigned", "بلا نطاقات")}
                          {!isSuper && keys.length > 0 ? (
                            <span style={{ fontFamily: MONO, fontSize: 10.5, color: tokens.textFaint }}> · {keys.length} {t("scopes", "نطاقات")}</span>
                          ) : null}
                        </div>
                      </div>
                      <span style={{ fontFamily: MONO, fontSize: 10.5, color: activeNow ? tokens.primary : tokens.noEvidence, flexShrink: 0 }}>
                        {activeNow ? t("active", "نشط") : fmtWhen(officer.lastLoginAt, lang)}
                      </span>
                    </div>
                  </MCard>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <SectionHeading
            title={t("Latest audit events", "أحدث أحداث التدقيق")}
            subtitle={t("Within your permission scope — this week", "ضمن نطاق صلاحياتك — هذا الأسبوع")}
            tokens={tokens}
            hFont={hFont}
            bFont={bFont}
            isRtl={isRtl}
          />
          {auditItems.length === 0 ? (
            <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textFaint }}>
              {canSeeAudit ? t("Nothing logged inside your scope yet.", "لا أحداث مسجلة داخل نطاقك بعد.") : t("Audit preview needs the audit.view scope.", "معاينة التدقيق تحتاج نطاق audit.view.")}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {auditItems.map((event) => (
                <MCard tokens={tokens} key={event.id} style={{ padding: "11px 14px" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4, flexDirection: isRtl ? "row-reverse" : "row" }}>
                    <MChip tokens={tokens}>
                      {(AUDIT_TYPE_LABELS[event.type] ?? { en: event.type, ar: event.type })[lang === "ar" ? "ar" : "en"]}
                    </MChip>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.textFaint }}>
                      {(PERMISSION_LABELS[event.scope] ?? { en: event.scope, ar: event.scope })[lang === "ar" ? "ar" : "en"]}
                    </span>
                  </div>
                  <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textSecondary, lineHeight: 1.6 }}>
                    {lang === "ar" ? event.summary?.ar : event.summary?.en}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: tokens.textFaint, marginTop: 5 }}>
                    {event.actorName} · {fmtWhen(event.at, lang)}
                  </div>
                </MCard>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 22, padding: "12px 16px", background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, display: "flex", gap: 10, alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
        <IconTrendUp size={14} color={tokens.developing} />
        <span style={{ fontFamily: bFont, fontSize: 12, color: tokens.textSecondary }}>
          {t(
            "Institution analytics are computed on demand from real collections — their screen arrives with the audit log and settings in the next features.",
            "تحليلات المؤسسة تُحسب عند الطلب من المجموعات الحقيقية — شاشتها جاية مع سجل التدقيق والإعدادات في الميزات التالية.",
          )}
        </span>
      </div>
    </>
  );
}
