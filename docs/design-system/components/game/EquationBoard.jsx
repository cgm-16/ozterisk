import React from "react";

/**
 * The round's equation — the largest type in the app.
 */
export function EquationBoard({ equation, showProduct = false }) {
  if (!equation) return null;
  // Keying on the operands remounts the line on a round change, so 10b replays.
  return (
    <p
      key={`${equation.left}x${equation.right}`}
      style={{
        font: `var(--weight-semibold) var(--size-equation)/var(--leading-tight) var(--font-numeral)`,
        letterSpacing: "0.01em",
        color: "var(--text-primary)",
        display: "flex",
        alignItems: "baseline",
        gap: "0.28em",
        animation: "oz-round-rise var(--dur-round) var(--ease-fall) both",
      }}
    >
      <span>{equation.left}</span>
      <span style={{ color: "var(--accent)" }}>&#215;</span>
      <span>{equation.right}</span>
      <span style={{ color: "var(--ink-300)" }}>=</span>
      {showProduct ? <span>{equation.product}</span> : null}
    </p>
  );
}
