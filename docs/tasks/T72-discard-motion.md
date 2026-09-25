---
reads:
  - src/styles/tokens/keyframes.css  # oz-slide-off, oz-perch-drop
  - src/components/TileInventory/TileInventory.tsx
---

# T72 — Discard motion: slide-off and perch-drop

```yaml
task_id: T72
title: Discard motion: slide-off and perch-drop
milestone: M6b — Classic Rack and Motion
priority: P1
estimate: S
wave: W2
depends_on: [T71]
parallel_safe: false
paths:
  - src/components/TileInventory/
```

## Steps

- [ ] Failing tests first:
  - The discarded tile plays `oz-slide-off`.
  - The surviving rail tile mounts in the freed socket with `oz-perch-drop` and numeric `--dx`/`--dy` (rail position minus socket position, per rack size).
  - `onSettled` fires on the perch-drop's `animationend` when a tile perched, and on the slide-off's otherwise; once either way.
- [ ] Implement.

## Acceptance

- `npm test`, `npm run lint`.
