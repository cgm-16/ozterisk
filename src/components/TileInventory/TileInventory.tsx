import { useEffect, useRef, useState } from "react";
import type { Tile as TileModel } from "../../game/types";
import { useI18n } from "../../i18n/I18nContext";
import { Tile } from "../Tile/Tile";
import styles from "./TileInventory.module.css";

/** A discard the rack is still drawing (8c): the hand as it stood before the
 * discard, and the ids whose exit has not yet played. */
interface Departure {
  tiles: readonly TileModel[];
  leaving: readonly string[];
}

export interface TileInventoryProps {
  tiles: readonly TileModel[];
  mode: "select" | "discard" | "readOnly";
  pendingDiscards: readonly string[];
  /** Ids of tiles sitting in the answer slots. Each renders as an empty
   * socket in its own cell instead of a tile, so the rack never reflows. */
  liftedIds: readonly string[];
  /** Live capacity: the sockets drawn, and the index past which tiles perch. */
  capacity: number;
  onTile(tileId: string): void;
  /** Called once a discard's departing tiles have all finished leaving. */
  onSettled?(): void;
}

/** Renders the fixed-socket rack, including lifted and departing tile states. */
export function TileInventory({
  tiles,
  mode,
  pendingDiscards,
  liftedIds,
  capacity,
  onTile,
  onSettled,
}: TileInventoryProps) {
  const { t } = useI18n();
  const [departure, setDeparture] = useState<Departure | null>(null);
  // A tile that leaves state unmounts, and CSS cannot animate an unmounted
  // node, so 8c has to be drawn from a copy the rack keeps. Both halves of
  // "which tile just left, and did it leave by discard" are only legible
  // against the previous render, because the TOGGLE_DISCARD that completes a
  // discard drops the tile in the same action that leaves the discard phase.
  // Adjusting state during render rather than in an effect keeps the held tile
  // on screen from the first frame after the drop, with no gap for it to
  // disappear in.
  //
  // The discard test is the phase the rack was in, not pendingDiscards. The
  // mark that reaches the required count completes the discard in the reducer,
  // so that tile goes straight from "not marked" to "gone" — it was never once
  // rendered with its id in pendingDiscards. `mode` is
  // "discard" for exactly the overflow phase, which is the one phase a tile
  // can leave the rack this way, and a submitted tile leaves from "select".
  const [previous, setPrevious] = useState({ tiles, mode });
  if (previous.tiles !== tiles) {
    const present = new Set(tiles.map((tile) => tile.id));
    const leaving =
      previous.mode === "discard"
        ? previous.tiles.filter((tile) => !present.has(tile.id)).map((tile) => tile.id)
        : [];
    setPrevious({ tiles, mode });
    if (leaving.length > 0) setDeparture({ tiles: previous.tiles, leaving });
  }

  // While a discard plays, the rack draws the hand as it stood before it. The
  // reducer has already seated a surviving rail tile in the freed socket, so
  // splicing the departing tile back into the new hand would shove every later
  // tile a cell over; the snapshot keeps each tile where the player saw it.
  const rackTiles = departure?.tiles ?? tiles;
  const present = new Set(tiles.map((tile) => tile.id));

  // Retires one departing tile; the last one settles the discard. The next
  // round waits on this (§1.7), so a departure that never reported its end
  // would freeze the run — which is why a cancelled animation retires too.
  const retire = (tileId: string) => {
    if (departure === null || !departure.leaving.includes(tileId)) return;
    const leaving = departure.leaving.filter((id) => id !== tileId);
    if (leaving.length > 0) {
      setDeparture({ ...departure, leaving });
      return;
    }
    setDeparture(null);
    onSettled?.();
  };
  const retireRef = useRef(retire);
  useEffect(() => {
    retireRef.current = retire;
  });
  const rackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // React has no onAnimationCancel, so the rack listens for it natively.
    const rack = rackRef.current;
    if (rack === null) return;
    const onCancel = (event: Event) => {
      const cell = (event.target as Element).closest("[data-departing]");
      const tileId = cell?.getAttribute("data-departing");
      if (tileId) retireRef.current(tileId);
    };
    rack.addEventListener("animationcancel", onCancel);
    return () => rack.removeEventListener("animationcancel", onCancel);
  }, []);

  // §1.12: the live capacity's sockets always render — the empty sockets are
  // the score. Mid-overflow the hand runs past capacity, so the count only
  // grows to fit the tiles past it, never shrinks below capacity.
  const cellCount = Math.max(capacity, rackTiles.length);

  return (
    <div ref={rackRef} className={styles.inventory}>
      {Array.from({ length: cellCount }, (_, index) => {
        const tile = rackTiles[index];
        if (tile === undefined) {
          return <div key={`empty-${index}`} className={styles.socket} />;
        }

        if (!present.has(tile.id)) {
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
              data-departing={tile.id}
              onAnimationEnd={() => retire(tile.id)}
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

        // 8a and 9i collide on the cells past capacity, which hold the newest
        // arrivals — reward tiles, almost every time (§1.5 step 7). Those are
        // the arrivals that did not land, so they rim-reject instead of firing.
        const moment =
          index >= capacity
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
