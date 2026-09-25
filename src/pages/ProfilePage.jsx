import { useCallback, useEffect, useState } from "react";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { fetchProfile } from "@/services/api";
import { listCourses } from "@/services/courses";
import { getAiPreferences, updateAiPreferences } from "@/services/learning";
import { LANGUAGE_OPTIONS } from "@/services/studyTools";
import { apiErrorText } from "@/services/http";
import { inputStyle } from "@/components/ModuleUI";
import { demoMode } from "@/services/auth";
import { tk, headingFont, bodyFont } from "@/constants/tokens";
import { Card, Chip, Bar, AsyncGate, Btn } from "@/components/ui";
import { signOut } from "@/services/auth";

function AiPreferencesCard({ tokens, lang, t }) {
  const prefAsync = useAsync(getAiPreferences);
  const pref = prefAsync.data;
  const [language, setLanguage] = useState("");
  const [style, setStyle] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (pref) {
      setLanguage(pref.preferredLanguage ?? "");
      setStyle(pref.learningPreference ?? "");
    }
  }, [pref]);

  async function save() {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    try {
      const body = {};
      if (language) body.preferredLanguage = language;
      if (style.trim()) body.learningPreference = style.trim();
      await updateAiPreferences(body);
      prefAsync.reload();
      setNotice({ ok: true, message: t("AI preferences saved.", "تم حفظ تفضيلات الذكاء الاصطناعي.") });
    } catch (error) {
      setNotice({ ok: false, message: apiErrorText(error, lang) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card tokens={tokens} style={{ marginBottom: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: tokens.textPrimary, marginBottom: 4 }}>
        {t("AI learning preferences", "تفضيلات التعلّم بالذكاء الاصطناعي")}
      </div>
      <div style={{ fontSize: 11.5, color: tokens.textMuted, marginBottom: 12, lineHeight: 1.7 }}>
        {t(
          "Stored in the AI learning engine and applied to the tutor, study tools and reviews.",
          "تُحفظ في محرك التعلّم الذكي وتُطبّق على المعلّم وأدوات المذاكرة والمراجعات.",
        )}
      </div>
      <AsyncGate tokens={tokens} lang={lang} loading={prefAsync.loading} error={prefAsync.error} reload={prefAsync.reload} label={t("Loading AI preferences…", "جارٍ تحميل التفضيلات…")}>
        {pref && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <label htmlFor="ai-language" style={{ fontSize: 12.5, color: tokens.textSecondary }}>
                {t("Answer language", "لغة الإجابة")}
              </label>
              <select
                id="ai-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ ...inputStyle(tokens, bodyFont(lang)), minWidth: 170, cursor: "pointer" }}
                className="genai-input"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option[lang]}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <label htmlFor="ai-style" style={{ fontSize: 12.5, color: tokens.textSecondary }}>
                {t("Learning style", "أسلوب التعلّم")}
              </label>
              <input
                id="ai-style"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                placeholder={t("e.g. step-by-step, visual, direct", "مثال: خطوة بخطوة، بصري، مباشر")}
                style={{ ...inputStyle(tokens, bodyFont(lang)), minWidth: 230, flex: 1, maxWidth: 300 }}
                className="genai-input"
                maxLength={120}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Btn tokens={tokens} onClick={save} disabled={busy || (!language && !style.trim())}>
                {busy ? t("Saving…", "جارٍ الحفظ…") : t("Save AI preferences", "حفظ التفضيلات")}
              </Btn>
              {notice && (
                <span style={{ fontSize: 12, color: notice.ok ? tokens.mastered : (tokens.danger ?? "#b33") }}>
                  {notice.message}
                </span>
              )}
            </div>
          </div>
        )}
      </AsyncGate>
    </Card>
  );
}

export default function ProfilePage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const mobile = useMediaQuery("(max-width: 760px)");
  const real = !demoMode();
  const { data, loading, error, reload } = useAsync(fetchProfile);
  const { data: liveCourses } = useAsync(useCallback(() => (real ? listCourses() : Promise.resolve(null)), [real]));

  const viewUser = state.user
    ? { initials: state.user.initials, name: state.user.name, email: state.user.email, institution: null }
    : data?.user ?? null;

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
                  {viewUser.initials}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: tokens.textPrimary }}>{viewUser.name[lang]}</div>
                  <div style={{ fontSize: 12, color: tokens.textMuted, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>{viewUser.email}</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {viewUser.institution && <Chip tokens={tokens} tone="primary">{viewUser.institution}</Chip>}
                  <Chip tokens={tokens}>
                    {state.user?.role === "instructor"
                      ? t("Instructor", "مدرّس")
                      : state.user?.role === "admin"
                        ? t("Admin", "مسؤول مؤسسة")
                        : t("Student", "طالب")}
                  </Chip>
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
                {real
                  ? (liveCourses?.items ?? []).length === 0
                    ? <div style={{ fontSize: 12.5, color: tokens.textMuted }}>{t("No courses yet.", "مفيش مقررات لسه.")}</div>
                    : (liveCourses?.items ?? []).map((course) => (
                      <div key={course.id} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 5, fontSize: 12.5, color: tokens.textSecondary }}>
                          <span style={{ fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{course.title[lang]}</span>
                          <Chip tokens={tokens} tone={course.isPersonal ? "violet" : "primary"}>
                            {course.isPersonal ? t("Self-study", "دراسة ذاتية") : course.code ?? t("University", "جامعي")}
                          </Chip>
                        </div>
                        {typeof course.overall === "number" && <Bar tokens={tokens} value={course.overall} color={tokens.mastered} height={6} />}
                      </div>
                    ))
                  : data.courses.map((course) => (
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

            {real && <AiPreferencesCard tokens={tokens} lang={lang} t={t} />}

            <Card tokens={tokens} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: tokens.textPrimary }}>{t("Session", "الجلسة")}</div>
                <div style={{ fontSize: 11.5, color: tokens.textMuted, marginTop: 2 }}>
                  {t("Actions here reset the local workspace only.", "الإجراءات دي بتصفّر مساحة العمل المحلية فقط.")}
                </div>
              </div>
              <Btn tokens={tokens} variant="ghost" onClick={() => {
                signOut();
                dispatch({ type: "RESET" });
              }}>
                {t("Sign out", "تسجيل الخروج")}
              </Btn>
            </Card>
          </>
        )}
      </AsyncGate>
    </div>
  );
}