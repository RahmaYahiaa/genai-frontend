import { useEffect, useState } from "react";
import { tk, headingFont } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { ADMIN_SERVICES, serviceAllowed } from "@/constants/adminSite";
import { useAdmin } from "@/store/admin-context";
import useMediaQuery from "@/hooks/useMediaQuery";
import { getInstitutionHealth, getAnalytics } from "@/services/admin";
import { demoMode } from "@/services/auth";
import { useInstitution, ServiceIcon, siteContainer } from "@/components/admin/AdminSite";
import { IconArrowRight, IconArrowLeft, IconCheck, IconPencil, IconGlobe, IconClock } from "@/components/Icons";

/**
 * Institution home page: who the institution is (from its profile), what is
 * waiting for the admin today (live), and every service explained simply.
 */
export default function AdminHomePage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const t = (en, ar) => (isRtl ? ar : en);
  const hFont = headingFont(lang);
  const mobile = useMediaQuery("(max-width: 760px)");
  const admin = useAdmin();
  const { profile, loading: profileLoading } = useInstitution();
  const [health, setHealth] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const Arrow = isRtl ? IconArrowLeft : IconArrowRight;
  const services = ADMIN_SERVICES.filter((s) => serviceAllowed(s, admin));
  const can = (screen) => services.some((s) => s.id === screen);
  const canAnalytics = admin.hasScope("analytics.view");

  useEffect(() => {
    if (demoMode()) return undefined;
    let alive = true;
    getInstitutionHealth().then((d) => alive && setHealth(d)).catch(() => null);
    if (canAnalytics) getAnalytics().then((d) => alive && setAnalytics(d)).catch(() => null);
    return () => {
      alive = false;
    };
  }, [canAnalytics]);

  const go = (screen) => {
    dispatch({ type: "NAVIGATE", screen });
    window.scrollTo({ top: 0 });
  };

  // ---- numbers -------------------------------------------------------
  const sum = (key) => (analytics?.faculties ?? []).reduce((n, f) => n + (f[key] ?? 0), 0);
  const stats = [
    { label: t("Students", "طالب"), value: analytics ? sum("students") : null },
    { label: t("Lecturers", "محاضر"), value: analytics ? sum("doctors") : null },
    { label: t("Courses", "مقرر"), value: health?.courses?.total ?? (analytics ? sum("courses") : null) },
    { label: t("Faculties", "كلية"), value: profile?.faculties?.length || null },
  ].filter((s) => s.value !== null && s.value !== undefined);

  // ---- waiting for you -------------------------------------------------
  const todo = health
    ? [
        can(SCREENS.ADMIN_REQUESTS) && health.pendingRequests > 0 && { n: health.pendingRequests, text: t("requests to join a course", "طلبات انضمام لمقرر"), screen: SCREENS.ADMIN_REQUESTS },
        can(SCREENS.ADMIN_IMPORT) && health.invitations?.pending > 0 && { n: health.invitations.pending, text: t("invitations not accepted yet", "دعوات لسه متقبلتش"), screen: SCREENS.ADMIN_IMPORT },
        health.courses?.withoutMaterials > 0 && { n: health.courses.withoutMaterials, text: t("courses with no files yet", "مقررات لسه مفيهاش ملفات"), screen: SCREENS.ADMIN_COURSES },
        can(SCREENS.ADMIN_LINK) && health.awaitingLinkConsents > 0 && { n: health.awaitingLinkConsents, text: t("students deciding on linking", "طلاب لسه بيقرروا في الربط"), screen: SCREENS.ADMIN_LINK },
      ].filter(Boolean)
    : null;

  const facts = profile
    ? [
        profile.foundedYear && { k: t("Founded", "سنة التأسيس"), v: String(profile.foundedYear) },
        profile.city && { k: t("Location", "المكان"), v: profile.city },
        profile.website && { k: t("Website", "الموقع"), v: profile.website.replace(/^https?:\/\//, ""), href: profile.website, ltr: true },
        profile.contactEmail && { k: t("Contact", "التواصل"), v: profile.contactEmail, href: `mailto:${profile.contactEmail}`, ltr: true },
      ].filter(Boolean)
    : [];

  const canEdit = can(SCREENS.ADMIN_PROFILE);
  const sectionTitle = (eyebrow, title, sub) => (
    <div style={{ marginBottom: 22, maxWidth: 680 }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: tokens.primary, marginBottom: 8 }}>{eyebrow}</div>
      <h2 style={{ margin: 0, fontFamily: hFont, fontWeight: 750, fontSize: mobile ? 23 : 28, letterSpacing: "-0.02em", color: tokens.textPrimary }}>{title}</h2>
      {sub && <p style={{ margin: "8px 0 0", fontSize: 15, color: tokens.textMuted, lineHeight: 1.6 }}>{sub}</p>}
    </div>
  );
  const card = { background: tokens.card, border: `1px solid ${tokens.cardBorder}`, borderRadius: 16 };
  const pill = (text) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 12.5, fontWeight: 600 }}>{text}</span>
  );

  return (
    <div>
      {/* ---------------- Hero ---------------- */}
      <section style={{ position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #0E2A66 0%, #1B4DA8 55%, #2463C7 100%)", color: "#fff" }}>
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        <div aria-hidden="true" style={{ position: "absolute", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(125,155,246,0.35), transparent 65%)", top: -180, insetInlineEnd: -120 }} />
        <div style={{ ...siteContainer, position: "relative", padding: mobile ? "44px 20px 92px" : "68px 24px 118px", display: "grid", gridTemplateColumns: mobile ? "1fr" : "minmax(0,1.35fr) minmax(300px,1fr)", gap: 40, alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {profile?.foundedYear && pill(t(`Since ${profile.foundedYear}`, `منذ ${profile.foundedYear}`))}
              {profile?.city && pill(profile.city)}
            </div>
            <h1 style={{ margin: 0, fontFamily: hFont, fontWeight: 800, fontSize: mobile ? 34 : 50, lineHeight: 1.08, letterSpacing: "-0.03em" }}>
              {profileLoading ? "\u00a0" : profile?.name}
            </h1>
            <p style={{ margin: "18px 0 0", fontSize: mobile ? 16 : 19, lineHeight: 1.6, color: "rgba(255,255,255,0.84)", maxWidth: 560 }}>
              {profile?.tagline || t("Your institution's home for teaching, learning and follow-up.", "بيت مؤسستك للتدريس والتعلّم والمتابعة.")}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 28 }}>
              {can(SCREENS.ADMIN_IMPORT) && (
                <button type="button" onClick={() => go(SCREENS.ADMIN_IMPORT)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 20px", borderRadius: 11, border: "none", background: "#fff", color: "#1B4DA8", fontWeight: 700, fontSize: 14.5, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 10px 24px rgba(5,17,48,0.25)" }}>
                  {t("Invite students and staff", "ادعُ الطلاب والمحاضرين")} <Arrow size={14} />
                </button>
              )}
              <button type="button" onClick={() => go(SCREENS.ADMIN_COURSES)} style={{ padding: "13px 20px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.08)", color: "#fff", fontWeight: 650, fontSize: 14.5, cursor: "pointer", fontFamily: "inherit" }}>
                {t("Manage courses", "إدارة المقررات")}
              </button>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 18, padding: 20, backdropFilter: "blur(8px)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontFamily: hFont, fontWeight: 700, fontSize: 16 }}>{t("Waiting for you", "مستنياك")}</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{t("Today", "النهارده")}</span>
            </div>
            {todo === null ? (
              <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.75)", padding: "10px 0" }}>{t("Checking…", "بنشوف…")}</div>
            ) : todo.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 4px" }}>
                <span style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(143,224,181,0.2)", color: "#8FE0B5", display: "grid", placeItems: "center" }}><IconCheck size={16} /></span>
                <span style={{ fontSize: 14, lineHeight: 1.5 }}>{t("All clear. Nothing needs you right now.", "كله تمام. مفيش حاجة محتاجاك دلوقتي.")}</span>
              </div>
            ) : (
              todo.map((item) => (
                <button key={item.screen + item.text} type="button" onClick={() => go(item.screen)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 10px", marginBottom: 6, borderRadius: 11, border: "none", background: "rgba(255,255,255,0.08)", color: "#fff", cursor: "pointer", fontFamily: "inherit", textAlign: "start" }}>
                  <span style={{ minWidth: 34, height: 34, padding: "0 8px", borderRadius: 10, background: "#fff", color: "#1B4DA8", fontWeight: 800, fontSize: 15, display: "grid", placeItems: "center" }}>{item.n}</span>
                  <span style={{ flex: 1, fontSize: 14 }}>{item.text}</span>
                  <Arrow size={13} />
                </button>
              ))
            )}
            {health?.contract && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.16)", fontSize: 12.5, color: "rgba(255,255,255,0.78)" }}>
                <IconClock size={13} />
                {health.contract.expired
                  ? t("Your Lerna subscription has ended.", "اشتراك Lerna انتهى.")
                  : health.contract.daysRemaining != null
                    ? t(`Lerna subscription: ${health.contract.daysRemaining} days left`, `اشتراك Lerna: باقي ${health.contract.daysRemaining} يوم`)
                    : t("Lerna subscription active", "اشتراك Lerna شغال")}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------------- Numbers (overlapping the hero) ---------------- */}
      {stats.length > 0 && (
        <div style={{ ...siteContainer, marginTop: mobile ? -58 : -64, position: "relative" }}>
          <div style={{ ...card, display: "grid", gridTemplateColumns: `repeat(${mobile ? 2 : stats.length}, 1fr)`, boxShadow: "0 14px 34px rgba(13,26,46,0.10)", overflow: "hidden" }}>
            {stats.map((s, i) => (
              <div key={s.label} style={{ padding: mobile ? "18px 16px" : "22px 26px", borderInlineStart: i % (mobile ? 2 : stats.length) === 0 ? "none" : `1px solid ${tokens.cardBorder}`, borderTop: mobile && i >= 2 ? `1px solid ${tokens.cardBorder}` : "none" }}>
                <div style={{ fontFamily: hFont, fontWeight: 800, fontSize: mobile ? 26 : 32, color: tokens.primary, letterSpacing: "-0.02em" }}>{s.value.toLocaleString(isRtl ? "ar-EG" : "en-US")}</div>
                <div style={{ fontSize: 13.5, color: tokens.textMuted, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- About ---------------- */}
      <section style={{ ...siteContainer, paddingTop: 64 }}>
        {profile && !profile.about && canEdit ? (
          <div style={{ ...card, padding: 28, display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ width: 48, height: 48, borderRadius: 14, background: tokens.primaryLight, color: tokens.primary, display: "grid", placeItems: "center" }}><IconGlobe size={20} /></span>
            <div style={{ flex: "1 1 280px" }}>
              <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: 18 }}>{t("Tell people about your institution", "عرّف الناس بمؤسستك")}</div>
              <div style={{ fontSize: 14, color: tokens.textMuted, marginTop: 4 }}>{t("Add a short description, your faculties and how to reach you. It takes two minutes.", "ضيف وصف قصير والكليات وطرق التواصل. مش هتاخد غير دقيقتين.")}</div>
            </div>
            <button type="button" onClick={() => go(SCREENS.ADMIN_PROFILE)} style={{ padding: "11px 18px", borderRadius: 10, border: "none", background: tokens.primaryBtn, color: "#fff", fontWeight: 650, cursor: "pointer", fontFamily: "inherit" }}>{t("Add details", "ضيف البيانات")}</button>
          </div>
        ) : profile?.about ? (
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "minmax(0,1.4fr) minmax(0,1fr)", gap: 32, alignItems: "start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
                {sectionTitle(t("About us", "مين إحنا"), t(`About ${profile.shortName || profile.name}`, `عن ${profile.shortName || profile.name}`))}
                {canEdit && (
                  <button type="button" onClick={() => go(SCREENS.ADMIN_PROFILE)} title={t("Edit", "تعديل")} aria-label={t("Edit institution profile", "تعديل بيانات المؤسسة")}
                    style={{ marginBottom: 24, width: 36, height: 36, borderRadius: 10, border: `1px solid ${tokens.cardBorder}`, background: tokens.card, color: tokens.textMuted, display: "grid", placeItems: "center", cursor: "pointer" }}>
                    <IconPencil size={14} />
                  </button>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.85, color: tokens.textSecondary, whiteSpace: "pre-line" }}>{profile.about}</p>
              {facts.length > 0 && (
                <dl style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : `repeat(${Math.min(facts.length, 4)}, minmax(0,1fr))`, gap: 12, margin: "26px 0 0" }}>
                  {facts.map((f) => (
                    <div key={f.k} style={{ ...card, borderRadius: 12, padding: "12px 14px", minWidth: 0 }}>
                      <dt style={{ fontSize: 11.5, color: tokens.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>{f.k}</dt>
                      <dd dir={f.ltr ? "ltr" : undefined} style={{ margin: "5px 0 0", fontSize: 14, fontWeight: 650, color: tokens.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: isRtl ? "right" : "left" }}>
                        {f.href ? <a href={f.href} target="_blank" rel="noreferrer" style={{ color: tokens.primary, textDecoration: "none" }}>{f.v}</a> : f.v}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
            <div style={{ display: "grid", gap: 14 }}>
              {[
                profile.mission && { title: t("Our mission", "رسالتنا"), text: profile.mission, n: "01" },
                profile.vision && { title: t("Our vision", "رؤيتنا"), text: profile.vision, n: "02" },
              ].filter(Boolean).map((b) => (
                <div key={b.n} style={{ ...card, padding: 22, position: "relative", overflow: "hidden" }}>
                  <span aria-hidden="true" style={{ position: "absolute", insetInlineEnd: 16, top: 8, fontFamily: hFont, fontWeight: 800, fontSize: 44, color: tokens.primaryLight }}>{b.n}</span>
                  <div style={{ position: "relative", fontFamily: hFont, fontWeight: 700, fontSize: 16.5, color: tokens.textPrimary, marginBottom: 8 }}>{b.title}</div>
                  <p style={{ position: "relative", margin: 0, fontSize: 14.5, lineHeight: 1.7, color: tokens.textMuted }}>{b.text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* ---------------- Faculties ---------------- */}
      {profile?.faculties?.length > 0 && (
        <section style={{ ...siteContainer, paddingTop: 64 }}>
          {sectionTitle(t("Faculties", "الكليات"), t("Our faculties", "كلياتنا"), t("Every faculty uses the same platform, each with its own courses and lecturers.", "كل الكليات بتستخدم نفس المنصة، ولكل كلية مقرراتها ومحاضرينها."))}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 14 }}>
            {profile.faculties.map((f, i) => (
              <div key={f.name + i} style={{ ...card, padding: 20, display: "flex", gap: 14 }}>
                <span style={{ fontFamily: hFont, fontWeight: 800, fontSize: 14, color: tokens.primary, background: tokens.primaryLight, borderRadius: 10, minWidth: 38, height: 38, display: "grid", placeItems: "center" }}>{String(i + 1).padStart(2, "0")}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: tokens.textPrimary, lineHeight: 1.35 }}>{f.name}</div>
                  {f.description && <div style={{ fontSize: 13.5, color: tokens.textMuted, lineHeight: 1.55, marginTop: 5 }}>{f.description}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- Services ---------------- */}
      <section style={{ ...siteContainer, paddingTop: 64 }}>
        {sectionTitle(t("Services", "الخدمات"), t("What you can do here", "تقدر تعمل إيه هنا"), t("Each service does one job. Open it and follow the short steps at the top of the page.", "كل خدمة ليها شغلانة واحدة. افتحها واتبع الخطوات القصيرة اللي فوق الصفحة."))}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 14 }}>
          {services.filter((s) => s.id !== SCREENS.ADMIN_STATUS).map((s) => (
            <button key={s.id} type="button" onClick={() => go(s.id)}
              style={{ ...card, padding: 22, textAlign: "start", cursor: "pointer", fontFamily: "inherit", color: tokens.textPrimary, display: "flex", flexDirection: "column", gap: 10, transition: "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 28px rgba(13,26,46,0.09)"; e.currentTarget.style.borderColor = tokens.primary; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = tokens.cardBorder; }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: tokens.primaryLight, color: tokens.primary, display: "grid", placeItems: "center" }}><ServiceIcon name={s.icon} size={19} /></span>
              <span style={{ fontFamily: hFont, fontWeight: 700, fontSize: 16.5 }}>{s.title[lang] ?? s.title.en}</span>
              <span style={{ fontSize: 14, color: tokens.textMuted, lineHeight: 1.6, flex: 1 }}>{s.short[lang] ?? s.short.en}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 650, color: tokens.primary }}>{t("Open", "افتح")} <Arrow size={12} /></span>
            </button>
          ))}
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section style={{ ...siteContainer, paddingTop: 64 }}>
        <div style={{ ...card, padding: mobile ? 22 : 34, background: state.dark ? tokens.card : "linear-gradient(180deg, #FFFFFF 0%, #F6F9FE 100%)" }}>
          {sectionTitle(t("Getting started", "البداية"), t("Up and running in three steps", "ابدأ في ٣ خطوات"))}
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: mobile ? 18 : 28 }}>
            {[
              { title: t("Add courses and lecturers", "ضيف المقررات والمحاضرين"), text: t("Create each course and choose who teaches it. Lecturers are told by email.", "اعمل كل مقرر واختار مين يدرّسه. المحاضرين بيوصلهم إيميل."), screen: SCREENS.ADMIN_COURSES },
              { title: t("Invite people from a file", "ادعُ الناس من ملف"), text: t("Upload one list. Everyone gets an email with a link, sets a password, and finds their courses ready.", "ارفع قائمة واحدة. كل واحد بيوصله إيميل فيه رابط، يختار كلمة سر، ويلاقي مقرراته جاهزة."), screen: SCREENS.ADMIN_IMPORT },
              { title: t("Follow how it's going", "تابع الدنيا ماشية إزاي"), text: t("See active students and lecturers, and which courses still need material.", "شوف الطلاب والمحاضرين النشطين، والمقررات اللي لسه محتاجة محتوى."), screen: SCREENS.ADMIN_ANALYTICS },
            ].map((step, i) => (
              <li key={i} style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span style={{ width: 36, height: 36, borderRadius: "50%", background: tokens.primary, color: state.dark ? "#0A0E23" : "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontFamily: hFont }}>{i + 1}</span>
                  {!mobile && i < 2 && <span aria-hidden="true" style={{ flex: 1, height: 2, background: `repeating-linear-gradient(90deg, ${tokens.cardBorder} 0 6px, transparent 6px 12px)` }} />}
                </div>
                <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: 16, color: tokens.textPrimary, marginBottom: 6 }}>{step.title}</div>
                <p style={{ margin: 0, fontSize: 14, color: tokens.textMuted, lineHeight: 1.65 }}>{step.text}</p>
                {can(step.screen) && (
                  <button type="button" onClick={() => go(step.screen)} style={{ marginTop: 10, background: "none", border: "none", padding: 0, color: tokens.primary, fontWeight: 650, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    {t("Go", "روح")} <Arrow size={12} />
                  </button>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
