import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { ADMIN_SERVICES, serviceAllowed, serviceById } from "@/constants/adminSite";
import { useAdmin } from "@/store/admin-context";
import useMediaQuery from "@/hooks/useMediaQuery";
import { getInstitutionProfile } from "@/services/admin";
import { signOut, demoMode } from "@/services/auth";
import { Toaster } from "@/components/ModuleUI";
import { DemoGuide } from "@/components/DemoAccess";
import {
  IconBookOpen, IconUsers, IconUpload, IconInbox, IconTrendUp, IconAnchor, IconShield, IconHistory,
  IconGear, IconGlobe, IconBell, IconSun, IconMoon, IconMenu, IconX, IconChevronDown, IconSignOut,
  IconChevronRight, IconChevronLeft, IconLogoBrand,
} from "@/components/Icons";

/* ------------------------------------------------------------------ */
/* Shared institution profile (header, footer, home, profile editor)  */
/* ------------------------------------------------------------------ */

const InstitutionContext = createContext({ profile: null, loading: true, error: null, reload: () => {} });
export const useInstitution = () => useContext(InstitutionContext);

export function ServiceIcon({ name, size = 18, color }) {
  const props = { size, color };
  switch (name) {
    case "courses": return <IconBookOpen {...props} />;
    case "people": return <IconUsers {...props} />;
    case "invite": return <IconUpload {...props} />;
    case "requests": return <IconInbox {...props} />;
    case "reports": return <IconTrendUp {...props} />;
    case "link": return <IconAnchor {...props} />;
    case "team": return <IconShield {...props} />;
    case "history": return <IconHistory {...props} />;
    case "settings": return <IconGear {...props} />;
    case "building": return <IconGlobe {...props} />;
    default: return <IconBell {...props} />;
  }
}

/** Institution mark: initials in a rounded square (no logo upload needed). */
export function InstitutionMark({ profile, size = 40, inverted = false }) {
  const initials = (profile?.shortName || (profile?.name ?? "").split(/\s+/).map((w) => w[0]).join("").slice(0, 3) || "U").toUpperCase();
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        display: "grid",
        placeItems: "center",
        flex: "0 0 auto",
        background: inverted ? "rgba(255,255,255,0.12)" : "linear-gradient(135deg, #1B4DA8 0%, #2F6AD4 100%)",
        border: inverted ? "1px solid rgba(255,255,255,0.22)" : "none",
        color: "#fff",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 800,
        fontSize: size * (initials.length > 2 ? 0.3 : 0.36),
        letterSpacing: "0.02em",
        boxShadow: inverted ? "none" : "0 6px 16px rgba(27,77,168,0.28)",
      }}
    >
      {initials}
    </span>
  );
}

export const siteContainer = { maxWidth: 1200, margin: "0 auto", padding: "0 24px", boxSizing: "border-box", width: "100%" };

/* ------------------------------------------------------------------ */
/* Header                                                             */
/* ------------------------------------------------------------------ */

function useOutsideClose(open, setOpen) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);
  return ref;
}

function SiteHeader({ state, dispatch, services, profile, canEditProfile }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const t = (en, ar) => (isRtl ? ar : en);
  const hFont = headingFont(lang);
  const compact = useMediaQuery("(max-width: 1020px)");
  const [moreOpen, setMoreOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const moreRef = useOutsideClose(moreOpen, setMoreOpen);
  const userRef = useOutsideClose(userOpen, setUserOpen);

  const go = (screen) => {
    setMoreOpen(false);
    setUserOpen(false);
    setMobileOpen(false);
    dispatch({ type: "NAVIGATE", screen });
    window.scrollTo({ top: 0 });
  };
  const main = services.filter((s) => s.main);
  const more = services.filter((s) => !s.main);
  const moreActive = more.some((s) => s.id === state.screen);
  const user = state.user;

  const navLink = (id, label, active) => (
    <button
      key={id}
      type="button"
      onClick={() => go(id)}
      aria-current={active ? "page" : undefined}
      style={{
        position: "relative",
        height: 68,
        padding: "0 12px",
        background: "none",
        border: "none",
        cursor: "pointer",
        color: active ? tokens.primary : tokens.textSecondary,
        fontWeight: active ? 650 : 500,
        fontSize: 14,
        fontFamily: "inherit",
        whiteSpace: "nowrap",
      }}
    >
      {label}
      <span style={{ position: "absolute", insetInline: 12, bottom: 0, height: 2.5, borderRadius: 2, background: active ? tokens.primary : "transparent" }} />
    </button>
  );

  const iconBtn = { width: 36, height: 36, borderRadius: 10, border: `1px solid ${tokens.cardBorder}`, background: tokens.card, color: tokens.textSecondary, display: "grid", placeItems: "center", cursor: "pointer" };

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40, background: state.dark ? "rgba(19,26,56,0.92)" : "rgba(255,255,255,0.94)", backdropFilter: "saturate(1.4) blur(10px)", borderBottom: `1px solid ${tokens.cardBorder}` }}>
      <div style={{ ...siteContainer, display: "flex", alignItems: "center", gap: 18, height: 68 }}>
        <button type="button" onClick={() => go(SCREENS.ADMIN)} style={{ display: "flex", alignItems: "center", gap: 11, background: "none", border: "none", cursor: "pointer", padding: 0, minWidth: 0, textAlign: "start" }}>
          <InstitutionMark profile={profile} size={38} />
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: hFont, fontWeight: 750, fontSize: 15.5, color: tokens.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: compact ? 200 : 260 }}>
              {profile?.name ?? t("Your institution", "مؤسستك")}
            </span>
            <span style={{ display: "block", fontSize: 11.5, color: tokens.textMuted, marginTop: 1, whiteSpace: "nowrap" }}>
              {t("Institution site", "موقع المؤسسة")}
            </span>
          </span>
        </button>

        {!compact && (
          <nav aria-label={t("Main", "الرئيسية")} style={{ display: "flex", alignItems: "center", marginInlineStart: 10, flex: 1, minWidth: 0 }}>
            {navLink(SCREENS.ADMIN, t("Home", "الرئيسية"), state.screen === SCREENS.ADMIN)}
            {main.map((s) => navLink(s.id, s.nav[lang] ?? s.nav.en, state.screen === s.id))}
            {more.length > 0 && (
              <div ref={moreRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setMoreOpen((v) => !v)}
                  aria-expanded={moreOpen}
                  style={{ position: "relative", height: 68, padding: "0 12px", background: "none", border: "none", cursor: "pointer", color: moreActive ? tokens.primary : tokens.textSecondary, fontWeight: moreActive ? 650 : 500, fontSize: 14, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5 }}
                >
                  {t("More", "المزيد")}
                  <span style={{ display: "flex", transform: moreOpen ? "rotate(180deg)" : "none", transition: "transform 150ms" }}><IconChevronDown size={13} /></span>
                  <span style={{ position: "absolute", insetInline: 12, bottom: 0, height: 2.5, borderRadius: 2, background: moreActive ? tokens.primary : "transparent" }} />
                </button>
                {moreOpen && (
                  <div role="menu" style={{ position: "absolute", top: 62, insetInlineStart: -120, width: 560, background: tokens.card, border: `1px solid ${tokens.cardBorder}`, borderRadius: 14, boxShadow: "0 18px 40px rgba(13,26,46,0.16)", padding: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                    {more.map((s) => (
                      <button key={s.id} role="menuitem" type="button" onClick={() => go(s.id)}
                        style={{ display: "flex", gap: 11, alignItems: "flex-start", textAlign: "start", padding: "10px 11px", borderRadius: 10, border: "none", background: state.screen === s.id ? tokens.primaryLight : "transparent", cursor: "pointer", fontFamily: "inherit" }}
                        onMouseEnter={(e) => { if (state.screen !== s.id) e.currentTarget.style.background = tokens.bg; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = state.screen === s.id ? tokens.primaryLight : "transparent"; }}>
                        <span style={{ width: 32, height: 32, borderRadius: 9, background: tokens.primaryLight, color: tokens.primary, display: "grid", placeItems: "center", flex: "0 0 auto" }}><ServiceIcon name={s.icon} size={15} /></span>
                        <span>
                          <span style={{ display: "block", fontSize: 13.5, fontWeight: 650, color: tokens.textPrimary }}>{s.nav[lang] ?? s.nav.en}</span>
                          <span style={{ display: "block", fontSize: 12, color: tokens.textMuted, lineHeight: 1.45, marginTop: 2 }}>{s.short[lang] ?? s.short.en}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </nav>
        )}
        {compact && <span style={{ flex: 1 }} />}

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" style={iconBtn} onClick={() => dispatch({ type: "SET_LANG", lang: lang === "en" ? "ar" : "en" })} aria-label={t("Switch to Arabic", "التحويل للإنجليزية")} title={lang === "en" ? "العربية" : "English"}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{lang === "en" ? "ع" : "En"}</span>
          </button>
          <button type="button" style={iconBtn} onClick={() => dispatch({ type: "TOGGLE_THEME" })} aria-label={t("Change theme", "تغيير المظهر")}>
            {state.dark ? <IconSun size={15} /> : <IconMoon size={15} />}
          </button>
          {!compact && (
            <div ref={userRef} style={{ position: "relative" }}>
              <button type="button" onClick={() => setUserOpen((v) => !v)} aria-expanded={userOpen} aria-label={t("Account", "الحساب")}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 10px 3px 3px", paddingInlineStart: 3, paddingInlineEnd: 10, borderRadius: 999, border: `1px solid ${tokens.cardBorder}`, background: tokens.card, cursor: "pointer", fontFamily: "inherit" }}>
                <span style={{ width: 30, height: 30, borderRadius: "50%", background: tokens.primaryLight, color: tokens.primary, display: "grid", placeItems: "center", fontSize: 11.5, fontWeight: 700 }}>{user?.initials ?? "A"}</span>
                <span style={{ fontSize: 13, color: tokens.textPrimary, fontWeight: 600, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.firstName ?? ""}</span>
                <IconChevronDown size={12} color={tokens.textMuted} />
              </button>
              {userOpen && (
                <div role="menu" style={{ position: "absolute", top: 46, insetInlineEnd: 0, width: 250, background: tokens.card, border: `1px solid ${tokens.cardBorder}`, borderRadius: 12, boxShadow: "0 18px 40px rgba(13,26,46,0.16)", padding: 8 }}>
                  <div style={{ padding: "8px 10px 10px", borderBottom: `1px solid ${tokens.cardBorder}`, marginBottom: 6 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 650, color: tokens.textPrimary }}>{user?.firstName} {user?.lastName}</div>
                    <div dir="ltr" style={{ fontSize: 12, color: tokens.textMuted, marginTop: 2, textAlign: isRtl ? "right" : "left", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</div>
                  </div>
                  {canEditProfile && (
                    <MenuItem tokens={tokens} onClick={() => go(SCREENS.ADMIN_PROFILE)} icon={<IconGlobe size={14} />}>{t("Institution profile", "بيانات المؤسسة")}</MenuItem>
                  )}
                  <MenuItem tokens={tokens} onClick={() => go(SCREENS.ADMIN_STATUS)} icon={<IconBell size={14} />}>{t("Status and alerts", "الحالة والتنبيهات")}</MenuItem>
                  <MenuItem tokens={tokens} danger onClick={() => { signOut(); dispatch({ type: "RESET" }); dispatch({ type: "NAVIGATE", screen: SCREENS.LOGIN }); }} icon={<IconSignOut size={14} />}>{t("Sign out", "تسجيل الخروج")}</MenuItem>
                </div>
              )}
            </div>
          )}
          {compact && (
            <button type="button" style={iconBtn} onClick={() => setMobileOpen((v) => !v)} aria-expanded={mobileOpen} aria-label={t("Menu", "القائمة")}>
              {mobileOpen ? <IconX size={16} /> : <IconMenu size={16} />}
            </button>
          )}
        </div>
      </div>

      {compact && mobileOpen && (
        <div style={{ borderTop: `1px solid ${tokens.cardBorder}`, background: tokens.card, maxHeight: "calc(100vh - 68px)", overflowY: "auto" }}>
          <div style={{ ...siteContainer, padding: "10px 16px 18px" }}>
            {[{ id: SCREENS.ADMIN, nav: { en: "Home", ar: "الرئيسية" }, icon: "building" }, ...services].map((s) => (
              <button key={s.id} type="button" onClick={() => go(s.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 8px", border: "none", borderBottom: `1px solid ${tokens.cardBorder}`, background: "none", color: state.screen === s.id ? tokens.primary : tokens.textPrimary, fontWeight: state.screen === s.id ? 650 : 500, fontSize: 14.5, cursor: "pointer", fontFamily: "inherit", textAlign: "start" }}>
                <ServiceIcon name={s.icon} size={16} color={tokens.primary} />
                {s.nav[lang] ?? s.nav.en}
              </button>
            ))}
            <button type="button" onClick={() => { signOut(); dispatch({ type: "RESET" }); dispatch({ type: "NAVIGATE", screen: SCREENS.LOGIN }); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 8px", border: "none", background: "none", color: "#B42318", fontSize: 14.5, cursor: "pointer", fontFamily: "inherit" }}>
              <IconSignOut size={16} /> {t("Sign out", "تسجيل الخروج")}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

function MenuItem({ tokens, icon, children, onClick, danger }) {
  return (
    <button type="button" role="menuitem" onClick={onClick}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, border: "none", background: "none", cursor: "pointer", color: danger ? "#B42318" : tokens.textPrimary, fontSize: 13.5, fontFamily: "inherit", textAlign: "start" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = tokens.bg; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}>
      <span style={{ color: danger ? "#B42318" : tokens.textMuted, display: "flex" }}>{icon}</span>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Page banner (every page except Home)                               */
/* ------------------------------------------------------------------ */

function PageBanner({ state, dispatch, service }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const t = (en, ar) => (isRtl ? ar : en);
  const Chevron = isRtl ? IconChevronLeft : IconChevronRight;
  const steps = service.steps ?? [];
  return (
    <section style={{ background: state.dark ? "linear-gradient(180deg, #111a3f 0%, #0A0E23 100%)" : "linear-gradient(180deg, #EAF0FB 0%, #F4F6F9 100%)", borderBottom: `1px solid ${tokens.cardBorder}` }}>
      <div style={{ ...siteContainer, padding: "26px 24px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: tokens.textMuted, marginBottom: 10 }}>
          <button type="button" onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.ADMIN })} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: tokens.primary, fontSize: 12.5, fontFamily: "inherit", fontWeight: 600 }}>
            {t("Home", "الرئيسية")}
          </button>
          <Chevron size={11} />
          <span>{service.nav[lang] ?? service.nav.en}</span>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <span style={{ width: 46, height: 46, borderRadius: 13, background: tokens.card, border: `1px solid ${tokens.cardBorder}`, color: tokens.primary, display: "grid", placeItems: "center", flex: "0 0 auto", boxShadow: "0 4px 12px rgba(27,77,168,0.08)" }}>
            <ServiceIcon name={service.icon} size={20} />
          </span>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontFamily: headingFont(lang), fontWeight: 750, fontSize: 26, letterSpacing: "-0.02em", color: tokens.textPrimary }}>{service.title[lang] ?? service.title.en}</h1>
            <p style={{ margin: "6px 0 0", fontSize: 14.5, color: tokens.textMuted, lineHeight: 1.6, maxWidth: 720 }}>{service.short[lang] ?? service.short.en}</p>
          </div>
        </div>
        {steps.length > 0 && (
          <ol aria-label={t("How it works", "بيشتغل إزاي")} style={{ listStyle: "none", margin: "18px 0 0", padding: 0, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {steps.map((step, i) => (
              <li key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px 6px 6px", paddingInlineStart: 6, paddingInlineEnd: 12, background: tokens.card, border: `1px solid ${tokens.cardBorder}`, borderRadius: 999, fontSize: 12.5, color: tokens.textSecondary }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", background: tokens.primary, color: state.dark ? "#0A0E23" : "#fff", fontSize: 11, fontWeight: 700, display: "grid", placeItems: "center" }}>{i + 1}</span>
                {step[lang] ?? step.en}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                             */
/* ------------------------------------------------------------------ */

function SiteFooter({ state, dispatch, services, profile }) {
  const lang = state.lang;
  const isRtl = lang === "ar";
  const t = (en, ar) => (isRtl ? ar : en);
  const muted = "rgba(226,232,245,0.66)";
  const head = { fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fff", margin: "0 0 14px" };
  const linkStyle = { display: "block", background: "none", border: "none", padding: "4px 0", color: muted, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit", textAlign: "start" };
  const go = (screen) => { dispatch({ type: "NAVIGATE", screen }); window.scrollTo({ top: 0 }); };
  const year = new Date().getFullYear();
  return (
    <footer style={{ background: state.dark ? "#060A1C" : "#0B1B3A", color: "#E2E8F5", marginTop: 56 }}>
      <div style={{ ...siteContainer, padding: "44px 24px 26px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 30 }}>
          <div style={{ gridColumn: "span 1" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
              <InstitutionMark profile={profile} size={36} inverted />
              <span style={{ fontFamily: headingFont(lang), fontWeight: 750, fontSize: 15.5, color: "#fff" }}>{profile?.name}</span>
            </div>
            {profile?.tagline && <p style={{ margin: "0 0 10px", color: muted, fontSize: 13.5, lineHeight: 1.6 }}>{profile.tagline}</p>}
            {profile?.address && <p style={{ margin: 0, color: muted, fontSize: 12.5, lineHeight: 1.6 }}>{profile.address}</p>}
          </div>
          <div>
            <h3 style={head}>{t("Services", "الخدمات")}</h3>
            {services.filter((s) => s.main).map((s) => (
              <button key={s.id} type="button" style={linkStyle} onClick={() => go(s.id)}>{s.title[lang] ?? s.title.en}</button>
            ))}
          </div>
          <div>
            <h3 style={head}>{t("Administration", "الإدارة")}</h3>
            {services.filter((s) => !s.main).map((s) => (
              <button key={s.id} type="button" style={linkStyle} onClick={() => go(s.id)}>{s.nav[lang] ?? s.nav.en}</button>
            ))}
          </div>
          <div>
            <h3 style={head}>{t("Contact", "التواصل")}</h3>
            {profile?.website && <a href={profile.website} target="_blank" rel="noreferrer" dir="ltr" style={{ ...linkStyle, textDecoration: "none", textAlign: isRtl ? "right" : "left" }}>{profile.website.replace(/^https?:\/\//, "")}</a>}
            {profile?.contactEmail && <a href={`mailto:${profile.contactEmail}`} dir="ltr" style={{ ...linkStyle, textDecoration: "none", textAlign: isRtl ? "right" : "left" }}>{profile.contactEmail}</a>}
            {profile?.phone && <span dir="ltr" style={{ ...linkStyle, cursor: "default", textAlign: isRtl ? "right" : "left" }}>{profile.phone}</span>}
            {profile?.city && <span style={{ ...linkStyle, cursor: "default" }}>{profile.city}</span>}
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 34, paddingTop: 18, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 12.5, color: muted }}>
          <span>© {year} {profile?.name}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            {t("Powered by", "مقدَّم من")} <IconLogoBrand size={18} /> <b style={{ color: "#fff", fontWeight: 700 }}>Lerna</b>
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Layout                                                             */
/* ------------------------------------------------------------------ */

export default function AdminSite({ state, dispatch, children }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const admin = useAdmin();
  const [profileState, setProfileState] = useState({ profile: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    if (demoMode()) {
      setProfileState({ profile: { name: "Menoufia University", shortName: "MU", faculties: [] }, loading: false, error: null });
      return undefined;
    }
    getInstitutionProfile()
      .then((profile) => alive && setProfileState({ profile, loading: false, error: null }))
      .catch((error) => alive && setProfileState((s) => ({ ...s, loading: false, error })));
    return () => {
      alive = false;
    };
  }, [tick]);

  const services = ADMIN_SERVICES.filter((s) => serviceAllowed(s, admin));
  const current = state.screen === SCREENS.ADMIN ? null : serviceById(state.screen);
  const profile = profileState.profile;

  return (
    <InstitutionContext.Provider value={{ ...profileState, reload }}>
      <div dir={lang === "ar" ? "rtl" : "ltr"} style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: tokens.bg, color: tokens.textPrimary, fontFamily: bodyFont(lang) }}>
        {/* Pages keep their own content; the site banner replaces their old title line. */}
        <style>{`.lerna-site-page h1, .lerna-site-page h1 + p { display: none !important; }`}</style>
        <SiteHeader state={state} dispatch={dispatch} services={services} profile={profile} canEditProfile={serviceAllowed(serviceById(SCREENS.ADMIN_PROFILE), admin)} />
        <DemoGuide state={state} dispatch={dispatch} />
        <main style={{ flex: 1 }}>
          {current && <PageBanner state={state} dispatch={dispatch} service={current} />}
          <div className={current ? "lerna-site-page" : undefined} style={current ? { ...siteContainer, padding: "6px 0 0" } : undefined}>
            {children}
          </div>
        </main>
        <SiteFooter state={state} dispatch={dispatch} services={services} profile={profile} />
        <Toaster tokens={tokens} lang={lang} />
      </div>
    </InstitutionContext.Provider>
  );
}
