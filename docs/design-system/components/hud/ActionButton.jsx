import React from "react";

const VARIANTS = {
  primary: {
    background: "var(--state-incorrect)",
    color: "var(--ink-000)",
    edge: "0 4px 0 #7d2d1f",
  },
  secondary: {
    background: "var(--surface-raised)",
    color: "var(--text-primary)",
    edge: "0 4px 0 #0e2a21",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-body)",
    edge: "none",
  },
};

/**
 * Every action in ozterisk. Rises when it becomes available, depresses on press,
 * and lies flat against the felt when disabled.
 */
export function ActionButton({ children, variant = "primary", disabled = false, onClick, style }) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  // 11d: the moment an action becomes available it rises to meet the hand.
  const wasDisabled = React.useRef(disabled);
  const [rising, setRising] = React.useState(false);
  React.useEffect(() => {
    if (wasDisabled.current && !disabled) {
      setRising(true);
      const id = setTimeout(() => setRising(false), 260);
      wasDisabled.current = disabled;
      return () => clearTimeout(id);
    }
    wasDisabled.current = disabled;
  }, [disabled]);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        minHeight: "var(--target-min)",
        padding: "0 var(--space-8)",
        border: variant === "ghost" ? "1px solid var(--border-hairline)" : "none",
        borderRadius: "var(--radius-md)",
        font: `var(--weight-bold) var(--size-label)/var(--leading-tight) var(--font-ui)`,
        letterSpacing: "var(--track-label)",
        textTransform: "uppercase",
        cursor: disabled ? "default" : "pointer",
        background: disabled ? "transparent" : v.background,
        color: disabled ? "var(--text-disabled)" : v.color,
        boxShadow: disabled ? "none" : v.edge,
        outline: disabled ? "1px solid var(--border-hairline)" : "none",
        transform: "translateY(0)",
        animation: rising ? "oz-rise-ready var(--dur-round) var(--ease-snap) both" : undefined,
        transition: `transform var(--dur-press) var(--ease-settle), box-shadow var(--dur-press) var(--ease-settle), background var(--dur-state) var(--ease-standard)`,
        ...style,
      }}
      onPointerDown={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "translateY(var(--press-offset))";
        e.currentTarget.style.boxShadow = variant === "ghost" ? "none" : "0 2px 0 #7d2d1f";
      }}
      onFocus={(e) => {
        if (disabled) return;
        // The bezel sits inside the object and carries its own dark inner line,
        // so vermilion needs no variant: gold never touches red directly.
        const ring = "var(--ring-focus)";
        e.currentTarget.style.boxShadow = v.edge === "none" ? ring : `${v.edge}, ${ring}`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = disabled ? "none" : v.edge;
      }}
      onPointerUp={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = v.edge;
      }}
    >
      {children}
    </button>
  );
}
