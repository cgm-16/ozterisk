import type { TileState } from "./Tile";

export interface InventoryTile {
  id: string;
  digit: number;
  /** True for a tile that arrived as a reward this round. */
  isNew: boolean;
}

export type InventoryMode =
  /** Normal play: tapping a tile sends it to the next empty answer slot. */
  | "select"
  /** Overflow: tapping a tile marks it for discard. */
  | "discard"
  /** Feedback / game over: tiles are visible but inert. */
  | "readOnly";

/**
 * The ten-socket rack. Always renders 10 cells regardless of how many tiles
 * are held — the empty sockets carry the loss.
 *
 * @startingPoint section="Game" subtitle="Ten-socket rack, 5x2" viewport="700x260"
 */
export interface TileInventoryProps {
  /** Held tiles in ascending digit order. Longer than 10 only mid-overflow. */
  tiles: readonly InventoryTile[];
  /** Default "select". */
  mode?: InventoryMode;
  /** Tile ids currently marked to be discarded. */
  pendingDiscards?: readonly string[];
  /**
   * Tile ids sitting in the answer slots. They render as an empty socket in
   * their own cell, so the rack never reflows during selection.
   */
  liftedIds?: readonly string[];
  /** Called with the tapped tile's id. Ignored when mode is "readOnly". */
  onTile?: (tileId: string) => void;
  /** Show the gold reward halo on isNew tiles. First two rounds of a run only. */
  rewardHalo?: boolean;
}

export declare function TileInventory(props: TileInventoryProps): JSX.Element;
