import type { CSSProperties, ReactNode } from "react";
import { LanguageToggle } from "ozterisk";

const felt: CSSProperties = { background: "var(--surface-table)", padding: "var(--space-6)", display: "flex", justifyContent: "flex-end" };
const Felt = ({ children }: { children: ReactNode }) => <div style={felt}>{children}</div>;

export const Toggle = () => (
  <Felt>
    <LanguageToggle />
  </Felt>
);
