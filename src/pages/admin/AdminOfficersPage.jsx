import { useMemo, useState } from "react";
import { inputStyle, Toggle, toast, bFontFor } from "@/components/ModuleUI";
import { PERMISSION_LABELS, PERMISSION_KEYS, TEMPLATE_LABELS } from "@/constants/admin";
import { applyOfficerTemplate, setOfficerScopes } from "@/services/admin";

function sameSet(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((key) => set.has(key));
}

export default function OfficerScopeCard({ officer, templates, tokens, lang, t, onChanged }) {
  const bFont = bFontFor(lang);
  const isRtl = lang === "ar";
  const keys = officer.permissions ?? officer.keys ?? [];
  const [busy, setBusy] = useState(false);

  const currentTemplate = useMemo(
    () => (templates ?? []).find((tpl) => sameSet(tpl.keys ?? tpl, keys))?.id ?? "",
    [templates, keys],
  );

  async function mutate(action, message) {
    setBusy(true);
    try {
      await action();
      toast(message);
      onChanged?.();
    } catch (error) {
      toast(error.message);
    } finally {
      setBusy(false);
    }
  }

  function toggleKey(key) {
    const next = keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key];
    return mutate(() => setOfficerScopes(officer.id, next), t("Scopes updated.", "حُدّثت النطاقات."));
  }

  return (
    <div style={{ border: `1px dashed ${tokens.cardBorder}`, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ fontFamily: bFont, fontWeight: 700, fontSize: 12.5, color: tokens.textPrimary, marginBottom: 6 }}>
        {t("Permission scope", "نطاق الصلاحيات")}
      </div>
      <p style={{ fontFamily: bFont, fontSize: 11.5, color: tokens.textMuted, margin: "0 0 10px", lineHeight: 1.7 }}>
        {t(
          "Start from a ready-made template, then tune switches manually — the officer only ever sees data inside these scopes.",
          "ابدأ بقالب جاهز ثم اضبط المفاتيح يدويًا — المسؤول لا يرى إلا بيانات داخل هذه النطاقات.",
        )}
      </p>
      <select
        value={currentTemplate}
        disabled={busy}
        onChange={(event) => {
          const templateId = event.target.value;
          if (!templateId) return;
          mutate(() => applyOfficerTemplate(officer.id, templateId), t("Template applied.", "طُبّق القالب."));
        }}
        style={{ ...inputStyle(tokens, bFont), cursor: busy ? "wait" : "pointer", marginBottom: 4 }}
      >
        <option value="">{t("Custom set (no template)", "مجموعة مخصصة (بلا قالب)")}</option>
        {(templates ?? []).map((tpl) => {
          const label = TEMPLATE_LABELS[tpl.id];
          return (
            <option key={tpl.id} value={tpl.id}>
              {label ? (lang === "ar" ? label.ar : label.en) : tpl.name}
            </option>
          );
        })}
      </select>
      {currentTemplate && TEMPLATE_LABELS[currentTemplate] ? (
        <div style={{ fontFamily: bFont, fontSize: 11, color: tokens.textFaint, marginBottom: 10, lineHeight: 1.6 }}>
          {lang === "ar" ? TEMPLATE_LABELS[currentTemplate].descAr : TEMPLATE_LABELS[currentTemplate].descEn}
        </div>
      ) : (
        <div style={{ marginBottom: 10 }} />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {PERMISSION_KEYS.map((key) => {
          const label = PERMISSION_LABELS[key];
          const on = keys.includes(key);
          return (
            <div key={key} style={{ display: "flex", gap: 10, alignItems: "center", flexDirection: isRtl ? "row-reverse" : "row" }}>
              <Toggle on={on} onChange={() => toggleKey(key)} tokens={tokens} disabled={busy} />
              <span style={{ fontFamily: bFont, fontSize: 12, color: tokens.textSecondary }}>
                {lang === "ar" ? label.ar : label.en}
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: tokens.textFaint, marginInlineStart: 6 }}>{key}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
