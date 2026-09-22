import { useCallback, useMemo, useState } from "react";
import useAsync from "@/hooks/useAsync";
import useMediaQuery from "@/hooks/useMediaQuery";
import { tk, bodyFont } from "@/constants/tokens";
import { AsyncGate } from "@/components/ui";
import { AlertStrip, Btn, Card, Chip, ConfirmBtn, Field, Modal, inputStyle, textareaStyle, toast, bFontFor, hFontFor } from "@/components/ModuleUI";
import { IconBookOpen, IconCheck, IconPlus, IconUsers, IconWarning, IconX } from "@/components/Icons";
import { listCourses, createCourse, addCourseStaff, removeCourseStaff, getCreationPolicy } from "@/services/courses";
import { listInstitutionUnits } from "@/services/academic";
import { listUsers } from "@/services/admin";
import { apiErrorText } from "@/services/http";
import { demoMode } from "@/services/auth";

const MONO = "'JetBrains Mono', monospace";
const STAFF_ROLE_LABEL = { instructor: { en: "Doctor", ar: "دكتور" }, teaching_assistant: { en: "TA", ar: "مساعد" } };

// Academic year is read from the first digit of the course code (CS310 → year 3),
// the same convention the catalog and the instructor screens follow.
const yearOf = (code) => {
  const match = /(\d)/.exec(code ?? "");
  return match ? match[1] : null;
};

export default function AdminCoursesPage({ state }) {
  const tokens = tk(state.dark);
  const lang = state.lang;
  const isRtl = lang === "ar";
  const hFont = hFontFor(lang);
  const bFont = bFontFor(lang);
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const mobile = useMediaQuery("(max-width: 860px)");
  const demo = demoMode();
  const institutionId = state.user?.institutionId ?? null;

  const [createOpen, setCreateOpen] = useState(false);
  const [assignFor, setAssignFor] = useState(null); // course object or null
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ code: "", title: "", description: "", departmentId: "", semesterId: "" });
  const [assignee, setAssignee] = useState({ userId: "", role: "instructor" });

  const load = useCallback(async () => {
    if (demo) return { courses: [], instructors: [], units: [], policy: null };
    const [{ items: courses }, users, units, policy] = await Promise.all([
      listCourses({ limit: 100 }),
      listUsers().catch(() => []),
      (institutionId ? listInstitutionUnits(institutionId) : Promise.resolve([])).catch(() => []),
      getCreationPolicy().catch(() => null),
    ]);
    const instructors = (Array.isArray(users) ? users : []).filter((u) => u.role === "instructor" && u.isActive);
    return { courses, instructors, units: Array.isArray(units) ? units : [], policy };
  }, [demo, institutionId]);

  const { data, loading, error, reload } = useAsync(load);
  const courses = data?.courses ?? [];
  const instructors = data?.instructors ?? [];
  const units = data?.units ?? [];
  const departments = useMemo(() => units.filter((u) => u.type === "department"), [units]);
  const semesters = useMemo(() => units.filter((u) => u.type === "semester"), [units]);
  const unitName = (id) => units.find((u) => u.id === id)?.name ?? null;
  const doctorName = (userId) => {
    const u = instructors.find((x) => x.id === userId);
    return u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() : null;
  };
  const doctorCreationAllowed = data?.policy?.allowDoctorCourseCreation !== false;

  const assignCourse = assignFor ? courses.find((c) => c.id === assignFor.id) ?? null : null;
  const assignableDoctors = assignCourse
    ? instructors.filter((u) => !(assignCourse.staff ?? []).some((m) => String(m.userId) === String(u.id)))
    : [];

  const openCreate = () => {
    setForm({ code: "", title: "", description: "", departmentId: "", semesterId: "" });
    setCreateOpen(true);
  };
  const openAssign = (course) => {
    setAssignee({ userId: "", role: "instructor" });
    setAssignFor(course);
  };

  const submitCreate = async () => {
    const code = form.code.trim().toUpperCase();
    const title = form.title.trim();
    if (!code || !title || busy) return;
    setBusy(true);
    try {
      await createCourse({
        code,
        title,
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
        ...(form.departmentId ? { departmentId: form.departmentId } : {}),
        ...(form.semesterId ? { semesterId: form.semesterId } : {}),
      });
      toast(t(`Course ${code} created — assign its doctor from the card below.`, `أُنشئ المقرر ${code} — أنسبه لدكتوره من بطاقته أدناه.`));
      setCreateOpen(false);
      await reload();
    } catch (err) {
      toast(apiErrorText(err, lang));
    } finally {
      setBusy(false);
    }
  };

  const submitAssign = async () => {
    if (!assignCourse || !assignee.userId || busy) return;
    setBusy(true);
    try {
      await addCourseStaff(assignCourse.id, { userId: assignee.userId, role: assignee.role });
      const name = doctorName(assignee.userId) ?? "";
      toast(t(`${assignCourse.code ?? ""} is now assigned to ${name}.`, `نُسب ${assignCourse.code ?? ""} إلى ${name}.`));
      setAssignFor(null);
      await reload();
    } catch (err) {
      toast(apiErrorText(err, lang));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: mobile ? 16 : 28, maxWidth: 1080, margin: "0 auto", fontFamily: bodyFont(lang), direction: isRtl ? "rtl" : "ltr" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 18, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
        <div style={{ textAlign: isRtl ? "right" : "left" }}>
          <h1 style={{ margin: "0 0 4px", fontFamily: hFont, fontWeight: 700, fontSize: mobile ? 19 : 22, letterSpacing: "-0.02em", color: tokens.textPrimary }}>
            {t("Institution courses", "مقررات المؤسسة")}
          </h1>
          <p style={{ margin: 0, fontFamily: bFont, fontSize: 13, color: tokens.textMuted }}>
            {t("Courses created centrally — assign each to its doctor and it appears in his list the moment you do.", "المقررات المنشأة مركزيًا — أنسب كل مقرر لدكتوره ويظهر في قائمته فور الإسناد.")}
          </p>
        </div>
        <Btn tokens={tokens} lang={lang} variant="soft" onClick={openCreate} style={{ display: "inline-flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
          <IconPlus size={13} color={tokens.primary} />
          {t("Add course", "إضافة مقرر")}
        </Btn>
      </div>

      {!demo && !doctorCreationAllowed && (
        <div style={{ marginBottom: 16 }}>
          <AlertStrip
            tokens={tokens}
            lang={lang}
            tone="slate"
            icon={<IconWarning size={15} color={tokens.noEvidence} />}
            title={t("Doctor course creation is off", "إنشاء المقررات بواسطة الدكاترة موقوف")}
            body={t("Every new course now arrives from this screen only — from Settings you can hand creation back to doctors.", "المقررات الجديدة تأتي من هذه الشاشة فقط الآن — ومن «الإعدادات» يمكنك إعادة الإنشاء للدكاترة.")}
          />
        </div>
      )}

      <AsyncGate tokens={tokens} lang={lang} loading={loading} error={error} reload={reload} label={t("Loading courses…", "جارٍ تحميل المقررات…")}>
        {courses.length === 0 ? (
          <Card tokens={tokens} style={{ padding: "26px 20px", textAlign: "center" }}>
            <div style={{ fontFamily: bFont, fontSize: 13, color: tokens.textMuted }}>
              {t("No institution courses yet — create the first one from the button above.", "لا مقررات مؤسسية بعد — أنشئ أول مقرر من الزر بالأعلى.")}
            </div>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {courses.map((course) => {
              const year = yearOf(course.code);
              const staff = course.staff ?? [];
              const dept = unitName(course.departmentId);
              const sem = unitName(course.semesterId);
              return (
                <Card key={course.id} tokens={tokens} style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                        {course.code && (
                          <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: tokens.textPrimary }}>{course.code}</span>
                        )}
                        <span style={{ fontFamily: bFont, fontWeight: 600, fontSize: 13.5, color: tokens.textPrimary }}>{course.title?.en ?? ""}</span>
                        {year && <Chip tokens={tokens} tone="slate">{t(`Year ${year}`, `السنة ${year}`)}</Chip>}
                        {!course.isActive && <Chip tokens={tokens} tone="violet">{t("Inactive", "موقوف")}</Chip>}
                      </div>
                      {(dept || sem) && (
                        <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted, marginTop: 4 }}>
                          {[dept, sem].filter(Boolean).join(" · ")}
                        </div>
                      )}
                      {course.description && (
                        <div style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted, marginTop: 4, lineHeight: 1.6 }}>{course.description}</div>
                      )}
                    </div>
                    <div style={{ minWidth: 210, flexShrink: 0 }}>
                      <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.09em", color: tokens.textFaint, marginBottom: 6, textAlign: isRtl ? "right" : "left" }}>
                        {t("STAFF", "الطاقم")}
                      </div>
                      {staff.length === 0 && (
                        <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textFaint, marginBottom: 8 }}>
                          {t("No doctor assigned yet.", "لم يُنسب لدكتور بعد.")}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
                        {staff.map((member) => {
                          const name = doctorName(member.userId);
                          const roleLabel = STAFF_ROLE_LABEL[member.role] ?? STAFF_ROLE_LABEL.instructor;
                          return (
                            <span key={member.userId} style={{ display: "inline-flex", gap: 6, alignItems: "center", background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 8, padding: "4px 6px 4px 9px", flexDirection: isRtl ? "row-reverse" : "row" }}>
                              <IconUsers size={11} color={tokens.textMuted} />
                              <span style={{ fontFamily: bFont, fontSize: 11.5, fontWeight: 600, color: tokens.textPrimary }}>{name ?? t("Unknown user", "مستخدم غير معروف")}</span>
                              <span style={{ fontFamily: MONO, fontSize: 9.5, color: tokens.textFaint }}>{lang === "ar" ? roleLabel.ar : roleLabel.en}</span>
                              <ConfirmBtn
                                tokens={tokens}
                                lang={lang}
                                variant="ghost"
                                style={{ padding: 2, color: tokens.textMuted }}
                                label={<IconX size={11} color={tokens.textMuted} />}
                                confirmLabel={<IconCheck size={11} color={tokens.gap} />}
                                onConfirm={async () => {
                                  try {
                                    await removeCourseStaff(course.id, member.userId);
                                    toast(t(`Removed from ${course.code ?? "course"} staff.`, `أُزيل من طاقم ${course.code ?? "المقرر"}.`));
                                    await reload();
                                  } catch (err) {
                                    toast(apiErrorText(err, lang));
                                  }
                                }}
                              />
                            </span>
                          );
                        })}
                      </div>
                      <Btn tokens={tokens} lang={lang} variant="ghost" style={{ padding: "6px 12px", fontSize: 11.5, color: tokens.primary }} onClick={() => openAssign(course)}>
                        <IconPlus size={11} color={tokens.primary} />
                        {t("Assign doctor", "تنسيب دكتور")}
                      </Btn>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </AsyncGate>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        tokens={tokens}
        lang={lang}
        width={520}
        title={t("Create an institution course", "إنشاء مقرر مؤسسي")}
        subtitle={t("A centrally-owned shell — assign it to a doctor after creation so it lands in his list.", "بنية مقرر مملوكة للمؤسسة — أنسبها لدكتور بعد إنشائها لتصل لقائمته.")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field
            tokens={tokens}
            lang={lang}
            label={t("Course code", "كود المقرر")}
            required
            hint={t("The first digit encodes the year — students see the year chip from the code (e.g. CS310 → year 3).", "يعبّر أول رقم في الكود عن السنة — يظهر للطلاب كشارة سنة (مثال: CS310 ‏← سنة 3).")}
          >
            <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} style={{ ...inputStyle(tokens, bFont), direction: "ltr", textAlign: "left" }} placeholder="CS310" />
          </Field>
          <Field tokens={tokens} lang={lang} label={t("Course title", "اسم المقرر")} required>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} style={{ ...inputStyle(tokens, bFont) }} placeholder={t("e.g. Mobile Application Development", "مثال: تطوير تطبيقات المحمول")} />
          </Field>
          <Field tokens={tokens} lang={lang} label={t("Description (optional)", "الوصف (اختياري)")}>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} style={{ ...textareaStyle(tokens, bFont) }} placeholder={t("One line shown to students in the institution catalog.", "سطر واحد يظهر للطلاب في كتالوج المؤسسة.")} />
          </Field>
          {(departments.length > 0 || semesters.length > 0) && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
              {departments.length > 0 && (
                <Field tokens={tokens} lang={lang} label={t("Department (optional)", "القسم (اختياري)")} style={{ flex: 1, minWidth: 180 }}>
                  <select value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))} style={{ ...inputStyle(tokens, bFont), cursor: "pointer", width: "100%" }} className="genai-input">
                    <option value="">{t("None", "بدون")}</option>
                    {departments.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </Field>
              )}
              {semesters.length > 0 && (
                <Field tokens={tokens} lang={lang} label={t("Semester (optional)", "الفصل الدراسي (اختياري)")} style={{ flex: 1, minWidth: 180 }}>
                  <select value={form.semesterId} onChange={(e) => setForm((f) => ({ ...f, semesterId: e.target.value }))} style={{ ...inputStyle(tokens, bFont), cursor: "pointer", width: "100%" }} className="genai-input">
                    <option value="">{t("None", "بدون")}</option>
                    {semesters.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </Field>
              )}
            </div>
          )}
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
            <IconBookOpen size={12} color={tokens.textFaint} />
            <span style={{ fontFamily: bFont, fontSize: 11, color: tokens.textFaint, lineHeight: 1.6 }}>
              {t("The course joins the institution catalog right away; students request or enroll per their year.", "ينضم المقرر لكتالوج المؤسسة فورًا؛ والطلاب يطلبونه أو يسجلون فيه بحسب سنتهم.")}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexDirection: isRtl ? "row-reverse" : "row" }}>
            <Btn tokens={tokens} lang={lang} variant="ghost" onClick={() => setCreateOpen(false)}>{t("Cancel", "إلغاء")}</Btn>
            <Btn tokens={tokens} lang={lang} onClick={submitCreate} disabled={!form.code.trim() || !form.title.trim() || busy}>
              {busy ? t("Creating…", "جارٍ الإنشاء…") : t("Create course", "إنشاء المقرر")}
            </Btn>
          </div>
        </div>
      </Modal>

      <Modal
        open={assignCourse !== null}
        onClose={() => setAssignFor(null)}
        tokens={tokens}
        lang={lang}
        width={460}
        title={assignCourse ? t(`Assign a doctor — ${assignCourse.code ?? ""}`, `تنسيب دكتور — ${assignCourse.code ?? ""}`) : ""}
        subtitle={t("The course lands in the doctor's list immediately after assignment.", "يظهر المقرر في قائمة الدكتور فور التنسيب.")}
      >
        {assignCourse && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {assignableDoctors.length === 0 ? (
              <AlertStrip
                tokens={tokens}
                lang={lang}
                tone="slate"
                icon={<IconCheck size={14} color={tokens.noEvidence} />}
                title={t("Every active doctor is already on this course", "كل الدكاترة النشطون منسبون لهذا المقرر بالفعل")}
              />
            ) : (
              <>
                <Field tokens={tokens} lang={lang} label={t("Doctor", "الدكتور")} required>
                  <select value={assignee.userId} onChange={(e) => setAssignee((a) => ({ ...a, userId: e.target.value }))} style={{ ...inputStyle(tokens, bFont), cursor: "pointer", width: "100%" }} className="genai-input">
                    <option value="">{t("Choose a doctor…", "اختر دكتورًا…")}</option>
                    {assignableDoctors.map((u) => (
                      <option key={u.id} value={u.id}>{`${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()} — {u.email}</option>
                    ))}
                  </select>
                </Field>
                <Field tokens={tokens} lang={lang} label={t("Role", "الدور")}>
                  <select value={assignee.role} onChange={(e) => setAssignee((a) => ({ ...a, role: e.target.value }))} style={{ ...inputStyle(tokens, bFont), cursor: "pointer", width: "100%" }} className="genai-input">
                    <option value="instructor">{t("Course doctor", "دكتور المقرر")}</option>
                    <option value="teaching_assistant">{t("Teaching assistant", "مساعد تدريس")}</option>
                  </select>
                </Field>
              </>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexDirection: isRtl ? "row-reverse" : "row" }}>
              <Btn tokens={tokens} lang={lang} variant="ghost" onClick={() => setAssignFor(null)}>{t("Cancel", "إلغاء")}</Btn>
              {assignableDoctors.length > 0 && (
                <Btn tokens={tokens} lang={lang} onClick={submitAssign} disabled={!assignee.userId || busy}>
                  {busy ? t("Assigning…", "جارٍ التنسيب…") : t("Assign", "تنسيب")}
                </Btn>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}