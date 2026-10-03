import { useEffect, useState } from "react";

const box = (tokens, font, invalid) => ({
  width: 64, boxSizing: "border-box", padding: "10px 8px", textAlign: "center",
  borderRadius: 11, border: `1px solid ${invalid ? "#D92D20" : tokens.cardBorder}`,
  background: tokens.card, color: tokens.textPrimary, fontFamily: font, fontSize: 16, fontWeight: 650, outline: "none",
});
const unit = (tokens, font) => ({ fontFamily: font, fontSize: 13, color: tokens.textMuted });
const digits = (v, max) => v.replace(/\D/g, "").slice(0, max);

/**
 * Study time per day typed by hand: [ 1 ] hours [ 30 ] minutes.
 * Calls onChange(totalMinutes) - or null while the value is out of range.
 */
export function DurationInput({ value, onChange, min = 15, max = 240, tokens, font, lang }) {
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const [h, setH] = useState(String(Math.floor((value ?? 60) / 60)));
  const [m, setM] = useState(String((value ?? 60) % 60));
  const total = Number(h || 0) * 60 + Number(m || 0);
  const okMinutes = Number(m || 0) < 60;
  const valid = okMinutes && total >= min && total <= max;

  useEffect(() => { onChange(valid ? total : null); }, [total, valid]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <input inputMode="numeric" aria-label={t("Hours", "ساعات")} value={h} onChange={(e) => setH(digits(e.target.value, 1))} style={box(tokens, font, !valid)} />
        <span style={unit(tokens, font)}>{t("hours", "ساعة")}</span>
        <input inputMode="numeric" aria-label={t("Minutes", "دقايق")} value={m} onChange={(e) => setM(digits(e.target.value, 2))} style={{ ...box(tokens, font, !valid), marginInlineStart: 6 }} />
        <span style={unit(tokens, font)}>{t("minutes", "دقيقة")}</span>
      </div>
      <div style={{ fontFamily: font, fontSize: 12, marginTop: 6, color: valid ? tokens.textMuted : "#B42318" }}>
        {!okMinutes
          ? t("Minutes must be less than 60.", "الدقايق لازم تكون أقل من 60.")
          : valid
            ? t("You can change it any time.", "تقدر تغيّره في أي وقت.")
            : t(`Between ${min} minutes and ${max / 60} hours a day.`, `من ${min} دقيقة لحد ${max / 60} ساعات في اليوم.`)}
      </div>
    </div>
  );
}

/** "HH:MM" (24h) <-> { hour 1-12, minute, pm } */
export function splitTime(hhmm = "09:00") {
  const [H, M] = hhmm.split(":").map(Number);
  return { hour: H % 12 === 0 ? 12 : H % 12, minute: M, pm: H >= 12 };
}
export function joinTime(hour, minute, pm) {
  const H = (hour % 12) + (pm ? 12 : 0);
  return `${String(H).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
export function formatTime12(hhmm, lang) {
  const { hour, minute, pm } = splitTime(hhmm);
  const suffix = lang === "ar" ? (pm ? "م" : "ص") : pm ? "PM" : "AM";
  return `${hour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

/**
 * A clock time typed by hand in 12-hour format with an AM / PM switch.
 * value / onSave use "HH:MM" (24h). onSave fires when the time is valid and changed.
 */
export function ClockInput({ value, onSave, tokens, font, lang, disabled }) {
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const init = splitTime(value);
  const [h, setH] = useState(String(init.hour));
  const [m, setM] = useState(String(init.minute).padStart(2, "0"));
  const [pm, setPm] = useState(init.pm);

  useEffect(() => {
    const s = splitTime(value);
    setH(String(s.hour));
    setM(String(s.minute).padStart(2, "0"));
    setPm(s.pm);
  }, [value]);

  const hour = Number(h);
  const minute = Number(m);
  const valid = h !== "" && m !== "" && hour >= 1 && hour <= 12 && minute >= 0 && minute <= 59;
  const next = valid ? joinTime(hour, minute, pm) : null;
  const dirty = next && next !== value;

  const seg = (on) => ({
    border: "none", cursor: disabled ? "default" : "pointer", padding: "9px 12px", fontFamily: font, fontSize: 13, fontWeight: 700,
    background: on ? tokens.primaryBtn : "transparent", color: on ? "#fff" : tokens.textSecondary,
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <div dir="ltr" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <input inputMode="numeric" aria-label={t("Hour", "الساعة")} disabled={disabled} value={h} onChange={(e) => setH(digits(e.target.value, 2))} style={{ ...box(tokens, font, !valid), width: 54 }} />
        <span style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: tokens.textMuted }}>:</span>
        <input inputMode="numeric" aria-label={t("Minute", "الدقيقة")} disabled={disabled} value={m} onChange={(e) => setM(digits(e.target.value, 2))} onBlur={() => m.length === 1 && setM(`0${m}`)} style={{ ...box(tokens, font, !valid), width: 54 }} />
        <div role="group" aria-label="AM / PM" style={{ display: "inline-flex", marginInlineStart: 6, borderRadius: 11, border: `1px solid ${tokens.cardBorder}`, overflow: "hidden" }}>
          <button type="button" disabled={disabled} onClick={() => setPm(false)} style={seg(!pm)}>{t("AM", "ص")}</button>
          <button type="button" disabled={disabled} onClick={() => setPm(true)} style={seg(pm)}>{t("PM", "م")}</button>
        </div>
      </div>
      {dirty ? (
        <button type="button" disabled={disabled} onClick={() => onSave(next)} style={{ border: "none", cursor: "pointer", borderRadius: 10, padding: "9px 16px", background: tokens.primaryBtn, color: "#fff", fontFamily: font, fontSize: 13, fontWeight: 700 }}>
          {t("Save time", "احفظ الميعاد")}
        </button>
      ) : null}
      {!valid ? <span style={{ fontFamily: font, fontSize: 12, color: "#B42318" }}>{t("Hour 1-12, minutes 00-59.", "الساعة من 1 لـ 12، والدقايق من 00 لـ 59.")}</span> : null}
    </div>
  );
}
