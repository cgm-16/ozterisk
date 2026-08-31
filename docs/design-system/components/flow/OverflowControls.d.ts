import type { InventoryTile } from "../game/TileInventory";

/**
 * Overflow resolution panel — the only moment the game asks you to destroy
 * something you own.
 *
 * @startingPoint section="Flow" subtitle="Discard to make room" viewport="700x340"
 */
export interface OverflowControlsProps {
  /** How many tiles must be discarded before play continues. */
  requiredCount: number;
  /** How many the player has marked so far. */
  markedCount?: number;
  /** The arriving tile that could not be seated. Drawn perched on the rail. */
  perchedTile?: InventoryTile;
  onConfirm?: () => void;
  disabled?: boolean;
  /** Localised strings. instruction carries a {count} placeholder. */
  labels?: { instruction: string; confirm: string };
}

export declare function OverflowControls(props: OverflowControlsProps): JSX.Element;
