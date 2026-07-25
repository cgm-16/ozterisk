import type { Language } from "../../game/types";
import { useI18n } from "../../i18n/I18nContext";
import styles from "./LanguageToggle.module.css";

// Language names are language-invariant labels, not translated copy: "English"
// always reads "English" and "한국어" always reads "한국어", regardless of the
// interface language currently active.
const LANGUAGES: ReadonlyArray<{ code: Language; label: string }> = [
  { code: "en", label: "English" },
  { code: "ko", label: "한국어" },
];

export function LanguageToggle() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className={styles.toggle} role="group" aria-label={t("language.groupLabel")}>
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          className={styles.button}
          aria-pressed={language === code}
          onClick={() => setLanguage(code)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
