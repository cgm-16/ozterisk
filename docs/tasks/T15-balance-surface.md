---
reads:
  - docs/superpowers/specs/2026-08-09-endless-mode-polish-design.md  # §1.1-1.2 economy model, §3.5 tuning surface
  - docs/plan/tuning-and-design-system.md  # §2.2 audit, §4 why the invariant is load-bearing
  - docs/spec/architecture.md  # §2.5 reducer invariants
---

# T15 — Balance surface and economy invariant

```yaml
task_id: T15
title: Extract the tuning surface and guard it with an economy invariant
milestone: M4 — Endless Polish and Tuning Surface
priority: P0
estimate: M
wave: W0
depends_on: []
parallel_safe: true
paths:
  - src/game/balance.ts
  - src/game/balance.test.ts
  - src/game/constants.ts
  - src/game/selectors.ts
  - src/game/selectors.test.ts
  - src/game/generators.ts
  - src/game/gameReducer.ts
  - src/app/App.tsx
  - src/test/economy.ts
  - AGENTS.md
```

**Interfaces**

- Consumes: nothing.
- Produces:
  - `game/balance`: `INVENTORY_CAPACITY`, `REWARD_BONUS`,
    `KIND_EQUATION_RATE`
  - `game/constants`: `OPERAND_MIN`, `OPERAND_MAX`, `REWARD_DIGIT_COUNT`
  - `game/selectors`: `getRewardCount(spentCount: number): number`
  - `test/economy`: `projectBuildableRate(handSize: number): number`,
    `averageMissCost(): number`, `projectDrift(b: number): number`,
    `buildableRateCliff(): number`,
    `projectBiasedRate(baseRate: number, kindRate: number): number`

## Why

`App.tsx:48` generates the reward tile count and `gameReducer.ts:62`
validates it, both as the literal `state.selectedTiles.length + 1`. Change
one without the other and the guard rejects the action, returning unchanged
state — every correct answer silently stops working, with no error. This is
a live footgun and a tuning session is exactly what provokes it.

More broadly, the numbers that govern feel are the least accessible ones.
This task makes them a documented surface and guards the combinations that
would break a run.

- [ ] **Step 1: Create `src/game/balance.ts`**

Split from `constants.ts` by **safety**: dials here are safe to change,
domain definitions stay in `constants.ts`. Every dial documents units, safe
range, and economy effect — the file must teach what moves what.

```ts
/**
 * Tuning dials. Every value here is safe to change by hand; the economy
 * invariant in balance.test.ts guards the combinations that break a run.
 *
 * Domain definitions that change what the game *is* — operand range, digit
 * spread — live in constants.ts instead.
 */

/**
 * Tiles the inventory holds before overflow forces a discard.
 * Economy: raising this raises the buildable rate b. b(10) ~= 48%,
 * b(13) ~= 60%, b(14) ~= 64%. Drift crosses zero at b ~= 63%, so 13 is the
 * highest value that keeps runs finite without another counterweight.
 */
export const INVENTORY_CAPACITY = 10;

/**
 * Extra tiles returned above the number spent on a correct answer.
 * Net inventory change per correct answer is exactly +REWARD_BONUS.
 * Economy: drift = b*REWARD_BONUS - (1-b)*averageMissCost()
 * Range: 1 = shipped. 0 removes overflow entirely, deleting the discard
 * mechanic. Above 1 makes runs unloseable at any realistic b.
 */
export const REWARD_BONUS = 1;

/**
 * Share of equations drawn only from products the current hand can spell.
 * Economy: b' = KIND_EQUATION_RATE + (1 - KIND_EQUATION_RATE) * b
 * 0.2 -> 58%, safely under the 63% cliff. 0.3 -> 63.6%, over it.
 * The value most likely to need retuning after real play.
 */
export const KIND_EQUATION_RATE = 0.2;
```

- [ ] **Step 2: Move the constants**

`INVENTORY_CAPACITY` leaves `constants.ts` — it has exactly one importer
(`selectors.ts:2`), so update that single import. `REWARD_DIGIT_COUNT`
moves *into* `constants.ts` from its module-private home at
`generators.ts:4`, and `generators.ts` imports it.

```ts
// src/game/constants.ts
export const OPERAND_MIN = 1;
export const OPERAND_MAX = 9;

/** Digits 0-9 are the reward draw pool. A domain fact, not a dial. */
export const REWARD_DIGIT_COUNT = 10;
```

- [ ] **Step 3: Write the failing `getRewardCount` test**

Add to `src/game/selectors.test.ts`:

```ts
describe("getRewardCount", () => {
  it("returns one more tile than was spent", () => {
    expect(getRewardCount(1)).toBe(2);
    expect(getRewardCount(2)).toBe(3);
  });

  it("tracks REWARD_BONUS rather than a hardcoded increment", () => {
    expect(getRewardCount(2)).toBe(2 + REWARD_BONUS);
  });
});
```

- [ ] **Step 4: Verify it fails**

```bash
npm test -- src/game/selectors.test.ts
```

Expected: FAIL — `getRewardCount is not a function`.

- [ ] **Step 5: Implement `getRewardCount` and use it at both sites**

```ts
// src/game/selectors.ts
export function getRewardCount(spentCount: number): number {
  return spentCount + REWARD_BONUS;
}
```

Replace `state.selectedTiles.length + 1` at `App.tsx:48` with
`getRewardCount(state.selectedTiles.length)`, and the guard at
`gameReducer.ts:62` with
`action.rewardTiles.length !== getRewardCount(state.selectedTiles.length)`.

Behaviour-preserving. `gameReducer.test.ts`'s submission suite must stay
**green untouched** — if it needs edits, the refactor changed semantics.
Stop and reassess.

- [ ] **Step 6: Write the economy model**

Create `src/test/economy.ts`. Test-only, so nothing enters the production
bundle. Analytic, not Monte Carlo — deterministic and instant.

Occupancy math over the 45 pairs, with `P(digit absent) = (0.9)^n`:

- one specific digit present: `1 - (0.9)^n`
- two specific digits present: `1 - 2*(0.9)^n + (0.8)^n`

Derive the 13 one-digit / 32 two-digit split by iterating
`OPERAND_MIN..OPERAND_MAX`, not by hardcoding the counts.

```ts
export function projectBuildableRate(handSize: number): number {
  const { oneDigit, twoDigit } = pairsByAnswerLength();
  const total = oneDigit + twoDigit;
  const absent = ((REWARD_DIGIT_COUNT - 1) / REWARD_DIGIT_COUNT) ** handSize;
  const bothAbsent = ((REWARD_DIGIT_COUNT - 2) / REWARD_DIGIT_COUNT) ** handSize;
  return (
    (oneDigit / total) * (1 - absent) +
    (twoDigit / total) * (1 - 2 * absent + bothAbsent)
  );
}

/** Average tiles lost to one forced miss, weighted across the pair pool. */
export function averageMissCost(): number {
  const { oneDigit, twoDigit } = pairsByAnswerLength();
  const total = oneDigit + twoDigit;
  return (oneDigit / total) * 1 + (twoDigit / total) * 2;
}

/** Expected tiles gained per round. Negative means runs end. */
export function projectDrift(b: number): number {
  return b * REWARD_BONUS - (1 - b) * averageMissCost();
}

/** The buildable rate at which drift reaches zero. */
export function buildableRateCliff(): number {
  const loss = averageMissCost();
  return loss / (REWARD_BONUS + loss);
}

/** Effective buildable rate once the kind-equation bias is applied. */
export function projectBiasedRate(baseRate: number, kindRate: number): number {
  return kindRate + (1 - kindRate) * baseRate;
}
```

- [ ] **Step 7: Write the invariant test**

Create `src/game/balance.test.ts`. Two assertions, each with a failure
message that explains *why* the economy broke — a bare assertion failure
would tell whoever tripped it nothing.

```ts
// The model assumes a uniformly-composed hand. A player who discards to
// maximise digit coverage does better than uniform, so the true rate sits
// somewhat above the projection and the real margin is thinner than this.
const CLIFF_MARGIN = 0.02;

function report(): string {
  const base = projectBuildableRate(INVENTORY_CAPACITY);
  const biased = projectBiasedRate(base, KIND_EQUATION_RATE);
  const cliff = buildableRateCliff();
  return [
    `capacity           ${INVENTORY_CAPACITY}`,
    `reward bonus       +${REWARD_BONUS}`,
    `kind rate          ${KIND_EQUATION_RATE}`,
    `base buildable b   ${base.toFixed(4)}`,
    `biased buildable b ${biased.toFixed(4)}`,
    `cliff b*           ${cliff.toFixed(4)}`,
    `margin             ${(cliff - biased).toFixed(4)} (need > ${CLIFF_MARGIN})`,
    `drift/round        ${projectDrift(biased).toFixed(4)} (need < 0)`,
  ].join("\n");
}
```

Assert: (1) `projectDrift(biased) < 0` — runs must stay finite;
(2) `buildableRateCliff() - biased > CLIFF_MARGIN`.

Also pin the model itself, or a silent bug in it would weaken the guard
invisibly:

```ts
expect(projectBuildableRate(10)).toBeCloseTo(0.4797, 4);
expect(averageMissCost()).toBeCloseTo(1.7111, 4);
expect(buildableRateCliff()).toBeCloseTo(0.6311, 4);
```

- [ ] **Step 8: Verify the guardrail actually fails**

Temporarily set `KIND_EQUATION_RATE = 0.35` and run the suite. **Both**
invariant assertions must fail, printing biased `0.6618`, margin `-0.0307`,
drift `+0.0830`. Revert to `0.2` afterwards.

A guardrail never observed failing is not known to work. Do not skip this.

- [ ] **Step 9: Add the collaboration rule to `AGENTS.md`**

Near the §4.4 conventions:

> Agents may **add** dials to `src/game/balance.ts` and must document each
> one's economy effect. Agents must **not change the value** of an existing
> dial without explicit instruction — those are hand-tuned. Tuning commits
> use `tune(balance):`; feature commits never carry value changes.

- [ ] **Step 10: Verify**

```bash
npm test && npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 11: Commit**

```bash
git add src/game/balance.ts src/game/balance.test.ts src/game/constants.ts \
        src/game/selectors.ts src/game/selectors.test.ts src/game/generators.ts \
        src/game/gameReducer.ts src/app/App.tsx src/test/economy.ts AGENTS.md
git commit -m "feat(balance): extract tuning dials and guard the economy" -m "Task: T15"
```

**Acceptance criteria**

- Exactly one source of truth for the reward count; generator and validator
  cannot disagree.
- `balance.ts` contains only values safe to hand-tune, each documenting its
  economy effect.
- The invariant has been **observed failing** on a deliberately broken value
  and its message names `b`, the cliff, and the margin.
- `src/test/economy.ts` is imported only by tests; nothing new ships.
- `gameReducer.test.ts` is unmodified.
