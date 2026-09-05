import type { Tile as TileModel } from "../../game/types";
import { useI18n } from "../../i18n/I18nContext";
import { Tile } from "../Tile/Tile";
import styles from "./AnswerSlots.module.css";

export interface AnswerSlotsProps {
  slotCount: 1 | 2;
  selectedTiles: readonly TileModel[];
  onReturn(tileId: string): void;
  disabled: boolean;
}

export function AnswerSlots({ slotCount, selectedTiles, onReturn, disabled }: AnswerSlotsProps) {
  const { t } = useI18n();
  const positions = Array.from({ length: slotCount }, (_, index) => index);

  return (
    <div className={styles.slots}>
      {positions.map((index) => {
        const tile = selectedTiles[index];
        const position = index + 1;

        // An empty slot is a socket, not a tile: no ceramic anywhere. It keeps
        // its own rule in this component's stylesheet.
        if (tile === undefined) {
          return (
            <button
              key={index}
              type="button"
              className={styles.slot}
              aria-label={t("answerSlot.empty", { position })}
              disabled
            />
          );
        }

        return (
          <Tile
            key={index}
            digit={tile.digit}
            state={disabled ? "disabled" : "resting"}
            label={t("answerSlot.filled", { position, digit: tile.digit })}
            onClick={() => onReturn(tile.id)}
          />
        );
      })}
    </div>
  );
}
