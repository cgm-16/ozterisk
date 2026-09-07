import type { RoundResult, Tile as TileModel } from "../../game/types";
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
  /**
   * How the round judged the tiles in these slots, once it has judged them.
   * Omitted while the player is still answering: unjudged is a third state,
   * not a default of either verdict, and the tiles are neither yet.
   */
  verdict?: RoundResult["kind"];
}

export function AnswerSlots({
  slotCount,
  selectedTiles,
  onReturn,
  disabled,
  verdict,
}: AnswerSlotsProps) {
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
                key={`empty-${index}`}
                className={styles.slot}
                role="img"
                aria-label={t("answerSlot.empty", { position })}
              />
            );
          }

          return (
            <button
              key={`empty-${index}`}
              type="button"
              className={styles.slot}
              aria-label={t("answerSlot.empty", { position })}
              disabled
            />
          );
        }

        // A filled slot plays exactly one moment: a tile is either arriving or
        // being judged, and two animations on one element would leave only the
        // last of them anyway.
        const moment =
          verdict === "correct"
            ? styles.bloom
            : verdict === "incorrect"
              ? styles.crack
              : styles.arriving;

        return (
          // Keyed by the tile rather than the slot, which is what makes the
          // arrival fire once: React remounts the slot when its tile changes
          // and keeps it when nothing did, and only a fresh element restarts a
          // CSS animation. Under a positional key the same node would be
          // reused and 9b, the most frequent motion in the app, would never
          // play again after the first selection.
          <span key={tile.id} className={styles.filled}>
            {verdict === "incorrect" && <span className={styles.dust} aria-hidden="true" />}
            <span className={moment}>
              <Tile
                digit={tile.digit}
                state={disabled ? "disabled" : "resting"}
                label={t("answerSlot.filled", { position, digit: tile.digit })}
                onClick={onReturn && (() => onReturn(tile.id))}
              />
            </span>
          </span>
        );
      })}
    </div>
  );
}
