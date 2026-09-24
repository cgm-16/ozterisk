import { CLASSIC_START_CAPACITY } from "../../game/balance";

/** Classic's rack sizes (§1.12). Their figures — tile, gap, padding, and the
 * narrow 6 x 44 fallback — live in TileInventory.module.css, keyed by name. */
export type RackSize = "small" | "mid" | "home";

export interface RackTier {
  size: RackSize;
  /** The capacity whose whole rows set this size's footprint. */
  top: number;
  /** Cells drawn: whole rows of the size's narrowest column count, so the
   * narrow fallback always has its rows. Where the rack is wide, CSS hides
   * the cells past the wide size's own footprint (twenty in 7 x 3 is 21). */
  footprint: number;
}

// ponytail: tier thresholds await a device playtest (§1.12); tune here.
const MID_ABOVE = 15;
const HOME_ABOVE = 10;
const NARROW_COLUMNS = 6;

/** Classic's stepped rack: the size for the capacity the rack is drawn at. */
export function rackTier(drawnCapacity: number): RackTier {
  if (drawnCapacity > MID_ABOVE) {
    const top = CLASSIC_START_CAPACITY;
    return { size: "small", top, footprint: Math.ceil(top / NARROW_COLUMNS) * NARROW_COLUMNS };
  }
  if (drawnCapacity > HOME_ABOVE) {
    return { size: "mid", top: MID_ABOVE, footprint: Math.ceil(MID_ABOVE / NARROW_COLUMNS) * NARROW_COLUMNS };
  }
  return { size: "home", top: HOME_ABOVE, footprint: HOME_ABOVE };
}
