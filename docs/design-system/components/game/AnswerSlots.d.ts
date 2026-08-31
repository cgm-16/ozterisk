import type { InventoryTile } from "./TileInventory";

export type AnswerSlotsState =
  /** Awaiting input. Empty slots show the dashed gold rim. */
  | "answering"
  /** Correct: tiles wear the reward rim while the bloom plays. */
  | "correct"
  /** Incorrect: tiles are mid-fracture, desaturated and low. */
  | "incorrect";

/**
 * The answer slots. Exactly one or two, decided by the product's digit count.
 *
 * @startingPoint section="Game" subtitle="One or two ordered answer slots" viewport="700x180"
 */
export interface AnswerSlotsProps {
  /** 1 for one-digit products, 2 for two-digit. Never anything else. */
  slotCount: 1 | 2;
  /** Tiles in selection order — index 0 fills the leftmost slot. */
  selectedTiles: readonly InventoryTile[];
  /** Called with the tile id when a filled slot is tapped. */
  onReturn?: (tileId: string) => void;
  /** True during feedback and overflow. */
  disabled?: boolean;
  /** Default "answering". */
  state?: AnswerSlotsState;
  /**
   * Current streak, after the answer resolved. The jade ring (7a) is the
   * ladder's first rung and fires from 3; below that a correct answer blooms
   * without it.
   */
  streak?: number;
}

export declare function AnswerSlots(props: AnswerSlotsProps): JSX.Element;
