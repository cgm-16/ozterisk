import type { Tile as TileModel } from "../../game/types";
import { useI18n } from "../../i18n/I18nContext";
import { Tile } from "../Tile/Tile";
import styles from "./AnswerSlots.module.css";

export interface AnswerSlotsProps {
  slotCount: 1 | 2;
  selectedTiles: readonly TileModel[];
  /**
   * Omit to render the whole group read-only: no slot carries a button role,
   * so a phase can keep the tiles on screen without offering a screen reader
   * a control it cannot use. Distinct from `disabled`, which keeps the
   * buttons and disables them.
   */
  onReturn?(tileId: string): void;
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
          // Read-only, the socket is not a control, and a roleless element has
          // no role that can carry an accessible name. role="img" is one that
          // can, the way CapacityMeter names its pip rail.
          if (onReturn === undefined) {
            return (
              <span
                key={index}
                className={styles.slot}
                role="img"
                aria-label={t("answerSlot.empty", { position })}
              />
            );
          }

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
            onClick={onReturn && (() => onReturn(tile.id))}
          />
        );
      })}
    </div>
  );
}
