import { useCallback, useMemo, useState } from "react";
import useAsync from "@/hooks/useAsync";
import { tk, bodyFont } from "@/constants/tokens";
import { AsyncGate } from "@/components/ui";
import { AlertStrip, Card, Chip, inputStyle, bFontFor, hFontFor } from "@/components/ModuleUI";
import { IconHistory, IconShield, IconFilter } from "@/components/Icons";
import { listAuditEvents } from "@/services/admin";
import { demoMode } from "@/services/auth";
import { useAdmin } from "@/store/admin-context";
import { AUDIT_TYPE_LABELS, PERMISSION_LABELS } from "@/constants/admin";

const MONO = "'JetBrains Mono', monospace";

const startOfDay = (ms) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const dayDiff = (iso) => Math.floor((startOfDay(Date.now()) - startOfDay(new Date(iso).getTime())) / 864e5);

const inRange = (iso, range) => {
  const d = dayDiff(iso);
  switch (range) {
    case "today": return d === 0;
    case "yesterday": return d === 1;
    case "7d": return d <= 7;
    case "30d": return d <= 30;
    case "90d": return d <= 90;
    default: return true;
  }
};

const RANGES = [
  { id: "all", en: "All time", ar: "كل الفترات", period: null },
  { id: "today", en: "Today", ar: "اليوم", period: "7d" },
  { id: "yesterday", en: "Yesterday", ar: "أمس", period: "7d" },
  { id: "7d", en: "Last 7 days", ar: "آخر ٧ أيام", period: "7d" },
  { id: "30d", en: "Last 30 days", ar: "آخر ٣٠ يومًا", period: "30d" },
  { id: "90d", en: "Last 90 days", ar: "آخر ٩٠ يومًا", period: "90d" },
];

export default function AdminAuditPage({ state }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const admin = useAdmin();
  const canSee = admin.hasScope("audit.view");
  const demo = demoMode();

  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("all");
  const [range, setRange] = useState("all");

  const period = RANGES.find((r) => r.id === range)?.period ?? null;
  const fetchEvents = useCallback(() => {
    if (demo || !canSee) return Promise.resolve({ items: [], scopes: [] });
    return listAuditEvents({ ...(period ? { period } : {}), page: 1, limit: 100 });
  }, [demo, canSee, period]);

  const { data, loading, error, reload } = useAsync(fetchEvents);
  const events = useMemo(() => data?.items ?? [], [data?.items]);

  const scopesPresent = useMemo(() => {
    const keys = new Set();
    for (const ev of events) keys.add(ev.scope);
    return [...keys];
  }, [events]);

  const relTime = (iso) => {
    const d = dayDiff(iso);
    if (d <= 0) return t("today", "اليوم");
    if (d === 1) return t("yesterday", "أمس");
    return t(`${d}d ago`, `منذ ${d} يوم`);
  };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((ev) => {
      if (scope !== "all" && ev.scope !== scope) return false;
      if (!inRange(ev.at, range)) return false;
      if (!q) return true;
      const haystack = [
        ev.summary?.en ?? "",
        ev.summary?.ar ?? "",
        ev.detail?.en ?? "",
        ev.detail?.ar ?? "",
        ev.actorName ?? "",
      ].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [events, query, scope, range]);

  const selectLabel = (text) => (
    <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.09em", color: tokens.textFaint, marginBottom: 4 }}>{text}</div>
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
          {t("Institution audit log", "سجل تدقيق المؤسسة")}
        </h1>
        <p style={{ fontFamily: bFont, fontSize: 13, color: tokens.textMuted, margin: 0 }}>
          {t("Who did what, inside which scope, carrying which proof — permanently.", "مين عمل إيه، داخل أي نطاق، وبأي مرجع إثبات — بشكل دائم.")}
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <AlertStrip
          tokens={tokens}
          lang={lang}
          tone="peri"
          icon={<IconShield size={14} color={tokens.primary} />}
          title={admin.isSuperAdmin
            ? t(
                "You are the super admin, so this log shows every scope. An officer opening the same screen sees only the events his own permissions cover — nobody audits outside his territory.",
                "أنتِ السوبر أدمن لذلك يعرض السجل كل النطاقات. المسؤول عند فتح نفس الشاشة يرى فقط الأحداث التي تغطيها صلاحياته — لا أحد يدقق خارج حدوده.",
              )
            : t(
                "This log shows only events inside your own permission scope — the super admin alone sees everything.",
                "يعرض هذا السجل الأحداث داخل نطاق صلاحياتك فقط — السوبر أدمن وحده يرى كل شيء.",
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
        label={t("Loading audit events…", "جاري تحميل أحداث التدقيق…")}
      >
        {!canSee ? (
          <AlertStrip
            tokens={tokens}
            lang={lang}
            tone="violet"
            icon={<IconShield size={14} color={tokens.gap} />}
            title={t("This page needs the audit.view scope", "هذه الصفحة تحتاج نطاق audit.view")}
            body={t("Ask your super admin to grant you the scope, or return to the health dashboard.", "اطلب من السوبر أدمن منحك النطاق، أو عُد إلى لوحة الصحة.")}
          />
        ) : (
          <>
            <Card tokens={tokens} style={{ padding: "12px 14px", marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                <span style={{ alignSelf: "center", flexShrink: 0, paddingBottom: 4 }}>
                  <IconFilter size={14} color={tokens.textSecondary} />
                </span>
                <div style={{ flex: "2 1 220px", minWidth: 180 }}>
                  {selectLabel(t("SEARCH", "بحث"))}
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ ...inputStyle(tokens, bFont) }}
                    placeholder={t("Search the summary, the actor, or a proof reference…", "ابحث في الملخص أو الفاعل أو مرجع إثبات…")}
                  />
                </div>
                <div style={{ flex: "1 1 170px", minWidth: 150 }}>
                  {selectLabel(t("SCOPE", "النطاق"))}
                  <select value={scope} onChange={(e) => setScope(e.target.value)} style={{ ...inputStyle(tokens, bFont), cursor: "pointer" }}>
                    <option value="all">{t("All scopes", "كل النطاقات")}</option>
                    {scopesPresent.map((key) => (
                      <option key={key} value={key}>
                        {(PERMISSION_LABELS[key] ?? { en: key, ar: key })[lang === "ar" ? "ar" : "en"]}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: "1 1 140px", minWidth: 125 }}>
                  {selectLabel(t("PERIOD", "الفترة"))}
                  <select value={range} onChange={(e) => setRange(e.target.value)} style={{ ...inputStyle(tokens, bFont), cursor: "pointer" }}>
                    {RANGES.map((r) => (
                      <option key={r.id} value={r.id}>{lang === "ar" ? r.ar : r.en}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexDirection: isRtl ? "row-reverse" : "row" }}>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: tokens.textFaint }}>
                {t(`showing ${shown.length} of ${events.length} events`, `يُعرض ${shown.length} من أصل ${events.length} حدث`)}
              </span>
              {(query || scope !== "all" || range !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setScope("all");
                    setRange("all");
                  }}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: bFont, fontSize: 11, color: tokens.primary }}
                >
                  {t("Clear filters", "مسح الفلاتر")}
                </button>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {shown.map((ev) => (
                <Card tokens={tokens} key={ev.id} style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                    <span style={{ flexShrink: 0, marginTop: 2 }}>
                      <IconHistory size={14} color={tokens.textFaint} />
                    </span>
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                        <Chip tokens={tokens}>
                          {(AUDIT_TYPE_LABELS[ev.type] ?? { en: ev.type, ar: ev.type })[lang === "ar" ? "ar" : "en"]}
                        </Chip>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.textSecondary, background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 5, padding: "2px 7px" }}>
                          {(PERMISSION_LABELS[ev.scope] ?? { en: ev.scope, ar: ev.scope })[lang === "ar" ? "ar" : "en"]}
                        </span>
                      </div>
                      <div style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textPrimary, marginTop: 6, lineHeight: 1.65 }}>
                        {lang === "ar" ? ev.summary?.ar : ev.summary?.en}
                      </div>
                      {ev.detail?.en && (
                        <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted, marginTop: 4, lineHeight: 1.6 }}>
                          {lang === "ar" ? ev.detail?.ar : ev.detail?.en}
                        </div>
                      )}
                    </div>
                    <div style={{ flexShrink: 0, textAlign: isRtl ? "left" : "right" }}>
                      <div style={{ fontFamily: bFont, fontWeight: 600, fontSize: 11.5, color: tokens.textSecondary }}>{ev.actorName}</div>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: tokens.textFaint, marginTop: 3 }}>{relTime(ev.at)}</div>
                    </div>
                  </div>
                </Card>
              ))}
              {shown.length === 0 && (
                <Card tokens={tokens} style={{ padding: "26px 18px", textAlign: "center" }}>
                  <div style={{ fontFamily: bFont, fontSize: 13, color: tokens.textMuted }}>
                    {t("No events match this search and filter combination.", "لا أحداث تطابق هذا البحث ومجموعة الفلاتر.")}
                  </div>
                </Card>
              )}
            </div>

            <p style={{ fontFamily: bFont, fontSize: 11, color: tokens.textFaint, marginTop: 16, lineHeight: 1.6 }}>
              {t(
                "Events keep their proof references forever — request decisions cite the attachment names, imports cite the file names.",
                "الأحداث تحتفظ بمراجع إثباتها دائمًا — قرارات الطلبات تذكر أسماء المرفقات والإدخالات تذكر أسماء الملفات.",
              )}
            </p>
          </>
        )}
      </AsyncGate>
    </div>
  );
}
