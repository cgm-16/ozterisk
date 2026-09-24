import React from "react";
import { Tile } from "./Tile.jsx";

const socketStyle = {
  width: "var(--tile-w)",
  height: "var(--tile-h)",
  borderRadius: "var(--radius-md)",
  background: "var(--surface-socket)",
  boxShadow: "var(--shadow-socket), var(--rim-socket)",
};

// A sealed plug: the rest state of oz-seal. Flush with the felt, rim, no well.
const plugStyle = {
  ...socketStyle,
  background: "var(--surface-table)",
  boxShadow: "var(--rim-socket), inset 0 -1px 0 var(--hair-100)",
};

const TIERS = {
  small: { cols: 7, w: 44, h: 55, font: 25, gap: 4, pad: 8, radius: "var(--radius-sm)" },
  mid:   { cols: 6, w: 48, h: 60, font: 28, gap: 6, pad: 8, radius: "var(--radius-md)" },
  full:  { cols: 5, w: 64, h: 80, font: 34, gap: 8, pad: 8, radius: "var(--radius-md)" },
};

/**
 * Classic's stepped rack. Returns the tier for a capacity and the whole-row
 * footprint that tier always draws (spare cells are sealed plugs).
 */
export function rackTier(capacity, thresholds = [15, 10], start = 20) {
  const [mid, full] = thresholds;
  if (capacity > mid) return { ...TIERS.small, top: start };
  if (capacity > full) return { ...TIERS.mid, top: mid };
  return { ...TIERS.full, top: full };
}

/**
 * The rack. Endless: ten fixed sockets in 5x2 — the grid never resizes, empty
 * sockets are the score. Classic (stepped): the tile size steps with capacity
 * (7 x 44 at 16-20, 6 x 48 at 11-15, 5 x 64 at 10 and below) so every tier
 * holds ~180px, and each tier keeps a whole-row footprint where closed sockets
 * stay as sealed plugs.
 */
export function TileInventory({
  tiles = [], mode = "select", pendingDiscards = [], liftedIds = [], onTile, rewardHalo = false,
  capacity = 10, stepped = false, thresholds = [15, 10], startCapacity = 20, reseatFrom,
}) {
  const tier = stepped ? rackTier(capacity, thresholds, startCapacity) : null;
  const footprint = tier ? Math.ceil(tier.top / tier.cols) * tier.cols : capacity;
  const cells = Array.from({ length: footprint }, (_, i) => (i < capacity ? tiles[i] || null : "plug"));

  // M6·1 re-seat: FLIP each tile from its seat in the previous tier. Caller
  // passes reseatFrom = { capacity, order: [tileId, ...] } for the one render
  // after a tier change; the new plugs seal after the tiles land (M6·2).
  const from = tier && reseatFrom ? rackTier(reseatFrom.capacity, thresholds, startCapacity) : null;
  const flip = (id, i) => {
    if (!from || from.cols === tier.cols) return undefined;
    const oi = reseatFrom.order.indexOf(id);
    if (oi < 0) return undefined;
    const ogW = from.cols * from.w + (from.cols - 1) * from.gap;
    const ngW = tier.cols * tier.w + (tier.cols - 1) * tier.gap;
    const fx = (ngW - ogW) / 2 + (oi % from.cols) * (from.w + from.gap) - (i % tier.cols) * (tier.w + tier.gap);
    const fy = Math.floor(oi / from.cols) * (from.h + from.gap) - Math.floor(i / tier.cols) * (tier.h + tier.gap);
    return {
      "--fx": fx + "px", "--fy": fy + "px", "--fs": String(from.w / tier.w),
      transformOrigin: "0 0", position: "relative", zIndex: 2,
      animation: "oz-reseat 300ms var(--ease-settle) both",
    };
  };
  let plugN = 0;

  return (
    <div
      role="group"
      aria-label="Tile inventory"
      style={{
        display: "grid",
        gridTemplateColumns: tier ? `repeat(${tier.cols}, var(--tile-w))` : `repeat(var(--rack-columns), var(--tile-w))`,
        gap: tier ? tier.gap + "px" : "var(--rack-gap)",
        padding: tier ? tier.pad + "px" : "var(--space-4)",
        borderRadius: "var(--radius-lg)",
        background: "var(--surface-panel)",
        border: "1px solid var(--border-hairline)",
        ...(tier ? { "--tile-w": tier.w + "px", "--tile-h": tier.h + "px", "--size-tile": tier.font + "px", "--radius-md": tier.radius } : {}),
      }}
    >
      {cells.map((tile, i) => {
        if (tile === "plug") {
          const k = plugN++;
          const sealing = from && from.cols !== tier.cols;
          return (
            <div key={`plug-${i}`} style={sealing ? { ...plugStyle, position: "relative", overflow: "hidden", boxShadow: "var(--rim-socket)" } : plugStyle} aria-hidden="true">
              {sealing && (
                <span style={{
                  position: "absolute", inset: 0, borderRadius: "var(--radius-md)", background: "var(--surface-socket)",
                  boxShadow: "var(--shadow-socket)", transformOrigin: "50% 100%",
                  animation: `oz-seal var(--dur-seal) var(--ease-settle) ${300 + k * 40}ms both`,
                }} />
              )}
            </div>
          );
        }
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
        const reseat = flip(tile.id, i);
        return (
          <Tile
            key={tile.id}
            digit={tile.digit}
            state={state}
            label={marked ? "Marked for discard" : tile.isNew ? "New tile" : `Digit ${tile.digit}`}
            onClick={mode === "readOnly" ? undefined : () => onTile && onTile(tile.id)}
            style={
              reseat ||
              // 9i fires for every arrival; the halo is the part that stops after round 2.
              (tile.isNew && state !== "reward"
                ? { animation: "oz-fire var(--dur-reward) var(--ease-snap) both" }
                : undefined)
            }
          />
        );
      })}
    </div>
  );
}
