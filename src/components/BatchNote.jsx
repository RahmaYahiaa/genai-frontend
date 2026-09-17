import { Card, Btn, bFontFor, hFontFor } from "@/components/ModuleUI";
import { IconSparkle } from "@/components/Icons";

export default function BatchNote({ tokens, lang, mobile, title, body, onBack, backLabel }) {
  const isRtl = lang === "ar";
  return (
    <div style={{ padding: mobile ? "20px 16px" : "28px 32px", direction: isRtl ? "rtl" : "ltr", maxWidth: 760, margin: "0 auto" }}>
      <Card tokens={tokens} style={{ padding: "34px 24px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", width: 44, height: 44, borderRadius: "50%", background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <IconSparkle size={22} color={tokens.textFaint} />
        </div>
        <div style={{ fontFamily: hFontFor(lang), fontWeight: 600, fontSize: 15, color: tokens.textPrimary, marginBottom: 6 }}>{title}</div>
        <div style={{ fontFamily: bFontFor(lang), fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.7, maxWidth: 520, margin: "0 auto" }}>{body}</div>
        {onBack && (
          <Btn tokens={tokens} lang={lang} variant="soft" style={{ marginTop: 16 }} onClick={onBack}>
            {backLabel}
          </Btn>
        )}
      </Card>
    </div>
  );
}
