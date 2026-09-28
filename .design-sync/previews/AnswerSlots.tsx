import type { CSSProperties, ReactNode } from "react";
import { AnswerSlots } from "ozterisk";

const felt: CSSProperties = { background: "var(--surface-table)", padding: "var(--space-6)", display: "flex", justifyContent: "center" };
const Felt = ({ children }: { children: ReactNode }) => <div style={felt}>{children}</div>;

export const Empty = () => (
  <Felt>
    <AnswerSlots slotCount={2} selectedTiles={[]} disabled={false} />
  </Felt>
);

export const OneFilled = () => (
  <Felt>
    <AnswerSlots slotCount={2} selectedTiles={[{ id: "a", isNew: false, digit: 5 }]} onReturn={() => {}} disabled={false} />
  </Felt>
);

export const SingleDigit = () => (
  <Felt>
    <AnswerSlots slotCount={1} selectedTiles={[{ id: "a", isNew: false, digit: 8 }]} onReturn={() => {}} disabled={false} />
  </Felt>
);

export const WithFace = () => (
  <Felt>
    <AnswerSlots
      slotCount={2}
      selectedTiles={[
        { id: "a", isNew: false, face: "odd" },
        { id: "b", isNew: false, digit: 2 },
      ]}
      onReturn={() => {}}
      disabled={false}
    />
  </Felt>
);
