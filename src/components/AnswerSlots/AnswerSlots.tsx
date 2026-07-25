import type { Tile } from "../../game/types";
import { useI18n } from "../../i18n/I18nContext";
import styles from "./AnswerSlots.module.css";

export interface AnswerSlotsProps {
  slotCount: 1 | 2;
  selectedTiles: readonly Tile[];
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
        const label = tile
          ? t("answerSlot.filled", { position, digit: tile.digit })
          : t("answerSlot.empty", { position });

        return (
          <button
            key={index}
            type="button"
            className={styles.slot}
            aria-label={label}
            onClick={tile ? () => onReturn(tile.id) : undefined}
            disabled={!tile || disabled}
          >
            {tile ? tile.digit : null}
          </button>
        );
      })}
    </div>
  );
}
