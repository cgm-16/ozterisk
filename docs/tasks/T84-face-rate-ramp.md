---
reads:
  - docs/spec/product.md  # §1.2 rewards, §1.4a face tiles
  - docs/spec/architecture.md  # §2.3 generateRewardTiles
  - src/game/balance.ts
  - src/game/generators.ts
  - src/game/selectors.ts
---

# T84 — Face rate ramp

```yaml
task_id: T84
title: Face rate ramp
milestone: M7b — Face Rate Ramp
priority: P1
estimate: S
wave: W0
depends_on: []
parallel_safe: false
paths:
  - docs/spec/product.md
  - docs/spec/architecture.md
  - docs/design-system/decisions.md
  - docs/plan/roadmap.md
  - docs/tasks/
  - docs/journal/
  - README.md
  - src/game/
  - src/app/App.tsx
  - src/app/App.test.tsx
```

## Why

At a flat `FACE_RATE` of 0.08, a Classic run earns about four faces, and fewer
than one of them arrives once the rack is at ten sockets or fewer. Ori found
that too few for a game-changing boon.

## Rulings (Ori, 27 Sep 2026)

- The face rate ramps from 5% to 20% across a Classic run. The win rate rising
  about 9 points (simulated) is accepted.

## Steps

- [ ] Failing tests first:
  - `getClassicFaceRate` is `FACE_RATE_START` at submission 0 and
    `FACE_RATE_END` at the run's last submission, rising one equal step each
    submission and holding afterwards.
  - The same gate sample misses early and hits late.
  - The App's Classic reward samples still miss the gate.
- [ ] `balance.ts`: `FACE_RATE` becomes `FACE_RATE_START` and `FACE_RATE_END`,
      each with its economy effect.
- [ ] `selectors.ts`: `getClassicFaceRate(totalRounds)`.
- [ ] `generators.ts`: `generateRewardTiles` takes `totalRounds`.
- [ ] `App.tsx`: passes `state.totalRounds`.
- [ ] Update `product.md` §1.2, `architecture.md` §2.3, the README,
      `decisions.md`, the roadmap row and the journal.

## Acceptance

- `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`,
  `npm run test:e2e`.
- Simulated wins and faces per run recorded against the flat 8%.
