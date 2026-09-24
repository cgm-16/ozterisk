---
reads:
  - docs/spec/product.md  # §1.5 step 7, §1.7, §1.8
  - docs/design-system/decisions.md  # § The newest tile perches; § three taps
  - src/game/gameReducer.ts
---

# T65 — Shared overflow rules in the reducer

```yaml
task_id: T65
title: Shared overflow rules in the reducer
milestone: M6a — Classic Core
priority: P0
estimate: M
wave: W2
depends_on: [T64]
parallel_safe: false
paths:
  - src/game/gameReducer.ts
  - src/game/gameReducer.test.ts
  - src/game/selectors.ts
  - src/game/selectors.test.ts
  - src/game/types.ts
```

**Interfaces**

- Removes `CONFIRM_DISCARD` and `isDiscardReady`.
- Adds `RoundResult.discarded?: boolean`, cleared by `NEXT_ROUND` with the rest of `lastResult`.

## Why

Sorting the whole hand before the capacity check always sent the highest digits
to the rail, so the rim reject read as "the 9s get thrown out". And the Confirm
button exists only for a count Classic produces; generalising "the last mark
completes it" removes the only control Classic would add.

## Steps

- [ ] Failing tests first (both modes):
  - After a correct answer at 10 tiles, `inventory.slice(0, cap)` is sorted and `inventory.slice(cap)` is the newest rewards in arrival order.
  - With excess 1, `TOGGLE_DISCARD` applies the discard; with excess 2, the first mark only marks, the second applies both.
  - A rail tile that survives takes the index of the discarded seated tile; no other tile moves.
  - After the discard the phase is `feedback` with `lastResult.discarded === true`.
  - `NEXT_ROUND` sorts the whole inventory and clears `discarded`.
- [ ] Implement; delete the dead action and selector and their tests.

## Acceptance

- `npx vitest run src/game` green; `npm run typecheck`; `npm test`. `App.test.tsx`
  may need its discard steps updated here only if it dispatches `CONFIRM_DISCARD`
  directly; its UI flow is `T66`'s.
