import { useCallback } from "react";
import useAsync from "@/hooks/useAsync";
import { tk, bodyFont } from "@/constants/tokens";
import { AsyncGate } from "@/components/ui";
import { AlertStrip, Btn, Card, Chip, toast, bFontFor, hFontFor } from "@/components/ModuleUI";
import { IconAnchor, IconSend, IconCheck, IconClock, IconWarning, IconShield } from "@/components/Icons";
import { listLinkCandidates, listLinkInvitations, sendLinkInvitation } from "@/services/admin";
import { demoMode } from "@/services/auth";
import { useAdmin } from "@/store/admin-context";

const MONO = "'JetBrains Mono', monospace";

const daysAgo = (iso) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 864e5));

function SectionHeading({ title, subtitle, tokens, hFont, bFont, isRtl }) {
  return (
    <div style={{ marginBottom: 12, textAlign: isRtl ? "right" : "left" }}>
      <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em" }}>{title}</div>
      {subtitle ? <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textMuted, marginTop: 3 }}>{subtitle}</div> : null}
    </div>
  );
}

export default function AdminLinkAccountsPage({ state }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const admin = useAdmin();
  const canLink = admin.hasScope("accounts.link");
  const demo = demoMode();

  const fetchAll = useCallback(async () => {
    if (demo || !canLink) return { candidates: [], invitations: [] };
    const [candidates, invitations] = await Promise.all([listLinkCandidates(), listLinkInvitations()]);
    return {
      candidates: Array.isArray(candidates) ? candidates : [],
      invitations: Array.isArray(invitations) ? invitations : [],
    };
  }, [demo, canLink]);

  const { data, loading, error, reload } = useAsync(fetchAll);
  const candidates = (data?.candidates ?? []).filter((c) => !c.invitation || c.invitation.status === "declined");
  const invitations = data?.invitations ?? [];
  const awaiting = invitations.filter((i) => i.status === "awaiting-consent").length;
  const counts = {
    candidates: candidates.length,
    awaiting,
    linked: invitations.filter((i) => i.status === "linked").length,
    declined: invitations.filter((i) => i.status === "declined").length,
  };

  const sendInvite = async (candidate) => {
    try {
      await sendLinkInvitation(candidate.id);
      await reload();
      toast(
        t(
          `Link invitation sent to ${candidate.firstName} — they decide from inside their own account.`,
          `أُرسلت دعوة الربط إلى ${candidate.firstName} — يقرر من داخل حسابه.`,
        ),
      );
    } catch (err) {
      toast(err?.message ?? t("Could not send the invitation.", "تعذرت إرسال الدعوة."));
    }
  };

  const statusChip = (status) =>
    status === "awaiting-consent"
      ? <Chip tokens={tokens} tone="peri">{t("Awaiting student consent", "بانتظار موافقة الطالب")}</Chip>
      : status === "linked"
        ? <Chip tokens={tokens} tone="primary">{t("Linked — institutional", "مرتبط — مؤسسي")}</Chip>
        : <Chip tokens={tokens} tone="violet">{t("Declined — may accept later", "مرفوض — قد يقبل لاحقًا")}</Chip>;

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
          {t("Individual account linking", "ربط الحسابات الفردية")}
        </h1>
        <p style={{ fontFamily: bFont, fontSize: 13, color: tokens.textMuted, margin: 0 }}>
          {t("Personal accounts on approved domains convert to institutional — only with the student's own consent.", "الحسابات الشخصية على النطاقات المعتمدة تتحول لمؤسسية — بموافقة الطالب نفسه فقط.")}
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <AlertStrip
          tokens={tokens}
          lang={lang}
          tone="peri"
          icon={<IconAnchor size={14} color={tokens.primary} />}
          title={t(
            "Consent is the gate: before he agrees, nothing changes; after he agrees, the account becomes institutional with its history and courses fully preserved. The student keeps the right to decline.",
            "الموافقة هي البوابة: قبلها لا يتغير شيء، وبعدها يصبح الحساب مؤسسيًا بمحفوظاته ومقرراته كاملة. وللطالب حق الرفض دائمًا.",
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
        label={t("Loading linking workspace…", "جاري تحميل مساحة الربط…")}
      >
        {!canLink ? (
          <AlertStrip
            tokens={tokens}
            lang={lang}
            tone="violet"
            icon={<IconShield size={14} color={tokens.gap} />}
            title={t("This page needs the accounts.link scope", "هذه الصفحة تحتاج نطاق accounts.link")}
            body={t("Ask your super admin to grant you the scope, or return to the health dashboard.", "اطلب من السوبر أدمن منحك النطاق، أو عُد إلى لوحة الصحة.")}
          />
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, flexDirection: isRtl ? "row-reverse" : "row" }}>
              <Chip tokens={tokens} tone="slate">{t("Candidates", "مرشحون")}: {counts.candidates}</Chip>
              <Chip tokens={tokens} tone="peri">{t("Awaiting consent", "بانتظار الموافقة")}: {counts.awaiting}</Chip>
              <Chip tokens={tokens} tone="primary">{t("Linked", "مرتبطة")}: {counts.linked}</Chip>
              <Chip tokens={tokens} tone="violet">{t("Declined", "مرفوضة")}: {counts.declined}</Chip>
            </div>

            <div style={{ marginBottom: 18 }}>
              <SectionHeading
                title={t("Candidates — personal accounts on approved domains", "المرشحون — حسابات شخصية على النطاقات المعتمدة")}
                subtitle={t("Auto-detected because their emails end on one of the institution's approved domains.", "رُصدوا تلقائيًا لانتماء إيميلاتهم إلى نطاق معتمد من المؤسسة.")}
                tokens={tokens}
                hFont={hFont}
                bFont={bFont}
                isRtl={isRtl}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {candidates.map((c) => (
                  <Card tokens={tokens} key={c.id} style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                          <span style={{ fontFamily: bFont, fontWeight: 600, fontSize: 13, color: tokens.textPrimary }}>
                            {c.firstName} {c.lastName}
                          </span>
                          <Chip tokens={tokens}>{t("Individual account", "حساب فردي")}</Chip>
                          <Chip tokens={tokens} tone="slate">{String(c.email).split("@")[1]}</Chip>
                        </div>
                        <div style={{ fontFamily: MONO, fontSize: 11, color: tokens.textMuted, marginTop: 4 }}>{c.email}</div>
                        <div style={{ fontFamily: bFont, fontSize: 11, color: tokens.textFaint, marginTop: 4 }}>
                          {t("History and courses carry over after consent — nothing converts before it.", "السجل والمقررات ينتقلان بعد الموافقة — ولا يتغير شيء قبلها.")}
                        </div>
                      </div>
                      <Btn tokens={tokens} lang={lang} variant="soft" style={{ padding: "8px 14px", fontSize: 12.5, flexShrink: 0 }} onClick={() => sendInvite(c)}>
                        <IconSend size={13} color={tokens.primary} />
                        {t("Send link invitation", "إرسال دعوة ربط")}
                      </Btn>
                    </div>
                  </Card>
                ))}
                {candidates.length === 0 && (
                  <Card tokens={tokens} style={{ padding: "18px 16px" }}>
                    <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textMuted }}>
                      {t("No candidates left — every detected personal account has been invited.", "لا مرشحين متبقين — كل الحسابات الشخصية المرصودة دُعيت.")}
                    </div>
                  </Card>
                )}
              </div>
            </div>

            <div>
              <SectionHeading
                title={t("Link invitations", "دعوات الربط")}
                subtitle={counts.awaiting
                  ? t(`${counts.awaiting} still waiting — the student sees the consent notice from inside his account`, `${counts.awaiting} ما زالت منتظرة — يرى الطالب إشعار الموافقة داخل حسابه`)
                  : t("Every invitation has been answered", "كل الدعوات أُجيب عنها")}
                tokens={tokens}
                hFont={hFont}
                bFont={bFont}
                isRtl={isRtl}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {invitations.map((inv) => {
                  const waitingDays = inv.status === "awaiting-consent" ? daysAgo(inv.invitedAt) : 0;
                  const displayName = inv.email.split("@")[0];
                  return (
                    <Card tokens={tokens} key={inv.id} style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                            <span style={{ fontFamily: bFont, fontWeight: 600, fontSize: 13, color: tokens.textPrimary }}>{displayName}</span>
                            {statusChip(inv.status)}
                          </div>
                          <div style={{ fontFamily: MONO, fontSize: 11, color: tokens.textMuted, marginTop: 4 }}>{inv.email}</div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 5, flexDirection: isRtl ? "row-reverse" : "row" }}>
                            {inv.status === "awaiting-consent" && (
                              <span style={{ display: "inline-flex", gap: 5, alignItems: "center", fontFamily: MONO, fontSize: 10.5, color: waitingDays >= 5 ? tokens.gap : tokens.textFaint }}>
                                <IconClock size={11} color={waitingDays >= 5 ? tokens.gap : tokens.textFaint} />
                                {waitingDays > 0 ? t(`waiting ${waitingDays}d`, `منتظرة ${waitingDays} يوم`) : t("sent today", "أُرسلت اليوم")}
                              </span>
                            )}
                            {inv.status === "linked" && inv.respondedAt && (
                              <span style={{ display: "inline-flex", gap: 5, alignItems: "center", fontFamily: MONO, fontSize: 10.5, color: tokens.primary }}>
                                <IconCheck size={11} color={tokens.primary} />
                                {t("consented — account converted, audit-logged", "وافق — تحول الحساب وسُجل في التدقيق")}
                              </span>
                            )}
                            {inv.status === "declined" && (
                              <span style={{ display: "inline-flex", gap: 5, alignItems: "center", fontFamily: MONO, fontSize: 10.5, color: tokens.gap }}>
                                <IconWarning size={11} color={tokens.gap} />
                                {t("the consent banner stays visible inside his account", "شريط الموافقة يبقى ظاهرًا داخل حسابه")}
                              </span>
                            )}
                          </div>
                        </div>
                        {inv.invitedByName && (
                          <span style={{ fontFamily: MONO, fontSize: 10.5, color: tokens.textFaint, flexShrink: 0 }}>
                            {t("sent by", "أُرسلت بواسطة")} {inv.invitedByName}
                          </span>
                        )}
                      </div>
                    </Card>
                  );
                })}
                {invitations.length === 0 && (
                  <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textFaint }}>
                    {t("No invitations yet — invite a candidate above.", "لا دعوات بعد — ادعُ مرشحًا بالأعلى.")}
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
