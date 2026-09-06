import { INVENTORY_CAPACITY } from "../../game/balance";
import type { Tile as TileModel } from "../../game/types";
import { useI18n } from "../../i18n/I18nContext";
import { Tile } from "../Tile/Tile";
import styles from "./TileInventory.module.css";

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
  // §1.12: ten fixed sockets always render — the empty sockets are the
  // score. Mid-overflow the union of inventory and selectedTiles can reach
  // eleven (INVENTORY_CAPACITY + REWARD_BONUS), so the count only grows past
  // ten to fit an actual eleventh tile, never shrinks below ten.
  const cellCount = Math.max(INVENTORY_CAPACITY, tiles.length);

  return (
    <div className={styles.inventory}>
      {Array.from({ length: cellCount }, (_, index) => {
        const tile = tiles[index];
        if (tile === undefined) {
          return <div key={`empty-${index}`} className={styles.socket} />;
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

        return (
          <div key={tile.id} className={styles.cell}>
            <Tile
              digit={tile.digit}
              state={isMarkedForDiscard ? "marked" : mode === "readOnly" ? "disabled" : "resting"}
              label={labelParts.join(", ")}
              pressed={mode === "discard" ? isMarkedForDiscard : undefined}
              onClick={() => onTile(tile.id)}
            />
            {tile.isNew && (
              <span className={styles.newBadge} aria-hidden="true">
                {t("tile.newLabel")}
              </span>
            )}
            {isMarkedForDiscard && (
              <span className={styles.discardBadge} aria-hidden="true">
                {t("tile.discardLabel")}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
