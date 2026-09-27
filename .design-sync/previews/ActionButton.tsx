import type { CSSProperties, ReactNode } from "react";
import { ActionButton } from "ozterisk";

const felt: CSSProperties = { background: "var(--surface-table)", padding: "var(--space-6)", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--space-4)" };
const Felt = ({ children }: { children: ReactNode }) => <div style={felt}>{children}</div>;

export const Variants = () => (
  <Felt>
    <ActionButton variant="primary">Start Run</ActionButton>
    <ActionButton variant="secondary">Next Round</ActionButton>
    <ActionButton variant="ghost">Share</ActionButton>
  </Felt>
);

export const Disabled = () => (
  <Felt>
    <ActionButton variant="primary" disabled>Submit</ActionButton>
    <ActionButton variant="secondary" disabled>Confirm Discard</ActionButton>
  </Felt>
);
