import React from "react";
import { Tile } from "./Tile.jsx";

const CAPACITY = 10;

const socketStyle = {
  width: "var(--tile-w)",
  height: "var(--tile-h)",
  borderRadius: "var(--radius-md)",
  background: "var(--surface-socket)",
  boxShadow: "var(--shadow-socket), var(--rim-socket)",
};

/**
 * The rack: ten fixed sockets in 5x2. The grid never resizes — empty sockets
 * are the score.
 */
export function TileInventory({ tiles = [], mode = "select", pendingDiscards = [], liftedIds = [], onTile, rewardHalo = false }) {
  const cells = Array.from({ length: CAPACITY }, (_, i) => tiles[i] || null);

  return (
    <div
      role="group"
      aria-label="Tile inventory"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(var(--rack-columns), var(--tile-w))`,
        gap: "var(--rack-gap)",
        padding: "var(--space-4)",
        borderRadius: "var(--radius-lg)",
        background: "var(--surface-panel)",
        border: "1px solid var(--border-hairline)",
      }}
    >
      {cells.map((tile, i) => {
        if (!tile) return <div key={`socket-${i}`} style={socketStyle} aria-hidden="true" />;
        // A lifted tile is in the answer slots but keeps its socket, so no
        // neighbour ever moves mid-selection. The dashed gold rule — the same
        // vocabulary as an empty answer slot — distinguishes it from a socket
        // whose tile is gone.
        if (liftedIds.includes(tile.id)) {
          return (
            <div
              key={tile.id}
              style={{
                ...socketStyle,
                outline: "var(--outline-socket-lifted)",
                outlineOffset: "var(--outline-socket-lifted-offset)",
              }}
              aria-hidden="true"
            />
          );
        }
        const marked = pendingDiscards.includes(tile.id);
        const state = marked ? "marked" : mode === "readOnly" ? "disabled" : tile.isNew && rewardHalo ? "reward" : "resting";
        return (
          <Tile
            key={tile.id}
            digit={tile.digit}
            state={state}
            label={marked ? "Marked for discard" : tile.isNew ? "New tile" : `Digit ${tile.digit}`}
            onClick={mode === "readOnly" ? undefined : () => onTile && onTile(tile.id)}
            style={
              // 9i fires for every arrival; the halo is the part that stops after round 2.
              tile.isNew && state !== "reward"
                ? { animation: "oz-fire var(--dur-reward) var(--ease-snap) both" }
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
