import { useState } from "react";
import useAsync from "@/hooks/useAsync";
import { tk, bodyFont } from "@/constants/tokens";
import { AsyncGate } from "@/components/ui";
import { AlertStrip, Btn, Card, Chip, Toggle, inputStyle, toast, bFontFor, hFontFor } from "@/components/ModuleUI";
import { IconGear, IconPlus, IconX, IconCheck, IconShield } from "@/components/Icons";
import { getSettings, updateSettings } from "@/services/admin";
import { demoMode } from "@/services/auth";
import { useAdmin } from "@/store/admin-context";
import { SOURCE_TYPE_LABELS } from "@/constants/admin";

const MONO = "'JetBrains Mono', monospace";

function SectionHeading({ title, subtitle, tokens, hFont, bFont, isRtl }) {
  return (
    <div style={{ marginBottom: 12, textAlign: isRtl ? "right" : "left" }}>
      <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em" }}>{title}</div>
      {subtitle ? <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textMuted, marginTop: 3, lineHeight: 1.6 }}>{subtitle}</div> : null}
    </div>
  );
}

export default function AdminSettingsPage({ state }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const admin = useAdmin();
  const canManage = admin.hasScope("settings.manage");
  const demo = demoMode();

  const [newDomain, setNewDomain] = useState("");
  const { data, loading, error, reload } = useAsync(
    demo || !canManage ? () => Promise.resolve(null) : getSettings,
  );

  const settings = data ?? null;

  const persist = async (patch, ok) => {
    try {
      await updateSettings(patch);
      await reload();
      toast(ok);
    } catch (err) {
      toast(err?.message ?? t("Could not save the change.", "تعذّر حفظ التغيير."));
      await reload();
    }
  };

  const domainOk = settings
    ? /^[a-z0-9.-]+\.[a-z]{2,}$/.test(newDomain.trim()) && !settings.emailDomains.includes(newDomain.trim().toLowerCase())
    : false;

  const addDomain = () => {
    if (!domainOk || !settings) return;
    const next = [...settings.emailDomains, newDomain.trim().toLowerCase()];
    setNewDomain("");
    persist({ emailDomains: next }, t("Domain added — saved and audit-logged.", "أُضيف النطاق — حُفظ وسُجل في التدقيق."));
  };

  const removeDomain = (domain) => {
    if (!settings) return;
    if (settings.emailDomains.length <= 1) {
      toast(t("The institution keeps at least one approved domain.", "تبقى المؤسسة على نطاق معتمد واحد على الأقل."));
      return;
    }
    persist(
      { emailDomains: settings.emailDomains.filter((d) => d !== domain) },
      t("Domain removed — saved and audit-logged.", "أُزيل النطاق — حُفظ وسُجل في التدقيق."),
    );
  };

  const toggleFlag = (field, enabled, onText, offText) =>
    persist({ [field]: enabled }, enabled ? onText : offText);

  const toggleSourceType = (id) => {
    if (!settings) return;
    const current = settings.settings?.allowedSupplementalSourceTypes ?? [];
    const next = current.includes(id) ? current.filter((s) => s !== id) : [...current, id];
    persist(
      { allowedSupplementalSourceTypes: next },
      t("Source policy updated — applies to new course materials instantly.", "حُدّثت سياسة المصادر — تسري على المواد الجديدة فورًا."),
    );
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
          {t("Institution settings", "إعدادات المؤسسة")}
        </h1>
        <p style={{ fontFamily: bFont, fontSize: 13, color: tokens.textMuted, margin: 0 }}>
          {t(
            "Four levers only — registration, self-onboarding, course creation, and AI source policy. Each saves on the spot.",
            "أربع رافعات فقط — التسجيل والانضمام الذاتي وإنشاء المقررات وسياسة مصادر الذكاء الاصطناعي. كل تعديل يُحفظ في الحال.",
          )}
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <AlertStrip
          tokens={tokens}
          lang={lang}
          tone="peri"
          icon={<IconGear size={14} color={tokens.primary} />}
          title={t(
            "No save buttons anywhere: every change persists immediately, is audit-logged, and takes effect for the next login or upload.",
            "لا أزرار حفظ في أي مكان: كل تغيير يُخزّن فورًا ويسجل في التدقيق ويسري مع أول دخول أو رفع تالٍ.",
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
        label={t("Loading settings…", "جاري تحميل الإعدادات…")}
      >
        {!canManage ? (
          <AlertStrip
            tokens={tokens}
            lang={lang}
            tone="violet"
            icon={<IconShield size={14} color={tokens.gap} />}
            title={t("This page needs the settings.manage scope", "هذه الصفحة تحتاج نطاق settings.manage")}
            body={t("Ask your super admin to grant you the scope, or return to the health dashboard.", "اطلب من السوبر أدمن منحك النطاق، أو عُد إلى لوحة الصحة.")}
          />
        ) : settings ? (
          <>
            <div style={{ marginBottom: 18 }}>
              <SectionHeading title={t("Institution identity", "هوية المؤسسة")} tokens={tokens} hFont={hFont} bFont={bFont} isRtl={isRtl} />
              <Card tokens={tokens} style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontFamily: bFont, fontWeight: 600, fontSize: 14, color: tokens.textPrimary }}>{settings.name}</div>
                    {settings.country ? (
                      <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted, marginTop: 3 }}>{settings.country}</div>
                    ) : null}
                  </div>
                  <Chip tokens={tokens} tone={settings.contractEndsAt && new Date(settings.contractEndsAt) > new Date() ? "primary" : "violet"}>
                    {settings.contractEndsAt && new Date(settings.contractEndsAt) > new Date() ? t("Subscription active", "الاشتراك فعال") : t("Subscription suspended", "الاشتراك موقوف")}
                  </Chip>
                  {settings.contractEndsAt && (
                    <Chip tokens={tokens} tone="slate">
                      {t("Contract until", "التعاقد حتى")} {new Date(settings.contractEndsAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB")}
                    </Chip>
                  )}
                  <span style={{ display: "inline-flex", gap: 5, alignItems: "center", fontFamily: MONO, fontSize: 10.5, color: tokens.textFaint }}>
                    <IconShield size={11} color={tokens.textFaint} />
                    {t("managed by the platform team", "تديره المنصة")}
                  </span>
                </div>
              </Card>
            </div>

            <div style={{ marginBottom: 18 }}>
              <SectionHeading
                title={t("Approved email domains", "النطاقات المعتمدة للتسجيل")}
                subtitle={t("Only emails ending in these can self-register or accept invitations; they also feed the account-linking detector.", "الإيميلات المنتهية بها فقط تسجل ذاتيًا أو تقبل الدعوات — وهي أيضًا ما يغذي كاشف الربط.")}
                tokens={tokens}
                hFont={hFont}
                bFont={bFont}
                isRtl={isRtl}
              />
              <Card tokens={tokens} style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, flexDirection: isRtl ? "row-reverse" : "row" }}>
                  {settings.emailDomains.map((domain) => (
                    <span key={domain} style={{ display: "inline-flex", gap: 7, alignItems: "center", fontFamily: MONO, fontSize: 11.5, color: tokens.textPrimary, background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 7, padding: "5px 10px", direction: "ltr" }}>
                      @{domain}
                      <button type="button" onClick={() => removeDomain(domain)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "inline-flex" }} aria-label={`remove ${domain}`}>
                        <IconX size={12} color={tokens.textSecondary} />
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <input
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addDomain();
                    }}
                    style={{ ...inputStyle(tokens, bFont), flex: 1, direction: "ltr", textAlign: "left" }}
                    placeholder="faculty.menoufia.edu.eg"
                  />
                  <Btn tokens={tokens} lang={lang} variant="soft" disabled={!domainOk} style={{ padding: "9px 14px", fontSize: 12.5, flexShrink: 0 }} onClick={addDomain}>
                    <IconPlus size={13} color={tokens.primary} />
                    {t("Add domain", "إضافة النطاق")}
                  </Btn>
                </div>
                <div style={{ fontFamily: bFont, fontSize: 11, color: tokens.textFaint, marginTop: 8 }}>
                  {t("Lowercased automatically; sub-domains of a removed domain stop registering immediately.", "يُحفظ بأحرف صغيرة تلقائيًا — النطاقات الفرعية لنطاق محذوف تتوقف عن التسجيل فورًا.")}
                </div>
              </Card>
            </div>

            <div style={{ marginBottom: 18 }}>
              <SectionHeading title={t("Self-onboarding", "الانضمام الذاتي")} tokens={tokens} hFont={hFont} bFont={bFont} isRtl={isRtl} />
              <Card tokens={tokens} style={{ padding: "13px 16px" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: bFont, fontWeight: 600, fontSize: 13, color: tokens.textPrimary }}>
                      {t("Allow self-registration", "السماح بالتسجيل الذاتي")}
                    </div>
                    <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted, marginTop: 3, lineHeight: 1.6 }}>
                      {t(
                        "On: invitations activate themselves the moment the person signs up. Off: only sync or admin-created accounts can enter.",
                        "مفعّل: الدعوات تتفعل من نفسها فور تسجيل الشخص. متوقف: لا يدخل إلا حساب مزامن أو منشأ من الإدارة.",
                      )}
                    </div>
                  </div>
                  <Toggle
                    tokens={tokens}
                    on={Boolean(settings.settings?.allowSelfRegistration)}
                    onChange={() =>
                      toggleFlag(
                        "allowSelfRegistration",
                        !settings.settings?.allowSelfRegistration,
                        t("Self-registration resumed — saved and audit-logged.", "عاد التسجيل الذاتي — حُفظ وسُجل في التدقيق."),
                        t("Self-registration paused — saved and audit-logged.", "توقف التسجيل الذاتي — حُفظ وسُجل في التدقيق."),
                      )
                    }
                  />
                </div>
              </Card>
            </div>

            <div style={{ marginBottom: 18 }}>
              <SectionHeading
                title={t("Course creation", "إنشاء المقررات")}
                subtitle={t("Separate from the source policy below: this controls whether a doctor may start a course shell at all — not what he uploads inside one.", "منفصلة عن سياسة المصادر بالأسفل: هذه تتحكم في إنشاء هيكل المقرر نفسه — لا في ما يُرفع داخله.")}
                tokens={tokens}
                hFont={hFont}
                bFont={bFont}
                isRtl={isRtl}
              />
              <Card tokens={tokens} style={{ padding: "13px 16px" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: bFont, fontWeight: 600, fontSize: 13, color: tokens.textPrimary }}>
                      {t("Allow doctors to create courses", "السماح للدكاترة بإنشاء مقررات")}
                    </div>
                    <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted, marginTop: 3, lineHeight: 1.6 }}>
                      {t(
                        "On: a doctor sees «New course» inside his own department and provisions it himself. Off: courses arrive only from institutional setup or bulk import — the button disappears and existing courses are untouched.",
                        "مفعّل: يرى الدكتور زر «مقرر جديد» داخل قسمه ويجهزه بنفسه. متوقف: المقررات تأتي فقط من الإعداد المؤسسي أو الإدخال الجماعي — يختفي الزر وتبقى المقررات القائمة كما هي.",
                      )}
                    </div>
                  </div>
                  <Toggle
                    tokens={tokens}
                    on={Boolean(settings.settings?.allowDoctorCourseCreation)}
                    onChange={() =>
                      toggleFlag(
                        "allowDoctorCourseCreation",
                        !settings.settings?.allowDoctorCourseCreation,
                        t("Doctors may create courses again — saved and audit-logged.", "عاد إنشاء المقررات للدكاترة — حُفظ وسُجل في التدقيق."),
                        t("Doctor course creation blocked — saved and audit-logged.", "أُوقف إنشاء المقررات للدكاترة — حُفظ وسُجل في التدقيق."),
                      )
                    }
                  />
                </div>
              </Card>
            </div>

            <div>
              <SectionHeading
                title={t("Allowed supplemental source types", "أنواع المصادر التكميلية المسموحة")}
                subtitle={t("What doctors may upload to ground the AI — blocked types are rejected at upload time with a clear reason.", "ما يسمح للدكاترة برفعه لتغذية الذكاء الاصطناعي — الأنواع المحظورة تُرفض وقت الرفع بسبب واضح.")}
                tokens={tokens}
                hFont={hFont}
                bFont={bFont}
                isRtl={isRtl}
              />
              <Card tokens={tokens} style={{ padding: "4px 16px" }}>
                {(settings.materialSourceTypes ?? []).map((id, index, arr) => {
                  const on = (settings.settings?.allowedSupplementalSourceTypes ?? []).includes(id);
                  const label = SOURCE_TYPE_LABELS[id] ?? { en: id, ar: id };
                  return (
                    <div key={id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 0", borderBottom: index === arr.length - 1 ? "none" : `1px solid ${tokens.cardBorder}`, flexDirection: isRtl ? "row-reverse" : "row" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
                          <span style={{ fontFamily: bFont, fontWeight: 600, fontSize: 13, color: tokens.textPrimary }}>
                            {lang === "ar" ? label.ar : label.en}
                          </span>
                          <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.textFaint }}>{id}</span>
                          {on && (
                            <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                              <IconCheck size={11} color={tokens.primary} />
                              <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.primary }}>{t("allowed", "مسموح")}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <Toggle tokens={tokens} on={on} onChange={() => toggleSourceType(id)} />
                    </div>
                  );
                })}
                {(settings.materialSourceTypes ?? []).length === 0 && (
                  <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textFaint, padding: "12px 0" }}>
                    {t("No material source types are configured on the platform.", "لا توجد أنواع مصادر مادة مضبوطة على المنصة.")}
                  </div>
                )}
              </Card>
            </div>
          </>
        ) : null}
      </AsyncGate>
    </div>
  );
}
