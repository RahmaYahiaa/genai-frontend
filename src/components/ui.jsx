export function Card({ tokens, children, style, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: tokens.card,
        border: `1px solid ${tokens.cardBorder}`,
        borderRadius: 14,
        padding: 18,
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Btn({ tokens, children, onClick, variant = "solid", disabled, style, full }) {
  const variants = {
    solid: { background: tokens.primaryBtn, color: "#fff" },
    ghost: { background: tokens.card, color: tokens.textSecondary, border: `1.5px solid ${tokens.cardBorder}` },
    soft: { background: tokens.primaryLight, color: tokens.primary, border: `1px solid ${tokens.primary}33` },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 16px",
        borderRadius: 10,
        border: "none",
        fontWeight: 600,
        fontSize: 13,
        fontFamily: "inherit",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        ...(full ? { width: "100%" } : {}),
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Chip({ tokens, children, tone = "default", style }) {
  const tones = {
    default: { background: tokens.inset, color: tokens.textSecondary, border: `1px solid ${tokens.cardBorder}` },
    primary: { background: tokens.primaryLight, color: tokens.primary, border: `1px solid ${tokens.primary}44` },
    mastered: { background: tokens.masteredBg, color: tokens.mastered, border: `1px solid ${tokens.masteredBorder}` },
    gap: { background: tokens.gapBg, color: tokens.gap, border: `1px solid ${tokens.gapBorder}` },
    developing: { background: tokens.developingBg, color: tokens.developing, border: `1px solid ${tokens.developingBorder}` },
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        borderRadius: 7,
        fontSize: 11.5,
        fontWeight: 600,
        whiteSpace: "nowrap",
        ...tones[tone],
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function Bar({ tokens, value, height = 6, color }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div style={{ height, borderRadius: 3, background: tokens.inset, overflow: "hidden" }}>
      <div style={{ width: `${clamped}%`, height: "100%", borderRadius: 3, background: color ?? tokens.primary, transition: "width 450ms ease" }} />
    </div>
  );
}

export function Stat({ tokens, label, value, hint, accent }) {
  return (
    <Card tokens={tokens}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: tokens.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", color: accent ?? tokens.textPrimary }}>{value}</div>
      {hint && <div style={{ fontSize: 11, color: tokens.textFaint, marginTop: 4 }}>{hint}</div>}
    </Card>
  );
}

export function Loading({ tokens, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 56 }}>
      <Spinner tokens={tokens} />
      <div style={{ fontSize: 12, color: tokens.textMuted }}>{label}</div>
    </div>
  );
}

export function Spinner({ tokens, size = 22 }) {
  return (
    <div
      className="spin"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2.5px solid ${tokens.cardBorder}`,
        borderTopColor: tokens.primary,
      }}
    />
  );
}

export function Skeleton({ tokens, width = "100%", height = 14, style }) {
  return (
    <div
      className="shimmer"
      style={{
        width,
        height,
        borderRadius: 6,
        background: `linear-gradient(90deg, ${tokens.inset} 25%, ${tokens.insetBorder} 50%, ${tokens.inset} 75%)`,
        backgroundSize: "200% 100%",
        ...style,
      }}
    />
  );
}

export function ErrorBox({ tokens, error, reload, lang }) {
  return (
    <div style={{ padding: 28 }}>
      <Card tokens={tokens} style={{ maxWidth: 480 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: tokens.textPrimary, marginBottom: 4 }}>
          {lang === "ar" ? "حصل خطأ أثناء التحميل" : "Something went wrong"}
        </div>
        <div style={{ fontSize: 12, color: tokens.textMuted, marginBottom: 14, wordBreak: "break-word" }}>
          {String(error?.message ?? error)}
        </div>
        <Btn tokens={tokens} variant="soft" onClick={reload}>
          {lang === "ar" ? "إعادة المحاولة" : "Retry"}
        </Btn>
      </Card>
    </div>
  );
}

export function AsyncGate({ tokens, lang, loading, error, reload, children, label }) {
  if (loading) {
    return (
      <div style={{ padding: 28 }}>
        <Loading tokens={tokens} label={label} />
      </div>
    );
  }
  if (error) {
    return <ErrorBox tokens={tokens} error={error} reload={reload} lang={lang} />;
  }
  return children;
}