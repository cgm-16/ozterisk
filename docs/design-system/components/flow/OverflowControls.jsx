import React from "react";
import { ActionButton } from "../hud/ActionButton.jsx";
import { Tile } from "../game/Tile.jsx";

/**
 * Overflow resolution. The arriving tile perches on the rail and will not sit
 * flat until a resident is tipped out.
 */
export function OverflowControls({
  requiredCount,
  markedCount = 0,
  perchedTile,
  onConfirm,
  disabled = false,
  labels = { instruction: "Choose {count} tile(s) to discard.", confirm: "Confirm Discard" },
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        alignItems: "center",
        padding: "var(--space-6)",
        borderRadius: "var(--radius-lg)",
        background: "var(--surface-panel)",
        border: "1px solid var(--border-danger)",
      }}
    >
      {perchedTile ? (
        <Tile
          digit={perchedTile.digit}
          state="lifted"
          label="New tile"
          style={{ transform: "translateY(calc(-1 * var(--lift-offset))) rotate(6deg)" }}
        />
      ) : null}

      <span
        style={{
          font: `var(--weight-regular) var(--size-body-sm)/var(--leading-snug) var(--font-ui)`,
          color: "var(--text-primary)",
          textAlign: "center",
        }}
      >
        {labels.instruction.replace("{count}", requiredCount)}
      </span>

      <span
        style={{
          font: `var(--weight-medium) var(--size-micro)/var(--leading-tight) var(--font-mono)`,
          letterSpacing: "var(--track-label)",
          textTransform: "uppercase",
          color: markedCount === requiredCount ? "var(--accent)" : "var(--text-meta)",
        }}
      >
        {markedCount} / {requiredCount} marked
      </span>

      <ActionButton onClick={onConfirm} disabled={disabled || markedCount !== requiredCount}>
        {labels.confirm}
      </ActionButton>
    </div>
  );
}
