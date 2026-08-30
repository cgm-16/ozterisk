import type { InventoryTile } from "../game/TileInventory";

export interface RoundResult {
  kind: "correct" | "incorrect";
  submittedValue: number;
  correctValue: number;
  submittedTiles: InventoryTile[];
  rewardTileIds: string[];
}

/**
 * Post-submission verdict panel.
 *
 * @startingPoint section="Flow" subtitle="Correct / incorrect verdict" viewport="700x260"
 */
export interface FeedbackPanelProps {
  /** Null renders nothing. */
  result: RoundResult | null;
  /** The N+1 tiles granted on a correct answer. Empty on incorrect. */
  rewardTiles?: readonly InventoryTile[];
  /**
   * Localised strings: correct, incorrect, submitted, answer, rewards.
   * `rewards` carries a `{count}` placeholder.
   */
  labels?: Partial<Record<"correct" | "incorrect" | "submitted" | "answer" | "rewards", string>>;
}

export declare function FeedbackPanel(props: FeedbackPanelProps): JSX.Element | null;
