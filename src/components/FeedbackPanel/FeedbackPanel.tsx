import type { RoundResult, Tile as TileModel } from "../../game/types";
import { useI18n } from "../../i18n/I18nContext";
import { Tile } from "../Tile/Tile";
import styles from "./FeedbackPanel.module.css";

export interface FeedbackPanelProps {
  result: RoundResult;
  rewardTiles: readonly TileModel[];
}

export function FeedbackPanel({ result, rewardTiles }: FeedbackPanelProps) {
  const { t } = useI18n();
  const isCorrect = result.kind === "correct";

  return (
    <div className={styles.panel} role="status" aria-live="polite">
      <p className={styles.headline}>{isCorrect ? t("result.correct") : t("result.incorrect")}</p>
      {isCorrect ? (
        <ul className={styles.rewards}>
          {rewardTiles.map((tile) => (
            <li key={tile.id} className={styles.reward}>
              <Tile digit={tile.digit} size="sm" state="reward" />
              <span className={styles.rewardBadge}>{t("tile.newLabel")}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.comparison}>
          <p>{t("result.submitted", { value: result.submittedValue })}</p>
          <p>{t("result.answer", { value: result.correctValue })}</p>
        </div>
      )}
    </div>
  );
}
