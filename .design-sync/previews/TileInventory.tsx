import type { CSSProperties, ReactNode } from "react";
import { TileInventory } from "ozterisk";

const felt: CSSProperties = { background: "var(--surface-table)", padding: "var(--space-6)", maxWidth: 480 };
const Felt = ({ children }: { children: ReactNode }) => <div style={felt}>{children}</div>;

type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
const digits = (...values: Digit[]) => values.map((digit, index) => ({ id: `t${index}`, isNew: false, digit }));

// Endless: ten sockets, a sorted hand, two tiles lifted into the answer.
export const EndlessRack = () => (
  <Felt>
    <TileInventory
      tiles={digits(0, 1, 2, 3, 4, 5, 6, 7, 8, 9)}
      mode="select"
      pendingDiscards={[]}
      liftedIds={["t4", "t7"]}
      capacity={10}
      onTile={() => {}}
    />
  </Felt>
);

// Classic's stepped rack at fifteen sockets: five columns, empty sockets still open.
export const ClassicMidRack = () => (
  <Felt>
    <TileInventory
      tiles={[
        ...digits(0, 1, 1, 2, 3, 4, 5, 6, 8, 9, 9),
        { id: "f1", isNew: false, face: "odd" },
        { id: "f2", isNew: false, face: "nbr", centre: 4 },
      ]}
      mode="select"
      pendingDiscards={[]}
      liftedIds={[]}
      capacity={15}
      drawnCapacity={15}
      stepped
      onTile={() => {}}
    />
  </Felt>
);

// An overflow: the eleventh tile perches on the rail and one tile is marked to go.
export const DiscardWithRail = () => (
  <Felt>
    <TileInventory
      tiles={digits(0, 1, 2, 3, 3, 4, 5, 6, 7, 9, 5)}
      mode="discard"
      pendingDiscards={["t3"]}
      liftedIds={[]}
      capacity={10}
      onTile={() => {}}
    />
  </Felt>
);
