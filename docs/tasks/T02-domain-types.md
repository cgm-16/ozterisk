---
reads:
  - docs/spec/product.md  # §1.3 initial run state
  - docs/spec/architecture.md  # §2.2 domain types, §2.6 test fixtures
---

# T02 — Domain types, constants, and tile factories

```yaml
task_id: T02
title: Define canonical game model and tile factories
milestone: M1 — Deterministic Game Core
priority: P0
estimate: S
wave: W1
depends_on: [T01]
parallel_safe: true
paths: [src/game/types.ts, src/game/constants.ts, src/game/factories.ts, src/game/factories.test.ts, src/test/fixtures.ts]
```

**Interfaces**

- Consumes: Test toolchain from T01.
- Produces: All types in §2.2 plus `createTitleState`, `createInitialInventory`, `sortTiles`, and the test fixtures in §2.6.

- [ ] **Step 1: Write failing factory tests**

```ts
it("creates one sorted non-new tile for every digit", () => {
  const inventory = createInitialInventory(sequentialIds());
  expect(inventory.map((tile) => tile.digit)).toEqual([0,1,2,3,4,5,6,7,8,9]);
  expect(new Set(inventory.map((tile) => tile.id)).size).toBe(10);
  expect(inventory.every((tile) => tile.isNew === false)).toBe(true);
});

it("sorts duplicate digits by stable ID without mutating input", () => {
  const input = [
    { id: "b", digit: 4, isNew: false },
    { id: "a", digit: 4, isNew: true },
    { id: "z", digit: 1, isNew: false },
  ] satisfies Tile[];
  expect(sortTiles(input).map((tile) => tile.id)).toEqual(["z", "a", "b"]);
  expect(input.map((tile) => tile.id)).toEqual(["b", "a", "z"]);
});
```

- [ ] **Step 2: Verify failure**

```bash
npm test -- src/game/factories.test.ts
```

Expected: fail because modules/functions do not exist.

- [ ] **Step 3: Implement canonical types and factories**

Copy §2.2 type names exactly. `createTitleState()` must return empty arrays, null equation/result, zero statistics, `round: 0`, and `phase: "title"`. Add the §2.6 helpers to `src/test/fixtures.ts`; production modules must never import that file.

- [ ] **Step 4: Verify focused and global gates**

```bash
npm test -- src/game/factories.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/game src/test/fixtures.ts
git commit -m "feat: define game domain model" -m "Task: T02"
```

**Acceptance criteria**

- No browser or React imports exist under `src/game`.
- Factory results are immutable-by-convention fresh objects.
- Sort behavior is deterministic.
