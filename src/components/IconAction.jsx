import { useState } from "react";

/** Square icon-only action button with a tooltip and accessible label. */
export default function IconAction({ tokens, label, onClick, disabled, danger, active, children }) {
  const [hover, setHover] = useState(false);
  const color = danger && hover ? "#dc2626" : active || hover ? tokens.primary : tokens.textSecondary;
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 34,
        height: 34,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 9,
        border: `1px solid ${hover || active ? (danger ? "#fecaca" : `${tokens.primary}44`) : tokens.cardBorder}`,
        background: hover || active ? (danger ? "rgba(220,38,38,0.06)" : tokens.primaryLight) : tokens.card,
        color,
        cursor: disabled ? "wait" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "background 0.15s, border-color 0.15s, color 0.15s",
      }}
    >
      {children}
    </button>
  );
}
