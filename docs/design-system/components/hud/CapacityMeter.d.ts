/**
 * The ten-pip capacity row. An intentional addition — the redesign needs a
 * persistent read on how close the rack is to overflowing.
 *
 * @startingPoint section="HUD" subtitle="Ten-pip capacity read-out" viewport="700x150"
 */
export interface CapacityMeterProps {
  /** Tiles currently held, 0-11 (11 only mid-overflow). */
  held: number;
  /** Localised label. Default "Capacity". */
  label?: string;
}

export declare function CapacityMeter(props: CapacityMeterProps): JSX.Element;
