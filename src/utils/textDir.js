// Reading direction per language. Of the AI languages (en, ar, fr, sw, ha, am,
// so, yo, ig, zu) only Arabic is written right-to-left; the list also covers
// other RTL scripts in case more languages are added later.
const RTL_LANGS = ["ar", "fa", "ur", "he", "ps", "ckb", "yi", "dv"];

export function langDir(code) {
  return RTL_LANGS.includes(String(code ?? "").toLowerCase().split("-")[0]) ? "rtl" : "ltr";
}

// For free text whose language is not tagged (tutor answers): right-to-left
// when most letters are Arabic/Hebrew script, even if technical terms are English.
export function textDir(text) {
  const s = String(text ?? "");
  const rtl = (s.match(/[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/g) ?? []).length;
  const ltr = (s.match(/[A-Za-z\u00C0-\u024F\u1200-\u139F]/g) ?? []).length;
  return rtl > 0 && rtl >= ltr * 0.6 ? "rtl" : "ltr";
}
