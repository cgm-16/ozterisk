import type { CSSProperties } from "react";

export type TileSize = "lg" | "sm";

/** Visual state of a tile. Mirrors the five locked tile behaviours. */
export type TileState =
  /** Seated in a socket or slot. */
  | "resting"
  /** Picked up / hovered — raised off the rack. */
  | "lifted"
  /** Just arrived as a reward: gold rim and halo (first two rounds of a run only). */
  | "reward"
  /** Marked for discard: lifted, rotated, vermilion ring. */
  | "marked"
  /** Non-interactive, flat against the felt. */
  | "disabled";

/**
 * A single fired-ceramic digit tile — the atom of the whole system.
 *
 * @startingPoint section="Game" subtitle="Ceramic digit tile, five states" viewport="700x200"
 */
export interface TileProps {
  /** 0-9. Rendered in EB Garamond, engraved in --clay-900. */
  digit: number;
  /** lg = 64x80 rack/slot tile. sm = 30x38 compact tile. Default "lg". */
  size?: TileSize;
  /** Default "resting". */
  state?: TileState;
  /** Omit to render a non-interactive tile. */
  onClick?: () => void;
  /** Spoken label. Defaults to `Digit {digit}`. Pass the localised string. */
  label?: string;
  style?: CSSProperties;
}

export declare function Tile(props: TileProps): JSX.Element;
