---
reads:
  - docs/spec/product.md  # §1.10 screen phases
  - docs/spec/ui-i18n.md  # §1.12 visual contract, §1.14 required copy
  - docs/spec/architecture.md  # §2.2 domain types
---

# T09 — Game HUD, equation, slots, and inventory primitives

```yaml
task_id: T09
title: Build accessible game-board primitives
milestone: M2 — Playable Bilingual PoC
priority: P0
estimate: L
wave: W3
depends_on: [T02, T07]
parallel_safe: true
paths: [src/components/GameHud/**, src/components/EquationBoard/**, src/components/AnswerSlots/**, src/components/TileInventory/**, src/components/FeedbackPanel/**, src/components/OverflowControls/**]
```

**Interfaces**

```ts
interface AnswerSlotsProps {
  slotCount: 1 | 2;
  selectedTiles: readonly Tile[];
  onReturn(tileId: string): void;
  disabled: boolean;
}

interface TileInventoryProps {
  tiles: readonly Tile[];
  mode: "select" | "discard" | "readOnly";
  pendingDiscards: readonly string[];
  onTile(tileId: string): void;
}
```

- Consumes: canonical state data and semantic callbacks.
- Produces: presentational components with no reducer, randomness, storage, or browser sharing.

- [ ] **Step 1: Write failing slot tests**

Cover exact one/two slot count, ordered digits, return callback, disabled state, and accessible labels such as `Answer slot 1: 5`.

- [ ] **Step 2: Write failing inventory tests**

Cover sorted render input, exact duplicate tile callbacks, `isNew` label/state, pending discard state, and no callback in read-only mode.

- [ ] **Step 3: Implement all primitive components**

Required semantics:

- HUD uses a definition list.
- Equation uses readable text (`7 × 8 =`).
- Slots and tiles are buttons.
- Feedback uses `role="status"` and `aria-live="polite"`.
- Overflow instruction includes remaining/exact count.
- New and discard states have textual accessible names, not color only.

- [ ] **Step 4: Verify**

```bash
npm test -- src/components/AnswerSlots/AnswerSlots.test.tsx src/components/TileInventory/TileInventory.test.tsx
npm run typecheck
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/components
git commit -m "feat: add accessible game board primitives" -m "Task: T09"
```

**Acceptance criteria**

- Components remain phase-agnostic except for explicit mode props.
- Every tile action identifies a stable tile ID.
