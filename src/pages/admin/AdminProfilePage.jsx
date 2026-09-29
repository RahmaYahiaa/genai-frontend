import { useEffect, useState } from "react";
import { tk } from "@/constants/tokens";
import { SCREENS } from "@/constants/routes";
import { Card, Btn, Field, AlertStrip, Skeleton, inputStyle, textareaStyle, toast } from "@/components/ModuleUI";
import { updateInstitutionProfile } from "@/services/admin";
import { useInstitution } from "@/components/admin/AdminSite";
import { IconPlus, IconTrash, IconChevronDown } from "@/components/Icons";
import useMediaQuery from "@/hooks/useMediaQuery";

function IconBtn({ tokens, label, onClick, disabled, danger, children }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} disabled={disabled}
      style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${tokens.cardBorder}`, background: tokens.card, color: danger ? tokens.gap : tokens.textMuted, display: "grid", placeItems: "center", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1 }}>
      {children}
    </button>
  );
}

const TEXT_FIELDS = ["name", "shortName", "tagline", "about", "mission", "vision", "city", "address", "website", "contactEmail", "phone"];

function toForm(p) {
  const f = {};
  TEXT_FIELDS.forEach((k) => (f[k] = p?.[k] ?? ""));
  f.foundedYear = p?.foundedYear ? String(p.foundedYear) : "";
  f.faculties = (p?.faculties ?? []).map((x) => ({ name: x.name, description: x.description ?? "" }));
  return f;
}

/** Edit what the institution home page shows: name, about, mission, vision, facts, faculties. */
export default function AdminProfilePage({ state, dispatch }) {
  const tokens = tk(state.dark);
  const isRtl = state.lang === "ar";
  const t = (en, ar) => (isRtl ? ar : en);
  const mobile = useMediaQuery("(max-width: 760px)");
  const { profile, loading, error, reload } = useInstitution();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (profile) setForm(toForm(profile));
  }, [profile]);

  if (loading && !form) return <Card tokens={tokens} style={{ padding: 24 }}><Skeleton tokens={tokens} h={220} /></Card>;
  if (error && !form) return <AlertStrip tokens={tokens} lang={state.lang} title={t("We couldn't load your institution details.", "مقدرناش نحمّل بيانات المؤسسة.")} action={<Btn tokens={tokens} lang={state.lang} variant="ghost" onClick={reload}>{t("Try again", "حاول تاني")}</Btn>} />;
  if (!form) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setFac = (i, k, v) => setForm((f) => ({ ...f, faculties: f.faculties.map((x, j) => (j === i ? { ...x, [k]: v } : x)) }));
  const moveFac = (i, d) => setForm((f) => {
    const arr = [...f.faculties];
    const j = i + d;
    if (j < 0 || j >= arr.length) return f;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return { ...f, faculties: arr };
  });

  const original = toForm(profile);
  const dirty = JSON.stringify(original) !== JSON.stringify(form);
  const yearBad = form.foundedYear && !/^\d{3,4}$/.test(form.foundedYear.trim());
  const nameBad = !form.name.trim();

  async function save() {
    setSaving(true);
    setSaveError("");
    const patch = {};
    TEXT_FIELDS.forEach((k) => {
      if (form[k].trim() !== original[k]) patch[k] = form[k].trim();
    });
    if (form.foundedYear !== original.foundedYear) patch.foundedYear = form.foundedYear.trim() ? Number(form.foundedYear) : null;
    const facs = form.faculties.filter((x) => x.name.trim()).map((x) => ({ name: x.name.trim(), description: x.description.trim() }));
    if (JSON.stringify(facs) !== JSON.stringify(original.faculties)) patch.faculties = facs;
    try {
      await updateInstitutionProfile(patch);
      await reload();
      toast(t("Saved. Your home page is updated.", "اتحفظ. الصفحة الرئيسية اتحدثت."));
    } catch (e) {
      setSaveError(e?.message || t("Couldn't save. Check the fields and try again.", "محفظناش. راجع الخانات وحاول تاني."));
    } finally {
      setSaving(false);
    }
  }

  const input = inputStyle(tokens);
  const area = (rows) => ({ ...textareaStyle(tokens), minHeight: rows * 22 + 20 });
  const grid2 = { display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 14 };
  const section = (title, sub, children) => (
    <Card tokens={tokens} style={{ padding: mobile ? 18 : 24, marginBottom: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: tokens.textPrimary }}>{title}</div>
      {sub && <div style={{ fontSize: 13.5, color: tokens.textMuted, marginTop: 3, marginBottom: 16 }}>{sub}</div>}
      {children}
    </Card>
  );
  const ltr = { direction: "ltr", textAlign: isRtl ? "right" : "left" };

  return (
    <div style={{ paddingBottom: 90 }}>
      {section(t("Name and short line", "الاسم والجملة التعريفية"), t("Shown in large text at the top of your home page.", "بيظهروا بخط كبير فوق الصفحة الرئيسية."), (
        <div style={{ display: "grid", gap: 14 }}>
          <div style={grid2}>
            <Field tokens={tokens} lang={state.lang} label={t("Full name", "الاسم الكامل")} hint={nameBad ? <span style={{ color: tokens.gap }}>{t("The name can't be empty.", "الاسم مينفعش يبقى فاضي.")}</span> : undefined}>
              <input style={input} value={form.name} maxLength={200} onChange={set("name")} />
            </Field>
            <Field tokens={tokens} lang={state.lang} label={t("Short name", "الاسم المختصر")} hint={t("Used in the header, e.g. MU", "بيظهر في الهيدر، مثلاً MU")}>
              <input style={input} value={form.shortName} maxLength={60} onChange={set("shortName")} />
            </Field>
          </div>
          <Field tokens={tokens} lang={state.lang} label={t("One-line description", "وصف في سطر")}>
            <input style={input} value={form.tagline} maxLength={160} onChange={set("tagline")} />
          </Field>
        </div>
      ))}

      {section(t("About", "عن المؤسسة"), t("A few sentences about who you are, then your mission and vision.", "كام جملة عن مين إنتم، وبعدين الرسالة والرؤية."), (
        <div style={{ display: "grid", gap: 14 }}>
          <Field tokens={tokens} lang={state.lang} label={t("About", "نبذة")} hint={`${form.about.length}/2000`}>
            <textarea style={area(5)} value={form.about} maxLength={2000} onChange={set("about")} />
          </Field>
          <div style={grid2}>
            <Field tokens={tokens} lang={state.lang} label={t("Mission", "الرسالة")}>
              <textarea style={area(3)} value={form.mission} maxLength={600} onChange={set("mission")} />
            </Field>
            <Field tokens={tokens} lang={state.lang} label={t("Vision", "الرؤية")}>
              <textarea style={area(3)} value={form.vision} maxLength={600} onChange={set("vision")} />
            </Field>
          </div>
        </div>
      ))}

      {section(t("Facts and contact", "معلومات وتواصل"), t("Shown under the about text and in the footer.", "بتظهر تحت النبذة وفي آخر الصفحة."), (
        <div style={{ display: "grid", gap: 14 }}>
          <div style={grid2}>
            <Field tokens={tokens} lang={state.lang} label={t("Year founded", "سنة التأسيس")} hint={yearBad ? <span style={{ color: tokens.gap }}>{t("Enter a year, e.g. 1976", "اكتب سنة، مثلاً 1976")}</span> : undefined}>
              <input style={{ ...input, ...ltr }} inputMode="numeric" value={form.foundedYear} maxLength={4} onChange={set("foundedYear")} />
            </Field>
            <Field tokens={tokens} lang={state.lang} label={t("City", "المدينة")}>
              <input style={input} value={form.city} maxLength={100} onChange={set("city")} />
            </Field>
          </div>
          <Field tokens={tokens} lang={state.lang} label={t("Address", "العنوان")}>
            <input style={input} value={form.address} maxLength={240} onChange={set("address")} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: 14 }}>
            <Field tokens={tokens} lang={state.lang} label={t("Website", "الموقع")}>
              <input style={{ ...input, ...ltr }} value={form.website} maxLength={200} placeholder="https://" onChange={set("website")} />
            </Field>
            <Field tokens={tokens} lang={state.lang} label={t("Contact email", "إيميل التواصل")}>
              <input style={{ ...input, ...ltr }} type="email" value={form.contactEmail} maxLength={200} onChange={set("contactEmail")} />
            </Field>
            <Field tokens={tokens} lang={state.lang} label={t("Phone", "التليفون")}>
              <input style={{ ...input, ...ltr }} value={form.phone} maxLength={40} onChange={set("phone")} />
            </Field>
          </div>
        </div>
      ))}

      {section(t("Faculties", "الكليات"), t("Listed on the home page in this order.", "بتظهر في الصفحة الرئيسية بنفس الترتيب ده."), (
        <div style={{ display: "grid", gap: 10 }}>
          {form.faculties.length === 0 && (
            <div style={{ fontSize: 14, color: tokens.textMuted, padding: "6px 0" }}>{t("No faculties added yet.", "لسه مفيش كليات.")}</div>
          )}
          {form.faculties.map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 12, borderRadius: 12, border: `1px solid ${tokens.cardBorder}`, background: tokens.bg }}>
              <span style={{ fontWeight: 800, fontSize: 13, color: tokens.primary, minWidth: 26, paddingTop: 10 }}>{String(i + 1).padStart(2, "0")}</span>
              <div style={{ flex: 1, display: "grid", gap: 8, minWidth: 0 }}>
                <input style={input} value={f.name} maxLength={120} placeholder={t("Faculty name", "اسم الكلية")} aria-label={t("Faculty name", "اسم الكلية")} onChange={(e) => setFac(i, "name", e.target.value)} />
                <input style={input} value={f.description} maxLength={300} placeholder={t("Short description (optional)", "وصف قصير (اختياري)")} aria-label={t("Description", "الوصف")} onChange={(e) => setFac(i, "description", e.target.value)} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <IconBtn tokens={tokens} label={t("Move up", "لفوق")} disabled={i === 0} onClick={() => moveFac(i, -1)}><span style={{ display: "inline-flex", transform: "rotate(180deg)" }}><IconChevronDown size={14} /></span></IconBtn>
                <IconBtn tokens={tokens} label={t("Move down", "لتحت")} disabled={i === form.faculties.length - 1} onClick={() => moveFac(i, 1)}><IconChevronDown size={14} /></IconBtn>
                <IconBtn tokens={tokens} label={t("Remove", "شيل")} danger onClick={() => setForm((x) => ({ ...x, faculties: x.faculties.filter((_, j) => j !== i) }))}><IconTrash size={14} /></IconBtn>
              </div>
            </div>
          ))}
          {form.faculties.length < 40 && (
            <div>
              <Btn tokens={tokens} lang={state.lang} variant="ghost" onClick={() => setForm((x) => ({ ...x, faculties: [...x.faculties, { name: "", description: "" }] }))}>
                <IconPlus size={14} /> {t("Add faculty", "ضيف كلية")}
              </Btn>
            </div>
          )}
        </div>
      ))}

      {saveError && <div style={{ marginBottom: 12 }}><AlertStrip tokens={tokens} lang={state.lang} title={saveError} /></div>}

      <div style={{ position: "sticky", bottom: 16, zIndex: 5, display: "flex", justifyContent: "flex-end", gap: 10, padding: 12, borderRadius: 14, background: tokens.card, border: `1px solid ${tokens.cardBorder}`, boxShadow: "0 10px 30px rgba(13,26,46,0.12)" }}>
        <span style={{ flex: 1, alignSelf: "center", fontSize: 13.5, color: tokens.textMuted }}>{dirty ? t("You have unsaved changes.", "عندك تعديلات لسه متحفظتش.") : t("Everything is saved.", "كله محفوظ.")}</span>
        <Btn tokens={tokens} lang={state.lang} variant="ghost" onClick={() => dispatch({ type: "NAVIGATE", screen: SCREENS.ADMIN })}>{t("View home page", "شوف الصفحة الرئيسية")}</Btn>
        <Btn tokens={tokens} lang={state.lang} disabled={!dirty || saving || nameBad || yearBad} onClick={save}>{saving ? t("Saving…", "بنحفظ…") : t("Save", "احفظ")}</Btn>
      </div>
    </div>
  );
}
