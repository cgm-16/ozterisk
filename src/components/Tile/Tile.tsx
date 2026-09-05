import type { CSSProperties } from "react";
import { useI18n } from "../../i18n/I18nContext";
import styles from "./Tile.module.css";

export type TileSize = "lg" | "sm";

export type TileState = "resting" | "lifted" | "reward" | "marked" | "disabled";

export interface TileProps {
  digit: number;
  /** lg = rack/slot tile. sm = compact, non-interactive tile. */
  size?: TileSize;
  state?: TileState;
  /** Omit to render a tile that carries no button role. */
  onClick?: () => void;
  /** Spoken label for the button form. Defaults to the localised digit name. */
  label?: string;
  style?: CSSProperties;
}

/**
 * The single fired-ceramic digit tile. Every ceramic face in the game is one
 * of these: the rack tile, the filled answer slot, and the reward tile.
 *
 * The empty answer slot is not one — it is a socket cut into the felt, and its
 * rule stays in AnswerSlots.module.css.
 */
export function Tile({ digit, size = "lg", state = "resting", onClick, label, style }: TileProps) {
  const { t } = useI18n();
  const className = `${styles.tile} ${styles[size]} ${styles[state]}`;

  // Without onClick the tile is decorative: no button element and no button
  // role, so a later phase can mount answer slots inside feedback without
  // adding controls. A roleless element has no role that can carry an
  // accessible name, so `label` is deliberately ignored here and the digit
  // itself is the text.
  if (onClick === undefined) {
    return (
      <span className={className} style={style}>
        {digit}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={className}
      style={style}
      aria-label={label ?? t("tile.digitLabel", { digit })}
      aria-pressed={state === "marked" ? true : undefined}
      disabled={state === "disabled"}
      onClick={onClick}
    >
      {digit}
    </button>
  );
}
