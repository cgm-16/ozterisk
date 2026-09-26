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
- `generateRewardTiles(count, random, idFactory, faceRate)`. App passes
  `FACE_RATE` for Classic and 0 for Endless.

## Steps

- [ ] Write the failing tests first:
  - `canConstruct([nbr(3), odd], 34)` is true. This is the greedy counterexample.
  - `answerMatches([high, digit 3], 53)` is true and `answerMatches([odd, 3], 63)` is false.
  - The reducer accepts `SUBMIT_CORRECT` with `high` in a slot needing 5.
    `SUBMIT_INCORRECT` with `odd` for 6 records `submittedValue: null`.
  - `sortTiles` gives the rack order: digits, ✳, O, E, then ranges by their lowest digit.
  - A seeded draw with `faceRate` 1 gives only faces, and the kinds follow the
    1/set-size weights. A draw with `faceRate` 0 matches today's output exactly.
- [ ] Implement. `canConstruct` tries each pair of tiles (answers are at most 2
      digits).
- [ ] `balance.ts`: `FACE_RATE = 0.08`, documented with its 5–10% range, the
      sim table and `m7_sim_results.json`. `CLASSIC_FLOOR = 5`, with the `b'`
      note updated. No other dial changes.

## Acceptance

- `npx vitest run src/game`, `npm run typecheck`, `npm test`.
