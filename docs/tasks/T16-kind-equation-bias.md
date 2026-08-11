---
reads:
  - docs/superpowers/specs/2026-08-09-endless-mode-polish-design.md  # §1.1 buildable rate, §3.3 kind bias
  - docs/spec/product.md  # §1.2 equation sampling
  - docs/spec/architecture.md  # §2.5 reducer purity, injected RandomSource
  - docs/tasks/T15-balance-surface.md  # KIND_EQUATION_RATE
---

# T16 — Kind equation bias

```yaml
task_id: T16
title: Draw a share of equations only from constructible products
milestone: M4 — Endless Polish and Tuning Surface
priority: P0
estimate: M
wave: W1
depends_on: [T15]
parallel_safe: false
paths:
  - src/game/selectors.ts
  - src/game/selectors.test.ts
  - src/game/generators.ts
  - src/game/generators.test.ts
  - src/app/App.tsx
  - src/app/App.test.tsx
```

**Interfaces**

- Consumes: `KIND_EQUATION_RATE` from `game/balance` (T15).
- Produces:
  - `canConstruct(inventory: readonly Tile[], product: number): boolean`
  - `generateKindEquation(random: RandomSource, inventory: readonly Tile[], kindRate: number): Equation`

> **Shipped without the `kindRate` parameter.** The final review found that a
> dial threaded through call sites is a dial each call site can silently
> override — swapping in a literal left every test green. The generator
> imports `KIND_EQUATION_RATE` directly instead, so the signature is
> `generateKindEquation(random, inventory)` and the three `App.tsx` call
> sites below pass two arguments. `docs/spec/architecture.md` is canonical;
> the code blocks further down record the task as planned.

## Why

At capacity 10 only ~48% of equations can be spelled from a drifted hand.
The other half force a deliberate wrong answer, which is the dominant drain
on a run and the main source of frustration. Biasing a fifth of draws toward
constructible products cuts dead rounds without pushing the economy over the
`b ≈ 63%` cliff — at 20% the effective rate is 58%.

- [ ] **Step 1: Write the failing `canConstruct` tests**

Add to `src/game/selectors.test.ts`. It is a **multiset** check: a product
needing two of a digit requires two tiles.

```ts
describe("canConstruct", () => {
  const hand = [makeTile(1, "a"), makeTile(2, "b"), makeTile(4, "c")];

  it("accepts a one-digit product whose digit is held", () => {
    expect(canConstruct(hand, 4)).toBe(true);
  });

  it("accepts a two-digit product whose digits are both held", () => {
    expect(canConstruct(hand, 42)).toBe(true);
  });

  it("rejects a product missing one digit", () => {
    expect(canConstruct(hand, 45)).toBe(false);
  });

  it("requires two tiles for a repeated digit", () => {
    expect(canConstruct([makeTile(1, "a")], 11)).toBe(false);
    expect(canConstruct([makeTile(1, "a"), makeTile(1, "b")], 11)).toBe(true);
  });

  it("rejects everything from an empty hand", () => {
    expect(canConstruct([], 4)).toBe(false);
  });
});
```

The repeated-digit case cannot arise in `1-0` — no product of two operands
in `1..9` has a repeated digit — but write it multiset-correct anyway,
because Classic's face-set tiles will need it.

- [ ] **Step 2: Verify it fails**

```bash
npm test -- src/game/selectors.test.ts
```

- [ ] **Step 3: Implement `canConstruct`**

```ts
export function canConstruct(inventory: readonly Tile[], product: number): boolean {
  const available = new Map<number, number>();
  for (const tile of inventory) {
    available.set(tile.digit, (available.get(tile.digit) ?? 0) + 1);
  }
  for (const character of String(product)) {
    const digit = Number(character);
    const remaining = available.get(digit) ?? 0;
    if (remaining === 0) return false;
    available.set(digit, remaining - 1);
  }
  return true;
}
```

- [ ] **Step 4: Write the failing generator tests**

Add to `src/game/generators.test.ts`:

- a gate sample `>= kindRate` delegates to the uniform draw and yields the
  same equation `generateEquation` would for the remaining samples;
- a gate sample `< kindRate` only ever yields a product the hand can spell —
  assert over the whole constructible subset, not one example;
- an empty inventory falls back to the uniform draw rather than throwing;
- **every path consumes exactly 3 samples.** Assert with a counting
  `RandomSource`, since fixtures depend on it.

- [ ] **Step 5: Verify they fail**

```bash
npm test -- src/game/generators.test.ts
```

- [ ] **Step 6: Extract `orientPair`, then implement `generateKindEquation`**

Both generators end with the same order-flip. Extract it as a private
helper — rule of three, and both call sites are being touched:

```ts
function orientPair(pair: readonly [number, number], orderSample: number): Equation {
  const [a, b] = pair;
  const shouldReverse = orderSample >= 0.5;
  const left = shouldReverse ? b : a;
  const right = shouldReverse ? a : b;
  return { left, right, product: left * right };
}
```

`generateEquation` now calls it. Behaviour is identical, so its 11 existing
test references stay green — verify that rather than editing them.

```ts
export function generateKindEquation(
  random: RandomSource,
  inventory: readonly Tile[],
  kindRate: number,
): Equation {
  const gateSample = readRandomSample(random);
  if (gateSample >= kindRate) return generateEquation(random);

  const constructible = EQUATION_PAIRS.filter(([left, right]) =>
    canConstruct(inventory, left * right),
  );
  // An empty subset means the hand can spell nothing at all. Fall back to
  // the uniform draw; sampling an empty pool would throw.
  if (constructible.length === 0) return generateEquation(random);

  const pairSample = readRandomSample(random);
  const pair = constructible[sampleBinIndex(pairSample, constructible.length)];
  if (!pair) throw new RangeError(`No constructible pair at sample ${pairSample}`);
  return orientPair(pair, readRandomSample(random));
}
```

**Sample accounting.** Every path consumes exactly 3 samples: pure =
gate + pair + order; kind = gate + pair + order; fallback = gate + pair +
order. Fixtures depend on this staying true.

- [ ] **Step 7: Wire `App.tsx`**

Swap all three `generateEquation` call sites (lines 31, 37, 59).
`handleStart` and `handleRestart` pass the inventory they just built;
`handleNextRound` passes `state.inventory`, which is already final
(post-discard) at `feedback`. Add `state.inventory` to that callback's
dependency array.

```ts
const equation = generateKindEquation(dependencies.random, inventory, KIND_EQUATION_RATE);
```

Round 1 is unaffected in practice — a one-of-each starting hand builds every
equation — but the code path must still be correct rather than special-cased.

- [ ] **Step 8: Update the `App.test.tsx` fixture**

**One change, not a recomputed array.** Every equation in the file already
routes through the `equationSamples()` helper (line 20). Give it a leading
gate sample:

```ts
function equationSamples(left: number, right: number): [number, number, number] {
  // ...existing index lookup, unchanged...
  // 0.99 clears KIND_EQUATION_RATE, forcing the uniform draw so a test can
  // still name its equation by operands. Kind-bias behaviour is covered in
  // generators.test.ts instead.
  return [0.99, index / EQUATION_POOL.length, 0.25];
}
```

Nothing else in that file changes for this task. If `sequenceRandom` throws
"Random sequence exhausted", the sample accounting in Step 6 is wrong — fix
the generator, not the fixture.

- [ ] **Step 9: Verify**

```bash
npm test && npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 10: Commit**

```bash
git add src/game/selectors.ts src/game/selectors.test.ts src/game/generators.ts \
        src/game/generators.test.ts src/app/App.tsx src/app/App.test.tsx
git commit -m "feat(generators): bias a share of equations toward constructible products" -m "Task: T16"
```

**Acceptance criteria**

- `generateEquation` is behaviourally unchanged and its existing tests are
  unmodified.
- An empty or unhelpful hand never throws.
- Every draw path consumes exactly 3 random samples.
- `canConstruct` is multiset-correct.
- `balance.test.ts` (T15) still passes — the shipped rate stays under the
  cliff.
