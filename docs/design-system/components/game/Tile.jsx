import React from "react";

const SIZES = {
  lg: { w: "var(--tile-w)", h: "var(--tile-h)", font: "var(--size-tile)", radius: "var(--radius-md)", edge: "var(--shadow-tile)" },
  sm: { w: "var(--tile-w-sm)", h: "var(--tile-h-sm)", font: "var(--size-tile-sm)", radius: "var(--radius-sm)", edge: "var(--shadow-tile-sm)" },
};

/**
 * A single fired-ceramic digit tile. Every digit in ozterisk is one of these.
 */
export function Tile({ digit, size = "lg", state = "resting", onClick, label, style }) {
  const s = SIZES[size] || SIZES.lg;
  const interactive = typeof onClick === "function" && state !== "disabled";

  const base = {
    width: s.w,
    height: s.h,
    padding: 0,
    border: "none",
    borderRadius: s.radius,
    background: "var(--surface-tile)",
    color: "var(--text-on-tile)",
    font: `var(--weight-semibold) ${s.font}/var(--leading-tight) var(--font-numeral)`,
    textShadow: "0 1px 0 rgba(255,255,255,.85)",
    boxShadow: s.edge,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: interactive ? "pointer" : "default",
    transition: `transform var(--dur-select) var(--ease-settle), box-shadow var(--dur-select) var(--ease-settle)`,
  };

  const byState = {
    resting: {},
    lifted: { transform: "translateY(calc(-1 * var(--lift-offset)))", boxShadow: "var(--shadow-tile-lifted)" },
    reward: {
      boxShadow: `${s.edge}, var(--glow-reward)`,
      outline: "1px solid var(--accent)",
      outlineOffset: "-1px",
      animation: "oz-fire var(--dur-reward) var(--ease-snap) both",
    },
    marked: {
      transform: "translateY(calc(-1 * var(--lift-offset))) rotate(6deg)",
      boxShadow: `var(--shadow-tile-lifted), 0 0 0 2px var(--state-discard)`,
    },
    disabled: { boxShadow: "none", opacity: 0.45, cursor: "default" },
  };

  return (
    <button
      type="button"
      aria-label={label != null ? label : `Digit ${digit}`}
      aria-pressed={state === "marked" ? true : undefined}
      disabled={!interactive}
      onClick={interactive ? onClick : undefined}
      style={{ ...base, ...byState[state], ...style }}
    >
      {digit}
    </button>
  );
}
