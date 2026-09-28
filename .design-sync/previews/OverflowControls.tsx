import type { CSSProperties, ReactNode } from "react";
import { OverflowControls } from "ozterisk";

const felt: CSSProperties = { background: "var(--surface-table)", padding: "var(--space-6)", maxWidth: 420 };
const Felt = ({ children }: { children: ReactNode }) => <div style={felt}>{children}</div>;

export const OneTile = () => (
  <Felt>
    <OverflowControls requiredCount={1} />
  </Felt>
);

export const TwoTiles = () => (
  <Felt>
    <OverflowControls requiredCount={2} />
  </Felt>
);
