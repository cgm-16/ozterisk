import React from "react";
import { Tile } from "./Tile.jsx";

const emptySlot = {
  width: "var(--tile-w)",
  height: "var(--tile-h)",
  borderRadius: "var(--radius-md)",
  background: "var(--surface-socket)",
  boxShadow: "var(--shadow-socket)",
  border: "1px dashed var(--border-slot-empty)",
};

/**
 * One or two ordered answer slots. Slot order is answer order.
 */
const ringStyle = {
  position: "absolute",
  left: "50%",
  top: "50%",
  width: "calc(var(--tile-w) * 1.9)",
  height: "calc(var(--tile-w) * 1.9)",
  marginLeft: "calc(var(--tile-w) * -0.95)",
  marginTop: "calc(var(--tile-w) * -0.95)",
  borderRadius: "50%",
  border: "2px solid var(--state-correct)",
  animation: "oz-ring var(--dur-bloom) var(--ease-settle) both",
  pointerEvents: "none",
};

const dustStyle = {
  position: "absolute",
  inset: "-14%",
  borderRadius: "var(--radius-md)",
  background: "radial-gradient(circle at 50% 55%, rgba(240,231,214,.5), transparent 68%)",
  animation: "oz-dust var(--dur-crack) var(--ease-fall) both",
  pointerEvents: "none",
};

export function AnswerSlots({ slotCount, selectedTiles = [], onReturn, disabled = false, state = "answering", streak = 0 }) {
  const slots = Array.from({ length: slotCount }, (_, i) => selectedTiles[i] || null);
  // 7a is the ladder's first rung, at streak 3. The first two correct answers
  // bloom without a ring, so the rung is worth something when it arrives.
  const showRing = state === "correct" && streak >= 3;

  return (
    <div role="group" aria-label="Answer" style={{ display: "flex", gap: "var(--rack-gap)" }}>
      {slots.map((tile, i) => {
        if (!tile) {
          return <div key={`empty-${i}`} style={emptySlot} aria-label={`Answer slot ${i + 1}: empty`} role="img" />;
        }
        const correct = state === "correct";
        const incorrect = state === "incorrect";
        return (
          <span key={tile.id} style={{ position: "relative", display: "inline-flex" }}>
            {showRing ? <span style={ringStyle} aria-hidden="true"></span> : null}
            <Tile
              digit={tile.digit}
              state={correct ? "reward" : "resting"}
              label={`Answer slot ${i + 1}: ${tile.digit}`}
              onClick={disabled ? undefined : () => onReturn && onReturn(tile.id)}
              style={
                correct
                  ? { animation: "oz-bloom var(--dur-bloom) var(--ease-settle) both" }
                  : incorrect
                  ? { animation: "oz-crack var(--dur-crack) var(--ease-fall) both", boxShadow: "var(--shadow-tile-pressed)" }
                  : undefined
              }
            />
            {incorrect ? <span style={dustStyle} aria-hidden="true"></span> : null}
          </span>
        );
      })}
    </div>
  );
}
