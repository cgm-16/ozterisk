import type { CSSProperties, ReactNode } from "react";
import { CapacityMeter } from "ozterisk";

const felt: CSSProperties = { background: "var(--surface-table)", padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)", maxWidth: 360 };
const Felt = ({ children }: { children: ReactNode }) => <div style={felt}>{children}</div>;

export const Levels = () => (
  <Felt>
    <CapacityMeter held={4} />
    <CapacityMeter held={9} />
    <CapacityMeter held={10} />
  </Felt>
);

export const Overflowing = () => (
  <Felt>
    <CapacityMeter held={11} />
  </Felt>
);
