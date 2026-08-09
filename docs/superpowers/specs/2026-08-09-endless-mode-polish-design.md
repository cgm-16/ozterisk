# Endless mode polish — design

Date: 2026-08-09
Status: approved for planning
Supersedes: nothing.
Once implemented, amends `docs/spec/product.md` (§ Kind equation bias,
§ Discard confirmation, § Clear selection), `docs/spec/architecture.md`
(§ Tuning surface), and `AGENTS.md` (the `balance.ts` collaboration rule).
Planning rationale: `docs/plan/tuning-and-design-system.md`.
Decision record: `docs/journal/journal-2026-08-09.md`.

## 1. Context

`1-0` shipped 1.0 (`eb6cc67`). This is the first post-release build. Its
scope was chosen by modelling the existing economy rather than by ranking
the feature wishlist directly, because the model reordered the list.

### 1.1 The real failure mode

The loss condition is `inventory.length < getAnswerLength(equation)`, which
reads as "you run out of tiles". That is not what actually kills a run.

Reward tiles are drawn uniformly from `0–9`, so a hand drifts toward uniform
composition. For a hand of `n` tiles over 10 digits:

- `P(a given digit is absent) = (9/10)^n`
- `P(both digits of a 2-digit product present) = 1 − 2(0.9)^n + (0.8)^n`

Of the 45 unordered operand pairs, 13 produce a 1-digit product and 32
produce a 2-digit product. Weighting accordingly gives the **buildable
rate** `b` — the share of equations the player can physically spell from
their hand:

| Hand size | 10 | 13 | 14 | 20 |
|---|---|---|---|---|
| `b` | **48%** | 60% | 64% | 80% |

So at capacity 10, **roughly half of all equations cannot be answered**,
regardless of whether the player knows the multiplication. Those rounds
force a deliberate wrong answer. That, not arithmetic error, is the dominant
drain on a run.

> Note: no product of two operands in `1–9` has a repeated digit, so a
> perfect one-of-each starting hand builds 100% of equations. A run is the
> story of that hand degrading.

### 1.2 Why the economy has a cliff

Correct answers return `N + 1` tiles for `N` spent, so net **+1**. A forced
miss spends `N` and returns nothing: on the same 13/32 weighting, **−1.71**
on average. Per-round drift is therefore:

```
drift(b) = b·(+1) + (1 − b)·(−1.71)
```

which crosses zero at **b ≈ 63%**.

Because `INVENTORY_CAPACITY` is a hard ceiling that overflow pushes you back
down to, it acts as a *reflecting barrier*. That turns the threshold into a
cliff rather than a slope:

- `b < 63%` → negative drift → runs end in ~22 rounds (at today's
  `b = 48%`, drift is −0.41 tiles/round from a hand of 10)
- `b > 63%` → positive drift, pinned at the ceiling → **runs never end**

Every item on the wishlist raises `b`. Capacity 20 alone reaches 80% and
removes the loss condition entirely. "Kind" (constructibility-biased) random
at the originally proposed 30% reaches 63.6% — just over. They stack
multiplicatively, so shipping two of them blind would produce an unloseable
game.

The current balance is therefore **near an unchosen cliff edge, which is not
the same as balanced**. There is no dial controlling `b` today.

### 1.3 Resolution: fork into two modes

The wishlist contains two incompatible intentions — generosity (bigger
inventory, wildcards, friendlier equations) and tightening (streak pressure,
a definite end). One economy cannot serve both. They become two modes:

| | **Endless** | **Classic** |
|---|---|---|
| Goal | rounds survived | streak, depth reached |
| Capacity | fixed | shrinks on a schedule |
| Tiles | plain digits | plain + special (wildcard, odd/even, ranges) |
| Constraint | must stay under the cliff | absorbs any generosity |

Classic's descending ceiling collapses coverage on schedule (see the `b`
table above — capacity 6 gives `b ≈ 28%`), which converts an unpredictable
luck-cliff into a **scheduled climax**. That is why all the generous
features relocate there, and why Endless must budget carefully.

**This document covers Endless only.** Classic is the following build. The
UI work here (discard collapse, undo affordance, overflow keyboard access)
is shared infrastructure Classic inherits, and Endless changes exactly one
economy dial on an otherwise proven system.

## 2. Disposition of the wishlist

Recorded so nothing appears to have been dropped silently.

| Item | Disposition |
|---|---|
| 버리는 페이즈 없으면 자연스럽게 넘어가기 | **In** — §3.1 discard collapse |
| 되돌리기 / 취소 버튼 | **In** — §3.2 Clear + slot affordance |
| 편향된 랜덤 / 친절한 랜덤 | **In at 20%** — §3.3, the cliff-safe maximum |
| 인벤토리 확장 20개 | **→ Classic.** Classic *starts* at 20 and shrinks. Unusable in Endless (`b` = 80%) |
| 와일드카드 `*` | **→ Classic.** Shrinking capacity gives it escalating value: at capacity 6 a wildcard covers ten digits in one slot, so hoarding tile density becomes Classic's core verb |
| 특수 타일 (홀수/짝수/0-4/5-9) | **→ Classic.** One face-set mechanism yields all four |
| 억까 (deliberately hostile random) | **Cut.** The game has no channel to signal intent, so hostile generation is observationally identical to variance. It produces resentment, not difficulty |
| 유물 (relics) | **Cut from feature planning.** A meta-system needing run milestones to attach to; a separate project after Classic |
| Constructibility warning / Pass action | **Out.** The deliberate-wrong-answer exit lets the player choose *which* tiles to jettison, making it strategically richer than a Pass button. It is a manual discard that is already correctly priced. Revisit only on player feedback |

## 3. Design

### 3.1 Discard collapse

At capacity, a correct answer always overflows by exactly +1, so the
overflow phase fires on nearly every correct round with `requiredCount === 1`
— a forced choice costing three actions: mark tile, click Confirm, press
Enter to advance.

The frequency is not the problem and cannot be reduced (it is a direct
consequence of the `N + 1` reward). **The interaction cost is the problem.**

When `getOverflowCount(inventory) === 1`, one tap on a tile completes the
discard.

- `GameScreen.tsx` overflow branch dispatches `TOGGLE_DISCARD`, then
  `CONFIRM_DISCARD` when the overflow count is 1. Sequential `useReducer`
  dispatches apply in order, so `CONFIRM_DISCARD` observes the post-toggle
  state and `isDiscardReady` (`selectors.ts:32`) sees `1 === 1`.
- This stays a **UI** decision. The reducer already owns both validated
  transitions and gains no new action.
- `OverflowControls` hides Confirm at `requiredCount === 1` and keeps it for
  the multi-tile case, which only Classic will produce.
- `feedback` remains an explicit stop. **No auto-advance timers** — they
  conflict with `prefers-reduced-motion`, and the feedback panel carries the
  reward-tile information the player needs.

**Risk — React.StrictMode.** Commit `bd5d523` records this repo already
being bitten by StrictMode double-invocation, and two dispatches in one
handler is exactly that shape. Write the StrictMode test before the
implementation. **Escape hatch if it misbehaves:** a single reducer action
that marks and confirms atomically. It was considered and rejected here only
because the two-dispatch version is the smaller change; do not re-derive it.

**Overflow keyboard gap.** `useGameKeyboard.ts:53-60` handles only `Enter`
during overflow. There are no digit keys, so a keyboard-only player cannot
choose *which* tile to discard without using a mouse. Add digit handling
mirroring the `answering` branch (`useGameKeyboard.ts:26-35`): a digit key
marks the first matching tile, and at `requiredCount === 1` that single
keystroke completes the discard.

### 3.2 Clear / 취소

Per-tile undo already exists on both input paths — `Backspace`, and clicking
a filled slot returns that tile (`AnswerSlots.tsx:31`). Neither has an
on-screen affordance, so the gap is **discoverability**, not capability.

- New reducer action `CLEAR_SELECTION` returns all `selectedTiles` to
  inventory through the existing `sortTiles` (`factories.ts:26`). One atomic
  action rather than a UI loop over `RETURN_TILE`.
- A Clear button beside Submit in `GameScreen`, disabled when nothing is
  selected. `Escape` bound in `useGameKeyboard`.
- Visual affordance on filled slots (`AnswerSlots.module.css`) so
  click-to-return is discoverable.
- New keys in both `en` and `ko` (`src/i18n/messages.ts`).

### 3.3 Kind equation bias at 20%

With probability `KIND_EQUATION_RATE`, draw the next equation only from
pairs whose product is constructible from the current hand.

**The rate is the cliff-safe maximum.** `b' = p + (1 − p)·0.48`:

| `p` | 10% | **20%** | 30% | 40% |
|---|---|---|---|---|
| `b'` | 53% | **58%** | 63.6% ✗ | 69% ✗ |

Implemented **additively**, leaving the existing generator untouched:

- `selectors.ts` — `canConstruct(inventory, product): boolean`, a multiset
  check over the product's digits. Written multiset-correct even though no
  product in range has a repeated digit, because Classic's face-set tiles
  will need it.
- `generators.ts` — new `generateKindEquation(random, inventory, kindRate)`.
  Draw a gate sample; at `>= kindRate` delegate to the untouched
  `generateEquation(random)`. Otherwise sample uniformly from the
  constructible subset of `EQUATION_PAIRS`. **If that subset is empty, fall
  back to `generateEquation`**, or it throws.
- `balance.ts` (§3.5) — `KIND_EQUATION_RATE = 0.2`, one named dial so
  retuning is a one-line change.
- `App.tsx` — swap all three call sites. `START_RUN` and `RESTART_RUN` pass
  the freshly built inventory, available in the same handler and moot anyway
  since one-of-each builds every equation. `NEXT_ROUND` passes
  `state.inventory`, already final (post-discard) at `feedback`.

**Tuning risk.** `b ≈ 48%` assumes a *uniform* hand. A player discarding to
maximise digit coverage does better than uniform, so real baseline `b` is
somewhere above 48% and the margin to the cliff is thinner than the table
suggests. If real `b` is 0.55, then 20% bias yields 0.64 — over the cliff.
This is precisely why the rate is a single named constant.

### 3.4 Rounds survived as the headline stat

Endless is a survival mode, so rounds survived becomes the primary figure.
`totalRounds` is already tracked; this is presentation only.

- `GameHud` and `GameOverScreen` promote rounds, demote score.
- `services/sharing.ts` leads the share text with rounds.
- The terminal equation stays excluded from the count, per the 1.0 release
  smoke test.

### 3.5 Tuning surface

This build changes how the game feels, so it will be hand-tuned across many
iterations. The tuning infrastructure rides along because this build already
edits `constants.ts`, `App.tsx`, and the CSS modules, and already introduces
a new dial. Rationale and the full audit are in
`docs/plan/tuning-and-design-system.md`.

**`src/game/balance.ts` — split from `constants.ts` by safety.** A tuning
surface is only usable if every value in it is safe to change:

- `balance.ts` — **dials**: `INVENTORY_CAPACITY`, `REWARD_BONUS`,
  `KIND_EQUATION_RATE`.
- `constants.ts` — **domain definitions** whose change alters what the game
  *is*: `OPERAND_MIN`, `OPERAND_MAX`, and the digit-spread value currently
  private at `generators.ts:4`.

Named exports, matching the existing `constants.ts` style. Each dial
documents units, safe range, and economy effect so the file teaches what
moves what:

```ts
/**
 * Extra tiles returned above the number spent on a correct answer.
 * Net inventory change per correct answer is exactly +REWARD_BONUS.
 * Economy: drift = b·REWARD_BONUS − (1−b)·1.71  (§1.2)
 * Range: 1 = shipped. 0 removes overflow entirely, deleting the discard
 * mechanic. Above 1 makes runs unloseable at any realistic b.
 */
export const REWARD_BONUS = 1;
```

**Remove the `+1` duplication.** `App.tsx:48` generates the reward count and
`gameReducer.ts:62` validates it, both as the literal `selectedTiles.length
+ 1`. Changing one without the other makes the guard reject the action and
return unchanged state — every correct answer silently stops working, with
no error. Add `getRewardCount(spentCount: number): number` to `selectors.ts`
and use it at both sites so generator and validator cannot disagree. Both
call sites are already being edited by this build.

**Motion and hairline tokens.** `150ms ease`, `100ms ease`, and
`translateY(1px)` are duplicated across 7 CSS modules, so retuning press
feel means editing seven files. Add to `global.css` and substitute:

```css
--duration-fast: 100ms;    /* press / transform response */
--duration-base: 150ms;    /* color and border state changes */
--ease-standard: ease;
--press-offset: 1px;       /* :active translateY */
--border-hairline: 1px;    /* the repeated 1px solid border */
```

The `prefers-reduced-motion` block (`global.css:98-114`) overrides
`transition-duration` and `*:active { transform }` with `!important`, so
tokenizing the source values does not weaken it — verify explicitly.

**`balance.test.ts` — the economy model as an executable invariant.** This is
what stops later agent work from quietly breaking hand-tuned values.

- Model helper in `src/test/economy.ts` (test-only, so nothing ships):
  `projectBuildableRate(handSize)` implementing `1 − 2(0.9)ⁿ + (0.8)ⁿ`
  weighted 13/32, and `projectDrift(b)`.
- Assert drift at capacity stays negative with a documented margin: runs
  must remain finite.
- **The failure message must print** computed `b`, the cliff (0.631), and
  the margin. A bare assertion tells whoever tripped it nothing; the point is
  to explain *why* the economy broke.
- Analytic model assuming a uniform hand, not a simulation. No Monte Carlo —
  slow and flaky.

**`AGENTS.md` collaboration rule.** Agents may *add* dials to `balance.ts`
and must document each one's economy effect; agents must **not change the
value** of an existing dial without explicit instruction, since those are
hand-tuned. Tuning commits use `tune(balance):`; feature commits never carry
value changes. This separates the two kinds of edit by file and by commit so
git stops manufacturing conflicts between them.

## 4. Explicitly not doing

- **No mode select UI.** Only one mode ships in this build.
- **No pre-abstraction of `INVENTORY_CAPACITY`.** It stays a constant.
  `getCapacity(round)` is a ~10-line change when Classic lands; adding the
  seam now buys nothing and leaves dead flexibility in the codebase.

## 5. Testing

Gates: `npm run lint && npm run typecheck && npm test && npm run build`.

- `src/app/App.test.tsx` — the one fixture with real churn. A single
  `randomValues` array feeds `sequenceRandom(...)`, which throws "Random
  sequence exhausted" when short. The kind-bias gate adds one sample per
  equation, so the array needs recomputing.
- `src/game/generators.test.ts` — expected to stay **green untouched**; all
  11 references call `generateEquation` directly, which this build does not
  modify. New cases cover `generateKindEquation`, including the
  empty-subset fallback and that the gate sample is consumed exactly once.
- `src/game/selectors.test.ts` — `canConstruct`: buildable, missing one
  digit, missing both, 1-digit products, empty inventory.
- `src/game/gameReducer.test.ts` — does not use `sequenceRandom`, so only
  new `CLEAR_SELECTION` coverage (including that it is a no-op outside
  `answering`).
- `src/components/GameScreen/GameScreen.test.tsx` — **the StrictMode
  double-dispatch test first** (§3.1); one-tap discard at
  `requiredCount === 1`; Confirm still rendered for multi-tile; Clear
  enable/disable.
- New — overflow digit-key handling in `useGameKeyboard`.
- `src/game/balance.test.ts` — **confirm the guardrail fails** by temporarily
  setting `KIND_EQUATION_RATE` to 0.35, and that the message names `b`, the
  cliff, and the margin. A guardrail never observed failing is not known to
  work.
- The `getRewardCount` extraction is behaviour-preserving: the existing
  `gameReducer.test.ts` submission suite must stay **green untouched**. If it
  needs edits, the refactor changed semantics — stop and reassess.
- Motion tokens are a pure substitution with no visual diff. Check a press
  interaction in `npm run dev`, then re-check under OS "reduce motion" to
  confirm `global.css:98-114` still wins.

Manual check in `npm run dev`, since the goal is feel: play ~20 rounds and
confirm a correct answer costs *tap tile → next* rather than three actions;
Clear and `Escape` both work; overflow is fully keyboard-drivable; dead
rounds are noticeably rarer without runs feeling unloseable.
