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
      {/* A forced single-tile discard completes on the marking tap alone (see
          GameScreen's onTile handler); Confirm only has a decision to make
          when more than one tile must go, which only Classic mode produces. */}
      {requiredCount > 1 && (
        <button type="button" className={styles.confirm} onClick={onConfirm} disabled={disabled}>
          {t("action.confirmDiscard")}
        </button>
      )}
    </div>
  );
}
