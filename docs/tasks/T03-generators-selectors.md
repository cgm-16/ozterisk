---
reads:
  - docs/spec/product.md  # §1.2 equation pool, §1.4 answer construction
  - docs/spec/architecture.md  # §2.3 pure interfaces, §2.6 test fixtures
---

# T03 — Equation/reward generators and derived selectors

```yaml
task_id: T03
title: Implement deterministic game utilities
milestone: M1 — Deterministic Game Core
priority: P0
estimate: M
wave: W2
depends_on: [T02]
parallel_safe: true
paths: [src/game/generators.ts, src/game/generators.test.ts, src/game/selectors.ts, src/game/selectors.test.ts]
```

**Interfaces**

- Consumes: `Digit`, `Equation`, `Tile`, `RandomSource`, `TileIdFactory`.
- Produces: Every pure function in §2.3 except reducer/factories.

- [ ] **Step 1: Write failing equation mapping tests**

Build the canonical pairs with nested loops `left=1..9`, `right=left..9`. Test random values at the lower edge of all 45 bins:

```ts
it("makes all 45 unordered pairs addressable exactly once", () => {
  const pairs = Array.from({ length: 45 }, (_, index) => {
    const random = sequenceRandom(index / 45, 0);
    const equation = generateEquation(random);
    return `${Math.min(equation.left, equation.right)}-${Math.max(equation.left, equation.right)}`;
  });
  expect(new Set(pairs).size).toBe(45);
  expect(pairs).toContain("1-1");
  expect(pairs).toContain("9-9");
});

it("randomizes display order without changing product", () => {
  const forward = generateEquation(sequenceRandom(2 / 45, 0.1));
  const reversed = generateEquation(sequenceRandom(2 / 45, 0.9));
  expect([forward.left, forward.right]).toEqual([1, 3]);
  expect([reversed.left, reversed.right]).toEqual([3, 1]);
  expect(forward.product).toBe(reversed.product);
});
```

- [ ] **Step 2: Write failing reward boundary tests**

```ts
it.each([
  [0, 0],
  [0.099999, 0],
  [0.1, 1],
  [0.999999, 9],
])("maps random value %s to digit %s", (value, digit) => {
  const [tile] = generateRewardTiles(1, () => value, sequentialIds());
  expect(tile).toMatchObject({ digit, isNew: true });
});
```

- [ ] **Step 3: Write failing selector tests**

Cover:

- product `9` → length `1`;
- product `10` and `81` → length `2`;
- no selection → `null`;
- `[5,6]` → `56`;
- inventory length `1` can attempt a one-digit but not a two-digit equation;
- overflow counts `0`, `1`, and `3`;
- submission/discard readiness depends on phase and exact counts.

- [ ] **Step 4: Verify tests fail**

```bash
npm test -- src/game/generators.test.ts src/game/selectors.test.ts
```

- [ ] **Step 5: Implement minimal pure functions**

Use:

```ts
const pairIndex = Math.floor(random() * pairs.length);
const shouldReverse = random() >= 0.5;
const digit = Math.floor(random() * 10) as Digit;
```

Throw `RangeError` if an injected random value is outside `[0,1)`, reward count is negative/non-integer, or pair lookup fails.

> **Amendment (2026-07-25, Ori):** The literal `Math.floor(random() * binCount)` fails Step 1's own bin-edge test at indices 13 and 26 (IEEE-754: `13/45 * 45 = 12.999…`). The test governs: use an epsilon-nudged, clamped bin-index helper (see `sampleBinIndex` in `src/game/generators.ts`) that preserves uniform sampling and the sample-consumption contract. Any later task doing bin-index arithmetic must reuse that helper rather than the naive formula.

- [ ] **Step 6: Verify**

```bash
npm test -- src/game/generators.test.ts src/game/selectors.test.ts
npm run typecheck
npm run lint
```

- [ ] **Step 7: Commit**

```bash
git add src/game
git commit -m "feat: add deterministic game utilities" -m "Task: T03"
```

**Acceptance criteria**

- Generator probability is represented by one canonical 45-entry array.
- Exactly two random samples are consumed per equation: pair then display order.
- Exactly `count` random samples and IDs are consumed per reward generation.
