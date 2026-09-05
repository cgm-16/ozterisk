import { ActionButton } from "../ActionButton/ActionButton";
import { LanguageToggle } from "../LanguageToggle/LanguageToggle";
import { useI18n } from "../../i18n/I18nContext";
import styles from "./TitleScreen.module.css";

export interface TitleScreenProps {
  onStart(): void;
}

export function TitleScreen({ onStart }: TitleScreenProps) {
  const { t } = useI18n();

  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>{t("title.name")}</h1>
      <p className={styles.summary}>{t("title.summary")}</p>
      <details className={styles.details}>
        <summary className={styles.summaryLabel}>{t("title.howToPlay")}</summary>
        <ul className={styles.rules}>
          <li>{t("howToPlay.selecting")}</li>
          <li>{t("howToPlay.slots")}</li>
          <li>{t("howToPlay.outcomes")}</li>
          <li>{t("howToPlay.capacity")}</li>
          <li>{t("howToPlay.overflow")}</li>
          <li>{t("howToPlay.progress")}</li>
          <li>{t("howToPlay.keyboard")}</li>
        </ul>
      </details>
      <LanguageToggle />
      <ActionButton onClick={onStart}>{t("action.start")}</ActionButton>
    </main>
  );
}
