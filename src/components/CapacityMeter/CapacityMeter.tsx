import { INVENTORY_CAPACITY } from "../../game/balance";
import { useI18n } from "../../i18n/I18nContext";
import styles from "./CapacityMeter.module.css";

export interface CapacityMeterProps {
  /** Tiles currently held, 0-11 (11 only mid-overflow). */
  held: number;
  /** Localised label. Defaults to `hud.capacity`. */
  label?: string;
}

/**
 * The ten-pip capacity row: a persistent read on how close the rack is to
 * overflowing. Mounted as a sibling of GameHud's `<dl>`, not an entry in it —
 * a pip row is not a term/definition pair.
 */
export function CapacityMeter({ held, label }: CapacityMeterProps) {
  const { t } = useI18n();
  const resolvedLabel = label ?? t("hud.capacity");
  // Mid-overflow (INVENTORY_CAPACITY + REWARD_BONUS) held reaches eleven; the
  // rail stays ten pips and the eleventh draws past it rather than being lost.
  const pipCount = Math.max(INVENTORY_CAPACITY, held);

  return (
    <div className={styles.meter}>
      <span className={styles.label}>
        {resolvedLabel} {held} / {INVENTORY_CAPACITY}
      </span>
      <div
        className={styles.pips}
        role="img"
        aria-label={t("hud.capacityStatus", { label: resolvedLabel, held, total: INVENTORY_CAPACITY })}
      >
        {Array.from({ length: pipCount }, (_, index) => {
          const isOverflow = index >= INVENTORY_CAPACITY;
          const isFilled = !isOverflow && index < held;
          return (
            <span
              key={index}
              className={`${styles.pip} ${isOverflow ? styles.overflow : isFilled ? styles.filled : styles.empty}`}
            />
          );
        })}
      </div>
    </div>
  );
}
