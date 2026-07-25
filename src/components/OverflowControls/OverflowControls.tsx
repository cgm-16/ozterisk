import { useI18n } from "../../i18n/I18nContext";
import styles from "./OverflowControls.module.css";

export interface OverflowControlsProps {
  requiredCount: number;
  onConfirm(): void;
  disabled: boolean;
}

export function OverflowControls({ requiredCount, onConfirm, disabled }: OverflowControlsProps) {
  const { t } = useI18n();

  return (
    <div className={styles.controls}>
      <p className={styles.instruction}>{t("overflow.instruction", { count: requiredCount })}</p>
      <button type="button" className={styles.confirm} onClick={onConfirm} disabled={disabled}>
        {t("action.confirmDiscard")}
      </button>
    </div>
  );
}
