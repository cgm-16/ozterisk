---
reads:
  - docs/spec/product.md  # §1.7, §1.10 feedback/overflow, §1.11
  - src/components/TileInventory/TileInventory.tsx  # departing tiles retire on animationend
  - src/components/GameScreen/GameScreen.tsx
---

# T66 — Overflow UI with no Confirm and no Next Round

```yaml
task_id: T66
title: Overflow UI with no Confirm and no Next Round
milestone: M6a — Classic Core
priority: P0
estimate: M
wave: W3
depends_on: [T65]
parallel_safe: false
paths:
  - src/components/GameScreen/
  - src/components/TileInventory/
  - src/components/OverflowControls/
  - src/hooks/useGameKeyboard.ts
  - src/app/App.test.tsx
```

**Interfaces**

- `TileInventory` gains `capacity: number` and `onSettled?: () => void`.
- `OverflowControls` already states the count only (`T65` removed Confirm with the action).

## Why

The reducer now finishes a discard on the last mark and leaves the round to
advance on its own. The UI has to stop rendering Confirm, stop offering Next
Round, and advance once the discard has visibly finished — on `animationend`,
never a timer (a timer duplicates a duration the stylesheet owns, and reduced
motion already fires `animationend` at `0.01ms`).

## Steps

- [ ] Failing tests first:
  - Overflow with 2 required: clicking the second tile removes both; after `fireEvent.animationEnd` on each departing tile, round 2 is showing and no Next Round was clicked.
  - `onSettled` fires exactly once per discard shape: rail tile discarded, one seated tile discarded, two seated.
  - `Enter` in feedback with `discarded` set dispatches nothing; Next Round is not rendered.
  - Removing Next Round means a missed `animationend` would freeze the run, so settle also on `animationcancel`, when nothing departing animates, and when the departing clone unmounts early — one test each.
  - Rim-reject marks cells at `index >= capacity`, not index 10.
- [ ] GameScreen stops re-sorting the rack outside `answering`; the reducer's order is the rack's order.

## Acceptance

- `npm test`, `npm run typecheck`, `npm run lint`. Manual: an Endless overflow in the dev server advances by itself after the mark.
