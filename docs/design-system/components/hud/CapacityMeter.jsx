import React from "react";

const CAPACITY = 10;

/**
 * Ten pips: gold = held, translucent = free, vermilion = over capacity.
 * There is no near-capacity tint: vermilion in this system means a tile is
 * leaving, and a warning fill made the margin read as a prediction about the
 * answer in progress. The "10 / 10" above the pips already says you are full.
 */
export function CapacityMeter({ held, label = "Capacity" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", alignItems: "flex-start" }}>
      <span
        style={{
          font: `var(--weight-medium) var(--size-micro)/var(--leading-tight) var(--font-mono)`,
          letterSpacing: "var(--track-label)",
          textTransform: "uppercase",
          color: "var(--text-meta)",
        }}
      >
        {label} {held} / {CAPACITY}
      </span>
      <div style={{ display: "flex", gap: "var(--space-1)" }} role="img" aria-label={`${label} ${held} of ${CAPACITY}`}>
        {/* Overflow draws the excess as extra pips past the rail — otherwise the
           one state the meter exists for is the one it cannot show. */}
        {Array.from({ length: Math.max(CAPACITY, held) }, (_, i) => (
          <span
            key={i}
            style={{
              width: 15,
              height: 7,
              borderRadius: 2,
              marginLeft: i === CAPACITY ? "var(--space-2)" : undefined,
              background:
                i >= CAPACITY
                  ? "var(--state-discard)"
                  : i >= held
                  ? "rgba(240,231,214,.16)"
                  : "var(--accent)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
