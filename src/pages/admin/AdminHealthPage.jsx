import { useCallback } from "react";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { Card, Btn, Chip, Bar, Stat, AsyncGate } from "@/components/ui";
import { getInstitutionHealth } from "@/services/admin";
import { demoMode } from "@/services/auth";
import { useAdmin } from "@/store/admin-context";

function demoNotice({ tokens, lang, t, mobile }) {
  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 720, margin: "0 auto", fontFamily: bodyFont(lang) }}>
      <Card tokens={tokens}>
        <div style={{ fontFamily: headingFont(lang), fontWeight: 800, fontSize: 16, color: tokens.textPrimary, marginBottom: 8 }}>
          {t("Admin module requires the real backend", "وحدة إدارة المؤسسة بتشتغل مع الباك إند الحقيقي بس")}
        </div>
        <div style={{ fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.8 }}>
          {t(
            "The frontend is running without VITE_API_URL, so it is in demo mode. Set VITE_API_URL to your running backend (ending with /api/v1), restart the frontend, and sign in with your institution admin account.",
            "الفرونت شغال من غير VITE_API_URL فهو في الوضع التجريبي. اضبطي VITE_API_URL على الباك إند الشغال (منتهيًا بـ /api/v1)، اعملي إعادة تشغيل للفرونت، وسجّلي دخولك بحساب مسؤول المؤسسة.",
          )}
        </div>
      </Card>
    </div>
  );
}

export default function AdminHealthPage({ state }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const mobile = useMediaQuery("(max-width: 860px)");
  const admin = useAdmin();
  const fetchHealth = useCallback(() => getInstitutionHealth(), []);
  const { data, loading, error, reload } = useAsync(fetchHealth);

  if (demoMode()) return demoNotice({ tokens, lang, t, mobile });

  const booting = admin.loading || loading;
  const bootError = admin.error || error;

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 1180, margin: "0 auto", fontFamily: bodyFont(lang) }}>
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
        {data && <HealthInner data={data} admin={admin} tokens={tokens} lang={lang} t={t} mobile={mobile} />}
      </AsyncGate>
    </div>
  );
}

function HealthInner({ data, admin, tokens, lang, t, mobile }) {
  const me = admin.me;
  const institutionName = me?.user?.email?.split("@")?.[1] ?? "";
  const contractDays = data.contract.daysRemaining;
  const contractTone = contractDays === null ? "default" : contractDays < 0 ? "gap" : contractDays <= 60 ? "developing" : "mastered";
  const officerPct = data.officers.total > 0 ? Math.round((data.officers.activeLast30d / data.officers.total) * 100) : 0;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: mobile ? 19 : 22, fontWeight: 700, letterSpacing: "-0.02em", color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
            {t("Institution health", "صحة المؤسسة")}
          </h1>
          <div style={{ fontSize: 12.5, color: tokens.textMuted, marginTop: 4 }}>
            {t("Live counters from your tenant — no mock data anywhere.", "عدادات حية من مستأجرك — مفيش أي بيانات وهمية.")}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {institutionName ? <Chip tokens={tokens} tone="primary">{institutionName}</Chip> : null}
          <Chip tokens={tokens}>
            {admin.isSuperAdmin
              ? t("Super admin — all 8 scopes", "سوبر أدمن — كل الصلاحيات")
              : t(`${(me?.permissions ?? []).length} scopes`, `${(me?.permissions ?? []).length} صلاحيات`)}
          </Chip>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 12, marginBottom: 14 }}>
        <Stat
          tokens={tokens}
          label={t("Pending join requests", "طلبات انضمام معلقة")}
          value={data.pendingRequests}
          hint={data.pendingRequests > 0 ? t("waiting for a decision", "في انتظار قرار") : t("queue is clear", "الطابور فاضي")}
          accent={data.pendingRequests > 0 ? tokens.primary : tokens.mastered}
        />
        <Stat
          tokens={tokens}
          label={t("Unaccepted invitations", "دعوات بلا استجابة")}
          value={data.invitations.pending}
          hint={
            data.invitations.pending > 0
              ? t(`oldest waiting ${data.invitations.oldestWaitingDays}d`, `أقدمها ناطرة منذ ${data.invitations.oldestWaitingDays} يوم`)
              : t("everyone answered", "الكل رد")
          }
          accent={data.invitations.pending > 0 ? tokens.mastered : undefined}
        />
        <Stat
          tokens={tokens}
          label={t("Link consents awaiting", "موافقات ربط معلقة")}
          value={data.awaitingLinkConsents}
          hint={t("individual accounts can never be force-linked", "الحسابات الفردية لا تُربط قسرًا")}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1.4fr 1fr 1fr", gap: 14, alignItems: "stretch" }}>
        <Card tokens={tokens}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: tokens.textPrimary }}>
              {t("Courses & materials", "المقررات والمحتوى")}
            </div>
            <Chip tokens={tokens} tone={data.courses.withoutMaterials > 0 ? "developing" : "mastered"}>
              {data.courses.withoutMaterials > 0
                ? t(`${data.courses.withoutMaterials}/${data.courses.total} empty`, `${data.courses.withoutMaterials}/${data.courses.total} فاضية`)
                : t("all covered", "كلها مغطاة")}
            </Chip>
          </div>
          <div style={{ fontSize: 12.5, color: tokens.textSecondary, marginBottom: 8 }}>
            {t(
              `${data.courses.total} institutional courses — ${data.courses.withoutMaterials} hold no materials at all.`,
              `${data.courses.total} مقررًا مؤسسيًا — ${data.courses.withoutMaterials} بلا أي محتوى.`,
            )}
          </div>
          {data.courses.withoutMaterialsCodes.length > 0 ? (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {data.courses.withoutMaterialsCodes.map((code) => (
                <Chip key={code ?? "none"} tokens={tokens}>{code ?? "—"}</Chip>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: tokens.mastered, fontWeight: 600 }}>
              {t("No coverage gaps — every course has materials.", "مفيش فجوات — كل مقرر معاه محتوى.")}
            </div>
          )}
        </Card>

        <Card tokens={tokens}>
          <div style={{ fontWeight: 700, fontSize: 14, color: tokens.textPrimary, marginBottom: 12 }}>
            {t("Officer activity", "نشاط المسؤولين")}
          </div>
          <div style={{ fontSize: 12.5, color: tokens.textSecondary, marginBottom: 10 }}>
            {t(
              `${data.officers.activeLast30d} of ${data.officers.total} institutional admins acted in the last 30 days`,
              `${data.officers.activeLast30d} من ${data.officers.total} مسؤولي المؤسسة نفذوا إجراءات آخر 30 يوم`,
            )}
          </div>
          <Bar tokens={tokens} value={officerPct} color={tokens.primary} />
          <div style={{ fontSize: 11.5, color: tokens.textMuted, marginTop: 6 }}>{officerPct}%</div>
        </Card>

        <Card tokens={tokens}>
          <div style={{ fontWeight: 700, fontSize: 14, color: tokens.textPrimary, marginBottom: 12 }}>
            {t("Contract", "العقد")}
          </div>
          {contractDays === null ? (
            <div style={{ fontSize: 12.5, color: tokens.textMuted }}>{t("No contract end date recorded.", "لا يوجد تاريخ نهاية عقد مسجل.")}</div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 800, color: tokens.textPrimary }}>
                  {Math.abs(contractDays)}
                </span>
                <Chip tokens={tokens} tone={contractTone}>
                  {contractDays < 0 ? t("expired", "منتهٍ") : t("days left", "يوم متبقي")}
                </Chip>
              </div>
              <div style={{ fontSize: 12, color: tokens.textMuted }}>
                {t("Ends", "ينتهي في")} {data.contract.endsAt ? new Date(data.contract.endsAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB") : "—"}
              </div>
            </>
          )}
        </Card>
      </div>

      <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
        <Btn tokens={tokens} variant="ghost" onClick={() => window.location.reload()}>
          {t("Refresh", "تحديث")}
        </Btn>
      </div>
    </>
  );
}
