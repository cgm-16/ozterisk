import type { CSSProperties, ReactNode } from "react";
import { GameHud } from "ozterisk";

const felt: CSSProperties = { background: "var(--surface-table)", padding: "var(--space-6)", maxWidth: 480 };
const Felt = ({ children }: { children: ReactNode }) => <div style={felt}>{children}</div>;

export const Endless = () => (
  <Felt>
    <GameHud score={12} currentStreak={4} round={15} />
  </Felt>
);

export const Classic = () => (
  <Felt>
    <GameHud score={9} currentStreak={2} round={13} capacity={14} />
  </Felt>
);
