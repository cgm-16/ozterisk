import type { Tile } from "../../game/types";
import { useI18n } from "../../i18n/I18nContext";
import styles from "./TileInventory.module.css";

export interface TileInventoryProps {
  tiles: readonly Tile[];
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
          <button
            key={tile.id}
            type="button"
            className={styles.tile}
            aria-label={labelParts.join(", ")}
            aria-pressed={mode === "discard" ? isMarkedForDiscard : undefined}
            disabled={mode === "readOnly"}
            onClick={() => onTile(tile.id)}
          >
            <span aria-hidden="true">{tile.digit}</span>
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
          </button>
        );
      })}
    </div>
  );
}
