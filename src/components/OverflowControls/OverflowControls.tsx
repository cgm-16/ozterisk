import { useI18n } from "../../i18n/I18nContext";
import styles from "./OverflowControls.module.css";

export interface OverflowControlsProps {
  requiredCount: number;
}

export function OverflowControls({ requiredCount }: OverflowControlsProps) {
  const { t } = useI18n();

  return (
    <div className={styles.controls}>
      {/* No Confirm at any count: the mark that reaches the required count
          completes the discard in the reducer (§1.7). */}
      <p className={styles.instruction}>{requiredCount === 1
          ? t("overflow.instructionOne")
          : t("overflow.instruction", { count: requiredCount })}</p>
    </div>
  );
}
