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
 * The rack. Endless renders 10 cells regardless of how many tiles are held —
 * the empty sockets carry the loss. Classic (stepped) renders a whole-row
 * footprint per tier; closed sockets stay as sealed plugs.
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
  /** Live sockets. Endless: always 10. Classic: descends from startCapacity. */
  capacity?: number;
  /**
   * Classic's stepped rack: 7 x 44 above thresholds[0], 6 x 48 above
   * thresholds[1], 5 x 64 at and below. Each tier draws whole rows; the cells
   * past capacity are sealed plugs. Default false (Endless).
   */
  stepped?: boolean;
  /** Tier boundaries, default [15, 10]. Pending device playtest. */
  thresholds?: readonly [number, number];
  /** Classic's opening capacity, default 20 — sizes the top tier's footprint. */
  startCapacity?: number;
  /**
   * Pass for the single render after a tier change: the previous capacity and
   * tile order. Tiles FLIP from their old seats (oz-reseat, 300ms) and the new
   * plugs seal 40ms apart after they land. Omit otherwise.
   */
  reseatFrom?: { capacity: number; order: readonly string[] };
}

export interface RackTier { cols: number; w: number; h: number; font: number; gap: number; pad: number; radius: string; top: number; }
export declare function rackTier(capacity: number, thresholds?: readonly [number, number], start?: number): RackTier;

export declare function TileInventory(props: TileInventoryProps): JSX.Element;
