import { CLASSIC_START_CAPACITY } from "../../game/balance";

/** A stepped rack size's fixed figures. Null for the ten-socket rack, which
 * takes the Endless tiers from spacing.css and scales with its container. */
export interface RackSize {
  w: number;
  h: number;
  font: number;
  gap: number;
  pad: number;
  smallRadius: boolean;
}

export interface RackTier {
  cols: number;
  /** The capacity whose whole rows set this size's footprint. */
  top: number;
  size: RackSize | null;
}

// §1.12's Classic sizes. Every one holds about 180px of height; the tiles grow
// as the table empties. The narrow size is where the arena cannot hold 7 x 44
// or 6 x 48: 6 x 44 needs 264px, and the 281px the 320px gate leaves (a 305px
// content box less the arena's 24px) has 17px left for five 2px gaps, 2px of
// padding a side and the 1px border.
const SMALL: RackSize = { w: 44, h: 55, font: 25, gap: 4, pad: 8, smallRadius: true };
const MID: RackSize = { w: 48, h: 60, font: 28, gap: 6, pad: 8, smallRadius: false };
const NARROW: RackSize = { w: 44, h: 55, font: 25, gap: 2, pad: 2, smallRadius: true };
// ponytail: tier thresholds await a device playtest (§1.12); tune here.
const MID_ABOVE = 15;
const HOME_ABOVE = 10;

/** Classic's stepped rack: the size for the capacity the rack is drawn at. */
export function rackTier(drawnCapacity: number, narrow = false): RackTier {
  if (drawnCapacity > MID_ABOVE) {
    return { cols: narrow ? 6 : 7, top: CLASSIC_START_CAPACITY, size: narrow ? NARROW : SMALL };
  }
  if (drawnCapacity > HOME_ABOVE) return { cols: 6, top: MID_ABOVE, size: narrow ? NARROW : MID };
  return { cols: 5, top: HOME_ABOVE, size: null };
}

/** The tray's natural outer width: tiles, gaps, padding and the 1px border. */
export function trayWidth({ cols, size }: RackTier): number {
  if (size === null) return 0;
  return cols * size.w + (cols - 1) * size.gap + 2 * size.pad + 2;
}
