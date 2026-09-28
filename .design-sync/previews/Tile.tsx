import type { CSSProperties, ReactNode } from "react";
import { Tile } from "ozterisk";

// Tile House is drawn on felt; a tile on a white page is not how it is ever seen.
const felt: CSSProperties = {
  background: "var(--surface-table)",
  padding: "var(--space-6)",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--space-3)",
};
const Felt = ({ children }: { children: ReactNode }) => <div style={felt}>{children}</div>;

export const Digits = () => (
  <Felt>
    {([0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((digit) => (
      <Tile key={digit} value={{ digit }} />
    ))}
  </Felt>
);

export const FaceTiles = () => (
  <Felt>
    <Tile value={{ face: "wild" }} />
    <Tile value={{ face: "odd" }} />
    <Tile value={{ face: "even" }} />
    <Tile value={{ face: "low" }} />
    <Tile value={{ face: "high" }} />
    <Tile value={{ face: "nbr", centre: 4 }} />
  </Felt>
);

export const States = () => (
  <Felt>
    <Tile value={{ digit: 7 }} state="resting" onClick={() => {}} />
    <Tile value={{ digit: 7 }} state="lifted" onClick={() => {}} />
    <Tile value={{ digit: 7 }} state="reward" onClick={() => {}} />
    <Tile value={{ digit: 7 }} state="marked" onClick={() => {}} pressed />
    <Tile value={{ digit: 7 }} state="disabled" onClick={() => {}} />
  </Felt>
);

export const Compact = () => (
  <Felt>
    <Tile value={{ digit: 3 }} size="sm" />
    <Tile value={{ digit: 8 }} size="sm" />
    <Tile value={{ face: "odd" }} size="sm" />
    <Tile value={{ face: "nbr", centre: 6 }} size="sm" />
  </Felt>
);
