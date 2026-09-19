import { useCallback, useMemo, useRef, useState } from "react";
import useAsync from "@/hooks/useAsync";
import { tk, bodyFont } from "@/constants/tokens";
import { AsyncGate } from "@/components/ui";
import { AlertStrip, Btn, Card, Chip, Drawer, Field, inputStyle, textareaStyle, toast, bFontFor, hFontFor } from "@/components/ModuleUI";
import { IconBookOpen, IconAnchor, IconCheck, IconWarning, IconPlus, IconX, IconDoc, IconImageAttach, IconClock, IconInbox, IconShield } from "@/components/Icons";
import { listInstitutionCatalog, catalogEnroll, requestCourseEnrollment, listMyEnrollmentRequests } from "@/services/courses";
import { listMyLinkInvitations, respondToLinkInvitation } from "@/services/linking";
import { applyAuthData, demoMode } from "@/services/auth";

const MONO = "'JetBrains Mono', monospace";
const FILE_TO_KIND = (name) => (/\.(png|jpe?g|gif|webp|bmp)$/i.test(name) ? "image" : "file");
const PROOF_MIME = { "image/png": true, "image/jpeg": true, "application/pdf": true };

const dayDiff = (iso) => {
  const day = (ms) => {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  return Math.floor((day(Date.now()) - day(new Date(iso).getTime())) / 864e5);
};

function SectionHeading({ title, subtitle, tokens, hFont, bFont, isRtl }) {
  return (
    <div style={{ marginBottom: 12, textAlign: isRtl ? "right" : "left" }}>
      <div style={{ fontFamily: hFont, fontWeight: 700, fontSize: 15, color: tokens.textPrimary, letterSpacing: "-0.02em" }}>{title}</div>
      {subtitle ? <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textMuted, marginTop: 3 }}>{subtitle}</div> : null}
    </div>
  );
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function StudentBrowseCoursesPage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const demo = demoMode();

  const personalOnly = state.user?.accountType === "individual";
  const institutional = !demo && !personalOnly;

  const [query, setQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [drawerCourse, setDrawerCourse] = useState(null);
  const [reason, setReason] = useState("");
  const [proof, setProof] = useState(null);
  const [linkDismissed, setLinkDismissed] = useState(false);
  const [busyKey, setBusyKey] = useState(null);
  const fileRef = useRef(null);

  const fetchCatalog = useCallback(async () => {
    if (!institutional) return { items: [] };
    return listInstitutionCatalog({ search: query, page: 1, limit: 50, ...(yearFilter !== "all" ? { year: yearFilter } : {}) });
  }, [institutional, query, yearFilter]);

  const fetchAll = useCallback(async () => {
    const catalog = await fetchCatalog();
    let requests = { items: [] };
    let linkInvitations = [];
    if (institutional) {
      const res = await listMyEnrollmentRequests({ page: 1, limit: 20 });
      requests = { items: res?.items ?? [] };
    }
    if (personalOnly) {
      linkInvitations = await listMyLinkInvitations().catch(() => []);
    }
    return { catalog: catalog?.items ?? [], requests: requests.items, linkInvitations: Array.isArray(linkInvitations) ? linkInvitations : [] };
  }, [fetchCatalog, institutional, personalOnly]);

  const { data, loading, error, reload } = useAsync(fetchAll);
  const catalog = data?.catalog ?? [];
  const myRequests = data?.requests ?? [];
  const linkInvitations = data?.linkInvitations ?? [];
  const activeInvitation = linkInvitations[0] ?? null;

  const requestFor = (code) => myRequests.find((r) => (r.course?.code ?? "") === code && r.status === "PENDING") ?? null;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((c) => {
      if (yearFilter !== "all" && String(c.year) !== String(yearFilter)) return false;
      if (!q) return true;
      return [c.code ?? "", c.title ?? "", c.description ?? ""].join(" ").toLowerCase().includes(q);
    });
  }, [catalog, query, yearFilter]);

  const openDrawer = (course) => {
    setReason("");
    setProof(null);
    setDrawerCourse(course);
  };

  const onPickProof = (file) => {
    if (!file) return;
    if (!PROOF_MIME[file.type]) {
      toast(t("Proof must be a PNG, JPG or PDF file.", "الإثبات لازم يكون ملف PNG أو JPG أو PDF."));
      return;
    }
    if (file.size > 1.4 * 1024 * 1024) {
      toast(t("Proof files must be 1.5 MB or smaller.", "ملف الإثبات لازم يكون ١.٥ ميجابايت أو أقل."));
      return;
    }
    setProof({ name: file.name, mimeType: file.type, file });
  };

  const reasonOk = reason.trim().length >= 3;
  const canSubmit = Boolean(drawerCourse) && reasonOk && proof !== null;

  const send = async () => {
    if (!canSubmit) return;
    setBusyKey("send");
    try {
      const data64 = await readFileAsBase64(proof.file);
      await requestCourseEnrollment(drawerCourse.id, {
        note: reason.trim(),
        proof: { fileName: proof.name, mimeType: proof.mimeType, data: data64 },
      });
      toast(t(
        `Request sent — ${drawerCourse.code ?? drawerCourse.title} now sits in the admin queue with your proof attached.`,
        `أُرسل الطلب — ${drawerCourse.code ?? drawerCourse.title} الآن في قائمة الإدارة ومرفقك معه.`,
      ));
      setDrawerCourse(null);
      await reload();
    } catch (err) {
      toast(err?.message ?? t("Could not send the request.", "تعذّرت إرسال الطلب."));
    } finally {
      setBusyKey(null);
    }
  };

  const enroll = async (course) => {
    setBusyKey(`enroll-${course.id}`);
    try {
      await catalogEnroll(course.id);
      toast(t(`Enrolled in ${course.code} — it opens in My Courses right away.`, `سُجلت في ${course.code} — يظهر في مقرراتي فورًا.`));
      await reload();
    } catch (err) {
      toast(err?.message ?? t("Could not enroll in that course.", "تعذّر التسجيل في هذا المقرر."));
    } finally {
      setBusyKey(null);
    }
  };

  const acceptLink = async () => {
    if (!activeInvitation) return;
    setBusyKey("link");
    try {
      const result = await respondToLinkInvitation(activeInvitation.id, "accept");
      if (result?.tokens) applyAuthData(result);
      toast(t("Linked — your account is now institutional with its history preserved. Reloading…", "رُبط الحساب — أصبح مؤسسيًا بمحفوظاته. جاري تحديث الجلسة…"));
      window.setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      toast(err?.message ?? t("Could not complete the linking.", "تعذّر إتمام الربط."));
      setBusyKey(null);
    }
  };

  const courseAction = (course) => {
    if (course.enrolled) {
      return <Chip tokens={tokens} tone="primary">{t("Enrolled", "مسجل")}</Chip>;
    }
    if (course.myRequestStatus === "PENDING" || requestFor(course.code ?? "")) {
      return <Chip tokens={tokens} tone="peri">{t("Request pending", "الطلب معلق")}</Chip>;
    }
    if (course.myRequestStatus === "REJECTED") {
      return <Chip tokens={tokens} tone="violet">{t("Rejected — ask the admin", "مرفوض — راجع الإدارة")}</Chip>;
    }
    return (
      <span style={{ display: "inline-flex", gap: 8, flexShrink: 0, flexDirection: isRtl ? "row-reverse" : "row" }}>
        <Btn tokens={tokens} lang={lang} variant="soft" disabled={busyKey !== null} style={{ padding: "8px 14px", fontSize: 12.5 }} onClick={() => enroll(course)}>
          <IconCheck size={13} color={tokens.primary} />
          {t("Enroll now", "سجّل الآن")}
        </Btn>
        <Btn tokens={tokens} lang={lang} variant="ghost" disabled={busyKey !== null} style={{ padding: "8px 14px", fontSize: 12.5 }} onClick={() => openDrawer(course)}>
          <IconDoc size={13} color={tokens.textSecondary} />
          {t("Request with proof", "اطلب بإثبات")}
        </Btn>
      </span>
    );
  };

  return (
    <div style={{ padding: "26px 32px", maxWidth: 980, margin: "0 auto", direction: isRtl ? "rtl" : "ltr", textAlign: isRtl ? "right" : "left", fontFamily: bodyFont(lang) }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontFamily: hFont, fontWeight: 700, fontSize: 22, color: tokens.textPrimary, letterSpacing: "-0.025em", margin: "0 0 4px" }}>
          {t("Browse institution courses", "استعرض مقررات المؤسسة")}
        </h1>
        <p style={{ fontFamily: bFont, fontSize: 13, color: tokens.textMuted, margin: 0 }}>
          {t("Every course in your faculty — not only the ones you already know the code of.", "كل مقررات كليتك — مش بس اللي تعرف كودها.")}
        </p>
      </div>

      {demo && (
        <div style={{ marginBottom: 16 }}>
          <AlertStrip
            tokens={tokens}
            lang={lang}
            tone="violet"
            icon={<IconShield size={14} color={tokens.gap} />}
            title={t("The catalog needs the real backend", "الكتالوج يشتغل مع الباك إند الحقيقي بس")}
            body={t(
              "Set VITE_API_URL to your running backend (ending with /api/v1), restart the frontend, then sign in with your student account.",
              "اضبطي VITE_API_URL على الباك إند الشغال (منتهيًا بـ /api/v1)، اعملي إعادة تشغيل للفرونت، وسجّلي دخولك بحساب طالب.",
            )}
          />
        </div>
      )}

      {institutional && (
        <div style={{ marginBottom: 16 }}>
          <AlertStrip
            tokens={tokens}
            lang={lang}
            tone="peri"
            icon={<IconBookOpen size={14} color={tokens.primary} />}
            title={t(
              "Courses of your faculty — most enroll instantly. Out-of-scope access files a proof-backed exception: the admin opens it with your statement, decides, and you are notified.",
              "مقررات كليتك — الأغلبية تسجل فورًا. الوصول خارج النطاق يُطلب استثناءً مدعوم بإثبات: الإدارة تفتحه مع بيانك وتبت فيه ويصلك إشعار.",
            )}
          />
        </div>
      )}

      {personalOnly && !linkDismissed && activeInvitation && (
        <Card tokens={tokens} style={{ padding: "14px 16px", marginBottom: 14, borderColor: tokens.citationBorder }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
            <span style={{ flexShrink: 0, marginTop: 2 }}><IconAnchor size={16} color={tokens.primary} /></span>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontFamily: bFont, fontWeight: 600, fontSize: 13.5, color: tokens.textPrimary }}>
                {t("Your university invites you to link your account", "جامعتك تدعوك لربط حسابك")}
              </div>
              <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textMuted, marginTop: 5, lineHeight: 1.7 }}>
                {t(
                  `${activeInvitation.institutionName} invites this personal account to become institutional — your courses and history come along whole, and you become visible to your faculty. Nothing changes until you say yes.`,
                  `${activeInvitation.institutionName} تدعو حسابك الفردي ليصبح مؤسسيًا — مقرراتك ومحفوظاتك تنتقل كاملة وتصبحين ظاهرة لكليتك. لا شيء يتغير حتى توافقي.`,
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0, flexDirection: isRtl ? "row-reverse" : "row" }}>
              <Btn tokens={tokens} lang={lang} disabled={busyKey === "link"} style={{ padding: "9px 14px", fontSize: 12.5 }} onClick={acceptLink}>
                <IconCheck size={13} color="#fff" />
                {t("Accept linking", "أوافق على الربط")}
              </Btn>
              <Btn tokens={tokens} lang={lang} variant="ghost" style={{ padding: "9px 14px", fontSize: 12.5 }} onClick={() => setLinkDismissed(true)}>
                {t("Later", "لاحقًا")}
              </Btn>
            </div>
          </div>
        </Card>
      )}

      {personalOnly && !linkDismissed && !activeInvitation && (
        <Card tokens={tokens} style={{ padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
            <span style={{ flexShrink: 0 }}><IconAnchor size={16} color={tokens.textFaint} /></span>
            <span style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textSecondary, lineHeight: 1.65 }}>
              {t(
                "No linking invitation on your account right now — when your university sends one, the consent banner lands here.",
                "لا دعوة ربط على حسابك الآن — حين ترسل جامعتك واحدة، يظهر شريط الموافقة هنا.",
              )}
            </span>
          </div>
        </Card>
      )}

      {personalOnly && (
        <Card tokens={tokens} style={{ padding: "12px 14px", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
            <IconWarning size={14} color={tokens.gap} />
            <span style={{ fontFamily: bFont, fontSize: 12, color: tokens.textSecondary, flex: 1, minWidth: 240, lineHeight: 1.65 }}>
              {t(
                "Creating new personal courses is paused for accounts on institution-approved domains — the path forward is linking, not another private lane.",
                "إنشاء مقررات شخصية جديدة متوقف للحسابات على نطاقات معتمدة مؤسسيًا — فالطريق الصحيح هو الربط لا مسار خاص جديد.",
              )}
            </span>
            <Btn tokens={tokens} lang={lang} variant="ghost" disabled style={{ padding: "8px 13px", fontSize: 12, flexShrink: 0 }}>
              <IconPlus size={13} color={tokens.textFaint} />
              {t("New personal course", "مقرر شخصي جديد")}
            </Btn>
          </div>
        </Card>
      )}

      {institutional && (
        <>
          <Card tokens={tokens} style={{ padding: "12px 14px", marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
              <div style={{ flex: "2 1 240px", minWidth: 200 }}>
                <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.09em", color: tokens.textFaint, marginBottom: 4 }}>
                  {t("SEARCH THE CATALOG", "ابحث في الكتالوج")}
                </div>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ ...inputStyle(tokens, bFont) }}
                  placeholder={t("Course code, title, department, or doctor…", "كود المقرر أو اسمه أو القسم أو الدكتور…")}
                />
              </div>
              <div style={{ flex: "1 1 150px", minWidth: 135 }}>
                <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.09em", color: tokens.textFaint, marginBottom: 4 }}>
                  {t("YEAR", "السنة")}
                </div>
                <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} style={{ ...inputStyle(tokens, bFont), cursor: "pointer" }}>
                  <option value="all">{t("All years", "كل السنوات")}</option>
                  {[1, 2, 3, 4, 5, 6].map((y) => (
                    <option key={y} value={y}>{t(`Year ${y}`, `السنة ${y}`)}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          <AsyncGate
            tokens={tokens}
            lang={lang}
            loading={loading}
            error={error}
            reload={reload}
            label={t("Loading the institution catalog…", "جاري تحميل كتالوج المؤسسة…")}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {shown.map((course) => (
                <Card tokens={tokens} key={course.id} style={{ padding: "13px 16px" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                    <div style={{ flex: 1, minWidth: 230 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                        {course.code && <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: tokens.textPrimary }}>{course.code}</span>}
                        <span style={{ fontFamily: bFont, fontWeight: 600, fontSize: 13.5, color: tokens.textPrimary }}>{course.title}</span>
                        {course.year && (
                          <Chip tokens={tokens} tone="slate">{t(`Year ${course.year}`, `السنة ${course.year}`)}</Chip>
                        )}
                      </div>
                      {course.description && (
                        <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted, marginTop: 4, lineHeight: 1.6 }}>{course.description}</div>
                      )}
                    </div>
                    {courseAction(course)}
                  </div>
                </Card>
              ))}
              {shown.length === 0 && (
                <Card tokens={tokens} style={{ padding: "24px 18px", textAlign: "center" }}>
                  <div style={{ fontFamily: bFont, fontSize: 13, color: tokens.textMuted }}>
                    {t("No course matches this search.", "لا مقرر يطابق هذا البحث.")}
                  </div>
                </Card>
              )}
            </div>

            <div>
              <SectionHeading
                title={t("My out-of-year requests", "طلباتي خارج السنة")}
                subtitle={myRequests.length
                  ? t("Reload after the admin decides — the status below moves.", "أعد التحميل بعد بت الإدارة — الحالة بالأسفل تتحرك.")
                  : t("Nothing yet — request any course outside your year from above.", "لا شيء بعد — اطلبي أي مقرر خارج سنتك من الأعلى.")}
                tokens={tokens}
                hFont={hFont}
                bFont={bFont}
                isRtl={isRtl}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {myRequests.map((r) => {
                  const waiting = dayDiff(r.createdAt);
                  return (
                    <Card tokens={tokens} key={r.id} style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                        <span style={{ flexShrink: 0 }}><IconInbox size={14} color={tokens.textFaint} /></span>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                            {r.course?.code && <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: tokens.textPrimary }}>{r.course.code}</span>}
                            <span style={{ fontFamily: bFont, fontSize: 12.5, color: tokens.textPrimary }}>{r.course?.title ?? ""}</span>
                            {r.status === "PENDING"
                              ? <Chip tokens={tokens} tone="peri">{t("Pending decision", "بانتظار القرار")}</Chip>
                              : r.status === "APPROVED"
                                ? <Chip tokens={tokens} tone="primary">{t("Accepted — you're in", "مقبول — أصبحت مسجلة")}</Chip>
                                : <Chip tokens={tokens} tone="violet">{t("Rejected", "مرفوض")}</Chip>}
                          </div>
                          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 5, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                            <span style={{ display: "inline-flex", gap: 5, alignItems: "center", fontFamily: MONO, fontSize: 10.5, color: tokens.textFaint }}>
                              <IconClock size={11} color={tokens.textFaint} />
                              {r.status === "PENDING"
                                ? waiting === 0 ? t("submitted today", "قُدم اليوم") : t(`waiting ${waiting}d`, `معلق منذ ${waiting} يوم`)
                                : t("decided", "تم البت")}
                            </span>
                            {r.decisionNote && (
                              <span style={{ fontFamily: bFont, fontSize: 11, color: tokens.textMuted }}>“{r.decisionNote}”</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </AsyncGate>
        </>
      )}

      <Drawer
        open={drawerCourse !== null}
        onClose={() => setDrawerCourse(null)}
        tokens={tokens}
        lang={lang}
        title={drawerCourse ? t(`Request ${drawerCourse.code ?? ""}`, `طلب ${drawerCourse.code ?? ""}`) : ""}
        subtitle={drawerCourse?.title ?? ""}
      >
        {drawerCourse && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
              {drawerCourse.year && <Chip tokens={tokens} tone="slate">{t(`Course: year ${drawerCourse.year}`, `المقرر: السنة ${drawerCourse.year}`)}</Chip>}
              <Chip tokens={tokens} tone="peri">{t("Needs admin decision", "يحتاج قرار الإدارة")}</Chip>
            </div>

            <AlertStrip
              tokens={tokens}
              lang={lang}
              tone="violet"
              icon={<IconWarning size={14} color={tokens.gap} />}
              title={t(
                "This access is a formal exception: attach the student-affairs approval (PNG, JPG or PDF, up to 1.5 MB). Without the attachment the request can not leave this drawer.",
                "هذا الوصول استثناء رسمي: أرفقي موافقة شؤون الطلاب (PNG أو JPG أو PDF بحد ١.٥ ميجا). بدون المرفق لن يغادر الطلب هذا الدرج.",
              )}
            />

            <Field tokens={tokens} lang={lang} label={t("Your statement", "بيانك")} required>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                style={{ ...textareaStyle(tokens, bFont) }}
                placeholder={t("Why does this exception make sense? e.g. completed the prerequisite with distinction.", "لماذا يستحق هذا الاستثناء؟ مثال: أنهيت المتطلب السابق بامتياز.")}
              />
            </Field>

            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
                <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.09em", color: tokens.textFaint }}>
                  {t("PROOF ATTACHMENT", "مرفق الإثبات")}
                </span>
                <Btn tokens={tokens} lang={lang} variant="soft" style={{ padding: "7px 12px", fontSize: 12 }} onClick={() => fileRef.current?.click()}>
                  <IconPlus size={12} color={tokens.primary} />
                  {t("Attach proof", "إرفاق إثبات")}
                </Btn>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".png,.jpg,.jpeg,.pdf"
                style={{ display: "none" }}
                onChange={(e) => {
                  onPickProof(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                {proof && (
                  <span style={{ display: "inline-flex", gap: 6, alignItems: "center", fontFamily: MONO, fontSize: 10.5, color: tokens.textPrimary, background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 6, padding: "4px 9px", direction: "ltr" }}>
                    {FILE_TO_KIND(proof.name) === "image" ? <IconImageAttach size={11} color={tokens.textSecondary} /> : <IconDoc size={11} color={tokens.textSecondary} />}
                    {proof.name}
                    <button type="button" onClick={() => setProof(null)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "inline-flex" }} aria-label={`remove ${proof.name}`}>
                      <IconX size={11} color={tokens.textSecondary} />
                    </button>
                  </span>
                )}
                {!proof && (
                  <span style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textFaint }}>
                    {t("student-affairs-approval.pdf · at least one file is required.", "موافقة شؤون الطلاب — ملف واحد مطلوب.")}
                  </span>
                )}
              </div>
            </div>

            <Btn
              tokens={tokens}
              lang={lang}
              disabled={!canSubmit || busyKey === "send"}
              style={{ width: "100%", padding: "11px 0", fontSize: 13.5, justifyContent: "center" }}
              onClick={send}
            >
              {t("Send request to the institution", "أرسل الطلب للمؤسسة")}
            </Btn>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
              <IconCheck size={12} color={tokens.textFaint} />
              <span style={{ fontFamily: bFont, fontSize: 11, color: tokens.textFaint, lineHeight: 1.6 }}>
                {t("The admin opens exactly this: your statement plus this attachment, then you get the decision as a notification.", "الإدارة تفتح هذا بالضبط: بيانك والمرفق، ثم يصلك القرار إشعارًا.")}
              </span>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
