import { useI18n } from "../../i18n/I18nContext";
import styles from "./GameHud.module.css";

export interface GameHudProps {
  score: number;
  currentStreak: number;
  round: number;
}

export function GameHud({ score, currentStreak, round }: GameHudProps) {
  const { t } = useI18n();

  return (
    <dl className={styles.hud}>
      <div className={styles.entry}>
        <dt>{t("hud.score")}</dt>
        <dd>{score}</dd>
      </div>
      <div className={styles.entry}>
        <dt>{t("hud.streak")}</dt>
        <dd>{currentStreak}</dd>
      </div>
      <div className={styles.entry}>
        <dt>{t("hud.round")}</dt>
        <dd>{round}</dd>
      </div>
    </dl>
  );
}
