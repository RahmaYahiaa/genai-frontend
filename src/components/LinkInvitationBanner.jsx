import { useCallback, useState } from "react";
import useAsync from "@/hooks/useAsync";
import { tk } from "@/constants/tokens";
import { Btn, Card, toast, bFontFor } from "@/components/ModuleUI";
import { IconAnchor, IconCheck } from "@/components/Icons";
import { listMyLinkInvitations, respondToLinkInvitation } from "@/services/linking";
import { applyAuthData, demoMode } from "@/services/auth";

// Consent surface for account linking, shown on the individual student's Dashboard.
// Bare GET /link-invitations; renders only while a real invitation is pending.
// After acceptance the session reloads: accountType flips to "institutional" and
// the institution nav entries (browse catalog, assignments) appear on their own.
export default function LinkInvitationBanner({ state }) {
  const lang = state.lang;
  const isRtl = lang === "ar";
  const tokens = tk(state.dark);
  const bFont = bFontFor(lang);
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const individual = !demoMode() && state.user?.accountType === "individual";

  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () => (individual ? listMyLinkInvitations().catch(() => []) : Promise.resolve([])),
    [individual],
  );
  const { data } = useAsync(load);
  const invitation = (Array.isArray(data) ? data : [])[0] ?? null;

  const accept = async () => {
    if (!invitation || busy) return;
    setBusy(true);
    try {
      const result = await respondToLinkInvitation(invitation.id, "accept");
      if (result?.tokens) applyAuthData(result);
      toast(t("Linked — your account is now institutional with its history preserved. Reloading…", "رُبط الحساب — أصبح مؤسسيًا بمحفوظاته. جاري تحديث الجلسة…"));
      window.setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      toast(err?.message ?? t("Could not complete the linking.", "تعذّر إتمام الربط."));
      setBusy(false);
    }
  };

  if (!individual || dismissed || !invitation) return null;

  return (
    <Card tokens={tokens} style={{ padding: "14px 16px", marginBottom: 14, borderColor: tokens.citationBorder }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
        <span style={{ flexShrink: 0, marginTop: 2 }}><IconAnchor size={16} color={tokens.primary} /></span>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontFamily: bFont, fontWeight: 600, fontSize: 13.5, color: tokens.textPrimary }}>
            {t("Your university invites you to link your account", "جامعتك تدعوك لربط حسابك")}
          </div>
          <div style={{ fontFamily: bFont, fontSize: 12, color: tokens.textMuted, marginTop: 5, lineHeight: 1.7 }}>
            {t(
              `${invitation.institutionName} invites this personal account to become institutional — your courses and history come along whole, and you become visible to your faculty. Nothing changes until you say yes.`,
              `${invitation.institutionName} تدعو حسابك الفردي ليصبح مؤسسيًا — مقرراتك ومحفوظاتك تنتقل كاملة وتصبحين ظاهرة لكليتك. لا شيء يتغير حتى توافقي.`,
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexDirection: isRtl ? "row-reverse" : "row" }}>
          <Btn tokens={tokens} lang={lang} disabled={busy} style={{ padding: "9px 14px", fontSize: 12.5 }} onClick={accept}>
            <IconCheck size={13} color="#fff" />
            {t("Accept linking", "أوافق على الربط")}
          </Btn>
          <Btn tokens={tokens} lang={lang} variant="ghost" style={{ padding: "9px 14px", fontSize: 12.5 }} onClick={() => setDismissed(true)}>
            {t("Later", "لاحقًا")}
          </Btn>
        </div>
      </div>
    </Card>
  );
}