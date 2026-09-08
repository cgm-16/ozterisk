import { useState } from "react";
import { INVENTORY_CAPACITY } from "../../game/balance";
import type { Tile as TileModel } from "../../game/types";
import { useI18n } from "../../i18n/I18nContext";
import { Tile } from "../Tile/Tile";
import styles from "./TileInventory.module.css";

/** A discarded tile the rack is still drawing (8c), held at the index it left
 * from so the tiles that stay do not slide over until its exit has played. */
interface DepartingTile {
  tile: TileModel;
  index: number;
}

export interface TileInventoryProps {
  tiles: readonly TileModel[];
  mode: "select" | "discard" | "readOnly";
  pendingDiscards: readonly string[];
  /** Ids of tiles sitting in the answer slots. Each renders as an empty
   * socket in its own cell instead of a tile, so the rack never reflows. */
  liftedIds: readonly string[];
  onTile(tileId: string): void;
}

export function TileInventory({ tiles, mode, pendingDiscards, liftedIds, onTile }: TileInventoryProps) {
  const { t } = useI18n();
  const [departing, setDeparting] = useState<readonly DepartingTile[]>([]);
  // A tile that leaves state unmounts, and CSS cannot animate an unmounted
  // node, so 8c has to be drawn from a copy the rack keeps. Both halves of
  // "which tile just left, and did it leave by discard" are only legible
  // against the previous render, because CONFIRM_DISCARD drops the tile in the
  // same action that leaves the discard phase. Adjusting state during render
  // rather than in an effect keeps the held tile on screen from the first
  // frame after the drop, with no gap for it to disappear in.
  //
  // The discard test is the phase the rack was in, not pendingDiscards. A
  // forced single-tile discard dispatches TOGGLE_DISCARD and CONFIRM_DISCARD
  // from one click handler (GameScreen), React batches them into one update,
  // and the rack goes straight from "not marked" to "gone" — so a tile that
  // left by discard was never once rendered with its id in pendingDiscards.
  // Since INVENTORY_CAPACITY + REWARD_BONUS caps overflow at one tile, that
  // batched path is the only discard the product can reach. `mode` is
  // "discard" for exactly the overflow phase, which is the one phase a tile
  // can leave the rack this way, and a submitted tile leaves from "select".
  const [previous, setPrevious] = useState({ tiles, mode });
  if (previous.tiles !== tiles) {
    const present = new Set(tiles.map((tile) => tile.id));
    const discarded =
      previous.mode === "discard"
        ? previous.tiles
            .map((tile, index) => ({ tile, index }))
            .filter(({ tile }) => !present.has(tile.id))
        : [];
    setPrevious({ tiles, mode });
    if (discarded.length > 0) setDeparting((held) => [...held, ...discarded]);
  }

  // Ascending indices into the array each tile left, so inserting them in
  // order reconstructs the rack as it stood before the discard.
  const rackTiles = departing.reduce<readonly TileModel[]>(
    (rack, { tile, index }) => rack.toSpliced(index, 0, tile),
    tiles,
  );
  const departingIds = new Set(departing.map(({ tile }) => tile.id));

  // §1.12: ten fixed sockets always render — the empty sockets are the
  // score. Mid-overflow the union of inventory and selectedTiles can reach
  // eleven (INVENTORY_CAPACITY + REWARD_BONUS), so the count only grows past
  // ten to fit an actual eleventh tile, never shrinks below ten.
  const cellCount = Math.max(INVENTORY_CAPACITY, rackTiles.length);

  return (
    <div className={styles.inventory}>
      {Array.from({ length: cellCount }, (_, index) => {
        const tile = rackTiles[index];
        if (tile === undefined) {
          return <div key={`empty-${index}`} className={styles.socket} />;
        }

        if (departingIds.has(tile.id)) {
          // The reducer has already dropped this tile and nothing outside the
          // rack needs to know it is still drawn, so it carries no role and is
          // hidden: it has left the game. Retired on animationend rather than
          // on a timer, which would be a second source of truth for a duration
          // the stylesheet owns — and under prefers-reduced-motion the global
          // 0.01ms rule still fires the event, so the same path retires the
          // tile instantly with no branch for it.
          return (
            <div
              key={tile.id}
              className={`${styles.cell} ${styles.cellDeparting}`}
              aria-hidden="true"
              onAnimationEnd={() =>
                setDeparting((held) => held.filter((entry) => entry.tile.id !== tile.id))
              }
            >
              <Tile digit={tile.digit} state="marked" />
            </div>
          );
        }

        if (liftedIds.includes(tile.id)) {
          // A lifted cell is a socket, not a styled Tile: the tile it holds
          // is already named in the answer slots, so this cell must carry
          // no button role and no accessible name of its own.
          return <div key={tile.id} className={`${styles.socket} ${styles.socketLifted}`} />;
        }

        const isMarkedForDiscard = mode === "discard" && pendingDiscards.includes(tile.id);
        const labelParts = [t("tile.digitLabel", { digit: tile.digit })];
        if (tile.isNew) labelParts.push(t("tile.newLabel"));
        if (isMarkedForDiscard) labelParts.push(t("tile.discardLabel"));

        // 8a is positional — M5.5e ruled that no per-tile identity for the
        // refused tile exists — and 9i is per-tile, so the two collide on the
        // eleventh cell, which holds a reward tile almost every time the rack
        // overflows. The eleventh is the arrival that did not land, so it
        // rim-rejects instead of firing.
        const moment =
          index === INVENTORY_CAPACITY
            ? ` ${styles.cellRimReject}`
            : tile.isNew
              ? ` ${styles.cellNew}`
              : "";

        return (
          <div key={tile.id} className={`${styles.cell}${moment}`}>
            <Tile
              digit={tile.digit}
              state={
                isMarkedForDiscard
                  ? "marked"
                  : mode === "readOnly"
                    ? "disabled"
                    : tile.isNew
                      ? "reward"
                      : "resting"
              }
              label={labelParts.join(", ")}
              pressed={mode === "discard" ? isMarkedForDiscard : undefined}
              onClick={() => onTile(tile.id)}
            />
          </div>
        );
      })}
    </div>
  );
}
