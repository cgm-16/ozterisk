import type { CSSProperties, ReactNode } from "react";
import { EquationBoard } from "ozterisk";

const felt: CSSProperties = { background: "var(--surface-table)", padding: "var(--space-6)", display: "flex", justifyContent: "center" };
const Felt = ({ children }: { children: ReactNode }) => <div style={felt}>{children}</div>;

export const Asking = () => (
  <Felt>
    <EquationBoard equation={{ left: 7, right: 8, product: 56 }} />
  </Felt>
);

export const WithProduct = () => (
  <Felt>
    <EquationBoard equation={{ left: 6, right: 4, product: 24 }} showProduct />
  </Felt>
);
