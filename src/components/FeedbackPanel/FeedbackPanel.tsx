import type { RoundResult, Tile as TileModel } from "../../game/types";
import { useI18n } from "../../i18n/I18nContext";
import { Tile } from "../Tile/Tile";
import styles from "./FeedbackPanel.module.css";

export interface FeedbackPanelProps {
  result: RoundResult;
  rewardTiles: readonly TileModel[];
}

/** Renders the announced outcome, submitted answer, and any earned tiles. */
export function FeedbackPanel({ result, rewardTiles }: FeedbackPanelProps) {
  const { t } = useI18n();
  const isCorrect = result.kind === "correct";

  return (
    <div
      className={`${styles.panel} ${isCorrect ? styles.correct : styles.incorrect}`}
      role="status"
      aria-live="polite"
    >
      <p className={styles.headline}>{isCorrect ? t("result.correct") : t("result.incorrect")}</p>
      {isCorrect ? (
        <>
          <p className={styles.submitted}>{t("result.submitted", { value: result.submittedValue })}</p>
          {rewardTiles.length > 0 && (
            <p className={styles.rewardSummary}>
              {t("result.rewards", { count: rewardTiles.length })}
            </p>
          )}
          {/* The tiles stay on screen and leave the accessibility tree. The
              panel announces itself, so a badge per arrival read "New tile"
              once per tile where §1.14's result.rewards states the count once.
              Nothing is lost by hiding them: TileInventory renders the same
              arrivals in every phase, and a tile carries "New tile" in its own
              accessible name until NEXT_ROUND clears isNew. */}
          <ul className={styles.rewards} aria-hidden="true">
            {rewardTiles.map((tile) => (
              <li key={tile.id} className={styles.reward}>
                <Tile digit={tile.digit} size="sm" state="reward" />
                <span className={styles.rewardBadge}>{t("tile.newLabel")}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className={styles.comparison}>
          <p>{t("result.submitted", { value: result.submittedValue })}</p>
          <p>{t("result.answer", { value: result.correctValue })}</p>
        </div>
      )}
    </div>
  );
}
