---
reads:
  - docs/spec/product.md  # §1.5 correct, §1.6 incorrect, §1.9 statistics
  - docs/spec/architecture.md  # §2.5 reducer invariants
---

# T05 — Correct and incorrect submission transitions

```yaml
task_id: T05
title: Implement one-attempt submission outcomes
milestone: M1 — Deterministic Game Core
priority: P0
estimate: M
wave: W4
depends_on: [T04]
parallel_safe: false
paths: [src/game/gameReducer.ts, src/game/gameReducer.test.ts]
```

**Interfaces**

- Consumes: Filled answering state, generated reward tiles for correct action.
- Produces: `SUBMIT_CORRECT` and `SUBMIT_INCORRECT` transitions and `RoundResult`.

- [ ] **Step 1: Write failing correct-submission tests**

Cover:

- selected tiles are consumed;
- score/current streak/longest streak/total rounds update exactly once;
- `N+1` action-provided rewards enter inventory sorted and new;
- result snapshots submitted tiles, values, and reward IDs;
- phase becomes `overflow` only when inventory exceeds 10, else `feedback`;
- repeat dispatch outside answering is a no-op.

- [ ] **Step 2: Write failing incorrect-submission tests**

Cover:

- selected tiles are consumed;
- no reward and no score;
- streak resets while longest streak remains;
- submitted rounds increments;
- submitted and correct values are captured;
- an incorrect submission is accepted regardless of whether inventory contains the correct digits;
- unfilled submission and wrong phase are no-ops.

Representative assertions:

```ts
expect(next.lastResult).toMatchObject({
  kind: "incorrect",
  submittedValue: 78,
  correctValue: 56,
  rewardTileIds: [],
});
expect(next.inventory).toHaveLength(state.inventory.length);
expect(next.currentStreak).toBe(0);
expect(next.totalRounds).toBe(state.totalRounds + 1);
```

- [ ] **Step 3: Verify failure**

```bash
npm test -- src/game/gameReducer.test.ts
```

- [ ] **Step 4: Implement submission guards**

The reducer must independently verify:

- phase is `answering`;
- equation exists;
- slot count is filled;
- `SUBMIT_CORRECT` is actually correct;
- `SUBMIT_INCORRECT` is actually incorrect;
- reward count for correct equals `selectedTiles.length + 1`;
- reward IDs do not collide with live inventory IDs.

Invalid payloads return unchanged state.

- [ ] **Step 5: Verify**

```bash
npm test -- src/game/gameReducer.test.ts
npm run typecheck
npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/game/gameReducer.ts src/game/gameReducer.test.ts
git commit -m "feat: add correct and incorrect round outcomes" -m "Task: T05"
```

**Acceptance criteria**

- Reducer does not trust disabled buttons or caller-declared correctness.
- One attempt is enforced by phase guards.
