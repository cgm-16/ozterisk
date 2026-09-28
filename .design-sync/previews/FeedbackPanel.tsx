import type { CSSProperties, ReactNode } from "react";
import { FeedbackPanel } from "ozterisk";

const felt: CSSProperties = { background: "var(--surface-table)", padding: "var(--space-6)", maxWidth: 420 };
const Felt = ({ children }: { children: ReactNode }) => <div style={felt}>{children}</div>;

export const Correct = () => (
  <Felt>
    <FeedbackPanel
      result={{
        kind: "correct",
        submittedValue: 42,
        correctValue: 42,
        submittedTiles: [
          { id: "a", isNew: false, digit: 4 },
          { id: "b", isNew: false, digit: 2 },
        ],
        rewardTileIds: ["r1", "r2", "r3"],
      }}
      rewardTiles={[
        { id: "r1", isNew: true, digit: 1 },
        { id: "r2", isNew: true, digit: 8 },
        { id: "r3", isNew: true, face: "even" },
      ]}
    />
  </Felt>
);

export const Incorrect = () => (
  <Felt>
    <FeedbackPanel
      result={{
        kind: "incorrect",
        submittedValue: 54,
        correctValue: 56,
        submittedTiles: [
          { id: "a", isNew: false, digit: 5 },
          { id: "b", isNew: false, digit: 4 },
        ],
        rewardTileIds: [],
      }}
      rewardTiles={[]}
    />
  </Felt>
);

// A wrong answer holding a face prints the faces as engraved: "O·3".
export const IncorrectWithFace = () => (
  <Felt>
    <FeedbackPanel
      result={{
        kind: "incorrect",
        submittedValue: null,
        correctValue: 24,
        submittedTiles: [
          { id: "a", isNew: false, face: "odd" },
          { id: "b", isNew: false, digit: 3 },
        ],
        rewardTileIds: [],
      }}
      rewardTiles={[]}
    />
  </Felt>
);
