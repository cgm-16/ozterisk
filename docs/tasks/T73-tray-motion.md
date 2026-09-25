---
reads:
  - src/components/TileInventory/TileInventory.tsx  # the FLIP, measured rather than computed
  - docs/design_handoff_m6_classic/README.md  # motion table: delays and durations
  - src/components/TileInventory/TileInventory.tsx
---

# T73 — Tray motion: seal, house seat, re-seat, new plugs

```yaml
task_id: T73
title: Tray motion: seal, house seat, re-seat, new plugs
milestone: M6b — Classic Rack and Motion
priority: P1
estimate: M
wave: W3
depends_on: [T72]
parallel_safe: false
paths:
  - src/components/TileInventory/
```

**Interfaces**

- No `reseatFrom` prop: the component already tracks its previous render, which
  holds the old capacity and tile order.

## Steps

- [ ] Failing tests first:
  - The socket at the live capacity, below the drawn capacity, plays `oz-seal` (well) and `oz-seal-rim`, and stays drawn until the round change.
  - The first Classic render plays `oz-seal` on cell 20 with a `240ms` positive delay (M6·0).
  - Going from drawn 16 to 15 puts `oz-reseat` with numeric `--fx`, `--fy`, `--fs` (`oldW/newW`) and `transform-origin: 0 0` on every tile.
  - The new plugs play `oz-seal` at `300 + 40·k ms`, `fill-mode: both`.
- [ ] Implement.

## Acceptance

- `npm test`, `npm run lint`.
