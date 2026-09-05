import type { Tile as TileModel } from "../../game/types";
import { useI18n } from "../../i18n/I18nContext";
import { Tile } from "../Tile/Tile";
import styles from "./TileInventory.module.css";

export interface TileInventoryProps {
  tiles: readonly TileModel[];
  mode: "select" | "discard" | "readOnly";
  pendingDiscards: readonly string[];
  onTile(tileId: string): void;
}

export function TileInventory({ tiles, mode, pendingDiscards, onTile }: TileInventoryProps) {
  const { t } = useI18n();

  return (
    <div className={styles.inventory}>
      {tiles.map((tile) => {
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
