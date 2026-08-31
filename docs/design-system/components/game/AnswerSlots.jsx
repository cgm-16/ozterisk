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
// 2d — the locked six. Ceramic shards off the tile's own bottom edge: each
// carries its own trajectory and oz-fan interpolates it.
const CHIPS = [
  { dx: "-46px", peak: "-36px", land: "34px", rot: "-140deg" },
  { dx: "-26px", peak: "-54px", land: "28px", rot: "96deg" },
  { dx: "-8px", peak: "-62px", land: "36px", rot: "-62deg" },
  { dx: "13px", peak: "-58px", land: "30px", rot: "124deg" },
  { dx: "31px", peak: "-47px", land: "33px", rot: "-104deg" },
  { dx: "51px", peak: "-31px", land: "26px", rot: "162deg" },
];

const chipStyle = {
  position: "absolute",
  left: "50%",
  top: "50%",
  width: "9px",
  height: "6px",
  borderRadius: "1.5px",
  background: "linear-gradient(160deg, var(--clay-050), var(--clay-400))",
  pointerEvents: "none",
};

const ringStyle = {
  position: "absolute",
  left: "50%",
  top: "50%",
  width: "calc(var(--tile-w) * 1.9)",
  height: "calc(var(--tile-w) * 1.9)",
  marginLeft: "calc(var(--tile-w) * -0.95)",
  marginTop: "calc(var(--tile-w) * -0.95)",
  borderRadius: "50%",
  pointerEvents: "none",
};

// The ladder accumulates, never swaps: tier 1 adds the jade ring at streak 3,
// tier 2 a gold ring and a gold rim on the answer tiles at 5, tier 3 a third
// ring and the six-chip fan at 8. Nothing above 8 escalates.
const RINGS = [
  { at: 3, color: "var(--state-correct)", delay: "0ms" },
  { at: 5, color: "var(--gold-500)", delay: "70ms" },
  { at: 8, color: "var(--gold-300)", delay: "140ms" },
];

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
  // The bloom is the floor effect, not the ring: the first two correct answers
  // rise and settle with nothing added, so tier 1 has something to give.
  const correctNow = state === "correct";
  const rings = correctNow ? RINGS.filter((r) => streak >= r.at) : [];
  const goldRim = correctNow && streak >= 5;
  const burst = correctNow && streak >= 8;

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
            {rings.map((r) => (
              <span
                key={r.at}
                aria-hidden="true"
                style={{
                  ...ringStyle,
                  border: `2px solid ${r.color}`,
                  animation: `oz-ring var(--dur-bloom) var(--ease-settle) ${r.delay} both`,
                }}
              ></span>
            ))}
            <Tile
              digit={tile.digit}
              state={correct ? "reward" : "resting"}
              label={`Answer slot ${i + 1}: ${tile.digit}`}
              onClick={disabled ? undefined : () => onReturn && onReturn(tile.id)}
              style={
                correct
                  ? {
                      animation: "oz-bloom var(--dur-bloom) var(--ease-settle) both",
                      ...(goldRim ? { outline: "1px solid var(--accent)", outlineOffset: "-1px" } : null),
                    }
                  : incorrect
                  ? { animation: "oz-crack var(--dur-crack) var(--ease-fall) both", boxShadow: "var(--shadow-tile-pressed)" }
                  : undefined
              }
            />
            {burst
              ? CHIPS.map((c, ci) => (
                  <span
                    key={`chip-${ci}`}
                    aria-hidden="true"
                    style={{
                      ...chipStyle,
                      "--dx": c.dx,
                      "--peak": c.peak,
                      "--land": c.land,
                      "--rot": c.rot,
                      animation: `oz-fan var(--dur-burst) var(--ease-fall) ${40 + ci * 12}ms both`,
                    }}
                  ></span>
                ))
              : null}
            {incorrect ? <span style={dustStyle} aria-hidden="true"></span> : null}
          </span>
        );
      })}
    </div>
  );
}
