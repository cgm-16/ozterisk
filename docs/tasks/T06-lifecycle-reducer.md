---
reads:
  - docs/spec/product.md  # §1.7 overflow, §1.8 loss detection, §1.9 statistics
  - docs/spec/architecture.md  # §2.5 reducer invariants
---

# T06 — Overflow, next round, game over, and restart

```yaml
task_id: T06
title: Complete reducer lifecycle and loss detection
milestone: M1 — Deterministic Game Core
priority: P0
estimate: M
wave: W5
depends_on: [T05]
parallel_safe: true
paths: [src/game/gameReducer.ts, src/game/gameReducer.test.ts]
```

**Interfaces**

- Consumes: Feedback/overflow state and action-provided next equation/initial inventory.
- Produces: Remaining reducer actions and full five-phase state machine.

- [ ] **Step 1: Write overflow tests**

Cover:

- toggle exact inventory tile IDs on/off;
- cannot mark more than excess count;
- missing ID/wrong phase is no-op;
- confirm with fewer than exact excess is no-op;
- confirm exact excess removes exact tiles, returns to feedback, leaves capacity 10;
- new and old tiles can both be discarded.

- [ ] **Step 2: Write next-round tests**

Cover:

- only feedback may advance;
- clears new markers/result/selection/discards;
- increments `round` while `totalRounds` remains submitted count;
- one remaining tile can enter answering for a one-digit product;
- one remaining tile enters game over for a two-digit product;
- exact-answer constructibility is not checked;
- terminal equation is retained.

- [ ] **Step 3: Write restart tests**

Cover:

- only game over may restart;
- uses action-provided fresh `[0–9]`;
- Round 1 and all statistics reset;
- returns directly to answering.

- [ ] **Step 4: Verify failure**

```bash
npm test -- src/game/gameReducer.test.ts
```

- [ ] **Step 5: Implement and add invariant helper for tests**

Create a test-only assertion helper that validates §2.5 after every legal transition in a table-driven lifecycle test.

- [ ] **Step 6: Verify**

```bash
npm test -- src/game/gameReducer.test.ts
npm test
npm run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add src/game/gameReducer.ts src/game/gameReducer.test.ts
git commit -m "feat: complete game lifecycle state machine" -m "Task: T06"
```

**Acceptance criteria**

- Every action in `GameAction` has legal and invalid phase tests.
- Loss is tested as tile-count-only behavior.
- No reducer branch invokes randomness or browser APIs.
