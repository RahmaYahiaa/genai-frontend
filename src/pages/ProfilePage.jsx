import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { fetchProfile } from "@/services/api";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { Card, Chip, Bar, AsyncGate, Btn } from "@/components/ui";

export default function ProfilePage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const mobile = useMediaQuery("(max-width: 760px)");
  const { data, loading, error, reload } = useAsync(fetchProfile);

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 820, margin: "0 auto", fontFamily: bodyFont(lang) }}>
      <h1 style={{ margin: "0 0 20px", fontSize: mobile ? 19 : 22, fontWeight: 700, letterSpacing: "-0.02em", color: tokens.textPrimary, fontFamily: headingFont(lang) }}>
        {t("Profile", "الملف الشخصي")}
      </h1>
      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Loading profile…", "جاري تحميل الملف…")}>
        {data && (
          <>
            <Card tokens={tokens} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: tokens.primaryLight,
                    border: `1.5px solid ${tokens.primary}44`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 700,
                    color: tokens.primary,
                    flexShrink: 0,
                  }}
                >
                  {data.user.initials}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: tokens.textPrimary }}>{data.user.name[lang]}</div>
                  <div style={{ fontSize: 12, color: tokens.textMuted, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>{data.user.email}</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {data.user.institution && <Chip tokens={tokens} tone="primary">{data.user.institution}</Chip>}
                  <Chip tokens={tokens}>{t("Student", "طالب")}</Chip>
                </div>
              </div>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <Card tokens={tokens}>
                <div style={{ fontWeight: 700, fontSize: 14, color: tokens.textPrimary, marginBottom: 12 }}>{t("Preferences", "التفضيلات")}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 12.5, color: tokens.textSecondary }}>{t("Interface language", "لغة الواجهة")}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <Btn tokens={tokens} variant={lang === "en" ? "soft" : "ghost"} style={{ padding: "6px 12px" }} onClick={() => dispatch({ type: "SET_LANG", lang: "en" })}>
                        English
                      </Btn>
                      <Btn tokens={tokens} variant={lang === "ar" ? "soft" : "ghost"} style={{ padding: "6px 12px" }} onClick={() => dispatch({ type: "SET_LANG", lang: "ar" })}>
                        العربية
                      </Btn>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 12.5, color: tokens.textSecondary }}>{t("Theme", "المظهر")}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <Btn tokens={tokens} variant={!state.dark ? "soft" : "ghost"} style={{ padding: "6px 12px" }} onClick={() => dispatch({ type: "SET_THEME", dark: false })}>
                        {t("Light", "نهاري")}
                      </Btn>
                      <Btn tokens={tokens} variant={state.dark ? "soft" : "ghost"} style={{ padding: "6px 12px" }} onClick={() => dispatch({ type: "SET_THEME", dark: true })}>
                        {t("Dark", "ليلي")}
                      </Btn>
                    </div>
                  </div>
                </div>
              </Card>

              <Card tokens={tokens}>
                <div style={{ fontWeight: 700, fontSize: 14, color: tokens.textPrimary, marginBottom: 12 }}>{t("Enrolled courses", "المقررات المسجلة")}</div>
                {data.courses.map((course) => (
                  <div key={course.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 12.5, color: tokens.textSecondary }}>
                      <span style={{ fontWeight: 600 }}>{course.id} · {course.title[lang]}</span>
                      <span style={{ fontWeight: 700, color: tokens.mastered }}>{course.overall}%</span>
                    </div>
                    <Bar tokens={tokens} value={course.overall} color={tokens.mastered} height={6} />
                  </div>
                ))}
              </Card>
            </div>

            <Card tokens={tokens} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: tokens.textPrimary }}>{t("Session", "الجلسة")}</div>
                <div style={{ fontSize: 11.5, color: tokens.textMuted, marginTop: 2 }}>
                  {t("Actions here reset the local workspace only.", "الإجراءات دي بتصفّر مساحة العمل المحلية فقط.")}
                </div>
              </div>
              <Btn tokens={tokens} variant="ghost" onClick={() => dispatch({ type: "RESET" })}>
                {t("Sign out", "تسجيل الخروج")}
              </Btn>
            </Card>
          </>
        )}
      </AsyncGate>
    </div>
  );
}