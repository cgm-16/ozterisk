import { useState } from "react";
import { useI18n } from "../../i18n/I18nContext";
import {
  copyResult,
  formatShareText,
  shareResult,
  type ShareDependencies,
  type ShareOutcome,
  type ShareStats,
} from "../../services/sharing";
import styles from "./GameOverScreen.module.css";

export interface GameOverScreenProps {
  stats: ShareStats;
  url: string;
  dependencies: ShareDependencies;
  onPlayAgain(): void;
}

export function GameOverScreen({ stats, url, dependencies, onPlayAgain }: GameOverScreenProps) {
  const { t, language } = useI18n();
  // "shared" renders no inline message: a successful native share hands off
  // to the OS share sheet, so there is nothing further to confirm here.
  const [status, setStatus] = useState<ShareOutcome | null>(null);

  const handleShare = async () => {
    const text = formatShareText(stats, language, url);
    const outcome = await shareResult(text, url, dependencies);
    setStatus(outcome);
  };

  const handleCopy = async () => {
    const text = formatShareText(stats, language, url);
    const outcome = await copyResult(text, dependencies);
    setStatus(outcome);
  };

  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>{t("gameOver.title")}</h1>
      <dl className={styles.stats}>
        <div className={styles.entry}>
          <dt>{t("gameOver.rounds")}</dt>
          <dd>{stats.totalRounds}</dd>
        </div>
        <div className={styles.entry}>
          <dt>{t("hud.score")}</dt>
          <dd>{stats.score}</dd>
        </div>
        <div className={styles.entry}>
          <dt>{t("gameOver.longestStreak")}</dt>
          <dd>{stats.longestStreak}</dd>
        </div>
      </dl>
      <div className={styles.actions}>
        <button type="button" className={styles.playAgain} onClick={onPlayAgain}>
          {t("action.playAgain")}
        </button>
        <button type="button" className={styles.secondary} onClick={handleShare}>
          {t("action.share")}
        </button>
        <button type="button" className={styles.secondary} onClick={handleCopy}>
          {t("action.copy")}
        </button>
      </div>
      <p className={styles.status} role="status" aria-live="polite">
        {status === "copied" ? t("share.copied") : status === "failed" ? t("share.failed") : ""}
      </p>
    </main>
  );
}
