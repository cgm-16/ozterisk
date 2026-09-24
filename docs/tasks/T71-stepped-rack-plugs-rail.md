---
reads:
  - src/components/TileInventory/rackTier.ts  # merged from the handoff TileInventory.jsx (pruned by T74)
  - docs/design_handoff_m6_classic/README.md
  - docs/spec/ui-i18n.md  # §1.12 Classic rack, plugs, rail, narrow cap
  - src/components/TileInventory/TileInventory.tsx
---

# T71 — Stepped rack, plugs and rail

```yaml
task_id: T71
title: Stepped rack, plugs and rail
milestone: M6b — Classic Rack and Motion
priority: P1
estimate: M
wave: W1
depends_on: [T70]
parallel_safe: false
paths:
  - src/components/TileInventory/
  - src/components/GameScreen/
```

**Interfaces**

- `rackTier(capacity, narrow)` — pure, exported from `TileInventory`; thresholds `15`/`10` beside it.
- `TileInventory` takes `stepped` (Classic), `drawnCapacity` = `getCapacity(mode, round − 1)` (size and footprint) and `capacity` = the live capacity (which tiles seat, which perch, which socket is closing). Passing only the drawn one would seat a tile in the socket that is sealing.
- Narrow is a CSS container query on the rack (a `min-width` query fires ~15px early, §1.12), so the component only names the size (`data-size`) and draws the fallback's whole rows. jsdom cannot evaluate it; `T74` owns the geometry. Built first with a `ResizeObserver`, which either painted a 7-column frame or raised a "ResizeObserver loop" error; see the journal.

## Why

Merge, don't replace: the handoff's `TileInventory.jsx` hardcodes English and
inline styles and lacks this component's departing-tile and i18n logic. Take its
`rackTier`, footprint and plug cells; keep everything else.

## Steps

- [ ] Failing tests first:
  - `rackTier(20)` → 7 cols, 44×55; `rackTier(15)` → 6 cols, 48×60; `rackTier(10)` → 5 cols, 64×80; `rackTier(20, true)` → 6 cols, 44×55.
  - Drawn at 19 in the 7-column size: 21 cells, 2 plugs, `aria-hidden`.
  - In Endless overflow the 11th tile renders in the rail, and the grid still has 10 cells.
- [ ] Narrow size: `2px` gap and `2px` padding so `6 × 44` fits `281px` (§1.12); record the arithmetic in a CSS comment.
- [ ] The rail: `56px`, `--border-accent` top rule, right-aligned, current tile size.

## Acceptance

- `npm test`, `npm run typecheck`, `npm run lint`.
