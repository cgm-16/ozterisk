---
reads:
  - docs/spec/product.md  # §1.4a
  - docs/spec/architecture.md  # §2.2, §2.3, Tuning surface
  - src/game/types.ts
  - src/game/selectors.ts
  - src/game/generators.ts
  - src/game/balance.ts
---

# T77 — Face tiles in the rules

```yaml
task_id: T77
title: Face tiles in the rules
milestone: M7 — Special Tiles
priority: P0
estimate: M
wave: W2
depends_on: [T76]
parallel_safe: false
paths:
  - src/game/
  - src/app/App.tsx
  - src/test/fixtures.ts
  - src/test/economy.ts
```

**Interfaces**

- `Tile` becomes a union, and `tileDigits(tile): readonly Digit[]` is the only
  way a caller asks what a tile can be.
- `answerMatches(tiles, product): boolean` decides between `SUBMIT_CORRECT` and
  `SUBMIT_INCORRECT` in App, and guards both actions in the reducer.
- `generateRewardTiles(count, random, idFactory, mode)`. It imports `FACE_RATE`
  itself (architecture.md § Tuning surface: a dial is never threaded through a
  call site; Ori, 26 Sep 2026). Endless takes no face-gate sample at all.

## Steps

- [ ] Write the failing tests first:
  - `canConstruct([nbr(3), odd], 34)` is true. This is the greedy counterexample.
  - `answerMatches([high, digit 3], 53)` is true and `answerMatches([odd, 3], 63)` is false.
  - The reducer accepts `SUBMIT_CORRECT` with `high` in a slot needing 5.
    `SUBMIT_INCORRECT` with `odd` for 6 records `submittedValue: null`.
  - `sortTiles` gives the rack order: digits, ✳, O, E, then ranges by their lowest digit.
  - In Classic, a random source below `FACE_RATE` gives only faces, and the kinds
    follow the 1/set-size weights. An Endless draw matches today's output exactly.
- [ ] Implement. `canConstruct` tries each pair of tiles (answers are at most 2
      digits).
- [ ] `balance.ts`: add `FACE_RATE = 0.08`, documented with its 5–10% range and
      the measured runs from `m7_sim_results.json` (the 8% figures are
      interpolated; see decisions.md § M7 research accepted).
- [ ] `CLASSIC_FLOOR` 6 → 5 is its own `tune(balance):` commit carrying nothing
      else (AGENTS.md §4.5), with the `b'` note updated. Run `balance.test.ts`
      right after it. No other dial changes.

## Acceptance

- `npx vitest run src/game`, `npm run typecheck`, `npm test`.
