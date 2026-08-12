---
reads:
  - docs/spec/architecture.md  # §2.5 reducer invariants, §2.6 test fixture conventions
  - docs/plan/tuning-and-design-system.md  # §5 the anti-drift claim this task makes true
---

# T21 — Shared state fixtures

```yaml
task_id: T21
title: Move the feedback and overflow state fixtures into src/test/fixtures.ts
milestone: M5 — States Gallery
priority: P1
estimate: S
wave: W1
depends_on: []
parallel_safe: false
paths:
  - src/test/fixtures.ts
  - src/game/gameReducer.test.ts
  - src/components/GameScreen/GameScreen.test.tsx
  - docs/spec/architecture.md
```

**Interfaces**

- Produces: `makeFeedbackState(equation, overrides?)` and
  `makeOverflowState(equation, overrides?)` exported from
  `src/test/fixtures.ts`, both `(equation: Equation, overrides?:
  Partial<GameState>) => GameState`. T24 builds the gallery catalogue on
  these.
- Consumes: existing `makeAnsweringState` and `makeTile` from the same file.

## Why

`docs/plan/tuning-and-design-system.md` §5 claims gallery states "compose
from the existing `src/test/fixtures.ts` helpers, so gallery states cannot
drift from the states the tests assert against." That claim is currently
**false**: `fixtures.ts` exports only `makeAnsweringState`, and
`makeFeedbackState` / `makeOverflowState` are defined twice — in
`src/game/gameReducer.test.ts:9-38` and
`src/components/GameScreen/GameScreen.test.tsx:12-42`.

This task makes the claim true *before* T24 depends on it. It also closes the
first bullet of issue #31 item 4.

## The two copies are not identical — this is measured, not assumed

They differ in exactly two ways:

| | `gameReducer.test.ts` | `GameScreen.test.tsx` |
|---|---|---|
| `inventory` in feedback | inherited (10 tiles) | overridden to `[]` |
| `lastResult.correctValue` | `9` | `equation.product` |

Both differences were probed by unifying them locally and running the full
suite: **204/204 passed**. Neither is load-bearing. The shared fixture
therefore takes the union that keeps both suites green untouched:

- **inventory:** inherited from `makeAnsweringState` — no override.
- **`correctValue`:** `equation.product`, which is the value the reducer
  would actually produce. `9` was arbitrary.

`makeGameOverState` is **not** part of this task. It has no existing
definition to move and no consumer until T24, so adding it here would ship an
unexercised fixture and document it in §2.6 with nothing running it.

`TWELVE_TILE_INVENTORY` (`GameScreen.test.tsx:48`) also stays local. It has
one consumer today; T24 adds the second and collapses it then, per the rule
of three.

- [ ] **Step 1: Add both fixtures to `src/test/fixtures.ts`**

Append after `makeAnsweringState`. Keep the existing comments verbatim — they
record §2.5 legality and are the reason a reader can trust these shapes.

```ts
// A §2.5-legal feedback-phase state: lastResult is non-null and round === totalRounds.
export const makeFeedbackState = (
  equation: Equation,
  overrides: Partial<GameState> = {},
): GameState => ({
  ...makeAnsweringState(equation, { round: 1, totalRounds: 1 }),
  phase: "feedback",
  lastResult: {
    kind: "incorrect",
    submittedValue: 1,
    correctValue: equation.product,
    submittedTiles: [],
    rewardTileIds: [],
  },
  ...overrides,
});

// A §2.5-legal overflow-phase state: inventory exceeds capacity (excess 1 by
// default), lastResult is non-null, and round === totalRounds.
export const makeOverflowState = (
  equation: Equation,
  overrides: Partial<GameState> = {},
): GameState => ({
  ...makeFeedbackState(equation, {
    inventory: Array.from({ length: 11 }, (_, index) =>
      makeTile((index % 9) as Digit, `tile-${index}`),
    ),
  }),
  phase: "overflow",
  ...overrides,
});
```

- [ ] **Step 2: Delete both local copies and import instead**

In `src/game/gameReducer.test.ts`, delete lines 8-38 and extend the existing
import from `../test/fixtures` with `makeFeedbackState` and
`makeOverflowState`.

In `src/components/GameScreen/GameScreen.test.tsx`, delete lines 10-42 and
extend the existing import from `../../test/fixtures` the same way. Leave
`TWELVE_TILE_INVENTORY` and its comment in place.

Remove any import that becomes unused (`Equation`, `GameState`, or `Digit`
type imports may no longer be referenced in one or both files — lint runs
`--max-warnings=0`, so an unused import fails the gate).

- [ ] **Step 3: Verify the move is invisible**

```bash
npm test
```

Expected: **204 passed**, with **zero edits to any test body**. If a test
needs editing to pass, the move changed semantics — stop and report rather
than adjusting the test.

- [ ] **Step 4: Amend `docs/spec/architecture.md` §2.6**

§2.6 reproduces `fixtures.ts` literally, so it drifts the moment the file
changes — the exact failure that bit M4's copy tables twice. Append both new
fixtures to the code block in the same order they appear in the file.

- [ ] **Step 5: Full gates**

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/test/fixtures.ts src/game/gameReducer.test.ts \
        src/components/GameScreen/GameScreen.test.tsx docs/spec/architecture.md
git commit -m "refactor(test): share the feedback and overflow state fixtures" -m "Task: T21"
```

**Acceptance criteria**

- `makeFeedbackState` and `makeOverflowState` are exported from
  `src/test/fixtures.ts` and defined nowhere else.
- Their §2.5-legality comments survive the move.
- 204 tests pass with no test body edited.
- §2.6 reproduces the file as it now stands.
- No production code changed.
