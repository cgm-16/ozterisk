---
reads:
  - docs/spec/product.md  # §1.3, §1.7, §1.7a, §1.8
  - docs/spec/architecture.md  # §2.3 interfaces, § Tuning surface
  - src/game/balance.ts  # the cliff reasoning the new dials sit beside
  - src/test/economy.ts  # the model the Classic invariant reuses
---

# T64 — Mode, calculated capacity, the seal and the win

```yaml
task_id: T64
title: Mode, calculated capacity, the seal and the win
milestone: M6a — Classic Core
priority: P0
estimate: M
wave: W1
depends_on: [T63]
parallel_safe: false
paths:
  - src/game/
  - src/test/fixtures.ts
  - src/components/GameScreen/GameScreen.tsx  # getOverflowCount(state) call site only
  - src/hooks/useGameKeyboard.ts  # getOverflowCount(state) call site only
  - src/app/App.tsx  # START_RUN carries mode: "endless" until T67
  - src/gallery/  # GameState literals gain mode, if typecheck names them
  - docs/spec/architecture.md  # §2.6 reproduces src/test/fixtures.ts
```

**Interfaces**

- Produces `GameMode`, `GameState.mode`, `START_RUN.mode`, `getCapacity(mode, totalRounds)`,
  `getOverflowCount(state)`, `isClassicWin(state)`, `createInitialInventory(idFactory, count?)`,
  and the dials `CLASSIC_START_CAPACITY`, `CLASSIC_FLOOR`, `CLASSIC_SEAL_EVERY`.
- `RESTART_RUN` keeps `state.mode`.

## Why

Classic's whole arc is one pure function: capacity descends from 20 by one every
second submission to a floor of 6. Deriving it from `totalRounds` (which already
counts submissions, correct or not) means the seal needs no code of its own and
no new state beyond `mode`.

## Steps

- [ ] Failing tests first, and record why each fails:
  - `getCapacity("endless", n) === 10`; `getCapacity("classic", 0) === 20`; `(…, 2) === 19`; `(…, 99) === CLASSIC_FLOOR`.
  - `createInitialInventory(ids, 20)` is two of each digit, sorted; at the default it is today's hand.
  - Classic at 20/20 tiles, `totalRounds: 1`, a correct 2-digit answer: phase `overflow`, `getOverflowCount === 2`.
  - The overflow test runs at `totalRounds: 1`, where checking before or after the increment differs (20 vs 19). It asserts phase and count only; the order is `T65`'s.
  - `SUBMIT_INCORRECT` in Classic never yields a positive overflow count.
  - `NEXT_ROUND` in Classic at the floor goes to `gameOver` even when the hand can answer, and `isClassicWin` is true; at the floor with an empty hand it is false; a hand too short goes to `gameOver` with `isClassicWin` false above the floor.
  - `balance.test.ts`: Classic's buildable rate at `CLASSIC_START_CAPACITY` is above the cliff and at `CLASSIC_FLOOR` below it minus `CLIFF_MARGIN`; `START > FLOOR >= 2`; `START >= 10`.
- [ ] Implement; add each dial with its economy effect (AGENTS.md §4.5). Existing dial values untouched.
- [ ] `isClassicWin` = phase `gameOver` and mode `classic` and capacity at the floor and at least one tile in hand; a Classic loss above the floor, or at it with an empty hand, reads false.
- [ ] `isDiscardReady` moves to `getOverflowCount(state)`; it survives until `T65`.
- [ ] Endless fixtures gain `mode: "endless"`, mirrored in `architecture.md` §2.6; no other change to existing tests.

## Acceptance

- `npx vitest run src/game` green; `npm run typecheck`; `npm test`.
