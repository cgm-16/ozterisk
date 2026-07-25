---
reads:
  - docs/spec/product.md  # §1.4 answer construction
  - docs/spec/architecture.md  # §2.2–2.3, §2.5 reducer invariants, §2.6 fixtures
---

# T04 — Reducer start, selection, and return transitions

```yaml
task_id: T04
title: Implement answering-phase reducer transitions
milestone: M1 — Deterministic Game Core
priority: P0
estimate: M
wave: W3
depends_on: [T03]
parallel_safe: true
paths: [src/game/gameReducer.ts, src/game/gameReducer.test.ts]
```

**Interfaces**

- Consumes: T02 state/actions; T03 selectors and sorting.
- Produces: `gameReducer` handling `START_RUN`, `SELECT_TILE`, `RETURN_TILE`.

- [ ] **Step 1: Write failing transition tests**

Cover:

- start creates `answering`, Round 1, full inventory, reset stats;
- select removes exact ID from inventory and appends to `selectedTiles`;
- duplicate-key selection is not a reducer concern; exact IDs remain distinct;
- selecting beyond slot count is a no-op;
- selecting a missing tile ID is a no-op;
- selection outside answering is a no-op;
- return removes exact selected tile and re-sorts inventory;
- returning a missing tile is a no-op.

Representative test:

```ts
it("moves an exact tile into the next ordered answer slot", () => {
  const state = makeAnsweringState(makeEquation(7, 8));
  const tile = state.inventory.find((item) => item.digit === 5)!;
  const next = gameReducer(state, { type: "SELECT_TILE", tileId: tile.id });
  expect(next.selectedTiles).toEqual([tile]);
  expect(next.inventory).not.toContainEqual(tile);
});
```

- [ ] **Step 2: Verify failure**

```bash
npm test -- src/game/gameReducer.test.ts
```

- [ ] **Step 3: Implement immutable guarded transitions**

Use an exhaustive `switch`. Return `state` for every invalid known transition. Never mutate arrays or tiles.

- [ ] **Step 4: Verify**

```bash
npm test -- src/game/gameReducer.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game/gameReducer.ts src/game/gameReducer.test.ts
git commit -m "feat: add answer selection state transitions" -m "Task: T04"
```

**Acceptance criteria**

- All invalid-transition tests assert `next === state`.
- State owns only canonical tile collections; no selected flags are duplicated onto inventory tiles.
