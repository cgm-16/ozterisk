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
  - Removing Next Round means a missed `animationend` would freeze the run, so settle also on `animationcancel` — but only the cancel of the exit itself, since swapping a cell's `animation-name` cancels the animation it replaces (a reward tile's `oz-fire`).
  - Two tiles leaving together end in the same frame and React batches their handlers, so retiring must be a functional update. Found walking Classic in a real browser (`docs/journal/journal-2026-09-24.md`); the test ends both inside one `act`.
  - Not built: settling "when nothing departing animates" or "when the clone unmounts early". The first can only be caught with a timer, which the design rejects (a second source of truth for a duration the stylesheet owns); the rack never unmounts during feedback, so the second has no path to occur.
  - Rim-reject marks cells at `index >= capacity`, not index 10.
- [ ] GameScreen stops re-sorting the rack outside `answering`; the reducer's order is the rack's order.

## Acceptance

- `npm test`, `npm run typecheck`, `npm run lint`. Manual: an Endless overflow in the dev server advances by itself after the mark.
